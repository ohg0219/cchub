---
name: pdca
description: "Manage PDCA cycle: plan, design, do, analyze, iterate, report"
argument-hint: "[action] [feature]"
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, TaskCreate, TaskUpdate, TaskList, TaskGet, AskUserQuestion
---

# PDCA Skill

> Unified Skill for managing the PDCA cycle. Supports Plan → Design → Do → Check → Act flow.

## Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `plan [feature]` | Create Plan document | `/pdca plan user-auth` |
| `design [feature]` | Create Design document | `/pdca design user-auth` |
| `do [feature]` | Do phase guide | `/pdca do user-auth` |
| `analyze [feature]` | Run Gap analysis (Check) | `/pdca analyze user-auth` |
| `iterate [feature]` | Auto improvement (Act) | `/pdca iterate user-auth` |
| `report [feature]` | Generate completion report | `/pdca report user-auth` |
| `archive [feature]` | Archive completed documents | `/pdca archive user-auth` |
| `commit [feature] [hint]` | Commit changes | `/pdca commit user-auth` |
| `cleanup [all\|feature]` | Cleanup archived features | `/pdca cleanup` |
| `status` | Show current PDCA status | `/pdca status` |
| `next` | Guide to next phase | `/pdca next` |

## Template References

When creating documents, read the appropriate template from this directory:

- Plan: [plan.template.md](plan.template.md)
- Design: [design.template.md](design.template.md)
- Do: [do.template.md](do.template.md)
- Analysis: [analysis.template.md](analysis.template.md)
- Iteration Report: [iteration-report.template.md](iteration-report.template.md)
- Report: [report.template.md](report.template.md)

## Status File

All PDCA state is stored in `docs/.pdca-status.json` (v2.0 schema).

Read it at the start of every action to determine current state.
Update it after every action completes.

## Action Details

### plan (Plan Phase)

1. Check if `docs/01-plan/features/{feature}.plan.md` exists
2. If exists, display content and suggest modifications
3. If not, read [plan.template.md](plan.template.md) and create the document
   - Replace variables: `{feature}`, `{date}`, `{author}`, `{project}`, `{version}`
   - Get project name from `package.json` or directory name
   - Get date from current date (YYYY-MM-DD)
4. Update `docs/.pdca-status.json`:
   - Set `features[feature].phase` = `"plan"`
   - Set `features[feature].phaseNumber` = `1`
   - Set `features[feature].documents.plan` = file path
   - Add feature to `activeFeatures`
   - Set `primaryFeature`
   - Set timestamps
5. Create Task: `[Plan] {feature}`
6. Add to history: `{ "action": "plan_created", "feature": "...", "timestamp": "..." }`

**Output**: `docs/01-plan/features/{feature}.plan.md`

### design (Design Phase)

1. **Prerequisite**: Verify `docs/01-plan/features/{feature}.plan.md` exists
   - If missing, tell user: "Plan document not found. Run `/pdca plan {feature}` first."
2. Read Plan document for reference
3. Check if `docs/02-design/features/{feature}.design.md` exists
4. If exists, display and suggest modifications
5. If not, read [design.template.md](design.template.md) and create, referencing Plan content
6. Update `docs/.pdca-status.json`:
   - `phase` = `"design"`, `phaseNumber` = `2`
   - `documents.design` = file path
7. Create Task: `[Design] {feature}` with `addBlockedBy` referencing the Plan task
8. Add to history: `"design_created"`

**Output**: `docs/02-design/features/{feature}.design.md`

### do (Do Phase)

1. **Prerequisite**: Verify Design document exists
2. Read Design document to extract implementation order
3. **Check if Design document contains Section 8 "TDD Test Scenarios"**
4. **If TDD section exists (TDD mode)**:
   a. Extract test scenario list (TS-xx) and implementation order from Section 8.4
   b. Present TDD workflow guide:
      - Step 1: 테스트 환경 설정 체크리스트
      - Step 2: 각 시나리오별 Red → Green → Refactor 사이클 체크리스트
      - Step 3: 사이클 완료 체크 (전체 통과, 커버리지 확인)
   c. Update status: `tdd.enabled` = `true`, `tdd.testScenarioCount` = N
