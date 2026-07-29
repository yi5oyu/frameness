# ep-{YYYYMMDD}-{slug}: {task name}

**Status:** [Draft]
<!-- Draft → Approved → In Progress → Done.
     Always record the status before the change that produced it. -->

> You may be a stateless agent — do not rely on past conversation; write so
> the work can be completed from this file and the codebase alone.

## Purpose

<!-- Why this change is needed. What to look at afterwards to confirm it works. 1-3 lines. -->

## Decisions

<!-- At each fork: what was chosen, and what was rejected. The reason for
     rejecting is the point. Leave empty if none. Filled by plan during the
     interview, and by debug once the root cause is confirmed.

     - Sessions in Redis — stateless JWT cannot be revoked immediately
-->

## Affected Files

<!-- Repo-root-relative paths of source files to change, one per line.
     Whole directory: trailing / .
     Source files not listed here cannot be edited — add them and re-approve first.
     Test files for an approved source file count as approved — do not list them. -->
- src/example.ts

## Acceptance Criteria

<!-- Concrete, human-verifiable conditions. Once checked, leave the evidence
     on the same line.

     - [x] Wrong password on login returns 401 — `src/auth/login.test.ts:42`
     - [x] Install instructions added to README — manual: rendering checked
     - [ ] Social login
-->
- [ ] {decidable criterion 1}

## Risk

<!-- Filled by execute step 1, only when it meets a risk signal:
     global state · public API change · migration · auth/security -->

(none)

## Implementation Order

<!-- Filled by execute step 2.
     {n}. {path} {CREATE|MODIFY|DELETE} — {why, one line} -->

## Approval

<!-- Re-approval is a new entry; the last entry is the one in force.

     ### {ISO8601}
     - Approver input: "{verbatim human input}"
     - Approved files:
       - src/example.ts
     - Acceptance: {copy of the criteria in force}
-->

(none yet)

## Change Log

<!-- {ISO8601} {CREATE|MODIFY|DELETE} {path} — {why, one line} -->

## Review

<!-- Filled by the review skill. Optional.
     verdict: APPROVED | NEEDS_REVISION
     - BLOCKER|WARNING|NOTE {file:line} — {what} -->

(not run)

## Run History

<!-- {ISO8601} {procedure} {DONE|ABORTED|FAILED} — {one line}
     2026-07-28T14:22:00+09:00 execute DONE — 42 tests green, build ok -->
