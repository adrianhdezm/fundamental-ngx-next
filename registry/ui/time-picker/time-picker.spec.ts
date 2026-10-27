import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { DatetimeAdapter, FdDate } from '@/lib/datetime';
import { TimePicker } from './time-picker';

@Component({
    imports: [TimePicker],
    template: `
        <fd-time-picker
            id="tp"
            [(time)]="time"
            [message]="message()"
            messageType="information"
            [allowNull]="allowNull()"
        />
        <button id="after">After</button>
    `
})
class Host {
    readonly time = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9, 14, 30, 0));
    readonly message = signal<string | null>(null);
    readonly allowNull = signal(true);
}

async function setup(configure?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        input: root.querySelector<HTMLInputElement>('input')!,
        button: root.querySelector<HTMLButtonElement>('button[aria-label="Open picker"]')!,
        stable: async () => {
            await fixture.whenStable();
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await fixture.whenStable();
        }
    };
}

describe('TimePicker', () => {
    it('shows the time in the display format', async () => {
        const { input, button } = await setup();
        expect(input.value).toBe('2:30 PM');
        expect(input.getAttribute('aria-label')).toBe('Time picker input');
        expect(input.placeholder).toBe('hh:mm am/pm');
        expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    it('reads typed times on Enter and on blur', async () => {
        const { host, input, stable } = await setup();
        await userEvent.clear(input);
        await userEvent.type(input, '9:05 AM{Enter}');
        await stable();
        expect(host.time()!.hour).toBe(9);
        expect(host.time()!.minute).toBe(5);
        expect(input.value).toBe('9:05 AM');
        await userEvent.clear(input);
        await userEvent.type(input, '18:45');
        await userEvent.tab();
        await stable();
        expect(host.time()!.hour).toBe(18);
        expect(input.value).toBe('6:45 PM');
    });

    it('sets the error state for an unreadable time', async () => {
        const { input, stable } = await setup();
        await userEvent.clear(input);
        await userEvent.type(input, 'teatime{Enter}');
        await stable();
        expect(input.value).toBe('teatime');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        await userEvent.clear(input);
        await userEvent.type(input, '{Enter}');
        await stable();
        expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('picks a time in the columns', async () => {
        const { host, input, button, stable } = await setup();
        await userEvent.click(button);
        await stable();
        expect(button.getAttribute('aria-expanded')).toBe('true');
        const hours = document.querySelector<HTMLElement>('#tp-time-hours')!;
        expect(document.activeElement).toBe(hours);
        expect(document.querySelector('#tp-time-period')).not.toBeNull();
        expect(document.querySelector('#tp-time-seconds')).toBeNull();
        await userEvent.keyboard('{ArrowDown}');
        await stable();
        expect(host.time()!.hour).toBe(15);
        expect(input.value).toBe('3:30 PM');
        await userEvent.keyboard('{Escape}');
        await stable();
        expect(document.querySelector('#tp-time-hours')).toBeNull();
        expect(document.activeElement).toBe(input);
    });

    it('opens with Alt+Down', async () => {
        const { input, stable } = await setup();
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await stable();
        expect(document.activeElement!.id).toBe('tp-time-hours');
    });

    it('follows the locale of the adapter', async () => {
        const { fixture, input } = await setup();
        const adapter = TestBed.inject(DatetimeAdapter);
        const before = adapter.locale();
        adapter.setLocale('de-DE');
        await fixture.whenStable();
        expect(input.value).toBe('14:30');
        adapter.setLocale(before);
        await fixture.whenStable();
        expect(input.value).toBe('2:30 PM');
    });

    it('shows the message while the field has the focus', async () => {
        const { input, stable } = await setup((h) => h.message.set('Times are local'));
        input.focus();
        await stable();
        const messages = [...document.querySelectorAll('fd-form-message')].filter((m) =>
            m.textContent!.includes('Times are local')
        );
        expect(messages.length).toBeGreaterThan(0);
        expect(input.getAttribute('aria-describedby')).toBeTruthy();
    });
});

@Component({
    imports: [TimePicker, ReactiveFormsModule],
    template: `<fd-time-picker [formControl]="control" [allowNull]="false" />`
})
class FormHost {
    readonly control = new FormControl<FdDate | null>(new FdDate(2024, 1, 1, 8, 0, 0));
}

describe('TimePicker forms', () => {
    it('writes and reads the value and validates it', async () => {
        const fixture = TestBed.createComponent(FormHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
        expect(input.value).toBe('8:00 AM');
        await userEvent.clear(input);
        await userEvent.type(input, '10:15 AM{Enter}');
        expect(fixture.componentInstance.control.value!.hour).toBe(10);
        await userEvent.clear(input);
        await userEvent.type(input, '{Enter}');
        await fixture.whenStable();
        expect(fixture.componentInstance.control.value).toBeNull();
        expect(fixture.componentInstance.control.errors).toEqual({ timeValidation: { valid: false } });
        fixture.componentInstance.control.disable();
        await fixture.whenStable();
        expect(input.disabled).toBe(true);
    });
});
