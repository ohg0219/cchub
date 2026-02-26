# bash-stackdump-fix Planning Document

> **Summary**: 프로젝트 디렉토리에 산재하는 bash.exe.stackdump 파일의 생성 원인을 분석하고 재발을 방지한다.
>
> **Project**: CCHub
> **Version**: 1.0.0
> **Author**: ohg0219
> **Date**: 2026-02-26
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

`bash.exe.stackdump` 파일이 프로젝트 루트(`/`) 및 하위 디렉토리(`apps/web/`)에 반복 생성되는 문제를 제거한다.
- 리포지토리 오염 방지
- 개발 환경 안정성 확보

### 1.2 Background

`bash.exe.stackdump`는 **Cygwin/MSYS2 기반 bash.exe가 비정상 종료(crash)할 때** 현재 작업 디렉토리에 자동 생성되는 크래시 덤프 파일이다.

**스택 트레이스 분석 결과:**
```
msys-2.0.dll+0x1FE8E  (signal handler 호출 영역)
msys-2.0.dll+0x67F9   (exception/signal 처리)
msys-2.0.dll+0x28CF6  (SIGSEGV/SIGABRT 처리)
```
- `msys-2.0.dll` 내 signal 처리 코드에서 크래시 발생
- `bash.exe` + `msys-2.0.dll` 조합 → **Git for Windows** 또는 **MSYS2** 번들 bash

**생성 위치 패턴:**
| 파일 | 타임스탬프 | 의미 |
|------|-----------|------|
| `bash.exe.stackdump` (루트) | 2026-02-26 15:00 | 루트에서 bash 명령 실행 중 크래시 |
| `apps/web/bash.exe.stackdump` | 2026-02-26 09:57 | apps/web/ 에서 bash 명령 실행 중 크래시 |

파일이 생성된 디렉토리 = bash 프로세스의 **현재 작업 디렉토리(CWD)**.

### 1.3 주요 원인 가설

| # | 원인 | 가능성 |
|---|------|--------|
| A | **`pnpm` 스크립트 실행 중 bash 크래시** — pnpm dev/build/install 실행 시 Node.js가 bash를 subprocess로 호출, OOM 또는 신호 충돌 | 높음 |
| B | **Claude Code CLI의 Bash tool 실행 중 크래시** — 긴 명령어, 파이프라인, 특수 문자가 포함된 커맨드 실행 시 msys2 bash 불안정 | 높음 |
| C | **Git hook 실행 중 크래시** — pre-commit/commit-msg hook이 bash 스크립트를 실행할 때 크래시 | 중간 |
| D | **MSYS2/Git for Windows 버전 버그** — 구버전 msys-2.0.dll의 알려진 결함 | 중간 |
| E | **Node.js `child_process.exec()` shell 옵션** — `shell: true` 설정 시 Windows에서 bash 대신 cmd.exe를 써야 할 상황에서 bash 호출 | 낮음 |

### 1.4 Related Documents

- `bash.exe.stackdump` (루트)
- `apps/web/bash.exe.stackdump`

---

## 2. Scope

### 2.1 In Scope

- [ ] 크래시 발생 시점/트리거 특정 (로그 분석)
- [ ] `.gitignore`에 `bash.exe.stackdump` 패턴 추가
- [ ] Git for Windows / MSYS2 버전 확인 및 업데이트 권고
- [ ] Claude Code Bash tool 실행 방식 개선 (해당 시)
- [ ] 재발 방지 — stackdump 파일 자동 정리 스크립트 또는 hook

### 2.2 Out of Scope

- Windows 운영체제 업그레이드
- bash를 PowerShell/cmd로 전면 교체
- Node.js 런타임 교체

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `bash.exe.stackdump` 파일이 Git 추적 대상에서 제외될 것 | High | Pending |
| FR-02 | 크래시 발생 원인(트리거 명령)이 식별될 것 | High | Pending |
| FR-03 | 원인에 맞는 해결책이 적용되어 재현이 안 될 것 | High | Pending |
| FR-04 | 기존 stackdump 파일이 삭제될 것 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 안정성 | pnpm dev/build 실행 시 bash 크래시 없음 | 10회 연속 실행 후 stackdump 미생성 확인 |
| 재현 방지 | 동일 트리거 명령 재실행 시 크래시 없음 | 수동 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `bash.exe.stackdump`가 `.gitignore`에 추가됨
- [ ] 기존 stackdump 파일 2개 삭제됨
- [ ] 크래시 원인 트리거 식별 및 문서화
- [ ] 해결책 적용 후 해당 트리거 재실행 시 stackdump 미생성 확인

### 4.2 Quality Criteria

- [ ] `.gitignore` 패턴 적용 확인 (`git status`에서 stackdump 미표시)
- [ ] 개발 워크플로우(pnpm dev/build/test) 정상 동작

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 원인 트리거를 특정하기 어려움 (로그 없음) | Medium | Medium | msys-2.0.dll 버전 업데이트를 우선 적용, 이후 모니터링 |
| Git for Windows 업데이트 후 다른 툴 호환성 문제 | Medium | Low | 업데이트 전 현재 버전 기록, 롤백 계획 수립 |
| Claude Code Bash tool이 크래시 원인일 경우 근본 해결 불가 | Low | Medium | .gitignore + 자동 정리 hook으로 영향 최소화 |

---

## 6. Architecture Considerations

### 6.1 해결 접근법

| 결정 | 옵션 | 선택 | 이유 |
|------|------|------|------|
| stackdump 추적 방지 | .gitignore 추가 vs 무시 | .gitignore 추가 | 즉시 적용 가능, 리스크 없음 |
| 크래시 원인 제거 | bash 업데이트 vs 워크플로 변경 | 업데이트 우선 | 근본 해결 |
| 재발 방지 | post-commit hook vs 수동 | .gitignore로 충분 | 단순한 해결이 최선 |

---

## 7. Next Steps

1. [ ] `.gitignore`에 `bash.exe.stackdump` 추가 (`/` 루트 + `**/` 전역 패턴)
2. [ ] 기존 stackdump 파일 2개 삭제
3. [ ] Git for Windows 버전 확인 (`git --version`, `bash --version`)
4. [ ] 최신 버전이 아닌 경우 업데이트 권고
5. [ ] 타임스탬프 기반으로 크래시 발생 시점의 작업 내용 특정 (git log 대조)
6. [ ] 설계 문서 작성 (`/pdca design bash-stackdump-fix`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft | ohg0219 |
