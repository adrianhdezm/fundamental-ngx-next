/*
 * Port of @fundamental-ngx/core (list) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { FocusKeyManager, type FocusableOption } from '@angular/cdk/a11y';
import { DecimalPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    InjectionToken,
    afterRenderEffect,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    forwardRef,
    inject,
    input,
    linkedSignal,
    numberAttribute,
    output,
    signal
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Checkbox } from '@/ui/checkbox/checkbox';
import { Icon, iconGlyphChar, iconVariants, type IconFont } from '@/ui/icon/icon';
import { RadioButton } from '@/ui/radio/radio';

export type ListSecondaryType = 'positive' | 'critical' | 'negative' | 'informative';
export type ListBylineStatus = 'neutral' | 'positive' | 'negative' | 'critical' | 'informative';
export type ListMessageType = 'error' | 'warning' | 'success' | 'information';
export type FocusEscapeDirection = 'up' | 'down';

const STATUS_COLOR: Record<ListBylineStatus, string> = {
    neutral: 'text-sap-neutral-text-color',
    positive: 'text-sap-positive-text-color',
    negative: 'text-sap-negative-text-color',
    critical: 'text-sap-critical-text-color',
    informative: 'text-sap-informative-text-color'
};

const MESSAGE_BACKGROUND: Record<ListMessageType | 'neutral', string> = {
    neutral: 'bg-sap-neutral-background',
    error: 'bg-sap-error-background',
    warning: 'bg-sap-warning-background',
    success: 'bg-sap-success-background',
    information: 'bg-sap-information-background'
};

/** Visible focus of list items and links: an inner frame, in the contrast colour while pressed. */
const FOCUS_FRAME = [
    "focus:outline-none focus:before:pointer-events-none focus:before:absolute focus:before:inset-x-0.5 focus:before:top-0.5 focus:before:bottom-px focus:before:block focus:before:content-['']",
    'focus:before:border-(length:--sapContent_FocusWidth) focus:before:[border-style:var(--sapContent_FocusStyle)] focus:before:border-sap-content-focus-color',
    'hc:focus:active:before:border-sap-content-contrast-focus-color'
];

/** Hover and pressed states of interactive items and links (through the --li-* colours). */
const INTERACTIVE_STATES = [
    'cursor-pointer enabled-hover:[--li-bg:var(--sapList_Hover_Background)]',
    'data-[selected]:enabled-hover:[--li-bg:var(--sapList_Hover_SelectionBackground)]',
    'active:[--li-bg:var(--sapList_Active_Background)] active:[--li-tc:var(--sapList_Active_TextColor)] active:[--li-bc:var(--sapList_Active_Background)]',
    'data-[selected]:active:[--li-bg:var(--sapList_Active_Background)] data-[selected]:active:[--li-tc:var(--sapList_Active_TextColor)] data-[selected]:active:[--li-bc:var(--sapList_Active_Background)]',
    'active:[&_*]:[text-shadow:none]'
];

/** An element the list moves focus between with the arrow keys. */
export interface ListFocusable extends FocusableOption {
    readonly element: HTMLElement;
    setTabbable(tabbable: boolean): void;
}
export const FD_LIST_FOCUSABLE = new InjectionToken<ListFocusable>('FdListFocusable');

let nextItemId = 0;
let nextGroupHeaderId = 0;

/**
 * List: items with titles, secondary text, icons, bylines, links, selection controls, group
 * headers and footers. One item is in the tab order; arrow keys move between items.
 *
 * ```html
 * <ul fd-list>
 *     <li fd-list-item><span fd-list-title>Apples</span><span fd-list-secondary>12</span></li>
 *     <li fd-list-item interactive (click)="open()"><span fd-list-title>Pears</span></li>
 * </ul>
 * ```
 */
