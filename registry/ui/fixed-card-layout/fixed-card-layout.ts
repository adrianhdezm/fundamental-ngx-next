/*
 * Port of @fundamental-ngx/core (fixed-card-layout) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { FocusKeyManager, type FocusableOption } from '@angular/cdk/a11y';
import {
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropList,
    CdkDropListGroup,
    type CdkDragDrop,
    type CdkDragEnter,
    type CdkDragStart
} from '@angular/cdk/drag-drop';
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
    afterRenderEffect,
    booleanAttribute,
    computed,
    contentChildren,
    effect,
    inject,
    input,
    linkedSignal,
    numberAttribute,
    output,
    signal,
    untracked,
    viewChild,
    viewChildren
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

const REM = 16;
/** Minimum card width: 20rem. */
const CARD_MINIMUM_WIDTH = 20 * REM;
const CARD_GAP = REM;
const MAX_COLUMNS = 10;

let nextRank = 1;

/** A card of a fixed card layout: `<ng-template fdCardDef>`; the number is its rank (position). */
@Directive({ selector: '[fdCardDef]' })
export class CardDefinition {
    readonly template = inject<TemplateRef<unknown>>(TemplateRef);
    readonly fdCardDef = input<number | undefined, unknown>(undefined, {
        transform: (v: unknown) => (v === '' || v === null || v === undefined ? undefined : numberAttribute(v))
    });
    private readonly autoRank = nextRank++;
    /** Position of the card; swapped by drag and drop. */
    readonly rank = linkedSignal(() => this.fdCardDef() ?? this.autoRank);
}

export interface FixedCardLayoutChange {
    numberOfColumns: number;
    screenSize: number;
}

export interface CardDropped {
    previousIndex: number;
    currentIndex: number;
    layoutColumns: number;
    items: CardDefinition[];
}

/** Width modifiers per column (1-based), e.g. `{ 1: 2, 2: 1 }`: the free space goes 2:1 to the first two columns. */
export type ColumnsWidthConfig = Partial<Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, number>>;

/** Number of columns of at least the card width that fit, with gaps. */
function columnsThatFit(width: number, cardWidth: number): number {
    const withoutGap = Math.max(Math.floor((width || 1) / (cardWidth || 1)), 1);
    const required = withoutGap * cardWidth + (withoutGap - 1) * CARD_GAP;
    return Math.max(required > width ? withoutGap - 1 : withoutGap, 1);
}

/** Focus target of the keyboard navigation between cards. */
@Directive({
    selector: '[fdFixedCardLayoutItem]',
    host: { tabindex: '0', role: 'group', '[attr.aria-labelledby]': 'titleId()' }
})
export class FixedCardLayoutItem implements FocusableOption {
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly titleId = signal<string | null>(null);

    constructor() {
        afterRenderEffect(() => {
            const id = this.element.querySelector('[fd-card-title], [fdCardTitle]')?.id || null;
            if (id !== untracked(this.titleId)) this.titleId.set(id);
        });
    }

    focus(): void {
        this.element.focus();
    }
}

/**
 * Fixed card layout: cards of the same width in as many columns as fit (at least 20rem each).
 * Cards are placed row by row and can be reordered by dragging, or with Alt and the arrow keys.
 *
 * ```html
 * <fd-fixed-card-layout (cardDraggedDropped)="save($event)">
 *     <ng-template fdCardDef="1"><fd-card>...</fd-card></ng-template>
 *     <ng-template fdCardDef="2"><fd-card>...</fd-card></ng-template>
 * </fd-fixed-card-layout>
 * ```
 */
