---
name: execute
description: Structured implementation pipeline that enforces Researcher → Planner → Human Approval Gate → Implementer → Reviewer → Log in a single AI session with artifact-gated phase transitions
argument-hint: "<path to ep-*.md>"
pipeline: [researcher, planner, human-gate, implementer, reviewer, log]
handoff-policy: approval-required
prerequisites: ["[Pending Approval] label in target ep-*.md"]
level: 5

source: "Designed for Agent Harness — completes the deep-interview → ralplan → execute pipeline"
---

<Purpose>
Execute is the implementation layer of the Agent Harness pipeline. It takes a `ralplan`-validated execution plan (`ep-*.md` with a `[Pending Approval]` label) and drives it to completion through a strictly ordered, artifact-gated sequence of roles — Researcher, Planner, Human Approval Gate, Implementer, and Reviewer — within a single AI session. Every phase transition is locked behind a concrete file artifact. The Implementer is the only phase permitted to mutate source files. The Reviewer is read-only by definition. The session concludes by writing a structured result to `evals/logs/latest.json`.
</Purpose>

<Use_When>
- User has a `ralplan`-approved execution plan (`ep-*.md`) marked `[Pending Approval]` and wants to implement it
- User says "execute the plan", "implement it", "run the execute skill", or invokes `/skill:execute`
- User wants full traceability: every file mutation logged, every phase documented, human approval captured
</Use_When>

<Do_Not_Use_When>
- The target `ep-*.md` does NOT have a `[Pending Approval]` label — route to `ralplan` first
- User wants to explore or brainstorm — use `deep-interview`
- User wants architectural validation only — use `ralplan`
- User says "just fix it" or "quick patch" without an approved plan — decline and request a plan
</Do_Not_Use_When>

<Why_This_Exists>
`deep-interview` produces clarity. `ralplan` produces architectural consensus. But neither implements anything. Without a structured execution layer, the harness pipeline terminates at a plan document and relies on unguided ad-hoc coding — which reintroduces exactly the chaos the harness is designed to prevent.

Execute solves this by applying the same phase-gate discipline to implementation that `deep-interview` applies to requirements and `ralplan` applies to architecture. The Human Approval Gate specifically addresses the "AI proceeding without confirmation" failure mode, which is the most common cause of unexpected scope creep.
</Why_This_Exists>

<Execution_Policy>
- **Never skip a phase.** Each phase has a mandatory artifact. The next phase MUST NOT begin until the current phase's artifact exists on disk.
- **The Human Approval Gate is absolute.** After outputting the approval block, the agent calls zero tools. The only valid continuation signals are `approved`, `lgtm` (case-insensitive), or `abort`. Any other input triggers gate re-display. The agent never self-approves.
- **The Implementer is the only phase that may write source files.** All other phases are read-only or restricted to documentation paths.
- **The Reviewer never fixes.** If the Reviewer finds blockers, it records them and closes the session with `NEEDS_REVISION`. It does not re-enter the Implementer phase.
- **Every source file mutation is logged immediately** to `implementation-log.md` before moving to the next step. No batch-logging after the fact.
- **Log to `evals/logs/latest.json` unconditionally** at the end, even if the session was aborted or the reviewer found blockers. A run that produces no log is invisible to the eval system.
- **Artifact paths are fixed.** Do not invent alternative paths. All verification artifacts go to `docs/exec-plans/active/verification/`.
- **Respect the language setting** from `.agents/settings.json`. All user-facing output must match the configured language.
</Execution_Policy>

<Phase_Tool_Allowlist>
Each phase restricts which tool categories are permitted. Calling a forbidden tool during a phase is a Phase Violation and must be announced immediately before halting.