@Directive({
    selector: '[fd-list], [fdList]',
    exportAs: 'fdList',
    host: {
        '[attr.role]': 'role() ?? "list"',
        '[class]': 'computedClass()',
        '(keydown)': 'onKeydown($event)'
    }
})
export class List {
    /** Items with a title and byline (larger, two-line items). */
    readonly byline = input(false, { transform: booleanAttribute });
    /** Byline items without the input, for components built on the list (e.g. an upload collection). */
    readonly bylineDefault = signal(false);
    readonly hasByline = computed(() => this.byline() || this.bylineDefault());
    /** Items with a title and a subline. */
    readonly subline = input(false, { transform: booleanAttribute });
    /** Items with a checkbox or radio button for selection. */
    readonly selection = input(false, { transform: booleanAttribute });
    readonly noBorder = input(false, { transform: booleanAttribute });
    /** Reserves space for navigation arrows of link items. */
    readonly navigationIndicator = input(false, { transform: booleanAttribute });
    /** Reserves space for unread indicators. */
    readonly unreadIndicator = input(false, { transform: booleanAttribute });
    /** Leaves room for a list message (fd-list-message) above the items. */
    readonly hasMessage = input(false, { transform: booleanAttribute });
    /** Titles and secondary texts wrap instead of truncating. */
    readonly wrap = input(false, { transform: booleanAttribute });
    /** Arrow-key navigation between items. */
    readonly keyboardSupport = input(true, { transform: booleanAttribute });
    readonly role = input<string | null | undefined>();
    readonly selectedLabel = input('Selected');
    readonly notSelectedLabel = input('Not selected');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    /** Arrow up on the first or down on the last item. */
    readonly focusEscapeList = output<FocusEscapeDirection>();

    private readonly focusables = contentChildren(FD_LIST_FOCUSABLE, { descendants: true });
    private readonly links = contentChildren(
        forwardRef(() => ListLink),
        { descendants: true }
    );
    /** Some items are links: their paddings move to the links. */
    readonly hasNavigation = computed(() => this.links().length > 0);

    private keyManager?: FocusKeyManager<ListFocusable>;
    private managedItems?: readonly ListFocusable[];
    private readonly tabbableIndex = signal(0);

    constructor() {
        afterRenderEffect(() => {
            const items = this.focusables();
            const tabbable = Math.min(this.tabbableIndex(), items.length - 1);
            items.forEach((item, index) => item.setTabbable(this.keyboardSupport() && index === Math.max(tabbable, 0)));
        });
        inject(DestroyRef).onDestroy(() => this.keyManager?.destroy());
    }

    /** Focuses the item at the index. */
    setItemActive(index: number): void {
        this.manager().setActiveItem(index);
        this.tabbableIndex.set(index);
    }

