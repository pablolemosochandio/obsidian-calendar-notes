# Design: Spanish Localization (i18n)

## Technical Approach

Introduce a dependency-free `src/i18n/` module with two typed locale dictionaries and a `t(key, params?)` resolver. A `language: 'en' | 'es'` setting (default `'es'`) selects the active dictionary. Every user-visible string in `calendar-view.ts`, `settings.ts`, and `main.ts` is routed through `t()`. Active language is module-level state set at load and on dropdown change; `formatDateTime()` reads meridiem strings from the dictionary. No new npm packages; fits the existing single esbuild bundle (CJS, ES6).

## Architecture Decisions

### Decision: Module-level language state (not parameter threading)

| option | tradeoff | decision |
|---|---|---|
| Thread `language` into every `t()`/`formatDateTime()` call | exact, but touches ~90 call sites | rejected |
| Singleton `currentLanguage` + `setLanguage()` in i18n | minimal diff; set at 3 points | **chosen** |
| i18n reads `PluginSettings` directly | pulls settings into i18n → import-cycle risk | rejected |

`t()` and `formatDateTime()` read `currentLanguage`. It is set in `loadSettings()`, in the dropdown handler, and re-set when the settings tab re-renders. Command/ribbon labels registered at load are an accepted reload-only consequence (documented in the setting description).

### Decision: `es.ts` typed `satisfies Record<TranslationKey, string>`

| option | tradeoff | decision |
|---|---|---|
| Untyped `es` | missing keys silent | rejected |
| `es: Record<TranslationKey,string>` | `tsc` errors on missing **and** extra keys | **chosen** |
| runtime validation | no compile-time guarantee | rejected |

`TranslationKey` derives from `const en = {...} as const`. `npx tsc --noEmit` is the "test" that both dictionaries agree.

### Decision: `formatDateTime()` localizes only meridiems

| option | tradeoff | decision |
|---|---|---|
| Full token-formatter rewrite | scope creep, regression risk | rejected |
| Replace `AM`/`PM` literals with `t('meridiem_am')`/`t('meridiem_pm')` | 2-line change; `aa`/`a` tokens preserved | **chosen** |
| moment locale switch | new behavior/dependency | rejected |

## Data Flow

```
loadSettings() ─ setLanguage(lang) ──► t() renders calendar + command/ribbon
                                            ▲
language dropdown ─ normalize ─ saveSettings ─ refreshCalendarView
                              │                   │
                              ▼                   ▼
                        setLanguage(lang)   view.refresh() → t()
                              │
                              └── settings tab this.display() re-render
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/i18n/en.ts` | Create | `const en = {...} as const` + `export type TranslationKey` |
| `src/i18n/es.ts` | Create | `const es = {...} satisfies Record<TranslationKey,string>` |
| `src/i18n/index.ts` | Create | `Language`, `currentLanguage`, `setLanguage`, `getLanguage`, `t()` |
| `src/settings.ts` | Modify | `language` field + default + normalizer; dropdown; localized labels; meridiem |
| `src/views/calendar-view.ts` | Modify | import `t`; route strings + month/weekday arrays through `t()` |
| `src/main.ts` | Modify | `setLanguage` in `loadSettings`; `t()` for command/ribbon/tab title |

## Interfaces / Contracts

```ts
// en.ts — source of truth for the key set
export const en = {
  today: 'Today', today_aria: 'Go to today', calendar: 'Calendar',
  months: ['January', /*…*/ 'December'], monthsShort: ['Jan', /*…*/ 'Dec'],
  weekdays: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  meridiem_am: 'AM', meridiem_pm: 'PM',
  /* … all UI labels/descs/notices … */
} as const;
export type TranslationKey = keyof typeof en;

// es.ts — compile-checked against en
import type { TranslationKey } from './en';
export const es = { today: 'Hoy', /* … */ } satisfies Record<TranslationKey, string>;

// index.ts
export type Language = 'en' | 'es';
export function setLanguage(l: Language): void;
export function getLanguage(): Language;
export function t(key: string, params?: Record<string, string|number>): string;
// lookup: es[key] ?? en[key] ?? key; then value.replace(/\{(\w+)\}/g, …) — never throws

// settings.ts
import type { Language } from './i18n';
export function normalizeLanguage(value: string): Language; // value === 'en' ? 'en' : 'es'
interface CalendarPluginSettings { language: Language; /* … */ }
```

`t()` accepts a plain `string` key so a missing key returns the raw key string (spec requirement), while compile-time coverage is enforced at the dictionary boundary (es `satisfies` en shape). Import graph is acyclic: `en` ← `es` (type only) ← `index` ← `settings`/`calendar-view`/`main`.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Static | `es.ts` covers every `en` key | `Record<TranslationKey,string>` → `npx tsc --noEmit` fails on gaps |
| Static | no type/lint errors | `npx tsc --noEmit`, `npm run lint` |
| Manual | fresh install = Spanish; live switch; meridiem; command/ribbon labels | Obsidian smoke test (repo has no test runner) |
| Build | bundle integrity | `npm run production` |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No data migration. Missing/unknown `language` normalizes to `'es'` on load, so existing users switch to Spanish once (accepted product decision; one dropdown returns to English). Single-commit revert documented in the proposal.

## Open Questions

- [ ] Quarter prefix: keep `Q{n}` for ES, or localize to `T{n}` (trimestre)?
- [ ] Settings tab live re-render via `this.display()` resets scroll — acceptable vs. re-localize on reopen?
