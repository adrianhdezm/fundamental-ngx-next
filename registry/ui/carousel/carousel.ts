/*
 * Port of @fundamental-ngx/core (carousel) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChildren,
    effect,
    inject,
    input,
    numberAttribute,
    output,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { BusyIndicator } from '@/ui/busy-indicator/busy-indicator';
import { Button } from '@/ui/button/button';

export interface CarouselConfig {
    vertical?: boolean;
    /** Number of items shown at once. */
    elementsAtOnce?: number;
    /** Dragging with the mouse or a finger moves the items. */
    gestureSupport?: boolean;
    /** The items wrap around: the active item is kept in the middle. */
    infinite?: boolean;
    /** CSS duration of a slide, e.g. `150ms`. */
    transition?: string;
}

/** An item the carousel engine moves. */
export interface CarouselItemRef {
    readonly element: HTMLElement;
    getWidth(): number;
    getHeight(): number;
}

export interface PanEndOutput<T extends CarouselItemRef = CarouselItemRef> {
    item: T;
    /** The drag went towards the following items. */
    after: boolean;
}

export const DEFAULT_TRANSITION_DURATION = '150ms';

/**
 * Moves a row (or column) of items with CSS transforms: to an item, to the next or previous
 * one, and by dragging, snapping to the closest item. In infinite mode the items are reordered in
 * the DOM so the active one stays in the middle.
 */
export class CarouselEngine<T extends CarouselItemRef = CarouselItemRef> {
    config: CarouselConfig = {};
    items: T[] = [];
    active: T | null = null;
    onActiveChange: (event: PanEndOutput<T>) => void = () => {};
    onDragStateChange: (dragging: boolean) => void = () => {};

    private transitionPx = 0;
    private lastDistance = 0;
    private initialDragPosition = 0;
    private lastDragPosition = 0;
    private listening = false;
    private dragStarted = false;
    private removeGestures: (() => void) | null = null;

    constructor(readonly element: HTMLElement) {}

    get currentTransitionPx(): number {
        return this.transitionPx;
    }

    private get elementsAtOnce(): number {
        return Math.max(1, this.config.elementsAtOnce ?? 1);
    }

    private get rtl(): boolean {
        return getComputedStyle(this.element).direction === 'rtl';
    }

    /** Sets the items, in their order in the DOM. */
    setItems(items: readonly T[]): void {
        this.items = [...items];
        if (!this.active || !this.items.includes(this.active)) this.active = this.items[0] ?? null;
    }

    setGestures(enabled: boolean): void {
        if (enabled && !this.removeGestures) this.removeGestures = this.listen();
        if (!enabled && this.removeGestures) {
            this.removeGestures();
            this.removeGestures = null;
        }
    }

    destroy(): void {
        this.setGestures(false);
    }

    goToItem(item: T, smooth = false): void {
        let index = this.items.indexOf(item);
        if (index < 0) return;
        if (this.config.infinite) {
            this.centerActive(index);
            index = this.items.indexOf(item);
        }
        this.transitionToIndex(index, smooth);
    }

    pickNext(): void {
        const index = this.active ? this.items.indexOf(this.active) : -1;
        const item = this.items[index + 1] ?? this.items[0];
        if (!item) return;
        this.goToItem(item, true);
        this.active = item;
    }

    pickPrevious(): void {
        const index = this.active ? this.items.indexOf(this.active) : 1;
        const item = this.items[index - 1] ?? this.items.at(-1);
        if (!item) return;
        this.goToItem(item, true);
        this.active = item;
    }

    /** Moves back to the start without a transition. */
    reset(): void {
        this.active = this.items[0] ?? null;
        this.element.style.transitionDuration = '0s';
        this.translate(0);
    }

    private centerActive(index: number): void {
        const size = this.size(this.items[0]);
        if (!size) return;
        const middle = Math.ceil(this.items.length / 2);
        const missing = index + Math.ceil(this.elementsAtOnce / 2) - middle;
        for (let i = 0; i < Math.abs(missing); i++) {
            if (missing > 0) this.items.push(this.items.shift()!);
            else this.items.unshift(this.items.pop()!);
        }
        for (const item of this.items) item.element.parentNode?.appendChild(item.element);
        this.element.style.transitionDuration = '0s';
        this.translate(this.transitionPx + size * missing);
    }

