/*
 * Port of @fundamental-ngx/core (toolbar) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { InteractivityChecker } from '@angular/cdk/a11y';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    InjectionToken,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    effect,
    forwardRef,
    inject,
    input,
    model,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';
import { Popover, PopoverBody, PopoverControl } from '@/ui/popover/popover';
import { Title } from '@/ui/title/title';

export type ToolbarType = 'solid' | 'transparent' | 'auto' | 'info';
/** never stays, always overflows, disappear is hidden when overflowing; low overflows before high. */
export type OverflowPriority = 'always' | 'disappear' | 'low' | 'high' | 'never';

const PRIORITY_SCORE: Record<OverflowPriority, number> = { always: 0, disappear: 1, low: 2, high: 3, never: 4 };
const ITEM_MARGIN = 8;

/** What the overflow algorithm needs to know about an item. */
export interface ToolbarOverflowItem {
    width: number;
    priority: OverflowPriority;
    group: number;
}

/**
 * Items that do not fit into `available` pixels (after `used` pixels), by priority and group:
 * higher priorities and earlier items stay longest; a group overflows as a whole.
 */
export function toolbarOverflow<T extends ToolbarOverflowItem>(
    items: readonly T[],
    available: number,
    used: number,
    forceOverflow = false
): T[] {
    const overflown: T[] = [];
    sortByPriorityAndGroup(items).reduce((width, item) => {
        const itemWidth = item.width + 2;
        const always = item.priority === 'always' || forceOverflow;
        if ((itemWidth + width > available && item.priority !== 'never') || always) {
            overflown.push(item);
            return always ? width : Number.MAX_SAFE_INTEGER;
        }
        return width + itemWidth;
    }, used);

    for (const item of [...overflown]) {
        if (item.group === 0 || item.priority === 'disappear') continue;
        for (const member of items) {
            if (
                member.group === item.group &&
                member.priority !== 'never' &&
                member.priority !== 'always' &&
                !overflown.includes(member)
            ) {
                overflown.push(member);
            }
        }
    }
    return overflown.sort((a, b) => PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority]);
}

function sortByPriorityAndGroup<T extends ToolbarOverflowItem>(items: readonly T[]): T[] {
    const groups = new Map<number, { items: T[]; index: number; priority: number }>();
    const singles: { items: T[]; index: number; priority: number }[] = [];
    items.forEach((item, index) => {
        const score = PRIORITY_SCORE[item.priority];
        if (item.group === 0 || item.priority === 'never' || item.priority === 'always') {
            singles.push({ items: [item], index, priority: score });
            return;
        }
        const group = groups.get(item.group) ?? { items: [], index, priority: -Infinity };
        group.items.push(item);
        group.priority = Math.max(group.priority, score);
        groups.set(item.group, group);
    });
    return [...groups.values(), ...singles]
        .sort((a, b) => b.priority - a.priority || a.index - b.index)
        .flatMap((group) => group.items);
}

export const FD_TOOLBAR_ITEM = new InjectionToken<ToolbarItem>('FdToolbarItem');

/** A toolbar child that moves into the overflow popover when it does not fit. */
@Directive({
    selector: '[fd-toolbar-item], [fdToolbarItem], [fdOverflowGroup], [fdOverflowPriority]',
    providers: [{ provide: FD_TOOLBAR_ITEM, useExisting: forwardRef(() => ToolbarItem) }]
})
export class ToolbarItem implements ToolbarOverflowItem {
    readonly fdOverflowPriority = input<OverflowPriority>('high');
    /** Items of the same non-zero group overflow together. */
    readonly fdOverflowGroup = input(0);

    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private lastWidth = 0;
    /** Set by the toolbar while the item is in the overflow area. */
    readonly overflown = signal(false);

    get priority(): OverflowPriority {
        return this.fdOverflowPriority();
    }
    get group(): number {
        return this.fdOverflowGroup();
    }
    /** Width in the toolbar, remembered while the item is in the overflow area. */
    get width(): number {
        if (!this.overflown() && this.element.clientWidth) this.lastWidth = this.element.clientWidth + ITEM_MARGIN;
        return this.lastWidth;
    }
}

/** Text in a toolbar. */
@Directive({
    selector: '[fd-toolbar-label], [fdToolbarLabel]',
    providers: [{ provide: FD_TOOLBAR_ITEM, useExisting: forwardRef(() => ToolbarLabel) }],
    host: {
        class: 'truncate font-sap-font-family text-sap-font-size text-sap-content-label-color in-data-[toolbar-overflow]:my-1.5'
    }
})
export class ToolbarLabel extends ToolbarItem {}

/** A button that stretches and aligns to the start in the overflow popover. */
@Directive({
    selector: '[fdToolbarOverflowButton], [fd-toolbar-overflow-button]',
    providers: [{ provide: FD_TOOLBAR_ITEM, useExisting: forwardRef(() => ToolbarOverflowButton) }],
    host: {
        class: 'in-data-[toolbar-overflow]:my-[0.1875rem] in-data-[toolbar-overflow]:w-auto in-data-[toolbar-overflow]:justify-start in-data-[toolbar-overflow]:text-start'
    }
})
export class ToolbarOverflowButton extends ToolbarItem {}

