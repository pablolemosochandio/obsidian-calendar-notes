# Exploration: Calendar reflects active note date

## Current State

The calendar is entirely user-driven. It has no knowledge of, and no reaction to, the note currently open in the editor.

- `CalendarView` keeps three navigation states (`src/views/calendar-view.ts`):
  - `currentDate` (line 39) — the displayed month, initialized to `new Date()` (today) in the constructor (line 58).
  - `selectedDate` (line 40) — the selected day, initialized to today (line 59).
  - `selectedWeekStart` (line 41) — the selected week anchor, initialized `null`.
- These are mutated ONLY by user gestures:
  - `selectDate(date)` (line 347) via day-cell `onclick` (line 230).
  - `selectWeek(...)` (line 354) via week-number `onclick` (line 203).
  - `goToToday()` (line 378) via the "today" button (line 123).
  - `previousMonth()`/`nextMonth()` (lines 365/390) and the month/year selectors (lines 456/501).
- Filtering = date selection. `updateNotesList()` (line 518) renders notes for `selectedDate` (via `getNotesForDate`, line 657) or `selectedWeekStart` (via `getNotesForWeek`, line 670). Matching flows through `resolveNoteDate(file, app, settings)` (`src/note-date.ts` line 25), so ctime and property-based dates are already unified.
- There is NO active-file tracking anywhere. grep confirms zero occurrences of `active-leaf-change`, `file-open`, `getActiveFile`, `activeLeaf`, or `metadataCache.on` in `src/`.
- Existing `onOpen()` subscriptions (lines 75-94): `vault.on('create'|'delete'|'rename')` → `refresh()` (80-82), `vault.on('modify')` debounced 400ms (83-86), and a document `click` handler for the header selector (87-92). No workspace active-leaf subscription.

## Affected Areas

- `obsidian-notes-calendar/src/views/calendar-view.ts` — where the subscription and the "follow active note" state transition must live (owns all nav state + `onOpen`/`onClose` lifecycle).
- `obsidian-notes-calendar/src/main.ts` — only if a plugin-level wiring approach is chosen (registers the view; currently only `onLayoutReady` line 48 + `getLeavesOfType` lines 77/91).
- `obsidian-notes-calendar/src/settings.ts` — add a `followActiveNote` toggle + normalizer, following the existing settings pattern (interface line 28, DEFAULT_SETTINGS line 54, normalizers line 80+, tab UI).
- `obsidian-notes-calendar/src/note-date.ts` — reuse `resolveNoteDate` unchanged; no edits expected.
- `obsidian-notes-calendar/AGENTS.md` — update the "current date / user-driven" domain note if behavior changes (optional).

## Approaches

1. **View-level active-leaf subscription (recommended)**
   In `CalendarView.onOpen()`, register `this.app.workspace.on('active-leaf-change', ...)`; read `this.app.workspace.getActiveFile()`; if it is a `TFile` with `.extension === 'md'`, resolve its date with `resolveNoteDate`, set `currentDate` to that month, `selectedDate` to that date, `selectedWeekStart = null`, then `renderHeader()+renderCalendar()+updateNotesList()`. Guard: no-op when the active file is null (calendar/settings leaf active) or when the resolved date equals the current selection. Add a settings toggle to enable/disable.
   - Pros: all state already lives in the view; `registerEvent` auto-detaches on close; reuses existing `resolveNoteDate`; surgical change confined to the view + one setting.
   - Cons: every active-leaf change re-runs the full render pipeline (see Risks); needs a guard so manual navigation is not immediately overridden.
   - Effort: Low.

2. **Plugin-level wiring in main.ts**
   Subscribe in `onload()` and broadcast the active note into the view(s) (e.g., a `followActiveNote(file)` method called on each calendar leaf, analogous to `refreshCalendarView()` at main.ts line 76).
   - Pros: single subscription regardless of view count; consistent with existing `refreshCalendarView()` pattern.
   - Cons: splits the state transition across two files; the jump logic still lands in the view (it owns `currentDate`/`selectedDate`), so marginal benefit over approach 1; more coupling.
   - Effort: Medium.

3. **Follow with week-mode preservation**
   Like approach 1, but if a week is currently selected, keep week selection and center the week containing the active note instead of switching to day mode.
   - Pros: less disruptive to users who prefer week view.
   - Cons: extra product decisions (day vs week, default mode); more branching; not requested explicitly.
   - Effort: Medium.

## Recommendation

Approach 1 (view-level `active-leaf-change` subscription) with an explicit settings toggle (default value is a product decision for sdd-propose). Reuse `resolveNoteDate` so property-based dates are honored when configured. Add a same-date guard to avoid redundant re-renders and to avoid fighting manual navigation.

## Risks

- **Redundant full re-renders on large vaults**: `refresh()` re-renders header + calendar + notes list, and `getNotesForDate`/`getNotesForWeek`/`buildNoteCountMap` each call `vault.getMarkdownFiles()` (O(N)). Each active-leaf change triggers this; mitigate with a same-date no-op guard (and the existing 400ms `modify` debounce pattern if needed).
- **Feedback loop with note clicks**: clicking a note in the notes list (line 559) opens the file, which fires `active-leaf-change` and re-selects that date — harmless but must not produce double-renders or focus stealing.
- **Fighting manual navigation**: auto-jumping the displayed month can override a user who is browsing other months. A toggle (default decision pending) and the same-date guard mitigate this.
- **Active leaf is not a note**: `getActiveFile()` returns null for settings/calendar/non-md leaves; must be guarded or the view would clear its selection.
- **Mobile/iPad** (`isDesktopOnly: false`): `active-leaf-change` and `getActiveFile()` behave differently in split/mobile layouts; needs manual validation on mobile.
- **Daily-note interplay**: opening a daily note (created at local midday ctime) resolves to its creation date via ctime fallback — works, but double-tap-created notes have no property so they always resolve by ctime.

## Ready for Proposal

Yes — pending two product decisions to be fixed in sdd-propose: (1) the default for the `followActiveNote` toggle (recommend ON to match the user's request, or OFF for backward-compat safety), and (2) day vs. week selection granularity (recommend day).

## Related prior work (distinct concern)

engram #109 / `note-date-source` spec: resolved HOW a note's date is derived (`resolveNoteDate` with ctime fallback, now implemented in `src/note-date.ts`). This exploration is about WHEN to apply that to the calendar's selection (reacting to the active editor note). They compose cleanly: use `resolveNoteDate` as-is for the active note's date.
