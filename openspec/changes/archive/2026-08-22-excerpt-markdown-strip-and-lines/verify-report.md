```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:2bcb128d7dca981c79e51fd92d9be5694ba4c6dcdd3886ec3dc2ed6e69b6271b
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 6/6
scenarios: 14/14
test_command: node /var/folders/_m/f8m7l2614w5fm0j5d0wwh02m0000gn/T/opencode/excerpt-harness.mjs
test_exit_code: 0
test_output_hash: sha256:d83e65306219799087333f071f713806676045eea27724efcf67e3b6b9d8770f
build_command: npm run production
build_exit_code: 0
build_output_hash: sha256:a9105e234336b34dc1a214e6f8a5262adfd85f7a073927c7f1698d77ae35b81e
```

## Verification Report

**Change**: 2026-08-22-excerpt-markdown-strip-and-lines
**Version**: N/A (delta specs carry no version)
**Mode**: Standard (strict_tdd: false; repo has no test runner per AGENTS.md)

Re-verification after a bounded correction. The prior FAIL (1 CRITICAL: `createExcerptText` deleted emphasis `*` before unescaping backslashes, so `\*literal\*` → `\literal\`) is now resolved. The working tree reorders step (i) so backslash-unescape runs BEFORE emphasis deletion, producing `\*literal\*` → `literal`. All 14 scenarios now pass.

### Completeness

| Metric | Value |
|--------|-------|
| Artifacts present | proposal, specs (note-excerpt + note-tag-display), design, tasks — all 4 |
| Tasks total | 10 |
| Tasks complete | 10 |
| Tasks incomplete | 0 |

All 10 tasks (`1.1`–`4.1`) are marked `[x]` in `tasks.md`.

### Build & Tests Execution

**Build** (`npm run production`): ✅ Passed (exit 0)
```text
> notes-calendar@1.0.2 production
> node esbuild.config.mjs production
```

**Lint** (`npm run lint`): ✅ Passed (exit 0)
```text
> notes-calendar@1.0.2 lint
> eslint .
```

**Typecheck** (`npx tsc --noEmit`): ✅ Passed (exit 0, empty output)

**Runtime scenario harness** (executable Node harness replicating the exact `createExcerptText` regex chain): ✅ 14 passed / ❌ 0 failed
```text
PASS | Emphasis/links/wikilinks        -> "bold italic t B A"
PASS | Blockquote/list/strike/heading   -> "quote\nitem\ngone\nHeading"
PASS | Raw HTML + backslash escapes     -> "text literal"
PASS | Fence + rule                     -> "before\nafter"
PASS | Image + embed                    -> "keep"
PASS | Truncate longer (n=2)            -> "one\ntwo"
PASS | Truncate shorter (n=5)           -> "one\ntwo"
PASS | Truncate n=1                     -> "one"
PASS | Blank-leading note               -> "hello world"
PASS | Empty note                       -> ""
PASS | Script/HTML safety               -> "alert(1) hi"
PASS | Inline tag removed               -> "Discuss today"
PASS | Heading not confused with tag    -> "Heading"
PASS | Delegated inline tag stripped    -> "Discuss today"
TOTAL: 14 pass, 0 fail
```

**Coverage**: ➖ Not available (no test runner; AGENTS.md defines verification as lint + typecheck + build).

Command evidence digests: lint `sha256:0bd8434514413f859f3b9ff015f154c10a0671d3d35100ab7fc36b4750af09c4`; tsc `sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty); build `sha256:a9105e234336b34dc1a214e6f8a5262adfd85f7a073927c7f1698d77ae35b81e`; harness `sha256:d83e65306219799087333f071f713806676045eea27724efcf67e3b6b9d8770f`.

`evidence_revision` = `sha256(harness_output_bytes ‖ build_output_bytes)` = sha256 of the harness stdout followed by the `npm run production` stdout (no separator).

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| note-excerpt REQ-01 Markdown markers stripped | Emphasis, links, and wikilinks | harness `Emphasis/links/wikilinks` | ✅ COMPLIANT |
| note-excerpt REQ-01 | Blockquotes, lists, strikethrough, headings | harness `Blockquote/list/strike/heading` | ✅ COMPLIANT |
| note-excerpt REQ-01 | Raw HTML and backslash escapes | harness `Raw HTML + backslash escapes` | ✅ COMPLIANT |
| note-excerpt REQ-02 Fences/rules/images/embeds removed | Fenced code block and horizontal rule | harness `Fence + rule` | ✅ COMPLIANT |
| note-excerpt REQ-02 | Image and embed | harness `Image + embed` | ✅ COMPLIANT |
| note-excerpt REQ-03 Truncate to excerptLines | Note longer than excerptLines | harness `Truncate longer (n=2)` | ✅ COMPLIANT |
| note-excerpt REQ-03 | Note shorter than excerptLines | harness `Truncate shorter (n=5)` | ✅ COMPLIANT |
| note-excerpt REQ-03 | excerptLines equals 1 | harness `Truncate n=1` | ✅ COMPLIANT |
| note-excerpt REQ-03 | Empty or blank-leading note | harness `Blank-leading` + `Empty` | ✅ COMPLIANT |
| note-excerpt REQ-04 Plain-text safety | Script or HTML in note | harness `Script/HTML safety` + source (`setText` only) | ✅ COMPLIANT |
| note-excerpt REQ-05 Inline tags stripped | Inline tag removed | harness `Inline tag removed` | ✅ COMPLIANT |
| note-excerpt REQ-05 | Heading not confused with tag | harness `Heading not confused with tag` | ✅ COMPLIANT |
| note-tag-display REQ Inline tags excluded from chips | Inline tag stripped from excerpt (delegated) | harness `Delegated inline tag stripped` (shared transform) | ✅ COMPLIANT |
| note-tag-display REQ | Inline tag is not a chip | source: `getFrontmatterTags` reads `frontmatter.tags` only | ✅ COMPLIANT |

