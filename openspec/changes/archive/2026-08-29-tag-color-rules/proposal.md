# Proposal: Tag Color Rules — Full-Name Value with Wildcards

## Intent

Tag rules match prefix `key` + first subtag `value`; deeper tags implicitly match. Users cannot target the FULL tag name (`sistemas/reunion`) nor patterns like `*/reunion`. New: `value` holds the full tag name with `*` wildcards; `key` hidden for tag rules.

## Scope

### In Scope
- `src/note-rules.ts`: full-name wildcard matching for tag rules; `evaluateNoteColor` signature unchanged
- `src/settings.ts`: migration of persisted tag rules; tag completeness = value only; hide key input for tag rows; rebuild row on type change; duplicate detection by value pattern
- Later phase: MODIFIED delta on `openspec/specs/note-color-rules/spec.md` (Tag matching, Rules settings UI, Migration)

### Out of Scope
- `main.ts`, `calendar-view.ts`, `styles.css` untouched
- Frontmatter matching, first-match-wins, default color unchanged
- Literal-`*` escape; `?`; wildcard-overlap duplicate detection

## Product Decisions (final, from user)

1. `sistemas` matches ONLY tag `sistemas`; nested breadth via `sistemas/*`. 2. Wildcards: `*` only, no escape in v1. 3. `*` crosses `/` (greedy): `*/reunion` matches `a/b/reunion`. 4. Case-sensitive. 5. Migrate legacy rules: `value = key + '/' + value`, `key = ''`; accept that legacy rules stop coloring deeper tags. 6. Wildcard-only `*` accepted: colors any note with ≥1 frontmatter tag; untagged use default.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `note-color-rules`: "Tag matching" (full-name + wildcard), "Rules settings UI" (value-only rows, per-type feedback, value-based duplicates), "Migration and wiring" (legacy merge).

## Approach

- Matching: compile value → anchored RegExp (`^…$`); escape metachars except `*` → `.*`; case-sensitive. Reuse leading-`#` normalization (28bd9a5) on the value; raw tags pre-stripped at match time.
- Migration in `normalizeNoteColorRules`: tag rule with non-empty key → merge into value, clear key. Key stays in the model (frontmatter needs it); tag evaluation ignores it.
- UI: `renderRuleRow` hides key text for tag; type change rebuilds row; per-type `buildRuleFeedback`; `findEarlierMatchingRule` compares normalized tag value (exact equality). Regexes compiled per call; rule counts tiny.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/note-rules.ts` | Modified | `matchesFrontmatterTag` → full-name wildcard RegExp |
| `src/settings.ts` | Modified | Migration normalizer, completeness, rule row UI, duplicates |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Legacy rules lose deeper-nested matching | Certain (by design) | Deterministic merge; breadth via `area/proyecto/*`; documented |
| Overlapping wildcard duplicates undetected | Med | Exact-pattern warning only; limitation listed |
| Regex metacharacters typed by users | Low | All escaped except `*` |
| Rollback to old version drops migrated rules | Low | Old normalizer skips empty-key rules; document one-way migration |

## Rollback Plan

Revert commit, re-release prior `build/`. `data.json` migration is one-way: once saved, migrated tag rules have empty keys; the OLD normalizer drops them (colors revert to default; data not lost). Idempotent.

## Dependencies

None external. HEAD 28bd9a5 (leading-`#` normalization) present.

## Success Criteria

- [ ] `sistemas` matches only tag `sistemas`; `sistemas/reunion` only that tag; `sistemas/*` matches subtags; `*/reunion` matches `a/b/reunion`
- [ ] `*` colors any note with ≥1 frontmatter tag; tag rows show value + color only; saving blocks empty-value tag rules
- [ ] Legacy `area`/`proyecto` migrates to value `area/proyecto` and still matches that tag
- [ ] Duplicate tag rules (same value) warn; frontmatter behavior unchanged; lint + typecheck + build pass; matching stays read-only
