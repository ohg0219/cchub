# cckit-setup Design Document

> **Summary**: pnpm Monorepo + Turborepo + Next.js 15 + Supabase SSR + GitHub OAuth + 공유 패키지 세부 설계
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Status**: Draft
> **Planning Doc**: [cckit-setup.plan.md](../01-plan/features/cckit-setup.plan.md)
> **Parent Design**: [cckit-mvp.design.md](cckit-mvp.design.md)

---

## 1. Overview

### 1.1 Design Goals

1. **패키지 간 타입 단일 원천**: `packages/shared`의 타입을 web/cli 양쪽이 import — 런타임 불일치 원천 차단
2. **SSR-safe 인증**: `@supabase/ssr`의 쿠키 기반 세션으로 Server Component에서도 인증 상태 접근 가능
3. **미들웨어 단순화**: next-intl 미들웨어와 Supabase 세션 갱신을 하나의 `middleware.ts`에서 체이닝
4. **빌드 캐시**: Turborepo 파이프라인으로 `build` → `^build` 의존 순서 보장 + 원격 캐시 준비

### 1.2 Design Principles

- **최소한의 초기 코드**: 각 앱은 빌드만 되면 OK. 실제 기능은 후속 sub-feature에서
- **환경변수 명시적 분리**: `NEXT_PUBLIC_*`는 클라이언트, 나머지는 서버 전용 — 혼용 금지
- **대시보드 우선 DB 관리**: Supabase CLI 사용 안 함, 모든 스키마 변경은 대시보드 SQL Editor

---

## 2. Architecture

### 2.1 패키지 의존 그래프

```
┌─────────────────────────────────────────┐
│           packages/shared               │
│  types/kit.ts  types/api.ts             │
│  validators/kit-yaml.ts (zod)           │
└───────────────┬─────────────────────────┘
                │ import
       ┌────────┴────────┐
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  apps/web   │   │  apps/cli   │
│ Next.js 15  │   │ Commander   │
│ @supabase   │   │    (골격)   │
│ next-intl   │   │             │
└─────────────┘   └─────────────┘
```

### 2.2 Supabase 세션 흐름 (SSR)

```
Browser → Request
    │
    ▼
middleware.ts
    ├── [1] next-intl: locale 감지 → Accept-Language → URL 리다이렉트
    └── [2] Supabase: createServerClient(cookies) → getUser() → 세션 만료 시 refresh
    │
    ▼
Server Component
    └── createServerClient(cookies) → 인증된 사용자 정보 접근
    │
    ▼
Route Handler (/api/*)
    └── createServerClient(cookies) → 인증 확인 후 DB 쿼리
```

### 2.3 GitHub OAuth 콜백 흐름

```
[1] User → /auth/login (버튼 클릭)
[2] → supabase.auth.signInWithOAuth({ provider: 'github', redirectTo: '/auth/callback' })
[3] → GitHub OAuth 동의 화면
[4] → /auth/callback?code=xxx
[5] → Route Handler: supabase.auth.exchangeCodeForSession(code)
[6] → Supabase Auth: GitHub API로 user 정보 조회
[7] → profiles 테이블 upsert (github_username, avatar_url)
[8] → redirect('/')
```

### 2.4 Turborepo 파이프라인

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],   // 의존 패키지 먼저 빌드
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

## 3. 파일별 상세 설계

### 3.1 루트 설정 파일

#### `package.json` (루트)
```json
{
  "name": "cckit",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  },
  "devDependencies": {
    "turbo": "latest",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

#### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev":   { "cache": false, "persistent": true },
    "lint":  { "dependsOn": ["^build"] }
  }
}
```

---

### 3.2 `packages/shared`

#### `package.json`
```json
{
  "name": "@cckit/shared",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./validators": "./src/validators/index.ts"
  },
  "dependencies": {
    "zod": "^3.22.0"
  }
}
```

> 빌드 없이 TypeScript 소스 직접 참조 (`"main": "./src/index.ts"`).
> web/cli의 `tsconfig.json`에 `paths`로 alias 지정.

#### `src/types/kit.ts` — 핵심 타입 (cckit-mvp.design.md § 3.1 참조)

