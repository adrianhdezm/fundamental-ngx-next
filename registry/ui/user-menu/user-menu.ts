/*
 * Port of @fundamental-ngx/core (user-menu) with the visual design of fundamental-styles,
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
    signal,
    untracked,
    viewChild,
    type Signal
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { BarElement, BarLeft, BarMiddle, BarRight, Bar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { Dialog, DialogBody, DialogHeader, DialogService, type DialogRef } from '@/ui/dialog/dialog';
import { Icon } from '@/ui/icon/icon';
import { Popover, PopoverBody, type Placement } from '@/ui/popover/popover';
import { Title } from '@/ui/title/title';

let nextId = 0;

/** The item whose submenu is rendered; provided to the submenu template. */
const USER_MENU_PARENT_ITEM = new InjectionToken<UserMenuListItem>('UserMenuParentItem');

/** Sizes of the menu items, as CSS variables on each list: cozy and compact. */
const LIST_VARS =
    '[--um-icon-w:2.25rem] [--um-h:2.75rem] [--um-pad:0.75rem] [--um-text-r:0.75rem] compact:[--um-icon-w:2.5rem] compact:[--um-h:2.5rem] compact:[--um-text-r:0.5rem]';
const LIST = 'm-0 box-border flex w-full list-none flex-col p-0';
/** Lists with icons align their texts after the icon column instead of padding the items. */
const ICON_VARS = '[--um-pl:0] [--um-pr:0]';
const PAD_VARS = '[--um-pl:var(--um-pad)] [--um-pr:var(--um-pad)]';

const ADDON =
    'm-0 box-border flex w-(--um-icon-w) min-w-(--um-icon-w) shrink-0 items-center justify-center self-stretch p-0 text-sap-font-large-size';

const USER_NAME =
    'm-0 box-border max-w-full p-0 font-sap-font-semibold-duplex-family text-sap-font-large-size leading-[1.4rem] text-sap-text-color';

/** A list of user menu items: the main list or a submenu. Answers keyboard navigation. */
abstract class UserMenuListBase {
    abstract readonly items: Signal<readonly UserMenuListItem[]>;
    /** Whether texts align after an icon column. */
    abstract readonly icons: Signal<boolean>;
    /** The item whose submenu this list is; null for the main list. */
    readonly parentItem = inject(USER_MENU_PARENT_ITEM, { optional: true });
    /** The last focused item; it keeps tabindex 0. */
    readonly active = signal<UserMenuListItem | null>(null);
    protected readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    /** The item reachable with Tab: the last focused one, or the first. */
    readonly tabbable: Signal<UserMenuListItem | null> = computed(() => {
        const active = this.active();
        const items = this.items();
        return active && items.includes(active) ? active : (items[0] ?? null);
    });

    protected onKeydown(event: KeyboardEvent): void {
        const items = this.items();
        const current = items.find((i) => i.link().nativeElement === event.target);
        if (!current) return;
        const index = items.indexOf(current);
        switch (event.key) {
            case 'ArrowDown':
                items[index + 1]?.focus();
                break;
            case 'ArrowUp':
                items[index - 1]?.focus();
                break;
            case 'Home':
                items[0]?.focus();
                break;
            case 'End':
                items[items.length - 1]?.focus();
                break;
            default:
                return;
        }
        event.preventDefault();
    }

    /** Leaving the list makes the first item tabbable again; moving into a submenu keeps the item. */
    protected onFocusout(event: FocusEvent): void {
        const next = event.relatedTarget as Element | null;
        if (next && (this.el.contains(next) || next.closest('.cdk-overlay-container'))) return;
        this.active.set(null);
    }
}

