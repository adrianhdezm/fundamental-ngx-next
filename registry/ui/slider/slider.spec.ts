import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Slider, type SliderCustomValue, type SliderValue } from './slider';

const MONTHS: SliderCustomValue[] = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' }
];

@Component({
    imports: [Slider, ReactiveFormsModule],
    template: `
        <div style="width: 400px">
            <fd-slider
                ariaLabel="Value"
                [mode]="mode()"
                [step]="step()"
                [customValues]="custom()"
                [showTicks]="true"
                [showTicksLabels]="true"
                [formControl]="control"
            />
        </div>
    `
})
class Host {
    readonly mode = signal<'single' | 'range'>('single');
    readonly step = signal(10);
    readonly custom = signal<SliderCustomValue[]>([]);
    readonly control = new FormControl<SliderValue>(50);
}

async function setup(config: { mode?: 'single' | 'range'; custom?: boolean; value?: SliderValue } = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.mode) host.mode.set(config.mode);
    if (config.custom) host.custom.set(MONTHS);
    if (config.value !== undefined) host.control.setValue(config.value);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, host, root, handles: () => [...root.querySelectorAll<HTMLElement>('[role=slider]')] };
}

describe('Slider', () => {
    it('exposes the value as an ARIA slider', async () => {
        const { handles } = await setup();
        const [handle] = handles();
        expect(handle.getAttribute('aria-valuemin')).toBe('0');
        expect(handle.getAttribute('aria-valuemax')).toBe('100');
        expect(handle.getAttribute('aria-valuenow')).toBe('50');
        expect(handle.getAttribute('aria-label')).toBe('Value');
        expect(handle.style.insetInlineStart).toBe('50%');
    });

    it('moves by step with the arrows, by jump with Shift and to the ends with Home and End', async () => {
        const { fixture, host, handles } = await setup();
        handles()[0].focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(host.control.value).toBe(60);
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        expect(host.control.value).toBe(40);
        await userEvent.keyboard('{End}');
        expect(host.control.value).toBe(100);
        await userEvent.keyboard('{ArrowRight}');
        expect(host.control.value).toBe(100);
        await userEvent.keyboard('{Home}');
        await fixture.whenStable();
        expect(host.control.value).toBe(0);
        expect(handles()[0].getAttribute('aria-valuenow')).toBe('0');
    });

    it('sets the value from a press on the track and a drag of the handle', async () => {
        const { fixture, host, root, handles } = await setup();
        const track = root.querySelector<HTMLElement>('fd-slider [class*="bg-sap-slider-background"]')!;
        const rect = track.getBoundingClientRect();
        track.dispatchEvent(
            new PointerEvent('pointerdown', {
                bubbles: true,
                button: 0,
                clientX: rect.left + rect.width * 0.2,
                clientY: rect.top
            })
        );
        await fixture.whenStable();
        expect(host.control.value).toBe(20);
        expect(document.activeElement).toBe(handles()[0]);
        const handle = handles()[0];
        handle.dispatchEvent(
            new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: rect.left + rect.width * 0.2 })
        );
        handle.dispatchEvent(
            new PointerEvent('pointermove', { bubbles: true, clientX: rect.left + rect.width * 0.71 })
        );
        handle.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        expect(host.control.value).toBe(70);
    });

    it('moves the handles of a range separately and together', async () => {
        const { fixture, host, root, handles } = await setup({ mode: 'range', value: [20, 60] });
        expect(handles()).toHaveLength(2);
        handles()[1].focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(host.control.value).toEqual([20, 70]);
        const group = root.querySelector<HTMLElement>('[role=group]')!;
        group.focus();
        await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
        expect(host.control.value).toEqual([30, 80]);
        await userEvent.keyboard('{End}');
        await fixture.whenStable();
        expect(host.control.value).toEqual([50, 100]);
        expect(group.getAttribute('aria-label')).toBe('Range from 50 to 100');
    });

    it('works with custom values', async () => {
        const { fixture, host, root, handles } = await setup({ custom: true, value: MONTHS[1] });
        expect(handles()[0].getAttribute('aria-valuetext')).toBe('Feb');
        handles()[0].focus();
        await userEvent.keyboard('{ArrowRight}');
        await fixture.whenStable();
        expect(host.control.value).toEqual(MONTHS[2]);
        expect(root.textContent).toContain('Jan');
        expect(root.textContent).toContain('Mar');
    });

    it('follows the disabled state of the form control', async () => {
        const { fixture, host, handles } = await setup();
        host.control.disable();
        await fixture.whenStable();
        expect(handles()[0].getAttribute('tabindex')).toBe('-1');
        expect(handles()[0].getAttribute('aria-disabled')).toBe('true');
    });
});
