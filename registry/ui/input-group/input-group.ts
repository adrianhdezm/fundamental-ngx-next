/*
 * Port of @fundamental-ngx/core (input-group) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    ElementRef,
    booleanAttribute,
    computed,
    contentChild,
    forwardRef,
    inject,
    input,
    linkedSignal,
    model,
    output,
    viewChild
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';
import { Icon, type IconFont } from '@/ui/icon/icon';
import { fieldBase, fieldStates, type FormState } from '@/ui/input/input';

export type InputGroupPlacement = 'before' | 'after';

/** Text colour and shadow of an addon button while the group has the focus, per value state. */
export const STATE_BUTTON_VARS: Record<FormState, string> = {
    default: '',
    success:
        '[--igBtnFocusColor:var(--sapButton_Accept_Selected_TextColor)] [--igBtnShadow:var(--sapContent_Positive_Shadow)]',
    error: '[--igBtnFocusColor:var(--sapButton_Reject_Selected_TextColor)] [--igBtnShadow:var(--sapContent_Negative_Shadow)]',
    warning:
        '[--igBtnFocusColor:var(--sapButton_Attention_Selected_TextColor)] [--igBtnShadow:var(--sapContent_Critical_Shadow)]',
    information:
        '[--igBtnFocusColor:var(--sapButton_Selected_TextColor)] [--igBtnShadow:var(--sapContent_Informative_Shadow)]'
};

/**
 * Gives transparent `fdButton`s inside an element the look of field buttons: no border, the field
 * corner radius, a hover shadow and a selected icon colour while pressed.
 */
export const INPUT_GROUP_BUTTON_VARS = [
    '[--sapButton_Lite_Background:transparent] [--sapButton_Lite_Hover_Background:transparent] [--sapButton_Lite_Active_Background:transparent]',
    '[--sapButton_Lite_BorderColor:transparent] [--sapButton_Lite_Hover_BorderColor:transparent] [--sapButton_Lite_Active_BorderColor:transparent]',
    '[--sapButton_Lite_TextColor:var(--sapField_TextColor)] [--sapButton_Lite_Hover_TextColor:var(--sapField_TextColor)]',
    '[--sapButton_Active_TextColor:var(--igBtnFocusColor,var(--sapButton_Selected_TextColor))]',
    '[--sapButton_BorderCornerRadius:var(--sapField_BorderCornerRadius)]',
    '[&_button:hover:not(:disabled)]:shadow-(--igBtnShadow,var(--sapField_Hover_Shadow)) [&_button:active]:shadow-(--igBtnShadow,var(--sapField_Hover_Shadow))'
].join(' ');

/** Colour of the focus frame per value state. */
export const STATE_FOCUS_COLOR: Record<FormState, string> = {
    default: 'after:border-sap-field-active-border-color',
    success: 'after:border-sap-field-success-color',
    error: 'after:border-sap-field-invalid-color',
    warning: 'after:border-sap-field-warning-color',
    information: 'after:border-sap-field-information-color'
};

let nextId = 0;

/**
 * A field with an input and text, icon or button addons before or after it. Without a projected
 * `[fdInputGroupInput]` the group renders its own input and is a form control.
 *
 * ```html
 * <fd-input-group addOnText="$" placement="before" placeholder="Amount" [(ngModel)]="amount" />
 * <fd-input-group glyph="decline" button glyphAriaLabel="Clear" (addOnButtonClicked)="clear()" />
 *
 * <fd-input-group>
 *     <input fdInputGroupInput aria-label="Date" />
 *     <span fdInputGroupAddon button><button fdButton variant="transparent" glyph="calendar" ariaLabel="Calendar"></button></span>
 * </fd-input-group>
 * ```
 */
