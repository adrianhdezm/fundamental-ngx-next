/*
 * Port of @fundamental-ngx/core (checkbox) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostAttributeToken,
    afterNextRender,
    booleanAttribute,
    computed,
    forwardRef,
    inject,
    input,
    linkedSignal,
    output,
    signal,
    viewChild
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';

export type CheckboxState = 'checked' | 'unchecked' | 'indeterminate';
export type FormState = 'success' | 'error' | 'warning' | 'information' | 'default';

/** Values written to the model for each state. */
export interface CheckboxValues {
    trueValue?: unknown;
    falseValue?: unknown;
    thirdStateValue?: unknown;
}

export const CHECKBOX_DEFAULT_VALUES: Readonly<Required<CheckboxValues>> = {
    trueValue: true,
    falseValue: false,
    thirdStateValue: null
};

/** Same value, or objects/arrays with the same own keys and values. */
function shallowEqual(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return (
        ka.length === kb.length &&
        ka.every((k) => Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
    );
}

/** Colours of the check box square per value state: background, border width/style/colour, mark, hover background. */
const BOX_STATE: Record<FormState | 'readonly', string> = {
    default: [
        '[--cb-bg:var(--sapField_Background)] [--cb-bw:var(--sapField_BorderWidth)] [--cb-bs:var(--sapField_Selector_BorderStyle)]',
        '[--cb-bc:var(--sapField_BorderColor)] [--cb-mark:var(--sapContent_Selected_ForegroundColor)]',
        '[--cb-hover-bg:var(--sapContent_Selected_Hover_Background)] hc:[--cb-hover-bg:var(--sapSelectedColor)] [--cb-hover-bc:var(--sapField_Hover_BorderColor)]'
    ].join(' '),
    error: [
        '[--cb-bg:var(--sapField_InvalidBackground)] [--cb-bw:var(--sapField_InvalidBorderWidth)] [--cb-bs:var(--sapField_Selector_InvalidBorderStyle)]',
        '[--cb-bc:var(--sapField_InvalidColor)] [--cb-mark:var(--sapField_InvalidColor)] [--cb-hover-bc:var(--sapField_InvalidColor)]',
        '[--cb-hover-bg:var(--sapField_Hover_Background)] hc:[--cb-hover-bg:var(--sapField_InvalidBackground)]'
    ].join(' '),
    warning: [
        '[--cb-bg:var(--sapField_WarningBackground)] [--cb-bw:var(--sapField_WarningBorderWidth)] [--cb-bs:var(--sapField_Selector_WarningBorderStyle)]',
        '[--cb-bc:var(--sapField_WarningColor)] [--cb-mark:var(--sapField_WarningColor)] [--cb-hover-bc:var(--sapField_WarningColor)] [--cb-hover-bg:var(--sapField_Hover_Background)]'
    ].join(' '),
    success: [
        '[--cb-bg:var(--sapField_SuccessBackground)] [--cb-bw:var(--sapField_SuccessBorderWidth)] [--cb-bs:var(--sapField_Selector_SuccessBorderStyle)]',
        '[--cb-bc:var(--sapField_SuccessColor)] [--cb-mark:var(--sapField_SuccessColor)] [--cb-hover-bc:var(--sapField_SuccessColor)] [--cb-hover-bg:var(--sapField_Hover_Background)]'
    ].join(' '),
    information: [
        '[--cb-bg:var(--sapField_InformationBackground)] [--cb-bw:var(--sapField_InformationBorderWidth)] [--cb-bs:var(--sapField_Selector_InformationBorderStyle)]',
        '[--cb-bc:var(--sapField_InformationColor)] [--cb-mark:var(--sapField_InformationColor)] [--cb-hover-bc:var(--sapField_InformationColor)] [--cb-hover-bg:var(--sapField_Hover_Background)]'
    ].join(' '),
    readonly: [
        '[--cb-bg:var(--sapField_ReadOnly_Background)] [--cb-bw:var(--sapElement_BorderWidth)] [--cb-bs:var(--sapField_Selector_ReadOnly_BorderStyle)]',
        '[--cb-bc:var(--sapField_ReadOnly_BorderColor)] [--cb-mark:var(--sapField_TextColor)] [--cb-hover-bc:var(--sapField_ReadOnly_BorderColor)] [--cb-hover-bg:var(--sapField_ReadOnly_Background)]'
    ].join(' ')
};

const GLYPH = {
    check: '',
    displayUnchecked: '',
    displayChecked: '',
    displayIndeterminate: ''
};

let nextId = 0;

/**
 * Checkbox with a label, value states, read-only and display modes and an optional third state.
 * Works with template-driven and reactive forms.
 *
 * ```html
 * <fd-checkbox label="Accept terms" [(ngModel)]="accepted" />
 * <fd-checkbox label="Select all" tristate [(ngModel)]="all" />
 * ```
 */
@Component({
    selector: 'fd-checkbox',
    exportAs: 'fdCheckbox',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Checkbox), multi: true }],
    host: {
        '[class]': 'hostClass()',
        tabindex: '-1'
    },
    template: `
        <input
            #input
            type="checkbox"
            [class]="inputClass"
            [id]="inputId()"
            [attr.name]="name() || null"
            [disabled]="disabledState() || displayOnly()"
            [readOnly]="readonlyState()"
            [indeterminate]="checkState() === 'indeterminate'"
            [checked]="checkState() === 'checked'"
            [attr.tabindex]="tabIndexValue()"
            [attr.role]="role()"
            [attr.aria-checked]="
                checkState() === 'checked' ? 'true' : checkState() === 'indeterminate' ? 'mixed' : 'false'
            "
            [attr.aria-label]="ariaLabel() || null"
            [attr.aria-labelledby]="ariaLabelledBy() || null"
            [attr.aria-describedby]="ariaDescribedBy() || null"
            [attr.aria-disabled]="disabledState() || null"
            [attr.aria-readonly]="readonlyState() || null"
            [attr.aria-required]="required() || null"
            [attr.aria-invalid]="stateValue() === 'error' || null"
            (click)="onInputClick($event)"
            (blur)="onBlur()"
            (focus)="focusChange.emit(true)"
            (keyup.enter)="onReadonlyKey($event)"
            (keyup.space)="onReadonlyKey($event)"
        />
        <label
            [class]="labelCls()"
            [for]="inputId()"
            [attr.title]="title() || null"
            (click)="onLabelClick($event)"
            (keyup.enter)="onReadonlyKey($event)"
            (keyup.space)="onReadonlyKey($event)"
        >
            <span aria-hidden="true" [class]="boxClass()" [attr.data-glyph]="glyph()"></span>
            <span [class]="containerClass()" [class.hidden]="!label() && !hasContent()">
                <span [class]="textClass()">
                    @if (label()) {
                        {{ label() }}
                    }
                    <span #projected [class.hidden]="!!label()"><ng-content /></span>
                </span>
            </span>
        </label>
    `
})
export class Checkbox implements ControlValueAccessor {
    readonly inputId = input(`fd-checkbox-${nextId++}`);
    readonly label = input<string | null | undefined>();
    readonly name = input<string | null | undefined>();
    readonly title = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly ariaDescribedBy = input<string | null | undefined>();
    readonly role = input('checkbox');
    /** Value state: success, error, warning or information. */
    readonly state = input<FormState | null | undefined>();
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly readonly = input(false, { transform: booleanAttribute });
    /** Shows the value as an icon without the interactive box. */
    readonly displayOnly = input(false, { transform: booleanAttribute });
    readonly required = input(false, { transform: booleanAttribute });
    /** Allows the indeterminate (third) state. */
    readonly tristate = input(false, { transform: booleanAttribute });
    /** Lets users select the third state by clicking. */
    readonly tristateSelectable = input(false, { transform: booleanAttribute });
    /** Model values for checked, unchecked and indeterminate. */
    readonly values = input<CheckboxValues | null | undefined>();
    /** Lets long labels wrap. */
    readonly wrapLabel = input(false, { transform: booleanAttribute });
    /** Vertical alignment of a wrapped label. */
    readonly valignLabel = input<'top' | 'middle'>('middle');
    /** Without label padding, e.g. inside tables. */
    readonly standalone = input(false, { transform: booleanAttribute });
    readonly labelClass = input<ClassValue>('');
    /** Initial value when not bound to a form. */
    readonly value = input<unknown>(undefined);
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly focusChange = output<boolean>();
    /** Emits the new model value. */
    readonly valueChange = output<unknown>();

