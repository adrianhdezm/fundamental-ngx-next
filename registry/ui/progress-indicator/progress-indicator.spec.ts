import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ProgressIndicator, type ProgressIndicatorState } from './progress-indicator';

@Component({
    imports: [ProgressIndicator],
    template: `
        <div [style.width]="width()">
            <fd-progress-indicator ariaLabel="Upload" [valueNow]="value()" [valueText]="text()" [state]="state()" />
        </div>
    `
})
class Host {
    readonly width = signal('400px');
    readonly value = signal(42);
    readonly text = signal<string | null>(null);
    readonly state = signal<ProgressIndicatorState | null>(null);
}

@Component({
    imports: [ProgressIndicator],
    template: `
        <div style="width: 400px">
            <span id="pi-label">Import progress</span>
            <fd-progress-indicator
                ariaLabelledBy="pi-label"
                [valueMin]="min()"
                [valueMax]="max()"
                [valueNow]="value()"
                [unit]="unit()"
                [animate]="animate()"
            />
        </div>
    `
})
class RangeHost {
    readonly min = signal(1);
    readonly max = signal(5);
    readonly value = signal(3);
    readonly unit = signal('%');
    readonly animate = signal(false);
}

async function setupRange() {
    const fixture = TestBed.createComponent(RangeHost);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const bar = root.querySelector<HTMLElement>('[role=progressbar]')!;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        bar,
        fill: () => bar.querySelector<HTMLElement>('[style*="width"]')
    };
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        bar: root.querySelector<HTMLElement>('[role=progressbar]')!
    };
}

describe('ProgressIndicator', () => {
    it('is a progress bar with its value', async () => {
        const { bar, root } = await setup();
        expect(bar.getAttribute('aria-valuenow')).toBe('42');
        expect(bar.getAttribute('aria-valuemin')).toBe('0');
        expect(bar.getAttribute('aria-valuemax')).toBe('100');
        expect(bar.getAttribute('aria-valuetext')).toBe('42%');
        expect(bar.getAttribute('aria-label')).toBe('Upload');
        expect(root.querySelector<HTMLElement>('[role=progressbar] [style*="width"]')?.style.width).toBe('42%');
        expect(root.textContent).toContain('42%');
    });

    it('shows a text and clamps the bar', async () => {
        const { fixture, host, bar, root } = await setup();
        host.text.set('80 of 100 MB');
        host.value.set(150);
        await fixture.whenStable();
        expect(bar.getAttribute('aria-valuetext')).toBe('80 of 100 MB');
        expect(root.textContent).toContain('80 of 100 MB');
        expect(root.querySelector<HTMLElement>('[role=progressbar] [style*="width"]')?.style.width).toBe('100%');
        host.value.set(0);
        await fixture.whenStable();
        expect(root.querySelector('[role=progressbar] [style*="width"]')).toBeNull();
    });

    it('shows an icon for a state', async () => {
        const { fixture, host, root } = await setup();
        expect(root.querySelector('fd-icon')).toBeNull();
        host.state.set('positive');
        await fixture.whenStable();
        expect(root.querySelector('fd-icon')).not.toBeNull();
    });

    it('shows a truncated text in full in a popover', async () => {
        const { fixture, host, root } = await setup();
        host.width.set('120px');
        host.text.set('Importing 35 of 100 records from the customer master data');
        await fixture.whenStable();
        await wait(100);
        await fixture.whenStable();
        const label = root.querySelector<HTMLElement>('fd-popover-control button')!;
        expect(label).not.toBeNull();
        await userEvent.click(label);
        await fixture.whenStable();
        expect(document.querySelector('.cdk-overlay-container')?.textContent).toContain('customer master data');
        const dialog = document.querySelector<HTMLElement>('.cdk-overlay-container [role=dialog]')!;
        expect(dialog.getAttribute('aria-label')).toBe('Importing 35 of 100 records from the customer master data');
    });

    it('computes the width relative to valueMin and valueMax', async () => {
        const { fixture, host, bar, fill } = await setupRange();
        expect(bar.getAttribute('aria-valuemin')).toBe('1');
        expect(bar.getAttribute('aria-valuemax')).toBe('5');
        expect(fill()?.style.width).toBe('50%');
        host.value.set(2);
        await fixture.whenStable();
        expect(fill()?.style.width).toBe('25%');
        host.value.set(9);
        await fixture.whenStable();
        expect(fill()?.style.width).toBe('100%');
        // the fill reaches the end of the track
        expect(Math.abs(fill()!.getBoundingClientRect().right - bar.getBoundingClientRect().right)).toBeLessThanOrEqual(
            1
        );
    });

    it('appends the unit to the default value text', async () => {
        const { fixture, host, bar, root } = await setupRange();
        host.min.set(0);
        host.max.set(100);
        host.value.set(25);
        host.unit.set('MB');
        await fixture.whenStable();
        expect(bar.getAttribute('aria-valuetext')).toBe('25MB');
        expect(root.textContent).toContain('25MB');
    });

    it('names the bar with ariaLabelledBy', async () => {
        const { bar } = await setupRange();
        expect(bar.getAttribute('aria-labelledby')).toBe('pi-label');
        expect(bar.hasAttribute('aria-label')).toBe(false);
        expect(document.getElementById('pi-label')?.textContent).toBe('Import progress');
    });

    it('animate adds a width transition', async () => {
        const { fixture, host, fill } = await setupRange();
        expect(getComputedStyle(fill()!).transitionProperty).not.toContain('width');
        host.animate.set(true);
        await fixture.whenStable();
        const style = getComputedStyle(fill()!);
        expect(style.transitionProperty).toContain('width');
        expect(style.transitionDuration).toBe('0.5s');
    });
});
