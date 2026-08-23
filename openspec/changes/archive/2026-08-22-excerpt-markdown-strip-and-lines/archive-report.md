# Archive Report: excerpt-markdown-strip-and-lines

**Status**: success
**Archived**: 2026-08-22
**Store mode**: both (openspec + engram)

## Final State

- Change: `2026-08-22-excerpt-markdown-strip-and-lines` — strip Markdown markers from the filtered-note excerpt to clean plain text (`**bold**`→`bold`, `[[A|B]]`→`B`, `[t](u)`→`t`, remove fences/rules/images/embeds) and fix the "Excerpt lines" setting so it honors the first N source lines (previously a no-op).
- New capability: `note-excerpt` (main spec created).
- Modified capability: `note-tag-display` (inline-`#tag` stripping delegated to `note-excerpt`; chips and tag row unchanged).
- Verify verdict: PASS WITH WARNINGS — 0 CRITICAL, 1 benign WARNING (design-doc drift, resolved pre-archive), 1 SUGGESTION (sync design.md, done).
- Commands: `npm run lint` = 0, `npx tsc --noEmit` = 0, `npm run production` = 0. Harness: 14/14 spec scenarios.

## Gates

### Task Completion Gate

- 10 of 10 tasks `[x]` (1.1–1.3, 2.1–2.2, 3.1–3.4, 4.1). No unchecked implementation tasks.

### Native Review Receipt Gate

- `reviewGate` structurally absent — receipt-driven development off for this clone; no review was ever started for this candidate. Archive proceeded under ordinary repository policy.

### CRITICAL gate

- Final verify report: 0 CRITICAL. The single CRITICAL from the first verify (backslash escapes) was resolved by a bounded correction and re-verification; no override was applied.

## Spec Sync

- `note-excerpt` main spec did not exist; the delta is a full spec (no ADDED/MODIFIED/REMOVED/RENAMED sections). Copied mechanically to `openspec/specs/note-excerpt/spec.md`. `diff -r`: empty (byte-identical).
- `note-tag-display` main spec existed; applied the MODIFIED delta: replaced "Inline tags excluded from chips and excerpt" with "Inline tags excluded from chips" (delegating inline-`#tag` stripping to `note-excerpt`). All 6 other requirements preserved.

## Archive Move

- Change folder moved to `openspec/changes/archive/2026-08-22-excerpt-markdown-strip-and-lines/` (change name already carried the ISO date prefix; no double-prefix).
- Mechanical `mv` (source was untracked; `git mv` refused, plain `mv` fallback ran).
- Pre-move recursive snapshot vs. archived tree `diff -r`: empty (byte-identical).
- Archived contents: proposal.md, specs/note-excerpt/spec.md, specs/note-tag-display/spec.md, design.md, tasks.md, verify-report.md.

## Mechanical Copy Evidence

- Spec sync `diff -r` (note-excerpt): empty (pass).
- Archive move `diff -r`: empty (pass).

## Final-State Facts (authoritative, at close)

1. Implementation and automated verification are complete and clean: lint/tsc/build exit 0; harness 14/14. Verify verdict PASS WITH WARNINGS, 0 CRITICAL.
2. The first verify returned FAIL (1 CRITICAL: backslash escapes orphaned because emphasis deletion ran before backslash-unescape). A bounded correction reordered step (i) of `createExcerptText` (unescape before emphasis delete). Re-verification passed with 14/14 scenarios.
3. `design.md` was synced pre-archive (step (i) order and the `\*literal\*` assertion row corrected). No design drift remains.
4. Final changed source files: `src/views/calendar-view.ts` and `src/styles.css` only; `src/settings.ts` and `src/main.ts` unchanged.
5. Native runtime ledger: apply passed; verify failed then re-verified passed with the remediation binding released (an audited maintainer reset preceded the re-verify).

## Observations Read (traceability)

- Engram #103 (sdd-init/obsidian-calendar), #105 (skill-registry), #138 (explore), #139 (proposal), #140 (spec), #142 (tasks), #143 (apply-progress), #145 (verify-report).
- Filesystem: proposal.md, specs/note-excerpt/spec.md, specs/note-tag-display/spec.md, design.md, tasks.md, verify-report.md, config.yaml.

## Remaining User Action (follow-up)

- Optional manual vault spot-check: confirm the visual `-lines-N` clamp renders as expected in a live Obsidian vault (the pure transform and CSS edit are verified; the wrapped-visual-clamp behavior is width-dependent).
