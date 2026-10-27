/*
 * Port of @fundamental-ngx/core (grid-list) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    ElementRef,
    afterRenderEffect,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    effect,
    forwardRef,
    inject,
    input,
    numberAttribute,
    output,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';
import { Checkbox } from '@/ui/checkbox/checkbox';
import { Icon } from '@/ui/icon/icon';
import { ObjectStatusComponent } from '@/ui/object-status/object-status';
import { RadioButton } from '@/ui/radio/radio';
import { Toolbar, ToolbarLabel } from '@/ui/toolbar/toolbar';

export type GridListSelectionMode =
    'none' | 'delete' | 'singleSelect' | 'singleSelectLeft' | 'singleSelectRight' | 'multiSelect';
export type GridListItemType = 'inactive' | 'active' | 'detail' | 'detailsAndActive' | 'navigation';
export type GridListItemState = 'unread' | 'locked' | 'error' | 'draft';
export type GridListItemStatus = 'success' | 'warning' | 'error' | 'neutral';

export interface GridListSelectionEvent<T> {
    selection: T[];
    added: T[];
    removed: T[];
    index: number[];
}

export interface GridListItemOutputEvent<T> {
    index: number;
    value: T | undefined;
}

/** Column spans for S, M, L and XL. */
type Spans = [number, number, number, number];

/**
 * Parses a layout pattern such as 'XL4-L3-M2-S1'. For the list the numbers are items per row
 * (12, 6, 4, 3, 2 or 1); for an item they are column spans out of 12. Missing sizes inherit from
 * the next smaller one; S defaults to the full width.
 */
export function parseGridListLayout(pattern: string, itemsPerRow = true): Spans {
    const spans: (number | undefined)[] = [undefined, undefined, undefined, undefined];
    const order = ['S', 'M', 'L', 'XL'];
    for (const [, size, num] of pattern.toUpperCase().matchAll(/(XL|L|M|S)(\d+)/g)) {
        const n = Number(num);
        const valid = itemsPerRow ? [1, 2, 3, 4, 6, 12].includes(n) : n >= 1 && n <= 12;
        if (!valid) throw new Error(`Invalid grid list layout pattern: ${pattern}`);
        spans[order.indexOf(size)] = itemsPerRow ? 12 / n : n;
    }
    let previous = 12;
    return spans.map((span) => (previous = span ?? previous)) as Spans;
}

const STATUS_COLOR: Record<GridListItemStatus, string> = {
    success: 'bg-sap-success-border-color',
    warning: 'bg-sap-warning-border-color',
    error: 'bg-sap-error-border-color',
    neutral: 'bg-sap-neutral-border-color'
};

/** Interactive elements inside an item; they are reached with Enter or F2 and left with Escape or F2. */
const INNER_FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([data-grid-list-item])';

/** Column classes shared by the full-width rows (title bar, group header, footer and more button). */
const FULL_ROW = 'col-span-12 block min-w-0';

/**
 * Roles of a full-width row inside a list: a list item, or a row with one cell when the list is a
 * selectable grid, so the list keeps valid children.
 */
function rowRoles(): { row: () => string | null; cell: () => string | null } {
    const list = inject(GridList, { optional: true });
    return {
        row: () => (list ? (list.selectable() ? 'row' : 'listitem') : null),
        cell: () => (list?.selectable() ? 'gridcell' : null)
    };
}

/**
 * Grid list: items (cards) in a responsive grid with optional single or multiple selection,
 * delete mode and arrow key navigation.
 *
 * ```html
 * <fd-grid-list selectionMode="multiSelect" (selectionChange)="onSelect($event)">
 *     <fd-grid-list-title-bar title="Products" />
 *     @for (product of products; track product.id) {
 *         <fd-grid-list-item [value]="product.id" [title]="product.name" [description]="product.vendor">
 *             <div fd-grid-list-item-body>{{ product.address }}</div>
 *         </fd-grid-list-item>
 *     }
 * </fd-grid-list>
 * ```
 */
