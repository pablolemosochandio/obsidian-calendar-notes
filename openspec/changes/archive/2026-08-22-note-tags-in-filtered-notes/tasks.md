# Tasks: Show Note Tags in Filtered Notes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~70 (range 60–90; 4 files, no tests) |
| 400-line budget risk | Low |
| 800-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR (3 commits: settings → rendering → styles) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (single PR, no chaining required) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | `showTags` setting + normalizer + toggle + `loadSettings` wiring | PR 1 (single PR) | `npx tsc --noEmit && npm run lint` | Manual: Settings → Note list → toggle "Show tags" off/on, view refreshes | Revert `settings.ts` + `main.ts` hunks (additive) |
| 2 | Tag-row rendering + excerpt inline-tag strip in `calendar-view.ts` | PR 1 (single PR) | `npx tsc --noEmit` | Manual: vault note with scalar+array frontmatter tags + inline-only note | Revert `calendar-view.ts` hunks (helper + row block + regex) |
| 3 | `.calendar-note-tag-row` / `.calendar-note-tag` CSS + mobile overrides | PR 1 (single PR) | `npm run production` (styles copy) | Manual: theme without `--tag-*` vars + mobile render | Revert `styles.css` block only |

## Phase 1: Settings & Wiring

- [x] 1.1 Add `showTags: boolean` to `CalendarPluginSettings` in `src/settings.ts` and `showTags: true` to `DEFAULT_SETTINGS`. (Req: showTags toggle — default shows row)
- [x] 1.2 Add `export function normalizeShowTags(value: unknown): boolean { return value !== false; }` in `src/settings.ts` (mirror `showExcerpt`/`showTime`).
- [x] 1.3 Add "Show tags" `addToggle` in `CalendarSettingTab` after the excerpt block, wired to `saveSettings()` + `refreshCalendarView()`. (Scenario: toggle off hides row)
- [x] 1.4 In `src/main.ts`, import `normalizeShowTags` and call it in `loadSettings()` (e.g. `this.settings.showTags = normalizeShowTags(this.settings.showTags)`). (Migration: old `data.json` lacks field)

## Phase 2: Rendering (`calendar-view.ts`)

- [x] 2.1 Add `private getFrontmatterTags(note: TFile): string[]` reading `this.app.metadataCache.getFileCache(note)?.frontmatter?.tags`, normalize scalar→array, `filter` strings. Do NOT use `getAllTags`. (Scenarios: scalar tag, array tags)
- [x] 2.2 In `updateNotesList`, after the excerpt block (line ~584, inside `notes.forEach`), when `showTags` create `.calendar-note-tag-row` div, then per tag `createSpan('calendar-note-tag')` + `setIcon(chip, 'tag')` + `chip.appendText(tag)`. Always create the row (even empty). No click/hover handlers. (Reqs: chips visual-only, empty row)
- [x] 2.3 In `createExcerptText`, insert `.replace(/#[\w/-]+/g, '')` between heading-strip and markdown-char-strip (after line ~606). (Scenarios: inline tag stripped, inline tag not a chip)

## Phase 3: Styles (`styles.css`)

- [x] 3.1 Add `.calendar-note-tag-row` rule: `display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; min-height:14px`. (Req: empty row preserves alignment)
- [x] 3.2 Add `.calendar-note-tag` rule: `inline-flex`, `--tag-background`/`--tag-color`/`--tag-border-color` with `--background-secondary`/`--text-accent` fallbacks; `.svg-icon` sizing. (Scenario: missing theme vars)
- [x] 3.3 Add `body.is-mobile` overrides for the chip (font-size 11px, padding 3px 8px). (Scenario: mobile rendering)

## Phase 4: Verification

- [x] 4.1 `npm run lint` passes with no new warnings (no unused vars / explicit-any).
- [x] 4.2 `npx tsc --noEmit` passes (new field, normalizer, helper signatures).
- [ ] 4.3 `npm run production` succeeds; manual vault spot-check: scalar tag, array tags, inline-only note (empty row + stripped excerpt), no-tags note (empty row), theme fallback, toggle off, mobile.

> Apply note (2026-08-22): `npm run production` completed with exit 0. The manual vault spot-check requires a live Obsidian vault and is deferred to the verify phase / user runtime check.
