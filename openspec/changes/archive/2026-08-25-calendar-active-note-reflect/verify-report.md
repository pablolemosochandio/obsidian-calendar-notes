# Verify Report: Calendar reflects the active note's date

## Executive Summary (ES)

Verificación completada. La implementación de `followActiveNote` satisface las 7
requirements del spec (ANR-1..ANR-7) y respeta exactamente la tabla de decisión
del diseño. `npm run lint` (exit 0), `npx tsc --noEmit` (exit 0) y
`npm run production` (exit 0) pasan sin errores. Hallazgos: **0 CRITICAL**,
**0 WARNING**, **2 SUGGESTION** (no bloqueantes). No quedan issues que impidan
el archivo; recomendación: **archive**.

## Scope

- Change: `calendar-active-note-reflect`
- Files: `src/settings.ts`, `src/main.ts`, `src/views/calendar-view.ts` (58 insertions, 0 deletions)
- Untouched: `src/note-date.ts` (`resolveNoteDate` reused as-is)
- Verification commands: `npm run lint`, `npx tsc --noEmit`, `npm run production`
- Manual validation: engram #161 (user-confirmed in a real Obsidian session)

## Verification Output (fresh run)

| Command | Result | Exit |
|---------|--------|------|
| `npm run lint` | clean, no output | 0 |
| `npx tsc --noEmit` | no type errors | 0 |
| `npm run production` | esbuild bundle built | 0 |

## Requirements Trace

| Req | Status | Evidence |
|-----|--------|----------|
| ANR-1 | PASS | Interface field `followActiveNote: boolean` — `src/settings.ts:31`; default `false` — `src/settings.ts:58`; strict-opt-in normalizer `normalizeFollowActiveNote` (`value === true`) — `src/settings.ts:110-112`; imported — `src/main.ts:8`; called in `loadSettings()` — `src/main.ts:62`; toggle under "Calendar display" heading with `saveSettings()` + `refreshCalendarView()` — `src/settings.ts:346-356`; OFF ⇒ user-driven (early return) — `src/views/calendar-view.ts:113-115` |
| ANR-2 | PASS | `resolveNoteDate(activeFile, ...)` — `calendar-view.ts:126`; day-normalized `target` — `:127-131`; `currentDate` = target month — `:139`; `selectedDate` = target — `:140`; `selectedWeekStart` = null — `:141`; `yearSelectorCenter` — `:142`; re-render via `renderHeader()`+`renderCalendar()`+`updateNotesList()` — `:143-145`. Creation-time / property / property-fallback all handled by unchanged `resolveNoteDate` — `note-date.ts:29-43` |
| ANR-3 | PASS | `if (!activeFile \|\| activeFile.extension !== 'md') return;` — `calendar-view.ts:117-120` (null leaf and non-`.md` attachment both no-op, position preserved) |
| ANR-4 | PASS | State field `lastFollowedNotePath: string \| null = null` — `:54`; same-path pause (`if (activeFile.path === this.lastFollowedNotePath) return;`) — `:122-124`; manual nav paths do NOT touch `lastFollowedNotePath`: `selectDate` `:385-390`, `selectWeek` `:392-401`, `previousMonth` `:403-414`, `nextMonth` `:428-439`, `goToToday` `:416-426`, month/year selectors `:494-500`/`:539-545` |
| ANR-5 | PASS | Same-date guard: `if (this.selectedDate && !this.selectedWeekStart && this.isSameDay(this.selectedDate, target)) { this.lastFollowedNotePath = activeFile.path; return; }` — `:133-136` (records path, skips render) |
| ANR-6 | PASS | List click still opens note — `:596-598` (unchanged); daily-note creation `openOrCreateDailyNoteForDate` — `:837-883` (unchanged). With follow ON, opening a list note / created daily note lands on the already-selected day and is caught by the ANR-5 guard ⇒ no duplicate render |
| ANR-7 | PASS | Lint + tsc + production build all pass (above); no note data is written (only `metadataCache` / `vault` reads; `resolveNoteDate` is documented read-only); uses cross-platform `workspace` API (`active-leaf-change`, `getActiveFile`) with no desktop-only calls; manual validation confirmed by user (#161) |

## Decision Table Conformance

| Decision | Expected | Implemented | Verdict |
|----------|----------|-------------|---------|
| toggle OFF | no-op | `calendar-view.ts:113-115` early return | PASS |
| null / non-`.md` active file | no-op | `:117-120` | PASS |
| same note re-activation | pause (no resume) | `:122-124` path equality | PASS |
| same-date (day mode) | record path, skip render | `:133-136` | PASS |
| different note / different date | jump to DAY, targeted renders | `:138-145` (`renderHeader`+`renderCalendar`+`updateNotesList`, **no** full `refresh()`) | PASS |
| `resolveNoteDate` unchanged | reuse as-is | `git diff` shows zero changes to `src/note-date.ts` | PASS |

## Edge-Case Reasoning

- **Click-note feedback loop**: with follow ON, the notes list is filtered by the
  currently selected date (`getNotesForDate` → `isNoteCreatedOnDate` → same
  `resolveNoteDate`), so every listed note resolves to the already-selected date;
  clicking it opens the note → `active-leaf-change` → ANR-5 guard returns without
  rendering. No double render, no re-entrant loop (`onActiveLeafChange` never calls
  `refresh()`, only the three targeted renderers).
- **Manual navigation pause/resume**: manual nav mutates `currentDate`/`selectedDate`/
  `selectedWeekStart` but never `lastFollowedNotePath`, so the pause is sticky per
  note; a *different* note resets the path and resumes; the *same* note cannot resume
  (per ANR-4).
- **Non-note active leaf** (calendar/settings → `getActiveFile()` null; image
  attachment → `extension !== 'md'`): both return before any state mutation.
- **Property vs creation time**: `resolveNoteDate` returns a local-midday
  day/month/year `Date` for property source and the exact `ctime` otherwise; the
  handler re-normalizes to day precision (`new Date(y, m, d)`) before comparing,
  so both sources behave identically for placement/filtering.

## Findings

- **CRITICAL**: none.
- **WARNING**: none.
- **SUGGESTION**:
  1. Toggling `followActiveNote` ON does not immediately jump to the note already
     open in the editor — follow only reacts to a subsequent `active-leaf-change`.
     This matches the spec wording ("follow becomes active") but an immediate jump
     on toggle would be a nicer UX. Optional, non-blocking.
  2. `lastFollowedNotePath` is intentionally never cleared on manual navigation
     (that is the pause mechanism). If a future feature wants "same note re-follow
     after manual nav", it would need an explicit resume signal; currently that
     behavior is correctly impossible by design (ANR-4).

## Conclusion

`status: success` — implementation matches spec, design decision table, and tasks.
No blocking issues. Ready for archive.
