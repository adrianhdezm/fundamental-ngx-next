/*
 * Port of @fundamental-ngx/core (overflow-layout) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    TemplateRef,
    afterNextRender,
    afterRenderEffect,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    effect,
    inject,
    input,
    output,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';
import { Popover, PopoverBody, PopoverControl } from '@/ui/popover/popover';

/** Context of an item template: `*fdOverflowItemRef="let hidden; let index = index"`. */
export interface OverflowItemContext<T = unknown> {
    /** True when rendered in the overflow popover. */
    $implicit: boolean;
    index: number;
    first: boolean;
    last: boolean;
    globalIndex: number;
    item: T;
}

/** An item of an overflow layout: `<fd-info-label *fdOverflowItemRef="let hidden" ... />`. */
@Directive({ selector: '[fdOverflowItemRef]' })
export class OverflowItemRef<T = unknown> {
    readonly templateRef = inject<TemplateRef<OverflowItemContext<T>>>(TemplateRef);
    /** Optional data passed to the item context. */
    readonly fdOverflowItemRef = input<T>();
    /**
     * Keeps the item visible: `*fdOverflowItemRef="item; forceVisibility: isSelected(item)"`. Unlike
     * fdOverflowLayoutItem it also works while the item is hidden.
     */
    readonly fdOverflowItemRefForceVisibility = input(false, { transform: booleanAttribute });
    /** Set by fdOverflowLayoutItem inside the template. */
    readonly forceVisibility = signal(false);
    readonly forced = computed(() => this.forceVisibility() || this.fdOverflowItemRefForceVisibility());
    readonly hidden = signal(false);
    /** Hidden state last emitted by hiddenChange; kept here as the item renders anew when it moves. */
    announcedHidden: boolean | undefined;

    static ngTemplateContextGuard<T>(_dir: OverflowItemRef<T>, ctx: unknown): ctx is OverflowItemContext<T> {
        return true;
    }
}

/** Marks the element of an item; forceVisibility keeps it out of the overflow popover. */
@Directive({ selector: '[fdOverflowLayoutItem]' })
export class OverflowLayoutItem {
    readonly forceVisibility = input(false, { transform: booleanAttribute });
    /** Emits when the item moves into or out of the overflow popover. */
    readonly hiddenChange = output<boolean>();
    private readonly ref = inject(OverflowItemRef, { optional: true });

    constructor() {
        effect(() => this.ref?.forceVisibility.set(this.forceVisibility()));
        effect(() => {
            const ref = this.ref;
            if (!ref) return;
            const hidden = ref.hidden();
            if (ref.announcedHidden !== undefined && hidden !== ref.announcedHidden) this.hiddenChange.emit(hidden);
            ref.announcedHidden = hidden;
        });
    }
}

/** Custom "more" control: `<ng-template fdOverflowExpand let-hiddenItems>`. */
@Directive({ selector: '[fdOverflowExpand]' })
export class OverflowExpand {
    readonly templateRef = inject<TemplateRef<{ $implicit: OverflowItemRef[] }>>(TemplateRef);
}

/**
 * Overflow layout: shows as many items as fit in one row (and at most maxVisibleItems); the
 * rest go into a "N more" popover.
 *
 * ```html
 * <fd-overflow-layout [maxVisibleItems]="5">
 *     @for (tag of tags; track tag) {
 *         <fd-info-label *fdOverflowItemRef="let hidden" fdOverflowLayoutItem [label]="tag" />
 *     }
 * </fd-overflow-layout>
 * ```
 */