```typescript
export type KitCategory = 'backend' | 'frontend' | 'data' | 'devops' | 'mobile' | 'fullstack';
export type AgentType = 'claude-code' | 'cursor' | 'copilot' | 'windsurf' | 'cline';

export interface KitComponents {
  skills: number;
  hooks: number;
  agents: number;
  claude_md: boolean;
}

export interface KitYaml {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  language?: string[];
  category?: KitCategory;
  tags?: string[];
  compatible_agents?: AgentType[];
  requirements?: Record<string, string>;
  components?: KitComponents;
  install?: {
    target?: {
      skills?: string;
      hooks?: string;
      agents?: string;
      claude_md?: string;
    };
  };
}

export interface KitListItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: KitCategory;
  tags: string[];
  compatible_agents: AgentType[];
  skills_count: number;
  hooks_count: number;
  agents_count: number;
  has_claude_md: boolean;
  install_count: number;
  star_count: number;
  version: string;
  author: {
    github_username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  created_at: string;
  updated_at: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileTreeNode[];
}

export interface HookMeta {
  type: 'PreToolUse' | 'PostToolUse' | 'Notification';
  events: string[];
  description: string;
  matcher?: string[];
  command: string;
}

export interface KitDetail extends KitListItem {
  github_repo: string;
  github_branch: string;
  kit_yaml: KitYaml;
  file_tree: FileTreeNode[];
  hooks_meta: HookMeta[];
  readme_html?: string;
  reviews: {
    total: number;
    average: number;
    items: KitReview[];
  };
}

export interface KitReview {
  id: string;
  rating: number;
  comment: string | null;
  user: { github_username: string; avatar_url: string | null };
  created_at: string;
}
```

#### `src/types/api.ts`

```typescript
export type ApiSuccess<T> = { data: T; error: null };
export type ApiError = { data: null; error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface KitsListQuery {
  q?: string;
  category?: import('./kit').KitCategory;
  has_hooks?: boolean;
  has_agents?: boolean;
  sort?: 'popular' | 'latest' | 'installs';
  page?: number;
  limit?: number;
}

export interface KitsListResponse {
  items: import('./kit').KitListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

#### `src/validators/kit-yaml.ts` — zod 스키마

```typescript
import { z } from 'zod';

const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const semverRegex = /^\d+\.\d+\.\d+$/;

export const KitYamlSchema = z.object({
  name: z.string().regex(slugRegex, 'slug 형식이어야 합니다 (소문자, 하이픈, 숫자)'),
  version: z.string().regex(semverRegex, '시맨틱 버전이어야 합니다 (x.y.z)'),
  description: z.string().max(200, '200자 이내여야 합니다'),
  author: z.string().min(1),
  license: z.string().min(1),
  language: z.array(z.string()).optional(),
  category: z.enum(['backend', 'frontend', 'data', 'devops', 'mobile', 'fullstack']).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  compatible_agents: z.array(
    z.enum(['claude-code', 'cursor', 'copilot', 'windsurf', 'cline'])
  ).optional(),
  requirements: z.record(z.string()).optional(),
  components: z.object({
    skills: z.number().int().min(0),
    hooks: z.number().int().min(0),
    agents: z.number().int().min(0),
    claude_md: z.boolean(),
  }).optional(),
  install: z.object({
    target: z.object({
      skills: z.string().optional(),
      hooks: z.string().optional(),
      agents: z.string().optional(),
      claude_md: z.string().optional(),
    }).optional(),
  }).optional(),
});

export type KitYamlInput = z.input<typeof KitYamlSchema>;
export function validateKitYaml(input: unknown) {
  return KitYamlSchema.safeParse(input);
}
```

---

### 3.3 `apps/web` — Supabase 클라이언트

#### `src/lib/supabase/client.ts` — 브라우저용
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

#### `src/lib/supabase/server.ts` — 서버 컴포넌트 / Route Handler용
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

#### `src/lib/supabase/service.ts` — service_role 전용 (API Route에서만)
```typescript
import { createClient } from '@supabase/supabase-js';

// 주의: 서버 사이드 전용. 클라이언트 코드에서 절대 사용 금지
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

---

### 3.4 `apps/web` — 미들웨어

