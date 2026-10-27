import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
    DynamicSideContent,
    DynamicSideContentMain,
    DynamicSideContentSide,
    type DynamicSideContentPosition,
    type DynamicSideContentSize
} from './dynamic-side-content';

@Component({
    imports: [DynamicSideContent, DynamicSideContentMain, DynamicSideContentSide],
    template: `
        <div style="width: 1000px">
            @if (sideFirst()) {
                <fd-dynamic-side-content [position]="position()" [size]="size()">
                    <fd-dynamic-side-content-side id="side"><div class="h-10">Side</div></fd-dynamic-side-content-side>
                    <fd-dynamic-side-content-main id="main"><div class="h-10">Main</div></fd-dynamic-side-content-main>
                </fd-dynamic-side-content>
            } @else {
                <fd-dynamic-side-content [position]="position()" [size]="size()">
                    <fd-dynamic-side-content-main id="main"><div class="h-10">Main</div></fd-dynamic-side-content-main>
                    <fd-dynamic-side-content-side id="side"><div class="h-10">Side</div></fd-dynamic-side-content-side>
                </fd-dynamic-side-content>
            }
        </div>
    `
})
class Host {
    readonly position = signal<DynamicSideContentPosition>('none');
    readonly size = signal<DynamicSideContentSize>('xl');
    readonly sideFirst = signal(false);
}

async function setup(config: {
    position?: DynamicSideContentPosition;
    size?: DynamicSideContentSize;
    sideFirst?: boolean;
}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.position) host.position.set(config.position);
    if (config.size) host.size.set(config.size);
    if (config.sideFirst) host.sideFirst.set(true);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const stable = () => fixture.whenStable();
    return {
        fixture,
        host,
        root,
        stable,
        order: () =>
            [...root.querySelector('fd-dynamic-side-content')!.children].map((child) =>
                child.hasAttribute('data-dsc-main') ? 'main' : 'side'
            ),
        rect: (id: 'main' | 'side') => root.querySelector(`#${id}`)!.getBoundingClientRect(),
        display: (id: 'main' | 'side') => getComputedStyle(root.querySelector(`#${id}`)!).display
    };
}

describe('DynamicSideContent', () => {
    it('position left/right/bottom renders the side content before/after the main content in the DOM', async () => {
        const left = await setup({ position: 'left' });
        expect(left.order()).toEqual(['side', 'main']);
        expect(left.rect('side').left).toBeLessThan(left.rect('main').left);
        left.fixture.destroy();

        const right = await setup({ position: 'right', sideFirst: true });
        expect(right.order()).toEqual(['main', 'side']);
        expect(right.rect('side').left).toBeGreaterThan(right.rect('main').left);
        right.fixture.destroy();

        const bottom = await setup({ position: 'bottom', sideFirst: true });
        expect(bottom.order()).toEqual(['main', 'side']);
    });

    it('moves the side content when the position changes', async () => {
        const { host, stable, order, root } = await setup({ position: 'right' });
        expect(order()).toEqual(['main', 'side']);
        host.position.set('left');
        await stable();
        expect(order()).toEqual(['side', 'main']);
        expect(root.querySelector('#side')!.textContent).toBe('Side');
        host.position.set('right');
        await stable();
        expect(order()).toEqual(['main', 'side']);
    });

    it('position none/equalSplit keeps the projected order', async () => {
        for (const position of ['none', 'equalSplit'] as const) {
            const mainFirst = await setup({ position });
            expect(mainFirst.order()).toEqual(['main', 'side']);
            mainFirst.fixture.destroy();
            const sideFirst = await setup({ position, sideFirst: true });
            expect(sideFirst.order()).toEqual(['side', 'main']);
            sideFirst.fixture.destroy();
        }
    });

    it('size sm hides the side content; md/lg give main 66.666%; xl 75%', async () => {
        const { host, stable, rect, display } = await setup({ position: 'right' });
        expect(rect('main').width).toBeCloseTo(750, 0);
        expect(rect('side').width).toBeCloseTo(250, 0);
        for (const size of ['md', 'lg'] as const) {
            host.size.set(size);
            await stable();
            expect(rect('main').width).toBeCloseTo(666.66, 0);
            expect(rect('side').width).toBeCloseTo(333.34, 0);
        }
        host.size.set('sm');
        await stable();
        expect(display('side')).toBe('none');
        expect(rect('main').width).toBe(1000);
    });

    it('bottom stacks vertically with full widths; equalSplit gives 50% each', async () => {
        const { host, stable, rect, display } = await setup({ position: 'bottom', size: 'md' });
        expect(rect('main').width).toBe(1000);
        expect(rect('side').width).toBe(1000);
        expect(rect('side').top).toBeGreaterThanOrEqual(rect('main').bottom);
        // the side content stays visible below the main content even on small sizes
        host.size.set('sm');
        await stable();
        expect(display('side')).toBe('block');
        expect(rect('side').width).toBe(1000);

        host.position.set('equalSplit');
        host.size.set('xl');
        await stable();
        expect(rect('main').width).toBe(500);
        expect(rect('side').width).toBe(500);
        expect(rect('side').top).toBe(rect('main').top);
    });
});
