import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    TemplateRef,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    effect,
    inject,
    input,
    model,
    numberAttribute,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';

export type DynamicPageBackgroundType = 'solid' | 'list' | 'transparent';
export type DynamicPageResponsiveSize = 'small' | 'medium' | 'large' | 'extra-large';

/** Width below which the layout actions move up next to the breadcrumb. */
const ACTIONS_SQUASH_WIDTH = 1280;

export function dynamicPageWidthToSize(width: number): DynamicPageResponsiveSize {
    return width <= 599 ? 'small' : width <= 1023 ? 'medium' : width <= 1439 ? 'large' : 'extra-large';
}

/** Horizontal page padding per size. */
const PADDING: Record<DynamicPageResponsiveSize, string> = {
    small: '[--dp-px:1rem]',
    medium: '[--dp-px:2rem]',
    large: '[--dp-px:2rem]',
    'extra-large': '[--dp-px:3rem]'
};

let nextId = 0;

/** Context of the title and subtitle templates: whether the header is collapsed. */
export interface DynamicPageTitleContext {
    $implicit: boolean;
}

/** Custom title: `<ng-template fdDynamicPageHeaderTitle let-collapsed>`. */
@Directive({ selector: '[fdDynamicPageHeaderTitle]' })
export class DynamicPageHeaderTitle {
    readonly templateRef = inject<TemplateRef<DynamicPageTitleContext>>(TemplateRef);
    static ngTemplateContextGuard(_dir: DynamicPageHeaderTitle, ctx: unknown): ctx is DynamicPageTitleContext {
        return true;
    }
}

/** Custom subtitle: `<ng-template fdDynamicPageHeaderSubtitle let-collapsed>`. */
@Directive({ selector: '[fdDynamicPageHeaderSubtitle]' })
export class DynamicPageHeaderSubtitle {
    readonly templateRef = inject<TemplateRef<DynamicPageTitleContext>>(TemplateRef);
    static ngTemplateContextGuard(_dir: DynamicPageHeaderSubtitle, ctx: unknown): ctx is DynamicPageTitleContext {
        return true;
    }
}

/** Breadcrumb above the title. */
@Component({
    selector: 'fd-dynamic-page-breadcrumb',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' }
})
export class DynamicPageBreadcrumb {}

/** Global (business) actions next to the title. */
@Component({
    selector: 'fd-dynamic-page-global-actions',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { role: 'toolbar', '[attr.aria-label]': 'ariaLabel()', '[class]': 'computedClass()' }
})
export class DynamicPageGlobalActions {
    readonly ariaLabel = input<string | null | undefined>('Global actions');
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly page = inject(forwardPage(), { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex items-center gap-2 py-0 ps-4 pe-1',
            this.page?.size() === 'medium' && 'p-0',
            this.userClass()
        )
    );
}

/** Layout actions (e.g. full screen, close) at the end of the title row. */
@Component({
    selector: 'fd-dynamic-page-layout-actions',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { role: 'toolbar', '[attr.aria-label]': 'ariaLabel()', '[class]': 'computedClass()' }
})
export class DynamicPageLayoutActions {
    readonly ariaLabel = input<string | null | undefined>('Layout actions');
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn('m-0 ms-auto box-border flex items-center gap-1 p-0', this.userClass())
    );
}

/** Key information next to the title. */
@Component({
    selector: 'fd-dynamic-page-title-content',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' }
})
export class DynamicPageTitleContent {
    readonly titleContentWrap = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border block min-w-0 py-0 ps-4 align-baseline',
            this.titleContentWrap() ? 'whitespace-normal' : 'truncate',
            this.userClass()
        )
    );
}

/**
 * Title area of a dynamic page: breadcrumb, title, key information, actions, subtitle and an
 * optional message strip. Clicking it collapses or expands the header.
 */
