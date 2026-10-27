import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Icon } from '@/ui/icon/icon';
import { type FormState } from '@/ui/input/input';
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

    it('writes only null or numbers from the form', async () => {
        const { fixture, host, input } = await setup();
        host.control.setValue('12ab34' as unknown as number);
        await fixture.whenStable();
        expect(input.value).toBe('5');
        expect(input.getAttribute('aria-valuenow')).toBe('5');
        host.control.setValue(7);
        await fixture.whenStable();
        expect(input.value).toBe('7');
        host.control.setValue(null);
        await fixture.whenStable();
        expect(input.value).toBe('');
        expect(input.hasAttribute('aria-valuenow')).toBe(false);
    });
});

@Component({
    imports: [StepInput, Icon],
    template: `
        <div [attr.data-density]="density()">
            <fd-step-input
                [inputId]="inputId()"
                [ariaLabel]="ariaLabel()"
                [inputTitle]="inputTitle()"
                [min]="min()"
                [max]="max()"
                [step]="step()"
                [state]="state()"
                [readonly]="readonly()"
                [disableWheel]="disableWheel()"
                [mode]="mode()"
                [currency]="currency()"
                [incrementButtonIcon]="incrementIcon()"
                [decrementButtonIcon]="decrementIcon()"
                [(value)]="value"
            />
        </div>
        <fd-icon id="ref-up" glyph="arrow-top" />
        <fd-icon id="ref-down" glyph="arrow-bottom" />
        <button type="button" id="elsewhere">Elsewhere</button>
    `
})
class OptionsHost {
    readonly density = signal<string | null>(null);
    readonly inputId = signal('qty');
    readonly ariaLabel = signal<string | null>('Quantity');
    readonly inputTitle = signal<string | null>(null);
    readonly min = signal<number | null>(null);
    readonly max = signal<number | null>(null);
    readonly step = signal(1);
    readonly state = signal<FormState | null>(null);
    readonly readonly = signal(false);
    readonly disableWheel = signal(false);
    readonly mode = signal<'decimal' | 'currency'>('decimal');
    readonly currency = signal<string | null>(null);
    readonly incrementIcon = signal('add');
    readonly decrementIcon = signal('less');
    readonly value = signal<number | null | undefined>(5);
}

async function setupOptions(configure?: (host: OptionsHost) => void) {
    const fixture = TestBed.createComponent(OptionsHost);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const stepInput = root.querySelector<HTMLElement>('fd-step-input')!;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        input: stepInput.querySelector<HTMLInputElement>('input')!,
        field: stepInput.firstElementChild as HTMLElement,
        buttons: () => [...stepInput.querySelectorAll<HTMLButtonElement>('button')],
        stable: () => fixture.whenStable()
    };
}

