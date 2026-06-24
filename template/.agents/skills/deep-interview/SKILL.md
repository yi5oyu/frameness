---
name: deep-interview
description: Socratic deep interview with mathematical ambiguity gating and ralplan validation before explicit execution approval
argument-hint: "[--fresh] [--quick|--standard|--deep] <idea or vague description>"
pipeline: [deep-interview, exec-plan, ralplan]
handoff-policy: approval-required
handoff: 
  spec: docs/product-specs/PRD.md
  plan: docs/exec-plans/active/ep-{slug}.md
level: 3

source: "Rebranded and tailored for local Agent Harness structure"
---

<Purpose>
Deep Interview implements Ouroboros-inspired Socratic questioning with mathematical ambiguity scoring. It replaces vague ideas with crystal-clear specifications by asking targeted questions that expose hidden assumptions, measuring clarity across weighted dimensions, and refusing to proceed until ambiguity drops below the resolved threshold for this run. The output feeds into a gated pipeline: **deep-interview → product-specs (PRD) crystallization → exec-plan alignment → ralplan consensus validation → explicitly approved execution**, ensuring maximum clarity and architectural soundness before any file mutation starts.
</Purpose>

<Use_When>
- User has a vague idea and wants thorough requirements gathering before execution
- User says "deep interview", "interview me", "ask me everything", "don't assume", "make sure you understand"
- User says "ouroboros", "socratic", "I have a vague idea", "not sure exactly what I want"
- User wants to avoid "that's not what I meant" outcomes from autonomous execution
- Task is complex enough that jumping to code would waste cycles on scope discovery (e.g., Harness Engineering feature development)
- User wants mathematically-validated clarity and a structured plan (`ep-*.md`) before committing to architecture validation via `ralplan`
</Use_When>

<Do_Not_Use_When>
- User has a detailed, specific request with file paths, function names, or acceptance criteria -- execute directly.
- User wants to explore options or brainstorm -- use a standard brainstorming or exploration workflow instead.
- User wants a quick fix or single change -- delegate to the standard execution layer.
- User says "just do it" or "skip the questions" without an explicit execution path -- respect their intent by ending interview and writing a pending specification to `docs/product-specs/PRD.md`, not by mutating source files.
- User already has a PRD or plan file (`ep-*.md`) and wants it validated or executed -- do not use deep-interview; route directly to `ralplan` for consensus validation or the execution layer.
</Do_Not_Use_When>

<Why_This_Exists>
AI can build anything. The hard part is knowing what to build. Standard prompt-to-code approaches struggle with genuinely vague inputs because they ask "what do you want?" instead of "what are you assuming?" Deep Interview applies Socratic methodology to iteratively expose assumptions and mathematically gate readiness, ensuring the AI has genuine clarity before spending development cycles in the Harness. 

Furthermore, a mathematically-validated specification and a well-structured plan are absolute prerequisites for downstream consensus tools like `ralplan` to perform meaningful architectural validation.

