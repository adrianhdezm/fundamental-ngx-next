/*
 * Port of @fundamental-ngx/core (object-attribute) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output } from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

/**
 * Object attribute: a single-line label/value of an object, optionally with an action link.
 *
 * ```html
 * <fd-object-attribute label="Manufacturer">: Titanium</fd-object-attribute>
 * <fd-object-attribute label="Owner: " isLink linkText="Jane Doe" (objectAttributeClick)="open()" />
 * ```
 */
@Component({
    selector: 'fd-object-attribute',
    exportAs: 'fdObjectAttribute',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[attr.title]': 'label() ?? null'
    },
    template: `
        {{ label() }}<ng-content />
        @if (linkText() != null) {
            <span
                role="link"
                [class]="linkClass()"
                [attr.tabindex]="disabled() ? -1 : 0"
                [attr.title]="linkText()"
                [attr.aria-disabled]="disabled() || null"
                (click)="activate($event)"
                (keydown.enter)="activate($event)"
                >{{ linkText() }}</span
            >
        }
    `
})
export class ObjectAttribute {
    readonly label = input<string | null | undefined>();
    readonly linkText = input<string | null | undefined>();
    /** Styles the link text as an action link and emits objectAttributeClick. */
    readonly isLink = input(false, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly objectAttributeClick = output<Event>();

    protected activate(event: Event): void {
        if (this.isLink() && !this.disabled()) this.objectAttributeClick.emit(event);
    }

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 block truncate p-0 font-sap-font-family text-sap-font-size leading-[normal] text-sap-content-label-color',
            this.userClass()
        )
    );

    protected readonly linkClass = computed(() =>
        cn(
            this.isLink() && [
                'cursor-pointer no-underline text-sap-link-color visited:text-sap-link-visited-color',
                'enabled-hover:underline enabled-hover:text-sap-link-hover-color',
                'focus:outline-sap focus:-outline-offset-1',
                this.disabled() && 'pointer-events-none opacity-(--sapContent_DisabledOpacity)'
            ]
        )
    );
}
