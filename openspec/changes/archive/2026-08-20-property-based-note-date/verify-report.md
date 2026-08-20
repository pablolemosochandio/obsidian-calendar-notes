```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:08d4cfb1d40e4d7bed7a8243e6932a8007bbed83997b193da2a651ba6dd3f536
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 5/5
scenarios: 14/14
test_command: npm run lint
test_exit_code: 0
test_output_hash: sha256:0bd8434514413f859f3b9ff015f154c10a0671d3d35100ab7fc36b4750af09c4
build_command: npm run production
build_exit_code: 0
build_output_hash: sha256:a9105e234336b34dc1a214e6f8a5262adfd85f7a073927c7f1698d77ae35b81e
```

## Verification Report

**Change**: property-based-note-date
**Version**: N/A (no versioned spec)
**Mode**: Standard (Strict TDD disabled — no test runner in this repo; verification = lint + typecheck + build + evidence review per AGENTS.md)

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 16 |
| Tasks complete | 16 |
| Tasks incomplete | 0 |

All 16 tasks `[x]` (1.1–3.6 + manual checklist 4.2–4.6). Manual items 4.2–4.6 were confirmed by the user in a real Obsidian vault (see notes on 4.3/4.5 re ISO `YYYY-MM-DD` alignment — documented restriction DEVELOPMENT.md §4.1.1).

### Build & Tests Execution

**Lint** (`npm run lint`): ✅ Passed (exit 0)
```text
> notes-calendar@1.0.2 lint
> eslint .
```
Output hash: `sha256:0bd8434514413f859f3b9ff015f154c10a0671d3d35100ab7fc36b4750af09c4`

**Typecheck** (`npx tsc --noEmit`): ⚠️ Exit 2 — exactly the 3 PRE-EXISTING baseline errors (out of scope; zero new errors from this change)
```text
src/views/calendar-view.ts(84,60): error TS2345: Argument of type 'Timeout' is not assignable to parameter of type 'number'.
src/views/calendar-view.ts(85,4): error TS2322: Type 'number' is not assignable to type 'Timeout'.
src/views/calendar-view.ts(97,78): error TS2345: Argument of type 'Timeout' is not assignable to parameter of type 'number'.
```
Output hash: `sha256:b11e3be9761c30d9875ee5d0dba9bf6309b518c7cf500f7a684f2389b1122177`
Attribution: the changed hunks in `calendar-view.ts` are at L1, L561-570, L634-645, L657-660, L675-684 — none touch L84-85/L97 (modify-debounce timer, `@types/node` v22 vs DOM `Window.setTimeout`). Matches the pre-change baseline recorded in apply-progress. Fix decision belongs to the user (separate change).

**Build** (`npm run production`): ✅ Passed (exit 0) — `main.js` (51,195 B), `manifest.json`, `styles.css` emitted into `build/`
```text
> notes-calendar@1.0.2 production
> node esbuild.config.mjs production
```
Output hash: `sha256:a9105e234336b34dc1a214e6f8a5262adfd85f7a073927c7f1698d77ae35b81e`

