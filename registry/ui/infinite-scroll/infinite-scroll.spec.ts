import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { InfiniteScroll } from './infinite-scroll';

@Component({
    imports: [InfiniteScroll],
    template: `
        <div
            fdInfiniteScroll
            [scrollPercent]="percent()"
            [scrollOffset]="offset()"
            (onScrollAction)="load()"
            style="height: 200px; overflow: auto"
        >
            @for (item of items(); track item) {
                <div style="height: 50px">Item {{ item }}</div>
            }
        </div>
    `
})
class Host {
    readonly percent = signal(75);
    readonly offset = signal<number | null>(null);
    readonly items = signal(Array.from({ length: 20 }, (_, i) => i));
    loads = 0;

    load(): void {
        this.loads++;
    }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function setup(config: { percent?: number; offset?: number } = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.percent !== undefined) host.percent.set(config.percent);
    if (config.offset !== undefined) host.offset.set(config.offset);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const scroller = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[fdInfiniteScroll]')!;
    const scrollTo = async (top: number) => {
        scroller.scrollTop = top;
        scroller.dispatchEvent(new Event('scroll'));
        await wait(100);
    };
    return { fixture, host, scroller, scrollTo };
}

describe('InfiniteScroll', () => {
    // content 1000px, viewport 200px: 75% is passed once scrollTop + 200 > 750
    it('emits onScrollAction when the scroll position is within scrollPercent of the end', async () => {
        const { host, scrollTo } = await setup();
        await scrollTo(400);
        expect(host.loads).toBe(0);
        await scrollTo(600);
        expect(host.loads).toBe(1);
    });

    it('follows a custom scrollPercent', async () => {
        const { host, scrollTo } = await setup({ percent: 30 });
        await scrollTo(50);
        expect(host.loads).toBe(0);
        await scrollTo(150);
        expect(host.loads).toBe(1);
    });

    it('scrollOffset fires within that many pixels of the end instead of a percentage', async () => {
        const { host, scrollTo } = await setup({ offset: 20 });
        // past 75 %, but still more than 20px from the end
        await scrollTo(700);
        expect(host.loads).toBe(0);
        await scrollTo(790);
        expect(host.loads).toBe(1);
    });

    it('debounces a burst of scroll events into one emission', async () => {
        const { host, scroller } = await setup();
        for (const top of [600, 650, 700, 750, 800]) {
            scroller.scrollTop = top;
            scroller.dispatchEvent(new Event('scroll'));
        }
        expect(host.loads).toBe(0);
        await wait(100);
        expect(host.loads).toBe(1);
    });

    it('does not emit again after more content moved the end away', async () => {
        const { fixture, host, scrollTo } = await setup();
        await scrollTo(600);
        expect(host.loads).toBe(1);

        host.items.set(Array.from({ length: 40 }, (_, i) => i));
        await fixture.whenStable();
        // 800px of 2000px is only 40 %
        await scrollTo(600);
        expect(host.loads).toBe(1);
        await scrollTo(1600);
        expect(host.loads).toBe(2);
    });

    it('listens to its own scroll container only', async () => {
        const { host, fixture } = await setup();
        const outer = document.createElement('div');
        outer.style.cssText = 'height: 100px; overflow: auto';
        outer.appendChild(fixture.nativeElement);
        document.body.appendChild(outer);
        outer.scrollTop = 1000;
        outer.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('scroll'));
        await wait(100);
        expect(host.loads).toBe(0);
        outer.remove();
    });

    it('stops listening when destroyed', async () => {
        const { fixture, host, scroller } = await setup();
        fixture.destroy();
        scroller.scrollTop = 800;
        scroller.dispatchEvent(new Event('scroll'));
        await wait(100);
        expect(host.loads).toBe(0);
    });
});
