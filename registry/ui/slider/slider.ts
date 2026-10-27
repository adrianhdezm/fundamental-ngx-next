/*
 * Port of @fundamental-ngx/core (slider) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
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
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';

/** A named value of a slider with custom values. */
export interface SliderCustomValue {
    value: number | string;
    label: string;
}

export type SliderValue = number | number[] | SliderCustomValue | SliderCustomValue[] | null | undefined;

interface TickMark {
    index: number;
    position: number;
    label: string;
}

/** Ticks closer than this (px) collapse to the two ends. */
const MIN_DISTANCE_BETWEEN_TICKS = 8;

let nextId = 0;

/**
 * Slider: picks a number, a range of two numbers or one of a list of custom values by dragging a
 * handle or with the keyboard (arrows by `step`, Shift+arrows and Page Up/Down by `jump`, Home and
 * End). A range slider also moves both handles together from the range between them. Ticks,
 * labels, a vertical layout and read-only or editable value tooltips are optional.
 *
 * ```html
 * <fd-slider ariaLabel="Volume" [(value)]="volume" />
 * <fd-slider mode="range" ariaLabel="Price" showTicks showTicksLabels [step]="10" [(value)]="price" />
 * ```
 */
@Component({
    selector: 'fd-slider',
    exportAs: 'fdSlider',
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Slider), multi: true }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.id]': 'id()',
        '[attr.data-disabled]': 'disabledState() || null',
        '[class]': 'computedClass()',
        '(mouseenter)': 'hovered.set(true)',
        '(mouseleave)': 'hovered.set(false)',
        '(focusin)': 'focused.set(true)',
        '(focusout)': 'onFocusout($event)'
    },
    template: `
        <div [class]="innerClass()">
            @for (handle of handles(); track handle.index) {
                <div
                    role="slider"
                    [class]="handleClass()"
                    [style]="positionStyle(handle.position)"
                    [attr.data-handle]="handle.index"
                    [attr.tabindex]="disabledState() ? -1 : 0"
                    [attr.aria-label]="ariaLabel() || null"
                    [attr.aria-labelledby]="ariaLabelledBy() || null"
                    [attr.aria-orientation]="vertical() ? 'vertical' : null"
                    [attr.aria-disabled]="disabledState() || null"
                    [attr.aria-valuemin]="domain().min"
                    [attr.aria-valuemax]="domain().max"
                    [attr.aria-valuenow]="handle.value"
                    [attr.data-icon]="handleIcon"
                    [attr.aria-valuetext]="ariaValueText() || (isCustom() ? labelOf(handle.value) : null)"
                    (pointerdown)="onHandlePointerdown($event, handle.index)"
                    (keydown)="onKeydown($event, [handle.index])"
                ></div>
                @if (tooltipMode() && tooltipShown()) {
                    <div [class]="tooltipClass()" [style]="positionStyle(handle.position)">
                        @if (tooltipMode() === 'editable' && !isCustom()) {
                            <input
                                type="text"
                                inputmode="decimal"
                                [class]="tooltipInputClass"
                                [value]="handle.value"
                                [style.width.ch]="('' + handle.value).length + 2"
                                [disabled]="disabledState()"
                                [attr.aria-label]="
                                    (ariaLabel() || 'Value') + (handles().length > 1 ? ' ' + (handle.index + 1) : '')
                                "
                                (keydown.enter)="onTooltipInput($any($event.target), handle.index)"
                                (blur)="onTooltipInput($any($event.target), handle.index)"
                            />
                        } @else {
                            <span aria-hidden="true">{{ labelOf(handle.value) }}</span>
                        }
                    </div>
                }
            }
            <div #track [class]="trackClass()" (pointerdown)="onTrackPointerdown($event)">
                @if (!hideProgressBar()) {
                    <div [class]="rangeClass()" [style]="rangeStyle()">
                        @if (isRange()) {
                            <div
                                [class]="focusRangeClass()"
                                [attr.tabindex]="disabledState() ? -1 : 0"
                                role="group"
                                [attr.aria-label]="rangeLabel()"
                                (pointerdown)="onRangePointerdown($event)"
                                (keydown)="onKeydown($event, [0, 1])"
                            ></div>
                        }
                    </div>
                }
            </div>
            @if (showTicks()) {
                <div [class]="tickWrapperClass()">
                    <div [class]="ticksClass()" (pointerdown)="onTrackPointerdown($event)">
                        @for (tick of tickMarks(); track tick.index) {
                            <div
                                [class]="tickClass(tick)"
                                [attr.data-in-range]="tickInRange(tick) || null"
                                [style]="positionStyle(tick.position)"
                            ></div>
                        }
                    </div>
                    @if (showTicksLabels()) {
                        <div [class]="labelsClass()" aria-hidden="true">
                            @for (tick of tickMarks(); track tick.index; let i = $index, first = $first, last = $last) {
                                @if (first || last || i % tickmarksBetweenLabels() === 0) {
                                    <div [class]="labelClass()" [style]="positionStyle(tick.position)">
                                        {{ tick.label }}
                                    </div>
                                }
                            }
                        </div>
                    }
                </div>
            }
        </div>
    `
})
export class Slider implements ControlValueAccessor {
    readonly id = input(`fd-slider-${nextId++}`);
    /** A number, two numbers for a range, or custom values. */
    readonly value = model<SliderValue>(null);
    readonly mode = input<'single' | 'range'>('single');
    readonly min = input(0, { transform: numberAttribute });
    readonly max = input(100, { transform: numberAttribute });
    readonly step = input(1, { transform: numberAttribute });
    /** Step of Shift+arrows and Page Up/Down. */
    readonly jump = input(10, { transform: numberAttribute });
    /** Named values instead of numbers; the value is then the chosen item(s). */
    readonly customValues = input<SliderCustomValue[]>([]);
    readonly showTicks = input(false, { transform: booleanAttribute });
    readonly showTicksLabels = input(false, { transform: booleanAttribute });
    /** Labels every n-th tick (and the first and last). */
    readonly tickmarksBetweenLabels = input(1, { transform: numberAttribute });
    readonly hideProgressBar = input(false, { transform: booleanAttribute });
    /** Shows the value above the handles while the slider is hovered or focused, or an input to type it. */
    readonly tooltipMode = input<'readonly' | 'editable' | null | undefined>();
    readonly vertical = input(false, { transform: booleanAttribute });
    /** Larger handles for touch. */
    readonly cozy = input(false, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly ariaValueText = input<string | null | undefined>();
    /** Name of the range between the handles; `{min}` and `{max}` are replaced. */
    readonly rangeAriaLabel = input('Range from {min} to {max}');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly trackRef = viewChild.required<ElementRef<HTMLElement>>('track');
    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly announcer = inject(LiveAnnouncer);
    private readonly dir = inject(Directionality, { optional: true });

    protected readonly disabledState = linkedSignal(() => this.disabled());
    protected readonly hovered = signal(false);
    protected readonly focused = signal(false);
    private readonly trackSize = signal(0);

    protected readonly isRange = computed(() => this.mode() === 'range');
    protected readonly isCustom = computed(() => this.customValues().length > 0);
    /** The numeric domain: custom values use their indexes. */
    protected readonly domain = computed(() => {
        if (this.isCustom()) return { min: 0, max: this.customValues().length - 1, step: 1 };
        const min = this.min();
        const max = Math.max(this.max(), min);
        const step = this.step() > 0 ? this.step() : 1;
        return { min, max, step };
    });
    /** Numeric values of the handles (indexes for custom values). */
    protected readonly handleValues = computed<number[]>(() => {
        const value = this.value();
        const { min, max } = this.domain();
        if (this.isRange()) {
            const pair = Array.isArray(value) ? value : [];
            const a = pair[0] == null ? min : this.toNumber(pair[0]);
            const b = pair[1] == null ? max : this.toNumber(pair[1]);
            return [this.snap(a), this.snap(b)];
        }
        const single = Array.isArray(value) ? value[0] : value;
        return [single == null ? min : this.snap(this.toNumber(single))];
    });
    protected readonly handles = computed(() =>
        this.handleValues().map((value, index) => ({ index, value, position: this.percent(value) }))
    );
    /** The arrows icon of the handles (SAP icon font). */
    protected readonly handleIcon = '\ue29c';
    protected readonly rangeLabel = computed(() => {
        const [a, b] = this.sortedValues();
        return this.rangeAriaLabel().replace('{min}', this.labelOf(a)).replace('{max}', this.labelOf(b));
    });
    protected readonly tooltipShown = computed(() => this.hovered() || this.focused());
    private readonly sortedValues = computed(() => [...this.handleValues()].sort((a, b) => a - b));

    protected readonly tickMarks = computed<TickMark[]>(() => {
        if (!this.showTicks()) return [];
        const { min, max, step } = this.domain();
        const count = Math.round((max - min) / step) + 1;
        const size = this.trackSize();
        const label = (value: number) => this.labelOf(value);
        if (!this.isCustom() && size && count > Math.floor(size / MIN_DISTANCE_BETWEEN_TICKS)) {
            return [
                { index: 0, position: 0, label: label(min) },
                { index: 1, position: 100, label: label(max) }
            ];
        }
        return Array.from({ length: count }, (_, index) => {
            const value = min + index * step;
            return { index, position: this.percent(value), label: label(value) };
        });
    });

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const track = this.trackRef().nativeElement;
            const observer = new ResizeObserver(() => {
                const rect = track.getBoundingClientRect();
                this.trackSize.set(this.vertical() ? rect.height : rect.width);
            });
            observer.observe(track);
            destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    // ControlValueAccessor
    private onChange: (value: SliderValue) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: SliderValue): void {
        this.value.set(value);
    }
    registerOnChange(fn: (value: SliderValue) => void): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
    setDisabledState(disabled: boolean): void {
        this.disabledState.set(disabled);
    }

