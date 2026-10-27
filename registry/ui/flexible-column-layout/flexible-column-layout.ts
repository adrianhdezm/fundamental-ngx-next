import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    InjectionToken,
    TemplateRef,
    afterNextRender,
    computed,
    contentChild,
    effect,
    inject,
    input,
    model,
    signal,
    untracked,
    type Provider
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';

export type FlexibleColumnLayout =
    | 'OneColumnStartFullScreen'
    | 'OneColumnMidFullScreen'
    | 'OneColumnEndFullScreen'
    | 'TwoColumnsStartExpanded'
    | 'TwoColumnsMidExpanded'
    | 'TwoColumnsEndExpanded'
    | 'ThreeColumnsMidExpanded'
    | 'ThreeColumnsEndExpanded'
    | 'ThreeColumnsStartMinimized'
    | 'ThreeColumnsEndMinimized';

/** Widths of the start, mid and end columns in percent. */
export interface FlexibleColumnSettings {
    start: number;
    mid: number;
    end: number;
}

export type FlexibleColumnLayoutDefinition = Record<FlexibleColumnLayout, FlexibleColumnSettings>;

export interface FlexibleLayoutConfig {
    layouts: FlexibleColumnLayoutDefinition;
}

export const DEFAULT_FLEXIBLE_LAYOUT_CONFIG: FlexibleLayoutConfig = {
    layouts: {
        OneColumnStartFullScreen: { start: 100, mid: 0, end: 0 },
        OneColumnMidFullScreen: { start: 0, mid: 100, end: 0 },
        OneColumnEndFullScreen: { start: 0, mid: 0, end: 100 },
        TwoColumnsStartExpanded: { start: 67, mid: 33, end: 0 },
        TwoColumnsMidExpanded: { start: 33, mid: 67, end: 0 },
        TwoColumnsEndExpanded: { start: 0, mid: 33, end: 67 },
        ThreeColumnsMidExpanded: { start: 25, mid: 50, end: 25 },
        ThreeColumnsEndExpanded: { start: 25, mid: 25, end: 50 },
        ThreeColumnsStartMinimized: { start: 0, mid: 67, end: 33 },
        ThreeColumnsEndMinimized: { start: 33, mid: 67, end: 0 }
    }
};

export const FD_FLEXIBLE_LAYOUT_CONFIG = new InjectionToken<FlexibleLayoutConfig>('FdFlexibleLayoutConfig', {
    factory: () => DEFAULT_FLEXIBLE_LAYOUT_CONFIG
});

/** Overrides some of the column widths of the layouts. */
export function provideFlexibleColumnLayoutConfig(config: {
    layouts?: Partial<FlexibleColumnLayoutDefinition>;
}): Provider[] {
    return [
        {
            provide: FD_FLEXIBLE_LAYOUT_CONFIG,
            useValue: { layouts: { ...DEFAULT_FLEXIBLE_LAYOUT_CONFIG.layouts, ...config.layouts } }
        }
    ];
}

type ScreenSize = 'sm' | 'md' | 'lg';
/** Direction the arrow of a separator points to. */
type Separator = 'left' | 'right' | null;

/** Next layout when the start (left) separator is clicked. */
const START_SEPARATOR_NEXT: Partial<Record<FlexibleColumnLayout, FlexibleColumnLayout>> = {
    TwoColumnsStartExpanded: 'TwoColumnsMidExpanded',
    TwoColumnsMidExpanded: 'TwoColumnsStartExpanded',
    ThreeColumnsMidExpanded: 'ThreeColumnsEndMinimized',
    ThreeColumnsEndMinimized: 'TwoColumnsStartExpanded',
    ThreeColumnsStartMinimized: 'ThreeColumnsEndMinimized'
};

/** Next layout when the end (right) separator is clicked. */
const END_SEPARATOR_NEXT: Partial<Record<FlexibleColumnLayout, FlexibleColumnLayout>> = {
    TwoColumnsEndExpanded: 'ThreeColumnsStartMinimized',
    ThreeColumnsMidExpanded: 'ThreeColumnsEndExpanded',
    ThreeColumnsEndExpanded: 'ThreeColumnsMidExpanded',
    ThreeColumnsEndMinimized: 'ThreeColumnsMidExpanded',
    ThreeColumnsStartMinimized: 'TwoColumnsEndExpanded'
};

/**
 * Flexible column layout: up to three columns (list, detail, detail-detail) whose widths follow the
 * layout. Separators between visible columns expand or collapse them, and the layout adapts to the
 * width: below smBreakPoint one column fills the screen, below lgBreakPoint at most two columns
 * are shown.
 *
 * ```html
 * <fd-flexible-column-layout [(layout)]="layout">
 *     <ng-template #startColumn>...</ng-template>
 *     <ng-template #midColumn>...</ng-template>
 *     <ng-template #endColumn>...</ng-template>
 * </fd-flexible-column-layout>
 * ```
 */
