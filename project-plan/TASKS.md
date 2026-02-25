# CCKit 작업 태스크

> Claude Code CLI에서 이 파일을 참조하여 순서대로 작업한다.
> 각 태스크는 독립적으로 실행 가능하며, 의존관계가 있는 경우 명시했다.

---

## Phase 1-0: 프로젝트 초기 세팅

### Task 1.0.1: Monorepo 초기화
```
목표: pnpm workspace + Turborepo 기반 monorepo 세팅
작업:
  1. 루트 package.json 생성 (pnpm workspaces 설정)
  2. pnpm-workspace.yaml 생성
  3. turbo.json 생성 (build, dev, lint 파이프라인)
  4. .gitignore 생성
  5. .nvmrc (Node 20 LTS)
  6. apps/, packages/ 디렉토리 생성

완료 조건: pnpm install 성공
```

### Task 1.0.2: Next.js 웹앱 초기화
```
의존: Task 1.0.1
목표: apps/web에 Next.js 15 + TypeScript + Tailwind 세팅
작업:
  1. apps/web에 Next.js 15 프로젝트 생성 (App Router, TypeScript)
  2. Tailwind CSS 4 설치 및 설정
  3. next-intl 설치 및 i18n 라우팅 설정 ([locale] 구조)
  4. src/messages/ko.json, en.json 빈 파일 생성
  5. src/app/[locale]/layout.tsx 기본 레이아웃
  6. src/app/[locale]/page.tsx 빈 랜딩 페이지
  7. 환경 변수 파일 (.env.local.example)

완료 조건: pnpm --filter web dev → localhost:3000 에서 한국어 기본 페이지 렌더링
```

### Task 1.0.3: Supabase 프로젝트 연동
```
의존: Task 1.0.2
목표: Supabase 클라이언트 설정 + DB 스키마 문서화
작업:
  1. @supabase/supabase-js, @supabase/ssr 설치
  2. src/lib/supabase/client.ts (브라우저용)
  3. src/lib/supabase/server.ts (서버 컴포넌트용)
  4. supabase/schema.sql 작성 (참조용 스키마 문서)
     - profiles 테이블
     - kits 테이블
     - kit_reviews 테이블
     - kit_installs 테이블
     - RLS 정책
  5. src/lib/supabase/types.ts (Supabase 생성 타입 또는 수동 타입)

⚠️ 주의: Supabase CLI는 사용하지 않음.
  - 테이블 생성, RLS 정책, Auth 설정은 사용자가 Supabase 웹 대시보드에서 직접 실행
  - supabase/schema.sql은 대시보드 SQL Editor에 복붙할 수 있도록 작성
  - Claude Code는 SQL 파일 작성 + 클라이언트 코드만 담당

완료 조건: 클라이언트 코드 준비 완료 + schema.sql에 실행 가능한 SQL 작성됨
참고: DB 스키마는 project-plan/PLANNING.md 섹션 6 참조
```

### Task 1.0.4: GitHub OAuth 인증
```
의존: Task 1.0.3
목표: GitHub 로그인 → Supabase Auth → profiles 자동 생성
작업:
  1. src/app/[locale]/auth/login/page.tsx (로그인 버튼)
  2. src/app/[locale]/auth/callback/route.ts (OAuth 콜백)
  3. profiles 자동 생성 트리거 SQL 작성 (supabase/schema.sql에 포함)
  4. 로그인 상태에 따른 네비게이션 변경

⚠️ 주의: GitHub OAuth provider 설정은 사용자가 Supabase 대시보드에서 직접 진행
  - Authentication > Providers > GitHub 활성화
  - GitHub OAuth App 생성 (GitHub Settings > Developer settings)
  - Client ID, Client Secret을 Supabase에 입력

완료 조건: GitHub 로그인 → 프로필 생성 → 로그인 상태 유지
```

### Task 1.0.5: 공유 패키지 세팅
```
의존: Task 1.0.1
목표: packages/shared에 공유 타입 정의
작업:
  1. packages/shared/package.json
  2. packages/shared/tsconfig.json
  3. packages/shared/src/types/kit.ts
     - Kit, KitComponent, Skill, Hook, Agent 인터페이스
     - KitYaml 타입
     - KitCategory enum
  4. packages/shared/src/types/api.ts
     - API 요청/응답 타입
  5. packages/shared/src/validators/kit-yaml.ts
     - zod 기반 kit.yaml 유효성 검증 스키마

완료 조건: web과 cli에서 import 가능
참고: kit.yaml 스펙은 project-plan/PLANNING.md 섹션 5.2 참조
```

---

## Phase 1-1: 랜딩 페이지

