/*
 * Port of @fundamental-ngx/core (status-indicator) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    afterRenderEffect,
    booleanAttribute,
    computed,
    inject,
    input,
    signal,
    viewChildren
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

export type StatusIndicatorSize = 'sm' | 'md' | 'lg' | 'xl';
export type StatusIndicatorColor = 'negative' | 'critical' | 'positive';
export type StatusIndicatorLabelPosition = 'left' | 'right' | 'top' | 'bottom';
export type StatusIndicatorFillingType = 'radial' | 'angled' | 'linearup' | 'lineardown' | 'linearleft';
export type StatusIndicatorFillDirection = 'clockwise' | 'counterclockwise';

const SVG_SIZE: Record<StatusIndicatorSize, string> = {
    sm: 'w-[1.875rem] h-[1.375rem]',
    md: 'w-[2.8125rem] h-[1.875rem]',
    lg: 'w-20 h-[3.4375rem]',
    xl: 'w-[9.0625rem] h-[6.25rem]'
};
const LABEL_SIZE: Record<StatusIndicatorSize, string> = {
    sm: 'text-sap-font-small-size [--si-gap:0.375rem]',
    md: 'text-sap-font-size [--si-gap:0.5rem]',
    lg: 'text-[1.125rem] [--si-gap:0.75rem]',
    xl: 'text-[1.875rem] [--si-gap:1rem]'
};
const LABEL_POSITION: Record<StatusIndicatorLabelPosition, string> = {
    top: 'mb-(--si-gap)',
    bottom: 'mt-(--si-gap)',
    left: 'me-(--si-gap)',
    right: 'ms-(--si-gap)'
};
/** Shapes use the element colour; the label the text colour of the status, which meets text contrast. */
const COLOR: Record<StatusIndicatorColor, string> = {
    positive: 'fill-sap-positive-element-color text-sap-positive-text-color',
    critical: 'fill-sap-critical-element-color text-sap-critical-text-color',
    negative: 'fill-sap-negative-element-color text-sap-negative-text-color'
};

interface Point {
    x: number;
    y: number;
}

/** Gradient vector (x1, y1, x2, y2) of a linear fill in the given direction, in degrees. */
function gradientVector(angle: number): [number, number, number, number] {
    if (angle === 0 || angle === 360) return [1, 0, 0, 0];
    if (angle > 0 && angle < 45) return [1, 0, 0, 1];
    if (angle >= 45 && angle < 135) return [0, 0, 0, 1];
    if (angle >= 135 && angle < 180) return [0, 0, 1, 1];
    if (angle >= 180 && angle < 225) return [0, 0, 1, 0];
    if (angle >= 225 && angle < 270) return [0, 1, 1, 0];
    if (angle >= 270 && angle < 315) return [0, 1, 0, 0];
    if (angle >= 315 && angle < 360) return [1, 1, 0, 0];
    return [0, 0, 0, 0];
}

const FILL_ANGLE: Partial<Record<StatusIndicatorFillingType, number>> = {
    linearup: 90,
    lineardown: 270,
    linearleft: 180
};

/** Polygon that covers `percent` of a box, swept from 12 o'clock around its centre. */
function radialPolygon(percent: number, box: DOMRect, counterclockwise: boolean): string {
    const angle = 3.6 * percent;
    const start = { x: box.x + box.width / 2, y: box.y };
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const adjust = (p: Point): Point => (counterclockwise ? { x: centre.x - (p.x - centre.x), y: p.y } : p);
    const offset = (from: number, length: number) => (Math.tan(((from - angle) * Math.PI) / 180) * length) / 2;
    const points: Point[] = [start];
    if (angle > 0 && angle < 45) points.push(adjust({ x: start.x - offset(0, box.height), y: start.y }));
    if (angle >= 45) points.push(adjust({ x: box.x + box.width, y: box.y }));
    if (angle > 45 && angle < 135)
        points.push(adjust({ x: box.x + box.width, y: box.y + box.height / 2 - offset(90, box.width) }));
    if (angle >= 135) points.push(adjust({ x: box.x + box.width, y: box.y + box.height }));
    if (angle > 135 && angle < 225)
        points.push(adjust({ x: box.x + box.width / 2 + offset(180, box.height), y: box.y + box.height }));
    if (angle >= 225) points.push(adjust({ x: box.x, y: box.y + box.height }));
    if (angle > 225 && angle < 315)
        points.push(adjust({ x: box.x, y: box.y + box.height / 2 + offset(270, box.width) }));
    if (angle >= 315) points.push(adjust({ x: box.x, y: box.y }));
    if (angle > 315 && angle <= 360)
        points.push(adjust({ x: box.x + box.width / 2 - offset(360, box.height), y: box.y }));
    points.push(centre);
    return points.map((p) => `${p.x},${p.y}`).join(' ');
}

