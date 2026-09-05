# Delta for Note Date Source

## MODIFIED Requirements

### Requirement: Configurable date source setting

The settings tab MUST offer a three-option date-source selector whose labels are resolved via `t()`: `Name`/`Nombre`, `Creation date/time`/`Fecha/hora de creación`, `Note property`/`Propiedad de la nota`, matching the active `language`. The `Note property` field label and description MUST also use `t()` keys. Selecting `Note property` MUST reveal property-name (default `''`) and date-format (default `DD-MM-YYYY`, moment tokens) fields; other selections MUST hide them. An empty property name MUST disable the source (OFF), resolving all notes by ctime. Defaults MUST stay backward compatible; persisted `name`/`creation-time` stay valid.
(Previously: selector labels were hard-coded English `Name`/`Creation date/time`/`Note property`.)

#### Scenario: Default stays backward compatible

- GIVEN default settings
- WHEN the plugin loads
- THEN the selector shows the localized `Creation date/time` label, matching ctime-only behavior

#### Scenario: Fields shown conditionally

- GIVEN `Note property` selected
- WHEN the settings tab renders
- THEN property-name and date-format fields appear, hidden otherwise

#### Scenario: Empty property name is OFF

- GIVEN selector `Note property` and property name `''`
- WHEN notes are placed in the calendar
- THEN every note resolves by ctime

#### Scenario: Spanish selector labels

- GIVEN `language` `"es"`
- WHEN the settings tab renders
- THEN the selector shows `Nombre`, `Fecha/hora de creación`, `Propiedad de la nota`

## ADDED Requirements

### Requirement: Settings labels localized

All other user-visible labels and descriptions in the settings tab MUST be resolved via `t()`; no hard-coded English label MUST remain.

#### Scenario: Settings tab fully localized

- GIVEN `language` `"es"`
- WHEN the settings tab renders
- THEN every label and description is Spanish, with no hard-coded English
