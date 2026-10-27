/*
 * Port of @fundamental-ngx/core (menu) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
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
    Injector,
    TemplateRef,
    afterNextRender,
    booleanAttribute,
    computed,
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
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';
import { BarElement, BarLeft, BarRight, ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import {
    Dialog,
    DialogBody,
    DialogCloseButton,
    DialogFooter,
    DialogHeader,
    DialogService,
    type DialogConfig,
    type DialogRef
} from '@/ui/dialog/dialog';
import { Icon } from '@/ui/icon/icon';
import {
    FD_POPOVER,
    PopoverService,
    type Placement,
    type PopoverConfig,
    type PopoverFillMode,
    type TriggerConfig
} from '@/ui/popover/popover';
import { Title } from '@/ui/title/title';

/** Options of the dialog a mobile menu opens in. */
export interface MenuMobileConfig {
    title?: string;
    approveButtonText?: string;
    cancelButtonText?: string;
    hasCloseButton?: boolean;
    dialogConfig?: DialogConfig;
}

/** Sizes of menu items, as CSS variables on each list: cozy, compact and mobile. */
const LIST_VARS = [
    '[--mi-icon-w:2.25rem] [--mi-h:2.75rem] [--mi-pad:0.75rem] [--mi-sub-pad:1rem] [--mi-sc-pl:1rem] [--mi-sc-pr:0.75rem] [--mi-text-r:0.75rem]',
    'compact:[--mi-icon-w:2rem] compact:[--mi-h:2rem] compact:[--mi-pad:0.5rem] compact:[--mi-sub-pad:0.5rem] compact:[--mi-sc-pr:0.5rem] compact:[--mi-text-r:0.5rem]',
    '[--mi-pl:var(--mi-pad)] [--mi-pr:var(--mi-pad)]',
    '[--mr:var(--sapPopover_BorderCornerRadius)]'
].join(' ');
const MOBILE_VARS = '[--mi-icon-w:2.75rem]! [--mi-pad:1rem]! [--mi-sc-pr:1rem]! [--mi-text-r:1rem]! [--mr:0]!';
/** Lists with icons align their texts after the icon column instead of padding the items. */
const ICON_VARS = '[--mi-pl:0]! [--mi-pr:0]!';

const LIST = 'm-0 box-border flex list-none flex-col flex-nowrap p-0 max-w-80 rounded-(--mr)';

/**
 * A list of menu items: the root of a menu or a submenu. Items register with it and it answers
 * keyboard navigation between siblings.
 */
abstract class MenuList {
    /** Items of this list, in order. */
    abstract readonly items: () => readonly MenuItem[];
    /** Whether any item shows an icon, so texts align after the icon column. */
    readonly icons: Signal<boolean> = computed(() => this.items().some((i) => i.hasIcon()));
}

let nextMenuId = 0;

/**
 * Menu: a list of actions in a popover, opened by a trigger (`[fdMenuTrigger]`). Items can open
 * submenus, show icons, subtitles and shortcuts, act as toggles or as a single-choice group, and
 * hold an input. Arrow keys move between items, Right/Left open and close submenus, Escape and Tab
 * close the menu. In mobile mode it opens in a full-screen dialog.
 *
 * ```html
 * <button fdButton fdMenu label="Actions" [fdMenuTrigger]="menu"></button>
 * <fd-menu #menu>
 *     <li fd-menu-item><a fd-menu-interactive href="#"><span fd-menu-title>Edit</span></a></li>
 * </fd-menu>
 * ```
 */
