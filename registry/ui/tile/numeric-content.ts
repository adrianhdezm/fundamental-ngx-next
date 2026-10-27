/*
 * Port of @fundamental-ngx/core (tile) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChangeDetectionStrategy, Component, Directive, computed, inject, input } from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { iconGlyphChar, iconVariants, type IconFont } from '@/ui/icon/icon';
import { Tile } from './tile';

export type NumericContentState = 'negative' | 'critical' | 'positive' | 'informative' | 'neutral';
export type NumericContentSize = 's' | 'm' | 'l';

const STATE_COLOR: Record<NumericContentState, string> = {
    neutral: 'text-sap-neutral-text-color',
    positive: 'text-sap-positive-text-color',
    critical: 'text-sap-critical-text-color',
    negative: 'text-sap-negative-text-color',
    informative: 'text-sap-informative-text-color'
};

/**
 * Numeric content of a KPI or launch tile: launch icon, KPI value and scale.
 *
 * ```html
 * <div fd-numeric-content>
 *     <div fd-numeric-content-kpi-container><div fd-numeric-content-kpi state="positive">12</div></div>
 *     <div fd-numeric-content-scale-container>
 *         <div fd-numeric-content-scale state="positive">
 *             <span fd-numeric-content-scale-arrow glyph="up"></span>
 *             <span fd-numeric-content-scale-text>M</span>
 *         </div>
 *     </div>
 * </div>
 * ```
 */
@Directive({
    selector: '[fd-numeric-content], [fdNumericContent]',
    host: { '[class]': 'computedClass()' }
})
export class NumericContent {
    /** l (default), m or s. */
    readonly size = input<NumericContentSize | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tile = inject(Tile, { optional: true });

    readonly resolvedSize = computed(() => this.size() ?? 'l');
    /** Inside a small tile. */
    readonly smallTile = computed(() => !!this.tile?.small());

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex w-full p-0 font-sap-font-family',
            this.smallTile() ? 'h-[2.375rem]' : { l: 'h-12', m: 'h-10', s: 'h-9' }[this.resolvedSize()],
            this.userClass()
        )
    );
}

/** Spacing shared by the launch icon and KPI containers. */
function containerClass(content: NumericContent | null): string {
    const size = content?.resolvedSize() ?? 'l';
    return cn(
        'm-0 box-border flex h-full items-center overflow-hidden p-0 [&:first-child:last-child]:m-0',
        content?.smallTile() ? 'me-1.5 pt-2' : size === 'l' ? 'me-1.5 pt-0.5' : 'me-2 pt-0'
    );
}

@Directive({
    selector: '[fd-numeric-content-launch-icon-container], [fdNumericContentLaunchIconContainer]',
    host: { '[class]': 'computedClass()' }
})
export class NumericContentLaunchIconContainer {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly content = inject(NumericContent, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            containerClass(this.content),
            this.content?.smallTile() ? 'w-6 max-w-6 min-w-6' : 'w-7 max-w-7 min-w-7',
            this.content?.resolvedSize() === 'm' && 'items-end',
            this.userClass()
        )
    );
}

@Directive({
    selector: '[fd-numeric-content-kpi-container], [fdNumericContentKpiContainer]',
    host: { '[class]': 'computedClass()' }
})
export class NumericContentKpiContainer {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly content = inject(NumericContent, { optional: true });
    protected readonly computedClass = computed(() => cn(containerClass(this.content), this.userClass()));
}

@Directive({
    selector: '[fd-numeric-content-scale-container], [fdNumericContentScaleContainer]',
    host: { '[class]': 'computedClass()' }
})
export class NumericContentScaleContainer {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly content = inject(NumericContent, { optional: true });
    protected readonly computedClass = computed(() => {
        const size = this.content?.resolvedSize() ?? 'l';
        return cn(
            'm-0 box-border flex h-full overflow-hidden p-0 [&:first-child:last-child]:m-0',
            this.content?.smallTile()
                ? size === 's'
                    ? 'pt-0 pb-1'
                    : 'py-1'
                : { l: 'pt-2 pb-1.5', m: 'pt-1.5 pb-[0.188rem]', s: 'pt-0 pb-[0.313rem]' }[size],
            this.userClass()
        );
    });
}

/** Launch icon of a launch tile. */
@Component({
    selector: '[fd-numeric-content-launch-icon], [fdNumericContentLaunchIcon]',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.data-glyph]': 'glyphChar()',
        '[class]': 'computedClass()'
    }
})
export class NumericContentLaunchIcon {
    readonly glyph = input<string>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly ariaLabel = input<string | null>(null);
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly content = inject(NumericContent, { optional: true });
    protected readonly glyphChar = computed(() => iconGlyphChar(this.glyph(), this.glyphFont()));
    protected readonly computedClass = computed(() =>
        cn(
            iconVariants({ font: this.glyphFont() }),
            'leading-[normal] text-sap-tile-icon-color',
            this.content?.smallTile() ? 'text-[1.5rem]' : 'text-[1.75rem]',
            this.userClass()
        )
    );
}

/** KPI value; with a glyph it shows an icon in the KPI style instead. */
@Component({
    selector: '[fd-numeric-content-kpi], [fdNumericContentKpi]',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.data-glyph]': 'glyphChar() || null',
        '[class]': 'computedClass()'
    }
})
export class NumericContentKpi {
    readonly state = input<NumericContentState | null | undefined>();
    readonly glyph = input<string>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly content = inject(NumericContent, { optional: true });
    protected readonly glyphChar = computed(() => iconGlyphChar(this.glyph(), this.glyphFont()));
    protected readonly computedClass = computed(() =>
        cn(
            this.glyphChar() && iconVariants({ font: this.glyphFont() }),
            'm-0 p-0 font-sap-font-family leading-[normal] font-light',
            STATE_COLOR[this.state() ?? 'neutral'],
            this.content?.smallTile()
                ? 'text-[1.5rem] rtl:text-right rtl:[direction:ltr]'
                : { l: 'text-[2.25rem]', m: 'text-[2rem]', s: 'text-[1.75rem]' }[this.content?.resolvedSize() ?? 'l'],
            this.userClass()
        )
    );
}

/** Scale (unit and trend arrow) next to the KPI value. */
@Directive({
    selector: '[fd-numeric-content-scale], [fdNumericContentScale]',
    host: { '[class]': 'computedClass()' }
})
export class NumericContentScale {
    readonly state = input<NumericContentState | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex flex-col items-center justify-between p-0',
            STATE_COLOR[this.state() ?? 'neutral'],
            this.userClass()
        )
    );
}

@Component({
    selector: '[fd-numeric-content-scale-arrow], [fdNumericContentScaleArrow]',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.role]': 'ariaLabel() ? "img" : null',
        '[attr.aria-hidden]': 'ariaLabel() ? null : true',
        '[attr.data-glyph]': 'glyphChar()',
        '[class]': 'computedClass()'
    }
})
export class NumericContentScaleArrow {
    readonly glyph = input<string>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly ariaLabel = input<string | null>(null);
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly glyphChar = computed(() => iconGlyphChar(this.glyph(), this.glyphFont()));
    protected readonly computedClass = computed(() =>
        cn(iconVariants({ font: this.glyphFont() }), 'text-[0.875rem] leading-[normal]', this.userClass())
    );
}

@Directive({
    selector: '[fd-numeric-content-scale-text], [fdNumericContentScaleText]',
    host: { '[class]': 'computedClass()' }
})
export class NumericContentScaleText {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() => cn('m-0 p-0 text-[0.875rem] leading-[normal]', this.userClass()));
}
