# cckit-seed Design Document

> **Summary**: CCKit 시드 킷 3종(cckit-starter, spring-boot-enterprise, nextjs-fullstack) 파일 작성 및 Supabase DB 시드 데이터 설계
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Status**: Draft
> **Planning Doc**: [cckit-seed.plan.md](../01-plan/features/cckit-seed.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- `seeds/` 디렉토리 내 3개 킷의 파일 구조와 kit.yaml을 완전히 정의한다
- 각 킷은 `packages/shared`의 kit-yaml 검증기를 통과해야 한다
- Supabase `kits` 테이블에 삽입할 수 있는 시드 SQL을 설계한다
- `npx cckit install <kit-name>` 시나리오를 검증할 수 있는 구조로 만든다

### 1.2 Design Principles

- **Content First**: 코드보다 킷 콘텐츠 품질이 우선
- **실사용 기반**: CCKit 자체가 사용하는 실제 파일을 cckit-starter에 패키징
- **최소 유효 구조**: 킷마다 필수 파일(kit.yaml + 최소 1개 스킬)만 보장
- **독립성**: 각 킷은 독립적으로 설치 가능해야 함

---

## 2. Architecture

### 2.1 Component Diagram

```
seeds/
├── cckit-starter/          ← CCKit 자체 AI 워크플로우 킷
├── spring-boot-enterprise/ ← Java/Spring Boot 백엔드 킷
└── nextjs-fullstack/       ← Next.js 풀스택 킷

supabase/
└── seed.sql               ← kits 테이블 INSERT SQL (대시보드에서 실행)
```

### 2.2 Data Flow

```
seeds/{kit}/kit.yaml
    → CLI installer.ts (kit-validator 통과)
    → .claude/skills/, .claude/agents/, .claude/settings.json 복사
    → API /api/install 설치 카운트 +1
    → Supabase kits 테이블 (웹 표시)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| seeds/*/kit.yaml | packages/shared/kit-yaml 검증기 | 스펙 유효성 확인 |
| supabase/seed.sql | supabase/schema.sql | kits 테이블 구조 |
| CLI install 테스트 | apps/cli 빌드 완료 | E2E 설치 확인 |

---

## 3. 킷 파일 구조 설계

### 3.1 seeds/ 전체 구조

```
seeds/
├── cckit-starter/
│   ├── kit.yaml
│   ├── README.md
│   ├── CLAUDE.md
│   ├── skills/
│   │   ├── pdca/
│   │   │   ├── SKILL.md
│   │   │   ├── plan.template.md
│   │   │   ├── design.template.md
│   │   │   ├── do.template.md
│   │   │   ├── analysis.template.md
│   │   │   └── report.template.md
│   │   └── skill-maker/
│   │       └── SKILL.md
│   ├── agents/
│   │   ├── code-analyzer/
│   │   │   └── AGENT.md
│   │   ├── gap-detector/
│   │   │   └── AGENT.md
│   │   ├── pdca-iterator/
│   │   │   └── AGENT.md
│   │   └── report-generator/
│   │       └── AGENT.md
│   └── hooks/
│       ├── session-start.js
│       ├── pre-compact.js
│       └── stop.js
│
├── spring-boot-enterprise/
│   ├── kit.yaml
│   ├── README.md
│   ├── CLAUDE.md
│   └── skills/
│       ├── spring-boot/
│       │   └── SKILL.md
│       ├── mybatis/
│       │   └── SKILL.md
│       └── java-conventions/
│           └── SKILL.md
│
└── nextjs-fullstack/
    ├── kit.yaml
    ├── README.md
    ├── CLAUDE.md
    └── skills/
        ├── nextjs-patterns/
            └── SKILL.md
```

### 3.2 kit.yaml 스펙 상세

#### cckit-starter

```yaml
name: cckit-starter
version: 1.0.0
description: CCKit 마켓플레이스 개발용 PDCA AI 워크플로우 킷 — Skills/Agents/Hooks 포함
author: cckit-team
license: MIT
language: ["ko", "en"]
category: fullstack
tags: ["pdca", "workflow", "claude-code", "agents", "hooks"]
compatible_agents: ["claude-code"]
requirements:
  node: ">=18"
components:
  skills: 2
  hooks: 3
  agents: 4
  claude_md: true
install:
  target:
    skills: ".claude/skills/"
    hooks: ".claude/hooks/"
    agents: ".claude/agents/"
    claude_md: "./CLAUDE.md"
```

#### spring-boot-enterprise

```yaml
name: spring-boot-enterprise
version: 1.0.0
description: Java Spring Boot + MyBatis + Thymeleaf 엔터프라이즈 개발용 AI 스타터 킷
author: cckit-team
license: MIT
language: ["ko"]
category: backend
tags: ["java", "spring-boot", "mybatis", "thymeleaf", "enterprise"]
compatible_agents: ["claude-code"]
requirements:
  java: ">=17"
components:
  skills: 3
  hooks: 0
  agents: 0
  claude_md: true
install:
  target:
    skills: ".claude/skills/"
    claude_md: "./CLAUDE.md"
```

#### nextjs-fullstack

```yaml
name: nextjs-fullstack
version: 1.0.0
description: Next.js 15 App Router + TypeScript + Tailwind CSS 풀스택 개발 스타터 킷
author: cckit-team
license: MIT
language: ["ko", "en"]
category: fullstack
tags: ["nextjs", "typescript", "tailwind", "react", "app-router"]
compatible_agents: ["claude-code"]
requirements:
  node: ">=18"
components:
  skills: 1
  hooks: 0
  agents: 0
  claude_md: true
install:
  target:
    skills: ".claude/skills/"
    claude_md: "./CLAUDE.md"
```

---

## 4. 킷 콘텐츠 상세 설계

### 4.1 cckit-starter 콘텐츠

**CLAUDE.md**: CCKit 개발 규칙 요약본 (현재 CLAUDE.md의 핵심 섹션)

**skills/pdca/SKILL.md**: PDCA 사이클 관리 스킬 (현재 `.claude/skills/pdca/`에서 복사)

**skills/skill-maker/SKILL.md**: 스킬 생성 도구 (현재 `.claude/skills/skill-maker/`에서 복사)

**agents/**: code-analyzer, gap-detector, pdca-iterator, report-generator (4개 핵심 에이전트)

**hooks/**:
- `session-start.js`: PDCA 상태 로드 훅
- `pre-compact.js`: 컨텍스트 압축 전 저장 훅
- `stop.js`: 세션 종료 훅

### 4.2 spring-boot-enterprise 콘텐츠

**CLAUDE.md**: Spring Boot 개발 컨벤션 (패키지 구조, MyBatis 매퍼 규칙, 코드 스타일)

**skills/spring-boot/SKILL.md**: Spring Boot 아키텍처 가이드
```
- 레이어드 아키텍처 (Controller → Service → Repository)
- @Transactional 사용 원칙
- 예외 처리 (@ControllerAdvice)
- DTO/VO 구분 원칙
```

**skills/mybatis/SKILL.md**: MyBatis 매퍼 작성 가이드
```
- XML 매퍼 vs 어노테이션 사용 기준
- 동적 SQL (if/choose/foreach)
- resultMap 설계 원칙
- N+1 문제 방지
```

**skills/java-conventions/SKILL.md**: Java 코딩 컨벤션
```
- 명명 규칙 (클래스/메서드/변수/상수)
- 주석 작성 규칙 (Javadoc)
- 패키지 구조 표준
- 테스트 작성 원칙 (JUnit 5)
```

### 4.3 nextjs-fullstack 콘텐츠

**CLAUDE.md**: Next.js 15 App Router 개발 규칙 (현재 CCKit 프로젝트 규칙 기반)

**skills/nextjs-patterns/SKILL.md**: Next.js 패턴 가이드
```
- App Router 라우팅 규칙
- Server Component vs Client Component 선택 기준
- Data Fetching 패턴 (fetch, SWR, React Query)
- Tailwind CSS 사용 원칙
- TypeScript strict mode 규칙
```

---

## 5. Supabase 시드 데이터 설계

### 5.1 시드 전략

- `supabase/seed.sql` 파일에 INSERT 문 작성
- `author_id`는 서비스 계정 UUID 사용 (별도 profiles 레코드 필요)
- `is_published = true` 로 설정하여 즉시 탐색 페이지에 표시
- `kit_yaml` 컬럼에 kit.yaml을 JSON으로 변환하여 저장
- `file_tree` 컬럼에 파일 구조 JSON 저장

### 5.2 시드 파일 구조

```
supabase/
├── schema.sql    ← 기존 (참조용 스키마)
└── seed.sql      ← 신규 (시드 데이터)
```

### 5.3 seed.sql 구조

```sql
-- 1. 시드용 서비스 계정 (profiles)
INSERT INTO profiles (id, github_username, display_name, avatar_url) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'cckit-team',
  'CCKit Team',
  'https://avatars.githubusercontent.com/u/...'
) ON CONFLICT (id) DO NOTHING;