/** Flexible (or fixed-width) space between toolbar items. */
@Directive({
    selector: 'fd-toolbar-spacer',
    host: {
        '[class]': 'computedClass()',
        '[style.width]': 'width()'
    }
})
export class ToolbarSpacer {
    readonly width = input('0px');
    /** Keeps the given width instead of growing. */
    readonly fixed = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn('m-0 h-full p-0', this.fixed() ? 'inline-block flex-none' : 'flex-[1_auto]', this.userClass())
    );
}

/** Vertical line between toolbar items (horizontal in the overflow popover). */
@Component({
    selector: 'fd-toolbar-separator',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'separator',
        class: 'm-0 block h-(--tb-sep-h) w-px bg-sap-toolbar-separator-color p-0 in-data-[toolbar-overflow]:my-[0.1875rem] in-data-[toolbar-overflow]:h-px in-data-[toolbar-overflow]:w-auto'
    }
})
export class ToolbarSeparator {}

let nextId = 0;

/**
 * Toolbar: a row of actions, optionally with a title, that moves the items that do not fit into
 * an overflow popover (shouldOverflow).
 *
 * ```html
 * <fd-toolbar title="Products" shouldOverflow>
 *     <fd-toolbar-spacer />
 *     <button fdButton fd-toolbar-item variant="transparent" label="Add"></button>
 *     <button fdButton fd-toolbar-item fdOverflowPriority="low" variant="transparent" label="Export"></button>
 * </fd-toolbar>
 * ```
 */
@Component({
    selector: 'fd-toolbar',
    exportAs: 'fdToolbar',
    imports: [Title, Button, Popover, PopoverControl, PopoverBody, ToolbarSpacer, ToolbarSeparator],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'toolbar',
        '[class]': 'computedClass()',
        '[attr.id]': 'id()',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.aria-labelledby]': 'ariaLabelledBy() || (title() ? titleId() : null)',
        '[attr.aria-describedby]': 'ariaDescribedBy()',
        '[attr.aria-orientation]': 'ariaOrientation()',
        '[attr.tabindex]': 'active() ? 0 : null'
    },
    template: `
        @if (title()) {
            <span
                #titleElement
                fdTitle
                role="heading"
                [headerSize]="4"
                [attr.aria-level]="headingLevel()"
                [attr.title]="title()"
                [id]="titleId()"
                class="min-w-[6.25rem] shrink truncate text-sap-group-title-font-size text-sap-group-title-text-color"
                >{{ title() }}</span
            >
        }
        <ng-content />
        @if (overflown().length) {
            @if (!hasFlexibleSpacer()) {
                <fd-toolbar-spacer />
            }
            <fd-toolbar-separator />
            <fd-popover placement="bottom-end" [(isOpen)]="overflowOpen">
                <fd-popover-control>
                    <button
                        fdButton
                        variant="transparent"
                        glyph="overflow"
                        aria-haspopup="true"
                        [ariaLabel]="moreLabel()"
                        [attr.title]="moreLabel()"
                    ></button>
                </fd-popover-control>
                <fd-popover-body><div #slot></div></fd-popover-body>
            </fd-popover>
        }
        <div hidden>
            <div
                #panel
                data-toolbar-overflow
                class="scrollbar-sap box-border flex max-h-[50vh] max-w-full flex-col overflow-auto px-2 py-1 [--tb-sep-h:1px] compact:max-w-80 compact:px-1.5 compact:py-[0.1875rem]"
            ></div>
        </div>
    `
})
export class Toolbar {
    readonly id = input(`fd-toolbar-${nextId}`);
    readonly titleId = input(`fd-toolbar-title-${nextId++}`);
    readonly fdType = input<ToolbarType>('solid');
    readonly title = input<string | null | undefined>();
    readonly headingLevel = input(2);
    /** Interactive info toolbar. */
    readonly active = input(false, { transform: booleanAttribute });
    readonly clearBorder = input(false, { transform: booleanAttribute });
    /** Moves the items that do not fit into the overflow popover. */
    readonly shouldOverflow = input(false, { transform: booleanAttribute });
    /** Moves all items into the overflow popover. */
    readonly forceOverflow = input(false, { transform: booleanAttribute });
    readonly moreLabel = input('More');
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly ariaDescribedBy = input<string | null | undefined>();
    readonly ariaOrientation = input<'horizontal' | 'vertical'>('horizontal');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly overflowOpen = model(false);

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly items = contentChildren(FD_TOOLBAR_ITEM, { descendants: true });
    private readonly spacers = contentChildren(ToolbarSpacer, { descendants: true });
    private readonly separators = contentChildren(ToolbarSeparator, { descendants: true });
    private readonly projectedTitle = contentChild(Title, { read: ElementRef });
    private readonly titleElement = viewChild('titleElement', { read: ElementRef });
    private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
    private readonly slot = viewChild<ElementRef<HTMLElement>>('slot');
    private readonly checker = inject(InteractivityChecker);

