# Delta for active-note-reflection

## MODIFIED Requirements

### Requirement: ANR-1 `followActiveNote` toggle

The settings MUST expose `followActiveNote` (boolean), default `false` (opt-in), following the normalizer + `loadSettings()` + settings-tab + `saveSettings()` + `refreshCalendarView()` pattern. When `false`, the calendar MUST remain fully user-driven except for the one-time view-open today selection (ANR-8).

(Previously: follow off meant no automatic selection of any kind.)

#### Scenario: Default is OFF

- GIVEN default settings
- WHEN the plugin loads
- THEN `followActiveNote` is `false` and no follow-driven auto-jump occurs

#### Scenario: Toggle ON

- GIVEN `followActiveNote` is `false`
- WHEN the user enables it and settings save
- THEN `refreshCalendarView()` runs and follow becomes active

## ADDED Requirements

### Requirement: ANR-8 View-open selection precedence

On view open, selection MUST be resolved exactly once: if `followActiveNote` is on AND the active file is a Markdown note, the calendar MUST select that note's resolved day (follow wins); otherwise it MUST select today. The system MUST NOT select today and then jump to the note — no double-selection flash, no unexpected note jumps.

#### Scenario: Follow wins on open

- GIVEN follow on and an active note resolved to 2026-03-05
- WHEN the view opens
- THEN the calendar selects 2026-03-05 directly; today is never selected first

#### Scenario: Follow off selects today

- GIVEN follow off
- WHEN the view opens
- THEN today is selected and its notes list shows

#### Scenario: Non-note active file

- GIVEN follow on and the active file is null (settings/calendar leaf) or a non-`.md` attachment
- WHEN the view opens
- THEN today is selected