    /** Called by items when they receive focus. */
    itemFocused(item: ListFocusable): void {
        const index = this.focusables().indexOf(item);
        if (index < 0) return;
        this.manager().updateActiveItem(index);
        this.tabbableIndex.set(index);
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (!this.keyboardSupport()) return;
        // keys typed in a field inside an item stay with the field
        const target = event.target as HTMLElement;
        if (target.matches?.('input, textarea, select, [contenteditable]:not([contenteditable=false])')) return;
        const manager = this.manager();
        const items = this.focusables();
        const current = items.findIndex((item) => item.element.contains(document.activeElement));
        if (current < 0) return;
        manager.updateActiveItem(current);
        if (event.key === 'ArrowUp' && current === 0) {
            this.focusEscapeList.emit('up');
            return;
        }
        if (event.key === 'ArrowDown' && current === items.length - 1) {
            this.focusEscapeList.emit('down');
            return;
        }
        if (['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
            manager.onKeydown(event);
            event.preventDefault();
            if (manager.activeItemIndex != null) this.tabbableIndex.set(manager.activeItemIndex);
        }
    }

    /** Key manager over the current items, rebuilt when the items change. */
    private manager(): FocusKeyManager<ListFocusable> {
        const items = this.focusables();
        if (!this.keyManager || this.managedItems !== items) {
            this.keyManager?.destroy();
            this.managedItems = items;
            this.keyManager = new FocusKeyManager<ListFocusable>([...items])
                .withVerticalOrientation()
                .withHomeAndEnd()
                .withPageUpDown();
        }
        return this.keyManager;
    }

    protected readonly computedClass = computed(() =>
        cn(
            'relative m-0 box-border w-full max-w-full list-none p-0 font-sap-font-family text-sap-font-size',
            '[--li-fs:var(--sapFontLargeSize)] compact:[--li-fs:var(--sapFontSize)] [--li-ifs:1.125rem] compact:[--li-ifs:1rem]',
            '[--li-h:var(--sapElement_LineHeight)] compact:[--li-h:var(--sapElement_Compact_LineHeight)]',
            this.hasMessage() && 'pt-8',
            this.userClass()
        )
    );
}

/**
 * List item. Interactive items toggle their selection on click, Enter and Space; items with a
 * checkbox or radio button select it; link items open their link.
 */
@Component({
    selector: '[fd-list-item], [fdListItem]',
    exportAs: 'fdListItem',
    imports: [Icon, DecimalPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: FD_LIST_FOCUSABLE, useExisting: forwardRef(() => ListItem) }],
    host: {
        '[attr.id]': 'id()',
        '[attr.role]': 'computedRole()',
        '[attr.tabindex]': 'tabbable() ? 0 : -1',
        '[attr.aria-selected]': 'computedRole() === "option" ? isSelected() : null',
        '[attr.aria-describedby]': 'list?.selection() ? id() + "-selection" : null',
        '[attr.data-selected]': 'isSelected() ? "" : null',
        '[class]': 'computedClass()',
        '(click)': 'onClick($event)',
        '(keydown)': 'onKeydown($event)',
        '(keyup)': 'onKeyup($event)',
        '(focus)': 'onFocus()',
        '(focusin)': 'list?.itemFocused(this)'
    },
    template: `
        @if (checkbox() || radio()) {
            <!-- options carry the selection themselves; the control is only visual -->
            <div [class]="formItemClass()" [attr.inert]="computedRole() === 'option' ? '' : null">
                <ng-content select="fd-checkbox" />
                <ng-content select="fd-radio-button" />
            </div>
        }
        @if (list?.selection()) {
            <span class="sr-only-sap" [id]="id() + '-selection'" aria-hidden="true">{{
                isSelected() ? list.selectedLabel() : list.notSelectedLabel()
            }}</span>
        }
        @if (unread() && (!list || list.hasByline())) {
            <fd-icon
                glyph="circle-task-2"
                class="absolute start-4 top-1/2 -translate-y-1/2 text-[0.375rem] text-sap-accent-color6"
            />
        }
        <ng-content />
        @if (hasCounter() && !link()) {
            <span [class]="counterClass()" [attr.role]="counterRole()" [attr.aria-label]="counterAriaLabel()">{{
                counter() | number: '1.0-2'
            }}</span>
        }
        @if (active()) {
            <fd-icon glyph="sys-enter-2" class="ms-2 text-sap-content-non-interactive-icon-color" />
        }
    `
})
export class ListItem<T = unknown> implements ListFocusable {
    readonly id = input(`fd-list-item-${nextItemId++}`);
    readonly value = input<T>();
    /** Selection of interactive items; two-way bindable. Checkbox and radio items follow their control. */
    readonly selected = input(false, { transform: booleanAttribute });
    readonly selectedChange = output<boolean>();
    private readonly selectedState = linkedSignal(() => this.selected());
    /** Clickable item with hover and pressed states that toggles its selection. */
    readonly interactive = input(false, { transform: booleanAttribute });
    /** Unavailable item: no pointer events. */
    readonly inactive = input(false, { transform: booleanAttribute });
    /** Placeholder item ("No data") with a centered title. */
    readonly noData = input(false, { transform: booleanAttribute });
    /** Item that holds an action button (fd-list-title on a button). */
    readonly action = input(false, { transform: booleanAttribute });
    /** "More" item that loads further items. */
    readonly growing = input(false, { transform: booleanAttribute });
    /** Bold title and, in byline lists, an unread dot. */
    readonly unread = input(false, { transform: booleanAttribute });
    /** Byline layout for this item only. */
    readonly byline = input(false, { transform: booleanAttribute });
    /** Wraps the title and secondary text of this item. */
    readonly wrap = input(false, { transform: booleanAttribute });
    /** Shows a check mark after the content (e.g. the current entry). */
    readonly active = input(false, { transform: booleanAttribute });
    readonly counter = input<number | null | undefined, unknown>(undefined, {
        transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v))
    });
    readonly counterRole = input<string | null | undefined>();
    readonly counterAriaLabel = input<string | null | undefined>();
    readonly ariaRole = input<string | null | undefined>();
    /** Ignores clicks (no selection toggling). */
    readonly preventClick = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly keyDown = output<KeyboardEvent>();

    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly list = inject(List, { optional: true });
    readonly checkbox = contentChild(Checkbox);
    readonly radio = contentChild(RadioButton);
    readonly link = contentChild(forwardRef(() => ListLink));
    protected readonly tabbable = signal(false);

    readonly isSelected = computed(() => {
        const checkbox = this.checkbox();
        if (checkbox) return checkbox.checkState() === 'checked';
        const radio = this.radio();
        if (radio) return radio.checked();
        return this.selectedState();
    });
    readonly isByline = computed(() => this.byline() || !!this.list?.hasByline());
    readonly isWrapped = computed(() => this.wrap() || !!this.list?.wrap());
    protected readonly hasCounter = computed(() => this.counter() != null);
    protected readonly computedRole = computed(
        () => this.ariaRole() ?? (this.checkbox() || this.radio() ? 'option' : 'listitem')
    );

    constructor() {
        // selection controls are reached through the item, not with Tab
        afterRenderEffect(() => {
            this.checkbox()?.tabIndexValue.set(-1);
            this.radio()?.tabIndexState.set(-1);
        });
    }

    focus(): void {
        this.element.focus();
    }
    setTabbable(tabbable: boolean): void {
        this.tabbable.set(tabbable);
    }
    get disabled(): boolean {
        return this.inactive();
    }

    protected onClick(event: MouseEvent): void {
        if (this.preventClick()) return;
        const target = event.target as Node;
        const checkbox = this.checkbox();
        if (checkbox && !checkbox.disabled() && !this.link()) {
            if (!checkbox.elementRef.nativeElement.contains(target)) checkbox.nextValue();
            return;
        }
        const radio = this.radio();
        if (radio && !radio.disabled() && !this.link()) {
            if (!radio.elementRef.nativeElement.contains(target)) radio.select();
            return;
        }
        if (this.interactive() && !this.isInsideControl(target)) this.toggleSelected();
    }

    protected onKeydown(event: KeyboardEvent): void {
        if ((event.key === 'Enter' || event.key === ' ') && event.target === this.element) {
            const checkbox = this.checkbox();
            const radio = this.radio();
            if (checkbox && !checkbox.disabled()) checkbox.nextValue();
            else if (radio && !radio.disabled()) radio.select();
            else if (this.interactive()) this.toggleSelected();
            else if (this.link()) this.link()!.pressed.set(true);
            else {
                this.keyDown.emit(event);
                return;
            }
            event.preventDefault();
            event.stopPropagation();
        }
        this.keyDown.emit(event);
    }

    protected onKeyup(event: KeyboardEvent): void {
        const link = this.link();
        if ((event.key === 'Enter' || event.key === ' ') && link?.pressed()) {
            link.pressed.set(false);
            link.element.click();
            event.preventDefault();
        }
    }

    protected onFocus(): void {
        const link = this.link();
        if (link?.focusable()) link.element.focus();
    }

    /** Sets the selection from outside, e.g. by a settings container; `selectedChange` does not emit. */
    setSelected(selected: boolean): void {
        this.selectedState.set(selected);
    }

    private toggleSelected(): void {
        this.selectedState.update((v) => !v);
        this.selectedChange.emit(this.selectedState());
    }

    private isInsideControl(target: Node): boolean {
        const control = (target as Element).closest?.('button, a, input, textarea, select');
        return !!control && control !== this.element && this.element.contains(control);
    }

    protected readonly formItemClass = computed(() =>
        cn(
            'm-0 flex items-center',
            this.list?.selection() && [
                'absolute start-0 top-0 z-[5] compact:start-1.5',
                this.isByline() ? 'top-[0.3125rem] compact:top-2' : this.isWrapped() && 'top-1/2 -translate-y-1/2'
            ]
        )
    );

    protected readonly counterClass = computed(() =>
        cn(
            'm-0 ms-4 shrink-0 truncate p-0 text-sap-content-marker-text-color',
            this.isByline() && 'flex h-full min-w-8 items-center justify-end self-center'
        )
    );

    protected readonly computedClass = computed(() => {
        const list = this.list;
        const byline = this.isByline();
        const selection = !!list?.selection();
        const link = !!this.link();
        const navigation = link || !!list?.hasNavigation();
        const subline = !!list?.subline();
        return cn(
            'relative m-0 box-border flex items-center bg-(--li-bg) font-sap-font-family text-sap-font-size',
            'h-(--li-h) border-b-(length:--li-bw) border-solid border-(--li-bc)',
            '[--li-bg:var(--sapList_Background)] [--li-tc:var(--sapList_TextColor)] [--li-bc:var(--sapList_BorderColor)] [--li-bw:var(--sapList_BorderWidth)]',
            'px-[0.9375rem] py-0 [&>fd-avatar:first-child]:me-3 [&>button[fdButton]]:ms-0.5 [&>button[fdButton]]:self-center',
            FOCUS_FRAME,
            // selected: any item
            'data-[selected]:[--li-bg:var(--sapList_SelectionBackgroundColor)] data-[selected]:[--li-bc:var(--sapList_SelectionBorderColor)]',
            (this.interactive() || selection) && !link && INTERACTIVE_STATES,
            list?.noBorder() && '[--li-bw:0] data-[selected]:[--li-bw:var(--sapList_BorderWidth)]',
            (this.isWrapped() || !!this.wrap()) && 'h-auto min-h-(--li-h)',
            'has-[[data-list-wrap]]:h-auto has-[[data-list-wrap]]:min-h-(--li-h)',
            selection && 'ps-11',
            byline && [
                'h-auto min-h-20 w-full items-start px-4 py-[0.9375rem]',
                selection && 'ps-11',
                list?.unreadIndicator() && 'ps-[2.125rem]',
                list?.noBorder() && 'py-2 first:pt-[0.9375rem] last:pb-[0.9375rem]'
            ],
            subline && 'h-auto min-h-[4.5rem] gap-3 px-4 py-2',
            navigation && link && 'p-0',
            this.action() && [
                'p-0 text-center [--li-h:var(--sapElement_LineHeight)] compact:[--li-h:var(--sapElement_Compact_LineHeight)]',
                'first:border-t first:border-sap-list-border-color hc:[--li-bw:0] hc:first:border-t-0'
            ],
            this.growing() && 'compact:[--li-h:var(--sapElement_LineHeight)] [--li-h:var(--sapElement_LineHeight)]',
            this.inactive() && 'pointer-events-none',
            this.userClass()
        );
    });
}

