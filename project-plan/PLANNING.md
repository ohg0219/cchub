# CCKit 기획 문서

## 1. 프로젝트 비전

### 한 줄 요약
> `npx cckit install spring-boot-enterprise` — Claude Code 프로젝트 인프라를 한 번에 세팅하는 마켓플레이스

### 왜 만드는가
기존 Skills 마켓플레이스(skills.sh, skillsmp.com, skillhub.club)는 개별 SKILL.md 파일을 공유한다.
하지만 실제 개발자가 필요한 건 "내 프로젝트 타입에 맞는 전체 AI 인프라 세팅"이다.

우리는 Skills + Hooks + Agents + CLAUDE.md를 하나의 "스타터 킷"으로 묶어, CLI 한 줄로 설치하는 경험을 제공한다.

### 핵심 차별화
1. **패키지 단위 공유**: 개별 스킬이 아닌 Skills + Hooks + Agents + CLAUDE.md 번들
2. **Hooks 최초 전문 지원**: 기존 사이트 중 Hooks를 전문적으로 다루는 곳 없음
3. **한국 개발자 우선 타겟**: 한국어 UI + Java/Spring Boot 생태계 특화
4. **인터랙티브 프리뷰**: 설치 전 파일 구조와 Hook 동작 시각화

---

## 2. 경쟁 분석

| 사이트 | 콘텐츠 단위 | Skills | Hooks | Agents | 번들 | CLI | 한국어 |
|--------|------------|--------|-------|--------|------|-----|--------|
| skills.sh | 개별 Skill | ✓ | ✗ | ✗ | ✗ | ✓ npx | ✗ |
| skillsmp.com | 개별 Skill | ✓ | ✗ | ✗ | ✗ | 수동 | ✗ |
| skillhub.club | Skill + Stack | ✓ | ✗ | ✗ | △ | 수동 | ✗ |
| claudecodeplugins.io | Plugin Pack | ✓ | ✗ | ✗ | △ | ✓ | ✗ |
| **cckit.dev (우리)** | **Starter Kit** | **✓** | **✓** | **✓** | **✓** | **✓ npx** | **✓** |

### 기회 영역
- Hooks 공유 플랫폼 전무
- Skills + Hooks + Agents 조합 최적화 부재
- 비영어권 / Java 생태계 완전히 소외

---

## 3. 타겟 사용자

### Primary: 한국 기업 개발자
- Spring Boot, MyBatis, JPA, Gradle 환경
- 팀 전체에 일관된 Claude Code 인프라를 세팅하고 싶은 시니어/리드
- 채널: okky, velog, disquiet, 회사 기술 블로그

### Secondary: 글로벌 AI 코딩 도구 사용자
- Claude Code, Cursor, Copilot 적극 활용
- 다양한 프로젝트 타입별 최적 세팅 탐색
- 채널: Reddit r/ClaudeAI, Twitter/X, Hacker News

### Tertiary: 킷 제작자 / 기여자
- 자신만의 Claude Code 인프라를 공유하고 싶은 개발자
- GitHub 기반 배포, 설치 수/별점 피드백

---

## 4. 페이지 구성

### 4.1 랜딩 페이지 (`/`)
- Hero: 핵심 가치 + CLI 설치 명령어 블록
- 통계: 킷 수, Skills+Hooks 수, 설치 수
- 인기 카테고리 태그 (Spring Boot, React, Python 등)
- 인기 킷 3개 카드 그리드
- CTA: "킷 탐색하기" / "내 킷 등록하기"

### 4.2 킷 탐색 (`/explore`)
- 검색바 (키워드 + AI 검색)
- 카테고리 필터: Backend, Frontend, Data, DevOps, Mobile
- 구성 필터: Skills 포함, Hooks 포함, Agents 포함
- 정렬: 인기순 / 최신순 / 설치순
- 킷 카드 그리드 (2열)
  - 각 카드: 아이콘, 이름, 설명, 태그, 별점, 설치 수, 구성 배지

### 4.3 킷 상세 (`/kit/[slug]`)
- 좌측 (메인):
  - 킷 메타 (아이콘, 이름, 저자, 업데이트일, 별점)
  - CLI 설치 명령어 (복사 버튼)
  - 설명
  - 킷 구성 파일 목록 (파일 트리 형태, 타입별 아이콘 구분)
  - Hook 동작 다이어그램 (파이프라인 시각화)
  - README 렌더링
