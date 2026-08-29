# Apply Progress: tag-color-rules

**Date**: 2026-08-29
**Mode**: Standard (strict_tdd: false, no test runner in repo)
**Delivery**: Single PR (forecast ~120–160 lines; actual diff: 122 changed lines — 85 insertions, 37 deletions, 2 files)
**Executor**: sdd-apply

## Summary

All 18 tasks implemented across `src/note-rules.ts` and `src/settings.ts` exactly as designed (AD-1..AD-4). Frontmatter matching, first-match-wins, default color, read-only contract, and the `evaluateNoteColor` public signature are unchanged. `main.ts`, `calendar-view.ts`, `styles.css` untouched.

## Task Completion

| Task | Status | Evidence |
|------|--------|----------|
| 1.1 `matchesFrontmatterTag(rawTags, value)` | [x] | src/note-rules.ts:77-100 — signature dropped `key`; per-raw-tag `#` strip preserved; null/non-string filter preserved |
| 1.2 private `compileTagPattern` | [x] | src/note-rules.ts:66-75 — `normalizeNoteColorRuleKey('tag', value)` → escape `/[.+?^${}()|[\]\\]/g` → `*`→`.*` → `new RegExp('^…$')`; no memoization |
| 1.3 per-type guard in `evaluateNoteColor` | [x] | src/note-rules.ts:21-42 — shared `if (!key \|\| !value) continue` replaced; key required only for frontmatter; tag path `matchesFrontmatterTag(frontmatter.tags, value)` (CRITICAL TRAP fixed: empty-key tag rules now evaluate) |
| 1.4 JSDoc updated | [x] | src/note-rules.ts:4-14, 60-65, 77-84 — anchored, case-sensitive, `*` wildcard, no nesting |
| 2.1 `isCompleteNoteColorRule` per-type | [x] | src/settings.ts:214-229 — type+value+hex always; key only for frontmatter; tag skips key |
| 2.2 idempotent migration | [x] | src/settings.ts:185-200 — tag branch: value+color only; `key` non-empty → `value = key + '/' + value`; push `key: ''`; empty-key passthrough (no double-prefix on reload) |
| 2.3 wiring confirmed | [x] | main.ts:73 calls `normalizeNoteColorRules` in `loadSettings()`; settings tab uses `saveSettings()` + `refreshCalendarView()` — no main.ts edit |
| 3.1 hide key input for tag rows | [x] | src/settings.ts:666-685 — `if (rule.type === 'frontmatter')` wraps key `addText`; tag value placeholder `tag name (wildcards: *)` |
| 3.2 type-change rebuild | [x] | src/settings.ts:656-664 — onChange sets `rule.type`, then `renderRuleRows(rulesContainer)` + `saveSettings()` + `refreshCalendarView()` (AD-4) |
| 3.3 per-type feedback | [x] | src/settings.ts:749-751 — `'Key and value are required'` (frontmatter) / `'Value is required'` (tag) |
| 3.4 `findEarlierMatchingRule` tag branch | [x] | src/settings.ts:775-784 — compares `normalizeNoteColorRuleKey('tag', earlier.value)` vs current normalized value (exact equality); frontmatter branch unchanged; overlapping-wildcard limitation documented in code comment |
| 4.1 typecheck | [x] | `npx tsc --noEmit` → exit 0 |
| 4.2 lint | [x] | `npm run lint` → exit 0 |
| 4.3 build | [x] | `npm run production` → exit 0 (esbuild one-shot, clean) |
| 4.4 9 tag-match scenarios | [x] | Executed headlessly against REAL bundled source (see Runtime Harness): 9/9 PASS + 8 extra regex-safety checks PASS |
| 4.5 4 migration scenarios | [x] | Runtime harness: 4/4 PASS + idempotency + `#`-key + missing-value + frontmatter-unchanged PASS |
| 4.6 7 UI scenarios | [ ] | **Checklist-pending** — requires a live Obsidian UI; executor cannot run Obsidian. Walkthrough checklist below for the user's vault test. |
| 4.7 regression | [x] | Runtime harness frontmatter regression block PASS; read-only contract: no write paths added (diff reviewed — only match logic changed) |

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `npx tsc --noEmit` exit 0; `npm run lint` exit 0; `npm run production` exit 0 (repo has no test runner — these are the tasks-artifact focused commands) |
| Runtime harness command/scenario and exact result | `/var/folders/_m/f8m7l2614w5fm0j5d0wwh02m0000gn/T/opencode/sdd-tag-verify/verify.ts` bundled via `npx esbuild --bundle --platform=node --alias:obsidian=./stub-obsidian.ts` and run under node: **39 passed, 0 failed**, exit 0. Harness executes the REAL `src/note-rules.ts` + `src/settings.ts` code (not a re-implementation) against all 9 tag-match, 4 migration, 6 completeness, and 6 regression scenarios |
| Rollback boundary | `git revert` of the single uncommitted working-tree diff on `src/note-rules.ts` + `src/settings.ts` (122 changed lines, 2 files). Old normalizer drops empty-key tag rules → colors fall back to default; no data loss, no corruption. No other files affected |

