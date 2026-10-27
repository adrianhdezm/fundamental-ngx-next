import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ScrollSpy } from './scroll-spy';

@Component({
    imports: [ScrollSpy],
    template: `
        <div
            fdScrollSpy
            [trackedTags]="tags()"
            [targetPercent]="percent()"
            [targetOffset]="offset()"
            [fireEmpty]="fireEmpty()"
            [scrollSpyDisabled]="disabled()"
            (spyChange)="spied.push($event?.id)"
            style="height: 200px; overflow: auto"
        >
            <p id="lead" style="height: 50px; margin: 0">Lead</p>
            <section id="one" style="height: 200px">One</section>
            <h2 id="h-two" style="height: 50px; margin: 0">Heading</h2>
            <section id="two" style="height: 200px">Two</section>
            <section id="three" style="height: 200px">Three</section>
            <section id="four" style="height: 200px">Four</section>
        </div>
    `
})
class Host {
    readonly tags = signal(['section']);
    readonly percent = signal(0);
    readonly offset = signal(0);
    readonly fireEmpty = signal(false);
    readonly disabled = signal(false);
    readonly spied: (string | undefined)[] = [];
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function setup(config: Partial<{ tags: string[]; percent: number; offset: number; fireEmpty: boolean }> = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.tags) host.tags.set(config.tags);
    if (config.percent !== undefined) host.percent.set(config.percent);
    if (config.offset !== undefined) host.offset.set(config.offset);
    if (config.fireEmpty !== undefined) host.fireEmpty.set(config.fireEmpty);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await frame();
    await frame();
    const container = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[fdScrollSpy]')!;
    const scrollTo = async (top: number) => {
        container.scrollTop = top;
        container.dispatchEvent(new Event('scroll'));
        await fixture.whenStable();
    };
    return { fixture, host, container, scrollTo };
}

// Offsets from the first child: lead 0, one 50, h-two 250, two 300, three 500, four 700.
describe('ScrollSpy', () => {
    it('emits once on render with the tracked child at the top', async () => {
        const { host } = await setup({ tags: ['p', 'section'] });
        expect(host.spied).toEqual(['lead']);
    });

    it('emits spyChange with the section nearest the top while scrolling', async () => {
        const { host, scrollTo } = await setup();
        host.spied.length = 0;
        await scrollTo(60);
        expect(host.spied).toEqual(['one']);
        // no new emission while the same section stays at the top
        await scrollTo(150);
        expect(host.spied).toEqual(['one']);
        await scrollTo(320);
        await scrollTo(520);
        expect(host.spied).toEqual(['one', 'two', 'three']);
        // and back up
        await scrollTo(310);
        expect(host.spied).toEqual(['one', 'two', 'three', 'two']);
    });

    it('trackedTags filters the children', async () => {
        const { host, scrollTo } = await setup({ tags: ['h2'] });
        expect(host.spied).toEqual([undefined]);
        host.spied.length = 0;
        await scrollTo(100);
        expect(host.spied).toEqual([]);
        await scrollTo(260);
        await scrollTo(600);
        // h2 stays the spied element, sections are ignored
        expect(host.spied).toEqual(['h-two']);
    });

    it('matches tag names case-insensitively and tracks several tags', async () => {
        const { host, scrollTo } = await setup({ tags: ['SECTION', 'H2'] });
        host.spied.length = 0;
        await scrollTo(60);
        await scrollTo(260);
        await scrollTo(310);
        expect(host.spied).toEqual(['one', 'h-two', 'two']);
    });

    it('targetOffset moves the reach line', async () => {
        const { host, scrollTo } = await setup({ offset: 100 });
        host.spied.length = 0;
        // 'two' is at 300; with the offset it is reached at scrollTop 200
        await scrollTo(210);
        expect(host.spied).toEqual(['two']);
    });

    it('targetPercent counts part of the container height as reached', async () => {
        const { host, scrollTo } = await setup({ percent: 0.5 });
        host.spied.length = 0;
        // reach line at scrollTop + 100: 'two' (300) is reached at 200
        await scrollTo(210);
        expect(host.spied).toEqual(['two']);
    });

    it('fireEmpty emits undefined when no tracked child is reached yet', async () => {
        const { host, scrollTo } = await setup({ tags: ['h2'], fireEmpty: true });
        await scrollTo(260);
        expect(host.spied.at(-1)).toBe('h-two');
        await scrollTo(0);
        expect(host.spied.at(-1)).toBeUndefined();
    });

    it('without fireEmpty, scrolling back above all tracked children keeps the last one', async () => {
        const { host, scrollTo } = await setup({ tags: ['h2'] });
        await scrollTo(260);
        host.spied.length = 0;
        await scrollTo(0);
        expect(host.spied).toEqual([]);
    });

    it('scrollSpyDisabled stops the emissions', async () => {
        const { fixture, host, scrollTo } = await setup();
        host.disabled.set(true);
        await fixture.whenStable();
        host.spied.length = 0;
        await scrollTo(520);
        expect(host.spied).toEqual([]);
        host.disabled.set(false);
        await fixture.whenStable();
        await scrollTo(530);
        expect(host.spied).toEqual(['three']);
    });

    it('re-emits the current child when the container is resized', async () => {
        const { host, container, scrollTo } = await setup();
        await scrollTo(320);
        host.spied.length = 0;
        container.style.height = '250px';
        await frame();
        await frame();
        expect(host.spied).toEqual(['two']);
    });
});
