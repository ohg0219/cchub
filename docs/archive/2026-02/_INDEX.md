# Archive Index — 2026-02

| Feature | Match Rate | Iterations | 완료일 | 아카이브 경로 |
|---------|-----------|-----------|--------|--------------|
| [cckit-setup](cckit-setup/) | 92% | 0 | 2026-02-26 | `docs/archive/2026-02/cckit-setup/` |
| [cckit-auth](cckit-auth/) | 95% | 1 | 2026-02-26 | `docs/archive/2026-02/cckit-auth/` |
| [cckit-landing](cckit-landing/) | 97% | 0 | 2026-02-26 | `docs/archive/2026-02/cckit-landing/` |
| [cckit-explore](cckit-explore/) | 97% | 0 | 2026-02-26 | `docs/archive/2026-02/cckit-explore/` |
| [cckit-cli](cckit-cli/) | 96% | 0 | 2026-02-26 | `docs/archive/2026-02/cckit-cli/` |
| [cckit-seed](cckit-seed/) | 95% | 0 | 2026-02-26 | `docs/archive/2026-02/cckit-seed/` |
| [cchub-rename](cchub-rename/) | 98% | 0 | 2026-02-26 | `docs/archive/2026-02/cchub-rename/` |
| [cchub-features](cchub-features/) | 92% | 0 | 2026-02-26 | `docs/archive/2026-02/cchub-features/` |
| [cchub-overhaul](cchub-overhaul/) | 90% | 0 | 2026-02-26 | `docs/archive/2026-02/cchub-overhaul/` |

## cchub-overhaul 요약

- **범위**: 로그인 완전 제거(Supabase Auth/OAuth), 공개 마켓플레이스 전환, GitHub 인덱싱 시드 스크립트, 콘텐츠 뱃지 UI
- **결과**: FR 10/10, 추가 구현(Commands 탐색/콘텐츠 뱃지), Warning 3건 수정, Match Rate 90%, Act 스킵
- **문서**:
  - [Plan](cchub-overhaul/cchub-overhaul.plan.md)
  - [Design](cchub-overhaul/cchub-overhaul.design.md)
  - [Analysis](cchub-overhaul/cchub-overhaul.analysis.md)
  - [Report](cchub-overhaul/cchub-overhaul.report.md)

## cchub-features 요약

- **범위**: 로그인 UI 페이지, 킷 등록 페이지(SubmitForm), GitHub repo 분석 API, POST /api/kits 핸들러, middleware 인증 경로 분리
- **결과**: FR 8/8, Critical 0건, Warning 2건, Match Rate 92%, Act 스킵
- **문서**:
  - [Plan](cchub-features/cchub-features.plan.md)
  - [Design](cchub-features/cchub-features.design.md)
  - [Analysis](cchub-features/cchub-features.analysis.md)
  - [Report](cchub-features/cchub-features.report.md)

## cchub-rename 요약

- **범위**: 모노레포 전체 패키지 스코프 `@cckit/*` → `@cchub/*`, bin `cckit` → `cchub`, 브랜드 텍스트 CCKit → CCHub
- **결과**: FR 10/10, 수정 파일 18개, grep 잔존 0건, Match Rate 98%, Act 스킵
- **문서**:
  - [Plan](cchub-rename/cchub-rename.plan.md)
  - [Design](cchub-rename/cchub-rename.design.md)
  - [Analysis](cchub-rename/cchub-rename.analysis.md)
  - [Report](cchub-rename/cchub-rename.report.md)

## cckit-cli 요약

- **범위**: npx cckit install/search/list CLI 도구 — GitHub Raw 파일 다운로드, settings.json 딥 머지, 설치 추적
- **결과**: FR 10/10, Critical 0건, Warning 3건 수정, Match Rate 96%, Act 스킵
- **문서**:
  - [Plan](cckit-cli/cckit-cli.plan.md)
  - [Design](cckit-cli/cckit-cli.design.md)
  - [Analysis](cckit-cli/cckit-cli.analysis.md)
  - [Report](cckit-cli/cckit-cli.report.md)

## cckit-seed 요약

- **범위**: 시드 킷 3종(cckit-starter/spring-boot-enterprise/nextjs-fullstack) + supabase/seed.sql
- **결과**: 필수 파일 29/29 구현, Critical 0건, Match Rate 95%, Act 스킵
- **문서**:
  - [Plan](cckit-seed/cckit-seed.plan.md)
  - [Design](cckit-seed/cckit-seed.design.md)
  - [Analysis](cckit-seed/cckit-seed.analysis.md)
  - [Report](cckit-seed/cckit-seed.report.md)

## cckit-setup 요약

- **범위**: pnpm Monorepo + Turborepo + Next.js 15 + Supabase SSR + GitHub OAuth + 공유 패키지
- **결과**: FR 10/10, NFR 5/5, Critical 0건, Match Rate 92%
- **문서**:
  - [Plan](cckit-setup/cckit-setup.plan.md)
  - [Design](cckit-setup/cckit-setup.design.md)
  - [Analysis](cckit-setup/cckit-setup.analysis.md)
  - [Report](cckit-setup/cckit-setup.report.md)

## cckit-explore 요약

- **범위**: 킷 탐색/검색 페이지 + 킷 상세 페이지 + REST API 3개 (목록/상세/설치 수)
- **결과**: FR 10/10, Critical 0건, Match Rate 97%, Act 스킵
- **문서**:
  - [Plan](cckit-explore/cckit-explore.plan.md)
  - [Design](cckit-explore/cckit-explore.design.md)
  - [Analysis](cckit-explore/cckit-explore.analysis.md)
  - [Report](cckit-explore/cckit-explore.report.md)

## cckit-auth 요약

- **범위**: GitHub OAuth + Supabase Auth SSR + GlobalNav/LoginButton/UserMenu 컴포넌트
- **결과**: Match Rate 95%, 1회 이터레이션 후 최종 달성
- **문서**:
  - [Plan](cckit-auth/cckit-auth.plan.md)
  - [Design](cckit-auth/cckit-auth.design.md)
  - [Analysis](cckit-auth/cckit-auth.analysis.md)
  - [Report](cckit-auth/cckit-auth.report.md)
