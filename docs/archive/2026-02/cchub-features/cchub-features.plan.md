# cchub-features Planning Document

> **Summary**: 배포 전 미구현 기능 완성 — 로그인 UI, 킷 등록, GitHub API
>
> **Project**: CCKit (→ cchub)
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Predecessor**: cchub-rename (완료 후 진행)
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

배포 전 누락된 3가지 핵심 기능을 완성한다:
1. 로그인 UI 페이지 (OAuth 진입점)
2. 킷 등록 페이지 (submit)
3. GitHub repo 분석 API

### 1.2 Background

- `auth/login`, `auth/callback`, `auth/logout` 라우트는 구현되어 있으나
  사용자가 진입하는 **로그인 UI 페이지**(`/auth/login` 또는 `/(locale)/auth/login`)가 없음
- `submit/` 페이지는 GlobalNav에 링크가 있으나 실제 페이지 미구현
- `api/github/` API는 submit 페이지의 GitHub URL 분석에 필요

### 1.3 Related Documents

- 선행: `cchub-rename.plan.md`
- 후속: `cchub-deploy.plan.md`

---

## 2. Scope

### 2.1 In Scope

**로그인 UI 페이지**
- [ ] `apps/web/src/app/[locale]/auth/login/page.tsx` — GitHub 로그인 버튼 + 안내 문구

**킷 등록 페이지**
- [ ] `apps/web/src/app/[locale]/submit/page.tsx` — GitHub URL 입력 폼
- [ ] GitHub URL 입력 → `api/github/` 호출 → 메타데이터 자동 채우기
- [ ] 폼 제출 → `POST /api/kits` → 성공 시 킷 상세 페이지 리다이렉트
- [ ] 로그인 필요 시 로그인 페이지로 리다이렉트

**GitHub repo 분석 API**
- [ ] `apps/web/src/app/api/github/route.ts`
  - `GET /api/github?url={githubUrl}` 엔드포인트
  - GitHub Contents API로 파일 목록 조회
  - `kit.yaml` 존재 시 파싱하여 메타데이터 추출
  - `README.md` 첫 단락 요약 추출
  - 응답: `{ name, description, files, hasKitYaml, skills, hooks, agents }`

**i18n**
- [ ] `ko.json`, `en.json`에 submit/login 관련 메시지 키 추가

### 2.2 Out of Scope

- 킷 수정/삭제 기능 (Phase 2)
- 이미지 업로드 (Phase 2)
- `my-kits` 페이지 (Phase 2, UserMenu에 링크만 존재)
- GitHub App 연동 (웹훅 기반 자동 갱신) — Phase 2

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 로그인 페이지 UI — GitHub OAuth 버튼, 비로그인 안내 | High | Pending |
| FR-02 | 로그인 페이지 — 로그인 후 `next` 파라미터로 원래 페이지 복귀 | Medium | Pending |
| FR-03 | submit 페이지 — GitHub URL 입력 + 자동 메타데이터 추출 | High | Pending |
| FR-04 | submit 페이지 — 로그인 상태 확인, 미로그인 시 `/auth/login?next=/submit` 리다이렉트 | High | Pending |
| FR-05 | submit 페이지 — 폼 제출 후 킷 상세 페이지 이동 | High | Pending |
| FR-06 | `GET /api/github` — GitHub URL 파싱 + Contents API 호출 | High | Pending |
| FR-07 | `GET /api/github` — `kit.yaml` 파싱 (없으면 기본값) | Medium | Pending |
| FR-08 | i18n 키 추가 (submit, login 관련) | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 보안 | submit은 인증된 사용자만 접근 | 서버 컴포넌트에서 세션 확인 |
| 보안 | GitHub API 호출 시 SSRF 방지 (github.com 도메인만 허용) | URL 검증 로직 |
| UX | GitHub URL 입력 후 1~2초 내 메타데이터 자동 채우기 | 체감 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `/auth/login` 접속 시 GitHub 로그인 버튼 표시
- [ ] 비로그인 상태에서 `/submit` 접속 시 로그인 페이지로 리다이렉트
- [ ] GitHub repo URL 입력 후 킷 이름/설명 자동 채워짐
- [ ] 킷 등록 완료 후 `/kit/[slug]` 페이지 이동
- [ ] `pnpm build` 성공

### 4.2 Quality Criteria

- [ ] TypeScript strict 오류 없음
- [ ] i18n 하드코딩 문자열 없음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| GitHub API rate limit (미인증 60 req/h) | Medium | Medium | 서버에서 GITHUB_TOKEN 환경 변수로 인증 헤더 추가 |
| `kit.yaml` 없는 repo 등록 시 메타데이터 부족 | Low | High | 기본값 제공 + 사용자가 수동 입력 가능하도록 폼 편집 허용 |
| Supabase kits 테이블 스키마 미확인 | Medium | Low | POST /api/kits 라우트 확인 후 맞춰서 구현 |

---

## 6. Architecture Considerations

### 6.1 로그인 페이지 구조

```
/[locale]/auth/login/page.tsx  (Server Component)
  - 이미 로그인된 경우 / 로 리다이렉트
  - LoginButton 컴포넌트 재사용
  - next 쿼리 파라미터를 /auth/login route에 전달
```

### 6.2 submit 페이지 플로우

```
GET /[locale]/submit
  → 서버: getUser() 확인
  → 미로그인: redirect('/auth/login?next=/submit')
  → 로그인: SubmitForm 컴포넌트 렌더링

SubmitForm (Client Component)
  → GitHub URL 입력 → debounce → GET /api/github?url=...
  → 응답으로 name/description/tags 자동 채우기
  → 사용자 수정 가능
  → 제출 → POST /api/kits → redirect /kit/[slug]
```

### 6.3 api/github 응답 스펙

```typescript
// GET /api/github?url=https://github.com/owner/repo
{
  name: string;           // repo name or kit.yaml name
  description: string;   // repo description or kit.yaml description
  hasKitYaml: boolean;
  skills: string[];       // .claude/skills/ 파일 목록
  hooks: string[];        // .claude/hooks/ 파일 목록
  agents: string[];       // .claude/agents/ 파일 목록
  readmeSummary: string;  // README 첫 단락
}
```

---

## 7. Next Steps

1. [ ] `cchub-rename` 완료 후 진행
2. [ ] Design 문서 작성
3. [ ] 후속 feature: `cchub-deploy`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | cckit-deploy에서 분리 — 미구현 기능 단독 feature | CCKit Team |