@Component({
    selector: 'fd-overflow-layout',
    exportAs: 'fdOverflowLayout',
    imports: [NgTemplateOutlet, Popover, PopoverControl, PopoverBody, Button],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '(keydown)': 'onKeydown($event)'
    },
    template: `
        @if (showMorePosition() === 'left') {
            <ng-container [ngTemplateOutlet]="more" />
        }
        <div
            #row
            class="m-0 inline-flex min-w-0 items-center p-0"
            [attr.role]="ariaRole()"
            [attr.aria-label]="ariaLabel() || null"
        >
            @for (item of visibleItems(); track item; let i = $index) {
                <div
                    data-overflow-item
                    class="flex shrink-0 items-center"
                    [attr.role]="ariaRole() === 'list' ? 'listitem' : null"
                >
                    <ng-container
                        [ngTemplateOutlet]="item.templateRef"
                        [ngTemplateOutletContext]="context(item, i, visibleItems(), false)"
                    />
                </div>
            }
        </div>
        @if (showMorePosition() === 'right') {
            <ng-container [ngTemplateOutlet]="more" />
        }

        <ng-template #more>
            @if (renderShowMoreButton() && hiddenItems().length) {
                <div #moreContainer class="m-0 flex shrink-0 items-center p-0">
                    @if (customExpand(); as custom) {
                        <ng-container
                            [ngTemplateOutlet]="custom.templateRef"
                            [ngTemplateOutletContext]="{ $implicit: hiddenItems() }"
                        />
                    } @else {
                        <fd-popover placement="bottom" [noArrow]="false">
                            <fd-popover-control>
                                <button
                                    fdButton
                                    variant="transparent"
                                    fdMenu
                                    [label]="moreItemsButtonText()(hiddenItems().length)"
                                ></button>
                            </fd-popover-control>
                            <fd-popover-body>
                                <div
                                    class="m-0 flex max-w-[19.5rem] flex-wrap gap-2 p-2 whitespace-normal"
                                    [attr.role]="ariaRole()"
                                >
                                    @for (item of hiddenItems(); track item; let i = $index) {
                                        <div class="flex" [attr.role]="ariaRole() === 'list' ? 'listitem' : null">
                                            <ng-container
                                                [ngTemplateOutlet]="item.templateRef"
                                                [ngTemplateOutletContext]="context(item, i, hiddenItems(), true)"
                                            />
                                        </div>
                                    }
                                </div>
                            </fd-popover-body>
                        </fd-popover>
                    }
                </div>
            }
        </ng-template>
    `
})
export class OverflowLayout {
    /** Upper limit of items in the row. */
    readonly maxVisibleItems = input(Number.POSITIVE_INFINITY);
    /** Side of the "more" control; items overflow from the opposite side when it is left. */
    readonly showMorePosition = input<'left' | 'right'>('right');
    readonly renderShowMoreButton = input(true, { transform: booleanAttribute });
    /** Lists hidden items in reverse order in the popover. */
    readonly reverseHiddenItems = input(false, { transform: booleanAttribute });
    /** Arrow keys move focus between the focusable elements of the visible items. */
    readonly enableKeyboardNavigation = input(true, { transform: booleanAttribute });
    readonly ariaRole = input<string | null | undefined>();
    /** Accessible name of the row of items, e.g. of a tab list. */
    readonly ariaLabel = input<string | null | undefined>();
    readonly moreItemsButtonText = input<(count: number) => string>((count) => `${count} more`);
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly visibleItemsCount = output<number>();
    readonly hiddenItemsCount = output<number>();
    readonly hiddenItemsChange = output<OverflowItemRef[]>();

    readonly items = contentChildren(OverflowItemRef);
    protected readonly customExpand = contentChild(OverflowExpand);
    private readonly row = viewChild.required<ElementRef<HTMLElement>>('row');
    private readonly moreContainer = viewChild<ElementRef<HTMLElement>>('moreContainer');
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    private readonly widths = new Map<OverflowItemRef | 'more', number>();
    private readonly available = signal(Number.POSITIVE_INFINITY);
    private readonly measured = signal(0);