@Component({
    selector: 'fd-menu',
    exportAs: 'fdMenu',
    imports: [
        NgTemplateOutlet,
        Dialog,
        DialogHeader,
        DialogBody,
        DialogFooter,
        DialogCloseButton,
        BarLeft,
        BarRight,
        BarElement,
        Button,
        ButtonBar,
        Title
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        PopoverService,
        { provide: FD_POPOVER, useExisting: PopoverService },
        { provide: MenuList, useExisting: forwardRef(() => Menu) }
    ],
    host: { class: 'contents' },
    template: `
        <ng-template #root>
            <nav
                [id]="id()"
                [attr.role]="role()"
                [attr.aria-label]="ariaLabel()"
                [attr.aria-labelledby]="ariaLabelledby()"
                [class]="navClass()"
                (keydown)="onKeydown($event)"
                (keyup)="onKeyup($event)"
            >
                <ul [attr.role]="listRole()" [class]="listClass()">
                    <ng-content />
                </ul>
            </nav>
        </ng-template>
        <ng-template #mobileDialog let-dialog>
            <fd-dialog>
                <fd-dialog-header>
                    <div fd-bar-left>
                        @if (mobileLevel(); as level) {
                            <fd-bar-element>
                                <button
                                    fdButton
                                    variant="transparent"
                                    glyph="navigation-left-arrow"
                                    [ariaLabel]="'Go to previous menu level: ' + mobileTitle()"
                                    (click)="back()"
                                ></button>
                            </fd-bar-element>
                        }
                        <fd-bar-element
                            ><h1 fd-title [id]="id() + '-title'">{{ mobileTitle() }}</h1></fd-bar-element
                        >
                    </div>
                    <div fd-bar-right>
                        @if (mobileConfig().hasCloseButton !== false) {
                            <fd-bar-element>
                                <button fd-dialog-close-button mobile (click)="close()"></button>
                            </fd-bar-element>
                        }
                    </div>
                </fd-dialog-header>
                <fd-dialog-body disablePaddings>
                    @if (mobileLevel(); as level) {
                        <nav [class]="navClass()" (keydown)="onKeydown($event)" (keyup)="onKeyup($event)">
                            <ul role="menu" [attr.aria-label]="mobileTitle()" [class]="level.submenu()!.listClass()">
                                <ng-container [ngTemplateOutlet]="level.submenu()!.templateRef()" />
                            </ul>
                        </nav>
                    } @else {
                        <ng-container [ngTemplateOutlet]="root" />
                    }
                </fd-dialog-body>
                @if (mobileConfig().approveButtonText || mobileConfig().cancelButtonText) {
                    <fd-dialog-footer>
                        @if (mobileConfig().approveButtonText) {
                            <fd-button-bar
                                variant="emphasized"
                                [label]="mobileConfig().approveButtonText"
                                (click)="close()"
                            />
                        }
                        @if (mobileConfig().cancelButtonText) {
                            <fd-button-bar [label]="mobileConfig().cancelButtonText" (click)="close()" />
                        }
                    </fd-dialog-footer>
                }
            </fd-dialog>
        </ng-template>
    `
})
export class Menu extends MenuList {
    readonly id = input(`fd-menu-${nextMenuId++}`);
    readonly ariaLabel = input<string | null>(null);
    readonly ariaLabelledby = input<string | null>(null);
    /** Role of the menu container. */
    readonly role = input<string | null>('menu');
    /** Role of the item list inside the container. */
    readonly listRole = input<string | null>('none');
    /** Opens and closes the menu; two-way bindable. */
    readonly isOpen = model(false);
    /** All popover options at once; individual inputs take precedence. */
    readonly config = input<PopoverConfig>({});
    readonly placement = input<Placement>('bottom-start');
    readonly triggers = input<(string | TriggerConfig)[]>(['click']);
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly closeOnEscapeKey = input(true, { transform: booleanAttribute });
    readonly closeOnOutsideClick = input(true, { transform: booleanAttribute });
    readonly focusTrapped = input(true, { transform: booleanAttribute });
    readonly focusAutoCapture = input(true, { transform: booleanAttribute });
    readonly restoreFocusOnClose = input(true, { transform: booleanAttribute });
    readonly fixedPosition = input(false, { transform: booleanAttribute });
    readonly fillControlMode = input<PopoverFillMode | null>(null);
    readonly disableScrollbar = input(false, { transform: booleanAttribute });
    readonly additionalBodyClass = input<string | null>(null);
    /** Delay in ms before hovering an item opens its submenu. */
    readonly openOnHoverTime = input(0);
    /** Closes the menu when a plain item is selected (not toggles, options or inputs). */
    readonly closeOnSelect = input(true, { transform: booleanAttribute });
    /** Opens the menu in a full-screen dialog, with one level at a time. */
    readonly mobile = input(false, { transform: booleanAttribute });
    readonly mobileConfig = input<MenuMobileConfig>({ hasCloseButton: true });

    /** Path of activated items from the root: open submenus and the last selected item. */
    readonly activePath = output<MenuItem[]>();
    readonly beforeOpen = output<void>();

    /** The element that opens the menu; set by `[fdMenuTrigger]`. */
    readonly trigger = signal<HTMLElement | null>(null);

    private readonly popover = inject(PopoverService);
    private readonly dialogs = inject(DialogService);
    private readonly direction = inject(Directionality, { optional: true });
    private readonly injector = inject(Injector);
    private readonly rootTemplate = viewChild.required<TemplateRef<unknown>>('root');
    private readonly mobileTemplate = viewChild.required<TemplateRef<unknown>>('mobileDialog');
    private readonly allItems = contentChildren(
        forwardRef(() => MenuItem),
        { descendants: true }
    );
    private dialogRef: DialogRef | null = null;

    readonly items: Signal<readonly MenuItem[]> = computed(() =>
        this.allItems().filter((i) => i.menu() === this && !i.owner())
    );
    readonly path = signal<MenuItem[]>([]);
    readonly rtl = computed(() => this.direction?.valueSignal() === 'rtl');
    private readonly hasSubmenus = computed(() => this.allItems().some((i) => !!i.submenu()));

    protected readonly navClass = computed(() =>
        cn(
            'm-0 box-border block w-fit p-0 font-sap-font-family text-sap-font-size',
            this.mobile() && 'w-full max-w-full'
        )
    );
    readonly listClass = computed(() =>
        cn(LIST, LIST_VARS, this.mobile() && ['max-w-full', MOBILE_VARS], this.icons() && ICON_VARS)
    );
    /** Current submenu level in mobile mode. */
    protected readonly mobileLevel: Signal<MenuItem | null> = computed(() => {
        const path = this.path().filter((i) => !!i.submenu());
        return path.length ? path[path.length - 1] : null;
    });
    protected readonly mobileTitle = computed(() => this.mobileLevel()?.titleText() || this.mobileConfig().title || '');