    /** The label of a numeric value (the custom value label or the number). */
    labelOf(value: number): string {
        return this.isCustom() ? (this.customValues()[value]?.label ?? '') : `${value}`;
    }

    protected positionStyle(position: number): Record<string, string> {
        return this.vertical() ? { bottom: `${position}%` } : { 'inset-inline-start': `${position}%` };
    }

    protected rangeStyle(): Record<string, string> {
        const handles = this.handles();
        const from = this.isRange() ? Math.min(handles[0].position, handles[1].position) : 0;
        const size = this.isRange() ? Math.abs(handles[1].position - handles[0].position) : handles[0].position;
        return this.vertical()
            ? { height: `${size}%`, bottom: `${from}%` }
            : { width: `${size}%`, 'inset-inline-start': `${from}%` };
    }

    protected tickInRange(tick: TickMark): boolean {
        if (this.hideProgressBar()) return false;
        const value = this.domain().min + tick.index * this.domain().step;
        const [a, b] = this.sortedValues();
        return this.isRange() ? value >= a && value <= b : value <= this.handleValues()[0];
    }

    protected onKeydown(event: KeyboardEvent, indexes: number[]): void {
        if (this.disabledState()) return;
        const { min, max, step } = this.domain();
        const jump = this.isCustom() ? step : Math.max(this.jump(), step);
        const rtl = this.dir?.value === 'rtl' && !this.vertical();
        const up = rtl ? 'ArrowLeft' : 'ArrowRight';
        const down = rtl ? 'ArrowRight' : 'ArrowLeft';
        let delta: number | null = null;
        let target: number | null = null;
        switch (event.key) {
            case 'ArrowUp':
            case up:
                delta = event.shiftKey ? jump : step;
                break;
            case 'ArrowDown':
            case down:
                delta = -(event.shiftKey ? jump : step);
                break;
            case 'PageUp':
                delta = jump;
                break;
            case 'PageDown':
                delta = -jump;
                break;
            case 'Home':
                target = min;
                break;
            case 'End':
                target = max;
                break;
            default:
                return;
        }
        event.preventDefault();
        const values = [...this.handleValues()];
        if (indexes.length === 2) {
            // moving the range keeps its size and stops at the ends
            const [lo, hi] = this.sortedValues();
            let shift = target !== null ? (target === min ? min - lo : max - hi) : delta!;
            shift = Math.max(min - lo, Math.min(max - hi, shift));
            if (!shift) return;
            this.setValues(values.map((v) => this.snap(v + shift)));
            return;
        }
        const index = indexes[0];
        values[index] = this.snap(target ?? values[index] + delta!);
        this.setValues(values);
    }

