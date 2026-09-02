# Proposal: Today Text Navigation

## Intent

Replace the today icon button with a "Today" text button placed between the previous/next month navigation arrows. Clicking it must still jump to today and filter the notes list to today — existing `goToToday()` behavior, untouched.

## Scope

### In Scope
- Move `todayButton` into `.calendar-nav-group` between `prevButton` and `nextButton` (`src/views/calendar-view.ts`, header DOM lines 178-209).
- Replace `setIcon(todayButton, 'calendar-1')` with the text label "Today".
- Retain the `goToToday()` handler, `aria-label="Go to today"`, and the `calendar-today-button` class.
- Add `.calendar-today-button` CSS: auto width, horizontal padding, mobile sizing; keep the ≥24px (32px mobile) hit area.

### Out of Scope
- Any change to `goToToday()` internals (selector close, `currentDate`/`selectedDate` resets, re-render).
- Month/year popovers, daily-note creation, touch/double-tap handling, settings.
- Localizing "Today" (codebase labels are hardcoded English; i18n deferred).

## Capabilities

### New Capabilities
- `calendar-today-navigation`: today control as a text button between the month arrows — placement, label, preserved jump/filter behavior, accessibility, sizing.

### Modified Capabilities
- None. `calendar-visual-style` arrow and header requirements are unaffected; the new spec must respect its touch-target and variables-only theming invariants.

## Approach

Exploration Approach 1 (recommended): reuse the existing `todayButton` — append it to `navGroup` between the arrows, swap the icon for `setText('Today')`, and add `.calendar-today-button` CSS overriding the fixed 24×24 (32×32 mobile) `.calendar-nav-button` sizing. No new DOM nodes, listeners, or state.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/views/calendar-view.ts` (header DOM, lines 178-209) | Modified | Button position and label; icon removed |
| `src/styles.css` | Modified | `.calendar-today-button` width/padding overrides, desktop and mobile |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Text overflows the fixed 24×24 (32×32 mobile) nav-button box | High | Override width to auto with padding, including `body.is-mobile` |
| Accessibility regression on icon removal | Low | Keep `aria-label="Go to today"` |
| Hardcoded English "Today" in localized Obsidian | Low | Matches existing hardcoded labels; i18n out of scope |
| Header flex balance shifts | Low | Center month display stays anchored; verify desktop and mobile |

## Rollback Plan

Revert the single commit: restore `todayButton` as the first header child with `setIcon('calendar-1')` and drop the `.calendar-today-button` CSS overrides. `goToToday()` is untouched — no state or data risk.

## Dependencies

None.

## Success Criteria

- [ ] "Today" renders between the arrows, correctly sized on desktop and mobile, light and dark themes.
- [ ] Clicking "Today" jumps to today's month, selects today, and filters notes to today — identical to current `goToToday()`.
- [ ] `aria-label` retained; month navigation, daily-note creation, double-tap, and refresh unchanged.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run production` pass.