@Component({
    selector: 'fd-grid-list',
    exportAs: 'fdGridList',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.id]': 'id()',
        '[attr.role]': 'selectable() ? "grid" : "list"',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.aria-multiselectable]': 'selectionMode() === "multiSelect" || null',
        '[style.width]': 'width()',
        '[style.--gl-s]': 'spans()[0]',
        '[style.--gl-m]': 'spans()[1]',
        '[style.--gl-l]': 'spans()[2]',
        '[style.--gl-xl]': 'spans()[3]',
        '[class]': 'computedClass()',
        '(keydown)': 'onKeydown($event)'
    },
    template: '<ng-content />'
})
export class GridList<T = unknown> {
    readonly id = input(`fd-grid-list-${nextListId++}`);
    readonly width = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly selectionMode = input<GridListSelectionMode>('none');
    /** Items per row per screen size, e.g. 'XL4-L3-M2-S1'. */
    readonly layoutPattern = input('XL4-L3-M2-S1');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly selectionChange = output<GridListSelectionEvent<T>>();

    readonly items = contentChildren<GridListItem<T>>(
        forwardRef(() => GridListItem),
        { descendants: true }
    );

    /** Values of the selected items. */
    readonly selection = signal<T[]>([]);
    /** Index of the item in the tab sequence. */
    readonly activeIndex = signal(0);

    readonly selectable = computed(() => this.selectionMode() !== 'none' && this.selectionMode() !== 'delete');
    protected readonly spans = computed(() => parseGridListLayout(this.layoutPattern()));
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private rangeAnchor: number | null = null;

    constructor() {
        // a mode change keeps at most what the new mode allows
        effect(() => {
            const mode = this.selectionMode();
            untracked(() => {
                const selection = this.selection();
                const kept = !this.selectable() ? [] : mode === 'multiSelect' ? selection : selection.slice(0, 1);
                if (kept.length === selection.length) return;
                this.selection.set(kept);
                this.selectionChange.emit({
                    selection: kept,
                    added: [],
                    removed: selection.slice(kept.length),
                    index: []
                });
            });
        });
        // keep the tab stop on an existing item
        effect(() => {
            const count = this.items().length;
            if (untracked(this.activeIndex) >= count) this.activeIndex.set(Math.max(0, count - 1));
        });
    }

    isSelected(item: GridListItem<T>): boolean {
        return this.selection().includes(item.key());
    }

    /** Deselects all items. */
    clearSelection(): void {
        const removed = this.selection();
        this.selection.set([]);
        this.selectionChange.emit({ selection: [], added: [], removed, index: [] });
    }

    /** Selects (or deselects) an item; with shift in multi selection, the range from the last toggled item. */
    toggle(item: GridListItem<T>, select = !this.isSelected(item), range = false): void {
        const items = this.items();
        const index = items.indexOf(item);
        if (this.selectionMode() !== 'multiSelect') {
            if (!select || this.isSelected(item)) return;
            const removed = this.selection();
            this.selection.set([item.key()]);
            this.selectionChange.emit({ selection: [item.key()], added: [item.key()], removed, index: [index] });
            return;
        }
        const from = range && this.rangeAnchor !== null ? Math.min(this.rangeAnchor, index) : index;
        const to = range && this.rangeAnchor !== null ? Math.max(this.rangeAnchor, index) : index;
        this.rangeAnchor = index;
        this.setRange(from, to, select);
    }

    /** Silently syncs the selected input of an item. */
    sync(item: GridListItem<T>, selected: boolean): void {
        const key = item.key();
        if (selected === this.selection().includes(key)) return;
        if (!selected) this.selection.update((s) => s.filter((v) => v !== key));
        else if (this.selectionMode() === 'multiSelect') this.selection.update((s) => [...s, key]);
        else this.selection.set([key]);
    }

    private setRange(from: number, to: number, select: boolean): void {
        const range = this.items().slice(from, to + 1);
        const keys = range.map((i) => i.key());
        const current = this.selection();
        const changed = keys.filter((k) => current.includes(k) !== select);
        if (!changed.length) return;
        const selection = select ? [...current, ...changed] : current.filter((k) => !changed.includes(k));
        this.selection.set(selection);
        this.selectionChange.emit({
            selection,
            added: select ? changed : [],
            removed: select ? [] : changed,
            index: range.map((_, i) => from + i)
        });
    }

