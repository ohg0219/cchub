# cchub-rename Design Document

> **Summary**: 모노레포 전체 패키지명 `@cckit/*` → `@cchub/*`, bin `cckit` → `cchub` 치환
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Status**: Draft
> **Planning Doc**: [cchub-rename.plan.md](../01-plan/features/cchub-rename.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 모노레포 내 `@cckit` 스코프 참조를 `@cchub`로 완전 치환한다.
- CLI 바이너리명을 `cckit` → `cchub`로 변경한다.
- 빌드 파이프라인(pnpm + Turborepo)이 변경 후에도 정상 동작함을 보장한다.
- 소스 코드 변경은 최소화하고, 설정 파일 7개만 수정한다.

### 1.2 Design Principles

- **최소 변경**: 디렉토리 구조·로직 변경 없이 패키지 메타데이터만 수정
- **원자적 적용**: 7개 파일 전부 변경 후 한 번에 `pnpm install` + 빌드 검증
- **grep 검증**: 변경 후 `@cckit` 잔존 참조를 grep으로 확인

---

## 2. Architecture

### 2.1 변경 대상 파일 맵

```
cchub/ (모노레포 루트)
├── package.json                        ← [1] "name": "cckit" → "cchub"
├── packages/
│   └── shared/
│       └── package.json                ← [2] "name": "@cckit/shared" → "@cchub/shared"
└── apps/
    ├── cli/
    │   ├── package.json                ← [3] name + bin + dependency 변경
    │   └── src/utils/config.ts         ← [7] apiBaseUrl 환경변수명 변경
    └── web/
        ├── package.json                ← [4] name + dependency 변경
        ├── tsconfig.json               ← [5] path alias 변경
        └── next.config.ts              ← [6] transpilePackages 변경
```

### 2.2 의존성 그래프

```
package.json (root: cchub)
  └── apps/web  (@cchub/web)
        └── packages/shared  (@cchub/shared)
  └── apps/cli  (@cchub/cli)
        └── packages/shared  (@cchub/shared)
```

### 2.3 변경 흐름

```
파일 수정 (7개) → pnpm install (lockfile 갱신) → pnpm build 검증 → grep 검증
```

---

## 3. 파일별 변경 상세

### 3.1 `package.json` (루트) — 변경 [1]

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `name` | `"cckit"` | `"cchub"` |

```json
// 변경 전
{ "name": "cckit" }

// 변경 후
{ "name": "cchub" }
```

### 3.2 `packages/shared/package.json` — 변경 [2]

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `name` | `"@cckit/shared"` | `"@cchub/shared"` |

### 3.3 `apps/cli/package.json` — 변경 [3]

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `name` | `"@cckit/cli"` | `"@cchub/cli"` |
| `bin.cckit` | `"./dist/index.js"` | (키 삭제) |
| `bin.cchub` | (없음) | `"./dist/index.js"` |
| `dependencies["@cckit/shared"]` | `"workspace:*"` | (키 삭제) |
| `dependencies["@cchub/shared"]` | (없음) | `"workspace:*"` |

### 3.4 `apps/web/package.json` — 변경 [4]

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `name` | `"@cckit/web"` | `"@cchub/web"` |
| `dependencies["@cckit/shared"]` | `"workspace:*"` | (키 삭제) |
| `dependencies["@cchub/shared"]` | (없음) | `"workspace:*"` |

### 3.5 `apps/web/tsconfig.json` — 변경 [5]

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `paths["@cckit/shared"]` | `["../../packages/shared/src"]` | (키 삭제) |
| `paths["@cckit/shared/*"]` | `["../../packages/shared/src/*"]` | (키 삭제) |
| `paths["@cchub/shared"]` | (없음) | `["../../packages/shared/src"]` |
| `paths["@cchub/shared/*"]` | (없음) | `["../../packages/shared/src/*"]` |

### 3.6 `apps/web/next.config.ts` — 변경 [6]

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `transpilePackages[0]` | `'@cckit/shared'` | `'@cchub/shared'` |

### 3.7 `apps/cli/src/utils/config.ts` — 변경 [7]

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `process.env` 키 | `CCKIT_API_URL` | `CCHUB_API_URL` |
| 기본 URL | `'https://cckit.dev'` | `'https://cchub.dev'` |

```typescript
// 변경 전
export const config = {
  apiBaseUrl: process.env.CCKIT_API_URL ?? 'https://cckit.dev',
  cliVersion: '0.1.0',
} as const;

// 변경 후
export const config = {
  apiBaseUrl: process.env.CCHUB_API_URL ?? 'https://cchub.dev',
  cliVersion: '0.1.0',
} as const;
```

---

## 4. 검증 계획

### 4.1 변경 후 검증 순서

```
1. pnpm install         # workspace 심볼릭 링크 + lockfile 갱신
2. pnpm --filter web build   # Next.js 빌드
3. pnpm --filter cli build   # TypeScript 컴파일
4. node apps/cli/dist/index.js --help  # CLI 바이너리 동작 확인
5. grep -r "@cckit" . --include="*.json" --include="*.ts" --include="*.tsx"
   # 잔존 참조 없음 확인 (node_modules 제외)
```

### 4.2 성공 기준

| 검증 항목 | 성공 조건 |
|----------|----------|
| `pnpm install` | 오류 없이 완료 |
| `pnpm --filter web build` | exit code 0 |
| `pnpm --filter cli build` | exit code 0 |
| CLI --help | 도움말 출력 정상 |
| grep `@cckit` | 0 matches (node_modules 제외) |

---

## 5. UI/UX Design

해당 없음 — 설정 파일 치환 작업으로 UI 변경 없음.

---

## 6. Error Handling

| 상황 | 원인 | 대응 |
|------|------|------|
| `pnpm install` 실패 | workspace 참조 불일치 | 7개 파일 모두 변경됐는지 재확인 |
| TypeScript 컴파일 오류 | tsconfig path alias 미갱신 | `apps/web/tsconfig.json` [5] 재확인 |
| `next build` 실패 | transpilePackages 미갱신 | `next.config.ts` [6] 재확인 |
| grep에서 `@cckit` 발견 | 누락 파일 | 해당 파일 추가 수정 |

---

## 7. Security Considerations

해당 없음 — 패키지명 치환 작업으로 보안 영향 없음.

---

## 8. TDD Test Scenarios

이 feature는 설정 파일 치환 작업으로 단위 테스트 대상 로직이 없음.
빌드 & grep 검증으로 대체한다. (TDD 섹션 불필요)

---

## 9. Implementation Guide

### 9.1 변경 파일 목록

```
package.json                        ← [1]
packages/shared/package.json        ← [2]
apps/cli/package.json               ← [3]
apps/web/package.json               ← [4]
apps/web/tsconfig.json              ← [5]
apps/web/next.config.ts             ← [6]
apps/cli/src/utils/config.ts        ← [7]
```

### 9.2 Implementation Order

1. [ ] [1] 루트 `package.json` name 변경
2. [ ] [2] `packages/shared/package.json` name 변경
3. [ ] [3] `apps/cli/package.json` name + bin + dependencies 변경
4. [ ] [4] `apps/web/package.json` name + dependencies 변경
5. [ ] [5] `apps/web/tsconfig.json` path alias 변경
6. [ ] [6] `apps/web/next.config.ts` transpilePackages 변경
7. [ ] [7] `apps/cli/src/utils/config.ts` 환경변수명 + 기본 URL 변경
8. [ ] `pnpm install` 실행
9. [ ] `pnpm --filter web build` + `pnpm --filter cli build` 검증
10. [ ] grep 검증: `@cckit` 잔존 없음 확인

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft | CCKit Team |
