# bash-stackdump-fix Design Document

> **Summary**: bash.exe.stackdump 생성 원인 확정 및 즉시/장기 해결책 구체화
>
> **Project**: CCHub
> **Version**: 1.0.0
> **Author**: ohg0219
> **Date**: 2026-02-26
> **Status**: Draft
> **Planning Doc**: [bash-stackdump-fix.plan.md](../01-plan/features/bash-stackdump-fix.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- `bash.exe.stackdump` 파일이 Git에 추적되지 않도록 즉시 차단
- 크래시의 근본 원인(Git for Windows 구버전)을 제거
- 재발 시에도 프로젝트에 영향이 없도록 방어 레이어 구성

### 1.2 Design Principles

- **즉시 적용 가능한 것부터**: gitignore 추가 → 파일 삭제 → 버전 업데이트 순
- **최소 변경**: 기존 워크플로우를 바꾸지 않고 환경만 수정
- **재현 검증 필수**: 해결 후 동일 조건 재실행으로 stackdump 미생성 확인

---

## 2. 원인 분석

### 2.1 크래시 타임스탬프 vs Git Log 대조

| 파일 | 생성 시각 | 직후 커밋 | 당시 작업 |
|------|-----------|-----------|-----------|
| `bash.exe.stackdump` (루트) | 2026-02-26 15:00 | `b67ac4c` 15:02 (스냅샷 정리) | Claude Code Bash tool — `rm`, `python3` 파이프라인 실행 |
| `apps/web/bash.exe.stackdump` | 2026-02-26 09:57 | `a927673` 10:07 (cckit-landing 구현) | Claude Code Bash tool — `pnpm build` 또는 Next.js 빌드 명령 실행 |

**결론**: 두 경우 모두 **Claude Code의 Bash tool이 MSYS2 bash를 통해 명령을 실행하는 도중** 크래시 발생.

### 2.2 확정 원인

**1순위: Git for Windows 구버전 (msys-2.0.dll 버그)**
```
현재: Git 2.45.1 / bash 5.2.26(1)-release / msys-2.0.dll
최신: Git 2.48.x (2026년 기준)
```
- MSYS2 런타임(`msys-2.0.dll`)의 signal handling 코드에 알려진 결함 존재
- 특히 **긴 파이프라인**, **Python 서브프로세스**, **파일 삭제 후 즉시 다른 명령** 조합 시 불안정
- `msys-2.0.dll+0x28CF6` (SIGABRT 처리 영역) 에서 반복 크래시 패턴

**2순위: Claude Code Bash tool의 복잡한 명령 조합**
```bash
# 크래시 유발 패턴 예시
rm docs/.pdca-snapshots/snap-*.json; python3 -c "import json..."
```
- 세미콜론으로 연결된 복합 명령에서 앞 명령 완료 직후 msys2 signal 처리 중 충돌
- Windows + MSYS2 조합에서 빠른 연속 subprocess 생성 시 race condition

### 2.3 해결 접근법 결정

```
즉시 해결 (Do Phase Step 1-2):
  └── .gitignore에 bash.exe.stackdump 패턴 추가
  └── 기존 파일 2개 삭제

근본 해결 (Do Phase Step 3):
  └── Git for Windows 최신 버전으로 업데이트
      (2.45.1 → 2.48.x 이상)

보조 완화 (Do Phase Step 4):
  └── Claude Code Bash tool 명령 작성 시 주의사항 문서화
      (복합 명령 대신 분리 실행 권고)
```

---

## 3. 구현 설계

### 3.1 Step 1: .gitignore 패턴 추가

**대상 파일**: `.gitignore` (프로젝트 루트)

**추가할 패턴:**
```gitignore
# Cygwin/MSYS2 bash crash dump (Windows 개발 환경)
bash.exe.stackdump
**/bash.exe.stackdump
```

**패턴 설명:**
- `bash.exe.stackdump` — 루트 디렉토리 직접 생성 파일 차단
- `**/bash.exe.stackdump` — 모든 하위 디렉토리에서 생성되는 파일도 차단

**검증 방법:**
```bash
git status  # bash.exe.stackdump가 표시되지 않아야 함
git check-ignore -v bash.exe.stackdump  # 패턴 매칭 확인
```

### 3.2 Step 2: 기존 파일 삭제

**삭제 대상:**
```
bash.exe.stackdump              (루트, 1196 bytes, 2026-02-26 15:00)
apps/web/bash.exe.stackdump     (apps/web/, 1196 bytes, 2026-02-26 09:57)
```

**삭제 명령:**
```bash
rm bash.exe.stackdump apps/web/bash.exe.stackdump
```

**삭제 후 확인:**
```bash
find . -name "bash.exe.stackdump" 2>/dev/null  # 결과 없어야 함
```

### 3.3 Step 3: Git for Windows 업데이트

**현재 버전:**
```
Git:  2.45.1.windows.1
bash: 5.2.26(1)-release (x86_64-pc-msys)
```

**업데이트 방법 (사용자가 직접 실행):**

옵션 A — Git for Windows 공식 인스톨러:
```
https://git-scm.com/download/win
→ 최신 버전 다운로드 후 설치 (기존 설정 유지)
```

옵션 B — winget (Windows Package Manager):
```powershell
winget upgrade Git.Git
```

옵션 C — Chocolatey:
```powershell
choco upgrade git
```

**업데이트 후 검증:**
```bash
git --version   # 2.48.x 이상 확인
bash --version  # msys-2.0.dll 버전 갱신 확인
```

### 3.4 Step 4: Bash tool 명령 작성 가이드 (CLAUDE.md 추가)

복합 명령 실행 시 크래시 위험을 줄이는 패턴을 CLAUDE.md에 주석으로 문서화한다.

**추가 위치**: `CLAUDE.md` → `## 개발 명령어` 섹션 하단

**추가 내용:**
```markdown
## Windows 개발 환경 주의사항

- Bash tool 실행 시 복합 명령(`cmd1; cmd2` 또는 `cmd1 && cmd2`)보다
  개별 명령 분리 실행 권장 (MSYS2 bash 안정성)
- `bash.exe.stackdump` 생성 시 무시해도 되는 파일 (`.gitignore` 등록됨)
  Git for Windows 최신 버전 유지 권장
```

---

## 4. 파일 변경 목록

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `.gitignore` | 수정 | `bash.exe.stackdump`, `**/bash.exe.stackdump` 패턴 추가 |
| `bash.exe.stackdump` | 삭제 | 기존 크래시 덤프 파일 |
| `apps/web/bash.exe.stackdump` | 삭제 | 기존 크래시 덤프 파일 |
| `CLAUDE.md` | 수정 | Windows 개발 환경 주의사항 섹션 추가 |

---

## 5. 검증 계획

### 5.1 즉시 검증 (Step 1-2 완료 후)

```bash
# 1. gitignore 패턴 확인
git check-ignore -v bash.exe.stackdump
git check-ignore -v apps/web/bash.exe.stackdump

# 2. 파일 삭제 확인
ls bash.exe.stackdump 2>&1          # "No such file" 이어야 함
ls apps/web/bash.exe.stackdump 2>&1 # "No such file" 이어야 함

# 3. git status 확인
git status  # stackdump 파일이 표시되지 않아야 함
```

### 5.2 재발 방지 검증 (Step 3 완료 후)

```bash
# Git for Windows 버전 확인
git --version   # 2.48.x 이상
bash --version  # 업데이트된 버전

# pnpm 빌드 실행 후 stackdump 미생성 확인
pnpm --filter web build
find . -name "bash.exe.stackdump" 2>/dev/null  # 결과 없어야 함
```

---

## 6. 리스크

| 리스크 | 대응 |
|--------|------|
| Git for Windows 업데이트 후 기존 SSH 키/설정 초기화 | 업데이트 전 `~/.gitconfig`, `~/.ssh/` 백업 |
| 업데이트 후에도 크래시 재현 | Step 4 가이드 적용 + 모니터링 지속 |

---

## 9. Implementation Guide

### 9.1 구현 순서

1. [ ] `.gitignore`에 stackdump 패턴 2줄 추가
2. [ ] 기존 stackdump 파일 2개 삭제
3. [ ] `CLAUDE.md`에 Windows 주의사항 추가
4. [ ] Step 1-2 검증 (git check-ignore, git status)
5. [ ] Git for Windows 업데이트 안내 (사용자 직접 실행)
6. [ ] 업데이트 후 pnpm build 실행하여 재발 여부 확인

### 9.2 Implementation Order (Do Phase)

1. [ ] `.gitignore` 수정 — 리스크 0, 즉시 효과
2. [ ] 기존 파일 삭제 — `rm` 명령
3. [ ] `CLAUDE.md` 수정 — 주의사항 문서화
4. [ ] 검증 실행
5. [ ] Git for Windows 업데이트 안내 출력

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft | ohg0219 |