/**
 * User menu: the signed-in user's name, details and actions in a popover opened from an avatar,
 * usually in the shell bar. The user name moves into a header bar when it scrolls out of view.
 * List items open submenus to the side; in mobile mode the menu opens in a full-screen dialog and
 * submenus replace the main view.
 *
 * ```html
 * <fd-user-menu>
 *     <fd-user-menu-control><fd-avatar size="xs" circle label="Lisa Miller" /></fd-user-menu-control>
 *     <fd-user-menu-body>
 *         <div fd-user-menu-header>
 *             <div fd-user-menu-header-container><div fd-user-menu-user-name>Lisa Miller</div></div>
 *         </div>
 *         <div fd-user-menu-content-container>
 *             <fd-user-menu-list><li fd-user-menu-list-item icon="action-settings" text="Settings"></li></fd-user-menu-list>
 *         </div>
 *     </fd-user-menu-body>
 *     <fd-user-menu-footer>...</fd-user-menu-footer>
 * </fd-user-menu>
 * ```
 */
@Component({
    selector: 'fd-user-menu',
    exportAs: 'fdUserMenu',
    imports: [
        NgTemplateOutlet,
        Popover,
        PopoverBody,
        Dialog,
        DialogHeader,
        DialogBody,
        Bar,
        BarLeft,
        BarMiddle,
        BarRight,
        BarElement,
        Button,
        Title
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'inline-flex' },
    template: `
        <ng-content select="fd-user-menu-control" />
        @if (!mobile()) {
            <fd-popover
                class="absolute"
                [trigger]="control()?.el ?? null"
                [(isOpen)]="isOpen"
                [placement]="placement()"
                [noArrow]="false"
                [disableScrollbar]="true"
                [focusTrapped]="true"
                [focusAutoCapture]="false"
                [restoreFocusOnClose]="false"
                bodyRole="dialog"
                [bodyAriaLabelledBy]="body()?.userNameId() ?? null"
            >
                <fd-popover-body>
                    <div class="relative flex max-h-[calc(100vh-4rem)] w-80 flex-col overflow-hidden rounded-[inherit]">
                        <div fd-bar barDesign="header" aria-hidden="true" [role]="null" [class]="scrollHeaderClass()">
                            <div fd-bar-middle>
                                <fd-bar-element>
                                    <div class="${USER_NAME} truncate">{{ body()?.userNameText() }}</div>
                                </fd-bar-element>
                            </div>
                        </div>
                        <div
                            data-user-menu-scroll
                            class="min-h-0 flex-1 overflow-auto overscroll-contain scrollbar-sap"
                        >
                            <ng-container [ngTemplateOutlet]="bodyTpl" />
                        </div>
                        <ng-container [ngTemplateOutlet]="footerTpl" />
                    </div>
                </fd-popover-body>
            </fd-popover>
        }
        <ng-template #bodyTpl><ng-content select="fd-user-menu-body" /></ng-template>
        <ng-template #footerTpl><ng-content select="fd-user-menu-footer" /></ng-template>
        <ng-template #dialogTpl>
            <fd-dialog>
                <fd-dialog-header>
                    <div fd-bar-left>
                        @if (body()?.level(); as level) {
                            <fd-bar-element>
                                <button
                                    fdButton
                                    variant="transparent"
                                    [glyph]="rtl() ? 'navigation-right-arrow' : 'navigation-left-arrow'"
                                    [ariaLabel]="backLabel()"
                                    (click)="body()?.back()"
                                ></button>
                            </fd-bar-element>
                            <fd-bar-element>
                                <h1 fd-title>{{ level.text() }}</h1>
                            </fd-bar-element>
                        }
                    </div>
                    @if (!body()?.level()) {
                        <div fd-bar-middle aria-hidden="true" [class]="scrollNameClass()">
                            <fd-bar-element>
                                <div class="${USER_NAME} truncate">{{ body()?.userNameText() }}</div>
                            </fd-bar-element>
                        </div>
                    }
                    <div fd-bar-right>
                        <fd-bar-element>
                            <button
                                fdButton
                                variant="transparent"
                                glyph="decline"
                                [ariaLabel]="closeLabel()"
                                (click)="close()"
                            ></button>
                        </fd-bar-element>
                    </div>
                </fd-dialog-header>
                <fd-dialog-body disablePaddings>
                    <ng-container [ngTemplateOutlet]="bodyTpl" />
                </fd-dialog-body>
                <div class="shrink-0"><ng-container [ngTemplateOutlet]="footerTpl" /></div>
            </fd-dialog>
        </ng-template>
    `
})
export class UserMenu {
    /** Opens and closes the menu; two-way bindable (`isOpenChange`). */
    readonly isOpen = model(false);
    /** Opens the menu in a full-screen dialog. */
    readonly mobile = input(false, { transform: booleanAttribute });
    readonly placement = input<Placement>('bottom-end');
    /** Accessible names of the dialog header buttons in mobile mode. */
    readonly backLabel = input('Go back');
    readonly closeLabel = input('Close');

