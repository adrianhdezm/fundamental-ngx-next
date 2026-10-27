/*
 * Port of @fundamental-ngx/core (nested-list) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Directionality } from '@angular/cdk/bidi';
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    ElementRef,
    Injectable,
    InjectionToken,
    Injector,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChildren,
    effect,
    forwardRef,
    inject,
    input,
    model,
    signal,
    untracked,
    type Provider,
    type Signal
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon, type IconFont } from '@/ui/icon/icon';
import { Popover, PopoverBody, PopoverControl, type Placement } from '@/ui/popover/popover';

/** An item of a nested list built from data. */
export interface NestedListItem {
    /** Renders a group header instead of an item. */
    headerTitle?: string;
    list?: NestedListModel;
    link?: NestedListLink;
    expanded?: boolean;
}

export interface NestedListModel {
    textOnly?: boolean;
    items: NestedListItem[];
}

export interface NestedListLink {
    icon?: string;
    title: string;
    callback?: () => void;
    href?: string;
    selected?: boolean;
}

/** State shared by the lists of one navigation: condensed mode and the selected item. */
@Injectable()
export class NestedListState {
    /** First-level items show icons only and open their children in popovers. */
    readonly condensed = signal(false);
    /** Clicking an item selects it (and highlights its parents). */
    readonly selectable = signal(true);
    /** Id of the selected item; null until an item is clicked. */
    readonly selected = signal<string | null>(null);
}

/** Reuses the state of an enclosing list or navigation. */
export function provideNestedListState(): Provider {
    return {
        provide: NestedListState,
        useFactory: () => inject(NestedListState, { skipSelf: true, optional: true }) ?? new NestedListState()
    };
}

/** Marks the element whose rows the arrow keys move between, e.g. a side navigation. */
export const NESTED_LIST_SCOPE = new InjectionToken<true>('NestedListScope');

const SCOPE = 'data-nested-scope';
const FOCUSABLE = 'data-nested-focusable';

/** Arrow-key navigation over the visible rows of the scope of a row. */
function onRowKeydown(event: KeyboardEvent, item: NestedItem, rtl: boolean): void {
    const row = event.currentTarget as HTMLElement;
    const scope = row.closest(`[${SCOPE}]`) ?? row.closest('ul');
    const rows = [...(scope?.querySelectorAll<HTMLElement>(`[${FOCUSABLE}]`) ?? [])].filter(
        (el) => el.offsetParent !== null
    );
    const index = rows.indexOf(row);
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    switch (event.key) {
        case 'ArrowDown':
            rows[index + 1]?.focus();
            break;
        case 'ArrowUp':
            rows[index - 1]?.focus();
            break;
        case 'Home':
            rows[0]?.focus();
            break;
        case 'End':
            rows[rows.length - 1]?.focus();
            break;
        case forward:
            if (item.hasChildren() && !item.expanded()) item.open(true);
            break;
        case backward:
            if (item.hasChildren() && item.expanded()) item.close();
            else if (item.inPopover()) item.list.parentItem?.close(true);
            break;
        case 'Enter':
        case ' ':
            item.activate();
            break;
        default:
            return;
    }
    event.preventDefault();
}

/** Classes of a row: a link, or the content of an item with children. */
function rowClass(item: NestedItem | null, selected: boolean, childContainer: boolean): string {
    return cn(
        'relative m-0 box-border flex h-(--nl-h) w-full cursor-pointer items-center p-0 ps-(--nl-pl) pe-(--nl-pr) no-underline',
        'border-0 border-t border-solid border-sap-list-border-color bg-(--nl-bg) text-start outline-none',
        '[--nl-bg:var(--sapList_Background)] hover:[--nl-bg:var(--sapList_Hover_Background)]',
        'focus-visible:outline-sap focus-visible:-outline-offset-[0.1875rem]',
        'active:[--nl-bg:var(--sapList_Active_Background)] active:[--nl-fg:var(--sapList_Active_TextColor)]',
        (item?.first() || (item?.list.level() ?? 1) > 1) && 'border-t-0',
        item?.inPopover() && item.first() && 'rounded-t-sap-popover-border-corner-radius',
        item?.inPopover() && item.last() && 'rounded-b-sap-popover-border-corner-radius',
        selected &&
            'border-b border-b-sap-list-selection-border-color not-active:[--nl-bg:var(--sapList_SelectionBackgroundColor)] not-active:hover:[--nl-bg:var(--sapList_Hover_SelectionBackground)]',
        childContainer && 'justify-between ps-0 pe-0'
    );
}