@Component({
    selector: 'fd-input-group',
    exportAs: 'fdInputGroup',
    imports: [NgTemplateOutlet, Button, Icon, forwardRef(() => InputGroupInput), forwardRef(() => InputGroupAddon)],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputGroup), multi: true }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[attr.data-disabled]': 'disabledState() || null',
        '[attr.data-readonly]': 'readonly() || null',
        '(focusout)': 'onFocusout($event)'
    },
    template: `
        @if (placement() === 'after' && !projectedInput()) {
            <ng-container [ngTemplateOutlet]="inputTpl" />
        }
        <ng-content />
        @if (!projectedAddon() && (glyph() || addOnText())) {
            @if (button()) {
                <span fdInputGroupAddon button>
                    <button
                        fdButton
                        variant="transparent"
                        type="button"
                        [id]="addOnButtonId"
                        [glyph]="glyph()"
                        [glyphFont]="glyphFont()"
                        [label]="glyph() ? null : addOnText()"
                        [ariaLabel]="glyphAriaLabel() || (glyph() ? glyph() : null)"
                        [disabled]="disabledState()"
                        [class]="isExpanded() ? 'text-(--igBtnFocusColor,var(--sapButton_Selected_TextColor))' : ''"
                        [tabindex]="buttonFocusable() ? null : -1"
                        [attr.aria-hidden]="addonButtonAriaHidden() || null"
                        [attr.aria-haspopup]="isControl() || null"
                        [attr.aria-expanded]="isControl() ? isExpanded() : null"
                        [attr.aria-controls]="projectedInput() ? null : inputId()"
                        [attr.title]="iconTitle() || null"
                        (mousedown)="onButtonMousedown($event)"
                        (click)="addOnButtonClicked.emit($event)"
                    ></button>
                </span>
            } @else {
                <span fdInputGroupAddon [id]="addOnId">
                    @if (glyph()) {
                        <fd-icon
                            [glyph]="glyph()!"
                            [font]="glyphFont()"
                            [ariaLabel]="glyphAriaLabel() || glyph()"
                            [attr.title]="iconTitle() || null"
                        />
                    } @else {
                        {{ addOnText() }}
                    }
                </span>
            }
        }
        @if (placement() === 'before' && !projectedInput()) {
            <ng-container [ngTemplateOutlet]="inputTpl" />
        }

        <ng-template #inputTpl>
            <input
                #field
                fdInputGroupInput
                [id]="inputId()"
                [type]="type()"
                [value]="value() ?? ''"
                [disabled]="disabledState()"
                [readOnly]="readonly()"
                [attr.name]="name() || null"
                [attr.placeholder]="placeholder() || null"
                [attr.aria-label]="ariaLabel() || null"
                [attr.aria-labelledby]="ariaLabel() ? null : ariaLabelledBy() || null"
                [attr.aria-describedby]="describedBy()"
                [attr.aria-required]="required() || null"
                [attr.aria-invalid]="state() === 'error' || null"
                (input)="onInput(field)"
                (search)="search.emit($event)"
            />
        </ng-template>
    `
})
export class InputGroup implements ControlValueAccessor {
    /** Where the generated addon goes. */
    readonly placement = input<InputGroupPlacement>('after');
    /** Text of the addon, e.g. a currency, or of the addon button. */
    readonly addOnText = input<string | null | undefined>();
    /** Icon of the addon. */
    readonly glyph = input<string | null | undefined>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    /** Accessible name of the addon icon or button. */
    readonly glyphAriaLabel = input<string | null | undefined>();
    readonly iconTitle = input<string | null | undefined>();
    /** The addon is a button; it emits `addOnButtonClicked`. */
    readonly button = input(false, { transform: booleanAttribute });
    /** The addon button is in the tab order; otherwise clicks on it keep the focus in the input. */
    readonly buttonFocusable = input(true, { transform: booleanAttribute });
    readonly addonButtonAriaHidden = input(false, { transform: booleanAttribute });
    /** The group controls a popup (combobox, date picker): the button gets `aria-haspopup` and `aria-expanded`. */
    readonly isControl = input(false, { transform: booleanAttribute });
    readonly isExpanded = input(false, { transform: booleanAttribute });
    /** Shows the focus frame while the input has the focus. */
    readonly showFocus = input(true, { transform: booleanAttribute });
    /** Takes the width of its content instead of the full width. */
    readonly inline = input(false, { transform: booleanAttribute });

    readonly inputId = input(`fd-input-group-input-${nextId++}`);
    readonly type = input('text');
    readonly placeholder = input<string | null | undefined>();
    readonly name = input<string | null | undefined>();
    readonly state = input<FormState | null | undefined>();
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly readonly = input(false, { transform: booleanAttribute });
    readonly required = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly ariaDescribedBy = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    /** Value of the generated input; numbers for `type="number"`. */
    readonly value = model<string | number | null | undefined>('');

    readonly addOnButtonClicked = output<Event>();
    /** The `search` event of a `type="search"` input. */
    readonly search = output<Event>();

    protected readonly projectedInput = contentChild(forwardRef(() => InputGroupInput));
    protected readonly projectedAddon = contentChild(forwardRef(() => InputGroupAddon));
    private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    protected readonly addOnId = `fd-input-group-addon-${nextId}`;
    protected readonly addOnButtonId = `fd-input-group-button-${nextId}`;

    protected readonly disabledState = linkedSignal(() => this.disabled());

    /** The text or icon addon describes the input, e.g. "$". */
    protected readonly describedBy = computed(
        () =>
            [this.ariaDescribedBy(), !this.button() && (this.glyph() || this.addOnText()) && this.addOnId]
                .filter(Boolean)
                .join(' ') || null
    );

