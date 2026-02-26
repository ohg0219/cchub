# cckit-deploy Planning Document

> **Summary**: CCKit 배포 — Vercel (웹) + npm publish (CLI)
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Parent**: cckit-mvp (Phase 1-5)
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

CCKit 웹사이트를 Vercel에 배포하고 CLI 도구를 npm에 배포한다.
`npx cckit` 명령어가 전 세계 어디서나 동작하는 상태를 MVP 완료 기준으로 삼는다.

### 1.2 Background

- cckit-landing, cckit-explore, cckit-cli, cckit-seed 완료 후 진행
- Vercel은 Next.js 공식 배포 플랫폼, 무료 플랜으로 MVP 충분
- CLI npm 배포 후 `npx cckit install <slug>` 명령어로 E2E 검증

### 1.3 Related Documents

- 상위 기획: `docs/01-plan/features/cckit-mvp.plan.md`
- CLI 기획: `docs/01-plan/features/cckit-cli.plan.md`

---

## 2. Scope

### 2.1 In Scope

- [ ] Vercel 프로젝트 연결 + 환경 변수 설정
- [ ] `pnpm build` 성공 확인 후 Vercel 배포
- [ ] Custom domain 설정 (선택, cckit.dev 등)
- [ ] CLI `package.json` 배포 준비 (bin, main, types, engines)
- [ ] `npm publish` (또는 초기에는 `--dry-run` 확인 후 실제 배포)
- [ ] 배포 후 E2E 검증 (웹 접속 + `npx cckit install` 동작)
- [ ] 환경 변수 문서화 (`.env.local.example` 최종화)

### 2.2 Out of Scope

- CI/CD 파이프라인 자동화 (Phase 2)
- 스테이징 환경 분리 (Phase 2)
- CDN 최적화, Edge Functions (Phase 2)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Vercel 프로젝트 생성 + GitHub repo 연결 | High | Pending |
| FR-02 | Vercel 환경 변수 설정 (Supabase URL/KEY, GitHub OAuth) | High | Pending |
| FR-03 | `pnpm build` 오류 없이 성공 | High | Pending |
| FR-04 | Vercel 배포 성공 (프리뷰 URL 정상 동작) | High | Pending |
| FR-05 | CLI `package.json` — `bin`, `main`, `engines` 정비 | High | Pending |
| FR-06 | `npm publish` 성공, `npx cckit --help` 동작 | High | Pending |
| FR-07 | 배포 후 E2E — 랜딩→탐색→상세→CLI 설치 흐름 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | Vercel LCP < 3초 (실제 배포 환경) | Lighthouse (프로덕션) |
| Security | 환경 변수 노출 없음 | Vercel 대시보드 확인 |
| Availability | Vercel 무료 플랜 업타임 99%+ | 모니터링 불필요 (MVP) |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `https://cckit.vercel.app` (또는 커스텀 도메인) 접속 정상
- [ ] GitHub OAuth 로그인 프로덕션 환경에서 정상
- [ ] `npx cckit install spring-boot-enterprise` 프로덕션 API 대상으로 성공
- [ ] npm 패키지 `cckit` 배포 완료

### 4.2 Quality Criteria

- [ ] Lighthouse 성능 점수 80+
- [ ] 환경 변수 `.env.local.example` 최신화

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Vercel 빌드 실패 (모노레포 설정) | High | Medium | `turbo.json` + Vercel `rootDirectory` 설정 확인 |
| GitHub OAuth redirect URI 프로덕션 등록 누락 | High | Medium | GitHub OAuth App settings에 프로덕션 URL 등록 |
| npm 패키지명 `cckit` 이미 사용 중 | Medium | Medium | `@cckit/cli` 스코프 패키지로 대체 가능 |
| CLI가 프로덕션 API URL 하드코딩 | Medium | Low | 환경 변수 또는 config 파일로 관리 |

---

## 6. Architecture Considerations

### 6.1 Vercel 설정

```json
// vercel.json (루트)
{
  "buildCommand": "pnpm --filter web build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install"
}
```

### 6.2 CLI package.json 주요 설정

```json
{
  "name": "cckit",
  "bin": { "cckit": "./dist/index.js" },
  "engines": { "node": ">=18" },
  "files": ["dist/"]
}
```

---

## 7. Next Steps

1. [ ] cckit-landing, cckit-explore, cckit-cli, cckit-seed 완료 후 진행
2. [ ] Vercel 계정 준비 + GitHub repo public 확인
3. [ ] npm 계정 준비 + 패키지명 `cckit` 가용 여부 확인

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft — cckit-mvp Phase 1-5 분리 | CCKit Team |
