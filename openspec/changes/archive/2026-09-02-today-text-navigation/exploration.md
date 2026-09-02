## Exploration: today-text-navigation

### Current State
The calendar header is built in `src/views/calendar-view.ts` inside `createCalendarView()`.
Its current DOM order is:

1. `todayButton` — a `<button>` with classes `calendar-nav-button calendar-today-button`, an `aria-label="Go to today"`, and the Obsidian icon `calendar-1`. Clicking it calls `goToToday()`.
2. `monthDisplayContainer` — centered flex group containing the month and year buttons.
3. `navGroup` — a right-aligned flex group containing the previous-month arrow (`←`) and next-month arrow (`→`).

`goToToday()` (lines 447-457) closes any open header selector, resets `currentDate` to the first day of the current month, sets `selectedDate` to today, clears `selectedWeekStart`, recenters the year selector, and re-renders the header, calendar grid, and notes list. This is the behavior that must be preserved.

The today icon is styled by the generic `.calendar-nav-button` rules in `src/styles.css` (24×24 px square, flex centered, 13 px font). On mobile the width/height become 32 px. There is no dedicated setting for the today control.

### Affected Areas
- `src/views/calendar-view.ts` — DOM construction of the header (lines 178-209) and `goToToday()` logic.
- `src/styles.css` — `.calendar-nav-button` and `.calendar-nav-group` rules; a text-based today control needs wider/auto width and appropriate padding.
- `src/settings.ts` — no changes required; no existing setting governs this control.

### Approaches

1. **Move the existing today button between the arrows and replace its icon with text**
   - Move `todayButton` creation so it is appended to `navGroup` between `prevButton` and `nextButton`.
   - Remove `setIcon(todayButton, 'calendar-1')` and set `todayButton.setText('Today')`.
   - Keep `aria-label="Go to today"` and the `calendar-today-button` class.
   - Add CSS for `.calendar-today-button` to override the fixed 24×24 size (e.g., `min-width: auto`, `padding: 0 8px`, `font-weight: 500`).
   - **Pros**: Minimal code change; reuses existing `goToToday()` handler and state logic; no new elements or event listeners.
   - **Cons**: "Today" text is wider than the icon, so the generic `.calendar-nav-button` fixed width must be overridden for this button on both desktop and mobile.
   - **Effort**: Low

2. **Create a separate `today` container between the arrows**
   - Keep `navGroup` for the arrows only; insert a new `todayContainer` between `prevButton` and `nextButton`.
   - The today container could be a button or a span; if a span, keyboard/screen-reader behavior must be explicitly restored.
   - **Pros**: Visual separation from arrow-button styling; easier to apply distinct hover/active styles.
   - **Cons**: More DOM and CSS; need to mirror button semantics manually if not using a `<button>`; no functional benefit over Approach 1.
   - **Effort**: Medium

3. **Render "Today" directly inside `navGroup` as plain text with its own click handler**
   - Similar to Approach 2 but without reusing the existing `todayButton` element.
   - **Pros**: Very explicit.
   - **Cons**: Duplicates the today logic and loses the existing element reference; harder to maintain.
   - **Effort**: Medium

### Recommendation
Use **Approach 1**. It is the smallest change that satisfies the request while preserving all existing behavior. The only extra work is CSS to accommodate the text width.

### Risks
- **Layout breakage**: `.calendar-nav-button` has fixed `width: 24px; height: 24px` (32 px on mobile). A text label will overflow unless `.calendar-today-button` overrides width to `auto`, adds horizontal padding, and adjusts mobile sizing.
- **Accessibility regression**: The current icon has `aria-label="Go to today"`. The text button should keep an explicit `aria-label` (or tooltip) so screen-reader users still understand the action, even though the visible text says "Today".
- **i18n consistency**: "Today" will be a hardcoded English label. This matches the existing codebase (month names, empty-state messages, settings labels are all hardcoded English), but it is worth noting because the rest of Obsidian may be localized.
- **Header flex balance**: The header uses `justify-content: space-between`. Moving the today control into `navGroup` changes the right-hand cluster but leaves the center month display anchored in the middle; no overall layout strategy change is needed.
- **Behavior contract**: Must ensure `goToToday()` continues to close the header selector, update `currentDate`/`selectedDate`/`yearSelectorCenter`, and re-render header, grid, and notes. None of these should change.

### Ready for Proposal
Yes. The scope is narrow and the implementation path is clear.