@Component({
    selector: 'fd-flexible-column-layout',
    exportAs: 'fdFlexibleColumnLayout',
    imports: [NgTemplateOutlet, Button],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `
        <div
            [class]="columnClass(columns().start)"
            [style.width.%]="columns().start"
            [attr.aria-hidden]="!columns().start || null"
        >
            <ng-container [ngTemplateOutlet]="startColumn() ?? null" />
        </div>
        @if (startSeparator(); as direction) {
            <div [class]="separatorClass()" (click)="onStartSeparator()">
                <button
                    fdButton
                    variant="transparent"
                    data-density="compact"
                    [glyph]="'slim-arrow-' + direction"
                    [ariaLabel]="separatorLabel(direction, collapseTitleStartBtn(), expandTitleStartBtn())"
                    [attr.title]="separatorLabel(direction, collapseTitleStartBtn(), expandTitleStartBtn())"
                    [class]="buttonClass"
                    (click)="$event.stopPropagation(); onStartSeparator()"
                ></button>
            </div>
        }
        <div
            [class]="columnClass(columns().mid)"
            [style.width.%]="columns().mid"
            [attr.aria-hidden]="!columns().mid || null"
        >
            <ng-container [ngTemplateOutlet]="midColumn() ?? null" />
        </div>
        @if (endSeparator(); as direction) {
            <div [class]="separatorClass()" (click)="onEndSeparator()">
                <button
                    fdButton
                    variant="transparent"
                    data-density="compact"
                    [glyph]="'slim-arrow-' + direction"
                    [ariaLabel]="separatorLabel(direction, collapseTitleEndBtn(), expandTitleEndBtn())"
                    [attr.title]="separatorLabel(direction, collapseTitleEndBtn(), expandTitleEndBtn())"
                    [class]="buttonClass"
                    (click)="$event.stopPropagation(); onEndSeparator()"
                ></button>
            </div>
        }
        <div
            [class]="columnClass(columns().end)"
            [style.width.%]="columns().end"
            [attr.aria-hidden]="!columns().end || null"
        >
            <ng-container [ngTemplateOutlet]="endColumn() ?? null" />
        </div>
    `
})
export class FlexibleColumnLayoutComponent {
    readonly layout = model<FlexibleColumnLayout>('OneColumnStartFullScreen');
    /** Background of the separators. */
    readonly backgroundDesign = input<'solid' | 'translucent' | 'transparent'>('solid');
    readonly layoutDefinitions = input<FlexibleColumnLayoutDefinition>(inject(FD_FLEXIBLE_LAYOUT_CONFIG).layouts);
    /** Width (of the layout) up to which one column fills the screen. */
    readonly smBreakPoint = input(960);
    /** Width up to which at most two columns are shown. */
    readonly lgBreakPoint = input(1280);
    readonly expandTitle = input('Expand');
    readonly collapseTitle = input('Collapse');
    readonly expandTitleStartBtn = input<string | null | undefined>();
    readonly collapseTitleStartBtn = input<string | null | undefined>();
    readonly expandTitleEndBtn = input<string | null | undefined>();
    readonly collapseTitleEndBtn = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly startColumn = contentChild<TemplateRef<unknown>>('startColumn');
    protected readonly midColumn = contentChild<TemplateRef<unknown>>('midColumn');
    protected readonly endColumn = contentChild<TemplateRef<unknown>>('endColumn');

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly width = signal<number | null>(null);
    /** Layout to restore when the layout collapsed to one full-screen column on a small width. */
    private restoreLayout: FlexibleColumnLayout | null = null;

    protected readonly columns = computed(() => this.layoutDefinitions()[this.layout()]);
    protected readonly screenSize = computed<ScreenSize>(() => {
        const width = this.width() ?? Number.POSITIVE_INFINITY;
        return width > this.lgBreakPoint() ? 'lg' : width > this.smBreakPoint() ? 'md' : 'sm';
    });

    protected readonly startSeparator = computed<Separator>(() => {
        switch (this.layout()) {
            case 'TwoColumnsStartExpanded':
                return 'left';
            case 'TwoColumnsMidExpanded':
            case 'ThreeColumnsMidExpanded':
            case 'ThreeColumnsEndMinimized':
            case 'ThreeColumnsStartMinimized':
                return 'right';
            default:
                return null;
        }
    });

