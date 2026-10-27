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
    Renderer2,
    afterRenderEffect,
    booleanAttribute,
    contentChild,
    inject,
    input,
    model,
    untracked
} from '@angular/core';
import {
    Popover,
    PopoverBody,
    PopoverControl,
    type Placement,
    type PopoverFillMode,
    type TriggerConfig
} from '@/ui/popover/popover';
import { FormMessage } from './form-message';

/**
 * Shows the `fd-form-message` of a field in a popover attached to the field (on focus by default)
 * and links it to the control with aria-describedby (and aria-invalid for errors).
 *
 * ```html
 * <fd-form-input-message-group>
 *   <input fdFormControl state="error" />
 *   <fd-form-message type="error">Enter a valid VAT number.</fd-form-message>
 * </fd-form-input-message-group>
 * ```
 */
@Component({
    selector: 'fd-form-input-message-group',
    imports: [Popover, PopoverControl, PopoverBody],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `
        <fd-popover
            class="block"
            additionalBodyClass="shadow-none border-0 z-[999]"
            [placement]="placement()"
            [triggers]="triggers()"
            [noArrow]="noArrow()"
            [closeOnEscapeKey]="closeOnEscapeKey()"
            [closeOnOutsideClick]="closeOnOutsideClick()"
            [fillControlMode]="fillControlMode()"
            [disableScrollbar]="true"
            [focusAutoCapture]="false"
            [focusTrapped]="false"
            [restoreFocusOnClose]="false"
            [preventSpaceKeyScroll]="preventSpaceKeyScroll()"
            [bodyAriaLabel]="popoverAriaLabel()"
            [(isOpen)]="isOpen"
        >
            <fd-popover-control class="[&_input]:block"><ng-content /></fd-popover-control>
            <fd-popover-body><ng-content select="fd-form-message" /></fd-popover-body>
        </fd-popover>
    `
})
export class FormInputMessageGroup {
    /** Events that show and hide the message (default: focus). */
    readonly triggers = input<(string | TriggerConfig)[]>(['focusin', 'focusout']);
    readonly closeOnOutsideClick = input(false, { transform: booleanAttribute });
    readonly closeOnEscapeKey = input(false, { transform: booleanAttribute });
    readonly noArrow = input(true, { transform: booleanAttribute });
    readonly fillControlMode = input<PopoverFillMode | null>(null);
    readonly placement = input<Placement>('bottom-start');
    readonly preventSpaceKeyScroll = input(true, { transform: booleanAttribute });
    readonly popoverAriaLabel = input('Field validation messages');
    /** Whether the message popover is shown; two-way bindable. */
    readonly isOpen = model(false);

    private readonly message = contentChild(FormMessage);
    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly renderer = inject(Renderer2);
    private managedId: string | null = null;

    constructor() {
        afterRenderEffect(() => {
            const message = this.message();
            const id = message?.id();
            const type = message?.type();
            untracked(() => this.linkControl(id ?? null, type ?? null));
        });
    }

    /** The field inside the group. */
    private control(): HTMLElement | null {
        return this.elementRef.nativeElement.querySelector<HTMLElement>(
            'fd-popover-control input, fd-popover-control textarea, fd-popover-control select, fd-popover-control [contenteditable]'
        );
    }

    /** Points aria-describedby at the message unless the author manages it; errors set aria-invalid. */
    private linkControl(messageId: string | null, type: string | null): void {
        const control = this.control();
        if (!control) return;
        if (!messageId) {
            if (this.managedId && control.getAttribute('aria-describedby') === this.managedId) {
                this.renderer.removeAttribute(control, 'aria-describedby');
                this.renderer.removeAttribute(control, 'aria-invalid');
            }
            this.managedId = null;
            return;
        }
        const errormessage = control.getAttribute('aria-errormessage');
        if (errormessage) {
            this.renderer.removeAttribute(control, 'aria-errormessage');
            this.renderer.setAttribute(control, 'aria-describedby', errormessage);
            this.managedId = errormessage;
        } else {
            const existing = control.getAttribute('aria-describedby');
            if (!existing || existing === this.managedId) {
                this.managedId = messageId;
                this.renderer.setAttribute(control, 'aria-describedby', messageId);
            }
        }
        if (type === 'error') this.renderer.setAttribute(control, 'aria-invalid', 'true');
        else if (control.getAttribute('aria-describedby') === this.managedId)
            this.renderer.removeAttribute(control, 'aria-invalid');
    }
}
