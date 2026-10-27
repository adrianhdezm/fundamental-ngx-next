/*
 * Port of @fundamental-ngx/core (calendar) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    ElementRef,
    Injector,
    afterNextRender,
    booleanAttribute,
    computed,
    effect,
    forwardRef,
    inject,
    input,
    model,
    output,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import {
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    type ControlValueAccessor,
    type ValidationErrors,
    type Validator
} from '@angular/forms';
import { DATE_TIME_FORMATS, DatetimeAdapter } from '@/lib/datetime';
import { cn, type ClassValue } from '@/lib/utils';
import { Button, buttonVariants } from '@/ui/button/button';

export type CalendarType = 'single' | 'range';
export type FdCalendarView = 'day' | 'month' | 'year' | 'aggregatedYear';
/** Day of the week from 1 (Sunday) to 7 (Saturday). */
export type DaysOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** The month shown. */
export interface CalendarCurrent {
    month: number;
    year: number;
}

/** A range of dates; either end may still be missing while it is picked. */
export class DateRange<D> {
    constructor(
        readonly start: D | null,
        readonly end: D | null
    ) {}
}

/** Marks days with a legend colour (1 to 20) and lists them in the legend. */
export interface SpecialDayRule<D> {
    specialDayNumber: number;
    rule: (date: D) => boolean;
    legendText?: string;
    /** Shows a round marker in the legend. */
    appointment?: boolean;
}

export interface CalendarYearGrid {
    rows: number;
    cols: number;
    /** Custom year labels, e.g. for other eras. */
    yearMapping?: (year: number) => string;
}

export interface AggregatedYear {
    startYear: number;
    endYear: number;
}

export type DisableDateFunction<D> = ((date: D) => boolean) | null | undefined;
export type EscapeFocusFunction = ((event?: KeyboardEvent) => void) | null | undefined;
export type NavigationButtonDisableFunction<D> = (
    date: D | null | undefined,
    currentlyDisplayed: CalendarCurrent,
    activeView: FdCalendarView
) => boolean;

/** Texts of the calendar, in English by default. */
export interface CalendarLabels {
    calendarRoleDescription: string;
    dayViewDescription: string;
    monthViewDescription: string;
    yearsViewDescription: string;
    yearsRangeViewDescription: string;
    previousMonthLabel: string;
    nextMonthLabel: string;
    previousYearLabel: string;
    nextYearLabel: string;
    monthSelectionLabel: string;
    yearSelectionLabel: string;
    yearsRangeSelectionLabel: string;
    dateSelectionLabel: string;
    weekColumnLabel: string;
    todayLabel: string;
    dateSelectedLabel: string;
    rangeStartLabel: string;
    rangeEndLabel: string;
    dayInPastLabel: string;
    legendLabel: string;
    workDayLabel: string;
    nonWorkDayLabel: string;
    closeCalendarLabel: string;
}

export const CALENDAR_LABELS: CalendarLabels = {
    calendarRoleDescription: 'Calendar',
    dayViewDescription: 'Calendar',
    monthViewDescription: 'Month picker',
    yearsViewDescription: 'Year picker',
    yearsRangeViewDescription: 'Years range picker',
    previousMonthLabel: 'Previous month',
    nextMonthLabel: 'Next month',
    previousYearLabel: 'Previous year',
    nextYearLabel: 'Next year',
    monthSelectionLabel: 'Select month',
    yearSelectionLabel: 'Select year',
    yearsRangeSelectionLabel: 'Select years range',
    dateSelectionLabel: 'Select date',
    weekColumnLabel: 'Calendar week',
    todayLabel: 'Today',
    dateSelectedLabel: 'Selected date',
    rangeStartLabel: 'Range start',
    rangeEndLabel: 'Range end',
    dayInPastLabel: 'Past days',
    legendLabel: 'Calendar Legend',
    workDayLabel: 'Work day',
    nonWorkDayLabel: 'Non-Work day',
    closeCalendarLabel: 'Close calendar'
};

/** A day of the day view. */
export interface CalendarDay<D> {
    date: D;
    id: string;
    index: number;
    label: string;
    ariaLabel: string;
    monthStatus: 'previous' | 'current' | 'next';
    weekend: boolean;
    current: boolean;
    past: boolean;
    selected: boolean;
    selectedFirst: boolean;
    selectedLast: boolean;
    inRange: boolean;
    hoverRange: boolean;
    disabled: boolean;
    specialDayNumber: number | null;
    tabbable: boolean;
}

/** A month, year or years period of the other views. */
interface PickerCell<D> {
    id: string;
    index: number;
    label: string;
    ariaLabel: string;
    value: number;
    date: D;
    current: boolean;
    selected: boolean;
    inRange: boolean;
    disabled: boolean;
    years?: AggregatedYear;
}

/** Background, text and border of a day per look. */
const DAY_LOOK = {
    work: '[--cal-bg:var(--sapLegend_WorkingBackground)] hover:[--cal-bg:var(--sapList_Hover_Background)]',
    weekend:
        '[--cal-bg:var(--sapLegend_NonWorkingBackground)] hover:[--cal-bg:var(--sapList_Hover_Background)] hover:brightness-105',
    other: '[--cal-bg:var(--sapList_Background)] [--cal-text:var(--sapContent_LabelColor)] hover:[--cal-bg:var(--sapList_Hover_Background)]',
    selected:
        '[--cal-bg:var(--sapContent_Selected_Background)] [--cal-text:var(--sapContent_Selected_TextColor)] hover:[--cal-bg:var(--sapList_Hover_Background)] border-2 border-sap-list-selection-border-color [&_[data-cal-text]]:font-sap-font-bold-family',
    range: '[--cal-bg:var(--sapList_SelectionBackgroundColor)] hover:[--cal-bg:var(--sapList_Hover_SelectionBackground)] border-2 border-sap-list-selection-border-color'
};

const CELL =
    'group/cell relative m-px box-border inline-block min-w-8 flex-1 cursor-pointer overflow-hidden rounded-(--sapButton_BorderCornerRadius) border-0 border-solid bg-(--cal-bg) p-0 align-middle outline-none [--cal-text:var(--sapTextColor)]';
const TABLE = 'm-0 box-border table w-full border-spacing-0 p-0';
const TEXT_WRAPPER = 'relative m-0 box-border flex h-full items-center justify-center p-0';
const TEXT =
    'relative box-border flex h-(--cal-text-h) max-w-[calc(100%-0.375rem)] min-w-[1.375rem] grow items-center justify-center rounded-[0.1875rem] text-sap-font-size text-(--cal-text) group-focus/cell:border-(length:--sapContent_FocusWidth) group-focus/cell:[border-style:var(--sapContent_FocusStyle)] group-focus/cell:border-sap-content-focus-color';
const SIDE_HELPER =
    'relative m-px box-border inline-flex h-[1.875rem] min-w-8 flex-1 items-center justify-center self-center border-0 bg-sap-list-background p-0 text-sap-font-small-size font-normal text-sap-content-label-color';
const TODAY =
    "border-2 border-sap-legend-current-date-time shadow-[inset_0_0_0_0.0625rem_var(--sapList_Background)] after:pointer-events-none after:absolute after:inset-px after:rounded-[0.3125rem] after:content-['']";