let nextListId = 0;

/**
 * A list of navigation items that can nest: items open their child lists with an expand button or
 * the arrow keys, and clicking an item selects it.
 *
 * ```html
 * <ul fd-nested-list>
 *     <li fd-nested-list-item>
 *         <a fd-nested-list-link><i fd-nested-list-icon glyph="home"></i><span fd-nested-list-title>Home</span></a>
 *     </li>
 * </ul>
 * ```
 */
@Directive({
    selector: '[fd-nested-list], [fdNestedList]',
    exportAs: 'fdNestedList',
    providers: [provideNestedListState()],
    host: {
        '[attr.id]': 'id()',
        '[attr.role]': 'role()',
        '[attr.aria-roledescription]': 'roleDescription()',
        '[attr.aria-hidden]': 'hidden() || null',
        '[attr.data-level]': 'level()',
        '[attr.data-nested-scope]': 'scope ? "" : null',
        '[attr.data-text-only]': 'isTextOnly() ? "" : null',
        '[style.--nl-pl]': 'indent()',
        '[class]': 'computedClass()'
    }
})
export class NestedList {
    /** Items without icons; titles align with the padding. */
    readonly textOnly = input(false, { transform: booleanAttribute });
    readonly ariaRoledescriptionTree = input('Navigation List Tree');
    readonly ariaRoledescriptionMenuBar = input('Navigation List Menu Bar');
    /** Added to the names of selected items when items are not selectable. */
    readonly ariaLabelSelected = input('Selected');
    readonly id = input(`fd-nested-list-${nextListId++}`);
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly state = inject(NestedListState);
    /** The item whose children this list is. */
    readonly parentItem: NestedItem | null = inject(
        forwardRef(() => NestedItem),
        { optional: true }
    );
    /** The popover of the parent item in condensed mode. */
    readonly inPopover = !!inject(
        forwardRef(() => NestedListPopover),
        { optional: true }
    );
    /** A list at the top of its own navigation handles the arrow keys of its rows. */
    protected readonly scope = !this.parentItem && !inject(NESTED_LIST_SCOPE, { optional: true });
    private readonly projected = contentChildren<NestedItem>(forwardRef(() => NestedItem));
    readonly items: Signal<readonly NestedItem[]> = computed(() => this.projected().filter((i) => i.list === this));
    readonly header = contentChildren(forwardRef(() => NestedListHeader));

    readonly level: Signal<number> = computed(() => {
        const level = this.parentItem ? this.parentItem.list.level() + 1 : 1;
        return this.state.condensed() ? Math.min(level, 2) : level;
    });
    /** A collapsed parent hides its list. */
    readonly hidden = computed(() => !!this.parentItem && !this.inPopover && !this.parentItem.expanded());
    protected readonly role = computed(() => (this.level() > 1 || this.inPopover ? 'group' : 'tree'));
    protected readonly roleDescription = computed(() =>
        this.role() === 'tree'
            ? this.state.condensed()
                ? this.ariaRoledescriptionMenuBar()
                : this.ariaRoledescriptionTree()
            : null
    );

    protected readonly isTextOnly = computed(() => this.textOnly() || this.inPopover);
    /** Rows of further levels are indented: 2.75rem on the second level, 1rem more on each further one. */
    protected readonly indent = computed(() => {
        const level = this.level();
        if (this.inPopover) return '1rem';
        return level > 1 ? `${level - 2 + 2.75}rem` : this.isTextOnly() ? '1rem' : '0rem';
    });

