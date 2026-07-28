---
name: tdd
description: Test-driven implementation discipline — when building or changing behavior. Used in execute's implementation step and whenever "test first"/red-green comes up. Not for config or docs changes.
---

# tdd — the red → green loop

This loop runs inside an approved ep. If there is no ep, or it is not approved
yet, go to AGENTS.md `Procedure` steps 1-2 before starting RED.
Test files for an approved source file count as approved.

Implementation is this loop repeated. Refactoring happens outside the loop —
only after everything is green.

## Loop

1. **RED:** write one failing test and **run it to watch it fail.**
   A test never seen failing cannot be trusted.
2. **GREEN:** write only the minimum implementation that passes it. No
   pre-building for the next test — exactly enough to turn this red green.
3. Repeat — one slice at a time: one test → one implementation.

Use `## Commands` from that folder's AGENTS.md to run. Never guess.

## seam — where tests go

Tests target public interfaces (**seams**) only. Before starting, derive this
work's seam list from the ep's acceptance criteria; write no tests against
internals outside the list. Every acceptance criterion needs at least one test
on a seam.

## Anti-patterns (when in doubt, compare with [anti-patterns.md](./anti-patterns.md))

- **Implementation coupling** — mocking internal collaborators or inspecting
  private functions. Tell: if refactoring alone breaks the test while behavior
  stays the same, this is it.
- **Tautology** — computing the expectation the same way the code does
  (`expect(add(a,b)).toBe(a+b)`). Expectations come from independent sources
  (concrete numbers in the spec, hand-worked examples).
- **Horizontal slicing** — writing all tests first, all implementation later.
  You end up verifying imagined behavior. Always vertical — one slice at a time.

**Done when:** every acceptance criterion has a matching test · all tests green ·
one ep Change Log line per change (procedure step 3) · evidence recorded on each
criterion line.