    constructor() {
        super();
        effect(() => {
            const cfg = this.config();
            this.popover.refreshConfiguration({
                ...cfg,
                placement: this.placement() ?? cfg.placement,
                triggers: this.mobile() ? [] : this.triggers(),
                disabled: this.disabled(),
                closeOnEscapeKey: this.closeOnEscapeKey(),
                closeOnOutsideClick: this.closeOnOutsideClick(),
                focusTrapped: this.focusTrapped(),
                focusAutoCapture: this.focusAutoCapture(),
                restoreFocusOnClose: this.restoreFocusOnClose(),
                fixedPosition: this.fixedPosition(),
                fillControlMode: this.fillControlMode(),
                // inline submenus must not be clipped by the scrolling wrapper
                disableScrollbar: this.disableScrollbar() || this.hasSubmenus(),
                additionalBodyClass: this.additionalBodyClass(),
                noArrow: true,
                bodyRole: null
            });
        });
        effect(() => this.popover.template.set(this.rootTemplate()));
        effect(() => {
            const trigger = this.trigger();
            if (trigger) untracked(() => this.popover.initialise(trigger));
        });
        // mobile mode: the trigger toggles the dialog
        effect((onCleanup) => {
            const trigger = this.trigger();
            if (!trigger || !this.mobile()) return;
            const toggle = () => this.toggle();
            trigger.addEventListener('click', toggle);
            onCleanup(() => trigger.removeEventListener('click', toggle));
        });
        // isOpen <-> popover / dialog
        let previous = false;
        effect(() => {
            const open = this.isOpen();
            untracked(() => {
                if (open && !previous) this.beforeOpen.emit();
                previous = open;
                if (open) this.show();
                else this.hide();
            });
        });
        effect(() => {
            const open = this.popover.isOpen();
            untracked(() => {
                if (!this.mobile() && open !== this.isOpen()) {
                    if (open) this.beforeOpen.emit();
                    previous = open;
                    this.isOpen.set(open);
                    if (!open) this.reset();
                }
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

    refreshPosition(): void {
        this.popover.refreshPosition();
    }

    private show(): void {
        if (this.mobile()) {
            if (this.dialogRef) return;
            this.dialogRef = this.dialogs.open(
                this.mobileTemplate(),
                {
                    mobile: true,
                    ariaLabelledBy: `${this.id()}-title`,
                    ...this.mobileConfig().dialogConfig,
                    escKeyCloseable: true,
                    backdropClickCloseable: false
                },
                this.injector
            );
            const ref = this.dialogRef;
            ref.afterClosed.subscribe({ next: () => this.dialogClosed(ref), error: () => this.dialogClosed(ref) });
            return;
        }
        if (!this.popover.isOpen()) this.popover.open();
    }

    private hide(): void {
        if (this.dialogRef) {
            this.dialogRef.close();
        } else if (this.popover.isOpen()) {
            this.popover.close();
        }
        this.reset();
    }

    private dialogClosed(ref: DialogRef): void {
        if (this.dialogRef !== ref) return;
        this.dialogRef = null;
        this.isOpen.set(false);
        this.reset();
    }

    private reset(): void {
        if (this.path().length) this.setPath([]);
    }

    /** Back to the parent level in mobile mode. */
    protected back(): void {
        const level = this.mobileLevel();
        if (!level) return;
        this.deactivate(level);
        afterNextRender(() => level.focus(), { injector: this.injector });
    }

    // --- active path ---

    /** Activates an item: opens its submenu, or marks it as the last selected item. */
    activate(item: MenuItem): void {
        if (item.disabled()) return;
        this.setPath([...item.ancestors(), item]);
    }

    /** Closes the submenu of an item (and everything below it). */
    deactivate(item: MenuItem): void {
        const index = this.path().indexOf(item);
        if (index !== -1) this.setPath(this.path().slice(0, index));
    }

    /** Closes the open submenus next to an item, when another sibling is hovered. */
    deactivateSiblings(item: MenuItem): void {
        this.setPath(item.ancestors());
    }

    private setPath(path: MenuItem[]): void {
        const current = this.path();
        if (current.length === path.length && current.every((item, i) => item === path[i])) return;
        this.path.set(path);
        this.activePath.emit(path);
    }

    /** Selection of a plain item: closes the menu when configured. */
    itemSelected(item: MenuItem): void {
        if (this.closeOnSelect() && !item.submenu() && item.interactive()?.kind() === 'item') this.close();
    }

    // --- keyboard ---

    private itemFor(target: EventTarget | null): MenuItem | undefined {
        const el = target as Node | null;
        if (!el) return undefined;
        const search = (items: readonly MenuItem[]): MenuItem | undefined => {
            for (const item of items) {
                if (item.interactive()?.elementRef.nativeElement.contains(el)) return item;
                const sub = item.submenu();
                const found = sub ? search(sub.items()) : undefined;
                if (found) return found;
            }
            return undefined;
        };
        return search(this.items());
    }

    private pressed: MenuItem | null = null;

    protected onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Tab' && !this.mobile()) {
            this.close();
            return;
        }
        const item = this.itemFor(event.target);
        if (!item) return;
        const siblings = item.siblings();
        const enabled = siblings.filter((i) => !i.disabled());
        const forward = this.rtl() ? 'ArrowLeft' : 'ArrowRight';
        const backward = this.rtl() ? 'ArrowRight' : 'ArrowLeft';
        const index = siblings.indexOf(item);
        switch (event.key) {
            case 'ArrowDown':
                siblings
                    .slice(index + 1)
                    .find((i) => !i.disabled())
                    ?.focus();
                break;
            case 'ArrowUp':
                siblings
                    .slice(0, index)
                    .reverse()
                    .find((i) => !i.disabled())
                    ?.focus();
                break;
            case 'Home':
                enabled[0]?.focus();
                break;
            case 'End':
                enabled[enabled.length - 1]?.focus();
                break;
            case forward:
                if (item.submenu() && !this.mobile()) this.openSubmenu(item);
                break;
            case backward: {
                const parent = item.parentItem();
                if (parent && !this.mobile()) {
                    this.deactivate(parent);
                    parent.focus();
                }
                break;
            }
            case 'Enter':
            case ' ':
                // activated on keyup, so a link does not navigate on keydown
                this.pressed = item;
                break;
            default:
                return;
        }
        event.preventDefault();
    }

    protected onKeyup(event: KeyboardEvent): void {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const item = this.itemFor(event.target);
        // ignore the keyup of the key that opened the menu from its trigger
        const pressed = this.pressed;
        this.pressed = null;
        if (!item || item !== pressed || item.disabled()) return;
        event.preventDefault();
        if (item.submenu()) this.openSubmenu(item);
        else item.click();
    }

    private openSubmenu(item: MenuItem): void {
        this.activate(item);
        afterNextRender(
            () =>
                item
                    .submenu()
                    ?.items()
                    .find((i) => !i.disabled())
                    ?.focus(),
            { injector: this.injector }
        );
    }
}

let nextSubmenuId = 0;

/**
 * Items of a submenu. Pass it to the parent item: `<li fd-menu-item [submenu]="sub">` with
 * `<fd-submenu #sub>...</fd-submenu>`.
 */
@Component({
    selector: 'fd-submenu',
    exportAs: 'fdSubmenu',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: MenuList, useExisting: forwardRef(() => Submenu) }],
    template: '<ng-template #tpl><ng-content /></ng-template>'
})
export class Submenu extends MenuList {
    readonly ariaLabel = input<string | null>(null);
    readonly ariaLabelledby = input<string | null>(null);
    readonly id = input(`fd-submenu-${nextSubmenuId++}`);
    readonly templateRef = viewChild.required<TemplateRef<unknown>>('tpl');
    /** The item that opens this submenu. */
    readonly parentItem = signal<MenuItem | null>(null);
    private readonly projected = contentChildren(
        forwardRef(() => MenuItem),
        { descendants: true }
    );
    private readonly registered = signal<MenuItem[]>([]);

