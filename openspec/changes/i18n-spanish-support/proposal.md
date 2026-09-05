# Proposal: Spanish Localization (i18n)

## Intent

English-only plugin: every user-visible string is hard-coded across `src/main.ts`, `src/views/calendar-view.ts`, `src/settings.ts`. This change adds a two-language (EN/ES) UI with a `language` setting defaulting to Spanish — for new installs and for existing installs with no persisted `language` (upgrade switch to Spanish is a confirmed, intended product decision).

## Scope

### In Scope
- `src/i18n/` module: `t(key, params?)` helper + `en.ts`/`es.ts` dictionaries (UI strings, month/weekday names, meridiems)
- `language: 'en' | 'es'` setting (default `'es'`), normalizer, dropdown atop the settings tab
- Replace all hard-coded strings in `src/main.ts`, `src/views/calendar-view.ts`, `src/settings.ts`
- Localize `formatDateTime()` meridiem (`AM/PM` → `a. m.`/`p. m.`)
- Language changes persist and refresh UI via existing `saveSettings()` + `refreshCalendarView()`

### Out of Scope
- Languages beyond English + Spanish
- Runtime-loaded translation files; vault/Obsidian locale auto-detection
- Live re-registration of command/ribbon labels (reload required)
- Translating note content, filenames, or date-format tokens

## Capabilities

### New Capabilities
- `plugin-localization`: language setting (default `'es'`), typed dictionaries, `t()` with `{param}` interpolation, localized date names and meridiems, language-switch refresh, static command/ribbon label caveat

### Modified Capabilities
- `calendar-today-navigation`: "Text label" and "Accessibility label" requirements become locale-dependent ("Today"/"Hoy"; "Go to today"/"Ir a hoy")
- `note-date-source`: date-source selector labels become locale-dependent ("Name"/"Nombre", "Creation date/time"/"Fecha/hora de creación", "Note property"/"Propiedad de la nota")

## Approach

Inline TypeScript locale modules (exploration Approach 1; date-name arrays in the dictionaries — no moment locale dependency). Zero dependencies; fits the esbuild single bundle. `es.ts` is typed against the `en.ts` shape so `tsc` catches missing keys; `t()` falls back to English, then the key.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/i18n/` (index.ts, en.ts, es.ts) | New | `t()` helper + dictionaries |
| `src/settings.ts` | Modified | `language` setting/normalizer/dropdown; translated labels; meridiem localization |
| `src/views/calendar-view.ts` | Modified | month/weekday/Today/empty-states/notices/quarter+week labels via `t()` |
| `src/main.ts` | Modified | command name, ribbon tooltip, view display text via `t()` (load-time only) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing users see Spanish after upgrade | Med | Accepted product decision; one-dropdown switch to English |
| Command/ribbon labels stale after language change | High | Document in setting desc; all rendered UI refreshes live |
| Accented abbreviations (Mié, Sáb) break mobile grid widths | Low | Verify grid on mobile; adjust `styles.css` if needed |
| Missing key renders raw key name | Low | Shared dictionary type + English fallback in `t()` |

## Rollback Plan

Single-commit revert: delete `src/i18n/`, restore hard-coded strings in the three modified files, drop `language` from settings + normalizer. No data cleanup — missing `language` already normalizes to default on load.

## Dependencies

None — no new npm packages.

## Success Criteria

- [ ] Fresh install shows Spanish UI without configuration
- [ ] Switching to English updates settings tab, calendar, and notes list live
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run production` all pass
- [ ] No hard-coded English string remains in user-visible paths
