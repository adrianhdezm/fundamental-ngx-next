/*
 * Port of @fundamental-ngx/core (scrollbar) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { CdkScrollable } from '@angular/cdk/scrolling';
import { Directive, ElementRef, booleanAttribute, computed, inject, input } from '@angular/core';

export type ScrollbarOverflow = 'auto' | 'scroll' | 'hidden';

/**
 * SAP-themed scroll container. Registers as a CDK scrollable so overlays attached inside follow
 * its scrolling.
 *
 * ```html
 * <div fdScrollbar class="h-60">...</div>
 * <div fdScrollbar noHorizontalScroll alwaysVisible class="h-60">...</div>
 * ```
 */
@Directive({
    selector: '[fdScrollbar], [fd-scrollbar]',
    exportAs: 'fdScrollbar',
    hostDirectives: [CdkScrollable],
    host: {
        class: 'scrollbar-sap focus-visible:outline-sap focus-visible:-outline-offset-2',
        '[style.overflow-x]': 'overflowX()',
        '[style.overflow-y]': 'overflowY()'
    }
})
export class Scrollbar {
    readonly noHorizontalScroll = input(false, { transform: booleanAttribute });
    readonly noVerticalScroll = input(false, { transform: booleanAttribute });
    /** Shows the scrollbars even when the content fits. */
    readonly alwaysVisible = input(false, { transform: booleanAttribute });

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    protected readonly overflowX = computed<ScrollbarOverflow>(() =>
        this.noHorizontalScroll() ? 'hidden' : this.alwaysVisible() ? 'scroll' : 'auto'
    );
    protected readonly overflowY = computed<ScrollbarOverflow>(() =>
        this.noVerticalScroll() ? 'hidden' : this.alwaysVisible() ? 'scroll' : 'auto'
    );

    scroll(options: ScrollToOptions): void {
        this.elementRef.nativeElement.scroll(options);
    }
}
