/*
 * Port of @fundamental-ngx/core (vertical-navigation, list-navigation-item) with the visual design of
 * fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { FocusKeyManager, type FocusableOption } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    Injector,
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
    type Signal
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon } from '@/ui/icon/icon';

/**
 * Vertical navigation: the side navigation of SAP Fiori, with icons, texts, second-level items and
 * an indicator for the current page. Condensed, it shows the icons only and opens second-level
 * items in a panel over the content. Up and Down move between the visible items, Right and Left
 * (mirrored in RTL) expand and collapse, Enter and Space toggle.
 *
 * ```html
 * <fd-vertical-navigation>
 *     <li fd-list-navigation-item [indicated]="true">
 *         <fd-icon glyph="home" /><span fd-list-navigation-item-text>Overview</span>
 *     </li>
 *     <li fd-list-navigation-item>
 *         <fd-icon glyph="calendar" /><span fd-list-navigation-item-text>Calendar</span>
 *         <button fd-list-navigation-item-arrow></button>
 *         <ul fd-list><li fd-list-navigation-item><span fd-list-navigation-item-text>Today</span></li></ul>
 *     </li>
 * </fd-vertical-navigation>
 * ```
 */
@Component({
    selector: 'fd-vertical-navigation',
    exportAs: 'fdVerticalNavigation',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block h-full', '(keydown)': 'onKeydown($event)' },
    template: `
        <div [class]="navClass()">
            <nav class="m-0 box-border p-0" [attr.aria-label]="ariaLabel()">
                <ul role="tree" class="m-0 box-border w-full list-none p-0">
                    <ng-content />
                </ul>
            </nav>
        </div>
    `
})
export class VerticalNavigation {
    /** Shows the icons only. */
    readonly condensed = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input('Main Navigation');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly items = contentChildren<ListNavigationItem>(
        forwardRef(() => ListNavigationItem),
        { descendants: true }
    );
    /** The item reachable with Tab: the last focused visible one, or the first. */
    private readonly active = signal<ListNavigationItem | null>(null);
    private keyManager: FocusKeyManager<ListNavigationItem> | null = null;
    private managed: readonly ListNavigationItem[] | null = null;

    readonly tabbable: Signal<ListNavigationItem | null> = computed(() => {
        const active = this.active();
        if (active && this.focusable(active)) return active;
        return this.items().find((i) => this.focusable(i)) ?? null;
    });

    protected readonly navClass = computed(() =>
        cn(
            'm-0 box-border flex h-full flex-col justify-between bg-sap-list-alternating-background p-0 font-sap-font-family shadow-sap-content-shadow0',
            this.condensed() ? 'w-[3.25rem]' : 'w-60',
            this.userClass()
        )
    );

    constructor() {
        inject(DestroyRef).onDestroy(() => this.keyManager?.destroy());
    }

    /** Visible items, without condensed parents whose panel is open (their children take the focus). */
    focusable(item: ListNavigationItem): boolean {
        return item.visible() && !(this.condensed() && item.expanded() && item.expandable());
    }

    /** Called by items when they receive focus. */
    itemFocused(item: ListNavigationItem): void {
        this.active.set(item);
        const manager = this.manager();
        const index = this.managed!.indexOf(item);
        if (index >= 0) manager.updateActiveItem(index);
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
        const manager = this.manager();
        const current = this.managed!.findIndex((i) => i.el === document.activeElement);
        if (current < 0) return;
        manager.updateActiveItem(current);
        manager.onKeydown(event);
        event.preventDefault();
        event.stopPropagation();
    }

    private manager(): FocusKeyManager<ListNavigationItem> {
        const items = this.items();
        if (!this.keyManager || this.managed !== items) {
            this.keyManager?.destroy();
            this.managed = items;
            this.keyManager = new FocusKeyManager<ListNavigationItem>([...items])
                .withVerticalOrientation()
                .withHomeAndEnd()
                .skipPredicate((item) => !this.focusable(item));
        }
        return this.keyManager;
    }
}

let nextTextId = 0;

