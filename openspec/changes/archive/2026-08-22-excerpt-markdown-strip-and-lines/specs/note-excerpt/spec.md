# Note Excerpt Specification

## Purpose

Generate the filtered-note excerpt as clean plain text: strip Markdown markers, remove fenced code blocks, horizontal rules, images, and embeds, strip inline `#tag`, truncate to the first `excerptLines` source lines, and render via `setText`.

## Requirements

### Requirement: Markdown markers stripped to plain text

The system MUST strip Markdown syntax markers from the excerpt, producing clean plain text: emphasis (`**bold**`→`bold`, `*italic*`→`italic`), inline code backticks, `[text](url)`→`text`, wikilink aliases (`[[A|B]]`→`B`, `[[A]]`→`A`), blockquote `>` markers, list markers, strikethrough `~text~`→`text`, raw HTML tags, backslash escapes, and heading markers (`# Heading`→`Heading`).

#### Scenario: Emphasis, links, and wikilinks

- GIVEN a note body `**bold** *italic* [t](u) [[A|B]] [[A]]`
- WHEN the excerpt is generated
- THEN it reads `bold italic t B A`

#### Scenario: Blockquotes, lists, strikethrough, headings

- GIVEN a note body containing `> quote`, `- item`, `~gone~`, and `# Heading`
- WHEN the excerpt is generated
- THEN markers are removed, leaving `quote item gone Heading`

#### Scenario: Raw HTML and backslash escapes

- GIVEN a note body `<span>text</span>` and `\*literal\*`
- WHEN the excerpt is generated
- THEN HTML tags and backslashes are removed, leaving plain text

### Requirement: Fenced code, horizontal rules, images, and embeds removed

The system MUST remove fenced code blocks, horizontal rules (`---`/`***`), images (`![](url)`), and embeds (`![[note]]`) entirely from the excerpt.

#### Scenario: Fenced code block and horizontal rule

- GIVEN a note with a fenced code block and a `---` line
- WHEN the excerpt is generated
- THEN no code content or rule appears in the excerpt

#### Scenario: Image and embed

- GIVEN a note body `![](img.png)` and `![[note]]`
- WHEN the excerpt is generated
- THEN neither appears; a normal `[[note]]` keeps its name

### Requirement: Truncate to excerptLines source lines

The system MUST truncate the excerpt to the first `excerptLines` source lines (not wrapped/visual lines), preserving newlines.

#### Scenario: Note longer than excerptLines

- GIVEN `excerptLines` = 2 and a note with 5 source lines
- WHEN the excerpt is generated
- THEN only the first 2 lines appear

#### Scenario: Note shorter than excerptLines

- GIVEN `excerptLines` = 5 and a note with 2 source lines
- WHEN the excerpt is generated
- THEN both lines appear with no added padding

#### Scenario: excerptLines equals 1

- GIVEN `excerptLines` = 1 and a multi-line note
- WHEN the excerpt is generated
- THEN only the first line appears

#### Scenario: Empty or blank-leading note

- GIVEN an empty note, or a note whose first lines are blank
- WHEN the excerpt is generated
- THEN the excerpt is empty or skips blank leading lines without error

### Requirement: Plain-text safety

The system MUST render the excerpt as plain text via `setText`, and MUST NOT use `innerHTML` or any Markdown renderer, so no HTML or script can be injected or executed.

#### Scenario: Script or HTML in note

- GIVEN a note body containing `<script>alert(1)</script>` or `onerror=` HTML
- WHEN the excerpt is generated and rendered
- THEN the markup is treated as text and no script executes

### Requirement: Inline tags stripped from excerpt

The system MUST strip inline `#tag` tokens (matching `#[\w/-]+`) from the excerpt so no loose `#word` remains.

#### Scenario: Inline tag removed

- GIVEN a note body `Discuss #roadmap today`
- WHEN the excerpt is generated
- THEN it reads `Discuss today`

#### Scenario: Heading not confused with tag

- GIVEN a note body `# Heading` (a heading, not a tag)
- WHEN the excerpt is generated
- THEN the heading marker is stripped, leaving `Heading`, not removed as a tag
