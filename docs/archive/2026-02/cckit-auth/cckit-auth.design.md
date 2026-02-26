# cckit-auth Design Document

> **Summary**: GitHub OAuth + Supabase Auth 세션 관리 설계 — 미들웨어, 콜백 라우트, profiles 동기화, GlobalNav 인증 상태
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Status**: Draft
> **Planning Doc**: [cckit-auth.plan.md](../../01-plan/features/cckit-auth.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **쿠키 기반 SSR 세션**: `@supabase/ssr`을 사용해 Server Component에서 `auth.uid()`를 참조하여 RLS가 자동 적용되도록 한다
2. **단일 OAuth Provider**: GitHub만 지원하여 설정 복잡도를 최소화한다
3. **자동 profiles 동기화**: OAuth 콜백 시 `github_username`, `display_name`, `avatar_url`을 Supabase profiles 테이블에 Upsert한다
4. **미들웨어 세션 갱신**: `next/server` middleware로 모든 요청에서 만료 직전 세션을 자동 갱신한다
5. **GlobalNav 상태 반영**: Server Component에서 세션 상태를 읽어 로그인/로그아웃 UI를 서버 렌더링한다

### 1.2 Design Principles

- **Server-first auth check**: 인증 상태는 Server Component에서 확인 — 불필요한 client-side hydration 없음
- **Fail-safe session**: 세션 갱신 실패 시 로그아웃 처리 (무한 루프 방지)
- **Minimal scope**: GitHub OAuth scope는 `read:user user:email`만 요청

---

## 2. Architecture

### 2.1 Component Diagram

```
[Browser]
  │
  ├─ GET /auth/login
  │     → supabase.auth.signInWithOAuth({ provider: 'github' })
  │     → 302 GitHub OAuth 페이지
  │
  ├─ GET /auth/callback?code=...  (GitHub → 우리 앱 콜백)
  │     → exchangeCodeForSession(code)
  │     → profiles UPSERT (service_role)
  │     → 302 /
  │
  └─ 모든 요청
        → middleware.ts
              → supabase.auth.getUser()  (세션 유효성 확인)
              → 만료 직전이면 refreshSession()
              → 갱신된 쿠키를 응답 헤더에 세팅

[Server Components]
  └─ createServerClient(cookies()) → auth.getUser()
        → 세션 있으면 user 객체 반환
        → 없으면 null (로그인 버튼 표시)

[Supabase]
  ├─ Auth (GitHub OAuth Provider)
  └─ PostgreSQL
        └─ profiles 테이블 (auth.users와 1:1)
```

### 2.2 Data Flow

#### 로그인 플로우
```
1. 사용자 → "GitHub로 로그인" 클릭
2. GET /auth/login
3. supabase.auth.signInWithOAuth({
     provider: 'github',
     options: { redirectTo: `${NEXT_PUBLIC_BASE_URL}/auth/callback` }
   })
4. 302 → GitHub OAuth 인증 페이지
5. 사용자 승인
6. GitHub → GET /auth/callback?code=XXXXXXXX
7. supabase.auth.exchangeCodeForSession(code)
   → access_token, refresh_token 발급
   → sb-{project}-auth-token 쿠키 세팅
8. profiles UPSERT:
   INSERT INTO profiles (id, github_username, display_name, avatar_url)
   VALUES (auth.uid(), ...) ON CONFLICT (id) DO UPDATE ...
9. 302 → /
```

#### 세션 갱신 플로우 (미들웨어)
```
모든 요청 →
  middleware.ts:
    createServerClient(request, response) → auth.getUser()
    if (세션 만료 임박) → refreshSession()
    response.headers에 갱신된 쿠키 세팅
    → next()
```

#### 로그아웃 플로우
```
POST /auth/logout (form action)
  → supabase.auth.signOut()
  → 쿠키 삭제
  → 302 → /
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `middleware.ts` | `@supabase/ssr` createServerClient | 요청마다 세션 갱신 |
| `auth/callback/route.ts` | `@supabase/ssr` createServerClient, `SUPABASE_SERVICE_ROLE_KEY` | 코드 교환 + profiles upsert |
| `lib/supabase/server.ts` | `@supabase/ssr` createServerClient, `next/headers` cookies() | Server Component용 클라이언트 |
| `lib/supabase/client.ts` | `@supabase/ssr` createBrowserClient | Client Component용 클라이언트 |
| `GlobalNav` | `lib/supabase/server.ts` | 서버에서 세션 읽어 UI 분기 |

---

## 3. Data Model

### 3.1 profiles 테이블 (참조: supabase/schema.sql)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 TypeScript 타입

```typescript
// apps/web/src/lib/supabase/types.ts
export interface Profile {
  id: string;
  github_username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// 세션 유저 (Supabase Auth)
export type AuthUser = import('@supabase/supabase-js').User;
```

### 3.3 Entity Relationships

```
[auth.users] 1 ──── 1 [profiles]
  id (UUID)            id (FK → auth.users.id)
  email                github_username
  raw_user_meta_data   display_name
                       avatar_url
```

---

## 4. API Specification

### 4.1 Route List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/auth/login` | GitHub OAuth 시작 | 불필요 |
| GET | `/auth/callback` | OAuth 코드 교환 + 세션 생성 | 불필요 (code param) |
| POST | `/auth/logout` | 로그아웃 + 쿠키 삭제 | 세션 필요 |

### 4.2 Route Handler 상세

#### `GET /auth/login`

```typescript
// apps/web/src/app/auth/login/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* cookie handlers */ } }
  )

  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      scopes: 'read:user user:email',
    },
  })

  return NextResponse.redirect(data.url!)
}
```

#### `GET /auth/callback`

```typescript
// apps/web/src/app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    // 1. anon key 클라이언트로 코드 교환
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    // 2. service_role 클라이언트로 profiles upsert
    if (user) {
      const adminClient = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      await adminClient.from('profiles').upsert({
        id: user.id,
        github_username: user.user_metadata.user_name,
        display_name: user.user_metadata.full_name,
        avatar_url: user.user_metadata.avatar_url,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }
  }

  return NextResponse.redirect(new URL('/', request.url))
}
```

#### `POST /auth/logout`

```typescript
// apps/web/src/app/auth/logout/route.ts
export async function POST(request: Request) {
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', request.url))
}
```

---

## 5. UI/UX Design

### 5.1 GlobalNav 인증 상태 분기

```
┌─────────────────────────────────────────────────────┐
│  [CCKit 로고]   Explore   Submit   [GitHub로 로그인] │  ← 미로그인
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  [CCKit 로고]   Explore   Submit   [아바타] ▼       │  ← 로그인
│                                    └ 내 킷           │
│                                    └ 로그아웃        │
└─────────────────────────────────────────────────────┘
```

### 5.2 Component 설계

#### `GlobalNav` (Server Component)

```typescript
// apps/web/src/components/global-nav.tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function GlobalNav() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="...">
      {/* 로고, 링크 */}
      {user ? <UserMenu user={user} /> : <LoginButton />}
    </nav>
  )
}
```

#### `LoginButton` (Client Component — onClick 필요)

```typescript
// apps/web/src/components/login-button.tsx
'use client'

export function LoginButton() {
  return (
    <a href="/auth/login" className="...">
      GitHub로 로그인
    </a>
  )
}
```

#### `UserMenu` (Client Component — dropdown)

```typescript
// apps/web/src/components/user-menu.tsx
'use client'

export function UserMenu({ user }: { user: AuthUser }) {
  // 드롭다운 토글 상태
  return (
    <div>
      <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full" />
      {/* dropdown: 내 킷, 로그아웃 form */}
      <form action="/auth/logout" method="POST">
        <button type="submit">로그아웃</button>
      </form>
    </div>
  )
}
```

### 5.3 테마

- 로그인 버튼: `bg-gray-800 hover:bg-gray-700 text-white border border-gray-600`
- 아바타: `w-8 h-8 rounded-full ring-2 ring-blue-500`
- 드롭다운: `bg-gray-900 border border-gray-700 shadow-xl`

---

## 6. Error Handling

| 상황 | 처리 방식 |
|------|---------|
| OAuth callback `code` 없음 | 홈(`/`)으로 리다이렉트 |
| `exchangeCodeForSession` 실패 | 에러 로그 + 홈으로 리다이렉트 |
| profiles upsert 실패 | 로그만 (로그인 차단 안 함) |
| 세션 갱신 실패 (미들웨어) | 쿠키 삭제 + 다음 요청에서 재로그인 유도 |
| 인증 필요 페이지 미인증 접근 | 해당 페이지에서 개별 처리 (auth 미들웨어 리다이렉트 없음) |

---

## 7. Security Considerations

- [x] **CSRF**: 로그아웃은 POST form action 사용 (GET 방지)
- [x] **OAuth state**: Supabase Auth SDK가 state 파라미터 자동 관리
- [x] **쿠키**: `@supabase/ssr`이 HttpOnly + Secure + SameSite=Lax 설정
- [x] **service_role key**: `/auth/callback`에서만 서버 측 단독 사용, 절대 클라이언트 노출 금지
- [x] **최소 권한**: GitHub OAuth scope `read:user user:email`만 요청
- [x] **Redirect URL**: Supabase 대시보드에 허용 URL 화이트리스트 등록 (localhost:3000, cckit.dev)
- [x] **profiles RLS**: `auth.uid() = id` 조건으로 본인만 수정 가능

---

## 8. Implementation Guide

### 8.1 File Structure

```
apps/web/src/
├── app/
│   └── auth/
│       ├── login/
│       │   └── route.ts          # GET — OAuth 시작
│       ├── callback/
│       │   └── route.ts          # GET — 코드 교환 + profiles upsert
│       └── logout/
│           └── route.ts          # POST — 로그아웃
├── components/
│   ├── global-nav.tsx             # Server Component — 인증 상태 읽기
│   ├── login-button.tsx           # Client Component
│   └── user-menu.tsx              # Client Component — 드롭다운
├── lib/
│   └── supabase/
│       ├── server.ts              # createServerClient (cookies)
│       ├── client.ts              # createBrowserClient
│       └── types.ts               # Profile, AuthUser 타입
└── middleware.ts                  # 세션 갱신 미들웨어
```

### 8.2 Implementation Order

1. [ ] 환경변수 확인 (`.env.local` — SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, BASE_URL)
2. [ ] Supabase 대시보드: GitHub OAuth Provider 활성화 + Redirect URL 등록
3. [ ] `lib/supabase/server.ts` — `createServerClient` 헬퍼
4. [ ] `lib/supabase/client.ts` — `createBrowserClient` 헬퍼
5. [ ] `lib/supabase/types.ts` — `Profile`, `AuthUser` 타입
6. [ ] `middleware.ts` — 세션 갱신 미들웨어 (Supabase 공식 예제 기반)
7. [ ] `app/auth/login/route.ts` — OAuth 시작
8. [ ] `app/auth/callback/route.ts` — 코드 교환 + profiles upsert
9. [ ] `app/auth/logout/route.ts` — 로그아웃
10. [ ] `components/global-nav.tsx` — Server Component
11. [ ] `components/login-button.tsx` — Client Component
12. [ ] `components/user-menu.tsx` — Client Component

### 8.3 핵심 패키지

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.6.x",
    "@supabase/supabase-js": "^2.x"
  }
}
```

> `@supabase/ssr`은 이미 `cckit-setup`에서 설치됨 (`apps/web/package.json` 확인)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft — GitHub OAuth + Supabase SSR 인증 설계 | CCKit Team |
