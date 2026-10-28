import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { FD_DEFAULT_TITLE_SIZE, Title, type HeaderSize } from './title';

@Component({
    imports: [Title],
    template: `
        <h1 fdTitle data-testid="h1">Heading 1</h1>
        <h2 fdTitle data-testid="h2">Heading 2</h2>
        <h3 fdTitle data-testid="h3">Heading 3</h3>
        <h4 fdTitle data-testid="h4">Heading 4</h4>
        <h5 fdTitle data-testid="h5">Heading 5</h5>
        <h6 fdTitle data-testid="h6">Heading 6</h6>
        <div fdTitle data-testid="div">Not a heading</div>
        <h1 fdTitle [headerSize]="size()" data-testid="sized">Styled smaller</h1>
        <div style="width: 150px">
            <h2 fdTitle [wrap]="wrap()" [twoLineClamp]="clamp()" class="text-sap-negative-color" data-testid="long">
                {{ text }}
            </h2>
        </div>
    `
})
class Host {
    readonly size = signal<HeaderSize | null>(4);
    readonly wrap = signal(false);
    readonly clamp = signal(false);
    readonly text = 'A long title that does not fit into the narrow container at all and needs several lines';
}

@Component({
    imports: [Title],
    providers: [{ provide: FD_DEFAULT_TITLE_SIZE, useValue: 5 }],
    template: `
        <h2 fdTitle data-testid="default">Dialog title</h2>
        <h2 fdTitle [headerSize]="3" data-testid="explicit">Explicit</h2>
    `
})
class DefaultSizeHost {}

async function render<T>(type: new () => T) {
    const fixture = TestBed.createComponent(type);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
    return { fixture, host: fixture.componentInstance, el };
}

const fontSize = (element: HTMLElement) => getComputedStyle(element).fontSize;

/** Font size of the theme variable `--sapFontHeader<n>Size` in px. */
function headerSize(level: number): string {
    const probe = document.createElement('div');
    probe.style.fontSize = `var(--sapFontHeader${level}Size)`;
    document.body.appendChild(probe);
    const size = getComputedStyle(probe).fontSize;
    probe.remove();
    return size;
}

describe('Title', () => {
    it('stays a semantic heading and follows the heading level by default', async () => {
        const { el } = await render(Host);
        for (const level of [1, 2, 3, 4, 5, 6]) {
            const heading = el(`h${level}`);
            expect(heading.tagName).toBe(`H${level}`);
            expect(fontSize(heading)).toBe(headerSize(level));
        }
        // larger levels are smaller
        expect(parseFloat(fontSize(el('h1')))).toBeGreaterThan(parseFloat(fontSize(el('h6'))));
        // other elements use header size 5
        expect(fontSize(el('div'))).toBe(headerSize(5));
    });

    it('uses the SAP header typography', async () => {
        const { el } = await render(Host);
        const style = getComputedStyle(el('h2'));
        expect(style.fontWeight).toBe('400');
        expect(style.margin).toBe('0px');
        const probe = document.createElement('div');
        probe.style.color = 'var(--sapTextColor)';
        probe.style.fontFamily = 'var(--sapFontHeaderFamily)';
        document.body.appendChild(probe);
        expect(style.color).toBe(getComputedStyle(probe).color);
        expect(style.fontFamily).toBe(getComputedStyle(probe).fontFamily);
        probe.remove();
    });

    it('headerSize overrides the visual size independent of the heading level', async () => {
        const { fixture, host, el } = await render(Host);
        expect(el('sized').tagName).toBe('H1');
        expect(fontSize(el('sized'))).toBe(headerSize(4));

        host.size.set(6);
        await fixture.whenStable();
        expect(fontSize(el('sized'))).toBe(headerSize(6));

        host.size.set(null);
        await fixture.whenStable();
        expect(fontSize(el('sized'))).toBe(headerSize(1));
    });

    it('FD_DEFAULT_TITLE_SIZE sets the size for titles without headerSize', async () => {
        const { el } = await render(DefaultSizeHost);
        expect(fontSize(el('default'))).toBe(headerSize(5));
        expect(fontSize(el('explicit'))).toBe(headerSize(3));
    });

    it('truncates long titles on one line by default', async () => {
        const { el } = await render(Host);
        const long = el('long');
        const style = getComputedStyle(long);
        expect(style.whiteSpace).toBe('nowrap');
        expect(style.textOverflow).toBe('ellipsis');
        expect(long.scrollWidth).toBeGreaterThan(long.clientWidth);
        expect(long.getBoundingClientRect().height).toBeLessThan(parseFloat(style.fontSize) * 2);
    });

    it('wrap shows the whole title on several lines', async () => {
        const { fixture, host, el } = await render(Host);
        const oneLine = el('long').getBoundingClientRect().height;
        host.wrap.set(true);
        await fixture.whenStable();
        const long = el('long');
        expect(getComputedStyle(long).whiteSpace).toBe('normal');
        expect(long.getBoundingClientRect().height).toBeGreaterThan(oneLine * 2.5);
        expect(long.scrollWidth).toBeLessThanOrEqual(long.clientWidth);
    });

    it('twoLineClamp clamps the title to two lines', async () => {
        const { fixture, host, el } = await render(Host);
        const oneLine = el('long').getBoundingClientRect().height;
        host.clamp.set(true);
        await fixture.whenStable();
        const long = el('long');
        expect(getComputedStyle(long).webkitLineClamp).toBe('2');
        expect(long.getBoundingClientRect().height).toBeCloseTo(oneLine * 2, 0);
        expect(long.scrollHeight).toBeGreaterThan(long.clientHeight);
    });

    it('merges a user class', async () => {
        const { el } = await render(Host);
        const probe = document.createElement('div');
        probe.style.color = 'var(--sapNegativeColor)';
        document.body.appendChild(probe);
        expect(getComputedStyle(el('long')).color).toBe(getComputedStyle(probe).color);
        probe.remove();
    });

    it('exposes the host element through elementRef', async () => {
        const { fixture, el } = await render(Host);
        const titles = fixture.debugElement.queryAll(By.directive(Title));
        const sized = titles.find((title) => title.nativeElement === el('sized'))!;
        expect((sized.componentInstance as Title).elementRef.nativeElement).toBe(el('sized'));
    });
});