const TODAY_SELECTED = 'after:border after:border-solid after:border-sap-list-selection-border-color';
/** Special day markers: a coloured bar at the bottom, a rounded one on today. */
const SPECIAL =
    "[&_[data-cal-wrapper]]:after:absolute [&_[data-cal-wrapper]]:after:inset-x-0 [&_[data-cal-wrapper]]:after:bottom-0 [&_[data-cal-wrapper]]:after:h-[0.3125rem] [&_[data-cal-wrapper]]:after:shadow-[inset_0_-0.3125rem_0_var(--cal-legend)] [&_[data-cal-wrapper]]:after:content-['']";
const SPECIAL_SELECTED = '[&_[data-cal-wrapper]]:after:h-1';
const SPECIAL_TODAY =
    "[&_[data-cal-wrapper]]:after:absolute [&_[data-cal-wrapper]]:after:start-px [&_[data-cal-wrapper]]:after:bottom-px [&_[data-cal-wrapper]]:after:h-1 [&_[data-cal-wrapper]]:after:w-[calc(100%-0.125rem)] [&_[data-cal-wrapper]]:after:rounded-b-[0.3125rem] [&_[data-cal-wrapper]]:after:border-b-4 [&_[data-cal-wrapper]]:after:border-solid [&_[data-cal-wrapper]]:after:border-(--cal-legend) [&_[data-cal-wrapper]]:after:content-['']";

let nextId = 0;

/** Late reference to Calendar for the legend declared before it. */
function forwardCalendar(): typeof Calendar {
    return Calendar;
}

/** An entry of the calendar legend: a marker and a text. */
@Component({
    selector: 'fd-calendar-legend-item',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { role: 'listitem', tabindex: '0', '[class]': 'computedClass()' },
    template: `
        <span [class]="markerClass()" [style.--cal-legend]="color() || null"></span>
        <span
            class="m-0 overflow-hidden p-0 align-middle text-sap-font-small-size leading-4 text-ellipsis whitespace-pre-line text-sap-content-label-color"
        >
            <ng-content>{{ text() }}</ng-content>
        </span>
    `
})
export class CalendarLegendItem {
    readonly text = input<string | null | undefined>();
    /** CSS colour of the marker, e.g. `var(--sapLegendColor3)`. */
    readonly color = input<string | null | undefined>();
    /** A round marker for appointments. */
    readonly circle = input(false, { transform: booleanAttribute });
    readonly type = input<'today' | 'selected' | 'work' | 'non-work' | 'special'>('special');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex min-w-[7.5rem] gap-2 rounded-[0.25rem] p-1 font-sap-font-family outline-none compact:p-0.5',
            'focus:shadow-[inset_0_0_0_var(--sapContent_FocusWidth)_var(--sapContent_FocusColor)] active:shadow-[inset_0_0_0_var(--sapContent_FocusWidth)_var(--sapContent_FocusColor)]',
            this.userClass()
        )
    );

    protected readonly markerClass = computed(() => {
        const type = this.type();
        return cn(
            'm-0 box-border size-4 shrink-0 border border-solid border-sap-content-foreground-border-color bg-sap-list-background p-0',
            this.circle() && 'rounded-full',
            type === 'today' && 'border-2 border-sap-legend-current-date-time',
            type === 'selected' && 'bg-sap-selected-color',
            type === 'work' && 'bg-sap-legend-working-background',
            type === 'non-work' && 'bg-sap-legend-non-working-background',
            type === 'special' && 'bg-(--cal-legend)'
        );
    });
}

/**
 * The legend of a calendar: today, selected, work and non-work days and the special days. While a
 * special day's entry has the focus, only its days keep their markers.
 */
@Component({
    selector: 'fd-calendar-legend',
    imports: [CalendarLegendItem],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'list',
        '[attr.aria-label]': 'ariaLabel()',
        '[class]': 'computedClass()'
    },
    template: `
        <ng-content />
        @if (displayTodayLegendItem()) {
            <fd-calendar-legend-item type="today" [text]="labels().todayLabel" />
        }
        @if (displaySelectedLegendItem()) {
            <fd-calendar-legend-item type="selected" [text]="labels().dateSelectedLabel" />
        }
        @if (displayWorkDayLegendItem()) {
            <fd-calendar-legend-item type="work" [text]="labels().workDayLabel" />
        }
        @if (displayNonWorkDayLegendItem()) {
            <fd-calendar-legend-item type="non-work" [text]="labels().nonWorkDayLabel" />
        }
        @for (rule of specialDaysRules(); track rule.specialDayNumber) {
            <fd-calendar-legend-item
                [text]="rule.legendText"
                [circle]="!!rule.appointment"
                [color]="'var(--sapLegendColor' + rule.specialDayNumber + ')'"
                (focus)="focusSpecialDay(rule.specialDayNumber)"
                (blur)="focusSpecialDay(null)"
            />
        }
    `
})
export class CalendarLegend<D> {
    /** Lays the entries out in as many columns as fit. */
    readonly col = input(false, { transform: booleanAttribute });
    readonly displayTodayLegendItem = input(true, { transform: booleanAttribute });
    readonly displaySelectedLegendItem = input(true, { transform: booleanAttribute });
    readonly displayWorkDayLegendItem = input(true, { transform: booleanAttribute });
    readonly displayNonWorkDayLegendItem = input(true, { transform: booleanAttribute });
    readonly specialDaysRules = input<SpecialDayRule<D>[]>([]);
    readonly labelsInput = input<Partial<CalendarLabels>>({}, { alias: 'labels' });

    private readonly calendar = inject(forwardCalendar(), { optional: true });
    protected readonly labels = computed(() => ({ ...CALENDAR_LABELS, ...this.labelsInput() }));
    protected readonly ariaLabel = computed(() => this.labels().legendLabel);

    protected focusSpecialDay(specialDayNumber: number | null): void {
        this.calendar?.focusedSpecialDay.set(specialDayNumber);
    }

    protected readonly computedClass = computed(() =>
        cn('m-0 box-border block bg-sap-list-background p-2 [column-width:7.5rem]', this.col() && '[column-width:auto]')
    );
}

/** A close button for a calendar in a dialog; it names itself "Close calendar". */
@Directive({
    selector: '[fd-calendar-close-button]',
    host: {
        '[attr.aria-label]': 'ariaLabel() || "Close calendar"',
        '[attr.title]': 'ariaLabel() || "Close calendar"'
    }
})
export class CalendarCloseButton {
    readonly ariaLabel = input<string | null | undefined>(null, { alias: 'aria-label' });
}

/**
 * Calendar: picks a date, several dates, a range or several ranges, in a day view with month, year
 * and years range views to navigate. Weekends, today, special days (with a legend), week numbers
 * and disabled dates show in the day view. The arrow keys move between the days, months or years
 * and change the month or page at the edges; Enter and Space select.
 *
 * ```html
 * <fd-calendar [(selectedDate)]="date" />
 * <fd-calendar calType="range" [(selectedRangeDate)]="range" showWeekNumbers />
 * ```
 */
