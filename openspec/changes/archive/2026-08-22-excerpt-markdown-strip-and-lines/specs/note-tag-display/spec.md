# Delta for Note Tag Display

## MODIFIED Requirements

### Requirement: Inline tags excluded from chips

The system MUST NOT render inline `#tag` tokens as chips. The system MUST delegate excerpt inline-`#tag` stripping to the `note-excerpt` capability, which removes `#tag` tokens (matching `#[\w/-]+`) from the excerpt text. The tag chips and the separate `.calendar-note-tag-row` remain unchanged.
(Previously: the requirement directly stripped inline `#tag` tokens from the excerpt text itself.)

#### Scenario: Inline tag stripped from excerpt (delegated)

- GIVEN a note body containing `Discuss #roadmap today`
- WHEN the excerpt text is generated via `note-excerpt`
- THEN the excerpt reads `Discuss today`, without `#roadmap`

#### Scenario: Inline tag is not a chip

- GIVEN a note whose body contains `#roadmap` but whose frontmatter has no `tags`
- WHEN the filtered-notes list renders that note
- THEN no chip is shown for `#roadmap`