## Runtime Harness Scenario Map

| Spec scenario | Harness result |
|---|---|
| Exact name (`sistemas` ~ `sistemas`) | PASS |
| No nesting (`sistemas` !~ `sistemas/reunion`) | PASS |
| Nested breadth (`sistemas/*` ~ `sistemas/reunion`) | PASS |
| Greedy wildcard (`*/reunion` ~ `a/b/reunion`) | PASS |
| Wildcard only (`*` ~ `x`) | PASS |
| Untagged (no tags + `*` → default) | PASS |
| Value case (`sistemas` !~ `Sistemas`) | PASS |
| Hash in value (`#sistemas` ~ `sistemas`) | PASS |
| Inline ignored (body tag only → default) | PASS |
| Legacy vault (missing `noteColorRules` → `[]`) | PASS |
| Malformed (invalid hex dropped) | PASS |
| Legacy migration (`area`/`proyecto` → `area/proyecto`, key `''`) | PASS |
| Migrated match (`area/proyecto` ~ frontmatter tag) | PASS |
| Idempotency (re-normalize → no double-prefix) | PASS |
| Frontmatter regression (key case-insensitive, value exact, list values) | PASS |
| First-match-wins | PASS |
| Empty-key tag rule evaluates (CRITICAL TRAP) | PASS |
| Metachar escaping (`a.b`, `a(b)` literal) | PASS |

## Deviations from Design

None. One structural nuance, within design intent: `evaluateNoteColor` keeps the explicit `rule.type === 'tag'` check on the tag branch (design pseudocode fell through for any non-frontmatter type); valid-data behavior is identical and invalid types remain non-matching.

## UI Walkthrough Checklist (4.6 — user vault test, checklist-pending)

Copy `build/` to `<vault>/.obsidian/plugins/notes-calendar/`, reload Obsidian, then in Settings → Note color rules:

1. [ ] Add a Property rule, leave key empty, pick color → rule not persisted (greyed on reopen), feedback `Key and value are required`
2. [ ] Switch a rule to Tag, clear value, pick color → not persisted, feedback `Value is required`
3. [ ] A Tag row shows ONLY type + value + color + reorder/remove (no key input)
4. [ ] Switch a Property row to Tag → row rebuilds without key input, without moving the value
5. [ ] Two identical frontmatter rules (same key+value, different colors) → later row warns `Never applies — earlier rule #N matches`
6. [ ] Two identical tag values, different colors → later row warns never-applies
7. [ ] Reorder: move a later overlapping rule above an earlier one → notes take the moved rule's color
8. [ ] Regression: an existing frontmatter rule still colors its notes

## Files Changed

| File | Action | Lines |
|---|---|---|
| `src/note-rules.ts` | Modified | 48 (matching engine + JSDoc) |
| `src/settings.ts` | Modified | 74 (migration, completeness, UI) |

## Status

17/18 tasks complete (4.6 checklist-pending for live Obsidian UI). Ready for verify — verify may defer 4.6 to the user vault test.

## Risks

Sole unaddressed open item: task 4.6 (7 live-UI scenarios, checklist-pending for the user's vault walkthrough, non-critical). Rollback: `git revert` of the single diff; colors fall back to default, no data loss.

## Skill Resolution

`paths-injected` (3 skills: sdd-apply, karpathy-guidelines, work-unit-commits)