@Component({
    selector: 'fd-calendar',
    exportAs: 'fdCalendar',
    imports: [NgTemplateOutlet, Button, CalendarLegend],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Calendar), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => Calendar), multi: true }
    ],
    host: {
        role: 'group',
        '[attr.id]': 'id()',
        '[attr.aria-roledescription]': 'labels().calendarRoleDescription',
        '[class]': 'computedClass()',
        '(focusout)': 'onFocusout($event)'
    },
    template: `
        <!-- header -->
        <div class="relative m-0 box-border flex w-full justify-center p-0 py-1 compact:py-[0.1875rem]">
            <div class="m-0 me-1 grow-0 p-0">
                <button
                    #previousButton
                    fdButton
                    type="button"
                    variant="transparent"
                    glyph="slim-arrow-left"
                    [id]="id() + '-header-left-arrow'"
                    [disabled]="previousDisabled()"
                    [ariaLabel]="previousLabel()"
                    [attr.title]="previousLabel()"
                    (click)="handlePreviousArrowClick()"
                ></button>
            </div>
            @if (activeView() === 'day') {
                <div class="m-0 mx-1 grow p-0">
                    <button
                        fdButton
                        type="button"
                        variant="transparent"
                        fullWidth
                        [label]="monthName()"
                        [ariaLabel]="monthName() + ', ' + labels().monthSelectionLabel"
                        [attr.data-fd-calendar-month]="displayed().month"
                        (click)="toggleView('month')"
                    ></button>
                </div>
            }
            @if (activeView() === 'day' || activeView() === 'month') {
                <div class="m-0 mx-1 grow p-0">
                    <button
                        fdButton
                        type="button"
                        variant="transparent"
                        fullWidth
                        [label]="yearName(displayed().year)"
                        [ariaLabel]="yearName(displayed().year) + ', ' + labels().yearSelectionLabel"
                        [attr.data-fd-calendar-year]="displayed().year"
                        (click)="toggleView('year')"
                    ></button>
                </div>
            } @else {
                <div class="m-0 mx-1 grow p-0" aria-live="polite">
                    <button
                        fdButton
                        type="button"
                        variant="transparent"
                        fullWidth
                        [label]="yearsRangeLabel()"
                        [ariaLabel]="
                            yearsRangeLabel() +
                            ', ' +
                            (activeView() === 'aggregatedYear'
                                ? labels().dateSelectionLabel
                                : labels().yearsRangeSelectionLabel)
                        "
                        (click)="toggleView('aggregatedYear')"
                    ></button>
                </div>
            }
            <div class="m-0 ms-auto grow-0 p-0">
                <button
                    fdButton
                    type="button"
                    variant="transparent"
                    glyph="slim-arrow-right"
                    [id]="id() + '-header-right-arrow'"
                    [disabled]="nextDisabled()"
                    [ariaLabel]="nextLabel()"
                    [attr.title]="nextLabel()"
                    (click)="handleNextArrowClick()"
                ></button>
            </div>
        </div>

        @switch (activeView()) {
            @case ('day') {
                <table
                    role="grid"
                    class="${TABLE}"
                    [attr.id]="id() + '-day-view'"
                    [attr.aria-roledescription]="labels().dayViewDescription"
                    aria-readonly="false"
                    [attr.aria-multiselectable]="calType() === 'range' || allowMultipleSelection()"
                >
                    <thead class="table-row-group" role="rowgroup">
                        <tr class="flex" role="row">
                            @if (showWeekNumbers()) {
                                <th role="columnheader" class="${SIDE_HELPER}">
                                    <span class="sr-only-sap">{{ labels().weekColumnLabel }}</span>
                                </th>
                            }
                            @for (day of weekDays(); track $index) {
                                <th
                                    role="columnheader"
                                    [class]="weekHeaderClass()"
                                    [attr.aria-label]="day.long"
                                    (click)="toggleWeekColumn($index)"
                                >
                                    {{ day.short }}
                                </th>
                            }
                        </tr>
                    </thead>
                    <tbody class="table-row-group" role="rowgroup">
                        @for (row of dayGrid(); track $index; let rowIndex = $index) {
                            <tr class="flex" role="row">
                                @if (showWeekNumbers()) {
                                    <th
                                        role="rowheader"
                                        scope="row"
                                        [class]="weekHeaderClass() + ' h-(--cal-item-h)'"
                                        [attr.data-fd-calendar-week]="weeks()[rowIndex]"
                                        [attr.aria-label]="labels().weekColumnLabel + ' ' + weeks()[rowIndex]"
                                        (click)="toggleWeek(row)"
                                    >
                                        {{ weeks()[rowIndex] }}
                                    </th>
                                }
                                @for (cell of row; track cell.id) {
                                    <td
                                        role="gridcell"
                                        [attr.id]="cell.id"
                                        [attr.tabindex]="cell.tabbable ? 0 : -1"
                                        [attr.aria-selected]="cell.selected"
                                        [attr.aria-disabled]="cell.disabled || null"
                                        [attr.aria-label]="dayAriaLabel(cell)"
                                        [attr.data-fd-calendar-day]="cell.index"
                                        [attr.data-fd-calendar-date-day]="cell.label"
                                        [attr.data-fd-calendar-month-status]="cell.monthStatus"
                                        [style.--cal-legend]="
                                            cell.specialDayNumber
                                                ? 'var(--sapLegendColor' + cell.specialDayNumber + ')'
                                                : null
                                        "
                                        [class]="dayClass(cell)"
                                        (click)="selectDate(cell, $event)"
                                        (mouseenter)="hoverDate.set(cell.date)"
                                        (keydown)="onDayKeydown($event, cell)"
                                    >
                                        <div data-cal-wrapper class="${TEXT_WRAPPER}">
                                            <span data-cal-text class="${TEXT}">{{ cell.label }}</span>
                                        </div>
                                    </td>
                                }
                            </tr>
                        }
                        <!-- keep the height of six weeks -->
                        @for (row of fillerRows(); track $index) {
                            <tr class="flex" aria-hidden="true">
                                <td class="invisible m-px h-(--cal-item-h) min-w-8"></td>
                            </tr>
                        }
                    </tbody>
                </table>
            }
            @case ('month') {
                <ng-container
                    *ngTemplateOutlet="
                        picker;
                        context: {
                            cells: monthCells(),
                            cols: 3,
                            description: labels().monthViewDescription,
                            view: 'month'
                        }
                    "
                />
            }
            @case ('year') {
                <ng-container
                    *ngTemplateOutlet="
                        picker;
                        context: {
                            cells: yearCells(),
                            cols: yearGrid().cols,
                            description: labels().yearsViewDescription,
                            view: 'year'
                        }
                    "
                />
            }
            @case ('aggregatedYear') {
                <ng-container
                    *ngTemplateOutlet="
                        picker;
                        context: {
                            cells: aggregatedCells(),
                            cols: aggregatedYearGrid().cols,
                            description: labels().yearsRangeViewDescription,
                            view: 'aggregatedYear'
                        }
                    "
                />
            }
        }

        <ng-template #picker let-cells="cells" let-cols="cols" let-description="description" let-view="view">
            <table
                role="grid"
                class="${TABLE} pt-[1.875rem]"
                [attr.id]="id() + '-' + view + '-view'"
                [attr.aria-roledescription]="description"
                aria-readonly="false"
                aria-multiselectable="false"
            >
                <tbody class="table-row-group" role="rowgroup">
                    @for (row of pickerRows(cells, cols); track $index) {
                        <tr class="flex" role="row">
                            @for (cell of row; track cell.id) {
                                <td
                                    role="gridcell"
                                    [attr.id]="cell.id"
                                    [attr.tabindex]="pickerTabbable(cells) === cell ? 0 : -1"
                                    [attr.aria-selected]="cell.selected"
                                    [attr.aria-disabled]="cell.disabled || null"
                                    [attr.aria-label]="pickerAriaLabel(cell)"
                                    [attr.data-fd-calendar-month]="view === 'month' ? cell.value : null"
                                    [attr.data-fd-calendar-year]="view === 'year' ? cell.value : null"
                                    class="${CELL} max-h-(--cal-item-h) [--cal-bg:transparent]"
                                    (click)="selectPickerCell(view, cell, $event)"
                                    (mouseenter)="hoverDate.set(cell.date)"
                                    (keydown)="onPickerKeydown($event, view, cells, cols, cell)"
                                >
                                    <span [class]="pickerButtonClass(cell)">
                                        <span data-cal-text class="${TEXT} text-inherit">{{ cell.label }}</span>
                                    </span>
                                </td>
                            }
                        </tr>
                    }
                </tbody>
            </table>
        </ng-template>

        @if (showCalendarLegend() && specialDaysRules().length) {
            <fd-calendar-legend [specialDaysRules]="specialDaysRules()" [col]="legendCol()" [labels]="labelsInput()" />
        }
    `
})
export class Calendar<D> implements ControlValueAccessor, Validator {
    private readonly adapter = inject<DatetimeAdapter<D>>(DatetimeAdapter);
    private readonly formats = inject(DATE_TIME_FORMATS);