5. **If TDD section does NOT exist (legacy mode)**:
   a. Read [do.template.md](do.template.md) and present standard implementation guide
   b. Implementation order checklist from Design Section 9.2
   c. Key files/components to create, dependencies to install
6. Update status: `phase` = `"do"`, `phaseNumber` = `3`
7. Create Task: `[Do] {feature}` with `addBlockedBy` referencing Design task
8. Add to history: `"do_started"`

**Output**: Display implementation guide (file creation optional)

### analyze (Check Phase)

1. **Prerequisite**: Implementation code should exist (Do phase started)
2. Verify Design document exists
3. Find implementation code paths (search `src/`, `app/`, `lib/`, `components/`, etc.)
4. **Call gap-detector Agent** using Task tool:
   - Provide Design document path
   - Provide implementation code paths
   - Agent compares design vs implementation and returns Base Match Rate + Gap list
5. **If `tdd.enabled` is true in status (TDD mode)**:
   a. Collect test results (run test command, parse output for pass/fail counts)
   b. Collect coverage data (parse coverage report for line/branch/function %)
   c. Build Test Scenario Traceability (map TS-xx to test files and status)
   d. Calculate extended Match Rate:
      ```
      Match Rate = (설계 일치율 × 0.7) + (테스트 메트릭 점수 × 0.3)
      테스트 메트릭 = (통과율 × 0.5) + (커버리지 달성률 × 0.3) + (시나리오 구현률 × 0.2)
      ```
   e. Update status: `tdd.testsPassing`, `tdd.testsFailing`, `tdd.coverage`
   f. If test data collection fails, fall back to base Match Rate only (warn user)
6. **If TDD is not enabled**: Use base Match Rate as-is
7. Read [analysis.template.md](analysis.template.md) and create `docs/03-analysis/{feature}.analysis.md`
   - Fill in Match Rate, Gap items, scores
   - Include Section 5 (Test Metrics) if TDD mode
8. Update status: `phase` = `"check"`, `phaseNumber` = `4`, `matchRate` = result
9. Create Task: `[Check] {feature}` with `addBlockedBy` referencing Do task
10. Add to history: `"check_completed"` with `matchRate`
11. Guide based on Match Rate:
    - **>= 90%**: "Design-implementation aligned. Run `/pdca report {feature}`"
    - **70-89%**: "Some gaps found. Run `/pdca iterate {feature}` recommended"
    - **< 70%**: "Significant gaps. Run `/pdca iterate {feature}` required"

**Output**: `docs/03-analysis/{feature}.analysis.md`

### iterate (Act Phase)

1. Read status: check current `matchRate`
2. If >= 90%, inform: "Already passing. Run `/pdca report {feature}`"
3. If < 90%, **call pdca-iterator Agent** using Task tool:
   - Provide Design document path, Analysis document path, code paths
   - Agent runs Evaluator-Optimizer loop:
     a. Prioritize gaps (Critical > Warning > Info)
     b. Fix code (Edit/Write)
     c. Re-evaluate via gap-detector
     d. Repeat until >= 90% or max 5 iterations
4. Each iteration:
   - Create/Update Task: `[Act-N] {feature}` (N = iteration number)
   - Update status: `iterationCount++`, update `matchRate`
5. Final result:
   - **SUCCESS** (>= 90%): Guide to `/pdca report {feature}`
   - **FAILURE**: Show remaining issues, suggest manual fixes
6. Add to history: `"iteration_completed"` with `iteration` count and `matchRate`

**Output**: Updated code + optional `docs/03-analysis/{feature}.iteration-report.md`

### report (Completion Report)

1. Check `matchRate` in status (warn if < 90%, but allow proceeding)
2. **Call report-generator Agent** using Task tool:
   - Provide Plan, Design, Analysis document paths
   - Agent reads all documents and generates integrated report