**Compliance summary**: 14/14 scenarios compliant.

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Markdown markers stripped to plain text | ✅ Implemented | All markers stripped, INCLUDING backslash escapes — step (i) now unescapes BEFORE emphasis deletion, so `\*literal\*` → `literal` |
| Fenced code, rules, images, embeds removed | ✅ Implemented | `(b)` fences, `(c)` rules, `(d)` media run before wikilink/link conversion |
| Truncate to excerptLines source lines | ✅ Implemented | Newlines preserved; per-line collapse; blanks dropped; `slice(0, excerptLines)` |
| Plain-text safety | ✅ Implemented | `populateExcerpt`/`updateNotesList` use `setText` only; no `innerHTML`, no `MarkdownRenderer` (grep-verified across `src/`) |
| Inline tags stripped from excerpt | ✅ Implemented | `(f)` `#[\w/-]+` after headings; heading regex requires `\s+` |
| note-tag-display delegation + chips unchanged | ✅ Implemented | Chips from `getFrontmatterTags` (frontmatter only); `.calendar-note-tag-row` untouched |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Fixed ordered regex chain (a)–(k) | ⚠️ Deviation (see WARNING) | Source matches design verbatim EXCEPT step (i): backslash-unescape now precedes emphasis deletion (the correction) |
| Pure function (no `this`, no I/O) | ✅ Yes | `createExcerptText(content, excerptLines)` has no `this`/I/O |
| Pass `excerptLines` as 2nd arg | ✅ Yes | `populateExcerpt` passes `this.plugin.settings.excerptLines` |
| Preserve `refreshGeneration` guard | ✅ Yes | Guard at L601 and L607 |
| Preserve `setText(...) \|\| '—'` fallback | ✅ Yes | L605 and L608 |
| Remove hard-coded `line-clamp: 2` from `.calendar-note-excerpt` | ✅ Yes | Both `line-clamp: 2` and `-webkit-line-clamp: 2` removed; `overflow`/`-webkit-box` retained |
| `-lines-{1..5}` classes govern clamp | ✅ Yes | L89–112 unchanged; class applied at L580 |
| `src/settings.ts` / `src/main.ts` unchanged | ✅ Yes | `git diff --name-only` shows only `calendar-view.ts` + `styles.css` |

### Issues Found

**CRITICAL**: None.

**WARNING**:
1. **Design deviation — step (i) ordering vs `design.md` written order.** The implemented step (i) runs the backslash-unescape (`.replace(/\\([\\`*_{}[\]()#+.!~>-])/g, '$1')`) BEFORE the emphasis char-class delete, whereas `design.md`'s literal code block lists emphasis-delete first, then unescape. This divergence is INTENTIONAL and CORRECTS the prior spec violation (`\*literal\*` → `literal`, satisfying note-excerpt REQ-01's "strip backslash escapes"). It does NOT break any spec — it fixes one. Not CRITICAL per the design-deviation gate ("WARNING unless it breaks a spec"). `design.md`'s testing assertion table (line 84) also still encodes the stale expectation (`\*literal\*` → `text *literal*`), which contradicts the now-correct behavior.

**SUGGESTION**:
1. Update `design.md` so its written step-(i) code block and its testing-assertion row for "HTML + escapes" reflect the corrected order and output (`\*literal\*` → `literal`), keeping design and implementation in lockstep before archive.

### Verdict

PASS WITH WARNINGS — all 14 spec scenarios compliant; the previously-failing "Raw HTML and backslash escapes" scenario now passes (`\*literal\*` → `literal`); lint/typecheck/build all exit 0; 0 CRITICAL, 0 blockers. The single WARNING is a benign design-doc drift (design.md still records the pre-fix step-(i) ordering) with a SUGGESTION to sync it, neither of which blocks archive.
