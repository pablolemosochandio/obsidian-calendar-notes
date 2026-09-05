## Exploration: i18n-spanish-support

### Current State
The plugin is English-only. User-visible strings are hard-coded in three places:

- `src/main.ts` — ribbon tooltip and command palette entry (`"Open calendar"`), plus the view display text (`"Calendar"`).
- `src/views/calendar-view.ts` — calendar header month/weekday names, the "Today" button, empty-state messages, week/quarter labels, daily-note error notices, and aria-labels.
- `src/settings.ts` — every setting name, description, dropdown option, placeholder, tooltip, threshold label, color-rule feedback message, and the "Example:/Preview:" format-description prefixes.

There is no existing translation layer, no language setting, and no locale-aware formatting beyond the custom `formatDateTime()` token replacer in `src/settings.ts`.

### Affected Areas
- `src/settings.ts` — add `language` setting, normalizer, and dropdown; translate every `Setting.setName/setDesc/setTooltip/setButtonText/setPlaceholder` call and the rule-feedback builder.
- `src/views/calendar-view.ts` — translate calendar month names, weekday labels, "Today", empty-state messages, notices, and quarter/week labels.
- `src/main.ts` — translate command name, ribbon tooltip, and view display text (with the caveat that these are registered once at load time).
- New file(s) — a lightweight i18n helper and locale dictionaries (e.g. `src/i18n/`).

### Approaches

1. **Inline TypeScript locale modules + simple `t(key)` helper**
   - Keep `src/i18n/en.ts` and `src/i18n/es.ts` as plain nested objects, export a `t(key, params?)` function that reads `plugin.settings.language`.
   - Use the same module for UI strings and for localized month/weekday name arrays.
   - Pros: zero dependencies, tiny bundle overhead, works offline and on mobile, easy to type-check, fits the existing single-file esbuild output.
   - Cons: adding a language requires editing source and rebuilding; no hot-reload of translations.
   - Effort: Low

2. **JSON translation files loaded at runtime**
   - Ship `locales/en.json` and `locales/es.json`, load them with `app.vault.adapter.read` or `fetch` from the plugin directory.
   - Pros: translators can edit JSON without touching TypeScript; files are not bundled into `main.js`.
   - Cons: file I/O complicates mobile packaging (paths differ), requires async loading during `onload`, adds failure modes if files are missing, and Obsidian’s plugin installer does not guarantee extra files are preserved unless they are in the release zip.
   - Effort: Medium

3. **Adopt a community i18n package (`obsidian-plugin-i18n` or `i18n-plus` adapter)**
   - Add an npm dependency and wrap strings with the library’s translation function.
   - Pros: interpolation, fallbacks, key extraction tools, and potential integration with the `i18n-plus` community-dictionary plugin.
   - Cons: adds a runtime dependency to a plugin that currently has none, increases bundle size, and the leading adapter (`i18n-plus`) is explicitly "vibe-coded" and may be overkill for two languages.
   - Effort: Medium–High

4. **Hybrid: Obsidian `moment` locale for dates + inline map for UI strings**
   - Call `moment.locale('es')` and use `moment().format('MMM')` / `moment().format('dddd')` for month/weekday names, while keeping an inline object for settings labels and messages.
   - Pros: reuses Obsidian’s bundled moment locales; month/weekday names stay in sync with Obsidian’s own Spanish UI.
   - Cons: moment locale availability is an internal Obsidian detail and could change; not all plugin strings (settings, notices) are covered by moment, so an inline map is still required.
   - Effort: Low–Medium

### Recommendation
Use **Approach 1** (inline TypeScript locale modules) combined with the date-name parts of **Approach 4** where convenient. Specifically:

- Create `src/i18n/index.ts` with a lightweight `t(key, params?)` helper and `src/i18n/en.ts` / `src/i18n/es.ts` dictionaries.
- Add `language: 'en' | 'es'` to `CalendarPluginSettings`, default it to `'es'`, and place the language dropdown at the top of the settings tab.
- Replace hard-coded month/weekday/name arrays in `calendar-view.ts` with localized arrays from the dictionary.
- Keep the UI refresh pattern consistent with the rest of the plugin: `saveSettings()` + `refreshCalendarView()`.
- Accept that command/ribbon labels registered in `main.ts` only update after an Obsidian reload; note this limitation in the proposal.

This path is the smallest, most predictable change and matches the project’s current zero-dependency, single-bundle architecture.