### Task 1.1.1: 글로벌 레이아웃 + 네비게이션
```
의존: Task 1.0.2, Task 1.0.4
목표: 전체 사이트 공통 레이아웃
작업:
  1. src/components/layout/header.tsx
     - 로고 (⚡ CCKit)
     - 네비게이션: 탐색, 등록, 문서
     - 로그인/프로필 버튼
     - 언어 전환 (🇰🇷/🇺🇸)
  2. src/components/layout/footer.tsx
  3. layout.tsx에 다크 테마 기본 적용
  4. Tailwind 커스텀 컬러 (accent, green, orange 등)

디자인 방향:
  - 다크 테마 (#0a0a0f 배경)
  - 모노스페이스 코드 폰트 (JetBrains Mono)
  - 한국어 본문 폰트 (Noto Sans KR 또는 Pretendard)
  - 보라색 계열 accent (#6c5ce7)

완료 조건: 모든 페이지에 헤더/푸터 렌더링
```

### Task 1.1.2: 랜딩 페이지 구현
```
의존: Task 1.1.1
목표: 와이어프레임의 메인 페이지 구현
작업:
  1. Hero 섹션
     - 제목: "프로젝트에 맞는 AI 인프라를 한 번에 설치하세요"
     - 설명 텍스트
     - CLI 명령어 블록 (복사 기능 포함)
  2. 통계 섹션 (킷 수, Skills+Hooks 수, 설치 수)
  3. 카테고리 태그 섹션
  4. 인기 킷 3개 카드 그리드
  5. CTA 섹션
  6. 반응형 (모바일/태블릿/데스크톱)

컴포넌트:
  - src/components/cli-block.tsx (명령어 + 복사 버튼)
  - src/components/kit-card.tsx (킷 카드)
  - src/components/stat-counter.tsx (통계 숫자)

완료 조건: 와이어프레임의 랜딩 페이지와 동일한 레이아웃
참고: 와이어프레임은 cckit-planning-wireframe.html 파일 참조
```

---

## Phase 1-2: 킷 목록/상세

### Task 1.2.1: 킷 목록 API
```
의존: Task 1.0.3
목표: 킷 목록 조회 API (필터, 정렬, 페이지네이션)
작업:
  1. src/app/api/kits/route.ts
     - GET: 킷 목록
     - 쿼리 파라미터: category, tags, has_hooks, has_agents, sort, page, limit, q
     - Supabase 풀텍스트 검색
  2. src/app/api/kits/[slug]/route.ts
     - GET: 킷 상세 (리뷰, 설치 수 포함)

완료 조건: /api/kits?category=backend 응답 정상
```

### Task 1.2.2: 킷 탐색 페이지
```
의존: Task 1.2.1, Task 1.1.1
목표: 와이어프레임의 탐색 페이지 구현
작업:
  1. src/app/[locale]/explore/page.tsx
  2. src/components/search-bar.tsx (검색 + 카테고리 필터)
  3. src/components/kit-filter.tsx (구성 필터: Skills/Hooks/Agents)
  4. 킷 카드 그리드 (2열 반응형)
  5. 정렬 옵션 (인기순, 최신순, 설치순)
  6. 무한 스크롤 또는 페이지네이션

완료 조건: 검색/필터/정렬이 동작하는 탐색 페이지
```

### Task 1.2.3: 킷 상세 페이지
```
의존: Task 1.2.1, Task 1.1.1
목표: 와이어프레임의 상세 페이지 구현
작업:
  1. src/app/[locale]/kit/[slug]/page.tsx
  2. 좌측 메인:
     - 킷 메타 정보 (아이콘, 이름, 저자, 별점)
     - CLI 설치 명령어 (복사)
     - 설명
     - src/components/file-tree.tsx (킷 파일 구조 트리)
     - src/components/hook-diagram.tsx (Hook 파이프라인 시각화)
  3. 우측 사이드바:
     - 킷 통계 (설치 수, 별점, 구성 수)
     - 호환 에이전트
     - 기술 태그
     - 추천 킷
  4. 반응형 (모바일에서 사이드바 하단으로)

완료 조건: /kit/spring-boot-enterprise 에서 상세 정보 + 파일 트리 + Hook 다이어그램 표시
```

---

## Phase 1-3: CLI 도구

### Task 1.3.1: CLI 프로젝트 초기화
```
의존: Task 1.0.5
목표: apps/cli에 Node.js CLI 프로젝트 세팅
작업:
  1. apps/cli/package.json
     - name: "cckit"
     - bin: { "cckit": "./dist/index.js" }
  2. apps/cli/tsconfig.json
  3. Commander.js, chalk, inquirer, ora 설치
  4. src/index.ts (CLI 엔트리포인트, 명령어 라우팅)
  5. src/utils/logger.ts (chalk 기반 로깅 유틸)
  6. src/utils/config.ts (API URL 등 설정)

완료 조건: npx ts-node apps/cli/src/index.ts --help 출력
```

### Task 1.3.2: install 명령어 구현
```
의존: Task 1.3.1, Task 1.2.1
목표: cckit install <slug> 명령어 구현
작업:
  1. src/commands/install.ts
  2. src/lib/api.ts (웹 API에서 킷 정보 + 파일 목록 가져오기)
  3. src/lib/installer.ts
     - GitHub raw URL에서 파일 다운로드
     - Skills → .claude/skills/ 복사
     - Agents → .claude/agents/ 복사
     - CLAUDE.md → 루트 (기존 파일 있으면 병합 여부 확인)
     - Hooks → .claude/settings.json 병합
       * 기존 settings.json 읽기
       * hooks 배열에 새 항목 추가 (중복 체크)
       * 파일 저장
  4. --dry-run 옵션 (파일 변경 없이 미리보기)
  5. --skip-hooks, --skip-agents 옵션
  6. 설치 완료 후 API에 설치 수 증가 호출

완료 조건: npx cckit install spring-boot-enterprise → 파일 설치 성공
참고: 설치 플로우는 project-plan/PLANNING.md 섹션 8 참조
```