3. Read [report.template.md](report.template.md) structure for the report
4. Output: `docs/04-report/features/{feature}.report.md`
5. Update status: `phase` = `"completed"`, `phaseNumber` = `6`
6. Create Task: `[Report] {feature}`
7. Add to history: `"report_generated"`

**Output**: `docs/04-report/features/{feature}.report.md`

### archive (Archive Phase)

1. **Prerequisite**: `phase` = `"completed"` or `matchRate` >= 90%
2. Create `docs/archive/YYYY-MM/{feature}/` directory
3. Move documents:
   - `docs/01-plan/features/{feature}.plan.md`
   - `docs/02-design/features/{feature}.design.md`
   - `docs/03-analysis/{feature}.analysis.md`
   - `docs/04-report/features/{feature}.report.md`
4. Update or create `docs/archive/YYYY-MM/_INDEX.md`
5. Update status based on argument:
   - Default: Delete feature from `features` object
   - `--summary` flag: Convert to lightweight summary:
     ```json
     { "phase": "archived", "matchRate": N, "iterationCount": N,
       "startedAt": "...", "archivedAt": "...", "archivedTo": "docs/archive/..." }
     ```
6. Remove from `activeFeatures`
7. Add to history: `"archived"` with `archivedTo`
8. **Commit 제안**: `git status`로 uncommitted changes 확인
   - 변경사항이 있으면 AskUserQuestion으로 "커밋할까요?" 제안
   - 승인 시 commit (Utility) 프로세스 실행 (커밋 계획 → 확인 → 실행)
   - 거부 시 커밋 없이 종료

**Output**: `docs/archive/YYYY-MM/{feature}/`

### cleanup

1. Read `docs/.pdca-status.json` and find features where `phase` = `"archived"`
2. Based on argument:
   - No argument: Show list, ask user with AskUserQuestion to select
   - `all`: Delete all archived features from status
   - `{feature}`: Delete specific feature from status
3. Archive documents in `docs/archive/` are NOT deleted (only status is cleaned)
4. Add to history: `"cleanup"` with `deletedFeatures` list

### commit (Utility)

세션 중 변경사항에 대해 git commit을 생성합니다.
Phase를 변경하지 않는 유틸리티 액션입니다.

**권장 타이밍**: Do(구현) 완료 후, 또는 Report 완료 후 Archive 전.
Archive에도 commit 제안이 내장되어 있으므로, Archive 후 별도 commit은 불필요.

1. `docs/.pdca-status.json` 읽기:
   - feature 인자 있으면 해당 feature 사용
   - 없으면 `primaryFeature` 사용
   - `primaryFeature`도 없으면 일반 커밋 모드 (PDCA 추적 없이 진행)
2. **변경 내용 파악:**
   - 대화 이력을 리뷰하고 무엇이 달성되었는지 이해
   - `git status`로 현재 변경사항 확인
   - `git diff`로 수정 내용 이해 (staged + unstaged)
   - 변경사항을 하나의 커밋으로 할지 여러 논리적 커밋으로 할지 고려
3. **커밋 계획:**
   - 어떤 파일들이 함께 그룹되어야 하는지 식별
   - 명확하고 설명적인 커밋 메시지 작성
   - **커밋 메시지는 한국어로 작성 (제목 및 본문 모두)**
   - 커밋 메시지에 명령형 어조 사용 (예: "추가", "수정", "제거")
   - 무엇이 변경되었는지뿐 아니라 왜 변경되었는지에 집중
4. **사용자에게 계획 제시:**
   - 각 커밋에 추가할 파일 목록 나열
   - 사용할 커밋 메시지 보여주기
   - 질문: "[N]개의 커밋을 생성할 계획입니다. 진행할까요?"
5. **확인 후 실행:**
   - `git add`로 특정 파일 추가 (절대 `-A`나 `.` 사용 금지)
   - 계획한 메시지로 커밋 생성 (HEREDOC 형식 사용)
   - `git log --oneline -n [number]`로 결과 보여주기
