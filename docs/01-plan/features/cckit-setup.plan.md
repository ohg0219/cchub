# cckit-setup Planning Document

> **Summary**: pnpm Monorepo + Turborepo + Next.js 15 + Supabase + GitHub OAuth + 공유 패키지 초기 세팅
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Status**: Draft
> **Parent**: [cckit-mvp.plan.md](cckit-mvp.plan.md) — Phase 1-0

---

## 1. Overview

### 1.1 Purpose

CCKit 전체 프로젝트의 기반이 되는 모노레포 구조를 수립하고, 웹(Next.js 15)과 CLI가 공유할 타입/유틸 패키지를 구성한다.
또한 Supabase 연동(DB 스키마 + Auth)과 GitHub OAuth를 설정해 이후 모든 기능 개발의 토대를 만든다.

### 1.2 Background

- 웹(`apps/web`)과 CLI(`apps/cli`)가 같은 Kit/API 타입을 사용해야 타입 불일치 버그가 없음
- Turborepo 캐싱으로 빌드 속도를 확보해야 이후 CI/CD에서 불필요한 재빌드를 막을 수 있음
- Supabase Auth(GitHub OAuth)를 초반에 세팅하지 않으면 이후 킷 등록/수정 기능 개발 시 인증이 없어 API를 만들 수 없음

### 1.3 Related Documents

- 상위 계획: `docs/01-plan/features/cckit-mvp.plan.md`
- 전체 아키텍처: `docs/02-design/features/cckit-mvp.design.md`
- DB 스키마 참조: `supabase/schema.sql` (작성 예정)
- kit.yaml 스펙: `project-plan/kit-spec.md`

---

## 2. Scope

### 2.1 In Scope

- [ ] 루트 pnpm workspace + Turborepo 설정
- [ ] `packages/shared` — Kit/API TypeScript 타입 + zod kit.yaml 유효성 검사기
- [ ] `apps/web` — Next.js 15 App Router + TypeScript + Tailwind CSS 4 초기화
- [ ] `apps/cli` — Commander.js CLI 패키지 골격 (빈 명령어 구조만)
- [ ] Supabase 클라이언트 설정 (`lib/supabase/client.ts`, `server.ts`, `middleware.ts`)
- [ ] `supabase/schema.sql` 작성 (참조용)
- [ ] Supabase 대시보드에서 DB 스키마 + RLS 정책 실행
- [ ] GitHub OAuth 설정 (Supabase Auth + `/auth/callback` 라우트)
- [ ] next-intl 기본 설정 + `messages/ko.json` 뼈대

### 2.2 Out of Scope

- 실제 페이지 UI 구현 (랜딩, 탐색, 상세) — cckit-landing, cckit-kits에서
- API Route Handler 구현 — cckit-kits에서
- CLI 명령어 실제 구현 — cckit-cli에서
- 시드 데이터 입력 — cckit-seed에서
- Vercel/npm 배포 — cckit-deploy에서

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `pnpm install` 한 번으로 web/cli/shared 의존성 모두 설치 | High | Pending |
| FR-02 | `pnpm dev`로 web 개발 서버 정상 구동 (localhost:3000) | High | Pending |
| FR-03 | `packages/shared` 타입을 web/cli에서 import 가능 | High | Pending |
| FR-04 | Supabase 클라이언트가 환경변수로 초기화되고 DB 쿼리 성공 | High | Pending |
| FR-05 | GitHub OAuth 로그인 → 콜백 → 세션 저장 → 리다이렉트 정상 동작 | High | Pending |
| FR-06 | Supabase `profiles`, `kits`, `kit_reviews`, `kit_installs` 테이블 생성 + RLS 활성화 | High | Pending |
| FR-07 | `pnpm --filter web build` 빌드 성공 (타입 에러 없음) | High | Pending |
| FR-08 | `turbo build` 실행 시 캐시 hit 동작 확인 | Medium | Pending |
| FR-09 | next-intl 설정 완료, 한국어 문자열 하드코딩 없이 `t('key')` 방식으로 동작 | Medium | Pending |
| FR-10 | `apps/cli` 패키지 빌드 성공 (`pnpm --filter cli build`) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Build | `pnpm build` 성공, TypeScript strict 에러 없음 | `tsc --noEmit` |
| Build | 초기 빌드 시간 < 60초 | `time pnpm build` |
| Security | 환경변수 `.env.local`이 `.gitignore`에 포함 | `git status` 확인 |
| Security | `SUPABASE_SERVICE_ROLE_KEY` 클라이언트 코드에 미노출 | 코드 리뷰 |
| DX | `pnpm dev` 후 HMR 동작 확인 | 브라우저 직접 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `pnpm install` 성공 (모든 패키지)
- [ ] `pnpm --filter web dev` → 브라우저에서 Next.js 기본 페이지 열림
- [ ] `packages/shared`의 `KitListItem` 타입을 `apps/web`에서 import 가능
- [ ] Supabase 대시보드에 `kits` 테이블 생성 + RLS 정책 확인
- [ ] GitHub OAuth 로그인 → `profiles` 테이블에 레코드 생성 확인
- [ ] `/auth/callback` 라우트에서 세션 처리 후 `/`로 리다이렉트 성공
- [ ] `.env.local.example` 파일 작성 (실제 값 없이 키만)
- [ ] `pnpm --filter web build` 타입 에러 없이 성공

