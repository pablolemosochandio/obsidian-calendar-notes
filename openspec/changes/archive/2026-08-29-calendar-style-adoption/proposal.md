# Proposal: Adopt liamcain/obsidian-calendar-plugin Visual Style

## Intent

Migrating users expect liamcain's familiar calendar look; our bordered day cells, dash indicators, heavy header buttons feel unfamiliar. Adopt the reference visual language without regressing features.

## Scope

### In Scope

- Re-author `src/styles.css` against `calendar-*` classes (hashed Svelte CSS cannot be copied): token block, compact grid, 0.1s transitions, selected-day accent, borderless arrows, header, popover radius/shadow, lighter notes list.
- Today highlight: `.calendar-day-today` state (TS class + accent text).
- Indicators: restyle `.calendar-day-dash` rects as rounded 6px dots, keeping count thresholds.
- Adjacent-month days: render dimmed (TS).
- Dark theme via Obsidian CSS variables only.
- Select today on view open; notes list visible.
- MIT attribution: `src/styles.css` header + `NOTICE` (liamcain v1.5.10 / obsidian-calendar-ui v0.3.12, © 2021 Liam Cain).

### Out of Scope

- Hover stat popover, weekend tint, selector popover behavior (restyle only).
- Preserved: accent bars, tag chips, dash thresholds, popovers, double-tap, `body.is-mobile`, `minAppVersion`. No new settings.

## Capabilities

### New Capabilities

- `calendar-visual-style`: reskin contract (tokens, typography, day-cell states, dots, nav/header/popover, notes list, variables-only theming).
- `calendar-day-states`: today highlight, adjacent-month rendering, select-today-on-open.

### Modified Capabilities

- `active-note-reflection`: reconcile select-today-on-open with ANR-1/ANR-2.

## Approach

CSS-first (~90% in `src/styles.css`): re-author reference tokens onto `.calendar-main-container`. Minimal TS in `calendar-view.ts`: today class, adjacent-month days, select-today on open. Verify light+dark, desktop+mobile.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/styles.css` | Modified | Reskin + tokens + MIT header |
| `src/views/calendar-view.ts` | Modified | today class, adjacent-month days, select-today-on-open |
| `NOTICE` | New | MIT attribution |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Theme regression light/dark | Med | Parity checklist both themes |
| Mobile regression (targets, double-tap, is-mobile) | Med | Keep ≥24px targets; verify phone/iPad |
| select-today-on-open vs `followActiveNote` | Med | Reconcile in sdd-spec; follow ON wins |
| Dash→dot threshold visuals | Low | Threshold logic untouched |
| `color-mix()`/SVG-dot on minAppVersion 1.4.0 | Low | color-mix already in use |
| MIT attribution omission | Low | NOTICE + header (license gate) |
| CSS-heavy diff vs 800-line budget | Med | sdd-tasks may slice into CSS/TS PRs |

## Rollback Plan

No data/settings changes. `git revert`; rebuild regenerates `build/`. Visual-only regressions: restore `src/styles.css` alone.

## Dependencies

None; reference re-authored, no code copied.

## Success Criteria

- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run production` pass.
- [ ] Parity checklist light+dark, mobile+desktop: accents, dots, dimmed adjacent days, grid, notes list.
- [ ] Preserved verified: accent bars, tags, thresholds, popovers, double-tap.
- [ ] MIT attribution in NOTICE + styles.css header.

## Open Questions

No open questions — decisions confirmed.