-- 2. cckit-starter
INSERT INTO kits (
  slug, name, description, author_id, github_repo, github_branch, version,
  license, category, languages, tags, compatible_agents,
  skills_count, hooks_count, agents_count, has_claude_md,
  kit_yaml, file_tree, is_published
) VALUES (
  'cckit-starter',
  'CCKit Starter',
  'CCKit 마켓플레이스 개발용 PDCA AI 워크플로우 킷 — Skills/Agents/Hooks 포함',
  '00000000-0000-0000-0000-000000000001',
  'https://github.com/cckit-team/cckit-starter',
  'main',
  '1.0.0',
  'MIT',
  'fullstack',
  ARRAY['ko', 'en'],
  ARRAY['pdca', 'workflow', 'claude-code', 'agents', 'hooks'],
  ARRAY['claude-code'],
  2, 3, 4, true,
  '{ "name": "cckit-starter", ... }'::jsonb,
  '{ "tree": [...] }'::jsonb,
  true
);

-- 3. spring-boot-enterprise (유사 구조)
-- 4. nextjs-fullstack (유사 구조)
```

---

## 6. Error Handling

| 상황 | 처리 방법 |
|------|---------|
| kit.yaml 검증 실패 | 검증기 에러 메시지 확인 후 수정 |
| Supabase INSERT 실패 | 대시보드에서 제약 조건 확인 |
| CLI install 테스트 실패 | API 서버 로컬 실행 후 재테스트 |
| 파일 복사 경로 충돌 | install.target 경로 명시적 지정 |

---

## 7. Security Considerations

- [ ] seeds/ 파일에 API 키, 비밀번호 등 민감 정보 포함 금지
- [ ] seed.sql의 author_id는 실제 서비스 계정 UUID로 교체
- [ ] GitHub repo는 public으로 설정 (CLI가 raw 파일 접근)

---

## 8. TDD Test Scenarios

> cckit-seed는 주로 콘텐츠/데이터 작성 작업이므로 TDD보다 수동 검증 위주로 진행

### 8.1 검증 시나리오

| ID | 검증 항목 | 방법 | 기대 결과 |
|----|----------|------|----------|
| V-01 | cckit-starter kit.yaml 유효성 | kit-validator 실행 | PASS |
| V-02 | spring-boot-enterprise kit.yaml 유효성 | kit-validator 실행 | PASS |
| V-03 | nextjs-fullstack kit.yaml 유효성 | kit-validator 실행 | PASS |
| V-04 | Supabase seed INSERT | 대시보드 SQL Editor | 3건 삽입 성공 |
| V-05 | 탐색 페이지 킷 표시 | 브라우저 확인 | 3개 킷 카드 표시 |
| V-06 | CLI install cckit-starter | `npx cckit install cckit-starter` | 설치 완료 |

---

## 9. Implementation Guide

### 9.1 File Structure

```
seeds/
├── cckit-starter/
│   ├── kit.yaml
│   ├── README.md
│   ├── CLAUDE.md
│   ├── skills/pdca/  (← .claude/skills/pdca/ 복사)
│   ├── skills/skill-maker/  (← .claude/skills/skill-maker/ 복사)
│   ├── agents/  (← 4개 에이전트 복사)
│   └── hooks/  (← 3개 훅 복사)
├── spring-boot-enterprise/
│   ├── kit.yaml
│   ├── README.md
│   ├── CLAUDE.md
│   └── skills/  (신규 작성)
└── nextjs-fullstack/
    ├── kit.yaml
    ├── README.md
    ├── CLAUDE.md
    └── skills/  (신규 작성)

supabase/
└── seed.sql  (신규 작성)
```

### 9.2 Implementation Order

1. [ ] `seeds/cckit-starter/` — kit.yaml 작성 및 기존 파일 복사
2. [ ] `seeds/spring-boot-enterprise/` — kit.yaml + 스킬 콘텐츠 신규 작성
3. [ ] `seeds/nextjs-fullstack/` — kit.yaml + 스킬 콘텐츠 신규 작성
4. [ ] `supabase/seed.sql` — 3개 킷 INSERT SQL 작성
5. [ ] kit-validator 검증 실행 (V-01 ~ V-03)
6. [ ] Supabase 대시보드에서 seed.sql 실행 (V-04)
7. [ ] 브라우저에서 탐색 페이지 확인 (V-05)
8. [ ] CLI install E2E 테스트 (V-06, 선택적)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft | CCKit Team |
