/*
 * Port of @fundamental-ngx/core (shellbar) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Directionality } from '@angular/cdk/bidi';
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
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
    model,
    output,
    signal,
    untracked,
    viewChild,
    type Signal
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { ActionSheet, ActionSheetBody, ActionSheetControl, ActionSheetItem } from '@/ui/action-sheet/action-sheet';
import { Avatar, type ColorAccent } from '@/ui/avatar/avatar';
import { Button, ButtonBadge, type ButtonVariant } from '@/ui/button/button';
import type { IconFont } from '@/ui/icon/icon';
import { Menu, MenuAddon, MenuInteractive, MenuItem, MenuTitle, MenuTrigger } from '@/ui/menu/menu';
import type { Placement, PopoverFillMode } from '@/ui/popover/popover';

export type ShellbarSize = 's' | 'm' | 'l' | 'xl';
/** Minimum widths in px from which each size applies. */
export type ShellbarBreakpoints = Record<ShellbarSize, number>;
export type ShellbarGroup = 'product' | 'search' | 'actions';
export type ShellbarGroupFlexOptions = Partial<Record<ShellbarGroup, { shrink?: boolean; flexBasisAuto?: boolean }>>;

/** The signed-in user shown by a shellbar user menu. */
export interface ShellbarUser {
    initials?: string;
    image?: string;
    fullName?: string;
    colorAccent?: ColorAccent;
}

/** An item of a shellbar user menu. */
export interface ShellbarUserMenuItem {
    text: string;
    callback?: (event: MouseEvent) => void;
}

/** An item of a product menu. */
export interface ShellbarMenuItem {
    name: string;
    callback?: (event: MouseEvent) => void;
    link?: string;
    glyph?: string;
    /** Opens the link in a new tab. */
    newTab?: boolean;
}

const DEFAULT_BREAKPOINTS: ShellbarBreakpoints = { s: 0, m: 320, l: 600, xl: 1240 };

/**
 * Shell colours for transparent buttons inside the shellbar: the SAP button variables are mapped
 * to the shell variables, so every transparent button (actions, product switch, menus) follows them.
 */
const SHELL_BUTTON_VARS = [
    '[--sapButton_Lite_TextColor:var(--sapShell_InteractiveTextColor)]',
    '[--sapButton_Lite_Hover_Background:var(--sapShell_Hover_Background)]',
    '[--sapButton_Lite_Hover_TextColor:var(--sapShell_InteractiveTextColor)]',
    '[--sapButton_Lite_Active_Background:var(--sapShell_Active_Background)]',
    '[--sapButton_Active_TextColor:var(--sapShell_Active_TextColor)]',
    '[--sapButton_Selected_Background:var(--sapShell_Selected_Background)]',
    '[--sapButton_Selected_Hover_Background:var(--sapShell_Selected_Hover_Background)]',
    '[--sapButton_Selected_TextColor:var(--sapShell_Selected_TextColor)]',
    '[--sapButton_Selected_BorderColor:var(--sapButton_Lite_Active_BorderColor)]',
    '[--sapButton_Selected_Hover_BorderColor:var(--sapButton_Lite_Active_BorderColor)]'
].join(' ');

/** What the parts of a shellbar know about it. */
export interface ShellbarContext {
    readonly size: Signal<ShellbarSize>;
    readonly rtl: Signal<boolean>;
    /** Whether the search field is open from its button (or in place of everything on small screens). */
    readonly searchOpen: Signal<boolean>;
    readonly searchInCenter: Signal<boolean>;
    readonly hasSearch: Signal<boolean>;
    readonly hasContextArea: Signal<boolean>;
    readonly groupFlex: Signal<ShellbarGroupFlexOptions | null | undefined>;
    openSearch(): void;
    closeSearch(): void;
    /** Re-measures the bar and collapses what does not fit. */
    layout(): void;
}

export const FD_SHELLBAR = new InjectionToken<ShellbarContext>('FdShellbar');

/** Marks elements that collapse into the overflow menu when the actions do not fit. */
const COLLAPSIBLE = 'data-shellbar-collapsible';

/**
 * Shellbar: the top bar of an SAP application with the branding, an optional context area, a
 * search field and the actions, user menu and product switch. Its size (s, m, l, xl) follows its
 * width: actions that do not fit collapse into an overflow menu, context area items hide by
 * priority, and on small screens the search opens in place of everything else.
 *
 * ```html
 * <fd-shellbar>
 *     <fd-shellbar-branding interactiveBranding>
 *         <fd-shellbar-logo><img src="logo.svg" alt="Company" /></fd-shellbar-logo>
 *         <fd-shellbar-title>Product</fd-shellbar-title>
 *     </fd-shellbar-branding>
 *     <fd-shellbar-search placeholder="Search" />
 *     <fd-shellbar-actions>
 *         <fd-shellbar-action glyph="bell" label="Notifications" [notificationCount]="3" />
 *     </fd-shellbar-actions>
 * </fd-shellbar>
 * ```
 */
