# cckit-cli Design Document

> **Summary**: `npx cckit install/search/list` CLI 도구 — 킷 설치, 검색, 목록 관리
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Status**: Draft
> **Planning Doc**: [cckit-cli.plan.md](../01-plan/features/cckit-cli.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- `npx cckit install <slug>` 한 줄로 Skills/Hooks/Agents/CLAUDE.md를 로컬 프로젝트에 배치
- Hooks 설치 시 기존 `.claude/settings.json`과 충돌 없이 딥 머지
- Node.js 18+ 내장 `fetch` 사용 (추가 HTTP 라이브러리 불필요)
- inquirer/ora/chalk 없이 MVP 가능 범위로 단순화 (inquirer는 CLAUDE.md 덮어쓰기 확인에만 사용)

### 1.2 Design Principles

- **단순 의존성**: 런타임 의존성 최소화 (commander, chalk, ora, inquirer만)
- **크로스 플랫폼**: `path.join`/`path.resolve` 일관 사용, `\` vs `/` 이슈 방지
- **멱등성**: 동일 킷 재설치 시 기존 파일 덮어쓰기 (CLAUDE.md 제외, 확인 필요)
- **추적 가능**: `.claude/.cckit-installed.json`으로 설치 이력 관리

---

## 2. Architecture

### 2.1 Component Diagram

```
CLI Entry (index.ts)
  └─ Commander.js
       ├─ install <slug> ──► InstallCommand
       │                        ├─ api.ts          → GET /api/kits/[slug]
       │                        ├─ installer.ts     → 파일 다운로드 + 배치
       │                        │    ├─ GitHub Raw fetch
       │                        │    ├─ settings.json 딥 머지
       │                        │    └─ .cckit-installed.json 기록
       │                        └─ api.ts           → POST /api/kits/[slug]/install
       ├─ search <query> ──► SearchCommand
       │                        └─ api.ts           → GET /api/kits?q=...
       └─ list ──────────────► ListCommand
                                └─ .cckit-installed.json 읽기
```

### 2.2 Install Data Flow

```
npx cckit install <slug>
  1. GET {BASE_URL}/api/kits/{slug}           → KitDetail (file_tree, hooks_meta)
  2. GitHub Raw URL 생성
     https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
  3. 파일 타입별 배치:
     kind=skill    → .claude/skills/{name}
     kind=hook     → .claude/hooks/{name}  + settings.json 딥 머지
     kind=agent    → .claude/agents/{name}
     kind=claude_md→ ./CLAUDE.md (덮어쓰기 확인 프롬프트)
     kind=other    → 무시 (MVP)
  4. .claude/.cckit-installed.json 업데이트
  5. POST {BASE_URL}/api/kits/{slug}/install
  6. 완료 메시지 출력
```

### 2.3 Dependencies

| 패키지 | 버전 | 용도 |
|--------|------|------|
| commander | ^12 | CLI 명령어 파싱 |
| chalk | ^5 | 컬러 터미널 출력 |
| ora | ^8 | 설치 진행 스피너 |
| inquirer | ^9 | CLAUDE.md 덮어쓰기 확인 프롬프트 |

> **주의**: inquirer v9+, ora v8+는 ESM only → `package.json`에 `"type": "module"` 또는 tsconfig `"module": "NodeNext"` 필요

---

## 3. Data Model

### 3.1 설치 추적 파일 (`.claude/.cckit-installed.json`)

```typescript
interface InstalledRecord {
  slug: string;
  name: string;
  version: string;
  installedAt: string;   // ISO 8601
  files: string[];       // 설치된 파일 경로 목록
}

interface InstalledManifest {
  version: '1.0';
  kits: InstalledRecord[];
}
```

### 3.2 settings.json Hook 항목 (`.claude/settings.json`)

```typescript
// Claude Code settings.json의 hooks 배열 항목
interface SettingsHookEntry {
  type: 'PreToolUse' | 'PostToolUse' | 'Notification' | 'Stop';
  event?: string[];      // 매처 이벤트 (Edit, Write, Bash 등)
  matcher?: string;      // tool 이름 매처 패턴
  description?: string;
  command: string;       // 실행할 쉘 명령어
}

interface ClaudeSettings {
  hooks?: SettingsHookEntry[];
  // 기타 Claude Code 설정 필드 (보존)
  [key: string]: unknown;
}
```

### 3.3 GitHub Raw URL 생성 규칙

```
github_repo = "https://github.com/{owner}/{repo}"
branch = kit.github_branch  (기본: "main")

Raw URL = "https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{file_path}"
```

---

## 4. Module Specifications

### 4.1 `utils/config.ts`

```typescript
export const config = {
  // 환경변수 CCKIT_API_URL 우선, 없으면 프로덕션 URL
  apiBaseUrl: process.env.CCKIT_API_URL ?? 'https://cckit.dev',
  cliVersion: '0.1.0',
};
```

### 4.2 `utils/logger.ts`

```typescript
import chalk from 'chalk';

export const logger = {
  info:    (msg: string) => console.log(chalk.cyan('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green('✓'), msg),
  warn:    (msg: string) => console.log(chalk.yellow('⚠'), msg),
  error:   (msg: string) => console.error(chalk.red('✗'), msg),
  step:    (msg: string) => console.log(chalk.gray('  →'), msg),
};
```

### 4.3 `lib/api.ts`

```typescript
// GET /api/kits/[slug]
export async function fetchKit(slug: string): Promise<KitDetail>
// GET /api/kits?q=...&page=...&pageSize=...
export async function searchKits(query: string, page?: number): Promise<KitsListResponse>
// POST /api/kits/[slug]/install
export async function trackInstall(slug: string): Promise<void>
```

**에러 처리:**
- 404 → `KitNotFoundError` (사용자 친화적 메시지)
- 네트워크 오류 → `NetworkError` (재시도 안내)
- 기타 → 원본 에러 메시지 출력 후 exit(1)

### 4.4 `lib/installer.ts`

```typescript
export interface InstallOptions {
  skipHooks?: boolean;
  skipAgents?: boolean;
  dryRun?: boolean;
  targetDir?: string;   // 기본: process.cwd()
}

// 메인 설치 함수
export async function installKit(kit: KitDetail, options: InstallOptions): Promise<string[]>
// installed 파일 경로 배열 반환

// 내부 함수들
async function downloadFile(url: string): Promise<Buffer>
async function writeFile(destPath: string, content: Buffer): Promise<void>
async function mergeSettings(settingsPath: string, hooks: HookMeta[]): Promise<void>
function buildRawUrl(kit: KitDetail, filePath: string): string
function resolveDestPath(node: FileTreeNode, options: InstallOptions): string | null
```

**`mergeSettings` 딥 머지 규칙:**
1. 기존 `settings.json` 읽기 (없으면 `{}`)
2. `kit.hooks_meta` → `SettingsHookEntry[]` 변환
3. 기존 hooks 배열과 합치되 `command` 기준 중복 제거
4. 나머지 기존 설정 키는 그대로 보존

### 4.5 `commands/install.ts`

```typescript
// Commander action
export async function installAction(slug: string, options: InstallOptions): Promise<void>

// 흐름:
// 1. ora 스피너 시작
// 2. fetchKit(slug)
// 3. CLAUDE.md 존재 시 inquirer 확인 프롬프트
// 4. installKit(kit, options)
// 5. trackInstall(slug)  ← 설치 수 트래킹
// 6. 완료 요약 출력 (설치된 파일 수, 경로)
```

**`--dry-run` 동작:**
- 실제 파일 쓰기 없이 설치 예정 파일 목록만 출력
- API 호출 (fetchKit)은 수행, trackInstall은 수행하지 않음

### 4.6 `commands/search.ts`

```typescript
export async function searchAction(query: string): Promise<void>
// searchKits(query) → 테이블 형식 출력
// 출력 컬럼: slug | name | category | installs | skills/hooks/agents
```

**출력 형식 예시:**
```
┌─────────────────────────┬──────────────────────────┬──────────┬──────────┬──────────────┐
│ Slug                    │ Name                     │ Category │ Installs │ Components   │
├─────────────────────────┼──────────────────────────┼──────────┼──────────┼──────────────┤
│ spring-boot-enterprise  │ Spring Boot Enterprise   │ backend  │ 128      │ S:3 H:2 A:1  │
└─────────────────────────┴──────────────────────────┴──────────┴──────────┴──────────────┘
```

### 4.7 `commands/list.ts`

```typescript
export async function listAction(): Promise<void>
// .cckit-installed.json 읽기 → 테이블 출력
// 출력 컬럼: slug | version | installedAt | files
```

---

## 5. CLI Interface

### 5.1 명령어 목록

```
cckit install <slug> [options]
  -s, --skip-hooks    Hooks 설치 제외
  -a, --skip-agents   Agents 설치 제외
  -d, --dry-run       실제 설치 없이 미리보기

cckit search <query>
  검색어로 킷 목록 조회

cckit list
  설치된 킷 목록 출력
```

### 5.2 install 출력 예시

```
$ npx cckit install spring-boot-enterprise

  CCKit — Claude Code Starter Kit Hub

  ℹ  Fetching kit info...
  ✓  spring-boot-enterprise v1.0.0 found

  ℹ  Downloading files...
    → .claude/skills/spring-boot.md
    → .claude/skills/mybatis.md
    → .claude/hooks/pre-build-verify.sh
    → .claude/agents/backend-expert.md
  ⚠  CLAUDE.md already exists. Overwrite? (y/N)

  ✓  Installation complete!
     4 files installed to .claude/
     1 hook merged into .claude/settings.json
```

---

## 6. Error Handling

| 코드 | 상황 | 출력 | Exit Code |
|------|------|------|-----------|
| KIT_NOT_FOUND | 존재하지 않는 slug | `✗ Kit 'xxx' not found.` | 1 |
| NETWORK_ERROR | API 호출 실패 | `✗ Network error. Check your connection.` | 1 |
| PERMISSION_ERROR | 파일 쓰기 권한 없음 | `✗ Permission denied: {path}` | 1 |
| NO_KITS | search 결과 없음 | `ℹ No kits found for "{query}"` | 0 |
| NOT_INSTALLED | list에 설치된 킷 없음 | `ℹ No kits installed yet.` | 0 |

---

## 7. Security Considerations

- [x] GitHub Raw URL은 kit.github_repo + branch에서 생성 (임의 URL 주입 불가)
- [x] 파일 경로는 `path.resolve`로 정규화 — path traversal 방지 (`../` 등)
- [x] `settings.json` 쓰기 전 JSON 파싱 검증
- [ ] (향후) SHA 체크섬 검증 (cckit-seed에서 킷 등록 시 해시 저장)

---

## 8. Implementation Guide

### 8.1 File Structure

```
apps/cli/src/
├── index.ts                   # CLI 엔트리, Commander 루트
├── commands/
│   ├── install.ts             # install 액션
│   ├── search.ts              # search 액션
│   └── list.ts                # list 액션
├── lib/
│   ├── api.ts                 # CCKit API 호출
│   └── installer.ts           # 파일 배치 + settings.json 병합
└── utils/
    ├── logger.ts              # chalk 기반 로거
    └── config.ts              # apiBaseUrl 등 설정
```

### 8.2 패키지 설정 (`apps/cli/package.json`)

```json
{
  "type": "module",
  "engines": { "node": ">=18" },
  "dependencies": {
    "commander": "^12",
    "chalk": "^5",
    "ora": "^8",
    "inquirer": "^9"
  }
}
```

### 8.3 tsconfig (`apps/cli/tsconfig.json`)

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "outDir": "dist",
    "strict": true
  }
}
```

### 8.4 Implementation Order

1. [ ] `package.json` — ora, inquirer 의존성 추가, `"type": "module"` 설정
2. [ ] `tsconfig.json` — NodeNext 모듈 설정
3. [ ] `utils/config.ts` — API 베이스 URL
4. [ ] `utils/logger.ts` — chalk 로거
5. [ ] `lib/api.ts` — fetchKit, searchKits, trackInstall
6. [ ] `lib/installer.ts` — downloadFile, mergeSettings, installKit
7. [ ] `commands/install.ts` — ora 스피너 + inquirer 프롬프트
8. [ ] `commands/search.ts` — 테이블 출력
9. [ ] `commands/list.ts` — 설치 목록 출력
10. [ ] `index.ts` — Commander 연결
11. [ ] `pnpm --filter cli build` 빌드 검증
12. [ ] `node dist/index.js install --dry-run <slug>` 로컬 동작 확인

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft | CCKit Team |
