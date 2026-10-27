/*
 * Port of @fundamental-ngx/core (datetime-picker) with the visual design of fundamental-styles,
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
    output,
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
    type CalendarLabels,
    type CalendarYearGrid,
    type DaysOfWeek,
    type DisableDateFunction,
    type FdCalendarView,
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
import { Popover, PopoverBody, PopoverBodyFooter, PopoverControl, type Placement } from '@/ui/popover/popover';
import { SegmentedButton } from '@/ui/segmented-button/segmented-button';
import { Time, type TimeLabels } from '@/ui/time/time';
import { Title } from '@/ui/title/title';

export type DatetimePickerState = 'success' | 'error' | 'warning' | 'default' | 'information';

/** Dialog options of a datetime picker in mobile mode. */
export interface DatetimePickerMobileConfig {
    title?: string;
    /** Shows a close button in the header (default true). */
    hasCloseButton?: boolean;
    approveButtonText?: string;
    cancelButtonText?: string;
}

export interface DatetimePickerLabels {
    inputLabel: string;
    toggleLabel: string;
    pickerLabel: string;
    displayTypeLabel: string;
    dateLabel: string;
    timeLabel: string;
    okLabel: string;
    cancelLabel: string;
    closeLabel: string;
    /** Read with the message, by the state of the field. */
    successStateLabel: string;
    informationStateLabel: string;
    warningStateLabel: string;
    errorStateLabel: string;
}

export const DATETIME_PICKER_LABELS: DatetimePickerLabels = {
    inputLabel: 'Date and time input',
    toggleLabel: 'Open picker',
    pickerLabel: 'Choose date and time',
    displayTypeLabel: 'Show date or time',
    dateLabel: 'Date',
    timeLabel: 'Time',
    okLabel: 'OK',
    cancelLabel: 'Cancel',
    closeLabel: 'Close',
    successStateLabel: 'Value state Success',
    informationStateLabel: 'Value state Information',
    warningStateLabel: 'Value state Warning',
    errorStateLabel: 'Value state Error'
};

let nextId = 0;

/**
 * Datetime picker: a field with a button that opens a calendar and time columns side by side. The
 * picked date and time apply with OK and are dropped with Cancel, or apply at once without the
 * footer. On narrow screens a switch shows either the calendar or the time. Typed values are read
 * while typing, or on Enter and blur with `processInputOnBlur`; an unreadable or disabled date sets
 * the error state once the field was left. F4 and Alt+Down open the picker, Escape closes it.
 *
 * ```html
 * <fd-datetime-picker [(date)]="date" />
 * <fd-datetime-picker [(ngModel)]="date" [showFooter]="false" />
 * ```
 */