    readonly control = contentChild<UserMenuControl>(forwardRef(() => UserMenuControl));
    readonly body = contentChild<UserMenuBody>(forwardRef(() => UserMenuBody));
    private readonly items = contentChildren<UserMenuListItem>(
        forwardRef(() => UserMenuListItem),
        { descendants: true }
    );
    private readonly dialogTpl = viewChild.required<TemplateRef<unknown>>('dialogTpl');
    private readonly dialogs = inject(DialogService);
    private readonly direction = inject(Directionality, { optional: true });
    private readonly injector = inject(Injector);
    private dialogRef: DialogRef | null = null;

    readonly rtl = computed(() => this.direction?.valueSignal() === 'rtl');
    /** Items of the main list. */
    private readonly rootItems = computed(() => this.items().filter((i) => !i.list.parentItem));

    protected readonly scrollHeaderClass = computed(() =>
        cn(
            'absolute inset-x-0 top-0 z-10 overflow-hidden rounded-t-[inherit] transition-opacity duration-150',
            this.body()?.userNameVisible() !== false && 'pointer-events-none opacity-0'
        )
    );
    protected readonly scrollNameClass = computed(() =>
        cn('transition-opacity duration-150', this.body()?.userNameVisible() !== false && 'opacity-0')
    );

    constructor() {
        let wasOpen = false;
        effect(() => {
            const open = this.isOpen();
            untracked(() => {
                if (open === wasOpen) return;
                wasOpen = open;
                if (open) this.opened();
                else this.closed();
            });
        });
        inject(DestroyRef).onDestroy(() => this.dialogRef?.close());
    }

    open(): void {
        this.isOpen.set(true);
    }

    close(): void {
        this.isOpen.set(false);
    }

    toggle(): void {
        this.isOpen.update((v) => !v);
    }

    private opened(): void {
        if (this.mobile()) this.openDialog();
        afterNextRender(
            () => {
                this.body()?.attach();
                requestAnimationFrame(() => this.rootItems()[0]?.focus());
            },
            { injector: this.injector }
        );
    }

    private closed(): void {
        const ref = this.dialogRef;
        this.dialogRef = null;
        ref?.close();
        this.rootItems().forEach((item) => item.closeSubmenu());
        this.body()?.detach();
        this.body()?.reset();
        // return the focus to the control unless the user moved it elsewhere
        const active = document.activeElement;
        if (!active || active === document.body || active.closest('.cdk-overlay-container'))
            afterNextRender(() => this.control()?.focus(), { injector: this.injector });
    }

    private openDialog(): void {
        if (this.dialogRef) return;
        const ref = this.dialogs.open(
            this.dialogTpl(),
            {
                mobile: true,
                ariaLabelledBy: this.body()?.userNameId() ?? null,
                escKeyCloseable: true,
                backdropClickCloseable: false
            },
            this.injector
        );
        this.dialogRef = ref;
        const done = () => {
            if (this.dialogRef !== ref) return;
            this.dialogRef = null;
            this.isOpen.set(false);
        };
        ref.afterClosed.subscribe({ next: done, error: done });
    }
}

/** The element that opens the user menu, usually an avatar. Enter and Space open it too. */
@Component({
    selector: 'fd-user-menu-control',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'button',
        tabindex: '0',
        'aria-haspopup': 'dialog',
        '[attr.aria-expanded]': 'menu?.isOpen() ?? null',
        class: 'inline-flex h-fit w-fit cursor-pointer items-center justify-center rounded-full outline-offset-1 focus-visible:outline-sap',
        '(click)': 'onClick()',
        '(keydown)': 'onKeydown($event)'
    },
    template: '<ng-content />'
})
export class UserMenuControl {
    readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly menu = inject(UserMenu, { optional: true });

