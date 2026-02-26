# cckit-landing Planning Document

> **Summary**: CCKit 글로벌 레이아웃 + 랜딩 페이지 구현 (Hero/통계/인기킷/CTA)
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Parent**: cckit-mvp (Phase 1-1)
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

CCKit 웹사이트의 첫인상을 결정하는 글로벌 레이아웃과 랜딩 페이지를 구현한다.
방문자가 CCKit의 가치를 즉시 이해하고, 킷 탐색 또는 GitHub OAuth 로그인으로 자연스럽게 유도되어야 한다.

### 1.2 Background

- 인증(`cckit-auth`)과 모노레포 세팅(`cckit-setup`)이 완료된 상태
- 글로벌 레이아웃(네비게이션 포함)은 모든 페이지에서 공유
- 랜딩 페이지는 마켓플레이스의 핵심 마케팅 채널

### 1.3 Related Documents

- 상위 기획: `docs/archive/2026-02/cckit-mvp` (cckit-mvp.plan.md)
- UI 와이어프레임: `project-plan/wireframe.html`
- i18n 메시지: `apps/web/src/messages/ko.json`

---

## 2. Scope

### 2.1 In Scope

- [ ] 글로벌 레이아웃 (`[locale]/layout.tsx`): 다크 테마 + GlobalNav (이미 통합됨, 개선)
- [ ] 랜딩 페이지 Hero 섹션: 메인 카피 + CTA 버튼 (탐색하기, GitHub 로그인)
- [ ] 통계 섹션: 전체 킷 수, 설치 수, 카테고리 수 (Supabase 실시간 조회)
- [ ] 인기 킷 섹션: 설치 수 상위 6개 킷 카드 미리보기
- [ ] CTA 섹션: CLI 설치 명령어 복사 블록 (`npx cckit install <slug>`)
- [ ] 푸터: 링크 + 저작권
- [ ] i18n 한국어 문자열 (`ko.json`)

### 2.2 Out of Scope

- 킷 상세 페이지 (cckit-explore에서 담당)
- 킷 검색 기능 (cckit-explore)
- 킷 등록 폼 (Phase 2)
- 애니메이션/모션 (MVP 이후)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 글로벌 네비게이션 — 로고, 탐색 링크, 로그인/유저메뉴 | High | Pending |
| FR-02 | Hero 섹션 — 헤드라인, 서브카피, CTA 버튼 2개 | High | Pending |
| FR-03 | 통계 섹션 — 킷 수/설치 수/카테고리 수 (Supabase API) | High | Pending |
| FR-04 | 인기 킷 카드 6개 — 이름/설명/카테고리/설치 수 표시 | High | Pending |
| FR-05 | CLI 설치 블록 — 명령어 복사 버튼 | High | Pending |
| FR-06 | 푸터 — GitHub 링크, 문서 링크, 저작권 | Medium | Pending |
| FR-07 | 한국어 i18n 적용 (하드코딩 금지) | High | Pending |
| FR-08 | 반응형 레이아웃 (모바일/태블릿/데스크톱) | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | LCP < 3초 (인기 킷 SSR) | Lighthouse |
| Accessibility | 시맨틱 HTML, 키보드 포커스 | Manual review |
| SEO | `<title>`, `<meta description>`, OG 태그 | Lighthouse |
| Responsiveness | 375px ~ 1440px 정상 렌더링 | Chrome DevTools |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 글로벌 레이아웃 모든 페이지에 적용
- [ ] 랜딩 페이지 Hero → 인기 킷 → CTA 섹션 정상 렌더링
- [ ] 통계 수치 Supabase 실제 데이터 반영
- [ ] 인기 킷 카드 6개 표시
- [ ] CLI 복사 버튼 동작
- [ ] 모바일(375px) 레이아웃 이상 없음
- [ ] 한국어 i18n 문자열 ko.json 분리

### 4.2 Quality Criteria

- [ ] TypeScript strict mode, 타입 에러 없음
- [ ] Tailwind utility classes만 사용 (inline styles 금지)
- [ ] Zero lint errors

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 인기 킷 데이터 없음 (시드 미완성 시) | Medium | High | 시드 킷 없으면 빈 상태 UI (Empty State) 처리 |
| Supabase 통계 API 응답 지연 | Low | Low | SSR + revalidate 600 캐싱 |
| Tailwind CSS 4 다크 테마 설정 이슈 | Medium | Low | `dark:` 클래스 + CSS 변수 조합 |

---

## 6. Architecture Considerations

### 6.1 Key Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 통계/인기 킷 렌더링 | SSR (Server Component) | SEO + 초기 로드 성능 |
| CLI 복사 블록 | Client Component (`use client`) | 클립보드 API 필요 |
| 스타일링 | Tailwind CSS 4 | 프로젝트 표준 |
| i18n | next-intl `useTranslations` | 프로젝트 표준 |

### 6.2 주요 파일

```
apps/web/src/
├── app/[locale]/
│   ├── layout.tsx          # 글로벌 레이아웃 (이미 존재, 개선)
│   └── page.tsx            # 랜딩 페이지
├── components/
│   ├── global-nav.tsx      # 이미 존재
│   ├── kit-card.tsx        # 킷 카드 (신규)
│   ├── cli-block.tsx       # CLI 복사 블록 (신규)
│   └── stats-section.tsx   # 통계 섹션 (신규)
└── messages/
    └── ko.json             # 한국어 문자열 추가
```

---

## 7. Next Steps

1. [ ] Design 문서 작성 (`/pdca design cckit-landing`)
2. [ ] Supabase API 응답 타입 확인 (kits, install_count)
3. [ ] 구현 시작 (`/pdca do cckit-landing`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft — cckit-mvp Phase 1-1 분리 | CCKit Team |