/** Title of a list item. */
@Directive({
    selector: '[fd-list-title], [fdListTitle]',
    host: {
        'data-list-title': '',
        '[attr.data-list-wrap]': 'wrap() ? "" : null',
        '[attr.tabindex]': 'isAnchor ? -1 : null',
        '[class]': 'computedClass()'
    }
})
export class ListTitle {
    readonly wrap = input(false, { transform: booleanAttribute });
    /** @deprecated titles truncate by default. */
    readonly truncate = input(false, { transform: booleanAttribute });
    /** Scope of search results (smaller, label coloured). */
    readonly scope = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly isAnchor = this.element.tagName === 'A';
    private readonly item = inject(ListItem, { optional: true });
    private readonly list = inject(List, { optional: true });
    private readonly groupHeader = inject(
        forwardRef(() => ListGroupHeader),
        { optional: true }
    );

    protected readonly computedClass = computed(() => {
        const item = this.item;
        const wrap = this.wrap() || !!item?.isWrapped();
        const byline = !!item?.isByline();
        if (this.groupHeader) {
            return cn(
                'm-0 truncate p-0 font-sap-font-header-family text-sap-font-header6-size leading-8 font-bold text-sap-list-table-group-header-text-color',
                wrap && 'whitespace-normal break-words',
                this.userClass()
            );
        }
        return cn(
            'pointer-events-none m-0 min-h-(--li-fs) flex-[3_3_10%] truncate p-0 text-(length:--li-fs) leading-[normal] text-(--li-tc) [&:last-child:first-child]:basis-auto',
            wrap && ['whitespace-normal break-words', !byline && 'my-3'],
            byline && 'min-h-4',
            item?.unread() && 'font-bold',
            item?.noData() && 'text-center',
            this.list?.subline() &&
                'w-full max-w-full font-sap-font-semibold-duplex-family text-sap-font-size text-sap-list-text-color not-italic',
            this.scope() && 'text-sap-font-size text-sap-content-label-color',
            item?.growing() && 'flex items-center justify-center gap-2',
            item?.action() && [
                // Horizon: the whole item is the button; high contrast: an inset bordered button
                'pointer-events-auto m-0 h-full w-full cursor-pointer rounded-none border-0 bg-transparent px-[0.9375rem] py-0 text-sap-button-text-color',
                'hc:m-1 hc:h-10 hc:rounded-[0.375rem] hc:border hc:border-solid hc:border-sap-list-border-color compact:hc:h-[1.625rem]',
                'enabled-hover:bg-sap-list-hover-background active:bg-sap-list-active-background active:text-sap-list-active-text-color',
                'focus:outline-sap focus:-outline-offset-2 hc:active:focus:outline-sap-content-contrast-focus-color'
            ],
            this.userClass()
        );
    });
}