    protected readonly computedClass = computed(() => {
        const level = this.level();
        return cn(
            'm-0 box-border block w-full list-none p-0 font-sap-font-family',
            '[--nl-h:2.75rem] [--nl-title:var(--sapFontLargeSize)] [--nl-icon:var(--sapFontHeader4Size)] [--nl-pr:0] [--nl-fg:var(--sapList_TextColor)]',
            'compact:[--nl-h:2rem] compact:[--nl-title:var(--sapFontSize)] compact:[--nl-icon:var(--sapFontLargeSize)]',
            level === 1 && !this.inPopover && 'border-b border-solid border-sap-list-border-color',
            this.hidden() && 'hidden',
            this.userClass()
        );
    });

    constructor() {
        effect(() => {
            const parent = this.parentItem;
            if (parent) untracked(() => parent.childList.set(this));
        });
    }
}

let nextItemId = 0;

/** An item of a nested list: a link, or a content row with an expand button and a child list. */
@Directive({
    selector: '[fd-nested-list-item], [fdNestedItem]',
    exportAs: 'fdNestedItem',
    host: {
        role: 'none',
        '[attr.title]': 'list.state.condensed() && list.level() === 1 ? titleText() || null : null',
        class: 'm-0 box-border block p-0 bg-sap-list-background'
    }
})
export class NestedItem {
    /** Shows the child list; two-way bindable. */
    readonly expanded = model(false);
    readonly id = `fd-nested-item-${nextItemId++}`;

    readonly list: NestedList = inject(NestedList);
    readonly childList = signal<NestedList | null>(null);
    readonly link = signal<NestedLink | null>(null);
    readonly content = signal<NestedListContent | null>(null);
    readonly popover = signal<NestedListPopover | null>(null);
    private readonly direction = inject(Directionality, { optional: true });
    private readonly injector = inject(Injector);

    readonly rtl = computed(() => this.direction?.valueSignal() === 'rtl');
    readonly hasChildren = computed(() => !!this.childList() || !!this.popover());
    readonly first = computed(() => this.list.items()[0] === this);
    readonly last = computed(() => this.list.items().at(-1) === this);
    readonly inPopover = computed(() => this.list.inPopover);
    readonly titleText = computed(() => this.link()?.title() ?? '');

    /** Selected: the clicked item or one of its parents; before any click, the `selected` inputs. */
    readonly selected: Signal<boolean> = computed(() => {
        const state = this.list.state;
        const id = state.selected();
        if (state.selectable() && id !== null) return this.containsId(id);
        return !!(this.content()?.selected() || this.link()?.selected());
    });

    containsId(id: string): boolean {
        return (
            id === this.id ||
            !!this.childList()
                ?.items()
                .some((item) => item.containsId(id))
        );
    }

    /** The focusable row of the item. */
    row(): HTMLElement | null {
        return this.content()?.el ?? this.link()?.el ?? null;
    }

    focus(): void {
        this.row()?.focus();
    }

    toggle(): void {
        this.expanded.update((v) => !v);
    }

    /** Opens the child list; from the keyboard, a popover moves the focus into it. */
    open(fromKeyboard = false): void {
        this.expanded.set(true);
        const popover = this.popover();
        if (fromKeyboard && popover)
            afterNextRender(() => requestAnimationFrame(() => popover.focusFirst()), { injector: this.injector });
    }

    close(restoreFocus = false): void {
        this.expanded.set(false);
        if (restoreFocus) this.focus();
    }

    /** Selects the item and runs its link. */
    activate(): void {
        const link = this.link();
        if (link && this.content()) link.el.click();
        else this.row()?.click();
    }

    select(): void {
        if (this.list.state.selectable()) this.list.state.selected.set(this.id);
    }
}

/**
 * The row of an item with children: a link and an expand button.
 *
 * ```html
 * <div fd-nested-list-content>
 *     <a fd-nested-list-link><span fd-nested-list-title>Settings</span></a>
 *     <button fd-nested-list-expand-icon></button>
 * </div>
 * ```
 */
