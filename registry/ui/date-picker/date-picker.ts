/*
 * Port of @fundamental-ngx/core (date-picker) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    Injector,
    TemplateRef,
    afterNextRender,
    booleanAttribute,
    computed,
    forwardRef,
    inject,
    input,
    linkedSignal,
    model,
    signal,
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
import { Bar, BarElement, BarRight, ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import {
    Calendar,
    DateRange,
    type CalendarLabels,
    type CalendarType,
    type CalendarYearGrid,
    type DaysOfWeek,
    type DisableDateFunction,
    type FdCalendarView,
    type NavigationButtonDisableFunction,
    type SpecialDayRule
} from '@/ui/calendar/calendar';
import {
    Dialog,
    DialogBody,
    DialogCloseButton,
    DialogFooter,
    DialogHeader,
    DialogService,
    type DialogRef
} from '@/ui/dialog/dialog';
import { FormInputMessageGroup } from '@/ui/form/form-input-message-group';
import { FormMessage, type FormMessageType } from '@/ui/form/form-message';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/ui/input-group/input-group';
import { Popover, PopoverBody, PopoverControl, type Placement } from '@/ui/popover/popover';
import { Title } from '@/ui/title/title';

export type DatePickerState = 'success' | 'error' | 'warning' | 'default' | 'information';

/** The value of a date picker: a date, dates, a range or ranges, by `type` and `allowMultipleSelection`. */
export type DatePickerValue<D> = D | D[] | DateRange<D> | DateRange<D>[] | null;

/** Dialog options of a date picker in mobile mode. */
export interface DatePickerMobileConfig {
    title?: string;
    /** Shows a close button in the header (default true). */
    hasCloseButton?: boolean;
    approveButtonText?: string;
    cancelButtonText?: string;
}

export interface DatePickerLabels {
    inputLabel: string;
    rangeInputLabel: string;
    toggleLabel: string;
    calendarLabel: string;
    closeLabel: string;
}

export const DATE_PICKER_LABELS: DatePickerLabels = {
    inputLabel: 'Date input',
    rangeInputLabel: 'Date range input',
    toggleLabel: 'Open picker',
    calendarLabel: 'Choose date',
    closeLabel: 'Close'
};

let nextId = 0;

/**
 * Date picker: a date field with a button that opens a calendar in a popover. Single dates, ranges
 * and multiple dates or ranges; typed dates are read while typing, or on Enter and blur with
 * `processInputOnBlur`. A date that cannot be read, or one the disable functions reject, sets the
 * error state. F4 and Alt+Down open the calendar, Escape closes it and returns to the field. In
 * mobile mode the calendar opens in a dialog that can be approved or cancelled.
 *
 * ```html
 * <fd-date-picker [(selectedDate)]="date" />
 * <fd-date-picker type="range" [(ngModel)]="range" showTodayButton />
 * ```
 */
