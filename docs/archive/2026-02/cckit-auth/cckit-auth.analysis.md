# cckit-auth Analysis Report

> **Analysis Type**: Gap Analysis
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Analyst**: gap-detector Agent
> **Date**: 2026-02-26
> **Design Doc**: [cckit-auth.design.md](../02-design/features/cckit-auth.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Design 문서(`cckit-auth.design.md`)와 구현 코드 간의 일치율을 측정하고, Critical/Warning/Info Gap을 식별하여 iterate 또는 report 진행 여부를 결정한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/cckit-auth.design.md`
- **Implementation Paths**:
  - `apps/web/src/lib/supabase/` (client.ts, server.ts, service.ts, types.ts)
  - `apps/web/src/middleware.ts`
  - `apps/web/src/app/auth/` (login/route.ts, logout/route.ts)
  - `apps/web/src/app/api/auth/callback/route.ts`
  - `apps/web/src/components/` (global-nav.tsx, login-button.tsx, user-menu.tsx)
  - `apps/web/src/app/[locale]/layout.tsx`
- **Analysis Date**: 2026-02-26

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 API Routes

| Design | Implementation | Status | 비고 |
|--------|---------------|--------|------|
| GET `/auth/login` | `app/auth/login/route.ts` | ✅ Match | |
| GET `/auth/callback` | `app/api/auth/callback/route.ts` (/api/auth/callback) | ⚠️ 경로 불일치 | Design과 실제 경로 다름 |
| POST `/auth/logout` | `app/auth/logout/route.ts` | ✅ Match | |
| OAuth scope `read:user user:email` | `login/route.ts` scopes | ✅ Match | |
| redirectTo = `${NEXT_PUBLIC_BASE_URL}/auth/callback` | `origin` + `/api/auth/callback` 사용 | ⚠️ 경로 불일치 | 기능상 동일하나 Design과 다름 |

### 2.2 Data Model

| 항목 | Design | Implementation | Status |
|------|--------|---------------|--------|
| `Profile` 인터페이스 (7필드) | types.ts | `lib/supabase/types.ts` | ✅ Match |
| `AuthUser` 타입 | types.ts | `lib/supabase/types.ts` | ✅ Match |
| profiles upsert 클라이언트 | service_role 키 필수 | anon 클라이언트 사용 | 🔴 Critical |

### 2.3 Components

| Design Component | 구현 파일 | Status | 비고 |
|------------------|---------|--------|------|
| `middleware.ts` 세션 갱신 | `middleware.ts` | ✅ Match | |
| `lib/supabase/server.ts` | `server.ts` | ✅ Match | |
| `lib/supabase/client.ts` | `client.ts` | ✅ Match | |
| `GlobalNav` Server Component | `global-nav.tsx` | ✅ Match | |
| `LoginButton` Client Component | `login-button.tsx` | ✅ Match | |
| `UserMenu` Client Component + 드롭다운 | `user-menu.tsx` | ⚠️ 부분 구현 | "내 킷" 링크 누락 |
| `UserMenu` "내 킷" 메뉴 항목 | - | ⚠️ Warning | 미구현 |
| `/auth/error` 페이지 | - | ⚠️ Warning | 콜백이 리다이렉트하나 페이지 없음 |
| GlobalNav를 layout.tsx에 통합 | `layout.tsx` | ✅ Match | |

### 2.4 Security

| 항목 | Design | Implementation | Status |
|------|--------|---------------|--------|
| 로그아웃 POST form | `user-menu.tsx` form POST | ✅ Match | |
| OAuth state CSRF 방어 | Supabase SDK 자동 처리 | ✅ Match | |
| 쿠키 HttpOnly/Secure | `@supabase/ssr` 자동 처리 | ✅ Match | |
| service_role key 서버 전용 | service.ts 존재하나 미사용 | 🔴 Critical |
| 최소 OAuth scope | ✅ Match | |

### 2.5 Match Rate Summary

```
Overall Match Rate: 82%
─────────────────────────────────────
  API Match:        85% ⚠️
  Data Model:      100% ✅
  Component Match:  90% ⚠️
  Security:         75% ⚠️
─────────────────────────────────────
  Critical 항목:     2개
  Warning 항목:      3개
  Info 항목:         3개
```

---

## 3. Code Quality Analysis

### 3.1 보안 이슈

| Severity | 파일 | 내용 | 권장 조치 |
|----------|------|------|---------|
| 🔴 Critical | `app/api/auth/callback/route.ts:L16-L34` | profiles upsert에 anon 클라이언트 사용 — RLS로 인해 신규 사용자 INSERT 실패 가능 | `createServiceClient()` 로 교체 |
| 🟡 Warning | `app/auth/callback/` | 콜백 라우트가 `/api/auth/callback`에 있어 Design 경로(`/auth/callback`)와 불일치 | 설계 또는 경로 통일 |

### 3.2 Convention Compliance

| 항목 | 준수 여부 |
|------|---------|
| TypeScript strict mode | ✅ |
| named export (components) | ✅ |
| Server Component / Client Component 분리 | ✅ |
| 한국어 문자열 messages 파일 사용 | ✅ |

---

## 4. Convention Compliance

### 4.1 추가 구현 항목 (Design 미명시)

| 파일 | 내용 | 평가 |
|------|------|------|
| `lib/supabase/service.ts` | service_role 클라이언트 헬퍼 (미사용) | 설계 의도에 부합, 활용 필요 |
| 콜백 `?next=` 파라미터 | 오픈 리다이렉트 방어 포함 | ✅ 개선 사항 |
| GlobalNav i18n | `next-intl` 통합 | ✅ 프로젝트 컨벤션 준수 |
| 에러 리다이렉트 `/auth/error` | Design은 `/`로 리다이렉트 명시 | 개선이나 페이지 없으면 404 |

---

## 6. Overall Score

### 6.1 Base Score

```
Design Match Score: 82/100
─────────────────────────────────────
  Critical 미해결:  -10점 (2개 × 5점)
  Warning 미해결:   -5점  (3개 × 약 1.7점)
  Info:             감점 없음
─────────────────────────────────────
최종 Match Rate: 82%
```

---

## 7. Recommended Actions

### 7.1 Immediate (Critical)

| 우선순위 | 항목 | 파일 | 조치 |
|---------|------|------|------|
| 1 | profiles upsert를 service_role 클라이언트로 변경 | `app/api/auth/callback/route.ts:L16` | `createServiceClient()` import 후 upsert에 사용 |
| 2 | 콜백 경로 통일 | `app/auth/login/route.ts:L11` 또는 콜백 라우트 이동 | Design 기준 `/auth/callback`으로 통일하거나 Design 업데이트 |

### 7.2 Short-term (Warning)

| 우선순위 | 항목 | 파일 | 영향 |
|---------|------|------|------|
| 1 | `/auth/error` 페이지 생성 | `app/[locale]/auth/error/page.tsx` | 콜백 실패 시 404 방지 |
| 2 | `UserMenu` "내 킷" 링크 추가 | `components/user-menu.tsx` | Design 완전 일치 |
| 3 | `/explore` 페이지 생성 전이라도 링크 placeholder | - | UX 개선 |

---

## 8. Next Steps

- [ ] Critical #1: `createServiceClient()` 콜백 upsert 적용
- [ ] Critical #2: 콜백 경로 `/auth/callback`으로 이동 (또는 Design 업데이트)
- [ ] Warning #1: `/auth/error` 페이지 생성
- [ ] Warning #2: `UserMenu` "내 킷" 링크 추가
- [ ] `/pdca iterate cckit-auth` 실행하여 자동 수정

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial gap analysis — 82% match rate | gap-detector Agent |
