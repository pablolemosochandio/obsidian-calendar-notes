# Delta for note-color-rules

## MODIFIED Requirements

### Requirement: Tag matching

Tag rules MUST match only frontmatter `tags`; inline `#tags` MUST be ignored. `value` holds the FULL tag name; `key` MUST be ignored (even empty). Matching is anchored, case-SENSITIVE, literal except `*`: exact value matches only that exact tag — no implicit nesting; `*` matches any chars INCLUDING `/` (greedy). A leading `#` on the value is OPTIONAL and ignored.

(Previously: value was subtag under prefix key; deeper tags matched.)

#### Scenario: Exact name

- GIVEN frontmatter `tags: [sistemas]` and rule value `sistemas` WHEN renders THEN matches

#### Scenario: No nesting

- GIVEN frontmatter `tags: [sistemas/reunion]` and rule value `sistemas` WHEN renders THEN no match

#### Scenario: Nested breadth

- GIVEN frontmatter `tags: [sistemas/reunion]` and rule value `sistemas/*` WHEN renders THEN matches

#### Scenario: Greedy wildcard

- GIVEN frontmatter `tags: [a/b/reunion]` and rule value `*/reunion` WHEN renders THEN matches

#### Scenario: Wildcard only

- GIVEN frontmatter `tags: [x]` and rule value `*` WHEN renders THEN matches

#### Scenario: Untagged

- GIVEN no frontmatter `tags` and rule value `*` WHEN renders THEN default applies

#### Scenario: Value case

- GIVEN frontmatter `tags: [Sistemas]` and rule value `sistemas` WHEN renders THEN no match

#### Scenario: Hash in value

- GIVEN frontmatter `tags: [sistemas]` and rule value `#sistemas` WHEN renders THEN matches

#### Scenario: Inline ignored

- GIVEN a body `#sistemas` tag and no frontmatter `tags` WHEN renders THEN no match

### Requirement: Rules settings UI

The settings tab MUST support add, remove, and reorder (up/down). Saving MUST block incomplete rules: frontmatter needs type+key+value+color; tag needs value+color only. Tag rows MUST hide the key input — only type, value, color, reorder/remove show. Type change MUST rebuild the row. Duplicates MUST warn the later rule never applies: frontmatter by type+key+value; tag by exact value pattern. Overlapping wildcards are NOT detected (documented limitation).

(Previously: completeness required key for all; duplicates by type+key+value.)

#### Scenario: Incomplete

- GIVEN a frontmatter rule with an empty key WHEN the user saves THEN it is not persisted and feedback shows

#### Scenario: Empty tag value

- GIVEN a tag rule with an empty value WHEN the user saves THEN it is not persisted and feedback shows

#### Scenario: Hidden key

- GIVEN a tag rule WHEN the settings tab renders THEN only value, color, reorder/remove show

#### Scenario: Type change

- GIVEN a frontmatter rule row WHEN type changes to Tag THEN the row rebuilds without key input

#### Scenario: Duplicate

- GIVEN duplicate frontmatter rules, different colors WHEN the tab renders THEN the later shows never-applies warning

#### Scenario: Duplicate value

- GIVEN duplicate tag rule values, different colors WHEN the tab renders THEN the later shows never-applies warning

#### Scenario: Reorder

- GIVEN two overlapping rules WHEN the user moves the second above the first THEN notes use the moved rule's color

### Requirement: Migration and wiring

The normalizer MUST handle missing, non-array, and malformed `noteColorRules` without throwing: non-arrays become `[]`, malformed dropped, values trimmed, colors hex-validated. Legacy tag rules with non-empty key MUST migrate deterministically at load: `value` = `normalized-key + '/' + value` (leading `#` stripped), `key` = `''`. Migration is one-way, documented; migrated tag rules MUST stay complete with empty key. `loadSettings()` MUST call the normalizer; changes MUST save via `saveSettings()` + `refreshCalendarView()`.

(Previously: tag rules kept their prefix key; no migration existed.)

#### Scenario: Legacy vault

- GIVEN `data.json` without `noteColorRules` WHEN the plugin loads THEN settings load `[]` unchanged

#### Scenario: Malformed

- GIVEN an entry with an invalid hex WHEN the plugin loads THEN only valid rules survive

#### Scenario: Legacy migration

- GIVEN a persisted tag rule `area`/`proyecto` WHEN the plugin loads THEN value becomes `area/proyecto`, key `''`

#### Scenario: Migrated match

- GIVEN the migrated rule and frontmatter `tags: [area/proyecto]` WHEN renders THEN matches