@Component({
    selector: 'fd-date-picker',
    exportAs: 'fdDatePicker',
    imports: [
        NgTemplateOutlet,
        Popover,
        PopoverControl,
        PopoverBody,
        InputGroup,
        InputGroupInput,
        InputGroupAddon,
        Button,
        FormInputMessageGroup,
        FormMessage,
        Calendar,
        Bar,
        BarRight,
        BarElement,
        ButtonBar,
        Dialog,
        DialogHeader,
        DialogBody,
        DialogFooter,
        DialogCloseButton,
        Title
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatePicker), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => DatePicker), multi: true }
    ],
    host: { '[class]': 'computedClass()', '(focusout)': 'onFocusout($event)' },
    template: `
        @if (mobile()) {
            <ng-container [ngTemplateOutlet]="controlTpl" />
        } @else {
            <fd-popover
                class="block"
                [placement]="placement()"
                [triggers]="[]"
                [isOpen]="isOpen()"
                [disabled]="isDisabled()"
                [closeOnEscapeKey]="true"
                [focusTrapped]="true"
                [focusAutoCapture]="false"
                [restoreFocusOnClose]="false"
                [bodyAriaLabel]="labels().calendarLabel"
                (isOpenChange)="setOpen($event)"
            >
                <fd-popover-control>
                    <ng-container [ngTemplateOutlet]="controlTpl" />
                </fd-popover-control>
                <fd-popover-body>
                    @if (message()) {
                        <fd-form-message [type]="messageType()" embedded static>{{ message() }}</fd-form-message>
                    }
                    <ng-content />
                    @if (isOpen()) {
                        <ng-container [ngTemplateOutlet]="calendarTpl" />
                    }
                </fd-popover-body>
            </fd-popover>
        }

        <ng-template #controlTpl>
            <fd-form-input-message-group
                [isOpen]="messageShown()"
                (isOpenChange)="messageShown.set($event && !isOpen())"
                [triggers]="message() ? messageTriggers() : []"
            >
                <fd-input-group [state]="computedState()" [disabled]="isDisabled()" [showFocus]="true">
                    <input
                        #field
                        fdInputGroupInput
                        type="text"
                        autocomplete="off"
                        [id]="inputId() || id() + '-input'"
                        [value]="text()"
                        [disabled]="isDisabled()"
                        [attr.placeholder]="placeholder() || null"
                        [attr.aria-label]="
                            ariaLabelledBy()
                                ? null
                                : type() === 'range'
                                  ? labels().rangeInputLabel
                                  : labels().inputLabel
                        "
                        [attr.aria-labelledby]="ariaLabelledBy() || null"
                        [attr.aria-required]="required() || null"
                        [attr.aria-invalid]="computedState() === 'error' || null"
                        (input)="!processInputOnBlur() && read(field.value, true)"
                        (keydown.enter)="read(field.value, false)"
                        (keydown.f4)="$event.preventDefault(); setOpen(!isOpen())"
                        (keydown.alt.arrowDown)="$event.preventDefault(); setOpen(true)"
                        (click)="mobile() && setOpen(true)"
                        (blur)="read(field.value, false)"
                    />
                    <span fdInputGroupAddon button>
                        <button
                            fdButton
                            variant="transparent"
                            glyph="appointment-2"
                            [ariaLabel]="labels().toggleLabel"
                            [attr.title]="labels().toggleLabel"
                            [attr.aria-haspopup]="'dialog'"
                            [attr.aria-expanded]="isOpen()"
                            [tabindex]="buttonFocusable() ? null : -1"
                            [disabled]="isDisabled()"
                            [class]="isOpen() ? 'text-(--igBtnFocusColor,var(--sapButton_Selected_TextColor))' : ''"
                            (click)="setOpen(!isOpen())"
                        ></button>
                    </span>
                </fd-input-group>
                @if (message()) {
                    <fd-form-message [type]="messageType()">{{ message() }}</fd-form-message>
                }
            </fd-form-input-message-group>
        </ng-template>

        <ng-template #calendarTpl>
            <fd-calendar
                [id]="id() + '-calendar'"
                [calType]="type()"
                [allowMultipleSelection]="allowMultipleSelection()"
                [(activeView)]="activeView"
                [markWeekends]="markWeekends()"
                [showWeekNumbers]="showWeekNumbers()"
                [specialDaysRules]="specialDaysRules()"
                [startingDayOfWeek]="startingDayOfWeek()"
                [yearGrid]="yearGrid()"
                [aggregatedYearGrid]="aggregatedYearGrid()"
                [rangeHoverEffect]="rangeHoverEffect()"
                [dateRangeFormat]="dateRangeFormat()"
                [showCalendarLegend]="showCalendarLegend()"
                [legendCol]="legendCol()"
                [disableFunction]="disableFunction()"
                [disableRangeStartFunction]="disableRangeStartFunction()"
                [disableRangeEndFunction]="disableRangeEndFunction()"
                [previousButtonDisableFunction]="previousButtonDisableFunction()"
                [nextButtonDisableFunction]="nextButtonDisableFunction()"
                [mobileLandscape]="mobile() && mobileLandscape()"
                [mobilePortrait]="mobile() && (mobilePortrait() || !mobileLandscape())"
                [labels]="calendarLabels()"
                [selectedDate]="validOrNull(selectedDate())"
                [selectedMultipleDates]="selectedMultipleDates()"
                [selectedRangeDate]="selectedRangeDate()"
                [selectedMultipleDateRanges]="selectedMultipleDateRanges()"
                (selectedDateChange)="pickDate($event)"
                (selectedMultipleDatesChange)="pickDates($event)"
                (selectedRangeDateChange)="pickRange($event)"
                (selectedMultipleDateRangesChange)="pickRanges($event)"
            />
            @if (showTodayButton()) {
                <div fd-bar barDesign="footer" class="overflow-hidden">
                    <div fd-bar-right>
                        <fd-bar-element>
                            <button fdButton [label]="todayButtonLabel()" (click)="selectToday()"></button>
                        </fd-bar-element>
                    </div>
                </div>
            }
        </ng-template>

        <ng-template #dialogTpl>
            <fd-dialog>
                <fd-dialog-header>
                    @if (mobileConfig().title) {
                        <h1 fd-title [id]="id() + '-dialog-title'">{{ mobileConfig().title }}</h1>
                    }
                    @if (mobileConfig().hasCloseButton !== false) {
                        <button
                            fd-dialog-close-button
                            mobile
                            [ariaLabel]="labels().closeLabel"
                            (click)="dialogDismiss()"
                        ></button>
                    }
                </fd-dialog-header>
                <fd-dialog-body>
                    <ng-container [ngTemplateOutlet]="calendarTpl" />
                </fd-dialog-body>
                @if (mobileConfig().approveButtonText || mobileConfig().cancelButtonText) {
                    <fd-dialog-footer>
                        @if (mobileConfig().approveButtonText) {
                            <fd-button-bar
                                variant="emphasized"
                                [label]="mobileConfig().approveButtonText"
                                (click)="dialogApprove()"
                            />
                        }
                        @if (mobileConfig().cancelButtonText) {
                            <fd-button-bar [label]="mobileConfig().cancelButtonText" (click)="dialogDismiss()" />
                        }
                    </fd-dialog-footer>
                }
            </fd-dialog>
        </ng-template>
    `
})
export class DatePicker<D> implements ControlValueAccessor, Validator {
    private readonly adapter = inject<DatetimeAdapter<D>>(DatetimeAdapter);
    private readonly formats = inject(DATE_TIME_FORMATS);

