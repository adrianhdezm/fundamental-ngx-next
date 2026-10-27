/*
 * Port of @fundamental-ngx/core (form) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Directive, ElementRef, computed, inject, input } from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

export type FormState = 'success' | 'error' | 'warning' | 'information' | 'default';

/**
 * Field styles shared by inputs, textareas and other field-like controls (select, combobox, ...).
 * The background shorthand carries the SAP bottom border line, so style and colour go together.
 */
export const fieldBase = [
    'relative z-[1] box-border m-0 my-1 w-full min-w-11 h-sap-element-height min-h-sap-element-height px-2.5 py-0',
    'compact:my-[0.1875rem] compact:min-w-8 compact:h-sap-element-compact-height compact:min-h-sap-element-compact-height compact:px-2',
    'font-sap-font-family text-sap-font-size font-normal leading-[normal] text-sap-field-text-color truncate',
    'rounded-sap-field-border-corner-radius shadow-sap-field-shadow outline-none appearance-none cursor-text [forced-color-adjust:none]',
    'border-width-sap-field-border-width [border-style:var(--sapField_BorderStyle)] border-sap-field-border-color',
    '[background:var(--sapField_BackgroundStyle)_var(--sapField_Background)]',
    'placeholder:italic placeholder:text-sap-field-placeholder-text-color hc:placeholder:not-italic rtl:placeholder:indent-[0.125rem]',
    'selection:bg-sap-selected-color selection:text-sap-content-contrast-text-color',
    'hover:[background:var(--sapField_Hover_BackgroundStyle)_var(--sapField_Hover_Background)] hover:border-sap-field-hover-border-color hover:shadow-sap-field-hover-shadow',
    'focus:z-[5] focus:[background:var(--sapField_Focus_Background)] focus:shadow-none focus:outline-sap focus:outline-sap-field-active-border-color',
    'focus:outline-offset-[-0.125rem] hc:focus:outline-offset-[-0.25rem]',
    'aria-expanded:z-[4]',
    'disabled:pointer-events-none disabled:opacity-(--sapContent_DisabledOpacity) disabled:placeholder:opacity-0',
    'aria-disabled:pointer-events-none aria-disabled:opacity-(--sapContent_DisabledOpacity) aria-disabled:placeholder:opacity-0',
    'readonly:shadow-none readonly:border-sap-field-read-only-border-color readonly:placeholder:opacity-0',
    'readonly:[background:var(--sapField_ReadOnly_BackgroundStyle)_var(--sapField_ReadOnly_Background)]',
    'readonly:hover:shadow-none readonly:hover:border-sap-field-read-only-border-color',
    'readonly:hover:[background:var(--sapField_ReadOnly_BackgroundStyle)_var(--sapField_ReadOnly_Background)]',
    'readonly:focus:[background:var(--sapField_ReadOnly_BackgroundStyle)_var(--sapField_ReadOnly_Background)] readonly:focus:outline-offset-[-0.25rem]'
].join(' ');