/** The text of a navigation item. */
@Directive({
    selector: '[fd-list-navigation-item-text], [fdListNavigationItemText], [fdListNavigaitonItemText]',
    host: { '[attr.id]': 'id', '[class]': 'computedClass()' }
})
export class ListNavigationItemText {
    readonly id = `fd-list-navigation-item-text-${nextTextId++}`;
    readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly item = inject(
        forwardRef(() => ListNavigationItem),
        { optional: true }
    );
    protected readonly computedClass = computed(() => {
        const item = this.item;
        const child = !!item?.parent;
        const panel = !!item?.inPanel();
        return cn(
            'm-0 box-border inline-block max-w-36 truncate p-0 ps-1 align-middle font-sap-font-family text-(--vn-fg)',
            child ? 'ps-0 text-sap-font-size' : 'text-sap-font-large-size',
            'leading-11',
            // second-level texts start after the parent's icon column, or 1rem in when it has none
            child && (panel ? 'ms-4' : item?.parent?.hasIcon() ? 'ms-11' : 'ms-4'),
            // condensed: the icon shows, the text still names the item
            item?.condensedLevel() && !item.panelOpen() && 'sr-only-sap',
            // an expanded parent moves its padding to the row, keeping the text in place
            (item?.panelOpen() || (item?.expanded() && item.expandable())) && 'ps-0'
        );
    });
}

/** The arrow of an expandable navigation item. */
@Component({
    selector: '[fd-list-navigation-item-arrow], [fdListNavigationItemArrow], [fdListNavigaitonItemArrow]',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        tabindex: '-1',
        role: 'presentation',
        '[attr.aria-hidden]': 'ariaHidden()',
        '[class]': 'computedClass()'
    },
    template: `
        @if (!condensed()) {
            <fd-icon
                [glyph]="item?.expanded() ? 'navigation-down-arrow' : 'navigation-right-arrow'"
                class="rtl:-scale-x-100"
            />
        }
    `
})
export class ListNavigationItemArrow {
    readonly ariaHidden = input<boolean | null>(true);
    protected readonly item = inject(
        forwardRef(() => ListNavigationItem),
        { optional: true }
    );
    protected readonly condensed = computed(() => !!this.item?.condensedLevel());
    protected readonly computedClass = computed(() =>
        cn(
            'absolute end-0 top-0 m-0 box-border flex size-11 items-center justify-center border-none bg-transparent p-0 text-base text-(--vn-arrow) outline-none',
            // condensed: a small corner triangle
            this.condensed() &&
                "w-full before:absolute before:end-0 before:bottom-0 before:me-3 before:mb-[0.5625rem] before:size-0 before:border-solid before:border-transparent before:border-t-[0.25rem] before:border-e-[0.25rem] before:border-e-(--vn-arrow) before:content-[''] rtl:before:rotate-90",
            this.item?.panelOpen() && 'hidden'
        )
    );
}

let nextItemId = 0;

/**
 * An item of a vertical navigation: an icon, a text, and optionally an arrow with a list of
 * second-level items. `indicated` marks the current page.
 */
@Component({
    selector: '[fd-list-navigation-item], [fdListNavigationItem], [fdListNavigaitonItem]',
    exportAs: 'fdListNavigationItem',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'treeitem',
        '[attr.id]': 'id',
        '[attr.tabindex]': 'nav?.tabbable() === this ? 0 : -1',
        '[attr.aria-level]': 'parent ? 2 : 1',
        '[attr.aria-expanded]': 'expandable() ? expanded() : null',
        '[attr.aria-selected]': 'indicated()',
        '[class]': 'computedClass()',
        '(click)': 'onClick($event)',
        '(keydown)': 'onKeydown($event)',
        '(focus)': 'onFocus($event)'
    },
    template: `
        <div [class]="panelOpen() ? panelClass : 'contents'">
            <div [class]="panelOpen() ? panelHeaderClass : 'contents'">
                <ng-content />
            </div>
            <div [class]="panelOpen() ? panelListClass : 'contents'">
                <ng-content select="[fd-list], [fdList], ul" />
            </div>
        </div>
        @if (showIndicator()) {
            <span
                aria-hidden="true"
                class="pointer-events-none absolute end-0 top-0 h-11 w-[0.1875rem] rounded-sap-field-border-corner-radius bg-sap-selected-color"
            ></span>
        }
    `
})
export class ListNavigationItem implements FocusableOption {
    /** Shows the second-level items; two-way bindable. */
    readonly expanded = model(false);
    /** Marks the item of the current page. */
    readonly indicated = input(false, { transform: booleanAttribute });
    readonly id = `fd-list-navigation-item-${nextItemId++}`;

    readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly parent: ListNavigationItem | null = inject(ListNavigationItem, { optional: true, skipSelf: true });
    protected readonly nav = inject(VerticalNavigation, { optional: true });
    private readonly direction = inject(Directionality, { optional: true });
    private readonly injector = inject(Injector);
    readonly text = contentChild(ListNavigationItemText);
    private readonly icon = contentChild(Icon);
    private readonly arrow = contentChild(ListNavigationItemArrow);
    private readonly children = contentChildren<ListNavigationItem>(ListNavigationItem, { descendants: true });

    readonly hasIcon = computed(() => !!this.icon());
    /** Items with an arrow have second-level items. */
    readonly expandable = computed(() => !!this.arrow() || this.children().length > 0);
    /** Hidden inside a collapsed parent. */
    readonly visible: Signal<boolean> = computed(
        () => !this.parent || (this.parent.expanded() && this.parent.visible())
    );
    /** First-level item of a condensed navigation. */
    readonly condensedLevel = computed(() => !this.parent && !!this.nav?.condensed());
    /** Condensed and expanded: the second-level items show in a panel over the content. */
    readonly panelOpen = computed(() => this.condensedLevel() && this.expanded() && this.expandable());
    /** A second-level item shown in the panel of its condensed parent. */
    readonly inPanel = computed(() => !!this.parent?.panelOpen());
    /** The indicator marks the item, or its collapsed parent when a child is indicated. */
    protected readonly showIndicator = computed(
        () =>
            !this.panelOpen() &&
            ((this.indicated() && !(this.expandable() && this.expanded())) ||
                (!this.expanded() && this.children().some((c) => c.indicated())))
    );

    protected readonly panelClass = 'absolute start-[0.325rem] top-0 z-[3] flex cursor-default flex-col';
    protected readonly panelHeaderClass =
        'box-border flex h-11 w-[14.325rem] items-center whitespace-nowrap rounded-t-sap-element-border-corner-radius rounded-es-sap-element-border-corner-radius bg-sap-list-alternating-background ps-[0.875rem] shadow-sap-content-shadow1 rtl:ps-[0.875rem] [&>fd-icon]:mx-0! [&>fd-icon]:pe-2';
    protected readonly panelListClass =
        'ms-[2.925rem] box-border block w-[11.4rem] overflow-hidden rounded-b-sap-element-border-corner-radius bg-sap-list-alternating-background shadow-sap-content-shadow1';

    protected readonly computedClass = computed(() => {
        const child = !!this.parent;
        const expanded = this.expanded() && this.expandable();
        const condensed = this.condensedLevel();
        return cn(
            'relative m-0 box-border block h-11 cursor-pointer list-none bg-transparent ps-2 pe-4 whitespace-nowrap outline-none',
            '[--vn-fg:var(--sapList_TextColor)] [--vn-ic:var(--sapHighlightColor)] [--vn-arrow:var(--sapContent_NonInteractiveIconColor)]',
            '[&>div>div>fd-icon]:inline-flex [&>div>div>fd-icon]:h-11 [&>div>div>fd-icon]:w-9 [&>div>div>fd-icon]:items-center [&>div>div>fd-icon]:justify-center [&>div>div>fd-icon]:align-top [&>div>div>fd-icon]:text-base [&>div>div>fd-icon]:text-(--vn-ic)',
            // the focus frame covers the row, not the second-level items below it
            "focus-visible:before:pointer-events-none focus-visible:before:absolute focus-visible:before:inset-x-0 focus-visible:before:top-0 focus-visible:before:h-11 focus-visible:before:outline-sap focus-visible:before:-outline-offset-[0.3125rem] focus-visible:before:content-['']",
            this.indicated() && 'focus-visible:before:-outline-offset-[0.375rem]',
            '[&:hover:not(:has(li:hover))]:bg-sap-list-hover-background [&:hover:not(:has(li:hover))]:[--vn-ic:var(--sapList_TextColor)]',
            '[&:active:not(:has(li:active))]:bg-sap-list-active-background [&:active:not(:has(li:active))]:[--vn-fg:var(--sapContent_ContrastTextColor)] [&:active:not(:has(li:active))]:[--vn-ic:var(--sapContent_ContrastIconColor)] [&:active:not(:has(li:active))]:[--vn-arrow:var(--sapContent_ContrastIconColor)]',
            this.indicated() && [
                '[--vn-fg:var(--sapSelectedColor)] [--vn-ic:var(--sapSelectedColor)] [--vn-arrow:var(--sapSelectedColor)]',
                // the selected colour is too dark for text on high contrast black: keep the indicator, use the selected text colour
                'hc:[--vn-fg:var(--sapContent_Selected_TextColor)] hc:[--vn-ic:var(--sapContent_Selected_TextColor)] hc:[--vn-arrow:var(--sapContent_Selected_TextColor)]'
            ],
            child ? 'w-full' : 'border-0 border-solid border-sap-list-border-color not-last:border-b first:border-t',
            // expanded: the second-level list spans the full width below the row
            expanded &&
                !condensed &&
                'h-auto overflow-hidden ps-3 [&_ul]:-ms-3 [&_ul]:-me-4 [&_ul]:block [&_ul]:w-auto [&>div>div>fd-icon]:pe-2',
            !expanded && '[&_ul]:hidden',
            condensed && 'w-[3.25rem] ps-0 pe-0 [&>div>div>fd-icon]:mx-2',
            this.panelOpen() && 'overflow-visible'
        );
    });

