# CCKit Starter — Claude Code 개발 규칙

## 프로젝트 개요

Claude Code Starter Kit을 발견하고, 미리보고, 한 번에 설치하는 마켓플레이스 웹사이트.
Skills + Hooks + Agents + CLAUDE.md를 하나의 "스타터 킷"으로 묶어 원클릭 설치 경험을 제공한다.

## 기술 스택

- **프레임워크**: Next.js 15 (App Router, TypeScript)
- **스타일링**: Tailwind CSS 4
- **DB**: Supabase (PostgreSQL + Auth + Row Level Security)
- **인증**: GitHub OAuth (Supabase Auth)
- **배포**: Vercel
- **CLI 도구**: Node.js (Commander.js + chalk + inquirer)

## 코딩 컨벤션

- TypeScript strict mode 사용
- 컴포넌트는 함수형 + named export
- CSS는 Tailwind utility classes 사용 (inline styles 금지)
- API 라우트는 Next.js Route Handlers 사용
- 에러 핸들링: try/catch + 사용자 친화적 에러 메시지
- 커밋 메시지: Conventional Commits (feat:, fix:, docs:, chore:)
- 한국어 문자열은 반드시 messages/ko.json에, 하드코딩 금지

## PDCA 워크플로우

이 킷은 PDCA 사이클 관리 스킬을 포함합니다. `/pdca` 명령으로 시작하세요.

```
/pdca plan [feature]    → 계획 문서 작성
/pdca design [feature]  → 설계 문서 작성
/pdca do [feature]      → 구현 가이드
/pdca analyze [feature] → Gap 분석
/pdca report [feature]  → 완료 보고서
```

## 주요 도메인 개념

- **Kit**: Skills + Hooks + Agents + CLAUDE.md를 묶은 패키지
- **Skill**: SKILL.md 파일. Claude가 특정 작업에서 참조하는 가이드
- **Hook**: Claude Code의 PreToolUse/PostToolUse/Notification에 연결되는 자동화 스크립트
- **Agent**: 특정 역할에 특화된 Claude 에이전트 정의 파일
- **kit.yaml**: 킷의 메타데이터 (이름, 버전, 구성, 설치 경로 등)