@Directive({
    selector: '[fd-nested-list-content], [fdNestedListContent]',
    host: {
        tabindex: '0',
        role: 'treeitem',
        [FOCUSABLE]: '',
        '[attr.aria-level]': 'item?.list?.level() ?? null',
        '[attr.aria-expanded]': 'item?.hasChildren() ? !!item?.expanded() : null',
        '[attr.aria-selected]': 'item?.list?.state?.selectable() ? !!item?.selected() : null',
        '[attr.aria-haspopup]': 'item?.popover() ? "tree" : null',
        '[class]': 'computedClass()',
        '(click)': 'item?.select()',
        '(keydown)': 'onKeydown($event)'
    }
})
export class NestedListContent {
    /** Shows the row as selected before any item is clicked. */
    readonly selected = input(false, { transform: booleanAttribute });
    readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly item = inject(NestedItem, { optional: true });
    protected readonly computedClass = computed(() =>
        rowClass(this.item, !!this.item?.selected(), !!this.item?.hasChildren())
    );

    constructor() {
        this.item?.content.set(this);
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.target === this.el && this.item) onRowKeydown(event, this.item, this.item.rtl());
    }
}

/**
 * The link of an item. Inside `[fd-nested-list-content]` it is not focusable itself; the content is.
 */
@Directive({
    selector: '[fd-nested-list-link], [fdNestedLink]',
    host: {
        '[attr.tabindex]': 'standalone() ? 0 : -1',
        '[attr.role]': 'standalone() ? "treeitem" : null',
        '[attr.data-nested-focusable]': 'standalone() ? "" : null',
        '[attr.aria-level]': 'standalone() ? (item?.list?.level() ?? null) : null',
        '[attr.aria-selected]': 'standalone() && item?.list?.state?.selectable() ? !!item?.selected() : null',
        '[attr.aria-expanded]': 'standalone() && item?.hasChildren() ? !!item?.expanded() : null',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.aria-describedby]': 'ariaDescribedby() ?? headerId()',
        '[class]': 'computedClass()',
        '(click)': 'onClick()',
        '(keydown)': 'onKeydown($event)'
    }
})
export class NestedLink {
    /** Called when the link is clicked. */
    readonly onClickCallback = input<(() => void) | null | undefined>(null);
    /** Shows the link as selected before any item is clicked. */
    readonly selected = model(false);
    readonly ariaDescribedby = input<string | null | undefined>();

    readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly item = inject(NestedItem, { optional: true });
    private readonly content = inject(NestedListContent, { optional: true });
    private readonly titleEl = contentChildren(forwardRef(() => NestedListTitle));
    /** A link outside a content row is the row (also when rendered into the row from a template). */
    protected readonly standalone = computed(() => !this.content && !this.item?.content());

    readonly title = computed(() => this.titleEl()[0]?.text() ?? '');
    /** The last group header above the item describes it. */
    protected readonly headerId = computed(() => {
        const list = this.item?.list;
        if (!list) return null;
        const header = list.header();
        return header.length ? header[header.length - 1].id() : null;
    });
    protected readonly ariaLabel = computed(() => {
        const list = this.item?.list;
        const selected = !!list && !list.state.selectable() && this.selected();
        return this.title() ? `${this.title()}${selected ? `, ${list!.ariaLabelSelected()}` : ''}` : null;
    });
    protected readonly computedClass = computed(() =>
        this.standalone()
            ? rowClass(this.item, !!this.item?.selected(), false)
            : 'm-0 box-border flex h-full min-w-0 flex-1 items-center p-0 ps-(--nl-pl) no-underline outline-none bg-transparent cursor-pointer'
    );

    constructor() {
        this.item?.link.set(this);
    }

    protected onClick(): void {
        this.item?.select();
        this.onClickCallback()?.();
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (this.standalone() && event.target === this.el && this.item) onRowKeydown(event, this.item, this.item.rtl());
    }
}

/** The text of a link. */
@Directive({
    selector: '[fd-nested-list-title], [fdNestedListTitle]',
    host: { '[class]': 'computedClass()' }
})
export class NestedListTitle {
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly item = inject(NestedItem, { optional: true });
    readonly text = signal('');
    /** Condensed first-level items show their icon only. */
    protected readonly computedClass = computed(() => {
        const list = this.item?.list;
        const iconOnly = !!list?.state.condensed() && list.level() === 1 && !list.inPopover;
        return cn(
            'm-0 box-border flex h-full w-full min-w-0 items-center truncate p-0 pe-4 text-start',
            'text-(length:--nl-title) leading-[normal] text-(--nl-fg)',
            // without an icon the title starts after the icon column, or at the padding of text-only lists
            'first:ps-11 in-data-[text-only]:first:ps-0',
            iconOnly && 'sr-only-sap'
        );
    });