    constructor() {
        // second-level lists are groups of the tree
        afterNextRender(() => {
            this.el
                .querySelectorAll(':scope > div > div > ul, :scope > ul')
                .forEach((ul) => ul.setAttribute('role', 'group'));
        });
        // a condensed panel closes on clicks outside it
        effect((onCleanup) => {
            if (!this.panelOpen()) return;
            const close = (event: MouseEvent) => {
                if (!this.el.contains(event.target as Node)) this.expanded.set(false);
            };
            untracked(() => setTimeout(() => document.addEventListener('click', close)));
            onCleanup(() => document.removeEventListener('click', close));
        });
    }

    focus(): void {
        this.el.focus();
    }

    getLabel(): string {
        return this.text()?.el.textContent?.trim() ?? '';
    }

    protected onFocus(event: FocusEvent): void {
        if (event.target === this.el) this.nav?.itemFocused(this);
    }

    protected onClick(event: MouseEvent): void {
        event.stopPropagation();
        if (this.expandable()) this.setExpanded(!this.expanded());
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.target !== this.el) return;
        const rtl = this.direction?.valueSignal() === 'rtl';
        const open = rtl ? 'ArrowLeft' : 'ArrowRight';
        const close = rtl ? 'ArrowRight' : 'ArrowLeft';
        if (event.key === open) {
            event.preventDefault();
            this.setExpanded(true);
        } else if (event.key === close) {
            event.preventDefault();
            if (this.expandable() && this.expanded()) this.setExpanded(false);
            else if (this.parent) this.parent.setExpanded(false);
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            if (this.expandable()) this.setExpanded(!this.expanded());
            else this.el.click();
        } else if (event.key === 'Escape' && this.parent?.panelOpen()) {
            event.preventDefault();
            this.parent.setExpanded(false);
        }
    }

    /** Expands (moving the focus to the first second-level item) or collapses (back to this item). */
    setExpanded(expanded: boolean): void {
        if (!this.expandable() || this.expanded() === expanded) return;
        this.expanded.set(expanded);
        afterNextRender(
            () => {
                if (expanded) this.children()[0]?.focus();
                else this.focus();
            },
            { injector: this.injector }
        );
    }
}

/** A group header between navigation items. */
@Directive({
    selector: '[fd-vertical-navigation-group-header], [fdVerticalNavigationGroupHeader]',
    host: {
        role: 'none',
        class: 'm-0 box-border flex h-11 items-end truncate border-0 border-b border-solid border-sap-list-group-header-border-color bg-sap-list-alternating-background px-4 pb-2 font-sap-font-family text-sap-font-size font-bold text-sap-list-group-header-text-color'
    }
})
export class VerticalNavigationGroupHeader {}
