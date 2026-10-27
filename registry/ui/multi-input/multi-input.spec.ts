import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { MultiInput } from './multi-input';

@Component({
    imports: [MultiInput, ReactiveFormsModule],
    template: `
        <fd-multi-input
            ariaLabel="Fruits"
            [dropdownValues]="fruits"
            [allowNewTokens]="allowNew()"
            [autoComplete]="autoComplete()"
            [formControl]="control"
        />
        <button type="button">Outside</button>
    `
})
class Host {
    readonly fruits = ['Apple', 'Apricot', 'Banana', 'Cherry'];
    readonly allowNew = signal(false);
    readonly autoComplete = signal(true);
    readonly control = new FormControl<string[]>(['Banana']);
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const options = () => [...document.querySelectorAll<HTMLElement>('ul[role=listbox] [role=option]')];
const tokens = () => [...document.querySelectorAll<HTMLElement>('fd-token')].map((t) => t.textContent?.trim());

async function setup(config: { allowNew?: boolean; autoComplete?: boolean } = {}) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.allowNew.set(!!config.allowNew);
    fixture.componentInstance.autoComplete.set(config.autoComplete ?? true);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('input[role=combobox]')!;
    return { fixture, host: fixture.componentInstance, root, input };
}

describe('MultiInput', () => {
    it('shows the selected values as tokens', async () => {
        const { fixture, host } = await setup();
        expect(tokens()).toEqual(['Banana']);
        host.control.setValue(['Apple', 'Cherry']);
        await fixture.whenStable();
        expect(tokens()).toEqual(['Apple', 'Cherry']);
    });

    it('filters the options while typing and marks the selected ones', async () => {
        const { fixture, input } = await setup({ autoComplete: false });
        await userEvent.type(input, 'a');
        await fixture.whenStable();
        expect(input.getAttribute('aria-expanded')).toBe('true');
        expect(options().map((o) => o.textContent?.trim())).toEqual(['Apple', 'Apricot']);
        await userEvent.clear(input);
        await userEvent.keyboard('{ArrowDown}');
        await fixture.whenStable();
        expect(options()).toHaveLength(4);
        expect(options()[2].getAttribute('aria-selected')).toBe('true');
        expect(document.querySelector('ul[role=listbox][aria-multiselectable=true]')).not.toBeNull();
    });

    it('toggles options by click and with Enter on the highlighted option', async () => {
        const { fixture, host, input } = await setup();
        input.focus();
        await userEvent.keyboard('{ArrowDown}');
        await fixture.whenStable();
        await userEvent.click(options()[0]);
        expect(host.control.value).toEqual(['Banana', 'Apple']);
        expect(document.activeElement).toBe(input);
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        expect(input.getAttribute('aria-activedescendant')).toBe(options()[2].id);
        await userEvent.keyboard('{Enter}');
        expect(host.control.value).toEqual(['Apple']);
        await fixture.whenStable();
        expect(tokens()).toEqual(['Apple']);
    });

    it('selects the first match with Enter and clears the search', async () => {
        const { fixture, host, input } = await setup();
        input.focus();
        await userEvent.keyboard('ch');
        await fixture.whenStable();
        await wait();
        expect(input.value).toBe('Cherry');
        await userEvent.keyboard('{Enter}');
        await fixture.whenStable();
        expect(host.control.value).toEqual(['Banana', 'Cherry']);
        expect(input.value).toBe('');
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('adds new tokens when allowed', async () => {
        const { fixture, host, input } = await setup({ allowNew: true, autoComplete: false });
        await userEvent.type(input, 'Mango{Enter}');
        await fixture.whenStable();
        expect(host.control.value).toEqual(['Banana', 'Mango']);
        expect(tokens()).toEqual(['Banana', 'Mango']);
    });

    it('removes tokens with the close icon and Backspace', async () => {
        const { fixture, host, input } = await setup();
        host.control.setValue(['Apple', 'Banana']);
        await fixture.whenStable();
        await userEvent.click(document.querySelector<HTMLElement>('fd-token [aria-hidden=true]')!);
        expect(host.control.value).toEqual(['Banana']);
        input.focus();
        await userEvent.keyboard('{Backspace}{Backspace}');
        await fixture.whenStable();
        expect(host.control.value).toEqual([]);
    });

    it('closes with Escape and marks the control touched when the focus leaves', async () => {
        const { fixture, host, root, input } = await setup();
        await userEvent.type(input, 'b');
        await fixture.whenStable();
        await userEvent.keyboard('{Escape}');
        await fixture.whenStable();
        expect(input.getAttribute('aria-expanded')).toBe('false');
        await userEvent.click(root.querySelector('button:not([fdButton])')!);
        expect(host.control.touched).toBe(true);
    });
});
