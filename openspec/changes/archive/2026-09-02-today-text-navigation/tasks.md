# Tasks: Today Text Navigation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~30 (≈14 add, ≈16 del) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Move today button into `.calendar-nav-group` as text control; add CSS sizing | PR 1 | `npx tsc --noEmit && npm run lint && npm run production` | Install `build/` into test vault, reload Obsidian, exercise spec scenarios 1–7 | `git revert` of the single commit — restores icon-only button, drops CSS overrides |

## Phase 1: Header DOM Change

- [x] 1.1 In `src/views/calendar-view.ts`, delete the today-button block (lines 180–183: `header.createEl('button', …)`, `addClass`, `setIcon`, `onclick`); keep the `setIcon` import — still used at line 681
- [x] 1.2 In `src/views/calendar-view.ts`, create `todayButton` inside `navGroup` between `prevButton`/`nextButton`: `navGroup.createEl('button', { text: 'Today', attr: { 'aria-label': 'Go to today' } })`, then `addClass('calendar-nav-button', 'calendar-today-button')` and `onclick = () => this.goToToday()`

## Phase 2: CSS Sizing Overrides

- [x] 2.1 In `src/styles.css`, add `.calendar-main-container .calendar-today-button` after the `.calendar-nav-button` rules (~line 302): `width: auto; min-width: 24px; min-height: 24px; padding: 0 8px; font-weight: 500` — variables-only, no `.theme-dark`/`.theme-light`
- [x] 2.2 In `src/styles.css`, add `body.is-mobile .calendar-main-container .calendar-today-button` AFTER the mobile `.calendar-nav-button` rule (line 638–641): `width: auto; min-width: 32px; min-height: 32px; padding: 0 10px`

## Phase 3: Static Verification

- [x] 3.1 Run `npx tsc --noEmit` — clean typecheck
- [x] 3.2 Run `npm run lint` — no new errors/warnings
- [x] 3.3 Run `npm run production`; confirm `build/` (read-only) contains `main.js`, `styles.css`, `manifest.json`

## Phase 4: Manual Verification (7 spec scenarios)

- [x] 4.1 User: copy `build/` into test vault `.obsidian/plugins/notes-calendar/` (read-only for apply), reload Obsidian; scenario 1 — today button is a child of `.calendar-nav-group`, ordered after `prevButton`, before `nextButton` (DevTools)
- [x] 4.2 Scenario 2 + 5 — button shows visible text "Today", no `calendar-1` icon, `aria-label="Go to today"`
- [x] 4.3 Scenario 3 — desktop click "Today" from a non-current month: view shows today's month, selects today, notes list filters to today
- [x] 4.4 Scenario 4 — mobile emulation (`body.is-mobile`) tap "Today": same jump-and-filter
- [x] 4.5 Scenario 6 — measure: "Today" fits without overflow; hit area ≥24px desktop, ≥32px mobile
- [x] 4.6 Scenario 7 — prev/next arrows still advance/regress months; today control remains between them

> Phase 4 validated 2026-09-02: user confirmed scenarios 2–7 pass in the real vault; scenario 1 verified by source-level DOM-order inspection (navGroup: prevButton → todayButton → nextButton, calendar-view.ts lines 196–208).