| Phase | File Reads | File Writes (docs only) | File Writes (source) | run_command | Browser |
|-------|------------|------------------------|----------------------|-------------|---------|
| Phase 0: Init | ✅ | ✅ (execute-state.json) | ❌ | ❌ | ❌ |
| Phase 1: Researcher | ✅ | ✅ (execute-state.json) | ❌ | ❌ | ❌ |
| Phase 2: Planner | ✅ | ✅ (ep-*.md, execute-state.json) | ❌ | ❌ | ❌ |
| GATE | ❌ | ✅ (execute-state.json) | ❌ | ❌ | ❌ |
| Phase 3: Implementer | ✅ | ✅ | ✅ | ✅ (build/lint only) | ❌ |
| Phase 4: Reviewer | ✅ | ✅ (review-report.md, execute-state.json) | ❌ | ✅ (test runners only) | ❌ |
| Phase 4.5: Walkthrough | ✅ | ✅ (walkthrough-*.md, execute-state.json) | ❌ | ❌ | ❌ |
| Phase 5: Log | ✅ | ✅ (evals/logs/latest.json only) | ❌ | ❌ | ❌ |

"Source" = any file under directories listed in `settings.json source_dirs` (resolved in Phase 0; defaults: `src/`, `lib/`, `app/`, `pages/`, `components/`).
"Docs only" = `docs/exec-plans/active/verification/`, the target `ep-*.md`, and `execute-state.json`.
</Phase_Tool_Allowlist>

<Violation_Protocol>
If the agent detects it has violated a phase boundary rule, it must:
1. Immediately stop the current operation
2. Output a VIOLATION block:
   ```
   ⚠️ PHASE VIOLATION DETECTED
   Phase: {current phase}
   Forbidden action: {what was attempted}
   Corrective action: {what will happen next}
   ```
3. Reverse any changes if possible (delete newly created files, etc.)
4. Resume from the beginning of the current phase

Critical Violations (no recovery — session terminates):
- AI self-approving the Human Approval Gate
- Implementer modifying files not listed in the execution plan
- Reviewer modifying source files
</Violation_Protocol>



<Steps>

## Phase 0: Init (Blocking Prerequisite)

This phase must complete fully before Phase 1 begins. Do not announce Phase 1 until all checks below pass.

### 0-1. Read settings

Parse `.agents/settings.json`. Extract:
- `language` — apply to all user-facing output for this session
- `paths.exec_plan_dir` — verify the target ep-*.md lives here
- `source_dirs` — list of top-level directory names that define the production source boundary (default: `["src", "lib", "app", "pages", "components"]` if absent). Store as the session `SOURCE_DIRS` variable and use it throughout Phase 3 and Phase 4 to enforce write boundaries.

If `.agents/settings.json` is missing or unparseable, halt with:
```
❌ [execute] .agents/settings.json을 읽을 수 없습니다. 스킬을 종료합니다.
```

### 0-2. Validate target plan

Read the target `ep-*.md` provided as the skill argument.

Check:
- File exists at the provided path
- File contains the text `[Pending Approval]` — if absent, halt:
  ```
  ❌ [execute] 대상 플랜에 [Pending Approval] 레이블이 없습니다.
     ralplan 검증을 먼저 완료하세요: /skill:ralplan
  ```

Extract from the ep-*.md:
- `{slug}` — the plan identifier used in file naming
- Affected file list (look for a section named `Affected Files`, `변경 파일`, or equivalent)
- Estimated change count

### 0-3. Create execute-state.json

Write `docs/exec-plans/active/verification/execute-state.json`:

```json
{
  "run_id": "run-{unix_timestamp}",
  "started_at": "{ISO8601_UTC}",
  "files_mutated": [],
  "human_inputs": [],
  "files_read": []
}
```

- `files_mutated`: Phase 3에서 실제로 변경된 파일 경로 배열
- `human_inputs`: 각 게이트에서 인간이 입력한 내용 (타임스탬프 포함)
- `files_read`: 각 Phase에서 에이전트가 읽은 파일 로그 (phase·path·reason 포함)

### 0-4. Announce start

Output to user:
```
🚀 [execute] 시작
   플랜: {exec_plan_path}
   Phase 0: 초기화 완료 → Phase 1: Researcher 진입
```

---

## Phase 1: Researcher