@Component({
    selector: 'fd-fixed-card-layout',
    exportAs: 'fdFixedCardLayout',
    imports: [NgTemplateOutlet, CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder, FixedCardLayoutItem],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()', '(keydown)': 'onKeydown($event)' },
    template: `
        <div
            #layout
            cdkDropListGroup
            class="m-0 -mt-4 -ms-4 box-border flex flex-col flex-wrap content-start items-start justify-start p-0"
            [style.height.px]="height()"
            [cdkDropListGroupDisabled]="disableDragDrop()"
        >
            @for (card of ordered(); track card; let index = $index) {
                <div
                    cdkDropList
                    [class]="cardClass(card)"
                    [style.order]="(index % columnCount()) + 1"
                    [style.width.%]="100 / columnCount()"
                    [style.min-width.px]="columnWidths()[index % columnCount()] ?? cardMinimumWidth()"
                    [style.max-width.px]="columnWidths()[index % columnCount()]"
                    [style.display]="dragged() === card ? 'none' : null"
                    [cdkDropListData]="index"
                    [cdkDropListSortPredicate]="onlyFirst"
                    (cdkDropListEntered)="onEntered($event)"
                >
                    <div
                        cdkDrag
                        fdFixedCardLayoutItem
                        class="outline-none focus-visible:outline-sap focus-visible:outline-offset-1"
                        [cdkDragPreviewClass]="previewClass"
                        [cdkDragData]="card"
                        [cdkDragStartDelay]="dragStartDelay()"
                        [cdkDragDisabled]="disableDragDrop()"
                        (cdkDragStarted)="onDragStarted($event)"
                        (cdkDragDropped)="onDropped($event)"
                    >
                        <ng-container [ngTemplateOutlet]="card.template" />
                        <div
                            *cdkDragPlaceholder
                            class="box-border w-full min-w-full cursor-grabbing border-2 border-dashed border-sap-content-drag-and-drop-active-color opacity-30"
                            [style.margin-bottom.rem]="placeholderMargin() ? 1 : 0"
                        >
                            <ng-container [ngTemplateOutlet]="card.template" />
                        </div>
                    </div>
                </div>
            }
            @for (column of breaks(); track column) {
                <div class="m-0 w-0 basis-full p-0" [style.order]="column + 1"></div>
            }
        </div>
    `
})
export class FixedCardLayout {
    readonly disableDragDrop = input(false, { transform: booleanAttribute });
    /** Milliseconds a pointer has to be held before a drag starts. */
    readonly dragStartDelay = input(200);
    /** Minimum card width in pixels; at least 20rem. */
    readonly cardMinimumWidthInput = input(CARD_MINIMUM_WIDTH, {
        alias: 'cardMinimumWidth',
        transform: numberAttribute
    });
    readonly columnsWidthConfig = input<ColumnsWidthConfig | null | undefined>();
    readonly maxColumns = input(MAX_COLUMNS);
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly layoutChange = output<FixedCardLayoutChange>();
    readonly cardDraggedDropped = output<CardDropped>();

    private readonly cards = contentChildren(CardDefinition);
    private readonly layout = viewChild.required<ElementRef<HTMLElement>>('layout');
    private readonly drags = viewChildren(CdkDrag);
    private readonly items = viewChildren(FixedCardLayoutItem);
    private readonly width = signal(0);
    private readonly measure = signal(0);
    protected readonly height = signal<number | null>(null);
    protected readonly dragged = signal<CardDefinition | null>(null);
    protected readonly placeholderMargin = signal(false);
    private keyManager: FocusKeyManager<FixedCardLayoutItem> | null = null;
    private readonly injector = inject(Injector);

