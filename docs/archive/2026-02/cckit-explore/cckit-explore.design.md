# cckit-explore Design Document

> **Summary**: 킷 탐색/검색 페이지 + 킷 상세 페이지 + REST API 설계
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Status**: Draft
> **Planning Doc**: [cckit-explore.plan.md](../01-plan/features/cckit-explore.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- Supabase kits 테이블을 조회하는 REST API 3개 (목록/상세/설치 수) 구현
- SSR + Client 혼합: 초기 목록은 서버에서 렌더링, 검색/필터는 클라이언트 상태
- 파일 트리(file_tree JSONB)와 Hook 메타(hooks_meta JSONB)를 시각화하는 전용 컴포넌트
- cckit-landing에서 만든 KitCard, CliBlock 컴포넌트 재사용

### 1.2 Design Principles

- **서버 우선**: 페이지 초기 로드는 Server Component + SSR, 검색/필터는 URL searchParams 기반 (`useSearchParams`)
- **타입 안전**: 모든 Supabase 응답은 `types.ts`에 정의된 인터페이스로 캐스팅
- **컴포넌트 최소화**: FileTree, HookDiagram, SearchBar만 신규 추가, 나머지는 재사용
- **Empty State 필수**: 시드 킷이 없을 때도 UI가 망가지지 않도록

---

## 2. Architecture

### 2.1 Component Diagram

```
Browser (탐색 페이지)
  └─ /explore?q=...&category=...&sort=...
       ├─ ExplorePage (Server Component)  → Supabase kits 쿼리 (초기 목록)
       │    ├─ SearchBar (Client)         → URL searchParams 업데이트
       │    └─ KitGrid (Client)           → /api/kits 호출 (필터 변경 시)
       │         └─ KitCard (Server)
       └─ (no separate API call on initial load)

Browser (상세 페이지)
  └─ /kit/[slug]
       └─ KitDetailPage (Server Component) → /api/kits/[slug] 또는 직접 Supabase
            ├─ FileTree (Client)
            ├─ HookDiagram (Client)
            └─ CliBlock (Client, 재사용)
```

### 2.2 Data Flow

```
[초기 로드]
URL params → ExplorePage(Server) → Supabase → HTML 스트리밍

[검색/필터 변경]
User Input → SearchBar → router.push(new URL) → ExplorePage re-render

[설치 수 증가]
CLI install → POST /api/kits/[slug]/install → Supabase UPDATE + kit_installs INSERT
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| ExplorePage | createClient (server) | SSR Supabase 쿼리 |
| KitGrid | /api/kits | 클라이언트 필터 변경 시 재조회 |
| KitDetailPage | createClient (server) | 상세 데이터 조회 |
| FileTree | kit.file_tree (JSONB) | 파일 구조 시각화 |
| HookDiagram | kit.hooks_meta (JSONB) | Hook 흐름 시각화 |
| SearchBar | next/navigation (useRouter, useSearchParams) | URL 파라미터 제어 |

---

## 3. Data Model

### 3.1 KitDetail (상세 페이지용 확장 타입)

```typescript
// apps/web/src/lib/supabase/types.ts에 추가
export interface FileTreeNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  kind?: 'skill' | 'hook' | 'agent' | 'claude_md' | 'other';
  children?: FileTreeNode[];
}

export interface HookMeta {
  name: string;                              // e.g. "lint-on-save"
  event: 'PreToolUse' | 'PostToolUse' | 'Notification' | 'Stop';
  matcher?: string;                          // tool 매처 (e.g. "Edit|Write")
  description: string;
}