/** Text inside a title, e.g. the label of a growing item. */
@Directive({
    selector: '[fd-list-title-text], [fdListTitleText]',
    host: { '[class]': 'computedClass()' }
})
export class ListTitleText {
    private readonly item = inject(ListItem, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 flex items-center truncate p-0 text-sap-font-size text-inherit [text-shadow:inherit]',
            this.item?.growing() && 'font-bold'
        )
    );
}

/** Secondary text at the end of a list item, optionally coloured by status. */
@Directive({
    selector: '[fd-list-secondary], [fdListSecondary]',
    host: {
        '[attr.data-list-wrap]': 'wrap() ? "" : null',
        '[class]': 'computedClass()'
    }
})
export class ListSecondary {
    readonly type = input<ListSecondaryType | null | undefined>();
    readonly wrap = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly item = inject(ListItem, { optional: true });

    protected readonly computedClass = computed(() => {
        const wrap = this.wrap() || !!this.item?.isWrapped();
        return cn(
            'pointer-events-none m-0 max-w-[40%] truncate p-0 ps-4 text-end text-sap-font-size leading-[normal]',
            STATUS_COLOR[this.type() ?? 'neutral'],
            wrap && ['whitespace-normal break-words', !this.item?.isByline() && 'my-3'],
            this.userClass()
        );
    });
}