    readonly id = input(`fd-calendar-${nextId++}`);
    readonly calType = input<CalendarType>('single');
    /** Several dates, or several ranges with `calType="range"`. */
    readonly allowMultipleSelection = input(false, { transform: booleanAttribute });
    readonly markWeekends = input(true, { transform: booleanAttribute });
    readonly showWeekNumbers = input(false, { transform: booleanAttribute });
    readonly mobileLandscape = input(false, { transform: booleanAttribute });
    readonly mobilePortrait = input(false, { transform: booleanAttribute });
    /** First day of the week, 1 (Sunday) to 7; by default from the locale. */
    readonly startingDayOfWeek = input<DaysOfWeek | null | undefined>();
    readonly specialDaysRules = input<SpecialDayRule<D>[]>([]);
    readonly yearGrid = input<CalendarYearGrid>({ rows: 4, cols: 5 });
    readonly aggregatedYearGrid = input<CalendarYearGrid>({ rows: 4, cols: 3 });
    /** Highlights the days between the range start and the hovered day while picking a range. */
    readonly rangeHoverEffect = input(false, { transform: booleanAttribute });
    /** Picks ranges of months (`month`) or years (`year`) instead of days. */
    readonly dateRangeFormat = input<'' | 'month' | 'year'>('');
    readonly showCalendarLegend = input(false, { transform: booleanAttribute });
    readonly legendCol = input(false, { transform: booleanAttribute });
    readonly disableFunction = input<DisableDateFunction<D>>();
    readonly disableRangeStartFunction = input<DisableDateFunction<D>>();
    readonly disableRangeEndFunction = input<DisableDateFunction<D>>();
    readonly previousButtonDisableFunction = input<NavigationButtonDisableFunction<D> | null | undefined>();
    readonly nextButtonDisableFunction = input<NavigationButtonDisableFunction<D> | null | undefined>();
    /** What Tab does in the grid; by default it moves to the previous button, keeping the focus in the calendar. */
    readonly escapeFocusFunction = input<EscapeFocusFunction>(undefined);
    readonly labelsInput = input<Partial<CalendarLabels>>({}, { alias: 'labels' });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly activeView = model<FdCalendarView>('day');
    readonly selectedDate = model<D | null | undefined>(this.adapter.today());
    readonly selectedMultipleDates = model<D[]>([]);
    readonly selectedRangeDate = model<DateRange<D> | null | undefined>(null);
    readonly selectedMultipleDateRanges = model<DateRange<D>[]>([]);

    readonly isValidDateChange = output<boolean>();
    /** A selection was made; e.g. a date picker closes. */
    readonly closeCalendar = output<void>();
    readonly closeClicked = output<void>();

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly injector = inject(Injector);
    private readonly previousButton = viewChild('previousButton', { read: ElementRef<HTMLElement> });

    readonly labels = computed(() => ({ ...CALENDAR_LABELS, ...this.labelsInput() }));
    /** The month shown. */
    readonly displayed = signal<CalendarCurrent>(this.monthOf(this.adapter.today()));
    private readonly firstYear = signal(this.adapter.getYear(this.adapter.today()));
    private readonly firstAggregatedYear = signal(this.adapter.getYear(this.adapter.today()));
    readonly hoverDate = signal<D | null>(null);
    /** While a range start is picked with the hover effect. */
    private readonly rangePicking = signal(false);
    /** A range of several ranges whose end is still missing. */
    private readonly newRange = signal<DateRange<D> | null>(null);
    /** The special day whose legend entry has the focus. */
    readonly focusedSpecialDay = signal<number | null>(null);
    private shiftAnchor: D | null = null;

    private onChange: (value: unknown) => void = () => {};
    private onTouched: () => void = () => {};

    /** First day of the week from 1 (Sunday). */
    readonly weekStart = computed<number>(() => {
        this.adapter.locale();
        return this.startingDayOfWeek() ?? this.adapter.getFirstDayOfWeek() + 1;
    });

    protected readonly weekDays = computed(() => {
        this.adapter.locale();
        const start = this.weekStart() - 1;
        const short = this.adapter.getDayOfWeekNames('short');
        const long = this.adapter.getDayOfWeekNames('long');
        return Array.from({ length: 7 }, (_, i) => ({ short: short[(start + i) % 7], long: long[(start + i) % 7] }));
    });

    /** Number of selected range ends: 0, 1 (start picked) or 2. */
    private readonly rangeCounter = computed(() => {
        const range = this.selectedRangeDate();
        if (!range || !this.adapter.isValid(range.start)) return 0;
        if (!this.adapter.isValid(range.end) || this.adapter.datesEqual(range.start, range.end)) return 1;
        return 2;
    });

    /** Number of picked range ends of several ranges. */
    private readonly multiRangeCounter = computed(() => {
        const ends = [...this.selectedMultipleDateRanges(), ...(this.newRange() ? [this.newRange()!] : [])];
        return ends.reduce((count, range) => count + (range.start ? 1 : 0) + (range.end ? 1 : 0), 0);
    });