### Task 1.3.3: search, list 명령어
```
의존: Task 1.3.1, Task 1.2.1
목표: 나머지 CLI 명령어
작업:
  1. src/commands/search.ts
     - cckit search <query> --category <cat> --has-hooks
     - 테이블 형태 출력 (이름, 설명, 설치 수, 구성)
  2. src/commands/list.ts
     - 현재 프로젝트에 설치된 킷 목록
     - .claude/skills/, .claude/agents/ 스캔
  3. src/commands/init.ts (Phase 2에서 상세 구현)
     - 인터랙티브 kit.yaml 생성

완료 조건: cckit search spring-boot → 검색 결과 표시
```

---

## Phase 1-4: 시드 데이터

### Task 1.4.1: spring-boot-enterprise 시드 킷 작성
```
의존: Task 1.0.5
목표: 첫 번째 킷을 직접 작성하여 시드 데이터로 사용
작업:
  1. 별도 GitHub repo 생성: cckit-spring-boot-enterprise
  2. kit.yaml 작성
  3. CLAUDE.md 작성 (Spring Boot 프로젝트 컨텍스트)
  4. skills/ 작성:
     - spring-boot-guidelines/SKILL.md
     - mybatis-mapper-guide/SKILL.md
     - thymeleaf-patterns/SKILL.md
     - java-testing/SKILL.md
     - gradle-build/SKILL.md
  5. hooks/ 작성:
     - pre-build-verify.sh
     - lint-on-save.sh
     - secret-scan.sh
     - test-coverage-check.sh
     - conventional-commit.sh
     - forbidden-files.sh
     - notification-slack.sh
  6. agents/ 작성:
     - code-reviewer.md
     - architecture-planner.md
  7. README.md

완료 조건: kit.yaml 유효성 검증 통과, 파일 구조 완성
참고: Hook 메타데이터 형식은 project-plan/PLANNING.md 섹션 5.3 참조
```

### Task 1.4.2: DB 시드 데이터
```
의존: Task 1.0.3, Task 1.4.1
목표: 개발/데모용 시드 데이터 SQL 작성
작업:
  1. supabase/seed.sql 작성
     - 테스트 사용자 1명
     - spring-boot-enterprise 킷 1개
     - 데모용 추가 킷 2~3개 (nextjs-fullstack, python-data-science)
     - 샘플 리뷰 5개

⚠️ 주의: 실행은 사용자가 Supabase 대시보드 SQL Editor에서 직접 진행

완료 조건: seed.sql 작성 완료, 대시보드에서 복붙 실행 가능한 상태
```

---

## Phase 1-5: 배포

### Task 1.5.1: Vercel 배포
```
의존: Phase 1-1 ~ 1-4 모두
목표: 웹사이트 프로덕션 배포
작업:
  1. Vercel 프로젝트 생성 (monorepo 설정)
  2. 환경 변수 설정 (Supabase, GitHub OAuth)
  3. 도메인 연결 (cckit.dev 또는 임시 vercel.app)
  4. Vercel Analytics 활성화
  5. Preview 배포 확인 (PR 별)

완료 조건: 프로덕션 URL에서 사이트 정상 동작
```

### Task 1.5.2: CLI npm 배포
```
의존: Task 1.3.2
목표: npx cckit 사용 가능하도록 npm 배포
작업:
  1. npm 계정 준비
  2. CLI 빌드 (TypeScript → JavaScript)
  3. npm publish
  4. npx cckit --version 테스트
  5. npx cckit install spring-boot-enterprise E2E 테스트

완료 조건: npx cckit install spring-boot-enterprise 성공
```

---

## 작업 순서 요약

```
1.0.1 Monorepo 초기화
  ├─ 1.0.2 Next.js 세팅
  │   ├─ 1.0.3 Supabase 연동
  │   │   ├─ 1.0.4 GitHub OAuth
  │   │   ├─ 1.2.1 킷 API
  │   │   └─ 1.4.2 시드 데이터
  │   └─ 1.1.1 글로벌 레이아웃
  │       ├─ 1.1.2 랜딩 페이지
  │       ├─ 1.2.2 탐색 페이지
  │       └─ 1.2.3 상세 페이지
  ├─ 1.0.5 공유 패키지
  │   ├─ 1.3.1 CLI 초기화
  │   │   ├─ 1.3.2 install 명령어
  │   │   └─ 1.3.3 search/list 명령어
  │   └─ 1.4.1 시드 킷 작성
  └─ 1.5.1 Vercel 배포
      └─ 1.5.2 CLI npm 배포
```
