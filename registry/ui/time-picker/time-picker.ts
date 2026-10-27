/*
 * Port of @fundamental-ngx/core (time-picker) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Injector,
    afterNextRender,
    booleanAttribute,
    computed,
    forwardRef,
    inject,
    input,
    linkedSignal,
    model,
    numberAttribute,
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
import { Button } from '@/ui/button/button';
import { FormInputMessageGroup } from '@/ui/form/form-input-message-group';
import { FormMessage, type FormMessageType } from '@/ui/form/form-message';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/ui/input-group/input-group';
import { Popover, PopoverBody, PopoverControl, type Placement } from '@/ui/popover/popover';
import { Time, type TimeLabels } from '@/ui/time/time';

export type TimePickerState = 'success' | 'error' | 'warning' | 'default' | 'information';

let nextId = 0;

/**
 * Time picker: a time field with a button that opens the time columns in a popover. Typed times
 * are parsed on Enter and when the field loses the focus; a time that cannot be read sets the
 * error state. The columns follow the display format (12-hour clock, seconds) unless set.
 *
 * ```html
 * <fd-time-picker [(time)]="time" />
 * <fd-time-picker [(ngModel)]="time" [displaySeconds]="false" message="Pick a time" messageType="information" />
 * ```
 */
@Component({
    selector: 'fd-time-picker',
    exportAs: 'fdTimePicker',
    imports: [
        Popover,
        PopoverControl,
        PopoverBody,
        InputGroup,
        InputGroupInput,
        InputGroupAddon,
        Button,
        FormInputMessageGroup,
        FormMessage,
        Time
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TimePicker), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => TimePicker), multi: true }
    ],
    host: { '[class]': 'computedClass()', '(focusout)': 'onFocusout($event)' },
    template: `
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
            [bodyAriaLabel]="labels().componentAriaName"
            (isOpenChange)="setOpen($event)"
        >
            <fd-popover-control>
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
                            [attr.placeholder]="placeholder() || defaultPlaceholder()"
                            [attr.aria-label]="ariaLabelledBy() ? null : timePickerInputLabel()"
                            [attr.aria-labelledby]="ariaLabelledBy() || null"
                            [attr.aria-required]="required() || null"
                            [attr.aria-invalid]="computedState() === 'error' || null"
                            (keydown.enter)="parse(field.value)"
                            (keydown.alt.arrowDown)="$event.preventDefault(); setOpen(true)"
                            (blur)="parse(field.value)"
                        />
                        <span fdInputGroupAddon button>
                            <button
                                fdButton
                                variant="transparent"
                                glyph="fob-watch"
                                [ariaLabel]="timePickerButtonLabel()"
                                [attr.title]="timePickerButtonLabel()"
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
            </fd-popover-control>
            <fd-popover-body>
                @if (message()) {
                    <fd-form-message [type]="messageType()" embedded static>{{ message() }}</fd-form-message>
                }
                <ng-content />
                @if (isOpen()) {
                    <fd-time
                        [id]="id() + '-time'"
                        [time]="shownTime()"
                        [meridian]="showMeridian()"
                        [displayHours]="showHours()"
                        [displayMinutes]="showMinutes()"
                        [displaySeconds]="showSeconds()"
                        [keepTwoDigits]="keepTwoDigitsTime()"
                        [spinnerButtons]="spinnerButtons()"
                        [minuteStep]="minuteStep()"
                        [tablet]="tablet()"
                        [disabled]="isDisabled()"
                        [labels]="timeLabels()"
                        (timeChange)="pick($event)"
                    />
                }
            </fd-popover-body>
        </fd-popover>
    `
})
export class TimePicker<D> implements ControlValueAccessor, Validator {
    private readonly adapter = inject<DatetimeAdapter<D>>(DatetimeAdapter);
    private readonly formats = inject(DATE_TIME_FORMATS);

    readonly id = input(`fd-time-picker-${nextId++}`);
    readonly inputId = input<string | null | undefined>();
    readonly placeholder = input<string | null | undefined>();
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly required = input(false, { transform: booleanAttribute });
    readonly spinnerButtons = input(true, { transform: booleanAttribute });
    /** A 12-hour clock; by default from the display format. */
    readonly meridian = input<boolean | null | undefined>();
    readonly displayHours = input<boolean | null | undefined>();
    readonly displayMinutes = input<boolean | null | undefined>();
    readonly displaySeconds = input<boolean | null | undefined>();
    readonly timePickerInputLabel = input('Time picker input');
    readonly timePickerButtonLabel = input('Open picker');
    readonly ariaLabelledBy = input<string | null | undefined>();
    /** An empty field is a valid (null) time. */
    readonly allowNull = input(true, { transform: booleanAttribute });
    readonly tablet = input(false, { transform: booleanAttribute });
    readonly message = input<string | null | undefined>();
    readonly messageType = input<FormMessageType>('default');
    readonly messageTriggers = input<string[]>(['focusin', 'focusout']);
    readonly placement = input<Placement>('bottom-start');
    /** An unreadable time sets the error state, unless a state is set. */
    readonly useValidation = input(true, { transform: booleanAttribute });
    readonly state = input<TimePickerState | null | undefined>();
    readonly buttonFocusable = input(true, { transform: booleanAttribute });
    readonly keepTwoDigitsTime = input(false, { transform: booleanAttribute });
    readonly displayFormat = input<unknown>();
    readonly parseFormat = input<unknown>();
    readonly minuteStep = input(1, { transform: numberAttribute });
    readonly timeLabels = input<Partial<TimeLabels>>({});
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly time = model<D | null | undefined>(null);
    readonly isOpen = model(false);

