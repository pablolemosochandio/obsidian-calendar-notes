# Note Date Source Specification

## Purpose

Adds a configurable date source (frontmatter property + format) for placing, filtering, sorting, labeling notes; ctime fallback; read-only; day/month/year only.

## Requirements

### Requirement: Configurable date source setting

The settings tab MUST offer a three-option date-source selector: `Name`, `Creation date/time`, `Note property`. Selecting `Note property` MUST reveal property-name (default `''`) and date-format (default `DD-MM-YYYY`, moment tokens) fields; other selections MUST hide them. An empty property name MUST disable the source (OFF), resolving all notes by ctime. Defaults MUST stay backward compatible; persisted `name`/`creation-time` stay valid.

#### Scenario: Default stays backward compatible

- GIVEN default settings
- WHEN the plugin loads
- THEN the selector shows `Creation date/time`, matching ctime-only behavior

#### Scenario: Fields shown conditionally

- GIVEN `Note property` selected
- WHEN the settings tab renders
- THEN property-name and date-format fields appear, hidden otherwise

#### Scenario: Empty property name is OFF

- GIVEN selector `Note property` and property name `''`
- WHEN notes are placed in the calendar
- THEN every note resolves by ctime

### Requirement: Note date resolution with ctime fallback

The system MUST resolve each note's date as: with source `Note property`, the configured property exists, is a scalar string, and strict-parses with `moment(value, format, true)`, a local-midday Date from the parsed year/month/day; otherwise `file.stat.ctime`. The Date MUST be `new Date(y, m, d, 12, 0, 0)`, never an ISO-string parse (UTC-midnight off-by-one).

#### Scenario: Valid property value

- GIVEN property `date` = `05-03-2026`, format `DD-MM-YYYY`
- WHEN the note's date is resolved
- THEN it resolves to local-midday 2026-03-05

#### Scenario: Missing property

- GIVEN the configured property is absent
- WHEN the note's date is resolved
- THEN it resolves to `file.stat.ctime`

#### Scenario: Unparseable value

- GIVEN property `date` = `99-99-9999` with format `DD-MM-YYYY`
- WHEN the note's date is resolved
- THEN strict parsing fails and it resolves to `file.stat.ctime`

#### Scenario: Non-scalar value

- GIVEN property `date` = `[05-03-2026]` or an object
- WHEN the note's date is resolved
- THEN the value is rejected and it resolves to `file.stat.ctime`

### Requirement: Date components only

From a resolved property date, the system MUST use only day, month, and year; hour, minute, second, and other time components MUST be excluded from day/week matching, dash counts, sort, and the time label.

#### Scenario: Datetime uses date part only

- GIVEN property `date` = `05-03-2026 14:30`, format `DD-MM-YYYY HH:mm`
- WHEN the note's date is resolved
- THEN only 2026-03-05 is used; the time is excluded everywhere

### Requirement: Consistent application across date sites

The resolved date MUST be used at every ctime site: day matching, week matching, month dash counts, notes-list sort, and the time label.

#### Scenario: Week matching

- GIVEN a note whose property week differs from its ctime week
- WHEN the week view renders
- THEN the note appears in the property-date week

#### Scenario: Dash counts

- GIVEN a property-dated note in the displayed month
- WHEN dash counts render
- THEN the dash increments on the property day, not the ctime day

#### Scenario: Sort uses resolved dates

- GIVEN two notes with the same resolved date but different ctimes
- WHEN sorting by `Creation date/time`
- THEN ties break by resolved date, then name

#### Scenario: Label shows resolved date

- GIVEN a property-dated note with `showTime` enabled
- WHEN the notes list renders the time label
- THEN it shows the resolved property date without a time part

### Requirement: Read-only guarantee

The system MUST NOT modify, write, or remove any note attribute, and MUST NOT invoke `processFrontMatter` or other mutation APIs, including for double-tap-created daily notes. The feature MUST only read the configured property from the metadata cache; note files MUST stay byte-identical.

#### Scenario: Property is only read

- GIVEN a note with a `date` property and source `Note property`
- WHEN the calendar refreshes
- THEN no write or modify event occurs and the frontmatter is unchanged

#### Scenario: Daily-note creation mutation-free

- GIVEN source `Note property`
- WHEN a daily note is created via double-tap
- THEN it is created without injected frontmatter