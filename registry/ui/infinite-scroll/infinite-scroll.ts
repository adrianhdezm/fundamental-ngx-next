/*
 * Port of @fundamental-ngx/core (infinite-scroll) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { DestroyRef, Directive, ElementRef, inject, input, output } from '@angular/core';
import { debounceTime, filter, fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Emits onScrollAction when a scroll container is scrolled past a percentage of its content
 * (or to within an offset of its end), e.g. to load more items.
 *
 * ```html
 * <ul fd-list fdInfiniteScroll class="h-80 overflow-auto" (onScrollAction)="loadMore()">...</ul>
 * ```
 */
@Directive({
    selector: '[fdInfiniteScroll]',
    exportAs: 'fdInfiniteScroll'
})
export class InfiniteScroll {
    /** Fires after this percentage of the content is scrolled (when no offset is set). */
    readonly scrollPercent = input(75);
    /** Fires within this many pixels of the end. */
    readonly scrollOffset = input<number | null | undefined>();
    readonly onScrollAction = output<void>();

    private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    constructor() {
        fromEvent(this.element, 'scroll')
            .pipe(
                debounceTime(50),
                filter(() => this.shouldTriggerAction()),
                takeUntilDestroyed(inject(DestroyRef))
            )
            .subscribe(() => this.onScrollAction.emit());
    }

    shouldTriggerAction(): boolean {
        const element = this.element;
        const bottom = element.scrollTop + element.offsetHeight;
        const offset = this.scrollOffset();
        return offset
            ? bottom > element.scrollHeight - offset
            : bottom / element.scrollHeight > this.scrollPercent() / 100;
    }
}
