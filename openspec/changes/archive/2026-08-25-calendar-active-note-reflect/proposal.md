# Proposal: Calendar reflects the active note's date

## Intent

The calendar is 100% user-driven; opening a note in the editor never updates it. Users want the calendar to jump to, and filter by, the date of the note currently open in the editor while they navigate their notes.

## Problem / Current-state gap

- Navigation state (`currentDate`, `selectedDate`, `selectedWeekStart`) at `src/views/calendar-view.ts` L39-41 mutates only via user gestures.
- Filtering = date selection in `updateNotesList()` (L518); matching already flows through `resolveNoteDate` (`src/note-date.ts`).
- No active-file subscription exists anywhere in `src/` (grep-verified: zero `active-leaf-change`/`getActiveFile`).
- Result: navigating notes leaves the calendar stale and un-filtered.

## Scope

### In scope (first slice)

- Subscribe to `this.app.workspace.on('active-leaf-change')` in `CalendarView.onOpen()`.
- Read `getActiveFile()`; resolve date via the existing `resolveNoteDate`.
- Jump the calendar to that day and re-render.
- New `followActiveNote` settings toggle (normalizer + settings-tab, following the existing pattern).

### Out of scope (non-goals)

- New or changed date-source resolution logic. The reflection reuses `resolveNoteDate` unchanged and honors its configured criterion (creation time, or `Note property` with fallback to creation time). No new property/frontmatter parsing is added.
- Week-mode preservation.
- Plugin-level wiring in `main.ts`.

## Capabilities

### New Capabilities

- `active-note-reflection`: calendar follows the active editor note's resolved date and filters notes accordingly.

### Modified Capabilities

- None.

## Approach

Enfoque 1 (view-level `active-leaf-change` subscription). On event: if active file is an `.md` `TFile`, resolve its date via `resolveNoteDate` (honoring the configured date source — creation time, or `Note property` with fallback to creation time), set `currentDate` to that month, `selectedDate` to that date, `selectedWeekStart = null`, then render header + calendar + notes list. Guard: no-op when active file is null or non-Markdown, or when the resolved date equals the current selection.

## Product constraints (fixed)

1. Settings toggle default: **OFF** (opt-in).
2. Granularity: jump to the **DAY** view.
3. Non-note file (settings/attachment) or note without a resolvable date: **do nothing** (keep current position).
4. Manual navigation: **pause** auto-follow until a DIFFERENT note is opened.
5. Date source for reflection: reuse the configured criterion via `resolveNoteDate` — `creation-time` resolves to the note's creation time; `note-property` resolves to the configured frontmatter property, falling back to creation time when the property is missing or invalid. If the active file is not a note (null / non-Markdown), do nothing. No date-source logic is added or changed.

## Impact & edge cases

| Area | Impact | Description |
|------|--------|-------------|
| `src/views/calendar-view.ts` | Modified | subscription + follow transition + same-date guard |
| `src/settings.ts` | Modified | `followActiveNote` toggle + normalizer |
| `src/note-date.ts` | None | reused as-is |

- Active leaf is settings/calendar → `getActiveFile()` null → no-op.
- A Markdown note always resolves (configured property date, or fallback to creation time); the no-op applies only when the active file is not a note (null / non-Markdown).
- Clicking a note in the list fires `active-leaf-change` → same-date guard prevents double-render.

## Tradeoffs

- Auto-jump can override manual browsing → mitigated by opt-in toggle + pause rule.
- Full re-render per leaf change is O(N) over `getMarkdownFiles()` → same-date guard.

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Redundant full re-renders on large vaults | Medium | same-date no-op guard |
| Fighting manual navigation | Medium | opt-in toggle + pause rule |
| Mobile/iPad `active-leaf-change` differences | Low | manual validation |

## Rollback plan

- Toggle defaults OFF; disabling it restores prior behavior immediately.
- Change is additive (new subscription + one setting); reverting the diff restores exact prior behavior.

## Dependencies

- None — reuses `resolveNoteDate` unchanged.

## Success criteria

- [ ] Opening a note jumps the calendar to its resolved date and filters notes.
- [ ] Reflection honors the configured date source: `creation-time` → creation time; `note-property` → property date with fallback to creation time.
- [ ] Toggle OFF preserves user-driven behavior.
- [ ] Non-note / unresolvable file leaves position unchanged.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.
