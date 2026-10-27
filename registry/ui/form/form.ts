/*
 * Port of @fundamental-ngx/core (form) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    TemplateRef,
    booleanAttribute,
    computed,
    input
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon } from '@/ui/icon/icon';
import { InlineHelp } from '@/ui/inline-help/inline-help';
import type { Placement, TriggerConfig } from '@/ui/popover/popover';

let nextLabelId = 0;

/**
 * Label of a form field, with required and colon markers and optional inline help.
 *
 * ```html
 * <label fdFormLabel for="name" required colon>Name</label>
 * <label fdFormLabel for="vat" inlineHelpContent="Country code and 9-12 digits">VAT number</label>
 * ```
 */
@Component({
    selector: '[fdFormLabel], [fd-form-label]',
    imports: [Icon, InlineHelp, NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'wrapperClass()',
        '[attr.id]': 'id()'
    },
    template: `
        <ng-template #help>
            <fd-icon
                glyph="question-mark"
                tabindex="0"
                [class]="helpClass()"
                [fdInlineHelp]="inlineHelpContent()"
                [triggers]="inlineHelpTriggers()"
                [placement]="inlineHelpBodyPlacement()"
                [ariaLabel]="inlineHelpAriaLabel()"
            />
        </ng-template>
        @if (inlineHelpContent() && inlineHelpPlacement() === 'before') {
            <ng-container [ngTemplateOutlet]="help" />
        }
        <span [class]="labelClass()" [attr.aria-disabled]="disabled() || null"><ng-content /></span>
        @if (inlineHelpContent() && inlineHelpPlacement() === 'after') {
            <ng-container [ngTemplateOutlet]="help" />
        }
    `
})
export class FormLabel {
    readonly id = input(`fd-form-label-${nextLabelId++}`);
    /** Shows the required asterisk. */
    readonly required = input(false, { transform: booleanAttribute });
    /** Appends a colon. */
    readonly colon = input(false, { transform: booleanAttribute });
    /** Lets the label wrap instead of truncating. */
    readonly allowWrap = input(false, { transform: booleanAttribute });
    /** Aligns the label to the end of its column. */
    readonly alignLabelEnd = input(false, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    /** Label used as a unit description after a field (e.g. "EUR"). */
    readonly unitDescription = input(false, { transform: booleanAttribute });
    /** Label not attached to a field, centred vertically. */
    readonly independent = input(false, { transform: booleanAttribute });
    /** Help text or template shown by the inline help icon. */
    readonly inlineHelpContent = input<string | TemplateRef<unknown> | null>(null);
    /** Inline help before or after the label text. */
    readonly inlineHelpPlacement = input<'before' | 'after'>('after');
    readonly inlineHelpBodyPlacement = input<Placement | null>(null);
    readonly inlineHelpTriggers = input<(string | TriggerConfig)[]>([
        'mouseenter',
        'mouseleave',
        'focusin',
        'focusout',
        { trigger: 'click', openAction: true, closeAction: true }
    ]);
    /** Accessible name of the inline help icon; defaults to the help text. */
    readonly inlineHelpLabel = input<string | null>(null);
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly inlineHelpAriaLabel = computed(() => {
        const content = this.inlineHelpContent();
        return this.inlineHelpLabel() ?? (typeof content === 'string' ? content : null);
    });

    protected readonly wrapperClass = computed(() =>
        cn('relative flex pb-0.5', this.alignLabelEnd() && 'justify-end', this.userClass())
    );

    protected readonly labelClass = computed(() =>
        cn(
            'relative m-0 -mb-0.5 inline-block w-fit max-w-full truncate p-0 me-2 self-start cursor-text',
            'font-sap-font-family text-sap-font-size leading-[normal] font-normal text-sap-content-label-color',
            this.allowWrap() && 'whitespace-normal',
            this.required() &&
                "pe-2 after:absolute after:end-0 after:top-0 after:text-sap-font-large-size after:font-bold after:text-sap-field-required-color after:content-['*'_/_'']",
            this.colon() &&
                "pe-1 before:absolute before:end-0 before:top-0 before:text-sap-font-size before:text-inherit before:content-[':']",
            this.colon() && this.required() && 'pe-3 before:end-2',
            this.unitDescription() && 'm-0 p-0 ps-1 text-sap-field-text-color',
            this.independent() && 'self-center me-0',
            this.disabled() && 'pointer-events-none opacity-40'
        )
    );

    protected readonly helpClass = computed(() =>
        cn(
            'relative top-0.5 cursor-pointer rounded-[0.25rem] text-sap-content-icon-color focus:outline-sap',
            this.inlineHelpPlacement() === 'before' ? 'me-1' : 'ms-1'
        )
    );
}

/**
 * A label and its control, stacked (or side by side when `horizontal`).
 *
 * ```html
 * <div fdFormItem><label fdFormLabel for="n">Name</label><input fdFormControl id="n" /></div>
 * ```
 */
@Directive({
    selector: '[fdFormItem], [fd-form-item]',
    host: { '[class]': 'computedClass()' }
})
export class FormItem {
    /** Inline layout inside an inline form group. */
    readonly isInline = input(false, { transform: booleanAttribute });
    /** Label and control on one line. */
    readonly horizontal = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly computedClass = computed(() =>
        cn(
            'relative m-0 box-border flex flex-1 flex-col p-0',
            '[&>fd-form-message:not(:first-child)]:-mt-1',
            this.horizontal() &&
                'flex-row items-center [&_[fdFormLabel]>span]:my-auto [&_[fdFormLabel]>span]:me-1 [&_[fdFormLabel]>span]:pb-0 [&>input]:flex-1',
            this.isInline() && 'flex-none',
            this.userClass()
        )
    );
}

/**
 * Groups form items in a column, or in a wrapping row when `isInline`.
 *
 * ```html
 * <fd-form-group isInline>...</fd-form-group>
 * ```
 */
@Component({
    selector: 'fd-form-group, [fdFormGroup]',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `<ng-content />`
})
export class FormGroup {
    readonly isInline = input(false, { transform: booleanAttribute });
    /** 0.625rem gap between items. */
    readonly withSpacing = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex flex-col p-0',
            this.isInline() &&
                'flex-row flex-wrap justify-start [&>[fdFormItem]]:flex-none [&>[fd-form-item]]:flex-none',
            this.withSpacing() && 'gap-2.5',
            this.userClass()
        )
    );
}

