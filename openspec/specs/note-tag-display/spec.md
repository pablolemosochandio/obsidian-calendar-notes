# Note Tag Display Specification

## Purpose

Render a note's frontmatter `tags` as read-only, visually distinct chips (tag icon + accent color) at the end of each filtered note in the calendar list. Inline `#tag` is never a chip and is stripped from the excerpt. Controlled by a `showTags` toggle (default on).

## Requirements

### Requirement: Frontmatter tags render as chips

The system MUST render each frontmatter `tags` value as a chip at the end of every filtered note, using a tag icon and an accent color. A scalar `tags` value MUST be normalized to an array before rendering. The system MUST read only frontmatter tags from the metadata cache (never inline `CachedMetadata.tags`).

#### Scenario: Scalar frontmatter tag

- GIVEN a note whose frontmatter has `tags: meeting`
- WHEN the filtered-notes list renders that note
- THEN one chip appears showing the `tag` icon and text `meeting`

#### Scenario: Array frontmatter tags

- GIVEN a note whose frontmatter has `tags: [meeting, work]`
- WHEN the filtered-notes list renders that note
- THEN two chips appear, one per value, each with the `tag` icon

### Requirement: Inline tags excluded from chips

The system MUST NOT render inline `#tag` tokens as chips. The system MUST delegate excerpt inline-`#tag` stripping to the `note-excerpt` capability, which removes `#tag` tokens (matching `#[\w/-]+`) from the excerpt text. The tag chips and the separate `.calendar-note-tag-row` remain unchanged.

#### Scenario: Inline tag stripped from excerpt (delegated)

- GIVEN a note body containing `Discuss #roadmap today`
- WHEN the excerpt text is generated via `note-excerpt`
- THEN the excerpt reads `Discuss today`, without `#roadmap`

#### Scenario: Inline tag is not a chip

- GIVEN a note whose body contains `#roadmap` but whose frontmatter has no `tags`
- WHEN the filtered-notes list renders that note
- THEN no chip is shown for `#roadmap`

### Requirement: Chips are visual-only

Tag chips MUST be non-interactive. The system MUST NOT attach click, hover-action, or navigation handlers to any chip, and MUST NOT open, edit, or filter by tag when a chip is activated.

#### Scenario: Chip activation has no effect

- GIVEN a note with a rendered tag chip
- WHEN a user clicks or taps the chip
- THEN no navigation, filter, or state change occurs

### Requirement: showTags toggle controls the tag row

The settings MUST expose a `showTags` boolean, default `true`, following the existing normalizer + settings-tab pattern. When `false`, the tag row MUST be hidden; when `true`, it MUST be shown.

#### Scenario: Default shows the row

- GIVEN default settings
- WHEN the filtered-notes list renders
- THEN the tag row is visible for each note

#### Scenario: Toggle off hides the row

- GIVEN `showTags` set to `false`
- WHEN the settings are saved and the calendar refreshes
- THEN no tag row or chip is rendered

### Requirement: Empty tag row preserves alignment

The system MUST always render the tag-row container for each filtered note, including when a note has zero frontmatter tags, so vertical alignment is preserved across notes.

#### Scenario: Note with no frontmatter tags

- GIVEN a note with no frontmatter `tags`
- WHEN the filtered-notes list renders that note
- THEN an empty tag-row container is still present

#### Scenario: Inline tags only

- GIVEN a note with only inline `#tag` and no frontmatter `tags`
- WHEN the filtered-notes list renders that note
- THEN an empty tag row appears and the excerpt has inline tags stripped

### Requirement: Theme-variable fallback styling

The chip and row MUST be styled with Obsidian `--tag-*` CSS variables. When those variables are absent, the system MUST fall back to `--text-accent` and `--background-secondary`, and MUST apply mobile overrides via `body.is-mobile`.

#### Scenario: Missing theme variables

- GIVEN a theme that does not define `--tag-*` variables
- WHEN a tag chip renders
- THEN the chip uses the fallback accent and background colors and remains legible

### Requirement: Read-only and platform parity

The system MUST NOT write, modify, or remove any note attribute or frontmatter value; note files MUST stay byte-identical. The feature MUST function on both desktop and mobile/iPad. `npm run lint` and `npx tsc --noEmit` MUST pass.

#### Scenario: No data written

- GIVEN a note with frontmatter `tags`
- WHEN the calendar renders its chips
- THEN no write or modify event fires and the file is unchanged

#### Scenario: Mobile rendering

- GIVEN the plugin running on a mobile device
- WHEN the filtered-notes list renders tag chips
- THEN chips render correctly using the mobile styling overrides