    /** In mobile mode the click opens the dialog; on desktop the popover handles it. */
    protected onClick(): void {
        if (this.menu?.mobile()) this.menu.open();
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (this.menu?.mobile()) this.menu.open();
        else this.menu?.toggle();
    }

    focus(): void {
        this.el.focus();
    }
}

/** Marks the element inside the control that shows the open state (`data-state="open"`). */
@Directive({
    selector: '[fd-user-menu-control-element], [fdUserMenuControlElement]',
    host: { '[attr.data-state]': 'menu?.isOpen() ? "open" : null' }
})
export class UserMenuControlElement {
    protected readonly menu = inject(UserMenu, { optional: true });
}

/**
 * Content of the user menu: a header with the user's details and a content container with lists
 * and panels. In mobile mode it shows the submenu of an item instead of the main view.
 */
@Component({
    selector: 'fd-user-menu-body',
    imports: [NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        // like upstream: clicks inside the menu do not bubble out of it (outside clicks are detected in the capture phase)
        '(click)': '$event.stopPropagation()'
    },
    template: `
        <div [class]="level() ? 'hidden' : 'contents'">
            <ng-content select="[fd-user-menu-header], [fdUserMenuHeader]" />
            <ng-content select="[fd-user-menu-content-container], [fdUserMenuContentContainer]" />
            <ng-content />
        </div>
        <!-- earlier levels stay rendered, so going back can focus the item that opened the level -->
        @for (item of levels(); track item; let last = $last) {
            <div [class]="last ? 'm-0 box-border p-4' : 'hidden'">
                <ng-container [ngTemplateOutlet]="item.submenu()" [ngTemplateOutletInjector]="item.submenuInjector" />
            </div>
        }
    `
})
export class UserMenuBody {
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly menu = inject(UserMenu, { optional: true });
    private readonly injector = inject(Injector);
    private readonly userName = contentChild<UserMenuUserName>(
        forwardRef(() => UserMenuUserName),
        { descendants: true }
    );
    /** Open submenu levels in mobile mode. */
    protected readonly levels = signal<UserMenuListItem[]>([]);
    private observers: { disconnect(): void }[] = [];

    readonly level = computed(() => this.levels().at(-1) ?? null);
    readonly userNameId = computed(() => this.userName()?.id() ?? null);
    readonly userNameText = signal('');
    /** Whether the user name is scrolled into view; the header bars show it otherwise. */
    readonly userNameVisible = signal(true);

    protected readonly computedClass = computed(() =>
        cn(
            'relative m-0 box-border flex flex-col gap-2 whitespace-normal font-sap-font-family text-sap-font-size text-sap-text-color',
            this.menu?.mobile() ? 'w-full px-2 pt-4 pb-2' : 'w-80 px-2 pt-10 pb-2',
            this.level() && 'p-0',
            this.userClass()
        )
    );

    /** Starts tracking the user name once the body is shown. */
    attach(): void {
        this.detach();
        const el = this.userName()?.el;
        if (!el) return;
        this.userNameText.set(el.textContent?.trim() ?? '');
        const root = el.closest<HTMLElement>('[data-user-menu-scroll], [data-dialog-body]');
        const header = root?.hasAttribute('data-user-menu-scroll') ? '-44px' : '0px';
        const intersection = new IntersectionObserver(
            (entries) => this.userNameVisible.set(entries.at(-1)?.isIntersecting ?? true),
            { root, threshold: 0, rootMargin: `${header} 0px 0px 0px` }
        );
        intersection.observe(el);
        const mutation = new MutationObserver(() => this.userNameText.set(el.textContent?.trim() ?? ''));
        mutation.observe(el, { childList: true, characterData: true, subtree: true });
        this.observers = [intersection, mutation];
    }

    detach(): void {
        this.observers.forEach((o) => o.disconnect());
        this.observers = [];
        this.userNameVisible.set(true);
    }

    /** Shows the submenu of an item (mobile mode). */
    show(item: UserMenuListItem): void {
        this.levels.update((levels) => [...levels, item]);
        this.focusFirstItem();
    }