    protected onKeydown(event: KeyboardEvent): void {
        const items = this.items();
        const index = items.findIndex((item) => item.element() === event.target);
        if (index < 0) return;
        const multi = this.selectionMode() === 'multiSelect';
        let next: number | undefined;
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowRight': {
                const rtl = getComputedStyle(this.host).direction === 'rtl';
                next = index + ((event.key === 'ArrowRight') !== rtl ? 1 : -1);
                break;
            }
            case 'ArrowUp':
            case 'ArrowDown':
                next = this.verticalNeighbour(index, event.key === 'ArrowDown');
                break;
            case 'Home':
            case 'End':
                next = event.key === 'Home' ? 0 : items.length - 1;
                if (event.shiftKey && multi) {
                    this.setRange(Math.min(index, next), Math.max(index, next), this.isSelected(items[index]));
                }
                break;
            default:
                return;
        }
        event.preventDefault();
        if (next === undefined || next < 0 || next >= items.length) return;
        // shift + arrow carries the selection state of the current item over
        if (event.shiftKey && multi && event.key.startsWith('Arrow')) {
            const select = this.isSelected(items[index]);
            if (this.isSelected(items[next]) !== select) this.setRange(next, next, select);
        }
        items[next].focus();
    }

    /** The item in the next (or previous) row closest to the horizontal position of the current one. */
    private verticalNeighbour(index: number, down: boolean): number | undefined {
        const rects = this.items().map((item) => item.element().getBoundingClientRect());
        const current = rects[index];
        const candidates = rects
            .map((rect, i) => ({ rect, i }))
            .filter(({ rect }) => (down ? rect.top > current.bottom - 1 : rect.bottom < current.top + 1));
        if (!candidates.length) return undefined;
        const rowTop = down
            ? Math.min(...candidates.map(({ rect }) => rect.top))
            : Math.max(...candidates.map(({ rect }) => rect.top));
        const center = current.left + current.width / 2;
        return candidates
            .filter(({ rect }) => Math.abs(rect.top - rowTop) < 1)
            .reduce((best, c) =>
                Math.abs(c.rect.left + c.rect.width / 2 - center) <
                Math.abs(best.rect.left + best.rect.width / 2 - center)
                    ? c
                    : best
            ).i;
    }

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border grid grid-cols-12 gap-2 p-1 font-sap-font-family text-sap-font-size text-sap-text-color min-[600px]:gap-4 min-[600px]:p-2',
            this.userClass()
        )
    );
}

let nextListId = 0;
let nextItemId = 0;

/** Avatar or image at the start of an item body. */
@Directive({
    selector: '[fd-grid-list-item-image], [fdGridListItemImage]',
    host: { 'data-gl-image': '', '[class]': 'computedClass()' }
})
export class GridListItemImage {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() => cn('me-3 shrink-0', this.userClass()));
}

/** Content of an item body. */
@Directive({
    selector: '[fd-grid-list-item-body], [fdGridListItemBody]',
    host: { '[class]': 'computedClass()' }
})
export class GridListItemBody {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border w-full p-0 text-sap-list-text-color [[data-gl-header]+&]:pt-4 [[data-gl-image]+&]:max-w-[calc(100%_-_3.75rem)]',
            this.userClass()
        )
    );
}

/** Custom content in the toolbar row of an item. */
@Directive({
    selector: 'fd-grid-list-item-toolbar, [fd-grid-list-item-toolbar]',
    host: { class: 'flex min-w-0 items-center gap-2' }
})
export class GridListItemToolbar {}

/** Custom content at the bottom of an item; replaces the state actions. */
@Directive({
    selector: 'fd-grid-list-item-footer-bar, [fd-grid-list-item-footer-bar]',
    host: { class: 'block' }
})
export class GridListItemFooterBar {}