    protected readonly dayCells = computed<CalendarDay<D>[]>(() => {
        this.adapter.locale();
        const { year, month } = this.displayed();
        const a = this.adapter;
        const first = a.createDate(year, month, 1);
        const offset = (a.getDayOfWeek(first) - this.weekStart() + 7) % 7;
        const daysInMonth = a.getNumDaysInMonth(first);
        const total = Math.ceil((offset + daysInMonth) / 7) * 7;
        const today = a.today();
        const names = a.getDateNames();
        const cells = Array.from({ length: total }, (_, index): CalendarDay<D> => {
            const date = a.addCalendarDays(first, index - offset);
            const weekDay = a.getDayOfWeek(date);
            const monthStatus = index < offset ? 'previous' : index < offset + daysInMonth ? 'current' : 'next';
            return {
                date,
                id: `${this.id()}-day-view-day-${index}`,
                index,
                label: names[a.getDate(date) - 1],
                ariaLabel: a.format(date, this.formats.display.dateA11yLabel),
                monthStatus,
                weekend: weekDay === 1 || weekDay === 7,
                current: a.datesEqual(date, today),
                past: a.compareDate(date, today) < 0,
                selected: false,
                selectedFirst: false,
                selectedLast: false,
                inRange: false,
                hoverRange: false,
                disabled: false,
                specialDayNumber: this.specialDaysRules().find((rule) => rule.rule(date))?.specialDayNumber ?? null,
                tabbable: false
            };
        });
        this.markSelection(cells);
        // the active day takes the tab stop: selected, today or the first of the month
        const inMonth = cells.filter((cell) => cell.monthStatus === 'current');
        const active =
            inMonth.find((cell) => cell.selected) ?? inMonth.find((cell) => cell.current) ?? inMonth[0] ?? cells[0];
        if (active) active.tabbable = true;
        return cells;
    });

    protected readonly dayGrid = computed(() => this.chunk(this.dayCells(), 7));
    protected readonly fillerRows = computed(() => Array.from({ length: Math.max(0, 6 - this.dayGrid().length) }));

    /** ISO week numbers of the rows, from their Thursday. */
    protected readonly weeks = computed(() =>
        this.dayGrid().map((row) => {
            const thursday = row.find((cell) => this.adapter.getDayOfWeek(cell.date) === 5) ?? row[0];
            return this.adapter.getWeekName(thursday.date);
        })
    );

    protected readonly monthCells = computed<PickerCell<D>[]>(() => {
        this.adapter.locale();
        const year = this.displayed().year;
        const today = this.adapter.today();
        const names = this.adapter.getMonthNames(this.dateRangeFormat() === 'month' ? 'long' : 'short');
        const cells = names.map((label, index) => {
            const month = index + 1;
            const date = this.adapter.createDate(year, month, 1);
            return {
                id: `${this.id()}-month-view-month-${index}`,
                index,
                label,
                ariaLabel: this.adapter.format(date, this.formats.display.monthA11yLabel),
                value: month,
                date,
                current: month === this.adapter.getMonth(today) && year === this.adapter.getYear(today),
                selected: month === this.displayed().month,
                inRange: false,
                disabled: false
            };
        });
        if (this.dateRangeFormat() === 'month') this.markPickerRange(cells, (date) => this.monthOf(date));
        return cells;
    });

    private readonly yearsPerPage = computed(() => this.yearGrid().rows * this.yearGrid().cols);

    protected readonly yearCells = computed<PickerCell<D>[]>(() => {
        this.adapter.locale();
        const first = this.firstYear();
        const thisYear = this.adapter.getYear(this.adapter.today());
        const cells = Array.from({ length: this.yearsPerPage() }, (_, index) => {
            const year = first + index;
            const date = this.adapter.createDate(year, 1, 1);
            return {
                id: `${this.id()}-year-view-year-${index}`,
                index,
                label: this.yearName(year),
                ariaLabel: this.adapter.format(date, this.formats.display.yearA11yLabel),
                value: year,
                date,
                current: year === thisYear,
                selected: year === this.displayed().year,
                inRange: false,
                disabled: false
            };
        });
        if (this.dateRangeFormat() === 'year')
            this.markPickerRange(cells, (date) => ({ year: this.adapter.getYear(date), month: 1 }));
        return cells;
    });

    protected readonly aggregatedCells = computed<PickerCell<D>[]>(() => {
        this.adapter.locale();
        const perPeriod = this.yearsPerPage();
        const first = this.firstAggregatedYear();
        const thisYear = this.adapter.getYear(this.adapter.today());
        const selectedYear = this.displayed().year;
        const grid = this.aggregatedYearGrid();
        return Array.from({ length: grid.rows * grid.cols }, (_, index) => {
            const years = { startYear: first + perPeriod * index, endYear: first + perPeriod * (index + 1) - 1 };
            const label = `${this.yearName(years.startYear)} - ${this.yearName(years.endYear)}`;
            const contains = (year: number) => year >= years.startYear && year <= years.endYear;
            return {
                id: `${this.id()}-aggregated-year-view-years-${index}`,
                index,
                label,
                ariaLabel: label,
                value: years.startYear,
                date: this.adapter.createDate(years.startYear, 1, 1),
                current: contains(thisYear),
                selected: contains(selectedYear),
                inRange: false,
                disabled: false,
                years
            };
        });
    });

    protected readonly monthName = computed(() => {
        this.adapter.locale();
        return this.adapter.getMonthNames('long')[this.displayed().month - 1];
    });

    protected readonly yearsRangeLabel = computed(() => {
        const cells = this.activeView() === 'aggregatedYear' ? this.aggregatedCells() : this.yearCells();
        const first = cells[0];
        const last = cells.at(-1)!;
        return this.activeView() === 'aggregatedYear'
            ? `${this.yearName(first.years!.startYear)} - ${this.yearName(last.years!.endYear)}`
            : `${this.yearName(first.value)} - ${this.yearName(last.value)}`;
    });

    protected readonly previousLabel = computed(() =>
        this.activeView() === 'day' ? this.labels().previousMonthLabel : this.labels().previousYearLabel
    );
    protected readonly nextLabel = computed(() =>
        this.activeView() === 'day' ? this.labels().nextMonthLabel : this.labels().nextYearLabel
    );
    protected readonly previousDisabled = computed(() => this.navigationDisabled(this.previousButtonDisableFunction()));
    protected readonly nextDisabled = computed(() => this.navigationDisabled(this.nextButtonDisableFunction()));

    constructor() {
        // show the month of a selection set from outside (not a range end picked in another month)
        let anchor: D | null = null;
        effect(() => {
            const date = this.anchorDate();
            untracked(() => {
                if (date && this.adapter.isValid(date) && !this.adapter.datesEqual(date, anchor)) {
                    this.displayed.set(this.monthOf(date));
                }
                anchor = date;
            });
        });
        effect(() => {
            if (this.allowMultipleSelection() || this.calType()) untracked(() => (this.shiftAnchor = null));
        });
    }

    /** Shows the month of a date. */
    setCurrentlyDisplayed(date: D | null | undefined): void {
        if (this.adapter.isValid(date)) this.displayed.set(this.monthOf(date));
    }

    /** Focuses the active cell of the view, e.g. when a date picker opens. */
    initialFocus(): void {
        this.focusActiveCell();
    }

    handlePreviousArrowClick(): void {
        this.page(-1);
    }