- 우측 (사이드바):
  - 킷 정보 (설치 수, 별점, Skills/Hooks/Agents 수, 라이선스)
  - 호환 에이전트 태그
  - 기술 태그
  - 추천 킷 ("같이 쓰면 좋은 킷")

### 4.4 킷 등록 (`/submit`)
- GitHub 리포지토리 URL 입력
- 자동 감지 결과 (Skills, Hooks, Agents, CLAUDE.md 수)
- 카테고리 선택
- 언어 선택 (한국어, English, 日本語)
- 제출 버튼

### 4.5 인증 (`/auth`)
- GitHub OAuth 로그인
- 프로필 (등록한 킷 목록, 설치 통계)

---

## 5. 스타터 킷 패키지 스펙

### 5.1 디렉토리 구조

```
<kit-name>/
├── kit.yaml                    # 필수: 킷 메타데이터
├── CLAUDE.md                   # 선택: 프로젝트 컨텍스트 템플릿
├── skills/                     # 선택: SKILL.md 파일들
│   ├── <skill-name>/
│   │   └── SKILL.md
│   └── ...
├── hooks/                      # 선택: Hook 스크립트들
│   ├── <hook-name>.sh
│   └── ...
├── agents/                     # 선택: Agent 정의 파일들
│   ├── <agent-name>.md
│   └── ...
└── README.md                   # 선택: 킷 설명
```

### 5.2 kit.yaml 스펙

```yaml
# 필수 필드
name: spring-boot-enterprise          # 킷 이름 (slug, 소문자+하이픈)
version: 1.2.0                        # 시맨틱 버전
description: "Spring Boot + MyBatis + Thymeleaf 종합 킷"
author: hayden                        # GitHub username
license: MIT

# 선택 필드
language: [ko, en]                    # 지원 언어
category: backend                     # backend | frontend | data | devops | mobile | fullstack
tags: [java, spring-boot, mybatis, thymeleaf, gradle]
agents: [claude-code, cursor, copilot]  # 호환 에이전트
min_java: "17"                        # 프레임워크별 최소 요구사항

# 자동 계산 (등록 시 서버에서 분석)
components:
  skills: 5
  hooks: 7
  agents: 2
  claude_md: true

# 설치 경로 매핑
install:
  target:
    skills: .claude/skills/            # 스킬 설치 위치
    hooks: .claude/settings.json       # hooks 설정에 자동 병합
    agents: .claude/agents/            # 에이전트 설치 위치
    claude_md: ./CLAUDE.md             # 루트에 배치 (기존 파일 병합)
```

### 5.3 Hook 정의 형식

hooks/ 디렉토리의 각 스크립트는 아래 주석 형식으로 메타데이터를 포함한다:

```bash
#!/bin/bash
# @hook-type: PostToolUse
# @hook-event: Write, Edit
# @hook-description: Gradle 빌드 성공 여부 자동 검증
# @hook-matcher: "*.java" "*.kt"

# 스크립트 본문
./gradlew build --quiet 2>&1
if [ $? -ne 0 ]; then
  echo "❌ 빌드 실패! 수정이 필요합니다."
  exit 1
fi
echo "✅ 빌드 성공"
```

CLI 설치 시 이 메타데이터를 파싱해 `.claude/settings.json`의 hooks 배열에 자동 병합한다.

---

## 6. 데이터베이스 스키마

### profiles (사용자)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  github_username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### kits (스타터 킷)
```sql
CREATE TABLE kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  github_repo TEXT NOT NULL,              -- "username/repo"
  github_branch TEXT DEFAULT 'main',
  version TEXT NOT NULL,
  license TEXT,
  category TEXT NOT NULL,                 -- backend, frontend, data, devops, mobile, fullstack
  languages TEXT[] DEFAULT '{ko}',
  tags TEXT[] DEFAULT '{}',
  compatible_agents TEXT[] DEFAULT '{claude-code}',
  
  -- 구성 수 (자동 계산)
  skills_count INTEGER DEFAULT 0,
  hooks_count INTEGER DEFAULT 0,
  agents_count INTEGER DEFAULT 0,
  has_claude_md BOOLEAN DEFAULT FALSE,
  
  -- 통계
  install_count INTEGER DEFAULT 0,
  star_count INTEGER DEFAULT 0,
  
  -- kit.yaml 원본
  kit_yaml JSONB,
  
  -- 파일 구조 스냅샷
  file_tree JSONB,
  
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kits_category ON kits(category);
CREATE INDEX idx_kits_tags ON kits USING GIN(tags);
CREATE INDEX idx_kits_slug ON kits(slug);
```

