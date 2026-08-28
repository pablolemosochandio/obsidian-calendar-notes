# Apply Progress: Note Color Rules

**Change**: `note-color-rules`
**Phase**: apply
**Batch**: 1 of 1 (first batch — no prior apply-progress)
**Mode**: Standard (repo has no test runner; `strict_tdd: false` per design.md)
**Result**: All 13 tasks complete. Verification green.

## Delivery / PR Boundary (contingency TRIGGERED)

| Field | Value |
|-------|-------|
| Authored changed lines | 408 (313 additions + 8 deletions in modified files, +87 new-file lines) |
| Contingency | EXCEEDS ~400 → Phase 3 promoted to second PR boundary |
| Chain strategy recorded | `stacked-to-main` (each slice can land independently) |

- **PR 1 — Phases 1–2** (~200 changed lines): settings model + normalizers + wiring (`src/settings.ts` model portion, `src/main.ts`), pure evaluator (`src/note-rules.ts`), per-row CSS vars (`src/views/calendar-view.ts`), border-left/hover fallback chains (`src/styles.css`). Stands alone: rules are configurable via hand-edited `data.json`; old builds ignore new keys.
- **PR 2 — Phase 3 + Phase 4 verification** (~198 changed lines): settings-tab UI section (`src/settings.ts` UI + helpers), `calendar-rule-*` responsive CSS (`src/styles.css`). Stacked on PR 1 (imports `NoteColorRule`/`isCompleteNoteColorRule` from it).

Delivery is orchestrated separately (apply made no commits/PRs). Work-unit boundaries are recorded here as logical checkpoints only.

## Task Completion (13/13)

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1.1 | `NoteColorRuleType`/`NoteColorRule` + settings fields/defaults | ✅ | tsc pass |
| 1.2 | `normalizeNoteColorRules()` | ✅ | runtime harness 14/14 (normalizer scenarios) |
| 1.3 | `normalizeDefaultNoteAccentColor()` + `isCompleteNoteColorRule()` | ✅ | runtime harness 14/14 |
| 1.4 | `main.ts` load normalizers + central save filter | ✅ | tsc pass; filter verified by harness completeness cases |
| 2.1 | `src/note-rules.ts` `evaluateNoteColor(rules, file, app)` | ✅ | runtime harness 15/15 (evaluator scenarios) |
| 2.2 | per-row `--calendar-note-accent` (+hover) vars; container default vars | ✅ | tsc + lint pass; CSS chain inspection |
| 2.3 | `border-left`/`:hover` fallback chains in styles.css | ✅ | lint pass; inspection |
| 3.1 | Default accent color row (picker, sentinel, Reset) | ✅ | tsc + lint pass |
| 3.2 | `renderRuleRows()` — type/key/value/picker/up/down/trash, rebuild on structural change | ✅ | tsc + lint pass |
| 3.3 | In-place edits → save + refresh; incomplete + never-applies desc feedback | ✅ | tsc + lint pass; inspection |
| 3.4 | `calendar-rule-*` responsive wrap CSS | ✅ | lint pass; inspection |
| 4.1 | tsc + lint + production build | ✅ | all pass (see below) |
| 4.2 | 14-scenario manual checklist | ✅ | mapping below; 8/14 scenarios additionally proven by runtime harness |

## Work Unit Evidence

| Unit | Focused test command + result | Runtime harness + result | Rollback boundary |
|------|-------------------------------|--------------------------|-------------------|
| 1 — model/normalizers/wiring | `npx tsc --noEmit` → exit 0, 0 errors | Node harness (esbuild-bundled `src/settings.ts` + stubbed `obsidian`): **14/14 scenarios passed** — missing field→`[]`, non-array→`[]`, malformed dropped (bad type/key/value/hex/non-object), valid trimmed, sentinel on invalid default, completeness predicate cases | Revert settings.ts model/normalizers + main.ts wiring; old builds ignore new `data.json` keys |
| 2 — evaluator + row color + CSS | `npx tsc --noEmit && npm run lint` → 0 errors, 0 warnings | Node harness (esbuild-bundled `src/note-rules.ts`): **15/15 scenarios passed** — first-match, key/list, value case, non-text, date-shaped string, nested/exact/string/hash-prefix tags, tag case, inline-ignored, incomplete-skipped, no-frontmatter, no-cache, zero-rules. Obsidian-level visual (bar, hover tint) covered by inspection + manual checklist | Revert `src/note-rules.ts`, calendar-view.ts lines, CSS border chains; accent behavior returns |
| 3 — settings UI | `npx tsc --noEmit && npm run lint` → 0 errors, 0 warnings | Requires a live Obsidian vault (not executable headless): manual checklist scenarios incomplete/duplicate/reorder/mobile-wrap produced by inspection; flagged for human confirmation | Remove UI section + `calendar-rule-*` CSS; rules remain valid but UI-less |
| 4 — full verification | `npx tsc --noEmit && npm run lint && npm run production` → all pass; build regenerated `build/main.js` + `build/styles.css` | 14-scenario manual checklist (below); 29 total runtime assertions across harnesses 1+2 | N/A — no source changes |

