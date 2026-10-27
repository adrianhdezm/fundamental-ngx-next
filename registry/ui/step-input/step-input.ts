/*
 * Port of @fundamental-ngx/core (step-input) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    LOCALE_ID,
    booleanAttribute,
    computed,
    effect,
    forwardRef,
    inject,
    input,
    linkedSignal,
    model,
    numberAttribute,
    output,
    viewChild
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';
import { fieldBase, fieldStates, type FormState } from '@/ui/input/input';
import { INPUT_GROUP_BUTTON_VARS, STATE_FOCUS_COLOR } from '@/ui/input-group/input-group';

let nextId = 0;

/** Milliseconds a pressed button waits before it repeats, and between repeats. */
const REPEAT_DELAY = 500;
const REPEAT_INTERVAL = 40;

/** A number that a text could not be parsed to. */
const INVALID = Symbol('invalid');

/**
 * Step input: a number field with decrement and increment buttons. The value is formatted for the
 * locale (as a decimal or a currency) and parsed back from what is typed. The buttons repeat while
 * pressed; Up and Down (and Page Up/Down by ten steps, Home and End to the limits) and the mouse
 * wheel step the value while the field has the focus.
 *
 * ```html
 * <label fdFormLabel for="qty">Quantity</label>
 * <fd-step-input inputId="qty" [min]="0" [max]="10" [(value)]="quantity" />
 * ```
 */