    private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
    private readonly timeComponent = viewChild(Time);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly injector = inject(Injector);
    private readonly formDisabled = signal(false);
    protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
    protected readonly messageShown = signal(false);
    protected readonly labels = computed(() => ({ componentAriaName: 'Time picker', ...this.timeLabels() }));

    /** The typed text could not be read. */
    readonly invalid = signal(false);
    private readonly displayFormatValue = computed(() => this.displayFormat() ?? this.formats.display.timeInput);
    private readonly parseFormatValue = computed(() => this.parseFormat() ?? this.formats.parse.timeInput);
    /** The text of the field: the formatted time, or what was typed. */
    protected readonly text = linkedSignal<{ time: D | null | undefined; formatted: string }, string>({
        // the formatted text follows the locale and the display format too
        source: () => ({ time: this.time(), formatted: this.format(this.time()) }),
        // an unreadable time keeps what was typed
        computation: ({ time, formatted }, previous) =>
            time != null && !this.adapter.isValid(time) ? (previous?.value ?? '') : formatted
    });

    protected readonly showMeridian = computed(
        () => this.meridian() ?? this.adapter.isTimeFormatIncludesDayPeriod(this.displayFormatValue())
    );
    protected readonly showHours = computed(
        () => this.displayHours() ?? this.adapter.isTimeFormatIncludesHours(this.displayFormatValue())
    );
    protected readonly showMinutes = computed(
        () => this.displayMinutes() ?? this.adapter.isTimeFormatIncludesMinutes(this.displayFormatValue())
    );
    protected readonly showSeconds = computed(
        () => this.displaySeconds() ?? this.adapter.isTimeFormatIncludesSeconds(this.displayFormatValue())
    );
    /** The time shown in the columns: now when none is set. */
    protected readonly shownTime = computed(() => {
        const time = this.time();
        return time && this.adapter.isValid(time) ? time : this.adapter.now();
    });

    protected readonly defaultPlaceholder = computed(
        () =>
            [this.showHours() && 'hh', this.showMinutes() && 'mm', this.showSeconds() && 'ss']
                .filter(Boolean)
                .join(':') + (this.showMeridian() ? ' am/pm' : '')
    );

    protected readonly computedState = computed<TimePickerState>(() => {
        const state = this.state();
        if (state == null && this.useValidation() && this.invalid()) return 'error';
        return state ?? 'default';
    });

    private onChange: (value: D | null) => void = () => {};
    private onTouched: () => void = () => {};

    /** Opens or closes the time columns. */
    setOpen(open: boolean): void {
        if (open && this.isDisabled()) return;
        if (open === this.isOpen()) return;
        this.isOpen.set(open);
        this.messageShown.set(false);
        afterNextRender(
            () => {
                if (open) this.timeComponent()?.focusActiveColumn();
                else this.field().nativeElement.focus();
            },
            { injector: this.injector }
        );
    }

    /** Reads a typed time. */
    parse(value: string): void {
        value = value.trim();
        if (value === this.format(this.time()) && !this.invalid()) return;
        if (!value) {
            this.invalid.set(!this.allowNull());
            this.commit(null);
            return;
        }
        // drop "in the morning" style periods written by dayPeriod formats
        const parsed = this.adapter.parse(
            value.replace(/\b(at night|in the morning|in the afternoon|in the evening)\b/g, '').trim(),
            this.parseFormatValue()
        );
        const valid = this.adapter.isValid(parsed);
        this.invalid.set(!valid);
        this.text.set(valid ? this.format(parsed) : value);
        this.commit(parsed);
    }

    /** A time picked in the columns. */
    protected pick(time: D): void {
        if (this.adapter.dateTimesEqual(time, this.time())) return;
        this.invalid.set(false);
        this.commit(time);
    }

    private commit(time: D | null): void {
        this.time.set(time);
        if (time === null || this.adapter.isValid(time)) this.text.set(this.format(time));
        this.onChange(time);
    }

    private format(time: D | null | undefined): string {
        if (time == null || !this.adapter.isValid(time)) return '';
        return this.adapter.format(time, this.displayFormatValue());
    }

    protected onFocusout(event: FocusEvent): void {
        if (!this.host.contains(event.relatedTarget as Node | null)) this.onTouched();
    }

    writeValue(value: D | null): void {
        if (value == null) {
            this.time.set(null);
            this.invalid.set(!this.allowNull());
        } else {
            const parsed = this.adapter.parse(value, this.parseFormatValue());
            this.time.set(parsed);
            this.invalid.set(!this.adapter.isValid(parsed));
        }
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
        return this.invalid() ? { timeValidation: { valid: false } } : null;
    }

    protected readonly computedClass = computed(() => cn('inline-block', this.userClass()));
}
