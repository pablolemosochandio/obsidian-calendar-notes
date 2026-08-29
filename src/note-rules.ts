import { App, TFile } from 'obsidian';
import { normalizeNoteColorRuleKey, type NoteColorRule } from './settings';

/**
 * Evaluates ordered note color rules against a note's metadata cache.
 *
 * Rules are evaluated in array order; the FIRST match wins and its color is
 * returned. Returns null when no rule matches. Incomplete rules never match:
 * a trimmed non-empty value is required for both types; the key is required
 * only for frontmatter rules. Tag rules ignore the key entirely (migrated
 * tag rules persist with an empty key).
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
		const value = rule.value.trim();
		if (!value) {
			continue;
		}

		if (rule.type === 'frontmatter') {
			const key = normalizeNoteColorRuleKey(rule.type, rule.key);
			if (!key || !matchesFrontmatterValue(frontmatter, key, value)) {
				continue;
			}
			return rule.color;
		}

		if (rule.type === 'tag' && matchesFrontmatterTag(frontmatter.tags, value)) {
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
 * Compiles a tag rule value into an anchored, case-SENSITIVE pattern.
 * The value is normalized first (trimmed, optional leading `#` stripped),
 * then every regex metacharacter is escaped except `*`, which becomes `.*`
 * (greedy — matches any characters, including `/`). The pattern is anchored
 * with `^…$`, so a tag matches only when its WHOLE name fits the pattern;
 * there is no implicit prefix/nesting behavior. Compiled per call: rule
 * counts are tiny (user-entered), so memoization would add cache state
 * without measurable gain.
 */
function compileTagPattern(value: string): RegExp {
	const normalized = normalizeNoteColorRuleKey('tag', value);
	const escaped = normalized.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
	return new RegExp('^' + escaped + '$');
}

/**
 * Tag rules match FRONTMATTER tags only; inline body tags are ignored.
 * Each raw tag has an optional leading `#` stripped and its FULL name is
 * tested against the rule value's anchored wildcard pattern: `sistemas`
 * matches only the exact tag `sistemas`, while `sistemas/*` matches nested
 * tags below it. Matching is case-SENSITIVE and literal except `*`.
 */
function matchesFrontmatterTag(rawTags: unknown, value: string): boolean {
	if (rawTags == null) {
		return false;
	}

	const pattern = compileTagPattern(value);
	const tags = Array.isArray(rawTags) ? rawTags : [rawTags];
	return tags.some((rawTag) => {
		if (typeof rawTag !== 'string') {
			return false;
		}

		const tag = rawTag.startsWith('#') ? rawTag.slice(1) : rawTag;
		return pattern.test(tag);
	});
}
