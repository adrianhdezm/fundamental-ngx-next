import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Card, CardHeader, CardMainHeader, CardTitle } from '@/ui/card/card';
import {
    CardDefinition,
    FixedCardLayout,
    type CardDropped,
    type ColumnsWidthConfig,
    type FixedCardLayoutChange
} from './fixed-card-layout';

interface TestCard {
    title: string;
    height: number;
}

const cards = (heights: number[]): TestCard[] => heights.map((height, i) => ({ title: `Card ${i + 1}`, height }));

@Component({
    imports: [FixedCardLayout, CardDefinition, Card, CardHeader, CardMainHeader, CardTitle],
    template: `
        <button id="before">Before</button>
        <div [style.width.px]="width()">
            <fd-fixed-card-layout
                [maxColumns]="maxColumns()"
                [cardMinimumWidth]="cardMinimumWidth()"
                [columnsWidthConfig]="widthConfig()"
                [disableDragDrop]="disabled()"
                [dragStartDelay]="0"
                (layoutChange)="changes.push($event)"
                (cardDraggedDropped)="drops.push($event)"
            >
                @for (card of cards(); track card.title; let i = $index) {
                    <ng-template [fdCardDef]="i + 1">
                        <fd-card [attr.data-title]="card.title">
                            <fd-card-header>
                                <fd-card-main-header>
                                    <h3 fd-card-title [id]="'title-' + i">{{ card.title }}</h3>
                                </fd-card-main-header>
                            </fd-card-header>
                            <div [style.height.px]="card.height"></div>
                        </fd-card>
                    </ng-template>
                }
            </fd-fixed-card-layout>
        </div>
    `
})
class Host {
    readonly width = signal(1000);
    readonly cards = signal(cards([100, 200, 150, 120, 80]));
    readonly maxColumns = signal(10);
    readonly cardMinimumWidth = signal(320);
    readonly widthConfig = signal<ColumnsWidthConfig | null>(null);
    readonly disabled = signal(false);
    readonly changes: FixedCardLayoutChange[] = [];
    readonly drops: CardDropped[] = [];
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function setup(config: Partial<{ width: number; heights: number[]; maxColumns: number }> = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.width) host.width.set(config.width);
    if (config.heights) host.cards.set(cards(config.heights));
    if (config.maxColumns) host.maxColumns.set(config.maxColumns);
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await frame();
        await fixture.whenStable();
    };
    await stable();
    const root = fixture.nativeElement as HTMLElement;
    const layout = root.querySelector<HTMLElement>('fd-fixed-card-layout')!;
    const items = () => [...root.querySelectorAll<HTMLElement>('[fdFixedCardLayoutItem]')];
    const titles = () => items().map((item) => item.querySelector('[fd-card-title]')!.textContent!.trim());
    const item = (title: string) =>
        items().find((i) => i.querySelector('fd-card')!.getAttribute('data-title') === title)!;
    const columnLefts = () => [...new Set(items().map((i) => Math.round(i.getBoundingClientRect().left)))];
    return {
        fixture,
        host,
        root,
        stable,
        layout,
        inner: layout.firstElementChild as HTMLElement,
        items,
        titles,
        item,
        columnLefts,
        columns: () => host.changes.at(-1)?.numberOfColumns
    };
}

/** Drags one element onto another with mouse events (the target is located once the drag has started). */
async function drag(from: HTMLElement, to: HTMLElement) {
    const start = from.getBoundingClientRect();
    let x = start.left + 20;
    let y = start.top + 20;
    const fire = (el: EventTarget, type: string, cx: number, cy: number) =>
        el.dispatchEvent(
            new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                clientX: cx,
                clientY: cy,
                button: 0,
                buttons: type === 'mouseup' ? 0 : 1,
                detail: 1
            })
        );
    fire(from, 'mousedown', x, y);
    await frame();
    // past the drag threshold
    x += 10;
    y += 10;
    fire(document, 'mousemove', x, y);
    await frame();
    // a second move lets the drop list under the pointer take the placeholder
    fire(document, 'mousemove', x + 1, y + 1);
    await frame();
    await frame();
    const target = to.getBoundingClientRect();
    const tx = target.left + target.width / 2;
    const ty = target.top + Math.min(target.height / 2, 30);
    for (let step = 1; step <= 10; step++) {
        fire(document, 'mousemove', x + ((tx - x) * step) / 10, y + ((ty - y) * step) / 10);
        await frame();
    }
    fire(document, 'mouseup', tx, ty);
    await frame();
}

