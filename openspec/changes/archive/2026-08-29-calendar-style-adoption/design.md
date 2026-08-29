# Design: Adopt liamcain/obsidian-calendar-plugin Visual Style

## Technical Approach

CSS-first reskin: re-author liamcain v1.5.10 / obsidian-calendar-ui v0.3.12 tokens onto the existing `calendar-*` classes in `src/styles.css` (~90% of diff); minimal TS in `calendar-view.ts` for three states (today, adjacent-month, select-today-on-open). No new settings, no data changes. Maps to specs: calendar-visual-style (CSS), calendar-day-states (TS states), active-note-reflection ANR-8 (open selection).

## Architecture Decisions

| Decision | Chosen | Tradeoff / Rationale |
|---|---|---|
| D1 ANR-8 ctime fallback | Follow via ctime | `resolveNoteDate` always yields a day (property → local midday, else `file.stat.ctime`; note-date.ts:43). Requiring `fromProperty` would desync from note placement (`buildNoteCountMap`) and make follow behave differently from dots. Follow = active `.md` resolves via property-or-ctime; never "skipped". |
| D2 Open precedence | Open resolution wins; exactly once, before first render | Constructor already defaults `selectedDate = today` (calendar-view.ts:61); no view-state persistence exists. Deterministic order: follow note (ON + active `.md`) > today. `onOpen()` resolves first, then `createCalendarView()` renders once — no double-selection flash. Prior user selection never wins (not persisted). |
| D3 Adjacent-month cells | Render real cells with `calendar-day-adjacent-month`; delete `.calendar-empty-day` from TS and CSS | JS `Date` normalizes out-of-range day math (`new Date(y, m, 0)` = prev month end). `selectDate`/`getNotesForDate` already work for any date, so clicks/double-tap just work. |
| D4 Today class | `calendar-day-today` on cell; CSS `:not(.calendar-day-selected)` guard | Cell-scoped class lets CSS color only the number. Guard prevents the 2-class+element selector from beating `.calendar-day-selected` inherited `--text-on-accent`. |
| D5 Dots | CSS circles, not SVG | Spec allows either. 6×6px `border-radius: 50%`, `background: currentColor`; zero DOM change, threshold logic untouched. |
| D6 Dark theme | Variables-only `--calendar-color-*` block on `.calendar-main-container` mapped to Obsidian vars | Existing CSS is already variables-only; `color-mix()` is already in use (accent bars) — safe for `minAppVersion` 1.4.0. No `.theme-dark`/`.theme-light`. |

## Data Flow — ANR-8 open resolution (sequence)

```
onOpen()
  ├─ resolveOpenSelection()                // sync, before first render
  │    follow ON && getActiveFile() is .md?
  │    ├─ yes ─► resolveNoteDate() (property | ctime)
  │    │          set selectedDate/currentDate/yearSelectorCenter/lastFollowedNotePath
  │    └─ no  ─► keep constructor default (today)
  └─ createCalendarView()                  // exactly one render pass
       renderHeader + renderCalendar + updateNotesList
```

Post-open leaf changes reuse the existing `onActiveLeafChange` (unchanged; same-day early-return at calendar-view.ts:134 prevents re-jumps). Layout-restore: `activateView` sets the calendar leaf active → `getActiveFile()` returns null → today selected (deterministic, spec-compliant).

## File Changes

| File | Action | Description |
|---|---|---|
| `src/views/calendar-view.ts` | Modify | (1) `onOpen`: call `resolveOpenSelection()` before `createCalendarView()`; (2) `renderCalendar` inner loop: replace empty-day branch — compute `date` for all cells, add `calendar-day-adjacent-month` when `date.getMonth() !== month` (real day number, keep empty `.calendar-day-dashes` container when `showDashes` for row alignment); (3) after day-number creation: `if (date.getMonth() === month && this.isSameDay(date, new Date())) dayCell.addClass('calendar-day-today')` (~6 lines) |
| `src/styles.css` | Modify | MIT header comment; `--calendar-color-*` token block; day cell (borderless, radius 4px, 0.8em, 0.1s bg/color transition, `--interactive-hover`, no transform), dots (6px circles), borderless muted arrows (24px/32px mobile), month-500/year-accent header, popover radius 4px + shadow `0 4px 12px rgba(0,0,0,.25)` (unset on mobile), week-number 0.65em/4px, weekday labels 0.6em + 1px letter-spacing; delete `.calendar-empty-day` rules and dead `.calendar-notes-header` |
| `NOTICE` | Create | MIT attribution: liamcain v1.5.10 / obsidian-calendar-ui v0.3.12, © 2021 Liam Cain |

## Interfaces / Contracts

```ts
private resolveOpenSelection(): void {
	if (!this.plugin.settings.followActiveNote) return;
	const activeFile = this.app.workspace.getActiveFile();
	if (!activeFile || activeFile.extension !== 'md') return;
	const resolved = resolveNoteDate(activeFile, this.app, this.plugin.settings);
	this.currentDate = new Date(resolved.date.getFullYear(), resolved.date.getMonth(), 1);
	this.selectedDate = new Date(resolved.date.getFullYear(), resolved.date.getMonth(), resolved.date.getDate());
	this.yearSelectorCenter = resolved.date.getFullYear();
	this.lastFollowedNotePath = activeFile.path;
}
```

Class precedence (highest wins): `calendar-day-selected` > `calendar-day-in-selected-week` > `calendar-day-today` > `calendar-day-adjacent-month` (opacity .25 via `:not(.calendar-day-selected)` so a selected adjacent day shows full accent). Today class applies to in-month cells only; today is never adjacent when viewing today's month.

## Untouched selectors (preserved invariants)

`.calendar-note-item` (accent border-left + hover), `.calendar-note-tag`, `.calendar-note-tag-row`, `.calendar-note-excerpt[-lines-1..5]`, `.calendar-note-name`, `.calendar-note-time`, notes-container scrollbars, `.calendar-day-in-selected-week` (color-mix), `.calendar-header-selector-grid/option/nav[-button]/range` internals, settings-tab classes (`.calendar-rule-row`, `.calendar-days-setting`…), `body.is-mobile` overrides for note-item/note-tag/month-display/day-selected/in-selected-week, double-tap (TS, 350 ms).

## Testing Strategy (strict_tdd: false; no runner)

| Layer | What | How |
|---|---|---|
| Static | Type + lint gates | `npx tsc --noEmit`; `npm run lint` |
| Build | Bundle integrity | `npm run production` |
| Manual | Parity checklist | light+dark × desktop+mobile: today accent, dimmed adjacent days, dots at 3 thresholds, hover/selected states, popover radius/shadow, notes list (accent bars, tag chips, excerpts), ≥24/32px arrow targets, double-tap, is-mobile |

No automated unit/E2E tests exist in this repo.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required (no settings/data changes). Rollback: `git revert`; `build/` regenerates from source.

## Open Questions

None blocking.