export interface KitDetail extends KitSummary {
  author_id: string;
  github_repo: string;
  github_branch: string;
  version: string;
  license: string | null;
  languages: string[];
  compatible_agents: string[];
  star_count: number;
  kit_yaml: Record<string, unknown> | null;
  file_tree: FileTreeNode[] | null;
  hooks_meta: HookMeta[];
  created_at: string;
  updated_at: string;
}
```

### 3.2 API Response Types

```typescript
// packages/shared/src/types/api.ts에 추가
export interface KitsListResponse {
  data: KitSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface KitDetailResponse {
  data: KitDetail;
}

export interface InstallResponse {
  install_count: number;
}
```

### 3.3 Query Parameters

```typescript
// GET /api/kits 쿼리 파라미터
interface KitsQueryParams {
  q?: string;          // 검색어 (FTS)
  category?: string;   // backend|frontend|data|devops|mobile|fullstack
  has?: string;        // skills|hooks|agents|claude_md (쉼표 구분)
  sort?: 'popular' | 'latest';
  page?: number;       // 1-based, default 1
  pageSize?: number;   // default 12, max 48
}
```

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/kits` | 킷 목록 (필터/정렬/페이지네이션) | 불필요 |
| GET | `/api/kits/[slug]` | 킷 상세 | 불필요 |
| POST | `/api/kits/[slug]/install` | 설치 수 증가 | 불필요 |

### 4.2 Detailed Specification

#### `GET /api/kits`

**Query Parameters:** `q`, `category`, `has`, `sort`, `page`, `pageSize`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "react-claude-kit",
      "name": "React Claude Kit",
      "description": "React 프로젝트용 Claude Code 스타터 킷",
      "category": "frontend",
      "install_count": 128,
      "skills_count": 3,
      "hooks_count": 2,
      "agents_count": 1,
      "has_claude_md": true,
      "tags": ["react", "typescript"]
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 12
}
```

**Supabase 쿼리 로직:**
```typescript
let query = supabase
  .from('kits')
  .select('id,slug,name,description,category,install_count,skills_count,hooks_count,agents_count,has_claude_md,tags', { count: 'exact' })
  .eq('is_published', true);

// FTS 검색
if (q) {
  query = query.textSearch('fts', q, { type: 'plain', config: 'simple' });
}
// 카테고리 필터
if (category) query = query.eq('category', category);
// 구성 필터 (has=skills → skills_count > 0)
if (has?.includes('skills'))    query = query.gt('skills_count', 0);
if (has?.includes('hooks'))     query = query.gt('hooks_count', 0);
if (has?.includes('agents'))    query = query.gt('agents_count', 0);
if (has?.includes('claude_md')) query = query.eq('has_claude_md', true);
// 정렬
if (sort === 'latest') query = query.order('created_at', { ascending: false });
else                   query = query.order('install_count', { ascending: false });
// 페이지네이션
query = query.range((page - 1) * pageSize, page * pageSize - 1);
```

**Error Responses:**
- `400 Bad Request`: 유효하지 않은 `category` 값
- `500 Internal Server Error`: Supabase 쿼리 실패

---

#### `GET /api/kits/[slug]`

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "slug": "react-claude-kit",
    "name": "React Claude Kit",
    "github_repo": "https://github.com/user/react-claude-kit",
    "version": "1.0.0",
    "file_tree": [
      { "name": ".claude", "type": "dir", "path": ".claude", "children": [
        { "name": "skills", "type": "dir", "path": ".claude/skills", "children": [
          { "name": "react.md", "type": "file", "path": ".claude/skills/react.md", "kind": "skill" }
        ]}
      ]}
    ],
    "hooks_meta": [
      { "name": "lint-on-save", "event": "PostToolUse", "matcher": "Edit|Write", "description": "파일 저장 후 ESLint 실행" }
    ]
  }
}
```

**Error Responses:**
- `404 Not Found`: slug에 해당하는 킷 없음

---

#### `POST /api/kits/[slug]/install`

**Request Body:** (없음, Body 불필요)

**Response (200 OK):**
```json
{ "install_count": 129 }
```

**구현 로직:**
1. `supabase.from('kit_installs').insert({ kit_id, cli_version, agent_type })`
2. `supabase.rpc('increment_install_count', { kit_slug: slug })` — 또는 직접 UPDATE
3. 업데이트된 `install_count` 반환

**Note:** RLS `installs_insert` 정책이 `WITH CHECK (true)`이므로 인증 불필요.
단, Rate Limiting은 Vercel Edge Config 또는 미들웨어로 추후 적용.

---

## 5. UI/UX Design

### 5.1 탐색 페이지 (`/explore`) 레이아웃

```
+─────────────────────────────────────────────────+
│  GlobalNav                                       │
+─────────────────────────────────────────────────+
│  [SearchBar: 🔍 킷 이름, 설명, 태그 검색...    ] │
│  [All] [Backend] [Frontend] [DevOps] [Data] ...  │  ← 카테고리 탭
│  ☐ Skills  ☐ Hooks  ☐ Agents  ☐ CLAUDE.md      │  ← 구성 필터
│  정렬: [인기순▼] [최신순]                        │
+─────────────────────────────────────────────────+
│  [KitCard] [KitCard] [KitCard]                  │
│  [KitCard] [KitCard] [KitCard]                  │
│  [KitCard] [KitCard] [KitCard]                  │
│  ...                                             │
│  [← 이전] [1] [2] [3] [다음 →]                  │  ← 페이지네이션
+─────────────────────────────────────────────────+
│  Footer                                          │
+─────────────────────────────────────────────────+

Empty State (킷 없을 때):
  🔍 "검색 결과가 없습니다"
  "다른 검색어나 필터를 시도해보세요"
```

