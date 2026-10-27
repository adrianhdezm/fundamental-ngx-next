import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { BusyIndicator, BusyIndicatorExtended, type BusyIndicatorSize } from './busy-indicator';

@Component({
    imports: [BusyIndicator, BusyIndicatorExtended],
    template: `
        <button id="before">Before</button>
        <div id="scroller" style="height: 200px; overflow: auto">
            <fd-busy-indicator
                id="block"
                [loading]="loading()"
                block
                ariaLabel="Loading orders"
                [label]="label()"
                [ariaLive]="ariaLive()"
                [preventWheelEvents]="preventWheel()"
            >
                <div style="height: 150px">
                    <button id="inside" (click)="clicks.set(clicks() + 1)">Inside</button>
                </div>
            </fd-busy-indicator>
            <div style="height: 1000px"></div>
        </div>
        <fd-busy-indicator
            id="standalone"
            [loading]="loading()"
            [size]="size()"
            [contrast]="contrast()"
            [ariaLabel]="ariaLabel()"
            [ariaValueText]="ariaValueText()"
            [title]="title()"
        />
        <div fdBusyIndicatorExtended><fd-busy-indicator id="extended" loading label="Loading data" /></div>
        <span id="probe"></span>
    `
})
class Host {
    readonly loading = signal(true);
    readonly size = signal<BusyIndicatorSize>('m');
    readonly contrast = signal(false);
    readonly ariaLabel = signal<string | null>('Loading');
    readonly ariaValueText = signal<string | null>(null);
    readonly title = signal<string | undefined>(undefined);
    readonly label = signal<string | undefined>(undefined);
    readonly ariaLive = signal<'assertive' | 'polite' | 'off' | null>(null);
    readonly preventWheel = signal(false);
    readonly clicks = signal(0);
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const probe = root.querySelector<HTMLElement>('#probe')!;
    const standalone = root.querySelector<HTMLElement>('#standalone')!;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        block: root.querySelector<HTMLElement>('#block')!,
        standalone,
        inside: root.querySelector<HTMLButtonElement>('#inside')!,
        dots: (el: HTMLElement = standalone) => [...el.querySelectorAll<HTMLElement>('[data-busy-dots] > div')],
        resolve: (variable: string) => {
            probe.style.color = `var(${variable})`;
            return getComputedStyle(probe).color;
        },
        update: async (change: (host: Host) => void) => {
            change(fixture.componentInstance);
            await fixture.whenStable();
        }
    };
}

