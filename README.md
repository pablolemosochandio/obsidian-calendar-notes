# Calendar Notes

An Obsidian plugin for displaying a calendar in the side pane and notes associated with the selected date.

## Screenshots

<img src="https://github.com/pablolemosochandio/obsidian-calendar-notes/blob/main/screenshot/screenshot.png" width="300">


## Features

- Calendar view in the side pane
- Month and year navigation
- Click a day to show notes created on that date
- Click a week number to show notes created during that week
- Optional week numbers, configurable week start day, and note indicators
- Hide unnecessary days from the calendar
- Optional creation time and note excerpt display
- Configurable note sorting and excerpt line count
- Double-clicking or tapping a date can optionally (enabled by default) create a Daily Note on that date, using the Daily Notes core plugin for templating.
- Special attention taken for iPad trackpad support

## Installation
Copy the plugin in the directory .obsidan/plugins/calendar-notes

<details>
  <summary>Manual installation</summary>

  ## Installing in a Vault

	For a manual local install, make sure these files exist inside your plugin folder in the vault:
	
	- `manifest.json`
	- `main.js`
	- `styles.css`
	
	After building, these files are located in the `build/` directory (`main.js` and `styles.css`) and the project root (`manifest.json`).
	
	Example layout:
	
	```text
	<your-vault>/.obsidian/plugins/calendar-notes/
		manifest.json
		main.js
		styles.css
	```
	
	After copying the files, reload Obsidian or disable and re-enable the plugin.
</details>


## Notes

- Notes are grouped by file creation time (`ctime`), not by filename or frontmatter date.
- Week numbering can be shown as ISO 8601 or United States.
- The note list can be sorted by name or creation date/time, in ascending or descending order.

## License

GPL-3.0-only