### 5.2 킷 상세 페이지 (`/kit/[slug]`) 레이아웃

```
+─────────────────────────────────────────────────+
│  GlobalNav                                       │
+─────────────────────────────────────────────────+
│  ← 탐색으로 돌아가기                             │
│                                                  │
│  [Category] React Claude Kit    v1.0.0           │
│  react 프로젝트용 Claude Code 스타터 킷           │
│  👤 author · ↓ 128 installs · ⭐ 12 · GitHub ↗  │
│  태그: [react] [typescript] [eslint]             │
│                                                  │
│  ┌─ 설치 ─────────────────────────────────────┐  │
│  │  npx cckit install react-claude-kit        │  │
│  │                              [복사]         │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─ 파일 구조 ────────┐  ┌─ Hook 다이어그램 ──┐  │
│  │  📁 .claude        │  │  PreToolUse        │  │
│  │    📁 skills       │  │    └─ validate     │  │
│  │      📄 react.md   │  │  PostToolUse       │  │
│  │    📁 hooks        │  │    └─ lint-on-save │  │
│  │      📄 lint.sh    │  │  Notification      │  │
│  │  📄 CLAUDE.md      │  │    └─ (없음)       │  │
│  └────────────────────┘  └────────────────────┘  │
+─────────────────────────────────────────────────+
│  Footer                                          │
+─────────────────────────────────────────────────+
```

### 5.3 Component List

| Component | 파일 | 타입 | 역할 |
|-----------|------|------|------|
| ExplorePage | `app/[locale]/explore/page.tsx` | Server | SSR 초기 목록 + URL params |
| KitDetailPage | `app/[locale]/kit/[slug]/page.tsx` | Server | 상세 데이터 + SEO 메타 |
| SearchBar | `components/search-bar.tsx` | Client | 검색어 입력 + URL push |
| CategoryFilter | `components/category-filter.tsx` | Client | 카테고리 탭 + 구성 체크박스 |
| FileTree | `components/file-tree.tsx` | Client | JSONB 파일 트리 렌더링 |
| HookDiagram | `components/hook-diagram.tsx` | Client | PreToolUse/PostToolUse SVG |
| KitCard | `components/kit-card.tsx` | Server | 재사용 (cckit-landing) |
| CliBlock | `components/cli-block.tsx` | Client | 재사용 (cckit-landing) |

---

## 6. Component Detailed Spec

### 6.1 SearchBar

```typescript
'use client';
// props
interface SearchBarProps {
  defaultValue?: string;  // URL ?q= 초기값
}
// 동작: 300ms debounce → router.push(`/explore?q=${value}&...나머지 params 유지`)
// 단축키: Esc → 검색어 클리어
```

### 6.2 CategoryFilter

```typescript
'use client';
interface CategoryFilterProps {
  defaultCategory?: string;
  defaultHas?: string[];   // ['skills', 'hooks', ...]
  defaultSort?: 'popular' | 'latest';
}
// 카테고리 탭 클릭 → URL category 파라미터 업데이트
// 구성 체크박스 → URL has 파라미터 (쉼표 구분) 업데이트
// 정렬 버튼 → URL sort 파라미터 업데이트
```

### 6.3 FileTree

```typescript
'use client';
interface FileTreeProps {
  nodes: FileTreeNode[];
}
// FileTreeNode 재귀 렌더링
// kind에 따른 아이콘: skill=📄(파란색), hook=⚡(노란색), agent=🤖(초록색), claude_md=📋(보라색)
// 폴더는 클릭으로 접기/펼치기 (useState)
// 최초 상태: .claude 폴더 펼침, 나머지 접힘
```

### 6.4 HookDiagram

```typescript
'use client';
interface HookDiagramProps {
  hooks: HookMeta[];
}
// PreToolUse / PostToolUse / Notification / Stop 이벤트별 그룹
// 각 그룹은 세로 리스트로 표시
// hook이 없는 이벤트는 "(없음)" 표시
// SVG 없이 Tailwind div로 구현 (외부 라이브러리 불필요)
// 흐름 표시: "→ [Tool 실행] →" 중간에 삽입
```

