#!/usr/bin/env node
/**
 * harness — pre-commit gate check
 *
 * If any staged file is inside source_dirs:
 *   1) Verify the file is listed under Affected Files of an approved plan
 *      (ep-*.md with Status [Approved|In Progress|Done] + Approval record).
 *   2) If two or more approved plans claim the same file, evidence is
 *      ambiguous — reject the commit (Contract, gate condition 5).
 *   3) A plan in done/ covers files only when the plan file itself is staged
 *      in this commit (= the [Done] archive commit) — closes the loophole
 *      where a past plan permanently authorizes later unplanned edits.
 *
 * Mechanical enforcement paired with the format comments in
 * ep-0000-template.md (the canonical format source). If you change the
 * parsed formats (Status line, quoted Approver input, Affected Files list),
 * update the template and the Contract §Evidence Format clause in the same
 * commit.
 */
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const AUTHORIZED_LABELS = ["[Approved]", "[In Progress]", "[Done]"];
const TEMPLATE_NAME = "ep-0000-template.md";

function git(cmd) {
  return execSync(`git ${cmd}`, { encoding: "utf8" }).trim();
}

function block(lines) {
  console.error("");
  console.error("[harness] Commit rejected by the gate.");
  for (const line of lines) console.error("   " + line);
  console.error("");
  process.exit(1);
}

// --- 1. Read settings (boundary definition) -------------------------------
const root = git("rev-parse --show-toplevel");
const settingsPath = path.join(root, ".agents", "settings.json");

if (!fs.existsSync(settingsPath)) {
  block([
    ".agents/settings.json not found — the harness boundary definition is missing.",
    "Restore the file, or disable the hook to remove the harness:",
    "  git config --unset core.hooksPath",
  ]);
}

let settings;
try {
  settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
} catch (e) {
  block([".agents/settings.json parse error: " + e.message]);
}

const sourceDirs =
  Array.isArray(settings.source_dirs) && settings.source_dirs.length
    ? settings.source_dirs
    : ["src"];
const paths = settings.paths || {};
const planDirs = [
  paths.plans_active || "docs/plans/active/",
  paths.plans_done || "docs/plans/done/",
];

// --- 2. Collect staged source files ----------------------------------------
const staged = git("diff --cached --name-only --diff-filter=ACMDR")
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

const gated = staged.filter((f) =>
  sourceDirs.some((d) => f === d || f.startsWith(d.replace(/\/+$/, "") + "/"))
);

if (gated.length === 0) process.exit(0); // nothing gated in this commit

// --- 3. Collect approved plans ---------------------------------------------
function parsePlan(absDir, relDir, file) {
  const text = fs.readFileSync(path.join(absDir, file), "utf8");

  const statusMatch = text.match(/^\*\*Status:\*\*\s*(\[[^\]]+\])/m);
  const status = statusMatch ? statusMatch[1] : null;

  // Contract §Evidence Format: the approver's input is recorded verbatim in quotes
  const approved = /Approver input:\s*"[^"]+"/.test(text);

  const files = [];
  const parts = text.split(/^## Affected Files\s*$/m);
  if (parts.length > 1) {
    const body = parts[1].split(/^## /m)[0];
    for (const line of body.split("\n")) {
      const m = line.match(/^\s*-\s*`?([^\s`]+)`?\s*$/);
      if (m) files.push(m[1].replace(/\\/g, "/"));
    }
  }
  return { plan: relDir + file, status, approved, files, active: relDir === planDirs[0] };
}

let authorizedPlans = [];
for (const planDir of planDirs) {
  const abs = path.join(root, planDir);
  if (!fs.existsSync(abs)) continue;
  const plans = fs
    .readdirSync(abs)
    .filter((f) => /^ep-.+\.md$/.test(f) && f !== TEMPLATE_NAME)
    .map((f) => parsePlan(abs, planDir, f))
    .filter((p) => p.status && AUTHORIZED_LABELS.includes(p.status) && p.approved);
  authorizedPlans = authorizedPlans.concat(plans);
}

// --- 4. Judge ---------------------------------------------------------------
const stagedSet = new Set(staged);

function coveringPlans(f) {
  return authorizedPlans.filter(
    (p) =>
      // a done/ plan is valid only in its archive commit (plan file staged too)
      (p.active || stagedSet.has(p.plan)) &&
      p.files.some(
        (entry) => entry === f || (entry.endsWith("/") && f.startsWith(entry))
      )
  );
}

const uncovered = [];
const ambiguous = [];
for (const f of gated) {
  const covers = coveringPlans(f);
  if (covers.length === 0) uncovered.push(f);
  // overlap is checked among active plans only — done/ is past evidence
  else if (covers.filter((p) => p.active).length > 1)
    ambiguous.push({ file: f, plans: covers.filter((p) => p.active).map((p) => p.plan) });
}

if (uncovered.length > 0) {
  block([
    "Source file changes not listed in any approved plan:",
    ...uncovered.map((f) => "  - " + f),
    "",
    `Approved plans: ${authorizedPlans.length} (ep-*.md in ${planDirs.join(", ")} ` +
      `with Status ${AUTHORIZED_LABELS.join("|")} + Approval record)`,
    "",
    "How to fix:",
    `  1. Create a plan file in ${planDirs[0]} (template: ${TEMPLATE_NAME})`,
    "  2. List the paths above under Affected Files",
    "  3. Get human approval (approved) and record it in ## Approval.",
    "",
    "Details: AGENTS.md Contract section",
  ]);
}

if (ambiguous.length > 0) {
  block([
    "Multiple active approved plans claim the same source file — evidence is ambiguous:",
    ...ambiguous.map((a) => `  - ${a.file} ← ${a.plans.join(" · ")}`),
    "",
    "One source file belongs to exactly one plan at a time (Contract, gate condition 5).",
    "Merge the plans, or settle one to [Done]/[Draft], then commit.",
  ]);
}

process.exit(0);