**허용 도구:** 파일 읽기, grep_search, list_dir
**금지 도구:** 모든 쓰기, run_command, 브라우저

### 1-1. Read the execution plan in full

Read the entire target ep-*.md. Identify:
- Every file path mentioned in the plan (affected files, referenced utilities, test files)
- The acceptance criteria section
- Any architectural constraints cited from `ARCHITECTURE.md` or ADR

### 1-2. Explore each affected file

For every file listed in the plan:
1. Read the file
2. Identify all imports/requires and map one level of dependencies
3. Check if a corresponding test file exists (look in `tests/`, `__tests__/`, `*.spec.*`, `*.test.*` patterns)
4. Note any global state, shared utilities, or side-effect-prone patterns

### 1-3. Classify risk

Based on exploration, assign an overall risk level:
- `LOW` — isolated changes, full test coverage, no shared state mutations
- `MEDIUM` — moderate coupling, partial test coverage, or auth/session involvement
- `HIGH` — no test coverage, global state mutation, public API surface changes, data migrations, or security-sensitive code (auth, crypto, permissions)

If risk is `HIGH`, note the specific reasons — the Planner will add mitigation steps.

### 1-4. Write research-brief.md

Write `docs/exec-plans/active/verification/research-brief.md`.
The file MUST contain all four sections below (missing any section = incomplete artifact):

```markdown
# Research Brief: {slug}

## Scope
{List every file that will be touched, with a one-line description of what changes}

## Dependency Map
{For each affected file: list its direct imports and which of those are also affected by this plan}

## Risk Assessment
**Level: {LOW|MEDIUM|HIGH}**

{2-5 bullet points explaining why this risk level was assigned}

## Unknowns
{Any ambiguities or missing information discovered during research. If none, write "없음."}
```

### 1-5. Update execute-state.json

`execute-state.json`의 `files_read` 배열에 이번 Phase에서 읽은 모든 파일을 추가합니다:

```json
{ "phase": "researcher", "path": "{file_path}", "reason": "{읽은 이유 한 줄}" }
```

### 1-6. Announce completion

```
✅ [Phase 1: Researcher] 완료
   위험 수준: {RISK_LEVEL}
   탐색 파일 수: {N}개
   → Phase 2: Planner 진입
```

---

## Phase 2: Planner

**허용 도구:** 파일 읽기, ep-*.md 쓰기, execute-state.json 쓰기
**금지 도구:** 소스 파일 쓰기, run_command

### 2-1. Read research-brief.md

Verify `research-brief.md` exists. If not, halt with:
```
❌ [Phase 2] research-brief.md가 없습니다. Phase 1을 먼저 완료하세요.
```

### 2-2. Refine the execution plan

Update the target `ep-*.md`:
1. If risk is `HIGH`: add a `## Risk Mitigation Steps` section before the implementation steps, listing specific precautions (e.g., "Run existing tests before mutation", "Create a git stash checkpoint")
2. Replace `[Pending Approval]` label with `[Ready for Approval]`
3. Add or verify a numbered `## Implementation Order` section that lists every file change in the exact order the Implementer will execute them. Each entry must include:
   - Step number
   - File path
   - Change type: `CREATE` / `MODIFY` / `DELETE`
   - One-line rationale (Why this step, in this order)
4. Add a `## Rollback Plan` section: for each step, a one-line rollback instruction

### 2-3. Update execute-state.json

`execute-state.json`의 `files_read` 배열에 이번 Phase에서 읽은 파일을 추가합니다:

```json
{ "phase": "planner", "path": "{file_path}", "reason": "{읽은 이유 한 줄}" }
```

### 2-4. Announce completion

```
✅ [Phase 2: Planner] 완료
   계획 정제 완료: [Ready for Approval] 레이블 부여
   → 인간 승인 게이트 진입
```

---

## GATE: 인간 승인

**이 구간에서 도구 호출은 절대 금지입니다.**
**AI가 스스로 이 게이트를 통과하는 행위는 Critical Violation입니다.**

### GATE-1. Verify prerequisites