    /** Tab index of the native input; parents such as list items take it out of the tab order. */
    readonly tabIndexValue = signal(Number(inject(new HostAttributeToken('tabIndexValue'), { optional: true }) ?? 0));
    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');
    private readonly projected = viewChild<ElementRef<HTMLElement>>('projected');

    readonly checkboxValue = linkedSignal<unknown>(() => this.value());
    protected readonly disabledState = linkedSignal(() => this.disabled());
    protected readonly readonlyState = linkedSignal(() => this.readonly());
    protected readonly stateValue = linkedSignal(() => this.state() ?? 'default');
    protected readonly hasContent = signal(false);

    private readonly resolvedValues = computed(() => ({ ...CHECKBOX_DEFAULT_VALUES, ...(this.values() ?? {}) }));

    readonly checkState = computed<CheckboxState>(() => {
        const value = this.checkboxValue();
        const v = this.resolvedValues();
        if (shallowEqual(value, v.trueValue)) return 'checked';
        if (shallowEqual(value, v.falseValue)) return 'unchecked';
        if (this.tristate() && shallowEqual(value, v.thirdStateValue)) return 'indeterminate';
        return 'unchecked';
    });

    protected readonly inputClass =
        'peer absolute m-0 size-px opacity-[0.0001] appearance-none outline-none [forced-color-adjust:none]';

    protected readonly hostClass = computed(() => cn('relative inline-flex max-w-full outline-none', this.userClass()));

    protected readonly glyph = computed(() => {
        const s = this.checkState();
        if (this.displayOnly()) {
            return s === 'checked'
                ? GLYPH.displayChecked
                : s === 'indeterminate'
                  ? GLYPH.displayIndeterminate
                  : GLYPH.displayUnchecked;
        }
        return s === 'checked' ? GLYPH.check : null;
    });

