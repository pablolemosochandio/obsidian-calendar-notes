# Design: Show Note Tags in Filtered Notes

## Technical Approach

Extend the filtered-notes render path (`updateNotesList`) to append a read-only tag-chip row per note, sourced exclusively from frontmatter `tags` via the metadata cache. Inline `#tag` is stripped from the excerpt (never chipped). A `showTags` setting (default `true`) gates the row, mirroring `showExcerpt`/`showTime`. Reuses existing `setIcon`, `app.metadataCache` read pattern (`note-date.ts`), and the settings normalizer + save + refresh wiring. No writes; purely visual.

## Architecture Decisions

### Decision: Read frontmatter only, not `CachedMetadata.tags`

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `getAllTags(file)` | Merges inline + frontmatter — shows inline tags (out of scope) | ✗ |
| `getFileCache(file).frontmatter.tags` | Frontmatter only; matches spec scope; mirrors `note-date.ts` | ✓ |

**Rationale**: Spec requires frontmatter-only. Inline tags belong to `CachedMetadata.tags`, which `getAllTags` merges in — so it must be avoided.

### Decision: Normalize scalar → `string[]` via a small helper

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Assume array | Breaks on scalar `tags: meeting` | ✗ |
| Normalize (`Array.isArray` ? raw : `[raw]`) + `filter(typeof === 'string')` | Handles scalar/array/empty; drops non-strings | ✓ |

**Rationale**: Frontmatter `tags` is `unknown`; Obsidian accepts `tags: meeting` or `tags: [a, b]`. Filtering non-strings avoids rendering `123`/`true`.

### Decision: `appendText` after `setIcon`, not `setText`

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `setIcon` then `setText` | `setText` wipes `innerHTML` → icon lost | ✗ |
| `setIcon(chip,'tag')` + `chip.appendText(tag)` | Icon + text coexist in one span | ✓ |

**Rationale**: Obsidian `setIcon` sets `innerHTML`; `setText` would clobber the SVG. Proposal wording ("setText") is corrected here.

## Data Flow

```
updateNotesList() → per note
  ├─ showTime?      → .calendar-note-time
  ├─                → .calendar-note-name
  ├─ showExcerpt?   → .calendar-note-excerpt (createExcerptText: strip #[\w/-]+)
  └─ showTags?      → .calendar-note-tag-row
                         └─ per frontmatter tag → .calendar-note-tag (setIcon 'tag' + appendText)
```

`getFileCache(note)?.frontmatter?.tags` (scalar→array) → chips. Empty tags still produce an empty `.calendar-note-tag-row`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/views/calendar-view.ts` | Modify | Insert tag-row block in `updateNotesList` (after excerpt, line ~584); add `getFrontmatterTags()`; add `.replace(/#[\w/-]+/g, '')` to `createExcerptText` |
| `src/settings.ts` | Modify | Add `showTags: boolean` to interface + `DEFAULT_SETTINGS` (`true`); add `normalizeShowTags`; add "Show tags" toggle in `CalendarSettingTab` |
| `src/main.ts` | Modify | Import + call `normalizeShowTags` in `loadSettings` |
| `src/styles.css` | Modify | Add `.calendar-note-tag-row`, `.calendar-note-tag`, mobile overrides |

## Interfaces / Contracts

```ts
// settings.ts
showTags: boolean;                       // default true
export function normalizeShowTags(value: unknown): boolean { return value !== false; }

// calendar-view.ts
private getFrontmatterTags(note: TFile): string[] {
    const raw = this.app.metadataCache.getFileCache(note)?.frontmatter?.tags;
    if (raw == null) return [];
    const list = Array.isArray(raw) ? raw : [raw];
    return list.filter((t): t is string => typeof t === 'string');
}
```

Insertion (inside `notes.forEach`, after excerpt block):

```ts
if (this.plugin.settings.showTags) {
    const tagRow = noteItem.createDiv('calendar-note-tag-row');
    for (const tag of this.getFrontmatterTags(note)) {
        const chip = tagRow.createSpan('calendar-note-tag');
        setIcon(chip, 'tag');
        chip.appendText(tag);
    }
}
```

Excerpt regex (insert between heading-strip and markdown-char strip):

```ts
.replace(/#[\w/-]+/g, '')
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Typecheck | New field, normalizer, helper signatures | `npx tsc --noEmit` |
| Lint | No unused vars/explicit-any warnings | `npm run lint` |
| Manual | Scalar/array/empty/inline-only tags; toggle on/off; mobile render | Build via `npm run production`, load in vault |

No test runner exists (per AGENTS.md); verification is lint + typecheck + manual.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Existing `data.json` lacks `showTags`; `DEFAULT_SETTINGS` + `Object.assign` supplies `true`, and `normalizeShowTags` coerces garbage to boolean. Rollback: toggle off or revert the three-file diff (no data written).

## Open Questions

- [ ] Should chips coerce numeric scalars (`tags: 2024`) via `String(t)` rather than dropping them? Current design drops non-strings.
- [ ] Empty-row min-height (visual alignment) — confirm desired value (proposed `14px`) with reviewer.