/** An item (card) of a grid list. */
@Component({
    selector: 'fd-grid-list-item',
    exportAs: 'fdGridListItem',
    imports: [NgTemplateOutlet, FormsModule, Button, Checkbox, RadioButton, Icon, ObjectStatusComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[style.--gl-s]': 'spans()?.[0]',
        '[style.--gl-m]': 'spans()?.[1]',
        '[style.--gl-l]': 'spans()?.[2]',
        '[style.--gl-xl]': 'spans()?.[3]',
        '[style.min-width]': 'width()',
        '[style.max-width]': 'width()',
        '[attr.role]': 'list?.selectable() ? "row" : "none"',
        '[class]': 'hostClass()'
    },
    template: `
        <div
            #item
            data-grid-list-item
            [id]="id()"
            [attr.role]="list?.selectable() ? 'gridcell' : 'listitem'"
            [attr.tabindex]="tabIndex()"
            [attr.aria-selected]="list?.selectable() ? selected() : null"
            [attr.aria-label]="ariaLabel()"
            [attr.aria-labelledby]="ariaLabelledBy()"
            [class]="itemClass()"
            (click)="onClick($event)"
            (keydown)="onKeydown($event)"
            (focus)="onFocus()"
            (focusout)="onFocusout($event)"
        >
            @if (status(); as status) {
                <span
                    [class]="'absolute inset-y-0 start-0 z-1 block w-1.5 rounded-s-(--gl-r) ' + statusColor[status]"
                ></span>
                <span class="sr-only-sap">{{ statusLabel()(status) }}</span>
            }
            @if (hasToolbar()) {
                <div [class]="toolbarClass()">
                    @if (mode() === 'singleSelectLeft') {
                        <ng-container [ngTemplateOutlet]="radio" />
                    }
                    @if (mode() === 'multiSelect') {
                        <span data-gl-select [class]="selectClass()" (click)="onSelectClick($event)">
                            <fd-checkbox inert standalone [ngModel]="selected()" [ariaLabel]="ariaLabel() ?? title()" />
                        </span>
                    }
                    <ng-content select="fd-grid-list-item-toolbar, [fd-grid-list-item-toolbar]" />
                    <span class="flex-1"></span>
                    @if (counter()) {
                        <span class="text-sap-content-marker-text-color">
                            {{ counter() }}<span class="sr-only-sap">{{ counterLabel()(counter()!) }}</span>
                        </span>
                    }
                    @if (type() === 'detail' || type() === 'detailsAndActive') {
                        <button
                            fdButton
                            variant="transparent"
                            glyph="edit"
                            data-density="compact"
                            [ariaLabel]="detailsLabel()"
                            [attr.title]="detailsLabel()"
                            (click)="emit($event, detail)"
                        ></button>
                    }
                    @if (mode() === 'delete') {
                        <button
                            fdButton
                            variant="transparent"
                            glyph="decline"
                            data-density="compact"
                            [ariaLabel]="deleteLabel()"
                            [attr.title]="deleteLabel()"
                            (click)="emit($event, delete)"
                        ></button>
                    }
                    @if (type() === 'navigation') {
                        <span
                            class="-me-4 flex w-10 items-center justify-center text-sap-content-non-interactive-icon-color rtl:rotate-180"
                        >
                            <fd-icon glyph="navigation-right-arrow" />
                        </span>
                    }
                    @if (mode() === 'singleSelectRight') {
                        <ng-container [ngTemplateOutlet]="radio" />
                    }
                </div>
            }
            <div data-gl-body [class]="bodyClass()">
                <ng-content select="[fd-grid-list-item-image], [fdGridListItemImage]" />
                @if (title() || description()) {
                    <div data-gl-header [class]="headerClass">
                        @if (title()) {
                            <div
                                role="heading"
                                [attr.aria-level]="titleLevel()"
                                class="m-0 mt-0.5 p-0 font-sap-font-header-family text-sap-font-large-size leading-[normal] whitespace-normal text-sap-list-text-color"
                            >
                                {{ title() }}
                            </div>
                        }
                        @if (description()) {
                            <span class="m-0 mt-2 mb-0.5 inline-block p-0 text-sap-content-label-color">
                                {{ description() }}
                            </span>
                        }
                    </div>
                }
                <ng-content />
                @if (footerBar() || state() === 'error' || state() === 'locked' || state() === 'draft') {
                    <div class="m-0 order-1 mt-4 basis-full p-0">
                        <ng-content select="fd-grid-list-item-footer-bar, [fd-grid-list-item-footer-bar]" />
                        @if (!footerBar()) {
                            @switch (state()) {
                                @case ('error') {
                                    <span fd-object-status status="negative" [label]="errorLabel()"></span>
                                }
                                @case ('locked') {
                                    <button
                                        fdButton
                                        variant="transparent"
                                        glyph="private"
                                        data-density="compact"
                                        [label]="lockedLabel()"
                                        (click)="emit($event, locked)"
                                    ></button>
                                }
                                @case ('draft') {
                                    <button
                                        fdButton
                                        variant="transparent"
                                        data-density="compact"
                                        [label]="draftLabel()"
                                        (click)="emit($event, draft)"
                                    ></button>
                                }
                            }
                        }
                    </div>
                }
            </div>
        </div>
        <ng-template #radio>
            <span data-gl-select [class]="selectClass()" (click)="onSelectClick($event)">
                <fd-radio-button
                    inert
                    standalone
                    [name]="list?.id() + '-radio'"
                    [value]="true"
                    [selectedValue]="selected()"
                    [ariaLabel]="ariaLabel() ?? title()"
                />
            </span>
        </ng-template>
    `
})
export class GridListItem<T = unknown> {
    readonly id = input(`fd-grid-list-item-${nextItemId++}`);
    readonly value = input<T>();
    /** Initial (or externally controlled) selection. */
    readonly selectedInput = input(false, { alias: 'selected', transform: booleanAttribute });
    readonly type = input<GridListItemType>('inactive');
    readonly state = input<GridListItemState | null | undefined>();
    /** Highlight at the start edge. */
    readonly status = input<GridListItemStatus | null | undefined>();
    readonly counter = input<number | null | undefined, unknown>(undefined, {
        transform: (v: unknown) => (v === null || v === undefined || v === '' ? undefined : numberAttribute(v))
    });
    /** Shows the navigated indicator on interactive items. */
    readonly navigated = input(false, { transform: booleanAttribute });
    readonly title = input<string | null | undefined>();
    readonly titleLevel = input(3);
    readonly description = input<string | null | undefined>();
    /** Height of the content instead of the row height. */
    readonly autoHeight = input(false, { transform: booleanAttribute });
    readonly noPadding = input(false, { transform: booleanAttribute });
    /** Column spans of this item, e.g. 'XL6-L6-M12'. */
    readonly layoutItemPattern = input<string | null | undefined>();
    /** Fixed width (min and max). */
    readonly width = input<string | null | undefined>();
    /** Clicks in the custom toolbar content do not activate the item. */
    readonly disableToolbarClick = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly detailsLabel = input('Details');
    readonly deleteLabel = input('Delete');
    readonly lockedLabel = input('Locked');
    readonly draftLabel = input('Draft');
    readonly errorLabel = input('Contains errors');
    readonly counterLabel = input<(count: number) => string>((count) => `Item has ${count} children.`);
    readonly statusLabel = input<(status: string) => string>((status) => `Item has status. Status: ${status}.`);
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    /** Activation of active, detailsAndActive items and of any item by keyboard without selection. */
    readonly press = output<GridListItemOutputEvent<T>>();
    readonly detail = output<GridListItemOutputEvent<T>>();
    readonly delete = output<GridListItemOutputEvent<T>>();
    readonly navigate = output<GridListItemOutputEvent<T>>();
    /** Any click on the item that is not a navigation. */
    readonly cardClick = output<GridListItemOutputEvent<T>>();
    readonly draft = output<GridListItemOutputEvent<T>>();
    readonly locked = output<GridListItemOutputEvent<T>>();

