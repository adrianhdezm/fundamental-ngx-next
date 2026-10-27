import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl as NgFormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { FormInputMessageGroup } from '@/ui/form/form-input-message-group';
import { FormMessage, type FormMessageType } from '@/ui/form/form-message';
import { FormControl, type FormState } from './input';

@Component({
    imports: [FormControl, FormsModule, ReactiveFormsModule],
    template: `
        <input fdFormControl id="model" aria-label="Model" [(ngModel)]="model" [state]="state()" />
        <input fdFormControl id="reactive" aria-label="Reactive" [formControl]="control" />
        <textarea fdFormControl id="area" aria-label="Area" rows="3"></textarea>
        <input fdFormControl id="readonly" aria-label="Read-only" readonly value="Fixed" />
        <input fdFormControl id="disabled" aria-label="Disabled" disabled value="Off" />
        <input fdFormControl id="number" aria-label="Number" type="number" [noNumberSpinner]="noSpinner()" />
    `
})
class Host {
    readonly model = signal('Hello');
    readonly state = signal<FormState | null>(null);
    readonly noSpinner = signal(false);
    readonly control = new NgFormControl('Initial');
}

@Component({
    imports: [FormControl, FormInputMessageGroup, FormMessage],
    template: `
        <fd-form-input-message-group>
            <input fdFormControl id="vat" aria-label="VAT" [state]="type()" />
            <fd-form-message [type]="type()">Enter a valid VAT number.</fd-form-message>
        </fd-form-input-message-group>
        <button id="after">After</button>
    `
})
class MessageHost {
    readonly type = signal<FormMessageType>('error');
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
    const field = <E extends HTMLElement = HTMLInputElement>(id: string) => root.querySelector<E>(`#${id}`)!;
    return { fixture, host: fixture.componentInstance, root, field, stable };
}

describe('Input', () => {
    afterEach(() => document.documentElement.removeAttribute('data-density'));

    it('works with ngModel', async () => {
        const { host, field, stable } = await render(Host);
        const input = field('model');
        expect(input.value).toBe('Hello');
        await userEvent.clear(input);
        await userEvent.type(input, 'World');
        await stable();
        expect(host.model()).toBe('World');
        host.model.set('Again');
        await stable();
        expect(input.value).toBe('Again');
    });

    it('works with reactive forms, including disable()', async () => {
        const { host, field, stable } = await render(Host);
        const input = field('reactive');
        expect(input.value).toBe('Initial');
        await userEvent.clear(input);
        await userEvent.type(input, 'Typed');
        expect(host.control.value).toBe('Typed');
        await userEvent.tab();
        expect(host.control.touched).toBe(true);
        host.control.disable();
        await stable();
        expect(input.disabled).toBe(true);
        expect(Number(getComputedStyle(input).opacity)).toBeLessThan(1);
    });

    it('styles textareas as multi-line fields', async () => {
        const { field } = await render(Host);
        const area = field<HTMLTextAreaElement>('area');
        const input = field('model');
        expect(area.getBoundingClientRect().height).toBeGreaterThan(input.getBoundingClientRect().height);
        expect(getComputedStyle(area).resize).toBe('none');
        expect(getComputedStyle(area).whiteSpace).toBe('pre-wrap');
    });

    it('states set aria-invalid only for errors and change the field colours', async () => {
        const { host, field, stable } = await render(Host);
        const input = field('model');
        const borders = new Set([getComputedStyle(input).borderBottomColor]);
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        for (const state of ['error', 'warning', 'success', 'information'] as const) {
            host.state.set(state);
            await stable();
            expect(input.getAttribute('aria-invalid')).toBe(state === 'error' ? 'true' : null);
            borders.add(getComputedStyle(input).borderBottomColor);
        }
        expect(borders.size).toBe(5);
        host.state.set('default');
        await stable();
        expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('the state message is shown while the field has focus and linked with aria-describedby', async () => {
        const { host, field, stable } = await render(MessageHost);
        const input = field('vat');
        const describedBy = input.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
        expect(input.getAttribute('aria-invalid')).toBe('true');
        const message = () => document.querySelector<HTMLElement>('fd-form-message');
        expect(message()).toBeNull();
        await userEvent.click(input);
        await stable();
        expect(message()!.id).toBe(describedBy);
        expect(message()!.getBoundingClientRect().top).toBeGreaterThanOrEqual(input.getBoundingClientRect().bottom - 1);
        expect(message()!.getAttribute('aria-live')).toBe('assertive');
        expect(message()!.textContent).toContain('Invalid Entry');
        expect(message()!.textContent).toContain('Enter a valid VAT number.');
        expect(document.activeElement).toBe(input);
        await userEvent.tab();
        await stable();
        await new Promise((r) => setTimeout(r, 150));
        expect(message()).toBeNull();
        host.type.set('warning');
        await stable();
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(input.getAttribute('aria-describedby')).toBe(describedBy);
        input.focus();
        await stable();
        expect(message()!.textContent).toContain('Warning');
    });

    it('native readonly keeps the value, stays focusable and uses the read-only style', async () => {
        const { field } = await render(Host);
        const readonly = field('readonly');
        const normal = field('model');
        expect(getComputedStyle(readonly).backgroundColor).not.toBe(getComputedStyle(normal).backgroundColor);
        expect(getComputedStyle(readonly).opacity).toBe('1');
        await userEvent.click(readonly);
        expect(document.activeElement).toBe(readonly);
        await userEvent.keyboard('abc');
        expect(readonly.value).toBe('Fixed');
    });

    it('native disabled is dimmed and not focusable', async () => {
        const { field } = await render(Host);
        const disabled = field('disabled');
        expect(Number(getComputedStyle(disabled).opacity)).toBeLessThan(1);
        expect(getComputedStyle(disabled).pointerEvents).toBe('none');
        disabled.focus();
        expect(document.activeElement).not.toBe(disabled);
    });

    it('noNumberSpinner hides the number spinner', async () => {
        const { host, field, stable } = await render(Host);
        const number = field('number');
        number.style.width = '200px';
        const clickSpinUp = async () => {
            number.value = '42';
            const { width } = number.getBoundingClientRect();
            await userEvent.click(number, { position: { x: width - 16, y: 10 } });
            return number.value;
        };
        expect(await clickSpinUp()).toBe('43');
        host.noSpinner.set(true);
        await stable();
        expect(await clickSpinUp()).toBe('42');
    });

    it('compact density makes the field lower', async () => {
        const { field, stable } = await render(Host);
        const input = field('model');
        const cozy = input.getBoundingClientRect().height;
        expect(cozy).toBe(36);
        document.documentElement.setAttribute('data-density', 'compact');
        await stable();
        expect(input.getBoundingClientRect().height).toBe(26);
    });
});
