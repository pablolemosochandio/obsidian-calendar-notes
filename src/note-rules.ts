import { App, TFile } from 'obsidian';
import { normalizeNoteColorRuleKey, type NoteColorRule } from './settings';

/**
 * Evaluates ordered note color rules against a note's metadata cache.
 *
 * Rules are evaluated in array order; the FIRST match wins and its color is
 * returned. Returns null when no rule matches. Rules with an empty key or
 * value are skipped (incomplete rules never match).
 *
 * Read-only: this only reads the metadata cache. It never writes, modifies,
 * or removes any note attribute or frontmatter value, and never invokes
 * processFrontMatter or other mutation APIs.
 */
export function evaluateNoteColor(rules: NoteColorRule[], file: TFile, app: App): string | null {
	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	if (!frontmatter) {
		return null;
	}

	for (const rule of rules) {
		const key = normalizeNoteColorRuleKey(rule.type, rule.key);
		const value = rule.value.trim();
		if (!key || !value) {
			continue;
		}

		if (rule.type === 'frontmatter' && matchesFrontmatterValue(frontmatter, key, value)) {
			return rule.color;
		}

		if (rule.type === 'tag' && matchesFrontmatterTag(frontmatter.tags, key, value)) {
			return rule.color;
		}
	}

	return null;
}

/**
 * Frontmatter key match is case-INSENSITIVE; value match is exact and
 * case-SENSITIVE. Only text matches — a string value equal to the rule
 * value, or a list containing such a string. Numbers, booleans, and other
 * scalars never match. Date-shaped strings are plain strings and DO match.
 */
function matchesFrontmatterValue(frontmatter: Record<string, unknown>, key: string, value: string): boolean {
	for (const [candidateKey, candidateValue] of Object.entries(frontmatter)) {
		if (candidateKey.toLowerCase() === key.toLowerCase() && matchesStringValue(candidateValue, value)) {
			return true;
		}
	}

	return false;
}

function matchesStringValue(candidate: unknown, value: string): boolean {
	if (typeof candidate === 'string') {
		return candidate === value;
	}
	if (Array.isArray(candidate)) {
		return candidate.some((entry) => typeof entry === 'string' && entry === value);
	}
	return false;
}

/**
 * Tag rules match FRONTMATTER tags only; inline body tags are ignored.
 * The rule key is the tag prefix and the value the first subtag: a tag
 * `key/value` or deeper (`key/value/sub`) matches when its first two
 * segments equal key and value, case-SENSITIVE. A leading `#` on the
 * rule key is optional (normalized before matching) since tags are
 * displayed with `#` in Obsidian.
 */
function matchesFrontmatterTag(rawTags: unknown, key: string, value: string): boolean {
	if (rawTags == null) {
		return false;
	}

	const tags = Array.isArray(rawTags) ? rawTags : [rawTags];
	return tags.some((rawTag) => {
		if (typeof rawTag !== 'string') {
			return false;
		}

		const tag = rawTag.startsWith('#') ? rawTag.slice(1) : rawTag;
		const segments = tag.split('/');
		return segments.length >= 2 && segments[0] === key && segments[1] === value;
	});
}
