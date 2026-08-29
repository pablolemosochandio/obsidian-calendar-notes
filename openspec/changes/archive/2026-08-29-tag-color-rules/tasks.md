# Tasks: Tag Color Rules — Full-Name Value with Wildcards

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120–160 (src/note-rules.ts + src/settings.ts) |
| Session review budget | 800 (session override) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (not set) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Matching + migration + UI | Single PR | `npx tsc --noEmit && npm run lint && npm run production` | Manual 20-scenario walkthrough in a test vault (9 tag + 4 migration + 7 UI) | `git revert` of the one commit; colors fall back to default, no data loss |

## Phase 1: Tag Matching (src/note-rules.ts)

- [x] 1.1 Change `matchesFrontmatterTag` to `(rawTags, value)`; strip leading `#` per raw tag; keep null/non-string filter
- [x] 1.2 Add private `compileTagPattern(value)`: normalize via `normalizeNoteColorRuleKey('tag', value)`, escape metachars except `*`, `*`→`.*`, anchor `^…$`, case-sensitive, no memoization (AD-1)
- [x] 1.3 Per-type guard in `evaluateNoteColor`: trimmed value required for all; key required only for frontmatter; tag path: `matchesFrontmatterTag(frontmatter.tags, value)`
- [x] 1.4 Update JSDoc for new match semantics (anchored, case-sensitive, `*` wildcard, no nesting)

## Phase 2: Normalizer, Migration, Completeness (src/settings.ts)

- [x] 2.1 `isCompleteNoteColorRule` per-type: valid type + non-empty value + hex color; key required only for frontmatter
- [x] 2.2 Idempotent migration in `normalizeNoteColorRules`: tag branch needs value+color only; if normalized key non-empty merge `key + '/' + value`; push `key: ''`; migrated rules pass through
- [x] 2.3 Confirm `loadSettings()` runs the normalizer and saves use `saveSettings()` + `refreshCalendarView()` — no `main.ts` edit

## Phase 3: Settings UI (src/settings.ts)

- [x] 3.1 `renderRuleRow`: hide key input for tag rows; tag value placeholder `tag name (wildcards: *)`
- [x] 3.2 Type-change rebuild: dropdown onChange sets `rule.type`, then `renderRuleRows(rulesContainer)` + `saveSettings()` + `refreshCalendarView()` (AD-4)
- [x] 3.3 `buildRuleFeedback` per-type: `Key and value are required` / `Value is required`
- [x] 3.4 `findEarlierMatchingRule` tag branch: compare `normalizeNoteColorRuleKey('tag', earlier.value)` vs current normalized value; frontmatter branch unchanged

## Phase 4: Verification

- [x] 4.1 `npx tsc --noEmit` passes
- [x] 4.2 `npm run lint` passes
- [x] 4.3 `npm run production` builds cleanly
- [x] 4.4 Manual — 9 tag-match scenarios: exact, no nesting, `sistemas/*`, `*/reunion`, `*` only, untagged, case, `#`-value, inline ignored
- [x] 4.5 Manual — 4 migration scenarios: missing key, invalid hex dropped, legacy `area/proyecto` → value+empty key, migrated rule matches
- [ ] 4.6 Manual — 7 UI scenarios: incomplete frontmatter blocked, empty tag value blocked, key hidden, type change rebuilds, frontmatter duplicate warns, tag duplicate value warns, reorder recolors
- [x] 4.7 Regression: frontmatter rules still match; evaluation stays read-only

> Apply notes (2026-08-29): 4.4/4.5 were executed as a headless runtime harness (esbuild-bundled real `src/note-rules.ts` + `src/settings.ts` against a stub `obsidian` module — 39/39 PASS) instead of a manual vault walkthrough, and remain re-runnable in a real vault. 4.6 is **checklist-pending**: the 7 UI scenarios require a live Obsidian UI and must be walked through in the user's test vault (code paths are implemented; see apply-progress.md).
