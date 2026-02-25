# kit.yaml 스펙 문서

## 개요

`kit.yaml`은 스타터 킷의 메타데이터를 정의하는 파일이다.
킷의 루트 디렉토리에 위치하며, CLI 설치와 웹사이트 표시에 사용된다.

## 전체 스키마

```yaml
# ─── 필수 필드 ───
name: string                    # 킷 이름 (slug 형식: 소문자, 하이픈, 숫자만)
                                # 예: "spring-boot-enterprise"
                                # 정규식: ^[a-z0-9][a-z0-9-]*[a-z0-9]$

version: string                 # 시맨틱 버전 (x.y.z)
                                # 예: "1.2.0"

description: string             # 킷 설명 (200자 이내)
                                # 예: "Spring Boot + MyBatis + Thymeleaf 종합 킷"

author: string                  # GitHub username
                                # 예: "hayden"

license: string                 # SPDX 라이선스 식별자
                                # 예: "MIT", "Apache-2.0"

# ─── 선택 필드 ───
language: string[]              # 지원 언어 (ISO 639-1)
                                # 기본값: ["ko"]
                                # 예: ["ko", "en"]

category: enum                  # 킷 카테고리
                                # 값: backend | frontend | data | devops | mobile | fullstack
                                # 기본값: "backend"

tags: string[]                  # 기술 태그 (최대 10개)
                                # 예: ["java", "spring-boot", "mybatis"]

compatible_agents: string[]     # 호환 에이전트
                                # 값: claude-code | cursor | copilot | windsurf | cline
                                # 기본값: ["claude-code"]

# ─── 프레임워크 요구사항 (선택) ───
requirements:
  node: string                  # 최소 Node.js 버전 (예: ">=18")
  java: string                  # 최소 Java 버전 (예: ">=17")
  python: string                # 최소 Python 버전 (예: ">=3.10")
  # 기타 프레임워크별 요구사항 자유롭게 추가 가능

# ─── 구성 정보 (자동 계산, 수동 지정도 가능) ───
components:
  skills: number                # Skills 파일 수
  hooks: number                 # Hooks 파일 수
  agents: number                # Agent 파일 수
  claude_md: boolean            # CLAUDE.md 포함 여부

# ─── 설치 경로 매핑 (선택) ───
install:
  target:
    skills: string              # Skills 설치 위치 (기본: ".claude/skills/")
    hooks: string               # Hooks 설정 파일 (기본: ".claude/settings.json")
    agents: string              # Agents 설치 위치 (기본: ".claude/agents/")
    claude_md: string           # CLAUDE.md 위치 (기본: "./CLAUDE.md")
```

## Hook 메타데이터 형식

hooks/ 디렉토리의 각 스크립트 파일 상단에 주석으로 메타데이터를 정의한다.

```bash
#!/bin/bash
# @hook-type: PreToolUse | PostToolUse | Notification
# @hook-event: Write | Edit | Bash | (쉼표 구분 가능)
# @hook-description: 한 줄 설명
# @hook-matcher: "*.java" "*.kt" (glob 패턴, 선택)
```

CLI가 이 주석을 파싱하여 `.claude/settings.json`의 hooks 배열에 변환 삽입한다.

### 변환 예시

hooks/pre-build-verify.sh:
```bash
#!/bin/bash
# @hook-type: PostToolUse
# @hook-event: Write, Edit
# @hook-description: Gradle 빌드 성공 여부 자동 검증
# @hook-matcher: "*.java" "*.kt" "*.gradle"
```

→ .claude/settings.json에 추가:
```json
{
  "hooks": [
    {
      "type": "PostToolUse",
      "event": ["Write", "Edit"],
      "description": "Gradle 빌드 성공 여부 자동 검증",
      "matcher": ["*.java", "*.kt", "*.gradle"],
      "command": "bash .claude/hooks/pre-build-verify.sh"
    }
  ]
}
```

## 유효성 검증 규칙

1. `name`은 반드시 slug 형식 (`^[a-z0-9][a-z0-9-]*[a-z0-9]$`)
2. `version`은 시맨틱 버전 (`^\\d+\\.\\d+\\.\\d+$`)
3. `category`는 허용된 값 중 하나
4. `tags`는 최대 10개, 각 태그는 30자 이내
5. `components` 값은 실제 파일 수와 일치해야 함 (CLI가 검증)
6. hooks/ 파일은 반드시 `@hook-type` 메타데이터 포함

## 최소 유효 kit.yaml

```yaml
name: my-kit
version: 1.0.0
description: My first starter kit
author: myname
license: MIT
```
