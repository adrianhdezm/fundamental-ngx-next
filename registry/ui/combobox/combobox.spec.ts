import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Combobox } from './combobox';

interface Item {
    id: number;
    name: string;
}

@Component({
    imports: [Combobox, ReactiveFormsModule],
    template: `
        <fd-combobox
            ariaLabel="Fruit"
            [dropdownValues]="fruits"
            [autoComplete]="autoComplete()"
            [formControl]="control"
            (itemClicked)="clicked.set($event.item)"
        />
        <fd-combobox
            id="objects"
            ariaLabel="Item"
            communicateByObject
            valueProperty="id"
            [displayFn]="display"
            [dropdownValues]="items"
            [formControl]="objectControl"
        />
        <button type="button">Outside</button>
    `
})
class Host {
    readonly fruits = ['Apple', 'Apricot', 'Banana', 'Cherry'];
    readonly items: Item[] = [
        { id: 1, name: 'One' },
        { id: 2, name: 'Two' }
    ];
    readonly display = (item: Item | null | undefined) => item?.name ?? '';
    readonly autoComplete = signal(true);
    readonly clicked = signal<unknown>(null);
    readonly control = new FormControl<unknown>('');
    readonly objectControl = new FormControl<unknown>(2);
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const options = () => [...document.querySelectorAll<HTMLElement>('[role=option]')];

async function setup(autoComplete = true) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.autoComplete.set(autoComplete);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('fd-combobox input')!;
    return { fixture, host: fixture.componentInstance, root, input };
}

describe('Combobox', () => {
    it('is a combobox input that filters the values while typing', async () => {
        const { fixture, input } = await setup(false);
        expect(input.getAttribute('role')).toBe('combobox');
        expect(input.getAttribute('aria-expanded')).toBe('false');
        await userEvent.type(input, 'ap');
        await fixture.whenStable();
        expect(input.getAttribute('aria-expanded')).toBe('true');
        expect(options().map((o) => o.textContent?.trim())).toEqual(['Apple', 'Apricot']);
        expect(options()[0].querySelector('b')?.textContent).toBe('Ap');
    });

    it('completes the text inline and takes it over with Enter', async () => {
        const { fixture, host, input } = await setup();
        input.focus();
        await userEvent.keyboard('ba');
        await fixture.whenStable();
        await wait();
        expect(input.value).toBe('Banana');
        expect(input.selectionStart).toBe(2);
        expect(host.control.value).toBe('ba');
        await userEvent.keyboard('{Enter}');
        await fixture.whenStable();
        expect(host.control.value).toBe('Banana');
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('highlights items with the arrow keys and chooses with Enter', async () => {
        const { fixture, host, input } = await setup(false);
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await fixture.whenStable();
        expect(options()).toHaveLength(4);
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        await fixture.whenStable();
        expect(input.getAttribute('aria-activedescendant')).toBe(options()[1].id);
        expect(input.value).toBe('Apricot');
        await userEvent.keyboard('{ArrowDown}{Enter}');
        await fixture.whenStable();
        expect(host.control.value).toBe('Banana');
        expect(host.clicked()).toBe('Banana');
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('chooses an item on click and closes', async () => {
        const { fixture, host, input } = await setup(false);
        await userEvent.type(input, 'c');
        await fixture.whenStable();
        await userEvent.click(options()[0]);
        await fixture.whenStable();
        expect(host.control.value).toBe('Cherry');
        expect(input.value).toBe('Cherry');
        expect(document.activeElement).toBe(input);
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('steps through the values with the arrow keys while closed', async () => {
        const { fixture, host, input } = await setup(false);
        host.control.setValue('Apricot');
        await fixture.whenStable();
        input.focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(host.control.value).toBe('Banana');
        await userEvent.keyboard('{ArrowUp}{ArrowUp}');
        expect(host.control.value).toBe('Apple');
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens the full list with the button and closes with Escape', async () => {
        const { fixture, root, input } = await setup(false);
        await userEvent.click(root.querySelector<HTMLButtonElement>('fd-combobox button')!);
        await fixture.whenStable();
        expect(options()).toHaveLength(4);
        expect(document.activeElement).toBe(input);
        await userEvent.keyboard('{Escape}');
        await fixture.whenStable();
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('communicates by object with a value property', async () => {
        const { fixture, host, root } = await setup(false);
        const input = root.querySelector<HTMLInputElement>('#objects input')!;
        expect(input.value).toBe('Two');
        await userEvent.clear(input);
        await userEvent.type(input, 'One');
        await fixture.whenStable();
        expect(host.objectControl.value).toBe(1);
        await userEvent.type(input, 'x');
        expect(host.objectControl.value).toBeNull();
    });
});
