2. **Approve** — present the plan path, files, and criteria, then wait.
   **No tool calls while waiting.** On approval, copy the files and criteria
   into `## Approval` and set Status to `[Approved]`.
3. **Implement** — only approved files, only as much as the criteria need.
   One ep at a time. Right before the first source change, if there are
   uncommitted changes outside `docs/plans/`, stop and show them — keeping or
   discarding them is the human's call. Then record the current branch in
   `**Branch:**`, set Status to `[In Progress]`, and append one
   `## Change Log` line immediately per change.
4. **Verify** — check the criteria in `## Approval` one by one, tick them in
   `## Acceptance Criteria`, and present pass/fail together with a proposed
   commit message. Human approval — or a review request: set Status to
   `[In Review]` and wait for `review` in a fresh session. On `APPROVED`,
   present again for approval; on `NEEDS_REVISION`, set it back to
   `[In Progress]`, fix within the same ep, and verify again.
5. **Close** — if reviewed, only when the last verdict in `## Review` is
   `APPROVED`. Set Status to `[Done]`, move the file to `done/`, then commit
   only the files in the Change Log and this ep file, by path (one-line
   subject + footer `ep: {slug}`).
