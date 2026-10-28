import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Select, SelectOption, type SelectMobileConfig } from './select';

@Component({
    imports: [Select, SelectOption, ReactiveFormsModule],
    template: `
        <fd-select
            ariaLabel="Fruit"
            placeholder="Pick one"
            [mobile]="mobile()"
            [mobileConfig]="mobileConfig()"
            [closeOnOutsideClick]="closeOnOutsideClick()"
            [maxHeight]="maxHeight()"
            [formControl]="control"
        >
            @for (option of options(); track option) {
                <li fd-option [value]="option" [disabled]="option === 'Cherry'">{{ option }}</li>
            }
        </fd-select>
        <button type="button">Outside</button>
    `
})
class Host {
    readonly options = signal(['Apple', 'Banana', 'Cherry', 'Date']);
    readonly mobile = signal(false);
    readonly mobileConfig = signal<SelectMobileConfig>({
        title: 'Fruit',
        approveButtonText: 'Save',
        cancelButtonText: 'Cancel'
    });
    readonly closeOnOutsideClick = signal(true);
    readonly maxHeight = signal<string | undefined>(undefined);
    readonly control = new FormControl<string | null | undefined>(null);
}

interface Car {
    id: number;
    name: string;
}

@Component({
    imports: [Select, SelectOption],
    template: `
        <fd-select ariaLabel="Car" placeholder="Pick one" [compareWith]="compareWith()" [(value)]="value">
            @for (car of cars; track car.id) {
                <li fd-option [value]="car">{{ car.name }}</li>
            }
        </fd-select>
    `
})
class CompareHost {
    readonly cars: Car[] = [
        { id: 1, name: 'Sedan' },
        { id: 2, name: 'Coupe' },
        { id: 3, name: 'Convertible' }
    ];
    readonly compareWith = signal<(a: Car | null | undefined, b: Car | null | undefined) => boolean>((a, b) => a === b);
    readonly value = signal<Car | null | undefined>(undefined);
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const options = () => [...document.querySelectorAll<HTMLElement>('[role=option]')];
const dialog = () => document.querySelector<HTMLElement>('[role=dialog]');
const button = (label: string) =>
    [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim().startsWith(label));

async function setup(mobile = false, init?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mobile.set(mobile);
    init?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const combobox = root.querySelector<HTMLElement>('[role=combobox]')!;
    return { fixture, host: fixture.componentInstance, root, combobox };
}

async function setupCompare(init: (host: CompareHost) => void) {
    const fixture = TestBed.createComponent(CompareHost);
    init(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const combobox = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role=combobox]')!;
    return { fixture, host: fixture.componentInstance, combobox };
}

/** Opens the select with a click and waits for the overlay. */
async function openList(fixture: { whenStable(): Promise<unknown> }, combobox: HTMLElement) {
    await userEvent.click(combobox);
    await fixture.whenStable();
    await frame();
}

const activeText = (combobox: HTMLElement) =>
    document.getElementById(combobox.getAttribute('aria-activedescendant') ?? '')?.textContent?.trim();

describe('Select', () => {
    afterEach(() => document.documentElement.removeAttribute('data-density'));

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

    it('does not select a disabled option on click', async () => {
        const { fixture, host, combobox } = await setup(false, (h) => h.control.setValue('Apple'));
        await openList(fixture, combobox);
        const cherry = options()[2];
        expect(cherry.getAttribute('aria-disabled')).toBe('true');
        cherry.click();
        await fixture.whenStable();
        expect(host.control.value).toBe('Apple');
        expect(cherry.getAttribute('aria-selected')).toBe('false');
        expect(combobox.getAttribute('aria-expanded')).toBe('true');
    });

    it('shrinks the control and the options in compact density', async () => {
        const { fixture, combobox } = await setup();
        await openList(fixture, combobox);
        const cozy = { control: combobox.offsetHeight, option: options()[0].offsetHeight };
        await userEvent.keyboard('{Escape}');
        await fixture.whenStable();

        document.documentElement.setAttribute('data-density', 'compact');
        await openList(fixture, combobox);
        expect(combobox.offsetHeight).toBeLessThan(cozy.control);
        expect(options()[0].offsetHeight).toBeLessThan(cozy.option);
    });

    it('closes the list when the trigger is clicked again', async () => {
        const { fixture, combobox } = await setup();
        await openList(fixture, combobox);
        expect(combobox.getAttribute('aria-expanded')).toBe('true');
        await userEvent.click(combobox);
        await fixture.whenStable();
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
        expect(document.querySelector('[role=listbox]')).toBeNull();
    });

    it('closes on an outside click unless closeOnOutsideClick is false', async () => {
        const { fixture, host, root, combobox } = await setup();
        const outside = root.querySelector<HTMLElement>('button')!;
        await openList(fixture, combobox);
        await userEvent.click(outside);
        await fixture.whenStable();
        expect(combobox.getAttribute('aria-expanded')).toBe('false');

        host.closeOnOutsideClick.set(false);
        await fixture.whenStable();
        await openList(fixture, combobox);
        await userEvent.click(outside);
        await fixture.whenStable();
        expect(combobox.getAttribute('aria-expanded')).toBe('true');
        expect(host.control.value).toBeNull();
    });

    it('shows the placeholder for a value that is not among the options', async () => {
        const { fixture, combobox } = await setup(false, (h) => h.control.setValue('Mango'));
        expect(combobox.textContent?.trim()).toBe('Pick one');
        expect(combobox.hasAttribute('data-placeholder')).toBe(true);
        await openList(fixture, combobox);
        expect(options().some((o) => o.getAttribute('aria-selected') === 'true')).toBe(false);
        // nothing selected: the first option is highlighted
        expect(combobox.getAttribute('aria-activedescendant')).toBe(options()[0].id);
    });

    it('moves the active option with Home and End while open', async () => {
        const { fixture, host, combobox } = await setup();
        await openList(fixture, combobox);
        await userEvent.keyboard('{End}');
        await fixture.whenStable();
        expect(activeText(combobox)).toBe('Date');
        await userEvent.keyboard('{Home}');
        await fixture.whenStable();
        expect(activeText(combobox)).toBe('Apple');
        // moving the highlight while open does not change the value
        expect(host.control.value).toBeNull();
        expect(combobox.getAttribute('aria-expanded')).toBe('true');
    });

    it('selects the active option with Space and closes', async () => {
        const { fixture, host, combobox } = await setup();
        await openList(fixture, combobox);
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard(' ');
        await fixture.whenStable();
        expect(host.control.value).toBe('Banana');
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(combobox);
    });

    it.each([
        ['Enter', '{Enter}'],
        ['Space', ' '],
        ['Alt+ArrowDown', '{Alt>}{ArrowDown}{/Alt}'],
        ['F4', '{F4}']
    ])('opens the list with %s on the trigger', async (_name, keys) => {
        const { fixture, host, combobox } = await setup();
        combobox.focus();
        await userEvent.keyboard(keys);
        await fixture.whenStable();
        expect(combobox.getAttribute('aria-expanded')).toBe('true');
        expect(document.querySelector('[role=listbox]')).not.toBeNull();
        expect(host.control.value).toBeNull();
    });

    it('scrolls the selected option into view when the list opens', async () => {
        const many = Array.from({ length: 30 }, (_, i) => `Option ${i + 1}`);
        const { fixture, combobox } = await setup(false, (h) => {
            h.options.set(many);
            h.maxHeight.set('8rem');
            h.control.setValue('Option 25');
        });
        await openList(fixture, combobox);
        await wait();
        const list = document.querySelector<HTMLElement>('[role=listbox]')!;
        const selected = options()[24];
        expect(selected.getAttribute('aria-selected')).toBe('true');
        expect(list.scrollTop).toBeGreaterThan(0);
        const listRect = list.getBoundingClientRect();
        const optionRect = selected.getBoundingClientRect();
        expect(optionRect.top).toBeGreaterThanOrEqual(listRect.top - 1);
        expect(optionRect.bottom).toBeLessThanOrEqual(listRect.bottom + 1);
    });

    it('moves to the option matching several typed characters', async () => {
        const { fixture, host, combobox } = await setup(false, (h) => h.options.set(['aaa', 'bbb', 'bxbb', 'ccc']));
        await openList(fixture, combobox);
        await userEvent.keyboard('bx');
        await wait(300);
        expect(activeText(combobox)).toBe('bxbb');
        await userEvent.keyboard('{Escape}');
        await fixture.whenStable();

        // closed, typing changes the value directly
        await userEvent.keyboard('bx');
        await wait(300);
        expect(host.control.value).toBe('bxbb');
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
    });

    it('matches the selected option by value with compareWith', async () => {
        const { fixture, host, combobox } = await setupCompare((h) => {
            h.compareWith.set((a, b) => a?.id === b?.id);
            h.value.set({ id: 2, name: 'Coupe' });
        });
        expect(combobox.textContent?.trim()).toBe('Coupe');
        await openList(fixture, combobox);
        expect(options()[1].getAttribute('aria-selected')).toBe('true');
        await userEvent.click(options()[2]);
        await fixture.whenStable();
        expect(host.value()).toBe(host.cars[2]);
        expect(combobox.textContent?.trim()).toBe('Convertible');
    });

    it('does not match a copied object with the default comparator', async () => {
        const { fixture, host, combobox } = await setupCompare((h) => h.value.set({ id: 2, name: 'Coupe' }));
        expect(combobox.textContent?.trim()).toBe('Pick one');
        await openList(fixture, combobox);
        expect(options().some((o) => o.getAttribute('aria-selected') === 'true')).toBe(false);
        await userEvent.keyboard('{Escape}');

        host.value.set(host.cars[1]);
        await fixture.whenStable();
        expect(combobox.textContent?.trim()).toBe('Coupe');
        host.value.set({ ...host.cars[1] });
        await fixture.whenStable();
        expect(combobox.textContent?.trim()).toBe('Pick one');
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

    it('mobile: Cancel closes the dialog and keeps the old value', async () => {
        const { fixture, host, combobox } = await setup(true, (h) => h.control.setValue('Apple'));
        await openList(fixture, combobox);
        await wait();
        expect(dialog()).not.toBeNull();
        await userEvent.click(options()[1]);
        expect(options()[1].getAttribute('aria-selected')).toBe('true');
        await userEvent.click(button('Cancel')!);
        await fixture.whenStable();
        await wait(300);
        expect(dialog()).toBeNull();
        expect(host.control.value).toBe('Apple');
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
        expect(combobox.textContent?.trim()).toBe('Apple');
    });

    it('mobile: renders with an empty mobileConfig and selects on click', async () => {
        const { fixture, host, combobox } = await setup(true, (h) => h.mobileConfig.set({}));
        await openList(fixture, combobox);
        await wait();
        const open = dialog()!;
        expect(open).not.toBeNull();
        expect(open.querySelector('[fd-title]')).toBeNull();
        expect(button('Save')).toBeUndefined();
        expect(button('Cancel')).toBeUndefined();
        // the close button is shown by default
        expect(open.querySelector('[fd-dialog-close-button]')).not.toBeNull();
        expect(open.querySelector('[role=listbox]')).not.toBeNull();

        await userEvent.click(options()[3]);
        await fixture.whenStable();
        await wait(300);
        expect(host.control.value).toBe('Date');
        expect(dialog()).toBeNull();
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
    });
});
