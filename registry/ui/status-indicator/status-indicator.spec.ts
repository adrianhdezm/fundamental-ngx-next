import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    StatusIndicator,
    type StatusIndicatorColor,
    type StatusIndicatorFillDirection,
    type StatusIndicatorFillingType,
    type StatusIndicatorLabelPosition
} from './status-indicator';

const SQUARE = 'M0,0 L10,0 L10,10 L0,10 Z';

@Component({
    imports: [StatusIndicator],
    template: `
        <button id="before">Before</button>
        <fd-status-indicator
            id="si"
            [path]="path()"
            viewBox="0 0 10 10"
            [status]="status()"
            [fillPercentage]="percentage()"
            [fillingType]="fillingType()"
            [fillDirection]="fillDirection()"
            [angle]="angle()"
            [statusLabel]="statusLabel()"
            [labelPosition]="labelPosition()"
            [role]="role()"
            [ariaLabel]="ariaLabel()"
            [ariaValueText]="ariaValueText()"
            [clickable]="clickable()"
            [focusable]="focusable()"
            (click)="clicks = clicks + 1"
        />
    `
})
class Host {
    readonly path = signal([SQUARE]);
    readonly status = signal<StatusIndicatorColor | null>(null);
    readonly percentage = signal<number | null>(40);
    readonly fillingType = signal<StatusIndicatorFillingType>('lineardown');
    readonly fillDirection = signal<StatusIndicatorFillDirection>('clockwise');
    readonly angle = signal<number | null>(null);
    readonly statusLabel = signal<string | null>('40%');
    readonly labelPosition = signal<StatusIndicatorLabelPosition | null>('right');
    readonly role = signal<string | null>('progressbar');
    readonly ariaLabel = signal<string | null>('Budget used');
    readonly ariaValueText = signal<string | null>(null);
    readonly clickable = signal(false);
    readonly focusable = signal(false);
    clicks = 0;
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const element = () => fixture.nativeElement.querySelector('fd-status-indicator') as HTMLElement;
    const svg = () => element().querySelector('svg') as SVGSVGElement;
    const label = () => element().querySelector(':scope > span') as HTMLElement | null;
    const gradients = () => Array.from(element().querySelectorAll('linearGradient'));
    const stops = (i = 0) => Array.from(gradients()[i].querySelectorAll('stop')).map((s) => s.getAttribute('offset'));
    const vector = () => ['x1', 'y1', 'x2', 'y2'].map((a) => gradients()[0].getAttribute(a)).join(' ');
    const polygon = () => element().querySelector('mask polygon') as SVGPolygonElement | null;
    const update = async (change: () => void) => {
        change();
        await fixture.whenStable();
        // radial polygons are measured after render
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await fixture.whenStable();
    };
    return { fixture, host, element, svg, label, gradients, stops, vector, polygon, update };
}

function points(polygon: SVGPolygonElement): [number, number][] {
    return (polygon.getAttribute('points') ?? '').split(' ').map((p) => p.split(',').map(Number) as [number, number]);
}

/** Resolves a CSS colour (e.g. a theme variable) to its computed rgb value. */
function color(value: string): string {
    const probe = document.createElement('span');
    probe.style.color = value;
    document.body.appendChild(probe);
    const result = getComputedStyle(probe).color;
    probe.remove();
    return result;
}

