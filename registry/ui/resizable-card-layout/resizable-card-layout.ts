import { FocusKeyManager, type FocusableOption } from '@angular/cdk/a11y';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChildren,
    effect,
    inject,
    input,
    linkedSignal,
    output,
    signal,
    untracked
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { iconGlyphChar } from '@/ui/icon/icon';

/** Width of one column in pixels (20rem). */
export const horizontalResizeStep = 320;
/** Height of one row in pixels (1rem). */
export const verticalResizeStep = 16;
export const gap = 16;
/** A card snaps to the next column once it is resized more than half a column. */
export const horizontalResizeOffset = 160;
export const verticalResizeOffset = 8;

export type LayoutSize = 'sm' | 'md' | 'lg' | 'xl';
export type ResizeDirection = 'vertical' | 'horizontal' | 'both';
/** Direction of the last horizontal pointer move: 1 wider, -1 narrower. */
export type CardState = 1 | 0 | -1;

export interface ResizableCardItemConfig {
    title?: string;
    rank?: number;
    cardWidthColSpan?: number;
    cardHeightRowSpan?: number;
    cardMiniHeaderRowSpan?: number;
    cardMiniContentRowSpan?: number;
    resizable?: boolean;
}

export type ResizableCardLayoutConfig = ResizableCardItemConfig[];

export interface ResizedEvent {
    card: ResizableCardItem;
    prevCardWidth: number;
    prevCardHeight: number;
    cardWidth: number;
    cardHeight: number;
    cardWidthColSpan: number;
    cardHeightRowSpan: number;
    newCardWidthColSpan: number;
    newCardHeightRowSpan: number;
}

const COLUMNS: Record<LayoutSize, number> = { sm: 1, md: 2, lg: 3, xl: 4 };
const PADDING: Record<LayoutSize, number> = { sm: 8, md: 16, lg: 16, xl: 48 };

/** Columns a card of this width occupies (a column counts once it is more than half filled). */
function columnSpan(width: number): number {
    const base = Math.floor(width / horizontalResizeStep);
    return width - base * horizontalResizeStep - base * gap > horizontalResizeOffset ? base + 1 : base;
}

let nextRank = 1;
let nextId = 0;

/**
 * A card of a resizable card layout. Its width snaps to columns and its height to rows; it can be
 * reduced to its mini content or mini header height.
 */
@Component({
    selector: 'fd-resizable-card-item',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'group',
        tabindex: '0',
        '[attr.id]': 'itemId()',
        '[attr.aria-label]': 'title()',
        '[style.position]': '"absolute"',
        '[style.inset-inline-start.px]': 'start()',
        '[style.top.px]': 'top()',
        '[style.z-index]': 'resizingNow() ? 1 : 0',
        class: 'block outline-none transition-[inset-inline-start,top] duration-500 ease-in focus-visible:outline-sap motion-reduce:transition-none'
    },
    template: `
        <div [class]="itemClass()">
            <div
                class="flex transition-[width,height] duration-250 ease-in-out motion-reduce:transition-none"
                [style.width.px]="cardWidth()"
                [style.height.px]="cardHeight()"
                (mouseenter)="hovered.set(true)"
                (mouseleave)="hovered.set(false)"
            >
                <div
                    class="relative order-1 h-[calc(100%_-_0.0625rem)] flex-1 [&>*]:h-full [&>*]:overflow-hidden [&>*>*]:shrink-0"
                >
                    <ng-content />
                    @if (resizable() && (hovered() || resizingNow())) {
                        <div
                            aria-hidden="true"
                            class="absolute -end-0 -bottom-[0.35rem] z-2 flex size-6 items-start justify-start rtl:-start-0 rtl:-bottom-0.5"
                        >
                            <div
                                class="absolute z-2 flex size-full cursor-nwse-resize items-center justify-center font-sap-content-icon-font-family text-[1rem] leading-4 text-sap-button-lite-text-color before:content-[attr(data-glyph)] rtl:rotate-90 rtl:cursor-nesw-resize"
                                [attr.data-glyph]="cornerGlyph"
                                (pointerdown)="startResize($event, 'both')"
                            ></div>
                        </div>
                    }
                </div>
                @if (resizable()) {
                    <div
                        aria-hidden="true"
                        class="z-2 order-2 w-px cursor-ew-resize"
                        (pointerdown)="startResize($event, 'horizontal')"
                    ></div>
                    <div
                        aria-hidden="true"
                        class="absolute bottom-0 z-2 h-px w-[calc(100%_-_0.5rem)] cursor-ns-resize"
                        (pointerdown)="startResize($event, 'vertical')"
                    ></div>
                }
            </div>
            <div
                class="transition-[width,height] duration-250 ease-in-out motion-reduce:transition-none"
                [style.width.px]="indicationWidth()"
                [style.height.px]="cardHeight()"
            ></div>
        </div>
    `
})
export class ResizableCardItem implements FocusableOption {
    readonly config = input<ResizableCardItemConfig | null | undefined>();
    readonly itemId = input(`fd-card-item-${nextId++}`);
    readonly titleInput = input<string | null | undefined>(undefined, { alias: 'title' });
    readonly rankInput = input<number | null | undefined>(undefined, { alias: 'rank' });
    readonly widthSpanInput = input(1, { alias: 'cardWidthColSpan' });
    readonly heightSpanInput = input<number | null | undefined>(undefined, { alias: 'cardHeightRowSpan' });
    readonly miniHeaderSpanInput = input<number | null | undefined>(undefined, { alias: 'cardMiniHeaderRowSpan' });
    readonly miniContentSpanInput = input<number | null | undefined>(undefined, { alias: 'cardMiniContentRowSpan' });
    readonly resizableInput = input(true, { alias: 'resizable', transform: booleanAttribute });