    readonly items: Signal<readonly MenuItem[]> = computed(() => {
        const projected = this.projected().filter((i) => i.owner() === this);
        return projected.length ? projected : this.registered();
    });
    readonly menu: Signal<Menu | null> = computed(() => this.parentItem()?.menu() ?? null);
    readonly listClass = computed(() => {
        const mobile = this.menu()?.mobile();
        return cn(
            LIST,
            LIST_VARS,
            mobile
                ? ['static max-w-full', MOBILE_VARS]
                : [
                      'absolute start-full top-0 z-[2] mt-1 -ms-1 min-w-full bg-sap-list-background shadow-sap-content-shadow1',
                      // in a menu with icons, a submenu without icons gets wider paddings
                      !this.icons() &&
                          '[[data-menu-icons]_&]:[--mi-pl:var(--mi-sub-pad)] [[data-menu-icons]_&]:[--mi-pr:var(--mi-sub-pad)]'
                  ],
            this.icons() && ICON_VARS
        );
    });

    register(item: MenuItem): void {
        this.registered.update((items) => [...items, item]);
    }

    unregister(item: MenuItem): void {
        this.registered.update((items) => items.filter((i) => i !== item));
    }
}

/**
 * Item of a menu. Contains one `[fd-menu-interactive]` element with the title, addons and shortcut.
 */
@Component({
    selector: 'li[fd-menu-item]',
    exportAs: 'fdMenuItem',
    imports: [NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[attr.data-menu-icons]': 'listIcons() ? "" : null'
    },
    template: `
        <ng-content />
        @if (submenu(); as sub) {
            @if (!menu()?.mobile()) {
                <ul
                    role="menu"
                    [id]="sub.id()"
                    [attr.aria-label]="sub.ariaLabel() || titleText() || null"
                    [attr.aria-labelledby]="sub.ariaLabelledby()"
                    [class]="sub.listClass()"
                    [hidden]="!expanded()"
                >
                    @if (expanded()) {
                        <ng-container [ngTemplateOutlet]="sub.templateRef()" />
                    }
                </ul>
            }
        }
    `
})
export class MenuItem {
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly itemId = input(`fd-menu-item-${nextMenuItemId++}`);
    /** Submenu this item opens. */
    readonly submenu = input<Submenu | null | undefined>();
    /** Submenu this item belongs to, for items rendered from a template outside it. */
    readonly parentSubmenu = input<Submenu | null | undefined>();
    /** Draws a separator line below the item. */
    readonly hasSeparator = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    /** Emits when the item is activated: a click, Enter or Space. */
    readonly onSelect = output<void>();

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly injectedSubmenu = inject(Submenu, { optional: true });
    private readonly injectedMenu = inject(Menu, { optional: true });
    readonly interactive = signal<MenuInteractive | null>(null);
    private readonly icons = signal(0);
    /** Separator drawn by a single-choice group. */
    readonly groupSeparator = signal(false);
    /** Shows the item as the current choice, e.g. the main action of a split button. */
    readonly selected = signal(false);
    /** Set by `fdMenuSegmentedButtonHeader` on this item. */
    readonly segmentHeader = signal<MenuSegmentedButtonHeader<unknown> | null>(null);