    private transitionToIndex(index: number, smooth: boolean): void {
        const px = this.size(this.items[0]) * index;
        this.element.style.transitionDuration = smooth ? (this.config.transition ?? DEFAULT_TRANSITION_DURATION) : '0s';
        this.translate(!this.rtl || this.config.vertical ? -px : px);
    }

    private translate(px: number): void {
        this.transitionPx = px;
        this.element.style.transform = `translate${this.config.vertical ? 'Y' : 'X'}(${px}px)`;
    }

    private size(item: T | undefined): number {
        if (!item) return 0;
        return this.config.vertical ? item.getHeight() : item.getWidth();
    }

    private closest(): T {
        const first = this.items[0];
        const px = this.transitionPx;
        if (
            !this.config.infinite &&
            ((!this.config.vertical && ((!this.rtl && px > 0) || (this.rtl && px < 0))) ||
                (this.config.vertical && px > 0))
        ) {
            return first;
        }
        const size = this.size(first);
        const halfApproached = Math.abs(px % size) > size / 2;
        let index = Math.ceil(Math.abs(px / size));
        const atOnce = this.elementsAtOnce;
        if (!this.config.infinite && atOnce > 1) {
            if (this.items.length < atOnce) return first;
            if (index + atOnce >= this.items.length) return this.items[this.items.length - atOnce] ?? first;
        }
        index += halfApproached ? 0 : -1;
        return this.items[index] ?? this.items.at(-1)!;
    }

    private pan(delta: number): void {
        const distance = delta - this.lastDistance;
        this.lastDistance = delta;
        this.translate(this.transitionPx + distance);
    }

    private panEnd(delta: number): void {
        this.pan(delta);
        const closest = this.closest();
        this.goToItem(closest, true);
        if (this.active !== closest) {
            this.active = closest;
            this.onActiveChange({ item: closest, after: delta < 0 });
        }
        this.onDragStateChange(false);
        this.lastDistance = 0;
    }

    private coordinate(event: PointerEvent): number {
        return this.config.vertical ? event.pageY : event.pageX;
    }

    private listen(): () => void {
        const doc = this.element.ownerDocument;
        const down = (event: PointerEvent): void => {
            if (event.button !== 0 || !this.items.length) return;
            this.listening = true;
            this.lastDragPosition = this.initialDragPosition = this.coordinate(event);
            this.element.style.transitionDuration = '0s';
            this.onDragStateChange(true);
        };
        const move = (event: PointerEvent): void => {
            const coordinate = this.coordinate(event);
            if (!this.listening || coordinate === this.lastDragPosition) return;
            this.dragStarted = true;
            this.lastDragPosition = coordinate;
            this.pan(coordinate - this.initialDragPosition);
        };
        const up = (event: PointerEvent): void => {
            if (!this.listening) return;
            if (this.dragStarted) this.panEnd(this.coordinate(event) - this.initialDragPosition);
            else this.onDragStateChange(false);
            this.listening = false;
            this.dragStarted = false;
        };
        this.element.addEventListener('pointerdown', down, { passive: true });
        doc.addEventListener('pointermove', move, { passive: true });
        doc.addEventListener('pointerup', up, { passive: true });
        doc.addEventListener('pointercancel', up, { passive: true });
        return () => {
            this.element.removeEventListener('pointerdown', down);
            doc.removeEventListener('pointermove', move);
            doc.removeEventListener('pointerup', up);
            doc.removeEventListener('pointercancel', up);
        };
    }
}

let nextItemId = 0;