@Component({
    selector: 'fd-shellbar',
    exportAs: 'fdShellbar',
    imports: [NgTemplateOutlet, Button],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: FD_SHELLBAR, useExisting: forwardRef(() => Shellbar) }],
    host: { class: 'block' },
    template: `
        <div #bar data-density="cozy" [attr.data-size]="size()" [class]="barClass()">
            <div [class]="productClass()">
                @if (showNavigationButton() && !searchOpen()) {
                    @if (navigationButtonTemplate(); as tpl) {
                        <ng-container [ngTemplateOutlet]="tpl" />
                    } @else {
                        <button
                            fdButton
                            variant="transparent"
                            glyph="menu2"
                            [ariaLabel]="navigationButtonLabel()"
                            [attr.title]="navigationButtonLabel()"
                            (click)="navigationButtonClicked.emit($event)"
                        ></button>
                    }
                }
                @if (showBackButton() && !searchOpen()) {
                    <button
                        fdButton
                        variant="transparent"
                        [glyph]="rtl() ? 'slim-arrow-right' : 'nav-back'"
                        [ariaLabel]="backButtonLabel()"
                        [attr.title]="backButtonLabel()"
                        (click)="backButtonClicked.emit($event)"
                    ></button>
                }
                <ng-content select="fd-shellbar-branding" />
                <ng-content select="[fd-shellbar-side-nav], [fdShellbarSidenav]" />
                <ng-content select="fd-shellbar-logo" />
                <div [class]="hideTitles() ? 'hidden' : 'contents'">
                    <ng-content select="fd-shellbar-title" />
                    <ng-content select="fd-product-menu" />
                    <ng-content select="fd-shellbar-subtitle" />
                    <ng-content select="fd-shellbar-separator" />
                </div>
            </div>
            <div [class]="hideAll() ? 'hidden' : 'contents'">
                <ng-content select="fd-shellbar-context-area" />
            </div>
            @if (searchInCenter()) {
                <div [class]="centerClass()">
                    <div #center class="flex min-w-0 flex-1 justify-center"></div>
                    @if (hideAll()) {
                        <button fdButton variant="transparent" [label]="cancelLabel()" (click)="closeSearch()"></button>
                    }
                </div>
            }
            <div [class]="hideAll() ? 'hidden' : 'contents'">
                <ng-content select="fd-shellbar-actions" />
            </div>
            <div #holder hidden><ng-content select="fd-shellbar-search" /></div>
            <div hidden><ng-content /></div>
        </div>
    `
})
export class Shellbar implements ShellbarContext {
    /** Fixed size; follows the width when not set. */
    readonly sizeInput = input<ShellbarSize | null | undefined>(undefined, { alias: 'size' });
    /** Minimum widths of the sizes. */
    readonly breakpoints = input<ShellbarBreakpoints>(DEFAULT_BREAKPOINTS);
    readonly groupFlex = input<ShellbarGroupFlexOptions | null | undefined>();
    readonly showNavigationButton = input(false, { transform: booleanAttribute });
    /** Replaces the default navigation button. */
    readonly navigationButtonTemplate = input<TemplateRef<unknown> | null>(null);
    readonly showBackButton = input(false, { transform: booleanAttribute });
    readonly navigationButtonLabel = input('Navigation');
    readonly backButtonLabel = input('Back');
    readonly cancelLabel = input('Cancel');
    /** On small screens, keeps the search button and collapses all other actions. */
    readonly showSearchFieldOnSizeSmall = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly navigationButtonClicked = output<Event>();
    readonly backButtonClicked = output<Event>();

    private readonly bar = viewChild.required<ElementRef<HTMLElement>>('bar');
    private readonly center = viewChild<ElementRef<HTMLElement>>('center');
    private readonly holder = viewChild.required<ElementRef<HTMLElement>>('holder');
    private readonly contextArea = contentChild(forwardRef(() => ShellbarContextArea));
    private readonly actions = contentChild<ShellbarActions>(forwardRef(() => ShellbarActions));
    private readonly search = contentChild<ShellbarSearch>(forwardRef(() => ShellbarSearch));
    private readonly direction = inject(Directionality, { optional: true });
    private readonly injector = inject(Injector);
    private readonly width = signal(0);
    private readonly searchOpenState = signal(false);

