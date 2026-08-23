# Tasks: Excerpt Markdown Strip and Source-Line Enforcement

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~60 (2 files) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Strip Markdown + enforce source-line clamp + CSS cascade fix | PR 1 | `npm run lint && npx tsc --noEmit && npm run production` | Manual vault render of a filtered note (N/A automated — no test runner per AGENTS.md) | `git revert`; changes isolated to `calendar-view.ts` + `styles.css`, no note data written |

## Phase 1: Core Implementation

- [x] 1.1 Rewrite `createExcerptText` in `src/views/calendar-view.ts` (L613–621) to signature `createExcerptText(content: string, excerptLines: number): string`, applying the design's ordered regex chain (a)–(k): frontmatter → fences → rules → media → headings → tags → wikilinks → links → inline strip → per-line collapse/blanks → `slice(0, excerptLines)`.
- [x] 1.2 Keep `createExcerptText` pure (no `this`, no I/O); return `lines.slice(0, excerptLines).join('\n')`.
- [x] 1.3 Update `populateExcerpt` (L598–611) to call `this.createExcerptText(content, this.plugin.settings.excerptLines)`; preserve the `refreshGeneration` guard and the `setText(...) || '—'` fallback.

## Phase 2: CSS Cascade Fix

- [x] 2.1 In `src/styles.css`, remove `line-clamp: 2;` (L506) and `-webkit-line-clamp: 2;` (L508) from `.calendar-note-excerpt` (L501–511); keep `overflow: hidden`, `display: -webkit-box`, `-webkit-box-orient: vertical`.
- [x] 2.2 Confirm `.calendar-note-excerpt-lines-{1..5}` (L89–112) remain unchanged and now govern the clamp via the class added at `calendar-view.ts` L580.

## Phase 3: Verification

- [x] 3.1 Run `npm run lint` — no new errors.
- [x] 3.2 Run `npx tsc --noEmit` — typecheck passes with the new signature.
- [x] 3.3 Run `npm run production` — one-shot build exits clean.
- [x] 3.4 Manual vault checklist (`note-excerpt` scenarios): emphasis/links/wikilinks → `bold italic t B A`; blockquote/list/strike/heading → `quote item gone Heading`; HTML+escapes stripped; fence/`---` removed; `![](i.png)`/`![[n]]` removed, `[[n]]`→`n`; `excerptLines=2` clamps 5→2 lines; `#roadmap` removed but `# Heading`→`Heading`; `setText` renders `<script>` as inert text.

## Phase 4: Cleanup

- [x] 4.1 Remove any orphaned imports/helpers left by the rewrite; confirm `src/settings.ts` and `src/main.ts` are unchanged.