Before displaying the gate, confirm these files exist on disk:
- `docs/exec-plans/active/verification/research-brief.md` ✓
- The target `ep-*.md` contains `[Ready for Approval]` ✓

If either check fails, output the violation block and halt.

### GATE-2. Display approval block

Output exactly this block (fill in the placeholders):

```
╔══════════════════════════════════════════════════════════╗
║         ⏸  EXECUTE SKILL — 인간 승인 게이트             ║
╠══════════════════════════════════════════════════════════╣
║  실행 계획: {exec_plan_path}                             ║
║  위험 수준: {RISK_LEVEL}                                 ║
║  변경 예정 파일 수: {N}개                                ║
║                                                          ║
║  Researcher 위험 요약:                                   ║
║  {research-brief.md Risk Assessment 요약 (2-3줄 이내)}   ║
║                                                          ║
║  ▶ 진행: "approved" 또는 "lgtm" 입력                     ║
║  ✖ 취소: "abort" 입력                                   ║
║  ? 그 외 입력: 이 화면을 다시 표시합니다                 ║
╚══════════════════════════════════════════════════════════╝
```

### GATE-3. Wait for human response

After displaying the block, **stop calling tools entirely** and wait.

Process the next user message:
- If message (stripped, lowercased) is `approved` or `lgtm`:
  - `execute-state.json`의 `human_inputs` 배열에 추가:
    ```json
    { "phase": "gate", "timestamp": "{ISO8601_UTC}", "prompt": "{원본 입력 그대로}" }
    ```
  - Output: `✅ 승인 확인. Phase 3: Implementer 진입.`
  - Proceed to Phase 3

- If message (stripped, lowercased) is `abort`:
  - `execute-state.json`의 `human_inputs` 배열에 추가:
    ```json
    { "phase": "gate", "timestamp": "{ISO8601_UTC}", "prompt": "abort" }
    ```
  - Proceed directly to Phase 5 (Log Output) — set session variable `aborted = true`
  - Output: `⛔ 실행 취소. 상태를 기록하고 종료합니다.`

- Any other input:
  - Output: `⚠️ 인식할 수 없는 입력입니다. "approved", "lgtm", 또는 "abort"를 입력해 주세요.`
  - Re-display the approval block (GATE-2)
  - Wait again (GATE-3)

---

## Phase 3: Implementer

**허용 도구:** 모든 파일 읽기/쓰기, run_command (빌드·린트·포맷터 실행 전용)
**금지 도구:** 계획 미명시 소스 파일 수정, 테스트 파일 삭제

### 3-1. Create implementation-log.md

Create `docs/exec-plans/active/verification/implementation-log.md` with this header:

```markdown
# Implementation Log: {slug}

**Run ID:** {run_id}
**Approved at:** {timestamp}
**Executor:** Agent (execute skill)

---
```

### 3-2. Execute each step in order

For each step in the `## Implementation Order` section of the ep-*.md:

**Before executing the step:**
- Confirm the target file path is in the plan's affected file list
- If the file path is NOT in the plan: output a VIOLATION block and skip the step (do not modify the file)
- **TDD 적용 (소스 파일 CREATE / MODIFY 단계):** 구현 전 실패 테스트를 먼저 작성하고 실패를 확인한 뒤 구현하세요. (`/skill:test-driven-development` 원칙 준수)
  - RED: 해당 기능의 실패 테스트 작성 → `npm test` 또는 프로젝트 테스트 러너로 실패 확인
  - GREEN: 테스트를 통과하는 최소 코드 구현
  - REFACTOR: 테스트 통과 상태 유지하며 정리
  - DELETE 단계는 TDD 적용 제외 (단, 의존 테스트 제거·업데이트 필요)

**Execute the step:**
- Perform the file operation (create/modify/delete)

**Immediately after each step, append to implementation-log.md:**

