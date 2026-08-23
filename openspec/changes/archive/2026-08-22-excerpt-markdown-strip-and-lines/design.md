# Design: Excerpt Markdown Strip and Source-Line Enforcement

## Technical Approach

Surgical, synchronous, pure regex sanitizer replacing `createExcerptText` (calendar-view.ts L613–621) plus a CSS cascade fix. The excerpt becomes clean plain text truncated to the first `excerptLines` **source** lines, rendered via `setText` (no `innerHTML`, no `MarkdownRenderer`). Implements `note-excerpt` spec; `note-tag-display` delta delegates inline-`#tag` stripping here.

## Architecture Decisions

| Decision | Options | Tradeoff | Chosen |
|---|---|---|---|
| Transform order | Single ordered regex chain | Correctness depends on order (fences/media before wikilinks) | Fixed order (a)–(k), see Contracts |
| `excerptLines` plumbing | Read `this.settings` vs pass arg | Arg keeps `createExcerptText` pure/unit-testable | Pass as 2nd arg; `populateExcerpt` reads `this.plugin.settings.excerptLines` |
| `line-clamp` role | Remove entirely vs keep as cap | Clamp = visual lines; JS slice = source lines | Remove hard-coded clamp from base class; keep `-lines-N` clamp as defensive visual cap |
| Emphasis/code stripping | Char-class delete vs explicit pairs | Explicit pairs over-engineer; structural markdown already resolved by then | Char-class delete (`**`→'', `*`→'', `_`→'', `` ` ``→'') in step (i) |

## Data Flow

```
cachedRead(note) ──► createExcerptText(content, excerptLines) ──► setText(...) || '—'
                          │  (pure, ordered regex chain)              ▲ guarded by
                          └── N source lines ────────────────── refreshGeneration
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/views/calendar-view.ts` | Modify | `createExcerptText(content, excerptLines)` new algorithm + signature; `populateExcerpt` passes `excerptLines`. `updateNotesList` unchanged (class already applied at L580). |
| `src/styles.css` | Modify | Remove `line-clamp: 2` and `-webkit-line-clamp: 2` from `.calendar-note-excerpt` (L506, L508). |
| `src/settings.ts` | Unchanged | `excerptLines` already defined/normalized (L98–102). |
| `src/main.ts` | Unchanged | Normalizer already wired (L62). |

## Interfaces / Contracts

`createExcerptText(content: string, excerptLines: number): string` — pure.

Ordered transform with rationale:

```ts
const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, '');
const withoutFences     = withoutFrontmatter.replace(/```[\s\S]*?```/g, '');
const withoutRules      = withoutFences.replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '');
const withoutMedia      = withoutRules
    .replace(/!\[\[[^\]]*\]\]/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '');
const withoutHeadings   = withoutMedia.replace(/^#{1,6}\s+/gm, '');
const withoutTags       = withoutHeadings.replace(/#[\w/-]+/g, '');
const wikilinks = withoutTags
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1');
const links = wikilinks.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
const inline = links
    .replace(/^>\s?/gm, '')
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
    .replace(/~([^~]+)~/g, '$1')
    .replace(/\\([\\`*_{}[\]()#+.!~>-])/g, '$1')
    .replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '').replace(/`/g, '')
    .replace(/<[^>]+>/g, '');
const lines = inline.split('\n')
    .map(l => l.replace(/[ \t]+/g, ' ').trim())
    .filter(l => l.length > 0);
return lines.slice(0, excerptLines).join('\n');
```

Order justification:

- **(a) frontmatter first** — leading `---` block may contain fences/tags; strip before body parsing.
- **(b) fences** before line slicing and inline stripping — block content spans newlines and contains literal `#`/`[[`/`>` that must not leak; removal must precede splitting.
- **(c) rules** before split — a standalone `---`/`***` line otherwise counts against `excerptLines` as a phantom line.
- **(d) media before (g)/(h)** — `![[note]]`/`![alt](u)` must be removed before generic wikilink/link conversion, else a stray `!` survives.
- **(e) headings before (f) tags** — heading regex requires whitespace (`#{1,6}\s+`); tag regex requires none (`#[\w/-]+`). Stripping `# Heading`→`Heading` first prevents the tag regex from ever seeing the `#`. `#roadmap` (no space) is untouched by headings, then removed as a tag.
- **(g) wikilinks before (h) links** — pipe-alias form before simple form; independent of link parens.
- **(i) backslash-unescape BEFORE emphasis/code char-class delete** — so `\*literal\*` unescapes to `*literal*` then strips to `literal`; emphasis/code via char-class delete only after structural markdown resolved (`*`, `_`, backtick no longer carry structure at this point). Blockquote/list markers are line-anchored before inline `*` deletion.
- **(j) per-line collapse, (k) drop blanks then slice** — collapse never crosses `\n` (the prior `/\s+/g→' '` destroyed line structure). Dropping blanks yields "first N **real** lines", satisfying "skips blank leading lines".

## Testing Strategy

No test runner (AGENTS.md). Verify: `npm run lint` + `npx tsc --noEmit` + `npm run production` + manual vault render.

`createExcerptText` is pure — a future unit test would assert (RED before GREEN):

| Spec scenario | Assertion |
|---|---|
| Emphasis/links/wikilinks | `**bold** *italic* [t](u) [[A\|B]] [[A]]` → `bold italic t B A` |
| Blockquote/list/strike/heading | `> quote`, `- item`, `~gone~`, `# Heading` → `quote item gone Heading` |
| HTML + escapes | `<span>text</span>` `\*literal\*` → `text literal` |
| Fence + rule | code block content and `---` absent |
| Image/embed | `![](i.png)` `![[n]]` removed; `[[n]]`→`n` |
| Truncation | `excerptLines=2` + 5 lines → 2 lines; short note → no padding |
| Tag vs heading | `#roadmap` removed; `# Heading`→`Heading` |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Rollback = `git revert`; no note data written.

## Open Questions

- None.
