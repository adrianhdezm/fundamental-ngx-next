import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
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

@Component({
    imports: [Slider],
    template: `
        <div [style.width.px]="400" [style.height.px]="vertical() ? 300 : null">
            <fd-slider
                ariaLabel="Value"
                [mode]="mode()"
                [min]="min()"
                [max]="max()"
                [step]="step()"
                [vertical]="vertical()"
                [cozy]="cozy()"
                [showTicks]="showTicks()"
                [showTicksLabels]="showTicks()"
                [tickmarksBetweenLabels]="between()"
                [tooltipMode]="tooltip()"
                [(value)]="value"
            />
        </div>
        <button id="outside">Outside</button>
    `
})
class ConfigHost {
    readonly mode = signal<'single' | 'range'>('single');
    readonly min = signal(0);
    readonly max = signal(100);
    readonly step = signal(1);
    readonly vertical = signal(false);
    readonly cozy = signal(false);
    readonly showTicks = signal(false);
    readonly between = signal(1);
    readonly tooltip = signal<'readonly' | 'editable' | null>(null);
    readonly value = signal<SliderValue>(50);
}

const frame = () => new Promise((r) => requestAnimationFrame(r));

async function configure(apply: (host: ConfigHost) => void = () => {}) {
    const fixture = TestBed.createComponent(ConfigHost);
    const host = fixture.componentInstance;
    apply(host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await frame();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const track = root.querySelector<HTMLElement>('fd-slider [class*="bg-sap-slider-background"]')!;
    /** Dispatches a pointer event at a fraction of the track (from the left, or from the bottom when vertical). */
    const pointer = (target: HTMLElement, type: string, ratio: number) => {
        const rect = track.getBoundingClientRect();
        target.dispatchEvent(
            new PointerEvent(type, {
                bubbles: true,
                button: 0,
                clientX: rect.left + rect.width * ratio,
                clientY: rect.bottom - rect.height * ratio
            })
        );
    };
    const stable = async () => {
        await fixture.whenStable();
        await frame();
    };
    return {
        fixture,
        host,
        root,
        track,
        pointer,
        stable,
        handles: () => [...root.querySelectorAll<HTMLElement>('[role=slider]')]
    };
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

    describe('configuration', () => {
        afterEach(() => document.documentElement.removeAttribute('dir'));

        it('cozy makes the handles larger', async () => {
            const compact = await configure();
            const small = compact.handles()[0].getBoundingClientRect();
            compact.fixture.destroy();
            const cozy = await configure((h) => h.cozy.set(true));
            const large = cozy.handles()[0].getBoundingClientRect();
            expect(large.width).toBeGreaterThan(small.width);
            expect(large.height).toBeGreaterThan(small.height);
        });

        it('vertical slider is aria-orientation vertical, fills from the bottom and steps with Up/Down', async () => {
            const { host, track, pointer, stable, handles } = await configure((h) => {
                h.vertical.set(true);
                h.value.set(20);
            });
            const [handle] = handles();
            expect(handle.getAttribute('aria-orientation')).toBe('vertical');
            expect(handle.style.bottom).toBe('20%');
            const trackRect = track.getBoundingClientRect();
            expect(trackRect.height).toBeGreaterThan(trackRect.width);
            const center = handle.getBoundingClientRect().top + handle.getBoundingClientRect().height / 2;
            expect(center).toBeCloseTo(trackRect.bottom - trackRect.height * 0.2, 0);
            handle.focus();
            await userEvent.keyboard('{ArrowUp}');
            expect(host.value()).toBe(21);
            await userEvent.keyboard('{ArrowDown}{ArrowDown}');
            expect(host.value()).toBe(19);
            pointer(track, 'pointerdown', 0.75);
            await stable();
            expect(host.value()).toBe(75);
        });

        it('dragging the range between the handles moves both', async () => {
            const { host, root, pointer, stable } = await configure((h) => {
                h.mode.set('range');
                h.value.set([20, 60]);
            });
            const group = root.querySelector<HTMLElement>('[role=group]')!;
            pointer(group, 'pointerdown', 0.4);
            pointer(group, 'pointermove', 0.55);
            await stable();
            expect(host.value()).toEqual([35, 75]);
            expect(document.activeElement).toBe(group);
            // the range stops at the end and keeps its size
            pointer(group, 'pointermove', 0.95);
            pointer(group, 'pointerup', 0.95);
            await stable();
            expect(host.value()).toEqual([60, 100]);
        });

        it('a pointer beyond either end clamps to min or max', async () => {
            const { host, track, pointer, stable, handles } = await configure((h) => {
                h.min.set(-50);
                h.max.set(50);
            });
            pointer(track, 'pointerdown', 0.5);
            await stable();
            expect(host.value()).toBe(0);
            const handle = handles()[0];
            pointer(handle, 'pointerdown', 0.5);
            pointer(handle, 'pointermove', -0.5);
            await stable();
            expect(host.value()).toBe(-50);
            pointer(handle, 'pointermove', 1.5);
            pointer(handle, 'pointerup', 1.5);
            await stable();
            expect(host.value()).toBe(50);
            expect(handle.style.insetInlineStart).toBe('100%');
        });

        it('steps of 0.2 produce values without floating point noise', async () => {
            const { host, track, pointer, stable, handles } = await configure((h) => {
                h.min.set(-1);
                h.max.set(1);
                h.step.set(0.2);
                h.value.set(0.4);
            });
            handles()[0].focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(host.value()).toBe(0.6);
            await userEvent.keyboard('{ArrowRight}{ArrowRight}');
            expect(host.value()).toBe(1);
            await userEvent.keyboard('{ArrowLeft}');
            expect(host.value()).toBe(0.8);
            pointer(track, 'pointerdown', 0.11);
            await stable();
            expect(host.value()).toBe(-0.8);
            expect(handles()[0].getAttribute('aria-valuenow')).toBe('-0.8');
        });

        it('shows a tick per step and a label every tickmarksBetweenLabels ticks', async () => {
            const { root, host, stable } = await configure((h) => {
                h.showTicks.set(true);
                h.max.set(10);
            });
            const labels = () => root.querySelector<HTMLElement>('fd-slider [aria-hidden="true"]')!;
            const ticks = () => labels().previousElementSibling!.children;
            expect(ticks()).toHaveLength(11);
            expect(labels().children).toHaveLength(11);
            expect(labels().textContent!.replace(/\s+/g, ' ').trim()).toBe('0 1 2 3 4 5 6 7 8 9 10');
            host.between.set(2);
            await stable();
            expect(ticks()).toHaveLength(11);
            expect(labels().children).toHaveLength(6);
            expect(labels().textContent!.replace(/\s+/g, ' ').trim()).toBe('0 2 4 6 8 10');
        });

        it('range handles can cross and the value stays sorted', async () => {
            const control = await setup({ mode: 'range', value: [20, 60] });
            const [first, second] = control.handles();
            first.focus();
            await userEvent.keyboard('{End}');
            await control.fixture.whenStable();
            expect(control.host.control.value).toEqual([60, 100]);
            // the first handle passed the second one and keeps its identity
            expect(first.getAttribute('aria-valuenow')).toBe('100');
            expect(second.getAttribute('aria-valuenow')).toBe('60');
            expect(control.root.querySelector('[role=group]')!.getAttribute('aria-label')).toBe('Range from 60 to 100');
        });

        it('readonly tooltip shows the value on hover and focus', async () => {
            const { root, stable, handles } = await configure((h) => {
                h.tooltip.set('readonly');
                h.value.set(30);
            });
            const slider = root.querySelector<HTMLElement>('fd-slider')!;
            const tooltip = () => root.querySelector('fd-slider span[aria-hidden="true"]');
            // start with the pointer away from the slider
            await userEvent.hover(root.querySelector<HTMLElement>('#outside')!);
            await stable();
            expect(tooltip()).toBeNull();
            await userEvent.hover(slider);
            await stable();
            expect(tooltip()?.textContent?.trim()).toBe('30');
            await userEvent.unhover(slider);
            await stable();
            expect(tooltip()).toBeNull();
            handles()[0].focus();
            await stable();
            expect(tooltip()?.textContent?.trim()).toBe('30');
            root.querySelector<HTMLElement>('#outside')!.focus();
            await stable();
            expect(tooltip()).toBeNull();
        });

        it('editable tooltip sets the value on Enter', async () => {
            const { host, root, stable, handles } = await configure((h) => {
                h.tooltip.set('editable');
                h.step.set(5);
                h.value.set(30);
            });
            handles()[0].focus();
            await stable();
            const input = root.querySelector<HTMLInputElement>('fd-slider input')!;
            expect(input.value).toBe('30');
            expect(input.getAttribute('aria-label')).toBe('Value');
            await userEvent.clear(input);
            await userEvent.type(input, '42{Enter}');
            await stable();
            expect(host.value()).toBe(40);
            expect(input.value).toBe('40');
            await userEvent.clear(input);
            await userEvent.type(input, 'abc{Enter}');
            await stable();
            expect(host.value()).toBe(40);
            expect(input.value).toBe('40');
            expect(handles()[0].getAttribute('aria-valuenow')).toBe('40');
        });

        it('RTL mirrors the handle position and arrow keys', async () => {
            document.documentElement.setAttribute('dir', 'rtl');
            const { host, track, pointer, stable, handles } = await configure((h) => h.value.set(20));
            const handle = handles()[0];
            const trackRect = track.getBoundingClientRect();
            const center = handle.getBoundingClientRect().left + handle.getBoundingClientRect().width / 2;
            expect(center).toBeCloseTo(trackRect.right - trackRect.width * 0.2, 0);
            handle.focus();
            await userEvent.keyboard('{ArrowLeft}');
            expect(host.value()).toBe(21);
            await userEvent.keyboard('{ArrowRight}{ArrowRight}');
            expect(host.value()).toBe(19);
            pointer(track, 'pointerdown', 0.25);
            await stable();
            expect(host.value()).toBe(75);
        });
    });
});