    readonly rtl = computed(() => this.direction?.valueSignal() === 'rtl');
    readonly size = computed<ShellbarSize>(() => {
        const fixed = this.sizeInput();
        if (fixed) return fixed;
        const width = this.width();
        const points = this.breakpoints();
        const sizes = (Object.keys(points) as ShellbarSize[]).sort((a, b) => points[b] - points[a]);
        return sizes.find((s) => width >= points[s]) ?? 's';
    });
    readonly hasSearch = computed(() => !!this.search());
    readonly hasContextArea = computed(() => !!this.contextArea());
    readonly searchOpen = this.searchOpenState.asReadonly();
    readonly searchInCenter = computed(() => {
        if (!this.search()) return false;
        const size = this.size();
        return (size === 'xl' && !this.contextArea()) || (size === 's' && this.searchOpen());
    });
    /** On small screens the open search replaces everything else. */
    protected readonly hideAll = computed(() => this.size() === 's' && this.searchOpen());
    protected readonly hideTitles = computed(() => this.size() !== 'xl' && this.size() !== 'l' && this.searchOpen());

    protected readonly barClass = computed(() => {
        const size = this.size();
        return cn(
            'relative m-0 box-border flex h-[3.25rem] items-center justify-between gap-2 py-0',
            'bg-sap-shell-color shadow-[inset_0_-0.0625rem_0_0_var(--sapShell_BorderColor)] font-sap-font-family text-sap-font-size text-sap-shell-text-color',
            SHELL_BUTTON_VARS,
            this.showNavigationButton() ? 'ps-3.5 pe-4' : size === 's' ? 'px-4' : size === 'xl' ? 'px-12' : 'px-8',
            this.contextArea() && 'justify-start',
            this.userClass()
        );
    });
    protected readonly productClass = computed(() => {
        const flex = this.groupFlex()?.product;
        return cn(
            'order-1 m-0 box-border flex items-center justify-start gap-2 p-0',
            flex?.shrink && 'min-w-0 shrink grow-0',
            flex?.flexBasisAuto && 'basis-auto',
            this.hideAll() && 'hidden'
        );
    });
    protected readonly centerClass = computed(() => {
        const flex = this.groupFlex()?.search;
        return cn(
            'order-2 m-0 mx-2 box-border flex min-w-0 items-center justify-center gap-2 p-0',
            this.hideAll() && 'mx-0 flex-1',
            flex?.shrink && 'shrink grow-0',
            flex?.flexBasisAuto && 'basis-auto'
        );
    });

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const bar = this.bar().nativeElement;
            const observer = new ResizeObserver(() => {
                this.width.set(bar.getBoundingClientRect().width);
                this.layout();
            });
            observer.observe(bar);
            destroyRef.onDestroy(() => observer.disconnect());
        });
        // the search field moves between the hidden holder, the center group and the actions
        effect(() => {
            const search = this.search();
            const target = this.searchInCenter()
                ? this.center()?.nativeElement
                : this.searchOpen()
                  ? this.actions()?.searchOutlet().nativeElement
                  : this.holder().nativeElement;
            if (search && target && search.el.parentElement !== target) target.appendChild(search.el);
        });
        // a size change re-measures once the new layout is rendered
        effect(() => {
            this.size();
            this.searchInCenter();
            this.searchOpen();
            untracked(() => afterNextRender(() => this.layout(), { injector: this.injector }));
        });
    }

    openSearch(): void {
        this.searchOpenState.set(true);
        afterNextRender(() => this.search()?.focus(), { injector: this.injector });
    }

    closeSearch(): void {
        this.searchOpenState.set(false);
    }

    /**
     * Shows everything, then collapses what does not fit: the actions into the overflow menu, the
     * branding title, and the context area items by priority. A search opened in the actions
     * closes when even that is not enough.
     */
    layout(): void {
        const actions = this.actions();
        if (!actions) return;
        const branding = this.bar().nativeElement.querySelectorAll<HTMLElement>(
            'fd-shellbar-branding fd-shellbar-title'
        );
        branding.forEach((el) => (el.style.display = ''));
        this.contextArea()?.showAll();
        actions.setOverflow(this.size() === 's' && this.showSearchFieldOnSizeSmall());
        if (!this.exceeds()) return;
        actions.setOverflow(true);
        if (this.exceeds()) branding.forEach((el) => (el.style.display = 'none'));
        this.contextArea()?.hideWhile(() => this.exceeds());
        if (this.searchOpen() && !this.searchInCenter() && this.exceeds()) this.closeSearch();
    }

    /** Whether the end of the actions is past the end of the bar's content box. */
    private exceeds(): boolean {
        const bar = this.bar().nativeElement;
        const actions = this.actions()?.el;
        if (!actions) return false;
        const rect = bar.getBoundingClientRect();
        const style = getComputedStyle(bar);
        const own = actions.getBoundingClientRect();
        return this.rtl()
            ? own.left < rect.left + parseFloat(style.paddingLeft) - 0.5
            : own.right > rect.right - parseFloat(style.paddingRight) + 0.5;
    }
}

/**
 * The logo and title of the product, optionally interactive (a link to the home page). Bind
 * `(click)` on it for the navigation.
 */
