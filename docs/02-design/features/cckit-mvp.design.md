# cckit-mvp Design Document

> **Summary**: CCKit MVP — 웹사이트(Next.js 15) + CLI(Commander.js) + Supabase 백엔드 전체 설계
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Status**: Draft
> **Planning Doc**: [cckit-mvp.plan.md](../01-plan/features/cckit-mvp.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **모노레포 기반 단일 진실 원천**: pnpm workspace + Turborepo로 web/cli/shared 패키지 간 타입을 공유하고 빌드 캐싱
2. **서버 우선 렌더링**: Next.js 15 App Router Server Components로 첫 LCP < 3초 달성
3. **제로 런타임 스타일링**: Tailwind CSS 4 utility-first로 인라인 스타일 없이 반응형 다크 테마 구현
4. **RLS 기반 데이터 보안**: Supabase Row Level Security로 API 레이어 없이 DB 수준 접근 제어
5. **단순한 CLI UX**: `npx cckit install <slug>` 한 줄로 파일 배치 + settings.json 병합 완료

### 1.2 Design Principles

- **Server-first**: 데이터 패칭은 Server Component에서. 상태가 필요한 UI만 Client Component
- **Type-safety across layers**: `packages/shared`의 타입을 web/cli 모두 import, 타입 불일치 컴파일 단계에서 차단
- **Progressive enhancement**: JS 없이도 탐색/검색 기본 기능 동작 (form action 기반)
- **Fail-safe install**: CLI 설치 중 실패 시 이미 복사된 파일 롤백, settings.json 백업 복구

---

## 2. Architecture

### 2.1 Component Diagram

```
┌──────────────────────────────────────────────────────────┐
│                       Browser                            │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │  Landing /  │  │  Explore /   │  │  Kit Detail   │   │
│  │  (Server)   │  │  (Server)    │  │  (Server)     │   │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘   │
└─────────┼────────────────┼──────────────────┼───────────┘
          │                │                  │
          ▼                ▼                  ▼
┌──────────────────────────────────────────────────────────┐
│                  Next.js 15 App Router                   │
│  ┌──────────────────┐   ┌──────────────────────────────┐ │
│  │  Server Actions  │   │     Route Handlers (API)     │ │
│  │  (form submit)   │   │  /api/kits  /api/kits/[slug] │ │
│  └──────────────────┘   │  /api/kits/[slug]/install    │ │
│                          │  /api/github/analyze         │ │
│                          └──────────────┬───────────────┘ │
└─────────────────────────────────────────┼────────────────┘
                                          │
          ┌───────────────────────────────┤
          ▼                               ▼
┌─────────────────┐            ┌──────────────────────┐
│  Supabase Auth  │            │   Supabase PostgreSQL │
│  (GitHub OAuth) │            │   kits, profiles,     │
│                 │            │   kit_reviews,        │
└─────────────────┘            │   kit_installs        │
                               └──────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                    npx cckit (CLI)                       │
│  install → GET /api/kits/[slug] → GitHub Raw Download   │
│         → 파일 배치 → POST /api/kits/[slug]/install      │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

#### 킷 탐색 흐름 (웹)
```
User → /explore?q=spring&category=backend
  → Server Component → supabase.server.ts → kits 테이블 FTS 쿼리
  → KitCard[] 렌더링 → HTML 응답
```

#### CLI 설치 흐름
```
npx cckit install spring-boot-enterprise
  → GET https://cckit.dev/api/kits/spring-boot-enterprise
  → 응답: { github_repo, file_tree, kit_yaml }
  → file_tree 순회 → GitHub Raw Content URL 생성
  → 병렬 파일 다운로드 (최대 5개 동시)
  → 로컬 파일 배치 (skills/, agents/, CLAUDE.md)
  → hooks/ 파싱 → settings.json 딥 병합
  → POST https://cckit.dev/api/kits/spring-boot-enterprise/install
```

#### GitHub OAuth 흐름
```
User → /auth/login → Supabase signInWithOAuth(github)
  → GitHub OAuth 콜백 → /auth/callback
  → Supabase 세션 생성 → profiles 테이블 upsert
  → / 리다이렉트
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| web/app pages | packages/shared types | Kit, ApiResponse 타입 공유 |
| web/lib/supabase | @supabase/ssr | 서버/클라이언트 쿠키 세션 관리 |
| web/api routes | packages/shared validators | kit.yaml 유효성 검사 |
| cli/commands/install | packages/shared types | KitDetail, FileTree 타입 |
| cli/lib/installer | node:fs, node:path | 파일 배치 및 settings.json 병합 |

---

## 3. Data Model

### 3.1 TypeScript 타입 정의 (`packages/shared/src/types/kit.ts`)

```typescript
// ─── Core Types ───

export type KitCategory =
  | 'backend'
  | 'frontend'
  | 'data'
  | 'devops'
  | 'mobile'
  | 'fullstack';

export type AgentType =
  | 'claude-code'
  | 'cursor'
  | 'copilot'
  | 'windsurf'
  | 'cline';

export interface KitComponents {
  skills: number;
  hooks: number;
  agents: number;
  claude_md: boolean;
}

export interface KitInstallTarget {
  skills: string;   // 기본: ".claude/skills/"
  hooks: string;    // 기본: ".claude/settings.json"
  agents: string;   // 기본: ".claude/agents/"
  claude_md: string; // 기본: "./CLAUDE.md"
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
  install?: { target?: Partial<KitInstallTarget> };
}

// ─── API Response Types ───

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

// ─── API Request/Response ───

export interface KitsListQuery {
  q?: string;
  category?: KitCategory;
  has_hooks?: boolean;
  has_agents?: boolean;
  sort?: 'popular' | 'latest' | 'installs';
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  data: T;
  error: null;
} | {
  data: null;
  error: { code: string; message: string };
}
```

### 3.2 DB 스키마 (Supabase, `supabase/schema.sql`)

```sql
-- profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- kits
CREATE TABLE kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL
    CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  name TEXT NOT NULL,
  description TEXT NOT NULL CHECK (length(description) <= 200),
  author_id UUID REFERENCES profiles(id) NOT NULL,
  github_repo TEXT NOT NULL,
  github_branch TEXT DEFAULT 'main',
  version TEXT NOT NULL CHECK (version ~ '^\d+\.\d+\.\d+$'),
  license TEXT,
  category TEXT NOT NULL CHECK (
    category IN ('backend','frontend','data','devops','mobile','fullstack')
  ),
  languages TEXT[] DEFAULT '{ko}',
  tags TEXT[] DEFAULT '{}' CHECK (array_length(tags, 1) <= 10),
  compatible_agents TEXT[] DEFAULT '{claude-code}',
  skills_count INTEGER DEFAULT 0,
  hooks_count INTEGER DEFAULT 0,
  agents_count INTEGER DEFAULT 0,
  has_claude_md BOOLEAN DEFAULT FALSE,
  install_count INTEGER DEFAULT 0,
  star_count INTEGER DEFAULT 0,
  kit_yaml JSONB,
  file_tree JSONB,
  hooks_meta JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kits_category ON kits(category) WHERE is_published;
CREATE INDEX idx_kits_tags ON kits USING GIN(tags) WHERE is_published;
CREATE INDEX idx_kits_fts ON kits USING GIN(
  to_tsvector('simple', name || ' ' || description || ' ' || array_to_string(tags, ' '))
) WHERE is_published;

-- kit_reviews
CREATE TABLE kit_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES kits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT CHECK (length(comment) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kit_id, user_id)
);

-- kit_installs (트래킹, 개인정보 없음)
CREATE TABLE kit_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES kits(id) ON DELETE CASCADE NOT NULL,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  cli_version TEXT,
  agent_type TEXT DEFAULT 'claude-code'
);
```

### 3.3 Entity Relationships

```
[auth.users] 1 ──── 1 [profiles]
                         │
                         │ 1
                         │
                         N
                      [kits] 1 ──── N [kit_reviews]
                         │
                         │ 1
                         │
                         N
                    [kit_installs]
```

### 3.4 RLS 정책

```sql
-- profiles: 모두 읽기, 본인만 수정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- kits: 공개 킷 읽기, 저자만 수정/삭제
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kits_read" ON kits FOR SELECT USING (is_published = true);
CREATE POLICY "kits_insert" ON kits FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "kits_update" ON kits FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "kits_delete" ON kits FOR DELETE USING (auth.uid() = author_id);

-- kit_installs: 서비스 역할만 쓰기, 집계만 읽기
ALTER TABLE kit_installs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "installs_service_insert" ON kit_installs FOR INSERT
  WITH CHECK (true); -- API Route에서 service_role key 사용
```

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/kits` | 킷 목록 (필터, 정렬, 페이지네이션) | 불필요 |
| GET | `/api/kits/[slug]` | 킷 상세 (리뷰, 파일 트리 포함) | 불필요 |
| POST | `/api/kits` | 킷 등록 | GitHub OAuth 필요 |
| PUT | `/api/kits/[slug]` | 킷 수정 | 저자만 |
| DELETE | `/api/kits/[slug]` | 킷 삭제 | 저자만 |
| POST | `/api/kits/[slug]/install` | 설치 수 트래킹 | 불필요 (CLI 전용) |
| GET | `/api/search` | 풀텍스트 검색 | 불필요 |
| POST | `/api/github/analyze` | GitHub repo 분석 | GitHub OAuth 필요 |

### 4.2 Detailed Specification

#### `GET /api/kits`

**Query Parameters:**
```
q?: string               — 검색어 (FTS)
category?: KitCategory   — 카테고리 필터
has_hooks?: boolean      — Hooks 포함 킷만
has_agents?: boolean     — Agents 포함 킷만
sort?: popular|latest|installs  — 정렬 (기본: popular)
page?: number            — 페이지 (기본: 1)
limit?: number           — 페이지당 수 (기본: 20, 최대: 50)
```

**Response (200):**
```json
{
  "data": {
    "items": [KitListItem],
    "total": 42,
    "page": 1,
    "limit": 20,
    "hasMore": true
  },
  "error": null
}
```

#### `GET /api/kits/[slug]`

**Response (200):**
```json
{
  "data": KitDetail,
  "error": null
}
```

**Error (404):**
```json
{
  "data": null,
  "error": { "code": "KIT_NOT_FOUND", "message": "킷을 찾을 수 없습니다." }
}
```

#### `POST /api/kits/[slug]/install`

**Request Body:**
```json
{
  "cli_version": "1.0.0",
  "agent_type": "claude-code"
}
```

**Response (200):**
```json
{
  "data": { "install_count": 128 },
  "error": null
}
```

> `kit_installs` INSERT + `kits.install_count` 증가는 Supabase service_role key로 처리.

#### `POST /api/github/analyze`

**Request Body:**
```json
{
  "github_repo": "hayden-cckit/spring-boot-enterprise"
}
```

**Response (200):**
```json
{
  "data": {
    "kit_yaml": KitYaml,
    "file_tree": FileTreeNode[],
    "hooks_meta": HookMeta[],
    "skills_count": 5,
    "hooks_count": 7,
    "agents_count": 2,
    "has_claude_md": true
  },
  "error": null
}
```

---

## 5. UI/UX Design

### 5.1 레이아웃 구조

```
┌────────────────────────────────────┐
│  GlobalNav (다크, sticky)           │  ← 공통 레이아웃
│  로고 | Explore | Submit | 로그인   │
├────────────────────────────────────┤
│                                    │
│         Page Content               │
│                                    │
├────────────────────────────────────┤
│  Footer (링크, 저작권)              │
└────────────────────────────────────┘
```

### 5.2 페이지별 레이아웃

#### 랜딩 페이지 (`/`)
```
┌────────────────────────────────────┐
│  Hero                              │
│  "Claude Code 인프라를 한 번에"    │
│  [npx cckit install ...] 복사 블록  │
│  [킷 탐색하기] [내 킷 등록하기]    │
├────────────────────────────────────┤
│  Stats (킷 수 / Skills+Hooks 수 / 설치 수) │
├────────────────────────────────────┤
│  인기 카테고리 태그 클라우드        │
├────────────────────────────────────┤
│  인기 킷 그리드 (3열)              │
│  [KitCard] [KitCard] [KitCard]     │
└────────────────────────────────────┘
```

#### 킷 탐색 (`/explore`)
```
┌──────────────────┬─────────────────┐
│  사이드바 필터   │  킷 그리드      │
│  ─ 카테고리      │  SearchBar      │
│  ─ 구성 (체크)   │  정렬 드롭다운  │
│  ─ 에이전트      │  [KitCard×N]    │
│                  │  Pagination     │
└──────────────────┴─────────────────┘
```

#### 킷 상세 (`/kit/[slug]`)
```
┌────────────────────────┬───────────┐
│  메인 (2/3)            │  사이드바  │
│  킷 헤더 (아이콘+이름)  │  설치 수  │
│  CLI 설치 블록          │  별점     │
│  설명                  │  구성 수  │
│  FileTree              │  태그     │
│  HookDiagram           │  추천 킷  │
│  README                │          │
└────────────────────────┴───────────┘
```

### 5.3 Component List

| Component | Path | Responsibility |
|-----------|------|----------------|
| `GlobalNav` | `components/global-nav.tsx` | 상단 네비게이션, 인증 상태 |
| `KitCard` | `components/kit-card.tsx` | 킷 목록 카드 (아이콘, 이름, 배지, 통계) |
| `KitDetail` | `components/kit-detail.tsx` | 킷 상세 메인 영역 |
| `SearchBar` | `components/search-bar.tsx` | 검색 입력 + 실시간 URL 업데이트 |
| `CategoryFilter` | `components/category-filter.tsx` | 카테고리/구성 필터 체크박스 |
| `FileTree` | `components/file-tree.tsx` | 파일 트리 뷰어 (타입별 아이콘) |
| `HookDiagram` | `components/hook-diagram.tsx` | Hook 파이프라인 시각화 |
| `CliBlock` | `components/cli-block.tsx` | 명령어 표시 + 클립보드 복사 |
| `KitBadges` | `components/kit-badges.tsx` | Skills/Hooks/Agents 배지 |

### 5.4 테마 & 스타일

- **배경**: `bg-gray-950` (기본), `bg-gray-900` (카드)
- **강조색**: `text-blue-400` (링크), `bg-blue-600 hover:bg-blue-500` (CTA)
- **코드 블록**: `bg-gray-800 font-mono text-sm`
- **배지**: Skills=`bg-purple-900/50 text-purple-300`, Hooks=`bg-orange-900/50 text-orange-300`, Agents=`bg-green-900/50 text-green-300`

---

## 6. CLI 내부 설계

### 6.1 install 명령어 플로우

```typescript
// apps/cli/src/commands/install.ts
async function installKit(slug: string, opts: InstallOptions) {
  // 1. API에서 킷 정보 가져오기
  const kit = await fetchKit(slug);  // GET /api/kits/[slug]

  // 2. 미리보기 출력 + 사용자 확인
  printPreview(kit);
  const confirmed = await confirm('계속 설치하시겠습니까?');
  if (!confirmed) return;

  // 3. 임시 디렉토리에 파일 다운로드
  const tmpDir = await downloadFiles(kit.file_tree, kit.github_repo, kit.github_branch);

  // 4. 파일 배치 (롤백 가능한 트랜잭션)
  const installer = new Installer(tmpDir, process.cwd());
  try {
    if (!opts.skipSkills) await installer.installSkills(kit.kit_yaml);
    if (!opts.skipAgents) await installer.installAgents(kit.kit_yaml);
    if (!opts.skipHooks) await installer.mergeHooks(kit.hooks_meta);
    await installer.installClaudeMd(kit.kit_yaml);
    installer.commit();  // 백업 삭제
  } catch (err) {
    installer.rollback();  // 복사된 파일 제거, settings.json 복구
    throw err;
  }

  // 5. 설치 수 트래킹
  await trackInstall(slug, { cli_version: VERSION, agent_type: 'claude-code' });

  // 6. 완료 메시지
  printSuccess(kit);
}
```

### 6.2 settings.json 병합 전략

```typescript
// apps/cli/src/lib/installer.ts — mergeHooks()
function mergeHooks(hooksToAdd: HookMeta[], settingsPath: string) {
  // 1. 기존 settings.json 백업
  const backup = readJsonOrEmpty(settingsPath);

  // 2. 기존 hooks 배열에서 같은 command인 항목 제거 (중복 방지)
  const existingHooks = (backup.hooks ?? []).filter(
    (h) => !hooksToAdd.some((n) => n.command === h.command)
  );

  // 3. 새 hooks 추가
  const merged = { ...backup, hooks: [...existingHooks, ...hooksToAdd] };

  // 4. 파일 쓰기
  writeJson(settingsPath, merged);
}
```

---

## 7. Error Handling

| Code | HTTP | Message (ko) | Cause | Handling |
|------|------|-------------|-------|----------|
| `KIT_NOT_FOUND` | 404 | 킷을 찾을 수 없습니다. | slug 미존재 또는 미공개 | 404 페이지 렌더링 |
| `UNAUTHORIZED` | 401 | 로그인이 필요합니다. | 세션 없음 | 로그인 페이지 리다이렉트 |
| `FORBIDDEN` | 403 | 수정 권한이 없습니다. | 저자 불일치 | 에러 메시지 표시 |
| `VALIDATION_ERROR` | 400 | 입력값이 올바르지 않습니다. | kit.yaml 유효성 실패 | 필드별 에러 표시 |
| `GITHUB_RATE_LIMIT` | 429 | GitHub API 한도 초과. 잠시 후 시도해주세요. | rate limit | 재시도 안내 |
| `GITHUB_REPO_NOT_FOUND` | 422 | GitHub 저장소를 찾을 수 없습니다. | 비공개/삭제 repo | 에러 메시지 |
| `INTERNAL_ERROR` | 500 | 서버 오류가 발생했습니다. | 예외 | Vercel 로그 기록 |

### CLI 에러 핸들링

```typescript
// apps/cli/src/utils/logger.ts
function handleError(err: unknown): never {
  if (err instanceof ApiError) {
    logger.error(`API 오류: ${err.message} (${err.code})`);
  } else if (err instanceof NetworkError) {
    logger.error('네트워크 연결을 확인해주세요.');
  } else if (err instanceof InstallError) {
    logger.error(`설치 실패: ${err.message}`);
    logger.info('변경사항이 롤백되었습니다.');
  } else {
    logger.error('예상치 못한 오류가 발생했습니다.');
  }
  process.exit(1);
}
```

---

## 8. Security Considerations

- [x] **SQL Injection**: Supabase SDK 파라미터 바인딩 사용, 원시 SQL 지양
- [x] **XSS**: Next.js 자동 이스케이프 + `readme_html`은 `sanitize-html`로 정제
- [x] **CSRF**: Next.js App Router Server Actions 내장 CSRF 토큰
- [x] **RLS**: 모든 테이블에 Row Level Security 활성화
- [x] **환경변수**: `SUPABASE_SERVICE_ROLE_KEY`는 서버 측 전용, 클라이언트 미노출
- [x] **GitHub OAuth Scope**: `read:user user:email`만 요청 (최소 권한)
- [x] **CLI 파일 경로 검증**: 다운로드된 파일 경로의 `../` 경로 탐색 공격 방지
- [x] **Rate Limiting**: `/api/kits/[slug]/install`은 IP당 분당 10회 제한 (Vercel Edge Config)

---

## 9. Implementation Guide

### 9.1 File Structure

```
cckit/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── [locale]/
│   │       │   │   ├── page.tsx                  # 랜딩 (Server)
│   │       │   │   ├── explore/page.tsx           # 탐색 (Server)
│   │       │   │   ├── kit/[slug]/page.tsx        # 상세 (Server)
│   │       │   │   └── auth/callback/route.ts     # OAuth 콜백
│   │       │   └── api/
│   │       │       ├── kits/route.ts              # GET, POST
│   │       │       ├── kits/[slug]/route.ts       # GET, PUT, DELETE
│   │       │       ├── kits/[slug]/install/route.ts # POST
│   │       │       └── github/analyze/route.ts   # POST
│   │       ├── components/
│   │       │   ├── global-nav.tsx
│   │       │   ├── kit-card.tsx
│   │       │   ├── kit-detail.tsx
│   │       │   ├── search-bar.tsx
│   │       │   ├── file-tree.tsx
│   │       │   ├── hook-diagram.tsx
│   │       │   └── cli-block.tsx
│   │       └── lib/
│   │           ├── supabase/
│   │           │   ├── client.ts
│   │           │   ├── server.ts
│   │           │   └── middleware.ts
│   │           └── github.ts
│   │
│   └── cli/
│       └── src/
│           ├── index.ts
│           ├── commands/
│           │   ├── install.ts
│           │   ├── search.ts
│           │   └── list.ts
│           └── lib/
│               ├── api.ts
│               ├── installer.ts
│               └── kit-validator.ts
│
├── packages/
│   └── shared/
│       └── src/
│           ├── types/
│           │   ├── kit.ts
│           │   └── api.ts
│           └── validators/
│               └── kit-yaml.ts        # zod 스키마
│
└── supabase/
    └── schema.sql
```

### 9.2 Implementation Order

**Phase 1-0: 프로젝트 초기 세팅**
1. [ ] 루트 pnpm workspace + Turborepo 설정 (`package.json`, `pnpm-workspace.yaml`, `turbo.json`)
2. [ ] `packages/shared` — Kit/API 타입 + zod 유효성 검사기
3. [ ] `apps/web` — Next.js 15 초기화 (`create-next-app`, TypeScript, Tailwind CSS 4)
4. [ ] Supabase 클라이언트 설정 (`lib/supabase/client.ts`, `server.ts`)
5. [ ] GitHub OAuth 설정 (Supabase 대시보드 + `/auth/callback` 라우트)
6. [ ] `supabase/schema.sql` 작성 → Supabase 대시보드 SQL Editor 실행

**Phase 1-1: 랜딩 페이지**
7. [ ] `GlobalNav` 컴포넌트 + 글로벌 레이아웃 (`app/[locale]/layout.tsx`)
8. [ ] 랜딩 페이지 (`/`) — Hero + Stats + 인기 킷 카드
9. [ ] `KitCard` 컴포넌트
10. [ ] `CliBlock` 컴포넌트 (클립보드 복사)
11. [ ] i18n 설정 (next-intl) + `messages/ko.json` 기본 문자열

**Phase 1-2: 킷 목록/상세 API + 페이지**
12. [ ] `GET /api/kits` — FTS 쿼리 + 필터 + 페이지네이션
13. [ ] `GET /api/kits/[slug]` — 상세 + 리뷰 집계
14. [ ] 킷 탐색 페이지 (`/explore`) — SearchBar + CategoryFilter + KitCard 그리드
15. [ ] `FileTree` 컴포넌트
16. [ ] `HookDiagram` 컴포넌트
17. [ ] 킷 상세 페이지 (`/kit/[slug]`) — 메인 + 사이드바

**Phase 1-3: CLI 도구**
18. [ ] `apps/cli` — Commander.js 초기화 + package.json
19. [ ] `lib/api.ts` — `/api/kits/[slug]` 호출
20. [ ] `lib/installer.ts` — 파일 배치 + settings.json 병합 + 롤백
21. [ ] `commands/install.ts` — 전체 설치 플로우
22. [ ] `commands/search.ts`, `commands/list.ts`
23. [ ] `POST /api/kits/[slug]/install` 라우트

**Phase 1-4: 시드 데이터**
24. [ ] `spring-boot-enterprise` 킷 GitHub repo 생성 + kit.yaml 작성
25. [ ] Supabase DB 시드 데이터 (SQL) — 킷 3~5개

**Phase 1-5: 배포**
26. [ ] Vercel 프로젝트 연결 + 환경변수 설정
27. [ ] CLI `npm publish` 준비 (package.json bin 설정)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft — MVP 전체 설계 | CCKit Team |
