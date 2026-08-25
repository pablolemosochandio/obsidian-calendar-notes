# Tasks: Calendar reflects the active note's date

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~50 (45–60 additions, 0 deletions) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

No chaining needed — estimate is far below the review budget (session 800 / default 400).

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | followActiveNote setting + tab + normalizer | single PR | npx tsc --noEmit | N/A (no test runner) | revert src/settings.ts + src/main.ts |
| 2 | view subscription + follow transition | single PR | npx tsc --noEmit | manual Obsidian checklist (desktop + mobile) | revert src/views/calendar-view.ts |

## Phase 1 — Settings foundation (ANR-1)

| ID | Title | Touches | Acceptance (ANR) | Verification |
|----|-------|---------|------------------|--------------|
| [x] 1.1 | Interface + default | src/settings.ts | ANR-1: `followActiveNote: false` default; no auto-jump on load | tsc |
| [x] 1.2 | Normalizer | src/settings.ts | ANR-1: `normalizeFollowActiveNote(value): value === true` (strict opt-in) | tsc |
| [x] 1.3 | loadSettings wiring | src/main.ts | ANR-1: import + call normalizer in `loadSettings()` | tsc |
| [x] 1.4 | Settings-tab toggle | src/settings.ts | ANR-1: toggle under "Calendar display" saves + `refreshCalendarView()` | tsc + manual |

## Phase 2 — View follow core (ANR-2..ANR-5)

| ID | Title | Touches | Acceptance (ANR) | Verification |
|----|-------|---------|------------------|--------------|
| [x] 2.1 | State field | src/views/calendar-view.ts | ANR-4: `lastFollowedNotePath: string \| null = null` | tsc |
| [x] 2.2 | Follow transition | src/views/calendar-view.ts | ANR-2 jump: `currentDate`=month, `selectedDate`=target, `selectedWeekStart`=null, `yearSelectorCenter`=target year, then renderHeader+renderCalendar+updateNotesList; ANR-3 no-op on null/non-md; ANR-4 pause/resume by path; ANR-5 same-date guard (record path, skip render) | tsc + manual |
| [x] 2.3 | Subscription | src/views/calendar-view.ts | ANR-2: `onOpen()` registers `active-leaf-change` → `onActiveLeafChange()` | tsc + manual |

## Phase 3 — Verification (ANR-6..ANR-7)

| ID | Title | Touches | Acceptance (ANR) | Verification |
|----|-------|---------|------------------|--------------|
| [x] 3.1 | Lint | repo | ANR-7: clean | `npm run lint` |
| [x] 3.2 | Typecheck | repo | ANR-7: no errors | `npx tsc --noEmit` |
| [x] 3.3 | Manual checklist | vault build | ANR-2..ANR-7: OFF default; jump+filter; property/ctime fallback; non-note no-op; pause then different-note resume; no click double-render (ANR-6); double-tap daily note stays on day | manual desktop + mobile/iPad |
