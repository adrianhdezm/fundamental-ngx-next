/*
 * Port of @fundamental-ngx/core (tabs) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    ElementRef,
    InjectionToken,
    Injector,
    TemplateRef,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    effect,
    forwardRef,
    inject,
    input,
    output,
    signal,
    untracked,
    viewChild,
    viewChildren,
    type Signal
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon, type IconFont } from '@/ui/icon/icon';
import { Menu, MenuInteractive, MenuItem, MenuTitle, MenuTrigger } from '@/ui/menu/menu';
import {
    OverflowExpand,
    OverflowItemRef,
    OverflowLayout,
    OverflowLayoutItem
} from '@/ui/overflow-layout/overflow-layout';
import { ScrollSpy } from '@/ui/scroll-spy/scroll-spy';

export type TabModes = 'icon-only' | 'process' | 'filter';
export type TabSizes = 's' | 'm' | 'l' | 'xl' | 'xxl';
export type TabItemState = 'success' | 'error' | 'warning' | 'information' | 'neutral';

/** What the parts of tabs know about their container. */
export interface TabsContext {
    readonly mode: Signal<TabModes | null | undefined>;
    readonly stackContent?: Signal<boolean>;
}

export const FD_TABS = new InjectionToken<TabsContext>('FdTabs');

/** The selection bar under a tab: shown while its tab (`group/tab`) is selected. */
const SELECTION_BAR = [
    "after:absolute after:-start-[0.1875rem] after:inline-block after:h-[0.188rem] after:w-[calc(100%+0.375rem)] after:rounded-t-[0.125rem] after:content-['']",
    'after:transition-all after:duration-150 after:ease-in hc:after:h-[0.313rem]',
    'group-aria-selected/tab:after:bg-(--tab-bar,var(--sapContent_Selected_ForegroundColor))'
].join(' ');

/** The focus frame of a tab, drawn around its tag or icon. */
const FOCUS_FRAME =
    "group-focus-visible/tab:before:absolute group-focus-visible/tab:before:inset-0 group-focus-visible/tab:before:content-[''] group-focus-visible/tab:before:outline-(length:--sapContent_FocusWidth) group-focus-visible/tab:before:[outline-style:var(--sapContent_FocusStyle)] group-focus-visible/tab:before:outline-sap-content-focus-color group-focus-visible/tab:before:outline-offset-(--sapContent_FocusWidth)";