    readonly resizing = output<ResizedEvent>();
    readonly resized = output<ResizedEvent>();
    readonly miniHeaderReached = output<ResizedEvent>();
    readonly miniContentReached = output<ResizedEvent>();

    private readonly autoRank = nextRank++;
    readonly title = computed(() => this.config()?.title ?? this.titleInput() ?? null);
    readonly resizable = computed(() => this.config()?.resizable ?? this.resizableInput());
    readonly rank = linkedSignal(() => this.config()?.rank ?? this.rankInput() ?? this.autoRank);
    prevRank = 0;
    readonly cardWidthColSpan = linkedSignal(() => this.config()?.cardWidthColSpan ?? this.widthSpanInput());
    readonly cardHeightRowSpan = linkedSignal(() => this.config()?.cardHeightRowSpan ?? this.heightSpanInput() ?? 0);
    readonly cardMiniHeaderRowSpan = computed(
        () => this.config()?.cardMiniHeaderRowSpan ?? this.miniHeaderSpanInput() ?? 0
    );
    readonly cardMiniContentRowSpan = computed(
        () => this.config()?.cardMiniContentRowSpan ?? this.miniContentSpanInput() ?? 0
    );

    readonly cardWidth = linkedSignal(
        () => this.cardWidthColSpan() * horizontalResizeStep + (this.cardWidthColSpan() - 1) * gap
    );
    readonly cardHeight = linkedSignal(() => this.cardHeightRowSpan() * verticalResizeStep);
    readonly start = signal<number | null>(null);
    readonly top = signal(0);
    startingColumnPosition = 0;
    cardState: CardState = 0;
    /** Height span before the latest vertical change. */
    previousCardHeightRowSpan = 0;

    protected readonly hovered = signal(false);
    protected readonly resizingNow = signal(false);
    protected readonly indicationWidth = signal(0);
    protected readonly cornerGlyph = iconGlyphChar('resize-corner');

    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private maxColumns = 4;
    /** Span chosen by configuration or by resizing, restored when the layout is wide enough. */
    private readonly originalWidthSpan = linkedSignal(() => this.config()?.cardWidthColSpan ?? this.widthSpanInput());
    private prevX = 0;
    private prevY = 0;
    private prevCardWidth = 0;
    private prevCardHeight = 0;
    private direction: ResizeDirection = 'both';
    private detach: (() => void) | null = null;

    private get miniHeaderHeight(): number {
        return this.cardMiniHeaderRowSpan() * verticalResizeStep;
    }

    private get miniContentHeight(): number {
        return this.cardMiniContentRowSpan() * verticalResizeStep;
    }

    constructor() {
        inject(DestroyRef).onDestroy(() => this.detach?.());
    }

    focus(): void {
        this.element.focus();
    }

    /** Limits the width to the columns of the layout size, restoring the configured span when there is room. */
    verifyUpdateCardWidth(layoutSize: LayoutSize): void {
        this.maxColumns = COLUMNS[layoutSize];
        const span = Math.min(this.maxColumns, this.originalWidthSpan());
        if (span === this.cardWidthColSpan()) return;
        this.cardWidthColSpan.set(span);
        this.resized.emit(this.resizedEvent());
    }