    readonly id = input(`fd-date-picker-${nextId++}`);
    readonly inputId = input<string | null | undefined>();
    readonly type = input<CalendarType>('single');
    readonly allowMultipleSelection = input(false, { transform: booleanAttribute });
    readonly placeholder = input<string | null | undefined>();
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly required = input(false, { transform: booleanAttribute });
    readonly ariaLabelledBy = input<string | null | undefined>();
    /** The display and parse format of the dates; by default `dateInput` of the formats. */
    readonly customDateTimeFormat = input<unknown>();
    readonly message = input<string | null | undefined>();
    readonly messageType = input<FormMessageType>('default');
    readonly messageTriggers = input<string[]>(['focusin', 'focusout']);
    readonly placement = input<Placement>('bottom-start');
    /** An unreadable or disabled date sets the error state, unless a state is set. */
    readonly useValidation = input(true, { transform: booleanAttribute });
    readonly state = input<DatePickerState | null | undefined>();
    /** An empty field is a valid (null) value. */
    readonly allowNull = input(true, { transform: booleanAttribute });
    /** Closes the calendar when a date, or the end of a range, is picked. */
    readonly closeOnDateChoose = input(true, { transform: booleanAttribute });
    /** Reads typed dates on Enter and blur only, instead of while typing. */
    readonly processInputOnBlur = input(false, { transform: booleanAttribute });
    readonly preventScrollOnFocus = input(false, { transform: booleanAttribute });
    readonly buttonFocusable = input(false, { transform: booleanAttribute });
    readonly showTodayButton = input(false, { transform: booleanAttribute });
    readonly todayButtonLabel = input('Today');
    readonly markWeekends = input(true, { transform: booleanAttribute });
    readonly showWeekNumbers = input(true, { transform: booleanAttribute });
    readonly specialDaysRules = input<SpecialDayRule<D>[]>([]);
    readonly startingDayOfWeek = input<DaysOfWeek | null | undefined>();
    readonly yearGrid = input<CalendarYearGrid>({ rows: 4, cols: 5 });
    readonly aggregatedYearGrid = input<CalendarYearGrid>({ rows: 4, cols: 3 });
    readonly rangeHoverEffect = input(false, { transform: booleanAttribute });
    /** Picks months or years instead of days. */
    readonly dateRangeFormat = input<'' | 'month' | 'year'>('');
    readonly showCalendarLegend = input(false, { transform: booleanAttribute });
    readonly legendCol = input(false, { transform: booleanAttribute });
    readonly disableFunction = input<DisableDateFunction<D>>();
    readonly disableRangeStartFunction = input<DisableDateFunction<D>>();
    readonly disableRangeEndFunction = input<DisableDateFunction<D>>();
    readonly previousButtonDisableFunction = input<NavigationButtonDisableFunction<D> | null | undefined>();
    readonly nextButtonDisableFunction = input<NavigationButtonDisableFunction<D> | null | undefined>();
    /** Opens the calendar in a dialog. */
    readonly mobile = input(false, { transform: booleanAttribute });
    readonly mobileConfig = input<DatePickerMobileConfig>({});
    /** The layout of the calendar in the mobile dialog: portrait unless landscape is set. */
    readonly mobileLandscape = input(false, { transform: booleanAttribute });
    readonly mobilePortrait = input(false, { transform: booleanAttribute });
    readonly labelsInput = input<Partial<DatePickerLabels>>({}, { alias: 'labels' });
    readonly calendarLabels = input<Partial<CalendarLabels>>({});
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly selectedDate = model<D | null | undefined>(null);
    readonly selectedMultipleDates = model<D[]>([]);
    readonly selectedRangeDate = model<DateRange<D> | null>(null);
    readonly selectedMultipleDateRanges = model<DateRange<D>[]>([]);
    readonly isOpen = model(false);
    readonly activeView = model<FdCalendarView>('day');

