/*
 * Port of @fundamental-ngx/core (layout-grid) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    booleanAttribute,
    computed,
    contentChildren,
    input,
    numberAttribute
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

/** Span of 1-12 columns. */
type Span = number | null | undefined;

const optionalNumber = (value: unknown) => (value == null || value === '' ? undefined : numberAttribute(value));
const valid = (n: Span) => (n != null && n >= 1 && n <= 12 ? n : undefined);
const validOffset = (n: Span) => (n != null && n >= 0 && n <= 12 ? n : undefined);

/** A row of columns; added automatically when the grid has no explicit rows. */
@Directive({
    selector: '[fd-layout-grid-row], [fdLayoutGridRow]',
    host: { 'data-fd-row': '', class: 'relative m-0 box-border flex min-w-full flex-[0_0_100%] flex-wrap p-0' }
})
export class LayoutGridRow {}

/**
 * A column spanning 1-12 of 12 columns, optionally different from 600px (md), 1024px (lg) and
 * 1440px (xl) on. Smaller breakpoints apply upwards until overridden.
 */
@Directive({
    selector: '[fd-layout-grid-col], [fdLayoutGridCol]',
    host: {
        'data-fd-col': '',
        '[class]': 'computedClass()',
        '[style.--fd-col]': 'spans()[0]',
        '[style.--fd-col-md]': 'spans()[1]',
        '[style.--fd-col-lg]': 'spans()[2]',
        '[style.--fd-col-xl]': 'spans()[3]',
        '[style.--fd-off]': 'offsets()[0]',
        '[style.--fd-off-md]': 'offsets()[1]',
        '[style.--fd-off-lg]': 'offsets()[2]',
        '[style.--fd-off-xl]': 'offsets()[3]'
    }
})
export class LayoutGridCol {
    /** Span below 600px (default 12). */
    readonly fdLayoutGridCol = input<Span, unknown>(undefined, { transform: optionalNumber });
    /** Takes the remaining space instead of a fixed span. */
    readonly colGrow = input(false, { transform: booleanAttribute });
    readonly colMd = input<Span, unknown>(undefined, { transform: optionalNumber });
    readonly colLg = input<Span, unknown>(undefined, { transform: optionalNumber });
    readonly colXl = input<Span, unknown>(undefined, { transform: optionalNumber });
    readonly colOffset = input<Span, unknown>(undefined, { transform: optionalNumber });
    readonly colOffsetMd = input<Span, unknown>(undefined, { transform: optionalNumber });
    readonly colOffsetLg = input<Span, unknown>(undefined, { transform: optionalNumber });
    readonly colOffsetXl = input<Span, unknown>(undefined, { transform: optionalNumber });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    /** Spans per breakpoint, inherited upwards; set on every column so nested grids do not inherit them. */
    protected readonly spans = computed(() => {
        const base = valid(this.fdLayoutGridCol()) ?? 12;
        const md = valid(this.colMd()) ?? base;
        const lg = valid(this.colLg()) ?? md;
        return [base, md, lg, valid(this.colXl()) ?? lg];
    });
    protected readonly offsets = computed(() => {
        const base = validOffset(this.colOffset()) ?? 0;
        const md = validOffset(this.colOffsetMd()) ?? base;
        const lg = validOffset(this.colOffsetLg()) ?? md;
        return [base, md, lg, validOffset(this.colOffsetXl()) ?? lg];
    });

    protected readonly computedClass = computed(() => {
        const grow = this.colGrow();
        return cn(
            'm-0 box-border px-1 py-0 min-[600px]:px-2',
            'ms-[calc(var(--fd-off)*100%/12)] min-[600px]:ms-[calc(var(--fd-off-md)*100%/12)] min-[1024px]:ms-[calc(var(--fd-off-lg)*100%/12)] min-[1440px]:ms-[calc(var(--fd-off-xl)*100%/12)]',
            grow
                ? 'min-w-[calc(100%/12)] max-w-none flex-1'
                : 'min-w-[calc(var(--fd-col)*100%/12)] max-w-[calc(var(--fd-col)*100%/12)]',
            (!grow || this.colMd()) &&
                'min-[600px]:min-w-[calc(var(--fd-col-md)*100%/12)] min-[600px]:max-w-[calc(var(--fd-col-md)*100%/12)]',
            (!grow || this.colLg()) &&
                'min-[1024px]:min-w-[calc(var(--fd-col-lg)*100%/12)] min-[1024px]:max-w-[calc(var(--fd-col-lg)*100%/12)]',
            (!grow || this.colXl()) &&
                'min-[1440px]:min-w-[calc(var(--fd-col-xl)*100%/12)] min-[1440px]:max-w-[calc(var(--fd-col-xl)*100%/12)]',
            this.userClass()
        );
    });
}

/**
 * Layout grid: a responsive 12-column grid with gutters.
 *
 * ```html
 * <fd-layout-grid>
 *     <div fdLayoutGridCol="12" colMd="6" colLg="4">...</div>
 *     <div fdLayoutGridCol="12" colMd="6" colLg="8">...</div>
 * </fd-layout-grid>
 * ```
 */
@Component({
    selector: 'fd-layout-grid, [fdLayoutGrid]',
    exportAs: 'fdLayoutGrid',
    imports: [NgTemplateOutlet, LayoutGridRow],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `
        @if (rows().length) {
            <ng-container [ngTemplateOutlet]="content" />
        } @else {
            <div fdLayoutGridRow><ng-container [ngTemplateOutlet]="content" /></div>
        }
        <ng-template #content><ng-content /></ng-template>
    `
})
export class LayoutGrid {
    readonly noGap = input(false, { transform: booleanAttribute });
    readonly noHorizontalGap = input(false, { transform: booleanAttribute });
    readonly noVerticalGap = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly rows = contentChildren(LayoutGridRow);

    protected readonly computedClass = computed(() => {
        const horizontal = !this.noGap() && !this.noHorizontalGap();
        const vertical = !this.noGap() && !this.noVerticalGap();
        return cn(
            'relative m-0 box-border flex flex-[0_0_100%] flex-wrap px-1 py-0 min-[600px]:px-2',
            horizontal
                ? [
                      '[&_[data-fd-row]]:-mx-1 [&_[data-fd-row]]:min-w-[calc(100%_+_0.5rem)]',
                      'min-[600px]:[&_[data-fd-row]]:-mx-2 min-[600px]:[&_[data-fd-row]]:min-w-[calc(100%_+_1rem)]'
                  ]
                : '[&_[data-fd-row]_[data-fd-col]]:px-0',
            vertical && '[&>[data-fd-row]>[data-fd-col]]:py-1 min-[600px]:[&>[data-fd-row]>[data-fd-col]]:py-2',
            this.userClass()
        );
    });
}
