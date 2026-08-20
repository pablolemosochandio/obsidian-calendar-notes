# Design: Property-based note date

## Technical Approach

Add a third value `note-property` to the existing `noteSortBy` dropdown (`Name` | `Creation date/time` | `Note property`), doubling as the note-date source. When active and the property name is non-empty, a new pure resolver `resolveNoteDate` reads `getFileCache(file).frontmatter[prop]`, strict-parses with `moment(value, format, true)`, and returns a local-midday Date from y/m/d only — otherwise `file.stat.ctime`. All 5 ctime sites route through it; defaults are OFF → identical to today.

## Architecture Decisions

### D1: Settings model — extend `noteSortBy` + two property settings

| Option | Tradeoff | Decision |
|---|---|---|
| Extend `NoteSortBy` + `noteDateProperty` (''=OFF) + `noteDatePropertyFormat` ('DD-MM-YYYY') | Selector overloaded (sort + date source); persisted keys stay valid | **Chosen** — locked user decision; matches spec selector |
| Separate `noteDateSource` setting | Cleaner semantics, two dropdowns | Rejected — contradicts locked decision |

Source active iff `noteSortBy === 'note-property' && noteDateProperty.trim() !== ''`. Naming confirmed from the previous session's sketch.

### D2: Time label for property-dated notes

| Option | Tradeoff | Decision |
|---|---|---|
| `formatDateTime(date, 'YYYY-MM-DD')` when `fromProperty` | Deterministic; no time tokens possible | **Chosen** — spec: label shows the date "without a time part" |
| 12:00:00 / `noteDatePropertyFormat` / omit label | Meaningless; may include time tokens; spec says the date is shown | Rejected |

`resolveNoteDate` returns `{ date, fromProperty }` so the label distinguishes sources without a second cache read. ctime notes keep today's label.

### D3: Settings UI — nested-section reveal (existing pattern)

Clone `timeFormatSection` (settings.ts L217-232): after the dropdown, `noteDateSection` (`cls: 'calendar-settings-nested-section'`) with two `Setting` text inputs:

- **Note date property** — placeholder `date`; desc "Empty disables the property source."
- **Note date format** — placeholder `DD-MM-YYYY`; live-preview desc cloned from `buildTimeFormatDesc`; empty → default.

`setSectionVisibility(noteDateSection, noteSortBy === 'note-property')` on render AND in dropdown `onChange` (existing `is-hidden` class). Sentence-case labels.

### D4: `resolveNoteDate` lives in new pure module `src/note-date.ts`

| Option | Tradeoff | Decision |
|---|---|---|
| Pure `resolveNoteDate(file, app, settings)` in `src/note-date.ts` | Feature-core logic isolated; future precedence-list slot-in (exploration rec.); same import pattern as main↔settings | **Chosen** |
| Private `CalendarView` method | Matches monolith, but grows the 915-line file; couples pure logic to view state | Rejected |

### D5: metadataCache listener — OUT of scope

`vault.on('modify')` (400 ms debounced) already refreshes after frontmatter edits; null `getFileCache` falls back to ctime. A `metadataCache.on('changed')` listener would only close a transient index race and needs its own debounce; no spec requirement/scenario demands it. Known limitation + follow-up candidate; the proposal's mitigation stands.

### D6: Sort comparator interpretation

Date-sort (`creation-time` or `note-property`) compares `resolveNoteDate(file).date` first, then name, then ctime (existing fallback L645). Under `note-property` resolved = property date (spec scenario "Sort uses resolved dates"); otherwise ctime → today. Under `name` the date branch is skipped.

## Data Flow

    resolveNoteDate(file, app, settings) ── getFileCache(file)?.frontmatter?.[prop]
      │
      ├─ absent / non-string / invalid strict parse ──► { date: ctime, fromProperty: false }
      └─ valid "05-03-2026" ──► { date: new Date(y, m, d, 12, 0, 0), fromProperty: true }
                                 │
      ┌──────────────────────────┴─────────────────────────────┐
      ▼                                                        ▼
    day · week · dash counts · sort                    label: fromProperty
                                                         ? 'YYYY-MM-DD' : timeIsoDisplay

## File Changes

| File | Action | Description |
|---|---|---|
| `src/note-date.ts` | Create | Pure `resolveNoteDate` + `ResolvedNoteDate` |
| `src/settings.ts` | Modify | `NoteSortBy` 3rd value; 2 settings + defaults; 2 normalizers; dropdown option + nested section |
| `src/views/calendar-view.ts` | Modify | Route 5 sites: label L562-566, sort L630-647, dash map L649-659, day L669-672, week L674-677 |
| `src/main.ts` | Modify | `loadSettings()` normalizes the 2 new keys |
| `AGENTS.md` | Modify (optional) | Domain rule: ctime + optional property source |

## Interfaces / Contracts

```ts
// src/note-date.ts
import { App, TFile, moment } from 'obsidian';
import type { CalendarPluginSettings } from './settings';

export interface ResolvedNoteDate {
  date: Date;          // property → local midday; ctime → exact ctime
  fromProperty: boolean;
}

export function resolveNoteDate(file: TFile, app: App, settings: CalendarPluginSettings): ResolvedNoteDate;
```

Contract: source inactive → ctime. Active → string value only (arrays/objects/numbers/booleans → ctime), trimmed, strict-parseable; result from `year()/month()/date()` only via `new Date(y, m, d, 12, 0, 0)` (mirrors `getDailyNoteTimestamp`; never ISO-string parse: UTC off-by-one). No writes, no `processFrontMatter`, no mutation of any note.

## Testing Strategy

No test runner; verification = lint + typecheck + build + manual checklist in a test vault.

| Layer | What to Test | Approach |
|---|---|---|
| Manual | Defaults identical; property date → day/week/dash/sort placement; label date-only | vault scenarios |
| Manual | Missing / invalid / non-scalar / empty name → ctime everywhere | vault scenarios |
| Manual | Datetime value → date part only; label shows no time | vault scenario |
| Manual | Refresh = no writes; double-tap note without injected frontmatter | vault + console |
| Static | lint + `tsc --noEmit` + `npm run production` clean | commands |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration. OFF by default; rollback = revert commit (leftover `data.json` keys ignored by normalizers).

## Open Questions

- [ ] Confirm D6: "Sort uses resolved dates" is read as "date-sort always uses the resolver; property dates apply only when `note-property` is selected" — non-blocking; the design implements this reading.