    /** Back to the previous level (mobile mode). */
    back(): void {
        const item = this.level();
        if (!item) return;
        this.levels.update((levels) => levels.slice(0, -1));
        afterNextRender(() => item.focus(), { injector: this.injector });
    }

    reset(): void {
        this.levels.set([]);
    }

    private focusFirstItem(): void {
        afterNextRender(
            () =>
                requestAnimationFrame(() =>
                    this.el.querySelector<HTMLElement>(':scope > div:last-child [role="menuitem"]')?.focus()
                ),
            { injector: this.injector }
        );
    }

    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
}

/** The user's avatar, details and actions at the top of the menu. */
@Directive({
    selector: '[fd-user-menu-header], [fdUserMenuHeader]',
    host: { class: 'm-0 box-border flex flex-col items-center gap-2 p-0' }
})
export class UserMenuHeader {}

/** The user name and sublines. */
@Directive({
    selector: '[fd-user-menu-header-container], [fdUserMenuHeaderContainer]',
    host: { class: 'm-0 mb-2 box-border flex max-w-full flex-col items-center gap-1 p-0 text-center' }
})
export class UserMenuHeaderContainer {}

/** Free content below the user details, e.g. a message strip. */
@Directive({
    selector: '[fd-user-menu-header-content-area], [fdUserMenuHeaderContentArea]',
    host: { class: 'm-0 box-border block w-full p-2' }
})
export class UserMenuHeaderContentArea {}

/** The user name; clamped to two lines, or one with `truncate`. */
@Directive({
    selector: '[fd-user-menu-user-name], [fdUserMenuUserName]',
    host: { '[attr.id]': 'id()', '[class]': 'computedClass()' }
})
export class UserMenuUserName {
    readonly id = input(`fd-user-menu-user-name-${nextId++}`);
    readonly truncate = input(false, { transform: booleanAttribute });
    /** Shows the full name on as many lines as needed. */
    readonly wrap = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly computedClass = computed(() =>
        cn(
            USER_NAME,
            this.truncate() ? 'truncate' : this.wrap() ? 'block' : 'line-clamp-2 max-h-[2.8rem]',
            this.userClass()
        )
    );
}

/** A line below the user name: an e-mail, a role or an organisation. */
@Directive({
    selector: '[fd-user-menu-subline], [fdUserMenuSubline]',
    host: { '[class]': 'computedClass()' }
})
export class UserMenuSubline {
    /** Truncates the line (the default); kept for compatibility. */
    readonly truncate = input(false, { transform: booleanAttribute });
    /** Wraps a long line instead of truncating it. */
    readonly wrap = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border w-full max-w-full p-0 text-sap-content-label-color',
            this.wrap() ? 'break-words whitespace-normal' : 'truncate',
            this.userClass()
        )
    );
}

/** Lists and panels below the header. */
@Directive({
    selector: '[fd-user-menu-content-container], [fdUserMenuContentContainer]',
    host: { class: 'm-0 box-border block p-0' }
})
export class UserMenuContentContainer {}

/** The main list of user menu actions. Arrow keys move between items. */
@Component({
    selector: 'fd-user-menu-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: UserMenuListBase, useExisting: forwardRef(() => UserMenuList) }],
    host: { class: 'mt-1 block w-full' },
    template: `
        <nav class="block w-full" [attr.aria-label]="ariaLabel()">
            <ul
                role="menu"
                class="${LIST} ${LIST_VARS} ${ICON_VARS}"
                (keydown)="onKeydown($event)"
                (focusout)="onFocusout($event)"
            >
                <ng-content />
            </ul>
        </nav>
    `
})
export class UserMenuList extends UserMenuListBase {
    readonly ariaLabel = input<string | null>(null);
    private readonly projected = contentChildren<UserMenuListItem>(
        forwardRef(() => UserMenuListItem),
        { descendants: true }
    );
    readonly items: Signal<readonly UserMenuListItem[]> = computed(() =>
        this.projected().filter((i) => i.list === this)
    );
    readonly icons = signal(true).asReadonly();
}