    protected readonly list = inject<GridList<T>>(GridList, { optional: true });
    protected readonly footerBar = contentChild(GridListItemFooterBar);
    protected readonly toolbarContent = contentChild(GridListItemToolbar);
    private readonly itemRef = viewChild.required<ElementRef<HTMLElement>>('item');
    private readonly inner = signal(false);
    protected readonly statusColor = STATUS_COLOR;
    protected readonly headerClass =
        'm-0 flex flex-[0_0_100%] flex-col p-0 [[data-gl-image]+&]:max-w-[calc(100%_-_3.75rem)]';

    /** Selection key: the value, or the item itself. */
    readonly key = computed(() => (this.value() ?? this) as T);
    readonly index = computed(() => this.list?.items().indexOf(this) ?? 0);
    readonly selected = computed(() => this.list?.isSelected(this) ?? this.selectedInput());
    protected readonly mode = computed(() => this.list?.selectionMode() ?? 'none');
    protected readonly spans = computed(() => {
        const pattern = this.layoutItemPattern();
        return pattern ? parseGridListLayout(pattern, false) : undefined;
    });
    protected readonly tabIndex = computed(() => ((this.list?.activeIndex() ?? 0) === this.index() ? 0 : -1));
    protected readonly interactive = computed(
        () => this.type() === 'active' || this.type() === 'detailsAndActive' || this.type() === 'navigation'
    );
    protected readonly hasToolbar = computed(
        () =>
            !!this.counter() ||
            !!this.toolbarContent() ||
            (this.type() !== 'inactive' && this.type() !== 'active') ||
            (this.mode() !== 'none' && this.mode() !== 'singleSelect')
    );