/** The title of a tab as a template: `<ng-template fdTabTitleTemplate>`. */
@Directive({ selector: '[fdTabTitleTemplate], [fd-tab-title-template]' })
export class TabTitle {
    readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

/** The text of a tab, with the selection bar. */
@Directive({
    selector: '[fdTabTag], [fd-tab-tag]',
    host: { '[class]': 'computedClass' }
})
export class TabTag {
    protected readonly computedClass = cn(
        'relative m-0 inline-block p-0 leading-4 whitespace-nowrap text-(--tab-tag,var(--sapContent_LabelColor)) group-aria-selected/tab:text-(--tab-tag-selected,var(--sapContent_Selected_ForegroundColor)) after:-bottom-[0.875rem]',
        SELECTION_BAR,
        FOCUS_FRAME
    );
}

/** A count of a tab. */
@Directive({
    selector: '[fdTabCount], [fd-tab-count]',
    host: { '[class]': 'computedClass()' }
})
export class TabCount {
    private readonly tabs = inject(FD_TABS, { optional: true });
    protected readonly computedClass = computed(() => {
        const mode = this.tabs?.mode();
        return cn(
            'm-0 p-0 pb-0.5 leading-4 text-sap-content-label-color',
            mode && 'text-sap-font-small-size',
            (mode === 'icon-only' || mode === 'filter') && 'absolute start-[calc(100%+0.1875rem)] top-0'
        );
    });
}

/** The round icon of a tab in icon-only, filter and process modes, with an optional count inside. */
@Component({
    selector: '[fd-tab-icon], [fdTabIcon]',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `
        @if (icon()) {
            <fd-icon [glyph]="icon()!" [font]="iconFont()" class="text-[length:var(--tabs-icon-size,1.125rem)]" />
        }
        <ng-content />
    `
})
export class TabIcon {
    readonly icon = input<string | null | undefined>();
    readonly iconFont = input<IconFont>('SAP-icons');
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tabs = inject(FD_TABS, { optional: true });
    protected readonly computedClass = computed(() => {
        const mode = this.tabs?.mode();
        return cn(
            'relative mx-[0.188rem] my-0 box-border flex size-(--tabs-icon-height) items-center justify-center rounded-full bg-transparent p-0',
            '[--tabs-icon-height:2.625rem] compact:[--tabs-icon-height:1.875rem]',
            'border-[length:0.125rem] border-solid border-(--tab-icon,var(--sapContent_Selected_ForegroundColor)) text-(--tab-icon,var(--sapContent_Selected_ForegroundColor))',
            'group-aria-selected/tab:bg-(--tab-icon,var(--sapSelectedColor)) group-aria-selected/tab:text-sap-content-contrast-icon-color',
            FOCUS_FRAME,
            mode === 'filter' ? 'mb-1.5' : [SELECTION_BAR, 'after:-bottom-[1.0625rem]'],
            this.userClass()
        );
    });
}

/** A label of a tab (filter and process modes). */
@Directive({
    selector: '[fdTabLabel], [fd-tab-label]',
    host: { '[class]': 'computedClass()' }
})
export class TabLabel {
    private readonly tabs = inject(FD_TABS, { optional: true });
    protected readonly computedClass = computed(() => {
        const mode = this.tabs?.mode();
        return cn(
            'm-0 block max-w-full p-0 ps-0.5 text-sap-font-small-size text-sap-content-label-color first:pb-1.5 compact:first:pb-1',
            mode === 'filter' && 'truncate leading-[0.875rem]',
            mode === 'process' && 'max-w-[7.5rem] overflow-hidden leading-[0.875rem] whitespace-nowrap'
        );
    });
}

/** The texts of a tab in process mode. */
@Directive({ selector: '[fdTabProcess], [fd-tab-process]', host: { class: 'm-0 p-0' } })
export class TabProcess {}

/** The header of a filter tab bar: a large count and a label. */
@Directive({
    selector: '[fdTabHeader], [fd-tab-header]',
    host: { class: 'm-0 flex items-center p-0 [&_[fd-tab-label]]:max-w-16 [&_[fdTabLabel]]:max-w-16' }
})
export class TabHeader {}

/** The large count of a filter tab bar header. */
@Directive({
    selector: '[fdTabCounterHeader], [fd-tab-counter-header]',
    host: { class: 'm-0 p-0 pe-2 text-[1.5rem] leading-6 text-sap-content-label-color' }
})
export class TabCounterHeader {}

/** The arrow between process tabs. */
@Component({
    selector: '[fdTabProcessIcon], [fd-tab-process-icon]',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'm-0 flex px-2 py-0 text-[1rem] leading-none text-sap-content-non-interactive-icon-color',
        'aria-hidden': 'true'
    },
    template: '<fd-icon glyph="process" />'
})
export class TabProcessIcon {}

/** A vertical line after a filter tab bar header. */
@Directive({
    selector: '[fdTabSeparator], [fd-tab-separator]',
    host: {
        class: 'm-0 mx-1 h-8 border-0 border-e border-solid border-sap-group-title-border-color p-0 leading-8',
        'aria-hidden': 'true'
    }
})
export class TabSeparator {}

