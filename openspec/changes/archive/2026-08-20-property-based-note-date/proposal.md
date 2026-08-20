# Proposal: Property-based note date

## Intent

Notes are placed/filtered by file creation time (`file.stat.ctime`) only — never by frontmatter (DEVELOPMENT.md §4.1). Users with a date property want the calendar to follow that date, so this adds a configurable `Note property` source (name + format) with ctime fallback.

## Scope

### In Scope
- Third selector option: `Name` | `Creation date/time` | `Note property`. Settings: date source + property name + format (default `DD-MM-YYYY`) shown when `Note property` active; empty name → OFF (pure ctime).
- Resolver `resolveNoteDate(file)` on all 5 ctime call sites (below): property present AND `moment(value, format, true)` valid → local-midday Date from y/m/d components ONLY (day/month/year); hour, minute, second and any other time components are excluded; else ctime.

### Out of Scope
- No write-back into created daily notes (`processFrontMatter`); read-only.
- No auto-detection of property names.
- No multi-property precedence list.

### Constraints (hard)
- **Read-only by design**: the plugin MUST NOT modify, write, or remove any note attribute/frontmatter value — it only READS the configured property. No `processFrontMatter`, no injection, no mutation of any note (including daily notes created via double-tap).
- **Date components only**: from the property value, only the day/month/year components are used. Hour, minute, second and any other non-date components are excluded and ignored when placing, filtering, sorting, or labeling notes.

## Capabilities

### New Capabilities
- `note-date-source`: configurable date source (ctime or frontmatter property with format) for placing, filtering, sorting, labeling notes.

### Modified Capabilities
- None (`openspec/specs/` empty).

## Approach

- Add `Note property` to the "Sort notes by" dropdown (settings.ts L176-188); keys `name`/`creation-time` stay valid for existing `data.json`.
- Settings `noteDateProperty` (default `''`) + `noteDatePropertyFormat` (default `DD-MM-YYYY`) + normalizers; existing pattern: `loadSettings()` + `onChange` → `saveSettings()` + `refreshCalendarView()` (main.ts L53-76).
- Text inputs in a nested section (L217/L232 pattern), sentence-case labels; community rules (sentence case, `createEl`/`Setting` only, `instanceof TFile`, graceful missing-metadata) are manual — `eslint-plugin-obsidianmd` not installed.
- `resolveNoteDate(file)`: `getFileCache(file)?.frontmatter?.[prop]`; scalar + strict parse → `new Date(y, m, d, 12, 0, 0)` (date components only; hour/minute/second excluded); else ctime.
- Route 5 ctime sites: `isNoteCreatedOnDate` L669, `isNoteCreatedInWeek` L674, `buildNoteCountMap` L649, `sortNotes` L630-647, label `updateNotesList` L562-566.
- §4.2 trap: Estrategia B's `toISOString().split('T')[0]` compares in UTC → off-by-one for negative offsets; local-midday decomposition (repo rule, `getDailyNoteTimestamp` L911-914) is correct.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/settings.ts` | Modified | Fields, defaults, normalizers, dropdown, UI |
| `src/views/calendar-view.ts` | Modified | `resolveNoteDate` + 5 call sites |
| `src/main.ts` | Modified | `loadSettings()` wiring |
| `AGENTS.md` | Modified (optional) | Domain rule: note property source |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cache lag for fresh notes | Low | ctime fallback; vault-event refresh |
| Moment token confusion | Med | Live preview; sensible default |
| Label shows 12:00:00 (midday) for property-dated notes | Med | Accepted (decisions 6/7); design may suppress time |
| Per-note `getFileCache` cost | Low | In-memory; already iterates all MD files |

## Rollback Plan

OFF by default → backward compatible. Revert: delete settings keys, drop the third option, restore ctime (or revert commit); leftover `data.json` keys are ignored.

## Dependencies

- None (`moment` + `metadataCache` already available).

## Success Criteria

- [ ] Defaults → identical to today.
- [ ] Property `date` + `DD-MM-YYYY` → note lands on property day in day/week/dashes/sort/label.
- [ ] Missing/invalid/non-scalar values → ctime; datetime value → date part only (hour/minute/second excluded).
- [ ] `npm run lint` + `npx tsc --noEmit` clean.