## Verification Results (Task 4.1)

- `npx tsc --noEmit` → **PASS** (exit 0, 0 errors)
- `npm run lint` → **PASS** (0 errors, 0 warnings)
- `npm run production` → **PASS** (one-shot build exits cleanly; `build/main.js`, `build/styles.css`, `build/manifest.json` regenerated)

## Manual Checklist (Task 4.2) — 14 scenarios

| # | Scenario | Verdict | Basis |
|---|----------|---------|-------|
| 1 | Sentinel (fresh install → theme accent) | ✅ PASS | `defaultNoteAccentColor: ''` is falsy → no container vars → CSS falls back to `var(--interactive-accent)`. Harness: zero-rules→null. |
| 2 | Explicit pick vs theme change | ✅ PASS | Stored hex set as `--calendar-note-accent-default` on the notes list container, overriding the theme fallback. |
| 3 | First match wins | ✅ PASS | Harness scenario 1: two matching rules → first color returned. |
| 4 | Key case-insensitive + list | ✅ PASS | Harness scenario 2: `Projects: [Alpha]` + key `projects` → match. |
| 5 | Value case-sensitive | ✅ PASS | Harness scenario 3: `alpha` ≠ `Alpha` → null. |
| 6 | Non-text scalar | ✅ PASS | Harness scenario 4: `priority: 3` number never matches string rule. |
| 7 | Nested tag | ✅ PASS | Harness scenario 6: `area/proyecto/sub` + key `area`, value `proyecto` → match. |
| 8 | Inline body tags ignored | ✅ PASS | Harness scenario 9: no frontmatter `tags` → null (evaluator reads `frontmatter.tags` only). |
| 9 | Incomplete blocked | ✅ PASS | Empty key/value → desc "Key and value are required"; `isCompleteNoteColorRule` false → central `saveSettings()` filter excludes it; harness incomplete-skipped + completeness cases. |
| 10 | Duplicate warn | ✅ PASS (inspection) | `findEarlierMatchingRule` (frontmatter key case-insensitive/value case-sensitive; tag both case-sensitive) → "Never applies — earlier rule #N matches". |
| 11 | Reorder | ✅ PASS (inspection) | Up/down swap array order in memory, then save + refresh; evaluator iterates array order (proven first-match-wins). |
| 12 | Legacy vault | ✅ PASS | Harness normalizer scenario: missing `noteColorRules` → `[]`, no throw. |
| 13 | Hover | ✅ PASS (inspection) | Matched rows set `--calendar-note-accent-hover` = `color-mix(in srgb, <hex> 75%, var(--interactive-accent-hover))`; CSS `:hover` uses the chain; unmatched rows fall back to `--interactive-accent-hover`. |
| 14 | Mobile wrap | ✅ PASS (inspection) | `.calendar-rule-row .setting-item-control { flex-wrap: wrap; }` + `body.is-mobile` overrides (column layout, full-width inputs). |

Additional spec scenarios also proven: malformed→dropped (harness), date-shaped string matches (harness scenario 5 — text-literal contract, no date heuristics), tag case-sensitive (harness scenario 8), only-the-bar/no-data-written (inspection: evaluator is read-only on `metadataCache`, mirrors `note-date.ts`; only `border-left` CSS rules consume the new vars).

Scenarios 10, 11, 13, 14 are inspection-verified only — recommend a live-vault confirmation during `sdd-verify`.

## Deviations from Design

None — implementation matches design.md and the authoritative semantics (text-literal matching, sentinel default, first-match-wins, border-left only, frontmatter-tags only, case rules, central save filter, read-only contract).

## Issues Found

None.

## Key Learnings (for engram capture)

1. Obsidian's `FrontMatterCache` is an open `{[key: string]: any}` record, so `Object.entries` scanning provides key case-insensitive matching with first-hit semantics.
2. esbuild drops the types-only `obsidian` import from a bundled pure module, allowing real runtime harnesses for Obsidian plugin logic without a vault.
3. The final authored diff measured 408 changed lines, just over the 400-line budget, which triggered the pre-agreed contingency of promoting Phase 3 into a second PR boundary.