    constructor() {
        effect(() => {
            const selected = this.selectedInput();
            untracked(() => this.list?.sync(this, selected));
        });
        // inner interactive elements leave the tab sequence until the item is entered
        afterRenderEffect(() => {
            const inner = this.inner();
            this.innerElements().forEach((el) => el.setAttribute('tabindex', inner ? '0' : '-1'));
        });
    }

    element(): HTMLElement {
        return this.itemRef().nativeElement;
    }

    focus(options?: FocusOptions): void {
        this.element().focus(options);
    }

    private innerElements(): HTMLElement[] {
        return [...this.element().querySelectorAll<HTMLElement>(INNER_FOCUSABLE)].filter(
            (el) => !el.closest('[inert]')
        );
    }

    private get event(): GridListItemOutputEvent<T> {
        return { index: this.index(), value: this.value() };
    }

    protected emit(event: Event, emitter: { emit(value: GridListItemOutputEvent<T>): void }): void {
        event.preventDefault();
        event.stopPropagation();
        emitter.emit(this.event);
    }

    protected onFocus(): void {
        if (this.list) this.list.activeIndex.set(this.index());
    }

    protected onFocusout(event: FocusEvent): void {
        if (!this.element().contains(event.relatedTarget as Node | null)) this.inner.set(false);
    }

    protected onSelectClick(event: MouseEvent): void {
        event.stopPropagation();
        this.list?.toggle(this, this.mode() === 'multiSelect' ? !this.selected() : true, event.shiftKey);
        this.focus();
    }