@Component({
    selector: 'fd-datetime-picker',
    exportAs: 'fdDatetimePicker',
    imports: [
        NgTemplateOutlet,
        Popover,
        PopoverControl,
        PopoverBody,
        PopoverBodyFooter,
        InputGroup,
        InputGroupInput,
        InputGroupAddon,
        Button,
        FormInputMessageGroup,
        FormMessage,
        Calendar,
        Time,
        SegmentedButton,
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
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatetimePicker), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => DatetimePicker), multi: true }
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
                [bodyAriaLabel]="labels().pickerLabel"
                (isOpenChange)="setOpen($event)"
            >
                <fd-popover-control>
                    <ng-container [ngTemplateOutlet]="controlTpl" />
                </fd-popover-control>
                <fd-popover-body>
                    @if (isOpen()) {
                        <ng-container [ngTemplateOutlet]="pickerTpl" />
                    }
                    @if (isOpen() && showFooter()) {
                        <div fd-popover-body-footer>
                            <div fd-bar barDesign="footer" class="overflow-hidden">
                                <div fd-bar-right>
                                    <fd-bar-element>
                                        <button
                                            fdButton
                                            variant="emphasized"
                                            [label]="labels().okLabel"
                                            [disabled]="!tempDate()"
                                            (click)="submit()"
                                        ></button>
                                    </fd-bar-element>
                                    <fd-bar-element>
                                        <button
                                            fdButton
                                            variant="transparent"
                                            [label]="labels().cancelLabel"
                                            (click)="cancel()"
                                        ></button>
                                    </fd-bar-element>
                                </div>
                            </div>
                        </div>
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
                        [attr.aria-label]="ariaLabelledBy() ? null : labels().inputLabel"
                        [attr.aria-labelledby]="ariaLabelledBy() || null"
                        [attr.aria-required]="required() || null"
                        [attr.aria-invalid]="computedState() === 'error' || null"
                        [attr.aria-describedby]="description() ? id() + '-description' : null"
                        (input)="!processInputOnBlur() && read(field.value, true)"
                        (keydown.enter)="read(field.value, false)"
                        (keydown.f4)="$event.preventDefault(); setOpen(!isOpen())"
                        (keydown.alt.arrowDown)="$event.preventDefault(); setOpen(true)"
                        (click)="mobile() && setOpen(true)"
                        (blur)="onFieldBlur(field.value)"
                    />
                    <span fdInputGroupAddon button>
                        <!-- the picker opens in a dialog (the popover body or the mobile dialog), so
                             aria-haspopup is "dialog" -->
                        <button
                            fdButton
                            variant="transparent"
                            glyph="date-time"
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
            <!-- the state and the message, read as the description of the field, also while the picker is open -->
            @if (description()) {
                <div class="hidden" aria-hidden="true">
                    <div [id]="id() + '-description'">{{ description() }}</div>
                </div>
            }
        </ng-template>

        <ng-template #pickerTpl>
            <div [class]="wrapperClass()">
                @if (message()) {
                    <fd-form-message [type]="messageType()" embedded static>{{ message() }}</fd-form-message>
                }
                <div [class]="switcherClass()">
                    <fd-segmented-button [ariaLabel]="labels().displayTypeLabel" [(value)]="displayType">
                        <button fdButton [label]="labels().dateLabel" value="date"></button>
                        <button fdButton [label]="labels().timeLabel" value="time"></button>
                    </fd-segmented-button>
                </div>
                <ng-content />
                <div class="mx-4 flex items-center justify-center">
                    <fd-calendar
                        [id]="id() + '-calendar'"
                        [class]="displayType() === 'date' ? '' : hiddenClass()"
                        calType="single"
                        [(activeView)]="activeView"
                        [selectedDate]="tempDate()"
                        [escapeFocusFunction]="null"
                        [disableFunction]="disableFunction()"
                        [markWeekends]="markWeekends()"
                        [showWeekNumbers]="showWeekNumbers()"
                        [specialDaysRules]="specialDaysRules()"
                        [showCalendarLegend]="showCalendarLegend()"
                        [legendCol]="legendCol()"
                        [startingDayOfWeek]="startingDayOfWeek()"
                        [yearGrid]="yearGrid()"
                        [aggregatedYearGrid]="aggregatedYearGrid()"
                        [labels]="calendarLabels()"
                        (selectedDateChange)="pickDate($event)"
                    />
                    @if (!portrait()) {
                        <div
                            aria-hidden="true"
                            class="mx-7 my-10.5 w-px self-stretch bg-sap-group-content-border-color max-[60rem]:hidden"
                        ></div>
                    }
                    <fd-time
                        [id]="id() + '-time'"
                        [class]="displayType() === 'time' ? 'w-auto' : cn('w-auto', hiddenClass())"
                        [time]="tempTime()"
                        [meridian]="showMeridian()"
                        [displayHours]="showHours()"
                        [displayMinutes]="showMinutes()"
                        [displaySeconds]="showSeconds()"
                        [keepTwoDigits]="keepTwoDigitsTime()"
                        [spinnerButtons]="spinnerButtons()"
                        [disabled]="isDisabled()"
                        [labels]="timeLabels()"
                        (timeChange)="pickTime($event)"
                    />
                </div>
            </div>
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
                            (click)="setOpen(false)"
                        ></button>
                    }
                </fd-dialog-header>
                <fd-dialog-body>
                    <ng-container [ngTemplateOutlet]="pickerTpl" />
                </fd-dialog-body>
                <fd-dialog-footer>
                    <fd-button-bar
                        variant="emphasized"
                        [label]="mobileConfig().approveButtonText || labels().okLabel"
                        [disabled]="!tempDate()"
                        (click)="submit()"
                    />
                    <fd-button-bar
                        [label]="mobileConfig().cancelButtonText || labels().cancelLabel"
                        (click)="cancel()"
                    />
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>
    `
})
export class DatetimePicker<D> implements ControlValueAccessor, Validator {
    private readonly adapter = inject<DatetimeAdapter<D>>(DatetimeAdapter);
    private readonly formats = inject(DATE_TIME_FORMATS);
    protected readonly cn = cn;

    readonly id = input(`fd-datetime-picker-${nextId++}`);
    readonly inputId = input<string | null | undefined>();
    readonly placeholder = input<string | null | undefined>();
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly required = input(false, { transform: booleanAttribute });
    readonly ariaLabelledBy = input<string | null | undefined>();
    /** The display and parse format; by default `dateTimeInput` of the formats. */
    readonly customDateTimeFormat = input<unknown>();
    /** A 12-hour clock; by default from the format. */
    readonly meridian = input<boolean | null | undefined>();
    readonly displayHours = input<boolean | null | undefined>();
    readonly displayMinutes = input<boolean | null | undefined>();
    readonly displaySeconds = input<boolean | null | undefined>();
    readonly keepTwoDigitsTime = input(false, { transform: booleanAttribute });
    readonly spinnerButtons = input(true, { transform: booleanAttribute });
    readonly message = input<string | null | undefined>();
    readonly messageType = input<FormMessageType>('default');
    readonly messageTriggers = input<string[]>(['focusin', 'focusout']);
    readonly placement = input<Placement>('bottom-start');
    /** An unreadable or disabled date sets the error state once the field was left, unless a state is set. */
    readonly useValidation = input(true, { transform: booleanAttribute });
    readonly state = input<DatetimePickerState | null | undefined>();
    /** An empty field is a valid (null) value. */
    readonly allowNull = input(true, { transform: booleanAttribute });
    /** OK and Cancel buttons; without them a pick applies at once. */
    readonly showFooter = input(true, { transform: booleanAttribute });
    /** Reads typed values on Enter and blur only, instead of while typing. */
    readonly processInputOnBlur = input(false, { transform: booleanAttribute });
    readonly preventScrollOnFocus = input(false, { transform: booleanAttribute });
    readonly buttonFocusable = input(false, { transform: booleanAttribute });
    readonly markWeekends = input(true, { transform: booleanAttribute });
    readonly showWeekNumbers = input(true, { transform: booleanAttribute });
    readonly startingDayOfWeek = input<DaysOfWeek | null | undefined>();
    readonly yearGrid = input<CalendarYearGrid>({ rows: 4, cols: 5 });
    readonly aggregatedYearGrid = input<CalendarYearGrid>({ rows: 4, cols: 3 });
    readonly specialDaysRules = input<SpecialDayRule<D>[]>([]);
    readonly showCalendarLegend = input(false, { transform: booleanAttribute });
    readonly legendCol = input(false, { transform: booleanAttribute });
    readonly disableFunction = input<DisableDateFunction<D>>();
    /** Opens the picker in a dialog. */
    readonly mobile = input(false, { transform: booleanAttribute });
    readonly mobileConfig = input<DatetimePickerMobileConfig>({});
    /** The layout in the mobile dialog: portrait (calendar or time) unless landscape is set. */
    readonly mobileLandscape = input(false, { transform: booleanAttribute });
    readonly mobilePortrait = input(false, { transform: booleanAttribute });
    readonly labelsInput = input<Partial<DatetimePickerLabels>>({}, { alias: 'labels' });
    readonly calendarLabels = input<Partial<CalendarLabels>>({});
    readonly timeLabels = input<Partial<TimeLabels>>({});
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly date = model<D | null | undefined>(null);
    readonly isOpen = model(false);
    readonly activeView = model<FdCalendarView>('day');
    /** The picker closed without applying, by Cancel, Escape or an outside click. */
    readonly closed = output<void>();

    private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
    private readonly calendar = viewChild(Calendar);
    private readonly dialogTpl = viewChild.required<TemplateRef<unknown>>('dialogTpl');
    private readonly dialogs = inject(DialogService);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly injector = inject(Injector);
    private readonly formDisabled = signal(false);
    private dialogRef: DialogRef | null = null;
    private destroyed = false;

    protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
    protected readonly messageShown = signal(false);
    protected readonly labels = computed(() => ({ ...DATETIME_PICKER_LABELS, ...this.labelsInput() }));
    /** Calendar or time, on narrow screens and in the mobile portrait layout. */
    protected readonly displayType = signal<'date' | 'time'>('date');
    protected readonly tempDate = signal<D | null>(null);
    protected readonly tempTime = signal<D | null>(null);

    /** The value is unreadable or not allowed. */
    readonly invalid = signal(false);
    private readonly touched = signal(false);
    private readonly displayFormat = computed(() => this.customDateTimeFormat() ?? this.formats.display.dateTimeInput);
    private readonly parseFormat = computed(() => this.customDateTimeFormat() ?? this.formats.parse.dateTimeInput);

    /** The text of the field: the formatted value, or what was typed. */
    protected readonly text = linkedSignal<{ date: D | null | undefined; formatted: string }, string>({
        source: () => ({ date: this.date(), formatted: this.format(this.date()) }),
        // an unreadable value keeps what was typed
        computation: ({ date, formatted }, previous) =>
            date != null && !this.adapter.isValid(date) ? (previous?.value ?? '') : formatted
    });

    protected readonly showMeridian = computed(
        () => this.meridian() ?? this.adapter.isTimeFormatIncludesDayPeriod(this.displayFormat())
    );
    protected readonly showHours = computed(
        () => this.displayHours() ?? this.adapter.isTimeFormatIncludesHours(this.displayFormat())
    );
    protected readonly showMinutes = computed(
        () => this.displayMinutes() ?? this.adapter.isTimeFormatIncludesMinutes(this.displayFormat())
    );
    protected readonly showSeconds = computed(
        () => this.displaySeconds() ?? this.adapter.isTimeFormatIncludesSeconds(this.displayFormat())
    );

    protected readonly computedState = computed<DatetimePickerState>(() => {
        const state = this.state();
        if (state == null && this.useValidation() && this.invalid() && this.touched()) return 'error';
        return state ?? 'default';
    });

    protected readonly portrait = computed(() => this.mobile() && !this.mobileLandscape());
    protected readonly hiddenClass = computed(() => (this.portrait() ? 'hidden' : 'max-[60rem]:hidden'));
    protected readonly wrapperClass = computed(() =>
        this.mobile() ? 'pb-4' : 'max-h-[80vh] max-w-[80vw] overflow-auto pb-4 max-[60rem]:min-w-[min(20rem,90vw)]'
    );
    protected readonly switcherClass = computed(() =>
        cn('mt-4 w-full justify-center', this.portrait() ? 'flex' : 'hidden max-[60rem]:flex')
    );

    /** The state and the message, the accessible description of the field. */
    protected readonly description = computed(() => {
        const state = this.computedState();
        const labels = this.labels();
        const stateLabel =
            state === 'default'
                ? ''
                : {
                      success: labels.successStateLabel,
                      information: labels.informationStateLabel,
                      warning: labels.warningStateLabel,
                      error: labels.errorStateLabel
                  }[state];
        return [stateLabel, this.message()].filter(Boolean).join(' ');
    });

    private onChange: (value: D | null) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        inject(DestroyRef).onDestroy(() => {
            this.destroyed = true;
            this.dialogRef?.dismiss();
        });
    }

    /** Opens or closes the picker; closing without OK drops the picked values. */
    setOpen(open: boolean): void {
        if (open && this.isDisabled()) return;
        if (open === this.isOpen()) return;
        if (open) this.resetTemp();
        else this.markTouched();
        this.isOpen.set(open);
        this.messageShown.set(false);
        if (!open) this.closed.emit();
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
        calendar.setCurrentlyDisplayed(this.tempDate());
        calendar.initialFocus();
    }

    /** The picked values start from the current value, or today and now. */
    private resetTemp(): void {
        const date = this.date();
        const valid = date != null && this.adapter.isValid(date);
        this.tempDate.set(valid ? date : null);
        this.tempTime.set(valid ? date : this.adapter.now());
        this.displayType.set('date');
    }

    protected pickDate(date: D | null | undefined): void {
        if (!date) return;
        this.tempDate.set(date);
        if (!this.showFooter() && !this.mobile()) this.apply();
    }

    protected pickTime(time: D | null): void {
        if (!time) return;
        this.tempTime.set(time);
        if (!this.showFooter() && !this.mobile()) this.apply();
    }

    /** Applies the picked date and time and closes. */
    submit(): void {
        this.apply();
        this.isOpen.set(false);
        this.markTouched();
        if (this.mobile()) this.closeDialog();
        else afterNextRender(() => this.field()?.nativeElement.focus(), { injector: this.injector });
    }

    /** Drops the picked date and time and closes. */
    cancel(): void {
        this.setOpen(false);
    }

    private apply(): void {
        const a = this.adapter;
        const day = this.tempDate() ?? a.today();
        const time = this.tempTime() ?? a.now();
        const value = a.setTime(a.clone(day), a.getHours(time), a.getMinutes(time), a.getSeconds(time));
        this.invalid.set(!this.isValueValid(value));
        if (a.dateTimesEqual(value, this.date())) return;
        this.date.set(value);
        this.text.set(this.format(value));
        this.onChange(value);
    }

    /** Reads typed text; `typing` is true for input events. */
    read(text: string, typing: boolean): void {
        if (typing === this.processInputOnBlur()) return;
        const typed = text;
        text = text.trim();
        const value = text ? this.adapter.parse(text, this.parseFormat()) : null;
        this.invalid.set(!this.isValueValid(value));
        const date = this.date();
        const same = value == null || date == null ? value == date : this.adapter.dateTimesEqual(value, date);
        if (!same || (value != null && !this.adapter.isValid(value))) {
            this.date.set(value);
            this.onChange(value);
        }
        // keep what was typed, spaces included
        if (typing) this.text.set(typed);
        else if (value != null && this.adapter.isValid(value)) this.text.set(this.format(value));
        if (value != null && this.adapter.isValid(value)) this.calendar()?.setCurrentlyDisplayed(value);
    }

    protected onFieldBlur(text: string): void {
        this.markTouched();
        if (this.processInputOnBlur()) {
            this.read(text, false);
            return;
        }
        // already read while typing: tidy the text of a readable value
        const date = this.date();
        if (date != null && this.adapter.isValid(date)) this.text.set(this.format(date));
    }

    private markTouched(): void {
        this.touched.set(true);
        this.onTouched();
    }

    private format(date: D | null | undefined): string {
        return date != null && this.adapter.isValid(date) ? this.adapter.format(date, this.displayFormat()) : '';
    }

    private isValueValid(value: D | null | undefined): boolean {
        if (value == null) return this.allowNull();
        return this.adapter.isValid(value) && !this.disableFunction()?.(value);
    }

    // mobile mode

    private openDialog(): void {
        const title = this.mobileConfig().title;
        const ref = this.dialogs.open(
            this.dialogTpl(),
            {
                mobile: true,
                disablePaddings: true,
                ariaLabelledBy: title ? `${this.id()}-dialog-title` : null,
                ariaLabel: title ? null : this.labels().pickerLabel,
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
            this.isOpen.set(false);
            this.markTouched();
            this.closed.emit();
        };
        ref.afterClosed.subscribe({ next: done, error: done });
        afterNextRender(() => this.focusCalendar(), { injector: this.injector });
    }

    private closeDialog(): void {
        const ref = this.dialogRef;
        this.dialogRef = null;
        ref?.close();
        afterNextRender(() => this.field()?.nativeElement.focus(), { injector: this.injector });
    }

    protected onFocusout(event: FocusEvent): void {
        if (!this.host.contains(event.relatedTarget as Node | null)) this.onTouched();
    }

    // forms

    writeValue(value: D | null | undefined): void {
        const date = value == null ? null : this.adapter.parse(value, this.parseFormat());
        this.date.set(date);
        this.invalid.set(!this.isValueValid(date));
    }

    registerOnChange(fn: (value: D | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
        this.formDisabled.set(disabled);
    }

    validate(): ValidationErrors | null {
        return this.isValueValid(this.date()) ? null : { dateValidation: { valid: false } };
    }

    protected readonly computedClass = computed(() => cn('inline-block', this.userClass()));
}
