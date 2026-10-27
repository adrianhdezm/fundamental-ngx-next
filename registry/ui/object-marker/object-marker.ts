/*
 * Port of @fundamental-ngx/core (object-marker) with the visual design of fundamental-styles,
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
import { Icon, type IconFont } from '@/ui/icon/icon';

let nextId = 0;

/**
 * Object marker: a technical status of an object (draft, locked, favourite...) as icon and/or text.
 * Clickable markers are links.
 *
 * ```html
 * <span fdObjectMarker glyph="private" label="Locked"></span>
 * <a fdObjectMarker clickable glyph="user-edit" label="Unsaved changes" (click)="open()"></a>
 * ```
 */
@Component({
    selector: '[fdObjectMarker], [fd-object-marker]',
    exportAs: 'fdObjectMarker',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[attr.id]': 'id()',
        '[attr.tabindex]': 'clickable() ? 0 : -1',
        '[attr.role]': 'role()',
        '[attr.aria-labelledby]': 'computedAriaLabelledBy()',
        '(keydown.enter)': 'activate($event)'
    },
    template: `
        <span class="sr-only-sap" [id]="id() + '-sr-only'" aria-hidden="true">{{ computedStatusText() }}</span>
        @if (glyph()) {
            <fd-icon
                [glyph]="glyph()"
                [font]="glyphFont()"
                [attr.role]="label() ? 'presentation' : null"
                [attr.title]="iconTitle()"
                class="flex items-center justify-center pe-1 text-base leading-[normal] text-sap-content-marker-icon-color only:px-0"
            />
        }
        @if (label()) {
            <span [id]="id() + '-label'" [class]="textClass()">{{ label() }}</span>
        }
        @if (glyph() && !label()) {
            <span class="sr-only-sap" [id]="id() + '-sr-only-icon-only'" aria-hidden="true">{{ iconTitle() }}</span>
        }
        <ng-content />
    `
})
export class ObjectMarker {
    readonly id = input(`fd-object-marker-${nextId++}`);
    readonly ariaLabelledBy = input<string | null | undefined>();
    /** Announced before the label; defaults to activeText or inactiveText. */
    readonly statusText = input<string | null | undefined>();
    readonly activeText = input('Active Object Marker');
    readonly inactiveText = input('Inactive Object Marker');
    readonly glyph = input<string | null | undefined>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly clickable = input(false, { transform: booleanAttribute });
    readonly label = input<string | null | undefined>();
    /** Tooltip and accessible name of icon-only markers (defaults to the glyph name). */
    readonly title = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    /** role="link" hosts without a native link activate with Enter like links. */
    protected activate(event: Event): void {
        const host = this.elementRef.nativeElement;
        const native =
            (host instanceof HTMLAnchorElement && host.hasAttribute('href')) || host instanceof HTMLButtonElement;
        if (!this.clickable() || event.target !== host || native) return;
        event.preventDefault();
        host.click();
    }

    protected readonly role = computed(() =>
        this.clickable() ? 'link' : this.glyph() && !this.label() ? 'img' : null
    );
    protected readonly computedStatusText = computed(
        () => this.statusText() ?? (this.clickable() ? this.activeText() : this.inactiveText())
    );
    protected readonly iconTitle = computed(() =>
        !this.glyph() || this.label() ? null : (this.title() ?? this.glyph())
    );
    protected readonly computedAriaLabelledBy = computed(() => {
        if (this.ariaLabelledBy()) return this.ariaLabelledBy();
        const id = this.id();
        return this.glyph() && !this.label() ? `${id}-sr-only ${id}-sr-only-icon-only` : `${id}-sr-only ${id}-label`;
    });

    protected readonly computedClass = computed(() =>
        cn(
            'group/om relative m-0 box-border inline-flex max-w-full items-center p-0 align-middle',
            'font-sap-font-family text-base leading-none [&+&]:ms-2',
            this.clickable() && [
                'cursor-pointer text-sap-link-color text-shadow-sap-content-text-shadow transition-all duration-[125ms] ease-in break-words',
                'visited:text-sap-link-visited-color hover:text-sap-link-hover-color active:text-sap-link-active-color',
                // Horizon: filled focus; high contrast: outline
                'focus:outline-none focus:text-sap-content-contrast-text-color focus:[text-shadow:none]',
                'focus:bg-sap-content-focus-color focus:rounded-[0.125rem] active:focus:bg-transparent',
                'hc:focus:bg-transparent hc:focus:rounded-none hc:focus:outline-(length:--sapContent_FocusWidth) hc:focus:outline-offset-[0.125rem]',
                'hc:focus:[outline-style:var(--sapContent_FocusStyle)] hc:focus:outline-sap-content-focus-color',
                '[&:focus_fd-icon]:text-inherit'
            ],
            this.userClass()
        )
    );

    protected readonly textClass = computed(() =>
        this.clickable()
            ? cn(
                  '[text-decoration:var(--sapLink_TextDecoration)] group-hover/om:[text-decoration:var(--sapLink_Hover_TextDecoration)]',
                  'group-active/om:[text-decoration:var(--sapLink_Active_TextDecoration)] group-focus/om:underline'
              )
            : 'm-0 p-0 text-base not-italic leading-[normal] break-words text-sap-content-label-color'
    );
}
