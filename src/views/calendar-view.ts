import { WorkspaceLeaf, ItemView, Notice, TFile, TFolder, moment, normalizePath, setIcon } from 'obsidian';
import type CalendarPlugin from '../main';
import { formatDateTime } from '../settings';
import { resolveNoteDate } from '../note-date';
import { evaluateNoteColor } from '../note-rules';
import { t, getMonths, getMonthsShort, getWeekdaysShort } from '../i18n';

export const VIEW_TYPE_CALENDAR = 'calendar-view';

interface DailyNotesCoreSettings {
	folder: string;
	format: string;
	template: string;
}

interface DailyNotesCoreOptionsLike {
	folder?: unknown;
	format?: unknown;
	template?: unknown;
	templatePath?: unknown;
	template_file?: unknown;
	templateFile?: unknown;
}

interface DailyNotesCorePlugin {
	enabled?: boolean;
	instance?: {
		options?: Partial<DailyNotesCoreSettings>;
	};
}

interface AppWithInternalPlugins {
	internalPlugins?: {
		getPluginById?: (id: string) => DailyNotesCorePlugin | undefined;
		plugins?: Record<string, DailyNotesCorePlugin | undefined>;
	};
}

export class CalendarView extends ItemView {
	private plugin: CalendarPlugin;
	private currentDate: Date;
	private selectedDate: Date | null = null;
	private selectedWeekStart: Date | null = null;
	private calendarContainer: HTMLElement | null = null;
	private notesContainer: HTMLElement | null = null;
	private monthDisplayContainer: HTMLElement | null = null;
	private monthDisplayButton: HTMLButtonElement | null = null;
	private yearDisplayButton: HTMLButtonElement | null = null;
	private headerSelectorPopover: HTMLElement | null = null;
	private activeHeaderSelector: 'month' | 'year' | null = null;
	private yearSelectorCenter: number;
	private modifyDebounceTimer: number | null = null;
	private refreshGeneration = 0;
	private lastTouchTapDateKey: string | null = null;
	private lastTouchTapTimestamp = 0;
	private lastFollowedNotePath: string | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: CalendarPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.currentDate = new Date();
		this.selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate());
		this.yearSelectorCenter = this.currentDate.getFullYear();
	}

	getViewType(): string {
		return VIEW_TYPE_CALENDAR;
	}

	getDisplayText(): string {
		return t('calendar');
	}

	getIcon(): string {
		return 'calendar-search';
	}

	onOpen(): Promise<void> {
		this.resolveOpenSelection();
		this.createCalendarView();
		const activeWindow = window.activeWindow ?? window;
		const activeDocument = window.activeDocument ?? document;
		// registerEvent automatically detaches listeners when the view is closed
		this.registerEvent(this.app.vault.on('create', () => this.refresh()));
		this.registerEvent(this.app.vault.on('delete', () => this.refresh()));
		this.registerEvent(this.app.vault.on('rename', () => this.refresh()));
		this.registerEvent(this.app.vault.on('modify', () => {
			if (this.modifyDebounceTimer) activeWindow.clearTimeout(this.modifyDebounceTimer);
			this.modifyDebounceTimer = activeWindow.setTimeout(() => this.refresh(), 400);
		}));
		this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.onActiveLeafChange()));
		this.registerDomEvent(activeDocument, 'click', (event) => {
			if (!this.activeHeaderSelector || !this.monthDisplayContainer) return;
			if (!this.monthDisplayContainer.contains(event.target as Node)) {
				this.closeHeaderSelector();
			}
		});
		return Promise.resolve();
	}

	onClose(): Promise<void> {
		if (this.modifyDebounceTimer) (window.activeWindow ?? window).clearTimeout(this.modifyDebounceTimer);
		return Promise.resolve();
	}

	// Called by the plugin when settings change
	public refresh(): void {
		this.refreshGeneration++;
		this.renderHeader();
		this.renderCalendar();
		this.updateNotesList();
		this.renderHeaderSelector();
	}

	private onActiveLeafChange(): void {
		if (!this.plugin.settings.followActiveNote) {
			return;
		}

		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== 'md') {
			return;
		}

		if (activeFile.path === this.lastFollowedNotePath) {
			return;
		}

		const resolved = resolveNoteDate(activeFile, this.app, this.plugin.settings);
		const target = new Date(
			resolved.date.getFullYear(),
			resolved.date.getMonth(),
			resolved.date.getDate()
		);

		if (this.selectedDate && !this.selectedWeekStart && this.isSameDay(this.selectedDate, target)) {
			this.lastFollowedNotePath = activeFile.path;
			return;
		}

		this.lastFollowedNotePath = activeFile.path;
		this.currentDate = new Date(target.getFullYear(), target.getMonth(), 1);
		this.selectedDate = target;
		this.selectedWeekStart = null;
		this.yearSelectorCenter = target.getFullYear();
		this.renderHeader();
		this.renderCalendar();
		this.updateNotesList();
	}

	// One-time view-open selection: an active note (follow ON) wins over the
	// constructor's default of today. Resolves synchronously before the first
	// render so the view never selects today and then jumps — no visual flash.
	private resolveOpenSelection(): void {
		if (!this.plugin.settings.followActiveNote) {
			return;
		}

		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== 'md') {
			return;
		}

		const resolved = resolveNoteDate(activeFile, this.app, this.plugin.settings);
		this.currentDate = new Date(resolved.date.getFullYear(), resolved.date.getMonth(), 1);
		this.selectedDate = new Date(resolved.date.getFullYear(), resolved.date.getMonth(), resolved.date.getDate());
		this.yearSelectorCenter = resolved.date.getFullYear();
		this.lastFollowedNotePath = activeFile.path;
	}

	private createCalendarView(): void {
		// Use contentEl per Obsidian docs: https://docs.obsidian.md/Plugins/User+interface/Views
		const container = this.contentEl;
		container.empty();

		const mainContainer = container.createDiv('calendar-main-container');
		
		// Create header with month/year and navigation
		const header = mainContainer.createDiv('calendar-header');
		
		this.monthDisplayContainer = header.createDiv('calendar-month-display');
		this.monthDisplayButton = this.monthDisplayContainer.createEl('button', { cls: 'calendar-month-display-button' });
		this.monthDisplayButton.type = 'button';
		this.monthDisplayButton.onclick = (event) => {
			event.stopPropagation();
			this.openMonthSelector();
		};

		this.yearDisplayButton = this.monthDisplayContainer.createEl('button', { cls: 'calendar-month-display-button' });
		this.yearDisplayButton.type = 'button';
		this.yearDisplayButton.onclick = (event) => {
			event.stopPropagation();
			this.openYearSelector();
		};
		this.renderHeader();

		const navGroup = header.createDiv('calendar-nav-group');

		const prevButton = navGroup.createEl('button', { text: '←' });
		prevButton.addClass('calendar-nav-button');
		prevButton.onclick = () => this.previousMonth();

		const todayButton = navGroup.createEl('button', { text: t('today'), attr: { 'aria-label': t('today_aria') } });
		todayButton.addClass('calendar-nav-button', 'calendar-today-button');
		todayButton.onclick = () => this.goToToday();

		const nextButton = navGroup.createEl('button', { text: '→' });
		nextButton.addClass('calendar-nav-button');
		nextButton.onclick = () => this.nextMonth();

		// Create calendar grid
		this.calendarContainer = mainContainer.createDiv('calendar-grid-container');
		this.renderCalendar();

		// Create notes list container
		this.notesContainer = mainContainer.createDiv('calendar-notes-container');
		this.updateNotesList();
	}

	private renderCalendar() {
		if (!this.calendarContainer) return;
		const calendarContainer = this.calendarContainer;

		calendarContainer.empty();
		const showWeekNumbers = this.plugin.settings.weekNumberDisplay !== 'off';
		const visibleWeekdays = this.getVisibleWeekdays();
		const visibleWeekdayCount = visibleWeekdays.length;
		calendarContainer.style.gridTemplateColumns = showWeekNumbers
			? `auto repeat(${visibleWeekdayCount}, 1fr)`
			: `repeat(${visibleWeekdayCount}, 1fr)`;

		// Add day labels
		if (showWeekNumbers) {
			const weekLabel = calendarContainer.createDiv('calendar-week-label');
			weekLabel.setText(this.getQuarterLabel(this.currentDate));
		}
		visibleWeekdays.forEach(({ label }) => {
			const dayLabel = calendarContainer.createDiv('calendar-day-label');
			dayLabel.setText(label);
		});

		// Get first day of month and number of days
		const year = this.currentDate.getFullYear();
		const month = this.currentDate.getMonth();
		const firstDay = this.getFirstDayOffset(new Date(year, month, 1).getDay());
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const totalWeeks = Math.ceil((firstDay + daysInMonth) / 7);
		const noteCountMap = this.buildNoteCountMap(year, month);

		for (let week = 0; week < totalWeeks; week++) {
			const weekStartDate = this.getCalendarRowStartDate(year, month, week, firstDay);
			if (showWeekNumbers) {
				const weekNumberCell = this.calendarContainer.createDiv('calendar-week-number');
				weekNumberCell.addClass('is-clickable');
				const weekNumberValue = weekNumberCell.createDiv('calendar-week-number-value');
				if (this.plugin.settings.showDashes) {
					weekNumberCell.createDiv('calendar-week-number-spacer');
				}
				if (this.selectedWeekStart && this.isSameDay(weekStartDate, this.selectedWeekStart)) {
					weekNumberCell.addClass('is-selected');
				}
				weekNumberValue.setText(String(this.getWeekNumberForRow(weekStartDate)));
				weekNumberCell.onclick = () => this.selectWeek(weekStartDate);
			}

			for (const weekday of visibleWeekdays) {
				const day = week * 7 + weekday.displayIndex - firstDay + 1;
				// JS Date math normalizes out-of-range day numbers, so trailing
				// days of adjacent months render as real, selectable cells
				// instead of empty placeholders.
				const date = new Date(year, month, day);
				const dayCell = this.calendarContainer.createDiv('calendar-day');

				if (date.getMonth() !== month) {
					dayCell.addClass('calendar-day-adjacent-month');
				}

				// Day number label
				const dayNumber = dayCell.createDiv('calendar-day-number');
				dayNumber.setText(date.getDate().toString());

				// Today highlight — in-month cells only, so viewing another
				// month never marks an adjacent cell as today.
				if (date.getMonth() === month && this.isSameDay(date, new Date())) {
					dayCell.addClass('calendar-day-today');
				}

				// Dash indicators — adjacent-month cells keep an empty dashes
				// container for row alignment.
				if (this.plugin.settings.showDashes) {
					const noteCount = date.getMonth() === month ? (noteCountMap.get(day) ?? 0) : 0;
					const dashCount = this.getDashCount(noteCount);
					const dashEl = dayCell.createDiv('calendar-day-dashes');
					for (let i = 0; i < dashCount; i++) {
						dashEl.createSpan('calendar-day-dash');
					}
				}

				dayCell.onclick = () => this.selectDate(date);
				dayCell.ondblclick = (event) => {
					event.preventDefault();
					void this.openOrCreateDailyNoteForDate(date);
				};
				dayCell.onpointerup = (event) => this.handleDayTouch(event, date);

				if (this.selectedWeekStart && this.isDateInWeek(date, this.selectedWeekStart)) {
					dayCell.addClass('calendar-day-in-selected-week');
				}

				// Check if this day is selected
				if (this.selectedDate && this.isSameDay(date, this.selectedDate)) {
					dayCell.addClass('calendar-day-selected');
				}
			}
		}
	}

	private getFirstDayOffset(day: number): number {
		return this.plugin.settings.weekStartDay === 'monday' ? (day + 6) % 7 : day;
	}

	private getDaysOfWeek(): string[] {
		const weekdaysShort = getWeekdaysShort();
		if (this.plugin.settings.weekStartDay === 'monday') {
			return [weekdaysShort[1], weekdaysShort[2], weekdaysShort[3], weekdaysShort[4], weekdaysShort[5], weekdaysShort[6], weekdaysShort[0]];
		}
		return [weekdaysShort[0], weekdaysShort[1], weekdaysShort[2], weekdaysShort[3], weekdaysShort[4], weekdaysShort[5], weekdaysShort[6]];
	}

	private getVisibleWeekdays(): Array<{ label: string; absoluteDay: number; displayIndex: number }> {
		const orderedDays = this.getOrderedWeekdays();
		const visibleDays = orderedDays.filter(({ absoluteDay }) => this.isWeekdayVisible(absoluteDay));
		return visibleDays.length > 0 ? visibleDays : orderedDays;
	}

	private getOrderedWeekdays(): Array<{ label: string; absoluteDay: number; displayIndex: number }> {
		const weekdaysShort = getWeekdaysShort();
		const order = this.plugin.settings.weekStartDay === 'monday'
			? [1, 2, 3, 4, 5, 6, 0]
			: [0, 1, 2, 3, 4, 5, 6];
		return order.map((absoluteDay, displayIndex) => ({
			label: weekdaysShort[absoluteDay],
			absoluteDay,
			displayIndex,
		}));
	}

	private isWeekdayVisible(absoluteDay: number): boolean {
		switch (absoluteDay) {
			case 0:
				return this.plugin.settings.showSunday;
			case 1:
				return this.plugin.settings.showMonday;
			case 2:
				return this.plugin.settings.showTuesday;
			case 3:
				return this.plugin.settings.showWednesday;
			case 4:
				return this.plugin.settings.showThursday;
			case 5:
				return this.plugin.settings.showFriday;
			case 6:
				return this.plugin.settings.showSaturday;
			default:
				return true;
		}
	}

	private getWeekNumber(date: Date): number {
		if (this.plugin.settings.weekNumberDisplay === 'iso-8601') {
			return this.getIsoWeekNumber(date);
		}
		return this.getUnitedStatesWeekNumber(date);
	}

	private getWeekNumberForRow(weekStartDate: Date): number {
		return this.getWeekNumber(this.getDisplayedWeekAnchorDate(weekStartDate));
	}

	private getDisplayedWeekAnchorDate(weekStartDate: Date): Date {
		const offset = this.plugin.settings.weekStartDay === 'monday' ? 3 : 4;
		return new Date(
			weekStartDate.getFullYear(),
			weekStartDate.getMonth(),
			weekStartDate.getDate() + offset
		);
	}

	private getIsoWeekNumber(date: Date): number {
		const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
		const dayNumber = utcDate.getUTCDay() || 7;
		utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
		const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
		return Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
	}

	private getUnitedStatesWeekNumber(date: Date): number {
		const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		const yearStart = new Date(normalized.getFullYear(), 0, 1);
		const dayOfYear = Math.floor((normalized.getTime() - yearStart.getTime()) / 86400000);
		const jan1Day = yearStart.getDay();
		return Math.floor((dayOfYear + jan1Day) / 7) + 1;
	}

	private selectDate(date: Date) {
		this.selectedDate = date;
		this.selectedWeekStart = null;
		this.renderCalendar();
		this.updateNotesList();
	}

	private selectWeek(weekStartDate: Date) {
		this.selectedWeekStart = new Date(
			weekStartDate.getFullYear(),
			weekStartDate.getMonth(),
			weekStartDate.getDate()
		);
		this.selectedDate = null;
		this.renderCalendar();
		this.updateNotesList();
	}

	private previousMonth() {
		this.closeHeaderSelector();
		this.currentDate = new Date(
			this.currentDate.getFullYear(),
			this.currentDate.getMonth() - 1,
			1
		);
		this.yearSelectorCenter = this.currentDate.getFullYear();
		this.renderHeader();
		this.renderCalendar();
		this.updateNotesList();
	}

	private goToToday() {
		this.closeHeaderSelector();
		const now = new Date();
		this.currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
		this.selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		this.selectedWeekStart = null;
		this.yearSelectorCenter = now.getFullYear();
		this.renderHeader();
		this.renderCalendar();
		this.updateNotesList();
	}

	private nextMonth() {
		this.closeHeaderSelector();
		this.currentDate = new Date(
			this.currentDate.getFullYear(),
			this.currentDate.getMonth() + 1,
			1
		);
		this.yearSelectorCenter = this.currentDate.getFullYear();
		this.renderHeader();
		this.renderCalendar();
		this.updateNotesList();
	}

	private renderHeader() {
		if (!this.monthDisplayButton || !this.yearDisplayButton) return;
		this.monthDisplayButton.setText(this.getMonthName(this.currentDate.getMonth()));
		this.yearDisplayButton.setText(String(this.currentDate.getFullYear()));
	}

	private openMonthSelector() {
		this.activeHeaderSelector = this.activeHeaderSelector === 'month' ? null : 'month';
		this.renderHeaderSelector();
	}

	private openYearSelector() {
		if (this.activeHeaderSelector === 'year') {
			this.closeHeaderSelector();
			return;
		}
		this.yearSelectorCenter = this.currentDate.getFullYear();
		this.activeHeaderSelector = 'year';
		this.renderHeaderSelector();
	}

	private renderHeaderSelector() {
		if (!this.monthDisplayContainer) return;
		if (this.headerSelectorPopover) {
			this.headerSelectorPopover.remove();
			this.headerSelectorPopover = null;
		}
		if (!this.activeHeaderSelector) return;

		const popover = this.monthDisplayContainer.createDiv('calendar-header-popover');
		popover.onclick = (event) => event.stopPropagation();
		this.headerSelectorPopover = popover;

		if (this.activeHeaderSelector === 'month') {
			this.renderMonthSelector(popover);
			return;
		}
		this.renderYearSelector(popover);
	}

	private renderMonthSelector(popover: HTMLElement) {
		const grid = popover.createDiv('calendar-header-selector-grid');
		getMonthsShort().forEach((month, index) => {
			const button = grid.createEl('button', {
				cls: 'calendar-header-selector-option',
				text: month,
			});
			button.type = 'button';
			if (index === this.currentDate.getMonth()) {
				button.addClass('is-selected');
			}
			button.onclick = () => {
				this.currentDate = new Date(this.currentDate.getFullYear(), index, 1);
				this.renderHeader();
				this.renderCalendar();
				this.updateNotesList();
				this.closeHeaderSelector();
			};
		});
	}

	private renderYearSelector(popover: HTMLElement) {
		const nav = popover.createDiv('calendar-header-selector-nav');
		const previousButton = nav.createEl('button', {
			cls: 'calendar-header-selector-nav-button',
			text: '←',
		});
		previousButton.type = 'button';
		previousButton.onclick = () => {
			this.yearSelectorCenter -= 9;
			this.renderHeaderSelector();
		};

		const rangeLabel = nav.createDiv('calendar-header-selector-range');
		rangeLabel.setText(`${this.yearSelectorCenter - 4} - ${this.yearSelectorCenter + 4}`);

		const nextButton = nav.createEl('button', {
			cls: 'calendar-header-selector-nav-button',
			text: '→',
		});
		nextButton.type = 'button';
		nextButton.onclick = () => {
			this.yearSelectorCenter += 9;
			this.renderHeaderSelector();
		};

		const grid = popover.createDiv('calendar-header-selector-grid');
		for (let year = this.yearSelectorCenter - 4; year <= this.yearSelectorCenter + 4; year++) {
			const button = grid.createEl('button', {
				cls: 'calendar-header-selector-option',
				text: String(year),
			});
			button.type = 'button';
			if (year === this.currentDate.getFullYear()) {
				button.addClass('is-selected');
			}
			button.onclick = () => {
				this.currentDate = new Date(year, this.currentDate.getMonth(), 1);
				this.renderHeader();
				this.renderCalendar();
				this.updateNotesList();
				this.closeHeaderSelector();
			};
		}
	}

	private closeHeaderSelector() {
		this.activeHeaderSelector = null;
		if (!this.headerSelectorPopover) return;
		this.headerSelectorPopover.remove();
		this.headerSelectorPopover = null;
	}

	private updateNotesList() {
		const selectedDate = this.selectedDate;
		const selectedWeekStart = this.selectedWeekStart;

		if (!this.notesContainer || (!selectedDate && !selectedWeekStart)) {
			if (this.notesContainer) {
				this.notesContainer.empty();
				const emptyMsg = this.notesContainer.createDiv('calendar-notes-empty');
				emptyMsg.setText(t('view_select_date'));
			}
			return;
		}

		this.notesContainer.empty();

		let notes: TFile[];
		if (selectedWeekStart) {
			notes = this.getNotesForWeek(selectedWeekStart);
		} else if (selectedDate) {
			notes = this.getNotesForDate(selectedDate);
		} else {
			return;
		}

		if (notes.length === 0) {
			const emptyMsg = this.notesContainer.createDiv('calendar-notes-empty');
			if (selectedWeekStart) {
				emptyMsg.setText(t('view_no_notes_week', {
					n: this.getWeekNumberForRow(selectedWeekStart),
					start: this.formatDate(selectedWeekStart),
					end: this.formatDate(this.getWeekEndDate(selectedWeekStart)),
				}));
			} else if (selectedDate) {
				emptyMsg.setText(t('view_no_notes_date', { date: this.formatDate(selectedDate) }));
			} else {
				emptyMsg.setText(t('view_no_notes_found'));
			}
			return;
		}

		const notesList = this.notesContainer.createDiv('calendar-notes-list');

		// An explicit default accent applies to every note this container renders.
		const defaultNoteAccent = this.plugin.settings.defaultNoteAccentColor;
		if (defaultNoteAccent) {
			notesList.style.setProperty('--calendar-note-accent-default', defaultNoteAccent);
			notesList.style.setProperty(
				'--calendar-note-accent-default-hover',
				`color-mix(in srgb, ${defaultNoteAccent} 75%, var(--interactive-accent-hover))`
			);
		}

		notes.forEach(note => {
			const noteItem = notesList.createDiv('calendar-note-item');

			// A matching rule colors only the vertical accent bar (border-left).
			const ruleColor = evaluateNoteColor(this.plugin.settings.noteColorRules, note, this.app);
			if (ruleColor) {
				noteItem.style.setProperty('--calendar-note-accent', ruleColor);
				noteItem.style.setProperty(
					'--calendar-note-accent-hover',
					`color-mix(in srgb, ${ruleColor} 75%, var(--interactive-accent-hover))`
				);
			}

			noteItem.onclick = () => {
				void this.app.workspace.getLeaf(false).openFile(note);
			};

			// Creation time
			if (this.plugin.settings.showTime) {
				const resolved = resolveNoteDate(note, this.app, this.plugin.settings);
				const timeEl = noteItem.createDiv('calendar-note-time');
				timeEl.setText(
					resolved.fromProperty
						? formatDateTime(resolved.date, 'YYYY-MM-DD')
						: formatDateTime(resolved.date, this.plugin.settings.timeIsoDisplay)
				);
			}

			// Note name text (row click opens the note)
			const noteLink = noteItem.createDiv('calendar-note-name');
			noteLink.setText(note.basename || note.name);

			// Excerpt — read async and populate when ready
			if (this.plugin.settings.showExcerpt) {
				const excerptEl = noteItem.createDiv('calendar-note-excerpt');
				excerptEl.addClass(`calendar-note-excerpt-lines-${this.plugin.settings.excerptLines}`);
				excerptEl.setText('...');
				const generation = this.refreshGeneration;
				void this.populateExcerpt(note, excerptEl, generation);
			}

			// Frontmatter tag chips — visual only, no handlers
			if (this.plugin.settings.showTags) {
				const tagRow = noteItem.createDiv('calendar-note-tag-row');
				for (const tag of this.getFrontmatterTags(note)) {
					const chip = tagRow.createSpan('calendar-note-tag');
					setIcon(chip, 'tag');
					chip.appendText(tag);
				}
			}
		});
	}

	private async populateExcerpt(note: TFile, excerptEl: HTMLElement, generation: number): Promise<void> {
		try {
			const content = await this.app.vault.cachedRead(note);
			if (this.refreshGeneration !== generation) {
				return;
			}

			excerptEl.setText(this.createExcerptText(content, this.plugin.settings.excerptLines) || '—');
		} catch {
			if (this.refreshGeneration === generation) {
				excerptEl.setText('—');
			}
		}
	}

	private createExcerptText(content: string, excerptLines: number): string {
		// (a) frontmatter first — leading `---` block may contain fences/tags.
		const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, '');
		// (b) fences before line slicing — block content spans newlines.
		const withoutFences = withoutFrontmatter.replace(/```[\s\S]*?```/g, '');
		// (c) horizontal rules before split — standalone `---`/`***` lines.
		const withoutRules = withoutFences.replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '');
		// (d) media before wikilinks/links — avoid a stray `!` surviving.
		const withoutMedia = withoutRules
			.replace(/!\[\[[^\]]*\]\]/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '');
		// (e) headings before (f) tags — heading regex needs whitespace, tags do not.
		const withoutHeadings = withoutMedia.replace(/^#{1,6}\s+/gm, '');
		// (f) inline tags.
		const withoutTags = withoutHeadings.replace(/#[\w/-]+/g, '');
		// (g) wikilinks before (h) links — pipe-alias form before simple form.
		const wikilinks = withoutTags
			.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1');
		// (h) markdown links.
		const links = wikilinks.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
		// (i) inline strip — blockquotes, list markers, strikethrough, then
		//     backslash escapes BEFORE emphasis deletion (so `\*literal\*` unescapes
		//     to `*literal*` and then strips to `literal`), then raw HTML — only
		//     after structural markdown resolved.
		const inline = links
			.replace(/^>\s?/gm, '')
			.replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
			.replace(/~([^~]+)~/g, '$1')
			.replace(/\\([\\`*_{}[\]()#+.!~>-])/g, '$1')
			.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '').replace(/`/g, '')
			.replace(/<[^>]+>/g, '');
		// (j) per-line collapse (never across `\n`), (k) drop blanks, then slice N.
		const lines = inline.split('\n')
			.map(l => l.replace(/[ \t]+/g, ' ').trim())
			.filter(l => l.length > 0);
		return lines.slice(0, excerptLines).join('\n');
	}

	private getFrontmatterTags(note: TFile): string[] {
		const raw = this.app.metadataCache.getFileCache(note)?.frontmatter?.tags;
		if (raw == null) return [];
		const list = Array.isArray(raw) ? raw : [raw];
		return list.filter((t): t is string => typeof t === 'string');
	}

	private getNotesForDate(date: Date): TFile[] {
		const notes: TFile[] = [];

		// Get all markdown files and filter by creation date
		this.app.vault.getMarkdownFiles().forEach(file => {
			if (this.isNoteCreatedOnDate(file, date)) {
				notes.push(file);
			}
		});

		return this.sortNotes(notes);
	}

	private getNotesForWeek(weekStartDate: Date): TFile[] {
		const notes: TFile[] = [];
		this.app.vault.getMarkdownFiles().forEach(file => {
			if (this.isNoteCreatedInWeek(file, weekStartDate)) {
				notes.push(file);
			}
		});
		return this.sortNotes(notes);
	}

	private sortNotes(notes: TFile[]): TFile[] {
		const direction = this.plugin.settings.noteSortOrder === 'ascending' ? 1 : -1;
		const settings = this.plugin.settings;
		return notes.sort((left, right) => {
			if (settings.noteSortBy === 'creation-time' || settings.noteSortBy === 'note-property') {
				const timeDifference =
					resolveNoteDate(left, this.app, settings).date.getTime()
					- resolveNoteDate(right, this.app, settings).date.getTime();
				if (timeDifference !== 0) {
					return timeDifference * direction;
				}
			}

			const nameDifference = left.basename.localeCompare(right.basename);
			if (nameDifference !== 0) {
				return nameDifference * direction;
			}

			return (left.stat.ctime - right.stat.ctime) * direction;
		});
	}

	private buildNoteCountMap(year: number, month: number): Map<number, number> {
		const map = new Map<number, number>();
		this.app.vault.getMarkdownFiles().forEach(file => {
			const fileDate = resolveNoteDate(file, this.app, this.plugin.settings).date;
			if (fileDate.getFullYear() === year && fileDate.getMonth() === month) {
				const day = fileDate.getDate();
				map.set(day, (map.get(day) ?? 0) + 1);
			}
		});
		return map;
	}

	private getDashCount(noteCount: number): number {
		const { dashOneThreshold, dashTwoThreshold, dashThreeThreshold } = this.plugin.settings;
		if (noteCount >= dashThreeThreshold) return 3;
		if (noteCount >= dashTwoThreshold) return 2;
		if (noteCount >= dashOneThreshold) return 1;
		return 0;
	}

	private isNoteCreatedOnDate(file: TFile, date: Date): boolean {
		const fileDate = resolveNoteDate(file, this.app, this.plugin.settings).date;
		return this.isSameDay(fileDate, date);
	}

	private isNoteCreatedInWeek(file: TFile, weekStartDate: Date): boolean {
		const fileDate = resolveNoteDate(file, this.app, this.plugin.settings).date;
		return this.isDateInWeek(fileDate, weekStartDate);
	}

	private isSameDay(date1: Date, date2: Date): boolean {
		return date1.getDate() === date2.getDate() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getFullYear() === date2.getFullYear();
	}

	private formatDate(date: Date): string {
		const pad = (n: number): string => ('0' + String(n)).slice(-2);
		const year = date.getFullYear();
		return `${year}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	}

	private getQuarterLabel(date: Date): string {
		return t('quarter', { n: Math.floor(date.getMonth() / 3) + 1 });
	}

	private getCalendarRowStartDate(year: number, month: number, week: number, firstDayOffset: number): Date {
		return new Date(year, month, week * 7 - firstDayOffset + 1);
	}

	private getWeekEndDate(weekStartDate: Date): Date {
		return new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate() + 6);
	}

	private isDateInWeek(date: Date, weekStartDate: Date): boolean {
		const weekEndDate = this.getWeekEndDate(weekStartDate);
		const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
		const normalizedStart = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate()).getTime();
		const normalizedEnd = new Date(weekEndDate.getFullYear(), weekEndDate.getMonth(), weekEndDate.getDate()).getTime();
		return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
	}

	private getWeekLabel(weekStartDate: Date): string {
		const weekEndDate = this.getWeekEndDate(weekStartDate);
		return t('week_label', {
			n: this.getWeekNumberForRow(weekStartDate),
			start: this.formatDate(weekStartDate),
			end: this.formatDate(weekEndDate),
		});
	}

	private getMonthName(month: number): string {
		return this.getMonthNames()[month] ?? '';
	}

	private getMonthNames(): string[] {
		return [...getMonths()];
	}

	private handleDayTouch(event: PointerEvent, date: Date): void {
		if (event.pointerType !== 'touch') {
			return;
		}

		const currentTapDateKey = this.formatDate(date);
		const now = Date.now();
		const isDoubleTap = this.lastTouchTapDateKey === currentTapDateKey && (now - this.lastTouchTapTimestamp) <= 350;

		this.lastTouchTapDateKey = currentTapDateKey;
		this.lastTouchTapTimestamp = now;

		if (!isDoubleTap) {
			return;
		}

		this.lastTouchTapDateKey = null;
		this.lastTouchTapTimestamp = 0;
		void this.openOrCreateDailyNoteForDate(date);
	}

	private async openOrCreateDailyNoteForDate(date: Date): Promise<void> {
		if (!this.plugin.settings.enableDailyNoteOnDoubleTap) {
			return;
		}

		const dailyNotesSettings = this.getDailyNotesCoreSettings();
		if (!dailyNotesSettings.enabled) {
			new Notice(t('view_daily_notes_disabled'));
			return;
		}

		const fileName = `${this.formatWithMoment(date, dailyNotesSettings.format)}.md`;
		const notePath = normalizePath(
			dailyNotesSettings.folder ? `${dailyNotesSettings.folder}/${fileName}` : fileName
		);

		try {
			const existingFile = this.app.vault.getAbstractFileByPath(notePath);
			if (existingFile instanceof TFile) {
				await this.app.workspace.getLeaf(false).openFile(existingFile);
				return;
			}

			if (existingFile) {
				new Notice(t('view_daily_note_folder_exists', { path: notePath }));
				return;
			}

			await this.ensureParentFolderExists(notePath);
			const templateContent = await this.readDailyNoteTemplate(dailyNotesSettings.template);
			const renderedTemplate = this.renderCoreTemplate(
				templateContent,
				date,
				fileName.replace(/\.md$/i, ''),
				dailyNotesSettings.format
			);
			const timestamp = this.getDailyNoteTimestamp(date);
			const createdFile = await this.app.vault.create(notePath, renderedTemplate, {
				ctime: timestamp,
				mtime: timestamp,
			});
			await this.app.workspace.getLeaf(false).openFile(createdFile);
		} catch (error) {
			console.error('Failed to create daily note from calendar:', error);
			new Notice(t('view_daily_note_create_failed', { date: this.formatDate(date) }));
		}
	}

	private getDailyNotesCoreSettings(): DailyNotesCoreSettings & { enabled: boolean } {
		const appWithInternalPlugins = this.app as unknown as AppWithInternalPlugins;
		const plugin = appWithInternalPlugins.internalPlugins?.getPluginById?.('daily-notes')
			?? appWithInternalPlugins.internalPlugins?.plugins?.['daily-notes'];
		const instanceCandidate = plugin?.instance as unknown;
		const optionsCandidate = (plugin?.instance?.options ?? instanceCandidate ?? {}) as DailyNotesCoreOptionsLike;

		const folder = this.readDailyNotesOption(optionsCandidate.folder);
		const format = this.readDailyNotesOption(optionsCandidate.format).length > 0
			? this.readDailyNotesOption(optionsCandidate.format)
			: 'YYYY-MM-DD';
		const template = this.readDailyNotesOption(optionsCandidate.template)
			|| this.readDailyNotesOption(optionsCandidate.templatePath)
			|| this.readDailyNotesOption(optionsCandidate.template_file)
			|| this.readDailyNotesOption(optionsCandidate.templateFile);

		return {
			enabled: plugin?.enabled === true,
			folder,
			format,
			template,
		};
	}

	private async ensureParentFolderExists(filePath: string): Promise<void> {
		const segments = filePath.split('/');
		if (segments.length <= 1) {
			return;
		}

		segments.pop();
		let currentPath = '';
		for (const segment of segments) {
			currentPath = currentPath ? `${currentPath}/${segment}` : segment;
			const existing = this.app.vault.getAbstractFileByPath(currentPath);
			if (!existing) {
				await this.app.vault.createFolder(currentPath);
				continue;
			}

			if (!(existing instanceof TFolder)) {
				throw new Error(`Cannot create folder ${currentPath} because a file already exists at this path.`);
			}
		}
	}

	private async readDailyNoteTemplate(templatePath: string): Promise<string> {
		if (!templatePath) {
			return '';
		}

		const templateFile = this.resolveDailyTemplateFile(templatePath);
		if (!templateFile) return '';

		try {
			return await this.app.vault.cachedRead(templateFile);
		} catch {
			return '';
		}
	}

	private resolveDailyTemplateFile(templatePath: string): TFile | null {
		const trimmed = templatePath.trim();
		if (!trimmed) return null;

		const candidates = new Set<string>();
		candidates.add(normalizePath(trimmed));
		candidates.add(normalizePath(trimmed.replace(/^\/+/, '')));
		if (!/\.md$/i.test(trimmed)) {
			candidates.add(normalizePath(`${trimmed}.md`));
			candidates.add(normalizePath(`${trimmed.replace(/^\/+/, '')}.md`));
		}

		for (const candidate of candidates) {
			const file = this.app.vault.getAbstractFileByPath(candidate);
			if (file instanceof TFile) {
				return file;
			}
		}

		const wantedPath = normalizePath(trimmed).replace(/\.md$/i, '').toLowerCase();
		return this.app.vault.getMarkdownFiles().find((file) => {
			const filePathNoExtension = file.path.replace(/\.md$/i, '').toLowerCase();
			return filePathNoExtension === wantedPath || file.basename.toLowerCase() === wantedPath;
		}) ?? null;
	}

	private renderCoreTemplate(template: string, date: Date, title: string, dateFormat: string): string {
		if (!template) {
			return '';
		}

		return template.replace(/{{\s*(date|time|title)(?::([^}]+))?\s*}}/gi, (_match, token: string, format: string) => {
			const normalizedToken = token.toLowerCase();
			if (normalizedToken === 'title') {
				return title;
			}

			const tokenFormat = (format ?? '').trim();
			if (normalizedToken === 'date') {
				return this.formatWithMoment(date, tokenFormat || dateFormat || 'YYYY-MM-DD');
			}

			const timeSource = new Date(date.getFullYear(), date.getMonth(), date.getDate());
			return this.formatWithMoment(timeSource, tokenFormat || 'HH:mm');
		});
	}

	private readDailyNotesOption(value: unknown): string {
		return typeof value === 'string' ? value.trim() : '';
	}

	private formatWithMoment(date: Date, format: string): string {
		const momentFormatter = moment as unknown as (input?: Date) => { format: (pattern: string) => string };
		return momentFormatter(date).format(format);
	}

	private getDailyNoteTimestamp(date: Date): number {
		// Use midday local time to avoid DST edge cases around midnight.
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0).getTime();
	}
}
