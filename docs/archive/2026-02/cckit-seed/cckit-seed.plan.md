# cckit-seed Planning Document

> **Summary**: CCKit 시드 킷 데이터 작성 — spring-boot-enterprise 외 2~3개 킷 + DB 시드
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Parent**: cckit-mvp (Phase 1-4)
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

마켓플레이스가 의미 있으려면 실제 설치 가능한 킷이 있어야 한다.
CCKit 자체를 시드 킷으로 활용하는 것을 포함해, 한국 개발자가 즉시 쓸 수 있는 3개 이상의 킷을 제작한다.

### 1.2 Background

- cckit-explore 탐색 페이지, cckit-landing 인기 킷 섹션, cckit-cli 설치 테스트 모두 시드 킷이 필요
- 킷은 GitHub public repo에 업로드해 CCKit DB에 등록하는 방식
- CCKit 자체 스킬/훅/에이전트가 1차 시드 킷으로 가장 적합

### 1.3 Related Documents

- kit.yaml 스펙: `project-plan/kit-spec.md`
- DB 스키마: `supabase/schema.sql`
- 상위 기획: `docs/01-plan/features/cckit-mvp.plan.md`

---

## 2. Scope

### 2.1 In Scope

- [ ] **cckit-starter 킷**: 이 레포지토리의 Skills/Hooks/Agents/CLAUDE.md 패키징
- [ ] **spring-boot-enterprise 킷**: Java/Spring Boot 개발자용 AI 인프라 킷
- [ ] **nextjs-fullstack 킷**: Next.js 풀스택 프로젝트용 킷 (MVP 레벨)
- [ ] 각 킷의 `kit.yaml` 메타데이터 작성
- [ ] Supabase DB 시드 데이터 (SQL INSERT 또는 대시보드 수동 입력)
- [ ] 각 킷을 GitHub public repo에 업로드 (또는 서브디렉토리로 관리)

### 2.2 Out of Scope

- 50개 이상 킷 (Phase 2 커뮤니티 기여)
- 킷 자동 등록 파이프라인 (Phase 2)
- python/go/rust 킷 (Phase 2)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | cckit-starter 킷 — kit.yaml + Skills/Hooks/Agents 파일 구성 | High | Pending |
| FR-02 | spring-boot-enterprise 킷 — kit.yaml + Java/Spring 특화 스킬 | High | Pending |
| FR-03 | nextjs-fullstack 킷 — kit.yaml + Next.js 특화 스킬 | Medium | Pending |
| FR-04 | 각 킷 GitHub repo (또는 서브디렉토리) 업로드 | High | Pending |
| FR-05 | Supabase kits 테이블 시드 데이터 3개 이상 | High | Pending |
| FR-06 | `npx cckit install cckit-starter` 정상 설치 확인 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Quality | kit.yaml 스펙 유효성 검증 통과 | kit-validator 실행 |
| Usability | 각 킷 README — 용도/설치/포함 파일 설명 | 수동 검토 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 3개 이상 킷 GitHub에 업로드
- [ ] Supabase kits 테이블에 시드 데이터 입력
- [ ] cckit-landing 인기 킷 섹션에 실제 킷 표시
- [ ] `npx cckit install spring-boot-enterprise` E2E 성공

### 4.2 Quality Criteria

- [ ] kit.yaml 유효성 검증 통과 (packages/shared 검증기)
- [ ] 각 킷 README 존재

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 킷 콘텐츠 품질이 낮으면 시장 신뢰 하락 | Medium | Medium | 자체 사용 중인 CCKit 킷 우선 패키징 |
| GitHub repo 구조 결정 지연 | Medium | Medium | 단일 monorepo 내 `seeds/` 디렉토리로 먼저 시작 |

---

## 6. Architecture Considerations

### 6.1 킷 저장소 구조

```
seeds/
├── cckit-starter/
│   ├── kit.yaml
│   ├── skills/
│   ├── hooks/
│   ├── agents/
│   └── CLAUDE.md
├── spring-boot-enterprise/
│   ├── kit.yaml
│   ├── skills/
│   └── CLAUDE.md
└── nextjs-fullstack/
    ├── kit.yaml
    ├── skills/
    └── CLAUDE.md
```

### 6.2 kit.yaml 구조 (예시)

```yaml
name: cckit-starter
slug: cckit-starter
version: 1.0.0
description: CCKit 마켓플레이스 개발용 AI 스타터 킷
category: productivity
author: CCKit Team
github: https://github.com/...
files:
  - src: skills/pdca.md
    dest: .claude/skills/pdca.md
    type: skill
  - src: hooks/pre-commit.sh
    dest: .claude/hooks/pre-commit.sh
    type: hook
```

---

## 7. Next Steps

1. [ ] kit.yaml 스펙 최종 확인 (`project-plan/kit-spec.md`)
2. [ ] `seeds/` 디렉토리 구조 확정
3. [ ] cckit-starter 킷 먼저 작성 후 설치 테스트

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft — cckit-mvp Phase 1-4 분리 | CCKit Team |