    protected onClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (this.disableToolbarClick() && target.closest('fd-grid-list-item-toolbar, [fd-grid-list-item-toolbar]')) {
            return;
        }
        if (this.mode() === 'singleSelect') this.list?.toggle(this, true);
        if (this.type() === 'navigation') {
            this.navigate.emit(this.event);
            return;
        }
        if (this.interactive()) this.press.emit(this.event);
        this.cardClick.emit(this.event);
    }

    protected onKeydown(event: KeyboardEvent): void {
        const onItem = event.target === this.element();
        if (!onItem) {
            if (event.key === 'Escape' || event.key === 'F2' || event.key === 'F7') {
                event.preventDefault();
                event.stopPropagation();
                this.inner.set(false);
                this.focus();
            }
            return;
        }
        const inner = this.innerElements();
        if (((event.key === 'Enter' && !event.shiftKey) || event.key === 'F2' || event.key === 'F7') && inner.length) {
            event.preventDefault();
            this.inner.set(true);
            inner.forEach((el) => el.setAttribute('tabindex', '0'));
            inner[0].focus();
            return;
        }
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        const mode = this.mode();
        if (mode === 'multiSelect') this.list?.toggle(this, !this.selected());
        else if (this.list?.selectable()) this.list.toggle(this, true);
        else if (this.type() === 'navigation') this.navigate.emit(this.event);
        else this.press.emit(this.event);
    }

    protected readonly hostClass = computed(() =>
        cn(
            'col-span-(--gl-s) block min-w-0 min-[600px]:col-span-(--gl-m) min-[1024px]:col-span-(--gl-l) min-[1440px]:col-span-(--gl-xl)',
            this.userClass()
        )
    );

    protected readonly itemClass = computed(() => {
        const mode = this.mode();
        const link = this.interactive();
        const hoverable = link || mode === 'singleSelect';
        const selected = this.selected() && hoverable;
        return cn(
            'relative m-0 box-border flex flex-col overflow-hidden rounded-(--gl-r) bg-sap-list-background p-0 font-sap-font-family text-sap-font-size text-sap-list-text-color shadow-sap-content-shadow0 outline-none',
            '[--gl-r:var(--sapTile_BorderCornerRadius)] hc:[--gl-r:1rem]',
            "focus:before:pointer-events-none focus:before:absolute focus:before:inset-0 focus:before:z-1 focus:before:block focus:before:rounded-(--gl-r) focus:before:content-['']",
            'focus:before:border-[0.1775rem] focus:before:border-solid focus:before:border-sap-list-background focus:before:shadow-[inset_0_0_0_var(--sapContent_FocusWidth)_var(--sapContent_FocusColor)]',
            'hc:focus:before:inset-[0.1875rem] hc:focus:before:border-(length:--sapContent_FocusWidth) hc:focus:before:border-sap-content-focus-color hc:focus:before:shadow-none hc:focus:before:[border-style:var(--sapContent_FocusStyle)]',
            this.autoHeight() ? 'h-auto' : 'h-full',
            this.state() === 'unread' && '[&_[data-gl-body]_*]:font-bold',
            hoverable &&
                'cursor-pointer hover:bg-sap-list-hover-background hover:shadow-[0_0_0_0.0625rem_var(--sapTile_Interactive_BorderColor),var(--sapContent_Shadow2)]',
            link &&
                !selected &&
                'active:bg-sap-list-active-background active:[&_*]:text-sap-list-active-text-color! active:[&_*]:[text-shadow:none]!',
            link &&
                this.navigated() &&
                "after:absolute after:inset-y-0 after:end-0 after:block after:w-[0.1875rem] after:rounded-e-(--gl-r) after:bg-sap-list-selection-border-color after:content-['']",
            selected &&
                'bg-sap-list-selection-background-color shadow-[0_0_0_0.125rem_var(--sapList_SelectionBorderColor)] hover:bg-sap-list-hover-selection-background focus:before:border-sap-list-selection-background-color'
        );
    });

    protected readonly toolbarClass = computed(() =>
        cn('m-0 box-border flex h-11 shrink-0 items-center gap-2 border-0 bg-transparent px-4 py-0 compact:h-8')
    );

    /** The selection controls bring their own padding: align their box with the toolbar padding. */
    protected readonly selectClass = computed(() =>
        cn(
            'flex cursor-pointer items-center',
            this.mode() === 'singleSelectRight' ? '-me-[0.6875rem]' : '-ms-[0.6875rem]'
        )
    );

    protected readonly bodyClass = computed(() =>
        cn('m-0 box-border flex h-full flex-wrap [word-break:break-word]', this.noPadding() ? 'p-0' : 'p-4')
    );
}

/** Title bar above the items. */
@Component({
    selector: 'fd-grid-list-title-bar',
    imports: [Toolbar, ToolbarLabel],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.role]': 'roles.row()', '[class]': 'computedClass()' },
    template: `
        <div [attr.role]="roles.cell()">
            <fd-toolbar fdType="solid">
                <span fd-toolbar-label role="heading" [attr.aria-level]="headingLevel()">
                    {{ title() }}
                    <ng-content select="[fd-grid-list-title-bar-additional-title-item]" />
                </span>
                <ng-content />
            </fd-toolbar>
        </div>
    `
})
export class GridListTitleBar {
    readonly title = input<string | null | undefined>();
    readonly headingLevel = input(2);
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly roles = rowRoles();
    protected readonly computedClass = computed(() => cn(FULL_ROW, this.userClass()));
}

/** Pushes the following title bar content to the end. */
@Component({
    selector: 'fd-grid-list-title-bar-spacer',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block flex-1' }
})
export class GridListTitleBarSpacer {}