    handleNextArrowClick(): void {
        this.page(1);
    }

    /** Switches to a view; the view's own header button switches back to the days. */
    protected toggleView(view: FdCalendarView): void {
        this.setView(this.activeView() === view ? 'day' : view);
    }

    private setView(view: FdCalendarView): void {
        if (view === this.activeView()) return;
        const year = this.displayed().year;
        if (view === 'year') this.firstYear.set(year);
        if (view === 'aggregatedYear') this.firstAggregatedYear.set(year - this.yearsPerPage());
        this.activeView.set(view);
        this.focusActiveCell();
    }

    private page(direction: 1 | -1): void {
        const { year, month } = this.displayed();
        switch (this.activeView()) {
            case 'day': {
                const next = month + direction;
                this.displayed.set(
                    next < 1
                        ? { year: year - 1, month: 12 }
                        : next > 12
                          ? { year: year + 1, month: 1 }
                          : { year, month: next }
                );
                break;
            }
            case 'month':
                this.displayed.set({ year: year + direction, month });
                break;
            case 'year':
                this.firstYear.update((first) => first + direction * this.yearsPerPage());
                this.displayed.set({ year: this.firstYear(), month });
                break;
            case 'aggregatedYear': {
                const grid = this.aggregatedYearGrid();
                this.firstAggregatedYear.update(
                    (first) => first + direction * grid.rows * grid.cols * this.yearsPerPage()
                );
                break;
            }
        }
    }

    /** Selects a day. */
    selectDate(cell: CalendarDay<D>, event?: MouseEvent | KeyboardEvent): void {
        event?.preventDefault();
        event?.stopPropagation();
        if (cell.disabled) return;
        const date = cell.date;
        if (this.allowMultipleSelection()) {
            if (this.calType() === 'single') {
                if (event?.shiftKey && this.shiftAnchor) {
                    this.addDates(this.fillRange(this.shiftAnchor, date));
                } else {
                    this.toggleDates([date]);
                    this.shiftAnchor = date;
                }
            } else {
                this.selectMultipleRange(date);
            }
            return;
        }
        if (this.calType() === 'single') {
            this.selectedDate.set(date);
            this.emitChange(date);
            return;
        }
        this.selectRangeEnd(date);
    }

    private selectRangeEnd(date: D): void {
        const counter = this.rangeCounter();
        const range =
            counter === 1 ? this.orderedRange(this.selectedRangeDate()!.start!, date) : new DateRange<D>(date, null);
        this.selectedRangeDate.set(range);
        this.rangePicking.set(this.rangeHoverEffect() && counter !== 1);
        this.emitChange(range);
    }

    private selectMultipleRange(date: D): void {
        const ranges = this.selectedMultipleDateRanges().filter((range) => range.start || range.end);
        // a click into a range removes it
        const inside = ranges.findIndex((range) => range.end && this.inRange(date, range, true));
        if (inside > -1) ranges.splice(inside, 1);
        const open = this.newRange();
        if (!open) {
            this.newRange.set(new DateRange<D>(date, null));
            this.rangePicking.set(this.rangeHoverEffect());
            this.selectedMultipleDateRanges.set(ranges);
            return;
        }
        this.newRange.set(null);
        this.rangePicking.set(false);
        const merged = this.mergeRanges([...ranges, this.orderedRange(open.start!, date)]);
        this.selectedMultipleDateRanges.set(merged);
        this.onChange(merged);
        this.closeCalendar.emit();
    }

    /** Toggles the selection of the days of a week row (multiple selection). */
    protected toggleWeek(row: CalendarDay<D>[]): void {
        if (!this.allowMultipleSelection() || this.calType() !== 'single') return;
        this.toggleDates(
            row.filter((cell) => !cell.disabled).map((cell) => cell.date),
            true
        );
    }

    /** Toggles the selection of a weekday column (multiple selection). */
    protected toggleWeekColumn(index: number): void {
        if (!this.allowMultipleSelection() || this.calType() !== 'single') return;
        this.toggleDates(
            this.dayGrid()
                .map((row) => row[index])
                .filter((cell) => cell && !cell.disabled)
                .map((cell) => cell.date),
            true
        );
    }

    /** Toggles dates; as a group they are all selected unless all already are. */
    private toggleDates(dates: D[], group = false): void {
        const selected = this.selectedMultipleDates() ?? [];
        const has = (date: D) => selected.some((s) => this.adapter.datesEqual(s, date));
        let next: D[];
        if (group && !dates.every(has)) next = [...selected, ...dates.filter((date) => !has(date))];
        else if (group || has(dates[0]))
            next = selected.filter((s) => !dates.some((d) => this.adapter.datesEqual(s, d)));
        else next = [...selected, dates[0]];
        this.selectedMultipleDates.set(next);
        this.onChange(next);
    }

    private addDates(dates: D[]): void {
        const selected = this.selectedMultipleDates() ?? [];
        const next = [...selected, ...dates.filter((d) => !selected.some((s) => this.adapter.datesEqual(s, d)))];
        this.selectedMultipleDates.set(next);
        this.onChange(next);
    }

    /** Selects a month, year or years period. */
    protected selectPickerCell(view: FdCalendarView, cell: PickerCell<D>, event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        const { year, month } = this.displayed();
        if (view === 'month') {
            this.displayed.set({ year, month: cell.value });
            if (this.dateRangeFormat() === 'month') {
                this.selectRangeEnd(cell.date);
                return;
            }
            this.setView('day');
        } else if (view === 'year') {
            this.displayed.set({ year: cell.value, month });
            if (this.dateRangeFormat() === 'year') {
                this.selectRangeEnd(cell.date);
                return;
            }
            this.setView(this.dateRangeFormat() === 'month' ? 'month' : 'day');
        } else {
            this.displayed.set({ year: cell.years!.startYear, month });
            this.firstYear.set(cell.years!.startYear);
            this.activeView.set('year');
            this.focusActiveCell();
        }
    }

    protected onDayKeydown(event: KeyboardEvent, cell: CalendarDay<D>): void {
        if (event.key === 'Tab' && !event.shiftKey) {
            this.escapeFocus(event);
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            this.selectDate(cell, event);
            return;
        }
        const delta = this.arrowDelta(event, 7);
        if (delta === null) return;
        event.preventDefault();
        const target = this.adapter.addCalendarDays(cell.date, delta);
        this.hoverDate.set(target);
        const shown = this.dayCells().find((c) => this.adapter.datesEqual(c.date, target));
        if (shown) {
            // in the grid: focus now, so fast key presses go on from there
            this.host.querySelector<HTMLElement>(`[id="${shown.id}"]`)?.focus();
            return;
        }
        this.displayed.set(this.monthOf(target));
        this.focusAfterRender(() => this.dayCells().find((c) => this.adapter.datesEqual(c.date, target))?.id);
    }

