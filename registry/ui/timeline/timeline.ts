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
    afterRenderEffect,
    computed,
    contentChildren,
    inject,
    input,
    signal,
    viewChild,
    type TrackByFunction
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon, type IconFont } from '@/ui/icon/icon';
import { Skeleton } from '@/ui/skeleton/skeleton';
import { Text } from '@/ui/text/text';

export type TimelineAxis = 'vertical' | 'horizontal';
/** left, right or double for a vertical axis; top, bottom or double for a horizontal one. */
export type TimelineSidePosition = 'left' | 'right' | 'top' | 'bottom' | 'double';

/** Side of the main line a node is rendered on: first is left (top), second is right (bottom). */
type TimelineSide = 'first' | 'second';

const TIMELINE_SIDE = new InjectionToken<TimelineSide>('TimelineSide');

/** Gap between the end of a connecting line and the next node. */
const LINE_GAP = 4;
/** Minimum line length between consecutive nodes on alternating sides of a vertical timeline. */
const DOUBLE_OFFSET = 24;

export interface TimelineNodeContext<T> {
    $implicit: T;
    index: number;
}

/** Template of a node: `<fd-timeline-node *fdTimelineNodeDef="let node">`. */
@Directive({ selector: '[fdTimelineNodeDef], [fd-timeline-node-def]' })
export class TimelineNodeDef<T = unknown> {
    readonly template = inject<TemplateRef<TimelineNodeContext<T>>>(TemplateRef);

    static ngTemplateContextGuard<T>(_dir: TimelineNodeDef<T>, ctx: unknown): ctx is TimelineNodeContext<T> {
        return true;
    }
}

/** A post on the timeline with its node (a dot or an icon) on the main line. */
@Component({
    selector: 'fd-timeline-node',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'listitem',
        '[attr.aria-label]': 'ariaLabel()',
        '[class]': 'computedClass()'
    },
    template: `
        <div [class]="containerClass()">
            <div [class]="iconWrapperClass()">
                <div #marker [class]="markerClass()">
                    @if (glyph()) {
                        <fd-icon
                            [glyph]="glyph()!"
                            [font]="glyphFont()"
                            class="size-[1.375rem] text-[1.375rem] leading-none text-sap-content-non-interactive-icon-color"
                        />
                    }
                </div>
            </div>
            <div
                #line
                [class]="
                    'box-border shrink-0 border border-solid border-sap-content-foreground-border-color ' +
                    (vertical() ? 'w-0' : 'h-0')
                "
            ></div>
        </div>
        <div [class]="postClass()">
            <ng-content />
        </div>
    `
})
export class TimelineNode {
    readonly glyph = input<string | null | undefined>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly ariaLabel = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly timeline = inject(Timeline, { optional: true });
    readonly side = inject(TIMELINE_SIDE, { optional: true }) ?? 'second';
    readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly markerRef = viewChild.required<ElementRef<HTMLElement>>('marker');
    private readonly lineRef = viewChild.required<ElementRef<HTMLElement>>('line');

    protected readonly vertical = computed(() => (this.timeline?.axis() ?? 'vertical') === 'vertical');

    constructor() {
        this.timeline?.register(this);
        inject(DestroyRef).onDestroy(() => this.timeline?.unregister(this));
    }

    marker(): HTMLElement {
        return this.markerRef().nativeElement;
    }

    line(): HTMLElement {
        return this.lineRef().nativeElement;
    }

    protected readonly computedClass = computed(() =>
        cn('relative box-border flex shrink-0', !this.vertical() && 'w-80', this.userClass())
    );

    protected readonly containerClass = computed(() => {
        const first = this.side === 'first';
        return this.vertical()
            ? cn('absolute top-2 flex h-full w-6 flex-[1_0] flex-col items-center', first ? '-end-6' : '-start-6')
            : cn('absolute start-2 flex h-6 w-full items-center', first ? '-bottom-6' : '-top-6');
    });