@Component({
    selector: 'fd-dynamic-page-header',
    imports: [NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()', '(click)': 'onClick($event)' },
    template: `
        <div class="m-0 flex justify-between p-0">
            <div class="m-0 min-w-0 flex-1 p-0">
                @if (breadcrumb() || squashed()) {
                    <div class="m-0 flex items-center justify-between p-0">
                        @if (breadcrumb()) {
                            <nav
                                [attr.aria-label]="breadcrumbsLabel()"
                                [class]="small() ? 'w-full max-w-[60%]' : 'w-full max-w-[60%] pt-2 pb-1'"
                                (click)="$event.stopPropagation()"
                            >
                                <ng-content select="fd-dynamic-page-breadcrumb" />
                            </nav>
                        }
                        @if (squashed()) {
                            <ng-container [ngTemplateOutlet]="layoutActions" />
                        }
                    </div>
                }
                <div class="m-0 flex items-center p-0 pt-[0.3125rem]">
                    @if (page?.collapsed()) {
                        <ng-content select="fd-facet" />
                    }
                    <div class="m-0 flex min-w-0 flex-1 flex-col p-0">
                        <div class="m-0 flex items-center p-0 pt-[0.3125rem]">
                            <span
                                role="heading"
                                [attr.aria-level]="headingLevel()"
                                [id]="titleId()"
                                [class]="titleClass()"
                            >
                                <ng-container
                                    [ngTemplateOutlet]="titleTemplate()?.templateRef ?? defaultTitle"
                                    [ngTemplateOutletContext]="{ $implicit: !!page?.collapsed() }"
                                />
                            </span>
                            <ng-content select="fd-dynamic-page-title-content" />
                            <div class="m-0 ms-auto flex items-center p-0" (click)="$event.stopPropagation()">
                                <ng-content select="fd-dynamic-page-global-actions" />
                                @if (!squashed()) {
                                    <ng-container [ngTemplateOutlet]="layoutActions" />
                                }
                            </div>
                        </div>
                        @if (page?.collapsed() && hasSubtitle()) {
                            <ng-container [ngTemplateOutlet]="subtitleRef" />
                        }
                    </div>
                </div>
            </div>
        </div>
        @if (!page?.collapsed() && hasSubtitle()) {
            <ng-container [ngTemplateOutlet]="subtitleRef" />
        }
        <div class="mt-4 mb-2 empty:hidden" (click)="$event.stopPropagation()">
            <ng-content select="fd-message-strip, [fd-message-strip]" />
        </div>
        <ng-template #layoutActions><ng-content select="fd-dynamic-page-layout-actions" /></ng-template>
        <ng-template #subtitleRef>
            <span
                [attr.role]="subtitleHeadingLevel() ? 'heading' : null"
                [attr.aria-level]="subtitleHeadingLevel()"
                [class]="
                    'm-0 mt-1 p-0 text-sap-font-size text-sap-object-header-subtitle-text-color ' +
                    (subtitleWrap() ? 'whitespace-normal' : 'truncate')
                "
            >
                <ng-container
                    [ngTemplateOutlet]="subtitleTemplate()?.templateRef ?? defaultSubtitle"
                    [ngTemplateOutletContext]="{ $implicit: !!page?.collapsed() }"
                />
            </span>
        </ng-template>
        <ng-template #defaultTitle>{{ title() }}</ng-template>
        <ng-template #defaultSubtitle>{{ subtitle() }}</ng-template>
    `
})
export class DynamicPageHeader {
    readonly title = input('');
    readonly titleWrap = input(false, { transform: booleanAttribute });
    readonly subtitle = input('');
    readonly subtitleWrap = input(false, { transform: booleanAttribute });
    readonly headingLevel = input(2, { transform: (v: unknown) => numberAttribute(String(v).replace(/\D/g, ''), 2) });
    readonly subtitleHeadingLevel = input<number | null | undefined>();
    readonly titleId = input(`fd-dynamic-page-title-${nextId++}`);
    readonly breadcrumbsLabel = input('Breadcrumbs');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly page = inject(forwardPage(), { optional: true });
    protected readonly breadcrumb = contentChild(DynamicPageBreadcrumb);
    protected readonly titleTemplate = contentChild(DynamicPageHeaderTitle);
    protected readonly subtitleTemplate = contentChild(DynamicPageHeaderSubtitle);

    protected readonly small = computed(() => this.page?.size() === 'small');
    protected readonly squashed = computed(() => (this.page?.width() ?? Infinity) < ACTIONS_SQUASH_WIDTH);
    protected readonly hasSubtitle = computed(() => !!this.subtitle() || !!this.subtitleTemplate());

    protected onClick(event: MouseEvent): void {
        // keep text selections
        if (window.getSelection()?.toString()) return;
        if ((event.target as HTMLElement).closest('a, button, input, select, textarea, [role=button]')) return;
        this.page?.toggleCollapse();
    }

    protected readonly titleClass = computed(() =>
        cn(
            'm-0 min-w-0 p-0 font-sap-object-header-title-font-family text-sap-object-header-title-text-color',
            this.page?.collapsed()
                ? 'text-sap-object-header-title-snapped-font-size'
                : 'text-sap-object-header-title-font-size',
            this.titleWrap() ? 'whitespace-normal' : 'truncate'
        )
    );

    protected readonly computedClass = computed(() => {
        const page = this.page;
        return cn(
            'relative z-1 m-0 box-border flex min-h-12 flex-col justify-between bg-sap-object-header-background px-(--dp-px) py-2 [overflow-wrap:break-word]',
            'peer-focus-visible:outline-sap peer-focus-visible:-outline-offset-4',
            page?.collapsible() &&
                'cursor-pointer hover:bg-sap-object-header-hover-background hc:hover:border-b hc:hover:border-solid hc:hover:border-sap-object-header-border-color',
            page?.collapsed() && 'pb-4',
            page?.background() === 'transparent' && 'bg-transparent hc:bg-sap-object-header-background',
            this.userClass()
        );
    });
}

/**
 * Collapsible header content (e.g. facets) below the title, with the collapse and pin buttons.
 */
@Component({
    selector: 'fd-dynamic-page-subheader',
    imports: [Button],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.id]': 'id()', class: 'block' },
    template: `
        <section
            [id]="id() + '-content'"
            [attr.aria-label]="headerAriaLabel()"
            [class]="contentClass()"
            [hidden]="page?.collapsed()"
        >
            <ng-content />
        </section>
        @if (collapsible()) {
            <div [class]="visibilityClass()">
                <div
                    class="h-px w-16 bg-linear-to-l from-sap-object-header-border-color to-transparent rtl:bg-linear-to-r"
                ></div>
                <div
                    role="toolbar"
                    [attr.aria-label]="toolbarAriaLabel()"
                    class="relative z-1 m-0 flex h-px w-[4.25rem] items-center justify-center bg-sap-object-header-border-color p-0"
                >
                    <button
                        fdButton
                        [glyph]="page?.collapsed() ? 'slim-arrow-down' : 'slim-arrow-up'"
                        [ariaLabel]="page?.collapsed() ? expandLabel() : collapseLabel()"
                        [attr.title]="page?.collapsed() ? expandLabel() : collapseLabel()"
                        [attr.aria-expanded]="!page?.collapsed()"
                        [attr.aria-controls]="id() + '-content'"
                        [class]="buttonClass"
                        (click)="toggleCollapse()"
                    ></button>
                    @if (pinnable() && !page?.collapsed()) {
                        <button
                            fdButton
                            glyph="pushpin-off"
                            [toggled]="pinned()"
                            [ariaLabel]="pinned() ? unpinAriaLabel() : pinAriaLabel()"
                            [attr.title]="pinned() ? unpinAriaLabel() : pinAriaLabel()"
                            [class]="buttonClass"
                            (click)="togglePinned()"
                        ></button>
                    }
                </div>
                <div
                    class="h-px w-16 bg-linear-to-r from-sap-object-header-border-color to-transparent rtl:bg-linear-to-l"
                ></div>
            </div>
        }
    `
})
export class DynamicPageSubheader {
    readonly id = input(`fd-dynamic-page-header-${nextId++}`);
    readonly collapsible = input(true, { transform: booleanAttribute });
    /** A pinned header stays expanded while the content scrolls. */
    readonly pinnable = input(false, { transform: booleanAttribute });
    readonly collapsed = model(false);
    readonly expandLabel = input('Expand Header');
    readonly collapseLabel = input('Collapse Header');
    readonly pinAriaLabel = input('Pin Header');
    readonly unpinAriaLabel = input('Unpin Header');
    readonly headerAriaLabel = input<string | null | undefined>('Expanded Header');
    readonly toolbarAriaLabel = input('Header actions');