@Component({
    selector: 'fd-shellbar-branding',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[attr.role]': 'interactiveBranding() ? "link" : null',
        '[attr.tabindex]': 'interactiveBranding() ? 0 : null',
        '[attr.aria-label]': 'ariaLabel()',
        '(keydown.enter)': 'onEnter($event)'
    },
    template: '<ng-content />'
})
export class ShellbarBranding {
    /** Shows hover and active states and makes the branding a focusable link. */
    readonly interactiveBranding = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null>(null);
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly shellbar = inject(FD_SHELLBAR, { optional: true });
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    protected readonly computedClass = computed(() => {
        const small = this.shellbar?.size() === 's' || this.shellbar?.size() === 'm';
        return cn(
            'm-0 box-border flex h-9 shrink-0 items-center gap-1 rounded-[0.375rem] py-0.5 ps-1 pe-2 outline-none',
            'border-width-sap-button-border-width border-solid border-sap-button-lite-border-color bg-sap-button-lite-background',
            small && 'gap-0',
            this.interactiveBranding()
                ? [
                      'cursor-pointer hover:border-sap-button-lite-hover-border-color hover:bg-sap-shell-hover-background',
                      'active:border-sap-button-lite-active-border-color active:bg-sap-button-lite-active-background',
                      'focus-visible:outline-(length:--sapContent_FocusWidth) focus-visible:-outline-offset-2 focus-visible:outline-sap-content-focus-color focus-visible:[outline-style:var(--sapContent_FocusStyle)]'
                  ]
                : 'cursor-auto',
            this.userClass()
        );
    });

    protected onEnter(event: Event): void {
        if (this.interactiveBranding() && event.target === this.el) this.el.click();
    }
}

/** The product logo: an image or SVG. */
@Component({
    selector: 'fd-shellbar-logo',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'relative m-0 box-border inline-flex h-8 max-h-8 shrink-0 items-center px-1 py-px align-middle [&>*]:block [&>*]:h-[1.875rem] [&>*]:max-w-16'
    },
    template: '<ng-content />'
})
export class ShellbarLogo {}

/** The product name; hidden on small shellbars. */
@Component({
    selector: 'fd-shellbar-title',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'shellbar?.size() === "s" ? "hidden" : "flex min-w-0"' },
    template: `<h1
        class="m-0 box-border truncate p-0 align-middle font-sap-font-semibold-duplex-family text-sap-font-header5-size font-normal text-sap-shell-sub-brand-text-color"
    >
        <ng-content />
    </h1>`
})
export class ShellbarTitle {
    protected readonly shellbar = inject(FD_SHELLBAR, { optional: true });
}

/** A second line of text next to the title; hidden on small shellbars. */
@Component({
    selector: 'fd-shellbar-subtitle',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'shellbar?.size() === "s" ? "hidden" : "flex min-w-0"' },
    template: `<div
        class="m-0 box-border truncate p-0 text-sap-font-small-size text-sap-object-header-subtitle-text-color"
    >
        <ng-content />
    </div>`
})
export class ShellbarSubtitle {
    protected readonly shellbar = inject(FD_SHELLBAR, { optional: true });
}

/** A vertical line between groups; hidden on small and medium shellbars. */
@Component({
    selector: 'fd-shellbar-separator',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'separator',
        'aria-orientation': 'vertical',
        '[class]': 'small() ? "hidden" : "m-0 box-border flex h-8 w-px shrink-0 bg-sap-toolbar-separator-color p-0"'
    },
    template: ''
})
export class ShellbarSeparator {
    private readonly shellbar = inject(FD_SHELLBAR, { optional: true });
    protected readonly small = computed(() => this.shellbar?.size() === 's' || this.shellbar?.size() === 'm');
}

/** A button that toggles the side navigation, placed before the branding. */
@Directive({ selector: '[fdShellbarSidenav], [fd-shellbar-side-nav]' })
export class ShellbarSidenav {}

/** Priority of a context area item: items with higher numbers hide first when space runs out. */
@Directive({
    selector: '[fdShellbarHidePriority]',
    host: { class: 'shrink-0' }
})
export class ShellbarHidePriority {
    readonly priority = input<number | string | null | undefined>(undefined, { alias: 'fdShellbarHidePriority' });
    readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
}

/**
 * Additional information after the branding: separators, menus, statuses or switches. Items hide
 * from the last (or by `fdShellbarHidePriority`) when the shellbar runs out of space.
 */
@Component({
    selector: 'fd-shellbar-context-area',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'group',
        '[attr.aria-label]': 'ariaLabel()',
        class: 'order-2 m-0 box-border flex min-w-0 flex-none items-center gap-2 p-0'
    },
    template: '<ng-content />'
})
export class ShellbarContextArea {
    readonly ariaLabel = input<string | null>('Additional information');
    /** Emits the items hidden for lack of space. */
    readonly contentItemVisibilityChange = output<HTMLElement[]>();
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly priorities = contentChildren(ShellbarHidePriority);
    private hidden: HTMLElement[] = [];

    showAll(): void {
        this.items().forEach((el) => (el.style.display = ''));
    }

