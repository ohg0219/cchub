# cchub-rename Planning Document

> **Summary**: 모노레포 전체 패키지명 cckit → cchub 변경
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Predecessor**: cckit-deploy (분리)
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

npm에 `cckit` 패키지가 이미 존재(소유자: qiutian00)하므로,
모노레포 전체의 패키지명과 CLI 바이너리명을 `cchub`로 변경한다.

### 1.2 Background

- `cckit` (unscoped) npm 등록 불가 — 타인 소유
- 현재 패키지는 `@cckit/cli`, `@cckit/shared`, `@cckit/web` 스코프 형태이나
  브랜드 일관성과 CLI 바이너리명(`cckit`) 혼동 방지를 위해 전면 변경
- `cchub` npm 가용 여부 확인 완료 (404)
- 변경 범위: 7개 파일 (package.json 4개 + tsconfig.json 1개 + next.config.ts 1개 + config.ts 1개)

### 1.3 Related Documents

- 후속: `cchub-features.plan.md`, `cchub-deploy.plan.md`

---

## 2. Scope

### 2.1 In Scope

- [ ] 루트 `package.json`: `"name": "cckit"` → `"cchub"`
- [ ] `packages/shared/package.json`: `@cckit/shared` → `@cchub/shared`
- [ ] `apps/cli/package.json`: `@cckit/cli` → `@cchub/cli`, bin `cckit` → `cchub`, 의존성 업데이트
- [ ] `apps/web/package.json`: `@cckit/web` → `@cchub/web`, 의존성 `@cchub/shared` 업데이트
- [ ] `apps/web/tsconfig.json`: path alias `@cckit/shared` → `@cchub/shared`
- [ ] `apps/web/next.config.ts`: `transpilePackages: ['@cchub/shared']`
- [ ] `apps/cli/src/utils/config.ts`: `apiBaseUrl` 기본값 도메인 반영
- [ ] `pnpm install` 재실행하여 lockfile 갱신
- [ ] `pnpm build` 성공 확인
- [ ] GitHub repo 이름 변경: `cckit` → `cchub` (Settings > Repository name)
- [ ] 로컬 remote URL 업데이트: `git remote set-url origin https://github.com/<owner>/cchub.git`

### 2.2 Out of Scope

- 디렉토리명 변경 (`apps/web`, `apps/cli` 폴더명은 유지)
- 웹사이트 UI 내 "CCKit" 텍스트 브랜드명 변경 (별도 결정)
- npm org `@cchub` 생성 (배포 단계에서)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 루트 package.json `name` 변경 | High | Pending |
| FR-02 | `@cckit/shared` → `@cchub/shared` 패키지명 + 내부 참조 전체 변경 | High | Pending |
| FR-03 | `@cckit/cli` → `@cchub/cli`, bin 명 `cchub` 변경 | High | Pending |
| FR-04 | `@cckit/web` → `@cchub/web`, 의존성 참조 변경 | High | Pending |
| FR-05 | `tsconfig.json` path alias 갱신 | High | Pending |
| FR-06 | `next.config.ts` transpilePackages 갱신 | High | Pending |
| FR-07 | `pnpm install` lockfile 갱신 | High | Pending |
| FR-08 | `pnpm build` (web + cli) 빌드 성공 | High | Pending |
| FR-09 | GitHub repo 이름 `cckit` → `cchub` 변경 | High | Pending |
| FR-10 | 로컬 git remote URL 업데이트 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 안전성 | 빌드 오류 없음 | `pnpm build` 성공 여부 |
| 완결성 | `@cckit` 참조 잔존 없음 | `grep -r "@cckit"` 결과 없음 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `grep -r "@cckit" .` 결과 없음 (node_modules 제외)
- [ ] `pnpm --filter web build` 성공
- [ ] `pnpm --filter cli build` 성공
- [ ] `node apps/cli/dist/index.js --help` 정상 출력

### 4.2 Quality Criteria

- [ ] Zero lint errors
- [ ] TypeScript 컴파일 오류 없음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| pnpm workspace 심볼릭 링크 갱신 누락 | High | Medium | `pnpm install` 반드시 재실행 |
| tsconfig path alias 미갱신으로 타입 오류 | Medium | Low | 빌드 후 TypeScript 오류 확인 |
| `@cchub` npm org 미등록 상태에서 publish 시도 | Medium | Low | 이번 단계는 publish 제외 (cchub-deploy에서) |

---

## 6. 변경 파일 상세

| 파일 | 변경 전 | 변경 후 |
|------|---------|---------|
| `package.json` | `"name": "cckit"` | `"name": "cchub"` |
| `packages/shared/package.json` | `"name": "@cckit/shared"` | `"name": "@cchub/shared"` |
| `apps/cli/package.json` | `"name": "@cckit/cli"`, `"bin": {"cckit": ...}`, `"@cckit/shared": "workspace:*"` | `"name": "@cchub/cli"`, `"bin": {"cchub": ...}`, `"@cchub/shared": "workspace:*"` |
| `apps/web/package.json` | `"name": "@cckit/web"`, `"@cckit/shared": "workspace:*"` | `"name": "@cchub/web"`, `"@cchub/shared": "workspace:*"` |
| `apps/web/tsconfig.json` | `"@cckit/shared": [...]` (2줄) | `"@cchub/shared": [...]` |
| `apps/web/next.config.ts` | `transpilePackages: ['@cckit/shared']` | `transpilePackages: ['@cchub/shared']` |
| `apps/cli/src/utils/config.ts` | `apiBaseUrl: 'https://cckit.dev'` | `apiBaseUrl: 'https://cchub.dev'` |

---

## 7. Next Steps

1. [ ] Design 문서 작성 (이 feature는 단순 치환이므로 Design = 변경 매핑 확인)
2. [ ] 구현 (파일 7개 수정 + pnpm install + 빌드 검증)
3. [ ] 후속 feature: `cchub-features`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | cckit-deploy에서 분리 — 패키지명 변경 단독 feature | CCKit Team |
