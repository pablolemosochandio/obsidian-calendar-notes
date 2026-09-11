import { App, ColorComponent, PluginSettingTab, Setting } from 'obsidian';
import type CalendarPlugin from './main';
import { t, setLanguage, getWeekdays, getWeekdaysShort, type Language } from './i18n';

export type TimeDisplayFormat = string;
export type WeekStartDay = 'monday' | 'sunday';
export type WeekNumberDisplay = 'off' | 'iso-8601' | 'united-states';
export type NoteSortBy = 'name' | 'creation-time' | 'note-property';
export type SortOrder = 'ascending' | 'descending';
export type FilteredNoteSortType = 'by-date' | 'by-attribute';
export type NoteColorRuleType = 'frontmatter' | 'tag';

export interface NoteColorRule {
	type: NoteColorRuleType;
	key: string;
	value: string;
	color: string;
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
export type WeekdayVisibilityKey =
	| 'showSunday'
	| 'showMonday'
	| 'showTuesday'
	| 'showWednesday'
	| 'showThursday'
	| 'showFriday'
	| 'showSaturday';

const WEEKDAY_VISIBILITY_KEYS: WeekdayVisibilityKey[] = [
	'showSunday',
	'showMonday',
	'showTuesday',
	'showWednesday',
	'showThursday',
	'showFriday',
	'showSaturday',
];

export interface CalendarPluginSettings {
	language: Language;
	showDashes: boolean;
	enableDailyNoteOnDoubleTap: boolean;
	followActiveNote: boolean;
	dashOneThreshold: number;
	dashTwoThreshold: number;
	dashThreeThreshold: number;
	showTime: boolean;
	timeIsoDisplay: TimeDisplayFormat;
	showExcerpt: boolean;
	showTags: boolean;
	excerptLines: number;
	noteSortBy: NoteSortBy;
	noteDateProperty: string;
	noteDatePropertyFormat: string;
	enableFilteredNoteSorting: boolean;
	filteredNoteSortOrder: SortOrder;
	filteredNoteSortType: FilteredNoteSortType;
	filteredNoteSortAttribute: string;
	noteColorRules: NoteColorRule[];
	defaultNoteAccentColor: string;
	weekStartDay: WeekStartDay;
	weekNumberDisplay: WeekNumberDisplay;
	showSunday: boolean;
	showMonday: boolean;
	showTuesday: boolean;
	showWednesday: boolean;
	showThursday: boolean;
	showFriday: boolean;
	showSaturday: boolean;
}

export const DEFAULT_SETTINGS: CalendarPluginSettings = {
	language: 'es',
	showDashes: true,
	enableDailyNoteOnDoubleTap: true,
	followActiveNote: false,
	dashOneThreshold: 1,
	dashTwoThreshold: 3,
	dashThreeThreshold: 5,
	showTime: true,
	timeIsoDisplay: 'HH:mm:ss',
	showExcerpt: true,
	showTags: true,
	excerptLines: 2,
	noteSortBy: 'creation-time',
	noteDateProperty: '',
	noteDatePropertyFormat: 'DD-MM-YYYY',
	enableFilteredNoteSorting: false,
	filteredNoteSortOrder: 'ascending',
	filteredNoteSortType: 'by-date',
	filteredNoteSortAttribute: '',
	noteColorRules: [],
	defaultNoteAccentColor: '',
	weekStartDay: 'sunday',
	weekNumberDisplay: 'off',
	showSunday: true,
	showMonday: true,
	showTuesday: true,
	showWednesday: true,
	showThursday: true,
	showFriday: true,
	showSaturday: true,
};

export function normalizeTimeDisplayFormat(value: string): TimeDisplayFormat {
	const trimmed = value.trim();
	if (!trimmed) {
		return DEFAULT_SETTINGS.timeIsoDisplay;
	}
	return trimmed;
}

export function normalizeWeekNumberDisplay(value: string): WeekNumberDisplay {
	if (value === 'iso-8601' || value === 'international') {
		return 'iso-8601';
	}
	if (value === 'united-states') {
		return 'united-states';
	}
	return 'off';
}

export function normalizeExcerptLines(value: number): number {
	if (value < 1) return 1;
	if (value > 5) return 5;
	return Math.round(value);
}

export function normalizeShowTags(value: unknown): boolean {
	return value !== false;
}

export function normalizeFollowActiveNote(value: unknown): boolean {
	return value === true;
}

export function normalizeNoteSortBy(value: string): NoteSortBy {
	if (value === 'note-property') {
		return 'note-property';
	}
	return value === 'creation-time' ? 'creation-time' : 'name';
}

export function normalizeNoteDateProperty(value: string): string {
	return value.trim();
}

export function normalizeNoteDatePropertyFormat(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		return DEFAULT_SETTINGS.noteDatePropertyFormat;
	}
	return trimmed;
}