let nextId = 0;

/**
 * Status indicator: an SVG shape (one or more paths) filled to a percentage, linearly, at an
 * angle or radially, coloured by status.
 *
 * ```html
 * <fd-status-indicator [path]="euroPaths" viewBox="0 0 26 25" status="positive" [fillPercentage]="60"
 *     ariaLabel="Budget used" statusLabel="60%" labelPosition="right" />
 * ```
 */
@Component({
    selector: 'fd-status-indicator',
    exportAs: 'fdStatusIndicator',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[attr.role]': 'role()',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.aria-roledescription]': 'ariaRoleDescription()',
        '[attr.aria-valuetext]': 'isRange() ? ariaValueText() || percentage() + "%" : null',
        '[attr.aria-valuenow]': 'isRange() ? percentage() : null',
        '[attr.aria-valuemin]': 'isRange() ? 0 : null',
        '[attr.aria-valuemax]': 'isRange() ? 100 : null',
        '[attr.title]': 'title()',
        '[attr.tabindex]': 'focusable() ? 0 : null',
        '(keydown.enter)': 'activate($event)',
        '(keydown.space)': 'activate($event)'
    },
    template: `
        @if (labelPosition() === 'left' || labelPosition() === 'top') {
            <span [class]="labelClass()">{{ statusLabel() }}</span>
        }
        <svg
            [attr.id]="id()"
            [attr.viewBox]="viewBox()"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            [class]="svgClass()"
        >
            @for (d of path(); track $index; let i = $index) {
                <svg overflow="visible" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        @if (radialPolygons()[i]; as points) {
                            <mask [attr.id]="id() + '-' + i + '-mask'">
                                <polygon fill="white" [attr.points]="points" />
                            </mask>
                        } @else {
                            <linearGradient
                                [attr.id]="id() + '-' + i + '-gradient'"
                                [attr.x1]="vector()[0]"
                                [attr.y1]="vector()[1]"
                                [attr.x2]="vector()[2]"
                                [attr.y2]="vector()[3]"
                            >
                                <stop [attr.offset]="filled() - i" stop-color="white">
                                    <animate
                                        attributeName="offset"
                                        [attr.values]="'0, ' + (filled() - i)"
                                        dur="1s"
                                        repeatCount="1"
                                    />
                                </stop>
                                <stop [attr.offset]="filled() - i" stop-color="transparent">
                                    <animate
                                        attributeName="offset"
                                        [attr.values]="'0, ' + (filled() - i)"
                                        dur="1s"
                                        repeatCount="1"
                                    />
                                </stop>
                            </linearGradient>
                            <mask [attr.id]="id() + '-' + i + '-mask'">
                                <path
                                    [attr.d]="d"
                                    stroke-width="0"
                                    [attr.fill]="'url(#' + id() + '-' + i + '-gradient)'"
                                />
                            </mask>
                        }
                    </defs>
                    <path [attr.d]="d" stroke-width="0" [attr.mask]="'url(#' + id() + '-' + i + '-mask)'" />
                    <path #shape [attr.d]="d" stroke-width="0.25" fill="transparent" />
                </svg>
            }
        </svg>
        @if (labelPosition() === 'right' || labelPosition() === 'bottom') {
            <span [class]="labelClass()">{{ statusLabel() }}</span>
        }
    `
})
export class StatusIndicator {
    /** Id of the SVG; prefixes the ids of the gradients and masks. */
    readonly id = input(`fd-status-indicator-${nextId++}`);
    readonly size = input<StatusIndicatorSize>('md');
    readonly status = input<StatusIndicatorColor | null | undefined>();
    readonly statusLabel = input<string | null | undefined>();
    readonly labelPosition = input<StatusIndicatorLabelPosition | null | undefined>();
    readonly labelSize = input<StatusIndicatorSize>('sm');
    /** One SVG path per shape; shapes fill one after another. */
    readonly path = input<string[]>([]);
    readonly viewBox = input<string | null | undefined>();
    /** 0-100. */
    readonly fillPercentage = input<number | null | undefined>();
    readonly fillingType = input<StatusIndicatorFillingType>('lineardown');
    readonly fillDirection = input<StatusIndicatorFillDirection>('clockwise');
    /** Fill direction in degrees for fillingType="angled". */
    readonly angle = input<number | null | undefined>();
    readonly clickable = input(false, { transform: booleanAttribute });
    readonly focusable = input(false, { transform: booleanAttribute });
    readonly role = input<string | null | undefined>('progressbar');
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaRoleDescription = input<string | null | undefined>();
    readonly ariaValueText = input<string | null | undefined>();
    readonly title = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly shapes = viewChildren<ElementRef<SVGPathElement>>('shape');

