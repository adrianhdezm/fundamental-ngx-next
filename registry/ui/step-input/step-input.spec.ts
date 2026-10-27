import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { StepInput } from './step-input';

@Component({
    imports: [StepInput, ReactiveFormsModule],
    template: `
        <fd-step-input
            ariaLabel="Quantity"
            [min]="0"
            [max]="10"
            [step]="step()"
            [locale]="locale()"
            [unit]="unit()"
            [formControl]="control"
            (onFocusIn)="focusEvents.push('in')"
            (onFocusOut)="focusEvents.push('out')"
        />
        <button type="button">Outside</button>
    `
})
class Host {
    readonly step = signal(1);
    readonly locale = signal('en-US');
    readonly unit = signal<string | null>(null);
    readonly control = new FormControl<number | null>(5);
    readonly focusEvents: string[] = [];
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));

async function setup(config: { step?: number; locale?: string; unit?: string; value?: number | null } = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.step) host.step.set(config.step);
    if (config.locale) host.locale.set(config.locale);
    if (config.unit) host.unit.set(config.unit);
    if (config.value !== undefined) host.control.setValue(config.value);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('input')!;
    const [decrement, increment] = [...root.querySelectorAll<HTMLButtonElement>('fd-step-input button')];
    return { fixture, host, root, input, decrement, increment };
}

describe('StepInput', () => {
    it('is a spin button with the value and its limits', async () => {
        const { input, increment, decrement } = await setup();
        expect(input.getAttribute('role')).toBe('spinbutton');
        expect(input.value).toBe('5');
        expect(input.getAttribute('aria-valuenow')).toBe('5');
        expect(input.getAttribute('aria-valuemin')).toBe('0');
        expect(input.getAttribute('aria-valuemax')).toBe('10');
        expect(increment.getAttribute('aria-label')).toBe('Increase');
        expect(decrement.getAttribute('aria-controls')).toBe(input.id);
    });

    it('steps with the buttons and disables them at the limits', async () => {
        const { fixture, host, input, increment, decrement } = await setup({ value: 9 });
        await userEvent.click(increment);
        await fixture.whenStable();
        expect(host.control.value).toBe(10);
        expect(input.value).toBe('10');
        expect(increment.disabled).toBe(true);
        await userEvent.click(decrement);
        expect(host.control.value).toBe(9);
        expect(document.activeElement).toBe(input);
    });

    it('steps with the keyboard', async () => {
        const { host, input } = await setup();
        input.focus();
        await userEvent.keyboard('{ArrowUp}{ArrowUp}');
        expect(host.control.value).toBe(7);
        await userEvent.keyboard('{ArrowDown}');
        expect(host.control.value).toBe(6);
        await userEvent.keyboard('{End}');
        expect(host.control.value).toBe(10);
        await userEvent.keyboard('{Home}');
        expect(host.control.value).toBe(0);
    });

    it('adds decimal steps without floating point noise', async () => {
        const { host, input } = await setup({ step: 0.1, value: 0.2 });
        input.focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(host.control.value).toBe(0.3);
    });

    it('parses typed text in the locale and limits it on change', async () => {
        const { fixture, host, input } = await setup({ locale: 'de-DE', value: 1 });
        await userEvent.clear(input);
        await userEvent.type(input, '7,5{Enter}');
        await fixture.whenStable();
        expect(host.control.value).toBe(7.5);
        expect(input.value).toBe('7,5');
        await userEvent.clear(input);
        await userEvent.type(input, '42{Enter}');
        expect(host.control.value).toBe(10);
        await userEvent.clear(input);
        await userEvent.type(input, 'abc{Enter}');
        expect(host.control.value).toBe(10);
        expect(input.value).toBe('10');
        await userEvent.clear(input);
        await userEvent.keyboard('{Enter}');
        expect(host.control.value).toBeNull();
    });

    it('starts an empty value at the minimum', async () => {
        const { host, increment } = await setup({ value: null });
        await userEvent.click(increment);
        expect(host.control.value).toBe(0);
    });

    it('repeats while a button is held', async () => {
        const { host, increment } = await setup({ value: 0 });
        increment.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
        await wait(700);
        window.dispatchEvent(new PointerEvent('pointerup'));
        const value = host.control.value!;
        expect(value).toBeGreaterThan(2);
        await wait(100);
        expect(host.control.value).toBe(value);
    });

    it('describes the input with the unit and marks it touched on blur', async () => {
        const { fixture, host, root, input } = await setup({ unit: 'kg' });
        await fixture.whenStable();
        const unit = document.getElementById(input.getAttribute('aria-describedby')!);
        expect(unit?.textContent?.trim()).toBe('kg');
        input.focus();
        await userEvent.click(root.querySelector('button[type=button]:not([fdButton])')!);
        expect(host.control.touched).toBe(true);
    });

    it('emits onFocusIn and onFocusOut', async () => {
        const { host, root, input } = await setup();
        await userEvent.click(input);
        expect(host.focusEvents).toEqual(['in']);
        await userEvent.click(root.querySelector('button[type=button]:not([fdButton])')!);
        expect(host.focusEvents).toEqual(['in', 'out']);
    });
});
