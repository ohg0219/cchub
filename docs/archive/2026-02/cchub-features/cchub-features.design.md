# cchub-features Design Document

> **Summary**: 배포 전 미구현 기능 완성 — 로그인 UI, 킷 등록 페이지, GitHub repo 분석 API
>
> **Project**: CCHub
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Status**: Draft
> **Planning Doc**: [cchub-features.plan.md](../01-plan/features/cchub-features.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 비로그인 사용자가 GitHub OAuth로 로그인하는 **UI 진입점** 제공
- 로그인된 사용자가 GitHub repo URL 입력으로 킷을 등록하는 **submit 페이지** 구현
- submit 페이지가 GitHub Contents API를 통해 메타데이터를 자동 추출하는 **분석 API** 구현
- 기존 Server Component + Route Handler 패턴 유지
- i18n 하드코딩 없이 `ko.json` / `en.json` 키만 사용

### 1.2 Design Principles

- **재사용**: 기존 `LoginButton`, `createClient`, `KitDetail` 타입 최대한 활용
- **보안**: submit은 서버에서 세션 확인 후 미인증 시 리다이렉트, GitHub API SSRF 방지
- **점진적 향상**: GitHub URL 입력 → debounce → 자동 채우기 (실패해도 수동 입력 가능)

---

## 2. Architecture

### 2.1 추가되는 파일 구조

```
apps/web/src/
├── app/
│   ├── [locale]/
│   │   ├── auth/
│   │   │   └── login/
│   │   │       └── page.tsx          ← [NEW] 로그인 UI 페이지
│   │   └── submit/
│   │       └── page.tsx              ← [NEW] 킷 등록 페이지 (서버 래퍼)
│   └── api/
│       └── github/
│           └── route.ts              ← [NEW] GitHub repo 분석 API
├── components/
│   └── submit-form.tsx               ← [NEW] 킷 등록 폼 (Client Component)
└── messages/
    ├── ko.json                       ← [MOD] login/submit 키 추가
    └── en.json                       ← [MOD] login/submit 키 추가
```

### 2.2 데이터 흐름

```
[로그인 페이지]
브라우저 → GET /[locale]/auth/login
  → Server: getUser() → 이미 로그인 시 / 로 redirect
  → 미로그인: LoginButton 렌더링 (href="/auth/login" Route Handler)
  → 클릭: /auth/login Route → OAuth → /auth/callback → /

[submit 페이지]
브라우저 → GET /[locale]/submit
  → Server: getUser() → 미로그인 시 /[locale]/auth/login?next=/submit redirect
  → 로그인: SubmitForm 클라이언트 컴포넌트 렌더링

[GitHub 분석]
SubmitForm → debounce → GET /api/github?url={url}
  → route.ts: URL 검증 → GitHub Contents API
  → 응답: { name, description, hasKitYaml, skills, hooks, agents, readmeSummary }
  → 폼 자동 채우기

[킷 등록 제출]
SubmitForm → POST /api/kits (기존 라우트, 이미 구현됨)
  → 성공: redirect /[locale]/kit/[slug]
```

### 2.3 컴포넌트 의존성

| 컴포넌트/파일 | 의존 | 용도 |
|---|---|---|
| `[locale]/auth/login/page.tsx` | `LoginButton`, `createClient`, `next-intl` | 로그인 UI |
| `[locale]/submit/page.tsx` | `SubmitForm`, `createClient`, `next-intl` | submit 서버 래퍼 |
| `components/submit-form.tsx` | `next/navigation`, `next-intl` | 폼 로직 (Client) |
| `api/github/route.ts` | `next/server` | GitHub 분석 API |

---

## 3. 상세 설계

### 3.1 로그인 UI 페이지 — `[locale]/auth/login/page.tsx`

**역할**: 비로그인 사용자에게 GitHub OAuth 버튼을 표시.

```typescript
// Server Component
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // 이미 로그인된 경우 홈으로 리다이렉트
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/');

  // next 파라미터는 현재 OAuth flow에서 활용 (확장 가능)
  return (
    <main> ... LoginButton ... </main>
  );
}
```

**i18n 키**: `login.title`, `login.subtitle`, `login.button`, `login.terms`

---

### 3.2 submit 페이지 — `[locale]/submit/page.tsx`

**역할**: 로그인 확인 후 SubmitForm 렌더링.

```typescript
// Server Component
export default async function SubmitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/submit');

  return (
    <main>
      <SubmitForm userId={user.id} />
    </main>
  );
}
```

**i18n 키**: `submit.title`, `submit.subtitle`

---

### 3.3 SubmitForm — `components/submit-form.tsx`

**역할**: GitHub URL 입력 → 자동 채우기 → POST /api/kits 제출.

```typescript
'use client';
// 상태: githubUrl, name, description, category, tags, isAnalyzing, isSubmitting, error

// GitHub URL 입력 onChange → 500ms debounce → GET /api/github?url=...
// 성공 시 name/description 자동 채우기 (사용자 수정 가능)

// 제출: POST /api/kits { github_repo, name, description, category, tags, ... }
// 성공: router.push(`/kit/${slug}`)
```

**폼 필드**:
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `github_repo` | URL input | ✅ | GitHub repo URL |
| `name` | text input | ✅ | 킷 이름 (자동/수동) |
| `description` | textarea | ✅ | 설명 (자동/수동) |
| `category` | select | ✅ | backend/frontend/data/devops/mobile/fullstack |
| `tags` | text input | ❌ | 쉼표 구분 태그 |

**i18n 키**: `submit.form.*`, `submit.analyzing`, `submit.submitting`, `submit.error.*`

---

### 3.4 GitHub 분석 API — `api/github/route.ts`

**엔드포인트**: `GET /api/github?url={githubUrl}`

**처리 순서**:
1. URL 파라미터 검증 (없으면 400)
2. SSRF 방지: `https://github.com/` 으로 시작하는지 확인 (아니면 400)
3. `owner/repo` 파싱
4. GitHub Contents API 호출:
   - `GET https://api.github.com/repos/{owner}/{repo}/contents/` (루트 파일 목록)
   - `GET https://api.github.com/repos/{owner}/{repo}/contents/.claude` (있으면)
5. `kit.yaml` 존재 시 Base64 디코딩 + 파싱
6. `README.md` 존재 시 첫 단락 추출
7. `.claude/skills/`, `hooks/`, `agents/` 파일 목록 수집
8. 응답 반환

**요청 헤더**: `Authorization: Bearer ${GITHUB_TOKEN}` (환경변수, 없으면 미인증)

**응답 타입**:
```typescript
interface GitHubAnalysisResult {
  name: string;           // repo.name or kit.yaml.name
  description: string;   // repo.description or kit.yaml.description
  hasKitYaml: boolean;
  skills: string[];       // .claude/skills/ 파일 이름 목록
  hooks: string[];        // .claude/hooks/ 파일 이름 목록
  agents: string[];       // .claude/agents/ 파일 이름 목록
  readmeSummary: string;  // README.md 첫 단락 (없으면 '')
}
```

**에러 응답**:
| 상황 | Status | body |
|------|--------|------|
| url 파라미터 없음 | 400 | `{ error: 'url parameter required' }` |
| github.com 아닌 URL | 400 | `{ error: 'Only github.com URLs are allowed' }` |
| owner/repo 파싱 실패 | 400 | `{ error: 'Invalid GitHub URL format' }` |
| GitHub API 404 | 404 | `{ error: 'Repository not found' }` |
| 기타 | 500 | `{ error: 'Failed to analyze repository' }` |

---

### 3.5 POST /api/kits 확장

기존 `api/kits/route.ts`는 GET만 구현됨. **POST 핸들러 추가** 필요.

```typescript
// POST /api/kits
// Body: { github_repo, name, description, category, tags?, version? }
// Auth: supabase service role (kits 테이블 insert)
// 성공: 201 { slug, id }
// 실패: 400 / 409 / 500
```

**필드 자동 계산** (서버에서):
- `slug`: `name`을 kebab-case로 변환 + 중복 시 `-2`, `-3` suffix
- `author_id`: 세션 user.id
- `is_published`: `false` (관리자 승인 후 게시 — MVP는 자동 `true`)
- `skills_count`, `hooks_count`, `agents_count`: GitHub 분석 결과 또는 0
- `has_claude_md`: `.claude/CLAUDE.md` 또는 `CLAUDE.md` 존재 여부

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/github?url=` | GitHub repo 분석 | 불필요 |
| POST | `/api/kits` | 킷 등록 | 필요 (Supabase session) |

### 4.2 POST /api/kits

**Request Body**:
```json
{
  "github_repo": "https://github.com/owner/repo",
  "name": "My Kit",
  "description": "A starter kit for...",
  "category": "backend",
  "tags": ["spring", "java"],
  "github_branch": "main",
  "version": "1.0.0",
  "skills_count": 3,
  "hooks_count": 1,
  "agents_count": 2,
  "has_claude_md": true,
  "file_tree": null,
  "hooks_meta": []
}
```

**Response (201)**:
```json
{ "id": "uuid", "slug": "my-kit" }
```

**Error Responses**:
- `400`: 필수 필드 누락
- `401`: 미인증
- `409`: slug/github_repo 중복
- `500`: DB 오류

---

## 5. UI/UX Design

### 5.1 로그인 페이지 (`/[locale]/auth/login`)

```
┌─────────────────────────────────────┐
│  CCHub                     [GlobalNav] │
├─────────────────────────────────────┤
│                                     │
│         🔐 로그인                   │
│   CCHub에서 킷을 등록하려면         │
│   GitHub 계정이 필요합니다.         │
│                                     │
│   [ GitHub으로 로그인 ]            │
│                                     │
│   로그인하면 이용약관에 동의하는    │
│   것으로 간주됩니다.                │
│                                     │
└─────────────────────────────────────┘
```

### 5.2 submit 페이지 (`/[locale]/submit`)

```
┌─────────────────────────────────────┐
│  CCHub                     [GlobalNav] │
├─────────────────────────────────────┤
│  킷 등록                            │
│  GitHub repo URL을 입력하세요.      │
│                                     │
│  GitHub URL  [________________] 🔍  │
│                (분석 중... 스피너)  │
│                                     │
│  이름         [________________]    │
│  설명         [________________]    │
│               [________________]    │
│  카테고리     [backend       ▼]     │
│  태그         [spring, java     ]   │
│                                     │
│              [ 킷 등록하기 ]        │
└─────────────────────────────────────┘
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `LoginPage` | `app/[locale]/auth/login/page.tsx` | 로그인 UI (서버) |
| `SubmitPage` | `app/[locale]/submit/page.tsx` | 인증 확인 + 래퍼 (서버) |
| `SubmitForm` | `components/submit-form.tsx` | 폼 로직 (클라이언트) |

---

## 6. Error Handling

| 상황 | 처리 방법 |
|------|----------|
| submit 미로그인 접근 | 서버 redirect → `/auth/login?next=/submit` |
| GitHub URL 분석 실패 | 에러 메시지 표시, 수동 입력 허용 (폼 차단 안 함) |
| POST /api/kits 409 (중복) | "이미 등록된 repo입니다" 메시지 |
| POST /api/kits 실패 | "등록 실패, 다시 시도해주세요" 메시지 |
| GitHub API rate limit | 503 응답 + "잠시 후 다시 시도" 메시지 |

---

## 7. Security Considerations

- [x] submit 페이지: 서버 컴포넌트에서 `getUser()` 확인 후 미인증 redirect
- [x] `GET /api/github`: URL이 `https://github.com/`로 시작하는지 검증 (SSRF 방지)
- [x] POST /api/kits: Supabase RLS — `author_id = auth.uid()` 조건 (DB 레벨 보안)
- [x] tags 입력: XSS 방지 — 서버에서 string[] sanitize

---

## 8. TDD Test Scenarios

이 feature는 UI 중심으로 E2E 검증이 적합하므로 TDD 섹션 생략.
빌드 성공 + 수동 동작 확인으로 검증.

---

## 9. Implementation Guide

### 9.1 File Structure

```
추가/수정 파일 (총 7개):
  [NEW] apps/web/src/app/[locale]/auth/login/page.tsx
  [NEW] apps/web/src/app/[locale]/submit/page.tsx
  [NEW] apps/web/src/components/submit-form.tsx
  [NEW] apps/web/src/app/api/github/route.ts
  [MOD] apps/web/src/app/api/kits/route.ts  (POST 핸들러 추가)
  [MOD] apps/web/src/messages/ko.json  (login/submit 키)
  [MOD] apps/web/src/messages/en.json  (login/submit 키)
```

### 9.2 Implementation Order

1. [ ] i18n 키 추가 (`ko.json`, `en.json`) — login/submit 관련 메시지
2. [ ] `api/github/route.ts` — GitHub 분석 API (의존성 없음)
3. [ ] `api/kits/route.ts` — POST 핸들러 추가
4. [ ] `[locale]/auth/login/page.tsx` — 로그인 UI
5. [ ] `components/submit-form.tsx` — 폼 클라이언트 컴포넌트
6. [ ] `[locale]/submit/page.tsx` — submit 서버 래퍼
7. [ ] `pnpm --filter web build` 빌드 검증

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft | CCKit Team |
