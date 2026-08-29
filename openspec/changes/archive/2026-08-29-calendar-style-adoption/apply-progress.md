# Apply Progress: Adopt liamcain/obsidian-calendar-plugin Visual Style

- **Batch**: 1 of 1 (first batch; no prior apply-progress existed)
- **Mode**: Standard (`strict_tdd: false`; repo has no test runner — no test files invented)
- **Delivery**: `ask-on-risk`; forecast non-high; single PR planned with 2 work-unit commits (TS states → CSS + NOTICE). Changes left uncommitted per orchestrator directive.
- **Tasks complete**: 13 of 14 (task 4.2 manual parity checklist left for sdd-verify — requires Obsidian runtime).

## Work Unit Evidence

### Work Unit 1 — TS day states (`src/views/calendar-view.ts`)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `npx tsc --noEmit && npm run lint` → exit 0, no diagnostics (`WORK_UNIT_1_GATES_PASS`) |
| Runtime harness command/scenario and exact result | N/A — no Obsidian runtime is available in the apply environment; manual parity (open view: follow off → today selected; follow on + active note → note day selected, no double-selection flash) is task 4.2, delegated to sdd-verify |
| Rollback boundary | Revert `src/views/calendar-view.ts` only (38+/8−); CSS untouched in this unit, new classes merely unstyled until Work Unit 2 |

### Work Unit 2 — CSS reskin + NOTICE (`src/styles.css`, `NOTICE`)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `npm run production` → exit 0; `build/styles.css` contains token block + MIT header, `build/main.js` contains `calendar-day-today`/`calendar-day-adjacent-month` (2 matches) |
| Runtime harness command/scenario and exact result | N/A — no Obsidian runtime in the apply environment; parity checklist light+dark × desktop+mobile is task 4.2, delegated to sdd-verify |
| Rollback boundary | Revert `src/styles.css` (74+/53−) + `NOTICE` (new); TS day states keep working with prior styles |

## Task Completion

| Task | Status | Evidence |
|---|---|---|
| 1.1 `resolveOpenSelection()` in `onOpen()` before `createCalendarView()` | [x] | `npx tsc --noEmit` pass; design contract implemented verbatim (follow ON + `.md` → property-or-ctime via `resolveNoteDate`; else today from constructor default) |
| 1.2 Adjacent-month real cells | [x] | `npx tsc --noEmit` pass; `new Date(y, m, day)` normalization renders real cells with `calendar-day-adjacent-month`; empty `.calendar-day-dashes` kept when `showDashes` |
| 1.3 `calendar-day-today` | [x] | `npx tsc --noEmit && npm run lint` pass; in-month guard `date.getMonth() === month && isSameDay(date, new Date())` |
| 2.1 MIT header + token block | [x] | Header comment + 7 `--calendar-color-*` tokens on `.calendar-main-container`; zero `.theme-dark`/`.theme-light` rules (grep-verified) |
| 2.2 Day-cell reskin | [x] | borderless, radius 4px, 0.8em, `transition: background-color/color 0.1s`, hover `--interactive-hover` via token, no transform; selected accent + on-accent text |
| 2.3 Today/adjacent states | [x] | `.calendar-day-today:not(.calendar-day-selected) .calendar-day-number` accent text; `.calendar-day-adjacent-month:not(.calendar-day-selected)` opacity .25 |
| 2.4 Dot indicators | [x] | 6×6px, `border-radius: 50%`, `background-color: currentColor`; selected override `--calendar-color-dot-selected` (= `--text-on-accent`); threshold logic untouched (TS) |
| 2.5 Nav/header/popover/list | [x] | borderless arrows `--calendar-color-arrow` (muted), 24px → 32px `body.is-mobile`, hover interactive; month weight 500 + `:last-child` year accent; popover radius 4px + `0 4px 12px rgba(0,0,0,.25)` with `box-shadow: none` on mobile; week numbers/labels 0.65em; weekday labels 0.6em + 1px letter-spacing; notes container border-top removed, padding 8px, list gap 2px (lighter) |
| 2.6 Delete dead rules | [x] | `.calendar-empty-day` and `.calendar-notes-header` gone from TS+CSS; untouched selectors preserved verbatim (diff-reviewed) |
| 3.1 NOTICE | [x] | `NOTICE` created: liamcain v1.5.10 / obsidian-calendar-ui v0.3.12, © 2021 Liam Cain, MIT, full license text |
| 3.2 Header wording match | [x] | styles.css header names both projects, versions, © 2021 Liam Cain, MIT — matches NOTICE |
| 4.1 Gates | [x] | `npm run lint` pass; `npx tsc --noEmit` pass; `npm run production` pass (all exit 0) |
| 4.2 Manual parity checklist | [ ] | **Left open** — requires Obsidian runtime (light+dark × desktop+mobile); delegate to sdd-verify |
| 4.3 Non-goals audit | [x] | grep: no `.svelte-*`, no `.theme-dark`/`.theme-light` rules, no weekend tint, no stat popover code |

## Files Changed

| File | Action | Lines | What Was Done |
|---|---|---|---|
| `src/views/calendar-view.ts` | Modified | +38 −8 (46) | `resolveOpenSelection()` + `onOpen()` call; adjacent-month real cells; `calendar-day-today`; `daysInMonth` still used for `totalWeeks` |
| `src/styles.css` | Modified | +74 −53 (127) | MIT header, token block, day-cell/dot/state/nav/popover/typography reskin, notes list lighter, dead rules removed |
| `NOTICE` | Created | +37 | MIT attribution (full license text) |

## Verification Results

- `npm run lint` → exit 0 (only pre-existing warnings-as-warnings rules; no new diagnostics).
- `npx tsc --noEmit` → exit 0, no errors.
- `npm run production` → exit 0; `build/main.js`, `build/styles.css`, `build/manifest.json` regenerated with the new styles and classes.

## Review Workload Forecast — Actual vs Estimated

| Item | Estimated | Actual |
|---|---|---|
| styles.css | ~200–280 | 127 |
| calendar-view.ts | ~40–60 | 46 |
| NOTICE | ~6–10 | 37 (includes full MIT license text) |
| **Total authored** | **250–350** | **210** (187 additions + 61 deletions, incl. 37 new NOTICE lines) |

Actual is below the forecast band and well under the 400-line budget (and the 800-line session override): no chained PRs needed. Planned commit split remains valid: (1) TS day states, (2) CSS reskin + NOTICE.

## Deviations from Design

- NOTICE is 37 lines vs the ~6–10 estimate because it carries the full MIT license text (liamcain-style NOTICE files include it). Total stays under budget.
- Responsive `@media (max-width: 600px)` day-cell override dropped its `font-size: 12px` (the new base 0.8em ≈ 12.8px already covers it); `min-height: 30px` retained.
- Notes container top divider removed and list gap reduced 6px→2px as the "lighter/reference-style notes list" interpretation; all note-item internals (accent bars, tags, excerpts) untouched.

## Issues Found

None blocking. Residual: task 4.2 manual parity checklist cannot be executed without an Obsidian runtime — flagged for sdd-verify.
