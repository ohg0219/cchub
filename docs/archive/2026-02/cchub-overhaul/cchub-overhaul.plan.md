# cchub-overhaul Planning Document

> **Summary**: 배포 전 프로젝트 전면 개편 — 로그인 제거, GitHub 연동 삭제, 공개 스타터 킷 마켓플레이스로 전환
>
> **Project**: CCHub
> **Version**: 1.0.0
> **Author**: team
> **Date**: 2026-02-26
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

배포 전 마지막 전면 개편. 현재 Supabase Auth 기반 로그인/GitHub OAuth 의존 구조를 제거하고,
**누구나 바로 쓸 수 있는 공개형 스타터 킷 마켓플레이스**로 전환한다.

유명 기업들(Vercel, Stripe, Linear, Supabase 등)의 공개 GitHub 레포지토리를 크롤링/파싱하여
그 안의 `CLAUDE.md`, `Skills`, `Hooks`, `Agents` 파일을 자동으로 킷으로 수집하고,
사용자는 **원클릭**으로 자신의 로컬 Claude Code 환경에 설치할 수 있다.

### 1.2 Background

**현재 문제:**
- 로그인 기능이 사용자 진입 장벽으로 작용
- GitHub OAuth → Supabase Auth 연동이 배포/운영 복잡도를 높임
- 킷 등록(submit)이 인증 사용자에게만 제한되어 초기 콘텐츠 부족
- "유명 기업 킷"이라는 핵심 가치가 아직 구현되지 않음

**전환 방향:**
- 인증 없는 완전 공개 마켓플레이스 (read-only는 100% 공개)
- 유명 기업 GitHub에서 자동 수집한 킷이 기본 콘텐츠로 존재
- CLI `cchub install <kit>` 로 원클릭 설치 유지

### 1.3 Related Documents

- 기존 설계: `docs/archive/2026-02/cckit-auth/`
- cckit-features 아카이브: `docs/archive/2026-02/cchub-features/`

---

## 2. Scope

### 2.1 In Scope

- [ ] **로그인 기능 완전 제거**: auth 관련 라우트, 컴포넌트, 미들웨어 삭제
- [ ] **GitHub OAuth 연동 제거**: Supabase Auth 로직 제거, 환경 변수 정리
- [ ] **GlobalNav에서 로그인/사용자 메뉴 제거**: 심플 네비게이션으로 교체
- [ ] **Submit 페이지 재설계**: 인증 없이 GitHub URL만으로 킷 등록 가능하게
- [ ] **GitHub 레포 자동 파서**: 공개 레포의 CLAUDE.md/Skills/Hooks/Agents 파일 탐색
- [ ] **유명 기업 시드 킷 수집**: Vercel, Stripe, Linear, Supabase, Anthropic 등 10~20개
- [ ] **킷 카드/상세에서 "설치" CTA 강화**: 로그인 없이 바로 CLI 명령어 복사
- [ ] **Supabase DB 스키마에서 user_id 의존성 제거** (kits 테이블 submitted_by nullable 처리)

### 2.2 Out of Scope

- Supabase 완전 제거 (DB/RLS는 유지, Auth만 제거)
- 사용자별 즐겨찾기/설치 이력 기능
- 킷 평가/댓글 기능
- 유료 플랜 / 프리미엄 킷

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 로그인 없이 모든 킷 탐색/조회 가능 | High | Pending |
| FR-02 | 로그인 없이 킷 설치 명령어(CLI) 복사 가능 | High | Pending |
| FR-03 | auth 관련 라우트(`/auth/login`, `/auth/callback`) 제거 | High | Pending |
| FR-04 | GlobalNav에서 LoginButton, UserMenu 제거 | High | Pending |
| FR-05 | Submit 페이지: GitHub URL 입력만으로 킷 등록 요청 가능 | High | Pending |
| FR-06 | GitHub 공개 레포 파서: CLAUDE.md/skills/hooks/agents 파일 감지 | High | Pending |
| FR-07 | 유명 기업 레포 목록 하드코딩 + GitHub API로 자동 수집 | High | Pending |
| FR-08 | 수집된 킷을 Supabase DB에 upsert (관리자 스크립트) | Medium | Pending |
| FR-09 | 킷 상세 페이지: 인증 불필요, CLI 명령어 즉시 표시 | High | Pending |
| FR-10 | middleware.ts에서 auth 보호 경로 모두 제거 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | GitHub API 파싱 < 3초/레포 | 로컬 측정 |
| Security | GitHub API rate limit 안전 처리 (캐싱) | 코드 리뷰 |
| UX | 로그인 없이 3클릭 내 킷 설치 명령어 획득 | 수동 테스트 |
| Accessibility | 기존 WCAG 2.1 AA 수준 유지 | Lighthouse |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `/auth/*` 라우트 완전 제거, 빌드 에러 없음
- [ ] GlobalNav 로그인 버튼 없음, 빌드/런타임 에러 없음
- [ ] Submit 페이지 GitHub URL 입력 → 킷 등록 플로우 동작
- [ ] GitHub 레포 파서가 CLAUDE.md/skills/hooks/agents 감지
- [ ] 유명 기업 킷 10개 이상 DB에 시드
- [ ] 킷 상세 페이지에서 `cchub install <kit>` 명령어 즉시 표시
- [ ] `pnpm build` 성공 (TypeScript 에러 0)
- [ ] Supabase kits 테이블 RLS: authenticated 조건 제거, public read 허용