    resizedEvent(): ResizedEvent {
        const width = this.cardWidth();
        const height = this.cardHeight();
        return {
            card: this,
            prevCardWidth: this.prevCardWidth,
            prevCardHeight: this.prevCardHeight,
            cardWidth: width,
            cardHeight: height,
            cardWidthColSpan: this.cardWidthColSpan(),
            cardHeightRowSpan: this.cardHeightRowSpan(),
            newCardWidthColSpan: columnSpan(width),
            newCardHeightRowSpan: Math.floor(height / verticalResizeStep)
        };
    }

    protected startResize(event: PointerEvent, direction: ResizeDirection): void {
        if (!this.resizable()) return;
        event.preventDefault();
        this.resizingNow.set(true);
        this.prevX = event.clientX;
        this.prevY = event.clientY;
        this.prevCardWidth = this.cardWidth();
        this.prevCardHeight = this.cardHeight();
        this.direction = direction;
        const move = (e: PointerEvent): void => this.onMove(e);
        const up = (): void => this.onUp();
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
        this.detach = () => {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            this.detach = null;
        };
    }

    private onMove(event: PointerEvent): void {
        if (!this.resizingNow()) return;
        event.preventDefault();
        const { clientX, clientY } = event;
        if (this.direction !== 'vertical') this.resizeHorizontally(clientX);
        if (this.direction !== 'horizontal') this.resizeVertically(clientY);
        if (!this.resizingNow()) return;
        const width = this.cardWidth();
        const span = Math.floor(width / horizontalResizeStep);
        const thresholdReached = width - (span * horizontalResizeStep + span * gap) > horizontalResizeOffset;
        if (clientX !== this.prevX) {
            this.cardState = clientX > this.prevX ? 1 : -1;
            const future = (span + 1) * horizontalResizeStep + span * gap;
            this.indicationWidth.set(thresholdReached ? future - width : 0);
        }
        this.prevX = clientX;
        this.prevY = clientY;
        this.resizing.emit(this.resizedEvent());
    }

    private onUp(): void {
        if (!this.resizingNow()) return;
        if (this.cardWidth() !== this.prevCardWidth) this.snapWidth();
        if (this.cardHeight() !== this.prevCardHeight) this.snapHeight();
        this.stop();
    }

    private stop(): void {
        if (!this.resizingNow()) return;
        this.detach?.();
        this.cardState = 0;
        this.indicationWidth.set(0);
        this.resizingNow.set(false);
        this.resized.emit(this.resizedEvent());
    }

    private resizeHorizontally(x: number): void {
        const rtl = getComputedStyle(this.element).direction === 'rtl';
        const difference = this.prevX - x;
        const indentation = (this.maxColumns - 1) * gap;
        const max = this.maxColumns * horizontalResizeStep + indentation;
        const width = rtl ? this.cardWidth() + difference : this.cardWidth() - difference;
        this.cardWidth.set(Math.min(Math.max(width, horizontalResizeStep), max));
    }

    private setHeight(height: number): void {
        this.cardHeight.set(height);
        this.previousCardHeightRowSpan = this.cardHeightRowSpan();
        this.cardHeightRowSpan.set(Math.floor(height / verticalResizeStep));
        // keep the pixel height while resizing (the span setter would round it)
        this.cardHeight.set(height);
    }

    /** Resizes the height; below the mini content height the card snaps to it, or to the mini header. */
    private resizeVertically(y: number): void {
        const header = this.miniHeaderHeight;
        const content = this.miniContentHeight;
        const shrinking = this.prevY - y > 0;
        const height = this.cardHeight();
        let reachedHeader = false;
        if (header && height === header) {
            if (shrinking) {
                this.setHeight(header);
            } else {
                this.setHeight(header + content);
                this.stopAndSnap();
                this.miniContentReached.emit(this.resizedEvent());
            }
        } else if (height < content + header) {
            if (!shrinking) {
                this.setHeight(header + content);
                this.stopAndSnap();
                this.miniContentReached.emit(this.resizedEvent());
            }
        } else if (header && height === content + header && shrinking) {
            reachedHeader = true;
            this.setHeight(header);
            this.stopAndSnap();
            this.miniHeaderReached.emit(this.resizedEvent());
        } else {
            this.setHeight(height - (this.prevY - y));
        }
        if (this.cardHeight() <= content + header && shrinking && !reachedHeader && this.resizingNow()) {
            this.setHeight(content + header);
            this.miniContentReached.emit(this.resizedEvent());
            this.stopAndSnap();
        }
    }

