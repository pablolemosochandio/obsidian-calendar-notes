# Proposal: Show Note Tags in Filtered Notes

## Intent

Filtered notes in the calendar list show only name, time, and excerpt. A user must open a note to see its tags. Append each note's frontmatter `tags` as visually distinct chips (tag icon + accent color) at the end of the note preview.

## Scope

### In Scope
- Render frontmatter `tags` values as chips at the end of each filtered note.
- Show **only** frontmatter `tags`; inline `#tag` is NOT shown as a chip.
- Strip inline `#tag` from the excerpt text (no loose `#word` in the body).
- Add a `showTags` settings toggle (default `true`), mirroring `showExcerpt`/`showTime`.
- Render the tag row even when a note has no tags (keeps vertical alignment).

### Out of Scope
- Inline `#tag` rendered as chips.
- Any click/interaction on chips (visual only).
- Writing/modifying tags (read-only).
- Per-tag custom colors (theme variables only).

## Capabilities

> Contract for `sdd-spec`. Research `openspec/specs/` before editing.

### New Capabilities
- `note-tag-display`: render a note's frontmatter tags as read-only, styled chips in the filtered-notes list, with a `showTags` toggle and excerpt inline-tag stripping.

### Modified Capabilities
- None (`note-date-source` spec is unaffected).

## Approach

- In `updateNotesList` (`src/views/calendar-view.ts`), after the excerpt div, create a `calendar-note-tag-row`. Read tags from `app.metadataCache.getFileCache(note)?.frontmatter?.tags` (normalize scalar → `string[]`), mirroring the read-only metadata-cache pattern in `src/note-date.ts`. Deliberately excludes `CachedMetadata.tags` (inline) — unlike `getAllTags`, which merges both.
- Per tag: `createSpan('calendar-note-tag')` then `setIcon(span, 'tag')` + `setText(tag)`.
- Empty-row rule: always create the row container (even zero tags) for alignment.
- Excerpt: add inline-tag stripping to `createExcerptText` (regex `#[\w/-]+`) so inline tags don't duplicate in the body.
- CSS: `.calendar-note-tag` using Obsidian `--tag-*` variables (fallback `--text-accent` / `--background-secondary`); `.calendar-note-tag-row` for spacing; mobile overrides via `body.is-mobile`.
- Settings: `showTags: boolean` (default `true`) + normalizer + settings-tab toggle wired to `saveSettings()` + `refreshCalendarView()`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/views/calendar-view.ts` | Modified | `updateNotesList` tag row; `createExcerptText` inline-tag strip |
| `src/settings.ts` | Modified | `showTags` field, default, normalizer, settings-tab toggle |
| `src/styles.css` | Modified | `.calendar-note-tag`, `.calendar-note-tag-row` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inline tags leak into excerpt as loose text | High (if unstripped) | Strip `#[\w/-]+` in `createExcerptText` |
| frontmatter `tags` may be scalar or array | Med | Normalize scalar → array before iterating |
| Theme `--tag-*` variables missing | Low | Fallback to `--text-accent` / `--background-secondary` |
| Stale metadata cache | Low | Existing `modify` refresh (400 ms debounce) |

## Rollback Plan

Set `showTags` off (or restore prior default) to hide chips. Code is isolated to `calendar-view.ts`, `settings.ts`, `styles.css`; revert is a clean diff with no data written.

## Dependencies

- None. Reuses existing `setIcon`, metadata cache, and settings patterns.

## Success Criteria

- [ ] Frontmatter tags render as icon + colored chips at the end of each filtered note.
- [ ] Inline `#tag` appears neither in excerpt text nor as a chip.
- [ ] `showTags` toggle shows/hides the row; empty rows preserve alignment.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.