/** A token colour as the browser computes it. */
function tokenColor(token: string): string {
    const probe = document.createElement('span');
    probe.style.color = `var(${token})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
}

describe('StepInput options', () => {
    it('steps with Enter and Space on the buttons', async () => {
        const { host, buttons, stable } = await setupOptions();
        const [decrement, increment] = buttons();
        increment.focus();
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(host.value()).toBe(6);
        await userEvent.keyboard(' ');
        await stable();
        expect(host.value()).toBe(7);
        decrement.focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        await stable();
        expect(host.value()).toBe(5);
    });

    it('steps by a custom step, and by ten steps with Page Up and Page Down', async () => {
        const { host, input, buttons, stable } = await setupOptions((h) => {
            h.step.set(5);
            h.value.set(10);
        });
        await userEvent.click(buttons()[1]);
        await stable();
        expect(host.value()).toBe(15);
        input.focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(host.value()).toBe(10);
        await userEvent.keyboard('{PageUp}');
        await stable();
        expect(host.value()).toBe(60);
        expect(input.value).toBe('60');
        await userEvent.keyboard('{PageDown}{PageDown}');
        expect(host.value()).toBe(-40);
    });

    it('is smaller in compact density', async () => {
        const { field, buttons, stable, host } = await setupOptions();
        const cozy = {
            field: field.getBoundingClientRect().height,
            button: buttons()[0].getBoundingClientRect().width
        };
        host.density.set('compact');
        await stable();
        expect(field.getBoundingClientRect().height).toBeLessThan(cozy.field);
        expect(buttons()[0].getBoundingClientRect().width).toBeLessThan(cozy.button);
    });

    it('shows the error state with aria-invalid and the invalid border colour', async () => {
        const { input, field, stable, host } = await setupOptions();
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        host.state.set('error');
        await stable();
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(getComputedStyle(field).borderTopColor).toBe(tokenColor('--sapField_InvalidColor'));
        host.state.set('success');
        await stable();
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(getComputedStyle(field).borderTopColor).toBe(tokenColor('--sapField_SuccessColor'));
    });

    it('puts titles on the buttons and the input, and takes custom button icons', async () => {
        const { root, input, buttons, stable, host } = await setupOptions((h) => h.inputTitle.set('Number of items'));
        const [decrement, increment] = buttons();
        expect(decrement.getAttribute('title')).toBe('Decrease');
        expect(increment.getAttribute('title')).toBe('Increase');
        expect(input.getAttribute('title')).toBe('Number of items');
        const glyph = (el: Element) => el.querySelector('fd-icon')!.getAttribute('data-glyph');
        const defaultUp = glyph(increment);
        host.incrementIcon.set('arrow-top');
        host.decrementIcon.set('arrow-bottom');
        await stable();
        expect(glyph(increment)).not.toBe(defaultUp);
        expect(glyph(increment)).toBe(root.querySelector('#ref-up')!.getAttribute('data-glyph'));
        expect(glyph(decrement)).toBe(root.querySelector('#ref-down')!.getAttribute('data-glyph'));
    });

    it('puts inputId and ariaLabel on the input', async () => {
        const { input, buttons } = await setupOptions((h) => {
            h.inputId.set('items-count');
            h.ariaLabel.set('Items');
        });
        expect(input.id).toBe('items-count');
        expect(input.getAttribute('aria-label')).toBe('Items');
        expect(buttons()[1].getAttribute('aria-controls')).toBe('items-count');
    });

    it('steps with the wheel only while focused, and not with disableWheel', async () => {
        const { host, input, root, stable } = await setupOptions();
        const wheel = (deltaY: number) => {
            const event = new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true });
            input.dispatchEvent(event);
            return event;
        };
        expect(wheel(-100).defaultPrevented).toBe(false);
        expect(host.value()).toBe(5);
        input.focus();
        expect(wheel(-100).defaultPrevented).toBe(true);
        expect(host.value()).toBe(6);
        wheel(100);
        wheel(100);
        expect(host.value()).toBe(4);
        root.querySelector<HTMLElement>('#elsewhere')!.focus();
        wheel(-100);
        expect(host.value()).toBe(4);
        host.disableWheel.set(true);
        await stable();
        input.focus();
        expect(wheel(-100).defaultPrevented).toBe(false);
        expect(host.value()).toBe(4);
    });

    it('starts from the limit when a value at the maximum is cleared', async () => {
        const { host, input, buttons, stable } = await setupOptions((h) => {
            h.min.set(100);
            h.max.set(100);
            h.value.set(100);
        });
        await userEvent.clear(input);
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(host.value()).toBeNull();
        await userEvent.click(buttons()[1]);
        await stable();
        expect(host.value()).toBe(100);
        await userEvent.clear(input);
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(host.value()).toBeNull();
        await userEvent.click(buttons()[0]);
        await stable();
        expect(host.value()).toBe(100);
    });

    it('formats and parses euros in currency mode', async () => {
        const { host, root, input, stable } = await setupOptions((h) => {
            h.mode.set('currency');
            h.currency.set('EUR');
            h.value.set(1234.5);
        });
        expect(input.value).toBe('1,234.50');
        const unit = root.querySelector(`#${input.getAttribute('aria-describedby')}`)!;
        expect(unit.textContent!.trim()).toBe('€');
        await userEvent.clear(input);
        await userEvent.type(input, '€2,000.25{Enter}');
        await stable();
        expect(host.value()).toBe(2000.25);
        expect(input.value).toBe('2,000.25');
    });

    it('hides the buttons and blocks changes when read-only', async () => {
        const { host, input, buttons, stable } = await setupOptions((h) => h.readonly.set(true));
        expect(buttons()).toHaveLength(0);
        expect(input.readOnly).toBe(true);
        input.focus();
        await userEvent.keyboard('{ArrowUp}{PageUp}');
        await userEvent.type(input, '9');
        input.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
        await stable();
        expect(host.value()).toBe(5);
        expect(input.value).toBe('5');
    });
});

describe('StepInput forms disabled', () => {
    it('disables the input and both buttons with disable()', async () => {
        const { fixture, host, input, increment, decrement } = await setup();
        host.control.disable();
        await fixture.whenStable();
        expect(input.disabled).toBe(true);
        expect(increment.disabled).toBe(true);
        expect(decrement.disabled).toBe(true);
        host.control.enable();
        await fixture.whenStable();
        expect(input.disabled).toBe(false);
        expect(increment.disabled).toBe(false);
        expect(decrement.disabled).toBe(false);
    });
});