afterEach(() => {
    document.documentElement.removeAttribute('dir');
});

describe('FixedCardLayout', () => {
    it('a larger cardMinimumWidth reduces the number of columns (never below 20rem)', async () => {
        const { host, stable, columns, columnLefts, items } = await setup();
        expect(columns()).toBe(3);

        host.cardMinimumWidth.set(400);
        await stable();
        expect(columns()).toBe(2);
        expect(columnLefts()).toHaveLength(2);
        expect(items().every((i) => i.getBoundingClientRect().width >= 400)).toBe(true);

        // below 20rem the minimum stays 20rem
        host.cardMinimumWidth.set(100);
        await stable();
        expect(columns()).toBe(3);
        expect(items().every((i) => i.getBoundingClientRect().width >= 320)).toBe(true);
    });

    it('number of columns follows the width (cards at least 20rem, 1rem gaps), capped by maxColumns and the card count', async () => {
        const { host, stable, columnLefts, columns, items } = await setup();
        // 1000px + the 1rem start gap: three 20rem columns with gaps fit
        expect(columns()).toBe(3);
        expect(columnLefts()).toHaveLength(3);
        expect(items().every((i) => i.getBoundingClientRect().width >= 320)).toBe(true);

        host.width.set(700);
        await stable();
        expect(columns()).toBe(2);
        expect(columnLefts()).toHaveLength(2);

        // exactly 2 x 20rem + gap
        host.width.set(640);
        await stable();
        expect(columns()).toBe(2);

        host.width.set(639);
        await stable();
        expect(columns()).toBe(1);
        expect(columnLefts()).toHaveLength(1);

        host.width.set(2000);
        await stable();
        expect(columns()).toBe(5);

        host.maxColumns.set(2);
        await stable();
        expect(columns()).toBe(2);

        host.maxColumns.set(10);
        host.cards.set(cards([100, 100]));
        await stable();
        expect(columns()).toBe(2);
        expect(columnLefts()).toHaveLength(2);
    });

    it('cards are placed row by row: card i goes to column i % columns, DOM order stays the rank order', async () => {
        const { titles, item, columnLefts } = await setup();
        expect(titles()).toEqual(['Card 1', 'Card 2', 'Card 3', 'Card 4', 'Card 5']);
        const lefts = columnLefts().sort((a, b) => a - b);
        const left = (title: string) => Math.round(item(title).getBoundingClientRect().left);
        const top = (title: string) => item(title).getBoundingClientRect().top;
        const bottom = (title: string) => item(title).getBoundingClientRect().bottom;
        expect(['Card 1', 'Card 2', 'Card 3'].map(left)).toEqual(lefts);
        expect(left('Card 4')).toBe(lefts[0]);
        expect(left('Card 5')).toBe(lefts[1]);
        // the first row is aligned at the top, the second row sits 1rem below each column's card
        expect(top('Card 2')).toBeCloseTo(top('Card 1'), 0);
        expect(top('Card 3')).toBeCloseTo(top('Card 1'), 0);
        expect(top('Card 4') - bottom('Card 1')).toBeCloseTo(16, 0);
        expect(top('Card 5') - bottom('Card 2')).toBeCloseTo(16, 0);
        // columns 1rem apart
        expect(lefts[1] - Math.round(item('Card 1').getBoundingClientRect().right)).toBe(16);
    });

    it('cards are focusable groups labelled by their card title', async () => {
        const { items } = await setup();
        const first = items()[0];
        expect(first.getAttribute('role')).toBe('group');
        expect(first.getAttribute('tabindex')).toBe('0');
        expect(first.getAttribute('aria-labelledby')).toBe('title-0');
    });

    it('container height is the highest column; re-measured when a card changes height', async () => {
        const { host, inner, items, stable } = await setup();
        const heights = () => items().map((i) => i.offsetHeight);
        const expected = () => {
            const h = heights();
            const columns = [h[0] + h[3] + 32, h[1] + h[4] + 32, h[2] + 16];
            return Math.ceil(Math.max(...columns) + 4);
        };
        expect(inner.getBoundingClientRect().height).toBe(expected());

        host.cards.update((all) => all.map((c, i) => (i === 2 ? { ...c, height: 600 } : c)));
        await stable();
        await stable();
        expect(inner.getBoundingClientRect().height).toBe(expected());
        expect(inner.getBoundingClientRect().height).toBeGreaterThan(600);
        // the layout reserves the space: the content after it does not overlap the cards
        const lowest = Math.max(...items().map((i) => i.getBoundingClientRect().bottom));
        expect(inner.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(lowest);
    });

    it('columnsWidthConfig distributes the free space by the column modifiers', async () => {
        const { host, stable, item } = await setup();
        host.maxColumns.set(2);
        host.widthConfig.set({ 1: 2, 2: 1 });
        await stable();
        // layout width 1016px, 2 x 320px minimum, the 376px left over go 2:1
        const column = (title: string) => item(title).parentElement!.getBoundingClientRect().width;
        expect(Math.round(column('Card 1'))).toBe(Math.round(320 + (376 * 2) / 3));
        expect(Math.round(column('Card 2'))).toBe(Math.round(320 + 376 / 3));
        expect(Math.round(column('Card 3'))).toBe(Math.round(column('Card 1')));

        host.widthConfig.set(null);
        await stable();
        expect(Math.round(column('Card 1'))).toBe(Math.round(column('Card 2')));
    });

    it('dragging a card onto another swaps their ranks and emits cardDraggedDropped (previous/current index)', async () => {
        const { host, item, titles, stable } = await setup();
        await drag(item('Card 1'), item('Card 3'));
        await stable();
        expect(host.drops).toHaveLength(1);
        const drop = host.drops[0];
        expect(drop.previousIndex).toBe(0);
        expect(drop.currentIndex).toBe(2);
        expect(drop.layoutColumns).toBe(3);
        expect(drop.items.map((c) => c.rank())).toEqual([1, 2, 3, 4, 5]);
        expect(titles()).toEqual(['Card 3', 'Card 2', 'Card 1', 'Card 4', 'Card 5']);
        // card 1 now sits in the third column
        expect(Math.round(item('Card 1').getBoundingClientRect().left)).toBeGreaterThan(
            Math.round(item('Card 2').getBoundingClientRect().left)
        );
    });

    it('the cards below the dragged one move up, and can be dropped on where they are now', async () => {
        const { host, item, titles, stable } = await setup({ heights: [100, 200, 150, 120, 80, 90, 110] });
        await drag(item('Card 1'), item('Card 7'));
        await stable();
        expect(host.drops).toHaveLength(1);
        expect(host.drops[0]).toMatchObject({ previousIndex: 0, currentIndex: 6 });
        expect(titles()).toEqual(['Card 7', 'Card 2', 'Card 3', 'Card 4', 'Card 5', 'Card 6', 'Card 1']);
    });

    it('within a column of two, dragging the lower card onto the upper one swaps them, the other way keeps the order', async () => {
        const { host, item, titles, stable, inner } = await setup();
        await drag(item('Card 2'), item('Card 2'));
        await stable();
        expect(host.drops).toHaveLength(0);
        expect(item('Card 2').parentElement!.style.display).toBe('');
        expect(item('Card 2').getBoundingClientRect().height).toBeGreaterThan(0);
        expect(titles()).toEqual(['Card 1', 'Card 2', 'Card 3', 'Card 4', 'Card 5']);

        // the placeholder goes above the target card: card 1 above card 4 is the current order
        await drag(item('Card 1'), item('Card 4'));
        await stable();
        expect(host.drops).toHaveLength(0);
        expect(titles()).toEqual(['Card 1', 'Card 2', 'Card 3', 'Card 4', 'Card 5']);

        await drag(item('Card 4'), item('Card 1'));
        await stable();
        expect(host.drops).toHaveLength(1);
        expect(host.drops[0]).toMatchObject({ previousIndex: 3, currentIndex: 0 });
        expect(titles()).toEqual(['Card 4', 'Card 2', 'Card 3', 'Card 1', 'Card 5']);
        expect(item('Card 1').getBoundingClientRect().top).toBeGreaterThan(
            item('Card 4').getBoundingClientRect().bottom
        );
        // the layout height is measured again after the drop
        const lowest = Math.max(
            ...[...inner.querySelectorAll('[fdFixedCardLayoutItem]')].map((i) => i.getBoundingClientRect().bottom)
        );
        expect(Math.round(inner.getBoundingClientRect().bottom - lowest)).toBe(4);
    });

    it('Alt+Arrow keys swap with the neighbour card (left/right respect RTL, up/down by row) and keep focus on the moved card', async () => {
        const { host, item, titles, stable } = await setup();
        const card = item('Card 1');
        card.focus();
        await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}');
        await stable();
        expect(titles()).toEqual(['Card 2', 'Card 1', 'Card 3', 'Card 4', 'Card 5']);
        expect(host.drops.at(-1)).toMatchObject({ previousIndex: 0, currentIndex: 1, layoutColumns: 3 });
        expect(document.activeElement).toBe(item('Card 1'));

        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await stable();
        expect(titles()).toEqual(['Card 2', 'Card 5', 'Card 3', 'Card 4', 'Card 1']);
        expect(document.activeElement).toBe(item('Card 1'));

        // no card below: nothing moves
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await stable();
        expect(titles()).toEqual(['Card 2', 'Card 5', 'Card 3', 'Card 4', 'Card 1']);

        await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
        await stable();
        expect(titles()).toEqual(['Card 2', 'Card 1', 'Card 3', 'Card 4', 'Card 5']);
        await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');
        await stable();
        expect(titles()).toEqual(['Card 1', 'Card 2', 'Card 3', 'Card 4', 'Card 5']);

        // no column before the first: nothing moves
        await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');
        await stable();
        expect(titles()).toEqual(['Card 1', 'Card 2', 'Card 3', 'Card 4', 'Card 5']);
        expect(document.activeElement).toBe(item('Card 1'));

        // RTL: ArrowLeft moves towards the end
        document.documentElement.setAttribute('dir', 'rtl');
        await stable();
        await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');
        await stable();
        expect(titles()).toEqual(['Card 2', 'Card 1', 'Card 3', 'Card 4', 'Card 5']);
        // and it is visually to the left of card 2
        expect(item('Card 1').getBoundingClientRect().right).toBeLessThan(item('Card 2').getBoundingClientRect().left);
        expect(document.activeElement).toBe(item('Card 1'));
    });

    it('arrow keys without Alt move focus between cards with wrap', async () => {
        const { host, items } = await setup();
        const list = items();
        list[0].focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(list[1]);
        await userEvent.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(list[2]);
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(list[1]);
        await userEvent.keyboard('{ArrowUp}');
        expect(document.activeElement).toBe(list[0]);
        await userEvent.keyboard('{ArrowUp}');
        expect(document.activeElement).toBe(list[4]);
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(list[0]);
        // focus moves never reorder
        expect(host.drops).toHaveLength(0);
    });

    it('Tab moves into and out of the cards one by one', async () => {
        const { root, items } = await setup();
        root.querySelector<HTMLElement>('#before')!.focus();
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(items()[0]);
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(items()[1]);
    });

    it('disableDragDrop disables pointer and keyboard moves', async () => {
        const { host, item, titles, stable } = await setup();
        host.disabled.set(true);
        await stable();
        await drag(item('Card 1'), item('Card 3'));
        await stable();
        expect(host.drops).toHaveLength(0);
        expect(titles()).toEqual(['Card 1', 'Card 2', 'Card 3', 'Card 4', 'Card 5']);

        item('Card 1').focus();
        await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}');
        await stable();
        expect(host.drops).toHaveLength(0);
        expect(titles()).toEqual(['Card 1', 'Card 2', 'Card 3', 'Card 4', 'Card 5']);
        // plain arrows still move the focus
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(item('Card 2'));
    });

    it('layoutChange emits the number of columns and width', async () => {
        const { host, stable } = await setup();
        expect(host.changes.at(-1)).toEqual({ numberOfColumns: 3, screenSize: 1016 });
        const count = host.changes.length;
        host.width.set(700);
        await stable();
        expect(host.changes.at(-1)).toEqual({ numberOfColumns: 2, screenSize: 716 });
        expect(host.changes.length).toBeGreaterThan(count);
    });
});
