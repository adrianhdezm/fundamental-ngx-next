import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    ResizableCardItem,
    ResizableCardLayout,
    type ResizableCardItemConfig,
    type ResizableCardLayoutConfig,
    type ResizedEvent
} from './resizable-card-layout';

const card = (title: string, config: Partial<ResizableCardItemConfig> = {}): ResizableCardItemConfig => ({
    title,
    cardWidthColSpan: 1,
    cardHeightRowSpan: 10,
    cardMiniHeaderRowSpan: 3,
    cardMiniContentRowSpan: 5,
    ...config
});

const FIVE = ['A', 'B', 'C', 'D', 'E'].map((title, i) => card(title, { rank: i + 1 }));

@Component({
    imports: [ResizableCardLayout, ResizableCardItem],
    template: `
        <button id="before">Before</button>
        <div [style.width.px]="width()">
            <fd-resizable-card-layout
                (stepChange)="steps.push($event)"
                (resizing)="resizings.push($event)"
                (resized)="resizeds.push($event)"
                (miniHeaderReached)="miniHeader.push($event)"
                (miniContentReached)="miniContent.push($event)"
                (layoutChange)="layouts.push($event)"
            >
                @for (item of cards(); track item.title) {
                    <fd-resizable-card-item [config]="item">
                        <div class="h-full bg-sap-tile-background">{{ item.title }}</div>
                    </fd-resizable-card-item>
                }
            </fd-resizable-card-layout>
        </div>
    `
})
class Host {
    readonly width = signal(1500);
    readonly cards = signal<ResizableCardItemConfig[]>(FIVE);
    readonly steps: ResizedEvent[] = [];
    readonly resizings: ResizedEvent[] = [];
    readonly resizeds: ResizedEvent[] = [];
    readonly miniHeader: ResizedEvent[] = [];
    readonly miniContent: ResizedEvent[] = [];
    readonly layouts: ResizableCardLayoutConfig[] = [];
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function setup(config: Partial<{ width: number; cards: ResizableCardItemConfig[] }> = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.width) host.width.set(config.width);
    if (config.cards) host.cards.set(config.cards);
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await frame();
        await fixture.whenStable();
    };
    await stable();
    const root = fixture.nativeElement as HTMLElement;
    const layout = root.querySelector<HTMLElement>('fd-resizable-card-layout')!;
    const items = () => [...root.querySelectorAll<HTMLElement>('fd-resizable-card-item')];
    const item = (title: string) => items().find((i) => i.getAttribute('aria-label') === title)!;
    /** Position from the styles (the cards animate to it). */
    const position = (title: string) => {
        const el = item(title);
        return [parseFloat(el.style.insetInlineStart), parseFloat(el.style.top)];
    };
    /** Width and height of the card box. */
    const size = (title: string) => {
        const box = item(title).querySelector<HTMLElement>('.flex.transition-\\[width\\,height\\]')!;
        return [parseFloat(box.style.width), parseFloat(box.style.height)];
    };
    const handle = (title: string, cursor: 'ew' | 'ns' | 'nwse') =>
        item(title).querySelector<HTMLElement>(`.cursor-${cursor}-resize`);
    return { fixture, host, root, stable, layout, items, item, position, size, handle };
}

/** Drags a handle by dx/dy in steps, with pointer events. */
async function drag(handle: HTMLElement, dx: number, dy: number, steps = 10, release = true) {
    const box = handle.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const fire = (target: EventTarget, type: string, cx: number, cy: number) =>
        target.dispatchEvent(
            new PointerEvent(type, {
                bubbles: true,
                cancelable: true,
                clientX: cx,
                clientY: cy,
                pointerId: 1,
                button: 0
            })
        );
    fire(handle, 'pointerdown', x, y);
    for (let step = 1; step <= steps; step++) {
        fire(document, 'pointermove', x + (dx * step) / steps, y + (dy * step) / steps);
        await frame();
    }
    const end = { x: x + dx, y: y + dy };
    if (release) fire(document, 'pointerup', end.x, end.y);
    await frame();
    return {
        move: async (mx: number, my: number) => {
            fire(document, 'pointermove', x + mx, y + my);
            await frame();
        },
        up: async () => {
            fire(document, 'pointerup', end.x, end.y);
            await frame();
        }
    };
}