    private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
    private readonly calendar = viewChild(Calendar);
    private readonly dialogTpl = viewChild.required<TemplateRef<unknown>>('dialogTpl');
    private readonly dialogs = inject(DialogService);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly injector = inject(Injector);
    private readonly formDisabled = signal(false);
    private dialogRef: DialogRef | null = null;
    private snapshot: { value: DatePickerValue<D> } | null = null;
    private destroyed = false;

    protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
    protected readonly messageShown = signal(false);
    protected readonly labels = computed(() => ({ ...DATE_PICKER_LABELS, ...this.labelsInput() }));

    /** The typed text could not be read, or the value is not allowed. */
    readonly invalid = signal(false);
    private readonly delimiter = computed(() => this.formats.rangeDelimiter);
    private readonly displayFormat = computed(() => this.customDateTimeFormat() ?? this.formats.display.dateInput);
    private readonly parseFormat = computed(() => this.customDateTimeFormat() ?? this.formats.parse.dateInput);

    /** The current value, by the selection mode. */
    readonly value = computed<DatePickerValue<D>>(() => {
        if (this.allowMultipleSelection()) {
            return this.type() === 'single' ? this.selectedMultipleDates() : this.selectedMultipleDateRanges();
        }
        return this.type() === 'single' ? (this.selectedDate() ?? null) : this.selectedRangeDate();
    });

    /** The text of the field: the formatted value, or what was typed. */
    protected readonly text = linkedSignal<{ readable: boolean; formatted: string }, string>({
        // the formatted text follows the locale and the format too
        source: () => ({ readable: this.readable(this.value()), formatted: this.formatValue(this.value()) }),
        // an unreadable value keeps what was typed
        computation: ({ readable, formatted }, previous) => (readable ? formatted : (previous?.value ?? ''))
    });

