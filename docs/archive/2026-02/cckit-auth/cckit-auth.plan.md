# cckit-auth Planning Document

> **Summary**: GitHub OAuth + Supabase 인증 시스템 — 로그인/로그아웃, 세션 관리, profiles 테이블 연동
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Status**: Draft
> **Parent Plan**: [cckit-mvp.plan.md](cckit-mvp.plan.md)

---

## 1. Overview

### 1.1 Purpose

CCKit 웹사이트에서 GitHub OAuth를 통해 사용자를 인증하고, Supabase Auth와 연동하여 세션을 관리한다. 인증된 사용자만 킷 등록/수정/삭제가 가능하며, profiles 테이블에 GitHub 사용자 정보를 동기화한다.

### 1.2 Background

- Supabase Auth의 GitHub OAuth Provider를 활용하면 별도 인증 서버 없이 안전한 OAuth 플로우 구현 가능
- Next.js 15 App Router에서는 `@supabase/ssr` 패키지로 쿠키 기반 세션 관리
- RLS(Row Level Security)가 `auth.uid()`에 의존하므로, 올바른 세션 전달이 보안의 핵심

### 1.3 Related Documents

- MVP 설계: [cckit-mvp.design.md](../../02-design/features/cckit-mvp.design.md)
- Supabase 스키마: [supabase/schema.sql](../../../supabase/schema.sql)
- 프로젝트 설정: [cckit-setup (archived)](../../archive/2026-02/cckit-setup/)

---

## 2. Scope

### 2.1 In Scope

- [ ] Supabase Auth GitHub OAuth Provider 설정 (대시보드)
- [ ] `/auth/login` — GitHub OAuth 시작 엔드포인트
- [ ] `/auth/callback` — OAuth 콜백 처리 + 세션 생성
- [ ] `/auth/logout` — 로그아웃 + 세션 삭제
- [ ] `lib/supabase/middleware.ts` — 세션 갱신 미들웨어 (`next/server` middleware)
- [ ] `lib/supabase/server.ts` — 서버 컴포넌트용 Supabase 클라이언트 (쿠키 읽기)
- [ ] `lib/supabase/client.ts` — 클라이언트 컴포넌트용 Supabase 클라이언트
- [ ] `profiles` 테이블 Upsert — OAuth 콜백 시 `github_username`, `avatar_url` 동기화
- [ ] `GlobalNav` 인증 상태 반영 — 로그인/로그아웃 버튼, 아바타 표시

### 2.2 Out of Scope

- 이메일/패스워드 인증 (GitHub OAuth만 지원)
- 역할 기반 접근 제어 (RBAC) — MVP에서 저자/비저자만 구분
- 소셜 로그인 추가 (Google, Twitter 등)
- 사용자 프로필 편집 페이지

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | GitHub OAuth 로그인 버튼 클릭 시 GitHub 인증 페이지로 리다이렉트 | High | Pending |
| FR-02 | OAuth 콜백 후 Supabase 세션 생성 및 쿠키 저장 | High | Pending |
| FR-03 | 로그인 후 `profiles` 테이블에 사용자 정보 Upsert | High | Pending |
| FR-04 | 모든 페이지에서 세션 자동 갱신 (미들웨어) | High | Pending |
| FR-05 | 로그아웃 시 세션 삭제 + 홈으로 리다이렉트 | High | Pending |
| FR-06 | `GlobalNav`에서 로그인 상태에 따라 UI 분기 (아바타 vs 로그인 버튼) | Medium | Pending |
| FR-07 | 인증 필요 API 엔드포인트에서 미인증 시 401 반환 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Security | OAuth state 파라미터로 CSRF 방어 | Code review |
| Security | `SUPABASE_SERVICE_ROLE_KEY` 서버 전용 사용 | 환경변수 검사 |
| Security | 세션 쿠키 HttpOnly + Secure 속성 | 브라우저 DevTools |
| Performance | OAuth 콜백 처리 < 1초 | 수동 측정 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] GitHub OAuth 로그인 → 콜백 → 세션 생성 흐름 정상 동작
- [ ] `profiles` 테이블에 사용자 데이터 저장 확인 (Supabase 대시보드)
- [ ] 로그아웃 후 보호된 API 접근 시 401 반환
- [ ] 미들웨어가 모든 페이지에서 세션 갱신 동작
- [ ] `GlobalNav` 로그인/로그아웃 상태 전환 확인

### 4.2 Quality Criteria

- [ ] TypeScript strict mode, 타입 에러 없음
- [ ] 환경변수 누락 시 명확한 에러 메시지
- [ ] `pnpm build` 성공

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Supabase Auth GitHub Provider 설정 오류 | High | Low | 공식 문서 + 대시보드 Redirect URL 정확히 설정 |
| 개발/프로덕션 OAuth callback URL 불일치 | High | Medium | `.env.local`과 Vercel 환경변수 별도 관리 |
| 쿠키 기반 세션이 모바일에서 미작동 | Medium | Low | `@supabase/ssr` 공식 예제 그대로 사용 |
| profiles Upsert 시 RLS 정책 충돌 | Medium | Low | 콜백 라우트에서 service_role key 사용 |

---

## 6. Architecture Considerations

### 6.1 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Auth 방식 | GitHub OAuth, Email/PW, Magic Link | GitHub OAuth | 개발자 타겟, GitHub 계정 보유율 높음 |
| 세션 저장 | Cookie (SSR), localStorage (CSR) | Cookie (SSR) | Server Component에서 세션 접근 필요 |
| Supabase 클라이언트 | `@supabase/supabase-js`, `@supabase/ssr` | `@supabase/ssr` | Next.js App Router 쿠키 핸들링 지원 |

### 6.2 인증 플로우

```
[사용자] → 로그인 버튼 클릭
  → GET /auth/login
  → supabase.auth.signInWithOAuth({ provider: 'github', redirectTo: '/auth/callback' })
  → GitHub OAuth 페이지 → 사용자 승인
  → GET /auth/callback?code=...
  → supabase.auth.exchangeCodeForSession(code)
  → profiles UPSERT (github_username, avatar_url)
  → 홈(/) 리다이렉트
```

---

## 7. Implementation Steps

1. [ ] Supabase 대시보드: GitHub OAuth Provider 활성화 + Redirect URL 설정
2. [ ] `apps/web/src/lib/supabase/server.ts` — 서버 클라이언트 (`createServerClient`)
3. [ ] `apps/web/src/lib/supabase/client.ts` — 브라우저 클라이언트 (`createBrowserClient`)
4. [ ] `apps/web/src/middleware.ts` — 세션 갱신 미들웨어
5. [ ] `apps/web/src/app/auth/callback/route.ts` — 콜백 Route Handler
6. [ ] `apps/web/src/app/auth/login/route.ts` — 로그인 시작 Route Handler
7. [ ] `apps/web/src/app/auth/logout/route.ts` — 로그아웃 Route Handler
8. [ ] `GlobalNav` 컴포넌트 인증 상태 분기 (Server Component)

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`/pdca design cckit-auth`)
2. [ ] Supabase 대시보드에서 GitHub OAuth 설정
3. [ ] 구현 시작 (`/pdca do cckit-auth`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft — cckit-mvp에서 인증 범위 분리 | CCKit Team |
