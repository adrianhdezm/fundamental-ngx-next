/*
 * Port of @fundamental-ngx/core (skeleton) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, numberAttribute } from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

export type SkeletonType = 'rectangle' | 'circle' | 'text';

const LINE_SPACING = 20;
let nextId = 0;

/**
 * Skeleton: a shimmering placeholder in the shape of content that is still loading. Use a
 * predefined type, or project SVG shapes (`<svg:rect>`, `<svg:circle>`) to draw your own.
 *
 * ```html
 * <fd-skeleton type="circle" width="3rem" />
 * <fd-skeleton type="text" width="12rem" [textLines]="2" />
 * <fd-skeleton width="160px" height="50px"><svg:rect x="0" y="0" width="100" height="16" rx="4" /></fd-skeleton>
 * ```
 */
@Component({
    selector: 'fd-skeleton',
    exportAs: 'fdSkeleton',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[style.width]': 'dimensions().width',
        '[style.height]': 'dimensions().height'
    },
    template: `
        <svg width="100%" height="100%" aria-hidden="true" class="block">
            <defs>
                <linearGradient [attr.id]="id + '-gradient'">
                    <stop offset="0" class="[stop-color:var(--sapContent_Placeholderloading_Background)]" />
                    <stop
                        class="motion-safe:animate-sap-shimmer [stop-color:var(--sapContent_Placeholderloading_Background)]"
                    >
                        <animate attributeName="offset" values="0; 0; 0.5; 1; 1" dur="2s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="1" class="[stop-color:var(--sapContent_Placeholderloading_Background)]" />
                </linearGradient>
                <mask [attr.id]="id + '-mask'" class="fill-white">
                    @switch (type()) {
                        @case ('rectangle') {
                            <rect x="0" y="0" width="100%" height="100%" rx="4" />
                        }
                        @case ('circle') {
                            <circle cx="50%" cy="50%" r="50%" />
                        }
                        @case ('text') {
                            @for (width of lineWidths(); track $index) {
                                <rect x="0" [attr.y]="$index * lineSpacing" height="8" rx="4" [attr.width]="width" />
                            }
                        }
                    }
                    <ng-content />
                </mask>
            </defs>
            <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                [attr.mask]="'url(#' + id + '-mask)'"
                [attr.fill]="animated() ? 'url(#' + id + '-gradient)' : null"
                [class]="
                    animated()
                        ? 'motion-reduce:fill-sap-content-placeholderloading-background'
                        : 'fill-sap-content-placeholderloading-background'
                "
            />
        </svg>
    `
})
export class Skeleton {
    /** Shimmer animation (disabled for users who prefer reduced motion). */
    readonly animated = input(true, { transform: booleanAttribute });
    /** Predefined shape; omit to draw projected SVG shapes. */
    readonly type = input<SkeletonType | null | undefined>();
    /** Lines of the text type; the last of several lines is 60% wide. */
    readonly textLines = input(3, { transform: numberAttribute });
    readonly width = input<string | null | undefined>();
    readonly height = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly id = `fd-skeleton-${nextId++}`;
    protected readonly lineSpacing = LINE_SPACING;

    protected readonly dimensions = computed(() => {
        const width = this.width() ?? null;
        const height = this.height() ?? null;
        switch (this.type()) {
            case 'text': {
                const lines = Math.max(1, this.textLines());
                return { width: width ?? '100%', height: height ?? (lines > 1 ? `${LINE_SPACING * lines}px` : '8px') };
            }
            case 'circle':
                // a circle is always square
                return { width: width ?? height, height: height ?? width };
            default:
                return { width, height };
        }
    });

    protected readonly lineWidths = computed(() => {
        const lines = Math.max(1, this.textLines());
        return Array.from({ length: lines }, (_, i) => (lines > 1 && i === lines - 1 ? '60%' : '100%'));
    });

    protected readonly computedClass = computed(() =>
        cn('m-0 box-border inline-block cursor-wait p-0', this.userClass())
    );
}