#### `src/middleware.ts`
```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
});

export async function middleware(request: NextRequest) {
  // 1. next-intl locale 처리
  const intlResponse = intlMiddleware(request);

  // 2. Supabase 세션 갱신 (쿠키 업데이트)
  const response = intlResponse ?? NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  await supabase.auth.getUser(); // 세션 갱신 트리거

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

---

### 3.5 `apps/web` — GitHub OAuth 콜백

#### `src/app/api/auth/callback/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  // profiles upsert
  const { user } = data;
  await supabase.from('profiles').upsert({
    id: user.id,
    github_username: user.user_metadata.user_name,
    display_name: user.user_metadata.full_name ?? null,
    avatar_url: user.user_metadata.avatar_url ?? null,
  }, { onConflict: 'id' });

  return NextResponse.redirect(`${origin}${next}`);
}
```

---

### 3.6 Supabase 스키마 (`supabase/schema.sql`)

MVP Design § 3.2의 전체 스키마 사용. 실행 순서:

1. **profiles 테이블** + RLS
2. **kits 테이블** + 인덱스 + RLS
3. **kit_reviews 테이블** + RLS
4. **kit_installs 테이블** + RLS
5. `updated_at` 자동 갱신 트리거 함수 + 각 테이블에 적용

#### `updated_at` 트리거
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_kits_updated_at
  BEFORE UPDATE ON kits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

### 3.7 환경변수 명세

#### `.env.local.example`
```bash
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # 서버 전용, 절대 클라이언트 노출 금지

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> Supabase 대시보드 → Settings → API에서 URL/Key 확인.
> GitHub OAuth redirectTo는 `NEXT_PUBLIC_BASE_URL/api/auth/callback`으로 설정.

---

### 3.8 `apps/cli` — 초기 골격

#### `src/index.ts`
```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('cckit')
  .description('Claude Code Starter Kit 설치 도구')
  .version('0.1.0');

// 명령어는 cckit-cli sub-feature에서 구현
program
  .command('install <slug>')
  .description('스타터 킷 설치')
  .action(() => { console.log('Coming soon...'); });

program.parse(process.argv);
```

#### `package.json` (cli)
```json
{
  "name": "@cckit/cli",
  "version": "0.1.0",
  "bin": { "cckit": "./dist/index.js" },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "@cckit/shared": "workspace:*",
    "typescript": "^5.0.0"
  }
}
```

---

## 4. API Specification

