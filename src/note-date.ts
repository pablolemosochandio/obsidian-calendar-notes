import { App, TFile, moment } from 'obsidian';
import type { CalendarPluginSettings } from './settings';

export interface ResolvedNoteDate {
	/** Property date → local midday; otherwise the exact file creation time. */
	date: Date;
	/** True when the date came from the configured frontmatter property. */
	fromProperty: boolean;
}

/**
 * Resolves the date used to place, filter, sort, and label a note.
 *
 * With date source `Note property` and a non-empty property name, a scalar
 * string value that strict-parses against the configured moment format
 * resolves to a local-midday Date built from the day/month/year components
 * only — hour, minute, second and any other time components are excluded.
 * Any other case (source inactive, empty property name, missing property,
 * non-string value, unparseable value) falls back to the file creation time.
 *
 * Read-only: this only reads the metadata cache. It never writes, modifies,
 * or removes any note attribute or frontmatter value, and never invokes
 * processFrontMatter or other mutation APIs.
 */
export function resolveNoteDate(file: TFile, app: App, settings: CalendarPluginSettings): ResolvedNoteDate {
	const propertyName = settings.noteDateProperty.trim();
	const sourceActive = settings.noteSortBy === 'note-property' && propertyName !== '';

	if (sourceActive) {
		const value = app.metadataCache.getFileCache(file)?.frontmatter?.[propertyName];
		if (typeof value === 'string') {
			const parsed = moment(value.trim(), settings.noteDatePropertyFormat, true);
			if (parsed.isValid()) {
				// Date components only; local midday mirrors getDailyNoteTimestamp to avoid DST edge cases.
				return {
					date: new Date(parsed.year(), parsed.month(), parsed.date(), 12, 0, 0),
					fromProperty: true,
				};
			}
		}
	}

	return { date: new Date(file.stat.ctime), fromProperty: false };
}