    protected onPickerKeydown(
        event: KeyboardEvent,
        view: FdCalendarView,
        cells: PickerCell<D>[],
        cols: number,
        cell: PickerCell<D>
    ): void {
        if (event.key === 'Tab' && !event.shiftKey) {
            this.escapeFocus(event);
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            this.selectPickerCell(view, cell, event);
            return;
        }
        const delta = this.arrowDelta(event, cols);
        if (delta === null) return;
        event.preventDefault();
        let index = cell.index + delta;
        // past the edges: the previous or next year (months) or page (years)
        if (index < 0 || index >= cells.length) {
            const direction = index < 0 ? -1 : 1;
            if (view === 'month') this.displayed.update(({ year, month }) => ({ year: year + direction, month }));
            else this.page(direction);
            index = (index + cells.length) % cells.length;
        }
        if (view === 'month') this.hoverDate.set(cells[index].date);
        const id = cells[index].id;
        const element = this.host.querySelector<HTMLElement>(`[id="${id}"]`);
        if (element && index === cell.index + delta) element.focus();
        else this.focusAfterRender(() => id);
    }

    /** The cell offset of an arrow key, or null for other keys. */
    private arrowDelta(event: KeyboardEvent, rowLength: number): number | null {
        const rtl = getComputedStyle(this.host).direction === 'rtl';
        switch (event.key) {
            case 'ArrowLeft':
                return rtl ? 1 : -1;
            case 'ArrowRight':
                return rtl ? -1 : 1;
            case 'ArrowUp':
                return -rowLength;
            case 'ArrowDown':
                return rowLength;
            default:
                return null;
        }
    }

    private escapeFocus(event: KeyboardEvent): void {
        const escape = this.escapeFocusFunction();
        if (escape === null) return;
        event.preventDefault();
        if (escape) escape(event);
        else this.previousButton()?.nativeElement.focus();
    }

    private focusAfterRender(id: () => string | undefined): void {
        afterNextRender(
            () => {
                const target = id();
                if (target) this.host.querySelector<HTMLElement>(`[id="${target}"]`)?.focus();
            },
            { injector: this.injector }
        );
    }

    private focusActiveCell(): void {
        this.focusAfterRender(() => {
            switch (this.activeView()) {
                case 'day':
                    return this.dayCells().find((cell) => cell.tabbable)?.id;
                case 'month':
                    return this.pickerTabbable(this.monthCells())?.id;
                case 'year':
                    return this.pickerTabbable(this.yearCells())?.id;
                default:
                    return this.pickerTabbable(this.aggregatedCells())?.id;
            }
        });
    }

    protected pickerTabbable(cells: PickerCell<D>[]): PickerCell<D> | undefined {
        return cells.find((cell) => cell.selected) ?? cells.find((cell) => cell.current) ?? cells[0];
    }

    // Forms

    writeValue(value: unknown): void {
        this.shiftAnchor = null;
        if (this.allowMultipleSelection()) {
            if (this.calType() === 'single')
                this.selectedMultipleDates.set(
                    value == null ? [] : Array.isArray(value) ? (value as D[]) : [value as D]
                );
            else this.selectedMultipleDateRanges.set(Array.isArray(value) ? (value as DateRange<D>[]) : []);
        } else if (this.calType() === 'single') {
            this.selectedDate.set(value as D | null);
        } else {
            const range = value as DateRange<D> | null;
            this.selectedRangeDate.set(range ? new DateRange<D>(range.start ?? null, range.end ?? null) : null);
        }
        this.isValidDateChange.emit(this.isModelValid());
    }

