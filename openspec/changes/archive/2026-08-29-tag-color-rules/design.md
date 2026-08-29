# Design: Tag Color Rules — Full-Name Value with Wildcards

## Technical Approach

Two-file change. `src/note-rules.ts` replaces prefix/subtag tag matching with an anchored, case-sensitive wildcard RegExp compiled from `value` (`*` → `.*`, everything else escaped). `src/settings.ts` adds a one-way idempotent migration in `normalizeNoteColorRules`, per-type completeness, and value-only tag rows in the settings UI. Frontmatter matching, first-match-wins, default color, and the public `evaluateNoteColor` signature are untouched; `main.ts`, `calendar-view.ts`, `styles.css` unchanged. Implements the MODIFIED delta requirements: Tag matching, Rules settings UI, Migration and wiring.

## Architecture Decisions

| # | Option A | Option B | Decision |
|---|----------|----------|----------|
| 1. Pattern compile | Per-call `new RegExp` — stateless, trivial | Memoized `Map<value, RegExp>` — saves microseconds, adds cache state/invalidation | **A.** Rule counts are tiny (user-entered); no measurable gain justifies cache complexity (karpathy: no speculative abstraction). |
| 2. `evaluateNoteColor` guard | Per-type guard: `key` required only for frontmatter; tag ignores `key` entirely | Keep shared `if (!key \|\| !value) continue` | **A.** Shared guard skips ALL migrated tag rules (`key === ''`) — the CRITICAL TRAP. Exact change in Interfaces. |
| 3. Migration location | In `normalizeNoteColorRules` at load (one-way) | In `saveSettings` | **A.** Spec requires legacy vaults match correctly on first render without user action; idempotent via empty-key passthrough. |
| 4. Type-change UI update | Rebuild all rows via `renderRuleRows` | Surgically toggle key input visibility in place | **A.** Rebuild also refreshes feedback/duplicate warnings and matches the existing reorder/remove pattern; simpler, fewer DOM paths. |

## Data Flow

```
data.json ─load─→ normalizeNoteColorRules (migrate legacy tag: key+'/'+value, key='')
                      └─→ settings.noteColorRules (in-memory, ordered)
calendar-view refresh ─→ evaluateNoteColor(rules, note, app)  [signature unchanged]
                      └─→ metadataCache.getFileCache(note).frontmatter  (READ-ONLY)
                            ├─ frontmatter rule: key case-insensitive, value exact
                            └─ tag rule: raw tags #-stripped → anchored wildcard test
                      ─→ color | null (null ⇒ default accent)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/note-rules.ts` | Modify | `matchesFrontmatterTag(rawTags, value)` full-name wildcard match; drop `key` param; new private `compileTagPattern`; per-type guard in `evaluateNoteColor` |
| `src/settings.ts` | Modify | Tag migration in `normalizeNoteColorRules`; `isCompleteNoteColorRule` per-type; `renderRuleRow` hides key for tag, tag placeholder, rebuild on type change; `buildRuleFeedback` per-type; `findEarlierMatchingRule` tag branch compares normalized value only |

## Interfaces / Contracts

No public API changes. Non-obvious patterns only:

```ts
// note-rules.ts — guard change (key only for frontmatter; tag ignores key):
for (const rule of rules) {
    const value = rule.value.trim();
    if (!value) continue;
    if (rule.type === 'frontmatter') {
        const key = normalizeNoteColorRuleKey(rule.type, rule.key);
        if (!key || !matchesFrontmatterValue(frontmatter, key, value)) continue;
        return rule.color;
    }
    if (matchesFrontmatterTag(frontmatter.tags, value)) return rule.color;
}

// compile: escape metachars except * → .* ; anchored ^…$ ; case-sensitive
function compileTagPattern(value: string): RegExp {
    const normalized = normalizeNoteColorRuleKey('tag', value); // trim + strip leading #
    const escaped = normalized.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp('^' + escaped + '$');
}
```

```ts
// settings.ts — migration inside normalizeNoteColorRules (after computing
// normalizedKey, ruleValue, color as today):
if (candidate.type === 'tag') {
    if (!ruleValue || !color) continue;              // key optional for tag
    if (normalizedKey) ruleValue = `${normalizedKey}/${ruleValue}`; // legacy merge
    rules.push({ type: 'tag', key: '', value: ruleValue, color });  // idempotent
} else {
    if (!normalizedKey || !ruleValue || !color) continue; // frontmatter unchanged
    rules.push({ type: 'frontmatter', key: normalizedKey, value: ruleValue, color });
}
```

`isCompleteNoteColorRule`: type valid + `value` non-empty + `color` hex; frontmatter additionally requires non-empty trimmed `key`; tag skips the key check. Consistent with the `saveSettings` filter (`main.ts:84`) and the load normalizer — `main.ts` itself needs no edit.

`findEarlierMatchingRule`: frontmatter branch unchanged (key case-insensitive + exact value); tag branch drops the key comparison and compares `normalizeNoteColorRuleKey('tag', earlier.value)` vs the rule's normalized value (exact equality). Overlapping wildcards are NOT detected — documented limitation (spec).

`renderRuleRow`: conditionally skip `row.addText` for key when `type === 'tag'`; tag value placeholder `tag name (wildcards: *)`; dropdown onChange sets `rule.type`, then calls `this.renderRuleRows(rulesContainer)` + `saveSettings()` + `refreshCalendarView()` instead of `commitRuleRowEdit`. `buildRuleFeedback`: incomplete message `'Key and value are required'` (frontmatter) / `'Value is required'` (tag).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Static | Type + lint + build | `npx tsc --noEmit`, `npm run lint`, `npm run production` (no test runner exists) |
| Manual (spec scenarios) | All 9 tag-match + 4 migration + 7 UI delta scenarios | Walkthrough in Obsidian: exact/no-nesting/breadth/greedy/wildcard-only/untagged/case/hash/inline; legacy vault `area/proyecto` → matches; empty-key tag rules persist and color |
| Regression | Frontmatter matching, hover tint, read-only | Confirm `evaluateNoteColor` behavior for existing frontmatter rules via manual vault; no write events |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. (Regex input is local user config; compiled patterns are anchored and evaluated against own-vault tag strings only.)

## Migration / Rollout

One-way, documented: legacy tag rules merge `key + '/' + value` into `value` at load; already-migrated rules (empty key) pass through unchanged, so reloads never double-prefix. Rollback = revert commit + re-release `build/`: the old normalizer drops empty-key rules, so colors fall back to default — no data loss, no corruption.

## Open Questions

None.