describe('StatusIndicator', () => {
    it('fills the shape to the percentage with a gradient mask', async () => {
        const { host, element, stops, update } = await setup();
        expect(stops()).toEqual(['0.4', '0.4']);
        const mask = element().querySelector('mask') as SVGMaskElement;
        const filled = element().querySelector(`path[mask="url(#${mask.id})"]`);
        expect(filled).not.toBeNull();
        expect(mask.querySelector('path')?.getAttribute('fill')).toBe(
            `url(#${element().querySelector('linearGradient')!.id})`
        );
        await update(() => host.percentage.set(75));
        expect(stops()).toEqual(['0.75', '0.75']);
    });

    it('clamps the percentage to 0–100', async () => {
        const { host, element, stops, update } = await setup();
        await update(() => host.percentage.set(150));
        expect(stops()).toEqual(['1', '1']);
        expect(element().getAttribute('aria-valuenow')).toBe('100');
        await update(() => host.percentage.set(-20));
        expect(stops()).toEqual(['0', '0']);
        expect(element().getAttribute('aria-valuenow')).toBe('0');
        await update(() => host.percentage.set(null));
        expect(element().getAttribute('aria-valuenow')).toBe('0');
    });

    it('fills multiple shapes one after another', async () => {
        const { host, gradients, stops, update } = await setup();
        await update(() => {
            host.path.set([SQUARE, SQUARE, SQUARE, SQUARE]);
            host.percentage.set(60);
        });
        expect(gradients().length).toBe(4);
        // 60% of 4 shapes = 2.4 shapes: two full, 40% of the third, none of the fourth
        const offsets = [0, 1, 2, 3].map((i) => Number(stops(i)[0]));
        expect(offsets[0]).toBeGreaterThanOrEqual(1);
        expect(offsets[1]).toBeGreaterThanOrEqual(1);
        expect(offsets[2]).toBeCloseTo(0.4);
        expect(offsets[3]).toBeLessThanOrEqual(0);
    });

    it('gives every shape its own gradient and mask ids', async () => {
        const { host, element, update } = await setup();
        await update(() => host.path.set([SQUARE, SQUARE]));
        const ids = Array.from(element().querySelectorAll('mask, linearGradient')).map((e) => e.id);
        expect(new Set(ids).size).toBe(4);
        expect(ids.every((id) => id.startsWith(element().querySelector('svg')!.id))).toBe(true);
    });

    it('fill direction: lineardown, linearup and linearleft', async () => {
        const { host, vector, update } = await setup();
        expect(vector()).toBe('0 1 0 0');
        await update(() => host.fillingType.set('linearup'));
        expect(vector()).toBe('0 0 0 1');
        await update(() => host.fillingType.set('linearleft'));
        expect(vector()).toBe('0 0 1 0');
    });

    it('angled fill follows the angle (defaulting to 270)', async () => {
        const { host, vector, update } = await setup();
        await update(() => host.fillingType.set('angled'));
        expect(vector()).toBe('0 1 0 0');
        const expected: [number, string][] = [
            [0, '1 0 0 0'],
            [30, '1 0 0 1'],
            [90, '0 0 0 1'],
            [150, '0 0 1 1'],
            [200, '0 0 1 0'],
            [240, '0 1 1 0'],
            [300, '0 1 0 0'],
            [330, '1 1 0 0'],
            [360, '1 0 0 0']
        ];
        for (const [angle, v] of expected) {
            await update(() => host.angle.set(angle));
            expect(vector(), `${angle}deg`).toBe(v);
        }
    });

    it('radial fill masks the shape with a polygon swept clockwise from 12 o’clock', async () => {
        const { host, element, polygon, gradients, update } = await setup();
        await update(() => {
            host.fillingType.set('radial');
            host.percentage.set(25);
        });
        expect(gradients().length).toBe(0);
        expect(polygon()).not.toBeNull();
        const pts = points(polygon()!);
        // starts at the top centre, ends at the centre, and covers the right side only
        expect(pts[0]).toEqual([5, 0]);
        expect(pts[pts.length - 1]).toEqual([5, 5]);
        expect(pts.every(([x]) => x >= 5)).toBe(true);
        expect(pts).toContainEqual([10, 5]);
        const mask = element().querySelector('mask') as SVGMaskElement;
        expect(element().querySelector(`path[mask="url(#${mask.id})"]`)).not.toBeNull();
    });

    it('radial fill counterclockwise mirrors the polygon', async () => {
        const { host, polygon, update } = await setup();
        await update(() => {
            host.fillingType.set('radial');
            host.percentage.set(25);
            host.fillDirection.set('counterclockwise');
        });
        const pts = points(polygon()!);
        expect(pts.every(([x]) => x <= 5)).toBe(true);
        expect(pts).toContainEqual([0, 5]);
    });

    it('radial fill of a full shape uses a gradient instead of a polygon', async () => {
        const { host, polygon, stops, update } = await setup();
        await update(() => {
            host.fillingType.set('radial');
            host.percentage.set(100);
        });
        expect(polygon()).toBeNull();
        expect(stops()).toEqual(['1', '1']);
    });

    it('label position before or after the shape, in a row or a column', async () => {
        const { host, element, svg, label, update } = await setup();
        const positions: [StatusIndicatorLabelPosition, 'row' | 'column', boolean][] = [
            ['right', 'row', false],
            ['left', 'row', true],
            ['top', 'column', true],
            ['bottom', 'column', false]
        ];
        for (const [position, direction, before] of positions) {
            await update(() => host.labelPosition.set(position));
            expect(getComputedStyle(element()).flexDirection, position).toBe(direction);
            const labelBox = label()!.getBoundingClientRect();
            const svgBox = svg().getBoundingClientRect();
            if (direction === 'row') {
                if (before) expect(labelBox.right, position).toBeLessThanOrEqual(svgBox.left);
                else expect(labelBox.left, position).toBeGreaterThanOrEqual(svgBox.right);
            } else if (before) expect(labelBox.bottom, position).toBeLessThanOrEqual(svgBox.top);
            else expect(labelBox.top, position).toBeGreaterThanOrEqual(svgBox.bottom);
        }
        expect(label()!.textContent).toBe('40%');
    });

    it('status colours the shape with the element colour and the label with the text colour', async () => {
        const { host, element, label, update } = await setup();
        expect(getComputedStyle(label()!).color).toBe(color('var(--sapContent_LabelColor)'));
        const colors: Record<StatusIndicatorColor, [string, string]> = {
            positive: ['--sapPositiveElementColor', '--sapPositiveTextColor'],
            critical: ['--sapCriticalElementColor', '--sapCriticalTextColor'],
            negative: ['--sapNegativeElementColor', '--sapNegativeTextColor']
        };
        const filled = () => element().querySelector('path[mask]') as SVGPathElement;
        for (const [status, [fill, text]] of Object.entries(colors) as [StatusIndicatorColor, [string, string]][]) {
            await update(() => host.status.set(status));
            expect(getComputedStyle(filled()).fill, status).toBe(color(`var(${fill})`));
            expect(getComputedStyle(label()!).color, status).toBe(color(`var(${text})`));
        }
    });

    it('the SVG is hidden from assistive technology', async () => {
        const { svg } = await setup();
        expect(svg().getAttribute('aria-hidden')).toBe('true');
    });

    it('is a progressbar with aria-valuenow, valuemin/max and valuetext', async () => {
        const { host, element, update } = await setup();
        expect(element().getAttribute('role')).toBe('progressbar');
        expect(element().getAttribute('aria-label')).toBe('Budget used');
        expect(element().getAttribute('aria-valuenow')).toBe('40');
        expect(element().getAttribute('aria-valuemin')).toBe('0');
        expect(element().getAttribute('aria-valuemax')).toBe('100');
        expect(element().getAttribute('aria-valuetext')).toBe('40%');
        await update(() => host.ariaValueText.set('40 of 100 euros'));
        expect(element().getAttribute('aria-valuetext')).toBe('40 of 100 euros');
        await update(() => host.role.set('meter'));
        expect(element().getAttribute('aria-valuenow')).toBe('40');
    });

    it('other roles have no value attributes', async () => {
        const { host, element, update } = await setup();
        await update(() => host.role.set('img'));
        expect(element().getAttribute('role')).toBe('img');
        for (const attribute of ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext']) {
            expect(element().hasAttribute(attribute), attribute).toBe(false);
        }
    });

    it('is not focusable unless focusable', async () => {
        const { host, element, update } = await setup();
        expect(element().hasAttribute('tabindex')).toBe(false);
        (document.getElementById('before') as HTMLElement).focus();
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).not.toBe(element());

        await update(() => host.focusable.set(true));
        expect(element().getAttribute('tabindex')).toBe('0');
        (document.getElementById('before') as HTMLElement).focus();
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(element());
        expect(getComputedStyle(element()).outlineStyle).not.toBe('none');
    });

    it('clickable variant shows a pointer and receives clicks', async () => {
        const { host, element, update } = await setup();
        expect(getComputedStyle(element()).cursor).not.toBe('pointer');
        await update(() => host.clickable.set(true));
        expect(getComputedStyle(element()).cursor).toBe('pointer');
        await userEvent.click(element());
        expect(host.clicks).toBe(1);
    });

    it('a clickable, focusable indicator is clicked with Enter and Space', async () => {
        const { host, element, update } = await setup();
        await update(() => {
            host.clickable.set(true);
            host.focusable.set(true);
        });
        element().focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(host.clicks).toBe(2);
        await update(() => host.clickable.set(false));
        element().focus();
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toBe(2);
    });
});