/**
 * Items of a submenu, in an `<ng-template>` passed to an item's `submenu`.
 *
 * ```html
 * <li fd-user-menu-list-item text="Language" hasSubmenu [submenu]="languages"></li>
 * <ng-template #languages>
 *     <div fd-user-menu-sublist><li fd-user-menu-list-item text="English"></li></div>
 * </ng-template>
 * ```
 */
@Component({
    selector: '[fd-user-menu-sublist], [fdUserMenuSublist]',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: UserMenuListBase, useExisting: forwardRef(() => UserMenuSublist) }],
    host: { '[class]': 'hostClass()' },
    template: `
        <ul
            role="menu"
            [attr.aria-label]="parentItem?.text() ?? null"
            [class]="listClass()"
            (keydown)="onKeydown($event)"
            (focusout)="onFocusout($event)"
        >
            <ng-content />
        </ul>
    `
})
export class UserMenuSublist extends UserMenuListBase {
    /** Aligns the texts after an icon column. */
    readonly hasIcons = input(false, { transform: booleanAttribute });
    private readonly menu = inject(UserMenu, { optional: true });
    private readonly projected = contentChildren<UserMenuListItem>(
        forwardRef(() => UserMenuListItem),
        { descendants: true }
    );
    readonly items: Signal<readonly UserMenuListItem[]> = computed(() =>
        this.projected().filter((i) => i.list === this)
    );
    readonly icons: Signal<boolean> = computed(() => this.hasIcons());

    protected readonly hostClass = computed(() => cn('block', this.menu?.mobile() ? 'w-full' : 'w-76 max-w-full'));
    protected readonly listClass = computed(() => cn(LIST, LIST_VARS, this.hasIcons() ? ICON_VARS : PAD_VARS));
}

let nextItemId = 0;

/**
 * An action of the user menu, with an icon, a title, a subtitle and an icon after the text. With
 * `hasSubmenu` and a `submenu` template it opens a submenu on hover, click or the Right arrow
 * (Left in RTL); the Left arrow and Escape close it.
 */
@Component({
    selector: '[fd-user-menu-list-item], [fdUserMenuListItem]',
    exportAs: 'fdUserMenuListItem',
    imports: [NgTemplateOutlet, Icon, Popover, PopoverBody],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'none',
        '[attr.id]': 'uniqueId()',
        class: 'm-0 box-border block w-full p-0',
        '(mouseenter)': 'onEnter()',
        '(mouseleave)': 'onLeave()'
    },
    template: `
        <button
            #link
            type="button"
            role="menuitem"
            [class]="linkClass()"
            [tabIndex]="list.tabbable() === this ? 0 : -1"
            [attr.aria-haspopup]="hasSubmenu() ? 'menu' : null"
            [attr.aria-expanded]="hasSubmenu() && !mobile() ? open() : null"
            [attr.aria-describedby]="subtitle() ? subtitleId() : null"
            (focus)="list.active.set(this)"
            (click)="onClick($event)"
            (keydown)="onKeydown($event)"
        >
            @if (icon()) {
                <span class="${ADDON} text-(--um-ic)" aria-hidden="true"><fd-icon [glyph]="icon()" /></span>
            }
            <span [class]="contentClass()">
                <span [id]="textId()" [class]="titleClass()">{{ text() }}</span>
                @if (subtitle()) {
                    <span [id]="subtitleId()" [class]="subtitleClass()">{{ subtitle() }}</span>
                }
            </span>
            @if (iconAfter()) {
                <span [class]="afterClass()" aria-hidden="true"><fd-icon [glyph]="iconAfter()" /></span>
            }
            @if (hasSubmenu()) {
                <span class="${ADDON} text-[1rem] text-(--um-ic)" aria-hidden="true">
                    <fd-icon glyph="navigation-right-arrow" class="rtl:-scale-x-100" />
                </span>
            }
        </button>
        @if (hasSubmenu() && !mobile()) {
            <fd-popover
                class="absolute"
                [trigger]="link"
                [(isOpen)]="open"
                [triggers]="[]"
                placement="left-start"
                [noArrow]="true"
                [focusTrapped]="true"
                [focusAutoCapture]="false"
                [restoreFocusOnClose]="false"
                [bodyRole]="null"
            >
                <fd-popover-body
                    (keydown)="onSubmenuKeydown($event)"
                    (mouseenter)="keepOpen()"
                    (mouseleave)="scheduleClose(true)"
                >
                    @if (open()) {
                        <ng-container [ngTemplateOutlet]="submenu()" [ngTemplateOutletInjector]="submenuInjector" />
                    }
                </fd-popover-body>
            </fd-popover>
        }
    `
})
export class UserMenuListItem {
    readonly uniqueId = input(`fd-user-menu-list-item-${nextItemId}`);
    readonly icon = input<string | null | undefined>();
    readonly iconAfter = input<string | null | undefined>();
    /** Colours the icon after the text as selected, e.g. a checkmark. */
    readonly iconAfterActive = input(false, { transform: booleanAttribute });
    readonly text = input.required<string>();
    readonly textId = input(`fd-user-menu-list-item-title-${nextItemId}`);
    readonly truncateText = input(false, { transform: booleanAttribute });
    readonly subtitle = input<string | null | undefined>();
    readonly subtitleId = input(`fd-user-menu-list-item-subtitle-${nextItemId++}`);
    readonly truncateSubtitle = input(false, { transform: booleanAttribute });
    readonly hasSubmenu = input(false, { transform: booleanAttribute });
    /** Template with a `[fd-user-menu-sublist]`. */
    readonly submenu = input<TemplateRef<unknown> | null>(null);
    readonly selected = input(false, { transform: booleanAttribute });

