# CCKit MVP Planning Document

> **Summary**: Claude Code Starter Kit 마켓플레이스 MVP — 웹사이트 + CLI 도구 구축
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-25
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

Claude Code 사용자가 프로젝트에 최적화된 AI 인프라(Skills + Hooks + Agents + CLAUDE.md)를 **한 번에 설치**할 수 있는 마켓플레이스 웹사이트와 CLI 도구를 구축한다.

기존 Skills 마켓플레이스(skills.sh, skillsmp.com)가 개별 SKILL.md만 공유하는 반면, CCKit은 **패키지 단위의 스타터 킷**을 CLI 한 줄로 설치하는 차별화된 경험을 제공한다.

### 1.2 Background

- **시장 현황**: Claude Code Skills 공유 사이트는 존재하지만, Hooks/Agents를 함께 묶어 제공하는 곳은 없음
- **사용자 니즈**: 개별 스킬이 아닌 "프로젝트 타입에 맞는 전체 AI 인프라 세팅"을 원함
- **차별화 포인트**:
  1. Skills + Hooks + Agents + CLAUDE.md 번들 패키지
  2. Hooks 최초 전문 지원 (기존 사이트 중 Hooks를 다루는 곳 없음)
  3. 한국 개발자 우선 타겟 (한국어 UI + Java/Spring Boot 생태계)
  4. 인터랙티브 프리뷰 (설치 전 파일 구조 + Hook 동작 시각화)

### 1.3 Related Documents

- 기획 문서: `project-plan/PLANNING.md`
- 작업 태스크: `project-plan/TASKS.md`
- kit.yaml 스펙: `project-plan/kit-spec.md`
- UI 와이어프레임: `project-plan/wireframe.html`, `cckit-planning-wireframe.html`

---

## 2. Scope

### 2.1 In Scope (MVP — Phase 1)

- [ ] **프로젝트 초기 세팅**: pnpm monorepo + Turborepo + Next.js 15 + Supabase
- [ ] **공유 패키지**: 타입 정의 + kit.yaml 유효성 검증 (packages/shared)
- [ ] **인증**: GitHub OAuth (Supabase Auth)
- [ ] **랜딩 페이지**: Hero + 통계 + 인기 킷 + CTA
- [ ] **킷 탐색 페이지**: 검색 + 카테고리/구성 필터 + 정렬
- [ ] **킷 상세 페이지**: 메타 정보 + 파일 트리 + Hook 다이어그램 + CLI 설치 블록
- [ ] **킷 API**: CRUD + 검색 + 설치 수 트래킹
- [ ] **CLI 도구**: install / search / list 명령어 (Commander.js + chalk)
- [ ] **시드 킷**: spring-boot-enterprise 킷 작성
- [ ] **i18n**: 한국어 우선 (next-intl)
- [ ] **배포**: Vercel (웹) + npm (CLI)

### 2.2 Out of Scope (Phase 2+)

- 킷 등록 기능 (GitHub repo 분석 자동화)
- 별점/리뷰 시스템 UI
- 영어 UI 확장
- AI 기반 킷 추천
- 팀/조직용 프라이빗 킷 (유료 모델)
- MCP 서버 통합
- Cursor, Copilot, Windsurf 정식 지원

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Monorepo 기반 프로젝트 구조 (apps/web, apps/cli, packages/shared) | High | Pending |
| FR-02 | Next.js 15 App Router + TypeScript + Tailwind CSS 4 웹 앱 | High | Pending |
| FR-03 | Supabase 연동 (PostgreSQL + Auth + RLS) | High | Pending |
| FR-04 | GitHub OAuth 로그인/로그아웃 | High | Pending |
| FR-05 | 킷 목록 API (필터, 정렬, 페이지네이션, 풀텍스트 검색) | High | Pending |
| FR-06 | 킷 상세 API (리뷰, 설치 수 포함) | High | Pending |
| FR-07 | 랜딩 페이지 (Hero, 통계, 인기 킷, CTA) | High | Pending |
| FR-08 | 킷 탐색 페이지 (검색바 + 카테고리/구성 필터 + 정렬) | High | Pending |
| FR-09 | 킷 상세 페이지 (메타, 파일 트리, Hook 다이어그램, CLI 블록) | High | Pending |
| FR-10 | CLI install 명령어 (Skills/Hooks/Agents/CLAUDE.md 설치) | High | Pending |
| FR-11 | CLI search / list 명령어 | Medium | Pending |
| FR-12 | i18n 한국어 지원 (next-intl) | High | Pending |
| FR-13 | 시드 킷 데이터 (spring-boot-enterprise 외 2~3개) | Medium | Pending |
| FR-14 | 설치 수 트래킹 API | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 페이지 초기 로드 < 3초 (LCP) | Lighthouse |
| Performance | API 응답 시간 < 500ms | Vercel Analytics |
| Accessibility | 시맨틱 HTML + 키보드 네비게이션 | Manual review |
| Security | Supabase RLS 정책 적용 | SQL review |
| Security | OWASP Top 10 기본 방어 | Code review |
| Responsiveness | 모바일/태블릿/데스크톱 대응 | Chrome DevTools |
| SEO | 메타 태그 + OG 이미지 | Lighthouse |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Monorepo 빌드 성공 (`pnpm build`)
- [ ] 웹사이트 전체 페이지 렌더링 정상
- [ ] CLI `install` 명령어로 시드 킷 설치 성공
- [ ] GitHub OAuth 로그인/로그아웃 정상
- [ ] Supabase DB 스키마 + RLS 정책 적용
- [ ] 한국어 i18n 적용
- [ ] Vercel 배포 성공
- [ ] npm publish 성공 (npx cckit 사용 가능)

