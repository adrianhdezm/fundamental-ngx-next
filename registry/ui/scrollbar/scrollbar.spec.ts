import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Scrollbar } from './scrollbar';

@Component({
    imports: [Scrollbar],
    template: `
        <div
            fdScrollbar
            #bar="fdScrollbar"
            tabindex="0"
            [noHorizontalScroll]="noX()"
            [noVerticalScroll]="noY()"
            [alwaysVisible]="always()"
            style="width: 200px; height: 100px"
        >
            <div #inner [style.width.px]="contentWidth()" [style.height.px]="contentHeight()">Content</div>
        </div>
    `
})
class Host {
    readonly noX = signal(false);
    readonly noY = signal(false);
    readonly always = signal(false);
    readonly contentWidth = signal(600);
    readonly contentHeight = signal(400);
    readonly bar = viewChild.required<Scrollbar>('bar');
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const element = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[fdScrollbar]')!;
    return { fixture, host: fixture.componentInstance, element };
}

/** Resolves a theme color variable to the computed rgb() string. */
function themeColor(variable: string): string {
    const probe = document.createElement('div');
    probe.style.color = `var(${variable})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
}

describe('Scrollbar', () => {
    it('applies the SAP scrollbar colors', async () => {
        const { element } = await setup();
        const face = themeColor('--sapScrollBar_FaceColor');
        const track = themeColor('--sapScrollBar_TrackColor');
        expect(getComputedStyle(element).scrollbarColor).toBe(`${face} ${track}`);
    });

    it('is a CdkScrollable registered with the scroll dispatcher', async () => {
        const { fixture, element } = await setup();
        const scrollable = fixture.debugElement.query((d) => d.nativeElement === element).injector.get(CdkScrollable);
        expect(scrollable.getElementRef().nativeElement).toBe(element);
        const dispatcher = TestBed.inject(ScrollDispatcher);
        expect(dispatcher.scrollContainers.has(scrollable)).toBe(true);
        const inner = element.firstElementChild as HTMLElement;
        expect(dispatcher.getAncestorScrollContainers(inner)).toContain(scrollable);

        let scrolled = 0;
        const sub = dispatcher.scrolled(0).subscribe(() => scrolled++);
        element.scrollTop = 50;
        element.dispatchEvent(new Event('scroll'));
        expect(scrolled).toBe(1);
        sub.unsubscribe();
    });

    it('scrolls in both directions by default and only when needed', async () => {
        const { element } = await setup();
        const style = getComputedStyle(element);
        expect(style.overflowX).toBe('auto');
        expect(style.overflowY).toBe('auto');
        expect(element.scrollHeight).toBeGreaterThan(element.clientHeight);
        expect(element.scrollWidth).toBeGreaterThan(element.clientWidth);
    });

    it('noHorizontalScroll hides the horizontal overflow', async () => {
        const { fixture, host, element } = await setup();
        host.noX.set(true);
        await fixture.whenStable();
        expect(getComputedStyle(element).overflowX).toBe('hidden');
        expect(getComputedStyle(element).overflowY).toBe('auto');
    });

    it('noVerticalScroll hides the vertical overflow', async () => {
        const { fixture, host, element } = await setup();
        host.noY.set(true);
        await fixture.whenStable();
        expect(getComputedStyle(element).overflowY).toBe('hidden');
        expect(getComputedStyle(element).overflowX).toBe('auto');
    });

    it('alwaysVisible shows the scrollbars even when the content fits', async () => {
        const { fixture, host, element } = await setup();
        host.contentWidth.set(100);
        host.contentHeight.set(50);
        host.always.set(true);
        await fixture.whenStable();
        const style = getComputedStyle(element);
        expect(style.overflowX).toBe('scroll');
        expect(style.overflowY).toBe('scroll');
        // noHorizontalScroll still wins over alwaysVisible
        host.noX.set(true);
        await fixture.whenStable();
        expect(getComputedStyle(element).overflowX).toBe('hidden');
        expect(getComputedStyle(element).overflowY).toBe('scroll');
    });

    it('scroll() scrolls the element', async () => {
        const { host, element } = await setup();
        host.bar().scroll({ top: 120, left: 80 });
        expect(element.scrollTop).toBe(120);
        expect(element.scrollLeft).toBe(80);
    });
});
