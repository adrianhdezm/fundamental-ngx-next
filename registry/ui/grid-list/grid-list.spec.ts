import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    GridList,
    GridListItem,
    GridListItemBody,
    GridListGroupHeader,
    GridListTitleBar,
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
                    <fd-grid-list-item
                        [value]="id"
                        [title]="'Item ' + id"
                        type="detail"
                        (press)="pressed.set(id)"
                        (delete)="deleted.set(id)"
                    >
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
    readonly deleted = signal<number | null>(null);
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

    it('extends the selection with Shift+Arrow and Shift+End in multi selection', async () => {
        const { fixture, host, items } = await render();
        await userEvent.click(items()[0].querySelector<HTMLElement>('[data-gl-select]')!);
        expect(host.last()!.selection).toEqual([1]);

        await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
        await fixture.whenStable();
        expect(host.last()).toEqual({ selection: [1, 2], added: [2], removed: [], index: [1] });
        expect(active()).toBe(items()[1]);

        await userEvent.keyboard('{Shift>}{End}{/Shift}');
        await fixture.whenStable();
        expect(host.last()!.selection).toEqual([1, 2, 3, 4, 5, 6]);
        expect(items().map((i) => i.getAttribute('aria-selected'))).toEqual(Array(6).fill('true'));
        expect(active()).toBe(items()[5]);
    });

    it('shows a delete button per item in delete mode that emits delete', async () => {
        const { fixture, host, items } = await render('delete');
        const buttons = items().map((i) => i.querySelector<HTMLElement>('button[aria-label="Delete"]'));
        expect(buttons.every(Boolean)).toBe(true);
        await userEvent.click(buttons[3]!);
        await fixture.whenStable();
        expect(host.deleted()).toBe(4);
        // deleting is not an activation
        expect(host.pressed()).toBeNull();
    });

    it('shows a radio per item in single selection with a radio and selects on click', async () => {
        for (const mode of ['singleSelectLeft', 'singleSelectRight'] as const) {
            const { fixture, host, items } = await render(mode);
            const radios = items().map((i) => i.querySelector<HTMLInputElement>('input[type="radio"]'));
            expect(radios.every(Boolean)).toBe(true);
            expect(items()[0].querySelector('input[type="checkbox"]')).toBeNull();

            await userEvent.click(items()[2].querySelector<HTMLElement>('[data-gl-select]')!);
            await fixture.whenStable();
            expect(host.last()!.selection).toEqual([3]);
            expect(radios[2]!.checked).toBe(true);
            await userEvent.click(items()[4].querySelector<HTMLElement>('[data-gl-select]')!);
            await fixture.whenStable();
            expect(host.last()).toEqual({ selection: [5], added: [5], removed: [3], index: [4] });
            expect(radios[2]!.checked).toBe(false);
            fixture.destroy();
        }
    });
});

@Component({
    imports: [GridList, GridListItem, GridListItemBody, GridListTitleBar, GridListGroupHeader],
    template: `
        <fd-grid-list ariaLabel="Parts">
            <fd-grid-list-title-bar title="Products" [headingLevel]="titleLevel()">
                <span fd-grid-list-title-bar-additional-title-item>(5)</span>
            </fd-grid-list-title-bar>
            <fd-grid-list-group-header>Default group</fd-grid-list-group-header>
            <fd-grid-list-group-header [headingLevel]="5">Level 5 group</fd-grid-list-group-header>
            <fd-grid-list-item value="nav" type="navigation" counter="7" title="Nav" (navigate)="log.set('navigate')" />
            <fd-grid-list-item
                value="error"
                state="error"
                status="success"
                type="detail"
                title="Error"
                (detail)="log.set('detail')"
            />
            <fd-grid-list-item value="locked" state="locked" title="Locked" (locked)="log.set('locked')" />
            <fd-grid-list-item value="draft" state="draft" title="Draft" (draft)="log.set('draft')" />
            <fd-grid-list-item value="plain" title="Plain" (cardClick)="log.set('card')" />
        </fd-grid-list>
    `
})
class PartsHost {
    readonly titleLevel = signal(2);
    readonly log = signal('');
}

describe('GridList parts', () => {
    async function renderParts() {
        const fixture = TestBed.createComponent(PartsHost);
        await fixture.whenStable();
        const el: HTMLElement = fixture.nativeElement;
        const item = (title: string) =>
            [...el.querySelectorAll<HTMLElement>('[data-grid-list-item]')].find(
                (i) => i.querySelector('[role="heading"]')?.textContent?.trim() === title
            )!;
        return { fixture, host: fixture.componentInstance, el, item };
    }

    it('the title bar is a heading with aria-level from headingLevel and contains the projected content', async () => {
        const { fixture, el } = await renderParts();
        const heading = el.querySelector<HTMLElement>('fd-grid-list-title-bar [role="heading"]')!;
        expect(heading.getAttribute('aria-level')).toBe('2');
        expect(heading.textContent!.replace(/\s+/g, ' ').trim()).toBe('Products (5)');
        expect(heading.querySelector('[fd-grid-list-title-bar-additional-title-item]')).not.toBeNull();

        fixture.componentInstance.titleLevel.set(4);
        await fixture.whenStable();
        expect(heading.getAttribute('aria-level')).toBe('4');
    });

    it('the group header uses its headingLevel (default 3)', async () => {
        const { el } = await renderParts();
        const headings = [...el.querySelectorAll('fd-grid-list-group-header [role="heading"]')];
        expect(headings.map((h) => [h.textContent!.trim(), h.getAttribute('aria-level')])).toEqual([
            ['Default group', '3'],
            ['Level 5 group', '5']
        ]);
    });

    it('state items show their state actions and statuses expose a status label', async () => {
        const { item } = await renderParts();
        expect(item('Error').textContent).toContain('Contains errors');
        expect(item('Error').querySelector('.sr-only-sap')!.textContent).toBe('Item has status. Status: success.');
        expect(item('Locked').querySelector('button')!.textContent!.trim()).toBe('Locked');
        expect(item('Draft').querySelector('button')!.textContent!.trim()).toBe('Draft');
        // no state, no status: neither a footer action nor a status label
        expect(item('Plain').querySelector('button')).toBeNull();
        expect(item('Plain').querySelector('.sr-only-sap')).toBeNull();
    });

    it('detail, draft and locked buttons emit their outputs without a card click', async () => {
        const { fixture, host, item } = await renderParts();
        await userEvent.click(item('Error').querySelector<HTMLElement>('button[aria-label="Details"]')!);
        await fixture.whenStable();
        expect(host.log()).toBe('detail');
        await userEvent.click(item('Locked').querySelector('button')!);
        await fixture.whenStable();
        expect(host.log()).toBe('locked');
        await userEvent.click(item('Draft').querySelector('button')!);
        await fixture.whenStable();
        expect(host.log()).toBe('draft');
        await userEvent.click(item('Plain'));
        await fixture.whenStable();
        expect(host.log()).toBe('card');
    });

    it('navigation items show the counter and indicator and emit navigate on click', async () => {
        const { fixture, host, item } = await renderParts();
        const nav = item('Nav');
        expect(nav.textContent).toContain('7');
        expect(nav.textContent).toContain('Item has 7 children.');
        expect(nav.querySelector('fd-icon[glyph="navigation-right-arrow"]')).not.toBeNull();
        expect(item('Plain').querySelector('fd-icon')).toBeNull();

        await userEvent.click(nav);
        await fixture.whenStable();
        expect(host.log()).toBe('navigate');
    });
});
