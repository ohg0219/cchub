# cckit-cli Planning Document

> **Summary**: CCKit CLI 도구 구현 — `npx cckit install/search/list` 명령어
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Parent**: cckit-mvp (Phase 1-3)
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

개발자가 터미널 한 줄로 CCKit 스타터 킷을 설치할 수 있는 CLI 도구를 구현한다.
`npx cckit install <slug>` 한 줄로 Skills/Hooks/Agents/CLAUDE.md를 로컬 프로젝트에 배치하는 것이 핵심 가치다.

### 1.2 Background

- CLI는 CCKit의 핵심 인터페이스 — 웹사이트에서 발견하고 CLI로 설치
- Commander.js 기반의 Node.js CLI, npm 배포 (`npx cckit` 사용 가능)
- Hooks 설치 시 기존 `.claude/settings.json`과 딥 머지가 필요한 복잡한 케이스 존재

### 1.3 Related Documents

- 상위 기획: `docs/01-plan/features/cckit-mvp.plan.md`
- 킷 API: cckit-explore에서 구현하는 `/api/kits/[slug]`
- kit.yaml 스펙: `project-plan/kit-spec.md`
- CLI 엔트리포인트: `apps/cli/src/index.ts`

---

## 2. Scope

### 2.1 In Scope

- [ ] **`cckit install <slug>`**: 킷 API에서 파일 목록 조회 → GitHub Raw에서 다운로드 → 로컬 배치
  - Skills → `.claude/skills/`
  - Hooks → `.claude/settings.json` (딥 머지)
  - Agents → `.claude/agents/`
  - CLAUDE.md → `./CLAUDE.md` (덮어쓰기 전 확인)
- [ ] **`cckit search <query>`**: 킷 API 검색 → 터미널 테이블 출력
- [ ] **`cckit list`**: 설치된 킷 목록 (`.claude/.cckit-installed.json` 추적)
- [ ] 설치 완료 후 `POST /api/kits/[slug]/install` 호출 (설치 수 트래킹)
- [ ] 인터랙티브 확인 프롬프트 (CLAUDE.md 덮어쓰기, settings.json 충돌 시)
- [ ] chalk 기반 컬러 출력 + 스피너 (ora)

### 2.2 Out of Scope

- `cckit init` (인터랙티브 킷 생성, Phase 2)
- `cckit uninstall` (Phase 2)
- 로그인/인증 (CLI에서는 불필요, MVP)
- 프라이빗 킷 지원 (Phase 2)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `install` — 슬러그로 킷 메타 + 파일 목록 조회 | High | Pending |
| FR-02 | `install` — GitHub Raw URL에서 파일 다운로드 | High | Pending |
| FR-03 | `install` — 파일 타입별 올바른 경로에 배치 | High | Pending |
| FR-04 | `install` — `.claude/settings.json` 딥 머지 (기존 설정 보존) | High | Pending |
| FR-05 | `install` — CLAUDE.md 덮어쓰기 전 확인 프롬프트 | High | Pending |
| FR-06 | `install` — 설치 완료 후 install API 호출 | Medium | Pending |
| FR-07 | `install` — `.claude/.cckit-installed.json`에 설치 기록 저장 | Medium | Pending |
| FR-08 | `search` — 검색어로 킷 목록 조회, 테이블 형식 출력 | Medium | Pending |
| FR-09 | `list` — 설치된 킷 목록 출력 | Medium | Pending |
| FR-10 | 에러 핸들링 — 네트워크 오류, 킷 없음, 권한 없음 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | install 완료 시간 < 10초 (표준 킷 기준) | 수동 테스트 |
| Compatibility | Node.js 18+ 지원 | CI 테스트 |
| Compatibility | macOS, Linux, Windows 지원 | path 모듈 사용 |
| UX | 진행 상황 스피너 + 완료 메시지 | 수동 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `npx cckit install spring-boot-enterprise` 로컬 설치 성공
- [ ] `.claude/` 디렉토리에 파일 올바르게 배치
- [ ] `settings.json` 기존 설정과 정상 병합
- [ ] `cckit search spring` 결과 출력
- [ ] `cckit list` 설치된 킷 목록 출력
- [ ] `npm publish` 후 `npx cckit` 사용 가능

### 4.2 Quality Criteria

- [ ] TypeScript strict mode
- [ ] Zero lint errors
- [ ] `pnpm --filter cli build` 성공

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Windows 경로 구분자 이슈 (`\` vs `/`) | High | Medium | `path.join`, `path.resolve` 일관 사용 |
| `settings.json` 딥 머지 시 hooks 배열 중복 | High | Medium | hook command 기준 중복 제거 로직 |
| GitHub Raw 다운로드 rate limit | Medium | Low | 공개 repo이므로 MVP 수준에서 무시 |
| `npx` 실행 시 Node.js 버전 불일치 | Medium | Low | `engines` 필드에 `>=18` 명시 |

---

## 6. Architecture Considerations

### 6.1 Key Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| CLI 프레임워크 | Commander.js | 가볍고 직관적, 프로젝트 표준 |
| 컬러 출력 | chalk | 프로젝트 표준 |
| HTTP 클라이언트 | fetch (Node 18+ 내장) | 추가 의존성 없음 |
| 인터랙티브 프롬프트 | inquirer | CLAUDE.md 덮어쓰기 확인 등 |
| 스피너 | ora | UX 개선 |

### 6.2 주요 파일

```
apps/cli/src/
├── index.ts                   # CLI 엔트리포인트 (Commander 루트)
├── commands/
│   ├── install.ts             # cckit install <slug>
│   ├── search.ts              # cckit search <query>
│   └── list.ts                # cckit list
├── lib/
│   ├── api.ts                 # CCKit Web API 호출
│   ├── installer.ts           # 파일 배치 + settings.json 병합
│   └── kit-validator.ts       # kit.yaml 로컬 검증
└── utils/
    ├── logger.ts              # chalk 기반 로깅
    └── config.ts              # API 베이스 URL 등 설정
```

### 6.3 설치 흐름

```
npx cckit install <slug>
  → GET /api/kits/<slug>
  → GitHub Raw URL로 파일 다운로드
  → 타입별 경로 배치
  → settings.json 딥 머지 (hooks)
  → .cckit-installed.json 기록
  → POST /api/kits/<slug>/install
  → 완료 메시지 출력
```

---

## 7. Next Steps

1. [ ] Design 문서 작성 (`/pdca design cckit-cli`)
2. [ ] cckit-explore API 완성 후 연동
3. [ ] 구현 시작 (`/pdca do cckit-cli`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft — cckit-mvp Phase 1-3 분리 | CCKit Team |
