# Delta for Calendar Today Navigation

## MODIFIED Requirements

### Requirement: Text label

The today control MUST display localized text resolved from `t("today")` ("Today" in EN, "Hoy" in ES). The icon-only rendering (`setIcon(todayButton, 'calendar-1')`) MUST NOT remain.
(Previously: displayed the hard-coded English text "Today".)

#### Scenario: Text renders, icon removed

- GIVEN the calendar header renders
- WHEN the today button is inspected
- THEN its visible content is the localized text ("Today" in EN, "Hoy" in ES) and no `calendar-1` icon is present

#### Scenario: Spanish label

- GIVEN `language` `"es"`
- WHEN the today button renders
- THEN its visible text is "Hoy"

### Requirement: Accessibility label

The today control MUST set `aria-label` to the localized value resolved from `t("today_aria")` ("Go to today" in EN, "Ir a hoy" in ES).
(Previously: hard-coded `aria-label="Go to today"`.)

#### Scenario: Label localized

- GIVEN the today button
- WHEN its attributes are inspected
- THEN `aria-label` equals the localized value ("Go to today" in EN, "Ir a hoy" in ES)