    /** The submenu this item belongs to; null for root items. */
    readonly owner: Signal<Submenu | null> = computed(() => this.parentSubmenu() ?? this.injectedSubmenu ?? null);
    readonly menu: Signal<Menu | null> = computed(() => {
        const owner: Submenu | null = this.owner();
        return owner ? owner.menu() : this.injectedMenu;
    });
    readonly parentItem: Signal<MenuItem | null> = computed(() => this.owner()?.parentItem() ?? null);
    readonly siblings: Signal<readonly MenuItem[]> = computed(
        () => this.owner()?.items() ?? this.menu()?.items() ?? []
    );
    readonly expanded: Signal<boolean> = computed(() => !!this.submenu() && !!this.menu()?.path().includes(this));
    readonly hasIcon: Signal<boolean> = computed(() => this.icons() > 0);
    /** Whether the list of this item shows icons. */
    protected readonly listIcons: Signal<boolean> = computed(() => !!(this.owner() ?? this.menu())?.icons());
    readonly titleText = signal('');

    protected readonly computedClass = computed(() =>
        cn(
            'relative m-0 box-border w-full max-w-full p-0 bg-sap-list-background',
            'first:rounded-t-(--mr) last-of-type:rounded-b-(--mr)',
            (this.hasSeparator() || this.groupSeparator()) &&
                'border-b border-solid border-sap-group-content-border-color',
            this.userClass()
        )
    );

    constructor() {
        effect((onCleanup) => {
            const parent = this.parentSubmenu();
            if (!parent) return;
            untracked(() => parent.register(this));
            onCleanup(() => parent.unregister(this));
        });
        effect(() => {
            const sub = this.submenu();
            if (sub) untracked(() => sub.parentItem.set(this));
        });
    }

    /** @internal */
    registerIcon(delta: 1 | -1): void {
        this.icons.update((n) => n + delta);
    }

    ancestors(): MenuItem[] {
        const path: MenuItem[] = [];
        for (let p = this.parentItem(); p; p = p.parentItem()) path.unshift(p);
        return path;
    }

    focus(): void {
        this.interactive()?.elementRef.nativeElement.focus();
    }

    click(): void {
        this.interactive()?.elementRef.nativeElement.click();
    }

    /** @internal Called by the interactive element on click. */
    activated(): void {
        if (this.disabled()) return;
        const menu = this.menu();
        menu?.activate(this);
        this.onSelect.emit();
        if (this.submenu() && menu?.mobile()) {
            afterNextRender(
                () =>
                    this.submenu()
                        ?.items()
                        .find((i) => !i.disabled())
                        ?.focus(),
                {
                    injector: this.injector
                }
            );
        }
        menu?.itemSelected(this);
    }