    private stopAndSnap(): void {
        if (this.cardWidth() !== this.prevCardWidth) this.snapWidth();
        if (this.cardHeight() !== this.prevCardHeight) this.snapHeight();
        this.stop();
    }

    /** Snaps the width to whole columns once it changed by more than half a column. */
    private snapWidth(): void {
        const width = this.cardWidth();
        const increment = width - this.prevCardWidth;
        const span = Math.floor(width / horizontalResizeStep);
        const fraction = width % horizontalResizeStep;
        let snapped: number;
        if (increment > 0) {
            snapped =
                increment < horizontalResizeOffset + gap
                    ? this.prevCardWidth
                    : fraction - (span - 1) * gap > horizontalResizeOffset
                      ? (span + 1) * horizontalResizeStep
                      : span * horizontalResizeStep;
        } else {
            snapped =
                Math.abs(increment) < horizontalResizeOffset
                    ? this.prevCardWidth
                    : fraction - span * gap > horizontalResizeOffset
                      ? (span + 1) * horizontalResizeStep
                      : span * horizontalResizeStep;
        }
        const columns = Math.max(1, Math.round(snapped / horizontalResizeStep));
        this.originalWidthSpan.set(columns);
        this.cardWidthColSpan.set(columns);
        this.cardWidth.set(columns * horizontalResizeStep + (columns - 1) * gap);
    }

    /** Snaps the height to whole rows. */
    private snapHeight(): void {
        const height = this.cardHeight();
        const span = Math.floor(height / verticalResizeStep);
        const rows = height % verticalResizeStep > verticalResizeOffset ? span + 1 : span;
        this.cardHeightRowSpan.set(rows);
    }

    protected readonly itemClass = computed(() =>
        cn(
            'relative m-0 box-border flex min-w-80 p-0',
            this.resizingNow() && 'border-2 border-dashed border-sap-content-drag-and-drop-active-color'
        )
    );
}

/**
 * Resizable card layout: cards placed in columns of 20rem (1 to 4 by width) that users resize by
 * dragging their edges or corner. Other cards move to make room.
 *
 * ```html
 * <fd-resizable-card-layout (layoutChange)="save($event)">
 *     <fd-resizable-card-item title="Sales" [cardWidthColSpan]="2" [cardHeightRowSpan]="20" [cardMiniHeaderRowSpan]="5" [cardMiniContentRowSpan]="10">
 *         <fd-card>...</fd-card>
 *     </fd-resizable-card-item>
 * </fd-resizable-card-layout>
 * ```
 */
@Component({
    selector: 'fd-resizable-card-layout',
    exportAs: 'fdResizableCardLayout',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[style.width.px]': 'layoutWidth()',
        '[style.height.px]': 'layoutHeight()',
        '[class]': 'computedClass()',
        '(keydown)': 'onKeydown($event)'
    }
})
export class ResizableCardLayout {
    /** Configuration per card (in content order). */
    readonly layoutConfig = input<ResizableCardLayoutConfig | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly stepChange = output<ResizedEvent>();
    readonly resizing = output<ResizedEvent>();
    readonly resized = output<ResizedEvent>();
    readonly miniHeaderReached = output<ResizedEvent>();
    readonly miniContentReached = output<ResizedEvent>();
    readonly layoutChange = output<ResizableCardLayoutConfig>();

