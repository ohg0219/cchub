# CCKit — Claude Code Starter Kit Hub

## 프로젝트 개요

Claude Code Starter Kit을 발견하고, 미리보고, 한 번에 설치하는 마켓플레이스 웹사이트.
기존 Skills 마켓플레이스(skills.sh, skillsmp.com)가 개별 SKILL.md를 공유하는 것과 달리,
**Skills + Hooks + Agents + CLAUDE.md를 하나의 "스타터 킷"으로 묶어 원클릭 설치**하는 경험을 제공한다.

## 기술 스택

- **프레임워크**: Next.js 15 (App Router, TypeScript)
- **스타일링**: Tailwind CSS 4
- **DB**: Supabase (PostgreSQL + Auth + Row Level Security)
- **인증**: GitHub OAuth (Supabase Auth)
- **배포**: Vercel
- **CLI 도구**: Node.js (Commander.js + chalk + inquirer) → npm 배포
- **i18n**: next-intl (한국어 우선, 영어 확장)
- **검색**: Supabase Full-text Search (MVP), Algolia (확장)
- **분석**: Vercel Analytics

## 디렉토리 구조

```
cckit/
├── apps/
│   ├── web/                          # Next.js 웹사이트
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── [locale]/         # i18n 라우팅
│   │   │   │   │   ├── page.tsx      # 랜딩 페이지
│   │   │   │   │   ├── explore/      # 킷 탐색
│   │   │   │   │   ├── kit/[slug]/   # 킷 상세
│   │   │   │   │   ├── submit/       # 킷 등록
│   │   │   │   │   └── auth/         # 로그인/콜백
│   │   │   │   ├── api/
│   │   │   │   │   ├── kits/         # 킷 CRUD API
│   │   │   │   │   ├── install/      # 설치 수 트래킹
│   │   │   │   │   └── github/       # GitHub repo 분석
│   │   │   │   └── layout.tsx
│   │   │   ├── components/
│   │   │   │   ├── kit-card.tsx      # 킷 카드 컴포넌트
│   │   │   │   ├── kit-detail.tsx    # 킷 상세 뷰
│   │   │   │   ├── hook-diagram.tsx  # Hook 동작 다이어그램
│   │   │   │   ├── file-tree.tsx     # 파일 트리 뷰어
│   │   │   │   ├── cli-block.tsx     # CLI 명령어 복사 블록
│   │   │   │   └── search-bar.tsx    # 검색 + 필터
│   │   │   ├── lib/
│   │   │   │   ├── supabase/
│   │   │   │   │   ├── client.ts     # Supabase 클라이언트
│   │   │   │   │   ├── server.ts     # 서버사이드 클라이언트
│   │   │   │   │   └── types.ts      # DB 타입
│   │   │   │   ├── github.ts         # GitHub API 유틸
│   │   │   │   └── kit-parser.ts     # kit.yaml 파서
│   │   │   ├── messages/
│   │   │   │   ├── ko.json           # 한국어
│   │   │   │   └── en.json           # 영어
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── cli/                          # npx cckit CLI 도구
│       ├── src/
│       │   ├── index.ts              # CLI 엔트리포인트
│       │   ├── commands/
│       │   │   ├── install.ts        # cckit install <kit-name>
│       │   │   ├── search.ts         # cckit search <query>
│       │   │   ├── list.ts           # cckit list (설치된 킷 목록)
│       │   │   └── init.ts           # cckit init (인터랙티브 킷 생성)
│       │   ├── lib/
│       │   │   ├── api.ts            # 웹 API 호출
│       │   │   ├── installer.ts      # 파일 복사 + settings.json 병합
│       │   │   └── kit-validator.ts  # kit.yaml 유효성 검사
│       │   └── utils/
│       │       ├── logger.ts         # chalk 기반 로깅
│       │       └── config.ts         # 설정 관리
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                       # 공유 타입/유틸
│       ├── src/
│       │   ├── types/
│       │   │   ├── kit.ts            # Kit, Skill, Hook, Agent 타입
│       │   │   └── api.ts            # API 요청/응답 타입
│       │   └── validators/
│       │       └── kit-yaml.ts       # kit.yaml 스키마 검증
│       └── package.json
│
├── supabase/
│   └── schema.sql                    # 참조용 스키마 문서 (대시보드에서 실행)
│
├── project-plan/
│   ├── PLANNING.md                   # 기획 문서
│   ├── TASKS.md                      # 작업 태스크 목록
│   ├── kit-spec.md                   # kit.yaml 스펙 문서
│   └── wireframe.html                # UI 와이어프레임
│
├── turbo.json                        # Turborepo 설정
├── package.json                      # 루트 package.json (workspaces)
├── pnpm-workspace.yaml
└── CLAUDE.md                         # 이 파일
```

## 코딩 컨벤션

- TypeScript strict mode 사용
- 컴포넌트는 함수형 + named export
- CSS는 Tailwind utility classes 사용 (inline styles 금지)
- API 라우트는 Next.js Route Handlers 사용
- 에러 핸들링: try/catch + 사용자 친화적 에러 메시지
- 커밋 메시지: Conventional Commits (feat:, fix:, docs:, chore:)
- 한국어 문자열은 반드시 messages/ko.json에, 하드코딩 금지

## 주요 도메인 개념

- **Kit (킷)**: Skills + Hooks + Agents + CLAUDE.md를 묶은 패키지. GitHub repo 단위.
- **Skill**: SKILL.md 파일. Claude가 특정 작업에서 참조하는 가이드.
- **Hook**: Claude Code의 PreToolUse/PostToolUse/Notification에 연결되는 자동화 스크립트.
- **Agent**: 특정 역할에 특화된 Claude 에이전트 정의 파일.
- **kit.yaml**: 킷의 메타데이터 (이름, 버전, 구성, 설치 경로 등).

## 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Supabase 관리

- Supabase 프로젝트 설정, 마이그레이션, 시드는 **웹 대시보드(https://supabase.com/dashboard)에서 직접 진행**
- CLI(supabase cli)는 사용하지 않음 (불안정)
- supabase/ 디렉토리의 SQL 파일은 **참조용 스키마 문서**로만 관리
- 테이블 생성, RLS 정책, OAuth 설정 등은 대시보드 SQL Editor에서 실행

## 개발 명령어

```bash
pnpm install              # 의존성 설치
pnpm dev                  # 웹 + CLI 개발 서버
pnpm --filter web dev     # 웹만 개발 서버
pnpm --filter cli build   # CLI 빌드
```