### Risks
- **Upgrade surprise for existing English users**: because the requested default is Spanish, users who already have a `data.json` without a `language` field will suddenly see Spanish after updating. The normalizer will assign `'es'` on first load.
- **Command/ribbon labels are static**: `addCommand` and `addRibbonIcon` names are captured at plugin load; changing the language setting will not update them until the plugin is reloaded. The view tab text (`getDisplayText`) is dynamic and will update on the next view refresh.
- **AM/PM localization**: `formatDateTime()` always emits `AM`/`PM` or `am`/`pm`. Spanish users expect `a. m.` / `p. m.`; this helper must be taught the current language or replaced with `moment().format()` for time display.
- **Week/quarter label grammar**: strings like `"week 12 (2026-03-10 to 2026-03-16)"` and `"Q1"` must be translated (Spanish: `"semana 12 (...)"`, `"T1"` for trimestre).
- **Placeholder vs. label collisions**: some placeholders (`date`, `key`, `value`) and numeric placeholders (`1`, `3`, `5`) are English words that also serve as user hints; they should be translated in the UI while keeping numeric placeholders unchanged.
- **Accented short labels**: Spanish weekday abbreviations include accents (`Mié`, `Sáb`, `Dom`). CSS currently treats labels as plain text, but layout widths should be verified on mobile.

### Spanish translations needed