/** Icon of a list item (`<i fd-list-icon glyph="cart"></i>`). */
@Component({
    selector: '[fd-list-icon]:not(fd-icon), [fdListIcon]:not(fd-icon)',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        'data-list-icon': '',
        '[attr.role]': 'role()',
        '[attr.aria-hidden]': 'ariaHidden()',
        '[attr.data-glyph]': 'glyphChar()',
        '[class]': 'computedClass()'
    }
})
export class ListIcon {
    readonly glyph = input<string | null | undefined>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly role = input<string | null>('presentation');
    readonly ariaHidden = input<boolean | null>(true);
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly list = inject(List, { optional: true });

    protected readonly glyphChar = computed(() => iconGlyphChar(this.glyph(), this.glyphFont()));
    protected readonly computedClass = computed(() =>
        cn(
            iconVariants({ font: this.glyphFont() }),
            'pointer-events-none flex w-11 flex-[0_0_auto] items-center justify-center text-(length:--li-ifs) text-sap-content-non-interactive-icon-color',
            'first:-ms-4 [[data-list-title]~&]:-me-4',
            this.list?.navigationIndicator() && 'last:m-0',
            this.userClass()
        )
    );
}

/** Link filling a list item; the item becomes a navigation item. */
@Component({
    selector: '[fd-list-link], [fdListLink]',
    imports: [DecimalPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        tabindex: '-1',
        '[attr.data-nav-glyph]': 'navigationIndicator() ? navGlyph : null',
        '[class]': 'computedClass()'
    },
    template: `
        <ng-content />
        @if (item?.counter() != null) {
            <span
                class="m-0 ms-4 shrink-0 truncate p-0 text-sap-content-marker-text-color"
                [attr.role]="item.counterRole()"
                [attr.aria-label]="item.counterAriaLabel()"
                >{{ item.counter() | number: '1.0-2' }}</span
            >
        }
    `
})
export class ListLink {
    /** Navigation arrow at the end. */
    readonly navigationIndicator = input(false, { transform: booleanAttribute });
    /** Marks the currently shown target. */
    readonly navigated = input(false, { transform: booleanAttribute });
    /** The item forwards focus to the link. */
    readonly focusable = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly item = inject(ListItem, { optional: true });
    private readonly list = inject(List, { optional: true });
    /** Pressed with Enter or Space on the item. */
    readonly pressed = signal(false);
    protected readonly navGlyph = iconGlyphChar('navigation-right-arrow');

