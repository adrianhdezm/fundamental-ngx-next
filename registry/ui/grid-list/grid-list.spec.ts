import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    GridList,
    GridListItem,
    GridListItemBody,
    type GridListSelectionEvent,
    type GridListSelectionMode
} from './grid-list';

@Component({
    imports: [GridList, GridListItem, GridListItemBody],
    template: `
        <div style="width: 1100px">
            <fd-grid-list
                ariaLabel="Products"
                layoutPattern="XL3-L3-M3-S3"
                [selectionMode]="mode()"
                (selectionChange)="last.set($event)"
            >
                @for (id of ids; track id) {
                    <fd-grid-list-item [value]="id" [title]="'Item ' + id" type="detail" (press)="pressed.set(id)">
                        <div fd-grid-list-item-body>Body {{ id }}</div>
                    </fd-grid-list-item>
                }
            </fd-grid-list>
        </div>
    `
})
class Host {
    readonly ids = [1, 2, 3, 4, 5, 6];
    readonly mode = signal<GridListSelectionMode>('multiSelect');
    readonly last = signal<GridListSelectionEvent<unknown> | null>(null);
    readonly pressed = signal<number | null>(null);
}

async function render(mode: GridListSelectionMode = 'multiSelect') {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mode.set(mode);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const items = () => [...el.querySelectorAll<HTMLElement>('[data-grid-list-item]')];
    return { fixture, host: fixture.componentInstance, el, items };
}

const active = () => document.activeElement as HTMLElement;

describe('GridList', () => {
    it('uses grid semantics when selectable and list semantics otherwise', async () => {
        const { fixture, el, items } = await render('multiSelect');
        expect(el.querySelector('fd-grid-list')!.getAttribute('role')).toBe('grid');
        expect(items()[0].getAttribute('role')).toBe('gridcell');
        expect(items()[0].getAttribute('aria-selected')).toBe('false');

        fixture.componentInstance.mode.set('none');
        await fixture.whenStable();
        expect(el.querySelector('fd-grid-list')!.getAttribute('role')).toBe('list');
        expect(items()[0].getAttribute('role')).toBe('listitem');
        expect(items()[0].hasAttribute('aria-selected')).toBe(false);
    });

    it('keeps a single tab stop and moves focus with the arrow keys by row', async () => {
        const { items } = await render();
        expect(items().map((i) => i.tabIndex)).toEqual([0, -1, -1, -1, -1, -1]);
        items()[0].focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(active()).toBe(items()[1]);
        await userEvent.keyboard('{ArrowDown}');
        expect(active()).toBe(items()[4]);
        await userEvent.keyboard('{End}');
        expect(active()).toBe(items()[5]);
        await userEvent.keyboard('{Home}');
        expect(active()).toBe(items()[0]);
    });

    it('selects with Space and ranges with Shift+click in multi selection', async () => {
        const { fixture, host, items } = await render();
        items()[1].focus();
        await userEvent.keyboard(' ');
        await fixture.whenStable();
        expect(host.last()!.selection).toEqual([2]);

        // deselect item 2 (the range anchor), then Shift+click item 4: the range 2..4 takes the new state
        await userEvent.click(items()[1].querySelector<HTMLElement>('[data-gl-select]')!);
        expect(host.last()!.selection).toEqual([]);
        await userEvent.click(items()[3].querySelector<HTMLElement>('[data-gl-select]')!, { modifiers: ['Shift'] });
        await fixture.whenStable();
        expect(host.last()!.selection).toEqual([2, 3, 4]);
        expect(items()[2].getAttribute('aria-selected')).toBe('true');
    });

    it('moves into an item with Enter and back with Escape', async () => {
        const { items } = await render();
        items()[0].focus();
        await userEvent.keyboard('{Enter}');
        expect(active().tagName).toBe('BUTTON');
        expect(items()[0].contains(active())).toBe(true);
        await userEvent.keyboard('{Escape}');
        expect(active()).toBe(items()[0]);
    });

    it('keeps at most one selected item when switching to single selection', async () => {
        const { fixture, host, items } = await render();
        items()[0].focus();
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{ArrowRight} ');
        fixture.componentInstance.mode.set('singleSelect');
        await fixture.whenStable();
        expect(host.last()!.selection).toEqual([1]);
    });

    it('emits press on Space without selection mode', async () => {
        const { host, items } = await render('none');
        items()[2].focus();
        await userEvent.keyboard(' ');
        expect(host.pressed()).toBe(3);
    });
});
