import {
    inject,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    booleanAttribute,
    computed,
    effect,
    forwardRef,
    input,
    isDevMode,
    linkedSignal,
    numberAttribute,
    viewChild
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';

export type RadioState = 'success' | 'error' | 'warning' | 'information' | 'default';

/** Circle colours per value state: background, border width/style/colour, dot, hover background. */
const CIRCLE_STATE: Record<RadioState | 'readonly', string> = {
    default: [
        '[--rb-bg:var(--sapField_Background)] [--rb-bw:var(--sapField_BorderWidth)] [--rb-bs:var(--sapField_Selector_BorderStyle)]',
        '[--rb-bc:var(--sapField_BorderColor)] [--rb-dot:var(--sapContent_Selected_ForegroundColor)]',
        '[--rb-hover-bg:var(--sapContent_Selected_Hover_Background)] hc:[--rb-hover-bg:var(--sapSelectedColor)] [--rb-hover-bc:var(--sapField_Hover_BorderColor)]'
    ].join(' '),
    error: [
        '[--rb-bg:var(--sapField_InvalidBackground)] [--rb-bw:var(--sapField_InvalidBorderWidth)] [--rb-bs:var(--sapField_Selector_InvalidBorderStyle)]',
        '[--rb-bc:var(--sapField_InvalidColor)] [--rb-dot:var(--sapField_InvalidColor)] [--rb-hover-bc:var(--sapField_InvalidColor)]',
        '[--rb-hover-bg:var(--sapField_Hover_Background)] hc:[--rb-hover-bg:var(--sapField_InvalidBackground)]'
    ].join(' '),
    warning: [
        '[--rb-bg:var(--sapField_WarningBackground)] [--rb-bw:var(--sapField_WarningBorderWidth)] [--rb-bs:var(--sapField_Selector_WarningBorderStyle)]',
        '[--rb-bc:var(--sapField_WarningColor)] [--rb-dot:var(--sapField_WarningColor)] [--rb-hover-bc:var(--sapField_WarningColor)] [--rb-hover-bg:var(--sapField_Hover_Background)]'
    ].join(' '),
    success: [
        '[--rb-bg:var(--sapField_SuccessBackground)] [--rb-bw:var(--sapField_SuccessBorderWidth)] [--rb-bs:var(--sapField_Selector_SuccessBorderStyle)]',
        '[--rb-bc:var(--sapField_SuccessColor)] [--rb-dot:var(--sapField_SuccessColor)] [--rb-hover-bc:var(--sapField_SuccessColor)] [--rb-hover-bg:var(--sapField_Hover_Background)]'
    ].join(' '),
    information: [
        '[--rb-bg:var(--sapField_InformationBackground)] [--rb-bw:var(--sapField_InformationBorderWidth)] [--rb-bs:var(--sapField_Selector_InformationBorderStyle)]',
        '[--rb-bc:var(--sapField_InformationColor)] [--rb-dot:var(--sapField_InformationColor)] [--rb-hover-bc:var(--sapField_InformationColor)] [--rb-hover-bg:var(--sapField_Hover_Background)]'
    ].join(' '),
    readonly: [
        '[--rb-bg:var(--sapField_ReadOnly_Background)] [--rb-bw:var(--sapElement_BorderWidth)] [--rb-bs:var(--sapField_Selector_ReadOnly_BorderStyle)]',
        '[--rb-bc:var(--sapField_ReadOnly_BorderColor)] [--rb-dot:var(--sapField_TextColor)] [--rb-hover-bc:var(--sapField_ReadOnly_BorderColor)] [--rb-hover-bg:var(--sapField_ReadOnly_Background)]'
    ].join(' ')
};

let nextId = 0;

/**
 * Radio button. Group radio buttons with the same `name` and bind them to one model.
 *
 * ```html
 * <fd-radio-button name="size" value="s" [(ngModel)]="size">Small</fd-radio-button>
 * <fd-radio-button name="size" value="m" [(ngModel)]="size">Medium</fd-radio-button>
 * ```
 */
@Component({
    selector: 'fd-radio-button',
    exportAs: 'fdRadioButton',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RadioButton), multi: true }],
    host: {
        '[class]': 'hostClass()',
        '(focusout)': 'onTouched()'
    },
    template: `
        <input
            #input
            type="radio"
            class="peer absolute m-0 size-px opacity-[0.0001] appearance-none outline-none"
            [id]="id()"
            [attr.name]="name() || null"
            [disabled]="disabledState()"
            [attr.readonly]="readOnly() ? '' : null"
            [attr.value]="value()"
            [checked]="checked()"
            [attr.tabindex]="tabIndexState() ?? null"
            [attr.aria-label]="ariaLabel() || null"
            [attr.aria-labelledby]="ariaLabelledBy() || null"
            [attr.aria-describedby]="ariaDescribedBy() || null"
            [attr.aria-disabled]="disabledState() || null"
            [attr.aria-checked]="checked()"
            [attr.aria-required]="required() || null"
            [attr.aria-invalid]="state() === 'error' || null"
            [attr.aria-description]="readOnly() ? readOnlyDescription() : null"
            (change)="select()"
            (click)="onInputClick($event)"
        />
        <label [class]="labelClass()" [for]="id()" [attr.title]="title() || null" (click)="onLabelClick($event)">
            <span class="m-0 truncate p-0" [class.whitespace-normal]="wrapLabel()"><ng-content /></span>
        </label>
    `
})
export class RadioButton<T = unknown> implements ControlValueAccessor {
    readonly id = input(`fd-radio-${nextId++}`);
    /** Group name, shared by the radio buttons of one group. */
    readonly name = input<string | null | undefined>();
    /** Value of this option. */
    readonly value = input<T>();
    /** Value selected in the group, when not bound to a form. */
    readonly selectedValue = input<T | undefined>(undefined);
    readonly state = input<RadioState | null | undefined>('default');
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly readOnly = input(false, { transform: booleanAttribute });
    readonly required = input(false, { transform: booleanAttribute });
    /** Allows use without name and value, e.g. a lone radio inside a list item. */
    readonly standalone = input(false, { transform: booleanAttribute });
    readonly wrapLabel = input(false, { transform: booleanAttribute });
    readonly valignLabel = input<'top' | 'middle'>('middle');
    readonly tabIndex = input<number | undefined, unknown>(undefined, {
        transform: (v: unknown) => (v == null ? undefined : numberAttribute(v))
    });
    readonly title = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly ariaDescribedBy = input<string | null | undefined>();
    /** Announced for read-only radio buttons. */
    readonly readOnlyDescription = input('This radio button is read-only and cannot be changed.');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly currentValue = linkedSignal<T | undefined>(() => this.selectedValue());
    /** Writable tab index; parents such as list items take the radio out of the tab order. */
    readonly tabIndexState = linkedSignal<number | undefined>(() => this.tabIndex());
    protected readonly disabledState = linkedSignal(() => this.disabled());