6. **PDCA 상태 업데이트** (활성 feature가 있을 때만):
   - `updatedAt` 타임스탬프 갱신
   - history에 `"committed"` 이벤트 추가:
     ```json
     { "action": "committed", "feature": "...", "timestamp": "...",
       "phase": "...", "commitCount": N, "commitMessages": ["..."] }
     ```

**커밋 규칙 (필수 준수):**
- **절대 co-author 정보나 Claude 속성을 추가하지 말 것**
- 커밋은 오직 사용자 명의로만 작성
- "Generated with Claude" 메시지 포함 금지
- "Co-Authored-By" 줄 추가 금지
- 관련 변경사항은 함께 그룹화
- 가능하면 커밋을 집중적이고 원자적으로 유지

### status

1. Read `docs/.pdca-status.json`
2. Display visualization:

```
PDCA Status
───────────────────────────────
Feature: {primaryFeature}
Phase: {phase} ({phaseNumber}/6)
Match Rate: {matchRate}%
Iteration: {iterationCount}/5
───────────────────────────────
[Plan] {icon} > [Design] {icon} > [Do] {icon} > [Check] {icon} > [Act] {icon} > [Report] {icon}

Active Features:
  - feature-a: Phase (N)
  - feature-b: Phase (N)
```

**Phase Icons:**
- ✅ Completed phase (already done)
- 🔄 Current phase (in progress)
- ⬜ Future phase (not started)
- ⏭️ Skipped phase (Act only — skipped when matchRate >= 90%)

**Act Icon Rule:**
- Act shows ⏭️ when: `phase` is `completed` AND `iterationCount` == 0 (iterate was never run)
- Act shows ✅ when: `iterationCount` > 0 (iterate was actually executed)
- Act shows 🔄 when: currently in iterate phase
- Act shows ⬜ when: check phase not yet reached

Example (Design phase completed, Do in progress):
```
[Plan] ✅ > [Design] ✅ > [Do] 🔄 > [Check] ⬜ > [Act] ⬜ > [Report] ⬜
```

Example (completed, Act was skipped — matchRate >= 90%):
```
[Plan] ✅ > [Design] ✅ > [Do] ✅ > [Check] ✅ > [Act] ⏭️ > [Report] ✅
```

Example (completed, Act was executed — matchRate was < 90%):
```
[Plan] ✅ > [Design] ✅ > [Do] ✅ > [Check] ✅ > [Act] ✅ > [Report] ✅
```

### next

1. Read status to find `primaryFeature` and its current `phase`
2. Suggest next action:

| Current Phase | Next Action | Command |
|---------------|-------------|---------|
| (none) | Create plan | `/pdca plan [feature]` |
| plan | Write design | `/pdca design {feature}` |
| design | Start implementation | `/pdca do {feature}` |
| do | Run gap analysis | `/pdca analyze {feature}` |
| check (< 90%) | Auto-improve | `/pdca iterate {feature}` |
| check (>= 90%) | Write report | `/pdca report {feature}` |
| completed | Archive | `/pdca archive {feature}` |

3. Ask user with AskUserQuestion to confirm proceeding

## Task System Integration

Each PDCA phase creates a Task with dependency chain:

```
[Plan] {feature}
  -> blockedBy: (none)
[Design] {feature}
  -> blockedBy: [Plan]
[Do] {feature}
  -> blockedBy: [Design]
[Check] {feature}
  -> blockedBy: [Do]
[Act-N] {feature}
  -> blockedBy: [Check] or [Act-(N-1)]
[Report] {feature}
  -> blockedBy: [Check] or last [Act]
[Archive] {feature}
  -> blockedBy: [Report]
```

## Agent Integration

| Action | Agent | How to Call |
|--------|-------|------------|
| analyze | gap-detector | `Task(subagent_type="gap-detector")` |
| iterate | pdca-iterator | `Task(subagent_type="pdca-iterator")` |
| report | report-generator | `Task(subagent_type="report-generator")` |

## Auto Triggers

