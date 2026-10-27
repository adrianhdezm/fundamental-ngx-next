/*
 * Port of @fundamental-ngx/core (time) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals and Tailwind CSS; the
 * columns show a window around the value instead of a carousel.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    booleanAttribute,
    computed,
    forwardRef,
    inject,
    input,
    linkedSignal,
    model,
    numberAttribute,
    output,
    signal,
    viewChild,
    viewChildren
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DatetimeAdapter } from '@/lib/datetime';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';

export type FdTimeActiveView = 'hour' | 'minute' | 'second' | 'meridian';
export type Meridian = 'AM' | 'PM';

/** A value of a time column and its label. */
export interface SelectableViewItem<T> {
    value: T;
    label: string;
}

/** Texts of a time column. */
export interface TimeColumnConfig {
    label: string;
    fullLabel: string;
    decreaseLabel: string;
    increaseLabel: string;
    navigationInstruction: string;
}

/** Texts of the time, in English by default. */
export interface TimeLabels {
    componentAriaName: string;
    hours: TimeColumnConfig;
    minutes: TimeColumnConfig;
    seconds: TimeColumnConfig;
    period: TimeColumnConfig;
}

const NAVIGATION =
    'To move between items in this list, press top arrow or bottom arrow. To switch between lists press left arrow or right arrow.';

export const TIME_LABELS: TimeLabels = {
    componentAriaName: 'Time picker',
    hours: {
        label: 'Hrs',
        fullLabel: 'Hours',
        decreaseLabel: 'Decrease hours',
        increaseLabel: 'Increase hours',
        navigationInstruction: NAVIGATION
    },
    minutes: {
        label: 'Min',
        fullLabel: 'Minutes',
        decreaseLabel: 'Decrease minutes',
        increaseLabel: 'Increase minutes',
        navigationInstruction: NAVIGATION
    },
    seconds: {
        label: 'Sec',
        fullLabel: 'Seconds',
        decreaseLabel: 'Decrease seconds',
        increaseLabel: 'Increase seconds',
        navigationInstruction: NAVIGATION
    },
    period: {
        label: 'Period',
        fullLabel: 'Period',
        decreaseLabel: 'Decrease period',
        increaseLabel: 'Increase period',
        navigationInstruction: NAVIGATION
    }
};

let nextColumnId = 0;

const ITEM =
    'm-0 box-border flex h-(--time-item-h) min-h-(--time-item-h) w-12 shrink-0 items-center justify-center rounded-(--sapButton_BorderCornerRadius) border border-solid p-0';

const LABEL =
    'm-0 block h-8 overflow-hidden p-0 text-sap-font-small-size leading-8 whitespace-nowrap text-sap-content-label-color';
const COLLAPSED =
    'cursor-pointer border-transparent bg-sap-content-selected-background text-sap-content-selected-text-color hover:bg-sap-content-selected-hover-background group-focus-visible/col:outline-(length:--sapContent_FocusWidth) group-focus-visible/col:[outline-style:var(--sapContent_FocusStyle)] group-focus-visible/col:-outline-offset-[0.1875rem] group-focus-visible/col:outline-sap-content-focus-color';

/**
 * A column of a time: while active it shows a window of values around the selected one, which
 * the arrow keys, the mouse wheel, dragging, clicks, typing and the spinner buttons change; while
 * inactive it shows only the selected value. It is a spinbutton for assistive technology.
 */
