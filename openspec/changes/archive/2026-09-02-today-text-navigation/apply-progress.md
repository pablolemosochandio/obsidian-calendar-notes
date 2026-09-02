# Apply Progress: Today Text Navigation

**Change**: `today-text-navigation`
**Mode**: Standard (STRICT TDD not active — repo has no test runner)
**Batch**: 1 (resumed) — previous apply run cancelled mid-flight before persisting progress
**Store mode**: both (OpenSpec + Engram)

## Batch 1 Summary

This batch resumed an interrupted apply run. The working tree already contained
uncommitted edits for tasks 1.1, 1.2, 2.1, 2.2. Those edits were re-verified
against `tasks.md` and `design.md` (correct, no changes needed) before running
Phase 3 static verification.

### Tasks already applied (re-verified this batch)

- [x] 1.1 — Deleted today-button block from `header` in `src/views/calendar-view.ts`;
  `setIcon` import retained (still used at line 680: `setIcon(chip, 'tag')`).
- [x] 1.2 — Rebuilt `todayButton` inside `navGroup` between `prevButton`/`nextButton`
  with `{ text: 'Today', attr: { 'aria-label': 'Go to today' } }`, classes
  `calendar-nav-button` + `calendar-today-button`, `onclick = () => this.goToToday()`.
- [x] 2.1 — Added `.calendar-main-container .calendar-today-button` in `src/styles.css`
  after the `.calendar-nav-button` rules (lines 304–310): `width: auto; min-width: 24px;
  min-height: 24px; padding: 0 8px; font-weight: 500`. Variables-only, no theme rules.
- [x] 2.2 — Added `body.is-mobile .calendar-main-container .calendar-today-button`
  after the mobile `.calendar-nav-button` rule (lines 651–656): `width: auto;
  min-width: 32px; min-height: 32px; padding: 0 10px`. Equal specificity — source order
  decides `width`.

### Tasks completed this batch (Phase 3)

- [x] 3.1 — `npx tsc --noEmit` → exit 0 (clean)
- [x] 3.2 — `npm run lint` → exit 0 (no errors/warnings)
- [x] 3.3 — `npm run production` → exit 0; `build/` contains `main.js`, `styles.css`, `manifest.json`

## Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command | `npx tsc --noEmit` → exit 0; `npm run lint` → exit 0; `npm run production` → exit 0 |
| Runtime harness | `N/A` — no runtime boundary (no test runner, no headless runtime); manual vault install is Phase 4 (user) |
| Rollback boundary | `git restore src/views/calendar-view.ts src/styles.css` — restores icon-only header button and drops both CSS overrides |

## Deviations from Design

None — implementation matches `design.md` exactly (line numbers in the working tree
shifted slightly from the design's estimates because the today-button deletion changes
offset; placement and content are as specified).

## Remaining Tasks (Phase 4 — user manual vault checks)

- [ ] 4.1 — Scenario 1: today button is child of `.calendar-nav-group`, after prev, before next
- [ ] 4.2 — Scenario 2 + 5: visible "Today" text, no `calendar-1` icon, `aria-label="Go to today"`
- [ ] 4.3 — Scenario 3: desktop click jumps + filters to today
- [ ] 4.4 — Scenario 4: mobile tap jumps + filters
- [ ] 4.5 — Scenario 6: no overflow; hit area ≥24px desktop, ≥32px mobile
- [ ] 4.6 — Scenario 7: prev/next arrows still navigate; today control between them

## Status

7 / 13 tasks complete (Phases 1–3 done; Phase 4 is the user's manual verification).