    /** Hides items, highest priority number first, while the condition holds. */
    hideWhile(exceeds: () => boolean): void {
        const items = this.items();
        const hidden: HTMLElement[] = [];
        for (let i = items.length - 1; i >= 0 && exceeds(); i--) {
            items[i].style.display = 'none';
            hidden.push(items[i]);
        }
        const changed = hidden.length !== this.hidden.length || hidden.some((el) => !this.hidden.includes(el));
        this.hidden = hidden;
        if (changed) this.contentItemVisibilityChange.emit(hidden);
    }

    /** Children sorted by priority: the attribute value, or the position. */
    private items(): HTMLElement[] {
        return [...this.el.children]
            .map((el, index) => {
                const value = this.priorities()
                    .find((p) => p.el === el)
                    ?.priority();
                const priority = value === undefined || value === null || value === '' ? NaN : Number(value);
                return { el: el as HTMLElement, priority: isNaN(priority) ? index + 1 : priority };
            })
            .sort((a, b) => a.priority - b.priority)
            .map((i) => i.el);
    }
}

/**
 * A search field for the shellbar: a rounded input with clear and search buttons. On extra large
 * shellbars it sits in the middle; on smaller ones a search button opens it.
 */
@Component({
    selector: 'fd-shellbar-search',
    imports: [Button],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'search',
        '[class]': 'computedClass()'
    },
    template: `
        <input
            #input
            type="search"
            [class]="inputClass()"
            [attr.placeholder]="placeholder()"
            [attr.aria-label]="ariaLabel()"
            [value]="value()"
            (input)="value.set(input.value)"
            (keydown.enter)="submit()"
            (keydown.escape)="onEscape($event)"
        />
        @if (value()) {
            <button
                fdButton
                variant="transparent"
                glyph="decline"
                type="button"
                [ariaLabel]="clearLabel()"
                [class]="addonClass"
                (click)="clear()"
            ></button>
        }
        <button
            fdButton
            variant="transparent"
            glyph="search"
            type="button"
            [ariaLabel]="submitLabel()"
            [class]="submitClass()"
            (click)="submit()"
        ></button>
    `
})
export class ShellbarSearch {
    readonly value = model('');
    readonly placeholder = input<string | null>('Search');
    readonly ariaLabel = input<string | null>('Search');
    readonly clearLabel = input('Clear');
    readonly submitLabel = input('Search');
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    /** Emits the text on Enter or the search button. */
    readonly searchSubmit = output<string>();

    readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly shellbar = inject(FD_SHELLBAR, { optional: true });
    private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');

    protected readonly addonClass =
        'me-1 size-auto! h-(--sb-btn-h)! max-h-none! w-(--sb-btn-w)! min-w-(--sb-btn-w)! shrink-0 rounded-(--sb-btn-r)! px-0! focus:after:-inset-px focus:after:rounded-(--sb-btn-r)';

    protected readonly computedClass = computed(() => {
        const size = this.shellbar?.size();
        const center = this.shellbar?.searchInCenter();
        return cn(
            'relative m-0 box-border flex h-sap-element-height items-center border-none p-0',
            '[--sb-btn-w:1.75rem] [--sb-btn-h:var(--sapElement_Compact_Height)] [--sb-btn-r:1.063rem] hc:[--sb-btn-w:2.25rem] hc:[--sb-btn-h:var(--sapElement_Height)] hc:[--sb-btn-r:var(--sapButton_BorderCornerRadius)]',
            'rounded-[1.125rem] bg-sap-shell-interactive-background shadow-sap-field-shadow hc:rounded-none',
            'hover:bg-sap-shell-hover-background hover:shadow-sap-field-hover-shadow hc:hover:bg-transparent',
            'has-[input:focus]:bg-transparent has-[input:focus]:shadow-[0_0_0_0.125rem_var(--sapButton_Lite_Active_BorderColor)] hc:has-[input:focus]:shadow-none',
            size === 's'
                ? 'w-full max-w-full'
                : center
                  ? 'w-[25rem] max-w-[25rem]'
                  : size === 'm'
                    ? 'max-w-60'
                    : 'max-w-[25rem]',
            this.userClass()
        );
    });
    protected readonly inputClass = computed(() => {
        const center = this.shellbar?.searchInCenter() && this.shellbar.size() === 'xl';
        return cn(
            'm-0 box-border h-full min-w-0 flex-1 appearance-none border-none bg-transparent py-0 ps-3.5 pe-1 outline-none',
            'font-sap-font-family text-sap-font-size text-sap-field-text-color placeholder:text-sap-field-placeholder-text-color placeholder:italic',
            '[&::-webkit-search-cancel-button]:hidden',
            'hc:border-(length:--sapElement_BorderWidth) hc:border-solid hc:border-sap-shell-interactive-border-color hc:bg-sap-shell-interactive-background',
            'hc:hover:bg-sap-shell-hover-background hc:focus:border-(length:--sapContent_FocusWidth) hc:focus:[border-style:var(--sapContent_FocusStyle)] hc:focus:bg-sap-shell-active-background',
            center ? 'w-60' : this.shellbar?.size() === 'm' ? 'w-auto max-w-24' : 'w-auto'
        );
    });
    /** The search button turns emphasized while the field is focused and has text. */
    protected readonly submitClass = computed(() =>
        cn(
            this.addonClass,
            this.value() &&
                '[input:focus~&]:border-sap-button-emphasized-border-color [input:focus~&]:bg-sap-button-emphasized-background [input:focus~&]:text-sap-button-emphasized-text-color'
        )
    );