**Tests**: ➖ No test runner in this repo (project convention). Spec scenarios are covered by (a) static code evidence, (b) the user-confirmed manual vault checklist 4.2–4.6, and (c) the apply-phase external runtime smoke harness (esbuild bundle + real moment) which passed 14/14 spec scenarios (recorded in engram #116; not persisted in-repo).

### Spec Compliance Matrix
| Requirement | Scenario | Evidence | Result |
|-------------|----------|----------|--------|
| REQ-01 Configurable date source setting | Default stays backward compatible | `DEFAULT_SETTINGS.noteSortBy='creation-time'`; selector `.setValue(noteSortBy)`; manual 4.2 | ✅ COMPLIANT |
| REQ-01 | Fields shown conditionally | `noteDateSection` + `setSectionVisibility` in `display()` (settings.ts L239) and dropdown `onChange` (L207); `.is-hidden` CSS exists (styles.css L17) | ✅ COMPLIANT |
| REQ-01 | Empty property name is OFF | `note-date.ts` L26-27: active iff `noteSortBy==='note-property' && trim()!==''`; manual 4.4 | ✅ COMPLIANT |
| REQ-02 Note date resolution with ctime fallback | Valid property value | `note-date.ts` L32-38: strict `moment(value.trim(), format, true)` → `new Date(y, m, d, 12, 0, 0)`; manual 4.3 | ✅ COMPLIANT |
| REQ-02 | Missing property | `getFileCache(file)?.frontmatter?.[prop]` optional chain → fallback L43; manual 4.4 | ✅ COMPLIANT |
| REQ-02 | Unparseable value | strict parse rejects `99-99-9999` (`parsed.isValid()` false) → ctime; manual 4.4 | ✅ COMPLIANT |
| REQ-02 | Non-scalar value | `typeof value === 'string'` guard (L31) → array/object → ctime; manual 4.4 | ✅ COMPLIANT |
| REQ-03 Date components only | Datetime uses date part only | `new Date(parsed.year(), parsed.month(), parsed.date(), 12, 0, 0)` — hour/minute/second excluded; manual 4.5 | ✅ COMPLIANT |
| REQ-04 Consistent application across date sites | Week matching | `isNoteCreatedInWeek` L682-685 via `resolveNoteDate`; manual 4.3 | ✅ COMPLIANT |
| REQ-04 | Dash counts | `buildNoteCountMap` L657-660 via `resolveNoteDate`; manual 4.3 | ✅ COMPLIANT |
| REQ-04 | Sort uses resolved dates | `sortNotes` L639-646 compares `resolveNoteDate().date`, then name, then ctime (L648-653); manual 4.3 | ✅ COMPLIANT |
| REQ-04 | Label shows resolved date | `fromProperty → formatDateTime(date, 'YYYY-MM-DD')` L566-570 — no time part; manual 4.3/4.5 | ✅ COMPLIANT |
| REQ-05 Read-only guarantee | Property is only read | `note-date.ts` reads only `metadataCache.getFileCache`; grep of `src/` shows no `processFrontMatter`/`vault.modify`/`vault.process`/write API; manual 4.6 | ✅ COMPLIANT |
| REQ-05 | Daily-note creation mutation-free | `openOrCreateDailyNoteForDate` untouched by diff (creates via `vault.create` with rendered template only, no frontmatter injection); manual 4.6 | ✅ COMPLIANT |

**Compliance summary**: 14/14 scenarios compliant (static evidence + user-confirmed manual verification; no in-repo automated tests by project convention).

### Correctness (Static Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| Configurable date source setting | ✅ Implemented | `NoteSortBy` 3rd value; 2 new settings + defaults + normalizers; dropdown option; nested section with property/format inputs; visibility on render + onChange |
| Note date resolution with ctime fallback | ✅ Implemented | Pure `resolveNoteDate` in `src/note-date.ts`; scalar-string-only, trimmed, strict moment parse; local-midday `new Date(y, m, d, 12, 0, 0)`; else ctime |
| Date components only | ✅ Implemented | Only `year()/month()/date()` used; no ISO-string parse (UTC off-by-one avoided) |
| Consistent application across date sites | ✅ Implemented | All 5 ctime sites routed: label, sort, dash map, day match, week match |
| Read-only guarantee | ✅ Implemented | No mutation APIs anywhere in the change; hard constraint verified by grep |

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| D1 Settings model — extend `noteSortBy` + two property settings | ✅ Yes | `note-property` value; `noteDateProperty` (''=OFF); `noteDatePropertyFormat` ('DD-MM-YYYY'); active iff selector + non-empty trimmed name |
| D2 Time label `YYYY-MM-DD` when `fromProperty` | ✅ Yes | `formatDateTime(resolved.date, 'YYYY-MM-DD')`; `ResolvedNoteDate` carries `fromProperty` — no second cache read |
| D3 Settings UI — nested-section reveal | ✅ Yes | `noteDateSection` clones `timeFormatSection` pattern; placeholders `date`/`DD-MM-YYYY`; desc "Empty disables the property source."; live-preview desc; sentence-case labels |
| D4 `resolveNoteDate` in pure module `src/note-date.ts` | ✅ Yes | New 43-line module; contract matches Interfaces/Contracts exactly |
| D5 metadataCache listener out of scope | ✅ Yes | No new listener added; ctime fallback + existing 400 ms `modify` debounce refresh |
| D6 Sort comparator interpretation | ✅ Yes | Date-sort compares resolver date, then name, then ctime; `name` sort skips date branch; property dates apply only under `note-property` |

### Issues Found
**CRITICAL**: None.

**WARNING**:
1. Pre-existing tsc baseline (out of scope): `npx tsc --noEmit` exits 2 with 3 `Timeout`/`number` errors at `calendar-view.ts` L84:60, L85:4, L97:78 (modify-debounce timer; `@types/node` v22 vs DOM `Window.setTimeout`). Not introduced by this change — the diff does not touch those lines, and the baseline matches apply-progress records. Zero new type errors. Fix decision belongs to the user.
2. Commit hygiene / review budget: the working tree carries out-of-scope uncommitted content next to the feature — `DEVELOPMENT.md` grew +367 lines of which only §4.1.1 (~12 lines) belongs to this change (sections 2/3/4 are pre-existing exploratory analysis), and `.gitignore` +25 lines (logs/cache/macOS/editor ignores). The feature delta itself is ~144 tracked lines + the 43-line new module + 47-line `AGENTS.md`, consistent with the ~150-line forecast; but if the unrelated content is swept into the 3 work-unit commits / single PR, the diff would exceed the 400-line review budget. Recommend committing unrelated docs/ignore changes as a separate chore/docs commit.
3. Scenario coverage rests on manual verification (project convention — no test runner, Strict TDD disabled) plus the apply-phase external smoke harness (14/14, recorded in engram only, not persisted in-repo). No in-repo automated regression guard protects the resolver contract.

**SUGGESTION**:
1. `settings.ts` L203-208: the dropdown `onChange` closure references `noteDateSection` before its `const` declaration (L211). Runtime-safe (the callback executes only after `display()` completes), but hoisting the section above the dropdown would remove a temporal-dead-zone reading trap for future editors.
2. Consider a minimal in-repo test harness (e.g. vitest) for the pure `resolveNoteDate` — the 14 spec scenarios currently depend on manual checks; the resolver is trivially unit-testable and would make the contract regression-safe.
3. `buildDateFormatDesc` previews through the custom `formatDateTime` tokenizer, which supports only a subset of moment tokens — formats with unsupported tokens (e.g. `ddd`) render raw in the preview. Cosmetic only; strict moment parsing still governs resolution.

### Verdict
**PASS WITH WARNINGS** — implementation matches spec (14/14 scenarios), design (6/6 decisions), and tasks (16/16); lint and production build clean; the only failing check is the pre-existing tsc baseline outside this change's scope, plus commit-hygiene and no-automated-tests caveats.