---
name: setup
description: Settle the project's direction and stack through an interview, then record its facts (commands, structure) in AGENTS.md. Once right after install; again when a new stack folder is added.
disable-model-invocation: true
---

# setup — settling the project skeleton

No source is changed, so no ep is created.

## 1. Investigate first

If code already exists, the stack is a fact — read it.
If empty, it is a decision — ask.

## 2. Split rule — where the facts go

Follow the layout the root AGENTS.md sets.

**No subfolder AGENTS.md (default):** do not split — record every fact below the
root AGENTS.md, and if there are several folders, prefix each `## Commands` item
with its folder.

**Subfolder AGENTS.md:** one per folder that owns its own build and test commands.

- Different commands → must split
- Same commands → do not split; layering belongs in that file's `## Structure`
- A single stack means one `src/AGENTS.md` — the root is the contract, so facts
  do not go there

## 3. Interview — one question at a time, each with a recommendation

- Domain: what is being built (1-2 lines)
- Folders: propose candidates by the rule above and confirm
- Stack per folder
- Commands per folder: build · test · single test · run locally

## 4. Record

Record per the rule in step 2 — sections as the root contract defines.
A subfolder AGENTS.md opens with one comment line: `Procedure lives in the root
AGENTS.md. This file holds only this folder's facts.`
The first line of `## Structure` is what this folder is responsible for (in the
root, one line per folder) — the domain is split up and recorded there.
Do not create `## Forbidden` yet — rules written before any code exists are
hollow.

## 5. Verify

Run the test command and confirm it works.
If there is nothing to run yet (greenfield), leave `(unverified)` next to it.

**Done when:** every folder's facts are recorded and its `## Commands` are either
verified by running them or marked `(unverified)`.