afterEach(() => {
    document.documentElement.removeAttribute('dir');
});

describe('ResizableCardLayout', () => {
    it('layout size from the available width (≤656 sm, ≤975 md, ≤1359 lg, else xl) sets 1–4 columns and paddings', async () => {
        const { host, layout, stable, position } = await setup();
        const cases: [number, number, number, number][] = [
            // available width, layout width, padding, columns
            [1500, 1424, 48, 4],
            [1359, 1024, 16, 3],
            [975, 688, 16, 2],
            [656, 336, 8, 1]
        ];
        for (const [width, layoutWidth, padding, columns] of cases) {
            host.width.set(width);
            await stable();
            expect(parseFloat(layout.style.width)).toBe(layoutWidth);
            expect(getComputedStyle(layout).paddingLeft).toBe(`${padding}px`);
            // the first row holds one card per column
            const firstRow = ['A', 'B', 'C', 'D'].filter((t) => position(t)[1] === 0);
            expect(firstRow).toHaveLength(columns);
            expect(position('A')[0]).toBe(padding);
            if (columns > 1) expect(position('B')[0]).toBe(padding + 336);
        }
        host.width.set(1360);
        await stable();
        expect(parseFloat(layout.style.width)).toBe(1424);
    });

    it('cards are placed by rank at the topmost position where they fit (layout height = highest column + 1rem)', async () => {
        const { layout, position } = await setup({
            cards: [
                card('A', { rank: 1, cardHeightRowSpan: 20 }),
                card('B', { rank: 2, cardWidthColSpan: 2, cardHeightRowSpan: 10 }),
                card('C', { rank: 3, cardHeightRowSpan: 5 }),
                // ranks decide the order, not the content order
                card('E', { rank: 5, cardWidthColSpan: 3, cardHeightRowSpan: 5 }),
                card('D', { rank: 4, cardHeightRowSpan: 15 })
            ]
        });
        expect(position('A')).toEqual([48, 0]);
        expect(position('B')).toEqual([48 + 336, 0]);
        expect(position('C')).toEqual([48 + 3 * 336, 0]);
        // D goes under C, the lowest column
        expect(position('D')).toEqual([48 + 3 * 336, 80 + 16]);
        // E (3 columns) does not fit under B and C next to the taller D, so it goes below A
        expect(position('E')).toEqual([48, 320 + 16]);
        // highest column (A and E) + 1rem
        expect(parseFloat(layout.style.height)).toBe(336 + 80 + 16);
    });

    it('cards are focusable groups named by their title', async () => {
        const { item } = await setup();
        const a = item('A');
        expect(a.getAttribute('role')).toBe('group');
        expect(a.getAttribute('tabindex')).toBe('0');
        expect(a.id).toMatch(/^fd-card-item-/);
    });

    it('card widths are limited to the columns and restored when there is room again', async () => {
        const { host, stable, size } = await setup({
            cards: [card('A', { rank: 1, cardWidthColSpan: 3 }), card('B', { rank: 2 })]
        });
        expect(size('A')[0]).toBe(3 * 320 + 2 * 16);
        host.width.set(900);
        await stable();
        expect(size('A')[0]).toBe(2 * 320 + 16);
        expect(host.resizeds.at(-1)!.cardWidthColSpan).toBe(2);
        host.width.set(600);
        await stable();
        expect(size('A')[0]).toBe(320);
        host.width.set(1500);
        await stable();
        expect(size('A')[0]).toBe(3 * 320 + 2 * 16);
    });

    it('dragging the right edge/corner snaps the width to columns once past half a column (emits stepChange, resized)', async () => {
        const { host, stable, size, handle, item } = await setup();
        const { resizeds, resizings } = host;
        const edge = handle('A', 'ew')!;
        expect(edge).not.toBeNull();

        // less than half a column: back to one column
        await drag(edge, 120, 0);
        await stable();
        expect(size('A')[0]).toBe(320);
        expect(resizings.length).toBeGreaterThan(0);
        expect(resizeds.at(-1)!.cardWidthColSpan).toBe(1);

        // past half a column: two columns
        const steps = host.steps.length;
        const resized = resizeds.length;
        await drag(handle('A', 'ew')!, 200, 0);
        await stable();
        expect(size('A')[0]).toBe(2 * 320 + 16);
        expect(host.steps.length).toBeGreaterThan(steps);
        expect(resizeds.length).toBeGreaterThan(resized);
        expect(resizeds.at(-1)).toMatchObject({ cardWidthColSpan: 2, prevCardWidth: 320, cardWidth: 656 });

        // the corner appears on hover and resizes both ways
        expect(handle('A', 'nwse')).toBeNull();
        await userEvent.hover(item('A').querySelector<HTMLElement>('.flex-1')!);
        await stable();
        const corner = handle('A', 'nwse')!;
        expect(corner).not.toBeNull();
        await drag(corner, -200, 45);
        await stable();
        expect(size('A')).toEqual([320, 208]);
        expect(resizeds.at(-1)).toMatchObject({ cardWidthColSpan: 1, cardHeightRowSpan: 13 });
    });

    it('the card shows a dashed frame while resizing and an indication of the next column', async () => {
        const { handle, item, stable } = await setup();
        const frameBox = item('A').firstElementChild as HTMLElement;
        expect(getComputedStyle(frameBox).borderTopWidth).toBe('0px');
        const gesture = await drag(handle('A', 'ew')!, 200, 0, 10, false);
        await stable();
        expect(getComputedStyle(frameBox).borderTopStyle).toBe('dashed');
        expect(getComputedStyle(frameBox).borderTopWidth).toBe('2px');
        expect(item('A').style.zIndex).toBe('1');
        const indication = frameBox.lastElementChild as HTMLElement;
        // 520px wide: 136px are missing to the two-column width
        expect(parseFloat(indication.style.width)).toBe(2 * 320 + 16 - 520);
        await gesture.up();
        await stable();
        expect(getComputedStyle(frameBox).borderTopWidth).toBe('0px');
        expect(parseFloat(indication.style.width)).toBe(0);
        expect(item('A').style.zIndex).toBe('0');
    });

    it('growing a card past half a column moves cards at the end of its row down; shrinking back restores their ranks', async () => {
        const { handle, position, stable, host } = await setup();
        const { layouts } = host;
        expect(position('D')).toEqual([48 + 3 * 336, 0]);
        expect(position('E')).toEqual([48, 176]);
        const gesture = await drag(handle('A', 'ew')!, 200, 0, 10, false);
        await stable();
        // A covers two columns, B and C move along; D (end of the row) moves down, after E
        expect(position('B')).toEqual([48 + 2 * 336, 0]);
        expect(position('C')).toEqual([48 + 3 * 336, 0]);
        expect(position('E')[1]).toBe(176);
        expect(position('D')[1]).toBe(176);
        expect(position('D')[0]).toBeGreaterThan(position('E')[0]);
        const ranks = (config: ResizableCardLayoutConfig) => config.map((c) => `${c.title}${c.rank}`);
        expect(ranks(layouts.at(-1)!)).toEqual(['A1', 'B2', 'C3', 'D5', 'E4']);
        expect(host.steps.length).toBeGreaterThan(0);

        // back to the start: ranks restored
        await gesture.move(10, 0);
        await stable();
        await gesture.up();
        await stable();
        expect(ranks(layouts.at(-1)!)).toEqual(['A1', 'B2', 'C3', 'D4', 'E5']);
        expect(position('D')).toEqual([48 + 3 * 336, 0]);
        expect(position('E')).toEqual([48, 176]);
    });

    it('dragging the bottom edge snaps the height to 1rem rows; below mini content snaps to it, then to the mini header (emits miniContentReached / miniHeaderReached)', async () => {
        const { host, handle, size, stable, position } = await setup();
        const bottom = () => handle('A', 'ns')!;
        expect(size('A')[1]).toBe(160);

        // 197px: 12 rows (5px rounds down)
        await drag(bottom(), 0, 37);
        await stable();
        expect(size('A')[1]).toBe(192);
        expect(host.steps.length).toBeGreaterThan(0);
        expect(host.resizeds.at(-1)!.cardHeightRowSpan).toBe(12);
        // the card below now fits higher up under B
        expect(position('E')).toEqual([48 + 336, 176]);

        // 205px: 13 rows (13px rounds up)
        await drag(bottom(), 0, 13);
        await stable();
        expect(size('A')[1]).toBe(208);

        // shrinking below mini header + mini content (8 rows) snaps to it
        await drag(bottom(), 0, -150, 15);
        await stable();
        expect(size('A')[1]).toBe(128);
        expect(host.miniContent).toHaveLength(1);
        expect(host.miniContent[0].cardHeightRowSpan).toBe(8);
        expect(host.miniHeader).toHaveLength(0);

        // shrinking further snaps to the mini header (3 rows)
        await drag(bottom(), 0, -10, 2);
        await stable();
        expect(size('A')[1]).toBe(48);
        expect(host.miniHeader).toHaveLength(1);
        expect(host.miniHeader[0].cardHeightRowSpan).toBe(3);

        // growing from the mini header goes back to the mini content height
        await drag(bottom(), 0, 10, 2);
        await stable();
        expect(size('A')[1]).toBe(128);
        expect(host.miniContent).toHaveLength(2);
        expect(position('E')).toEqual([48, 128 + 16]);
    });

    it('resizable=false shows no handles', async () => {
        const { handle, item, stable, size } = await setup({
            cards: [card('A', { rank: 1, resizable: false }), card('B', { rank: 2 })]
        });
        expect(handle('A', 'ew')).toBeNull();
        expect(handle('A', 'ns')).toBeNull();
        await userEvent.hover(item('A').querySelector<HTMLElement>('.flex-1')!);
        await stable();
        expect(handle('A', 'nwse')).toBeNull();
        expect(size('A')).toEqual([320, 160]);
        expect(handle('B', 'ew')).not.toBeNull();
    });

    it('RTL: horizontal resizing is mirrored and cards are placed from the right', async () => {
        document.documentElement.setAttribute('dir', 'rtl');
        const { handle, item, layout, size, stable } = await setup();
        const a = item('A').getBoundingClientRect();
        const b = item('B').getBoundingClientRect();
        expect(Math.round(layout.getBoundingClientRect().right - a.right)).toBe(48);
        expect(b.right).toBeLessThan(a.left);

        const edge = handle('A', 'ew')!;
        // the edge is on the left
        expect(edge.getBoundingClientRect().left).toBeLessThan(a.left + 330 - 320 + 1);
        await drag(edge, -200, 0);
        await stable();
        expect(size('A')[0]).toBe(2 * 320 + 16);
        // dragging to the right makes it narrower
        await drag(handle('A', 'ew')!, 200, 0);
        await stable();
        expect(size('A')[0]).toBe(320);
    });

    it('arrow keys move focus between cards in rank order', async () => {
        const { item, root, stable, host } = await setup();
        host.cards.set([card('C', { rank: 3 }), card('A', { rank: 1 }), card('B', { rank: 2 })]);
        await stable();
        root.querySelector<HTMLElement>('#before')!.focus();
        await userEvent.keyboard('{Tab}');
        // tab order follows the DOM
        expect(document.activeElement).toBe(item('C'));
        item('A').focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(item('B'));
        await userEvent.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(item('C'));
        // wraps
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(item('A'));
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(item('C'));
        await userEvent.keyboard('{ArrowUp}');
        expect(document.activeElement).toBe(item('B'));
    });

    it('layoutChange emits the configuration (rank, spans) after every arrangement', async () => {
        const { host, stable, handle } = await setup();
        const last = () => host.layouts.at(-1)!;
        expect(last()).toHaveLength(5);
        expect(last()[0]).toEqual({
            title: 'A',
            rank: 1,
            cardWidthColSpan: 1,
            cardHeightRowSpan: 10,
            cardMiniHeaderRowSpan: 3,
            cardMiniContentRowSpan: 5,
            resizable: true
        });
        const count = host.layouts.length;
        await drag(handle('B', 'ew')!, 200, 0);
        await stable();
        expect(host.layouts.length).toBeGreaterThan(count);
        expect(last()[1]).toMatchObject({ title: 'B', cardWidthColSpan: 2 });

        host.width.set(900);
        await stable();
        expect(last().every((c) => c.cardWidthColSpan! <= 2)).toBe(true);
    });
});