/** Heading of a group of items. */
@Component({
    selector: 'fd-grid-list-group-header',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.role]': 'roles.row()', '[class]': 'computedClass()' },
    template: `
        <div class="min-w-0 truncate" [attr.role]="roles.cell()">
            <div
                role="heading"
                class="m-0 truncate p-0"
                [attr.aria-level]="headingLevel()"
                [attr.aria-label]="ariaLabel()"
            >
                <ng-content />
            </div>
        </div>
    `
})
export class GridListGroupHeader {
    readonly headingLevel = input(3);
    readonly ariaLabel = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly roles = rowRoles();
    protected readonly computedClass = computed(() =>
        cn(
            FULL_ROW,
            'm-0 flex h-8 items-center truncate p-0 text-sap-font-header5-size leading-8 font-bold text-sap-list-group-header-text-color',
            this.userClass()
        )
    );
}

/** Info bar showing the active filter; activating it removes the filter. */
@Component({
    selector: 'fd-grid-list-filter-bar',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.role]': 'roles.row()', '[class]': 'computedClass()' },
    template: `
        <div [attr.role]="roles.cell()">
            <div
                role="button"
                tabindex="0"
                class="relative m-0 box-border flex h-8 cursor-pointer items-center gap-2 border-b border-solid border-sap-group-title-border-color bg-sap-infobar-background px-2 font-sap-font-family text-sap-font-size text-sap-infobar-text-color outline-none hover:bg-sap-infobar-hover-background active:bg-sap-infobar-active-background focus:after:pointer-events-none focus:after:absolute focus:after:inset-0.5 focus:after:border-(length:--sapContent_FocusWidth) focus:after:border-sap-content-focus-color focus:after:content-[''] focus:after:[border-style:var(--sapContent_FocusStyle)]"
                (click)="close.emit()"
                (keydown.enter)="close.emit()"
                (keydown.space)="$event.preventDefault()"
                (keyup.space)="close.emit()"
            >
                <span class="min-w-0 flex-1 truncate"><ng-content /></span>
                <span class="sr-only-sap">{{ removeLabel() }}</span>
                <fd-icon glyph="decline" />
            </div>
        </div>
    `
})
export class GridListFilterBar {
    readonly removeLabel = input('Remove filter');
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    readonly close = output<void>();
    protected readonly roles = rowRoles();
    protected readonly computedClass = computed(() => cn(FULL_ROW, this.userClass()));
}

/** Loads more items: shows the displayed and total counts. */
@Component({
    selector: 'fd-grid-list-more-btn',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.role]': 'roles.row()', '[class]': 'computedClass()' },
    template: `
        <div [attr.role]="roles.cell()">
            <div
                role="button"
                tabindex="0"
                class="group/more m-0 box-border cursor-pointer rounded-(--gl-r) bg-sap-group-content-background p-[0.813rem] text-center font-sap-font-family text-sap-font-size shadow-sap-content-shadow0 outline-none hover:bg-sap-list-hover-background focus:outline-sap focus:-outline-offset-[0.1875rem] active:bg-sap-list-active-background [--gl-r:var(--sapTile_BorderCornerRadius)] hc:[--gl-r:1rem]"
                (click)="showMore.emit()"
                (keydown.enter)="showMore.emit()"
                (keydown.space)="$event.preventDefault(); showMore.emit()"
            >
                <span
                    class="m-0 block p-0 font-bold text-sap-link-visited-color group-active/more:text-sap-list-active-text-color"
                >
                    {{ title() }}
                </span>
                <span
                    class="m-0 mt-[0.813rem] block p-0 text-sap-link-visited-color group-active/more:text-sap-list-active-text-color"
                >
                    <bdi dir="ltr">[ {{ displayCount() }} / {{ totalCount() }} ]</bdi>
                </span>
            </div>
        </div>
    `
})
export class GridListMoreBtn {
    readonly title = input('More');
    readonly displayCount = input<number>();
    readonly totalCount = input<number>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    readonly showMore = output<void>();
    protected readonly roles = rowRoles();
    protected readonly computedClass = computed(() => cn(FULL_ROW, this.userClass()));
}

/** Footer text below the items. */
@Component({
    selector: 'fd-grid-list-footer',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.role]': 'roles.row()', '[class]': 'computedClass()' },
    template: '<div [attr.role]="roles.cell()"><ng-content /></div>'
})
export class GridListFooter {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly roles = rowRoles();
    protected readonly computedClass = computed(() =>
        cn(
            FULL_ROW,
            'm-0 p-0 font-sap-font-family text-sap-font-size text-sap-list-footer-text-color',
            this.userClass()
        )
    );
}
