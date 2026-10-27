/*
 * Port of @fundamental-ngx/core (scroll-spy) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    DestroyRef,
    Directive,
    ElementRef,
    afterNextRender,
    booleanAttribute,
    inject,
    input,
    output
} from '@angular/core';

/**
 * Tracks which child of a scroll container (with one of the tracked tag names) is currently at
 * the top, e.g. to highlight the matching entry of a table of contents.
 *
 * ```html
 * <div fdScrollSpy [trackedTags]="['section']" (spyChange)="active = $event?.id" class="h-96 overflow-auto">
 *     <section id="intro">...</section><section id="usage">...</section>
 * </div>
 * ```
 */
@Directive({
    selector: '[fdScrollSpy]',
    exportAs: 'fdScrollSpy',
    host: { '(scroll)': 'onScroll()' }
})
export class ScrollSpy {
    /** Tag names of the children to track, e.g. ['section', 'h2']. */
    readonly trackedTags = input<string[]>([]);
    /** Emits undefined when no tracked child is reached yet. */
    readonly fireEmpty = input(false, { transform: booleanAttribute });
    /** Part of the container height (0-1) below the top that still counts as reached. */
    readonly targetPercent = input(0);
    /** Pixel offset added to the reach line. */
    readonly targetOffset = input(0);
    readonly scrollSpyDisabled = input(false, { transform: booleanAttribute });

    readonly spyChange = output<HTMLElement | undefined>();

    private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private current: HTMLElement | undefined;

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const observer = new ResizeObserver(() => this.onScroll(true));
            observer.observe(this.element);
            destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    onScroll(forced = false): void {
        if (this.scrollSpyDisabled()) return;
        const container = this.element;
        const children = Array.from(container.children) as HTMLElement[];
        if (!children.length) return;
        const tags = this.trackedTags().map((tag) => tag.toUpperCase());
        const origin = children[0].offsetTop + this.targetOffset();
        const line = container.scrollTop + container.offsetHeight * this.targetPercent();
        let spied: HTMLElement | undefined;
        for (const child of children) {
            if (tags.includes(child.tagName) && child.offsetTop - origin <= line) spied = child;
        }
        if (forced || ((spied || this.fireEmpty()) && spied !== this.current)) {
            this.current = spied;
            this.spyChange.emit(spied);
        }
    }
}