    protected readonly iconWrapperClass = computed(() => {
        const icon = !!this.glyph();
        return this.vertical()
            ? cn('flex-none pb-1', icon ? 'pt-1' : 'pt-3')
            : cn('flex-none pe-1', icon ? 'ps-1' : 'ps-3');
    });

    protected readonly markerClass = computed(() =>
        this.glyph()
            ? 'm-0 flex items-center justify-center p-0'
            : 'm-0 size-1.5 rounded-full bg-sap-content-foreground-border-color p-0'
    );

    protected readonly postClass = computed(() => {
        const first = this.side === 'first';
        return cn(
            'relative m-0 box-border h-auto grow rounded-[0.25rem] border border-solid border-sap-group-content-border-color bg-sap-group-content-background p-2',
            "after:absolute after:box-border after:size-[0.8rem] after:border-t after:border-r after:border-solid after:border-sap-group-content-border-color after:bg-sap-group-content-background after:content-['']",
            this.vertical()
                ? first
                    ? 'me-4 mb-5 after:-end-[0.4375rem] after:top-4 after:rotate-45 rtl:after:-rotate-135'
                    : 'ms-4 mb-5 after:-start-[0.4375rem] after:top-4 after:-rotate-135 rtl:after:rotate-45'
                : first
                  ? 'me-5 mb-4 after:start-4 after:-bottom-[0.4375rem] after:rotate-135'
                  : 'me-5 mt-4 after:start-4 after:-top-[0.4375rem] after:-rotate-45'
        );
    });
}

/** Header row of a post: avatar and header info. */
@Directive({
    selector: 'fd-timeline-node-header',
    host: { '[class]': 'computedClass()' }
})
export class TimelineNodeHeader {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn('m-0 mb-2 box-border flex items-center p-0', this.userClass())
    );
}

/** Title, text and subtitle of a post header. */
@Directive({
    selector: 'fd-timeline-node-header-info',
    host: { '[class]': 'computedClass()' }
})
export class TimelineNodeHeaderInfo {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn('m-0 box-border block p-0 not-first:ms-[0.3125rem]', this.userClass())
    );
}

@Directive({
    selector: '[fdTimelineNodeHeaderInfoTitle], [fd-timeline-node-header-info-title]',
    host: { class: 'me-[0.3rem] font-bold' }
})
export class TimelineNodeHeaderInfoTitle {}

@Directive({
    selector: '[fdTimelineNodeHeaderInfoText], [fd-timeline-node-header-info-text]',
    host: { class: 'font-normal' }
})
export class TimelineNodeHeaderInfoText {}

@Directive({
    selector: '[fdTimelineHeaderInfoSubTitle], [fd-timeline-header-info-sub-title]',
    host: { class: 'mt-0.5 block text-sap-font-small-size text-sap-content-label-color' }
})
export class TimelineHeaderInfoSubTitle {}

/** Text of a post; with maxLines it collapses and gets a More/Less toggle. */
@Component({
    selector: 'fd-timeline-node-body',
    imports: [Text],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `
        @if (content()) {
            <fd-text
                [text]="content()!"
                [maxLines]="maxLines() || null"
                [expandable]="!!maxLines()"
                (isCollapsedChange)="timeline?.calculatePositions()"
            />
        }
        <ng-content />
    `
})
export class TimelineNodeBody {
    readonly content = input<string | null | undefined>();
    readonly maxLines = input<number | null | undefined>();
    protected readonly timeline = inject(Timeline, { optional: true });
}

/** Actions of a post. */
@Directive({
    selector: 'fd-timeline-node-footer',
    host: { class: 'mt-2 flex flex-wrap items-center gap-2' }
})
export class TimelineNodeFooter {}

/**
 * Timeline: posts in chronological order along a vertical or horizontal line, on one side or
 * alternating on both sides. Without a data source it shows loading placeholders.
 *
 * ```html
 * <fd-timeline [dataSource]="posts" layout="double">
 *     <fd-timeline-node *fdTimelineNodeDef="let post" [glyph]="post.glyph">
 *         <fd-timeline-node-header>...</fd-timeline-node-header>
 *         <fd-timeline-node-body [content]="post.text" />
 *     </fd-timeline-node>
 * </fd-timeline>
 * ```
 */
