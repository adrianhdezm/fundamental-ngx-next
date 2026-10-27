import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { MultiCombobox } from './multi-combobox';

interface Item {
    id: number;
    name: string;
    type: string;
}

const ITEMS: Item[] = [
    { id: 1, name: 'Apple', type: 'Fruit' },
    { id: 2, name: 'Banana', type: 'Fruit' },
    { id: 3, name: 'Red Pepper', type: 'Vegetable' },
    { id: 4, name: 'Spinach', type: 'Vegetable' }
];

@Component({
    imports: [MultiCombobox, ReactiveFormsModule],
    template: `
        <fd-multi-combobox
            ariaLabel="Food"
            displayKey="name"
            lookupKey="id"
            [showSelectAll]="selectAll()"
            [group]="group()"
            groupKey="type"
            [autoComplete]="false"
            [invalidEntryDisplayTime]="200"
            [dataSource]="items"
            [formControl]="control"
            (selectionChange)="changes.set(changes() + 1)"
        />
        <button type="button">Outside</button>
    `
})
class Host {
    readonly items = ITEMS;
    readonly selectAll = signal(false);
    readonly group = signal(false);
    readonly changes = signal(0);
    readonly control = new FormControl<Item[]>([ITEMS[1]]);
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const options = () => [...document.querySelectorAll<HTMLElement>('ul[role=listbox] [role=option]')];
const tokens = () => [...document.querySelectorAll<HTMLElement>('fd-token')].map((t) => t.textContent?.trim());
const names = (items: Item[] | null) => (items ?? []).map((i) => i.name);

async function setup(config: { selectAll?: boolean; group?: boolean } = {}) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.selectAll.set(!!config.selectAll);
    fixture.componentInstance.group.set(!!config.group);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('input[role=combobox]')!;
    return { fixture, host: fixture.componentInstance, root, input };
}

describe('MultiCombobox', () => {
    it('shows the chosen items as tokens', async () => {
        const { fixture, host } = await setup();
        expect(tokens()).toEqual(['Banana']);
        host.control.setValue([ITEMS[0], ITEMS[3]]);
        await fixture.whenStable();
        expect(tokens()).toEqual(['Apple', 'Spinach']);
    });

    it('filters by the start of any word', async () => {
        const { fixture, input } = await setup();
        await userEvent.type(input, 'pe');
        await fixture.whenStable();
        expect(input.getAttribute('aria-expanded')).toBe('true');
        expect(options().map((o) => o.textContent?.trim())).toEqual(['Red Pepper']);
    });

    it('rejects text that matches nothing with a brief error', async () => {
        const { fixture, input, root } = await setup();
        await userEvent.type(input, 'a');
        await userEvent.keyboard('z');
        await fixture.whenStable();
        expect(input.value).toBe('a');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(root.textContent).toContain('Invalid entry');
        await wait(300);
        await fixture.whenStable();
        expect(input.getAttribute('aria-invalid')).toBeNull();
    });

    it('toggles options with the keyboard and the mouse', async () => {
        const { fixture, host, input } = await setup();
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await fixture.whenStable();
        await userEvent.keyboard('{ArrowDown}');
        expect(input.getAttribute('aria-activedescendant')).toBe(options()[0].id);
        await userEvent.keyboard(' ');
        expect(names(host.control.value)).toEqual(['Banana', 'Apple']);
        expect(input.getAttribute('aria-expanded')).toBe('true');
        await userEvent.click(options()[2].querySelector('[aria-hidden=true]')!);
        expect(names(host.control.value)).toEqual(['Banana', 'Apple', 'Red Pepper']);
        await userEvent.click(options()[1]);
        await fixture.whenStable();
        expect(names(host.control.value)).toEqual(['Apple', 'Red Pepper']);
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(host.changes()).toBe(3);
    });

    it('chooses the item named by the text with Enter', async () => {
        const { fixture, host, input } = await setup();
        await userEvent.type(input, 'spinach{Enter}');
        await fixture.whenStable();
        expect(names(host.control.value)).toEqual(['Banana', 'Spinach']);
        expect(input.value).toBe('');
    });

    it('selects all with the select all option and Ctrl+A', async () => {
        const { fixture, host, input } = await setup({ selectAll: true });
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await fixture.whenStable();
        expect(options()[0].textContent).toContain('Select All (1/4)');
        await userEvent.click(options()[0]);
        expect(host.control.value).toHaveLength(4);
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}{ArrowDown}{Control>}{Shift>}a{/Shift}{/Control}');
        expect(host.control.value).toEqual([]);
    });

    it('groups the options under headers', async () => {
        const { fixture, input } = await setup({ group: true });
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await fixture.whenStable();
        const groups = [...document.querySelectorAll<HTMLElement>('ul[role=listbox] [role=group]')];
        expect(groups).toHaveLength(2);
        expect(document.getElementById(groups[1].getAttribute('aria-labelledby')!)?.textContent?.trim()).toBe(
            'Vegetable'
        );
    });
});
