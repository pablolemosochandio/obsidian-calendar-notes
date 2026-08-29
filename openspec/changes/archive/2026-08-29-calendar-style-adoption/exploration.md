# Exploration: Adopt liamcain/obsidian-calendar-plugin visual styles

Date: 2026-08-29
Status: completed (ready for proposal, with open decisions)

## Topic

Adapt the current `notes-calendar` styles to match the visual style of the
`obsidian-calendar-plugin` by Liam Cain (https://github.com/liamcain/obsidian-calendar-plugin).

## Current State

- `notes-calendar` v1.0.2, GPL-3.0-only, `minAppVersion: 1.4.0`, `isDesktopOnly: false`
  (desktop + mobile + iPad must not regress).
- The entire UI is built imperatively in `src/views/calendar-view.ts` (~1028 lines) as a
  CSS-grid DOM tree; all styling lives in `src/styles.css` (658 lines) using `calendar-*`
  prefixed classes. No style-related settings exist in `src/settings.ts`.
- DOM structure: `.calendar-main-container` → `.calendar-header` (`.calendar-today-button`,
  `.calendar-nav-button`, `.calendar-month-display` + two `.calendar-month-display-button`s,
  `.calendar-nav-group`) → `.calendar-grid-container` (`.calendar-week-label`, `.calendar-day-label`,
  `.calendar-week-number`, `.calendar-day`, `.calendar-day-number`, `.calendar-day-dashes`,
  `.calendar-day-dash`, `.calendar-empty-day`) → `.calendar-notes-container` (`.calendar-notes-empty`,
  `.calendar-notes-list`, `.calendar-note-item`, `.calendar-note-time`, `.calendar-note-name`,
  `.calendar-note-excerpt[-lines-N]`, `.calendar-note-tag-row`, `.calendar-note-tag`).
- Theming: driven entirely by Obsidian CSS variables (`--text-normal`, `--text-muted`,
  `--interactive-accent`, `--interactive-accent-hover`, `--background-secondary`,
  `--background-tertiary`, `--background-modifier-border`, `--divider-color`, `--text-on-accent`).
  No explicit `theme-dark`/`theme-light` rules; `color-mix()` is already used (OK for
  `minAppVersion` 1.4.0). Mobile handled via `body.is-mobile` overrides and
  `@media (max-width: 600px)`; touch double-tap handled in TS (`onpointerup`, 350 ms window).
- Feature-coupled styles that MUST survive a reskin:
  - Note accent bars (`border-left`, `--calendar-note-accent`) from `note-color-rules` /
    `defaultNoteAccentColor` settings.
  - Tag chips (`.calendar-note-tag`), excerpt line-clamps, note list scrollbars.
  - Dash indicators with user thresholds (`dashOneThreshold` etc.).
  - Month/year selector popover (`.calendar-header-popover`).
  - Selected-week highlight (`.calendar-day-in-selected-week`, uses `color-mix`).
- Minor: `.calendar-notes-header` exists in `styles.css` but is never created in TS (dead CSS).

## Reference Analysis (liamcain)

- Repo `liamcain/obsidian-calendar-plugin`, last commit `ef3f269` (2022-11-04), version 1.5.10,
  **MIT License, © 2021 Liam Cain** (repo effectively unmaintained since late 2022).
- The plugin is a Svelte app. The calendar UI styles are NOT in the plugin repo's `styles.css`
  (194 bytes, settings banner only) — they live in the companion npm package
  `obsidian-calendar-ui` v0.3.12 (github.com/liamcain/obsidian-calendar-ui, **MIT, © 2021 Liam Cain**),
  as component-scoped Svelte `<style>` blocks:
  - `Calendar.svelte` — `.container` token block + `table.calendar` (`border-collapse: collapse`),
    weekday `th` (0.6em, letter-spacing 1px, uppercase, `--text-muted`).
  - `Nav.svelte` — `.nav`, `.right-nav`, `.reset-button` (dot, opacity 0.4 when inactive).
  - `Month.svelte` — title `.title` (1.4em, flex, 0.3em gap): `.month` weight 500, `.year` in
    `var(--interactive-accent)`.
  - `Arrow.svelte` — chevron SVG 16px, `--text-muted`, 24px hit area (32px on mobile).
  - `Day.svelte` — `.day`: radius 4px, 0.8em, padding 4px, `transition: background-color 0.1s
    ease-in, color 0.1s ease-in`; hover `var(--interactive-hover)`; `.active` (selected) =
    `--interactive-accent` bg + `--text-on-accent`; `.today` = accent text; `.adjacent-month` =
    opacity 0.25; `.has-note` modifier exists.
  - `Dot.svelte` / `Dots.svelte` — 6×6 SVG circles (stroke or fill currentColor), margin 0 1px,
    flex-wrap row min-height 6px, max 5 per source; active dots `--text-on-accent`.
  - `WeekNum.svelte` — `.week-num` 0.65em, radius 4px; `td` border-right
    `var(--background-modifier-border)`.
  - `popover/Box.svelte` — `--background-primary`, radius 4px, shadow `0 4px 12px rgba(0,0,0,0.25)`,
    padding 24px; mobile: shadow unset, padding 0 (rendered inline, not in a portal).
- Design tokens: local custom properties defined on `.container` and mapped to Obsidian vars:
  `--color-background-heading/day/weeknum/weekend` (all transparent by default),
  `--color-dot/arrow/button` (`--text-muted`), `--color-text-title/heading/day/weeknum`
  (`--text-normal`/`--text-muted`), `--color-text-today` (`--interactive-accent`).
- Theme integration: **no explicit dark/light rules, no media queries** — full reliance on
  Obsidian CSS variables. Mobile is detected via `app.isMobile` (renders `.is-mobile` classes).
- Important constraint: Svelte compiles these selectors with **hashed scoped class names**
  (e.g. `.day.svelte-xyz`), so the shipped CSS in the published `main.js` cannot be copied
  verbatim. The design must be **re-authored** against our `calendar-*` DOM. MIT attribution is
  still required for adapted design/CSS (include copyright notice in a comment + NOTICE).

## Gap Analysis (current → liamcain)

| Area | Current | liamcain | Adaptable CSS-only? |
|---|---|---|---|
| Day cell base | 1px border `--background-tertiary`, radius 3px, 11px font, `transition: all .2s`, hover `--background-secondary` + translateY(-1px) | no border, radius 4px, 0.8em, `transition` 0.1s color/bg, hover `--interactive-hover` | Yes |
| Selected day | accent bg + `--text-on-accent` (matches) | same | Already matches |
| Today | **no styling exists** | `.today` accent text | **No — needs a class in TS** |
| Adjacent-month | renders `.calendar-empty-day` (no day numbers) | adjacent days shown at opacity 0.25 | **No — TS render change** |
| Weekend column tint | none | `--color-background-weekend` (transparent default) | No (grid is div-based; would need per-cell classes) |
| Indicators | `.calendar-day-dash` 5×2 rounded rects, `--text-accent` | 6×6 SVG dot circles, currentColor, active dots `--text-on-accent` | Yes (restyle dashes into circles) |
| Weekday labels | 10px, weight 600, uppercase, muted | 0.6em, letter-spacing 1px, uppercase, muted | Yes (minor tweaks) |
| Week numbers | 11px, radius 3px, hover `--background-secondary` | 0.65em, radius 4px, hover `--interactive-hover` | Yes |
| Nav arrows | buttons with border/bg, 14px icons | borderless chevrons 16px muted, 24/32px | Yes |
| Month/year header | two bordered buttons (popovers) | single `MMM YYYY` title (500 + accent year), click resets month | Partially (typography/colors yes; selector popovers are a feature we keep) |
| Reset-to-today | `calendar-1` icon button | dot at opacity 0.4 until inactive | Partially (restyle only) |
| Popover (selector) | radius 8px, shadow `0 8px 24px rgba(0,0,0,.18)` | radius 4px, shadow `0 4px 12px rgba(0,0,0,.25)` | Yes |
| Hover stat popover | none | 750 ms hover → stats box | Out of scope |
| Note list | rich list (accent bars, tags, excerpts) | **liamcain has no note list** (popover stats only) | Keep ours; restyle consistently if desired |
| Token layer | none | `--color-*` block on `.container` | Yes (introduce `--calendar-color-*` mirror) |

## Approaches

| Approach | Pros | Cons | Effort |
|---|---|---|---|
| A. CSS-only reskin (`src/styles.css`) | Zero TS risk; no behavior change; mobile/touch untouched; ~1 file | Cannot add today highlight or adjacent-month/opacity; dots only approximate | Low |
| B. CSS reskin + minimal TS (today class, optional dot spans) | Full visual parity for day-cell states users recognize; keeps popovers/notes/features | Touches TS (+~10 lines); adds a new visual state to verify | Low–Medium |
| C. Full parity: adjacent-month days, weekend tint, reset-button pattern (structural TS) | Closest match to liamcain screenshots | Structural change to `renderCalendar` (empty-cell logic, week math), larger diff, mobile risk, more states to test | Medium–High |

## Recommendation

**Approach B**, gated: (1) CSS reskin of `src/styles.css` first — adopt liamcain's token approach
(a `--calendar-color-*` block on `.calendar-main-container` mapped to Obsidian vars), typography,
hover/active transitions (0.1s color/background), dot-shaped indicators, borderless muted arrows,
and popover radius/shadow; (2) minimal TS change in `calendar-view.ts` to add a `calendar-day-today`
class in `renderCalendar` so today can be highlighted with accent text; (3) defer adjacent-month
days and weekend tinting to a follow-up change. Preserve: note accent bars, tag chips, dash
thresholds, selector popovers, `body.is-mobile` overrides, and touch double-tap. Add MIT
attribution (header comment in `styles.css` + `NOTICE`).

## Risks

- Theme regression: swapping hover `--background-secondary` → `--interactive-hover` must be
  visually verified in light AND dark themes.
- Mobile regression: `isDesktopOnly: false` — keep tap targets ≥ 24px; liamcain's 24px arrows are
  tight for touch; our double-tap logic and `body.is-mobile` overrides must remain.
- Today highlight is NEW behavior (day cells gain a state) — needs explicit user approval.
- Adjacent-month rendering would change empty-cell/selection behavior — out of scope here.
- Dash→dot restyle changes the "indicators" visual users configured thresholds for.
- MIT attribution is legally required for adapted design/CSS (notice in comment + NOTICE file).
- Dead CSS (`.calendar-notes-header`) can be cleaned opportunistically, but must not be confused
  with feature work.

## Open Decisions for Proposal Phase

1. Match target: liamcain plugin v1.5.10 / `obsidian-calendar-ui` v0.3.12 (final releases; repos
   unmaintained) — confirm this is the intended reference.
2. Adopt "today" highlight (accent-colored number)? (new behavior, requires TS class)
3. Replace dashes with dot-style indicators, or keep dash rectangles?
4. Show adjacent-month days at 0.25 opacity (TS change) or keep empty cells?
5. Dark theme strategy: variables-only (liamcain approach — recommended) vs explicit
   `theme-dark` overrides?
6. Where to place attribution (styles.css header comment + `NOTICE`, or LICENSE appendix)?

## Ready for Proposal

Yes — proceed to `sdd-propose` after the user answers open decisions 2 and 3 at minimum.