/** An item of an `fdCarousel` container. */
@Directive({
    selector: '[fd-carousel-item], [fdCarouselItem]',
    exportAs: 'fdCarouselItem',
    host: { '[attr.id]': 'id()' }
})
export class CarouselItemDirective<T = unknown> implements CarouselItemRef {
    readonly value = input<T>();
    readonly initialHeight = input(0);
    readonly initialWidth = input(0);
    readonly id = input(`carousel-item-id-${nextItemId++}`);
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    getWidth(): number {
        return this.element.getBoundingClientRect().width || this.initialWidth();
    }

    getHeight(): number {
        return this.element.getBoundingClientRect().height || this.initialHeight();
    }
}

/**
 * Turns an element into a carousel of its `fdCarouselItem` children: the element moves with
 * transforms, so put it in a container that clips it.
 *
 * ```html
 * <div class="overflow-hidden"><div fdCarousel #c="fdCarousel" [config]="{ vertical: true, infinite: true }">
 *     @for (hour of hours; track hour) { <span fdCarouselItem [value]="hour">{{ hour }}</span> }
 * </div></div>
 * ```
 */
@Directive({
    selector: '[fdCarousel]',
    exportAs: 'fdCarousel',
    host: { class: 'transition-transform' }
})
export class CarouselDirective {
    readonly config = input<CarouselConfig>({});
    readonly activeChange = output<PanEndOutput<CarouselItemDirective>>();
    readonly dragStateChange = output<boolean>();
    readonly items = contentChildren(CarouselItemDirective, { descendants: true });
    readonly engine = new CarouselEngine<CarouselItemDirective>(
        inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
    );

    constructor() {
        this.engine.onActiveChange = (event) => this.activeChange.emit(event);
        this.engine.onDragStateChange = (dragging) => this.dragStateChange.emit(dragging);
        effect(() => {
            const config = this.config();
            this.engine.config = config;
            this.engine.setGestures(!!config.gestureSupport);
        });
        effect(() => this.engine.setItems(this.items()));
        inject(DestroyRef).onDestroy(() => this.engine.destroy());
    }

    goToItem(item: CarouselItemDirective, smooth?: boolean): void {
        this.engine.goToItem(item, smooth);
        this.engine.active = item;
    }

    pickPrevious(): void {
        this.engine.pickPrevious();
    }

    pickNext(): void {
        this.engine.pickNext();
    }
}

export type PageIndicatorsOrientation = 'bottom' | 'top';
export type CarouselBackgroundOptions = 'translucent' | 'transparent' | 'solid';
export type CarouselSlideDirection = 'Next' | 'Previous' | 'None';

export interface CarouselActiveSlides {
    readonly activeItems: CarouselItem[];
    readonly slideDirection: CarouselSlideDirection;
}

/** More slides than this show a numeric indicator instead of dots. */
const ICON_PAGE_INDICATOR_LIMIT = 8;

/** Late reference to Carousel for CarouselItem. */
function forwardCarousel(): typeof Carousel {
    return Carousel;
}

/** A slide of a carousel; `loading` shows a busy indicator over it. */
@Component({
    selector: 'fd-carousel-item',
    exportAs: 'fdCarouselItem',
    imports: [BusyIndicator],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'option',
        '[attr.id]': 'id()',
        '[attr.aria-label]': 'ariaLabel() || null',
        '[attr.aria-labelledby]': 'ariaLabelledBy() || null',
        '[attr.aria-describedby]': 'ariaDescribedBy() || null',
        '[attr.title]': 'title() || null',
        '[attr.aria-setsize]': 'carousel?.slides().length ?? null',
        '[attr.aria-posinset]': 'position()',
        '[attr.aria-selected]': 'active()',
        '[attr.aria-hidden]': '!active()',
        '[attr.aria-busy]': 'loading() || null',
        '[class]': 'computedClass()'
    },
    template: `<fd-busy-indicator [loading]="loading()" block [tabindex]="null" class="h-full max-w-full"
        ><ng-content
    /></fd-busy-indicator>`
})
export class CarouselItem<T = unknown> implements CarouselItemRef {
    readonly id = input(`fd-carousel-item-${nextItemId++}`);
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly ariaDescribedBy = input<string | null | undefined>();
    readonly loading = input(false, { transform: booleanAttribute });
    readonly title = input<string | null | undefined>();
    /** Size used while the slide is not rendered yet. */
    readonly initialHeight = input(0);
    readonly initialWidth = input(0);
    readonly value = input<T>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly carousel = inject(forwardCarousel(), { optional: true });
    private readonly self = this as unknown as CarouselItem;