    readonly cards = contentChildren(ResizableCardItem);
    readonly layoutSize = signal<LayoutSize>('xl');
    protected readonly layoutHeight = signal(0);
    protected readonly layoutWidth = computed(() => {
        const columns = COLUMNS[this.layoutSize()];
        return columns * horizontalResizeStep + 2 * PADDING[this.layoutSize()] + (columns - 1) * gap;
    });

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private columnsHeight: number[] = [];
    private sorted: ResizableCardItem[] = [];
    private layoutShifted = false;
    private keyManager: FocusKeyManager<ResizableCardItem> | null = null;

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            // the space available to the layout: its container, or the window when that has no width
            const container = this.host.parentElement ?? this.host;
            const update = (): void => this.updateSize(container.clientWidth || window.innerWidth);
            const observer = new ResizeObserver(update);
            observer.observe(container);
            window.addEventListener('resize', update);
            destroyRef.onDestroy(() => {
                observer.disconnect();
                window.removeEventListener('resize', update);
            });
        });
        // wire the cards: configuration, events and placement
        effect((onCleanup) => {
            const cards = this.cards();
            const config = this.layoutConfig();
            untracked(() => {
                const subscriptions = cards.map((card) => [
                    card.resizing.subscribe((e) => this.cardResizing(e)),
                    card.resized.subscribe((e) => this.cardResized(e)),
                    card.miniHeaderReached.subscribe((e) => {
                        this.miniHeaderReached.emit(e);
                        this.stepChange.emit(e);
                    }),
                    card.miniContentReached.subscribe((e) => {
                        this.miniContentReached.emit(e);
                        this.stepChange.emit(e);
                    })
                ]);
                this.applyConfig(cards, config);
                this.keyManager?.destroy();
                this.keyManager = new FocusKeyManager([...cards].sort((a, b) => a.rank() - b.rank()))
                    .withWrap()
                    .withHorizontalOrientation(getComputedStyle(this.host).direction === 'rtl' ? 'rtl' : 'ltr');
                onCleanup(() => subscriptions.flat().forEach((s) => s.unsubscribe()));
            });
        });
        // limit the card widths to the columns of the layout size
        effect(() => {
            const size = this.layoutSize();
            const cards = this.cards();
            cards.forEach((card) => (card.config(), card.widthSpanInput()));
            untracked(() => cards.forEach((card) => card.verifyUpdateCardWidth(size)));
        });
        // re-place the cards whenever their rank or size or the layout size changes
        effect(() => {
            const cards = this.cards();
            this.layoutSize();
            cards.forEach((card) => (card.rank(), card.cardWidth(), card.cardHeight()));
            untracked(() => this.arrangeCards(cards));
        });
        destroyRef.onDestroy(() => this.keyManager?.destroy());
    }

    /** Applies a layout configuration to cards that have no own configuration. */
    private applyConfig(
        cards: readonly ResizableCardItem[],
        config: ResizableCardLayoutConfig | null | undefined
    ): void {
        cards.forEach((card, index) => {
            const item = config?.[index];
            if (!item || card.config()) return;
            if (item.rank) card.rank.set(item.rank);
            if (item.cardWidthColSpan) card.cardWidthColSpan.set(item.cardWidthColSpan);
            if (item.cardHeightRowSpan) card.cardHeightRowSpan.set(item.cardHeightRowSpan);
        });
    }

    /** Re-applies the column limits and places all cards. */
    updateLayout(): void {
        this.cards().forEach((card) => card.verifyUpdateCardWidth(this.layoutSize()));
        this.arrangeCards(this.cards());
    }

    private updateSize(width: number): void {
        const size: LayoutSize = width <= 656 ? 'sm' : width <= 975 ? 'md' : width <= 1359 ? 'lg' : 'xl';
        this.layoutSize.set(size);
    }

    /** Places the cards by rank, each at the topmost position where it fits. */
    arrangeCards(cards: readonly ResizableCardItem[]): void {
        const columns = COLUMNS[this.layoutSize()];
        this.columnsHeight = new Array(columns).fill(0);
        this.sorted = [...cards].sort((a, b) => a.rank() - b.rank());
        this.sorted.forEach((card, index) => {
            this.placeCard(card, index);
            this.updateColumnsHeight(card);
        });
        this.layoutHeight.set(Math.max(0, ...this.columnsHeight) + verticalResizeStep);
        this.layoutChange.emit(
            this.cards().map((card) => ({
                title: card.title() ?? undefined,
                rank: card.rank(),
                cardWidthColSpan: card.cardWidthColSpan(),
                cardHeightRowSpan: card.cardHeightRowSpan(),
                cardMiniHeaderRowSpan: card.cardMiniHeaderRowSpan(),
                cardMiniContentRowSpan: card.cardMiniContentRowSpan(),
                resizable: card.resizable()
            }))
        );
    }

    private cardResizing(event: ResizedEvent): void {
        this.resizing.emit(event);
        this.handleHorizontalResize(event);
        if (event.card.cardHeightRowSpan() !== event.card.previousCardHeightRowSpan) {
            this.arrangeCards(this.sorted);
            this.stepChange.emit(event.card.resizedEvent());
        }
    }

    private cardResized(event: ResizedEvent): void {
        this.layoutShifted = false;
        this.arrangeCards(this.cards());
        this.resized.emit(event);
    }

    /** While a card grows into the next column, cards at the end of its row move down (and back). */
    private handleHorizontalResize(event: ResizedEvent): void {
        const columns = COLUMNS[this.layoutSize()];
        const change = event.cardWidth - event.prevCardWidth;
        const index = this.sorted.findIndex((card) => card.rank() === event.card.rank());
        const state = event.card.cardState;
        if (event.cardWidth > event.prevCardWidth) {
            if (state === 1 && change > horizontalResizeOffset + gap && !this.layoutShifted) {
                this.sorted.forEach((card, i) => {
                    if (
                        i > index &&
                        card.startingColumnPosition + card.cardWidthColSpan() === columns &&
                        card.cardWidthColSpan() !== columns
                    ) {
                        this.moveCardDown(i);
                    }
                });
                this.shift(true, event);
            } else if (state === -1 && change < horizontalResizeOffset + gap && this.layoutShifted) {
                this.sorted.forEach((card) => {
                    if (card.prevRank) card.rank.set(card.prevRank);
                    card.prevRank = 0;
                });
                this.shift(false, event);
            }
        } else if (event.cardWidth < event.prevCardWidth) {
            if (state === -1 && -change > horizontalResizeOffset && !this.layoutShifted) {
                this.shift(true, event);
            } else if (state === 1 && -change < horizontalResizeOffset && this.layoutShifted) {
                this.shift(false, event);
            }
        }
    }

    private shift(shifted: boolean, event: ResizedEvent): void {
        this.layoutShifted = shifted;
        this.arrangeCards(this.sorted);
        this.stepChange.emit(event.card.resizedEvent());
    }

    private moveCardDown(index: number): void {
        const current = this.sorted[index];
        let free = COLUMNS[this.layoutSize()] - current.cardWidthColSpan();
        current.prevRank = current.rank();
        for (let i = 1; free > 0; i++) {
            const card = this.sorted[index + i];
            if (!card || free < card.cardWidthColSpan()) break;
            card.prevRank = card.rank();
            card.rank.set(card.rank() - 1);
            current.rank.set(card.prevRank);
            free -= card.cardWidthColSpan();
        }
    }

    private updateColumnsHeight(card: ResizableCardItem): void {
        const start = card.startingColumnPosition;
        const span = columnSpan(card.cardWidth());
        const height = card.cardHeight() + card.top();
        for (let i = 0; i < span; i++) this.columnsHeight[i + start] = height;
        if (start === span) this.columnsHeight[start] = height;
    }

    private placeCard(card: ResizableCardItem, index: number): void {
        const padding = PADDING[this.layoutSize()];
        if (index === 0) {
            card.start.set(padding);
            card.top.set(0);
            card.startingColumnPosition = 0;
            return;
        }
        const heights = [...new Set(this.columnsHeight)].sort((a, b) => a - b);
        for (const height of heights) {
            const column = this.fitColumn(card, height);
            if (column === -1) continue;
            card.start.set(column * horizontalResizeStep + padding + column * gap);
            card.top.set(height + (height > 0 ? verticalResizeStep : 0));
            card.startingColumnPosition = column;
            return;
        }
    }

    /** First column where the card fits at the given height, or -1. */
    private fitColumn(card: ResizableCardItem, height: number): number {
        const columns = COLUMNS[this.layoutSize()];
        const span = columnSpan(card.cardWidth());
        const positions = this.columnsHeight.flatMap((h, i) => (h === height ? [i + 1] : []));
        for (const position of positions) {
            for (let start = Math.max(position - (span - 1), 1); start <= position; start++) {
                const fits =
                    span + start - 1 <= columns &&
                    Array.from({ length: span }, (_, s) => this.columnsHeight[start + s - 1]).every(
                        (h) => h !== undefined && h <= height
                    );
                if (fits) return start - 1;
            }
        }
        return -1;
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (!event.key.startsWith('Arrow') && event.key !== 'Home' && event.key !== 'End') return;
        const card = this.cards().find((c) => c.element === event.target);
        if (!card) return;
        if (!this.keyManager) return;
        if (this.keyManager.activeItemIndex === null || this.keyManager.activeItemIndex < 0) {
            this.keyManager.setFirstItemActive();
        }
        this.keyManager.updateActiveItem(card);
        this.keyManager.onKeydown(event);
    }

    protected readonly computedClass = computed(() => {
        const size = this.layoutSize();
        return cn(
            'relative m-0 mt-4 box-border block font-sap-font-family text-sap-font-size text-sap-text-color',
            size === 'sm' ? 'px-2' : size === 'xl' ? 'px-12' : 'px-4',
            this.userClass()
        );
    });
}