### 4.2 Quality Criteria

- [ ] TypeScript strict mode, 타입 에러 0개
- [ ] ESLint 에러 0개
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 등 시크릿이 git에 커밋되지 않음
- [ ] 모든 한국어 문자열이 `messages/ko.json`에 있고 하드코딩 없음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Tailwind CSS 4 + Next.js 15 초기 설정 호환 이슈 | Medium | Medium | `@tailwindcss/vite` 대신 PostCSS 방식 먼저 시도, 실패 시 Tailwind v3 fallback |
| next-intl App Router 미들웨어 설정 복잡 | Medium | Low | 공식 `next-intl` App Router 가이드 그대로 따르기, locale 없는 라우트 예외 처리 |
| Supabase Auth 쿠키 기반 SSR 세션 설정 복잡 | High | Medium | `@supabase/ssr` 패키지 공식 Next.js 가이드 사용, `createServerClient` 패턴 |
| pnpm workspace 내 패키지 간 타입 resolve 실패 | Medium | Low | `packages/shared`에 `exports` 필드 명시, `tsconfig.json`에 `paths` 설정 |
| GitHub OAuth 콜백 URL 미스매치 | Low | Medium | Supabase 대시보드 URL 설정과 `.env.local`의 `NEXT_PUBLIC_BASE_URL` 일치 확인 |

---

## 6. Architecture Considerations

### 6.1 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 패키지 매니저 | npm, yarn, pnpm | pnpm | workspace 지원 우수, 디스크 절약, Turborepo 궁합 |
| 모노레포 빌드 | Turborepo, Nx, Lerna | Turborepo | pnpm workspace 네이티브 지원, 설정 간단 |
| Next.js 라우터 | Pages Router, App Router | App Router | Server Components로 SEO + 성능 최적화 |
| Supabase 클라이언트 | `@supabase/supabase-js`, `@supabase/ssr` | `@supabase/ssr` | Next.js SSR 쿠키 세션 공식 지원 |
| i18n | next-intl, next-i18next | next-intl | App Router 네이티브 지원, 서버 컴포넌트 호환 |
| 스타일링 | Tailwind CSS 3, Tailwind CSS 4 | Tailwind CSS 4 | CSS 변수 기반 테마, Vite 통합 |
| 유효성 검사 | zod, yup, valibot | zod | TypeScript 타입 추론 우수, 생태계 표준 |

### 6.2 패키지 구조

```
cckit/
├── package.json              # 루트 (workspaces 선언)
├── pnpm-workspace.yaml       # pnpm workspace 설정
├── turbo.json                # Turborepo 파이프라인
├── .env.local.example        # 환경변수 예시
├── apps/
│   ├── web/
│   │   ├── package.json      # next, @supabase/ssr, next-intl
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── src/
│   │       ├── app/
│   │       │   ├── [locale]/
│   │       │   │   └── layout.tsx   # 루트 레이아웃 (뼈대)
│   │       │   └── api/
│   │       │       └── auth/callback/route.ts
│   │       ├── lib/supabase/
│   │       │   ├── client.ts        # createBrowserClient
│   │       │   ├── server.ts        # createServerClient
│   │       │   └── middleware.ts    # 세션 갱신
│   │       ├── middleware.ts        # next-intl + supabase 미들웨어 체인
│   │       └── messages/
│   │           └── ko.json          # 빈 객체로 시작
│   └── cli/
│       ├── package.json      # commander, chalk, inquirer
│       ├── tsconfig.json
│       └── src/
│           └── index.ts      # 빈 Commander.js 프로그램
└── packages/
    └── shared/
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── types/
            │   ├── kit.ts           # KitListItem, KitDetail 등
            │   └── api.ts           # ApiResponse, KitsListQuery
            └── validators/
                └── kit-yaml.ts      # zod KitYaml 스키마
```

---

## 7. Implementation Tasks

1. [ ] 루트 `package.json` + `pnpm-workspace.yaml` + `turbo.json` 작성
2. [ ] `packages/shared` — `package.json`, `tsconfig.json`, Kit/API 타입, zod 검증기
3. [ ] `apps/web` — `create-next-app` + TypeScript + Tailwind CSS 4
4. [ ] `apps/web` — `@supabase/ssr` 설치 + `lib/supabase/client.ts`, `server.ts`, `middleware.ts`
5. [ ] `apps/web` — `next-intl` 설치 + `middleware.ts` + `messages/ko.json`
6. [ ] `apps/cli` — `package.json` + Commander.js 골격
7. [ ] `supabase/schema.sql` 작성
8. [ ] Supabase 대시보드 — SQL 실행 (테이블 + RLS)
9. [ ] Supabase 대시보드 — GitHub OAuth 앱 등록 + Provider 설정
10. [ ] `apps/web` — `/api/auth/callback/route.ts` 구현
11. [ ] `.env.local.example` + `.gitignore` 확인
12. [ ] `pnpm build` 전체 빌드 성공 확인

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`/pdca design cckit-setup`)
2. [ ] 구현 시작 (`/pdca do cckit-setup`)
3. [ ] 빌드 성공 + OAuth 동작 확인 후 커밋 + 푸시

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft — Phase 1-0 초기 세팅 범위 정의 | CCKit Team |