    focus(): void {
        this.input().nativeElement.focus();
    }

    protected submit(): void {
        const text = this.value();
        this.searchSubmit.emit(text);
        // an empty search closes the field opened from the search button
        if (!text) this.shellbar?.closeSearch();
    }

    protected clear(): void {
        this.value.set('');
        this.focus();
    }

    protected onEscape(event: Event): void {
        if (this.shellbar?.searchOpen()) {
            event.preventDefault();
            this.shellbar.closeSearch();
        }
    }
}

/**
 * An action button of the shellbar, with an optional notification count. Actions collapse into the
 * overflow menu when the shellbar runs out of space.
 */
@Component({
    selector: 'fd-shellbar-action',
    imports: [Button, ButtonBadge],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { [COLLAPSIBLE]: '', class: 'flex shrink-0' },
    template: `
        <button
            fdButton
            [variant]="fdType()"
            [glyph]="glyph()"
            [glyphFont]="glyphFont()"
            [toggled]="!!toggled()"
            [ariaLabel]="accessibleName()"
            [attr.title]="title() || ariaLabel() || label()"
            (click)="onClick($event)"
        >
            @if (notificationCount()) {
                <fd-button-badge aria-hidden="true" [content]="notificationCount()" />
            }
        </button>
    `
})
export class ShellbarAction {
    readonly glyph = input<string | null | undefined>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly callback = input<((event: MouseEvent) => void) | null | undefined>(null);
    /** Text of the action; also its name in the overflow menu. */
    readonly label = input('');
    readonly ariaLabel = input('');
    readonly title = input('');
    readonly notificationLabel = input<string | null | undefined>();
    readonly notificationCount = input<number | null | undefined>();
    readonly fdType = input<ButtonVariant>('transparent');
    readonly toggled = input<boolean | null | undefined>();

    readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    /** The name with the notifications, e.g. "Notifications, 5 unread". */
    protected readonly accessibleName = computed(() => {
        const name = this.ariaLabel() || this.label();
        const count = this.notificationCount();
        return count ? `${name}, ${this.notificationLabel() || count}` : name;
    });

    onClick(event: MouseEvent): void {
        this.callback()?.(event);
    }
}

/**
 * The actions of the shellbar: action buttons, the search button, the user menu and the product
 * switch. Actions that do not fit collapse into an overflow menu.
 */