```markdown
## Step {N}: {step_name}

- **파일:** `{file_path}`
- **변경 유형:** CREATE | MODIFY | DELETE
- **결과:** SUCCESS | FAILED
- **이유:** {한 문장으로 — 왜 이 변경이 필요한가 (What이 아닌 Why)}
- **타임스탬프:** {ISO8601}

{실패 시에만} **실패 원인:** {error description}
```

**If a step fails:**
- Log the failure with the error details
- Do NOT attempt to fix the failure by modifying other unplanned files
- Mark step as FAILED and continue to the next step (do not halt entire session)
- After all steps are attempted, proceed to Phase 4

### 3-3. Run build/lint (optional)

If the project has a build or lint command detectable from `package.json`, `pyproject.toml`, or similar:
- Run it once after all steps are complete
- Append the result to implementation-log.md as:
  ```markdown
  ## Build/Lint Check
  - **Command:** `{command}`
  - **Result:** PASSED | FAILED
  - **Output:** {truncated output, max 20 lines}
  ```

### 3-4. Update execute-state.json

- `files_mutated`를 성공적으로 변경된 모든 파일 경로 배열로 설정
- `files_read` 배열에 이번 Phase에서 읽은 파일을 추가:
  ```json
  { "phase": "implementer", "path": "{file_path}", "reason": "{읽은 이유 한 줄}" }
  ```

### 3-5. Announce completion

```
✅ [Phase 3: Implementer] 완료
   성공 단계: {success_count}/{total_count}
   변경된 파일: {N}개
   → Phase 4: Reviewer 진입
```

---

## Phase 4: Reviewer

**허용 도구:** 파일 읽기, run_command (테스트 러너 실행 전용), review-report.md 쓰기
**금지 도구:** 소스 파일 수정, 계획 문서 수정, 테스트 파일 삭제

The Reviewer is a distinct role from the Implementer. Mentally reset: you are now reading the work of someone else.

### 4-1. Verify implementation-log.md exists

If missing, halt:
```
❌ [Phase 4] implementation-log.md가 없습니다. Phase 3를 먼저 완료하세요.
```

### 4-2. Load reviewer checklist

Read `.agents/skills/execute/reviewer-checklist.md` to initialize the review criteria.

### 4-3. Review each mutated file

For each file listed in `files_mutated` in `execute-state.json`:
1. Read the file
2. Verify the change matches what the ep-*.md prescribed (no scope creep)
3. Apply the checklist from `reviewer-checklist.md`
4. Classify any issues found: `BLOCKER` / `WARNING` / `NOTE`

### 4-4. Run existing tests

Detect the test runner from project config (`package.json` scripts, `pytest.ini`, `pyproject.toml`, etc.).
If a test runner is found:
- Run `npm test`, `pytest`, `vitest`, or equivalent
- Capture exit code and output summary

### 4-5. Write review-report.md

Write `docs/exec-plans/active/verification/review-report.md`:

```markdown
# Review Report: {slug}

**Reviewer:** Agent (execute skill, Phase 4)
**Review timestamp:** {ISO8601}

## Verdict: {APPROVED | NEEDS_REVISION}

## Test Results
- **Command:** `{test_command}` (or "테스트 러너 없음")
- **Result:** PASSED | FAILED | SKIPPED
- **Summary:** {1-2줄 요약}

## Scope Check
- **계획된 파일 수:** {N}개
- **실제 변경된 파일 수:** {M}개
- **이탈 여부:** {없음 | 있음 — {파일 목록}}

## Issues Found

### BLOCKERs
{List of blockers, or "없음"}

### WARNINGs
{List of warnings, or "없음"}

### NOTEs
{List of notes, or "없음"}

## Summary
{2-3문장 전체 요약}
```

**Verdict rules:**
- `APPROVED` — no BLOCKERs and tests pass (or no test runner available)
- `NEEDS_REVISION` — any BLOCKER present, OR tests fail

**If verdict is NEEDS_REVISION:**
- Output to user:
  ```
  ❌ [Phase 4: Reviewer] NEEDS_REVISION
     검토 리포트: docs/exec-plans/active/verification/review-report.md
     BLOCKER {N}건이 발견되어 자동 수정 없이 세션을 종료합니다.
     수동으로 수정 후 /skill:execute를 다시 실행하세요.
  ```