    protected readonly percentage = computed(() => Math.max(0, Math.min(100, this.fillPercentage() ?? 0)));
    protected readonly isRange = computed(() => this.role() === 'progressbar' || this.role() === 'meter');

    /** Number of shapes filled, e.g. 2.5 = two full shapes and half of the third. */
    protected readonly filled = computed(() => (this.percentage() * this.path().length) / 100);

    protected readonly vector = computed(() => {
        const type = this.fillingType();
        return gradientVector(type === 'angled' ? (this.angle() ?? 270) : (FILL_ANGLE[type] ?? 270));
    });

    /** Radial fill polygons of partially filled shapes, measured after render. */
    protected readonly radialPolygons = signal<(string | null)[]>([]);

    constructor() {
        afterRenderEffect({
            read: () => {
                const shapes = this.shapes();
                const filled = this.filled();
                const counterclockwise = this.fillDirection() === 'counterclockwise';
                const radial = this.fillingType() === 'radial';
                const polygons = shapes.map(({ nativeElement }, i) => {
                    const part = filled - i;
                    if (!radial || part <= 0 || part >= 1) return null;
                    return radialPolygon(Number(part.toFixed(2)) * 100, nativeElement.getBBox(), counterclockwise);
                });
                if (polygons.join('|') !== this.radialPolygons().join('|')) this.radialPolygons.set(polygons);
            }
        });
    }

    /** Enter and Space click a clickable, focusable indicator. */
    protected activate(event: Event): void {
        if (!this.clickable() || event.target !== this.host) return;
        event.preventDefault();
        this.host.click();
    }

    protected readonly computedClass = computed(() => {
        const position = this.labelPosition();
        const status = this.status();
        return cn(
            'm-0 box-border inline-flex flex-col items-center p-0 align-middle font-sap-font-family text-sap-font-small-size',
            'text-sap-content-label-color fill-transparent',
            (position === 'left' || position === 'right') && 'flex-row',
            status && COLOR[status],
            this.clickable() && 'cursor-pointer',
            'focus:outline-sap focus:outline-offset-(length:--sapContent_FocusWidth)',
            this.userClass()
        );
    });

    protected readonly svgClass = computed(() =>
        cn('stroke-sap-neutral-element-color [stroke-width:0.25]', SVG_SIZE[this.size()])
    );

    protected readonly labelClass = computed(() => {
        const position = this.labelPosition();
        return cn(LABEL_SIZE[this.labelSize()], position && LABEL_POSITION[position]);
    });
}
