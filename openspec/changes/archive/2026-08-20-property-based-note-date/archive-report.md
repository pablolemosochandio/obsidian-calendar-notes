# Archive Report: property-based-note-date

**Archived**: 2026-08-20
**Status**: success — SDD cycle complete
**Artifact store mode**: hybrid (openspec + engram, project "obsidian-calendar")

## Gates

- **Task Completion Gate**: PASSED — `tasks.md` 16/16 tasks `[x]` (1.1–3.6 implementation + 4.1 static + manual checklist 4.2–4.6 user-confirmed in a real Obsidian vault). No unchecked implementation tasks.
- **Native Review Receipt Gate**: `reviewGate` structurally absent — no review was ever discovered for this candidate (no `reviews/` artifacts exist for it). Archive proceeded under ordinary repository policy.
- **CRITICAL findings**: 0 — `verify-report.md` records `critical_findings: 0`, `blockers: 0`, verdict `pass_with_warnings`.

## Final State (at close)

- Implementation complete: `src/note-date.ts` (new pure resolver `resolveNoteDate` + `ResolvedNoteDate`), `src/settings.ts` (`note-property` selector value + `noteDateProperty`/`noteDatePropertyFormat` settings + nested UI section), `src/main.ts` (normalizers in `loadSettings()`), `src/views/calendar-view.ts` (all 5 ctime sites routed: label, sort, dash map, day match, week match), `AGENTS.md` (domain rule amended).
- Manual checklist 4.2–4.6 confirmed by the user in a real Obsidian vault; ISO-format nuance recorded on 4.3/4.5: the vault stores Date properties as ISO 8601 and the plugin filter is aligned to `YYYY-MM-DD` — documented in DEVELOPMENT.md §4.1.1 ("Fuente de fecha por propiedad (Note property) — restricción de formato ISO"). Do not convert the vault.
- Runtime ledger: sdd-attempt verify attempt settled `state: complete` (outcome passed, evidence sha256 of HEAD). The change is runtime-settled.
- No commits made — the user commits manually (3 planned work-unit commits; the working tree also contains out-of-scope DEVELOPMENT.md exploratory sections and .gitignore changes the user will separate). This does not block archive; archive closes the change at the artifact level.

## Spec Sync

| Domain | Action | Details |
|--------|--------|---------|
| note-date-source | Created (new main spec) | `openspec/specs/note-date-source/spec.md` — 5 requirements, 14 scenarios; byte-identical mechanical copy of the delta spec (verbatim `diff -r` empty) |

No MODIFIED/REMOVED/RENAMED requirements — no prior main spec existed (`openspec/specs/` was empty).

## Archive Move

- `openspec/changes/property-based-note-date/` → `openspec/changes/archive/2026-08-20-property-based-note-date/` (plain `mv`; `openspec/` untracked in git)
- Mechanical readback: `diff -r` of pre-move recursive snapshot vs archived tree → empty (byte-identical, only passing evidence)
- Archived artifacts: `proposal.md`, `specs/note-date-source/spec.md`, `design.md`, `tasks.md` (16/16 `[x]`), `verify-report.md`, plus this additive `archive-report.md`
- Active changes directory no longer contains this change.

## Verify Report Summary (per verify-report.md, 2026-08-20)

- Verdict: PASS WITH WARNINGS; requirements 5/5; scenarios 14/14; `npm run lint` exit 0; `npm run production` exit 0.
- Warnings carried forward (non-blocking): pre-existing tsc baseline (`npx tsc --noEmit` exits 2 with 3 `Timeout`/`number` errors at calendar-view.ts L84:60, L85:4, L97:78 — out of scope, zero new errors from this change; fix decision belongs to the user); commit hygiene (out-of-scope working-tree content next to the feature — user separates); no in-repo automated regression guard (project convention: no test runner).
- Suggestions (non-blocking): TDZ reading trap in settings.ts dropdown `onChange` referencing `noteDateSection` before its `const`; optional vitest harness for pure `resolveNoteDate`; `buildDateFormatDesc` preview tokenizer subset limitation (cosmetic).

## Traceability — Engram observations read

- #116 `sdd/property-based-note-date/apply-progress` (architecture, 2026-08-20 19:53:21)
- #119 `sdd/property-based-note-date/verify-report` (architecture, 2026-08-20 21:58:46)

## Intentional Modifications

None. No partial archive, no stale-checkbox reconciliation, no destructive merge (new main spec creation only).