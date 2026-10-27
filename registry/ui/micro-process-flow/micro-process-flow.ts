/*
 * Port of @fundamental-ngx/core (micro-process-flow) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    Injector,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    effect,
    inject,
    input,
    numberAttribute,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon, type IconFont } from '@/ui/icon/icon';

export type MicroProcessFlowItemType = 'positive' | 'critical' | 'negative' | 'information' | 'none';

/** Late reference to MicroProcessFlow for the parts declared before it. */
function forwardFlow(): typeof MicroProcessFlow {
    return MicroProcessFlow;
}

/**
 * The element of a step that takes the focus, usually the `fd-micro-process-flow-icon`. Only the
 * steps in view are in the tab order, and the flow is one tab stop: Left and Right move between
 * the steps.
 */
@Directive({
    selector: '[fdMicroProcessFlowFocusableItem], [fd-micro-process-flow-focusable-item]',
    host: {
        class: 'focus:z-5 focus:outline-sap focus:outline-offset-[0.0625rem]'
    }
})
export class MicroProcessFlowFocusableItem {
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly flow = inject(forwardFlow(), { optional: true });
    /** In the tab order. */
    readonly focusable = signal(false);

    constructor() {
        // set imperatively so the host of e.g. a status indicator keeps its own bindings
        effect(() => this.element.setAttribute('tabindex', this.focusable() ? '0' : '-1'));
    }

    focus(options?: FocusOptions): void {
        this.element.focus(options);
        this.flow?.focusedItem.set(this);
    }
}

/** An object between two steps, e.g. an icon on the connector. */
@Directive({
    selector: '[fdMicroProcessFlowIntermediaryItem], [fd-micro-process-flow-intermediary-item]',
    host: { class: 'relative z-3 leading-none' }
})
export class MicroProcessFlowIntermediaryItem {}

/** Colours of a step per state: background, border, their hover values and the icon colour. */
const STATES: Record<MicroProcessFlowItemType, string> = {
    none: '[--mpf-bg:var(--sapNeutralBackground)] [--mpf-border:var(--sapNeutralBorderColor)] [--mpf-hover-bg:var(--mpf-bg)] [--mpf-hover-border:var(--mpf-border)] [--mpf-icon:var(--sapButton_Neutral_Background)]',
    positive:
        '[--mpf-bg:var(--sapPositiveElementColor)] [--mpf-border:var(--sapPositiveElementColor)] [--mpf-hover-bg:var(--sapButton_Success_Hover_Background)] [--mpf-hover-border:var(--sapButton_Success_Hover_Background)] [--mpf-icon:var(--mpf-active-icon)]',
    information:
        '[--mpf-bg:var(--sapInformativeElementColor)] [--mpf-border:var(--sapInformativeElementColor)] [--mpf-hover-bg:var(--sapButton_Information_Hover_Background)] [--mpf-hover-border:var(--sapInformationBorderColor)] [--mpf-icon:var(--mpf-active-icon)] [--mpf-hover-icon:var(--sapButton_Information_Hover_TextColor)] [--mpf-active-border:var(--sapContent_Selected_ForegroundColor)]',
    negative:
        '[--mpf-bg:var(--sapNegativeElementColor)] [--mpf-border:var(--sapNegativeElementColor)] [--mpf-hover-bg:var(--sapButton_Negative_Hover_Background)] [--mpf-hover-border:var(--sapButton_Negative_Hover_Background)] [--mpf-icon:var(--mpf-active-icon)]',
    critical:
        '[--mpf-bg:var(--sapCriticalElementColor)] [--mpf-border:var(--sapCriticalElementColor)] [--mpf-hover-bg:var(--sapButton_Critical_Hover_Background)] [--mpf-hover-border:var(--sapButton_Critical_Hover_Background)] [--mpf-icon:var(--mpf-active-icon)]'
};

/**
 * A step of a micro process flow: its content (e.g. an icon or a status indicator) and the
 * connector to the next step, optionally marked as intermediate or carrying an object.
 */
@Component({
    selector: 'fd-micro-process-flow-item',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `
        <div class="m-0 box-border flex min-h-(--mpf-min) w-full min-w-(--mpf-min) items-center justify-start p-0">
            <div class="contents">
                <ng-content />
            </div>
            @if (!last()) {
                <div [class]="connectorClass()">
                    <ng-content
                        select="[fd-micro-process-flow-intermediary-item], [fdMicroProcessFlowIntermediaryItem]"
                    />
                </div>
            }
        </div>
    `
})
export class MicroProcessFlowItem {
    readonly state = input<MicroProcessFlowItemType>('none');
    /** Marks the connector to the next step as interrupted. */
    readonly intermediate = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly focusableElement = contentChild(MicroProcessFlowFocusableItem, { descendants: true });
    private readonly flow = inject(forwardFlow(), { optional: true });
    protected readonly last = computed(() => this.flow?.items().at(-1) === this);