    private readonly injector = inject(Injector);
}
let nextMenuItemId = 0;

const ADDON =
    'm-0 box-border flex shrink-0 items-center justify-center p-0 w-(--mi-icon-w) min-w-(--mi-icon-w) self-stretch bg-transparent text-sap-font-large-size text-(--mi-ic)';

export type MenuInteractiveKind = 'item' | 'toggle' | 'option' | 'input';

/**
 * The focusable element of a menu item (`a`, `button` or `div`).
 */
@Component({
    selector: '[fd-menu-interactive], [fdMenuInteractive]',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        'data-menu-link': '',
        '[attr.role]': 'role()',
        '[attr.tabindex]': 'disabled() ? -1 : 0',
        '[attr.aria-disabled]': 'disabled() || null',
        '[attr.aria-haspopup]': 'item?.submenu() && !item?.menu()?.mobile() ? "menu" : null',
        '[attr.aria-expanded]': 'item?.submenu() && !item?.menu()?.mobile() ? !!item?.expanded() : null',
        '[attr.aria-controls]': 'item?.submenu() && !item?.menu()?.mobile() ? item?.submenu()?.id() : null',
        '[attr.aria-checked]': 'kind() === "toggle" || kind() === "option" ? !!checked() : null',
        '[attr.aria-posinset]': 'position()?.[0] ?? null',
        '[attr.aria-setsize]': 'position()?.[1] ?? null',
        '[class]': 'computedClass()',
        '(click)': 'onClick($event)',
        '(mouseenter)': 'onEnter()',
        '(mouseleave)': 'onLeave()',
        '(keydown.enter)': 'focusInput($event)',
        '(keydown.space)': 'focusInput($event)'
    },
    template: `
        @if (mark(); as m) {
            <span class="${ADDON}" aria-hidden="true">
                @if (m === 'check') {
                    <fd-icon glyph="accept" class="text-[1rem] text-sap-content-selected-foreground-color" />
                } @else if (m === 'dot') {
                    <span class="size-3 rounded-full bg-sap-content-selected-foreground-color"></span>
                }
            </span>
        }
        <ng-content />
    `
})
export class MenuInteractive {
    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    protected readonly item = inject(MenuItem, { optional: true });
    /** What the element does; set by the toggle, option and input directives. */
    readonly kind = signal<MenuInteractiveKind>('item');
    readonly checked = signal(false);
    /** Start mark of toggles and options: a checkmark, a dot, or reserved space. */
    readonly mark = signal<'check' | 'dot' | 'empty' | null>(null);
    private hoverTimer: ReturnType<typeof setTimeout> | null = null;

    protected readonly disabled = computed(() => !!this.item?.disabled());
    protected readonly role = computed(() => {
        const kind = this.kind();
        return kind === 'toggle' ? 'menuitemcheckbox' : kind === 'option' ? 'menuitemradio' : 'menuitem';
    });
    protected readonly position = computed<[number, number] | null>(() => {
        const siblings = this.item?.siblings() ?? [];
        const index = this.item ? siblings.indexOf(this.item) : -1;
        return index === -1 ? null : [index + 1, siblings.length];
    });

    protected readonly computedClass = computed(() => {
        const submenu = !!this.item?.submenu();
        return cn(
            'relative m-0 box-border flex w-full min-h-(--mi-h) cursor-pointer items-center p-0 ps-(--mi-pl) pe-(--mi-pr)',
            'rounded-[inherit] no-underline outline-none bg-(--mi-bg) border-b border-solid border-b-(--mi-bb)',
            '[--mi-bg:var(--sapList_Background)] [--mi-bb:transparent] [--mi-ic:var(--sapContent_NonInteractiveIconColor)] [--mi-sc:var(--sapContent_LabelColor)] [--mi-tc:var(--sapList_TextColor)]',
            'enabled-hover:[--mi-bg:var(--sapList_Hover_Background)]',
            // focus: an inner frame
            "focus:after:pointer-events-none focus:after:absolute focus:after:inset-0.5 focus:after:content-['']",
            'focus:after:border-(length:--sapContent_FocusWidth) focus:after:[border-style:var(--sapContent_FocusStyle)] focus:after:border-sap-content-focus-color',
            // selected: an open submenu
            submenu && 'pe-0',
            ((submenu && this.item?.expanded()) || this.item?.selected()) &&
                'not-active:[--mi-bg:var(--sapList_SelectionBackgroundColor)] not-active:[--mi-bb:var(--sapList_SelectionBorderColor)] not-active:enabled-hover:[--mi-bg:var(--sapList_Hover_SelectionBackground)]',
            // pressed
            'enabled-active:[--mi-bg:var(--sapList_Active_Background)] enabled-active:[--mi-ic:var(--sapList_Active_TextColor)] enabled-active:after:hidden',
            this.disabled() && 'pointer-events-none opacity-(--sapContent_DisabledOpacity) focus:after:hidden'
        );
    });

    constructor() {
        this.item?.interactive.set(this);
        inject(DestroyRef).onDestroy(() => {
            this.clearHover();
            if (this.item?.interactive() === this) this.item.interactive.set(null);
        });
    }

    protected onClick(event: MouseEvent): void {
        if (this.disabled()) {
            event.preventDefault();
            return;
        }
        this.item?.activated();
    }

    protected onEnter(): void {
        const item = this.item;
        const menu = item?.menu();
        if (!item || !menu || menu.mobile()) return;
        this.clearHover();
        this.hoverTimer = setTimeout(() => {
            if (item.submenu()) menu.activate(item);
            else menu.deactivateSiblings(item);
        }, menu.openOnHoverTime());
    }

    protected onLeave(): void {
        this.clearHover();
    }

    private clearHover(): void {
        if (this.hoverTimer !== null) clearTimeout(this.hoverTimer);
        this.hoverTimer = null;
    }

    /** Enter or Space on an item with an input moves the focus into the input. */
    protected focusInput(event: Event): void {
        if (event.target !== this.elementRef.nativeElement) return;
        const input = this.elementRef.nativeElement.querySelector<HTMLElement>(
            '[fd-menu-item-input], [fdMenuItemInput]'
        );
        if (input) {
            event.preventDefault();
            input.focus();
        }
    }
}

