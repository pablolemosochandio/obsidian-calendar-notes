# Design: Calendar reflects the active note's date

## Technical Approach

Add an opt-in `followActiveNote` toggle (default **OFF**). When ON, a view-level `active-leaf-change` subscription resolves the active editor note's date via the existing `resolveNoteDate` (reused unchanged) and jumps the calendar to that DAY. A same-note reference (`lastFollowedNotePath`) plus a same-date guard eliminate redundant re-renders and implement the pause-on-manual-navigation rule. No date-source logic is added or changed.

## Architecture Decisions

| Decision | Option | Tradeoff | Choice |
|---|---|---|---|
| Subscription scope | view-level `onOpen()` vs plugin-level `main.ts` | plugin-level needs cross-view coordination; view-level auto-detaches via `registerEvent` | view-level (matches proposal scope; `main.ts` out of scope) |
| Pause mechanism | `lastFollowedNotePath` (`TFile.path`) vs boolean `paused` flag | boolean cannot distinguish "same note re-activated" from "different note opened"; a path can | `lastFollowedNotePath: string \| null` |
| Date resolution | new logic vs reuse `resolveNoteDate` | new logic risks drift from filter/sort/label logic | reuse `resolveNoteDate` unchanged |
| Render on follow | `refresh()` (full) vs targeted renders | `refresh()` also bumps `refreshGeneration` + re-renders header selector (harmless but broader); targeted matches `selectDate` | targeted `renderHeader()` + `renderCalendar()` + `updateNotesList()` |

Rationale: the pause rule (ANR-4) requires knowing *which* note was followed — a path reference uniquely answers "same note vs different note". A boolean cannot, because both cases surface identically as a leaf change with a file present.

## Data / State Additions

`CalendarView` private field:
- `lastFollowedNotePath: string | null = null` — path of the last note auto-followed.

Settings (`CalendarPluginSettings` + `DEFAULT_SETTINGS`):
- `followActiveNote: boolean` (default `false`).
- `normalizeFollowActiveNote(value: unknown): boolean { return value === true; }` — strict opt-in (older `data.json` without the key falls back to `false`).

## Data Flow

```
editor note becomes active
   └─ workspace 'active-leaf-change'
        └─ CalendarView.onActiveLeafChange()
             ├─ toggle OFF / null / non-.md → return (no-op)
             ├─ path === lastFollowedNotePath → return (pause)
             ├─ resolved day === selectedDate (day mode) → record path, return (same-date guard)
             └─ else: currentDate = month, selectedDate = target, selectedWeekStart = null
                     → renderHeader + renderCalendar + updateNotesList
```

`target = new Date(resolved.date.getFullYear(), resolved.date.getMonth(), resolved.date.getDate())`.

## Follow Transition Decision Table

Ordered; first match wins.

| # | Condition | Action |
|---|---|---|
| 1 | `followActiveNote` false | return |
| 2 | `getActiveFile()` null or `extension !== 'md'` | return |
| 3 | `activeFile.path === lastFollowedNotePath` | return (re-activating same note → stay paused) |
| 4 | `selectedDate && !selectedWeekStart && isSameDay(selectedDate, target)` | `lastFollowedNotePath = path`; return (same-date guard) |
| 5 | otherwise (different note) | `lastFollowedNotePath = path`; `currentDate` = month of `target`; `selectedDate = target`; `selectedWeekStart = null`; `yearSelectorCenter = target.getFullYear()`; render header + calendar + list |

Note: row 4 records the path so a later re-activation of that same note is treated as "same note" (paused), not "different note" (resume) — otherwise clicking a list note then navigating away and back would incorrectly re-jump.

## Component Changes

**`src/settings.ts`** — add `followActiveNote: boolean` to the interface and `DEFAULT_SETTINGS` (`false`); add `normalizeFollowActiveNote`; add a toggle `Setting` under the "Calendar display" section: `.onChange(async v => { settings.followActiveNote = v; await saveSettings(); refreshCalendarView(); })`.

**`src/main.ts`** — import and call `normalizeFollowActiveNote` in `loadSettings()`.

**`src/views/calendar-view.ts`** — add `lastFollowedNotePath` field; add `private onActiveLeafChange(): void` implementing the decision table; in `onOpen()` add `this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.onActiveLeafChange()));`.

**`src/note-date.ts`** — unchanged.

## Edge Cases

- Settings/calendar leaf or attachment active → `getActiveFile()` null or non-`.md` → no-op (ANR-3).
- Note-list click opens a note → `active-leaf-change` → same-date guard or same-note pause prevents double render (ANR-5, ANR-6).
- Daily-note creation → `openFile(createdFile)` → resolved day equals selected day → same-date guard; calendar stays on the day (ANR-6).
- Vault `create`/`delete`/`rename`/`modify` → `refresh()` re-renders but never follows (follow is leaf-change-only).
- A followed note whose date changes in place won't re-jump until a different note opens (documented limitation, out of scope).

## Testing / Verification Plan

No test runner; verification = lint + typecheck + manual checklist.

1. `npm run lint` → clean.
2. `npx tsc --noEmit` → clean.
3. Manual (desktop + mobile/iPad): default toggle OFF; toggle ON → open note jumps to its date and filters; property-source note → property date; property-less note → ctime fallback; non-note leaf → position unchanged; manual nav then re-open same note → stays; open different note → resumes; click note in list → no double render; double-tap daily note → stays on day.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration. Toggle defaults OFF; change is additive (one subscription + one setting); reverting the diff restores prior behavior.

## Open Questions

- [ ] Should re-activating the SAME note ever resume (e.g., after its property date changed)? Spec says no (ANR-4); treated as a documented limitation.