    protected readonly computedClass = computed(() =>
        cn(
            'relative m-0 my-[calc(var(--sapContent_FocusWidth)*2)] box-border flex items-stretch justify-start p-0 ps-[0.1875rem]',
            'font-sap-font-family text-sap-font-size text-sap-text-color',
            STATES[this.state()] ?? STATES.none,
            this.userClass()
        )
    );

    protected readonly connectorClass = computed(() =>
        cn(
            'relative m-0 ms-[0.1875rem] box-border flex h-full min-w-(--mpf-connector) grow items-center justify-center p-0',
            "before:absolute before:z-1 before:block before:w-full before:border-0 before:border-b before:border-solid before:border-sap-content-foreground-border-color before:content-['']",
            this.flow?.independentSteps() && 'before:border-transparent',
            this.intermediate() &&
                "after:absolute after:inset-y-0 after:start-1/2 after:z-2 after:-ms-0.5 after:block after:w-1 after:bg-sap-negative-element-color after:content-['']"
        )
    );
}

/** The round icon of a step; colours follow the state of its step. */
@Component({
    selector: 'fd-micro-process-flow-icon',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `
        @if (glyph(); as glyph) {
            <fd-icon
                [glyph]="glyph"
                [font]="font()"
                [ariaLabel]="ariaLabel()"
                class="text-(length:--mpf-icon-size) text-(--mpf-icon) group-hover/mpf-icon:text-(--mpf-hover-icon,var(--mpf-icon)) group-active/mpf-icon:text-(--mpf-active-icon)"
            />
        }
    `
})
export class MicroProcessFlowIcon {
    readonly glyph = input<string | null | undefined>();
    readonly font = input<IconFont>('SAP-icons');
    readonly ariaLabel = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly computedClass = computed(() =>
        cn(
            'group/mpf-icon m-0 box-border flex min-h-(--mpf-min) min-w-(--mpf-min) items-center justify-center rounded-full border border-solid border-(--mpf-border) bg-(--mpf-bg) p-0',
            'hover:border-(--mpf-hover-border) hover:bg-(--mpf-hover-bg)',
            'active:border-(--mpf-active-border,var(--sapHighlightColor)) active:bg-sap-highlight-color',
            this.userClass()
        )
    );
}

const LINK_ICON = 'text-sap-button-text-color group-hover/mpf-link:text-sap-button-hover-text-color';

/**
 * Micro process flow: a compact row of process steps joined by connectors. Steps that do not fit
 * are reached with the "previous" and "next" links at the ends, which show how many steps are
 * hidden.
 *
 * ```html
 * <fd-micro-process-flow>
 *     <fd-micro-process-flow-item state="positive">
 *         <fd-micro-process-flow-icon fd-micro-process-flow-focusable-item glyph="pending" ariaLabel="Pending" />
 *     </fd-micro-process-flow-item>
 * </fd-micro-process-flow>
 * ```
 */
@Component({
    selector: 'fd-micro-process-flow',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '(keydown)': 'onKeydown($event)',
        '(focusin)': 'onFocusin($event)',
        '(focusout)': 'onFocusout($event)'
    },
    template: `
        @if (offset() > 0) {
            <span
                role="button"
                tabindex="0"
                [attr.aria-label]="offset() + ' ' + previousLabel()"
                [class]="linkClass"
                (click)="goBack()"
                (keydown.enter)="$event.preventDefault(); goBack()"
                (keydown.space)="$event.preventDefault(); goBack()"
            >
                <fd-icon glyph="navigation-left-arrow" class="${LINK_ICON}" />{{ offset() }}
            </span>
        }
        <div #container class="m-0 box-border flex w-full overflow-hidden p-0">
            <div
                #wrapper
                class="m-0 box-border flex p-0 transition-transform"
                [style.transition-duration.ms]="transitionSpeed()"
                [style.transition-timing-function]="transitionTimingFunction()"
                [style.transform]="transform()"
            >
                <ng-content select="fd-micro-process-flow-item" />
            </div>
        </div>
        @if (nextCount() > 0) {
            <span
                role="button"
                tabindex="0"
                [attr.aria-label]="nextCount() + ' ' + nextLabel()"
                [class]="linkClass + ' justify-end'"
                (click)="goNext()"
                (keydown.enter)="$event.preventDefault(); goNext()"
                (keydown.space)="$event.preventDefault(); goNext()"
            >
                {{ nextCount() }}<fd-icon glyph="navigation-right-arrow" class="${LINK_ICON}" />
            </span>
        }
    `
})
export class MicroProcessFlow {
    /** Steps without connecting lines. */
    readonly independentSteps = input(false, { transform: booleanAttribute });
    /** Duration of the scrolling in milliseconds. */
    readonly transitionSpeed = input(300, { transform: numberAttribute });
    readonly transitionTimingFunction = input('ease');
    readonly previousLabel = input('previous steps');
    readonly nextLabel = input('next steps');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly items = contentChildren(MicroProcessFlowItem);
    private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly injector = inject(Injector);

