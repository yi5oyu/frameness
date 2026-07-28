---
name: debug
description: Use on bugs, test failures, unexpected behavior, regressions. No fixes before the root cause is confirmed — reproduce first.
---

# debug — reproduce → root cause → lock

When you meet a symptom, stop the fixing hand and enter this loop.

1. **Reproduce (pin the red):** make the failure reproducible with **one
   command** — change nothing until a command exists that reliably fails on this
   bug. If intermittent, run it repeatedly and record the failure rate. Use
   `## Commands` from that folder's AGENTS.md.
2. **Minimize:** shrink inputs and conditions to the smallest reproduction that
   still fails.
3. **Hypothesis → verify (one at a time):** state "it's because X", plant an
   observation that discriminates it (logs, intermediate values, bisection), and
   run. If wrong, record the hypothesis and its refutation, then move on.
   Testing two hypotheses at once cannot tell you which one was discriminated.
4. **Confirm the root cause:** confirmed when you can write one paragraph —
   "this code, under this condition, behaves this way, producing the symptom."
   Symptom location and cause location may differ — fix the cause.
5. **Fix — this splits on where it was found.**
   - **During implementation** (a failure inside execute steps 4-5) → use this
     loop for root-cause tracing only; fix within the ep already in progress.
     No new ep.
   - **After close** (a bug found after `[Done]`) → create a new ep holding the
     root-cause paragraph and the fix approach, and go to AGENTS.md `Procedure`
     step 2.

   Investigation itself needs no ep — only the fix does.
6. **Lock:** turn the reproduction command from step 1 into a regression test and
   commit it with the fix — verify by execution that red turned green.

**3-strike rule:** if fixes for the same symptom fail 3 times, stop. Report to
the human with the hypothesis/observation log: "possibly a structural problem,
not a local fix."

**Done when:** root-cause paragraph + regression test green + (if found after
close) the fix ep `[Done]` — or the 3-strike report. Either way, one ep
`## Run History` line.