@Component({
    selector: 'fd-shellbar-actions',
    imports: [
        Button,
        ButtonBadge,
        ActionSheet,
        ActionSheetControl,
        ActionSheetBody,
        ActionSheetItem,
        forwardRef(() => ShellbarUserMenu)
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `
        <div #searchOutlet class="flex min-w-0 empty:hidden"></div>
        <div #overflow class="hidden">
            <fd-action-sheet placement="bottom-end" #sheet>
                <fd-action-sheet-control>
                    <button
                        fdButton
                        variant="transparent"
                        glyph="overflow"
                        aria-haspopup="menu"
                        [ariaLabel]="
                            totalNotifications() ? overflowLabel() + ', ' + totalNotifications() : overflowLabel()
                        "
                        [attr.title]="overflowLabel()"
                    >
                        @if (totalNotifications()) {
                            <fd-button-badge aria-hidden="true" [content]="totalNotifications()" />
                        }
                    </button>
                </fd-action-sheet-control>
                <fd-action-sheet-body [ariaLabel]="overflowLabel()">
                    @if (searchInOverflow()) {
                        <li
                            fd-action-sheet-item
                            glyph="search"
                            [label]="searchLabel()"
                            (click)="shellbar?.openSearch(); sheet.isOpen.set(false)"
                        ></li>
                    }
                    @for (action of actions(); track action) {
                        <li
                            fd-action-sheet-item
                            [fdType]="action.fdType()"
                            [toggled]="action.toggled()"
                            [glyph]="action.glyph()"
                            [label]="action.label() || action.ariaLabel()"
                            (click)="action.onClick($event); sheet.isOpen.set(false)"
                        >
                            @if (action.notificationCount()) {
                                <fd-button-badge [content]="action.notificationCount()" />
                            }
                        </li>
                    }
                    @if (assistiveToolsCallback(); as callback) {
                        <li
                            fd-action-sheet-item
                            glyph="sys-help"
                            [label]="assistiveToolsLabel()"
                            (click)="callback($event); sheet.isOpen.set(false)"
                        ></li>
                    }
                </fd-action-sheet-body>
            </fd-action-sheet>
        </div>
        <ng-content />
        @if (showSearchButton()) {
            <div ${COLLAPSIBLE} class="flex shrink-0">
                <button
                    fdButton
                    variant="transparent"
                    glyph="search"
                    [ariaLabel]="searchLabel()"
                    [attr.title]="searchLabel()"
                    (click)="shellbar?.openSearch()"
                ></button>
            </div>
        }
        <ng-content select="fd-shellbar-action" />
        @if (user() && !userComponent()) {
            <fd-shellbar-user-menu [user]="user()!" [userMenu]="userMenu()" [closeOnSelect]="closePopoverOnSelect()" />
        }
        <ng-content select="fd-shellbar-user-menu" />
        <ng-content select="fd-user-menu" />
        <div class="ms-2 flex shrink-0 empty:hidden"><ng-content select="fd-product-switch" /></div>
        @if (assistiveTools()) {
            <div ${COLLAPSIBLE} class="flex shrink-0">
                <button
                    fdButton
                    variant="transparent"
                    glyph="sys-help"
                    [ariaLabel]="assistiveToolsLabel()"
                    [attr.title]="assistiveToolsLabel()"
                    (click)="assistiveToolsCallback()?.($event)"
                ></button>
            </div>
        }
    `
})
export class ShellbarActions {
    /** The user of a simple user menu (an avatar with a menu). */
    readonly user = input<ShellbarUser | null | undefined>();
    readonly userMenu = input<ShellbarUserMenuItem[] | null | undefined>();
    /** Closes the simple user menu when an item is chosen. */
    readonly closePopoverOnSelect = input(false, { transform: booleanAttribute });
    /** Shows a help button for assistive tools. */
    readonly assistiveTools = input(false, { transform: booleanAttribute });
    readonly assistiveToolsCallback = input<((event: MouseEvent) => void) | null | undefined>(null);
    readonly assistiveToolsLabel = input('Assistive Tools');
    readonly overflowLabel = input('Collapsed Item Menu');
    readonly searchLabel = input('Search');

    readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly shellbar = inject(FD_SHELLBAR, { optional: true });
    readonly searchOutlet = viewChild.required<ElementRef<HTMLElement>>('searchOutlet');
    private readonly overflowEl = viewChild.required<ElementRef<HTMLElement>>('overflow');
    protected readonly actions = contentChildren(ShellbarAction);
    protected readonly userComponent = contentChild(forwardRef(() => ShellbarUserMenu));
    protected readonly overflowing = signal(false);

    protected readonly totalNotifications = computed(() =>
        this.actions().reduce((sum, a) => sum + (Number(a.notificationCount()) || 0), 0)
    );
    protected readonly showSearchButton = computed(
        () => !!this.shellbar?.hasSearch() && !this.shellbar.searchInCenter() && !this.shellbar.searchOpen()
    );
    protected readonly searchInOverflow = computed(() => this.showSearchButton());

    protected readonly computedClass = computed(() => {
        const flex = this.shellbar?.groupFlex()?.actions;
        return cn(
            'order-3 m-0 box-border flex shrink-0 items-center justify-end gap-2 p-0',
            this.shellbar?.size() === 's' && 'gap-0.5',
            flex?.shrink && 'shrink grow-0',
            flex?.flexBasisAuto && 'basis-auto',
            // after a context area the actions keep to the end
            this.shellbar?.hasContextArea() && 'ms-auto'
        );
    });

    /** Collapses the actions into the overflow menu, or shows them again. */
    setOverflow(overflow: boolean): void {
        this.overflowEl().nativeElement.style.display = overflow ? 'flex' : '';
        this.el.querySelectorAll<HTMLElement>(`[${COLLAPSIBLE}]`).forEach((el) => {
            el.style.display = overflow ? 'none' : '';
        });
        if (overflow !== this.overflowing()) this.overflowing.set(overflow);
    }
}

/**
 * A simple user menu: the user's avatar opening a menu of items.
 *
 * ```html
 * <fd-shellbar-user-menu [user]="{ fullName: 'Lisa Miller' }" [userMenu]="[{ text: 'Sign out' }]" />
 * ```
 */
@Component({
    selector: 'fd-shellbar-user-menu',
    imports: [Button, Avatar, Menu, MenuItem, MenuInteractive, MenuTitle, MenuTrigger],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'order-1 flex shrink-0' },
    template: `
        @if (!customButton()) {
            <button
                fdButton
                variant="transparent"
                class="h-fit! max-h-none! min-w-fit! rounded-full! p-0! focus:after:rounded-full!"
                [disabled]="disabled()"
                [fdMenuTrigger]="menu"
            >
                <fd-avatar
                    size="xs"
                    circle
                    [colorAccent]="user()?.colorAccent ?? null"
                    [label]="user()?.image ? null : (user()?.fullName ?? user()?.initials ?? null)"
                    [ariaLabel]="ariaLabel() || user()?.fullName || user()?.initials || null"
                    [image]="user()?.image ?? null"
                />
            </button>
        } @else {
            <ng-content select="[fdShellbarUserMenuButton]" />
        }
        <fd-menu
            #menu
            [placement]="placement()"
            [triggers]="triggers()"
            [fillControlMode]="fillControlMode()"
            [closeOnEscapeKey]="closeOnEscapeKey()"
            [closeOnOutsideClick]="closeOnOutsideClick()"
            [closeOnSelect]="closeOnSelect()"
        >
            @for (item of userMenu() ?? []; track item) {
                <li fd-menu-item (click)="itemClick(item, $event)">
                    <div fd-menu-interactive>
                        <span fd-menu-title>{{ item.text }}</span>
                    </div>
                </li>
            }
            <ng-content />
        </fd-menu>
    `
})
export class ShellbarUserMenu {
    readonly user = input<ShellbarUser | null | undefined>();
    readonly userMenu = input<ShellbarUserMenuItem[] | null | undefined>();
    readonly ariaLabel = input<string | null>(null);
    readonly placement = input<Placement>('bottom-end');
    readonly triggers = input<string[]>(['click']);
    readonly fillControlMode = input<PopoverFillMode | null>(null);
    readonly closeOnEscapeKey = input(true, { transform: booleanAttribute });
    readonly closeOnOutsideClick = input(true, { transform: booleanAttribute });
    readonly closeOnSelect = input(true, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly itemClicked = output<ShellbarUserMenuItem>();
    protected readonly customButton = contentChild(forwardRef(() => ShellbarUserMenuButton));
    readonly menu = viewChild.required(Menu);

    protected itemClick(item: ShellbarUserMenuItem, event: MouseEvent): void {
        this.itemClicked.emit(item);
        item.callback?.(event);
    }
}

/** A custom button of a shellbar user menu; give it `[fdMenuTrigger]` of your menu. */
@Directive({
    selector: '[fdShellbarUserMenuButton]',
    host: { class: 'h-fit! max-h-none! min-w-fit! rounded-full! p-0! focus:after:rounded-full!' }
})
export class ShellbarUserMenuButton {}

/**
 * The product name as a menu of related products or apps, or as a plain title without items.
 */
@Component({
    selector: 'fd-product-menu',
    imports: [Button, Menu, MenuItem, MenuInteractive, MenuTitle, MenuAddon, MenuTrigger],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'flex min-w-0 flex-col' },
    template: `
        @if (items()?.length) {
            <button
                fdButton
                variant="transparent"
                glyph="slim-arrow-down"
                glyphPosition="after"
                class="min-w-0 max-w-full"
                [disabled]="disabled()"
                [fdMenuTrigger]="menu"
            >
                <span [class]="titleClass">{{ control() }}</span>
            </button>
            <fd-menu
                #menu
                [placement]="placement()"
                [triggers]="triggers()"
                [fillControlMode]="fillControlMode()"
                [closeOnEscapeKey]="closeOnEscapeKey()"
                [closeOnOutsideClick]="closeOnOutsideClick()"
                [closeOnSelect]="closePopoverOnSelect()"
            >
                @for (item of items(); track item) {
                    <li fd-menu-item (click)="itemClicked(item, $event)">
                        <a
                            fd-menu-interactive
                            [attr.href]="item.link ?? null"
                            [attr.target]="item.newTab ? '_blank' : null"
                        >
                            <span fd-menu-title>{{ item.name }}</span>
                            @if (item.glyph) {
                                <fd-menu-addon position="after" [glyph]="item.glyph" />
                            }
                        </a>
                    </li>
                }
            </fd-menu>
        } @else {
            <h1 [class]="titleClass">{{ control() }}</h1>
        }
    `
})
export class ProductMenu {
    /** The product name. */
    readonly control = input('');
    readonly items = input<ShellbarMenuItem[] | null | undefined>();
    readonly placement = input<Placement>('bottom-end');
    readonly triggers = input<string[]>(['click']);
    readonly fillControlMode = input<PopoverFillMode | null>(null);
    readonly closeOnEscapeKey = input(true, { transform: booleanAttribute });
    readonly closeOnOutsideClick = input(true, { transform: booleanAttribute });
    readonly closePopoverOnSelect = input(false, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    protected readonly titleClass =
        'm-0 box-border truncate p-0 font-sap-font-semibold-duplex-family text-sap-font-header5-size font-normal text-sap-shell-sub-brand-text-color';

    protected itemClicked(item: ShellbarMenuItem, event: MouseEvent): void {
        item.callback?.(event);
    }
}