    protected readonly cardMinimumWidth = computed(() => Math.max(this.cardMinimumWidthInput(), CARD_MINIMUM_WIDTH));
    /** Cards in rank order. */
    protected readonly ordered = computed(() => [...this.cards()].sort((a, b) => a.rank() - b.rank()));
    readonly columnCount = computed(() => {
        const count = this.cards().length;
        if (!count || !this.width()) return 1;
        return Math.min(
            columnsThatFit(this.width(), this.cardMinimumWidth()),
            count,
            this.maxColumns() || MAX_COLUMNS,
            MAX_COLUMNS
        );
    });
    /** Cards per column, in row-by-row placement. */
    private readonly columns = computed(() => {
        const columns: CardDefinition[][] = Array.from({ length: this.columnCount() }, () => []);
        this.ordered().forEach((card, i) => columns[i % columns.length].push(card));
        return columns;
    });
    /** Breaks after every column but the last. */
    protected readonly breaks = computed(() => Array.from({ length: this.columnCount() - 1 }, (_, i) => i));
    /** Pixel widths per column from the width config. */
    protected readonly columnWidths = computed<number[]>(() => {
        const config = this.columnsWidthConfig();
        const count = this.columnCount();
        if (!config || !Object.keys(config).length || count === 1) return [];
        const modifiers = Array.from({ length: count }, (_, i) => Math.max(config[(i + 1) as 1] ?? 0, 0));
        const total = modifiers.reduce((sum, m) => sum + m, 0) || 1;
        const free = this.width() - this.cardMinimumWidth() * count;
        return modifiers.map((m) => Math.round(this.cardMinimumWidth() + (free / total) * m));
    });