    protected readonly position = computed(() => (this.carousel?.slides().indexOf(this.self) ?? -1) + 1 || null);
    /** One of the slides shown. */
    readonly active = computed(() => this.carousel?.activeSlides().includes(this.self) ?? true);
    private readonly shown = computed(() => this.carousel?.shownSlides().has(this.self) ?? true);

    getWidth(): number {
        return this.element.getBoundingClientRect().width || this.initialWidth();
    }

    getHeight(): number {
        return this.element.getBoundingClientRect().height || this.initialHeight();
    }

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex h-full max-w-full shrink-0 items-center justify-center p-0 leading-0',
            '[&_img]:pointer-events-none',
            this.carousel?.vertical() ? '[&_img]:h-auto [&_img]:min-w-full' : '[&_img]:min-h-full [&_img]:w-auto',
            // a fixed number of slides share the width
            this.carousel?.visibleSlidesCount() !== 'auto' &&
                !this.carousel?.vertical() &&
                'w-[calc(100%/var(--carousel-count,1))]',
            !this.shown() && 'invisible',
            this.userClass()
        )
    );
}

/** Background of the slides per option. */
const CONTENT_BACKGROUND: Record<CarouselBackgroundOptions, string> = {
    translucent: 'bg-sap-background-color',
    solid: 'bg-sap-group-content-background',
    transparent: 'bg-transparent'
};

/** Background of the page indicator bar per option. */
const INDICATOR_BACKGROUND: Record<CarouselBackgroundOptions, string> = {
    solid: 'bg-sap-page-footer-background',
    translucent: 'bg-sap-background-color',
    transparent: 'bg-transparent'
};

const INDICATORS = 'm-0 box-border flex min-w-36 flex-wrap items-center justify-center p-2';

let nextCarouselId = 0;

/**
 * Carousel: shows one or more slides at a time with navigation buttons, page indicators (dots,
 * or "2 of 9" for many slides) and swiping. Left and Right (or Up and Down when vertical) move
 * between the slides; `loop` wraps around.
 *
 * ```html
 * <fd-carousel width="31.25rem" ariaLabel="Products">
 *     <fd-carousel-item><img src="a.png" alt="A" /></fd-carousel-item>
 *     <fd-carousel-item><img src="b.png" alt="B" /></fd-carousel-item>
 * </fd-carousel>
 * ```
 */