### 4.2 Quality Criteria

- [ ] TypeScript strict mode, 타입 에러 없음
- [ ] Zero lint errors (ESLint)
- [ ] 반응형 디자인 (모바일 breakpoint 대응)
- [ ] 빌드 시간 < 60초

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Supabase 무료 티어 제한 (DB 500MB, API rate limit) | Medium | Medium | MVP 단계에서는 충분. 성장 시 Pro 플랜 전환 |
| GitHub API rate limit (비인증 60req/h) | High | Medium | Supabase에 파일 트리 캐싱, repo 분석은 등록 시 1회만 |
| Tailwind CSS 4 호환성 이슈 | Medium | Low | 문제 시 Tailwind v3으로 fallback |
| next-intl App Router 통합 이슈 | Medium | Low | 공식 가이드 따라 구현, 이슈 시 수동 라우팅 |
| CLI 크로스 플랫폼 이슈 (Windows path) | Medium | Medium | Node.js path 모듈 사용, 테스트 시 Windows 포함 |
| Hooks settings.json 병합 시 기존 설정 충돌 | High | Medium | 깊은 병합 + 백업 생성 + 충돌 시 사용자 확인 |

---

## 6. Architecture Considerations

### 6.1 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Monorepo 도구 | Turborepo, Nx, Lerna | Turborepo | pnpm workspace 네이티브 지원, 캐싱 빠름 |
| 프레임워크 | Next.js 15, Remix, Nuxt | Next.js 15 | App Router + Vercel 배포 최적화 |
| 스타일링 | Tailwind CSS 4, styled-components | Tailwind CSS 4 | 유틸리티 우선, 빌드 사이즈 작음 |
| DB/Auth | Supabase, Firebase, PlanetScale | Supabase | PostgreSQL + Auth + RLS 올인원, 무료 티어 충분 |
| i18n | next-intl, next-i18next | next-intl | App Router 네이티브 지원 |
| CLI 프레임워크 | Commander.js, yargs, oclif | Commander.js | 가볍고 직관적, npx 실행에 적합 |
| 패키지 매니저 | pnpm, yarn, npm | pnpm | workspace 지원 우수, 디스크 절약 |
| 검색 | Supabase FTS, Algolia | Supabase FTS (MVP) | MVP에 추가 서비스 불필요, Algolia는 확장 시 |

### 6.2 프로젝트 구조

```
cckit/
├── apps/
│   ├── web/          # Next.js 15 웹사이트
│   └── cli/          # npx cckit CLI 도구
├── packages/
│   └── shared/       # 공유 타입/유틸 (Kit, API 타입, kit.yaml 검증)
├── supabase/
│   └── schema.sql    # 참조용 스키마 문서
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### 6.3 데이터 흐름

```
[사용자] → npx cckit install <slug>
              ↓
[CLI] → GET /api/kits/<slug> (킷 메타 + 파일 목록)
              ↓
[CLI] → GitHub Raw URL에서 파일 다운로드
              ↓
[CLI] → 로컬 프로젝트에 파일 배치
         • Skills → .claude/skills/
         • Hooks → .claude/settings.json (병합)
         • Agents → .claude/agents/
         • CLAUDE.md → ./CLAUDE.md
              ↓
[CLI] → POST /api/kits/<slug>/install (설치 수 증가)
```

---

## 7. Implementation Phases

### Phase 1-0: 프로젝트 초기 세팅
1. [ ] Monorepo 초기화 (pnpm workspace + Turborepo)
2. [ ] Next.js 15 웹앱 초기화 (App Router + TypeScript + Tailwind CSS 4)
3. [ ] Supabase 연동 (클라이언트 + 참조용 스키마)
4. [ ] GitHub OAuth 인증
5. [ ] 공유 패키지 세팅 (types + validators)

### Phase 1-1: 랜딩 페이지
6. [ ] 글로벌 레이아웃 + 네비게이션 (다크 테마)
7. [ ] 랜딩 페이지 구현 (Hero + 통계 + 인기 킷 + CTA)

### Phase 1-2: 킷 목록/상세
8. [ ] 킷 API (목록 + 상세 + 검색)
9. [ ] 킷 탐색 페이지
10. [ ] 킷 상세 페이지 (파일 트리 + Hook 다이어그램)

### Phase 1-3: CLI 도구
11. [ ] CLI 프로젝트 초기화 (Commander.js)
12. [ ] install 명령어 구현
13. [ ] search / list 명령어

### Phase 1-4: 시드 데이터
14. [ ] spring-boot-enterprise 시드 킷 작성
15. [ ] DB 시드 데이터

### Phase 1-5: 배포
16. [ ] Vercel 배포
17. [ ] CLI npm 배포

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`/pdca design cckit-mvp`)
2. [ ] 각 Sub-phase별 세부 설계 진행
3. [ ] 구현 시작 (`/pdca do cckit-mvp`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-25 | Initial draft — MVP 전체 범위 기획 | CCKit Team |
