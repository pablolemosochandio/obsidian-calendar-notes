# Active Note Reflection Specification

## Purpose

Opt-in auto-follow: when enabled, the calendar jumps to the DAY view of the active Markdown note's resolved date and filters notes accordingly, reusing `resolveNoteDate` unchanged. OFF by default; manual navigation pauses follow.

## Requirements

### Requirement ANR-1: `followActiveNote` toggle

The settings MUST expose `followActiveNote` (boolean), default `false` (opt-in), following the normalizer + `loadSettings()` + settings-tab + `saveSettings()` + `refreshCalendarView()` pattern. When `false`, the calendar MUST remain fully user-driven.

#### Scenario: Default is OFF

- GIVEN default settings
- WHEN the plugin loads
- THEN `followActiveNote` is `false` and no auto-jump occurs

#### Scenario: Toggle ON

- GIVEN `followActiveNote` is `false`
- WHEN the user enables it and settings save
- THEN `refreshCalendarView()` runs and follow becomes active

### Requirement ANR-2: Follow a newly opened note

When `followActiveNote` is on and the active editor file changes to a Markdown note, the system MUST resolve its date via `resolveNoteDate`, jump to that DAY view (`selectedWeekStart` = null, `currentDate` = that month), and re-render so the list filters to it.

#### Scenario: Creation-time source

- GIVEN follow on, `noteSortBy` = `creation-time`
- WHEN a note whose ctime is 2026-03-05 becomes active
- THEN the calendar jumps to 2026-03-05 and lists that note

#### Scenario: Property source

- GIVEN `noteSortBy` = `note-property`, property `date` = `05-03-2026`
- WHEN that note becomes active
- THEN the calendar jumps to 2026-03-05

#### Scenario: Property fallback

- GIVEN `noteSortBy` = `note-property` and the active note lacks the property
- WHEN it becomes active
- THEN it jumps to the note's ctime day

### Requirement ANR-3: No-op on non-note active file

When the active file is not a Markdown note (null — settings/calendar leaf — or a non-`.md` attachment), the system MUST do nothing, preserving the current position.

#### Scenario: Settings/calendar leaf

- GIVEN follow on
- WHEN the active leaf is the calendar or settings (active file null)
- THEN no navigation or re-render occurs

#### Scenario: Attachment

- GIVEN follow on
- WHEN an image attachment becomes active
- THEN the position is unchanged

### Requirement ANR-4: Manual navigation pauses follow

Manual navigation MUST pause auto-follow until a DIFFERENT note is opened; re-activating the same note MUST NOT resume.

#### Scenario: Pause on manual nav

- GIVEN follow on and a note auto-selected
- WHEN the user navigates to another month/day
- THEN the calendar stays where the user navigated

#### Scenario: Resume on different note

- GIVEN follow paused by manual nav
- WHEN a different note becomes active
- THEN auto-follow resumes and jumps to that note

### Requirement ANR-5: Same-date guard

If the resolved date equals the current selection (same day, no week mode), the system MUST skip the re-render, preventing redundant O(N) re-renders and the click-note feedback double-render.

#### Scenario: No double render on click

- GIVEN a note already selected at its date
- WHEN clicking it fires `active-leaf-change`
- THEN no re-render occurs

### Requirement ANR-6: Preserve note list and daily-note creation

Existing behaviors MUST be preserved: clicking a list note still opens it; double-tap daily-note creation still creates/opens it and shows its day.

#### Scenario: List click preserved

- GIVEN the notes list shows a note
- WHEN the user clicks it
- THEN the note opens and the calendar reflects its date with no duplicate render

#### Scenario: Daily-note creation still works

- GIVEN `enableDailyNoteOnDoubleTap` on
- WHEN the user double-taps a date
- THEN the daily note is created/opened and the calendar stays on that day

### Requirement ANR-7: Verification and platform parity

The feature MUST work on desktop and mobile/iPad, MUST NOT write or modify note data, and `npm run lint` and `npx tsc --noEmit` MUST pass.

#### Scenario: Manual verification checklist

- GIVEN a build from this change
- WHEN the proposal's success criteria are checked
- THEN all criteria pass with no lint or type errors
