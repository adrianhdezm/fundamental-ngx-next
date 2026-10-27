/*
 * Port of @fundamental-ngx/core (object-identifier) with the visual design of fundamental-styles,
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
    contentChildren,
    effect,
    input
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Link } from '@/ui/link/link';

let nextId = 0;

/**
 * Object identifier: the title of an object, optionally a link, with a description below.
 *
 * ```html
 * <fd-object-identifier bold description="Laptop, 15 inch">Notebook Basic 15</fd-object-identifier>
 * <fd-object-identifier description="Order 4711"><a fdLink href="/orders/4711">Order</a></fd-object-identifier>
 * ```
 */
@Component({
    selector: 'fd-object-identifier',
    exportAs: 'fdObjectIdentifier',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[attr.id]': 'id()'
    },
    template: `
        <p [class]="titleClass()" [id]="id() + '-title'"><ng-content /></p>
        @if (description()) {
            <p class="m-0 mt-2 p-0 leading-normal text-sap-content-label-color" [id]="id() + '-text'">
                {{ description() }}
            </p>
        }
        <span class="sr-only-sap" [id]="id() + '-description'" [attr.aria-hidden]="links().length ? 'true' : null">
            {{ ariaLabel() || defaultAriaLabel() }}
        </span>
    `
})
export class ObjectIdentifier {
    readonly id = input(`fd-object-identifier-${nextId++}`);
    readonly description = input<string | null | undefined>();
    /** Announced as the kind of element; defaults to defaultAriaLabel. */
    readonly ariaLabel = input<string | null | undefined>();
    readonly defaultAriaLabel = input('Object Identifier');
    readonly bold = input(false, { transform: booleanAttribute });
    /** Regular font size, e.g. inside table cells. */
    readonly medium = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly links = contentChildren(Link, { read: ElementRef, descendants: true });

    constructor() {
        // projected links are named by their own text, the identifier role text and the description
        effect(() => {
            const id = this.id();
            const extra = this.description() ? `${id}-description ${id}-text` : `${id}-description`;
            this.links().forEach((link, index) => {
                const element = link.nativeElement as HTMLElement;
                element.id ||= `${id}-link-${index}`;
                element.setAttribute('aria-labelledby', `${element.id} ${extra}`);
            });
        });
    }

    protected readonly computedClass = computed(() =>
        cn('block font-sap-font-family text-sap-font-size', this.userClass())
    );

    protected readonly titleClass = computed(() =>
        cn(
            'm-0 p-0 text-sap-list-text-color',
            this.medium() ? 'text-sap-font-size' : 'text-sap-font-large-size',
            this.bold() && 'font-bold',
            '[&_[fdLink]]:[font-size:inherit] [&_[fdLink]]:[font-weight:inherit]'
        )
    );
}
