# Apply Progress: Calendar reflects the active note's date

## Summary

Implementation of the opt-in `followActiveNote` auto-follow feature is complete. All Phase 1 (settings) and Phase 2 (view follow core) tasks are done; automated verification (lint + typecheck + build) passes. The manual Obsidian checklist (task 3.3) remains unrun — no interactive Obsidian session is available in this execution environment.

## Mode

Standard (Strict TDD is NOT active — `strict_tdd: false`, no test runner).

## Completed Tasks

| ID | Title | Status |
|----|-------|--------|
| 1.1 | Interface + default (`followActiveNote: false`) | [x] |
| 1.2 | Normalizer (`normalizeFollowActiveNote`) | [x] |
| 1.3 | loadSettings wiring | [x] |
| 1.4 | Settings-tab toggle under "Calendar display" | [x] |
| 2.1 | State field (`lastFollowedNotePath: string \| null`) | [x] |
| 2.2 | Follow transition (decision table) | [x] |
| 2.3 | Subscription (`active-leaf-change` in `onOpen()`) | [x] |
| 3.1 | Lint | [x] |
| 3.2 | Typecheck | [x] |
| 3.3 | Manual checklist (desktop + mobile/iPad) | [ ] — not run (no interactive vault) |

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/settings.ts` | Modified | Added `followActiveNote: boolean` to `CalendarPluginSettings` + `DEFAULT_SETTINGS` (`false`); added `normalizeFollowActiveNote` (strict `value === true`); added "Follow active note" toggle under the "Calendar display" section (saves + `refreshCalendarView()`). |
| `src/main.ts` | Modified | Imported `normalizeFollowActiveNote` and called it from `loadSettings()`. |
| `src/views/calendar-view.ts` | Modified | Added `lastFollowedNotePath` state field; added `onActiveLeafChange()` implementing the design decision table; registered `active-leaf-change` subscription in `onOpen()` via `registerEvent`. |
| `src/note-date.ts` | Unchanged | Reused `resolveNoteDate` as-is (no new date-source logic). |

## Verification Output

- `npm run lint` → **pass** (exit 0, no output/errors).
- `npx tsc --noEmit` → **pass** (exit 0, no errors).
- `npm run production` → **pass** (exit 0, esbuild bundle built).

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `npx tsc --noEmit` → exit 0 (no errors); `npm run lint` → exit 0 (clean) |
| Runtime harness command/scenario and exact result | N/A — no test runner; runtime behavior is an Obsidian plugin requiring a manual vault session (desktop + mobile/iPad checklist, task 3.3, deferred to human) |
| Rollback boundary | Revert `src/settings.ts`, `src/main.ts`, `src/views/calendar-view.ts` (58 added lines, 0 deleted). `src/note-date.ts` untouched. Toggle defaults OFF so disabling restores prior behavior. |

## Deviations from Design

None — implementation matches the design decision table and component changes exactly.

## Issues Found

None blocking. The manual verification checklist (ANR-2..ANR-7 runtime behavior) could not be exercised in this environment and is explicitly deferred.

## Workload / PR Boundary

- Mode: single PR (chain_strategy: none)
- Estimated changed lines: 58 additions / 0 deletions (within the ~50-line forecast; far below the 400-line budget)