    protected readonly computedState = computed<DatePickerState>(() => {
        const state = this.state();
        if (state == null && this.useValidation() && this.invalid()) return 'error';
        return state ?? 'default';
    });

    private onChange: (value: DatePickerValue<D>) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        inject(DestroyRef).onDestroy(() => {
            this.destroyed = true;
            this.dialogRef?.dismiss();
        });
        // month and year range formats start in their view
        afterNextRender(() => {
            const format = this.dateRangeFormat();
            if (format) this.activeView.set(format);
        });
    }

    /** Opens or closes the calendar. */
    setOpen(open: boolean): void {
        if (open && this.isDisabled()) return;
        if (open === this.isOpen()) return;
        this.isOpen.set(open);
        this.messageShown.set(false);
        if (this.mobile()) {
            if (open) this.openDialog();
            else this.closeDialog();
            return;
        }
        afterNextRender(
            () => {
                if (open) this.focusCalendar();
                else this.field()?.nativeElement.focus({ preventScroll: this.preventScrollOnFocus() });
            },
            { injector: this.injector }
        );
    }

    private focusCalendar(): void {
        const calendar = this.calendar();
        if (!calendar) return;
        calendar.setCurrentlyDisplayed(this.firstDate());
        calendar.initialFocus();
    }

    /** Reads typed text; `typing` is true for input events. */
    read(text: string, typing: boolean): void {
        if (!typing && !this.processInputOnBlur()) {
            // already read while typing: tidy the text of a readable value
            if (!this.invalid() && this.readable(this.value())) this.text.set(this.formatValue(this.value()));
            return;
        }
        const typed = text;
        text = text.trim();
        const value = this.parseValue(text);
        const changed = !this.sameValue(value, this.value());
        const invalid = !text ? !this.allowNull() : !this.isValueValid(value);
        this.invalid.set(invalid);
        if (changed) {
            this.setValue(value);
            this.onChange(value);
        }
        // keep what was typed, spaces included
        if (typing) this.text.set(typed);
        else if (!invalid && text) this.text.set(this.formatValue(value));
        if (!invalid) this.calendar()?.setCurrentlyDisplayed(this.firstDate());
    }

    /** Selects today. */
    selectToday(): void {
        const today = this.adapter.today();
        if (this.type() === 'single') {
            if (this.allowMultipleSelection()) this.pickDates([today]);
            else this.pickDate(today);
        } else {
            const range = new DateRange<D>(today, today);
            if (this.allowMultipleSelection()) this.pickRanges([range]);
            else this.pickRange(range);
        }
    }

    protected pickDate(date: D | null | undefined): void {
        if (!date) return;
        this.commit(date);
        if (this.closeOnDateChoose()) this.closeAfterPick();
    }

    protected pickDates(dates: D[]): void {
        this.commit(dates ?? []);
    }

    protected pickRange(range: DateRange<D> | null | undefined): void {
        // the first click only starts the range
        if (!range?.end) return;
        if (this.sameValue(range, this.selectedRangeDate())) return;
        this.commit(new DateRange<D>(range.start, range.end));
        if (this.closeOnDateChoose()) this.closeAfterPick();
    }

    protected pickRanges(ranges: DateRange<D>[]): void {
        if (this.sameValue(ranges, this.selectedMultipleDateRanges())) return;
        this.commit(ranges);
    }

    private commit(value: DatePickerValue<D>): void {
        this.setValue(value);
        this.invalid.set(!this.isValueValid(value));
        this.text.set(this.formatValue(value));
        this.onChange(value);
    }

    private closeAfterPick(): void {
        // in mobile mode the dialog buttons close
        if (this.mobile()) return;
        this.onTouched();
        this.setOpen(false);
    }

    private setValue(value: DatePickerValue<D>): void {
        if (this.allowMultipleSelection()) {
            if (this.type() === 'single') this.selectedMultipleDates.set((value as D[] | null) ?? []);
            else this.selectedMultipleDateRanges.set((value as DateRange<D>[] | null) ?? []);
        } else if (this.type() === 'single') {
            this.selectedDate.set(value as D | null);
        } else {
            this.selectedRangeDate.set(value as DateRange<D> | null);
        }
    }

    // parsing and formatting

    private parseDate(text: string): D | null {
        text = text.trim();
        return text ? this.adapter.parse(text, this.parseFormat()) : null;
    }

    private parseRange(text: string): DateRange<D> {
        // the full delimiter first: dashes may also separate the parts of a date
        const delimiter = this.delimiter();
        const parts = text.includes(delimiter) ? text.split(delimiter) : text.split(delimiter.trim());
        const [start, end] = parts.map((part) => this.parseDate(part));
        const a = this.adapter;
        if (a.isValid(start) && a.isValid(end) && a.compareDate(start!, end!) > 0) {
            return new DateRange<D>(end!, start!);
        }
        return new DateRange<D>(start ?? null, end ?? null);
    }

    private parseValue(text: string): DatePickerValue<D> {
        const multiple = this.allowMultipleSelection();
        if (!text) return multiple ? [] : null;
        if (this.type() === 'single') {
            return multiple ? text.split(',').map((part) => this.parseDate(part) as D) : this.parseDate(text);
        }
        return multiple ? text.split(',').map((part) => this.parseRange(part)) : this.parseRange(text);
    }

    private formatDate(date: D | null | undefined): string {
        return date != null && this.adapter.isValid(date) ? this.adapter.format(date, this.displayFormat()) : '';
    }

    private formatRange(range: DateRange<D> | null | undefined): string {
        if (!range?.start && !range?.end) return '';
        return this.formatDate(range.start) + this.delimiter() + this.formatDate(range.end);
    }

    private formatValue(value: DatePickerValue<D>): string {
        if (value == null) return '';
        if (Array.isArray(value)) {
            return (value as (D | DateRange<D>)[])
                .map((item) => (item instanceof DateRange ? this.formatRange(item) : this.formatDate(item)))
                .join(', ');
        }
        return value instanceof DateRange ? this.formatRange(value) : this.formatDate(value);
    }

    /** All dates of the value can be formatted. */
    private readable(value: DatePickerValue<D>): boolean {
        const valid = (date: D | null | undefined) => date == null || this.adapter.isValid(date);
        const items: (D | DateRange<D>)[] = value == null ? [] : Array.isArray(value) ? value : [value];
        return items.every((item) =>
            item instanceof DateRange
                ? valid(item.start) && valid(item.end) && !!item.start === !!item.end
                : valid(item)
        );
    }

    private firstDate(): D | null {
        const value = this.value();
        const first = Array.isArray(value) ? value[0] : value;
        const date = first instanceof DateRange ? first.start : first;
        return date != null && this.adapter.isValid(date) ? date : null;
    }

    protected validOrNull(date: D | null | undefined): D | null {
        return date != null && this.adapter.isValid(date) ? date : null;
    }

    private sameValue(a: DatePickerValue<D>, b: DatePickerValue<D>): boolean {
        const eq = (x: D | DateRange<D> | null | undefined, y: D | DateRange<D> | null | undefined): boolean => {
            if (x instanceof DateRange || y instanceof DateRange) {
                const rx = x as DateRange<D> | null;
                const ry = y as DateRange<D> | null;
                return (
                    this.adapter.datesEqual(rx?.start, ry?.start) &&
                    this.adapter.datesEqual(rx?.end, ry?.end) &&
                    !!rx?.start === !!ry?.start
                );
            }
            if (x == null || y == null) return x == y;
            return this.adapter.datesEqual(x, y);
        };
        if (Array.isArray(a) || Array.isArray(b)) {
            const xs = (a ?? []) as (D | DateRange<D>)[];
            const ys = (b ?? []) as (D | DateRange<D>)[];
            return xs.length === ys.length && xs.every((x, i) => eq(x, ys[i]));
        }
        return eq(a, b);
    }

    // validation

    private isDateValid(date: D | null | undefined, disable: DisableDateFunction<D>): boolean {
        return date != null && this.adapter.isValid(date) && !disable?.(date);
    }

    private isRangeValid(range: DateRange<D> | null | undefined): boolean {
        return (
            !!range &&
            this.isDateValid(range.start, this.disableRangeStartFunction()) &&
            this.isDateValid(range.end, this.disableRangeEndFunction())
        );
    }

    private isValueValid(value: DatePickerValue<D>): boolean {
        const empty = value == null || (Array.isArray(value) && value.length === 0);
        if (empty) return this.allowNull();
        if (Array.isArray(value)) {
            return (value as (D | DateRange<D>)[]).every((item) =>
                item instanceof DateRange ? this.isRangeValid(item) : this.isDateValid(item, this.disableFunction())
            );
        }
        if (value instanceof DateRange)
            return (!value.start && !value.end && this.allowNull()) || this.isRangeValid(value);
        return this.isDateValid(value, this.disableFunction());
    }

    // mobile mode

    private openDialog(): void {
        this.snapshot = { value: this.value() };
        const title = this.mobileConfig().title;
        const ref = this.dialogs.open(
            this.dialogTpl(),
            {
                mobile: true,
                disablePaddings: true,
                ariaLabelledBy: title ? `${this.id()}-dialog-title` : null,
                ariaLabel: title ? null : this.labels().calendarLabel,
                escKeyCloseable: true,
                backdropClickCloseable: false
            },
            this.injector
        );
        this.dialogRef = ref;
        const done = () => {
            if (this.dialogRef !== ref || this.destroyed) return;
            // closed with Escape: discard like cancel
            this.dialogRef = null;
            this.restoreSnapshot();
            this.isOpen.set(false);
        };
        ref.afterClosed.subscribe({ next: done, error: done });
        afterNextRender(() => this.focusCalendar(), { injector: this.injector });
    }

    private closeDialog(): void {
        const ref = this.dialogRef;
        this.dialogRef = null;
        this.snapshot = null;
        ref?.close();
        afterNextRender(() => this.field()?.nativeElement.focus(), { injector: this.injector });
    }

    private restoreSnapshot(): void {
        const snapshot = this.snapshot;
        this.snapshot = null;
        if (snapshot && !this.sameValue(snapshot.value, this.value())) this.commit(snapshot.value);
    }

    protected dialogApprove(): void {
        this.snapshot = null;
        this.onTouched();
        this.setOpen(false);
    }

    protected dialogDismiss(): void {
        this.restoreSnapshot();
        this.setOpen(false);
    }

    protected onFocusout(event: FocusEvent): void {
        if (!this.host.contains(event.relatedTarget as Node | null)) this.onTouched();
    }

    // forms

    writeValue(value: DatePickerValue<D> | undefined): void {
        const parse = (date: unknown) => (date == null ? null : this.adapter.parse(date, this.parseFormat()));
        let next: DatePickerValue<D>;
        if (this.allowMultipleSelection()) {
            const items = Array.isArray(value) ? (value as unknown[]) : [];
            next =
                this.type() === 'single'
                    ? items.map((date) => parse(date) as D)
                    : (items as DateRange<D>[])
                          .filter((range) => range?.start && range?.end)
                          .map((range) => new DateRange<D>(parse(range.start), parse(range.end)));
        } else if (this.type() === 'single') {
            next = parse(value);
        } else {
            const range = value as DateRange<D> | null | undefined;
            next = range?.start ? new DateRange<D>(parse(range.start), parse(range.end)) : null;
        }
        this.setValue(next);
        this.invalid.set(!this.isValueValid(next));
    }

    registerOnChange(fn: (value: DatePickerValue<D>) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
        this.formDisabled.set(disabled);
    }

    validate(): ValidationErrors | null {
        return this.isValueValid(this.value()) ? null : { dateValidation: { valid: false } };
    }

    protected readonly computedClass = computed(() => cn('inline-block', this.userClass()));
}