    protected readonly labelCls = computed(() => {
        const wrap = this.wrapLabel();
        return cn(
            'group/cb relative m-0 box-border flex max-w-full w-fit cursor-pointer select-none items-center gap-(--cb-pad)',
            'p-(--cb-pad) [--cb-pad:0.6875rem] [--cb-size:1.375rem] compact:[--cb-pad:0.5rem] compact:[--cb-size:1rem]',
            'font-sap-font-family text-sap-font-size leading-4 text-sap-content-label-color truncate',
            // focus indicator around the label
            'peer-focus:outline-sap peer-focus:outline-offset-[calc(0.25rem_-_var(--cb-pad))] peer-focus:rounded-[0.8rem] compact:peer-focus:rounded-[0.5rem]',
            'hc:peer-focus:outline-offset-0 hc:peer-focus:rounded-none',
            BOX_STATE[this.readonlyState() ? 'readonly' : 'default'],
            !this.readonlyState() && this.stateValue() !== 'default' && BOX_STATE[this.stateValue()],
            this.disabledState() && !this.displayOnly() && 'pointer-events-none opacity-(--sapContent_DisabledOpacity)',
            this.readonlyState() && 'pointer-events-none cursor-pointer',
            this.displayOnly() && 'gap-2 [--cb-mark:var(--sapTextColor)]',
            this.standalone() && 'm-0',
            wrap && this.valignLabel() === 'top' && 'items-start',
            this.labelClass()
        );
    });

    protected readonly boxClass = computed(() => {
        const display = this.displayOnly();
        return cn(
            'relative m-0 box-border inline-flex size-(--cb-size) min-w-(--cb-size) items-center justify-center',
            'font-sap-content-icon-font-family text-sap-font-size leading-[normal] text-(--cb-mark)',
            'before:content-[attr(data-glyph)] rounded-sap-field-border-corner-radius',
            display
                ? 'size-4 min-w-4 bg-transparent border-0 text-[1rem]'
                : [
                      'bg-(--cb-bg) border-(length:--cb-bw) [border-style:var(--cb-bs)] border-(--cb-bc)',
                      'group-hover/cb:bg-(--cb-hover-bg) group-hover/cb:border-(--cb-hover-bc)',
                      this.checkState() === 'indeterminate' &&
                          "after:absolute after:content-[''] after:size-3 compact:after:size-2 after:bg-(--cb-mark)"
                  ]
        );
    });

    protected readonly containerClass = computed(() =>
        cn('m-0 flex h-4 max-w-[inherit] items-center truncate p-0', this.wrapLabel() && 'h-auto whitespace-normal')
    );

    protected readonly textClass = computed(() =>
        cn(
            'm-0 max-w-[inherit] truncate p-0 empty:m-0',
            this.wrapLabel() && 'whitespace-normal',
            this.required() &&
                "relative pe-2 after:absolute after:ps-0.5 after:text-sap-font-size after:font-bold after:text-sap-field-required-color after:content-['*'_/_'']"
        )
    );

    private onChange: (value: unknown) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        afterNextRender(() => this.hasContent.set(!!this.projected()?.nativeElement.textContent?.trim()));
    }

    writeValue(value: unknown): void {
        this.checkboxValue.set(value);
    }

    registerOnChange(fn: (value: unknown) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
        this.disabledState.set(disabled);
    }

    /** Moves to the next state: unchecked -> checked (or indeterminate when selectable) -> unchecked. */
    nextValue(): void {
        const v = this.resolvedValues();
        switch (this.checkState()) {
            case 'checked':
                this.checkboxValue.set(v.falseValue);
                break;
            case 'indeterminate':
                this.checkboxValue.set(v.trueValue);
                break;
            default:
                this.checkboxValue.set(this.tristate() && this.tristateSelectable() ? v.thirdStateValue : v.trueValue);
        }
        const input = this.inputRef().nativeElement;
        input.checked = this.checkState() === 'checked';
        input.indeterminate = this.checkState() === 'indeterminate';
        this.onChange(this.checkboxValue());
        this.valueChange.emit(this.checkboxValue());
    }

    focus(): void {
        this.inputRef().nativeElement.focus();
    }

    protected onInputClick(event: MouseEvent): void {
        event.stopPropagation();
        if (this.displayOnly() || this.readonlyState()) {
            event.preventDefault();
            return;
        }
        this.nextValue();
        // re-dispatch on the host, so (click) on <fd-checkbox> fires once
        this.elementRef.nativeElement.dispatchEvent(new MouseEvent(event.type, event));
    }

    protected onLabelClick(event: MouseEvent): void {
        event.stopPropagation();
        this.onReadonlyKey(event);
    }

    /** Read-only and display-only checkboxes keep their value; read-only stays focusable. */
    protected onReadonlyKey(event: Event): void {
        if (!this.displayOnly() && !this.readonlyState()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (this.readonlyState()) this.inputRef().nativeElement.focus();
    }

    protected onBlur(): void {
        this.onTouched();
        this.focusChange.emit(false);
    }
}