@Component({
    selector: 'fd-time-column',
    imports: [Button],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `
        <span [attr.id]="id() + '-label'" class="${LABEL}" aria-hidden="true">{{ config().label }}</span>
        @if (active() && spinners()) {
            <button
                fdButton
                variant="transparent"
                glyph="navigation-up-arrow"
                tabindex="-1"
                [ariaLabel]="config().decreaseLabel"
                [attr.title]="config().decreaseLabel"
                (click)="step(-1)"
            ></button>
        }
        <div
            #indicator
            role="spinbutton"
            tabindex="0"
            [attr.id]="id()"
            [attr.aria-label]="config().fullLabel"
            [attr.aria-valuenow]="index()"
            [attr.aria-valuemin]="0"
            [attr.aria-valuemax]="rows().length - 1"
            [attr.aria-valuetext]="current()?.label"
            [attr.aria-description]="config().navigationInstruction"
            [attr.aria-disabled]="disabled() || null"
            [class]="wrapperClass()"
            [style.height]="active() ? 'calc(var(--time-item-h) * ' + elementsAtOnce() + ')' : null"
            (focus)="activate.emit()"
            (keydown)="onKeydown($event)"
            (wheel)="onWheel($event)"
            (pointerdown)="onPointerDown($event)"
        >
            @if (active()) {
                <div #list class="m-0 flex flex-col items-center p-0 touch-pan-x select-none">
                    @for (item of window(); track $index) {
                        @if (item) {
                            <span
                                aria-hidden="true"
                                [attr.data-displayed-value]="item.value"
                                [class]="item === current() ? currentClass : itemClass"
                                (click)="pick(item)"
                            >
                                {{ item.label }}
                            </span>
                        } @else {
                            <span aria-hidden="true" class="${ITEM} invisible"></span>
                        }
                    }
                </div>
            } @else {
                <span aria-hidden="true" class="${ITEM} ${COLLAPSED}" (click)="activate.emit()">{{
                    current()?.label
                }}</span>
            }
        </div>
        @if (active() && spinners()) {
            <button
                fdButton
                variant="transparent"
                glyph="navigation-down-arrow"
                tabindex="-1"
                [ariaLabel]="config().increaseLabel"
                [attr.title]="config().increaseLabel"
                (click)="step(1)"
            ></button>
        }
    `
})
export class TimeColumn<T = unknown> {
    readonly id = input(`fd-time-column-${nextColumnId++}`);
    readonly rows = input<SelectableViewItem<T>[]>([]);
    readonly activeValue = input<SelectableViewItem<T> | null | undefined>();
    /** The expanded column the keys act on. */
    readonly active = input(false, { transform: booleanAttribute });
    readonly spinners = input(true, { transform: booleanAttribute });
    readonly elementsAtOnce = input(7, { transform: numberAttribute });
    /** Wraps around from the last value to the first; off for short columns like the period. */
    readonly loop = input(true, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly config = input<TimeColumnConfig>(TIME_LABELS.hours);

    readonly activeValueChange = output<SelectableViewItem<T>>();
    /** The column wants to become active (focus or click). */
    readonly activate = output<void>();

    private readonly indicator = viewChild.required<ElementRef<HTMLElement>>('indicator');
    private readonly list = viewChild<ElementRef<HTMLElement>>('list');
    private keys = '';
    private keyTimer: ReturnType<typeof setTimeout> | undefined;

    /** The value, updated at once on changes so fast key presses go on from it. */
    protected readonly current = linkedSignal(() => this.activeValue());

    protected readonly index = computed(() => {
        const value = this.current();
        return Math.max(
            0,
            this.rows().findIndex((row) => row === value || row.value === value?.value)
        );
    });

    private readonly loops = computed(() => this.loop() && this.rows().length > this.elementsAtOnce());

    /** The values shown around the selected one; null where a short column has none. */
    protected readonly window = computed(() => {
        const rows = this.rows();
        const half = Math.floor(this.elementsAtOnce() / 2);
        return Array.from({ length: half * 2 + 1 }, (_, i) => {
            const at = this.index() + i - half;
            if (this.loops()) return rows[((at % rows.length) + rows.length) % rows.length];
            return rows[at] ?? null;
        });
    });

    constructor() {
        inject(DestroyRef).onDestroy(() => clearTimeout(this.keyTimer));
    }

    focus(): void {
        this.indicator().nativeElement.focus();
    }

    /** Selects the value a number of steps away. */
    step(steps: number): void {
        const rows = this.rows();
        if (!rows.length || this.disabled()) return;
        let index = this.index() + steps;
        if (this.loops()) index = ((index % rows.length) + rows.length) % rows.length;
        else index = Math.max(0, Math.min(rows.length - 1, index));
        if (index === this.index()) return;
        this.emit(rows[index], Math.sign(steps));
    }

    protected pick(item: SelectableViewItem<T>): void {
        if (this.dragged || this.disabled()) return;
        const rows = this.rows();
        let steps = rows.indexOf(item) - this.index();
        if (this.loops() && Math.abs(steps) > rows.length / 2) steps -= Math.sign(steps) * rows.length;
        this.emit(item, Math.sign(steps));
    }

    private emit(item: SelectableViewItem<T>, direction: number): void {
        this.current.set(item);
        this.activeValueChange.emit(item);
        this.focus();
        // slide the values in from the side they came from
        this.list()?.nativeElement.animate?.(
            [{ transform: `translateY(calc(var(--time-item-h) * ${direction}))` }, { transform: 'none' }],
            { duration: 150, easing: 'ease-out' }
        );
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.key === 'ArrowDown') this.step(1);
        else if (event.key === 'ArrowUp') this.step(-1);
        else if (event.key === 'PageDown') this.step(this.elementsAtOnce());
        else if (event.key === 'PageUp') this.step(-this.elementsAtOnce());
        else if (event.key === 'Home') this.step(-this.index());
        else if (event.key === 'End') this.step(this.rows().length - 1 - this.index());
        else if (/^[0-9]$/.test(event.key)) this.typeDigit(event.key);
        else if (/^[a-z]$/i.test(event.key) && !event.ctrlKey && !event.metaKey) this.typeLetter(event.key);
        else return;
        event.preventDefault();
    }