    protected readonly page = inject(forwardPage(), { optional: true });
    readonly pinned = signal(false);

    constructor() {
        // the input sets the state of the page; changes of the page update the model
        effect(() => {
            const collapsed = this.collapsed();
            untracked(() => this.page?.collapsed.set(collapsed));
        });
        effect(() => {
            const collapsed = this.page?.collapsed() ?? false;
            untracked(() => {
                if (collapsed !== this.collapsed()) this.collapsed.set(collapsed);
            });
        });
    }

    toggleCollapse(): void {
        this.pinned.set(false);
        this.collapsed.set(!this.collapsed());
    }

    togglePinned(): void {
        this.pinned.update((pinned) => !pinned);
    }

    protected readonly buttonClass =
        "relative mx-1 my-0 h-6 w-6 min-w-6 p-0 before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']";

    protected readonly contentClass = computed(() =>
        cn(
            'm-0 box-border block bg-sap-object-header-background px-(--dp-px) py-4 empty:p-0',
            this.page?.background() === 'transparent' && 'bg-transparent hc:bg-sap-object-header-background'
        )
    );

    protected readonly visibilityClass = computed(() =>
        cn(
            'relative z-2 m-0 flex min-h-px items-center justify-center bg-sap-object-header-background p-0',
            !this.page?.hasTabs() && 'shadow-sap-content-header-shadow'
        )
    );
}

