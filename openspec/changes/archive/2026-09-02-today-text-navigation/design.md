# Design: Today Text Navigation

## Technical Approach

Reuse the existing `todayButton` element: move its construction into `.calendar-nav-group` between `prevButton` and `nextButton`, swap the `calendar-1` icon for a "Today" text label, and add a `.calendar-today-button` CSS override that relaxes the fixed square `.calendar-nav-button` sizing. No new DOM nodes, listeners, or state; `goToToday()` is untouched.

## Architecture Decisions

| Decision | Options considered | Tradeoff | Choice |
|---|---|---|---|
| Placement | (a) append `todayButton` to `navGroup` between arrows; (b) new `todayContainer`; (c) plain text + new handler | (a) minimal, reuses handler/state; (b)/(c) add DOM/logic with no functional benefit | (a) |
| Label rendering | (a) `createEl('button', { text: 'Today', attr })`; (b) `setText(todayButton, 'Today')` | (a) matches the existing prev/next `{ text: '←' }` pattern; (b) adds a redundant call | (a) |
| CSS scoping | (a) additive `.calendar-today-button` alongside `.calendar-nav-button`; (b) standalone class replacing nav class | (a) inherits hover/active/font/color, overrides only width/min-size; (b) duplicates nav rules | (a) |
| Mobile override | (a) equal-specificity rule placed after mobile nav-button; (b) higher-specificity selector | (a) simple, relies on source order; (b) more robust but noisier | (a), with documented ordering requirement |

## Data Flow / DOM

```
.calendar-header (flex, space-between)
├── .calendar-month-display     (month + year, centered)
└── .calendar-nav-group (flex, gap 4px)
    ├── prevButton   ("←", .calendar-nav-button)
    ├── todayButton  ("Today", .calendar-nav-button.calendar-today-button)  ← moved here
    └── nextButton   ("→", .calendar-nav-button)
```

`todayButton.onclick = () => this.goToToday()` is unchanged. `goToToday()` closes the open header selector, resets `currentDate`/`selectedDate`, clears `selectedWeekStart`, and re-renders header, grid, and notes list — the preserved jump-and-filter contract.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/views/calendar-view.ts` | Modify | Delete the today button block (lines 180–183); rebuild it inside `navGroup` between `prevButton`/`nextButton` (lines 201–209) with `{ text: 'Today', attr: { 'aria-label': 'Go to today' } }`; keep both classes and the `goToToday()` handler |
| `src/styles.css` | Modify | Add `.calendar-today-button` desktop override after the `.calendar-nav-button` rules, and a mobile override after the mobile `.calendar-nav-button` rule |

## Interfaces / Contracts

```ts
const todayButton = navGroup.createEl('button', { text: 'Today', attr: { 'aria-label': 'Go to today' } });
todayButton.addClass('calendar-nav-button', 'calendar-today-button');
todayButton.onclick = () => this.goToToday();
```

CSS — variables-only theming (no `.theme-dark`/`.theme-light`):

```css
.calendar-main-container .calendar-today-button {
	width: auto;
	min-width: 24px;
	min-height: 24px;
	padding: 0 8px;
	font-weight: 500;
}

body.is-mobile .calendar-main-container .calendar-today-button {
	width: auto;
	min-width: 32px;
	min-height: 32px;
	padding: 0 10px;
}
```

The mobile rule MUST appear after `body.is-mobile .calendar-main-container .calendar-nav-button` (equal specificity — source order decides `width`).

## Testing Strategy

No test runner (`test_runner: none`, `tdd: false`). Verification = lint + typecheck + build + manual build install.

| Layer | What to test | Approach |
|---|---|---|
| Static | TypeScript compiles, lint clean | `npx tsc --noEmit`, `npm run lint` |
| Build | Bundle succeeds | `npm run production` |
| Manual (desktop) | "Today" renders between arrows, no overflow, click jumps+filters | Install `build/`, exercise spec scenarios 1–6 |
| Manual (mobile) | ≥32px hit area, no overflow, tap jumps+filters | `body.is-mobile` via device emulation |

Spec scenarios map 1:1 to the manual checks.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No data migration or feature flags. Rollback = revert the commit: restore `todayButton` as the first header child with `setIcon('calendar-1')` and drop the CSS overrides.

## Open Questions

None.