    readonly list = inject(UserMenuListBase);
    private readonly menu = inject(UserMenu, { optional: true });
    private readonly direction = inject(Directionality, { optional: true });
    private readonly injector = inject(Injector);
    readonly link = viewChild.required<ElementRef<HTMLButtonElement>>('link');
    private readonly popover = viewChild(Popover);
    private closeTimer: ReturnType<typeof setTimeout> | null = null;

    /** Whether the submenu is open (desktop). */
    readonly open = signal(false);
    readonly mobile = computed(() => !!this.menu?.mobile());
    /** Provides this item to its submenu template. */
    readonly submenuInjector = Injector.create({
        providers: [{ provide: USER_MENU_PARENT_ITEM, useValue: this }],
        parent: this.injector
    });

    protected readonly linkClass = computed(() =>
        cn(
            'relative m-0 box-border flex min-h-(--um-h) w-full cursor-pointer items-center border-0 border-b border-solid border-b-(--um-bb) p-0 ps-(--um-pl) pe-(--um-pr)',
            'bg-(--um-bg) text-start font-sap-font-family text-sap-font-size no-underline outline-none',
            '[--um-bg:var(--sapList_Background)] [--um-bb:transparent] [--um-ic:var(--sapContent_NonInteractiveIconColor)] [--um-tc:var(--sapList_TextColor)]',
            'hover:[--um-bg:var(--sapList_Hover_Background)]',
            // focus: an inner frame
            "focus-visible:after:pointer-events-none focus-visible:after:absolute focus-visible:after:inset-0.5 focus-visible:after:content-['']",
            'focus-visible:after:border-(length:--sapContent_FocusWidth) focus-visible:after:[border-style:var(--sapContent_FocusStyle)] focus-visible:after:border-sap-content-focus-color',
            (this.selected() || (this.open() && !this.mobile())) &&
                'not-active:[--um-bg:var(--sapList_SelectionBackgroundColor)] not-active:[--um-bb:var(--sapList_SelectionBorderColor)] not-active:hover:[--um-bg:var(--sapList_Hover_SelectionBackground)]',
            'active:[--um-bg:var(--sapList_Active_Background)] active:[--um-ic:var(--sapList_Active_TextColor)] active:[--um-tc:var(--sapList_Active_TextColor)] active:after:hidden',
            this.hasSubmenu() && 'pe-0'
        )
    );
    protected readonly contentClass = computed(() => {
        const icons = this.list.icons();
        return cn(
            'm-0 box-border flex min-w-0 flex-1 flex-col overflow-hidden p-0',
            icons && !this.icon() && 'ms-(--um-icon-w)',
            icons && !this.iconAfter() && !this.hasSubmenu() && 'me-(--um-text-r)'
        );
    });
    protected readonly titleClass = computed(() =>
        cn(
            'm-0 my-1 box-border w-full p-0 text-start text-(--um-tc)',
            this.truncateText() ? 'truncate' : 'whitespace-normal'
        )
    );
    protected readonly subtitleClass = computed(() =>
        cn(
            'm-0 mb-1 box-border w-full p-0 text-start text-sap-content-label-color',
            this.truncateSubtitle() ? 'truncate' : 'whitespace-normal'
        )
    );
    protected readonly afterClass = computed(() =>
        cn(ADDON, this.iconAfterActive() ? 'text-sap-content-selected-foreground-color' : 'text-(--um-ic)')
    );

