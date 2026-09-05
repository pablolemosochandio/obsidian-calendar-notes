# Plugin Localization Specification

## Purpose

Adds a two-language (English/Spanish) UI: a `language` setting (default `"es"`), typed locale dictionaries, a `t()` resolver with `{param}` interpolation, and localized date names and meridiems across the calendar, settings, and command/ribbon surfaces.

## Requirements

### Requirement: Language setting

The `PluginSettings` interface MUST gain a `language` field of type `string` restricted to `"en" | "es"`, defaulting to `"es"`. A `settings.ts` normalizer MUST validate the loaded value and default any unknown or missing value to `"es"`.

#### Scenario: Default is Spanish

- GIVEN a fresh install or persisted settings with no `language`
- WHEN settings load
- THEN `language` equals `"es"`

#### Scenario: Unknown value normalized

- GIVEN persisted `language` equals `"fr"`
- WHEN settings load
- THEN `language` is normalized to `"es"`

### Requirement: Language dropdown

The settings tab MUST render a dropdown labeled with localized text offering `English` and `Español`. Changing it MUST call `saveSettings()` and `refreshCalendarView()`.

#### Scenario: Dropdown persists and refreshes

- GIVEN the settings tab open with `language` `"es"`
- WHEN the user selects `English`
- THEN `language` is saved as `"en"` and the calendar view refreshes

### Requirement: Translation resolver

`src/i18n/index.ts` MUST expose `t(key, params?)` that resolves `key` from the active locale dictionary and substitutes `{param}` placeholders. The dictionaries `src/i18n/en.ts` and `src/i18n/es.ts` MUST be TypeScript-typed objects sharing one shape, with `es.ts` typed against the `en.ts` shape so `tsc` catches missing keys.

#### Scenario: Key resolved per locale

- GIVEN `language` `"es"` and a dictionary entry `today: "Hoy"`
- WHEN `t("today")` is called
- THEN it returns `"Hoy"`

#### Scenario: Param interpolation

- GIVEN a dictionary entry `notesCount: "{n} notes"`
- WHEN `t("notesCount", { n: 3 })` is called
- THEN it returns `"3 notes"`

#### Scenario: Missing key falls back to raw key

- GIVEN a key absent from the active locale
- WHEN `t("missing.key")` is called
- THEN it returns `"missing.key"` and does not throw

### Requirement: No hard-coded user-visible strings

All user-visible strings in `src/views/calendar-view.ts` and `src/settings.ts` MUST be resolved via `t()`; no hard-coded English UI string MUST remain.

#### Scenario: Calendar and settings strings localized

- GIVEN `language` `"es"`
- WHEN the calendar and settings tab render
- THEN all visible labels are Spanish, with no hard-coded English

### Requirement: Localized meridiem

`formatDateTime()` in `settings.ts` MUST localize the meridiem to `"a. m."` / `"p. m."` when `language` is `"es"`, and `AM` / `PM` when `"en"`.

#### Scenario: Spanish meridiem

- GIVEN `language` `"es"`
- WHEN a time label renders for 14:30
- THEN the meridiem renders as `"p. m."`

### Requirement: Command and ribbon localization

The `open-calendar` command label and ribbon tooltip in `src/main.ts` MUST be localized at registration time. These values MUST be documented as requiring a plugin reload to reflect a `language` change.

#### Scenario: Load-time localization with reload caveat

- GIVEN `language` `"es"` at plugin load
- WHEN the command palette and ribbon render
- THEN they show Spanish labels; a later language change does not update them until reload