Inspired by the [Ouroboros project](https://github.com/Q00/ouroboros) which demonstrated that specification quality is the primary bottleneck in AI-assisted development.
</Why_This_Exists>

<Execution_Policy>
- Ask ONE question at a time -- never batch multiple questions.
- Preserve the user/session language for every user-facing announcement, topology confirmation, option label, and interview question when state includes `language.instruction`; for example Korean initial ideas must receive Korean deep-interview questions unless the user explicitly requests another language.
- Target the WEAKEST clarity dimension with each question.
- Before Round 1 ambiguity scoring, run a one-time Round 0 topology enumeration gate that confirms the top-level component list and locks it into state.
- Make weakest-dimension targeting explicit every round: name the weakest dimension, state its score/gap, and explain why the next question is aimed there.
- Gather codebase facts via an exploration tool BEFORE asking the user about them (for brownfield projects).
- For brownfield confirmation questions, cite the repo evidence that triggered the question (file path, symbol, or pattern) instead of asking the user to rediscover it.
- Score ambiguity after every answer -- display the score transparently to the user.
- When the locked topology has multiple active components, score and target each component explicitly so depth-first clarity on one component cannot hide ambiguity in siblings.
- Keep prompt payloads budgeted: summarize or trim oversized initial context/history before composing question, scoring, or spec handoff prompts.
- **Do not proceed to execution until ambiguity ≤ the resolved threshold for this run and the user explicitly approves a scoped execution path.**
- **Crystallize the final output into the dedicated local paths: specification to `docs/product-specs/PRD.md` and the initial plan to `docs/exec-plans/active/ep-{slug}.md`.**
- **Once files are written, do not initiate code execution; instead, automatically hand off the plan to `.agents/skills/ralplan/SKILL.md` for architectural validation upon user approval.**
- Allow early exit with a clear warning if ambiguity is still high.
- Persist interview state in `.agents/` or internal memory structure for resume across session interruptions.
- A multi-persona lateral-review panel convenes at ambiguity-milestone transitions to expose blind spots from independent perspectives.
- Refine free-text answers into a structured interpretation and confirm nothing is lost before scoring.
- After 3 consecutive agent-resolved answers (accepted auto-research candidates or auto-answers), route the next question to the user (dialectic rhythm guard).
- Run an independent closure audit and a one-sentence goal restatement, each requiring explicit user confirmation, before crystallizing the spec.
</Execution_Policy>

<Internal_Auto_Mode_Protocol>
- `auto-research-greenfield.md`, `auto-answer-uncertain.md`, and `lateral-review-panel.md` are internal prompt fragments loaded on demand from `.agents/skills/deep-interview/`; they are not public skills and are never discoverable by the user.
- Load fragments only for the specific hook that needs them, with forked inherited context kept read-only and prompt-budgeted.
- Auto-mode sub-agents are read-only: no direct code edits, no workspace mutation, and no execution delegation.
- Validate every fragment response before using it: required sections must be present, candidates/answer must match the requested shape, and confidence must be explicit.
- Track `auto_researched_rounds`, `auto_answered_rounds`, `lateral_reviews`, `auto_answer_streak`, `refined_rounds`, `architect_failures`, and `lateral_panel_failures` in internal state and final spec metadata.
</Internal_Auto_Mode_Protocol>



<Steps>

## Local Skill Invocation Guard

Regardless of how this deep-interview skill is invoked within the Agent Harness workspace, Phase 0 below remains strictly blocking. The agent must resolve the local ambiguity threshold configuration and language parameters from `.agents/settings.json` before making any user-facing announcements, initializing state writes, asking questions, or calculating ambiguity scores. Do not skip initialization, and do not default to hardcoded fallback variables if `.agents/settings.json` is accessible.

## Phase 0: Resolve Ambiguity Threshold (blocking prerequisite)

Complete this phase before Phase 1, before brownfield exploration, before state persistence, before Round 0, and before any ambiguity scoring. Do not continue if the resolved threshold and source are unknown.

1. **Read threshold settings**:
   - Parse configuration from `.agents/settings.json`.
2. **Resolve threshold and source**:
   - Read `deep_interview.ambiguity_threshold` and `language` parameters from the JSON file.
   - Use the parsed threshold value when valid; otherwise use the default `0.05`.
   - Set these run variables exactly: `<resolvedThreshold>`, `<resolvedThresholdPercent>` (e.g., 5%), and `<resolvedThresholdSource>` (e.g., `.agents/settings.json` or `default`).
3. **Emit the required first line to the user before any other interview announcement**:

```text
Deep Interview threshold: <resolvedThresholdPercent> (source: <resolvedThresholdSource>)

```

4. **Carry threshold and language forward mechanically**:

* Substitute `<resolvedThreshold>`, `<resolvedThresholdPercent>`, and `<resolvedThresholdSource>` throughout the remaining instructions before continuing.
* Maintain the session language according to the parsed language configuration (e.g., `ko` for Korean session responses) to avoid mixing languages.

5. **Read global rules explicitly**: Read `.agents/rules/global.md` (language/anti-pattern/error-handling rules that should color the PRD's constraints and the eventual `## Code Style & Tooling` decisions) — do not rely solely on host auto-injection from its frontmatter `trigger`.

## Phase 1: Initialize

1. **Parse the user's idea**:
* Extract the core intent from the initial user input.


2. **Detect brownfield vs greenfield**:
* Scan the current working directory for existing source code, configurations, or git history.
* If active source files exist AND the user's idea references modifying, extending, or integrating with the existing system: Classify as **brownfield**.
* Otherwise: Classify as **greenfield**.


3. **For brownfield context assembly**:
* Run workspace exploration tools to map relevant codebase areas and store them as `codebase_context`.
* Read local planning and architectural constraints: read `ARCHITECTURE.md` and `docs/design-docs/core-beliefs.md` to capture domain facts and prior decisions.
* Use this context to avoid asking questions about facts the codebase or architecture documents already reveal.


4. **Normalize oversized initial context**:
* If the initial prompt, attached logs, or code snippets are too large (prompt-budget risk), produce a concise summary preserving user intent, constraints, and non-goals.
* Treat this summary as the canonical `initial_idea` for downstream scoring and question generation.


5. **Artifact path discipline**:
* Product specifications MUST write to `docs/product-specs/PRD.md` exactly.
* Execution plans MUST write to `docs/exec-plans/active/ep-{slug}.md` exactly.


6. **Initialize state** within `.agents/state.json` or internal memory:

```json
{
  "active": true,
  "current_phase": "interviewing",
  "state": {
    "interview_id": "<uuid>",
    "type": "greenfield|brownfield",
    "initial_idea": "<prompt-safe initial-context summary or user input>",
    "rounds": [],
    "established_facts": [],
    "current_ambiguity": 1.0,
    "threshold": <resolvedThreshold>,
    "threshold_source": "<resolvedThresholdSource>",
    "language": "ko",
    "codebase_context": null,
    "topology": {
      "status": "pending|confirmed",
      "confirmed_at": null,
      "components": [],
      "deferrals": [],
      "last_targeted_component_id": null
    },
    "ontology_snapshots": [],
    "auto_researched_rounds": [],
    "auto_answered_rounds": [],
    "lateral_reviews": [],
    "lateral_panel_failures": 0,
    "auto_answer_streak": 0,
    "refined_rounds": [],
    "closure_overrides": [],
    "restated_goal": null,
    "ambiguity_milestone": "initial",
    "architect_failures": 0
  }
}

```

7. **Announce the interview** to the user (The first line MUST be exactly the Phase 0 threshold marker):

> Deep Interview threshold:  (source: )
> Starting deep interview. I will ask targeted questions to thoroughly understand your requirements before building anything. After each answer, I will display your clarity score. We will automatically generate the execution plan and proceed to the `ralplan` validation pipeline once ambiguity drops below .
> **Your idea:** "{initial_idea}"
> **Project type:** {greenfield|brownfield}
> **Current ambiguity:** 100% (initial state)

## Round 0: Topology Enumeration Gate

Run this gate exactly once after Phase 1 initialization and before any Phase 2 ambiguity scoring to lock the **shape** of the user's scope before depth-first Socratic questioning can overfit to the most-described component.

1. **Enumerate candidate top-level components** from the prompt-safe initial idea and brownfield context:
* Extract top-level workstreams, modules, integrations, or deliverables that can succeed or fail independently.
* Prefer 1-6 components. If more than 6 candidates appear, group siblings at the highest useful level and note the grouping rationale.
* Do not treat implementation tasks, fields, or sub-features as top-level components unless the user framed them as independent outcomes.


2. **Ask one confirmation question** before Round 1:

```text
Round 0 | Topology confirmation | Ambiguity: not scored yet

I'm reading this as {N} top-level component(s):
1. {component_name}: {one_sentence_description}
2. ...

Is that topology right? Should any component be added, removed, merged, split, or explicitly deferred?

```

Options should include contextually relevant choices such as **Looks right**, **Add/remove/merge components**, **Defer one or more components**, plus free-text, translated or localized according to target configuration. This is the only pre-scoring question and preserves the one-question-per-round rule.

3. **Lock topology into state** after the answer. Store a normalized component list and confirmation timestamp into internal state memory (`.agents/state.json`).
4. **Legacy/Single-component Handling**:

* If the user confirms only one active component, Phase 2 proceeds with the existing flow while still carrying `topology.components[0]` into scoring and spec output.
* For complex ideas, ensure all major parallel workstreams are exposed as individual sibling components so that a highly detailed component does not mask the ambiguity of less-defined siblings.

## Phase 2: Interview Loop

Repeat until `ambiguity ≤ threshold` OR user exits early:

### Step 2a: Generate Next Question

Build the question generation prompt with:

* The prompt-safe initial-context summary (if one was created), otherwise the user's original idea.
* Prior Q&A rounds trimmed or summarized to fit the prompt budget while preserving decisions, constraints, and unresolved gaps.
* Current clarity scores per dimension (identifying the weakest component and dimension).
* Lateral-review panel findings (if convened this round -- see Phase 3).
* Brownfield codebase context (if applicable), summarized to cited paths/symbols/patterns.
* Locked topology from Round 0, including active/deferred components and `last_targeted_component_id`.

**Question targeting strategy:**

* Identify the active component + dimension pair with the LOWEST clarity score across the locked topology.
* When multiple active components are tied or similarly weak, rotate targeting across active components rather than asking repeatedly about the last targeted component; update `topology.last_targeted_component_id` after each round.
* Generate a question that specifically improves that component's weakest dimension, focusing on exposing ASSUMPTIONS rather than gathering feature lists.
* **Facts vs decisions:** Answer factual questions (current stack, existing patterns) via internal workspace exploration tools; route every *decision* (goals, scope, tradeoffs) directly to the user.
* **Dialectic rhythm guard:** Increment `state.auto_answer_streak` when a round is resolved without direct user judgment (an accepted auto-research candidate or an auto-answer). If the streak reaches 3, route the next question directly to the human user to preserve the human-in-the-loop paradigm.

### Step 2a′: Auto-Research Greenfield Questions

* When the next question is for a greenfield interview and tagged `research: true`, load `.agents/skills/deep-interview/auto-research-greenfield.md` internally as a read-only fragment to provide 2-3 ranked tech candidates as concise answer choices or context for the single user-facing question. Log the round in `auto_researched_rounds`.
* **Version specificity for tech stack questions:** If the question concerns a language, framework, library, runtime, or build tool, every candidate answer (and the eventual recorded decision in `## Tech Stack`) MUST name a concrete version or version range and the build/package tool — e.g., "Spring Boot 3.x (3.3 LTS) + Gradle", not bare "Spring Boot". Never let the agent pick an arbitrary version silently: surface the current stable/LTS option(s) via auto-research, then route the final confirmation to the user as a decision.
* **Code style follows immediately after each tech stack decision:** As soon as a language/framework choice is locked into `## Tech Stack`, raise its style guide / linter / formatter as the next (or same-round) question rather than deferring it — e.g., locking in Java triggers a style question naming concrete candidates like "Google Java Style + Checkstyle" vs "Sun/Oracle conventions". Record the confirmed choice in `## Code Style & Tooling`. Do not leave this implicit or default it silently; it is a decision, not a fact, so it is routed to the user (auto-research may supply the candidate names).

### Step 2b: Ask the Question

Present the generated question clearly to the user with the current ambiguity context:

```text
Round {n} | Component: {target_component_name} | Targeting: {weakest_dimension} | Why now: {one_sentence_targeting_rationale} | Ambiguity: {score}%

{question}

```

Options should include contextually relevant choices plus free-text options.

### Step 2b′: Auto-Answer Opted-Out Questions

* If the user opts out or explicitly asks the agent to decide, load `.agents/skills/deep-interview/auto-answer-uncertain.md` internally. Record the architect-assisted answer in `auto_answered_rounds` with a strict clarity cap: no dimension score improved solely by an auto-answer may exceed `0.85`.

### Step 2b″: Refine Free-Text Answers

* When the user provides a free-text answer carrying complex reasoning, structure it into concise canonical sections: **Decision**, **Reasoning**, **Constraints (user-stated)**, and **Out of scope (user-stated)**.
* Confirm nothing is lost via a quick confirmation step before proceeding to scoring. Track this in `refined_rounds`.

### Step 2c: Score Ambiguity

After receiving or refining the answer, score clarity across all dimensions using a highly consistent evaluation prompt (e.g., using a high-tier model at Temperature 0.1).

* **Bidirectional & Non-Monotonic:** Ambiguity scoring is bidirectional. A later answer can *increase* ambiguity if it introduces a direct contradiction, internal inconsistency, evasive hand-waving, or sudden scope expansion.
* If an ambiguity-raising trigger occurs, it lowers the affected component/dimension clarity score, driving overall ambiguity back up silently without breaking the interview flow.
* Maintain `state.established_facts` to track durable confirmed decisions. If a new answer contradicts an established fact, mark the fact as disputed and preserve it for the final spec metadata.

**Calculate ambiguity:**

* Greenfield: `ambiguity = 1 - (goal × 0.40 + constraints × 0.30 + criteria × 0.30)`
* Brownfield: `ambiguity = 1 - (goal × 0.35 + constraints × 0.25 + criteria × 0.25 + context × 0.15)`

**Ontology extraction & stability:**

* Extract key entities (nouns) and their relationships (verbs) each round.
* For rounds 2+, calculate `stability_ratio` = `(stable_entities + changed_entities) / total_entities`. Entities with different names but matching types and >50% field overlap are classified as "changed" (renamed), which counts toward stability convergence.
* Store snapshots in `state.ontology_snapshots[]`.

### Step 2d: Report Progress

After scoring, display the progress report precisely in English:

```text
Round {n} complete.

| Dimension | Score | Weight | Weighted | Gap |
|-----------|-------|--------|----------|-----|
| Goal | {s} | {w} | {s*w} | {gap or "Clear"} |
| Constraints | {s} | {w} | {s*w} | {gap or "Clear"} |
| Success Criteria | {s} | {w} | {s*w} | {gap or "Clear"} |
| Context (brownfield) | {s} | {w} | {s*w} | {gap or "Clear"} |
| **Ambiguity** | | | **{prior_score}% -> {score}% {up|down|flat}** | {if up: trigger name} |

**Topology:** Targeted {target_component_name} | Active: {active_component_count} | Deferred: {deferred_component_count}
**Ontology:** {entity_count} entities | Stability: {stability_ratio} | New: {new} | Changed: {changed} | Stable: {stable}
**Milestone:** {prior_milestone} → {current_milestone}

**Next target:** {target_component_name} / {weakest_dimension} — {weakest_dimension_rationale}

{score <= threshold ? "Clarity threshold met! Ready to crystallize pipeline files." : "Focusing next question on: {weakest_dimension}"}

```

### Step 2e: Update State & Step 2f: Check Soft Limits

1. **Persist state updates** directly to `.agents/state.json` or the local session memory space, recording all round metrics, component clarity scores, trigger metadata, and ontology snapshots.
2. **Enforce interview pacing bounds:**

* **Round 3+**: Allow early exit with warning if the user forces a termination command.
* **Round 10**: Show a soft warning: "We are at 10 rounds. Current ambiguity: {score}%. Continue or proceed with current clarity?"
* **Round 20**: Hard cap: Automatically stop interviewing and proceed to crystallization using the current clarity level.

## Phase 3: Lateral Review Panel (milestone-triggered)

The interview convenes a short multi-persona panel at **ambiguity-milestone transitions** instead of at fixed round numbers. Define milestone bands from the round's ambiguity score:

| Band | Ambiguity |
| --- | --- |
| `initial` | > 0.60 |
| `progress` | 0.60 ≥ a > 0.30 |
| `refined` | 0.30 ≥ a > threshold |
| `ready` | ≤ threshold |

A transition occurs whenever the band changes versus the prior scored round — in either direction, since bidirectional scoring can move the band back up. On a transition, and also before synthesizing any agent-supplied answer, convene the panel before generating or asking the next question.

**Personas & Mechanism:**

* Dispatch `researcher`, `contrarian`, and `simplifier` as parallel fork-context subagents through the `.agents/skills/deep-interview/lateral-review-panel.md` fragment. Each persona receives an independent, read-only copy of the prompt-safe context to prevent anchoring bias.
* Add the `architect` persona dynamically when a round introduces a change in system shape (e.g., scope expansion, a new top-level component, or cross-module integration).
* All auto-mode sub-agents operate strictly in read-only mode: they are forbidden from making direct workspace mutations, file edits, or execution delegations.

**Folding Findings:**

* Validate each persona's response shape internally. Fold only concrete, high-leverage findings into the single next user-facing question (e.g., as 2-3 ranked choice options or an explicit structural challenge). The panel never issues separate questions and never mutates requirements autonomously, preserving the strict one-question-per-round rule.

**Persona Lenses:**

* `researcher` — Surfaces external technical facts, existing domain patterns, or hidden library dependencies.
* `contrarian` — Deeply challenges core assumptions: "What if the opposite were true? Is this constraint actual or habitual?"
* `simplifier` — Aggressively probes for over-engineering: "What is the absolute simplest version of this feature that still delivers core value?"
* `architect` — Analyzes component boundaries, file architecture impact, and downstream `ralplan` compatibility when scope shifts.

**Ontology Escalation:**

* If ambiguity scoring stalls (the score fluctuates within ±0.05 for 3 consecutive rounds) or remains stubbornly above 0.30 after 8 rounds, instruct the panel (specifically `contrarian` + `architect`) to execute an ontology escalation. The next question must pivot entirely to re-anchoring the core entity definitions ("What IS this thing fundamentally?") before drilling back down into feature lists.

**Bookkeeping:**

* Record each panel activation into `state.lateral_reviews` inside `.agents/state.json` (logging the round, milestone trigger, personas dispatched, and folded findings). On fragment loading or validation failure, log the error in `lateral_panel_failures` and fall back silently to the default single-agent question generation to avoid breaking the interview flow.

## Phase 4: Crystallize Spec & Plan

When ambiguity ≤ threshold (or hard cap / early exit is reached), the agent must pass two sequential validation gates before synthesizing the final markdown files:

### Gate 4a: Closure / Acceptance Guard

* Run an independent readiness audit from a full-session perspective. Confirm that every active topology component identified in Round 0 has sufficient goal, constraint, and criteria coverage.
* Ensure no unresolved or disputed triggers remain on critical paths, and that no low-confidence auto-answers are overriding user intent. If a material gap exists despite a passing score, explicitly override completion, present the gap to the user, and return to the Phase 2 interview loop.

### Gate 4b: Restate Gate

* Collapse the entire agreed scope into a single-sentence core goal covering all active components.
* Request explicit user confirmation: *"Does this single sentence capture the exact essence of what you want to build?"* - If the user requires adjustments, collect the correction, re-score ambiguity under Step 2c, and re-run the closure gate. Once explicitly approved, persist this line as `state.restated_goal`.

---

### File Synchronization & Generation

Upon passing both gates, the agent utilizes the local workspace file system layer to generate and write two distinct artifacts. User-facing prose within the documents conforms to the target language configuration (Korean), while code identifiers, file paths, and standard technical metadata keys remain in English.

1. **Product Specification:** Write the comprehensive requirements definition to `docs/product-specs/PRD.md` exactly.
2. **Execution Plan:** Create the initial milestone and task layout at `docs/exec-plans/active/ep-{slug}.md` exactly, adhering strictly to the structural layout of the local `ep-0000-template.md`.

---

### Standard Specification Layout (docs/product-specs/PRD.md)

```markdown
# Product Specification: {Feature Title}

## Metadata
- Interview ID: {uuid}
- Total Rounds: {count}
- Final Ambiguity Score: {score}%
- Project Type: greenfield | brownfield
- Timestamp: {ISO-8601 timestamp}
- Threshold Config: {threshold} (source: .agents/settings.json)
- Restated Goal: {restated_goal}
- Sub-Agent Diagnostics: [Auto-Research: {n}, Auto-Answer: {n}, Panel Reviews: {n}]

## Clarity Breakdown
| Dimension | Score | Weight | Weighted Score |
|-----------|-------|--------|----------------|
| Goal Clarity | {s} | {w} | {s*w} |
| Constraint Clarity | {s} | {w} | {s*w} |
| Success Criteria | {s} | {w} | {s*w} |
| Context Clarity (Brownfield) | {s} | {w} | {s*w} |
| **Total Ambiguity** | | | **{score}%** |

## Scope Topology
| Component | Status | Description | Coverage / Deferral Note |
|-----------|--------|-------------|--------------------------|
| {component.name} | active | {description} | {acceptance criteria mapping} |
| {component.name} | deferred | {description} | {user-confirmed deferral reasoning and timestamp} |

## Core Requirements & Constraints
### High-Level Goal
{Detailed goal statement derived from the session}

### Strict Constraints
- {constraint 1}
- {constraint 2}

### Explicit Non-Goals
- {out of scope item 1}

## Functional Acceptance Criteria
- [ ] {Testable criterion 1}
- [ ] {Testable criterion 2}

## Assumptions Exposed & Resolved
| Explicit Assumption | Socratic Challenge | Final Project Decision |
|---------------------|--------------------|------------------------|
| {hidden assumption} | {how it was exposed} | {agreed design resolution} |

## Tech Stack
| Layer | Choice | Version | Build / Package Tool | Decision Source |
|-------|--------|---------|------------------------|------------------|
| {e.g. Backend Framework} | {e.g. Spring Boot} | {concrete version, e.g. "3.x (3.3 LTS 기준)" — never a bare major name without a version} | {e.g. Gradle} | {User-confirmed \| Researched-default (auto-research-greenfield) \| Existing codebase (brownfield)} |
| {e.g. Language/Runtime} | {e.g. Java} | {e.g. "21 (LTS)"} | - | {decision source} |

*규칙: 각 행의 `Version`은 임의로 비워두거나 메이저 이름만 적지 않는다. 그린필드는 `auto-research-greenfield.md`가 제시한 후보(현재 안정/LTS 버전 + 빌드 도구)를 사용자가 확정한 값을, 브라운필드는 기존 코드베이스에서 탐지한 실제 버전을 기록한다.*

## Code Style & Tooling
| Layer | Style Guide / Convention | Linter | Formatter | Decision Source |
|-------|---------------------------|--------|-----------|------------------|
| {e.g. Backend (Java)} | {e.g. Google Java Style} | {e.g. Checkstyle (google_checks.xml)} | {e.g. google-java-format} | {User-confirmed \| Researched-default (auto-research-greenfield) \| Existing codebase (brownfield)} |
| {e.g. Frontend (TS/React)} | {e.g. Airbnb} | {e.g. ESLint (eslint-config-airbnb)} | {e.g. Prettier} | {decision source} |

*규칙: 각 레이어/언어가 `## Tech Stack`에서 확정되면, 같은 라운드 또는 바로 다음 라운드에서 그 언어의 스타일 가이드·린터·포맷터를 함께 결정한다 — "나중에 정한다"로 비워두지 않는다. 그린필드는 `auto-research-greenfield.md`가 제시한 그 언어 생태계의 주류 컨벤션(예: Java → Google Style vs Sun/Oracle, JS/TS → Airbnb vs Standard) 중 사용자가 확정한 값을, 브라운필드는 기존 설정 파일(`.eslintrc`, `checkstyle.xml`, `.editorconfig` 등)에서 탐지한 실제 값을 기록한다.*

## Technical Context & Ontology
### Codebase Findings
{Brownfield exploration findings, file system patterns, and architecture citations}

### Domain Entities (Key Ontology)
| Entity Name | Entity Type | Fields / Attributes | Structural Relationships |
|-------------|-------------|---------------------|--------------------------|
| {entity.name} | core domain | {fields} | {relationships} |

### Ontology Convergence History
| Round | Entity Count | New Entities | Changed Entities | Stable Entities | Stability Ratio |
|-------|--------------|--------------|------------------|----------------─|-----------------|
| 1 | {n} | {n} | - | - | - |
| {final}| {n} | {new} | {changed} | {stable} | {ratio}% |

## Appendix: Complete Interview Transcript
<details>
<summary>View Full Q&A History ({n} rounds)</summary>

### Round 1
**Question:** {question}
**Answer:** {answer}
**Metrics:** Ambiguity {score}% (Goal: {g}, Constraints: {c}, Criteria: {cr})
</details>

```

## Phase 5: Execution & Validation Bridge

After the specification (`docs/product-specs/PRD.md`) and execution plan (`docs/exec-plans/active/ep-{slug}.md`) are successfully crystallized, the deep-interview skill terminates further file mutation. The deep-interview agent operates strictly as a requirements gathering and planning agent; it is forbidden from executing source code mutations, running deployment commands, or modifying files inside product source branches.

### 1. Eval Log Output

Before any further actions, write `evals/logs/latest.json`. This write is unconditional — it must happen whether the interview reached the threshold, hit the hard cap, or exited early.

```json
{
  "skill": "deep-interview",
  "run_id": "run-{unix_timestamp}",
  "started_at": "{ISO8601_UTC — recorded at Phase 0 start}",
  "finished_at": "{ISO8601_UTC_now}",
  "input_prompt": "{initial_idea_summary — prompt-safe, max 200 chars}",
  "model": "{현재 세션에 사용 중인 모델 ID. 확인 불가 시 null}",
  "token_usage": "{세션이 노출하는 input_tokens/output_tokens/total_tokens. 확인 불가 시 null}",
  "output_result": {
    "ambiguity_resolved": "{true if threshold met | false if early-exit or hard-cap}",
    "prd_path": "docs/product-specs/PRD.md",
    "exec_plan_path": "docs/exec-plans/active/ep-{slug}.md",
    "rounds": "{integer — total rounds completed}",
    "mutation_attempted": false
  },
  "eval_score": null
}
```

### 2. Guardrail Bootstrap (Greenfield Only)

Before registering anything in `PLANS.md` and before any `ralplan` handoff, check whether the root/ADR guardrail files are still the unpopulated shipped skeleton. `ralplan`'s Architect stage validates new plans against both `ARCHITECTURE.md` AND `docs/design-docs/core-beliefs.md` — empty versions of either make that check meaningless, so a first-run greenfield project must bootstrap both now, from this session's own PRD, before validation can mean anything.

* **Skip condition (brownfield):** If a given file already has real content beyond its bare header line, do not touch it — existing content takes precedence over this session's PRD. This skip rule is evaluated independently per file (`ARCHITECTURE.md`, `docs/design-docs/core-beliefs.md`, `AGENTS.md`).
* **Bootstrap `ARCHITECTURE.md` (greenfield):** If every section is empty (header only, no body), populate it directly from the just-crystallized `PRD.md`:
  - `## 1. Project Structure` ← top-level directories implied by the `Scope Topology` components.
  - `## 3. Core Components` → `### 3.1 Frontend` / `### 3.2 Backend` ← one line per relevant `## Tech Stack` row, written as prose: `{Choice} {Version}, built with {Build/Package Tool}`.
  - `## 4. Data Stores` ← any persistence/datastore rows from `## Tech Stack` or entities in `## Domain Entities (Key Ontology)` that imply storage.
  - `## 5. External Integrations / APIs` ← any third-party services or APIs the interview surfaced.
  - Leave `## 2. High-Level System Diagram`, `## 6. Deployment & Infrastructure`, and `## 7. Security Considerations` as an explicit placeholder line (e.g. `_추가 정보 필요 — 다음 ralplan 또는 execute 세션에서 보강_`) if the interview never established enough detail to fill them. **Never fabricate specifics the interview did not establish.**
* **Bootstrap `docs/design-docs/core-beliefs.md` (greenfield):** If the file is still just the `# Core Beliefs` header with no body, derive a numbered list of guiding principles from this session's PRD — each entry one sentence stating the principle plus a one-line rationale, sourced only from material the interview actually produced:
  - One entry per `## Core Requirements & Constraints` → `### Strict Constraints` item.
  - One entry per `### Explicit Non-Goals` item, phrased as a boundary belief (e.g. "이 프로젝트는 {X}를 다루지 않는다 — {non-goal rationale}").
  - One entry per non-trivial `## Tech Stack` decision whose `Rationale` reflects a deliberate tradeoff (not just "선택됨"), phrased as a technical belief.
  - Do not invent principles the interview never discussed — if constraints/non-goals were sparse, the list is short. A short, honest list beats a padded, fabricated one.
* **Bootstrap `AGENTS.md` (greenfield):**
  - If `## Project Overview` is empty, fill it with a one- to two-sentence summary derived from the PRD's `Restated Goal`.
  - If `### LLM-friendly References` is empty, fill it with baseline pointers that already exist after this session: links to `docs/product-specs/PRD.md`, `ARCHITECTURE.md`, `docs/design-docs/core-beliefs.md`, and `docs/exec-plans/active/ep-{slug}.md`. Do not invent additional references.
  - **Do not write style/testing content into `AGENTS.md` itself.** `## Code style` and `## Testing instructions` ship as fixed pointers (to `.agents/rules/global.md` / PRD's `## Code Style & Tooling`, and to `.agents/rules/persona-qa.md` respectively) — AGENTS.md is a map, not a content store, so these sections need no per-project bootstrap.
* **Push confirmed code style into the enforcement layer:** `.agents/rules/*.md` is the layer actually auto-injected into every agent's runtime context — a decision sitting only in `PRD.md` has no teeth until it lands there. For each row in `## Code Style & Tooling`, append one line to `.agents/rules/global.md` under a `## Project Tech Stack Style` heading (create the heading if absent): `- {Layer}: {Style Guide} — {Linter} + {Formatter}`. Skip rows that are already present verbatim (idempotent on re-runs).
* This is a documentation-only write to root/ADR/rules markdown guardrail files, not a source mutation, so it is permitted in this phase.

### 3. Dashboard Registration

Before prompting the user for the next phase, the agent must update the root `PLANS.md` dashboard file. It registers the newly created execution plan task under a `[Pending Validation]` status, ensuring workspace visibility.

### 4. Present Routing Options

The agent presents the final pipeline execution options to the user using the workspace interaction layer, preserving clarity and target localization:

**Question:** "Your product specification and execution plan draft have been successfully generated. How would you like to proceed with validation?"

**Options:**

1. **Validate with `ralplan` consensus loop (Highly Recommended)**
* **Description:** Invoke the local `.agents/skills/ralplan/SKILL.md` skill to evaluate the generated plan against `docs/product-specs/PRD.md`, `ARCHITECTURE.md`, and `docs/design-docs/core-beliefs.md`. This triggers a structured Planner ➡️ Architect ➡️ Critic review loop to expose dependencies and architectural risks before explicit execution.
* **Action:** Upon explicit user selection, hand off session context to the local `ralplan` module and transition into the validation workflow.


2. **Refine Further**
* **Description:** Continue the Socratic interview loop to clear up remaining edge cases, modify constraints, or split components further.
* **Action:** Return to the Phase 2 Interview Loop.



---

### Approval-Gated Refinement Pipeline

```text
Stage 1: Deep Interview          Stage 2: Local ralplan Consensus   Stage 3: Execution Approval
┌─────────────────────┐    ┌───────────────────────────────┐    ┌────────────────────────┐
│ Socratic Q&A        │    │ Planner reviews ep-*.md       │    │ User explicitly reviews│
│ Ambiguity scoring   │───>│ Architect checks constraints  │───>│ the validated plan     │
│ Spec/Plan Creation  │    │ Critic validates dependencies │    │ and triggers building  │
└─────────────────────┘    └───────────────────────────────┘    └────────────────────────┘
Output: PRD.md & ep-*.md   Output: [Status: Validated] Plan      Output: Safe Code Mutation

```

**Pipeline Integrity Principles:**

1. **Separation of Concerns:** Deep Interview gates on *clarity* (what to build). Local `ralplan` gates on *feasibility* and *soundness* (how to safely build it within the Harness architecture).
2. **No Automatic Handoff to Execution:** The pipeline must stop at a `pending approval` state once `ralplan` validation finishes. Under no circumstances should the agent auto-execute code modifications without a separate, explicit user command.

<Tool_Usage>

* Use the `ask` tool for each interview question — provides clickable UI with contextual options.
* Preserve the workspace workspace interaction layer for native interaction; do not introduce parallel structured-question transport into this skill.
* Use codebase exploration tools or bounded read-only planner/architect subagents for brownfield codebase exploration (run BEFORE asking the user about the codebase).
* Use a high-tier reasoning model (temperature 0.1) for ambiguity scoring — consistency is critical.
* Round 0 topology confirmation happens before ambiguity scoring; Phase 2 scoring must honor the locked topology and rotate targeting across active components when more than one is present.
* Use internal file memory `.agents/state.json` for interview state persistence; the initial and subsequent deep-interview state payloads must include `threshold_source` alongside `threshold`; do not modify state variables arbitrarily.
* Save the final specification at `docs/product-specs/PRD.md` and the initial plan at `docs/exec-plans/active/ep-{slug}.md` exactly; do not use raw file mutations against planning artifacts during normal workflow operation.
* Bridge to the local `.agents/skills/ralplan/SKILL.md` validation workflow only after explicit execution approval — never implement code directly. The deep-interview agent is a requirements and planning agent, not an execution agent.
* The lateral-review panel spawns read-only persona subagents in parallel with independent context; it operates strictly as an assist layer, never an executor and never the completion authority.
* Apply the Refine gate (Step 2b″), the Dialectic Rhythm Guard (Step 2a), and the Closure + Restate gates (Phase 4) through the interaction layer, preserving `language.instruction` for each.
* Use internal fragment auto-modes only at their documented hooks: `auto-research-greenfield.md` between Step 2a and 2b for greenfield `research: true` questions, `auto-answer-uncertain.md` as Step 2b′ after the question resolves and before scoring, and `lateral-review-panel.md` for the Phase 3 panel personas at ambiguity-milestone transitions.
* Fragment auto-modes are loaded on demand from `.agents/skills/deep-interview/` as internal skill-fragments; they are not public workflow skills, not slash-command discoverable, and do not register public entrypoints.
</Tool_Usage>

Why good: Identifies the weakest dimension, explains why it is now the bottleneck, asks a specific question to improve it, and does not batch multiple topics.

Question: "I found JWT authentication with passport.js in `src/auth/` (pattern match from explore).
For this new feature, should we extend the existing auth middleware or create
a separate authentication flow?"

Why good: Explored first, cited the repo evidence that triggered the question, then asked an informed confirmation question. Never asks the user what the code already reveals.


You've said this needs to support 10,000 concurrent users. What if it only
needed to handle 100? Would the architecture change fundamentally, or is
the 10K number an assumption rather than a measured requirement?

```

Why good: The lateral panel's contrarian persona challenges a specific assumption (scale requirement) that could dramatically simplify the solution.


Proceeding may require rework. Continue anyway?"
[Yes, proceed] [Ask 2-3 more questions] [Cancel]

Why good: Respects the user's desire to stop but transparently shows the risk.
</Good>

<Good>
Ontology stabilization — ask, then watch it converge:
```text
Round 6 | Targeting: Goal Clarity | Why now: the core entity is still unstable across rounds, so feature questions would compound ambiguity | Ambiguity: 38%

"Across the last rounds you've described this as a workflow, an inbox, and a planner. Which one is the core thing this product IS, and which are supporting views?"

→ Round 7 entities: User, Task, Project (stability: 67%)
→ Round 8 entities: User, Task, Project, Tag (stability: 100% — all 4 stable across 2 rounds)

```

Why good: An ontology-style question stabilizes the core noun before drilling into features; the stability ratio then climbing to 100% across consecutive rounds is the mathematical signal that the domain model has converged.

<Escalation_And_Stop_Conditions>

* **Hard cap at 20 rounds**: Proceed with whatever clarity exists, noting the risk of rework in downstream `ralplan` validation.
* **Soft warning at 10 rounds**: Offer to continue or proceed to immediate file crystallization.
* **Early exit (round 3+)**: Allow with warning if ambiguity is still higher than the resolved threshold.
* **User says "stop", "cancel", "abort"**: Stop immediately, save state to `.agents/state.json` for future resume.
* **Ambiguity stalls** (same score +-0.05 for 3 consecutive rounds): Activate Ontologist mode to reframe the conversation around entity definitions.
* **All dimensions at 0.9+**: Skip directly to specification and plan generation even if not at the round minimum.
* **Codebase exploration fails**: Proceed as a greenfield project and log the limitation in the technical context metadata.
</Escalation_And_Stop_Conditions>

<Final_Checklist>

* [ ] Phase 0 ran before anything: threshold resolved from `.agents/settings.json` and first line emitted as `Deep Interview threshold: <resolvedThresholdPercent> (source: <resolvedThresholdSource>)`.
* [ ] `language.instruction` preserved across announcements, questions, options, progress reports, and generated specification prose.
* [ ] Oversized initial context or history summarized before scoring, question generation, or artifact crystallization.
* [ ] Round 0 topology gate completed before any ambiguity scoring; `topology.confirmed_at` timestamp persisted.
* [ ] Ambiguity scored and displayed every round, naming the weakest component/dimension target and rotating targeting across active components when N > 1.
* [ ] Lateral panel convened at milestone transitions (and before synthesizing agent-supplied answers) with parallel read-only personas.
* [ ] Free-text answers passed the Refine gate; dialectic rhythm guard forced a user-facing question after 3 consecutive agent-resolved rounds.
* [ ] Closure / Acceptance Guard and the one-sentence Restate gate both passed with explicit user confirmation before crystallization.
* [ ] Interview reached ambiguity ≤ threshold OR an explicit early exit with warning was executed.
* [ ] Product specification persisted to `docs/product-specs/PRD.md` and execution plan draft persisted to `docs/exec-plans/active/ep-{slug}.md` exactly.
* [ ] Spec metadata includes the auto/lateral counters (`auto_researched_rounds`, `auto_answered_rounds`, `lateral_reviews`, `refined_rounds`, `architect_failures`, `lateral_panel_failures`).
* [ ] Each `## Tech Stack` language/framework decision has a matching `## Code Style & Tooling` row (style guide + linter + formatter) confirmed in the same or next round — never left for later.
* [ ] `ARCHITECTURE.md`, `docs/design-docs/core-beliefs.md`, and `AGENTS.md` (Project Overview + LLM-friendly References only) checked: bootstrapped from the PRD if still an empty skeleton, left untouched if any already had real content.
* [ ] Confirmed `## Code Style & Tooling` rows pushed into `.agents/rules/global.md` under `## Project Tech Stack Style` — not duplicated into `AGENTS.md`.
* [ ] Execution and validation bridge presented via interaction choices; handoff to `.agents/skills/ralplan/SKILL.md` executed only after explicit user approval.
</Final_Checklist>

Optional settings in `.agents/settings.json`:

```json
{
  "deep_interview": {
    "ambiguity_threshold": 0.05,
    "max_rounds": 20,
    "soft_warning_rounds": 10,
    "min_rounds_before_exit": 3,
    "enable_challenge_agents": true,
    "scoring_model": "high-tier-reasoning"
  }
}

```

## Resume

If interrupted, invoking this deep-interview skill again will parse `.agents/state.json`. If `"active": true` is found, the agent resumes the transcript, loads established facts, and preserves the historical ontology snapshot without re-running Phase 0 or Round 0.

If the `--fresh` flag is passed, ignore any existing `.agents/state.json` (even if `"active": true`) and begin a completely new interview from Phase 0. The previous state file is overwritten at the end of Phase 1 initialization.

## Pipeline Routing: deep-interview → ralplan → pending approval

```text
Stage 1: Deep Interview          Stage 2: ralplan consensus       Stage 3: Separate approval
┌─────────────────────┐    ┌───────────────────────────┐    ┌──────────────────────┐
│ Socratic Q&A        │    │ Planner creates plan      │    │ User chooses if/how  │
│ Ambiguity scoring   │───>│ Architect reviews         │───>│ execution proceeds   │
│ Spec crystallization│    │ Critic validates          │    │ no auto-execution    │
│ Gate: ≤ threshold   │    │ Loop until consensus      │    │                      │
└─────────────────────┘    └───────────────────────────┘    └──────────────────────┘
Output: PRD.md & ep-*.md   Output: Validated Plan           Output: Safe Execution

```

**Why 3 stages?** Each stage provides a different quality gate:

1. **Deep Interview** gates on *clarity* — does the user know what they want? Output is saved directly to `docs/product-specs/PRD.md` and `docs/exec-plans/active/ep-*.md`.
2. **ralplan consensus** gates on *feasibility* — is the execution plan architecturally sound against `ARCHITECTURE.md` and `docs/design-docs/core-beliefs.md`?
3. **Separate approval** gates on *consent* — the workspace stops at a pending approval state, ensuring no automated source code mutations happen without human intervention.

## Brownfield vs Greenfield Weights

See "Calculate ambiguity" in Step 2c for the weighted formulas. Brownfield adds a 15% Context Clarity dimension (Goal/Constraint/Criteria become 35/25/25) because safely modifying existing code requires a verified mapping against current system structures.

## Ambiguity Score Interpretation

```text
| Score Range | Meaning | Action |
|-------------|---------|--------|
| 0.0 - 0.1 | Crystal clear | Proceed immediately |
| At or below the resolved threshold | Clear enough | Proceed |
| Above the resolved threshold with minor gaps | Some gaps | Continue interviewing |
| Moderate ambiguity | Significant gaps | Focus on weakest dimensions |
| High ambiguity | Very unclear | May need reframing (panel ontology escalation) |
| Extreme ambiguity | Almost nothing known | Early stages, keep going |

```

Task: {{ARGUMENTS}}