    readonly checked = computed(() => this.value() !== undefined && this.currentValue() === this.value());

    protected readonly hostClass = computed(() => cn('relative inline-flex max-w-full', this.userClass()));

    protected readonly labelClass = computed(() => {
        const state = this.state() ?? 'default';
        const top = this.wrapLabel() && this.valignLabel() === 'top';
        return cn(
            'relative m-0 me-2 box-border flex w-fit max-w-full cursor-pointer items-center truncate',
            'p-(--rb-pad) [--rb-pad:0.6875rem] [--rb-size:1.375rem] [--rb-dot-size:0.75rem] [--rb-dot-start:1rem]',
            'compact:[--rb-pad:0.5rem] compact:[--rb-size:1rem] compact:[--rb-dot-size:0.5rem] compact:[--rb-dot-start:0.75rem]',
            'font-sap-font-family text-sap-font-size leading-4 text-sap-field-text-color',
            // the circle
            "before:inline-flex before:size-(--rb-size) before:shrink-0 before:content-[''] before:rounded-full before:me-(--rb-pad)",
            'before:bg-(--rb-bg) before:border-(length:--rb-bw) before:[border-style:var(--rb-bs)] before:border-(--rb-bc)',
            'hover:before:bg-(--rb-hover-bg) hover:before:border-(--rb-hover-bc)',
            // the dot
            this.checked() &&
                "after:absolute after:start-(--rb-dot-start) after:size-(--rb-dot-size) after:rounded-full after:bg-(--rb-dot) after:content-['']",
            top && 'items-start after:top-(--rb-dot-start)',
            this.wrapLabel() && 'whitespace-normal',
            'peer-focus:outline-sap peer-focus:outline-offset-[calc(0.25rem_-_var(--rb-pad))] peer-focus:rounded-[0.8rem] compact:peer-focus:rounded-[0.5rem]',
            CIRCLE_STATE[this.readOnly() ? 'readonly' : 'default'],
            !this.readOnly() && state !== 'default' && CIRCLE_STATE[state],
            this.disabledState() && 'pointer-events-none opacity-(--sapContent_DisabledOpacity)',
            this.readOnly() && 'cursor-default'
        );
    });

    protected onChange: (value: T | undefined) => void = () => {};
    protected onTouched: () => void = () => {};

    constructor() {
        if (isDevMode()) {
            effect(() => {
                if (this.standalone()) return;
                if (this.name() == null) console.warn('fd-radio-button: name is required unless standalone');
                if (this.value() === undefined) console.warn('fd-radio-button: value is required unless standalone');
            });
        }
    }

    writeValue(value: T): void {
        this.currentValue.set(value);
    }

    registerOnChange(fn: (value: T | undefined) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
        this.disabledState.set(disabled);
    }

    focus(): void {
        this.inputRef().nativeElement.focus();
    }

    /** Selects this option. */
    select(): void {
        if (this.readOnly() || this.disabledState()) return;
        this.currentValue.set(this.value());
        this.onChange(this.value());
    }

    protected onInputClick(event: MouseEvent): void {
        if (this.readOnly()) event.preventDefault();
    }

    protected onLabelClick(event: MouseEvent): void {
        event.stopPropagation();
        if (this.readOnly()) {
            event.preventDefault();
            this.focus();
        }
    }
}
