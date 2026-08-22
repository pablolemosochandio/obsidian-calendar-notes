# Archive Report: note-tags-in-filtered-notes

**Status**: success (intentional-with-warnings)
**Archived**: 2026-08-22
**Store mode**: both (openspec + engram)

## Final State

- Change: `note-tags-in-filtered-notes` — show frontmatter `tags` as read-only, styled chips in the filtered-notes list, strip inline `#tag` from excerpts, gated by a `showTags` setting (default `true`).
- New capability: `note-tag-display` (main spec created). No existing capability modified (`note-date-source` untouched).
- Verify verdict: PASS — 0 blockers, 0 CRITICAL, 0 WARNING, 1 benign SUGGESTION.
- Commands: `npm run lint` = 0, `npx tsc --noEmit` = 0, `npm run production` = 0.

## Gates

### Task Completion Gate

- 12 of 13 tasks automated `[x]`: 1.1–1.4, 2.1–2.3, 3.1–3.3, 4.1, 4.2.
- Task 4.3 remains `[ ]`: the automatable half (`npm run production`, exit 0) is complete; the 7-item manual vault spot-check is NOT executed (no live Obsidian vault in the automated environment).
- The user explicitly chose "Archivar ahora" (archive now), accepting closure with the manual checklist as a user-owned confirmation. This is recorded as **intentional-with-warnings**. No specific manual item results are claimed.

### Native Review Receipt Gate

- `reviewGate` structurally absent — no review was ever started for this candidate. Archive proceeded under ordinary repository policy.

### CRITICAL gate

- Verify report: 0 CRITICAL, 0 blockers. No blocking findings; no override was needed or applied for CRITICAL.

## Spec Sync

- `note-tag-display` main spec did not exist; the delta spec contains no `ADDED`/`MODIFIED`/`REMOVED`/`RENAMED` sections, so it is a full spec. Copied mechanically to `openspec/specs/note-tag-display/spec.md`.
- `diff -r` (source vs. destination): empty — byte-identical.

## Archive Move

- Change folder moved to `openspec/changes/archive/2026-08-22-note-tags-in-filtered-notes/`.
- Mechanical `mv` (the source directory was untracked; `git mv` correctly refused and the plain `mv` fallback ran).
- Pre-move recursive snapshot vs. archived tree `diff -r`: empty — byte-identical.
- Archived contents: proposal.md, specs/note-tag-display/spec.md, design.md, tasks.md, verify-report.md.

## Mechanical Copy Evidence

- Spec sync `diff -r`: empty (pass).
- Archive move `diff -r`: empty (pass).

## Final-State Facts (authoritative, at close)

1. Implementation and automated verification are complete and clean: `npm run lint` = 0, `npx tsc --noEmit` = 0, `npm run production` = 0. Verify verdict: pass, 0 blockers, 0 critical, 1 benign SUGGESTION (chip border fallback uses `--background-modifier-border`; the two spec-named fallbacks `--text-accent`/`--background-secondary` are honored).
2. The 7-item manual vault checklist (task 4.3) was not executed in an automated environment. The user explicitly chose "Archivar ahora" after the verify phase, accepting closure with the manual checklist as a user-owned confirmation.
3. No source code was changed after `apply-progress` or `verify-report` were persisted; those snapshots are current. The change is uncommitted (user commits himself) — working tree has 4 modified source files (`src/main.ts`, `src/settings.ts`, `src/styles.css`, `src/views/calendar-view.ts`) plus the untracked openspec change directory.
4. The new capability `note-tag-display` was added; no existing capability was modified (`note-date-source` untouched).

## Observations Read (traceability)

- Engram #131 — `sdd/note-tags-in-filtered-notes/apply-progress` (apply progress snapshot).
- Filesystem: proposal.md, specs/note-tag-display/spec.md, design.md, tasks.md, verify-report.md, config.yaml.

## Remaining User Action (follow-up)

- Run the 7-item manual vault checklist (per verify-report "Manual Checklist") in a live Obsidian vault: scalar vs array tags, inline-only note, no-tags note, theme fallback visual, toggle off, mobile rendering, chip activation no-op.

## Benign Finding Carried Forward

- SUGGESTION (verify-report): `.calendar-note-tag` border fallback uses `--background-modifier-border` rather than one of the two spec-named fallbacks. Benign — the two named fallbacks are honored and the border is an additive property not required by spec. Consider aligning or documenting.