| Key / location | English | Spanish |
|---|---|---|
| `main.commandName` | Open calendar | Abrir calendario |
| `main.ribbonTooltip` | Open calendar | Abrir calendario |
| `view.displayText` | Calendar | Calendario |
| `view.todayButton` | Today | Hoy |
| `view.todayAriaLabel` | Go to today | Ir a hoy |
| `view.monthNames` | January … December | Enero … Diciembre |
| `view.monthShortNames` | Jan … Dec | Ene … Dic |
| `view.weekdayNames` | Sunday … Saturday | Domingo … Sábado |
| `view.weekdayShortNames` | Sun … Sat | Dom … Sáb |
| `view.quarterLabel` | Q{n} | T{n} |
| `view.emptySelect` | Select a date or week to view notes | Selecciona una fecha o semana para ver las notas |
| `view.emptyWeek` | No notes for week {n} ({start} to {end}) | No hay notas para la semana {n} ({start} a {end}) |
| `view.emptyDate` | No notes for {date} | No hay notas para {date} |
| `view.emptyGeneric` | No notes found | No se encontraron notas |
| `view.dailyNotesDisabled` | Enable the Daily notes core plugin to create daily notes from the calendar. | Habilita el complemento principal de notas diarias para crear notas diarias desde el calendario. |
| `view.dailyNoteFolderExists` | Unable to create daily note. A folder exists at {path}. | No se puede crear la nota diaria. Existe una carpeta en {path}. |
| `view.dailyNoteCreateFailed` | Could not create daily note for {date}. | No se pudo crear la nota diaria para {date}. |
| `settings.section.noteList` | Note list | Lista de notas |
| `settings.noteSortBy.name` | Sort notes by | Ordenar notas por |
| `settings.noteSortBy.desc` | Choose how notes are sorted in the note list. | Elige cómo se ordenan las notas en la lista. |
| `settings.noteSortBy.option.name` | Name | Nombre |
| `settings.noteSortBy.option.creationTime` | Creation date/time | Fecha/hora de creación |
| `settings.noteSortBy.option.noteProperty` | Note property | Propiedad de la nota |
| `settings.noteDateProperty.name` | Note date property | Propiedad de fecha de la nota |
| `settings.noteDateProperty.desc` | Empty disables the property source. | Vacío desactiva la fuente de propiedad. |
| `settings.noteDateProperty.placeholder` | date | fecha |
| `settings.noteDateFormat.name` | Note date format | Formato de fecha de la nota |
| `settings.noteDateFormat.example` | Example: | Ejemplo: |
| `settings.noteDateFormat.preview` | Preview: | Vista previa: |
| `settings.sortOrder.name` | Sort order | Orden de clasificación |
| `settings.sortOrder.desc` | Choose whether notes are shown ascending or descending. | Elige si las notas se muestran de forma ascendente o descendente. |
| `settings.sortOrder.ascending` | Ascending | Ascendente |
| `settings.sortOrder.descending` | Descending | Descendente |
| `settings.showTime.name` | Show creation time | Mostrar hora de creación |
| `settings.showTime.desc` | Display note creation time. | Mostrar la hora de creación de la nota. |
| `settings.timeFormat.name` | Time display format | Formato de visualización de la hora |
| `settings.timeFormat.example` | Example: | Ejemplo: |
| `settings.timeFormat.preview` | Preview: | Vista previa: |
| `settings.showExcerpt.name` | Show excerpt | Mostrar extracto |
| `settings.showExcerpt.desc` | Display a short preview of each note's content. | Mostrar una vista previa breve del contenido de cada nota. |
| `settings.excerptLines.name` | Excerpt lines | Líneas de extracto |
| `settings.excerptLines.desc` | Specify the maximum number of lines to show in note excerpts. | Especifica el número máximo de líneas para mostrar en los extractos. |
| `settings.showTags.name` | Show tags | Mostrar etiquetas |
| `settings.showTags.desc` | Display a note's frontmatter tags as chips. | Mostrar las etiquetas de la propiedad frontal como fichas. |
| `settings.section.colorRules` | Note color rules | Reglas de color de nota |
| `settings.defaultAccentColor.name` | Default accent color | Color de acento predeterminado |
| `settings.defaultAccentColor.desc` | Color used for notes no rule matches. Follows the theme accent until you pick a color. | Color usado para las notas que no coinciden con ninguna regla. Sigue el acento del tema hasta que elijas un color. |
| `settings.defaultAccentColor.reset` | Reset | Restablecer |
| `settings.defaultAccentColor.resetTooltip` | Follow the theme accent | Seguir el acento del tema |
| `settings.addRule` | Add rule | Agregar regla |
| `settings.ruleType.frontmatter` | Property | Propiedad |
| `settings.ruleType.tag` | Tag | Etiqueta |
| `settings.ruleKeyPlaceholder` | key | clave |
| `settings.ruleTagPlaceholder` | tag name (wildcards: *) | nombre de etiqueta (comodines: *) |
| `settings.ruleValuePlaceholder` | value | valor |
| `settings.ruleMoveUpTooltip` | Move rule up | Mover regla arriba |
| `settings.ruleMoveDownTooltip` | Move rule down | Mover regla abajo |
| `settings.ruleRemoveTooltip` | Remove rule | Eliminar regla |
| `settings.ruleFeedback.valueRequired` | Value is required | Se requiere un valor |
| `settings.ruleFeedback.keyAndValueRequired` | Key and value are required | Se requieren clave y valor |
| `settings.ruleFeedback.neverApplies` | Never applies — earlier rule #{n} matches | Nunca se aplica: la regla anterior n.º {n} coincide |
| `settings.section.calendarDisplay` | Calendar display | Visualización del calendario |
| `settings.followActiveNote.name` | Follow active note | Seguir nota activa |
| `settings.followActiveNote.desc` | When enabled, the calendar jumps to and filters by the date of the note currently open in the editor. Manual navigation pauses following until a different note is opened. | Cuando está habilitado, el calendario salta y filtra por la fecha de la nota abierta en el editor. La navegación manual pausa el seguimiento hasta que se abra una nota diferente. |
| `settings.weekStartDay.name` | Week starts on | La semana comienza el |
| `settings.weekStartDay.desc` | Choose the first day shown in each week. | Elige el primer día mostrado en cada semana. |
| `settings.weekStartDay.sunday` | Sunday | Domingo |
| `settings.weekStartDay.monday` | Monday | Lunes |
| `settings.weekNumbers.name` | Week numbers | Números de semana |
| `settings.weekNumbers.desc` | Display week numbers in the calendar. | Mostrar los números de semana en el calendario. |
| `settings.weekNumbers.off` | Off | Apagado |
| `settings.weekNumbers.iso` | ISO 8601 | ISO 8601 |
| `settings.weekNumbers.us` | United States | Estados Unidos |
| `settings.daysToShow.name` | Days to show | Días a mostrar |
| `settings.daysToShow.desc` | Choose which weekdays are visible in the calendar. | Elige qué días de la semana son visibles en el calendario. |
| `settings.showNoteIndicators.name` | Show note indicators | Mostrar indicadores de notas |
| `settings.showNoteIndicators.desc` | Display indicators on days that have notes. | Mostrar indicadores en los días que tienen notas. |
| `settings.thresholdDescription` | Set the minimum number of notes required for each indicator level. | Establece el número mínimo de notas requerido para cada nivel de indicador. |
| `settings.indicator1` | 1 indicator | 1 indicador |
| `settings.indicator2` | 2 indicators | 2 indicadores |
| `settings.indicator3` | 3 indicators | 3 indicadores |
| `settings.dailyNoteOnDoubleTap.name` | Create daily note on double-click/tap | Crear nota diaria al hacer doble clic/toque |
| `settings.dailyNoteOnDoubleTap.desc` | When enabled, double-clicking or double-tapping a date creates or opens that day's daily note. The Daily Notes core plugin is required. | Cuando está habilitado, hacer doble clic o toque dos veces una fecha crea o abre la nota diaria de ese día. Se requiere el complemento principal de notas diarias. |
| `settings.language.name` | Language | Idioma |
| `settings.language.desc` | Display language for the plugin interface. | Idioma de visualización de la interfaz del complemento. |
| `settings.language.en` | English | English |
| `settings.language.es` | Spanish | Español |

### Ready for Proposal
Yes. The scope is well-defined, the string inventory is complete, and the recommended approach aligns with the existing zero-dependency architecture. The main open product question is whether the requested Spanish default should apply to existing installs or only new installs.
