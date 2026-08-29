# Calendar Visual Style Specification

## Purpose

Reskin the calendar to the liamcain/obsidian-calendar-plugin visual language (v1.5.10 / obsidian-calendar-ui v0.3.12, MIT, © 2021 Liam Cain), re-authored onto the existing `calendar-*` classes in `src/styles.css`, themed exclusively via Obsidian CSS variables, with MIT attribution. Existing features MUST NOT regress.

## Requirements

### Requirement: Re-authored visual language

Styles MUST be re-authored against the existing `calendar-*` class prefix; verbatim Svelte-hashed selectors MUST NOT appear (not portable). Adaptation of the reference design is permitted.

#### Scenario: No hashed selectors

- GIVEN `src/styles.css` after the reskin
- WHEN the file is reviewed
- THEN every selector uses the `calendar-*` prefix and no `.svelte-*` class exists

#### Scenario: DOM stays fully styled

- GIVEN the existing `calendar-view.ts` DOM tree
- WHEN the view renders
- THEN every rendered element still matches a `calendar-*` selector

### Requirement: Compact grid and day-cell styling

Day cells MUST adopt reference density: no cell border, radius 4px, 0.8em type, transitions limited to background-color/color at 0.1s, hover via `--interactive-hover`. The selected day MUST keep accent background with `--text-on-accent`.

#### Scenario: Day hover

- GIVEN a day cell
- WHEN the pointer hovers it
- THEN background becomes `--interactive-hover` within 0.1s, with no transform/lift

#### Scenario: Selected day

- GIVEN a selected day
- WHEN it renders
- THEN accent background and `--text-on-accent` apply

### Requirement: Dot note indicators

`.calendar-day-dash` indicators MUST become rounded 6px dots using currentColor; dash count thresholds (`dashOneThreshold` etc.) MUST stay unchanged; dots on the selected day MUST use `--text-on-accent`.

#### Scenario: Threshold preserved

- GIVEN a day whose thresholds produce 3 indicators
- WHEN it renders reskinned
- THEN 3 dots render (same count as before)

#### Scenario: Selected-day contrast

- GIVEN the selected day with indicators
- WHEN it renders
- THEN dots use `--text-on-accent`

### Requirement: Nav, header, popover, and notes list

Nav arrows MUST be borderless and muted (`--text-muted`) with hit areas ≥24px (32px on mobile). Header typography MUST follow the reference (month weight 500, year in `--interactive-accent`). The month/year popover MUST use radius 4px and shadow `0 4px 12px rgba(0,0,0,.25)`; the shadow is removed on mobile. The notes list MUST restyle consistently while preserving accent bars, tag chips, and excerpt clamps.

#### Scenario: Mobile arrow targets

- GIVEN the plugin on a phone
- WHEN nav arrows render
- THEN each hit area is at least 24px

#### Scenario: Popover restyle

- GIVEN the month/year popover
- WHEN it opens
- THEN radius 4px and reference shadow apply; on mobile no shadow renders

#### Scenario: Notes list preserved

- GIVEN notes with accent bars, tag chips, and excerpts
- WHEN the list renders
- THEN all three features remain visible

### Requirement: Variables-only theming

All colors MUST reference Obsidian CSS variables (directly or via a `--calendar-color-*` token block on `.calendar-main-container`); explicit `.theme-dark`/`.theme-light` rules MUST NOT exist. `color-mix()` and CSS/SVG dots are acceptable for `minAppVersion` 1.4.0.

#### Scenario: Dark theme legibility

- GIVEN a dark theme
- WHEN the calendar renders
- THEN all states are legible and no theme-specific rules exist in `src/styles.css`

### Requirement: MIT attribution

A `NOTICE` file MUST credit the reference (liamcain v1.5.10 / obsidian-calendar-ui v0.3.12, MIT, © 2021 Liam Cain), and `src/styles.css` MUST carry a header comment with the same attribution.

#### Scenario: Attribution present

- GIVEN the repo after this change
- WHEN `NOTICE` and `src/styles.css` are inspected
- THEN both contain the MIT attribution

### Requirement: Preserved invariants

The reskin MUST NOT regress note accent bars, tag chips, selector popovers, `body.is-mobile` overrides, ≥24px touch targets, the 350 ms double-tap, and dash thresholds.

#### Scenario: Features intact

- GIVEN a build from this change
- WHEN the parity checklist runs (light+dark, desktop+mobile)
- THEN accents, tags, popovers, double-tap, and thresholds all pass

### Requirement: Explicit non-goals

The reference hover stat popover and weekend tint are OUT of scope and MUST NOT be introduced.

#### Scenario: No stat popover

- GIVEN a day cell
- WHEN it is hovered for 750 ms
- THEN no stat popover appears