describe('BusyIndicator', () => {
    afterEach(async () => {
        document.documentElement.removeAttribute('data-sap-theme');
        await cdp().send('Emulation.setEmulatedMedia', { features: [] });
    });

    it('loading shows the dots with role progressbar, aria-busy and the label; idle renders no ARIA attributes', async () => {
        const { standalone, dots, update } = await setup();
        expect(standalone.getAttribute('role')).toBe('progressbar');
        expect(standalone.getAttribute('aria-busy')).toBe('true');
        expect(standalone.getAttribute('aria-label')).toBe('Loading');
        expect(standalone.getAttribute('aria-valuetext')).toBe('Busy');
        expect(standalone.getAttribute('aria-valuemin')).toBe('0');
        expect(standalone.getAttribute('aria-valuemax')).toBe('100');
        expect(standalone.getAttribute('title')).toBe('Please wait');
        expect(standalone.getAttribute('tabindex')).toBe('0');
        expect(dots()).toHaveLength(3);
        for (const dot of dots()) expect(dot.getBoundingClientRect().width).toBeGreaterThan(0);

        await update((h) => h.title.set('Saving'));
        expect(standalone.getAttribute('title')).toBe('Saving');

        await update((h) => h.loading.set(false));
        expect(dots()).toHaveLength(0);
        expect(standalone.getAttribute('role')).toBe('presentation');
        for (const name of [
            'aria-busy',
            'aria-label',
            'aria-valuetext',
            'aria-valuemin',
            'aria-valuemax',
            'aria-live',
            'title'
        ])
            expect(standalone.hasAttribute(name)).toBe(false);
        expect(standalone.getAttribute('tabindex')).toBe('-1');
    });

    it('shows the label under the dots', async () => {
        const { root, update } = await setup();
        const extended = root.querySelector<HTMLElement>('#extended')!;
        const label = [...extended.querySelectorAll('span')].find((s) => s.textContent === 'Loading data')!;
        const dots = extended.querySelector('[data-busy-dots]')!.getBoundingClientRect();
        expect(label.getBoundingClientRect().top).toBeGreaterThanOrEqual(dots.bottom);

        // over wrapped content the label sits below the centred dots
        await update((h) => h.label.set('Loading orders'));
        const block = root.querySelector<HTMLElement>('#block')!;
        const blockLabel = [...block.querySelectorAll('span')].find((s) => s.textContent === 'Loading orders')!;
        const blockDots = block.querySelector('[data-busy-dots]')!.getBoundingClientRect();
        const rect = blockLabel.getBoundingClientRect();
        expect(rect.top).toBeGreaterThanOrEqual(blockDots.bottom - 1);
        expect(Math.abs(rect.left + rect.width / 2 - (blockDots.left + blockDots.width / 2))).toBeLessThanOrEqual(1);
    });

    it('block mode overlays the content and makes it inert while loading', async () => {
        const { host, root, block, inside, dots, update } = await setup();
        expect(getComputedStyle(block).display).toBe('block');
        expect(inside.closest('[inert]')).not.toBeNull();

        // the dots are centred over the content
        const rect = block.getBoundingClientRect();
        const box = block.querySelector('[data-busy-dots]')!.getBoundingClientRect();
        expect(Math.abs(box.left + box.width / 2 - (rect.left + rect.width / 2))).toBeLessThanOrEqual(1);
        expect(Math.abs(box.top + box.height / 2 - (rect.top + rect.height / 2))).toBeLessThanOrEqual(1);
        expect(dots(block)).toHaveLength(3);

        // the overlay covers the content and takes the clicks
        const button = inside.getBoundingClientRect();
        const hit = document.elementFromPoint(button.left + 2, button.top + 2)!;
        expect(inside.contains(hit)).toBe(false);
        expect(block.contains(hit)).toBe(true);
        // keyboard: the indicator takes the focus, the content is skipped
        root.querySelector<HTMLElement>('#before')!.focus();
        await userEvent.tab();
        expect(document.activeElement).toBe(block);
        await userEvent.tab();
        expect(document.activeElement).not.toBe(inside);
        inside.focus();
        expect(document.activeElement).not.toBe(inside);

        await update((h) => h.loading.set(false));
        expect(inside.closest('[inert]')).toBeNull();
        await userEvent.click(inside);
        expect(host.clicks()).toBe(1);
        expect(document.activeElement).toBe(inside);
    });

    it('size s, m, l and the contrast variant', async () => {
        const { standalone, dots, resolve, update } = await setup();
        const sizes: [BusyIndicatorSize, number][] = [
            ['s', 8],
            ['m', 16],
            ['l', 32]
        ];
        for (const [size, px] of sizes) {
            await update((h) => h.size.set(size));
            expect(dots().map((d) => d.offsetWidth)).toEqual([px, px, px]);
            expect(getComputedStyle(dots()[0]).borderRadius).not.toBe('0px');
        }
        expect(dots()[2].getBoundingClientRect().left).toBeGreaterThan(dots()[0].getBoundingClientRect().right);
        expect(getComputedStyle(dots()[0]).backgroundColor).toBe(resolve('--sapContent_BusyColor'));

        await update((h) => h.contrast.set(true));
        expect(getComputedStyle(dots()[0]).backgroundColor).toBe(resolve('--sapContent_ContrastIconColor'));
        // high contrast themes keep the busy colour
        document.documentElement.setAttribute('data-sap-theme', 'sap_horizon_hcb');
        expect(getComputedStyle(dots()[0]).backgroundColor).toBe(resolve('--sapContent_BusyColor'));
        expect(standalone.getBoundingClientRect().width).toBeGreaterThan(0);
    });

    it('respects prefers-reduced-motion', async () => {
        const { dots } = await setup();
        const animations = () => dots().map((d) => getComputedStyle(d).animationName);
        expect(animations().every((name) => name !== 'none')).toBe(true);
        expect(dots().map((d) => getComputedStyle(d).animationDelay)).toEqual(['0s', '0.2s', '0.4s']);

        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
        });
        expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
        expect(animations()).toEqual(['none', 'none', 'none']);
        // the dots stay visible
        for (const dot of dots()) expect(getComputedStyle(dot).opacity).toBe('1');
    });

    it('ariaLive announces the label; preventWheelEvents blocks scrolling of the covered content', async () => {
        const { root, block, update } = await setup();
        expect(block.hasAttribute('aria-live')).toBe(false);
        await update((h) => h.ariaLive.set('polite'));
        expect(block.getAttribute('aria-live')).toBe('polite');
        expect(block.getAttribute('aria-label')).toBe('Loading orders');

        const scroller = root.querySelector<HTMLElement>('#scroller')!;
        const wheel = async () => {
            scroller.scrollTop = 0;
            await userEvent.wheel(block, { delta: { y: 100 } });
            await new Promise((resolve) => setTimeout(resolve, 100));
            return scroller.scrollTop;
        };
        expect(await wheel()).toBeGreaterThan(0);

        await update((h) => h.preventWheel.set(true));
        expect(await wheel()).toBe(0);
        const event = new WheelEvent('wheel', { deltaY: 100, cancelable: true, bubbles: true });
        block.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);

        // only while loading
        await update((h) => h.loading.set(false));
        expect(block.hasAttribute('aria-live')).toBe(false);
        expect(await wheel()).toBeGreaterThan(0);
    });

    it('is inline-block by default and uses a custom ariaValueText while loading', async () => {
        const { standalone, update } = await setup();
        expect(getComputedStyle(standalone).display).toBe('inline-block');
        await update((h) => h.ariaValueText.set('Fetching orders'));
        expect(standalone.getAttribute('aria-valuetext')).toBe('Fetching orders');
        await update((h) => h.loading.set(false));
        expect(standalone.hasAttribute('aria-valuetext')).toBe(false);
    });

    it('sets aria-live assertive and off', async () => {
        const { block, update } = await setup();
        await update((h) => h.ariaLive.set('assertive'));
        expect(block.getAttribute('aria-live')).toBe('assertive');
        await update((h) => h.ariaLive.set('off'));
        expect(block.getAttribute('aria-live')).toBe('off');
    });

    it('stops blocking wheel events when preventWheelEvents turns off and removes the listener on destroy', async () => {
        const { fixture, block, update } = await setup();
        const wheel = () => {
            const event = new WheelEvent('wheel', { deltaY: 100, cancelable: true, bubbles: true });
            block.dispatchEvent(event);
            return event.defaultPrevented;
        };
        await update((h) => h.preventWheel.set(true));
        expect(wheel()).toBe(true);
        await update((h) => h.preventWheel.set(false));
        expect(wheel()).toBe(false);

        await update((h) => h.preventWheel.set(true));
        expect(wheel()).toBe(true);
        const removed = vi.spyOn(block, 'removeEventListener');
        fixture.destroy();
        expect(removed).toHaveBeenCalledWith('wheel', expect.any(Function));
        expect(wheel()).toBe(false);
    });
});