    private readonly rtl = computed(() => this.direction?.valueSignal() === 'rtl');

    constructor() {
        inject(DestroyRef).onDestroy(() => this.cancelClose());
    }

    focus(): void {
        this.link().nativeElement.focus();
    }

    click(): void {
        this.link().nativeElement.click();
    }

    /** Closes the submenu, optionally moving the focus back to this item. */
    closeSubmenu(restoreFocus = false): void {
        this.cancelClose();
        if (this.open()) this.open.set(false);
        if (restoreFocus) this.focus();
    }

    protected onClick(event: MouseEvent): void {
        if (!this.hasSubmenu()) return;
        if (this.mobile()) {
            if (this.submenu()) this.menu?.body()?.show(this);
            return;
        }
        this.openSubmenu(event.detail === 0);
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (!this.hasSubmenu() || this.mobile()) return;
        const openKey = this.rtl() ? 'ArrowLeft' : 'ArrowRight';
        const closeKey = this.rtl() ? 'ArrowRight' : 'ArrowLeft';
        if (event.key === openKey) {
            event.preventDefault();
            this.openSubmenu(true);
        } else if (event.key === closeKey && this.open()) {
            event.preventDefault();
            this.closeSubmenu(true);
        }
    }

    /** Left arrow (Right in RTL) or Escape in the submenu close it and return to this item. */
    protected onSubmenuKeydown(event: KeyboardEvent): void {
        const closeKey = this.rtl() ? 'ArrowRight' : 'ArrowLeft';
        if (event.key === closeKey || event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.closeSubmenu(true);
        }
    }

    protected onEnter(): void {
        if (this.mobile()) return;
        this.keepOpen();
        if (document.activeElement !== this.link().nativeElement) this.focus();
        this.list.items().forEach((item) => item !== this && item.closeSubmenu());
        if (this.hasSubmenu() && !this.open()) this.open.set(true);
    }

    protected onLeave(): void {
        if (this.hasSubmenu() && !this.mobile()) this.scheduleClose(false);
    }

    /** Hovering this item or its submenu keeps it and its ancestors open. */
    protected keepOpen(): void {
        for (let item: UserMenuListItem | null = this; item; item = item.list.parentItem) item.cancelClose();
    }

    /** Leaving the item or its submenu closes it after a short delay; leaving a submenu closes its ancestors too. */
    protected scheduleClose(ancestors: boolean): void {
        for (let item: UserMenuListItem | null = this; item; item = ancestors ? item.list.parentItem : null) {
            const target = item;
            if (!target.open()) continue;
            target.cancelClose();
            target.closeTimer = setTimeout(() => {
                target.closeTimer = null;
                target.open.set(false);
            }, 150);
        }
    }

    private cancelClose(): void {
        if (this.closeTimer !== null) clearTimeout(this.closeTimer);
        this.closeTimer = null;
    }

    private openSubmenu(focusFirst: boolean): void {
        this.cancelClose();
        this.open.set(true);
        if (!focusFirst) return;
        afterNextRender(
            () =>
                requestAnimationFrame(() =>
                    this.popover()?.service.overlayElement?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
                ),
            { injector: this.injector }
        );
    }
}

/** Bottom of the user menu, usually a footer bar with a sign-out button. */
@Component({
    selector: 'fd-user-menu-footer',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block min-h-8 shrink-0' },
    template: '<ng-content />'
})
export class UserMenuFooter {}