@Component({
    selector: 'fd-timeline',
    exportAs: 'fdTimeline',
    imports: [NgTemplateOutlet, Skeleton, TimelineNode, TimelineNodeHeader],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'list',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.aria-busy]': 'loading() || null',
        '[class]': 'computedClass()'
    },
    template: `
        <div [class]="listClass('first')">
            @if (loading() && loadingSide() === 'first') {
                <ng-container [ngTemplateOutlet]="placeholders" [ngTemplateOutletInjector]="firstInjector" />
            }
            @for (item of firstItems(); track track($index, item)) {
                <ng-container
                    [ngTemplateOutlet]="nodeTemplate(item.index)"
                    [ngTemplateOutletContext]="{ $implicit: item.data, index: item.index }"
                    [ngTemplateOutletInjector]="firstInjector"
                />
            }
        </div>
        <div [class]="axis() === 'horizontal' ? 'h-6 w-full' : 'h-full w-6 flex-[0_0_1.5rem]'"></div>
        <div [class]="listClass('second')">
            @if (loading() && loadingSide() === 'second') {
                <ng-container [ngTemplateOutlet]="placeholders" [ngTemplateOutletInjector]="secondInjector" />
            }
            @for (item of secondItems(); track track($index, item)) {
                <ng-container
                    [ngTemplateOutlet]="nodeTemplate(item.index)"
                    [ngTemplateOutletContext]="{ $implicit: item.data, index: item.index }"
                    [ngTemplateOutletInjector]="secondInjector"
                />
            }
        </div>
        <ng-template #placeholders>
            @for (_ of [0, 1, 2]; track $index) {
                <fd-timeline-node>
                    <fd-timeline-node-header>
                        <fd-skeleton width="100%" height="32px">
                            <svg:circle cx="16" cy="16" r="16" />
                            <svg:rect x="37" y="0" width="120" height="12" rx="4" />
                            <svg:rect x="37" y="20" width="80" height="8" rx="4" />
                        </fd-skeleton>
                    </fd-timeline-node-header>
                    <fd-skeleton type="text" />
                </fd-timeline-node>
            }
        </ng-template>
    `
})
export class Timeline<T = unknown> {
    /** Nodes in chronological order; null or undefined shows loading placeholders. */
    readonly dataSource = input<readonly T[] | null | undefined>();
    readonly trackBy = input<TrackByFunction<T>>();
    readonly axis = input<TimelineAxis>('vertical');
    readonly layout = input<TimelineSidePosition>('right');
    readonly ariaLabel = input<string | null | undefined>('Timeline');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly nodeDefs = contentChildren(TimelineNodeDef);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly nodes = signal<TimelineNode[]>([]);
    private readonly measure = signal(0);

    protected readonly firstInjector = Injector.create({
        providers: [{ provide: TIMELINE_SIDE, useValue: 'first' }],
        parent: inject(Injector)
    });
    protected readonly secondInjector = Injector.create({
        providers: [{ provide: TIMELINE_SIDE, useValue: 'second' }],
        parent: inject(Injector)
    });