@Component({
    selector: 'fd-carousel',
    exportAs: 'fdCarousel',
    imports: [NgTemplateOutlet, Button],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.id]': 'id()',
        '[style.width]': 'width()',
        '[class]': 'computedClass()',
        '(keydown)': 'onKeydown($event)'
    },
    template: `
        <div #container [class]="sectionClass()" [style.height]="height()" (click)="focus()">
            @if (showIndicatorContainer() && pageIndicatorsOrientation() === 'top') {
                <ng-container [ngTemplateOutlet]="indicatorContainer" />
            }
            <div [class]="contentClass()" [style.width]="contentWidth()">
                @if (navigation() && !navigatorInPageIndicator() && pages() > 1) {
                    <ng-container [ngTemplateOutlet]="previousButton" [ngTemplateOutletContext]="{ inContent: true }" />
                }
                <!-- only the slides are in the listbox: buttons and indicators are not options -->
                <div
                    #list
                    data-carousel-list
                    [attr.role]="slides().length ? 'listbox' : null"
                    [attr.tabindex]="slides().length ? 0 : null"
                    [attr.aria-roledescription]="slides().length ? 'Carousel' : null"
                    [attr.aria-label]="ariaLabel() || null"
                    [attr.aria-labelledby]="ariaLabelledBy() || null"
                    [attr.aria-describedby]="ariaDescribedBy() || null"
                    [attr.aria-activedescendant]="activeSlides().at(0)?.id() ?? null"
                    class="size-full overflow-hidden outline-none"
                >
                    <div #track [class]="slidesClass()" [style.--carousel-count]="count()">
                        <ng-content />
                    </div>
                </div>
                @if (navigation() && !navigatorInPageIndicator() && pages() > 1) {
                    <ng-container [ngTemplateOutlet]="nextButton" [ngTemplateOutletContext]="{ inContent: true }" />
                }
            </div>
            @if (showIndicatorContainer() && pageIndicatorsOrientation() === 'bottom') {
                <ng-container [ngTemplateOutlet]="indicatorContainer" />
            }
            <div class="sr-only-sap" aria-live="polite">
                {{ readerLabel() }} {{ start() + 1 }} {{ ofLabel() }} {{ pages() }}
            </div>
        </div>

        <ng-template #indicatorContainer>
            <div [class]="indicatorContainerClass()">
                @if (navigation() && navigatorInPageIndicator() && pages() > 1) {
                    <ng-container
                        [ngTemplateOutlet]="previousButton"
                        [ngTemplateOutletContext]="{ inContent: false }"
                    />
                }
                @if (numeric()) {
                    @if (pageIndicator()) {
                        <div class="${INDICATORS}">
                            <div class="truncate text-center text-sap-page-footer-text-color" dir="ltr">
                                {{ start() + 1 }} {{ ofLabel() }} {{ pages() }}
                            </div>
                        </div>
                    }
                } @else if (pages() > 1) {
                    <div class="${INDICATORS}">
                        @if (pageIndicator()) {
                            @for (page of pageArray(); track $index) {
                                <span
                                    role="img"
                                    [attr.aria-label]="pageLabel($index)"
                                    [class]="$index === start() ? activeDotClass : dotClass"
                                ></span>
                            }
                        }
                    </div>
                }
                @if (navigation() && navigatorInPageIndicator() && pages() > 1) {
                    <ng-container [ngTemplateOutlet]="nextButton" [ngTemplateOutletContext]="{ inContent: false }" />
                }
            </div>
        </ng-template>

        <ng-template #previousButton let-inContent="inContent">
            <button
                fdButton
                [glyph]="vertical() ? 'slim-arrow-up' : 'slim-arrow-left'"
                [ariaLabel]="previousLabel()"
                [attr.title]="previousLabel()"
                [disabled]="previousDisabled()"
                [class]="buttonClass(inContent, 'previous')"
                (click)="previous(); $event.stopPropagation()"
            ></button>
        </ng-template>
        <ng-template #nextButton let-inContent="inContent">
            <button
                fdButton
                [glyph]="vertical() ? 'slim-arrow-down' : 'slim-arrow-right'"
                [ariaLabel]="nextLabel()"
                [attr.title]="nextLabel()"
                [disabled]="nextDisabled()"
                [class]="buttonClass(inContent, 'next')"
                (click)="next(); $event.stopPropagation()"
            ></button>
        </ng-template>
    `
})
export class Carousel {
    readonly id = input(`fd-carousel-${nextCarouselId++}`);
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly ariaDescribedBy = input<string | null | undefined>();
    readonly pageIndicatorsOrientation = input<PageIndicatorsOrientation>('bottom');
    readonly height = input<string | null | undefined>();
    readonly width = input('100%');
    /** Wraps from the last slide to the first and back. */
    readonly loop = input(false, { transform: booleanAttribute });
    /** Shows the navigation buttons. */
    readonly navigation = input(true, { transform: booleanAttribute });
    /** Puts the navigation buttons next to the page indicators instead of over the slides. */
    readonly navigatorInPageIndicator = input(true, { transform: booleanAttribute });
    /** Shows "2 of 9" instead of dots; always on for more than 8 slides. */
    readonly numericIndicator = input(false, { transform: booleanAttribute });
    readonly pageIndicatorContainer = input(true, { transform: booleanAttribute });
    readonly pageIndicator = input(true, { transform: booleanAttribute });
    /** Duration of a slide in milliseconds. */
    readonly slideTransitionDuration = input(150, { transform: numberAttribute });
    readonly swipeEnabled = input(true, { transform: booleanAttribute });
    readonly vertical = input(false, { transform: booleanAttribute });
    readonly noPaginationContainerBorder = input(false, { transform: booleanAttribute });
    readonly contentBackground = input<CarouselBackgroundOptions>('translucent');
    readonly pageIndicatorBackground = input<CarouselBackgroundOptions>('solid');
    /** Slides shown at once; `auto` fits as many as the width allows. */
    readonly visibleSlidesCount = input<number | 'auto'>(1);
    readonly previousLabel = input('Go to previous item');
    readonly nextLabel = input('Go to next item');
    readonly ofLabel = input('of');
    readonly readerLabel = input('Displaying item');
    /** Label of a page dot; `{itemNum}` and `{totalNum}` are replaced. */
    readonly pageIndicatorLabel = input('Item {itemNum} of {totalNum} displayed');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly slideChange = output<CarouselActiveSlides>();

