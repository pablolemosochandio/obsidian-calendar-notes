# Calendar Today Navigation Specification

## Purpose

Defines the "Today" text control for the calendar header. The control replaces the icon-only today button with a text button placed between the previous/next month arrows in `.calendar-nav-group`, while preserving the existing jump-and-filter behavior and accessibility label.

## Requirements

### Requirement: Today control placement

The today control MUST render as a `<button>` positioned inside `.calendar-nav-group` between `prevButton` and `nextButton`, and MUST retain the `calendar-today-button` class.

#### Scenario: Position between arrows

- GIVEN the calendar header renders
- WHEN the header DOM is inspected
- THEN the today button is a child of `.calendar-nav-group`, ordered after `prevButton` and before `nextButton`

### Requirement: Text label

The today control MUST display the visible text "Today". The icon-only rendering (`setIcon(todayButton, 'calendar-1')`) MUST NOT remain.

#### Scenario: Text renders, icon removed

- GIVEN the calendar header renders
- WHEN the today button is inspected
- THEN its visible content is the text "Today" and no `calendar-1` icon is present

### Requirement: Preserved jump-and-filter behavior

Clicking the today control MUST invoke the existing `goToToday()` behavior unchanged: close any open header selector, reset `currentDate` to today's month, set `selectedDate` to today, and re-render the header, grid, and notes list so the notes filter to today.

#### Scenario: Desktop click jumps and filters

- GIVEN the calendar shows a non-current month with a note selected on another day
- WHEN the user clicks "Today" on desktop
- THEN the view shows today's month, selects today, and filters the notes list to today

#### Scenario: Mobile tap jumps and filters

- GIVEN the calendar on a phone showing a non-current month
- WHEN the user taps "Today"
- THEN the view shows today's month, selects today, and filters the notes list to today

### Requirement: Accessibility label

The today control MUST retain `aria-label="Go to today"`.

#### Scenario: Label preserved

- GIVEN the today button
- WHEN its attributes are inspected
- THEN `aria-label` equals "Go to today"

### Requirement: Sizing and hit area

The `.calendar-today-button` styles MUST size the control to fit the text without overflow: `width: auto` with horizontal padding. The hit area MUST be at least 24px on desktop and 32px on mobile. Styling MUST follow the variables-only theming invariant (no explicit `.theme-dark`/`.theme-light` rules).

#### Scenario: No text overflow, valid targets

- GIVEN the today button renders on desktop and mobile
- WHEN the control is measured
- THEN the "Today" text fits within the button without overflow, with a hit area of at least 24px desktop and 32px mobile

### Requirement: No month-navigation regression

Repositioning the today control MUST NOT change the behavior of the previous/next month arrows.

#### Scenario: Arrows still navigate months

- GIVEN the calendar header
- WHEN the user clicks the previous or next arrow
- THEN the month advances or regresses exactly as before, with the today control still present between the arrows