/**
 * Trims a rule key and, for tag rules, strips an optional leading `#`
 * (users tend to type tags the way Obsidian displays them). Frontmatter
 * keys are left untouched apart from trimming.
 */
export function normalizeNoteColorRuleKey(type: NoteColorRuleType, key: string): string {
	let normalized = key.trim();
	if (type === 'tag' && normalized.startsWith('#')) {
		normalized = normalized.slice(1).trim();
	}
	return normalized;
}

export function normalizeNoteColorRules(value: unknown): NoteColorRule[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const rules: NoteColorRule[] = [];
	for (const entry of value) {
		if (!entry || typeof entry !== 'object') {
			continue;
		}

		const candidate = entry as Partial<NoteColorRule>;
		if (candidate.type !== 'frontmatter' && candidate.type !== 'tag') {
			continue;
		}

		const key = normalizeNoteColorRuleKey(
			candidate.type,
			typeof candidate.key === 'string' ? candidate.key : ''
		);
		const ruleValue = typeof candidate.value === 'string' ? candidate.value.trim() : '';
		const color = typeof candidate.color === 'string' && HEX_COLOR_PATTERN.test(candidate.color)
			? candidate.color
			: '';

		if (candidate.type === 'tag') {
			// Key is optional for tag rules (migrated rules store key === '').
			if (!ruleValue || !color) {
				continue;
			}
			// One-way migration of legacy tag rules (prefix key + subtag
			// value): merge the normalized key into the value. Already-migrated
			// rules have an empty key and pass through unchanged, so reloads
			// never double-prefix.
			const migratedValue = key ? `${key}/${ruleValue}` : ruleValue;
			rules.push({ type: 'tag', key: '', value: migratedValue, color });
		} else {
			if (!key || !ruleValue || !color) {
				continue;
			}
			rules.push({ type: 'frontmatter', key, value: ruleValue, color });
		}
	}

	return rules;
}

export function normalizeDefaultNoteAccentColor(value: unknown): string {
	if (typeof value !== 'string') {
		return '';
	}
	return HEX_COLOR_PATTERN.test(value) ? value : '';
}

export function isCompleteNoteColorRule(rule: NoteColorRule): boolean {
	if (rule.type !== 'frontmatter' && rule.type !== 'tag') {
		return false;
	}
	if (typeof rule.value !== 'string' || rule.value.trim() === '') {
		return false;
	}
	if (typeof rule.color !== 'string' || !HEX_COLOR_PATTERN.test(rule.color)) {
		return false;
	}
	// Key is required only for frontmatter rules; tag rules ignore it
	// (migrated tag rules persist with an empty key).
	if (rule.type === 'frontmatter') {
		return typeof rule.key === 'string' && rule.key.trim() !== '';
	}
	return true;
}

export function normalizeSortOrder(value: string): SortOrder {
	return value === 'descending' ? 'descending' : 'ascending';
}

export function normalizeFilteredNoteSortType(value: string): FilteredNoteSortType {
	return value === 'by-attribute' ? 'by-attribute' : 'by-date';
}

export function normalizeFilteredNoteSortAttribute(value: string): string {
	return value.trim();
}

export function normalizeLanguage(value: unknown): Language {
	return value === 'en' ? 'en' : 'es';
}