/** An item of a tab bar: holds a tab link and sets its value state colours. */
@Directive({
    selector: '[fd-tab-item], [fdTabItem]',
    host: { '[class]': 'computedClass()' }
})
export class TabItem {
    readonly tabItemState = input<TabItemState | null | undefined>();
    /** The header of a filter tab bar. */
    readonly header = input(false, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tabs = inject(FD_TABS, { optional: true });

    protected readonly computedClass = computed(() => {
        const mode = this.tabs?.mode();
        const state = this.tabItemState();
        return cn(
            'relative m-0 mx-1 shrink-0 p-0 first:ms-0',
            !mode && '[&:first-child>[role=tab]]:ms-[0.1875rem] [&:first-child>[role=tab]]:ps-0',
            mode === 'process' && 'my-0 ms-0 me-1 flex items-center',
            mode === 'filter' && ['m-0 px-1 py-0', this.header() ? 'w-auto' : 'w-[5.375rem]'],
            state && STATE_VARS[state],
            this.disabled() && 'pointer-events-none opacity-(--sapContent_DisabledOpacity)',
            this.userClass()
        );
    });
}

/** Colours of a tab with a value state: text (the readable text colour), icon and selection bar. */
const STATE_VARS: Record<TabItemState, string> = {
    success:
        '[--tab-tag:var(--sapPositiveTextColor)] [--tab-tag-selected:var(--sapPositiveTextColor)] [--tab-icon:var(--sapSuccessColor)] [--tab-bar:var(--sapSuccessColor)]',
    error: '[--tab-tag:var(--sapNegativeTextColor)] [--tab-tag-selected:var(--sapNegativeTextColor)] [--tab-icon:var(--sapErrorColor)] [--tab-bar:var(--sapErrorColor)]',
    warning:
        '[--tab-tag:var(--sapCriticalTextColor)] [--tab-tag-selected:var(--sapCriticalTextColor)] [--tab-icon:var(--sapWarningColor)] [--tab-bar:var(--sapWarningColor)]',
    information:
        '[--tab-tag:var(--sapInformativeTextColor)] [--tab-tag-selected:var(--sapInformativeTextColor)] [--tab-icon:var(--sapInformationColor)] [--tab-bar:var(--sapInformationColor)]',
    neutral:
        '[--tab-tag:var(--sapNeutralTextColor)] [--tab-tag-selected:var(--sapNeutralTextColor)] [--tab-icon:var(--sapNeutralColor)] [--tab-bar:var(--sapNeutralColor)]'
};

/** A tab: the clickable part of a tab item, e.g. a router link. */
@Directive({
    selector: '[fd-tab-link], [fdTabLink]',
    host: {
        role: 'tab',
        '[attr.aria-selected]': 'active()',
        '[attr.aria-disabled]': 'disabled() || null',
        '[attr.tabindex]': 'tabbable() ? 0 : -1',
        '[class]': 'computedClass()',
        '(focus)': 'focused.emit()'
    }
})
export class TabLink {
    readonly active = input(false, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    readonly focused = output<void>();

    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    /** Set by the container: the one tab in the tab order. */
    readonly tabbable = signal(false);
    private readonly tabs = inject(FD_TABS, { optional: true });

    focus(): void {
        this.element.focus();
    }

    protected readonly computedClass = computed(() => {
        const mode = this.tabs?.mode();
        return cn(
            'group/tab relative m-0 block cursor-pointer px-3 py-[0.875rem] leading-4 text-sap-content-label-color no-underline outline-none',
            (mode === 'icon-only' || mode === 'process') && 'py-4',
            mode === 'process' && 'flex items-center px-0',
            mode === 'filter' && [
                'flex h-(--tabs-filter-height) flex-col items-center justify-center px-[0.188rem] pt-[0.875rem] pb-[0.625rem] text-center',
                '[--tabs-filter-height:5.5rem] compact:[--tabs-filter-height:4.75rem]',
                SELECTION_BAR,
                'after:bottom-0'
            ],
            this.userClass()
        );
    });
}

/**
 * A tab bar of links, e.g. for router navigation:
 * `<nav fd-tab-nav><div fd-tab-item><a fd-tab-link [active]="rla.isActive" routerLink="a">...`.
 * Left and Right move between the links, which form one tab stop.
 */
@Component({
    selector: '[fd-tab-nav], [fdTabNav]',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: FD_TABS, useExisting: forwardRef(() => TabNav) }],
    host: {
        role: 'tablist',
        '[class]': 'computedClass()',
        '(keydown)': 'onKeydown($event)',
        '(focusin)': 'onFocusin($event)'
    },
    template: '<ng-content />'
})
export class TabNav implements TabsContext {
    readonly mode = input<TabModes | null | undefined>();
    readonly size = input<TabSizes>('m');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly links = contentChildren(TabLink, { descendants: true });
    private readonly focusedLink = signal<TabLink | null>(null);

    constructor() {
        // one tab stop: the focused, the active or the first enabled link
        effect(() => {
            const links = this.links();
            const stop =
                (this.focusedLink() && links.includes(this.focusedLink()!) ? this.focusedLink() : null) ??
                links.find((l) => l.active() && !l.disabled()) ??
                links.find((l) => !l.disabled());
            untracked(() => links.forEach((l) => l.tabbable.set(l === stop)));
        });
    }

    /** Clicks the link at an index. */
    selectTab(index: number): void {
        this.links()[index]?.element.click();
    }

