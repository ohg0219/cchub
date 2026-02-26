# cchub-deploy Planning Document

> **Summary**: Vercel 웹 배포 + npm CLI 배포 + E2E 검증
>
> **Project**: CCKit (→ cchub)
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Predecessor**: cchub-features (완료 후 진행)
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

cchub-rename, cchub-features가 완료된 코드베이스를 실제 프로덕션에 배포한다.
`https://cchub.vercel.app` 접속과 `npx cchub install` 명령어가
전 세계 어디서나 동작하는 상태를 MVP 완료 기준으로 삼는다.

### 1.2 Background

- 선행 feature 완료 후 코드는 100% 준비된 상태
- Vercel은 Next.js 공식 플랫폼, 무료 플랜으로 MVP 충분
- npm `cchub` 패키지명 가용 확인 완료 (404)
- `@cchub` npm org 생성 필요 (scoped 패키지 publish 전제)

### 1.3 Related Documents

- 선행: `cchub-rename.plan.md`, `cchub-features.plan.md`
- 상위: `cckit-mvp.plan.md`

---

## 2. Scope

### 2.1 In Scope

**배포 사전 준비 (코드)**
- [ ] `vercel.json` 생성 — 모노레포 빌드 설정
- [ ] `.env.local.example` 최종화 (GITHUB_CLIENT_ID/SECRET, GITHUB_TOKEN 추가)
- [ ] CLI `package.json` — `files`, `publishConfig` 정비
- [ ] `pnpm build` (web + cli) 최종 성공 확인

**Vercel 배포 (대시보드)**
- [ ] Vercel 프로젝트 생성 + GitHub repo 연결
- [ ] 환경 변수 설정: SUPABASE URL/KEY, GITHUB OAuth, NEXT_PUBLIC_BASE_URL
- [ ] 첫 배포 실행 + 빌드 로그 확인
- [ ] 프리뷰 URL에서 기본 동작 확인

**GitHub OAuth 프로덕션 설정 (대시보드)**
- [ ] GitHub OAuth App → Callback URL에 프로덕션 URL 추가
- [ ] Supabase → GitHub Provider → Client ID/Secret 업데이트

**npm 배포**
- [ ] npm org `@cchub` 생성 (npmjs.com 대시보드)
- [ ] `npm publish --dry-run` 확인
- [ ] `npm publish` 실행
- [ ] `npx cchub --help` 동작 확인

**E2E 검증**
- [ ] 랜딩 페이지 로드
- [ ] GitHub 로그인 → 프로필 표시
- [ ] 킷 탐색 + 상세 페이지
- [ ] 킷 등록 (submit)
- [ ] `npx cchub install <slug>` 프로덕션 API 대상으로 성공

### 2.2 Out of Scope

- CI/CD 자동화 (GitHub Actions) — Phase 2
- 스테이징 환경 — Phase 2
- Custom domain (cchub.dev) — 배포 성공 후 별도 진행
- CDN 최적화, Edge Functions — Phase 2
- 모니터링/알림 설정 — Phase 2

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `vercel.json` — 모노레포 빌드 명령어 설정 | High | Pending |
| FR-02 | `.env.local.example` 최종화 | Medium | Pending |
| FR-03 | CLI `package.json` `files`, `publishConfig` 정비 | High | Pending |
| FR-04 | `pnpm build` 최종 성공 | High | Pending |
| FR-05 | Vercel 배포 성공 (프리뷰 URL 정상) | High | Pending |
| FR-06 | GitHub OAuth 프로덕션 URL 등록 | High | Pending |
| FR-07 | npm `@cchub/cli` publish 성공 | High | Pending |
| FR-08 | E2E 전체 흐름 통과 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | Vercel LCP < 3초 | Lighthouse 프로덕션 |
| Security | 환경 변수 노출 없음 | Vercel 대시보드 확인 |
| Availability | Vercel 무료 플랜 99%+ 업타임 | (MVP 단계 모니터링 생략) |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `https://cchub.vercel.app` 랜딩 페이지 정상 접속
- [ ] GitHub OAuth 로그인 프로덕션 환경에서 정상 동작
- [ ] `npx cchub install spring-boot-enterprise` 성공 (프로덕션 API)
- [ ] npm 페이지 `npmjs.com/package/@cchub/cli` 접근 가능

### 4.2 Quality Criteria

- [ ] Lighthouse 성능 점수 80+
- [ ] 환경 변수 `.env.local.example` 최신 상태

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Vercel 모노레포 빌드 실패 | High | Medium | `vercel.json` rootDirectory 또는 buildCommand 조정 |
| GitHub OAuth Callback URL 미등록 | High | Medium | 배포 URL 확정 후 즉시 등록 |
| npm `@cchub` org 생성 지연 | Medium | Low | unscoped `cchub` 패키지로 임시 publish 후 이전 |
| CLI `@cchub/shared` 워크스페이스 의존성 npm 배포 시 누락 | High | High | tsup으로 번들링하거나 shared 코드 인라인 |

---

## 6. Architecture Considerations

### 6.1 vercel.json

```json
{
  "buildCommand": "pnpm --filter web build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

### 6.2 CLI 빌드 번들링 문제 해결

`@cchub/shared`는 워크스페이스 패키지로 npm에 별도 배포되지 않음.
CLI 배포 시 두 가지 옵션:

**옵션 A (권장)**: tsup으로 번들링
```json
// apps/cli/package.json
"scripts": {
  "build": "tsup src/index.ts --format esm --dts --bundle"
}
```

**옵션 B**: `@cchub/shared`도 npm 배포
```
npm publish packages/shared → npm publish apps/cli
```

### 6.3 환경 변수 목록 (Vercel 설정 필요)

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (서버 전용) |
| `NEXT_PUBLIC_BASE_URL` | 프로덕션 URL (https://cchub.vercel.app) |
| `GITHUB_TOKEN` | GitHub API rate limit 우회 (선택) |

---

## 7. Next Steps

1. [ ] `cchub-features` 완료 확인
2. [ ] `vercel.json` + CLI 번들링 설정 (코드)
3. [ ] Vercel + npm 대시보드 작업 (수동)
4. [ ] E2E 검증

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | cckit-deploy에서 분리 — 순수 배포 단계 | CCKit Team |
