# Tasks: Spanish Localization (i18n)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 500–600 (new i18n ~240) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | i18n module + settings (language setting, dropdown, localized labels, meridiem) | PR 1 | `npm run lint` + `npx tsc --noEmit` | Obsidian: settings tab ES/EN switch; time-format preview shows "a. m." | Revert commit: delete `src/i18n/`, drop language field |
| 2 | Route calendar-view/main.ts strings + version bump | PR 2 | `npm run lint` + `npx tsc --noEmit` + `npm run production` | Obsidian: "Hoy" button; ribbon/command ES after reload | Revert commit |

Note: if feature-branch-chain chosen, PR 1 base = tracker branch, PR 2 base = PR 1 branch.

## Phase 1: i18n Foundation

- [x] 1.1 Create `src/i18n/en.ts` — `const en = {...} as const` (today/today_aria/calendar, month & weekday arrays, meridiem_am/pm, quarter & week templates, all settings/view/main labels) + `export type TranslationKey = keyof typeof en`
- [x] 1.2 Create `src/i18n/es.ts` — `es = {...} satisfies Record<TranslationKey, string>`; Spanish full set (Hoy, Ir a hoy, meses, a. m./p. m.)
- [x] 1.3 Create `src/i18n/index.ts` — `Language`, `currentLanguage`, `setLanguage()`, `getLanguage()`, `t(key, params?)`: ES → EN → raw-key fallback, `{param}` interpolation, never throws

## Phase 2: Settings Integration

- [x] 2.1 `src/settings.ts` — add `language: 'en' | 'es'` (default `'es'`) to `CalendarPluginSettings`
- [x] 2.2 `src/settings.ts` — add `normalizeLanguage(value)` (unknown → `'es'`); call in `loadSettings()` (verify: missing → es; `"fr"` → es)
- [x] 2.3 `src/settings.ts` — `setLanguage()` + localized dropdown (English/Español) wired to `saveSettings()` + `refreshCalendarView()`
- [x] 2.4 `src/settings.ts` — route every `setName`/`setDesc`/`addOption` label (incl. date-source selector, color rules) through `t()`; verify no hard-coded English remains
- [x] 2.5 `src/settings.ts` — `formatDateTime()` meridiem via `t('meridiem_am')`/`t('meridiem_pm')` (verify ES → "a. m.")

## Phase 3: Calendar View + Entrypoint

- [x] 3.1 `src/views/calendar-view.ts` — month/weekday arrays, `getQuarterLabel`, `getWeekLabel`, `getMonthName` read via `t()`/dictionary keys
- [x] 3.2 `src/views/calendar-view.ts` — today button: text `t('today')`, `aria-label` `t('today_aria')`; drop icon-only `calendar-1` rendering
- [x] 3.3 `src/views/calendar-view.ts` — empty states (`No notes for {date}`, `No notes found`), excerpt, note-list titles via `t()`; no hard-coded English
- [x] 3.4 `src/main.ts` — call `setLanguage()` after `loadSettings()`; ribbon tooltip + `open-calendar` command via `t()`; document reload caveat in settings description

## Phase 4: Verification & Release

- [x] 4.1 Run `npx tsc --noEmit` (dict-shape check), `npm run lint`, `npm run production`
- [x] 4.2 Manual smoke in Obsidian: fresh install = Spanish; live ES↔EN switch; meridiem; command/ribbon reflect after reload; mobile grid width for accented weekdays
- [x] 4.3 Bump 1.0.2 → 1.0.3 in `manifest.json` + `package.json` (`chore: bump version`)
