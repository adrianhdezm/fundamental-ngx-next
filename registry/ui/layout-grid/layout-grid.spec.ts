import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { LayoutGrid, LayoutGridCol, LayoutGridRow } from './layout-grid';

@Component({
    imports: [LayoutGrid, LayoutGridCol],
    template: `
        <fd-layout-grid [noGap]="noGap()">
            <div id="a" fdLayoutGridCol="12" colMd="6"><div class="h-8">A</div></div>
            <div id="b" fdLayoutGridCol="12" colMd="6" colLg="4" colXl="3"><div class="h-8">B</div></div>
            <div id="c" fdLayoutGridCol="6" colOffset="6"><div class="h-8">C</div></div>
            <div id="d" fdLayoutGridCol="6" colOffset="0" colOffsetMd="3" colOffsetLg="6"><div class="h-8">D</div></div>
            <div id="outer" fdLayoutGridCol="12" colMd="6">
                <fd-layout-grid>
                    <div id="nested" fdLayoutGridCol><div class="h-8">Nested</div></div>
                </fd-layout-grid>
            </div>
        </fd-layout-grid>
        <fd-layout-grid>
            <div id="e" fdLayoutGridCol="3"><div class="h-8">E</div></div>
            <div id="f" fdLayoutGridCol colGrow><div class="h-8">F</div></div>
        </fd-layout-grid>
    `
})
class Host {
    readonly noGap = signal(false);
}

@Component({
    imports: [LayoutGrid, LayoutGridCol, LayoutGridRow],
    template: `
        <fd-layout-grid>
            <div fdLayoutGridRow id="row1"><div fdLayoutGridCol="6">1</div></div>
            <div fdLayoutGridRow id="row2"><div fdLayoutGridCol="6">2</div></div>
        </fd-layout-grid>
    `
})
class RowsHost {}