이 단계에서 구현하는 Route Handler는 OAuth 콜백 하나뿐.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/auth/callback` | GitHub OAuth code → 세션 교환 + profiles upsert | 불필요 (OAuth flow) |

상세는 § 3.5 참조.

---

## 5. UI/UX Design

초기 세팅 단계에서 구현하는 UI는 최소한. 실제 페이지는 cckit-landing에서.

### 5.1 뼈대 레이아웃 (`app/[locale]/layout.tsx`)

```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function RootLayout({ children, params }) {
  const messages = await getMessages();
  return (
    <html lang={params.locale}>
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 5.2 임시 홈 페이지 (`app/[locale]/page.tsx`)

```tsx
export default function HomePage() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <p className="text-2xl font-bold">CCKit — 준비 중</p>
    </main>
  );
}
```

---

## 6. Error Handling

| 상황 | 처리 방법 |
|------|-----------|
| OAuth code 없음 | `/auth/error`로 리다이렉트 |
| `exchangeCodeForSession` 실패 | `/auth/error`로 리다이렉트 |
| `profiles` upsert 실패 | 로그만 기록, 로그인 자체는 성공으로 처리 (비치명적) |
| 환경변수 누락 | Next.js 빌드 시 `!`(non-null assertion) 타입 에러로 조기 발견 |

---

## 7. Security Considerations

- [x] `SUPABASE_SERVICE_ROLE_KEY`는 `NEXT_PUBLIC_` 접두사 없음 → 서버 전용 보장
- [x] `middleware.ts`에서 매 요청마다 `getUser()` 호출 → 세션 위변조 서버에서 검증
- [x] OAuth 콜백의 `next` 파라미터는 동일 origin 내 경로만 허용 (절대 URL redirect 차단)
- [x] `.env.local`은 `.gitignore`에 포함 확인
- [x] Supabase RLS: 모든 테이블 활성화, 기본 정책은 deny-all

---

## 8. Implementation Guide

### 8.1 File Structure (이 단계에서 생성되는 파일)

```
cckit/
├── package.json                          ← 신규
├── pnpm-workspace.yaml                   ← 신규
├── turbo.json                            ← 신규
├── .gitignore                            ← 신규
├── .env.local.example                    ← 신규
├── .env.local                            ← 신규 (git 제외)
│
├── packages/
│   └── shared/
│       ├── package.json                  ← 신규
│       ├── tsconfig.json                 ← 신규
│       └── src/
│           ├── index.ts                  ← 신규
│           ├── types/
│           │   ├── index.ts              ← 신규
│           │   ├── kit.ts                ← 신규
│           │   └── api.ts                ← 신규
│           └── validators/
│               ├── index.ts              ← 신규
│               └── kit-yaml.ts           ← 신규
│
├── apps/
│   ├── web/
│   │   ├── package.json                  ← 신규
│   │   ├── next.config.ts                ← 신규
│   │   ├── tailwind.config.ts            ← 신규
│   │   ├── tsconfig.json                 ← 신규
│   │   └── src/
│   │       ├── middleware.ts             ← 신규
│   │       ├── app/
│   │       │   ├── [locale]/
│   │       │   │   ├── layout.tsx        ← 신규
│   │       │   │   └── page.tsx          ← 신규 (임시)
│   │       │   └── api/
│   │       │       └── auth/
│   │       │           └── callback/
│   │       │               └── route.ts  ← 신규
│   │       ├── lib/supabase/
│   │       │   ├── client.ts             ← 신규
│   │       │   ├── server.ts             ← 신규
│   │       │   └── service.ts            ← 신규
│   │       └── messages/
│   │           └── ko.json               ← 신규 (빈 객체)
│   └── cli/
│       ├── package.json                  ← 신규
│       ├── tsconfig.json                 ← 신규
│       └── src/
│           └── index.ts                  ← 신규 (골격)
│
└── supabase/
    └── schema.sql                        ← 신규 (참조용)
```

### 8.2 Implementation Order

**Step 1: 루트 모노레포 설정** (의존성 없음, 먼저)
1. [ ] `package.json` (루트) — workspaces + 스크립트
2. [ ] `pnpm-workspace.yaml`
3. [ ] `turbo.json` — 파이프라인 정의
4. [ ] `.gitignore` — `node_modules`, `.env.local`, `.next`, `dist` 포함

**Step 2: `packages/shared`** (web/cli보다 먼저 — 의존 대상)
5. [ ] `package.json` + `tsconfig.json`
6. [ ] `src/types/kit.ts` — KitYaml, KitListItem, KitDetail, FileTreeNode, HookMeta, KitReview
7. [ ] `src/types/api.ts` — ApiResponse, KitsListQuery, KitsListResponse
8. [ ] `src/validators/kit-yaml.ts` — zod KitYamlSchema
9. [ ] `src/index.ts` — 전체 export

**Step 3: `apps/web` 초기화**
10. [ ] `pnpm create next-app apps/web --typescript --tailwind --app --no-src-dir` 후 `src/` 구조로 정리
    - 또는 수동으로 `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json` 작성
11. [ ] `tsconfig.json`에 `@cckit/shared` paths alias 추가:
    ```json
    { "paths": { "@cckit/shared": ["../../packages/shared/src"] } }
    ```
12. [ ] `src/lib/supabase/client.ts`, `server.ts`, `service.ts` 작성
13. [ ] `src/middleware.ts` — next-intl + supabase 체이닝
14. [ ] `src/app/[locale]/layout.tsx` — NextIntlClientProvider 래핑
15. [ ] `src/app/[locale]/page.tsx` — 임시 "준비 중" 페이지
16. [ ] `src/app/api/auth/callback/route.ts` — OAuth 콜백
17. [ ] `src/messages/ko.json` — 빈 객체 `{}`

**Step 4: `apps/cli` 골격**
18. [ ] `package.json` + `tsconfig.json`
19. [ ] `src/index.ts` — Commander.js 빈 프로그램

**Step 5: Supabase 설정** (코드 외 작업)
20. [ ] `supabase/schema.sql` 작성 (cckit-mvp.design.md § 3.2 전체 스키마)
21. [ ] Supabase 대시보드 SQL Editor → schema.sql 실행
22. [ ] Supabase 대시보드 → Authentication → Providers → GitHub 활성화
    - GitHub OAuth App 생성 (callback URL: `https://xxxx.supabase.co/auth/v1/callback`)
23. [ ] `.env.local` 작성 + `.env.local.example` 작성

**Step 6: 빌드 검증**
24. [ ] `pnpm install` 전체 성공
25. [ ] `pnpm --filter web build` — TypeScript 타입 에러 0
26. [ ] `pnpm --filter cli build` — 컴파일 성공
27. [ ] `pnpm --filter web dev` → localhost:3000 브라우저 확인
28. [ ] GitHub OAuth 로그인 테스트 → `profiles` 테이블 레코드 생성 확인

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft — 모노레포 초기 세팅 전체 설계 | CCKit Team |