    protected onHandlePointerdown(event: PointerEvent, index: number): void {
        if (this.disabledState() || event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const handle = event.currentTarget as HTMLElement;
        handle.focus();
        this.drag(event, (e) => {
            const values = [...this.handleValues()];
            values[index] = this.valueAt(e);
            this.setValues(values);
        });
    }

    protected onRangePointerdown(event: PointerEvent): void {
        if (this.disabledState() || event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        (event.currentTarget as HTMLElement).focus();
        const start = this.valueAt(event);
        const initial = [...this.handleValues()];
        const [lo, hi] = [Math.min(...initial), Math.max(...initial)];
        const { min, max } = this.domain();
        this.drag(event, (e) => {
            const shift = Math.max(min - lo, Math.min(max - hi, this.valueAt(e) - start));
            this.setValues(initial.map((v) => this.snap(v + shift)));
        });
    }

    /** A press on the track moves the single handle (or the nearer range handle) there. */
    protected onTrackPointerdown(event: PointerEvent): void {
        if (this.disabledState() || event.button !== 0) return;
        const value = this.valueAt(event);
        const values = [...this.handleValues()];
        const index = values.length === 2 && Math.abs(values[1] - value) < Math.abs(values[0] - value) ? 1 : 0;
        values[index] = value;
        this.setValues(values);
        const handle = this.elementRef.nativeElement.querySelector<HTMLElement>(`[data-handle="${index}"]`);
        handle?.focus();
        event.preventDefault();
        this.drag(event, (e) => {
            const next = [...this.handleValues()];
            next[index] = this.valueAt(e);
            this.setValues(next);
        });
    }

    protected onTooltipInput(input: HTMLInputElement, index: number): void {
        const number = parseFloat(input.value.replace(',', '.'));
        if (isNaN(number)) {
            input.value = `${this.handleValues()[index]}`;
            return;
        }
        const values = [...this.handleValues()];
        values[index] = this.snap(number);
        this.setValues(values);
        input.value = `${values[index]}`;
    }

    protected onFocusout(event: FocusEvent): void {
        if (this.elementRef.nativeElement.contains(event.relatedTarget as Node | null)) return;
        this.focused.set(false);
        this.onTouched();
    }

    private drag(start: PointerEvent, move: (event: PointerEvent) => void): void {
        const target = start.currentTarget as HTMLElement;
        try {
            target.setPointerCapture(start.pointerId);
        } catch {
            // not an active pointer (e.g. a synthetic event); moves still arrive while over the target
        }
        const onMove = (e: PointerEvent) => move(e);
        const onUp = () => {
            target.removeEventListener('pointermove', onMove);
            target.removeEventListener('pointerup', onUp);
            target.removeEventListener('pointercancel', onUp);
        };
        target.addEventListener('pointermove', onMove);
        target.addEventListener('pointerup', onUp);
        target.addEventListener('pointercancel', onUp);
    }

    /** The value under a pointer. */
    private valueAt(event: { clientX: number; clientY: number }): number {
        const rect = this.trackRef().nativeElement.getBoundingClientRect();
        let ratio = this.vertical()
            ? (rect.bottom - event.clientY) / (rect.height || 1)
            : (event.clientX - rect.left) / (rect.width || 1);
        if (!this.vertical() && this.dir?.value === 'rtl') ratio = 1 - ratio;
        const { min, max } = this.domain();
        return this.snap(min + ratio * (max - min));
    }

    private setValues(values: number[]): void {
        const current = this.handleValues();
        if (values.every((v, i) => v === current[i])) return;
        const toValue = (v: number) => (this.isCustom() ? this.customValues()[v] : v);
        if (this.isRange()) {
            // the handles keep their identity while dragged past each other; the model value is sorted
            this.value.set(values.map(toValue) as SliderValue);
            const [a, b] = [Math.min(...values), Math.max(...values)];
            this.onChange([toValue(a), toValue(b)] as SliderValue);
            this.announcer.announce(
                this.rangeAriaLabel().replace('{min}', this.labelOf(a)).replace('{max}', this.labelOf(b)),
                'polite'
            );
        } else {
            this.value.set(toValue(values[0]));
            this.onChange(toValue(values[0]));
        }
    }

    private toNumber(value: number | SliderCustomValue): number {
        if (this.isCustom()) {
            const key = typeof value === 'object' ? value.value : value;
            const index = this.customValues().findIndex((item) => item.value === key);
            return index >= 0 ? index : 0;
        }
        return typeof value === 'number' ? value : Number(value) || this.domain().min;
    }

    /** Clamps and rounds to the nearest step. */
    private snap(value: number): number {
        const { min, max, step } = this.domain();
        const clamped = Math.min(max, Math.max(min, value));
        return Number((min + Math.round((clamped - min) / step) * step).toFixed(6));
    }

    private percent(value: number): number {
        const { min, max } = this.domain();
        return max === min ? 0 : ((value - min) / (max - min)) * 100;
    }

    protected readonly computedClass = computed(() =>
        cn(
            'relative m-0 box-border block min-w-16 max-w-full py-4 font-sap-font-family touch-none select-none',
            // handle and track sizes (Horizon); cozy has the larger touch handles
            '[--sl-track:0.25rem] [--sl-tick:0.5rem] [--sl-hw:1.5rem] [--sl-hh:1.25rem] [--sl-aw:2.25rem] [--sl-ah:2rem]',
            this.cozy() && '[--sl-hw:2rem] [--sl-hh:1.5rem] [--sl-aw:2.75rem] [--sl-ah:2.75rem]',
            this.vertical()
                ? 'h-full min-w-0 px-4 py-[calc(var(--sl-hw)*0.5+0.125rem)]'
                : 'px-[calc(var(--sl-hw)*0.5+0.125rem)]',
            this.showTicks() && this.showTicksLabels() && !this.vertical() && 'pb-8',
            this.disabledState() && 'pointer-events-none cursor-not-allowed opacity-(--sapContent_DisabledOpacity)',
            this.userClass()
        )
    );

    protected readonly innerClass = computed(() => {
        const range = this.isRange();
        const startDot = range
            ? 'before:border-sap-content-measure-indicator-color before:bg-sap-content-measure-indicator-color'
            : 'before:border-sap-content-selected-measure-indicator-color before:bg-sap-slider-selected-background';
        return cn(
            'relative m-0 p-0',
            "before:absolute before:box-border before:size-2 before:rounded-full before:border before:border-solid before:content-['']",
            "after:absolute after:box-border after:size-2 after:rounded-full after:border after:border-solid after:content-['']",
            startDot,
            'after:border-sap-content-measure-indicator-color after:bg-sap-content-measure-indicator-color',
            this.vertical()
                ? 'h-full w-(--sl-track) before:-bottom-[0.7rem] before:left-1/2 before:-translate-x-1/2 after:-top-[0.7rem] after:left-1/2 after:-translate-x-1/2'
                : 'before:top-1/2 before:-start-[0.7rem] before:-translate-y-1/2 after:top-1/2 after:-end-[0.7rem] after:-translate-y-1/2'
        );
    });

    protected readonly trackClass = computed(() =>
        cn(
            'relative z-[1] m-0 cursor-pointer rounded-[0.25rem] bg-sap-slider-background p-0 hc:shadow-[inset_0_0_0_0.0625rem_var(--sapSlider_BorderColor)]',
            this.vertical() ? 'h-full w-(--sl-track)' : 'h-(--sl-track) w-full'
        )
    );

    protected readonly rangeClass = computed(() =>
        cn(
            'absolute box-border rounded-[0.25rem] border border-solid border-sap-slider-selected-border-color bg-sap-slider-selected-background',
            'hc:border-sap-slider-selected-background hc:shadow-[0_0_0_0.0625rem_var(--sapSlider_Selected_BorderColor)]',
            this.vertical() ? 'left-0 w-full' : 'top-0 h-full'
        )
    );

    protected readonly focusRangeClass = computed(() =>
        cn(
            'absolute m-0 cursor-grab rounded-[0.5rem] outline-none p-0 active:cursor-grabbing',
            'focus-visible:outline-(length:--sapContent_FocusWidth) focus-visible:[outline-style:var(--sapContent_FocusStyle)] focus-visible:outline-sap-content-focus-color',
            this.vertical()
                ? 'inset-y-[calc(-1*var(--sl-hh)/1.1)] left-1/2 w-[calc(var(--sl-hh)+0.5rem)] -translate-x-1/2'
                : 'inset-x-[calc(-1*var(--sl-hh)/1.1)] top-1/2 h-[calc(var(--sl-hh)+0.5rem)] -translate-y-1/2'
        )
    );

    protected readonly handleClass = computed(() => {
        const range = this.isRange();
        return cn(
            'absolute z-[3] m-0 box-border flex cursor-pointer items-center justify-center p-0 outline-none',
            'rounded-[0.5rem] border border-solid',
            // a larger invisible touch target
            "before:absolute before:top-1/2 before:left-1/2 before:h-(--sl-ah) before:w-(--sl-aw) before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
            // the arrows icon of the handle
            'after:font-sap-content-icon-font-family after:text-[0.875rem] after:leading-none after:text-sap-content-selected-foreground-color after:content-[attr(data-icon)]',
            this.vertical()
                ? 'left-1/2 h-(--sl-hw) w-(--sl-hh) -translate-x-1/2 translate-y-1/2 after:rotate-90'
                : 'top-1/2 h-(--sl-hh) w-(--sl-hw) -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2',
            range
                ? 'border-sap-slider-handle-border-color bg-sap-slider-range-handle-background hover:border-sap-slider-hover-handle-border-color hover:bg-sap-slider-hover-handle-background active:border-sap-content-focus-color active:bg-sap-slider-active-range-handle-background active:after:hidden'
                : 'border-sap-slider-handle-border-color bg-sap-slider-handle-background hover:border-sap-slider-hover-handle-border-color hover:bg-sap-slider-hover-handle-background active:border-sap-slider-active-handle-border-color active:bg-sap-slider-active-handle-background',
            'focus:z-[4] focus:border-(length:--sapContent_FocusWidth) focus:border-sap-content-focus-color focus:bg-sap-slider-active-range-handle-background focus:after:hidden'
        );
    });

    protected readonly tooltipClass = computed(() =>
        cn(
            'absolute z-[5] box-border flex min-h-4 items-center rounded-[0.0625rem] bg-sap-background-color px-2 text-sap-font-small-size leading-4 whitespace-nowrap text-sap-text-color shadow-sap-content-shadow1',
            'has-[input]:bg-transparent has-[input]:px-0 has-[input]:shadow-none',
            this.vertical()
                ? 'left-[calc(100%+var(--sl-hh)/2+0.5rem)] translate-y-1/2'
                : 'bottom-[calc(var(--sl-hh)/2+0.5rem)] -translate-x-1/2 rtl:translate-x-1/2'
        )
    );

    protected readonly tooltipInputClass = [
        'box-border m-0 h-sap-element-compact-height min-w-8 rounded-sap-field-border-corner-radius px-1 text-center',
        'border-width-sap-field-border-width border-solid border-sap-field-border-color bg-sap-field-background font-sap-font-family text-sap-font-size text-sap-field-text-color',
        'outline-none focus:outline-sap focus:outline-offset-[-0.125rem]'
    ].join(' ');

    protected readonly tickWrapperClass = computed(() =>
        cn(
            'absolute z-[2] m-0 p-0',
            this.vertical()
                ? 'inset-y-0 left-[calc((var(--sl-track)-var(--sl-tick))/2)] w-(--sl-tick)'
                : 'top-[calc((var(--sl-track)-var(--sl-tick))/2)] w-full'
        )
    );

    protected readonly ticksClass = computed(() =>
        cn('relative m-0 cursor-pointer p-0', this.vertical() ? 'h-full w-(--sl-tick)' : 'h-(--sl-tick) w-full')
    );

    protected tickClass(_tick: TickMark): string {
        return cn(
            'absolute m-0 border-0 border-solid border-sap-content-measure-indicator-color p-0 data-[in-range]:border-sap-slider-selected-border-color',
            this.vertical() ? 'left-0 h-0 w-(--sl-tick) border-t' : 'top-0 h-(--sl-tick) w-0 border-s'
        );
    }

    protected readonly labelsClass = computed(() =>
        cn(
            'absolute m-0 p-0 text-sap-font-small-size text-sap-content-label-color',
            this.vertical()
                ? 'inset-y-0 left-[calc(var(--sl-tick)+0.75rem)]'
                : 'top-[calc(var(--sl-tick)+0.5rem)] h-4 w-full'
        )
    );

    protected readonly labelClass = computed(() =>
        cn(
            'absolute m-0 p-0 leading-4 whitespace-nowrap',
            this.vertical() ? 'translate-y-1/2' : '-translate-x-1/2 rtl:translate-x-1/2'
        )
    );
}