export function normalizeWeekdayVisibility(settings: CalendarPluginSettings): void {
	WEEKDAY_VISIBILITY_KEYS.forEach((key) => {
		settings[key] = settings[key] !== false;
	});

	const hasVisibleDay = WEEKDAY_VISIBILITY_KEYS.some((key) => settings[key]);
	if (!hasVisibleDay) {
		WEEKDAY_VISIBILITY_KEYS.forEach((key) => {
			settings[key] = true;
		});
	}
}

export function formatDateTime(date: Date, format: TimeDisplayFormat): string {

	const padNumber = (value: number, width: number): string => {
		const zeros = width === 3 ? '000' : '00';
		return (zeros + String(value)).slice(-width);
	};

	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hour24 = date.getHours();
	const hour12 = hour24 % 12 || 12;
	const minute = date.getMinutes();
	const second = date.getSeconds();
	const millisecond = date.getMilliseconds();
	const meridiem = hour24 >= 12 ? t('meridiem_pm') : t('meridiem_am');

	const replacements: Record<string, string> = {
		'YYYY': String(year),
		'YY': String(year).slice(-2),
		'MM': padNumber(month, 2),
		'M': String(month),
		'DD': padNumber(day, 2),
		'D': String(day),
		'HH': padNumber(hour24, 2),
		'H': String(hour24),
		'hh': padNumber(hour12, 2),
		'h': String(hour12),
		'mm': padNumber(minute, 2),
		'm': String(minute),
		'ss': padNumber(second, 2),
		's': String(second),
		'SSS': padNumber(millisecond, 3),
		'aa': meridiem,
		'a': meridiem.toLowerCase(),
	};

	const tokenPattern = /(YYYY|YY|SSS|MM|M|DD|D|HH|H|hh|h|mm|m|ss|s|aa|a)/g;
	return format.replace(tokenPattern, (token) => replacements[token] ?? token);
}

export class CalendarSettingTab extends PluginSettingTab {
	plugin: CalendarPlugin;