    constructor() {
        afterNextRender(() => this.text.set(this.el.textContent?.trim() ?? ''));
    }
}

/** The icon of a link. */
@Component({
    selector: '[fd-nested-list-icon], [fdNestedListIcon]',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'presentation',
        'aria-hidden': 'true',
        class: 'm-0 box-border flex h-full min-w-11 shrink-0 items-center justify-center p-0 not-italic text-(length:--nl-icon) text-(--nl-fg)'
    },
    template: '<fd-icon [glyph]="glyph()" [font]="font()" />'
})
export class NestedListIcon {
    readonly glyph = input<string | null | undefined>();
    readonly font = input<IconFont>('SAP-icons');
}

let nextHeaderId = 0;

/** A group header between items. */
@Directive({
    selector: '[fd-nested-list-header], [fdNestedListHeader]',
    host: {
        role: 'presentation',
        '[attr.id]': 'id()',
        '[class]': 'state?.condensed() ? "hidden" : headerClass'
    }
})
export class NestedListHeader {
    readonly id = input(`fd-nested-list-group-header-${nextHeaderId++}`);
    /** Condensed navigations have no room for headers. */
    protected readonly state = inject(NestedListState, { optional: true });
    protected readonly headerClass =
        'm-0 box-border flex h-11 items-end truncate whitespace-nowrap border-0 border-b border-solid border-sap-list-group-header-border-color bg-sap-list-group-header-background px-4 font-sap-font-family text-sap-font-size leading-8 font-bold text-sap-list-group-header-text-color';
}

/** The button that expands and collapses the child list of an item. */
@Component({
    selector: '[fd-nested-list-expand-icon], [fdNestedListExpandIcon]',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        type: 'button',
        tabindex: '-1',
        'aria-hidden': 'true',
        '[class]': 'iconOnly() ? "hidden" : buttonClass',
        '(click)': 'onClick($event)'
    },
    template: '<ng-content /><fd-icon [glyph]="glyph()" />'
})
export class NestedListExpandIcon {
    private readonly item = inject(NestedItem, { optional: true });
    protected readonly buttonClass =
        'm-0 box-border flex h-full min-w-10 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-sap-font-large-size text-sap-content-icon-color outline-none [[data-nested-focusable]:active_&]:text-sap-list-active-text-color';
    /** Condensed first-level items open a popover and show no arrow. */
    protected readonly iconOnly = computed(() => {
        const list = this.item?.list;
        return !!list?.state.condensed() && list.level() === 1 && !list.inPopover;
    });
    protected readonly glyph = computed(() =>
        this.item?.expanded()
            ? 'navigation-down-arrow'
            : this.item?.rtl()
              ? 'navigation-left-arrow'
              : 'navigation-right-arrow'
    );

    protected onClick(event: MouseEvent): void {
        event.stopPropagation();
        this.item?.toggle();
    }
}

/**
 * In a condensed navigation, opens the child list of a first-level item in a popover to the side,
 * with the item title as its header.
 */
