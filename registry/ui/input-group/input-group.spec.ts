import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group';

@Component({
    imports: [InputGroup, InputGroupInput, InputGroupAddon, ReactiveFormsModule],
    template: `
        <label for="amount">Amount</label>
        <fd-input-group
            inputId="amount"
            addOnText="$"
            [placement]="placement()"
            [type]="type()"
            [formControl]="control"
        />
        <fd-input-group
            id="button-group"
            glyph="decline"
            glyphAriaLabel="Clear"
            button
            ariaLabel="Search"
            [buttonFocusable]="focusable()"
            (addOnButtonClicked)="clicks.set(clicks() + 1)"
        />
        <fd-input-group id="projected">
            <input fdInputGroupInput aria-label="Date" />
            <span fdInputGroupAddon button><button type="button" aria-label="Calendar">C</button></span>
        </fd-input-group>
    `
})
class Host {
    readonly placement = signal<'before' | 'after'>('after');
    readonly type = signal('text');
    readonly focusable = signal(true);
    readonly clicks = signal(0);
    readonly control = new FormControl<string | number | null>('10');
}

@Component({
    imports: [InputGroup],
    template: `
        <fd-input-group
            ariaLabel="Field"
            [glyph]="glyph()"
            [glyphAriaLabel]="glyphAriaLabel()"
            [addOnText]="addOnText()"
            [button]="button()"
        />
    `
})
class AddonHost {
    readonly glyph = signal<string | null>(null);
    readonly glyphAriaLabel = signal<string | null>(null);
    readonly addOnText = signal<string | null>(null);
    readonly button = signal(false);
}

async function setupAddon(
    init: Partial<{ glyph: string; glyphAriaLabel: string; addOnText: string; button: boolean }>
) {
    const fixture = TestBed.createComponent(AddonHost);
    const host = fixture.componentInstance;
    if (init.glyph) host.glyph.set(init.glyph);
    if (init.glyphAriaLabel) host.glyphAriaLabel.set(init.glyphAriaLabel);
    if (init.addOnText) host.addOnText.set(init.addOnText);
    if (init.button) host.button.set(true);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        addon: root.querySelector<HTMLElement>('[fdInputGroupAddon]')!,
        icon: root.querySelector<HTMLElement>('[fdInputGroupAddon] fd-icon'),
        button: root.querySelector<HTMLButtonElement>('[fdInputGroupAddon] button')
    };
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const group = root.querySelector<HTMLElement>('fd-input-group')!;
    return { fixture, host: fixture.componentInstance, root, group, input: group.querySelector('input')! };
}

describe('InputGroup', () => {
    it('renders an input labelled by its label and described by the text addon', async () => {
        const { group, input } = await setup();
        expect(input.id).toBe('amount');
        expect(input.labels?.[0]?.textContent).toBe('Amount');
        const addon = group.querySelector('[fdInputGroupAddon]')!;
        expect(addon.textContent?.trim()).toBe('$');
        expect(input.getAttribute('aria-describedby')).toBe(addon.id);
    });

    it('places the addon before or after the input', async () => {
        const { fixture, host, group } = await setup();
        expect(group.firstElementChild?.tagName).toBe('INPUT');
        host.placement.set('before');
        await fixture.whenStable();
        expect(group.firstElementChild?.hasAttribute('fdInputGroupAddon')).toBe(true);
        expect(group.lastElementChild?.tagName).toBe('INPUT');
    });

    it('works as a form control', async () => {
        const { fixture, host, group, input } = await setup();
        expect(input.value).toBe('10');
        await userEvent.clear(input);
        await userEvent.type(input, 'abc');
        expect(host.control.value).toBe('abc');
        input.blur();
        expect(host.control.touched).toBe(true);

        host.control.setValue('xyz');
        await fixture.whenStable();
        expect(input.value).toBe('xyz');

        host.control.disable();
        await fixture.whenStable();
        expect(input.disabled).toBe(true);
        expect(group.hasAttribute('data-disabled')).toBe(true);
    });

    it('emits numbers for number inputs', async () => {
        const { fixture, host, input } = await setup();
        host.type.set('number');
        await fixture.whenStable();
        await userEvent.clear(input);
        expect(host.control.value).toBeNull();
        await userEvent.type(input, '42');
        expect(host.control.value).toBe(42);
    });

    it('emits addOnButtonClicked from the addon button', async () => {
        const { root, host } = await setup();
        const button = root.querySelector<HTMLButtonElement>('#button-group button')!;
        expect(button.getAttribute('aria-label')).toBe('Clear');
        expect(button.getAttribute('aria-controls')).toBe(root.querySelector('#button-group input')!.id);
        await userEvent.click(button);
        expect(host.clicks()).toBe(1);
    });

    it('keeps the focus in the input when the button is not focusable', async () => {
        const { fixture, root, host } = await setup();
        host.focusable.set(false);
        await fixture.whenStable();
        const input = root.querySelector<HTMLInputElement>('#button-group input')!;
        const button = root.querySelector<HTMLButtonElement>('#button-group button')!;
        expect(button.tabIndex).toBe(-1);
        input.focus();
        await userEvent.click(button);
        expect(document.activeElement).toBe(input);
        expect(host.clicks()).toBe(1);
    });

    it('uses projected inputs and addons instead of its own', async () => {
        const { root } = await setup();
        const group = root.querySelector('#projected')!;
        expect(group.querySelectorAll('input')).toHaveLength(1);
        expect(group.querySelector('input')!.getAttribute('aria-label')).toBe('Date');
        expect(group.querySelectorAll('[fdInputGroupAddon]')).toHaveLength(1);
    });

    describe('addon accessible names', () => {
        it('names the icon of a non-button addon with glyphAriaLabel, not the addon', async () => {
            const { addon, icon } = await setupAddon({ glyph: 'search', glyphAriaLabel: 'Search icon' });
            expect(addon.hasAttribute('aria-label')).toBe(false);
            expect(icon!.getAttribute('role')).toBe('img');
            expect(icon!.getAttribute('aria-label')).toBe('Search icon');
        });

        it('falls back to the glyph name for the icon of a non-button addon', async () => {
            const { addon, icon } = await setupAddon({ glyph: 'search' });
            expect(addon.hasAttribute('aria-label')).toBe(false);
            expect(icon!.getAttribute('role')).toBe('img');
            expect(icon!.getAttribute('aria-label')).toBe('search');
        });

        it('has no labelled icon in a text-only addon', async () => {
            const { addon, icon } = await setupAddon({ addOnText: 'USD' });
            expect(icon).toBeNull();
            expect(addon.hasAttribute('aria-label')).toBe(false);
            expect(addon.textContent?.trim()).toBe('USD');
        });

        it('falls back to the glyph name for a button addon without glyphAriaLabel', async () => {
            const { button } = await setupAddon({ glyph: 'search', button: true });
            expect(button!.getAttribute('aria-label')).toBe('search');
        });

        it('names a button addon without glyph by its addOnText', async () => {
            const { button } = await setupAddon({ addOnText: 'USD', button: true });
            // the text is the visible label of the button; with aria-label it must match it
            expect(button!.getAttribute('aria-label') ?? button!.textContent?.trim()).toBe('USD');
            expect(button!.textContent?.trim()).toBe('USD');
            expect(button!.querySelector('fd-icon')).toBeNull();
        });
    });
});