    protected readonly computedClass = computed(() => {
        const state = this.state() ?? 'default';
        return cn(
            fieldBase,
            'group/ig flex overflow-hidden p-0 compact:p-0 cursor-text',
            fieldStates[state],
            STATE_BUTTON_VARS[state],
            this.showFocus() && [
                'has-[:is(input,textarea):focus]:[background:var(--sapField_Focus_Background)] has-[:is(input,textarea):focus]:hover:[background:var(--sapField_Focus_Background)]',
                'has-[:is(input,textarea):focus]:shadow-none has-[:is(input,textarea):focus]:hover:shadow-none',
                'after:pointer-events-none after:absolute after:inset-0 hc:after:inset-px after:hidden has-[:is(input,textarea):focus]:after:block',
                'after:rounded-sap-field-border-corner-radius after:border-(length:--sapContent_FocusWidth) after:[border-style:var(--sapContent_FocusStyle)]',
                STATE_FOCUS_COLOR[state]
            ],
            this.inline() && 'inline-flex w-auto align-bottom',
            this.readonly() && [
                'overflow-visible shadow-none border-sap-field-read-only-border-color',
                '[background:var(--sapField_ReadOnly_BackgroundStyle)_var(--sapField_ReadOnly_Background)]',
                'hover:[background:var(--sapField_ReadOnly_BackgroundStyle)_var(--sapField_ReadOnly_Background)] hover:border-sap-field-read-only-border-color hover:shadow-none'
            ],
            // the group is dimmed, so its disabled parts are not dimmed again
            this.disabledState() &&
                'pointer-events-none opacity-(--sapContent_DisabledOpacity) [&_:disabled]:opacity-100! [&_[aria-disabled=true]]:opacity-100!',
            this.userClass()
        );
    });

    private onChange: (value: string | number | null) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: string | number | null | undefined): void {
        this.value.set(value ?? '');
    }

    registerOnChange(fn: (value: string | number | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
        this.disabledState.set(disabled);
    }

    /** Focuses the input. */
    focus(): void {
        (this.projectedInput()?.elementRef ?? this.field())?.nativeElement.focus();
    }

    protected onInput(field: HTMLInputElement): void {
        const value = this.type() === 'number' ? (field.value === '' ? null : field.valueAsNumber) : field.value;
        this.value.set(value);
        this.onChange(value);
    }

    protected onFocusout(event: FocusEvent): void {
        if (!this.elementRef.nativeElement.contains(event.relatedTarget as Node | null)) this.onTouched();
    }

    protected onButtonMousedown(event: MouseEvent): void {
        if (!this.buttonFocusable()) event.preventDefault();
    }
}

/** The input of an input group. */
@Directive({
    selector: '[fdInputGroupInput], [fd-input-group-input]',
    exportAs: 'fdInputGroupInput',
    host: { '[class]': 'computedClass()' }
})
export class InputGroupInput {
    readonly elementRef = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'relative z-[1] m-0 box-border h-full min-h-0 w-full min-w-0 flex-[1_1_10rem] appearance-none self-stretch truncate border-0 bg-transparent px-1 py-0 first:ps-2.5 last:pe-2.5',
            'font-sap-font-family text-sap-font-size leading-[normal] font-normal text-sap-field-text-color shadow-none outline-none',
            'placeholder:italic placeholder:text-sap-field-placeholder-text-color hc:placeholder:not-italic rtl:placeholder:indent-[0.125rem]',
            'selection:bg-sap-selected-color selection:text-sap-content-contrast-text-color',
            'disabled:placeholder:opacity-0 readonly:placeholder:opacity-0',
            '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
            'autofill:bg-clip-text',
            this.userClass()
        )
    );
}

/**
 * An addon of an input group: text, an icon, or with `button` a button. A transparent `fdButton`
 * inside a button addon takes the look of a field button.
 */
@Directive({
    selector: '[fdInputGroupAddon], [fd-input-group-addon]',
    exportAs: 'fdInputGroupAddon',
    host: { '[class]': 'computedClass()' }
})
export class InputGroupAddon {
    /** Kept for compatibility; the addon goes where it is in the template. */
    readonly placement = input<InputGroupPlacement>('after');
    readonly button = input(false, { transform: booleanAttribute });
    /** `textarea` stretches the button to the height of a text area. */
    readonly type = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex min-h-full min-w-9 shrink-0 items-center justify-center truncate px-2.5 py-0 compact:min-w-8',
            'font-sap-font-family text-sap-font-large-size text-sap-content-non-interactive-icon-color',
            this.button() && [
                'overflow-visible p-0',
                INPUT_GROUP_BUTTON_VARS,
                'group-has-[:is(input,textarea):focus]/ig:[--sapButton_Lite_TextColor:var(--igBtnFocusColor,var(--sapField_TextColor))]',
                'group-has-[:is(input,textarea):focus]/ig:[&_button]:shadow-(--igBtnShadow,none)'
            ],
            this.type() === 'textarea' && '[&>*]:h-full [&>*]:max-h-full',
            this.userClass()
        )
    );
}