### kit_reviews (리뷰)
```sql
CREATE TABLE kit_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES kits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### kit_installs (설치 트래킹)
```sql
CREATE TABLE kit_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES kits(id) ON DELETE CASCADE,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  cli_version TEXT,
  agent_type TEXT                        -- claude-code, cursor 등
);
```

---

## 7. API 엔드포인트

### 킷 API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/kits` | 킷 목록 (필터, 정렬, 페이지네이션) |
| GET | `/api/kits/[slug]` | 킷 상세 |
| POST | `/api/kits` | 킷 등록 (인증 필요) |
| PUT | `/api/kits/[slug]` | 킷 수정 (저자만) |
| DELETE | `/api/kits/[slug]` | 킷 삭제 (저자만) |
| POST | `/api/kits/[slug]/install` | 설치 수 증가 (CLI에서 호출) |

### GitHub 분석 API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/github/analyze` | GitHub repo URL → kit.yaml/파일 구조 자동 분석 |

### 검색 API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/search?q=spring+boot&category=backend` | 풀텍스트 검색 |

---

## 8. CLI 명령어 스펙

```bash
# 킷 설치
npx cckit install <kit-slug>
npx cckit install <kit-slug> --skip-hooks    # Hooks 제외
npx cckit install <kit-slug> --skip-agents   # Agents 제외
npx cckit install <kit-slug> --dry-run       # 미리보기 (파일 변경 없음)

# 킷 검색
npx cckit search <query>
npx cckit search --category backend --has-hooks

# 설치된 킷 목록
npx cckit list

# 킷 삭제 (설치 역방향)
npx cckit uninstall <kit-slug>

# 인터랙티브 킷 생성 (제작자용)
npx cckit init
```

### 설치 플로우

```
$ npx cckit install spring-boot-enterprise

⚡ cckit v1.0.0
───────────────────────────────────────
📦 spring-boot-enterprise v1.2.0

구성:
  • Skills: 5개 → .claude/skills/
  • Hooks: 7개 → .claude/settings.json (병합)
  • Agents: 2개 → .claude/agents/
  • CLAUDE.md → ./CLAUDE.md

계속 설치하시겠습니까? (Y/n) Y

✓ CLAUDE.md → ./CLAUDE.md
✓ 5 Skills → .claude/skills/
✓ 7 Hooks → .claude/settings.json (병합)
✓ 2 Agents → .claude/agents/

✨ 설치 완료! 16 파일이 프로젝트에 추가되었습니다.
   커스터마이즈: CLAUDE.md를 열어 프로젝트에 맞게 수정하세요.
```

---

## 9. 로드맵

### Phase 1 — MVP (2~3주)
- [ ] 프로젝트 초기 세팅 (monorepo, Next.js, Supabase)
- [ ] 랜딩 페이지
- [ ] 킷 목록/상세 페이지
- [ ] CLI 기본 기능 (install 명령어)
- [ ] 시드 킷: spring-boot-enterprise
- [ ] 한국어 UI + GitHub OAuth

### Phase 2 — 커뮤니티 (1~2개월)
- [ ] 킷 등록 기능 (GitHub repo 연결 → 자동 분석)
- [ ] 별점/리뷰 시스템
- [ ] 설치 수 트래킹
- [ ] Hooks 전용 필터 + Hook 동작 시각화
- [ ] 한국 커뮤니티 홍보 (velog, disquiet, okky)

### Phase 3 — 영어 확장 (2~3개월)
- [ ] 영어 UI
- [ ] 다양한 생태계 킷 (React, Python, Rust)
- [ ] 킷 제작자 프로필 + 팔로우
- [ ] AI 기반 킷 추천

### Phase 4 — 플랫폼 (3~6개월)
- [ ] 팀/조직용 프라이빗 킷 (유료)
- [ ] 킷 버전 관리 + 자동 업데이트
- [ ] MCP 서버 통합
- [ ] Cursor, Copilot, Windsurf 정식 지원

---

## 10. 수익 모델 (Phase 4+)

| 티어 | 가격 | 기능 |
|------|------|------|
| Free | 무료 | 공개 킷 탐색, 설치, 등록 |
| Pro | $9/월 | 프라이빗 킷, 팀 관리, 분석 대시보드 |
| Enterprise | 커스텀 | SSO, 감사 로그, 자체 호스팅, SLA |