    protected readonly endSeparator = computed<Separator>(() => {
        switch (this.layout()) {
            case 'TwoColumnsEndExpanded':
            case 'ThreeColumnsEndExpanded':
                return 'right';
            case 'ThreeColumnsMidExpanded':
            case 'ThreeColumnsEndMinimized':
            case 'ThreeColumnsStartMinimized':
                return 'left';
            default:
                return null;
        }
    });

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const observer = new ResizeObserver(() => this.width.set(this.host.clientWidth));
            observer.observe(this.host);
            destroyRef.onDestroy(() => observer.disconnect());
        });
        effect(() => {
            const layout = this.layout();
            const size = this.screenSize();
            if (this.width() === null) return;
            untracked(() => this.adapt(layout, size));
        });
    }

    protected onStartSeparator(): void {
        const next = START_SEPARATOR_NEXT[this.layout()];
        if (next) this.layout.set(next);
    }

    protected onEndSeparator(): void {
        const next = END_SEPARATOR_NEXT[this.layout()];
        if (next) this.layout.set(next);
    }

    protected separatorLabel(direction: 'left' | 'right', collapse?: string | null, expand?: string | null): string {
        return direction === 'left' ? (collapse ?? this.collapseTitle()) : (expand ?? this.expandTitle());
    }

    /** Shows fewer columns on smaller widths and restores the layout when there is room again. */
    private adapt(layout: FlexibleColumnLayout, size: ScreenSize): void {
        const fullScreen = (target: FlexibleColumnLayout): void => {
            this.restoreLayout = layout;
            this.layout.set(target);
        };
        switch (layout) {
            case 'OneColumnMidFullScreen':
            case 'OneColumnEndFullScreen':
                if (size !== 'sm' && this.restoreLayout) {
                    const restore = this.restoreLayout;
                    this.restoreLayout = null;
                    this.layout.set(restore);
                }
                return;
            case 'TwoColumnsStartExpanded':
            case 'TwoColumnsMidExpanded':
                if (size === 'sm') fullScreen('OneColumnMidFullScreen');
                break;
            case 'TwoColumnsEndExpanded':
                if (size === 'sm') fullScreen('OneColumnEndFullScreen');
                else if (size === 'lg') this.layout.set('ThreeColumnsEndExpanded');
                break;
            case 'ThreeColumnsStartMinimized':
                if (size === 'sm') fullScreen('OneColumnEndFullScreen');
                else if (size === 'lg') this.layout.set('ThreeColumnsMidExpanded');
                break;
            case 'ThreeColumnsEndMinimized':
                if (size === 'sm') fullScreen('OneColumnEndFullScreen');
                break;
            case 'ThreeColumnsMidExpanded':
                if (size === 'sm') fullScreen('OneColumnEndFullScreen');
                else if (size === 'md') this.layout.set('ThreeColumnsStartMinimized');
                break;
            case 'ThreeColumnsEndExpanded':
                if (size === 'sm') fullScreen('OneColumnEndFullScreen');
                else if (size === 'md') this.layout.set('TwoColumnsEndExpanded');
                break;
        }
        // a layout chosen on a small width replaces the one to restore
        if (layout === this.layout() && size === 'sm') this.restoreLayout = null;
    }

    protected readonly buttonClass =
        'absolute start-1/2 top-1/2 z-2 h-8 w-6 min-w-6 -translate-1/2 justify-center p-0 rtl:translate-x-1/2';

    protected columnClass(width: number): string {
        return cn(
            'm-0 box-border min-w-0 overflow-hidden p-0 [container-type:inline-size]',
            'transition-[width,visibility] duration-[560ms] ease-[cubic-bezier(0.1,0,0.05,1)] motion-reduce:transition-none',
            'border-x border-solid border-sap-group-content-border-color first:border-s-0 last:border-e-0',
            !width && 'invisible h-0 border-0'
        );
    }

    protected readonly separatorClass = computed(() => {
        const design = this.backgroundDesign();
        return cn(
            'group/sep relative m-0 box-border flex w-4 min-w-4 shrink-0 cursor-pointer items-center justify-center p-0',
            design === 'solid' && 'bg-sap-content-foreground-color',
            design === 'translucent' && 'bg-sap-group-content-background hc:bg-sap-background-color',
            design === 'transparent' && 'bg-transparent hc:bg-sap-background-color',
            "before:absolute before:start-1/2 before:bottom-[calc(50%_+_1rem)] before:block before:h-16 before:w-px before:-translate-x-1/2 before:bg-linear-to-t before:from-sap-highlight-color before:to-transparent before:transition-all before:duration-100 before:ease-in before:content-[''] rtl:before:translate-x-1/2",
            "after:absolute after:start-1/2 after:top-[calc(50%_+_1rem)] after:block after:h-16 after:w-px after:-translate-x-1/2 after:bg-linear-to-b after:from-sap-highlight-color after:to-transparent after:transition-all after:duration-100 after:ease-in after:content-[''] rtl:after:translate-x-1/2",
            'hover:before:h-28 hover:after:h-28'
        );
    });

    protected readonly computedClass = computed(() =>
        cn('m-0 box-border flex p-0 font-sap-font-family text-sap-font-size text-sap-text-color', this.userClass())
    );
}
