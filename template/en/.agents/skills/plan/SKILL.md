---
name: plan
description: Forge ambiguous requirements into an executable plan (ep [Draft]) through an interview. No source edits.
disable-model-invocation: true
---

# plan — forging a plan by interview

If the target folder has no AGENTS.md, or its `## Commands` is empty, point to
`setup` and stop — a plan made before the stack is settled cannot be verified.

1. **Investigate first.** Facts (codebase, stack, existing patterns) are looked
   up directly, never asked. Read the AGENTS.md of every folder the candidate
   Affected Files span — its `## Forbidden` changes the plan.
2. **One question at a time.** Bundled questions blur the answers. Attach a
   recommendation to each. Only **decisions** (goals, scope, trade-offs) belong
   to the user.
3. If an answer changes the plan, restate the changed understanding in one line
   and get it confirmed.
4. When no decisions remain, fill a copy of `ep-0000-template.md` with the
   agreement and save it as `[Draft]`. Every acceptance criterion must be a
   decidable sentence. Decisions that persist project-wide (stack, conventions,
   commands) go to that folder's AGENTS.md, not into the ep.
5. Report the ep path and **point to `execute`, then stop.**
   Do not request approval here — execute collects it and records `## Approval`.
   The point is to keep approval in one place.
6. One ep `## Run History` line.

**Done when:** an ep [Draft] exists in `docs/plans/active/` · every criterion is
decidable · one Run History line.