- Proceed to Phase 5 (log with reviewer_verdict = "NEEDS_REVISION")

### 4-6. Update execute-state.json

`execute-state.json`의 `files_read` 배열에 이번 Phase에서 읽은 파일을 추가합니다:

```json
{ "phase": "reviewer", "path": "{file_path}", "reason": "{읽은 이유 한 줄}" }
```

### 4-7. Announce completion

```
✅ [Phase 4: Reviewer] 완료
   Verdict: {APPROVED | NEEDS_REVISION}
   발견된 이슈: BLOCKER {b}건 / WARNING {w}건 / NOTE {n}건
   → Phase 4.5: Walkthrough 진입
```

---

## Phase 4.5: Walkthrough (인간 코드 검토)

**허용 도구:** 파일 읽기, walkthrough-*.md 쓰기, execute-state.json 쓰기
**금지 도구:** 소스 파일 수정, 테스트 파일 수정, run_command

**이 Phase는 NEEDS_REVISION이더라도 실행합니다.** 인간이 무엇이 문제인지 이해해야 하기 때문입니다.

### 4.5-1. Generate walkthrough document

`docs/exec-plans/active/verification/walkthrough-{slug}.md`를 생성합니다:

```markdown
# Walkthrough: {slug}

**생성 시각:** {ISO8601_UTC}
**Reviewer Verdict:** {APPROVED | NEEDS_REVISION}

---

## 세션 타임라인

| 시점 | Phase | 이벤트 |
|------|-------|---------|
| {started_at} | gate | 인간 승인: "{gate input}" |
| {finished_at} | walkthrough | Walkthrough 생성 |

---

## 에이전트 파일 접근 경로

### Researcher 탐색
{files_read에서 phase=="researcher" 항목을 목록으로}
- `{path}` — {reason}

### Implementer 참조
{files_read에서 phase=="implementer" 항목을 목록으로}
- `{path}` — {reason}

### Reviewer 검토
{files_read에서 phase=="reviewer" 항목을 목록으로}
- `{path}` — {reason}

---

## 변경 파일별 설명

{files_mutated의 각 파일에 대해:}
### {file_path} [{CREATE|MODIFY|DELETE}]
**변경 이유:** {implementation-log.md에서 해당 파일의 이유 발췌}
**요구사항 연결:** {ep-*.md에서 관련 항목 인용}

---

## 인간 직접 확인 권장 포인트 ⚠️

{reviewer-checklist의 WARNING 및 NOTE 항목, review-report.md의 Issues Found 섹션 기반으로 생성}

---

## 검토 체크리스트

- [ ] 변경 파일을 직접 열어 코드를 확인했습니다
- [ ] 비즈니스 요구사항(ep-*.md)을 충족합니다
- [ ] 직접 확인 권장 포인트를 검토했습니다

## Sign-off

**상태:** [PENDING]
**코멘트:** (인간 입력 대기)
**타임스탬프:** (인간 입력 후 기록)
```

### 4.5-2. Display walkthrough gate

**이 구간에서 소스 파일 수정은 절대 금지입니다.**

```
╔══════════════════════════════════════════════════════════╗
║      📋  EXECUTE SKILL — 코드 검토 게이트 (Phase 4.5)   ║
╠══════════════════════════════════════════════════════════╣
║  변경된 파일: {N}개                                      ║
║  Reviewer Verdict: {APPROVED | NEEDS_REVISION}           ║
║  BLOCKER: {b}건 / WARNING: {w}건                         ║
║                                                          ║
║  Walkthrough: docs/.../walkthrough-{slug}.md             ║
║                                                          ║
║  위 문서를 확인한 후 아래를 입력하세요:                   ║
║  ▶ 승인: "lgtm" / "approved" / "signed"                  ║
║  ✖ 재작업 요청: "revision: {이유}"                       ║
║  ? 그 외 입력: 이 화면을 다시 표시합니다                 ║
╚══════════════════════════════════════════════════════════╝
```

