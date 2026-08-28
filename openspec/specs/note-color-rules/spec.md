# Note Color Rules Specification

## Purpose

Color each note row's vertical accent bar (`border-left`) via ordered, user-defined rules matching frontmatter or tags. Unmatched notes use a configurable default color initialized to the theme accent.

## Requirements

### Requirement: Rule model and precedence

Settings MUST expose `noteColorRules: { type: 'frontmatter' | 'tag'; key: string; value: string; color: string }[]`, default `[]`; ordered, FIRST match wins.

#### Scenario: First match wins

- GIVEN two matching rules, A before B WHEN a note renders THEN A's color applies

### Requirement: Frontmatter matching

Rules MUST match the key case-INSENSITIVELY; values exact, case-SENSITIVE; only strings match (string or list elements). Date-shaped strings like `2026-08-28` ARE strings and match; non-string scalars never match.

#### Scenario: Key and list

- GIVEN frontmatter `Projects: [Alpha]` and rule key `projects`, value `Alpha` WHEN renders THEN matches

#### Scenario: Value case

- GIVEN the same note and rule value `alpha` WHEN renders THEN no match

#### Scenario: Non-text

- GIVEN frontmatter `priority: 3` and rule value `3` WHEN renders THEN no match (not a string)

### Requirement: Tag matching

Tag rules MUST match only frontmatter `tags`; inline body `#tags` MUST be ignored. `key` is the prefix, `value` the subtag: matches `#key/value` and deeper tags whose first subtag equals `value`, case-SENSITIVE. A leading `#` on the rule key is OPTIONAL and ignored: `#area` and `area` are equivalent keys.

#### Scenario: Nested subtag

- GIVEN frontmatter `tags: [area/proyecto/sub]` and rule key `area`, value `proyecto` WHEN renders THEN matches

#### Scenario: Leading hash in key

- GIVEN frontmatter `tags: [area/proyecto]` and rule key `#area`, value `proyecto` WHEN renders THEN matches

#### Scenario: Inline ignored

- GIVEN a body tag `#area/proyecto` and no frontmatter `tags` WHEN renders THEN no match; default applies

### Requirement: Configurable default color

Settings MUST expose a default color (swatch + native picker) initialized to the theme accent; until the user explicitly picks (sentinel), it follows the accent, then the stored color wins. Unmatched notes and zero rules MUST use it.

#### Scenario: Sentinel

- GIVEN a fresh install WHEN notes render THEN bars use the theme accent

#### Scenario: Explicit pick

- GIVEN the user picked `#123456` WHEN the theme changes THEN unmatched bars stay that color

### Requirement: Rendering scope and hover

The rule color MUST change only the row's `border-left`; no other UI element MAY change color. The hover tint MUST keep working.

#### Scenario: Only the bar

- GIVEN a matched row WHEN it renders THEN only `border-left` changes and hover still tints it

### Requirement: Rules settings UI

The settings tab MUST support add, remove, and reorder (up/down). Saving MUST be blocked for incomplete rules (type, key, value, color required). Duplicates (same type+key+value, different color) MUST warn that the later rule never applies.

#### Scenario: Incomplete

- GIVEN a rule with an empty key WHEN the user saves THEN it is not persisted and validation feedback shows

#### Scenario: Duplicate

- GIVEN duplicates with different colors WHEN the tab renders THEN the later rule shows a never-applies warning

#### Scenario: Reorder

- GIVEN two overlapping rules WHEN the user moves the second above the first THEN notes use the moved rule's color

### Requirement: Migration and wiring

The normalizer MUST handle missing, non-array, and malformed `noteColorRules` without throwing: non-arrays become `[]`, malformed entries dropped, keys/values trimmed, colors validated as hex. `loadSettings()` MUST call it; settings changes MUST save via `saveSettings()` + `refreshCalendarView()`.

#### Scenario: Legacy vault

- GIVEN `data.json` without `noteColorRules` WHEN the plugin loads THEN settings load `[]` unchanged

#### Scenario: Malformed

- GIVEN an entry with an invalid hex WHEN the plugin loads THEN only valid rules survive

### Requirement: Read-only and platform parity

Matching MUST only read the metadata cache; the plugin MUST NOT write, modify, or remove any note attribute. MUST work on desktop and mobile/iPad; lint, typecheck, and build MUST pass.

#### Scenario: No data written

- GIVEN matching notes WHEN bars render THEN no write or modify event fires; files stay byte-identical

#### Scenario: Mobile

- GIVEN the plugin on a mobile device WHEN rows render THEN the UI is usable and bars render correctly