    registerOnChange(fn: (value: unknown) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    validate(): ValidationErrors | null {
        return this.isModelValid() ? null : { dateValidation: { valid: false } };
    }

    /** Whether the selection is complete and valid. */
    isModelValid(): boolean {
        const a = this.adapter;
        if (this.allowMultipleSelection()) {
            return this.calType() === 'single'
                ? (this.selectedMultipleDates() ?? []).every((date) => a.isValid(date))
                : (this.selectedMultipleDateRanges() ?? []).every((r) => a.isValid(r.start) && a.isValid(r.end));
        }
        if (this.calType() === 'single') return a.isValid(this.selectedDate());
        const range = this.selectedRangeDate();
        return !!range && a.isValid(range.start) && a.isValid(range.end);
    }

    protected onFocusout(event: FocusEvent): void {
        if (!this.host.contains(event.relatedTarget as Node | null)) this.onTouched();
    }

    private emitChange(value: unknown): void {
        this.onChange(value);
        this.closeCalendar.emit();
    }

    // Helpers

    /** The date whose month shows: the selection's first date. */
    private anchorDate(): D | null {
        if (this.allowMultipleSelection()) {
            return this.calType() === 'single'
                ? (this.selectedMultipleDates()?.[0] ?? null)
                : (this.selectedMultipleDateRanges()?.[0]?.start ?? null);
        }
        if (this.calType() === 'single') return this.selectedDate() ?? null;
        const range = this.selectedRangeDate();
        return range?.start ?? range?.end ?? null;
    }

    private monthOf(date: D): CalendarCurrent {
        return { year: this.adapter.getYear(date), month: this.adapter.getMonth(date) };
    }

    protected yearName(year: number): string {
        this.adapter.locale();
        const mapping = this.yearGrid().yearMapping;
        return mapping ? mapping(year) : this.adapter.getYearName(this.adapter.createDate(year, 1, 1));
    }

    protected pickerRows(cells: PickerCell<D>[], cols: number): PickerCell<D>[][] {
        return this.chunk(cells, cols);
    }

    protected chunk<T>(items: T[], size: number): T[][] {
        return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));
    }

    private navigationDisabled(fn: NavigationButtonDisableFunction<D> | null | undefined): boolean {
        return typeof fn === 'function' && fn(this.selectedDate(), this.displayed(), this.activeView());
    }

    private orderedRange(first: D, second: D): DateRange<D> {
        return this.adapter.compareDate(first, second) <= 0
            ? new DateRange(first, second)
            : new DateRange(second, first);
    }

    /** Whether a date is in a range (strictly, or including its ends). */
    private inRange(date: D, range: DateRange<D>, inclusive = false): boolean {
        const a = this.adapter;
        if (!range.start || !range.end) return false;
        if (inclusive && (a.datesEqual(date, range.start) || a.datesEqual(date, range.end))) return true;
        return a.compareDate(date, range.start) > 0 && a.compareDate(date, range.end) < 0;
    }

    private mergeRanges(ranges: DateRange<D>[]): DateRange<D>[] {
        const a = this.adapter;
        const sorted = [...ranges].sort((x, y) => a.compareDate(x.start!, y.start!));
        const merged: DateRange<D>[] = [];
        for (const range of sorted) {
            const last = merged.at(-1);
            if (last && a.compareDate(last.end!, range.start!) >= 0) {
                merged[merged.length - 1] = new DateRange(
                    last.start,
                    a.compareDate(last.end!, range.end!) >= 0 ? last.end : range.end
                );
            } else {
                merged.push(range);
            }
        }
        return merged;
    }

    /** The dates from one to the other (either order), without disabled ones. */
    private fillRange(from: D, to: D): D[] {
        const a = this.adapter;
        let current = a.compareDate(from, to) <= 0 ? from : to;
        const end = current === from ? to : from;
        const dates: D[] = [];
        const disabled = this.disableFunction();
        while (a.compareDate(current, end) <= 0) {
            if (!disabled?.(current)) dates.push(current);
            current = a.addCalendarDays(current, 1);
        }
        return dates;
    }

    /** Sets the selection states, disabled days and the hover range of the day cells. */
    private markSelection(cells: CalendarDay<D>[]): void {
        const a = this.adapter;
        const same = (x: D | null | undefined, y: D | null | undefined) => !!x && !!y && a.datesEqual(x, y);
        const disabled = this.disableFunction();
        for (const cell of cells) cell.disabled = !!disabled?.(cell.date);
        let rangeStart: D | null = null;
        if (this.allowMultipleSelection()) {
            if (this.calType() === 'single') {
                const dates = this.selectedMultipleDates() ?? [];
                for (const cell of cells) cell.selected = !cell.disabled && dates.some((date) => same(date, cell.date));
            } else {
                const ranges = [
                    ...(this.selectedMultipleDateRanges() ?? []),
                    ...(this.newRange() ? [this.newRange()!] : [])
                ];
                for (const range of ranges) {
                    for (const cell of cells) {
                        if (same(range.start, cell.date)) cell.selected = cell.selectedFirst = true;
                        if (same(range.end, cell.date)) cell.selected = cell.selectedLast = true;
                        if (this.inRange(cell.date, range)) cell.inRange = cell.selected = true;
                    }
                }
                rangeStart = this.newRange()?.start ?? null;
                this.disableRangeEnds(cells, this.multiRangeCounter() % 2 === 1);
            }
        } else if (this.calType() === 'single') {
            for (const cell of cells) cell.selected = !cell.disabled && same(this.selectedDate(), cell.date);
        } else {
            const range = this.selectedRangeDate();
            if (range) {
                const startOk = !this.disableRangeStartFunction()?.(range.start as D);
                const endOk = !this.disableRangeEndFunction()?.(range.end as D);
                for (const cell of cells) {
                    if (startOk && !cell.disabled && same(range.start, cell.date))
                        cell.selected = cell.selectedFirst = true;
                    if (endOk && !cell.disabled && same(range.end, cell.date)) cell.selected = cell.selectedLast = true;
                    cell.inRange = this.inRange(cell.date, range);
                }
            }
            rangeStart = this.rangeCounter() === 1 ? (range?.start ?? null) : null;
            this.disableRangeEnds(cells, this.rangeCounter() === 1);
        }
        // the days between the picked start and the hovered day
        const hover = this.hoverDate();
        if (this.rangePicking() && rangeStart && hover) {
            const [from, to] = a.compareDate(hover, rangeStart) < 0 ? [hover, rangeStart] : [rangeStart, hover];
            for (const cell of cells)
                cell.hoverRange = a.compareDate(cell.date, from) > 0 && a.compareDate(cell.date, to) < 0;
        }
    }

    /** Disables the days that cannot start (or, once started, end) a range. */
    private disableRangeEnds(cells: CalendarDay<D>[], picking: boolean): void {
        const fn = picking ? this.disableRangeEndFunction() : this.disableRangeStartFunction();
        if (fn) for (const cell of cells) cell.disabled = cell.disabled || fn(cell.date);
    }

    /** Marks the ends and the inside of a month or year range. */
    private markPickerRange(cells: PickerCell<D>[], key: (date: D) => CalendarCurrent): void {
        const range = this.selectedRangeDate();
        // in range mode only the range is selected
        for (const cell of cells) cell.selected = false;
        if (!range) return;
        const same = (date: D | null, cell: PickerCell<D>) => {
            if (!date) return false;
            const a = key(date);
            const b = key(cell.date);
            return a.year === b.year && a.month === b.month;
        };
        const hover = this.rangePicking() && this.rangeCounter() === 1 ? this.hoverDate() : null;
        for (const cell of cells) {
            cell.selected = same(range.start, cell) || same(range.end, cell);
            cell.inRange = this.inRange(cell.date, range);
            if (hover && range.start) {
                const [from, to] =
                    this.adapter.compareDate(hover, range.start) < 0 ? [hover, range.start] : [range.start, hover];
                cell.inRange ||=
                    this.adapter.compareDate(cell.date, from) > 0 && this.adapter.compareDate(cell.date, to) < 0;
            }
        }
    }

    protected dayAriaLabel(cell: CalendarDay<D>): string {
        const labels = this.labels();
        return [
            cell.ariaLabel,
            cell.selectedFirst && this.calType() === 'range' && labels.rangeStartLabel,
            cell.selectedLast && this.calType() === 'range' && labels.rangeEndLabel,
            cell.current && labels.todayLabel,
            cell.selected && this.calType() === 'single' && labels.dateSelectedLabel,
            cell.past && labels.dayInPastLabel
        ]
            .filter(Boolean)
            .join(', ');
    }

    protected pickerAriaLabel(cell: PickerCell<D>): string {
        const labels = this.labels();
        return [cell.ariaLabel, cell.current && labels.todayLabel, cell.selected && labels.dateSelectedLabel]
            .filter(Boolean)
            .join(', ');
    }

    protected dayClass(cell: CalendarDay<D>): string {
        const selected =
            cell.selected &&
            (this.calType() === 'single' || cell.selectedFirst || cell.selectedLast || this.allowMultipleSelection());
        const range = !selected && (cell.inRange || cell.hoverRange);
        const look = selected
            ? DAY_LOOK.selected
            : range
              ? DAY_LOOK.range
              : cell.monthStatus !== 'current'
                ? DAY_LOOK.other
                : cell.weekend && this.markWeekends()
                  ? DAY_LOOK.weekend
                  : DAY_LOOK.work;
        const special =
            cell.specialDayNumber !== null &&
            (this.focusedSpecialDay() ?? cell.specialDayNumber) === cell.specialDayNumber;
        return cn(
            CELL,
            'h-(--cal-item-h)',
            look,
            cell.current && TODAY,
            cell.current && (selected || range) && TODAY_SELECTED,
            special && (cell.current ? SPECIAL_TODAY : SPECIAL),
            special && !cell.current && (selected || range) && SPECIAL_SELECTED,
            cell.disabled && 'pointer-events-none opacity-40'
        );
    }

    protected pickerButtonClass(cell: PickerCell<D>): string {
        return cn(
            buttonVariants({ variant: 'transparent' }),
            'w-full min-w-full px-0',
            (cell.selected || cell.inRange) &&
                'border-sap-button-selected-border-color bg-sap-button-selected-background text-sap-button-selected-text-color hover:bg-sap-button-selected-hover-background'
        );
    }

    protected readonly weekHeaderClass = computed(() =>
        cn(
            SIDE_HELPER,
            this.allowMultipleSelection() && this.calType() === 'single' ? 'cursor-pointer' : 'pointer-events-none'
        )
    );

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border block w-[18rem] rounded-(--sapButton_BorderCornerRadius) bg-sap-list-background p-2 font-sap-font-family text-sap-font-size text-sap-text-color',
            '[--cal-item-h:2.75rem] [--cal-text-h:2.125rem] compact:[--cal-item-h:2rem] compact:[--cal-text-h:1.375rem]',
            (this.mobileLandscape() || this.mobilePortrait()) && 'h-full w-full p-0',
            this.mobilePortrait() && 'pt-4',
            this.userClass()
        )
    );
}