Suggest PDCA action when detecting these keywords in conversation:

| Keywords | Suggested Action |
|----------|------------------|
| plan, planning, roadmap | plan |
| design, architecture, spec | design |
| implement, develop, build | do |
| verify, analyze, check, gap | analyze |
| improve, iterate, fix, auto-fix | iterate |
| complete, report, summary | report |
| archive, store | archive |
| commit, save, 커밋, 저장 | commit |
| cleanup, clean, remove old | cleanup |

## Response Footer (Required)

**Every PDCA skill response MUST end with the following footer.**

Read `docs/.pdca-status.json` to populate the values dynamically.

```
─────────────────────────────────────────────────
📊 PDCA Dashboard
─────────────────────────────────────────────────
📌 Feature: {primaryFeature}
📍 Phase: {phase} ({phaseNumber}/6)
📈 Match Rate: {matchRate}%
🔄 Iteration: {iterationCount}/5
─────────────────────────────────────────────────
[Plan] {icon} > [Design] {icon} > [Do] {icon} > [Check] {icon} > [Act] {icon} > [Report] {icon}
─────────────────────────────────────────────────
✅ Action: {what was done in this response}
💡 Next: {recommended next command}
─────────────────────────────────────────────────
```

**Field Rules:**
- `{primaryFeature}`: From status JSON. Show "없음 - /pdca plan [feature]로 시작" if empty
- `{phase}`: Current phase name (Plan/Design/Do/Check/Act/Report/Completed)
- `{matchRate}`: From status JSON. Show "-" if not yet analyzed
- Phase icons: ✅ completed, 🔄 current, ⬜ future, ⏭️ skipped (Act only)
- **Act icon special rule**: Show ⏭️ when phase is `completed` or `report` was reached AND `iterationCount` == 0. Show ✅ when `iterationCount` > 0.
- `Action`: Brief summary of what this PDCA response did (e.g., "Plan 문서 생성 완료")
- `Next`: Suggest the next `/pdca` command based on current phase

**Example outputs:**

After `/pdca plan user-auth`:
```
─────────────────────────────────────────────────
📊 PDCA Dashboard
─────────────────────────────────────────────────
📌 Feature: user-auth
📍 Phase: Plan (1/6)
📈 Match Rate: -
🔄 Iteration: 0/5
─────────────────────────────────────────────────
[Plan] 🔄 > [Design] ⬜ > [Do] ⬜ > [Check] ⬜ > [Act] ⬜ > [Report] ⬜
─────────────────────────────────────────────────
✅ Action: Plan 문서 생성 완료
💡 Next: /pdca design user-auth
─────────────────────────────────────────────────
```

After `/pdca analyze user-auth` (matchRate 85%):
```
─────────────────────────────────────────────────
📊 PDCA Dashboard
─────────────────────────────────────────────────
📌 Feature: user-auth
📍 Phase: Check (4/6)
📈 Match Rate: 85%
🔄 Iteration: 0/5
─────────────────────────────────────────────────
[Plan] ✅ > [Design] ✅ > [Do] ✅ > [Check] 🔄 > [Act] ⬜ > [Report] ⬜
─────────────────────────────────────────────────
✅ Action: Gap 분석 완료 (85%)
💡 Next: /pdca iterate user-auth (90% 미달, 개선 권장)
─────────────────────────────────────────────────
```

After `/pdca report user-auth` (matchRate 92%, Act skipped):
```
─────────────────────────────────────────────────
📊 PDCA Dashboard
─────────────────────────────────────────────────
📌 Feature: user-auth
📍 Phase: Completed (6/6)
📈 Match Rate: 92%
🔄 Iteration: 0/5
─────────────────────────────────────────────────
[Plan] ✅ > [Design] ✅ > [Do] ✅ > [Check] ✅ > [Act] ⏭️ > [Report] ✅
─────────────────────────────────────────────────
✅ Action: 완료 보고서 생성 완료
💡 Next: /pdca archive user-auth
─────────────────────────────────────────────────
```
