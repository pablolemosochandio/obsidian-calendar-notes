# Tasks: Note Color Rules

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~330–420 authored |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR, 4 work-unit commits |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

Contingency: if authored diff exceeds ~400, promote Phase 3 into PR 2.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Settings model, normalizers, wiring | PR 1 | `npx tsc --noEmit` | Legacy `data.json` vault loads `[]` | Revert settings/main wiring; old builds ignore new keys |
| 2 | Evaluator + row color + CSS | PR 1 | `npx tsc --noEmit && npm run lint` | Hand-edited `data.json` rule: bar, hover, inline ignored | Revert evaluator + view lines + CSS; accent returns |
| 3 | Rules settings UI | PR 1 | `npx tsc --noEmit && npm run lint` | Manual UI checklist desktop + mobile wrap | Remove UI section + CSS; rules valid but UI-less |
| 4 | Full verification | PR 1 | `npx tsc --noEmit && npm run lint && npm run production` | 12-scenario manual checklist | N/A — no source changes |

## Phase 1: Foundation — model & migration

- [x] 1.1 `src/settings.ts`: add `NoteColorRuleType`/`NoteColorRule`; add `noteColorRules: []` + `defaultNoteAccentColor: ''` to interface/defaults (~25)
- [x] 1.2 `src/settings.ts`: add `normalizeNoteColorRules()` — non-array→`[]`; drop entries unless valid type, trimmed non-empty key/value, hex `/^#[0-9a-fA-F]{6}$/` (~40)
- [x] 1.3 `src/settings.ts`: add `normalizeDefaultNoteAccentColor()` (invalid→`''` sentinel) + `isCompleteNoteColorRule()` (~15)
- [x] 1.4 `src/main.ts`: call both normalizers in `loadSettings()`; filter incomplete rules in `saveSettings()` (~12)

## Phase 2: Core — matching & rendering

- [x] 2.1 Create `src/note-rules.ts`: `evaluateNoteColor(rules, file, app): string|null` — pure read-only; first match wins; key case-insensitive, value exact case-sensitive, strings/lists only; frontmatter tags only, first subtag === value (~60)
- [x] 2.2 `src/views/calendar-view.ts`: after `noteItem` (line 595) set `--calendar-note-accent` + `-hover` vars when matched; container vars only for explicit default (~15)
- [x] 2.3 `src/styles.css`: fallback chains — `border-left` (446) + `:hover` (453) end at `--interactive-accent(-hover)` (~20)

## Phase 3: Settings UI

- [x] 3.1 `src/settings.ts` tab: section after "Note list"; default-color row — `addColorPicker` from computed accent (popout-safe), `''` sentinel, Reset (~35)
- [x] 3.2 `src/settings.ts`: `renderRuleRows()` into `rulesContainer` — type dropdown, key/value, picker, up/down, trash; rebuild on add/remove/reorder (~110)
- [x] 3.3 `src/settings.ts`: in-place edits → save + refresh; desc feedback: incomplete + "Never applies — earlier rule #N" (~30)
- [x] 3.4 `src/styles.css`: `calendar-rule-*` responsive wrap for mobile rows (~25)

## Phase 4: Verification

- [x] 4.1 `npx tsc --noEmit`, `npm run lint`, `npm run production` all pass
- [x] 4.2 Manual checklist (spec scenarios): sentinel, explicit pick vs theme, first-match, key/list, value case, non-text, nested tag, inline ignored, incomplete blocked, duplicate warn, reorder, legacy vault, hover, mobile wrap

(End of file - total 53 lines)
