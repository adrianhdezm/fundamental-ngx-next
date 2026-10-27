/*
 * Port of @fundamental-ngx/core (form) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    booleanAttribute,
    computed,
    inject,
    input
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

export type FormMessageType = 'success' | 'error' | 'warning' | 'information' | 'default';

const TYPE: Record<FormMessageType, { class: string; glyph: string; label: string }> = {
    error: {
        class: 'bg-sap-error-background before:text-sap-negative-element-color',
        glyph: '',
        label: 'Invalid Entry'
    },
    warning: {
        class: 'bg-sap-warning-background before:text-sap-critical-element-color',
        glyph: '',
        label: 'Warning'
    },
    success: {
        class: 'bg-sap-success-background before:text-sap-positive-element-color',
        glyph: '',
        label: 'Success'
    },
    information: {
        class: 'bg-sap-information-background before:text-sap-informative-element-color',
        glyph: '',
        label: 'Information'
    },
    default: { class: '', glyph: '', label: '' }
};

let nextId = 0;

/**
 * Value state message of a field. Announced politely-assertive; place it in a
 * `fd-form-input-message-group` to show it in a popover under the field.
 *
 * ```html
 * <fd-form-message type="error">Enter a valid email address.</fd-form-message>
 * ```
 */
@Component({
    selector: 'fd-form-message',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        'aria-live': 'assertive',
        'aria-atomic': 'true',
        '[class]': 'computedClass()',
        '[attr.id]': 'id()',
        '[attr.data-glyph]': 'glyph()'
    },
    template: `
        @if (srOnly()) {
            <span class="sr-only-sap">{{ srOnly() }}</span>
        }
        <span><ng-content /></span>
    `
})
export class FormMessage {
    readonly id = input(`fd-form-message-${nextId++}`);
    readonly type = input<FormMessageType>('default');
    /** Width follows the content instead of the field. */
    readonly static = input(false, { transform: booleanAttribute });
    /** Inside a popover or container: no shadow, full width. */
    readonly embedded = input(false, { transform: booleanAttribute });
    /** Hidden prefix announced before the message; defaults to the type ("Invalid Entry", "Warning", ...). */
    readonly valueStateMessage = input<string>('');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    protected readonly srOnly = computed(() => this.valueStateMessage() || TYPE[this.type()].label);
    protected readonly glyph = computed(() => TYPE[this.type()].glyph || null);

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex w-full min-w-24 max-w-[22rem] items-center p-2',
            'font-sap-font-family text-sap-font-small-size font-normal leading-[1.125rem] text-sap-text-color whitespace-pre-line',
            'shadow-sap-content-shadow1 rounded-sap-popover-border-corner-radius',
            'hc:shadow-none hc:rounded-none hc:border-solid hc:border-[calc(var(--sapField_BorderWidth)*2)] hc:border-sap-field-border-color',
            'before:block before:self-start before:me-1.5 before:font-sap-content-icon-font-family before:text-[1rem] before:content-[attr(data-glyph)]',
            TYPE[this.type()].class,
            this.static() && 'w-auto',
            this.embedded() && 'shadow-none max-w-full',
            this.userClass()
        )
    );
}
