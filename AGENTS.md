# AGENTS.md

Obsidian plugin **Calendar Notes** (`calendar-notes`, GPL-3.0, `isDesktopOnly: false` — desktop, mobile and iPad). TypeScript source bundled by esbuild into a single `main.js`. **There are no tests in this repo**; verification is lint + typecheck + manual build.

## Commands

```bash
npm install
npm run dev         # esbuild watch (recommended while developing); also copies styles.css + manifest.json into build/
npm run build       # alias for `npm run production`
npm run production  # one-shot production build (no sourcemap); exits when done
npm run lint        # ESLint only — no typecheck
npx tsc --noEmit    # typecheck (no npm script exists for it)
```

Gotchas:

- `npm run esbuild` is **watch mode**, not a single build (DEVELOPMENT.md says otherwise); it never exits. The real one-shot build is `npm run production`.
- esbuild externals: `obsidian`, `electron`, `@codemirror/*`, `@lezer/*`. Only `obsidian` is installed (devDependency, types only). Output is CJS, target ES6.

## Vault install / testing in Obsidian

Build output is `build/` (gitignored): `main.js`, `styles.css`, `manifest.json` — the last two copied from `src/styles.css` and the root `manifest.json`. Copy or symlink `build/` to `<vault>/.obsidian/plugins/calendar-notes/`, then reload Obsidian (or disable/enable the plugin). User settings are stored by Obsidian in `data.json` (gitignored).

## Architecture

- `src/main.ts` — plugin entrypoint: registers the view (`VIEW_TYPE_CALENDAR = 'calendar-view'`), settings tab, ribbon icon, `open-calendar` command, auto-opens the view on layout ready.
- `src/views/calendar-view.ts` — the entire UI (~900 lines, monolithic): calendar grid, month/year popover selectors, notes list, daily-note creation, touch handling.
- `src/settings.ts` — settings interface + defaults, value normalizers, `formatDateTime` (custom token formatter: `YYYY`, `MM`, `hh`, `aa`, `SSS`, …), settings tab UI.
- `src/styles.css` — all styles with a `calendar-*` class prefix; copied verbatim into `build/`.

## Domain rules (easy to get wrong)

- Notes are matched by **file creation time** (`file.stat.ctime`) unless the `Note property` date source is configured: a matching frontmatter property strict-parses with the configured moment format and the **day/month/year only** override placement, filtering, sorting, and labeling. The property source is **read-only** — the plugin never writes, modifies, or removes any note attribute or frontmatter value.
- Daily-note creation reads the Daily Notes core plugin's config through its internal API (`app.internalPlugins.getPluginById('daily-notes')`) via duck-typed local interfaces — no type dependency.
- Template rendering supports only `{{date}}`, `{{time}}`, `{{title}}` (with optional `:format`).
- Created daily notes get `ctime`/`mtime` at **local midday** to avoid DST edge cases around midnight.
- Vault `modify` events refresh with a 400 ms debounce; async excerpt population is guarded by a `refreshGeneration` counter that `refresh()` increments.
- Double-tap on touch is detected on `pointerup` within a 350 ms window (iPad trackpad support).
- New settings should follow the existing pattern: add a normalizer in `settings.ts`, call it from `loadSettings()`, and wire settings-tab changes to `saveSettings()` + `refreshCalendarView()`.

## Conventions

- Conventional commits (`feat:`, `fix:`, `chore:`) — consistent in history.
- Version bumps are manual and touch **both** `manifest.json` and `package.json` together (`chore: bump version`).
- Releases are tag-driven: pushing any tag runs CI (`npm ci && npm run lint && npm run build`), attests `main.js`/`styles.css` provenance, and creates a **draft** GitHub release with `main.js`, `manifest.json`, `styles.css`. The tag, not the manifest version, names the release.
- ESLint treats `no-explicit-any`, `no-unused-vars`, and `explicit-module-boundary-types` as warnings, not errors; `build/**` is ignored.
- `package.json`'s `repository`/`homepage` still point at the stale `pablolemosochandio/ObsidianCalendar` while the real remote is `pablolemosochandio/obsidian-calendar-notes` — don't "fix" it inside unrelated work.

## DEVELOPMENT

@DEVELOPMENT.md