	constructor(app: App, plugin: CalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(t('settings_language'))
			.setDesc(t('settings_language_desc'))
			.addDropdown(dropdown => dropdown
				.addOption('en', t('language_en'))
				.addOption('es', t('language_es'))
				.setValue(this.plugin.settings.language)
				.onChange(async (value) => {
					this.plugin.settings.language = normalizeLanguage(value);
					setLanguage(this.plugin.settings.language);
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
				})
			);

		new Setting(containerEl)
			.setName(t('settings_section_note_list'))
			.setHeading();

		new Setting(containerEl)
			.setName(t('settings_sort_notes_by'))
			.setDesc(t('settings_sort_notes_by_desc'))
			.addDropdown(dropdown => dropdown
				.addOption('name', t('settings_sort_name'))
				.addOption('creation-time', t('settings_sort_creation_time'))
				.addOption('note-property', t('settings_sort_note_property'))
				.setValue(this.plugin.settings.noteSortBy)
				.onChange(async (value) => {
					this.plugin.settings.noteSortBy = normalizeNoteSortBy(value);
					const isName = this.plugin.settings.noteSortBy === 'name';
					// When sorting by name, by-attribute is the only valid filtered sort type
					if (isName && this.plugin.settings.filteredNoteSortType !== 'by-attribute') {
						this.plugin.settings.filteredNoteSortType = 'by-attribute';
					}
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
					this.setSectionVisibility(noteDateSection, this.plugin.settings.noteSortBy === 'note-property');
					this.setSectionVisibility(filteredSortTypeSection, !isName);
					this.setSectionVisibility(
						filteredSortAttributeSection,
						this.plugin.settings.enableFilteredNoteSorting &&
						(isName || this.plugin.settings.filteredNoteSortType === 'by-attribute'),
					);
				})
			);

		const noteDateSection = containerEl.createDiv({ cls: 'calendar-settings-nested-section' });

		new Setting(noteDateSection)
			.setName(t('settings_note_date_property'))
			.setDesc(t('settings_note_date_property_desc'))
			.addText(text => text
				.setPlaceholder(t('settings_note_date_property_placeholder'))
				.setValue(this.plugin.settings.noteDateProperty)
				.onChange(async (value) => {
					this.plugin.settings.noteDateProperty = normalizeNoteDateProperty(value);
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
				})
			);

		const noteDateFormatSetting = new Setting(noteDateSection)
			.setName(t('settings_note_date_format'))
			.setDesc(this.buildDateFormatDesc(this.plugin.settings.noteDatePropertyFormat))
			.addText(text => text
				.setPlaceholder('DD-MM-YYYY')
				.setValue(this.plugin.settings.noteDatePropertyFormat)
				.onChange(async (value) => {
					this.plugin.settings.noteDatePropertyFormat = normalizeNoteDatePropertyFormat(value);
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
					noteDateFormatSetting.setDesc(this.buildDateFormatDesc(this.plugin.settings.noteDatePropertyFormat));
				})
			);
		this.setSectionVisibility(noteDateSection, this.plugin.settings.noteSortBy === 'note-property');

		new Setting(containerEl)
			.setName(t('settings_enable_filtered_note_sorting'))
			.setDesc(t('settings_enable_filtered_note_sorting_desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableFilteredNoteSorting)
				.onChange(async (value) => {
					this.plugin.settings.enableFilteredNoteSorting = value;
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
					this.setSectionVisibility(filteredSortSection, value);
				})
			);

		const filteredSortSection = containerEl.createDiv({ cls: 'calendar-settings-nested-section' });

		new Setting(filteredSortSection)
			.setName(t('settings_filtered_note_sort_order'))
			.setDesc(t('settings_filtered_note_sort_order_desc'))
			.addDropdown(dropdown => dropdown
				.addOption('ascending', t('settings_sort_ascending'))
				.addOption('descending', t('settings_sort_descending'))
				.setValue(this.plugin.settings.filteredNoteSortOrder)
				.onChange(async (value) => {
					this.plugin.settings.filteredNoteSortOrder = normalizeSortOrder(value);
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
				})
			);

		const filteredSortTypeSection = filteredSortSection.createDiv({ cls: 'calendar-settings-nested-section' });

		new Setting(filteredSortTypeSection)
			.setName(t('settings_filtered_note_sort_type'))
			.setDesc(t('settings_filtered_note_sort_type_desc'))
			.addDropdown(dropdown => dropdown
				.addOption('by-date', t('settings_filtered_note_sort_by_date'))
				.addOption('by-attribute', t('settings_filtered_note_sort_by_attribute'))
				.setValue(this.plugin.settings.filteredNoteSortType)
				.onChange(async (value) => {
					this.plugin.settings.filteredNoteSortType = normalizeFilteredNoteSortType(value);
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
					this.setSectionVisibility(filteredSortAttributeSection, this.plugin.settings.filteredNoteSortType === 'by-attribute');
				})
			);

		const filteredSortAttributeSection = filteredSortSection.createDiv({ cls: 'calendar-settings-nested-section' });

		new Setting(filteredSortAttributeSection)
			.setName(t('settings_filtered_note_sort_attribute'))
			.setDesc(t('settings_filtered_note_sort_attribute_desc'))
			.addText(text => text
				.setPlaceholder(t('settings_filtered_note_sort_attribute_placeholder'))
				.setValue(this.plugin.settings.filteredNoteSortAttribute)
				.onChange(async (value) => {
					this.plugin.settings.filteredNoteSortAttribute = normalizeFilteredNoteSortAttribute(value);
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
				})
			);

		const isNameSort = this.plugin.settings.noteSortBy === 'name';
		this.setSectionVisibility(filteredSortSection, this.plugin.settings.enableFilteredNoteSorting);
		this.setSectionVisibility(filteredSortTypeSection, !isNameSort);
		this.setSectionVisibility(
			filteredSortAttributeSection,
			this.plugin.settings.enableFilteredNoteSorting &&
			(isNameSort || this.plugin.settings.filteredNoteSortType === 'by-attribute'),
		);

		new Setting(containerEl)
			.setName(t('settings_show_time'))
			.setDesc(t('settings_show_time_desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showTime)
				.onChange(async (value) => {
					this.plugin.settings.showTime = value;
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
					this.setSectionVisibility(timeFormatSection, value);
				})
			);

		const timeFormatSection = containerEl.createDiv({ cls: 'calendar-settings-nested-section' });

		const timeFormatSetting = new Setting(timeFormatSection)
			.setName(t('settings_time_format'))
			.setDesc(this.buildTimeFormatDesc(this.plugin.settings.timeIsoDisplay))
			.addText(text => text
				.setPlaceholder('HH:mm:ss')
				.setValue(this.plugin.settings.timeIsoDisplay)
				.onChange(async (value) => {
					this.plugin.settings.timeIsoDisplay = normalizeTimeDisplayFormat(value);
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
					timeFormatSetting.setDesc(this.buildTimeFormatDesc(this.plugin.settings.timeIsoDisplay));
				})
			);
		this.setSectionVisibility(timeFormatSection, this.plugin.settings.showTime);

		new Setting(containerEl)
			.setName(t('settings_show_excerpt'))
			.setDesc(t('settings_show_excerpt_desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showExcerpt)
				.onChange(async (value) => {
					this.plugin.settings.showExcerpt = value;
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
					this.setSectionVisibility(excerptSection, value);
				})
			);

		const excerptSection = containerEl.createDiv({ cls: 'calendar-settings-nested-section' });

		new Setting(excerptSection)
			.setName(t('settings_excerpt_lines'))
			.setDesc(t('settings_excerpt_lines_desc'))
			.addDropdown(dropdown => dropdown
				.addOption('1', '1')
				.addOption('2', '2')
				.addOption('3', '3')
				.addOption('4', '4')
				.addOption('5', '5')
				.setValue(String(this.plugin.settings.excerptLines))
				.onChange(async (value) => {
					this.plugin.settings.excerptLines = normalizeExcerptLines(parseInt(value, 10));
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
				})
			);
		this.setSectionVisibility(excerptSection, this.plugin.settings.showExcerpt);

		new Setting(containerEl)
			.setName(t('settings_show_tags'))
			.setDesc(t('settings_show_tags_desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showTags)
				.onChange(async (value) => {
					this.plugin.settings.showTags = value;
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
				})
			);

		new Setting(containerEl)
			.setName(t('settings_section_color_rules'))
			.setHeading();

		let defaultColorPicker: ColorComponent | null = null;

		new Setting(containerEl)
			.setName(t('settings_default_accent_color'))
			.setDesc(t('settings_default_accent_color_desc'))
			.addColorPicker(picker => {
				defaultColorPicker = picker;
				picker
					.setValue(this.plugin.settings.defaultNoteAccentColor || this.getComputedAccentHex())
					.onChange(async (value) => {
						this.plugin.settings.defaultNoteAccentColor = value;
						await this.plugin.saveSettings();
						this.plugin.refreshCalendarView();
					});
			})
			.addButton(button => button
				.setButtonText(t('settings_reset'))
				.setTooltip(t('settings_reset_tooltip'))
				.onClick(async () => {
					this.plugin.settings.defaultNoteAccentColor = '';
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
					if (defaultColorPicker) {
						defaultColorPicker.setValue(this.getComputedAccentHex());
					}
				})
			);

		const rulesContainer = containerEl.createDiv({ cls: 'calendar-rule-container' });
		this.renderRuleRows(rulesContainer);

		new Setting(containerEl)
			.addButton(button => button
				.setButtonText(t('settings_add_rule'))
				.onClick(async () => {
					this.plugin.settings.noteColorRules.push({
						type: 'frontmatter',
						key: '',
						value: '',
						color: this.getComputedAccentHex(),
					});
					this.renderRuleRows(rulesContainer);
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
				})
			);

		new Setting(containerEl)
			.setName(t('settings_section_calendar_display'))
			.setHeading();

		new Setting(containerEl)
			.setName(t('settings_follow_active_note'))
			.setDesc(t('settings_follow_active_note_desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.followActiveNote)
				.onChange(async (value) => {
					this.plugin.settings.followActiveNote = value;
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
				})
			);

		new Setting(containerEl)
			.setName(t('settings_week_starts_on'))
			.setDesc(t('settings_week_starts_on_desc'))
			.addDropdown(dropdown => dropdown
				.addOption('sunday', t('settings_weekday_sunday'))
				.addOption('monday', t('settings_weekday_monday'))
				.setValue(this.plugin.settings.weekStartDay)
				.onChange(async (value) => {
					this.plugin.settings.weekStartDay = value === 'monday' ? 'monday' : 'sunday';
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
				})
			);

		new Setting(containerEl)
			.setName(t('settings_week_numbers'))
			.setDesc(t('settings_week_numbers_desc'))
			.addDropdown(dropdown => dropdown
				.addOption('off', t('settings_week_numbers_off'))
				.addOption('iso-8601', t('settings_week_numbers_iso'))
				.addOption('united-states', t('settings_week_numbers_us'))
				.setValue(this.plugin.settings.weekNumberDisplay)
				.onChange(async (value) => {
					this.plugin.settings.weekNumberDisplay = normalizeWeekNumberDisplay(value);
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
				})
			);

		const dayVisibilitySetting = new Setting(containerEl)
			.setName(t('settings_days_to_show'))
			.setDesc(t('settings_days_to_show_desc'));
		dayVisibilitySetting.settingEl.addClass('calendar-days-setting');
		dayVisibilitySetting.controlEl.empty();

		const dayOptions: Array<{ key: WeekdayVisibilityKey; label: string; shortLabel: string }> = [
			{ key: 'showSunday', label: getWeekdays()[0], shortLabel: getWeekdaysShort()[0] },
			{ key: 'showMonday', label: getWeekdays()[1], shortLabel: getWeekdaysShort()[1] },
			{ key: 'showTuesday', label: getWeekdays()[2], shortLabel: getWeekdaysShort()[2] },
			{ key: 'showWednesday', label: getWeekdays()[3], shortLabel: getWeekdaysShort()[3] },
			{ key: 'showThursday', label: getWeekdays()[4], shortLabel: getWeekdaysShort()[4] },
			{ key: 'showFriday', label: getWeekdays()[5], shortLabel: getWeekdaysShort()[5] },
			{ key: 'showSaturday', label: getWeekdays()[6], shortLabel: getWeekdaysShort()[6] },
		];

		const syncDayCheckboxes = (checkboxes: Map<WeekdayVisibilityKey, HTMLInputElement>): void => {
			dayOptions.forEach(({ key }) => {
				const checkbox = checkboxes.get(key);
				if (checkbox) checkbox.checked = this.plugin.settings[key];
			});
		};

		const dayCheckboxContainer = dayVisibilitySetting.controlEl.createDiv({ cls: 'calendar-days-checkboxes' });
		const dayCheckboxes = new Map<WeekdayVisibilityKey, HTMLInputElement>();

		dayOptions.forEach(({ key, label, shortLabel }) => {
			const option = dayCheckboxContainer.createEl('label', {
				cls: 'calendar-days-checkbox-option',
				attr: { 'aria-label': label, title: label },
			});
			const checkbox = option.createEl('input', {
				type: 'checkbox',
				attr: { 'aria-label': label },
			});
			checkbox.checked = this.plugin.settings[key];
			option.createSpan({ text: shortLabel });
			dayCheckboxes.set(key, checkbox);

			checkbox.onchange = async () => {
				this.plugin.settings[key] = checkbox.checked;
				normalizeWeekdayVisibility(this.plugin.settings);
				await this.plugin.saveSettings();
				this.plugin.refreshCalendarView();
				syncDayCheckboxes(dayCheckboxes);
			};
		});
		new Setting(containerEl)
			.setName(t('settings_show_note_indicators'))
			.setDesc(t('settings_show_note_indicators_desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showDashes)
				.onChange(async (value) => {
					this.plugin.settings.showDashes = value;
					await this.plugin.saveSettings();
					this.plugin.refreshCalendarView();
					this.setSectionVisibility(thresholdSection, value);
				})
			);

		const thresholdSection = containerEl.createDiv({ cls: 'calendar-settings-nested-section' });
		this.setSectionVisibility(thresholdSection, this.plugin.settings.showDashes);

		thresholdSection.createEl('p', {
			text: t('settings_threshold_desc'),
			cls: 'setting-item-description',
		});

		new Setting(thresholdSection)
			.setName(t('settings_indicator_1'))
			.addText(text => text
				.setPlaceholder('1')
				.setValue(String(this.plugin.settings.dashOneThreshold))
				.onChange(async (value) => {
					const num = parseInt(value, 10);
					if (!isNaN(num) && num >= 1) {
						this.plugin.settings.dashOneThreshold = num;
						await this.plugin.saveSettings();
						this.plugin.refreshCalendarView();
					}
				})
			);

		new Setting(thresholdSection)
			.setName(t('settings_indicator_2'))
			.addText(text => text
				.setPlaceholder('3')
				.setValue(String(this.plugin.settings.dashTwoThreshold))
				.onChange(async (value) => {
					const num = parseInt(value, 10);
					if (!isNaN(num) && num >= 1) {
						this.plugin.settings.dashTwoThreshold = num;
						await this.plugin.saveSettings();
						this.plugin.refreshCalendarView();
					}
				})
			);

		new Setting(thresholdSection)
			.setName(t('settings_indicator_3'))
			.addText(text => text
				.setPlaceholder('5')
				.setValue(String(this.plugin.settings.dashThreeThreshold))
				.onChange(async (value) => {
					const num = parseInt(value, 10);
					if (!isNaN(num) && num >= 1) {
						this.plugin.settings.dashThreeThreshold = num;
						await this.plugin.saveSettings();
						this.plugin.refreshCalendarView();
					}
				})
			);

		new Setting(containerEl)
			.setName(t('settings_daily_note_double_tap'))
			.setDesc(t('settings_daily_note_double_tap_desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableDailyNoteOnDoubleTap)
				.onChange(async (value) => {
					this.plugin.settings.enableDailyNoteOnDoubleTap = value;
					await this.plugin.saveSettings();
				})
			);
	}

	private setSectionVisibility(section: HTMLElement, visible: boolean): void {
		section.classList.toggle('is-hidden', !visible);
	}

	private renderRuleRows(rulesContainer: HTMLElement): void {
		rulesContainer.empty();
		this.plugin.settings.noteColorRules.forEach((rule, index) => {
			this.renderRuleRow(rulesContainer, rule, index);
		});
	}

	private renderRuleRow(rulesContainer: HTMLElement, rule: NoteColorRule, index: number): void {
		const rules = this.plugin.settings.noteColorRules;
		const row = new Setting(rulesContainer);
		row.settingEl.addClass('calendar-rule-row');

		row.addDropdown(dropdown => dropdown
			.addOption('frontmatter', t('settings_rule_property'))
			.addOption('tag', t('settings_rule_tag'))
			.setValue(rule.type)
			.onChange(async (value) => {
				rule.type = value === 'tag' ? 'tag' : 'frontmatter';
				this.renderRuleRows(rulesContainer);
				await this.plugin.saveSettings();
				this.plugin.refreshCalendarView();
			})
		);

		if (rule.type === 'frontmatter') {
			row.addText(text => text
				.setPlaceholder(t('settings_rule_key_placeholder'))
				.setValue(rule.key)
				.onChange(async (value) => {
					rule.key = value;
					await this.commitRuleRowEdit(row, rule, index);
				})
			);
		}

		row.addText(text => text
			.setPlaceholder(rule.type === 'tag' ? t('settings_rule_tag_placeholder') : t('settings_rule_value_placeholder'))
			.setValue(rule.value)
			.onChange(async (value) => {
				rule.value = value;
				await this.commitRuleRowEdit(row, rule, index);
			})
		);

		row.addColorPicker(picker => picker
			.setValue(rule.color || this.getComputedAccentHex())
			.onChange(async (value) => {
				rule.color = value;
				await this.commitRuleRowEdit(row, rule, index);
			})
		);

		row.addExtraButton(button => button
			.setIcon('chevron-up')
			.setTooltip(t('settings_rule_move_up'))
			.setDisabled(index === 0)
			.onClick(async () => {
				[rules[index - 1], rules[index]] = [rules[index], rules[index - 1]];
				this.renderRuleRows(rulesContainer);
				await this.plugin.saveSettings();
				this.plugin.refreshCalendarView();
			})
		);

		row.addExtraButton(button => button
			.setIcon('chevron-down')
			.setTooltip(t('settings_rule_move_down'))
			.setDisabled(index === rules.length - 1)
			.onClick(async () => {
				[rules[index + 1], rules[index]] = [rules[index], rules[index + 1]];
				this.renderRuleRows(rulesContainer);
				await this.plugin.saveSettings();
				this.plugin.refreshCalendarView();
			})
		);

		row.addExtraButton(button => button
			.setIcon('trash-2')
			.setTooltip(t('settings_rule_remove'))
			.onClick(async () => {
				rules.splice(index, 1);
				this.renderRuleRows(rulesContainer);
				await this.plugin.saveSettings();
				this.plugin.refreshCalendarView();
			})
		);

		row.setDesc(this.buildRuleFeedback(rule, index));
	}

	private async commitRuleRowEdit(row: Setting, rule: NoteColorRule, index: number): Promise<void> {
		row.setDesc(this.buildRuleFeedback(rule, index));
		await this.plugin.saveSettings();
		this.plugin.refreshCalendarView();
	}

	private buildRuleFeedback(rule: NoteColorRule, index: number): string {
		if (!isCompleteNoteColorRule(rule)) {
			return rule.type === 'tag'
				? t('settings_rule_value_required')
				: t('settings_rule_key_value_required');
		}

		const earlierMatchIndex = this.findEarlierMatchingRule(rule, index);
		if (earlierMatchIndex !== null) {
			return t('settings_rule_never_applies', { n: earlierMatchIndex + 1 });
		}

		return '';
	}

	private findEarlierMatchingRule(rule: NoteColorRule, index: number): number | null {
		const key = rule.key.trim();
		const value = rule.value.trim();

		for (let earlierIndex = 0; earlierIndex < index; earlierIndex++) {
			const earlier = this.plugin.settings.noteColorRules[earlierIndex];
			if (earlier.type !== rule.type || !isCompleteNoteColorRule(earlier)) {
				continue;
			}

			if (earlier.type === 'frontmatter') {
				if (earlier.key.trim().toLowerCase() === key.toLowerCase() && earlier.value.trim() === value) {
					return earlierIndex;
				}
			} else if (
				normalizeNoteColorRuleKey('tag', earlier.value) === normalizeNoteColorRuleKey('tag', value)
			) {
				// Tag duplicates compare the normalized value pattern by exact
				// equality; overlapping wildcards (e.g. `sistemas/*` vs
				// `sistemas/reunion`) are NOT detected — documented limitation.
				return earlierIndex;
			}
		}

		return null;
	}

	private getComputedAccentHex(): string {
		const accent = getComputedStyle(this.containerEl.doc.body)
			.getPropertyValue('--interactive-accent')
			.trim();
		return HEX_COLOR_PATTERN.test(accent) ? accent : '#7d7d7d';
	}

	private buildTimeFormatDesc(format: TimeDisplayFormat): string {
		const now = new Date();
		const preview = formatDateTime(now, format);
		return `${t('settings_example')} HH:mm, hh:mm:ss aa, YYYY-MM-DD. ${t('settings_preview')} ${preview}`;
	}

	private buildDateFormatDesc(format: string): string {
		const preview = formatDateTime(new Date(), format);
		return `${t('settings_example')} DD-MM-YYYY, YYYY-MM-DD. ${t('settings_preview')} ${preview}`;
	}
}