    readonly slides = contentChildren(CarouselItem, { descendants: true });
    private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
    private readonly slidesElement = viewChild.required<ElementRef<HTMLElement>>('track');
    private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    /** Index of the first slide shown. */
    readonly start = signal(0);
    private readonly fitting = signal({ width: 0, slides: 1 });
    /** Slides kept visible while they slide out. */
    private readonly leaving = signal<ReadonlySet<CarouselItem>>(new Set());
    private readonly dragging = signal(false);
    private engine: CarouselEngine<CarouselItem> | null = null;
    private leaveTimer: ReturnType<typeof setTimeout> | undefined;

    /** Number of slides shown at once. */
    readonly count = computed(() => {
        const count = this.visibleSlidesCount();
        return Math.max(1, count === 'auto' ? this.fitting().slides : count);
    });
    readonly pages = computed(() => {
        const total = this.slides().length;
        if (!total) return 0;
        return this.loop() && this.count() > 1 ? total : Math.max(1, total - this.count() + 1);
    });
    protected readonly pageArray = computed(() => Array.from({ length: this.pages() }));
    protected readonly numeric = computed(
        () => this.numericIndicator() || this.slides().length > ICON_PAGE_INDICATOR_LIMIT
    );
    protected readonly showIndicatorContainer = computed(
        () => this.pageIndicatorContainer() && (this.pages() > 0 || this.numeric())
    );
    readonly activeSlides = computed(() => {
        const slides = this.slides();
        const start = this.start();
        const count = Math.min(this.count(), slides.length);
        return Array.from({ length: count }, (_, i) =>
            this.loop() ? slides[(start + i) % slides.length] : slides[start + i]
        ).filter((slide): slide is CarouselItem => !!slide);
    });
    /** The slides that are rendered visibly. */
    readonly shownSlides = computed<ReadonlySet<CarouselItem>>(() =>
        this.dragging() ? new Set(this.slides()) : new Set([...this.activeSlides(), ...this.leaving()])
    );
    protected readonly previousDisabled = computed(
        () => this.slides().length <= 1 || (!this.loop() && this.start() <= 0)
    );
    protected readonly nextDisabled = computed(
        () => this.slides().length <= 1 || (!this.loop() && this.start() >= this.pages() - 1)
    );
    /** With `auto` the slides area shrinks to the slides that fit. */
    protected readonly contentWidth = computed(() => {
        const width = this.fitting().width;
        return this.visibleSlidesCount() === 'auto' && width ? `${width}px` : null;
    });

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const engine = new CarouselEngine<CarouselItem>(this.slidesElement().nativeElement);
            engine.onActiveChange = (event) => this.onSwipe(event);
            engine.onDragStateChange = (dragging) => this.dragging.set(dragging);
            this.engine = engine;
            this.configure();
            engine.setItems(untracked(this.slides));
            const observer = new ResizeObserver(() => this.onResize());
            observer.observe(this.slidesElement().nativeElement);
            observer.observe(this.container().nativeElement);
            destroyRef.onDestroy(() => {
                observer.disconnect();
                engine.destroy();
                clearTimeout(this.leaveTimer);
            });
        });
        effect(() => {
            this.vertical();
            this.count();
            this.swipeEnabled();
            this.loop();
            this.slideTransitionDuration();
            untracked(() => this.configure());
        });
        // a new visibleSlidesCount: keep the shown slides in range and report them, like upstream
        let previousCount: number | 'auto' | undefined;
        effect(() => {
            const count = this.visibleSlidesCount();
            untracked(() => {
                const changed = previousCount !== undefined && previousCount !== count;
                previousCount = count;
                if (!changed || !this.slides().length) return;
                const last = Math.max(0, this.pages() - 1);
                if (!this.loop() && this.start() > last) this.moveTo(last);
                this.notify('None');
            });
        });
        // new slides: back to the first
        effect(() => {
            const slides = this.slides();
            untracked(() => {
                if (!this.engine) return;
                this.engine.setItems(slides);
                for (const slide of slides) slide.element.parentNode?.appendChild(slide.element);
                this.engine.setItems(slides);
                this.engine.reset();
                this.start.set(0);
                this.onResize();
            });
        });
    }

    previous(): void {
        if (this.previousDisabled()) return;
        this.moveTo(this.loop() ? (this.start() - 1 + this.slides().length) % this.slides().length : this.start() - 1);
        this.notify('Previous');
    }

    next(): void {
        if (this.nextDisabled()) return;
        this.moveTo(this.loop() ? (this.start() + 1) % this.slides().length : this.start() + 1);
        this.notify('Next');
    }

    /** Focuses the carousel, e.g. after a click on a slide. */
    focus(): void {
        const list = this.list().nativeElement;
        if (list.tabIndex >= 0 && list !== document.activeElement) list.focus({ preventScroll: true });
    }

    protected onKeydown(event: KeyboardEvent): void {
        const rtl = getComputedStyle(this.host).direction === 'rtl';
        let move: 'previous' | 'next' | null = null;
        if (event.key === 'ArrowLeft') move = rtl ? 'next' : 'previous';
        else if (event.key === 'ArrowRight') move = rtl ? 'previous' : 'next';
        else if (this.vertical() && event.key === 'ArrowUp') move = 'previous';
        else if (this.vertical() && event.key === 'ArrowDown') move = 'next';
        if (!move) return;
        event.preventDefault();
        this[move]();
        this.focus();
    }

    protected pageLabel(index: number): string {
        return this.pageIndicatorLabel()
            .replace('{itemNum}', String(index + 1))
            .replace('{totalNum}', String(this.slides().length));
    }

    private moveTo(start: number): void {
        const previous = this.activeSlides();
        this.start.set(start);
        const slide = this.slides()[start];
        if (slide && this.engine) {
            this.engine.goToItem(slide, true);
            this.engine.active = slide;
        }
        this.keepLeaving(previous);
    }

    /** Keeps the previous slides visible until the slide transition ends. */
    private keepLeaving(previous: CarouselItem[]): void {
        clearTimeout(this.leaveTimer);
        this.leaving.set(new Set(previous));
        this.leaveTimer = setTimeout(() => this.leaving.set(new Set()), this.slideTransitionDuration());
    }

    private notify(direction: CarouselSlideDirection): void {
        this.slideChange.emit({ activeItems: this.activeSlides(), slideDirection: direction });
    }

    private onSwipe(event: PanEndOutput<CarouselItem>): void {
        const index = this.slides().indexOf(event.item);
        if (index < 0 || index === this.start()) return;
        const rtl = getComputedStyle(this.host).direction === 'rtl';
        const after = rtl && !this.vertical() ? !event.after : event.after;
        this.keepLeaving([...this.slides()]);
        this.start.set(index);
        this.notify(after ? 'Next' : 'Previous');
    }

    private configure(): void {
        if (!this.engine) return;
        this.engine.config = {
            vertical: this.vertical(),
            elementsAtOnce: this.count(),
            gestureSupport: this.swipeEnabled(),
            infinite: this.loop(),
            transition: `${this.slideTransitionDuration()}ms`
        };
        this.engine.setGestures(this.swipeEnabled() && this.slides().length > 1);
    }

    private onResize(): void {
        const fitting = this.fit();
        const slides = this.slides();
        this.fitting.set(fitting);
        if (this.visibleSlidesCount() === 'auto' && slides.length) {
            // keep the shown slides filling the width
            const start = Math.max(0, Math.min(this.start(), slides.length - fitting.slides));
            this.start.set(start);
            this.engine?.goToItem(slides[start]);
            if (this.engine) this.engine.active = slides[start];
        }
    }

    /** The slides (from the first shown) that fit into the width, and their width. */
    private fit(): { width: number; slides: number } {
        const available = this.container().nativeElement.getBoundingClientRect().width;
        const slides = this.slides();
        const ordered = [...slides.slice(this.start()), ...slides.slice(0, this.start())];
        const limit = this.visibleSlidesCount() === 'auto' ? slides.length : this.count();
        let width = 0;
        let count = 0;
        for (const slide of ordered.slice(0, limit)) {
            const slideWidth = slide.getWidth();
            if (!slideWidth || width + slideWidth > available) break;
            width += slideWidth;
            count++;
        }
        return { width, slides: Math.max(1, count) };
    }

    protected readonly computedClass = computed(() => cn('block max-w-full', this.userClass()));

    protected readonly sectionClass = computed(() =>
        cn(
            'group/carousel m-0 box-border flex h-full w-full max-w-full min-w-[15.5rem] flex-col p-0 font-sap-font-family text-sap-font-size',
            // the focus frame goes around the whole carousel
            'has-[[data-carousel-list]:focus-visible]:outline-sap has-[[data-carousel-list]:focus-visible]:outline-offset-0'
        )
    );

    protected readonly contentClass = computed(() =>
        cn(
            'relative m-0 box-border max-w-full basis-full overflow-hidden p-0',
            CONTENT_BACKGROUND[this.contentBackground()]
        )
    );

    protected readonly slidesClass = computed(() =>
        cn(
            'm-0 box-border h-full min-h-fit p-0 transition-transform ease-in-out select-none [-webkit-tap-highlight-color:transparent] [-webkit-user-drag:none]',
            this.vertical() ? 'touch-pan-x' : 'flex w-full touch-pan-y',
            this.visibleSlidesCount() === 'auto' && !this.vertical() && 'min-w-fit'
        )
    );

    protected readonly indicatorContainerClass = computed(() =>
        cn(
            'm-0 box-border flex max-h-14 min-h-11 items-center justify-center border-0 border-t border-solid border-sap-list-border-color px-2 py-1.5',
            'first:border-t-0 first:border-b',
            this.noPaginationContainerBorder() && 'border-transparent',
            INDICATOR_BACKGROUND[this.pageIndicatorBackground()]
        )
    );

    protected buttonClass(inContent: boolean, which: 'previous' | 'next'): string {
        return cn(
            'm-1 size-[2.125rem] min-w-0 shrink-0 rounded-full p-0 focus:after:rounded-full [&+button]:ms-2',
            inContent && [
                'absolute z-1 m-0 hidden shadow-sap-content-shadow0 group-hover/carousel:flex',
                this.vertical()
                    ? ['start-1/2 -translate-x-1/2 rtl:translate-x-1/2', which === 'previous' ? 'top-2' : 'bottom-2']
                    : ['top-1/2 -translate-y-1/2', which === 'previous' ? 'start-2' : 'end-2']
            ]
        );
    }

    protected readonly dotClass =
        'm-0 mx-1.5 box-border size-1 shrink-0 rounded-full border border-solid border-sap-content-foreground-border-color bg-sap-content-foreground-border-color p-0 hc:mx-1 hc:size-2 hc:bg-transparent';
    protected readonly activeDotClass =
        'm-0 mx-1 box-border size-2 shrink-0 rounded-full border border-solid border-sap-content-selected-foreground-color bg-sap-content-selected-foreground-color p-0';
}
