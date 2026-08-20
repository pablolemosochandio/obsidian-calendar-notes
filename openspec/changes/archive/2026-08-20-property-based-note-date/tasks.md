# Tasks: Property-Based Note Date

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150 (120–180) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR (3 work-unit commits) |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Pure `resolveNoteDate` module | PR 1 | `npx tsc --noEmit` | N/A — pure logic, no UI until wired | Delete `src/note-date.ts` |
| 2 | Settings + UI for Note property | PR 1 | `npm run lint && npx tsc --noEmit` | Test vault: Settings → Notes list, toggle selector, check nested fields | Revert `src/settings.ts`/`src/main.ts` keys |
| 3 | Route 5 ctime sites + docs | PR 1 | `npm run production` | Test vault: `date`-property note in day/week/dash/sort/label | Revert `calendar-view.ts` routing + `AGENTS.md` |

## Phase 1: Foundation

- [x] 1.1 Create `src/note-date.ts`: `ResolvedNoteDate { date: Date; fromProperty: boolean }` + `resolveNoteDate(file: TFile, app: App, settings: CalendarPluginSettings)` per design Interfaces/Contracts.
- [x] 1.2 Implement: active iff `noteSortBy === 'note-property' && noteDateProperty.trim() !== ''`; read `app.metadataCache.getFileCache(file)?.frontmatter?.[prop]`; scalar-string only, trimmed, strict `moment(value, format, true)`; return `new Date(y, m, d, 12, 0, 0)` from `year()/month()/date()` only (never ISO-string parse); else `{ date: new Date(file.stat.ctime), fromProperty: false }`. Read-only — no writes, no `processFrontMatter`, no note mutation.

## Phase 2: Settings

- [x] 2.1 Extend `NoteSortBy` (settings.ts L7) with `'note-property'`; update `normalizeNoteSortBy` (L98-100) to accept it.
- [x] 2.2 Add `noteDateProperty` (default `''` = OFF) + `noteDatePropertyFormat` (default `DD-MM-YYYY`) to `CalendarPluginSettings` + `DEFAULT_SETTINGS`; add both normalizers (empty → default).
- [x] 2.3 Add `Note property` option to "Sort notes by" dropdown (L176-188).
- [x] 2.4 Clone `timeFormatSection` (L217-232): `noteDateSection` with "Note date property" (placeholder `date`, desc "Empty disables the property source.") + "Note date format" (placeholder `DD-MM-YYYY`, live-preview desc); `onChange` → saveSettings + refreshCalendarView.
- [x] 2.5 `setSectionVisibility(noteDateSection, noteSortBy === 'note-property')` in `display()` and dropdown `onChange` (L183-187).
- [x] 2.6 `src/main.ts` `loadSettings()` (L53-64): normalize the 2 new keys (mirror L58-62 pattern).

## Phase 3: Core Wiring (calendar-view.ts)

- [x] 3.1 Label `updateNotesList` L562-566: if `resolveNoteDate(file).fromProperty` → `formatDateTime(date, 'YYYY-MM-DD')`, else current ctime label.
- [x] 3.2 Sort `sortNotes` L630-647: date-sort (`creation-time`/`note-property`) compares `resolveNoteDate(l).date` vs r, then name, then ctime.
- [x] 3.3 Dash map `buildNoteCountMap` L649-659: use `resolveNoteDate(file).date` for year/month/day.
- [x] 3.4 Day match `isNoteCreatedOnDate` L669-672: use `resolveNoteDate(file).date`.
- [x] 3.5 Week match `isNoteCreatedInWeek` L674-677: use `resolveNoteDate(file).date`.
- [x] 3.6 `AGENTS.md`: amend domain rule to note the optional read-only property source (day/month/year only).

## Phase 4: Verification

- [x] 4.1 Static: `npm run lint` clean; `npx tsc --noEmit` clean; `npm run production` builds.
- [x] 4.2 Manual (defaults): selector shows `Creation date/time`; behavior identical to today.
- [x] 4.3 Manual: `date` = `05-03-2026` + `DD-MM-YYYY` → note on 2026-03-05 in day/week/dash/sort/label. *(Validado con `YYYY-MM-DD` en el formato del plugin: el vault almacena ISO 8601 — ver restricción §4.1.1 en DEVELOPMENT.md; colocación correcta en día/semana/dash/orden/etiqueta.)*
- [x] 4.4 Manual: missing / `99-99-9999` / array / object → ctime everywhere.
- [x] 4.5 Manual: `05-03-2026 14:30` + `DD-MM-YYYY HH:mm` → date part only; label shows no time. *(Mismo matiz de formato ISO; comportamiento de solo día/mes/año confirmado.)*
- [x] 4.6 Manual (read-only): refresh emits no write/modify; double-tap daily note has no injected frontmatter.