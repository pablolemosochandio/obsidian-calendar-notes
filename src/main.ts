import { Plugin, WorkspaceLeaf } from 'obsidian';
import { CalendarView, VIEW_TYPE_CALENDAR } from './views/calendar-view';
import {
	CalendarPluginSettings,
	CalendarSettingTab,
	DEFAULT_SETTINGS,
	isCompleteNoteColorRule,
	normalizeDefaultNoteAccentColor,
	normalizeExcerptLines,
	normalizeFollowActiveNote,
	normalizeLanguage,
	normalizeNoteColorRules,
	normalizeNoteSortBy,
	normalizeNoteDateProperty,
	normalizeNoteDatePropertyFormat,
	normalizeSortOrder,
	normalizeShowTags,
	normalizeWeekNumberDisplay,
	normalizeTimeDisplayFormat,
	normalizeWeekdayVisibility,
} from './settings';
import { t, setLanguage } from './i18n';

export default class CalendarPlugin extends Plugin {
	settings!: CalendarPluginSettings;

	async onload(): Promise<void> {
		await this.loadSettings();
		setLanguage(this.settings.language);

		// Register the calendar view
		this.registerView(
			VIEW_TYPE_CALENDAR,
			(leaf: WorkspaceLeaf) => new CalendarView(leaf, this)
		);

		// Add settings tab
		this.addSettingTab(new CalendarSettingTab(this.app, this));

		// Add a ribbon icon to open the calendar view
		this.addRibbonIcon('calendar-glyph', t('main_open_calendar'), async () => {
			await this.activateView();
		});

		// Add a command to open the calendar
		this.addCommand({
			id: 'open-calendar',
			name: t('main_open_calendar'),
			callback: async () => {
				await this.activateView();
			}
		});

		// Open the calendar view when the workspace is ready
		this.app.workspace.onLayoutReady(() => {
			void this.activateView();
		});
	}

	onunload(): void {
	}

	async loadSettings(): Promise<void> {
		const loadedData = await this.loadData();
		const parsedData = (loadedData ?? {}) as Partial<CalendarPluginSettings>;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, parsedData);
		this.settings.enableDailyNoteOnDoubleTap = this.settings.enableDailyNoteOnDoubleTap !== false;
		this.settings.followActiveNote = normalizeFollowActiveNote(this.settings.followActiveNote);
		this.settings.timeIsoDisplay = normalizeTimeDisplayFormat(this.settings.timeIsoDisplay ?? '');
		this.settings.excerptLines = normalizeExcerptLines(this.settings.excerptLines ?? DEFAULT_SETTINGS.excerptLines);
		this.settings.showTags = normalizeShowTags(this.settings.showTags);
		this.settings.noteSortBy = normalizeNoteSortBy(this.settings.noteSortBy ?? '');
		this.settings.noteSortOrder = normalizeSortOrder(this.settings.noteSortOrder ?? '');
		this.settings.noteDateProperty = normalizeNoteDateProperty(this.settings.noteDateProperty ?? '');
		this.settings.noteDatePropertyFormat = normalizeNoteDatePropertyFormat(this.settings.noteDatePropertyFormat ?? '');
		this.settings.noteColorRules = normalizeNoteColorRules(this.settings.noteColorRules);
		this.settings.defaultNoteAccentColor = normalizeDefaultNoteAccentColor(this.settings.defaultNoteAccentColor);
		this.settings.weekNumberDisplay = normalizeWeekNumberDisplay(this.settings.weekNumberDisplay ?? '');
		this.settings.language = normalizeLanguage(this.settings.language);
		normalizeWeekdayVisibility(this.settings);
	}

	async saveSettings(): Promise<void> {
		// Incomplete rules (empty key/value) live in memory for the settings
		// tab but are never persisted; the load normalizer drops them anyway.
		const settingsToSave = {
			...this.settings,
			noteColorRules: this.settings.noteColorRules.filter((rule) => isCompleteNoteColorRule(rule)),
		};
		await this.saveData(settingsToSave);
	}

	refreshCalendarView(): void {
		this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).forEach(leaf => {
			if (leaf.view instanceof CalendarView) {
				leaf.view.refresh();
			}
		});
	}

	async activateView(): Promise<void> {
		try {
			const { workspace } = this.app;

			let leaf: WorkspaceLeaf | null = null;

			// Look for an existing calendar view
			const leaves = workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);
			if (leaves.length > 0) {
				leaf = leaves[0];
			} else {
				// Create a new leaf in the right sidebar
				leaf = workspace.getRightLeaf(false);
				if (leaf) {
					await leaf.setViewState({ type: VIEW_TYPE_CALENDAR, active: true });
				}
			}

			// Reveal the leaf
			if (leaf) {
				workspace.setActiveLeaf(leaf, { focus: false });
			}
		} catch (error) {
			console.error('Failed to activate calendar view:', error);
		}
	}
}