    readonly loading = computed(() => !this.dataSource());
    /** Sides that hold nodes. */
    private readonly sides = computed(() => {
        const layout = this.layout();
        return {
            first: layout !== 'right' && layout !== 'bottom',
            second: layout !== 'left' && layout !== 'top'
        };
    });
    protected readonly loadingSide = computed<TimelineSide>(() => (this.sides().first ? 'first' : 'second'));
    private readonly items = computed(() => (this.dataSource() ?? []).map((data, index) => ({ data, index })));
    protected readonly firstItems = computed(() => {
        const { first, second } = this.sides();
        return first ? this.items().filter((item) => !second || item.index % 2 === 0) : [];
    });
    protected readonly secondItems = computed(() => {
        const { first, second } = this.sides();
        return second ? this.items().filter((item) => !first || item.index % 2 === 1) : [];
    });

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const observer = new ResizeObserver(() => this.measure.update((n) => n + 1));
            observer.observe(this.host);
            destroyRef.onDestroy(() => observer.disconnect());
        });
        afterRenderEffect({
            write: () => {
                this.measure();
                this.layoutLines(this.nodes(), this.axis());
            }
        });
    }

    /** Recomputes the connecting lines, e.g. after the content of a node changed its size. */
    calculatePositions(): void {
        this.measure.update((n) => n + 1);
    }

    register(node: TimelineNode): void {
        this.nodes.update((nodes) => [...nodes, node]);
    }

    unregister(node: TimelineNode): void {
        this.nodes.update((nodes) => nodes.filter((n) => n !== node));
    }

    protected track(index: number, item: { data: T; index: number }): unknown {
        return this.trackBy()?.(item.index, item.data) ?? item.data;
    }

    protected nodeTemplate(index: number): TemplateRef<TimelineNodeContext<T>> | null {
        const defs = this.nodeDefs();
        return ((defs.length === 1 ? defs[0] : defs[index]) as TimelineNodeDef<T> | undefined)?.template ?? null;
    }

    /**
     * Spaces alternating nodes of a double-sided vertical timeline so that each node comes after the
     * previous one, then draws the line of every node up to the next one.
     */
    private layoutLines(nodes: TimelineNode[], axis: TimelineAxis): void {
        const rtl = getComputedStyle(this.host).direction === 'rtl';
        const inDocumentOrder = (side: TimelineSide): TimelineNode[] =>
            nodes
                .filter((node) => node.side === side)
                .sort((a, b) => (a.host.compareDocumentPosition(b.host) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
        const first = inDocumentOrder('first');
        const second = inDocumentOrder('second');
        const double = first.length > 0 && second.length > 0;
        const order = double
            ? Array.from({ length: Math.max(first.length, second.length) }, (_, i) => [first[i], second[i]])
                  .flat()
                  .filter((node): node is TimelineNode => !!node)
            : [...first, ...second];
        const start = (rect: DOMRect): number => (axis === 'vertical' ? rect.top : rtl ? -rect.right : rect.left);
        const markerStart = (node: TimelineNode): number => start(node.marker().getBoundingClientRect());

        if (axis === 'vertical' && double) {
            order.forEach((node) => (node.host.style.marginTop = ''));
            order.forEach((node, i) => {
                const previous = order[i - 1]?.marker().getBoundingClientRect();
                const gap = previous ? previous.bottom + DOUBLE_OFFSET - markerStart(node) : 0;
                if (gap > 0) node.host.style.marginTop = `${gap}px`;
            });
        }
        order.forEach((node, i) => {
            const line = node.line();
            const next = order[i + 1];
            line.style.opacity = next ? '' : '0';
            if (!next) return;
            const size = Math.max(0, markerStart(next) - start(line.getBoundingClientRect()) - LINE_GAP);
            line.style[axis === 'vertical' ? 'height' : 'width'] = `${size}px`;
        });
    }

    protected listClass(side: TimelineSide): string {
        const vertical = this.axis() === 'vertical';
        const sides = this.sides();
        const used = sides[side] || (this.loading() && this.loadingSide() === side);
        const offset = side === 'second' && sides.first;
        return cn(
            'relative m-0 box-border flex p-0',
            vertical ? 'flex-[1_0_calc(50%_-_0.75rem)] flex-col' : 'grow',
            !vertical && (side === 'first' ? 'items-end' : 'items-start'),
            !used && (vertical ? 'flex-[0_0_0]' : 'hidden'),
            offset && (vertical ? 'pt-6' : 'ps-[4.688rem]')
        );
    }

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex justify-center p-0 font-sap-font-family text-sap-font-size leading-(--sapContent_LineHeight) text-sap-text-color',
            this.axis() === 'vertical' ? 'max-w-[50rem] items-stretch' : 'flex-col',
            this.userClass()
        )
    );
}
