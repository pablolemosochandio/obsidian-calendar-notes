# Proposal: Excerpt Markdown Strip and Source-Line Enforcement

## Intent

The filtered-note excerpt leaks raw Markdown (blockquotes, link/wikilink aliases, HTML, list markers, strikethrough, horizontal rules) and the "Excerpt lines" setting is a confirmed no-op. Strip Markdown to clean plain text and make "Excerpt lines" honor the first N source lines.

## Scope

### In Scope
- Strengthen `createExcerptText` to strip: frontmatter, headings, inline `#tag` (keep), `[[A|B]]`→`B`/`[[A]]`→`A`, `[text](url)`→`text`, `>` blockquotes, list markers, `~strike~`, backslash escapes, raw HTML.
- Remove entirely: fenced code blocks (```), horizontal rules (`---`/`***`), images `![](url)`, embeds `![[note]]`.
- Preserve newlines and slice to first `excerptLines` source lines (pass `excerptLines` into `createExcerptText`).
- Fix CSS cascade: drop hard-coded `line-clamp: 2` from `.calendar-note-excerpt`; keep `-lines-*` rules governing.
- Keep `setText` (plain text; no `innerHTML`, no `MarkdownRenderer`).

### Out of Scope
- Full rendering via `MarkdownRenderer`; literal backslash escaping; visual/wrapped-line semantics.
- New runtime dependency; any change to tag chips or the frontmatter tag row.

## Capabilities

> Contract for `sdd-spec`. Researched `openspec/specs/`.

### New Capabilities
- `note-excerpt`: generate the filtered-note excerpt as clean plain text — strip Markdown markers, fenced code, horizontal rules, images/embeds, inline tags — truncated to the first `excerptLines` source lines, rendered via `setText`.

### Modified Capabilities
- `note-tag-display`: delegate excerpt inline-`#tag` stripping to `note-excerpt`; retain "inline tags are never chips" and the separate `.calendar-note-tag-row` unchanged.

## Approach

Surgical regex-sanitizer (synchronous, pure, dependency-free — exploration Approach 1). Preserve newlines (drop the `\s+→' '` collapse; apply per-line), split, slice first N lines. Fix the cascade by removing hard-coded clamp in `.calendar-note-excerpt` so the `-lines-N` class governs. No `MarkdownRenderer`, no new deps.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/views/calendar-view.ts` | Modified | `createExcerptText` (L613–621) regex chain + source-line slice; `populateExcerpt`/`updateNotesList` (L578–584) pass `excerptLines` |
| `src/styles.css` | Modified | `.calendar-note-excerpt` (L501–511) remove hard-coded clamp; `-lines-*` (L89–112) governs |
| `src/settings.ts` | Unchanged | `excerptLines` already defined/normalized |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Regex stripping is partial (tables, footnotes, nested HTML) | Med | Document known limits; don't chase 100% |
| Regress `refreshGeneration` guard or tag-strip order | Med | Preserve guard + frontmatter/heading/tag order |
| CSS specificity recurs | Low | Order new/remaining rules after `.calendar-note-excerpt`; keep `-webkit-` prefix |

## Rollback Plan

`git revert` the change. Code is isolated to `calendar-view.ts` and `styles.css`; no note data is written, so reverting restores prior behavior exactly.

## Dependencies

- None.

## Success Criteria

- [ ] `**bold**`, `[[A|B]]`, `[t](u)`, `>`, `~x~`, list markers, HTML no longer appear in excerpt.
- [ ] Fenced code, `---`/`***`, `![](u)`, `![[n]]` removed; excerpt is plain text only.
- [ ] `excerptLines` setting clamps to N source lines (1–5), not wrapped lines.
- [ ] Inline `#tag` still stripped; frontmatter tags row unchanged.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.
