# Tasks: Adopt liamcain/obsidian-calendar-plugin Visual Style

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250–350 authored (styles.css ~200–280, calendar-view.ts ~40–60, NOTICE ~6–10) |
| Session review budget | 800 changed lines (override) |
| 400-line budget risk | Medium vs default 400; Low vs 800 override |
| Chained PRs recommended | No |
| Suggested split | Single PR, 2 work-unit commits (TS states → CSS+NOTICE); promote to CSS/TS chained PRs only if diff exceeds budget at PR time |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending — not applicable while in budget; collect from user only if diff exceeds budget |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | TS day states: `resolveOpenSelection`, adjacent-month cells, today class | PR 1 (commit 1) | `npx tsc --noEmit && npm run lint` | Open view: follow off → today selected; follow on + active note → note day selected, no double-selection flash | Revert `src/views/calendar-view.ts` only; CSS untouched, classes merely unstyled |
| 2 | CSS reskin + NOTICE attribution | PR 1 (commit 2) | `npm run production` | Parity checklist light+dark × desktop+mobile (accents, dots, dimmed days, popover, notes list) | Revert `src/styles.css` + `NOTICE`; TS states keep working with prior styles |

## Phase 1: TS Day States (`src/views/calendar-view.ts`)

- [x] 1.1 Add `resolveOpenSelection()` per design contract; call it in `onOpen()` before `createCalendarView()` (ANR-8, D1/D2; day-states "Select today on view open"). Verify: `npx tsc --noEmit`.
- [x] 1.2 In `renderCalendar` inner loop, replace empty-day branch: compute `date` per cell, add `calendar-day-adjacent-month` when month differs; keep empty `.calendar-day-dashes` container when `showDashes` (D3; day-states "Adjacent-month days rendered dimmed"). Verify: `npx tsc --noEmit`.
- [x] 1.3 After day-number creation, add `calendar-day-today` when in-month and `isSameDay(date, new Date())` (D4; day-states "Today highlight state"). Verify: `npx tsc --noEmit && npm run lint`.

## Phase 2: CSS Reskin (`src/styles.css`)

- [x] 2.1 Add MIT header comment + `--calendar-color-*` token block on `.calendar-main-container`; confirm no `.theme-dark`/`.theme-light` rules (visual-style "Variables-only theming", "MIT attribution").
- [x] 2.2 Reskin day cells: no border, radius 4px, 0.8em, 0.1s bg/color transition, hover `--interactive-hover`, no transform; selected keeps accent + `--text-on-accent` (visual-style "Compact grid and day-cell styling").
- [x] 2.3 Style states: `.calendar-day-today:not(.calendar-day-selected)` accent text; `.calendar-day-adjacent-month:not(.calendar-day-selected)` opacity .25 (day-states "Today unselected"/"Today selected"/"Dimmed rendering").
- [x] 2.4 Restyle `.calendar-day-dash` as 6px circles (border-radius 50%, currentColor, `--text-on-accent` when selected) (visual-style "Dot note indicators").
- [x] 2.5 Nav/header/popover/list: borderless muted arrows ≥24px (32px mobile), header month weight 500 + year accent, popover radius 4px + shadow `0 4px 12px rgba(0,0,0,.25)` (unset on mobile), week numbers 0.65em, weekday labels 0.6em + 1px letter-spacing, lighter notes list (visual-style "Nav, header, popover, and notes list").
- [x] 2.6 Delete `.calendar-empty-day` rules and dead `.calendar-notes-header`; keep all design "Untouched selectors" intact (visual-style "Preserved invariants").

## Phase 3: Attribution

- [x] 3.1 Create `NOTICE` crediting liamcain v1.5.10 / obsidian-calendar-ui v0.3.12, MIT, © 2021 Liam Cain (visual-style "MIT attribution").
- [x] 3.2 Confirm styles.css header comment wording matches `NOTICE`.

## Phase 4: Verification

- [x] 4.1 Run gates: `npm run lint`, `npx tsc --noEmit`, `npm run production` (day-states "Verification parity").
- [x] 4.2 Manual parity checklist light+dark × desktop+mobile: today accent, dimmed adjacent days selectable, dots at 3 thresholds, hover/selected, popover radius/shadow (none on mobile), notes list accents/tags/excerpts, ≥24px arrow targets, double-tap, `is-mobile` (day-states "Manual checklist"; visual-style "Features intact"). Verified by user in vault 2026-08-29 — all checks pass.
- [x] 4.3 Non-goals audit: no `.svelte-*` selectors, no stat popover, no weekend tint (visual-style "No hashed selectors", "No stat popover").