/** Header of a form group: a title bar with the group title. */
@Directive({
    selector: '[fdFormGroupHeader]',
    host: { '[class]': 'computedClass()' }
})
export class FormGroupHeader {
    readonly noPadding = input(false, { transform: booleanAttribute });
    readonly noBorder = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'box-border flex w-full items-center min-h-sap-element-line-height compact:min-h-sap-element-compact-line-height',
            'bg-sap-group-title-background border-b border-b-sap-group-title-border-color px-4',
            'font-sap-font-header-family text-sap-group-title-font-size font-bold text-sap-group-title-text-color',
            this.noPadding() && 'px-0',
            this.noBorder() && 'border-b-0',
            this.userClass()
        )
    );
}

/**
 * Title bar above a form.
 *
 * ```html
 * <h4 fdFormHeader>Address</h4>
 * ```
 */
@Component({
    selector: '[fdFormHeader], [fd-form-header]',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'm-0 box-border flex h-sap-element-line-height w-full items-center bg-sap-group-title-background px-4 [--hdr-bw:var(--sapList_BorderWidth)] hc:[--hdr-bw:calc(var(--sapList_BorderWidth)*3)] [--hdr-bc:var(--sapGroup_TitleBorderColor)] shadow-[0_var(--hdr-bw)_0_var(--hdr-bc)]'
    },
    template: `<span
        class="m-0 truncate p-0 font-sap-font-header-family text-sap-group-title-font-size text-sap-group-title-text-color"
        ><ng-content
    /></span>`
})
export class FormHeader {}

/** `<fieldset fdFieldset>` without browser chrome. */
@Directive({
    selector: '[fdFieldset], [fd-fieldset]',
    host: {
        class: 'm-0 box-border min-w-auto border-0 p-0 font-sap-font-family text-sap-font-size text-sap-text-color'
    }
})
export class Fieldset {}

/** `<legend fdFormLegend>` of a fieldset. */
@Directive({
    selector: '[fdFormLegend], [fd-form-legend]',
    host: {
        '[class]': 'computedClass()'
    }
})
export class FormLegend {
    readonly disabled = input(false, { transform: booleanAttribute });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 block p-0 font-sap-font-family text-sap-font-size leading-[normal] text-sap-text-color',
            this.disabled() && 'opacity-(--sapContent_DisabledOpacity)'
        )
    );
}