    protected readonly computedClass = computed(() => {
        const list = this.list;
        const byline = !!this.item?.isByline();
        const selection = !!list?.selection();
        const unread = !!list?.unreadIndicator();
        const indication = !!list?.navigationIndicator();
        return cn(
            'relative m-0 box-border flex h-full w-full items-center bg-(--li-bg) text-(--li-tc) no-underline',
            'border-b-(length:--sapList_BorderWidth) border-solid border-transparent [--li-bc:transparent]',
            'ps-[0.9375rem] pe-[0.9375rem]',
            INTERACTIVE_STATES,
            this.pressed() && '[--li-bg:var(--sapList_Active_Background)] [--li-tc:var(--sapList_Active_TextColor)]',
            FOCUS_FRAME,
            unread && 'ps-[2.125rem]',
            selection && 'ps-11',
            byline && ['px-4 py-[0.9375rem]', unread && 'ps-[2.125rem]', selection && 'ps-11'],
            indication && 'pe-0',
            this.navigationIndicator()
                ? [
                      'after:flex after:h-full after:min-w-10 after:items-center after:justify-center after:content-[attr(data-nav-glyph)]',
                      'after:font-sap-content-icon-font-family after:text-sap-font-large-size after:text-sap-content-non-interactive-icon-color after:no-underline rtl:after:-scale-x-100'
                  ]
                : indication && "after:min-w-10 after:content-['']",
            this.navigated() &&
                '[--li-nav:var(--sapList_SelectionBorderColor)] shadow-[inset_-0.1875rem_0_0_0_var(--li-nav)] rtl:shadow-[inset_0.1875rem_0_0_0_var(--li-nav)]',
            this.userClass()
        );
    });
}

/** Header of a group of items. */
@Directive({
    selector: '[fd-list-group-header], [fdListGroupHeader]',
    providers: [{ provide: FD_LIST_FOCUSABLE, useExisting: forwardRef(() => ListGroupHeader) }],
    host: {
        '[attr.id]': 'id()',
        '[attr.tabindex]': 'tabbable() ? 0 : -1',
        '[attr.role]': 'role()',
        '[class]': 'computedClass()',
        '(focusin)': 'list?.itemFocused(this)'
    }
})
export class ListGroupHeader implements ListFocusable {
    readonly id = input(`fd-list-group-header-${nextGroupHeaderId++}`);
    readonly role = input<string | null>('listitem');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly list = inject(List, { optional: true });
    protected readonly tabbable = signal(false);

    focus(): void {
        this.element.focus();
    }
    setTabbable(tabbable: boolean): void {
        this.tabbable.set(tabbable);
    }

    protected readonly computedClass = computed(() =>
        cn(
            'relative m-0 box-border flex h-sap-element-line-height items-end px-[0.9375rem] py-0',
            'border-b-(length:--sapList_BorderWidth) border-solid border-sap-list-group-header-border-color bg-sap-list-group-header-background',
            this.list?.noBorder() && 'border-b-0',
            FOCUS_FRAME,
            this.userClass()
        )
    );
}

/** Footer of a list. */
@Directive({
    selector: '[fd-list-footer], [fdListFooter]',
    host: { '[class]': 'computedClass()' }
})
export class ListFooter {
    readonly align = input<'start' | 'end' | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex h-8 items-center bg-sap-list-footer-background px-[0.9375rem] py-0 text-sap-font-size text-sap-list-footer-text-color',
            this.align() === 'end' && 'justify-end',
            this.align() === 'start' && 'justify-start',
            this.userClass()
        )
    );
}