/** Value state styles of fields. Error, warning and success in high contrast use italic bold text. */
export const fieldStates: Record<FormState, string> = {
    default: '',
    error: [
        '[background:var(--sapField_InvalidBackgroundStyle)_var(--sapField_InvalidBackground)] shadow-sap-field-invalid-shadow',
        'border-sap-field-invalid-color border-width-sap-field-invalid-border-width [border-style:var(--sapField_InvalidBorderStyle)]',
        'hover:[background:var(--sapField_InvalidBackgroundStyle)_var(--sapField_Hover_Background)] hover:border-sap-field-invalid-color hover:shadow-sap-field-invalid-shadow',
        'focus:[background:var(--sapField_Focus_Background)] focus:outline-sap-field-invalid-color focus:shadow-sap-field-invalid-shadow focus:hover:shadow-none',
        'placeholder:text-sap-field-text-color hc:italic hc:font-bold hc:placeholder:font-bold'
    ].join(' '),
    warning: [
        '[background:var(--sapField_WarningBackgroundStyle)_var(--sapField_WarningBackground)] shadow-sap-field-warning-shadow',
        'border-sap-field-warning-color border-width-sap-field-warning-border-width [border-style:var(--sapField_WarningBorderStyle)]',
        'hover:[background:var(--sapField_WarningBackgroundStyle)_var(--sapField_Hover_Background)] hover:border-sap-field-warning-color hover:shadow-sap-content-critical-shadow',
        'focus:[background:var(--sapField_Focus_Background)] focus:outline-sap-field-warning-color focus:shadow-sap-field-warning-shadow focus:hover:shadow-none',
        'hc:italic hc:font-bold hc:placeholder:font-bold'
    ].join(' '),
    success: [
        '[background:var(--sapField_SuccessBackgroundStyle)_var(--sapField_SuccessBackground)] shadow-sap-field-success-shadow',
        'border-sap-field-success-color border-width-sap-field-success-border-width [border-style:var(--sapField_SuccessBorderStyle)]',
        'hover:[background:var(--sapField_SuccessBackgroundStyle)_var(--sapField_Hover_Background)] hover:border-sap-field-success-color hover:shadow-sap-content-positive-shadow',
        'focus:[background:var(--sapField_Focus_Background)] focus:outline-sap-field-success-color focus:shadow-sap-field-success-shadow focus:hover:shadow-none'
    ].join(' '),
    information: [
        '[background:var(--sapField_InformationBackgroundStyle)_var(--sapField_InformationBackground)] shadow-sap-field-information-shadow',
        'border-sap-field-information-color border-width-sap-field-information-border-width [border-style:var(--sapField_InformationBorderStyle)]',
        'hover:[background:var(--sapField_InformationBackgroundStyle)_var(--sapField_Hover_Background)] hover:border-sap-field-information-color hover:shadow-sap-content-informative-shadow',
        'focus:[background:var(--sapField_Focus_Background)] focus:outline-sap-field-information-color focus:shadow-sap-field-information-shadow focus:hover:shadow-none'
    ].join(' ')
};

/** Extra styles of multi-line fields. */
export const textareaBase = [
    'block h-auto min-w-24 min-h-sap-element-height py-2 px-2.5 whitespace-pre-wrap overflow-auto resize-none leading-(--sapContent_LineHeight)',
    'compact:min-h-sap-element-compact-height compact:py-[0.1875rem] compact:px-2',
    'readonly:border-dashed readonly:border-sap-field-read-only-border-color readonly:border-width-sap-field-border-width',
    'readonly:[background:var(--sapField_ReadOnly_Background)] readonly:hover:[background:var(--sapField_ReadOnly_Background)] readonly:focus:[background:var(--sapField_ReadOnly_Background)]'
].join(' ');

/**
 * SAP field styling and ARIA for native `<input>` and `<textarea>` elements. Works with Angular forms.
 *
 * ```html
 * <input fdFormControl id="name" placeholder="Name" />
 * <input fdFormControl state="error" aria-describedby="name-error" />
 * <textarea fdFormControl rows="4"></textarea>
 * ```
 */
@Directive({
    selector: 'input[fdFormControl], textarea[fdFormControl]',
    exportAs: 'fdFormControl',
    host: {
        '[class]': 'computedClass()',
        '[attr.aria-invalid]': 'state() === "error" ? "true" : null'
    }
})
export class FormControl {
    readonly elementRef = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);

    /** Value state of the field. Pair it with a form message that explains the state. */
    readonly state = input<FormState | null | undefined>();

    /** Hides the spin buttons of number inputs. */
    readonly noNumberSpinner = input(false);

    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly isTextarea = this.elementRef.nativeElement.tagName === 'TEXTAREA';

    protected readonly computedClass = computed(() =>
        cn(
            fieldBase,
            '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
            this.isTextarea && textareaBase,
            this.noNumberSpinner() &&
                '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            fieldStates[this.state() ?? 'default'],
            this.userClass()
        )
    );
}