---

## 7. i18n Keys

### ko.json / en.json 추가 키

```json
{
  "explore": {
    "title": "킷 탐색",
    "searchPlaceholder": "킷 이름, 설명, 태그 검색...",
    "allCategories": "전체",
    "filters": {
      "skills": "Skills",
      "hooks": "Hooks",
      "agents": "Agents",
      "claudeMd": "CLAUDE.md"
    },
    "sort": {
      "popular": "인기순",
      "latest": "최신순"
    },
    "empty": "검색 결과가 없습니다",
    "emptyHint": "다른 검색어나 필터를 시도해보세요",
    "total": "{count}개의 킷"
  },
  "kitDetail": {
    "back": "탐색으로 돌아가기",
    "installs": "↓ {count} 설치",
    "stars": "⭐ {count}",
    "fileTree": "파일 구조",
    "hookDiagram": "Hook 다이어그램",
    "noFile": "파일 정보 없음",
    "noHook": "Hook 없음",
    "install": "설치",
    "githubLink": "GitHub에서 보기"
  }
}
```

---

## 8. Error Handling

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 400 | Invalid category | 잘못된 필터 값 | 필터 무시하고 전체 반환 |
| 404 | Kit not found | 존재하지 않는 slug | Next.js `notFound()` 호출 |
| 500 | Internal server error | Supabase 오류 | 빈 목록 반환 + 에러 로그 |

- 탐색 페이지: Supabase 오류 시 Empty State 렌더링 (크래시 방지)
- 상세 페이지: slug 없으면 `notFound()` → Next.js 404 페이지

---

## 9. Security Considerations

- [x] RLS `kits_read` 정책: `is_published = true`만 노출 (비공개 킷 보호)
- [x] `GET /api/kits`: category 파라미터 화이트리스트 검증 (SQL Injection 방지)
- [x] `POST /api/kits/[slug]/install`: Rate limiting 미적용 (MVP), service_role 불필요
- [ ] 추후: Vercel Edge Middleware로 IP당 설치 수 Rate Limit

---

## 10. Implementation Guide

### 10.1 File Structure

```
apps/web/src/
├── app/
│   ├── [locale]/
│   │   ├── explore/
│   │   │   └── page.tsx              # Server Component, searchParams 수신
│   │   └── kit/
│   │       └── [slug]/
│   │           └── page.tsx          # Server Component, generateMetadata
│   └── api/
│       └── kits/
│           ├── route.ts              # GET /api/kits
│           └── [slug]/
│               ├── route.ts          # GET /api/kits/[slug]
│               └── install/
│                   └── route.ts      # POST /api/kits/[slug]/install
├── components/
│   ├── search-bar.tsx                # 신규 (Client)
│   ├── category-filter.tsx           # 신규 (Client)
│   ├── file-tree.tsx                 # 신규 (Client)
│   └── hook-diagram.tsx              # 신규 (Client)
└── lib/
    └── supabase/
        └── types.ts                  # KitDetail, FileTreeNode, HookMeta 추가
```

### 10.2 Implementation Order

1. [ ] `types.ts` — `KitDetail`, `FileTreeNode`, `HookMeta` 인터페이스 추가
2. [ ] `app/api/kits/route.ts` — GET /api/kits (필터/정렬/페이지네이션)
3. [ ] `app/api/kits/[slug]/route.ts` — GET /api/kits/[slug]
4. [ ] `app/api/kits/[slug]/install/route.ts` — POST install
5. [ ] `components/search-bar.tsx` — debounce + URL push
6. [ ] `components/category-filter.tsx` — 카테고리 탭 + 구성 체크박스
7. [ ] `components/file-tree.tsx` — 재귀 트리 렌더링
8. [ ] `components/hook-diagram.tsx` — 이벤트별 그룹 레이아웃
9. [ ] `app/[locale]/explore/page.tsx` — SSR 초기 목록 + SearchBar + KitGrid
10. [ ] `app/[locale]/kit/[slug]/page.tsx` — KitDetailPage + generateMetadata
11. [ ] `messages/ko.json` / `en.json` — explore, kitDetail 키 추가
12. [ ] 빌드 검증 (`export PATH=... && pnpm --filter web build`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft | CCKit Team |
