import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Select, SelectOption } from './select';

@Component({
    imports: [Select, SelectOption, ReactiveFormsModule],
    template: `
        <fd-select
            ariaLabel="Fruit"
            placeholder="Pick one"
            [mobile]="mobile()"
            [mobileConfig]="{ title: 'Fruit', approveButtonText: 'Save', cancelButtonText: 'Cancel' }"
            [formControl]="control"
        >
            @for (option of options; track option) {
                <li fd-option [value]="option" [disabled]="option === 'Cherry'">{{ option }}</li>
            }
        </fd-select>
        <button type="button">Outside</button>
    `
})
class Host {
    readonly options = ['Apple', 'Banana', 'Cherry', 'Date'];
    readonly mobile = signal(false);
    readonly control = new FormControl<string | null | undefined>(null);
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const options = () => [...document.querySelectorAll<HTMLElement>('[role=option]')];

async function setup(mobile = false) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mobile.set(mobile);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const combobox = root.querySelector<HTMLElement>('[role=combobox]')!;
    return { fixture, host: fixture.componentInstance, root, combobox };
}

describe('Select', () => {
    it('shows the placeholder and the selected option as a combobox', async () => {
        const { fixture, host, combobox } = await setup();
        expect(combobox.getAttribute('aria-haspopup')).toBe('listbox');
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
        expect(combobox.textContent?.trim()).toBe('Pick one');
        expect(combobox.hasAttribute('data-placeholder')).toBe(true);
        host.control.setValue('Banana');
        await fixture.whenStable();
        expect(combobox.textContent?.trim()).toBe('Banana');
        expect(combobox.hasAttribute('data-placeholder')).toBe(false);
    });

    it('opens on click, highlights with the arrow keys and selects with Enter', async () => {
        const { fixture, host, combobox } = await setup();
        await userEvent.click(combobox);
        await fixture.whenStable();
        expect(combobox.getAttribute('aria-expanded')).toBe('true');
        expect(document.activeElement).toBe(combobox);
        expect(combobox.getAttribute('aria-activedescendant')).toBe(options()[0].id);

        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        await fixture.whenStable();
        // Cherry is disabled and skipped
        expect(combobox.getAttribute('aria-activedescendant')).toBe(options()[3].id);
        await userEvent.keyboard('{Enter}');
        await fixture.whenStable();
        expect(host.control.value).toBe('Date');
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(combobox);
    });

    it('selects an option on click and marks it selected', async () => {
        const { fixture, host, combobox } = await setup();
        await userEvent.click(combobox);
        await fixture.whenStable();
        await userEvent.click(options()[1]);
        await fixture.whenStable();
        expect(host.control.value).toBe('Banana');
        await userEvent.click(combobox);
        await fixture.whenStable();
        expect(options()[1].getAttribute('aria-selected')).toBe('true');
        expect(combobox.getAttribute('aria-activedescendant')).toBe(options()[1].id);
    });

    it('closes with Escape without changing the value', async () => {
        const { fixture, host, combobox } = await setup();
        host.control.setValue('Apple');
        await userEvent.click(combobox);
        await userEvent.keyboard('{ArrowDown}{Escape}');
        await fixture.whenStable();
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
        expect(host.control.value).toBe('Apple');
    });

    it('changes the value with the arrow keys and typing while closed', async () => {
        const { fixture, host, combobox } = await setup();
        combobox.focus();
        await userEvent.keyboard('{ArrowDown}');
        await fixture.whenStable();
        expect(host.control.value).toBe('Apple');
        await userEvent.keyboard('{End}');
        expect(host.control.value).toBe('Date');
        await userEvent.keyboard('b');
        await wait(300);
        expect(host.control.value).toBe('Banana');
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
    });

    it('marks the control touched on blur and follows the disabled state', async () => {
        const { fixture, host, combobox } = await setup();
        combobox.focus();
        combobox.blur();
        expect(host.control.touched).toBe(true);
        host.control.disable();
        await fixture.whenStable();
        expect(combobox.getAttribute('aria-disabled')).toBe('true');
        expect(combobox.getAttribute('tabindex')).toBe('-1');
        await userEvent.click(combobox, { force: true });
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
    });

    it('applies the choice in mobile mode only when it is approved', async () => {
        const { fixture, host, combobox } = await setup(true);
        await userEvent.click(combobox);
        await fixture.whenStable();
        await wait();
        expect(document.querySelector('[role=dialog]')).not.toBeNull();
        await userEvent.click(options()[1]);
        expect(host.control.value).toBeNull();
        expect(options()[1].getAttribute('aria-selected')).toBe('true');
        const save = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith('Save'))!;
        await userEvent.click(save);
        await fixture.whenStable();
        await wait(300);
        expect(host.control.value).toBe('Banana');
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
    });
});