    protected onFocusin(event: FocusEvent): void {
        const link = this.links().find((l) => l.element === event.target);
        if (link) this.focusedLink.set(link);
    }

    protected onKeydown(event: KeyboardEvent): void {
        moveFocus(
            event,
            this.links().filter((l) => !l.disabled()),
            (l) => l.element
        );
    }

    protected readonly computedClass = computed(() => tabBarClass(this.mode(), this.size(), this.userClass()));
}

/**
 * A tab of a tab list: its title (or `fdTabTitleTemplate`), count, icon and state, and the
 * content shown while it is selected.
 */
@Component({
    selector: 'fd-tab',
    exportAs: 'fdTab',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'tabpanel',
        '[id]': 'panelId()',
        '[attr.aria-labelledby]': 'id()',
        '[attr.tabindex]': 'expanded() && !list?.stackContent() ? 0 : null',
        '[class]': 'computedClass()'
    },
    template: `
        @if (expanded()) {
            <ng-content />
        }
    `
})
export class TabPanel {
    readonly id = input(`fd-tab-${nextId++}`);
    readonly title = input<string | null | undefined>();
    readonly count = input<string | number | null | undefined>();
    readonly glyph = input<string | null | undefined>();
    /** The header of a filter tab bar. */
    readonly header = input(false, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly tabState = input<TabItemState | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly opened = output<void>();
    readonly closed = output<void>();

    readonly titleTemplate = contentChild(TabTitle);
    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    protected readonly list = inject(
        forwardRef(() => TabList),
        { optional: true }
    );

    readonly panelId = computed(() => `${this.id()}-panel`);
    readonly expanded = computed(() => !!this.list?.isExpanded(this));

    constructor() {
        let previous = false;
        effect(() => {
            const expanded = this.expanded();
            if (expanded !== previous) {
                previous = expanded;
                untracked(() => (expanded ? this.opened.emit() : this.closed.emit()));
            }
        });
    }

    /** Selects (or, in collapsible tab lists, collapses) this tab. */
    open(open = true): void {
        this.list?.expandTab(this, open);
    }

    protected readonly computedClass = computed(() =>
        cn('m-0 block p-0 outline-none', !this.expanded() && 'hidden', this.userClass())
    );
}

let nextId = 0;

/**
 * Tab list: a tab bar for the `fd-tab` panels and the content of the selected one. Tabs that do
 * not fit go into a "More" menu. With `stackContent` all panels show one below the other and the
 * tabs scroll to them and follow the scrolling. Left and Right move between the tabs (one tab
 * stop), Enter and Space select.
 *
 * ```html
 * <fd-tab-list>
 *     <fd-tab title="Info">Information</fd-tab>
 *     <fd-tab title="Notes" count="3">Notes</fd-tab>
 * </fd-tab-list>
 * ```
 */
@Component({
    selector: 'fd-tab-list',
    exportAs: 'fdTabList',
    imports: [
        NgTemplateOutlet,
        OverflowLayout,
        OverflowItemRef,
        OverflowExpand,
        TabItem,
        TabLink,
        TabTag,
        TabCount,
        TabIcon,
        TabLabel,
        TabProcess,
        TabHeader,
        TabCounterHeader,
        TabProcessIcon,
        TabSeparator,
        Menu,
        MenuItem,
        MenuInteractive,
        MenuTitle,
        MenuTrigger,
        ScrollSpy,
        Icon
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: FD_TABS, useExisting: forwardRef(() => TabList) }],
    host: { '[class]': 'computedClass()' },
    template: `
        <div [class]="barClass()" (keydown)="onKeydown($event)" (focusin)="onFocusin($event)">
            <fd-overflow-layout
                ariaRole="tablist"
                class="min-w-0"
                [ariaLabel]="ariaLabel()"
                [enableKeyboardNavigation]="false"
                [maxVisibleItems]="collapseOverflow() ? maxVisibleTabs() : infinity"
                [renderShowMoreButton]="collapseOverflow()"
                (visibleItemsCount)="visibleItemsCount.emit($event)"
                (hiddenItemsCount)="hiddenItemsCount.emit($event)"
            >
                @for (tab of tabs(); track tab; let last = $last) {
                    <div
                        *fdOverflowItemRef="tab; let hidden; forceVisibility: tab === forcedTab() || tab === selected()"
                        class="flex items-center"
                    >
                        <div
                            fd-tab-item
                            [header]="tab.header()"
                            [tabItemState]="tab.tabState()"
                            [disabled]="tab.disabled()"
                        >
                            <a
                                fd-tab-link
                                [id]="tab.id()"
                                [active]="isActive(tab)"
                                [disabled]="tab.disabled()"
                                [attr.aria-controls]="tab.panelId()"
                                [attr.aria-label]="tab.ariaLabel() || null"
                                [attr.aria-labelledby]="
                                    !tab.ariaLabel() && tab.ariaLabelledBy() ? tab.ariaLabelledBy() : null
                                "
                                (click)="onTabClick(tab)"
                                (keydown.enter)="$event.preventDefault(); onTabClick(tab)"
                                (keydown.space)="$event.preventDefault(); onTabClick(tab)"
                            >
                                <ng-container
                                    [ngTemplateOutlet]="titleTpl"
                                    [ngTemplateOutletContext]="{ $implicit: tab }"
                                />
                            </a>
                            @if (mode() === 'process' && !last) {
                                <span fd-tab-process-icon></span>
                            }
                        </div>
                        @if (tab.header()) {
                            <div fd-tab-separator></div>
                        }
                    </div>
                }
                <ng-template fdOverflowExpand let-hidden>
                    <button
                        type="button"
                        [class]="moreClass"
                        [fdMenuTrigger]="moreMenu"
                        [attr.aria-label]="moreLabel()"
                    >
                        <span>{{ moreLabel() }}</span>
                        <fd-icon glyph="slim-arrow-down" />
                    </button>
                    <fd-menu #moreMenu placement="bottom-end">
                        @for (ref of hidden; track ref) {
                            <li fd-menu-item (onSelect)="onOverflowSelect($any(ref.fdOverflowItemRef()))">
                                <div fd-menu-interactive>
                                    <span fd-menu-title>{{
                                        $any(ref.fdOverflowItemRef()).title() || $any(ref.fdOverflowItemRef()).count()
                                    }}</span>
                                </div>
                            </li>
                        }
                    </fd-menu>
                </ng-template>
            </fd-overflow-layout>
        </div>
        <div
            #content
            fdScrollSpy
            [trackedTags]="['fd-tab']"
            [scrollSpyDisabled]="!stackContent() || spyPaused()"
            [attr.tabindex]="stackContent() ? 0 : null"
            [attr.role]="stackContent() ? 'region' : null"
            [attr.aria-label]="stackContent() ? ariaLabel() || null : null"
            [class]="contentClass()"
            [style.max-height]="maxContentHeight()"
            (spyChange)="onSpyChange($event)"
        >
            <ng-content />
        </div>

        <ng-template #titleTpl let-tab>
            @if (tab.titleTemplate(); as custom) {
                <ng-container [ngTemplateOutlet]="custom.templateRef" />
            } @else {
                @switch (mode()) {
                    @case ('filter') {
                        @if (tab.header()) {
                            <span fd-tab-header>
                                @if (tab.count() != null) {
                                    <span fd-tab-counter-header>{{ tab.count() }}</span>
                                }
                                @if (tab.title()) {
                                    <span fd-tab-label>{{ tab.title() }}</span>
                                }
                            </span>
                        } @else {
                            <span fd-tab-icon [icon]="tab.glyph()">
                                @if (tab.count() != null) {
                                    <span fd-tab-count>{{ tab.count() }}</span>
                                }
                            </span>
                            <span fd-tab-label>{{ tab.title() }}</span>
                        }
                    }
                    @case ('icon-only') {
                        <span fd-tab-icon [icon]="tab.glyph()">
                            @if (tab.count() != null) {
                                <span fd-tab-count>{{ tab.count() }}</span>
                            }
                        </span>
                        @if (!tab.ariaLabel() && tab.title()) {
                            <span class="sr-only-sap">{{ tab.title() }}</span>
                        }
                    }
                    @case ('process') {
                        @if (tab.glyph()) {
                            <span fd-tab-icon [icon]="tab.glyph()"></span>
                        }
                        <span fd-tab-process>
                            @if (tab.count() != null) {
                                <span fd-tab-label>{{ tab.count() }}</span>
                            }
                            @if (tab.title()) {
                                <span fd-tab-label>{{ tab.title() }}</span>
                            }
                        </span>
                    }
                    @default {
                        @if (tab.count() != null) {
                            <span fd-tab-count class="block">{{ tab.count() }}</span>
                        }
                        <span fd-tab-tag>{{ tab.title() }}</span>
                    }
                }
            }
        </ng-template>
    `
})
export class TabList implements TabsContext {
    readonly size = input<TabSizes>('m');
    readonly mode = input<TabModes | null | undefined>();
    /** Tabs that do not fit go into a "More" menu. */
    readonly collapseOverflow = input(true, { transform: booleanAttribute });
    readonly maxVisibleTabs = input(Number.POSITIVE_INFINITY);
    /** Shows all panels one below the other; the tabs scroll to them. */
    readonly stackContent = input(false, { transform: booleanAttribute });
    readonly maxContentHeight = input('100%');
    /** Clicking the selected tab collapses it. */
    readonly collapsibleTabs = input(false, { transform: booleanAttribute });
    /** Id of the tab selected first. */
    readonly defaultTab = input<string | null | undefined>();
    /** Selects the default tab again when the tabs change. */
    readonly selectDefaultOnTabsChange = input(false, { transform: booleanAttribute });
    /** Moves the focus into a stacked panel after scrolling to it. */
    readonly focusFirstFocusableElement = input(true, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null | undefined>();
    readonly moreLabel = input('More');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly selectedTabChange = output<TabPanel>();
    readonly selectedTabIndexChange = output<number>();
    readonly visibleItemsCount = output<number>();
    readonly hiddenItemsCount = output<number>();

    readonly tabs = contentChildren(TabPanel);
    private readonly links = viewChildren(TabLink);
    private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly injector = inject(Injector);

    protected readonly infinity = Number.POSITIVE_INFINITY;
    /** The selected tab (the one scrolled to in stacked mode). */
    readonly selected = signal<TabPanel | null>(null);
    /** A tab picked from the "More" menu stays visible. */
    protected readonly forcedTab = signal<TabPanel | null>(null);
    protected readonly spyPaused = signal(false);
    /** The tab that has (or last had) the focus. */
    private readonly focusedLink = signal<HTMLElement | null>(null);
    /** Whether the selected tab is the default one, not one chosen by the user or `selectTab()`. */
    private defaultSelected = false;

    constructor() {
        // one tab stop: the focused, the selected or the first enabled tab
        effect(() => {
            const links = this.links();
            const selected = this.selected();
            const focused = this.focusedLink();
            const stop =
                links.find((l) => l.element === focused && !l.disabled()) ??
                links.find((l) => l.active() && !l.disabled()) ??
                links.find((l) => !l.disabled());
            untracked(() => links.forEach((l) => l.tabbable.set(l === stop)));
            void selected;
        });
        // select the default (or first enabled) tab, also when the tabs change; the ids are tracked
        // because bound ids (e.g. in a @for) arrive after the tabs, and until a tab is chosen the
        // selection follows the default
        let previous: readonly TabPanel[] = [];
        effect(() => {
            const tabs = this.tabs();
            const defaultId = this.defaultTab();
            tabs.forEach((t) => t.id());
            untracked(() => {
                const changed = tabs !== previous;
                previous = tabs;
                const current = this.selected();
                const fallback =
                    tabs.find((t) => !t.disabled() && t.id() === defaultId) ?? tabs.find((t) => !t.disabled());
                const keep =
                    current &&
                    tabs.includes(current) &&
                    !(changed && this.selectDefaultOnTabsChange()) &&
                    !(this.defaultSelected && fallback !== current);
                if (keep) return;
                if (fallback && fallback !== current) this.select(fallback, false);
                this.defaultSelected = !!fallback;
            });
        });
    }

    /** Whether a panel shows its content. */
    isExpanded(tab: TabPanel): boolean {
        if (this.stackContent()) return !tab.disabled();
        return this.selected() === tab;
    }

    /** Whether a tab is the selected one. */
    isActive(tab: TabPanel): boolean {
        return this.selected() === tab;
    }

    /** Selects a tab by its id. */
    selectTab(id: string | null | undefined): void {
        const tab = this.tabs().find((t) => t.id() === id || t.panelId() === id);
        if (tab) this.expandTab(tab, true);
    }

    /** Selects a tab; `expand = false` collapses it in collapsible tab lists. */
    expandTab(tab: TabPanel, expand: boolean): void {
        if (tab.disabled()) return;
        this.defaultSelected = false;
        if (!expand) {
            if (this.collapsibleTabs() && this.selected() === tab) {
                this.selected.set(null);
                this.emitChange(tab);
            }
            return;
        }
        this.select(tab, true);
    }

    protected onTabClick(tab: TabPanel): void {
        if (this.collapsibleTabs() && this.selected() === tab && !this.stackContent()) this.expandTab(tab, false);
        else this.expandTab(tab, true);
    }

    protected onOverflowSelect(tab: TabPanel): void {
        this.forcedTab.set(tab);
        this.expandTab(tab, true);
        afterNextRender(() => document.getElementById(tab.id())?.focus(), { injector: this.injector });
    }

    protected onSpyChange(element: HTMLElement | undefined): void {
        const tab = this.tabs().find((t) => t.elementRef.nativeElement === element);
        if (tab && tab !== this.selected()) {
            this.defaultSelected = false;
            this.selected.set(tab);
            this.emitChange(tab);
        }
    }

    protected onFocusin(event: FocusEvent): void {
        const target = event.target as HTMLElement;
        if (target.getAttribute('role') === 'tab') this.focusedLink.set(target);
    }

    /** Left and Right (and Home and End) move between the visible tabs. */
    protected onKeydown(event: KeyboardEvent): void {
        const links = [...this.host.querySelectorAll<HTMLElement>('[role=tab]:not([aria-disabled=true])')];
        moveFocus(event, links, (l) => l);
    }

    private select(tab: TabPanel, scroll: boolean): void {
        const changed = this.selected() !== tab;
        this.selected.set(tab);
        if (this.stackContent() && scroll) this.scrollTo(tab);
        if (changed) this.emitChange(tab);
        this.focusedLink.set(null);
    }

    private emitChange(tab: TabPanel): void {
        this.selectedTabChange.emit(tab);
        this.selectedTabIndexChange.emit(this.tabs().indexOf(tab));
    }

    /** The element that scrolls the panels. */
    scrollElement(): HTMLElement {
        return this.content().nativeElement;
    }

    private scrollTo(tab: TabPanel): void {
        afterNextRender(
            () => {
                const container = this.content().nativeElement;
                const panel = tab.elementRef.nativeElement;
                this.spyPaused.set(true);
                container.scrollTo({ top: panel.offsetTop, behavior: 'smooth' });
                setTimeout(() => this.spyPaused.set(false), 600);
                if (this.focusFirstFocusableElement()) {
                    panel
                        .querySelector<HTMLElement>(
                            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                        )
                        ?.focus({ preventScroll: true });
                }
            },
            { injector: this.injector }
        );
    }

    protected readonly computedClass = computed(() => cn('flex h-full flex-col', this.userClass()));
    protected readonly barClass = computed(() => cn(tabBarClass(this.mode(), this.size(), ''), 'shrink-0 flex-nowrap'));
    protected readonly contentClass = computed(() =>
        cn('min-h-0 grow overflow-y-auto scrollbar-sap', this.stackContent() && 'relative')
    );
    protected readonly moreClass =
        'ms-auto flex cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-[0.875rem] font-sap-font-family text-sap-font-size leading-4 text-sap-content-label-color outline-none focus-visible:outline-sap';
}

/** Classes of a tab bar. */
function tabBarClass(mode: TabModes | null | undefined, size: TabSizes, userClass: ClassValue): string {
    return cn(
        'm-0 flex items-center bg-sap-object-header-background p-0 font-sap-font-family text-sap-font-size text-sap-content-label-color shadow-sap-content-header-shadow',
        size === 's' ? 'px-4' : size === 'xl' || size === 'xxl' ? 'px-12' : 'px-8',
        userClass
    );
}

/** Moves the focus between tabs with Left, Right, Home and End, wrapping around. */
function moveFocus<T>(event: KeyboardEvent, items: T[], element: (item: T) => HTMLElement): void {
    const elements = items.map(element).filter((el) => el.offsetParent !== null);
    const index = elements.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    const rtl = getComputedStyle(elements[index]).direction === 'rtl';
    let next = -1;
    if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next = (index + 1) % elements.length;
    else if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) next = (index - 1 + elements.length) % elements.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = elements.length - 1;
    else return;
    event.preventDefault();
    elements[next].focus();
}
