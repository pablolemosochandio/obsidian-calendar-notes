# Proposal: Note color rules

## Intent

Color the vertical accent bar (`border-left`) of each note row via ordered, user-defined rules matching frontmatter or tags. Unmatched notes use a configurable default color initialized to the theme accent; today's behavior is the default.

## Scope

### In Scope

- `noteColorRules: { type: 'frontmatter' | 'tag'; key: string; value: string; color: string }[]`, default `[]`; ordered; first match wins.
- Matching (confirmed premises): frontmatter key case-insensitive, value case-sensitive, text-only (string or list; any element). Tag rules match only frontmatter `tags`: `#key/value` and deeper tags whose first subtag equals `value`; exact, case-sensitive.
- Configurable default color: swatch + native picker (`Setting.addColorPicker`), initialized to theme accent.
- Per-row color via CSS custom property; hover tint preserved.
- Settings UI: inline rule rows (type, key, value, color, remove), add/reorder (up/down), block incomplete, warn duplicates.
- Migration via normalizer + `loadSettings()` wiring.

### Out of Scope

- Inline body `#tags`; writing note metadata; any UI beyond the row `border-left`; drag-and-drop; modal editor.

## Capabilities

### New

- `note-color-rules`: rule model, matching, default color, rendering, settings UI.

### Modified

- None.

## Approach

Adopt exploration A1 + B1.

- **A1**: new pure `src/note-rules.ts` `evaluateNoteColor(file, app, rules): string | null`, mirroring `note-date.ts`'s read-only pattern. `updateNotesList()` sets `--calendar-note-accent` per `noteItem`. CSS: `var(--calendar-note-accent, var(--calendar-note-accent-default, var(--interactive-accent)))` plus hover fallback var.
- **B1**: "Note color rules" section in `CalendarSettingTab` using the rebuild pattern; `addColorPicker` gives swatch + native dialog; `normalizeNoteColorRules()` drops malformed entries, trims, validates hex.
- **Default color**: sentinel "follow theme accent" until user picks a hex; swatch prefilled from computed accent.

## Product / UX

Rules listed in one place, each previewing its swatch; picking opens Obsidian's built-in dialog. Unmatched notes show the default color.

## Affected Areas

- `src/note-rules.ts` (New) — pure rule evaluator
- `src/settings.ts` (Modified) — types, field, normalizer, rules section + default color
- `src/main.ts` (Modified) — `loadSettings()` calls normalizer
- `src/views/calendar-view.ts` (Modified) — per-row CSS var
- `src/styles.css` (Modified) — var fallback chain + responsive rows

## Size & Risk

~250–350 authored lines across 5 files. Risk **Low–Medium**; within the 800-line review budget.

- Hover tint regression — Low — A1 hover fallback var
- Malformed/missing settings — Med — defensive normalizer
- Mobile row cramped — Med — responsive `calendar-rule-*` CSS
- Theme change vs stored hex — Low — sentinel default; explicit choice wins
- Read/write contract — Low — evaluator reads only; never `processFrontMatter`

## Rollback Plan

Revert commit; settings are additive — older builds ignore `data.json` additions; CSS falls back to `--interactive-accent` when vars unset.

## Dependencies

None.

## Open Questions

1. Default color vs theme change: sentinel ("follow accent until user picks") assumed; confirm in design.

## Success Criteria

- [ ] Matched rows show rule color; unmatched rows show default color.
- [ ] Existing vaults migrate without errors; behavior unchanged with zero rules.
- [ ] Reorder, validation, duplicate warning work on desktop + mobile.
- [ ] Lint + typecheck + manual build pass.