@Component({
    imports: [LayoutGrid, LayoutGridCol],
    template: `
        <fd-layout-grid
            class="custom-grid"
            [noGap]="noGap()"
            [noHorizontalGap]="noHorizontalGap()"
            [noVerticalGap]="noVerticalGap()"
        >
            <div id="dyn" class="custom-col" [fdLayoutGridCol]="span()" [colOffset]="offset()" [colGrow]="grow()">
                <div class="h-8">Dynamic</div>
            </div>
            <div id="rest" fdLayoutGridCol="3"><div class="h-8">Rest</div></div>
            <div id="invalid" fdLayoutGridCol="13" colMd="0" colOffset="13" colOffsetMd="-1">
                <div class="h-8">X</div>
            </div>
            <div id="xl" fdLayoutGridCol="6" colOffsetMd="1" colOffsetLg="2" colOffsetXl="4">
                <div class="h-8">XL</div>
            </div>
        </fd-layout-grid>
    `
})
class DynamicHost {
    readonly span = signal<number | undefined>(6);
    readonly offset = signal<number | undefined>(undefined);
    readonly grow = signal(false);
    readonly noGap = signal(false);
    readonly noHorizontalGap = signal(false);
    readonly noVerticalGap = signal(false);
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function setup<T = Host>(component: Type<T> = Host as Type<T>) {
    const fixture = TestBed.createComponent(component);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const el = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
    /** Share of the row (in twelfths) a column spans. */
    const span = (id: string) => {
        const col = el(id);
        return Math.round((col.getBoundingClientRect().width / col.parentElement!.clientWidth) * 12 * 100) / 100;
    };
    const offset = (id: string) => {
        const col = el(id);
        return Math.round((parseFloat(getComputedStyle(col).marginInlineStart) / col.parentElement!.clientWidth) * 12);
    };
    const resize = async (width: number) => {
        await page.viewport(width, 800);
        await frame();
        await fixture.whenStable();
    };
    return { fixture, host: fixture.componentInstance, root, el, span, offset, resize };
}

describe('LayoutGrid', () => {
    afterEach(async () => {
        await page.viewport(1280, 800);
    });

    it('columns span from the S/M/L/XL inputs and inherit upwards (600/1024/1440px breakpoints)', async () => {
        const { span, resize } = await setup();
        await resize(500);
        expect([span('a'), span('b'), span('c'), span('e')]).toEqual([12, 12, 6, 3]);
        await resize(800);
        expect([span('a'), span('b'), span('c')]).toEqual([6, 6, 6]);
        await resize(1100);
        expect([span('a'), span('b'), span('c')]).toEqual([6, 4, 6]);
        await resize(1500);
        expect([span('a'), span('b'), span('c')]).toEqual([6, 3, 6]);
    });

    it('columns of a row wrap and a growing column takes the remaining space', async () => {
        const { el, span, resize } = await setup();
        await resize(800);
        // A and B share a line, C wraps to the next one
        expect(el('a').getBoundingClientRect().top).toBe(el('b').getBoundingClientRect().top);
        expect(el('c').getBoundingClientRect().top).toBeGreaterThan(el('a').getBoundingClientRect().top);
        expect(el('f').getBoundingClientRect().top).toBe(el('e').getBoundingClientRect().top);
        expect(span('e') + span('f')).toBeCloseTo(12, 1);
        expect(el('f').getBoundingClientRect().right).toBeCloseTo(
            el('f').parentElement!.getBoundingClientRect().right,
            0
        );
    });

    it('offsets per breakpoint', async () => {
        const { offset, el, resize } = await setup();
        await resize(500);
        expect([offset('c'), offset('d')]).toEqual([6, 0]);
        await resize(800);
        expect([offset('c'), offset('d')]).toEqual([6, 3]);
        await resize(1100);
        expect([offset('c'), offset('d')]).toEqual([6, 6]);
        await resize(1500);
        expect([offset('c'), offset('d')]).toEqual([6, 6]);
        // the offset column ends at the end of the row
        const row = el('c').parentElement!.getBoundingClientRect();
        expect(el('c').getBoundingClientRect().right).toBeCloseTo(row.right, 0);
    });

    it('nested grids do not inherit the parent spans', async () => {
        const { span, resize } = await setup();
        for (const width of [500, 800, 1100, 1500]) {
            await resize(width);
            expect(span('nested')).toBe(12);
        }
        expect(span('outer')).toBe(6);
    });

    it('noGap removes the gutters', async () => {
        const { host, fixture, el, resize } = await setup();
        await resize(800);
        const style = () => getComputedStyle(el('a'));
        expect(style().paddingInlineStart).toBe('8px');
        expect(style().paddingTop).toBe('8px');
        expect(getComputedStyle(el('a').parentElement!).marginInlineStart).toBe('-8px');
        await resize(500);
        expect(style().paddingInlineStart).toBe('4px');
        expect(style().paddingTop).toBe('4px');

        host.noGap.set(true);
        await fixture.whenStable();
        expect(style().paddingInlineStart).toBe('0px');
        expect(style().paddingTop).toBe('0px');
        expect(getComputedStyle(el('a').parentElement!).marginInlineStart).toBe('0px');
    });

    it('adds a row only when the grid has no explicit rows', async () => {
        const { root } = await setup();
        const grid = root.querySelector('fd-layout-grid')!;
        expect([...grid.children].map((c) => c.hasAttribute('data-fd-row'))).toEqual([true]);
        expect(grid.firstElementChild!.querySelector('#a')).not.toBeNull();

        const rows = TestBed.createComponent(RowsHost);
        document.body.appendChild(rows.nativeElement);
        await rows.whenStable();
        const rowsGrid = (rows.nativeElement as HTMLElement).querySelector('fd-layout-grid')!;
        expect([...rowsGrid.children].map((c) => c.id)).toEqual(['row1', 'row2']);
    });

    it('ignores spans and offsets outside 1-12', async () => {
        const { span, offset, resize } = await setup(DynamicHost);
        await resize(500);
        expect([span('invalid'), offset('invalid')]).toEqual([12, 0]);
        // invalid md values fall back to the (default) smaller breakpoint values
        await resize(800);
        expect([span('invalid'), offset('invalid')]).toEqual([12, 0]);
    });

    it('colOffsetXl applies from 1440px', async () => {
        const { offset, resize } = await setup(DynamicHost);
        await resize(500);
        expect(offset('xl')).toBe(0);
        await resize(800);
        expect(offset('xl')).toBe(1);
        await resize(1100);
        expect(offset('xl')).toBe(2);
        await resize(1439);
        expect(offset('xl')).toBe(2);
        await resize(1500);
        expect(offset('xl')).toBe(4);
    });

    it('updates span, offset and grow when inputs change', async () => {
        const { fixture, host, span, offset, resize } = await setup(DynamicHost);
        await resize(800);
        expect([span('dyn'), offset('dyn')]).toEqual([6, 0]);

        host.span.set(4);
        host.offset.set(2);
        await fixture.whenStable();
        expect([span('dyn'), offset('dyn')]).toEqual([4, 2]);

        host.offset.set(undefined);
        host.grow.set(true);
        await fixture.whenStable();
        // a growing column takes what the 3-column sibling leaves
        expect(span('dyn')).toBeCloseTo(9, 1);

        host.grow.set(false);
        host.span.set(undefined);
        await fixture.whenStable();
        expect(span('dyn')).toBe(12);
    });

    it('noHorizontalGap removes only the inline gutters and noVerticalGap only the block gutters', async () => {
        const { fixture, host, el, resize } = await setup(DynamicHost);
        await resize(800);
        const style = () => getComputedStyle(el('dyn'));
        const rowMargin = () => getComputedStyle(el('dyn').parentElement!).marginInlineStart;

        host.noHorizontalGap.set(true);
        await fixture.whenStable();
        expect(style().paddingInlineStart).toBe('0px');
        expect(rowMargin()).toBe('0px');
        expect(style().paddingTop).toBe('8px');

        host.noHorizontalGap.set(false);
        host.noVerticalGap.set(true);
        await fixture.whenStable();
        expect(style().paddingInlineStart).toBe('8px');
        expect(rowMargin()).toBe('-8px');
        expect(style().paddingTop).toBe('0px');
    });

    it('merges a user class onto the column and grid', async () => {
        const { root, el } = await setup(DynamicHost);
        const grid = root.querySelector<HTMLElement>('fd-layout-grid')!;
        expect(grid.classList).toContain('custom-grid');
        expect(grid.classList).toContain('flex');
        expect(el('dyn').classList).toContain('custom-col');
        expect(el('dyn').classList).toContain('box-border');
    });
});