/**
 * Content of a dynamic page; it scrolls (and is focusable for keyboard scrolling), and scrolling collapses the header (unless pinned or
 * disableSnapOnScroll is set).
 */
@Component({
    selector: 'fd-dynamic-page-content',
    template: `
        <ng-content />
        @if (page?.footer()) {
            <div class="h-12" aria-hidden="true"></div>
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        tabindex: '0',
        '[attr.id]': 'id()',
        '[class]': 'computedClass()',
        '(scroll)': 'onScroll()'
    }
})
export class DynamicPageContent {
    readonly id = input<string | null | undefined>();
    /** Label of the tab when the page has tabs. */
    readonly tabLabel = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    protected readonly page = inject(forwardPage(), { optional: true });

    protected onScroll(): void {
        this.page?.contentScrolled(this.elementRef.nativeElement.scrollTop);
    }

    protected readonly computedClass = computed(() => {
        const background = this.page?.background();
        return cn(
            'm-0 box-border block h-full flex-1 overflow-y-auto bg-sap-background-color px-(--dp-px) py-4 scrollbar-sap',
            'outline-none focus-visible:outline-sap focus-visible:-outline-offset-2',
            background === 'list' && 'bg-sap-group-content-background hc:bg-sap-background-color',
            background === 'transparent' && 'bg-transparent hc:bg-sap-background-color',
            this.userClass()
        );
    });
}

/** Floating footer offsets per page size. */
const FOOTER_OFFSET: Record<DynamicPageResponsiveSize, string> = {
    small: '[&_[data-bar-design=floating-footer]]:inset-x-2',
    medium: '[&_[data-bar-design=floating-footer]]:inset-x-8',
    large: '[&_[data-bar-design=floating-footer]]:inset-x-8',
    'extra-large': '[&_[data-bar-design=floating-footer]]:inset-x-12'
};

/** Footer of a dynamic page, e.g. a floating footer bar (offsets follow the page size). */
@Component({
    selector: 'fd-dynamic-page-footer',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' }
})
export class DynamicPageFooter {
    private readonly page = inject(forwardPage(), { optional: true });
    protected readonly computedClass = computed(() =>
        cn('block [&_[data-bar-design=floating-footer]]:bottom-4', FOOTER_OFFSET[this.page?.size() ?? 'extra-large'])
    );
}

/** Tabs (or another navigation) between the header and the content. */
@Directive({
    selector: '[fd-dynamic-page-tabs], [fdDynamicPageTabs]',
    host: { class: 'relative z-1 block px-(--dp-px) shadow-sap-content-header-shadow bg-sap-object-header-background' }
})
export class DynamicPageTabs {}

/** Late reference to DynamicPage for the parts declared before it. */
function forwardPage(): typeof DynamicPage {
    return DynamicPage;
}

/**
 * Dynamic page: a page with a title area, a collapsible header, the content and an optional
 * footer. The header collapses on click or when the content scrolls; paddings adapt to the width.
 *
 * ```html
 * <fd-dynamic-page ariaLabel="Product">
 *     <fd-dynamic-page-header title="Product" subtitle="Details" />
 *     <fd-dynamic-page-subheader>Header content</fd-dynamic-page-subheader>
 *     <fd-dynamic-page-content>Content</fd-dynamic-page-content>
 * </fd-dynamic-page>
 * ```
 */
@Component({
    selector: 'fd-dynamic-page',
    exportAs: 'fdDynamicPage',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block h-full' },
    template: `
        <article
            #article
            [class]="articleClass()"
            [style.height]="height()"
            [attr.aria-label]="ariaLabel()"
            [attr.aria-roledescription]="ariaRoledescription()"
        >
            <header [class]="headerClass()">
                <div class="relative">
                    @if (collapsible()) {
                        <span
                            role="button"
                            tabindex="0"
                            class="peer sr-only-sap"
                            [attr.aria-expanded]="!collapsed()"
                            [attr.aria-label]="toggleHeaderLabel()"
                            [attr.aria-describedby]="header()?.titleId()"
                            (click)="toggleCollapse()"
                            (keydown.enter)="toggleCollapse()"
                            (keydown.space)="$event.preventDefault(); toggleCollapse()"
                        ></span>
                    }
                    <ng-content select="fd-dynamic-page-header" />
                </div>
                <ng-content select="fd-dynamic-page-subheader" />
            </header>
            <ng-content select="[fd-dynamic-page-tabs], [fdDynamicPageTabs], fd-tab-list" />
            <ng-content select="fd-dynamic-page-content" />
            <footer>
                <ng-content select="fd-dynamic-page-footer" />
            </footer>
        </article>
    `
})
export class DynamicPage {
    /** Keeps the header expanded while the content scrolls. */
    readonly disableSnapOnScroll = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaRoledescription = input('Dynamic Page');
    readonly background = input<DynamicPageBackgroundType>('solid');
    /** Size from the width of the page; when false, size applies. */
    readonly autoResponsive = input(true, { transform: booleanAttribute });
    readonly sizeInput = input<DynamicPageResponsiveSize>('extra-large', { alias: 'size' });
    /** Pixels subtracted from the full-screen height (expandContent). */
    readonly offset = input(0);
    /** Fills the viewport below the top of the page. */
    readonly expandContent = input(true, { transform: booleanAttribute });
    /** Positions the page (e.g. for a floating footer) relative to itself. */
    readonly positionRelative = input(false, { transform: booleanAttribute });
    readonly toggleHeaderLabel = input('Toggle Header');

    readonly collapsed = signal(false);
    readonly width = signal<number | null>(null);
    readonly size = computed<DynamicPageResponsiveSize>(() => {
        const width = this.width();
        return !this.autoResponsive() || width === null ? this.sizeInput() : dynamicPageWidthToSize(width);
    });

    protected readonly header = contentChild(DynamicPageHeader);
    private readonly subheader = contentChild(DynamicPageSubheader);
    private readonly tabs = contentChild(DynamicPageTabs);
    readonly footer = contentChild(DynamicPageFooter);
    private readonly contents = contentChildren(DynamicPageContent, { descendants: true });
    private readonly article = viewChild.required<ElementRef<HTMLElement>>('article');
    protected readonly height = signal<string | null>(null);

    readonly collapsible = computed(() => this.subheader()?.collapsible() ?? false);
    readonly hasTabs = computed(() => !!this.tabs());

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const article = this.article().nativeElement;
            const update = (): void => {
                this.width.set(article.getBoundingClientRect().width);
                this.updateHeight();
            };
            const observer = new ResizeObserver(update);
            observer.observe(article);
            window.addEventListener('resize', update);
            destroyRef.onDestroy(() => {
                observer.disconnect();
                window.removeEventListener('resize', update);
            });
            update();
        });
    }

    toggleCollapse(): void {
        if (!this.collapsible()) return;
        this.subheader()?.pinned.set(false);
        this.collapsed.update((collapsed) => !collapsed);
    }

    /** Recomputes the size and height, e.g. after the page moved. */
    refreshSize(): void {
        this.width.set(this.article().nativeElement.getBoundingClientRect().width);
        this.updateHeight();
    }

    /** The scroll element of the first content. */
    scrollElement(): HTMLElement | null {
        return this.contents()[0]?.elementRef.nativeElement ?? null;
    }

    contentScrolled(scrollTop: number): void {
        if (this.disableSnapOnScroll() || !this.collapsible()) return;
        if (this.subheader()?.pinned()) {
            this.collapsed.set(false);
            return;
        }
        this.collapsed.set(scrollTop > 0);
    }

    private updateHeight(): void {
        if (!this.expandContent()) {
            this.height.set(null);
            return;
        }
        const top = this.article().nativeElement.getBoundingClientRect().top;
        this.height.set(`calc(100svh - ${top + this.offset()}px)`);
    }

    protected readonly headerClass = computed(() =>
        cn(
            'relative z-15 m-0 flex flex-col justify-between p-0',
            !this.collapsible() && !this.hasTabs() && 'shadow-sap-content-header-shadow'
        )
    );

    protected readonly articleClass = computed(() =>
        cn(
            'm-0 box-border flex h-full flex-col p-0 font-sap-font-family text-sap-font-size text-sap-text-color',
            PADDING[this.size()],
            this.positionRelative() && 'relative'
        )
    );
}
