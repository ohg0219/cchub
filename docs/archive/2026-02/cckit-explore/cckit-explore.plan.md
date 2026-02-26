# cckit-explore Planning Document

> **Summary**: CCKit 킷 API + 탐색 페이지 + 상세 페이지 구현 (핵심 마켓플레이스 기능)
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Parent**: cckit-mvp (Phase 1-2)
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

CCKit 마켓플레이스의 핵심 기능인 킷 탐색/검색 페이지와 킷 상세 페이지를 구현한다.
사용자가 원하는 킷을 빠르게 찾고, 설치 전에 파일 구조와 Hook 동작을 시각적으로 미리볼 수 있어야 한다.

### 1.2 Background

- cckit-setup, cckit-auth, cckit-landing 완료 후 진행
- 킷 API는 웹 UI와 CLI 모두에서 사용 (공통 엔드포인트)
- 파일 트리 뷰어와 Hook 다이어그램이 경쟁 사이트와의 핵심 차별화 포인트

### 1.3 Related Documents

- 상위 기획: `docs/01-plan/features/cckit-mvp.plan.md`
- DB 스키마: `supabase/schema.sql`
- kit.yaml 스펙: `project-plan/kit-spec.md`
- UI 와이어프레임: `project-plan/wireframe.html`

---

## 2. Scope

### 2.1 In Scope

- [ ] **킷 API — 목록** (`GET /api/kits`): 필터(카테고리/구성), 정렬(인기/최신), 페이지네이션, 풀텍스트 검색
- [ ] **킷 API — 상세** (`GET /api/kits/[slug]`): 메타 + 파일 목록 + 설치 수
- [ ] **킷 API — 설치 수** (`POST /api/kits/[slug]/install`): 설치 카운트 증가
- [ ] **탐색 페이지** (`/explore`): 검색바 + 카테고리/구성 필터 + 정렬 + 킷 카드 그리드
- [ ] **킷 상세 페이지** (`/kit/[slug]`): 메타 정보 + 파일 트리 + Hook 다이어그램 + CLI 설치 블록
- [ ] **검색바 컴포넌트**: 실시간 Supabase FTS
- [ ] **파일 트리 컴포넌트**: 킷의 파일 구조 시각화
- [ ] **Hook 다이어그램 컴포넌트**: PreToolUse/PostToolUse 흐름 시각화
- [ ] i18n 한국어 문자열

### 2.2 Out of Scope

- 킷 등록/수정/삭제 UI (Phase 2)
- 별점/리뷰 UI (Phase 2)
- Algolia 검색 (Phase 2, MVP는 Supabase FTS)
- GitHub repo 자동 분석 (Phase 2)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `GET /api/kits` — 카테고리/구성 필터, 정렬(popular/latest), 검색어, 페이지네이션 | High | Pending |
| FR-02 | `GET /api/kits/[slug]` — 킷 상세 + 파일 목록 + 설치 수 | High | Pending |
| FR-03 | `POST /api/kits/[slug]/install` — 설치 수 원자적 증가 | Medium | Pending |
| FR-04 | 탐색 페이지 — 검색바, 카테고리 필터(frontend/backend/infra 등), 구성 필터(skills/hooks/agents) | High | Pending |
| FR-05 | 탐색 페이지 — 킷 카드 그리드, 무한 스크롤 또는 페이지네이션 | High | Pending |
| FR-06 | 킷 상세 페이지 — 이름/설명/카테고리/버전/GitHub 링크 메타 정보 | High | Pending |
| FR-07 | 킷 상세 페이지 — 파일 트리 뷰어 (Skills/Hooks/Agents/CLAUDE.md 분류) | High | Pending |
| FR-08 | 킷 상세 페이지 — Hook 다이어그램 (PreToolUse → 작업 → PostToolUse 흐름) | High | Pending |
| FR-09 | 킷 상세 페이지 — CLI 설치 블록 (`npx cckit install <slug>`) | High | Pending |
| FR-10 | Supabase RLS 정책 — 킷 목록/상세는 공개, 설치 수 증가는 인증 불필요 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 킷 목록 API 응답 < 500ms | Vercel Analytics |
| Performance | 킷 상세 페이지 LCP < 3초 | Lighthouse |
| SEO | 킷 상세 동적 메타태그 (`generateMetadata`) | Lighthouse |
| Security | RLS로 비공개 킷 보호 | SQL review |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `/explore` 페이지 — 검색/필터/정렬 모두 동작
- [ ] `/kit/[slug]` 페이지 — 파일 트리, Hook 다이어그램, CLI 블록 렌더링
- [ ] 설치 수 API 정상 동작
- [ ] 시드 킷으로 E2E 흐름 확인 (탐색 → 상세 → CLI 명령어 복사)
- [ ] 모바일 반응형 정상

### 4.2 Quality Criteria

- [ ] TypeScript strict, 타입 에러 없음
- [ ] API 응답 타입 packages/shared와 일치
- [ ] Zero lint errors

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Supabase FTS 한국어 형태소 분석 미지원 | Medium | High | LIKE 검색 fallback + 추후 Algolia 전환 |
| 파일 트리 데이터 구조 설계 복잡 | Medium | Medium | kit.yaml의 `files` 배열로 단순화 |
| Hook 다이어그램 렌더링 라이브러리 선택 | Low | Medium | SVG 직접 렌더링 (라이브러리 의존 최소화) |
| 시드 킷 없으면 탐색 페이지 빈 상태 | High | High | cckit-seed와 병렬 진행, Empty State UI 필수 |

---

## 6. Architecture Considerations

### 6.1 Key Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 탐색 페이지 렌더링 | SSR + Client 검색 | 초기 목록 SSR, 검색/필터는 클라이언트 |
| 킷 상세 렌더링 | SSR (`generateStaticParams` 불필요) | 동적 데이터 (설치 수) 있어 SSG 부적합 |
| 검색 | Supabase FTS (`to_tsvector`) | MVP 단계 추가 서비스 불필요 |
| Hook 다이어그램 | 커스텀 SVG 컴포넌트 | 외부 라이브러리 없이 간단히 구현 |

### 6.2 주요 파일

```
apps/web/src/
├── app/
│   ├── [locale]/explore/
│   │   └── page.tsx              # 탐색 페이지 (Server Component)
│   ├── [locale]/kit/[slug]/
│   │   └── page.tsx              # 킷 상세 페이지
│   └── api/
│       ├── kits/
│       │   ├── route.ts          # GET /api/kits (목록)
│       │   └── [slug]/
│       │       ├── route.ts      # GET /api/kits/[slug]
│       │       └── install/
│       │           └── route.ts  # POST /api/kits/[slug]/install
├── components/
│   ├── kit-card.tsx              # 킷 카드 (cckit-landing에서 공유)
│   ├── search-bar.tsx            # 검색 + 필터 (신규)
│   ├── file-tree.tsx             # 파일 트리 뷰어 (신규)
│   └── hook-diagram.tsx          # Hook 다이어그램 (신규)
```

---

## 7. Next Steps

1. [ ] Design 문서 작성 (`/pdca design cckit-explore`)
2. [ ] Supabase 스키마 확인 (kits 테이블 컬럼)
3. [ ] 구현 시작 (`/pdca do cckit-explore`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft — cckit-mvp Phase 1-2 분리 | CCKit Team |
