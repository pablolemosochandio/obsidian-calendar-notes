# Exploration: note-color-rules

Feature: color the vertical accent bar of filtered notes based on user-defined rules
(frontmatter attribute or tag → color), with a default fallback for unmatched notes.

## Current State

### The vertical bar is theme-driven, not hardcoded blue

The "vertical blue bar" is the left border of every rendered note row:

- `src/styles.css` (`.calendar-note-item`, lines 443-454):
  - `border-left: 3px solid var(--interactive-accent);`
  - Hover rule: `.calendar-note-item:hover { border-left-color: var(--interactive-accent-hover); }`
- The color is **not** a hardcoded hex. It is Obsidian's theme CSS variable
  `--interactive-accent` (the user's theme currently resolves it to blue). Any
  default-color concept must keep the CSS-variable fallback so theme changes
  keep working, or explicitly override it with a user-chosen hex.
- `--interactive-accent-hover` is used on hover. Any per-note color override must
  not silently break this hover affordance (see Approaches A vs B).

### Notes list flow (injection point)

`src/views/calendar-view.ts` — `updateNotesList()` (lines 556-634):

1. `notesContainer` → `notesList = createDiv('calendar-notes-list')`.
2. Per note: `noteItem = notesList.createDiv('calendar-note-item')` (line 595), then
   children `.calendar-note-time`, `.calendar-note-name`, `.calendar-note-excerpt`,
   `.calendar-note-tag-row` / `.calendar-note-tag` chips.
3. This is the only place note rows are built; the per-note color must be applied
   right after `noteItem` creation. `refresh()` re-renders the whole list on every
   vault event (400 ms debounce for `modify`) and settings change, so stale colors
   are not an issue.

### Precedent: frontmatter reading (date source)

`src/note-date.ts` — `resolveNoteDate()` is a pure, read-only module that reads
`app.metadataCache.getFileCache(file)?.frontmatter?.[propertyName]`, strict-parses
scalars with `moment(value, format, true)`, and never writes anything. The new
frontmatter-attribute rule type can reuse exactly this access pattern.

### Precedent: tag reading

- `calendar-view.ts` `getFrontmatterTags(note)` (lines 688-693) reads only
  `frontmatter.tags` (string → array normalization) for the chip display.
- Obsidian API (verified against `node_modules/obsidian/obsidian.d.ts`):
  - `CachedMetadata.tags?: TagCache[]` (`tag: string`, no leading `#`) — body inline tags.
  - `getAllTags(cache: CachedMetadata): string[] | null` — "Combines all tags from
    frontmatter and note content into a single array". Canonical helper for a
    tag-type rule if inline tags should count too.

### Settings precedent

`src/settings.ts` — `CalendarPluginSettings` interface, `DEFAULT_SETTINGS`,
per-field normalizer functions (e.g. `normalizeNoteDateProperty`), and a
`CalendarSettingTab` where every control follows the same pattern:
`onChange → mutate settings → saveSettings() → refreshCalendarView()`.
`main.ts` `loadSettings()` calls each normalizer after `Object.assign({}, DEFAULT_SETTINGS, parsedData)`.

Obsidian API (verified in obsidian.d.ts):
- `Setting.addColorPicker(cb)` exists (line 5637); `ColorComponent` (line 1642)
  renders a filled color swatch button that opens Obsidian's **built-in color
  dialog** (palette + sliders + hex input) when clicked. This is exactly the
  requested UX ("cuadrado relleno … al pulsarlo aparecer un cuadro de diálogo
  con un selector para el color"). No custom modal is required.
- `minAppVersion: 1.4.0`, `isDesktopOnly: false` — settings UI must work on
  mobile/iPad. `color-mix()` is already used in styles.css (safe on target Chromium).

## Affected Areas

- `src/settings.ts` — new types (`NoteColorRuleType`, `NoteColorRule`), new
  `noteColorRules` field + `DEFAULT_SETTINGS.noteColorRules: []`, new
  `normalizeNoteColorRules()` normalizer, and a "Note color rules" section in
  `CalendarSettingTab.display()` (add/remove rows).
- `src/main.ts` — `loadSettings()` must call the new normalizer (migration-safe
  for existing `data.json` files lacking the array).
- `src/views/calendar-view.ts` — `updateNotesList()` applies the matched color to
  each `noteItem` (or delegates to a helper module).
- `src/note-rules.ts` (NEW, recommended) — pure read-only rule evaluator
  `evaluateNoteColor(file, app, rules): string | null`, mirroring the
  `note-date.ts` pattern; keeps matching logic out of the 1000-line view.
- `src/styles.css` — `.calendar-note-item` border color becomes
  `var(--calendar-note-accent, var(--interactive-accent))` (+ hover fallback),
  and optional responsive styles for the rule editor rows.

## Approaches

### A. Color injection (3 compared)

| Approach | Pros | Cons | Complexity |
|----------|------|------|------------|
| **A1. CSS custom property per row** (`noteItem.style.setProperty('--calendar-note-accent', color)` + `border-left-color: var(--calendar-note-accent, var(--interactive-accent))`) | No specificity war; unmatched notes keep theme accent automatically; hover can stay CSS-only via a second fallback var or `color-mix`; future accents (time text, tags) can reuse the var | Needs one extra hover variable decision; tiny CSS change | Low |
| A2. Inline style (`noteItem.style.borderLeftColor = color`) | Simplest JS, zero CSS edits | Inline style beats the `:hover` selector, so the hover tint breaks for matched rows unless JS pointerenter/leave handlers are added (extra state + mobile hover quirks); less theme-friendly | Low-Medium |
| A3. Data-attribute + CSS classes | Semantic DOM | Arbitrary hex colors cannot be selected via static classes; requires runtime stylesheet injection or `attr()` (unsupported for colors in Chromium) | Medium-High (rejected) |

**Recommendation: A1** — CSS custom property. It preserves the existing
default (`var(--interactive-accent)`) for unmatched notes with zero JS fallback
logic, keeps hover working via a hover-scoped fallback, and follows the
codebase's existing theme-variable style (`--tag-*` fallbacks precedent).

### B. Rules UI (2 compared)

| Approach | Pros | Cons | Complexity |
|----------|------|------|------------|
| **B1. Inline list of Setting rows in the existing settings tab** (heading + "Add rule" button; each row: type dropdown, key text, value text, color picker, remove button; rows rebuilt from `settings.noteColorRules` on every change) | Consistent with the only UI pattern in the codebase; all rules visible at a glance; native `ColorComponent` dialog; no new lifecycle/state-sync code; mobile-friendly with simple responsive CSS | Settings tab grows with rule count; must keep DOM and `settings` array in sync when removing rows (rebuild-on-change solves this) | Low |
| B2. Modal-based rule editor (custom `Modal` opened from a settings button) | Tab stays compact; more room per rule | New UI pattern (no `Modal` exists in this codebase today); open/close/save/validate lifecycle; cramped on phones; more code for identical functionality | Medium |

**Recommendation: B1** — inline rows. `display()` already empties and rebuilds
the whole tab; a dedicated `rulesContainer` div + rebuild helper reuses that
exact pattern, and `Setting.addColorPicker` provides the requested swatch +
native color dialog for free.

## Recommendation

1. **Settings model**: `noteColorRules: NoteColorRule[]` where
   `NoteColorRule = { type: 'frontmatter' | 'tag'; key: string; value: string; color: string }`.
   Default `[]`. New `normalizeNoteColorRules(value)` drops malformed entries,
   coerces type, trims key, validates/fallbacks the hex color.
2. **Default color**: unmatched notes keep the current behavior —
   `var(--interactive-accent)` fallback in CSS. No new default-color setting in
   v1 (the request only asks rules to *start* from the current default color).
   Rule color pickers prefill with the computed accent:
   `getComputedStyle(containerEl.doc.body).getPropertyValue('--interactive-accent')`
   (use `containerEl.win/doc` so popout windows work).
3. **Matching** (new `src/note-rules.ts`, read-only, pure):
   - `frontmatter`: read `getFileCache(file)?.frontmatter?.[key]`; match when the
     scalar coerces to string equal to `value` (arrays: match any element).
   - `tag`: read `getAllTags(cache)` (frontmatter + inline) and match tag names;
     recommended semantics: exact match on `key`, plus nested `key/value` when
     `value` is non-empty (supports `#status/done` style rules).
   - First matching rule in array order wins; no match / no rules / invalid rules
     → `null` (CSS fallback = current accent).
4. **Render**: in `updateNotesList()`, `evaluateNoteColor(...)` per note; if a
   color is returned, `noteItem.style.setProperty('--calendar-note-accent', color)`
   (+ optionally a hover variant); CSS uses the var with fallback.
5. **Wiring**: normalizer called from `main.ts loadSettings()`; settings-tab
   changes → `saveSettings()` + `refreshCalendarView()` (existing pattern).

## Risks

- **Hover regression**: `.calendar-note-item:hover` sets `border-left-color` to
  `--interactive-accent-hover`; A2 (inline style) silently kills it. A1 avoids
  this by giving the hover rule its own fallback var (e.g.
  `--calendar-note-accent-hover, var(--interactive-accent-hover)`).
- **CSS specificity/prefix**: all new rules must use the `calendar-*` prefix and
  the var fallback chain; mobile `body.is-mobile` overrides only touch
  `background`/`box-shadow` on `.calendar-note-item`, so the border is safe.
- **Settings migration**: existing `data.json` files have no `noteColorRules`;
  the normalizer MUST handle missing, non-array, and malformed values without
  throwing (pattern: `Object.assign` + defensive normalize, as today).
- **Read-only contract**: matching MUST only read `metadataCache`/`getAllTags`;
  never `processFrontMatter` or any write path (same rule as `note-date.ts`).
- **Theme dependence**: the prefilled swatch hex is a snapshot of the computed
  accent at creation time; if the theme changes later, stored rule colors stay
  as saved (acceptable, and consistent with explicit user choice).
- **Mobile layout**: five controls per rule row (dropdown + 2 texts + color +
  remove) is cramped on phones; needs responsive CSS (e.g. `calendar-rule-*`
  wrap rules) and/or a two-line row layout. Color dialog itself is touch-friendly.
- **XSS/hygiene**: colors are injected via `style.setProperty` and validated as
  hex by the normalizer; UI text via `createEl`/`setText` only (project rule).
- **Performance**: matching runs only for the notes actually rendered in the
  selected day/week list (small N) and is a few metadata-cache reads per note —
  negligible; no impact on the 400 ms debounce or `refreshGeneration` guard.
- **Semantic ambiguity (to resolve in proposal, ask-on-risk)**:
  - Tag rule "key/value": exact-tag-only (hide value field) vs nested `key/value`;
  - Whether the default color should itself become user-configurable;
  - Case sensitivity of frontmatter keys, tag names, and values.

## Ready for Proposal

**Yes.** The proposal can proceed with the A1 + B1 recommendation. The three
semantic ambiguities above should be surfaced to the user during the proposal
phase (delivery strategy: ask-on-risk), each with a concrete default so the
proposal is not blocked on answers.