@Component({
    selector: 'fd-step-input',
    exportAs: 'fdStepInput',
    imports: [Button],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StepInput), multi: true }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'hostClass()',
        '(focusout)': 'onFocusout($event)'
    },
    template: `
        <div [class]="fieldClass()">
            @if (hasStepButtons() && !readonly()) {
                <button
                    fdButton
                    variant="transparent"
                    type="button"
                    tabindex="-1"
                    [class]="buttonClass"
                    [glyph]="decrementButtonIcon()"
                    [ariaLabel]="decrementLabel()"
                    [attr.title]="decrementLabel()"
                    [attr.aria-controls]="inputId()"
                    [disabled]="disabledState() || !canDecrement()"
                    (pointerdown)="startRepeat($event, -1)"
                    (mousedown)="$event.preventDefault()"
                    (click)="$event.detail === 0 && stepBy(-1)"
                ></button>
            }
            <input
                #field
                type="text"
                inputmode="decimal"
                role="spinbutton"
                autocomplete="off"
                [id]="inputId()"
                [attr.name]="name() || null"
                [attr.title]="inputTitle() || null"
                [attr.placeholder]="placeholder() || null"
                [disabled]="disabledState()"
                [readOnly]="readonly()"
                [attr.aria-label]="ariaLabel() || null"
                [attr.aria-labelledby]="ariaLabelledBy() || null"
                [attr.aria-describedby]="unitText() ? inputId() + '-unit' : null"
                [attr.aria-roledescription]="ariaRoleDescription() || null"
                [attr.aria-valuenow]="value() ?? null"
                [attr.aria-valuetext]="value() != null ? format(value()) : null"
                [attr.aria-valuemin]="min() ?? null"
                [attr.aria-valuemax]="max() ?? null"
                [attr.aria-required]="required() || null"
                [attr.aria-invalid]="state() === 'error' || null"
                [style.text-align]="textAlign() || null"
                [class]="inputClass()"
                (input)="onInput(field.value)"
                (change)="commit()"
                (keydown)="onKeydown($event)"
                (wheel)="onWheel($event)"
            />
            @if (hasStepButtons() && !readonly()) {
                <button
                    fdButton
                    variant="transparent"
                    type="button"
                    tabindex="-1"
                    [class]="buttonClass"
                    [glyph]="incrementButtonIcon()"
                    [ariaLabel]="incrementLabel()"
                    [attr.title]="incrementLabel()"
                    [attr.aria-controls]="inputId()"
                    [disabled]="disabledState() || !canIncrement()"
                    (pointerdown)="startRepeat($event, 1)"
                    (mousedown)="$event.preventDefault()"
                    (click)="$event.detail === 0 && stepBy(1)"
                ></button>
            }
        </div>
        @if (unitText()) {
            <span
                [id]="inputId() + '-unit'"
                class="ms-2 font-sap-font-family text-sap-font-size text-sap-content-label-color"
                >{{ unitText() }}</span
            >
        }
    `
})
export class StepInput implements ControlValueAccessor {
    /** The number; null when empty. Two-way bindable. */
    readonly value = model<number | null | undefined>(null);
    readonly min = input<number | null | undefined, unknown>(undefined, { transform: optionalNumber });
    readonly max = input<number | null | undefined, unknown>(undefined, { transform: optionalNumber });
    readonly step = input(1, { transform: numberAttribute });
    readonly inputId = input(`fd-step-input-${nextId++}`);
    readonly name = input<string | null | undefined>();
    readonly placeholder = input<string | null | undefined>('');
    readonly inputTitle = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly ariaRoleDescription = input<string | null | undefined>('Step Input');
    readonly incrementLabel = input('Increase');
    readonly decrementLabel = input('Decrease');
    readonly incrementButtonIcon = input('add');
    readonly decrementButtonIcon = input('less');
    readonly hasStepButtons = input(true, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly readonly = input(false, { transform: booleanAttribute });
    readonly required = input(false, { transform: booleanAttribute });
    readonly state = input<FormState | null | undefined>();
    readonly isFullWidth = input(false, { transform: booleanAttribute });
    readonly textAlign = input<'left' | 'center' | 'right' | null | undefined>();
    /** The mouse wheel does not step the value. */
    readonly disableWheel = input(false, { transform: booleanAttribute });
    /** Locale of the number format; the app locale by default. */
    readonly locale = input<string | null | undefined>();
    readonly localeMatcher = input<'lookup' | 'best fit' | null | undefined>();
    readonly mode = input<'decimal' | 'currency'>('decimal');
    /** ISO currency code; its sign shows after the field. */
    readonly currency = input<string | null | undefined>();
    readonly currencyDisplay = input<'symbol' | 'narrowSymbol' | 'code' | 'name' | null | undefined>();
    /** A unit shown after the field, e.g. "kg". */
    readonly unit = input<string | null | undefined>();
    readonly useGrouping = input(true, { transform: booleanAttribute });
    readonly minFractionDigits = input<number | null | undefined, unknown>(undefined, { transform: optionalNumber });
    readonly maxFractionDigits = input<number | null | undefined, unknown>(undefined, { transform: optionalNumber });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly onFocusIn = output<void>();
    readonly onFocusOut = output<void>();

    private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly announcer = inject(LiveAnnouncer);
    private readonly appLocale = inject(LOCALE_ID);
    private repeatTimer: ReturnType<typeof setTimeout> | null = null;

    protected readonly disabledState = linkedSignal(() => this.disabled());
    private readonly lower = computed(() => this.min() ?? -Number.MAX_VALUE);
    private readonly upper = computed(() => this.max() ?? Number.MAX_VALUE);
    protected readonly canIncrement = computed(
        () => this.value() == null || this.value()! + this.step() <= this.upper()
    );
    protected readonly canDecrement = computed(
        () => this.value() == null || this.value()! - this.step() >= this.lower()
    );

    private readonly resolvedLocale = computed(() => this.locale() || this.appLocale);
    private readonly formatter = computed(() => {
        const min = this.minFractionDigits() ?? undefined;
        const max = this.maxFractionDigits() ?? undefined;
        return new Intl.NumberFormat(this.resolvedLocale(), {
            localeMatcher: this.localeMatcher() ?? undefined,
            style: this.mode() === 'currency' && this.currency() ? 'currency' : 'decimal',
            currency: this.currency() ?? undefined,
            currencyDisplay: this.currencyDisplay() ?? undefined,
            useGrouping: this.useGrouping(),
            minimumFractionDigits: min,
            maximumFractionDigits: max != null && min != null ? Math.max(min, max) : max
        });
    });
    /** The symbols of the locale, for parsing typed text. */
    private readonly symbols = computed(() => {
        const locale = this.resolvedLocale();
        const parts = new Intl.NumberFormat(locale, { useGrouping: true }).formatToParts(-12345.6);
        const digits = new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210).split('').reverse();
        let currencySign = '';
        if (this.currency()) {
            const currencyParts = new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: this.currency()!,
                currencyDisplay: this.currencyDisplay() ?? undefined
            }).formatToParts(1);
            currencySign = currencyParts.find((p) => p.type === 'currency')?.value ?? '';
        }
        return {
            group: parts.find((p) => p.type === 'group')?.value ?? ',',
            decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
            minus: parts.find((p) => p.type === 'minusSign')?.value ?? '-',
            digits,
            currencySign
        };
    });
    protected readonly unitText = computed(() => this.unit() || this.symbols().currencySign || '');

    constructor() {
        // show the formatted value whenever it changes from outside
        effect(() => {
            const value = this.value();
            const field = this.field().nativeElement;
            if (document.activeElement !== field || this.parse(field.value) !== value) field.value = this.format(value);
        });
        inject(DestroyRef).onDestroy(() => this.stopRepeat());
    }

    /** Formats a number for display (without the currency sign, which shows after the field). */
    format(value: number | null | undefined): string {
        if (value == null) return '';
        const parts = this.formatter().formatToParts(value);
        return parts
            .filter((p) => p.type !== 'currency')
            .map((p) => p.value)
            .join('')
            .trim();
    }

    increment(): void {
        this.stepBy(1);
    }

    decrement(): void {
        this.stepBy(-1);
    }

    // ControlValueAccessor
    private onChange: (value: number | null) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: number | null | undefined): void {
        this.value.set(value == null || isNaN(Number(value)) ? null : this.limit(Number(value)));
    }
    registerOnChange(fn: (value: number | null) => void): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
    setDisabledState(disabled: boolean): void {
        this.disabledState.set(disabled);
    }

    /** Steps the value by a number of steps; an empty value starts at the minimum (up) or maximum (down). */
    stepBy(steps: number): void {
        if (!this.canChange()) return;
        const current = this.value();
        let next: number;
        if (current == null) next = steps > 0 ? (this.min() ?? 0) : (this.max() ?? 0);
        else {
            next = addWithoutDistortion(current, this.step() * steps);
            if ((steps > 0 && next > this.upper()) || (steps < 0 && next < this.lower())) {
                if (Math.abs(steps) === 1) return;
            }
        }
        this.emit(this.limit(next));
    }

    protected onInput(text: string): void {
        const parsed = this.parse(text);
        if (parsed === INVALID) return;
        // the typed value applies on change (blur or Enter); keep the buttons in sync meanwhile
        this.pending = parsed;
    }

    protected commit(): void {
        const field = this.field().nativeElement;
        const parsed = this.parse(field.value);
        const value = parsed === INVALID ? (this.value() ?? null) : parsed == null ? null : this.limit(parsed);
        this.pending = undefined;
        if (value !== this.value()) this.emit(value);
        else field.value = this.format(value);
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (!this.canChange()) return;
        const keys: Record<string, () => void> = {
            ArrowUp: () => this.stepBy(1),
            ArrowDown: () => this.stepBy(-1),
            PageUp: () => this.stepBy(10),
            PageDown: () => this.stepBy(-10),
            Home: () => this.min() != null && this.emit(this.min()!),
            End: () => this.max() != null && this.emit(this.max()!),
            Enter: () => this.commit()
        };
        const action = keys[event.key];
        if (!action) return;
        if (event.key === 'Home' || event.key === 'End') {
            if ((event.key === 'Home' ? this.min() : this.max()) == null) return;
        }
        event.preventDefault();
        if (this.pending !== undefined && event.key !== 'Enter') this.commit();
        action();
    }

    protected onWheel(event: WheelEvent): void {
        if (this.disableWheel() || !this.canChange() || document.activeElement !== this.field().nativeElement) return;
        event.preventDefault();
        this.stepBy(event.deltaY > 0 ? -1 : 1);
    }

    /** A pressed button steps once, then repeats until released. */
    protected startRepeat(event: PointerEvent, steps: number): void {
        if (event.button !== 0 || !this.canChange()) return;
        event.preventDefault();
        this.field().nativeElement.focus();
        this.stepBy(steps);
        const repeat = () => {
            this.stepBy(steps);
            this.repeatTimer = setTimeout(repeat, REPEAT_INTERVAL);
        };
        this.repeatTimer = setTimeout(repeat, REPEAT_DELAY);
        const stop = () => {
            this.stopRepeat();
            window.removeEventListener('pointerup', stop);
            window.removeEventListener('pointercancel', stop);
        };
        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', stop);
    }

    protected onFocusout(event: FocusEvent): void {
        this.onFocusOut.emit();
        if (!this.elementRef.nativeElement.contains(event.relatedTarget as Node | null)) this.onTouched();
    }

    private pending: number | null | undefined = undefined;

    private stopRepeat(): void {
        if (this.repeatTimer) clearTimeout(this.repeatTimer);
        this.repeatTimer = null;
    }

    private canChange(): boolean {
        return !this.disabledState() && !this.readonly();
    }

    private emit(value: number | null): void {
        this.value.set(value);
        this.field().nativeElement.value = this.format(value);
        this.onChange(value);
        this.announcer.announce(this.format(value) + (this.unitText() ? ` ${this.unitText()}` : ''));
    }

    private limit(value: number): number {
        let result = Math.min(this.upper(), Math.max(this.lower(), value));
        const max = this.maxFractionDigits();
        if (max != null) result = Number(result.toFixed(max));
        return result;
    }

    /** Parses typed text in the locale format: null when empty, INVALID when not a number. */
    private parse(text: string): number | null | typeof INVALID {
        const { group, decimal, minus, digits, currencySign } = this.symbols();
        let clean = text.trim();
        if (!clean) return null;
        if (currencySign) clean = clean.split(currencySign).join('');
        clean = clean.replace(/\s/g, '').split(group).join('').split(minus).join('-').split(decimal).join('.');
        clean = clean.replace(/[^\d.-]/g, (ch) => {
            const index = digits.indexOf(ch);
            return index >= 0 ? `${index}` : ch;
        });
        if (!/^-?\d*\.?\d*$/.test(clean) || clean === '-' || clean === '.') return INVALID;
        return Number(clean);
    }

    protected readonly hostClass = computed(() =>
        cn('inline-flex max-w-full items-center', this.isFullWidth() && 'flex w-full', this.userClass())
    );

    protected readonly fieldClass = computed(() => {
        const state = this.state() ?? 'default';
        return cn(
            fieldBase,
            'flex w-auto items-center overflow-hidden p-0 compact:p-0',
            fieldStates[state],
            INPUT_GROUP_BUTTON_VARS,
            // focus frame around the whole field while the input has the focus
            'has-[input:focus]:[background:var(--sapField_Focus_Background)] has-[input:focus]:shadow-none',
            "after:pointer-events-none after:absolute after:inset-0 after:hidden after:content-[''] has-[input:focus]:after:block hc:after:inset-px",
            'after:rounded-sap-field-border-corner-radius after:border-(length:--sapContent_FocusWidth) after:[border-style:var(--sapContent_FocusStyle)]',
            STATE_FOCUS_COLOR[state],
            this.isFullWidth() && 'w-full',
            this.readonly() && [
                'shadow-none border-sap-field-read-only-border-color',
                '[background:var(--sapField_ReadOnly_BackgroundStyle)_var(--sapField_ReadOnly_Background)]',
                'hover:[background:var(--sapField_ReadOnly_BackgroundStyle)_var(--sapField_ReadOnly_Background)] hover:border-sap-field-read-only-border-color hover:shadow-none'
            ],
            this.disabledState() &&
                'pointer-events-none opacity-(--sapContent_DisabledOpacity) [&_:disabled]:opacity-100!'
        );
    });

    protected readonly inputClass = computed(() =>
        cn(
            'm-0 box-border h-full min-w-0 flex-1 appearance-none border-0 bg-transparent px-1 py-0 text-end rtl:text-start',
            'font-sap-font-family text-sap-font-size text-sap-field-text-color shadow-none outline-none',
            'placeholder:italic placeholder:text-sap-field-placeholder-text-color',
            (this.readonly() || !this.hasStepButtons()) && 'px-2.5 compact:px-2'
        )
    );

    protected readonly buttonClass =
        'shrink-0 w-9 min-w-9 compact:w-8 compact:min-w-8 rounded-sap-field-border-corner-radius focus:after:hidden';
}

function optionalNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const number = Number(value);
    return isNaN(number) ? undefined : number;
}

/** Adds without floating point noise, e.g. 0.1 + 0.2 = 0.3. */
function addWithoutDistortion(value: number, step: number): number {
    const decimals = (n: number) => (`${n}`.split('.')[1] ?? '').length;
    return Number((value + step).toFixed(Math.max(decimals(value), decimals(step))));
}