/**
 * Icon before or after the item text; `submenuIndicator` shows the submenu arrow.
 *
 * ```html
 * <fd-menu-addon position="before" glyph="cart" />
 * <fd-menu-addon submenuIndicator />
 * ```
 */
@Component({
    selector: 'fd-menu-addon',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        'aria-hidden': 'true',
        '[class]': 'computedClass()'
    },
    template: `
        @if (submenuIndicator()) {
            <fd-icon glyph="navigation-right-arrow" class="text-[1rem]" />
        } @else if (glyph()) {
            <fd-icon [glyph]="glyph()" />
        }
        <ng-content />
    `
})
export class MenuAddon {
    readonly position = input<'before' | 'after'>('after');
    readonly glyph = input<string | null | undefined>();
    readonly submenuIndicator = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly item = inject(MenuItem, { optional: true });
    protected readonly computedClass = computed(() => cn(ADDON, this.userClass()));

    constructor() {
        // glyph addons make the list align its texts after the icon column
        effect((onCleanup) => {
            const counts = !!this.glyph() && !this.submenuIndicator();
            if (!counts || !this.item) return;
            const item = this.item;
            untracked(() => item.registerIcon(1));
            onCleanup(() => item.registerIcon(-1));
        });
    }
}

/** Texts of a list with icons start after the icon column, unless an addon precedes them. */
const TEXT_IN_ICON_LIST =
    '[[data-menu-icons]>[data-menu-link]>&]:first:ms-(--mi-icon-w) [[data-menu-icons]>[data-menu-link]>&]:last:me-(--mi-text-r)';

/** Title of a menu item. */
@Directive({
    selector: '[fd-menu-title], [fdMenuTitle]',
    host: { '[class]': 'computedClass()' }
})
export class MenuTitle {
    /** Truncates the title to one line. */
    readonly truncate = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly item = inject(MenuItem, { optional: true });

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 my-1 box-border w-full p-0 text-start font-sap-font-family text-sap-font-size text-(--mi-tc) whitespace-normal',
            'has-[+[fd-menu-item-input]]:w-fit has-[+[fd-menu-item-input]]:min-w-fit',
            TEXT_IN_ICON_LIST,
            this.truncate() && 'truncate',
            this.userClass()
        )
    );

    /** Text of the title. */
    get title(): string {
        return this.el.textContent?.trim() ?? '';
    }

    constructor() {
        afterNextRender(() => {
            if (this.item && !this.item.titleText()) this.item.titleText.set(this.title);
        });
    }
}

/** Subtitle of a menu item, inside `[fd-menu-content]`. */
@Directive({
    selector: '[fd-menu-subtitle], [fdMenuSubtitle]',
    host: { '[class]': 'computedClass()' }
})
export class MenuSubtitle {
    readonly truncate = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 mb-1 box-border w-full p-0 text-start font-sap-font-family text-sap-font-size text-sap-content-label-color whitespace-normal',
            this.truncate() && 'truncate',
            this.userClass()
        )
    );
}

/** Stacks a title and a subtitle. */
@Directive({
    selector: '[fd-menu-content], [fdMenuContent]',
    host: {
        class: `m-0 box-border flex flex-1 flex-col overflow-hidden p-0 ${TEXT_IN_ICON_LIST}`
    }
})
export class MenuContent {}

/** Keyboard shortcut at the end of an item. Hidden in mobile mode unless `hideOnMobile` is false. */
@Directive({
    selector: '[fd-menu-shortcut], [fdMenuShortcut]',
    host: {
        '[class]': 'computedClass()'
    }
})
export class MenuShortcut {
    readonly hideOnMobile = input(true, { transform: booleanAttribute });
    private readonly item = inject(MenuItem, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex shrink-0 truncate p-0 ps-(--mi-sc-pl) last:pe-(--mi-sc-pr)',
            'font-sap-font-family text-sap-font-size font-normal text-(--mi-sc)',
            this.hideOnMobile() && this.item?.menu()?.mobile() && 'hidden'
        )
    );
}

/** An input inside a menu item; arrow keys and clicks stay in the field. */
@Directive({
    selector: 'input[fd-menu-item-input], input[fdMenuItemInput]',
    host: {
        class: 'mx-(--mi-text-r)',
        '(keydown)': 'stop($event)',
        '(keyup)': 'stop($event)',
        '(click)': 'stop($event)'
    }
})
export class MenuItemInput {
    private readonly interactive = inject(MenuInteractive, { optional: true });
    constructor() {
        this.interactive?.kind.set('input');
    }
    protected stop(event: Event): void {
        // Tab still leaves (and closes) the menu
        if (event instanceof KeyboardEvent && event.key === 'Tab') return;
        if (event instanceof KeyboardEvent && event.key === 'Escape') return;
        event.stopPropagation();
    }
}

/**
 * A menu item that toggles a value, with a checkmark when on. Two-way bind `[(checked)]` or use
 * forms.
 *
 * ```html
 * <li fd-menu-item><button fd-menu-interactive toggle [(checked)]="bold"><span fd-menu-title>Bold</span></button></li>
 * ```
 */
