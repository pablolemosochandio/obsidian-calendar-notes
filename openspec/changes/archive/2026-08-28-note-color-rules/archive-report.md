# Archive Report: note-color-rules

**Verdict: ARCHIVED — cycle complete.** The `note-color-rules` change (per-note accent-bar coloring via ordered frontmatter/tag rules) shipped: 13/13 tasks implemented in the uncommitted working tree, verification PASS with zero CRITICAL/WARNING findings, delta spec synced into the source of truth, and the change folder archived under `openspec/changes/archive/2026-08-28-note-color-rules/`.

## Final State at Close

| Field | Value | Source |
|-------|-------|--------|
| Verification verdict | PASS | `verify-report` envelope (validator-admitted, `valid: true`) |
| Findings | 0 CRITICAL / 0 WARNING / 4 SUGGESTION | `verify-report` |
| Scenarios | 16/16 (9 COMPLIANT, 7 PARTIAL inspection-verified) | `verify-report` |
| Requirements | 8/8 | `verify-report` |
| Tasks | 13/13 complete, 0 unchecked | `tasks.md` (persisted artifact) |
| tsc / lint / production | exit 0 / 0 errors 0 warnings / exit 0 | re-executed at verify time |
| Runtime harness | 44/44 assertions (independent, verify-time) | `verify-report` |
| Working tree | uncommitted on `main` @ `fef03f7` | `verify-report` |
| Files | 4 modified (`src/main.ts`, `src/settings.ts`, `src/styles.css`, `src/views/calendar-view.ts`) + 1 new (`src/note-rules.ts`) | orchestrator final-state facts |
| Authored diff | 408 lines | `apply-progress` (contingency TRIGGERED) |
| Delivery | No commits / branches / PRs created | orchestrator final-state facts |

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| note-color-rules | Created | Main spec did not exist; delta spec treated as full spec and copied byte-identically to `openspec/specs/note-color-rules/spec.md` (4297 bytes). No ADDED/MODIFIED/REMOVED/RENAMED sections — pure addition, no existing requirements touched. |

No destructive merge — `config.yaml` `rules.archive` warning not applicable.

## Archive Contents (all present, byte-identical to pre-move snapshot)

- exploration.md ✅
- proposal.md ✅
- specs/note-color-rules/spec.md ✅
- design.md ✅
- tasks.md ✅ (13/13 checked; no unchecked implementation tasks)
- apply-progress.md ✅
- verify-report.md ✅
- archive-report.md ✅ (this file — additive-only, written after the move)

## Delivery State (recorded, not executed)

Contingency triggered: 408 authored lines exceed the ~400 budget. Split recorded in `apply-progress.md`:

- **PR 1** — Phases 1–2 (~200 lines): settings model + normalizers + wiring, pure evaluator, per-row CSS vars, fallback chains. Stands alone.
- **PR 2** — Phase 3 + Phase 4 verification (~198 lines): settings-tab UI section + `calendar-rule-*` CSS. Stacked on PR 1.

Chain strategy: `stacked-to-main` (each slice lands independently). Delivery orchestration (commits/PRs) is the orchestrator's responsibility — none created by this phase.

## Resolved Product Decisions (user-confirmed)

1. Text-literal matching: date-shaped strings match; non-string scalars never; no heuristics.
2. Tag rules match frontmatter `tags` only; inline body `#tags` ignored.
3. Frontmatter key case-insensitive; value case-sensitive; tag key/value case-sensitive.
4. Sentinel default color follows theme accent until user picks; stored color then wins.
5. First match wins.
6. Rendering scope: `border-left` only; hover tint preserved via `color-mix`.
7. Reorder allowed (up/down).
8. Incomplete-rule save blocked (central `saveSettings()` filter + load normalizer).
9. Duplicates allowed with "Never applies — earlier rule #N" warning (matching-semantics detection).
10. Default color configurable (swatch + native picker + Reset-to-sentinel).

## Non-Blocking Follow-ups (for later, not blockers)

1. Live-vault confirmation of the 7 PARTIAL UI scenarios (explicit-pick visual, hover tint, incomplete feedback, duplicate warning, reorder UX, mobile wrap, mobile rendering).
2. Optional: handle rule keys with a leading `#` (SUGGESTION #3 — spec silent; strip during normalization if desired).
3. `package.json` `repository`/`homepage` still point at stale `tcatlas/ObsidianCalendar` — known, intentionally out of scope.

## Traceability

Engram observations read in full (never previews) for this archive: explore #175, proposal #177, spec #178, design #179, tasks #181, apply-progress #182, verify-report #183. Archive report persisted as Engram topic `sdd/note-color-rules/archive-report`.

## Mechanical Copy Verification (mandatory `diff -r` readback)

**Spec sync** — `diff -r openspec/changes/note-color-rules/specs/note-color-rules/spec.md <temp>` → status 0, empty output (byte-identical copy; then atomically renamed to `openspec/specs/note-color-rules/spec.md`).

**Archive move** — `diff -r <pre-move snapshot>/source openspec/changes/archive/2026-08-28-note-color-rules` → status 0, empty output (byte-identical tree; source verified gone before comparison).

Empty diff output is the only passing evidence per the mechanical-copy contract. Both copies were performed with `cp`/`mv` shell primitives — no artifact content passed through a model Read/Write path.

## SDD Cycle Complete

The change has been planned, implemented, verified, and archived. Ready for the next change.