    /** Number of steps scrolled out at the start. */
    readonly offset = signal(0);
    /** The step that has (or last had) the focus. */
    readonly focusedItem = signal<MicroProcessFlowFocusableItem | null>(null);
    private readonly focusWithin = signal(false);
    /** Widths of the steps, measured after rendering. */
    private readonly widths = signal<number[]>([]);
    private readonly containerWidth = signal(0);

    protected readonly transform = computed(() => {
        const shift = this.widths()
            .slice(0, this.offset())
            .reduce((sum, width) => sum + width, 0);
        return shift ? `translateX(calc(${shift}px * var(--mpf-direction)))` : null;
    });

    /** Number of steps that fit from the first step in view. */
    private readonly visibleCount = computed(() => {
        const available = this.containerWidth();
        let used = 0;
        let count = 0;
        for (const width of this.widths().slice(this.offset())) {
            if (used + width > available + 0.5) break;
            used += width;
            count++;
        }
        return count;
    });

    /** Number of steps hidden at the end. */
    readonly nextCount = computed(() =>
        this.containerWidth() ? Math.max(0, this.items().length - this.offset() - Math.max(1, this.visibleCount())) : 0
    );

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const observer = new ResizeObserver(() => this.measure());
            observer.observe(this.container().nativeElement);
            destroyRef.onDestroy(() => observer.disconnect());
            this.measure();
        });
        // new steps: measure them and start at the first
        effect(() => {
            this.items();
            untracked(() => {
                this.offset.set(0);
                afterNextRender(() => this.measure(), { injector: this.injector });
            });
        });
        // steps in view are in the tab order, unless the focus is already in the flow
        effect(() => {
            const items = this.items();
            const first = this.offset();
            const last = first + this.visibleCount();
            const inside = this.focusWithin();
            items.forEach((item, index) =>
                item.focusableElement()?.focusable.set(!inside && index >= first && index < last)
            );
        });
    }

    goNext(): void {
        this.scrollTo(this.offset() + 1);
    }

    goBack(): void {
        this.scrollTo(this.offset() - 1);
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        const items = this.items();
        const focused = items.findIndex((item) => item.focusableElement()?.element === document.activeElement);
        if (focused < 0) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const rtl = getComputedStyle(this.host).direction === 'rtl';
        const target = focused + ((event.key === 'ArrowRight') !== rtl ? 1 : -1);
        if (target < 0 || target >= items.length) return;
        // scroll as little as needed to bring the step into view
        if (target < this.offset()) this.scrollTo(target);
        else if (target >= this.offset() + this.visibleCount()) this.scrollTo(this.offset() + 1);
        items[target].focusableElement()?.focus({ preventScroll: true });
    }

    protected onFocusin(event: FocusEvent): void {
        const target = event.target as HTMLElement;
        const item = this.items().find((i) => i.focusableElement()?.element === target);
        this.focusWithin.set(!!item);
    }

    protected onFocusout(event: FocusEvent): void {
        const next = event.relatedTarget as HTMLElement | null;
        if (!next || !this.items().some((i) => i.focusableElement()?.element === next)) this.focusWithin.set(false);
    }

    /** Scrolls so the step at index is the first in view, as far as the remaining steps fill the row. */
    private scrollTo(index: number): void {
        const widths = this.widths();
        const max = this.maxOffset(widths);
        this.offset.set(Math.max(0, Math.min(index, max)));
    }

    /** The largest offset that still fills the row. */
    private maxOffset(widths: number[]): number {
        const available = this.containerWidth();
        let used = 0;
        for (let index = widths.length - 1; index >= 0; index--) {
            used += widths[index];
            if (used > available + 0.5) return index + 1;
        }
        return 0;
    }

    private measure(): void {
        this.widths.set(this.items().map((item) => item.element.getBoundingClientRect().width));
        this.containerWidth.set(this.container().nativeElement.getBoundingClientRect().width);
        this.offset.update((offset) => Math.min(offset, this.maxOffset(this.widths())));
    }

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex max-w-[calc(var(--mpf-item)*9+0.0625rem)] p-0 font-sap-font-family text-sap-font-size leading-(--sapContent_LineHeight) text-sap-text-color',
            '[--mpf-item:2.75rem] [--mpf-min:1.875rem] [--mpf-connector:1.125rem] [--mpf-icon-size:var(--sapFontLargeSize)] [--mpf-direction:-1] rtl:[--mpf-direction:1]',
            'compact:[--mpf-item:2rem] compact:[--mpf-min:1.375rem] compact:[--mpf-connector:0.625rem] compact:[--mpf-icon-size:var(--sapFontSmallSize)]',
            '[--mpf-active-icon:var(--sapContent_ContrastIconColor)] hc:[--mpf-active-icon:var(--sapContent_ForegroundColor)]',
            this.userClass()
        )
    );

    protected readonly linkClass =
        'group/mpf-link m-0 box-border flex shrink-0 cursor-pointer items-center gap-[0.313rem] border-0 p-0 px-[0.313rem] text-sap-font-size text-sap-group-title-text-color [text-shadow:var(--sapContent_TextShadow)] outline-none focus:outline-sap focus:-outline-offset-[0.1875rem]';
}