    readonly overflown = signal<ToolbarItem[]>([]);
    private readonly measure = signal(0);
    private readonly placeholders = new Map<ToolbarItem, Comment>();

    protected readonly hasFlexibleSpacer = computed(() => this.spacers().some((spacer) => !spacer.fixed()));

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const observer = new ResizeObserver(() => this.measure.update((n) => n + 1));
            observer.observe(this.elementRef.nativeElement);
            const title = this.titleElement()?.nativeElement ?? this.projectedTitle()?.nativeElement;
            if (title) observer.observe(title);
            destroyRef.onDestroy(() => observer.disconnect());
        });
        // recompute the overflow when the size, items or options change
        effect(() => {
            this.measure();
            const items = this.items();
            const should = this.shouldOverflow();
            const force = this.forceOverflow();
            untracked(() =>
                this.overflown.set(
                    should ? toolbarOverflow(items, this.availableWidth(), this.titleWidth(), force) : []
                )
            );
        });
        // move overflown items into the panel and the others back to their places
        effect(() => {
            const overflown = this.overflown();
            const panel = this.panel().nativeElement;
            for (const item of this.items()) {
                if (!overflown.includes(item) && item.overflown()) this.restore(item);
            }
            for (const item of overflown) {
                if (!item.overflown()) {
                    const placeholder = document.createComment('fd-toolbar-item');
                    item.element.before(placeholder);
                    this.placeholders.set(item, placeholder);
                    item.overflown.set(true);
                }
                item.element.style.display = item.priority === 'disappear' ? 'none' : '';
                panel.appendChild(item.element);
            }
            if (!overflown.length) this.overflowOpen.set(false);
        });
        // show the panel in the popover while it is open
        effect(() => {
            const slot = this.slot()?.nativeElement;
            const panel = this.panel().nativeElement;
            if (slot) {
                slot.appendChild(panel);
                const first = [...panel.querySelectorAll<HTMLElement>('*')].find(
                    (el) => this.checker.isFocusable(el) && this.checker.isTabbable(el)
                );
                first?.focus();
            } else {
                this.elementRef.nativeElement.querySelector(':scope > [hidden]')?.appendChild(panel);
            }
        });
        destroyRef.onDestroy(() => this.items().forEach((item) => item.overflown() && this.restore(item)));
    }

    /** Recomputes the overflow, e.g. after items changed their width. */
    updateCollapsibleItems(): void {
        this.measure.update((n) => n + 1);
    }

    private restore(item: ToolbarItem): void {
        const placeholder = this.placeholders.get(item);
        placeholder?.replaceWith(item.element);
        this.placeholders.delete(item);
        item.element.style.display = '';
        item.overflown.set(false);
    }

    private availableWidth(): number {
        const host = this.elementRef.nativeElement;
        const compact = host.closest('[data-density]')?.getAttribute('data-density');
        const button = compact === 'compact' || compact === 'condensed' ? 32 : 36;
        return host.clientWidth - (button + 4 * ITEM_MARGIN + 1 + this.separators().length);
    }

    private titleWidth(): number {
        return (this.titleElement()?.nativeElement ?? this.projectedTitle()?.nativeElement)?.clientWidth ?? 0;
    }

    protected readonly computedClass = computed(() => {
        const type = this.fdType();
        const titled = !!this.title() || !!this.projectedTitle();
        return cn(
            'm-0 box-border flex h-(--tb-h) min-h-(--tb-h) items-center gap-2 py-0 ps-(--tb-ps) pe-2 [&>*]:shrink-0',
            'border-b border-solid border-sap-group-title-border-color font-sap-font-family text-sap-font-size',
            '[--tb-h:2.75rem] compact:[--tb-h:2rem] [--tb-sep-h:2rem] compact:[--tb-sep-h:1.5rem] [--tb-ps:0.5rem]',
            type === 'transparent' ? 'bg-transparent' : 'bg-sap-toolbar-background',
            type === 'info' && [
                'relative [--tb-h:2rem] compact:[--tb-h:2rem] bg-sap-infobar-non-interactive-background text-sap-list-text-color',
                '[&_fd-icon]:h-4 [&_fd-icon]:text-base [&_fd-icon]:leading-4 [&_fd-icon]:text-sap-list-text-color'
            ],
            type === 'info' &&
                this.active() && [
                    'cursor-pointer outline-none bg-sap-infobar-background text-sap-infobar-text-color [&_fd-icon]:text-sap-infobar-text-color',
                    'enabled-hover:bg-sap-infobar-hover-background active:bg-sap-infobar-active-background',
                    "focus:after:pointer-events-none focus:after:absolute focus:after:inset-0.5 focus:after:content-['']",
                    'focus:after:border-(length:--sapContent_FocusWidth) focus:after:[border-style:var(--sapContent_FocusStyle)] focus:after:border-sap-content-focus-color'
                ],
            titled && '[--tb-h:2.75rem] compact:[--tb-h:2.75rem] [--tb-ps:1rem] bg-sap-group-title-background',
            this.clearBorder() && 'border-b-0',
            this.userClass()
        );
    });
}