/** Message bar above the items (set hasMessage on the list). */
@Directive({
    selector: '[fd-list-message], [fdListMessage]',
    host: { '[class]': 'computedClass()' }
})
export class ListMessage {
    readonly type = input<ListMessageType | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'absolute start-0 top-0 m-0 box-border h-8 w-full truncate p-0 ps-2 text-sap-font-small-size leading-8',
            MESSAGE_BACKGROUND[this.type() ?? 'neutral'],
            this.userClass()
        )
    );
}

/** Content column of byline and subline items (title above byline or subline). */
@Directive({
    selector: '[fd-list-content], [fdListContent]',
    host: { '[class]': 'computedClass()' }
})
export class ListContent {
    private readonly list = inject(List, { optional: true });
    private readonly item = inject(ListItem, { optional: true });
    protected readonly computedClass = computed(() =>
        this.list?.subline()
            ? cn(
                  'm-0 flex flex-1 flex-col items-start justify-center gap-1 overflow-hidden p-0',
                  this.item?.isWrapped() && 'overflow-visible'
              )
            : 'pointer-events-none m-0 box-border flex h-full min-h-12 min-w-12 flex-[1_1_auto] flex-col content-between px-0 py-0.5'
    );
}

/** Second line of a byline item; twoCol splits it into byline-left and byline-right. */
@Directive({
    selector: '[fd-list-byline], [fdListByline]',
    host: {
        '[attr.data-list-wrap]': 'wrap() ? "" : null',
        '[class]': 'computedClass()'
    }
})
export class ListByline {
    readonly twoCol = input(false, { transform: booleanAttribute });
    readonly wrap = input(false, { transform: booleanAttribute });
    private readonly item = inject(ListItem, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 truncate p-0 pt-3 text-sap-font-size leading-4 text-sap-content-label-color',
            this.twoCol() && 'pointer-events-auto flex',
            (this.wrap() || this.item?.isWrapped()) && 'block whitespace-normal break-words'
        )
    );
}

@Directive({
    selector: '[fd-list-byline-left], [fdListBylineLeft]',
    host: { '[class]': 'computedClass()' }
})
export class ListBylineLeft {
    readonly wrap = input(false, { transform: booleanAttribute });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 w-[60%] self-end truncate p-0 pe-2 leading-4 text-sap-content-label-color',
            this.wrap() && 'inline w-full whitespace-normal p-0'
        )
    );
}

@Directive({
    selector: '[fd-list-byline-right], [fdListBylineRight]',
    host: { '[class]': 'computedClass()' }
})
export class ListBylineRight {
    readonly status = input<ListBylineStatus | null | undefined>();
    readonly wrap = input(false, { transform: booleanAttribute });
    protected readonly computedClass = computed(() => {
        const status = this.status();
        return cn(
            'm-0 w-[40%] self-end truncate p-0 ps-2 text-end leading-4',
            status ? STATUS_COLOR[status] : 'text-sap-content-label-color',
            this.wrap() && 'float-right inline w-auto whitespace-normal p-0 rtl:float-left'
        );
    });
}

/** Thumbnail (icon, image or avatar) of a byline item. */
@Directive({
    selector: '[fd-list-thumbnail], [fdListThumbnail]',
    host: {
        class: 'pointer-events-none m-0 me-3 box-border flex size-12 min-w-12 max-w-12 items-center justify-center rounded-sm p-0 text-[2rem] text-sap-content-non-interactive-icon-color [&>svg]:h-full'
    }
})
export class ListThumbnail {}

/** Second line of a subline item. */
@Directive({
    selector: '[fd-list-subline], [fdListSubline]',
    host: {
        '[attr.data-list-wrap]': 'wrap() ? "" : null',
        '[class]': 'computedClass()'
    }
})
export class ListSubline {
    readonly wrap = input(false, { transform: booleanAttribute });
    /** @deprecated sublines truncate by default. */
    readonly truncate = input(false, { transform: booleanAttribute });
    private readonly item = inject(ListItem, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 w-full max-w-full truncate p-0 font-sap-font-family text-sap-font-size leading-[normal] text-sap-content-label-color not-italic',
            (this.wrap() || this.item?.isWrapped()) && 'whitespace-normal break-words'
        )
    );
}