@Directive({
    selector: '[fd-menu-interactive][toggle], [fdMenuInteractive][toggle]',
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MenuToggle), multi: true }],
    host: { '(click)': 'toggle()' }
})
export class MenuToggle implements ControlValueAccessor {
    readonly checked = model(false);
    private readonly interactive = inject(MenuInteractive, { host: true });
    private readonly item = inject(MenuItem, { optional: true });
    private onChange: (value: boolean) => void = () => {};
    protected onTouched: () => void = () => {};

    constructor() {
        this.interactive.kind.set('toggle');
        effect(() => {
            this.interactive.checked.set(this.checked());
            this.interactive.mark.set(this.checked() ? 'check' : 'empty');
        });
        effect((onCleanup) => {
            const item = this.item;
            if (!item) return;
            untracked(() => item.registerIcon(1));
            onCleanup(() => item.registerIcon(-1));
        });
    }

    protected toggle(): void {
        if (this.item?.disabled()) return;
        this.checked.update((v) => !v);
        this.onChange(this.checked());
        this.onTouched();
    }

    writeValue(value: boolean): void {
        this.checked.set(!!value);
    }
    registerOnChange(fn: (value: boolean) => void): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
}

/**
 * Header of a single-choice group: the options (`fdMenuSegmentedButtonOption`) that follow it in
 * the same list. Two-way bind `[(value)]` or use forms.
 */
@Directive({
    selector: 'li[fd-menu-item][fdMenuSegmentedButtonHeader]',
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MenuSegmentedButtonHeader), multi: true }]
})
export class MenuSegmentedButtonHeader<T> implements ControlValueAccessor {
    readonly value = model<T | null | undefined>(undefined);
    readonly valueComparator = input<(a: T | null | undefined, b: T | null | undefined) => boolean>((a, b) => a === b);
    private readonly item = inject(MenuItem, { host: true });
    private onChange: (value: T | null | undefined) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        this.item.segmentHeader.set(this as MenuSegmentedButtonHeader<unknown>);
        this.item.groupSeparator.set(true);
    }

    /** @internal */
    choose(value: T | null | undefined): void {
        this.value.set(value);
        this.onChange(value);
        this.onTouched();
    }

    writeValue(value: T): void {
        this.value.set(value);
    }
    registerOnChange(fn: (value: T | null | undefined) => void): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
}

/** Option of a single-choice group, with a dot when chosen. */
@Directive({
    selector: 'li[fd-menu-item][fdMenuSegmentedButtonOption]',
    host: { '(click)': 'choose($event)' }
})
export class MenuSegmentedButtonOption<T> {
    readonly value = input<T | null>(null);
    private readonly item = inject(MenuItem, { host: true });

    /** The closest group header before this option in its list. */
    private readonly header = computed(() => {
        const siblings = this.item.siblings();
        for (let i = siblings.indexOf(this.item) - 1; i >= 0; i--) {
            const header = siblings[i].segmentHeader();
            if (header) return header as MenuSegmentedButtonHeader<T | null>;
        }
        return null;
    });
    readonly selected = computed(() => {
        const header = this.header();
        return !!header && header.valueComparator()(header.value(), this.value());
    });

    constructor() {
        effect(() => {
            const interactive = this.item.interactive();
            if (!interactive) return;
            interactive.kind.set('option');
            interactive.checked.set(this.selected());
            interactive.mark.set(this.selected() ? 'dot' : 'empty');
        });
        // the last option of the group closes it with a separator
        effect(() => {
            const siblings = this.item.siblings();
            const next = siblings[siblings.indexOf(this.item) + 1];
            this.item.groupSeparator.set(!next || next.interactive()?.kind() !== 'option' || !!next.segmentHeader());
        });
        effect((onCleanup) => {
            const item = this.item;
            untracked(() => item.registerIcon(1));
            onCleanup(() => item.registerIcon(-1));
        });
    }

    protected choose(event: Event): void {
        event.preventDefault();
        if (this.item.disabled()) return;
        this.header()?.choose(this.value());
    }
}

/**
 * Opens a menu from any element and announces it: aria-haspopup, aria-expanded and aria-controls.
 * ArrowDown also opens the menu.
 */
@Directive({
    selector: '[fdMenuTrigger]',
    host: {
        'aria-haspopup': 'menu',
        '[attr.aria-expanded]': 'menu()?.isOpen() ?? false',
        '[attr.aria-controls]': 'menu()?.isOpen() ? menu()?.id() : null',
        '(keydown.arrowdown)': 'openFromKeyboard($event)'
    }
})
export class MenuTrigger {
    readonly menu = input<Menu | null | undefined>(null, { alias: 'fdMenuTrigger' });
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    constructor() {
        effect(() => this.menu()?.trigger.set(this.el));
    }

    protected openFromKeyboard(event: Event): void {
        const menu = this.menu();
        if (!menu || menu.isOpen()) return;
        event.preventDefault();
        menu.open();
    }
}