### 4.2 Quality Criteria

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Build succeeds in CI

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| GitHub API rate limit (미인증 60req/h) | Medium | High | GitHub App Token or Personal Access Token 사용, 캐싱 레이어 추가 |
| auth 관련 코드 누락 삭제로 빌드 에러 | High | Medium | 파일별 grep으로 auth import 전수 검사 후 제거 |
| Supabase RLS kits INSERT 조건 깨짐 | Medium | Medium | service_role key로 서버사이드 insert, RLS 정책 재설계 |
| 유명 기업 레포에 CLAUDE.md 없는 경우 | Low | High | partial kit 허용 (CLAUDE.md 없어도 skills/hooks/agents 있으면 수집) |

---

## 6. Architecture Considerations

### 6.1 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Auth 제거 범위 | Supabase Auth 전체 제거 vs Auth만 제거 | Auth(OAuth)만 제거, DB 유지 | DB/RLS는 킷 관리에 계속 필요 |
| GitHub 파서 위치 | API Route vs 별도 스크립트 | API Route (`/api/github`) + 관리자 seed 스크립트 | 런타임 파싱 + 초기 시드 분리 |
| Submit 인증 방식 | 없음 vs 간단한 토큰 | 없음 (공개 제출) | MVP: 스팸 방지는 moderator 수동 승인으로 |
| 유명 기업 킷 소스 | 수동 입력 vs GitHub API 자동 | GitHub API 자동 + 수동 큐레이션 목록 | 자동화로 확장성 확보 |

### 6.2 유명 기업 타겟 레포 목록 (초안)

| 기업 | GitHub Org | 레포 예시 | 비고 |
|------|------------|-----------|------|
| Anthropic | anthropic-ai | claude-code | CLAUDE.md 공식 |
| Vercel | vercel | next.js, ai | Skills/Hooks 포함 가능 |
| Stripe | stripe | stripe-node | 개발 워크플로우 킷 |
| Linear | linear | linear | 이슈 트래킹 킷 |
| Supabase | supabase | supabase | DB/Auth 킷 |
| Prisma | prisma | prisma | ORM 킷 |
| shadcn | shadcn-ui | ui | UI 컴포넌트 킷 |
| t3-oss | t3-oss | create-t3-app | fullstack 킷 |

---

## 7. Implementation Plan

### Phase 1: 로그인 제거 (우선순위 1)
1. auth 관련 파일 목록 파악 (grep)
2. `/app/[locale]/auth/` 디렉토리 삭제
3. `components/login-button.tsx`, `components/user-menu.tsx` 삭제
4. `components/global-nav.tsx`에서 auth 관련 import/렌더 제거
5. `middleware.ts` auth 보호 경로 제거
6. Supabase client에서 auth session 참조 코드 제거
7. Submit 페이지 auth guard 제거

### Phase 2: Submit 재설계 (우선순위 2)
1. Submit 폼에서 로그인 요구 조건 제거
2. GitHub URL만으로 킷 메타데이터 자동 파싱
3. Supabase kits INSERT: submitted_by nullable 처리

### Phase 3: GitHub 레포 파서 강화 (우선순위 3)
1. `/api/github` 라우트: CLAUDE.md/skills/hooks/agents 탐색 로직
2. 파일 트리 재귀 탐색 (GitHub Trees API)
3. 킷 메타데이터 자동 추출 (kit.yaml 또는 README fallback)

### Phase 4: 유명 기업 킷 시드 (우선순위 4)
1. `scripts/seed-famous-kits.ts` 작성
2. 타겟 레포 목록 → GitHub API → DB upsert
3. Supabase RLS public read 정책 확인

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`cchub-overhaul.design.md`)
2. [ ] Phase 1부터 순차 구현
3. [ ] 빌드 검증 후 배포

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft | team |