    private readonly layout = computed(() => {
        this.measured();
        const items = this.items();
        const available = this.available();
        const fromEnd = this.showMorePosition() === 'left';
        const max = this.maxVisibleItems();
        const width = (item: OverflowItemRef) => this.widths.get(item) ?? 0;
        const total = items.reduce((sum, item) => sum + width(item), 0);
        if (total <= available && items.length <= max) return { visible: [...items], hidden: [] as OverflowItemRef[] };

        const more = this.widths.get('more') ?? 0;
        const forced = items.filter((item) => item.forced());
        let budget = available - more - forced.reduce((sum, item) => sum + width(item), 0);
        let slots = max - forced.length;
        const ordered = fromEnd ? [...items].reverse() : items;
        const kept = new Set<OverflowItemRef>(forced);
        let full = false;
        for (const item of ordered) {
            if (item.forced()) continue;
            if (!full && slots > 0 && width(item) <= budget) {
                kept.add(item);
                budget -= width(item);
                slots--;
            } else {
                full = true;
            }
        }
        const hidden = items.filter((item) => !kept.has(item));
        return {
            visible: items.filter((item) => kept.has(item)),
            hidden: this.reverseHiddenItems() ? hidden.reverse() : hidden
        };
    });
    readonly visibleItems = computed(() => this.layout().visible);
    readonly hiddenItems = computed(() => this.layout().hidden);

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const observer = new ResizeObserver(() => this.measure());
            observer.observe(this.host);
            observer.observe(this.row().nativeElement);
            destroyRef.onDestroy(() => observer.disconnect());
        });
        // the "more" control appears after the first overflow: measure its real width
        afterRenderEffect(() => {
            if (this.moreContainer()) untracked(() => this.measure());
        });
        effect(() => {
            const { visible, hidden } = this.layout();
            untracked(() => {
                this.items().forEach((item) => item.hidden.set(hidden.includes(item)));
                this.visibleItemsCount.emit(visible.length);
                this.hiddenItemsCount.emit(hidden.length);
                this.hiddenItemsChange.emit(hidden);
            });
        });
    }

    /** Re-measures the items, e.g. after their content changed width. */
    triggerRecalculation(): void {
        this.measure();
    }

    protected context(
        item: OverflowItemRef,
        index: number,
        list: OverflowItemRef[],
        hidden: boolean
    ): OverflowItemContext {
        return {
            $implicit: hidden,
            index,
            first: index === 0,
            last: index === list.length - 1,
            globalIndex: this.items().indexOf(item),
            item: item.fdOverflowItemRef()
        };
    }

    private measure(): void {
        const visible = this.visibleItems();
        this.row()
            .nativeElement.querySelectorAll<HTMLElement>(':scope > [data-overflow-item]')
            .forEach((el, index) => {
                const style = getComputedStyle(el);
                const width =
                    el.getBoundingClientRect().width + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
                if (visible[index]) this.widths.set(visible[index], Math.ceil(width));
            });
        const more = this.moreContainer()?.nativeElement;
        if (more) this.widths.set('more', Math.ceil(more.getBoundingClientRect().width));
        else if (!this.widths.has('more')) this.widths.set('more', 96);
        this.available.set(this.host.clientWidth);
        this.measured.update((n) => n + 1);
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (!this.enableKeyboardNavigation() || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
        const focusables = Array.from(
            this.row().nativeElement.querySelectorAll<HTMLElement>(
                ':scope > [data-overflow-item] :is(a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]))'
            )
        );
        const index = focusables.indexOf(document.activeElement as HTMLElement);
        if (index < 0) return;
        const rtl = getComputedStyle(this.host).direction === 'rtl';
        const step = (event.key === 'ArrowRight') !== rtl ? 1 : -1;
        const next = focusables[index + step];
        if (next) {
            event.preventDefault();
            next.focus();
        }
    }

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex w-full items-center justify-between gap-1 p-0 font-sap-font-family text-sap-font-size text-sap-text-color',
            this.userClass()
        )
    );
}
