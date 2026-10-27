/*
 * Port of @fundamental-ngx/core (popover) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ConnectedPosition } from '@angular/cdk/overlay';

export type Placement =
    | 'top-start'
    | 'top'
    | 'top-end'
    | 'right-start'
    | 'right'
    | 'right-end'
    | 'bottom-start'
    | 'bottom'
    | 'bottom-end'
    | 'left-start'
    | 'left'
    | 'left-end';

/** How the popover body width relates to the trigger width. */
export type PopoverFillMode = 'at-least' | 'equal' | 'fit-content';

const PLACEMENTS: Record<Placement, ConnectedPosition> = {
    'top-start': { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
    top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' },
    'top-end': { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
    'bottom-start': { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' },
    'bottom-end': { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
    'left-start': { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top' },
    left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center' },
    'left-end': { originX: 'start', originY: 'bottom', overlayX: 'end', overlayY: 'bottom' },
    'right-start': { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top' },
    right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' },
    'right-end': { originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'bottom' }
};

/** Fallback positions, tried in order when the preferred one does not fit. */
export const DEFAULT_POSITIONS: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
    { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' },
    { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' }
];

const FLIP_Y = { top: 'bottom', bottom: 'top', center: 'center' } as const;

/**
 * CDK position of a placement. CDK "start"/"end" already follow the direction, but "left" and
 * "right" placements are physical, so they swap in RTL.
 */
export function getCdkPlacement(placement: Placement, dir: 'ltr' | 'rtl' = 'ltr'): ConnectedPosition {
    if (dir === 'rtl' && /^(left|right)/.test(placement)) {
        const flipped = placement.startsWith('left')
            ? (placement.replace('left', 'right') as Placement)
            : (placement.replace('right', 'left') as Placement);
        return PLACEMENTS[flipped];
    }
    return PLACEMENTS[placement];
}

/** The preferred positions followed by the vertical flip of the first one and the defaults. */
export function withFallbackPositions(positions: ConnectedPosition[]): ConnectedPosition[] {
    const first = positions[0];
    const flipped = first ? [{ ...first, originY: FLIP_Y[first.originY], overlayY: FLIP_Y[first.overlayY] }] : [];
    return [...positions, ...flipped, ...DEFAULT_POSITIONS];
}

export type ArrowSide = 'top' | 'bottom' | 'start' | 'end' | 'none';
export type ArrowAlign = 'start' | 'center' | 'end';

/** Where the arrow of the body points for a resolved CDK position. */
export function arrowFor(position: ConnectedPosition): { side: ArrowSide; align: ArrowAlign } {
    const { originX, originY, overlayX, overlayY } = position;
    if (overlayY !== originY && originY !== 'center' && overlayY !== 'center' && overlayX === originX) {
        // body below (arrow on top) or above (arrow at bottom) the trigger
        return { side: overlayY === 'top' ? 'top' : 'bottom', align: originX };
    }
    if (overlayX !== originX && overlayX !== 'center' && originX !== 'center' && originY === overlayY) {
        // body after (arrow at its start) or before (arrow at its end) the trigger
        return {
            side: overlayX === 'start' ? 'start' : 'end',
            align: originY === 'top' ? 'start' : originY === 'center' ? 'center' : 'end'
        };
    }
    return { side: 'none', align: 'start' };
}