After displaying the gate, **stop calling tools entirely** and wait.

### 4.5-3. Process human sign-off

Process the next user message:

- If message (stripped, lowercased) is `lgtm`, `approved`, or `signed`:
  - `execute-state.json`의 `human_inputs` 배열에 추가:
    ```json
    { "phase": "walkthrough", "timestamp": "{ISO8601_UTC}", "prompt": "{원본 입력 그대로}" }
    ```
  - `walkthrough-{slug}.md`의 Sign-off 섹션 업데이트:
    - `**상태:** [SIGNED OFF]`
    - `**코멘트:** {입력 내용}`
    - `**타임스탬프:** {ISO8601_UTC}`
  - Proceed to Phase 5

- If message starts with `revision:`:
  - `execute-state.json`의 `human_inputs` 배열에 추가:
    ```json
    { "phase": "walkthrough", "timestamp": "{ISO8601_UTC}", "prompt": "{원본 입력 그대로}" }
    ```
  - `walkthrough-{slug}.md`의 Sign-off 섹션 업데이트:
    - `**상태:** [REVISION REQUESTED]`
    - `**코멘트:** {revision: 이후 내용}`
  - Output:
    ```
    🔄 재작업 요청이 기록되었습니다.
       사유: {revision 이후 내용}
       walkthrough-{slug}.md에 기록 완료.
       /skill:execute를 다시 실행하거나 직접 수정 후 재검토하세요.
    ```
  - Proceed to Phase 5 (session_variable `revision_requested = true`)

- Any other input:
  - Output: `⚠️ 인식할 수 없는 입력입니다. "lgtm", "approved", "signed" 중 하나 또는 "revision: {이유}"를 입력하세요.`
  - Re-display the walkthrough gate (step 4.5-2)
  - Wait again (step 4.5-3)

### 4.5-4. Announce completion

```
✅ [Phase 4.5: Walkthrough] 완료
   Sign-off: {SIGNED OFF | REVISION REQUESTED}
   → Phase 5: Log 출력
```

---

## Phase 5: Log 출력

**허용 도구:** evals/logs/latest.json 쓰기 전용

Write `evals/logs/latest.json` with the following structure.
This write must happen regardless of whether the session was aborted, completed successfully, or ended with NEEDS_REVISION or REVISION REQUESTED.

```json
{
  "skill": "execute",
  "run_id": "{run_id from execute-state.json}",
  "started_at": "{started_at from execute-state.json}",
  "finished_at": "{ISO8601_UTC_now}",
  "input_prompt": "/skill:execute {exec_plan_path}",
  "output_result": {
    "exec_plan_path": "{exec_plan_path}",
    "mutation_attempted": "{true if Phase 3 ran, false if aborted before Phase 3}",
    "files_mutated": "{files_mutated array from execute-state.json}",
    "files_mutated_count": "{length of files_mutated}",
    "files_read_count": "{length of files_read from execute-state.json}",
    "reviewer_verdict": "{APPROVED | NEEDS_REVISION | null if aborted before Phase 4}",
    "human_sign_off": "{SIGNED OFF | REVISION REQUESTED | null if aborted before Phase 4.5}",
    "risk_level": "{LOW | MEDIUM | HIGH from research-brief.md}",
    "test_results": "{PASSED | FAILED | SKIPPED | null}",
    "aborted": "{true | false}",
    "human_inputs": "{human_inputs array from execute-state.json}"
  },
  "eval_score": null
}
```

### Final output to user

```
📋 [execute] 세션 종료
   Run ID: {run_id}
   Reviewer Verdict: {APPROVED | NEEDS_REVISION | ABORTED}
   Human Sign-off: {SIGNED OFF | REVISION REQUESTED | N/A}
   로그: evals/logs/latest.json
   검토 리포트: docs/exec-plans/active/verification/review-report.md
   Walkthrough: docs/exec-plans/active/verification/walkthrough-{slug}.md
```

</Steps>
