# AGENTS.md

## Procedure

A plan (ep) = `docs/plans/active/ep-{YYYYMMDD}-{slug}.md` — created by copying
`ep-0000-template.md`. **The plan file is the only state.** Anything inside
`docs/plans/` is written without approval.

1. **Plan** — read the relevant code first and scope the work, then fill the
   template. `## Acceptance Criteria` must be decidable. If unclear, ask once.
2. **Approve** — present the plan path, files, and criteria, then wait.
   **No tool calls while waiting.** On approval, copy the files and criteria
   into `## Approval` and set Status to `[Approved]`.
3. **Implement** — only approved files, only as much as the criteria need.
   Set Status to `[In Progress]` right before the first source change, and
   append one `## Change Log` line immediately per change.
4. **Verify** — check the criteria in `## Approval` one by one, tick them in
   `## Acceptance Criteria`, and present pass/fail together with a proposed
   commit message. Human `lgtm`.
5. **Close** — set Status to `[Done]`, move the file to `done/`, then commit
   (one-line subject + footer `ep: {slug}`).

- In a plan, `## Approval`·`## Change Log`·`## Run History` are append-only —
  never edit past lines to match reality. Every other section is filled in
  place. Status and the criteria checkboxes are updated; record Status before
  the change that produced it. Adding a file to `## Affected Files` requires
  re-approval.
- At a fork, record the choice and the rejected option with its reason in
  `## Decisions` — the rejected option is what the code cannot recover.
- Ambiguous is not approved — re-present. If it reads as a stop, stop.
- One `## Run History` line at every run end — done, aborted, or failed.
- A subfolder's AGENTS.md holds that folder's facts (`## Commands` ·
  `## Structure` · `## Forbidden`) — read it at planning time, and verify by
  running `## Commands` for every folder the change spans.
