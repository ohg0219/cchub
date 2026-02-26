# cchub-overhaul Design Document

> **Summary**: 로그인 제거 + GitHub 인덱스 기반 공개 스타터 킷 마켓플레이스로 전환
>
> **Project**: CCHub
> **Version**: 1.0.0
> **Author**: team
> **Date**: 2026-02-26
> **Status**: Draft
> **Planning Doc**: [cchub-overhaul.plan.md](../01-plan/features/cchub-overhaul.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **인증 완전 제거** — Supabase Auth, GitHub OAuth, 세션 쿠키 의존 코드 전부 삭제
2. **GitHub = 원본 보관소** — 파일 자체는 GitHub 레포에 있고, CCHub은 메타데이터 인덱스 + 발견 UI만 담당
3. **유명 기업 킷 자동 인덱싱** — 타겟 레포 목록(seeds/) → GitHub API 파싱 → Supabase upsert
4. **원클릭 설치** — 로그인 없이 즉시 `cchub install <owner/repo>` 명령어 제공

### 1.2 Design Principles

- **GitHub-first**: 마켓플레이스는 발견 레이어, 파일 원본은 GitHub
- **Zero auth**: 모든 browse/install은 완전 공개, 인증 코드 잔재 없음
- **Curated seeds**: 수동 큐레이션 URL 목록 + GitHub API 자동 파싱 조합
- **Minimal DB**: Supabase는 메타데이터(이름/설명/파일목록/설치수)만 저장

---

## 2. Architecture

### 2.1 전체 구조

```
┌──────────────────────────────────────────────────────┐
│  Famous Org GitHub Repos (원본 보관소)                 │
│  github.com/vercel/*, github.com/stripe/*, ...        │
└──────────────┬───────────────────────────────────────┘
               │ GitHub API (메타데이터 파싱)
               ▼
┌──────────────────────────────────────────────────────┐
│  scripts/seed-famous-kits.ts (관리자 스크립트)         │
│  - seeds/famous-repos.ts 목록 읽기                    │
│  - GitHub API → CLAUDE.md/skills/hooks/agents 탐색   │
│  - Supabase kits 테이블 upsert                        │
└──────────────┬───────────────────────────────────────┘
               │ Supabase DB (메타데이터 인덱스)
               ▼
┌──────────────────────────────────────────────────────┐
│  CCHub Web (발견 UI)                                  │
│  - /explore: 검색/필터/브라우징                        │
│  - /kit/[slug]: 상세 + CLI 명령어                      │
│  - /submit: GitHub URL 입력 → 분석 → 등록             │
└──────────────┬───────────────────────────────────────┘
               │ cchub install <owner/repo>
               ▼
┌──────────────────────────────────────────────────────┐
│  사용자 로컬 환경                                       │
│  - GitHub에서 직접 파일 다운로드 (CLI)                  │
│  - ~/.claude/ 또는 .claude/ 에 설치                    │
└──────────────────────────────────────────────────────┘
```

### 2.2 데이터 흐름

```
[Browse]  사용자 → /explore → GET /api/kits → Supabase → 킷 목록
[Detail]  사용자 → /kit/[slug] → GET /api/kits/[slug] → Supabase → 상세 + CLI 명령어
[Submit]  사용자 → GitHub URL 입력 → GET /api/github → GitHub API → 자동 분석 → POST /api/kits
[Install] CLI → cchub install <owner/repo> → GitHub raw 파일 다운로드 → 로컬 설치
[Seed]    관리자 → pnpm seed → GitHub API → Supabase upsert
```

### 2.3 제거되는 의존성

| 제거 대상 | 현재 위치 | 대체 |
|-----------|-----------|------|
| Supabase Auth | middleware.ts, global-nav, server.ts | 없음 (인증 불필요) |
| GitHub OAuth | auth/login, auth/callback | 없음 |
| LoginButton | components/login-button.tsx | 삭제 |
| UserMenu | components/user-menu.tsx | 삭제 |
| auth 라우트 | app/auth/*, app/[locale]/auth/* | 삭제 |
| submit auth guard | app/[locale]/submit/page.tsx | 삭제 (공개 submit) |
| API POST auth check | api/kits/route.ts | 삭제 (author_id nullable) |

---

## 3. Data Model

### 3.1 kits 테이블 변경사항

```sql
-- 기존: author_id NOT NULL (auth 필수)
-- 변경: author_id nullable (공개 submit 허용)
ALTER TABLE kits ALTER COLUMN author_id DROP NOT NULL;

-- RLS 정책 변경
-- 기존: SELECT requires authenticated
-- 변경: SELECT public (누구나 읽기 가능)
DROP POLICY IF EXISTS "kits_select" ON kits;
CREATE POLICY "kits_select_public" ON kits
  FOR SELECT USING (is_published = true);

-- INSERT: service_role only (서버사이드 only)
-- 기존 INSERT 정책 유지 또는 service_role key 사용
```

### 3.2 seeds 타겟 레포 타입

```typescript
// scripts/seeds/famous-repos.ts
interface SeedRepo {
  owner: string;         // "vercel"
  repo: string;          // "next.js"
  category: string;      // "frontend"
  tags: string[];        // ["nextjs", "react", "fullstack"]
  featured?: boolean;    // 메인 페이지 노출 여부
}
```

### 3.3 Kit 메타데이터 (기존 유지)

```typescript
interface Kit {
  id: string;
  slug: string;
  name: string;
  description: string;
  github_repo: string;   // "https://github.com/vercel/next.js"
  category: string;
  tags: string[];
  skills_count: number;
  hooks_count: number;
  agents_count: number;
  has_claude_md: boolean;
  install_count: number;
  is_published: boolean;
  author_id: string | null;  // nullable로 변경
  created_at: string;
}
```

---

## 4. API Specification

### 4.1 변경되는 엔드포인트

| Method | Path | 변경 내용 |
|--------|------|-----------|
| POST | /api/kits | auth 체크 제거, author_id nullable insert |
| GET | /api/github | 기존 유지 (submit 폼 미리보기용) |
| DELETE | /api/auth/* | 라우트 삭제 |
| DELETE | /auth/* | 라우트 삭제 |

### 4.2 POST /api/kits (변경 후)

auth 체크 제거, `author_id` 없이 insert.

```typescript
// Before
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// After: auth 체크 블록 전체 삭제
// insert 시 author_id 필드 제거
const { data, error } = await supabase
  .from('kits')
  .insert({
    github_repo, name, description, category,
    // author_id: user.id  ← 삭제
    is_published: false,   // 관리자 승인 후 공개 (스팸 방지)
    ...
  })
```

> **Note**: 공개 submit은 `is_published: false`로 저장 → 관리자가 수동 승인. 스팸 방지.

### 4.3 신규: GET /api/kits/seed (관리자용, 선택적)

직접 스크립트로 실행 권장. API 엔드포인트는 MVP에서 생략.

---

## 5. UI/UX Design

### 5.1 GlobalNav 변경

```
Before:
[CCHub] [Explore] [Submit]          [Login Button or UserMenu]

After:
[CCHub] [Explore] [Submit]          (우측 빈 공간 or GitHub 링크)
```

```typescript
// global-nav.tsx (변경 후)
export default async function GlobalNav() {
  // supabase.auth.getUser() 호출 제거
  // user 상태 제거
  const t = await getTranslations('nav');
  return (
    <nav ...>
      <div className="flex items-center gap-6">
        <Link href="/">CCHub</Link>
        <Link href="/explore">{t('explore')}</Link>
        <Link href="/submit">{t('submit')}</Link>
      </div>
      <div className="flex items-center gap-3">
        <a href="https://github.com/..." target="_blank"
           className="text-sm text-gray-400 hover:text-white">
          GitHub
        </a>
      </div>
    </nav>
  );
}
```

### 5.2 Submit 페이지 변경

```
Before:
- 로그인 필요 → 미로그인 시 /auth/login 리다이렉트
- SubmitForm에 userId prop 전달

After:
- 로그인 불필요, 바로 폼 렌더
- SubmitForm에서 userId prop 제거
- 제출 후 "검토 후 공개됩니다" 안내 문구 추가
```

### 5.3 킷 상세 페이지 — CLI 명령어 강화

```
┌─────────────────────────────────────────────────┐
│  🚀 Install this kit                             │
│                                                  │
│  $ cchub install vercel/next.js          [Copy]  │
│                                                  │
│  Or install specific files:                      │
│  $ cchub install vercel/next.js --skills-only    │
└─────────────────────────────────────────────────┘
```

### 5.4 삭제되는 페이지/컴포넌트

| 파일 | 처리 |
|------|------|
| `app/[locale]/auth/login/page.tsx` | 삭제 |
| `app/[locale]/auth/error/page.tsx` | 삭제 |
| `app/auth/login/route.ts` | 삭제 |
| `app/auth/callback/route.ts` | 삭제 |
| `app/auth/logout/route.ts` | 삭제 |
| `app/api/auth/callback/route.ts` | 삭제 |
| `components/login-button.tsx` | 삭제 |
| `components/user-menu.tsx` | 삭제 |

---

## 6. GitHub 인덱싱 설계

### 6.1 seeds/famous-repos.ts — 큐레이션 목록

```typescript
// scripts/seeds/famous-repos.ts
export const FAMOUS_REPOS: SeedRepo[] = [
  // Anthropic
  { owner: 'anthropics', repo: 'claude-code', category: 'ai', tags: ['claude', 'ai-agent'], featured: true },

  // Vercel
  { owner: 'vercel', repo: 'next.js', category: 'frontend', tags: ['nextjs', 'react'], featured: true },
  { owner: 'vercel', repo: 'ai', category: 'ai', tags: ['ai', 'streaming', 'sdk'] },

  // Stripe
  { owner: 'stripe', repo: 'stripe-node', category: 'backend', tags: ['payments', 'api'] },

  // Supabase
  { owner: 'supabase', repo: 'supabase', category: 'backend', tags: ['database', 'auth', 'realtime'] },

  // Prisma
  { owner: 'prisma', repo: 'prisma', category: 'backend', tags: ['orm', 'database', 'typescript'] },

  // shadcn
  { owner: 'shadcn-ui', repo: 'ui', category: 'frontend', tags: ['ui', 'components', 'tailwind'], featured: true },

  // T3 Stack
  { owner: 't3-oss', repo: 'create-t3-app', category: 'fullstack', tags: ['nextjs', 'trpc', 'prisma'] },

  // Linear
  { owner: 'linear', repo: 'linear', category: 'productivity', tags: ['project-management', 'api'] },

  // Resend
  { owner: 'resend', repo: 'resend-node', category: 'backend', tags: ['email', 'api'] },

  // Upstash
  { owner: 'upstash', repo: 'ratelimit', category: 'backend', tags: ['redis', 'ratelimit'] },
];
```

### 6.2 seed 스크립트 로직

```typescript
// scripts/seed-famous-kits.ts
async function seedKit(repo: SeedRepo) {
  const url = `https://github.com/${repo.owner}/${repo.repo}`;

  // 1. /api/github 동일 로직으로 파싱
  const analysis = await analyzeGitHubRepo(repo.owner, repo.repo);

  // 2. partial kit 허용: CLAUDE.md 없어도 skills/hooks/agents 있으면 OK
  const hasContent = analysis.hasKitYaml ||
    analysis.skills.length > 0 ||
    analysis.hooks.length > 0 ||
    analysis.agents.length > 0;

  if (!hasContent) {
    console.log(`⚠️  Skip ${url}: no .claude/ content found`);
    return;
  }

  // 3. Supabase upsert (github_repo 기준 중복 방지)
  const { error } = await supabase
    .from('kits')
    .upsert({
      github_repo: url,
      name: analysis.name,
      description: analysis.description || analysis.readmeSummary,
      category: repo.category,
      tags: repo.tags,
      skills_count: analysis.skills.length,
      hooks_count: analysis.hooks.length,
      agents_count: analysis.agents.length,
      has_claude_md: analysis.hasKitYaml,
      is_published: true,   // 큐레이션 킷은 바로 공개
      author_id: null,
      slug: toSlug(`${repo.owner}-${repo.repo}`),
      install_count: 0,
    }, { onConflict: 'github_repo' });

  if (error) console.error(`✗ ${url}:`, error.message);
  else console.log(`✓ Seeded: ${url}`);
}
```

### 6.3 실행 방법

```bash
# package.json scripts 추가
"seed": "tsx scripts/seed-famous-kits.ts"

# 실행
GITHUB_TOKEN=ghp_xxx pnpm seed
```

---

## 7. middleware.ts 변경

```typescript
// Before: Supabase 세션 갱신 포함
import { createServerClient } from '@supabase/ssr';
// ... createServerClient + auth.getUser() 호출

// After: next-intl only (Supabase 코드 전체 제거)
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

> **Note**: matcher에서 `auth` 제외 패턴 삭제 (auth 라우트 자체가 없어지므로)

---

## 8. 오류 처리

| 상황 | 처리 방식 |
|------|-----------|
| GitHub API rate limit | `GITHUB_TOKEN` 환경변수로 인증 요청 (5000req/h), 없으면 60req/h |
| 레포에 .claude/ 없음 | partial kit 허용 (skills/hooks/agents 중 하나라도 있으면 등록) |
| 레포 not found (404) | submit 폼에서 "레포지토리를 찾을 수 없습니다" 표시 |
| Supabase insert 실패 | 409 Conflict → "이미 등록된 레포" 안내 |
| 공개 submit 스팸 | is_published=false로 저장, 관리자 수동 승인 |

---

## 9. 구현 가이드

### 9.1 파일 변경 목록

**삭제:**
```
apps/web/src/app/auth/                    ← 디렉토리 전체
apps/web/src/app/api/auth/               ← 디렉토리 전체
apps/web/src/app/[locale]/auth/          ← 디렉토리 전체
apps/web/src/components/login-button.tsx
apps/web/src/components/user-menu.tsx
```

**수정:**
```
apps/web/src/middleware.ts               ← Supabase 코드 제거, intl only
apps/web/src/components/global-nav.tsx  ← auth import/user state/LoginButton/UserMenu 제거
apps/web/src/app/[locale]/submit/page.tsx ← auth guard 제거, userId prop 제거
apps/web/src/components/submit-form.tsx ← userId prop 제거
apps/web/src/app/api/kits/route.ts      ← POST auth 체크 제거, is_published=false
```

**신규:**
```
scripts/seeds/famous-repos.ts           ← 타겟 레포 큐레이션 목록
scripts/seed-famous-kits.ts             ← 시드 실행 스크립트
```

### 9.2 구현 순서

1. [ ] **auth 파일 삭제** — app/auth/*, app/[locale]/auth/*, login-button, user-menu
2. [ ] **middleware.ts 정리** — Supabase 코드 제거, intl only
3. [ ] **global-nav.tsx 정리** — auth import 제거, 심플 네비로 교체
4. [ ] **submit/page.tsx 정리** — auth guard 제거, SubmitForm userId prop 제거
5. [ ] **submit-form.tsx 정리** — userId prop 제거 (이미 void처리 되어 있으나 prop 자체 제거)
6. [ ] **api/kits/route.ts 정리** — POST auth 체크 제거, is_published 기본값 false
7. [ ] **seeds 스크립트 작성** — famous-repos.ts + seed-famous-kits.ts
8. [ ] **빌드 검증** — pnpm build TypeScript 에러 0 확인
9. [ ] **시드 실행** — GITHUB_TOKEN 설정 후 pnpm seed

### 9.3 Supabase 대시보드 작업 (별도)

```sql
-- 1. author_id nullable
ALTER TABLE kits ALTER COLUMN author_id DROP NOT NULL;

-- 2. public read RLS
DROP POLICY IF EXISTS "kits_select_authenticated" ON kits;
CREATE POLICY "kits_public_read" ON kits
  FOR SELECT USING (is_published = true);

-- 3. anon insert (공개 submit용) or service_role only
-- MVP: service_role key로만 insert (RLS bypass)
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft | team |