    /** Typed digits pick the value: at once when no longer number can follow. */
    private typeDigit(digit: string): void {
        clearTimeout(this.keyTimer);
        this.keys += digit;
        const typed = Number(this.keys);
        const last = Math.max(
            ...this.rows()
                .map((row) => Number(row.value))
                .filter((v) => !isNaN(v))
        );
        const done = typed * 10 > last || this.keys.length >= String(last).length;
        const apply = () => {
            const item = this.rows().find((row) => Number(row.value) === typed);
            if (item) this.emit(item, 0);
            this.keys = '';
        };
        if (done) apply();
        else this.keyTimer = setTimeout(apply, 500);
    }

    /** A letter picks the first value whose label starts with it, e.g. A and P for the period. */
    private typeLetter(letter: string): void {
        const item = this.rows().find((row) => row.label.toLowerCase().startsWith(letter.toLowerCase()));
        if (item && item !== this.current()) this.emit(item, 0);
    }

    protected onWheel(event: WheelEvent): void {
        if (!this.active()) return;
        event.preventDefault();
        this.step(event.deltaY > 0 ? 1 : -1);
    }

    private dragged = false;

    /** Dragging moves one value per item height. */
    protected onPointerDown(event: PointerEvent): void {
        if (!this.active() || event.button !== 0) return;
        const element = this.indicator().nativeElement;
        const itemHeight = parseFloat(getComputedStyle(element).getPropertyValue('--time-item-h')) * 16 || 46;
        let last = event.clientY;
        this.dragged = false;
        const move = (e: PointerEvent) => {
            const steps = Math.trunc((last - e.clientY) / itemHeight);
            if (steps) {
                this.dragged = true;
                last -= steps * itemHeight;
                this.step(steps);
            }
        };
        const up = () => {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            // a drag is no click on the value under the pointer
            setTimeout(() => (this.dragged = false));
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
    }

    protected readonly computedClass = computed(() =>
        cn('m-0 box-border flex flex-col items-center p-0 me-2 last:me-0', this.disabled() && 'pointer-events-none')
    );

    protected readonly wrapperClass = computed(() =>
        cn(
            'group/col relative m-0 box-border flex w-12 flex-[1_1_auto] flex-col items-center justify-center overflow-hidden p-0 outline-none',
            this.active() && 'max-h-[calc(var(--time-item-h)*7)] justify-start',
            // the labels stay readable; the disabled values dim
            this.disabled() && 'opacity-(--sapContent_DisabledOpacity)'
        )
    );

    protected readonly itemClass = cn(
        ITEM,
        'cursor-default border-sap-list-background bg-sap-legend-working-background hover:bg-sap-list-hover-background active:border-transparent active:bg-sap-content-selected-background active:text-sap-content-selected-text-color'
    );

    /** The selected value; the column's focus shows on it. */
    protected readonly currentClass = cn(
        ITEM,
        'cursor-default border-sap-list-selection-border-color bg-sap-list-background hover:bg-sap-list-hover-background',
        'group-focus-visible/col:outline-(length:--sapContent_FocusWidth) group-focus-visible/col:[outline-style:var(--sapContent_FocusStyle)] group-focus-visible/col:-outline-offset-[0.1875rem] group-focus-visible/col:outline-sap-content-focus-color'
    );
}

/**
 * Time: picks hours, minutes, seconds and the period in columns of values. Left and Right move
 * between the columns; Up and Down, the mouse wheel, dragging, typing and the spinner buttons
 * change the value of the active one.
 *
 * ```html
 * <fd-time [(time)]="time" meridian [displaySeconds]="false" />
 * ```
 */
@Component({
    selector: 'fd-time',
    exportAs: 'fdTime',
    imports: [TimeColumn],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Time), multi: true }],
    host: {
        role: 'group',
        '[attr.aria-label]': 'labels().componentAriaName',
        '[class]': 'computedClass()',
        '(keydown)': 'onKeydown($event)',
        '(focusout)': 'onFocusout($event)'
    },
    template: `
        @if (displayHours()) {
            <fd-time-column
                [id]="id() + '-hours'"
                [rows]="hourItems()"
                [activeValue]="activeHour()"
                [active]="activeView() === 'hour'"
                [elementsAtOnce]="elementsAtOnce()"
                [spinners]="spinnerButtons()"
                [disabled]="isDisabled()"
                [config]="labels().hours"
                (activate)="activeView.set('hour')"
                (activeValueChange)="setHour($event.value)"
            />
        }
        @if (displayMinutes()) {
            <fd-time-column
                [id]="id() + '-minutes'"
                [rows]="minuteItems()"
                [activeValue]="activeMinute()"
                [active]="activeView() === 'minute'"
                [elementsAtOnce]="elementsAtOnce()"
                [spinners]="spinnerButtons()"
                [disabled]="isDisabled()"
                [config]="labels().minutes"
                (activate)="activeView.set('minute')"
                (activeValueChange)="setMinute($event.value)"
            />
        }
        @if (displaySeconds()) {
            <fd-time-column
                [id]="id() + '-seconds'"
                [rows]="secondItems()"
                [activeValue]="activeSecond()"
                [active]="activeView() === 'second'"
                [elementsAtOnce]="elementsAtOnce()"
                [spinners]="spinnerButtons()"
                [disabled]="isDisabled()"
                [config]="labels().seconds"
                (activate)="activeView.set('second')"
                (activeValueChange)="setSecond($event.value)"
            />
        }
        @if (meridian()) {
            <fd-time-column
                [id]="id() + '-period'"
                [rows]="meridianItems()"
                [activeValue]="activeMeridian()"
                [active]="activeView() === 'meridian'"
                [elementsAtOnce]="elementsAtOnce()"
                [spinners]="spinnerButtons()"
                [disabled]="isDisabled()"
                [loop]="false"
                [config]="labels().period"
                (activate)="activeView.set('meridian')"
                (activeValueChange)="setMeridian($event.value)"
            />
        }
    `
})
export class Time<D> implements ControlValueAccessor {
    private readonly adapter = inject<DatetimeAdapter<D>>(DatetimeAdapter);