@Component({
    selector: 'fd-nested-list-popover',
    imports: [Popover, PopoverControl, PopoverBody],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `
        <fd-popover
            class="block w-full"
            [placement]="placement()"
            [triggers]="['click']"
            [noArrow]="false"
            [focusAutoCapture]="false"
            [bodyRole]="null"
            [isOpen]="item?.expanded() ?? false"
            (isOpenChange)="item?.expanded?.set($event)"
        >
            <fd-popover-control>
                <ng-content
                    select="[fd-nested-list-link], [fdNestedLink], [fd-nested-list-content], [fdNestedListContent]"
                />
            </fd-popover-control>
            <fd-popover-body>
                <div #body ${SCOPE} class="min-w-48 font-sap-font-family">
                    <div
                        aria-hidden="true"
                        class="m-0 box-border flex h-11 items-center truncate rounded-t-sap-popover-border-corner-radius px-4 font-sap-font-family text-sap-font-large-size font-bold text-sap-list-text-color shadow-[0_0_0.25rem_0_var(--sapContent_ShadowColor),inset_0_-0.0625rem_0_0_var(--sapList_BorderColor)] compact:h-8 compact:text-sap-font-size"
                    >
                        {{ title() || item?.titleText() }}
                    </div>
                    <ng-content select="[fd-nested-list], [fdNestedList], fd-prepared-nested-list" />
                </div>
            </fd-popover-body>
        </fd-popover>
    `
})
export class NestedListPopover {
    /** Header of the popover; the item title by default. */
    readonly title = input('');
    protected readonly item = inject(NestedItem, { optional: true });
    private readonly direction = inject(Directionality, { optional: true });
    protected readonly placement = computed<Placement>(() =>
        this.direction?.valueSignal() === 'rtl' ? 'left-start' : 'right-start'
    );

    constructor() {
        this.item?.popover.set(this);
    }

    /** Focuses the first row of the open popover. */
    focusFirst(): void {
        const rows = this.item?.childList()?.items() ?? [];
        rows[0]?.focus();
    }
}

/**
 * A nested list built from a model, including group headers, child lists and, in condensed mode,
 * popovers for the first level.
 */
@Component({
    selector: 'fd-prepared-nested-list',
    imports: [
        NgTemplateOutlet,
        NestedList,
        NestedItem,
        NestedLink,
        NestedListTitle,
        NestedListIcon,
        NestedListHeader,
        NestedListContent,
        NestedListExpandIcon,
        NestedListPopover,
        forwardRef(() => PreparedNestedList)
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'contents' },
    template: `
        <ul fd-nested-list [textOnly]="!!list()?.textOnly">
            @for (item of list()?.items ?? []; track item) {
                @if (item.headerTitle) {
                    <li fd-nested-list-header>{{ item.headerTitle }}</li>
                } @else {
                    <li fd-nested-list-item [expanded]="!!item.expanded" (expandedChange)="item.expanded = $event">
                        @if (item.list && condensed() && first()) {
                            <fd-nested-list-popover [title]="item.link?.title || ''">
                                <div fd-nested-list-content [selected]="!!item.link?.selected">
                                    <ng-container
                                        [ngTemplateOutlet]="link"
                                        [ngTemplateOutletContext]="{ $implicit: item }"
                                    />
                                    <button fd-nested-list-expand-icon></button>
                                </div>
                                <fd-prepared-nested-list [first]="false" [list]="item.list" />
                            </fd-nested-list-popover>
                        } @else if (item.list) {
                            <div fd-nested-list-content>
                                <ng-container
                                    [ngTemplateOutlet]="link"
                                    [ngTemplateOutletContext]="{ $implicit: item }"
                                />
                                <button fd-nested-list-expand-icon></button>
                            </div>
                            <fd-prepared-nested-list [first]="false" [list]="item.list" />
                        } @else {
                            <ng-container [ngTemplateOutlet]="link" [ngTemplateOutletContext]="{ $implicit: item }" />
                        }
                        <ng-template #link let-item>
                            @if (item.link; as l) {
                                <a
                                    fd-nested-list-link
                                    [onClickCallback]="l.callback"
                                    [selected]="!item.list && !!l.selected"
                                    [attr.href]="l.href ?? null"
                                >
                                    @if (l.icon) {
                                        <span fd-nested-list-icon [glyph]="l.icon"></span>
                                    }
                                    <span fd-nested-list-title>{{ l.title }}</span>
                                </a>
                            }
                        </ng-template>
                    </li>
                }
            }
        </ul>
    `
})
export class PreparedNestedList {
    readonly list = input<NestedListModel | null | undefined>();
    /** Whether this is the first level (popovers in condensed mode). */
    readonly first = input(true, { transform: booleanAttribute });
    readonly condensed = input(false, { transform: booleanAttribute });
}