    protected readonly onlyFirst = (index: number): boolean => index === 0;
    protected readonly previewClass = ['rounded-sap-element-border-corner-radius', 'shadow-sap-content-shadow2'];

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const layout = this.layout().nativeElement;
            const observer = new ResizeObserver(() => {
                if (this.dragged()) return;
                this.width.set(layout.getBoundingClientRect().width);
                this.measure.update((n) => n + 1);
            });
            observer.observe(layout);
            destroyRef.onDestroy(() => observer.disconnect());
        });
        // cards that change their height re-measure the layout
        afterRenderEffect((onCleanup) => {
            const observer = new ResizeObserver(() => this.measure.update((n) => n + 1));
            this.drags().forEach((drag) => observer.observe(drag.element.nativeElement));
            onCleanup(() => observer.disconnect());
        });
        afterRenderEffect({
            write: () => {
                this.measure();
                this.columns();
                if (!this.dragged()) this.height.set(this.columnHeight());
            }
        });
        effect(() => {
            const columns = this.columnCount();
            const screenSize = this.width();
            if (screenSize) untracked(() => this.layoutChange.emit({ numberOfColumns: columns, screenSize }));
        });
        effect(() => {
            const items = [...this.items()].sort((a, b) => this.itemRank(a) - this.itemRank(b));
            untracked(() => {
                this.keyManager?.destroy();
                const rtl = getComputedStyle(this.layout().nativeElement).direction === 'rtl';
                this.keyManager = new FocusKeyManager(items).withWrap().withHorizontalOrientation(rtl ? 'rtl' : 'ltr');
            });
        });
        destroyRef.onDestroy(() => this.keyManager?.destroy());
    }

    /** Height of the highest column, optionally with extra space in one column. */
    private columnHeight(column = -1, extra = 0): number {
        const heights = this.columns().map(
            (cards, i) =>
                cards.reduce((sum, card) => {
                    const drag = this.drags().find((d) => d.data === card);
                    const height = drag && !drag._dragRef.isDragging() ? drag.element.nativeElement.offsetHeight : 0;
                    return sum + height + CARD_GAP;
                }, 0) + (i === column ? extra : 0)
        );
        return Math.ceil(Math.max(0, ...heights) + 4);
    }

    private itemRank(item: FixedCardLayoutItem): number {
        const drag = this.drags().find((d) => d.element.nativeElement === item.element);
        return (drag?.data as CardDefinition | undefined)?.rank() ?? 0;
    }

    protected onDragStarted(event: CdkDragStart<CardDefinition>): void {
        this.dragged.set(event.source.data);
        // room for the placeholder in any column, so entering a list does not wrap the columns
        this.height.set(this.columnHeight() + event.source.element.nativeElement.offsetHeight + REM);
        // hide the slot now: the drop lists measure their positions right after this event
        event.source.dropContainer.element.nativeElement.style.display = 'none';
    }

    protected onEntered(event: CdkDragEnter<number, unknown>): void {
        const target = event.container.getSortedItems()[0]?.data as CardDefinition | undefined;
        this.placeholderMargin.set(!!target && target !== (event.item.data as CardDefinition));
        const column = this.columns().findIndex((cards) => cards.includes(target as CardDefinition));
        const extra =
            event.item.element.nativeElement.offsetHeight + (event.container.getSortedItems().length ? REM : 0);
        this.height.set(Math.max(this.height() ?? 0, this.columnHeight(column, extra)));
    }

    protected onDropped(event: CdkDragDrop<number, number, CardDefinition>): void {
        this.dragged.set(null);
        event.previousContainer.element.nativeElement.style.display = '';
        this.placeholderMargin.set(false);
        if (event.container.data === event.previousContainer.data) {
            this.measure.update((n) => n + 1);
            return;
        }
        const moved = event.previousContainer.getSortedItems()[0]?.data as CardDefinition;
        const replaced = event.container.getSortedItems()[0]?.data as CardDefinition;
        const column = this.columns().find((cards) => cards.includes(moved));
        // within a column of two, dropping the upper card on the lower one keeps the order (the placeholder is above it)
        if (column?.includes(replaced) && column.length === 2 && moved.rank() < replaced.rank()) {
            this.measure.update((n) => n + 1);
            return;
        }
        this.swap(moved, replaced);
    }

    /** Swaps the ranks of two cards. */
    private swap(moved: CardDefinition, replaced: CardDefinition): void {
        const order = this.ordered();
        const previousIndex = order.indexOf(moved);
        const currentIndex = order.indexOf(replaced);
        const rank = moved.rank();
        moved.rank.set(replaced.rank());
        replaced.rank.set(rank);
        this.cardDraggedDropped.emit({
            previousIndex,
            currentIndex,
            layoutColumns: this.columnCount(),
            items: this.ordered()
        });
    }

    protected onKeydown(event: KeyboardEvent): void {
        const target = this.items().find((item) => item.element === event.target);
        if (!target) return;
        if (event.altKey && !this.disableDragDrop()) {
            this.moveWithKeyboard(event, target);
            return;
        }
        this.keyManager?.setActiveItem(target);
        this.keyManager?.onKeydown(event);
    }

    /** Alt + arrow keys: swap with the card in the next column (left, right) or row (up, down). */
    private moveWithKeyboard(event: KeyboardEvent, item: FixedCardLayoutItem): void {
        const order = this.ordered();
        const card = this.drags().find((d) => d.element.nativeElement === item.element)?.data as CardDefinition;
        const index = order.indexOf(card);
        const columns = this.columnCount();
        const rtl = getComputedStyle(this.layout().nativeElement).direction === 'rtl';
        const column = index % columns;
        let target = -1;
        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowLeft': {
                const step = (event.key === 'ArrowRight') !== rtl ? 1 : -1;
                if (column + step >= 0 && column + step < columns) target = index + step;
                break;
            }
            case 'ArrowDown':
                target = index + columns;
                break;
            case 'ArrowUp':
                target = index - columns;
                break;
            default:
                return;
        }
        event.preventDefault();
        if (target < 0 || target >= order.length) return;
        this.swap(card, order[target]);
        // keep the focus on the moved card
        afterNextRender(() => this.focusCard(card), { injector: this.injector });
    }

    /** Focuses the item of a card. */
    focusCard(card: CardDefinition): void {
        this.drags()
            .find((d) => d.data === card)
            ?.element.nativeElement.focus();
    }

    protected cardClass(card: CardDefinition): string {
        const single = this.columns().some((cards) => cards.length === 1 && cards[0] === card);
        return cn('m-0 box-border min-h-px w-full ps-4 pt-4 empty:pt-0', single && 'basis-full');
    }

    protected readonly computedClass = computed(() =>
        cn('m-0 box-border block p-0 font-sap-font-family text-sap-font-size text-sap-text-color', this.userClass())
    );
}
