// Lightweight translation resolver. No dependencies; ships in the esbuild bundle.
// Lookup order: active locale → English → raw key (never throws).
import { en, type TranslationKey, type TranslationShape } from './en';
import { es } from './es';

export type Language = 'en' | 'es';

const dictionaries: Record<Language, TranslationShape> = { en, es };

let currentLanguage: Language = 'es';

export function setLanguage(language: Language): void {
	if (language !== 'en' && language !== 'es') {
		return;
	}
	currentLanguage = language;
}

export function getLanguage(): Language {
	return currentLanguage;
}

/**
 * Resolves a translation key for the current language and substitutes
 * `{param}` placeholders. Falls back to English when a key is missing from
 * the current locale, and returns the raw key when absent from both.
 * Never throws.
 */
export function t(key: string, params?: Record<string, string | number>): string {
	const dictionary = dictionaries[currentLanguage] as Record<string, unknown>;
	const entry = dictionary[key];

	let value: string;
	if (typeof entry === 'string') {
		value = entry;
	} else {
		const englishEntry = (en as Record<string, unknown>)[key];
		if (typeof englishEntry === 'string') {
			value = englishEntry;
		} else {
			return key;
		}
	}

	if (params) {
		value = value.replace(/\{(\w+)\}/g, (match, name: string) =>
			name in params ? String(params[name]) : match
		);
	}

	return value;
}

// Localized name-array accessors (month/weekday names live in the dictionaries
// as arrays rather than as string keys).

function resolveArray(pick: (dict: TranslationShape) => readonly string[]): readonly string[] {
	return pick(dictionaries[currentLanguage]);
}

export function getMonths(): readonly string[] {
	return resolveArray((d) => d.months as readonly string[]);
}

export function getMonthsShort(): readonly string[] {
	return resolveArray((d) => d.monthsShort as readonly string[]);
}

export function getWeekdays(): readonly string[] {
	return resolveArray((d) => d.weekdays as readonly string[]);
}

export function getWeekdaysShort(): readonly string[] {
	return resolveArray((d) => d.weekdaysShort as readonly string[]);
}

export type { TranslationKey };
