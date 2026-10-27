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
    });
});
