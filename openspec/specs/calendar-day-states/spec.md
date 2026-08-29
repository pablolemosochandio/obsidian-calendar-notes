# Calendar Day States Specification

## Purpose

New day-cell states: a today highlight, adjacent-month days rendered in-grid with dimmed styling, and automatic today selection when the view opens. Selection precedence with `followActiveNote` is defined by active-note-reflection ANR-8 (follow ON wins).

## Requirements

### Requirement: Today highlight state

`renderCalendar` MUST add a `calendar-day-today` class to the cell whose date is today. That class MUST render today's day number in the accent color when today is not selected; when today is also the selected day, selected styling MUST take visual precedence.

#### Scenario: Today unselected

- GIVEN today is not the selected day
- WHEN the calendar renders
- THEN today's number shows in `--interactive-accent` text

#### Scenario: Today selected

- GIVEN today is the selected day
- WHEN the calendar renders
- THEN accent background with `--text-on-accent` wins over the today accent text

### Requirement: Adjacent-month days rendered dimmed

Days outside the displayed month MUST render in-grid with their day numbers, dimmed (reference opacity 0.25), instead of empty cells. They MUST remain selectable day cells.

#### Scenario: Dimmed rendering

- GIVEN trailing days of the previous/next month in the grid
- WHEN the grid renders
- THEN their numbers show at reduced opacity

#### Scenario: Still selectable

- GIVEN an adjacent-month day rendered dimmed
- WHEN the user clicks it
- THEN it selects and shows that day's notes list

### Requirement: Select today on view open

On view open, the system MUST automatically select today and show its notes list, unless active-note-reflection ANR-8 overrides selection with the active note.

#### Scenario: Fresh open

- GIVEN a view opened on the current month
- WHEN it renders
- THEN today is selected and its notes list shows

#### Scenario: Reopen with follow off

- GIVEN `followActiveNote` is off and no active Markdown note resolves elsewhere
- WHEN the view opens
- THEN today is selected and its notes list shows

### Requirement: Verification parity

`npm run lint`, `npx tsc --noEmit`, and `npm run production` MUST pass. The states MUST be verifiable via a manual parity checklist (light+dark themes, desktop+mobile).

#### Scenario: Build gates

- GIVEN a build from this change
- WHEN lint, typecheck, and production build run
- THEN all pass with no errors

#### Scenario: Manual checklist

- GIVEN light and dark themes on desktop and mobile
- WHEN the checklist runs
- THEN today highlight, dimmed adjacent days, and open-selection all pass