    readonly id = input(`fd-time-${nextColumnId++}`);
    /** A 12-hour clock with a period column. */
    readonly meridian = input(false, { transform: booleanAttribute });
    readonly keepTwoDigits = input(false, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly displayHours = input(true, { transform: booleanAttribute });
    readonly displayMinutes = input(true, { transform: booleanAttribute });
    readonly displaySeconds = input(true, { transform: booleanAttribute });
    /** Smaller paddings for tablets. */
    readonly tablet = input(false, { transform: booleanAttribute });
    /** Values shown in the active column; odd. */
    readonly elementsAtOnce = input(7, { transform: numberAttribute });
    readonly spinnerButtons = input(true, { transform: booleanAttribute });
    readonly minuteStep = input(1, { transform: numberAttribute });
    readonly labelsInput = input<Partial<TimeLabels>>({}, { alias: 'labels' });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    /** The time; its date part is kept. */
    readonly time = model<D>(this.adapter.today());
    readonly activeView = model<FdTimeActiveView>('hour');

    private readonly columns = viewChildren(TimeColumn);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly formDisabled = signal(false);
    protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
    readonly labels = computed(() => ({ ...TIME_LABELS, ...this.labelsInput() }));

    private onChange: (value: D) => void = () => {};
    private onTouched: () => void = () => {};

    private readonly hour = computed(() => this.adapter.getHours(this.time()));

    protected readonly hourItems = computed(() => {
        this.adapter.locale();
        return this.adapter
            .getHourNames({ meridian: this.meridian(), twoDigit: this.keepTwoDigits() })
            .map((label, value) => ({ value, label }));
    });
    protected readonly minuteItems = computed(() => {
        this.adapter.locale();
        const step = Math.max(1, this.minuteStep());
        return this.adapter
            .getMinuteNames({ twoDigit: this.keepTwoDigits(), minuteStep: step })
            .map((label, index) => ({ value: index * step, label }));
    });
    protected readonly secondItems = computed(() => {
        this.adapter.locale();
        return this.adapter
            .getSecondNames({ twoDigit: this.keepTwoDigits() })
            .map((label, value) => ({ value, label }));
    });
    protected readonly meridianItems = computed<SelectableViewItem<Meridian>[]>(() => {
        this.adapter.locale();
        const [am, pm] = this.adapter.getDayPeriodNames();
        return [
            { value: 'AM', label: am },
            { value: 'PM', label: pm }
        ];
    });

    protected readonly activeHour = computed(() => this.hourItems().find((item) => item.value === this.hour()));
    protected readonly activeMinute = computed(() => {
        const step = Math.max(1, this.minuteStep());
        const minute = Math.min(Math.round(this.adapter.getMinutes(this.time()) / step) * step, 60 - step);
        return this.minuteItems().find((item) => item.value === minute);
    });
    protected readonly activeSecond = computed(() =>
        this.secondItems().find((item) => item.value === this.adapter.getSeconds(this.time()))
    );
    protected readonly activeMeridian = computed(() => this.meridianItems()[this.hour() >= 12 ? 1 : 0]);

    setHour(hour: number): void {
        this.update(this.adapter.setHours(this.time(), hour));
    }

    setMinute(minute: number): void {
        this.update(this.adapter.setMinutes(this.time(), minute));
    }

    setSecond(second: number): void {
        this.update(this.adapter.setSeconds(this.time(), second));
    }

    /** Switches the period, keeping the hour on the clock. */
    setMeridian(meridian: Meridian): void {
        const hour = this.hour();
        if ((meridian === 'PM') === hour >= 12) return;
        this.setHour(meridian === 'PM' ? hour + 12 : hour - 12);
    }

    private update(time: D): void {
        this.time.set(time);
        this.onChange(time);
    }

    /** Focuses the active column. */
    focusActiveColumn(): void {
        this.columns()[this.visibleViews().indexOf(this.activeView())]?.focus();
    }

    private visibleViews(): FdTimeActiveView[] {
        const views: [boolean, FdTimeActiveView][] = [
            [this.displayHours(), 'hour'],
            [this.displayMinutes(), 'minute'],
            [this.displaySeconds(), 'second'],
            [this.meridian(), 'meridian']
        ];
        return views.filter(([shown]) => shown).map(([, view]) => view);
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const views = this.visibleViews();
        const rtl = getComputedStyle(this.host).direction === 'rtl';
        const forward = (event.key === 'ArrowRight') !== rtl;
        const index = views.indexOf(this.activeView());
        this.activeView.set(views[(index + (forward ? 1 : -1) + views.length) % views.length]);
        this.focusActiveColumn();
    }

    protected onFocusout(event: FocusEvent): void {
        if (!this.host.contains(event.relatedTarget as Node | null)) this.onTouched();
    }

    writeValue(value: D | null): void {
        this.time.set(value && this.adapter.isValid(value) ? value : this.adapter.today());
    }

    registerOnChange(fn: (value: D) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
        this.formDisabled.set(disabled);
    }

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex justify-center p-4 font-sap-font-family text-sap-font-size text-sap-text-color',
            '[--time-item-h:2.875rem] compact:p-2 compact:[--time-item-h:2rem]',
            this.tablet() && 'p-2 compact:[--time-item-h:2.875rem]',
            this.userClass()
        )
    );
}
