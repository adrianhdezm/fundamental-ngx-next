import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { RadioButton, type RadioState } from './radio';

@Component({
    imports: [RadioButton, FormsModule],
    template: `
        <button id="before">Before</button>
        @for (option of options; track option) {
            <fd-radio-button
                name="size"
                [value]="option"
                [(ngModel)]="model"
                [disabled]="option === disabledOption()"
                [readOnly]="readOnly()"
                [state]="state()"
                >{{ option }}</fd-radio-button
            >
        }
        <button id="after">After</button>
    `
})
class NgModelHost {
    readonly options = ['s', 'm', 'l'];
    readonly model = signal<string | null>('m');
    readonly disabledOption = signal<string | null>(null);
    readonly readOnly = signal(false);
    readonly state = signal<RadioState>('default');
}

@Component({
    imports: [RadioButton, ReactiveFormsModule],
    template: `
        <fd-radio-button name="color" value="red" [formControl]="control">Red</fd-radio-button>
        <fd-radio-button name="color" value="blue" [formControl]="control">Blue</fd-radio-button>
    `
})
class ReactiveHost {
    readonly control = new FormControl<string | null>('red');
}

@Component({
    imports: [RadioButton],
    template: `
        <fd-radio-button name="fruit" value="apple" [selectedValue]="selected()">Apple</fd-radio-button>
        <fd-radio-button name="fruit" value="pear" [selectedValue]="selected()">Pear</fd-radio-button>
    `
})
class StandaloneHost {
    readonly selected = signal<string | undefined>('pear');
}

const frame = () => new Promise((r) => requestAnimationFrame(r));

async function render<T>(type: Type<T>, configure?: (host: T) => void) {
    const fixture = TestBed.createComponent(type);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await fixture.whenStable();
    };
    await stable();
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        inputs: [...root.querySelectorAll<HTMLInputElement>('input[type=radio]')],
        labels: [...root.querySelectorAll<HTMLLabelElement>('fd-radio-button label')],
        stable
    };
}

const checkedStates = (inputs: HTMLInputElement[]) => inputs.map((i) => i.checked);

describe('RadioButton', () => {
    afterEach(() => document.documentElement.removeAttribute('data-density'));

    it('works with ngModel: the model selects one radio and a click writes the model', async () => {
        const { host, inputs, labels, stable } = await render(NgModelHost);
        expect(checkedStates(inputs)).toEqual([false, true, false]);
        expect(inputs.map((i) => i.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
        expect(inputs.every((i) => i.name === 'size')).toBe(true);
        await userEvent.click(labels[2]);
        await stable();
        expect(host.model()).toBe('l');
        expect(checkedStates(inputs)).toEqual([false, false, true]);
        host.model.set('s');
        await stable();
        expect(checkedStates(inputs)).toEqual([true, false, false]);
        host.model.set(null);
        await stable();
        expect(checkedStates(inputs)).toEqual([false, false, false]);
    });

    it('works with reactive forms, including disable()', async () => {
        const { host, inputs, labels, stable } = await render(ReactiveHost);
        expect(checkedStates(inputs)).toEqual([true, false]);
        await userEvent.click(labels[1]);
        await stable();
        expect(host.control.value).toBe('blue');
        expect(host.control.dirty).toBe(true);
        inputs[1].blur();
        expect(host.control.touched).toBe(true);
        host.control.disable();
        await stable();
        expect(inputs.every((i) => i.disabled && i.getAttribute('aria-disabled') === 'true')).toBe(true);
        labels[0].click();
        await stable();
        expect(host.control.value).toBe('blue');
    });

    it('selectedValue selects the radio without a form', async () => {
        const { host, inputs, stable } = await render(StandaloneHost);
        expect(checkedStates(inputs)).toEqual([false, true]);
        host.selected.set('apple');
        await stable();
        expect(checkedStates(inputs)).toEqual([true, false]);
    });

    it('arrow keys move the selection between radios of the same name; only the checked one is tabbable', async () => {
        const { host, inputs, root, stable } = await render(NgModelHost);
        root.querySelector<HTMLButtonElement>('#before')!.focus();
        await userEvent.tab();
        expect(document.activeElement).toBe(inputs[1]);
        await userEvent.tab();
        expect(document.activeElement).toBe(root.querySelector('#after'));
        inputs[1].focus();
        await userEvent.keyboard('{ArrowDown}');
        await stable();
        expect(document.activeElement).toBe(inputs[2]);
        expect(host.model()).toBe('l');
        await userEvent.keyboard('{ArrowDown}');
        await stable();
        expect(document.activeElement).toBe(inputs[0]);
        expect(host.model()).toBe('s');
        await userEvent.keyboard('{ArrowUp}');
        await stable();
        expect(host.model()).toBe('l');
    });

    it('arrow keys skip disabled radios', async () => {
        const { host, inputs, stable } = await render(NgModelHost, (h) => h.disabledOption.set('l'));
        inputs[1].focus();
        await userEvent.keyboard('{ArrowDown}');
        await stable();
        expect(document.activeElement).toBe(inputs[0]);
        expect(host.model()).toBe('s');
    });

    it('a disabled radio cannot be selected and is dimmed', async () => {
        const { host, inputs, labels, stable } = await render(NgModelHost, (h) => h.disabledOption.set('s'));
        expect(inputs[0].disabled).toBe(true);
        expect(inputs[0].getAttribute('aria-disabled')).toBe('true');
        expect(Number(getComputedStyle(labels[0]).opacity)).toBeLessThan(1);
        expect(getComputedStyle(labels[0]).pointerEvents).toBe('none');
        labels[0].click();
        await stable();
        expect(host.model()).toBe('m');
    });

    it('readOnly keeps the value, stays focusable and is described as read-only', async () => {
        const { host, inputs, labels, stable } = await render(NgModelHost, (h) => h.readOnly.set(true));
        expect(inputs[0].hasAttribute('readonly')).toBe(true);
        expect(inputs[0].getAttribute('aria-description')).toContain('read-only');
        await userEvent.click(labels[0]);
        await stable();
        expect(host.model()).toBe('m');
        expect(checkedStates(inputs)).toEqual([false, true, false]);
        expect(document.activeElement).toBe(inputs[0]);
    });

    it('error state sets aria-invalid; every state colours the circle', async () => {
        const { host, inputs, labels, stable } = await render(NgModelHost);
        const border = () => getComputedStyle(labels[0], '::before').borderTopColor;
        const colors = new Set([border()]);
        expect(inputs[0].hasAttribute('aria-invalid')).toBe(false);
        for (const state of ['error', 'warning', 'success', 'information'] as const) {
            host.state.set(state);
            await stable();
            expect(inputs[0].getAttribute('aria-invalid')).toBe(state === 'error' ? 'true' : null);
            colors.add(border());
        }
        expect(colors.size).toBe(5);
    });

    it('the checked radio shows the dot', async () => {
        const { labels } = await render(NgModelHost);
        expect(getComputedStyle(labels[1], '::after').content).toBe('""');
        expect(getComputedStyle(labels[0], '::after').content).toBe('none');
    });

    it('compact density shrinks the circle', async () => {
        const { labels, stable } = await render(NgModelHost);
        expect(getComputedStyle(labels[0], '::before').width).toBe('22px');
        document.documentElement.setAttribute('data-density', 'compact');
        await stable();
        expect(getComputedStyle(labels[0], '::before').width).toBe('16px');
    });
});
