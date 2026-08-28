# Design: Note color rules

## Technical Approach

Color each rendered note row's `border-left` accent bar via ordered user rules evaluated against the metadata cache only. Matching lives in a new pure module `src/note-rules.ts` mirroring `note-date.ts`'s read-only pattern. `updateNotesList()` (calendar-view.ts, `noteItem` at line 595) injects per-row CSS custom properties; a CSS fallback chain reproduces today's theme-accent behavior for unmatched notes and the sentinel default. The rules UI is an inline section in `CalendarSettingTab`.

## Architecture Decisions

| Decision | Options | Choice & rationale |
|---|---|---|
| Color injection | A1 CSS custom property per row | A2 inline style breaks `:hover` | A3 can't select arbitrary hex | **A1** — CSS-only hover, free theme fallback |
| Hover tint | JS hover-hex (needs theme-direction logic) | **`color-mix(in srgb, <hex> 75%, var(--interactive-accent-hover))` as var value** | Theme-aware; `color-mix` already used (styles.css:607) |
| Rules UI | **B1 inline Setting rows** | B2 custom Modal (no Modal precedent, cramped mobile) | **B1** — only UI pattern in codebase |
| Evaluator input | `(file, app, rules)` | `(rules, file, metadataCache)` | **`(rules, file, app)`** — rules-first; `app.metadataCache` read pattern symmetric with `note-date.ts` |
| Incomplete-rule persistence | Per-row filtering (leaks via unrelated saves) | **Central filter in `saveSettings()` + load normalizer** | No path persists an incomplete rule |
| Duplicate detection | literal key equality | **matching semantics** | frontmatter key case-insensitive / tag case-sensitive — a duplicate is a condition that can never win |

## Data Flow

```
data.json ──loadSettings──► normalizeNoteColorRules() ──► settings.noteColorRules
                        └─► normalizeDefaultNoteAccentColor() ──► '' = sentinel

updateNotesList() per note:
  evaluateNoteColor(rules, file, app) ──► metadataCache.getFileCache(file)?.frontmatter (READ-ONLY)
    match → noteItem.setProperty('--calendar-note-accent', hex) + hover mix var
    else  → container vars only when explicit default; else theme accent
CSS: border-left: 3px solid var(--calendar-note-accent,
       var(--calendar-note-accent-default, var(--interactive-accent)));
     :hover → var(--calendar-note-accent-hover,
       var(--calendar-note-accent-default-hover, var(--interactive-accent-hover)))
```

## Interfaces / Contracts

```ts
// src/note-rules.ts — pure, read-only; never writes or calls processFrontMatter
evaluateNoteColor(rules: NoteColorRule[], file: TFile, app: App): string | null
// first match wins; returns #RRGGBB or null; skips incomplete rules (empty key/value)
// frontmatter: key case-INSENSITIVE (Object.entries scan, first hit); value matches when
//   typeof string === rule.value, or array contains an equal string; numbers/booleans skipped
// tag: frontmatter tags ONLY (never body #tags); segments = tag.split('/') →
//   segments.length >= 2 && segments[0] === key && segments[1] === value (case-SENSITIVE)
```

Normalizer contract (settings.ts): non-array → `[]`; entries dropped unless type is `frontmatter|tag`, key/value are strings that trim non-empty, color matches `/^#[0-9a-fA-F]{6}$/`. `normalizeDefaultNoteAccentColor`: non-string or invalid hex → `''` (sentinel).

## File Changes

| File | Action | Description |
|---|---|---|
| `src/note-rules.ts` | Create | `evaluateNoteColor` + helpers (~55 lines) |
| `src/settings.ts` | Modify | `NoteColorRuleType`/`NoteColorRule`, `noteColorRules: []` + `defaultNoteAccentColor: ''`, both normalizers, `isCompleteNoteColorRule`; "Note color rules" tab section |
| `src/main.ts` | Modify | `loadSettings()` calls both normalizers; `saveSettings()` filters incomplete rules |
| `src/views/calendar-view.ts` | Modify | import evaluator; ~8 lines in `updateNotesList()` after line 595; set container default vars |
| `src/styles.css` | Modify | border-left + hover fallback chains (lines 446/453); `calendar-rule-*` responsive block |

## Settings UI Structure

- Heading "Note color rules" after the "Note list" section.
- Default color row: `addColorPicker`; sentinel swatch shows live computed accent (`getComputedStyle(this.containerEl.doc.body).getPropertyValue('--interactive-accent')`, popout-safe; non-hex → `#7d7d7d` display-only fallback); onChange stores explicit hex; extra "Reset" button restores sentinel.
- Per rule `Setting`: type dropdown, key text, value text, color picker (prefilled accent), chevron-up/down (disabled at ends), trash.
- `renderRuleRows()` rebuilds a dedicated `rulesContainer` on add/remove/reorder; field edits mutate in place + `saveSettings()` + `refreshCalendarView()` (no rebuild → no focus loss) + targeted desc update: incomplete → "Key and value are required" (never persisted); later duplicate → "Never applies — earlier rule #N matches".
- Incomplete rules stay in `settings.noteColorRules` in memory (survive `display()` rebuilds) but are filtered from `saveData` and dropped on next load. Mobile: rule controls wrap via `calendar-rule-row` CSS.

## Testing Strategy

No test runner (repo convention; `strict_tdd: false`). Verify: `npx tsc --noEmit`, `npm run lint`, `npm run production`; manual checklist mapped 1:1 to spec scenarios (sentinel, explicit pick vs theme change, first-match, case rules, nested tag, inline ignored, incomplete blocked, duplicate warning, reorder, legacy data.json, matched-row hover, mobile wrap).

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration: additive settings; normalizer handles missing/malformed legacy `data.json`. Rollback: revert commit; old builds ignore new keys; CSS falls back when vars unset.

## Open Questions

1. (Spec conflict, flagged) "Dates MUST NOT match" vs text-only contract: `FrontMatterCache` values are `any`; a YAML date delivered as a string equal to a rule value will match. Design adds no date-shape regex (would block legitimate text). Confirm acceptance.
2. (Refinement) "Reset to theme accent" button keeps the sentinel reachable after a first pick — beyond spec letter.
