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
            [disabled]="disabled()"
            [displayFormat]="displayFormat()"
        />
        <button id="after">After</button>
    `
})
class Host {
    readonly time = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9, 14, 30, 0));
    readonly message = signal<string | null>(null);
    readonly allowNull = signal(true);
    readonly disabled = signal(false);
    readonly displayFormat = signal<object | undefined>(undefined);
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

    it('shows hours, minutes and seconds without a period for a 24-hour format with seconds', async () => {
        const { input, button, stable } = await setup((h) =>
            h.displayFormat.set({ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        );
        expect(input.value).toBe('14:30:00');
        expect(input.placeholder).toBe('hh:mm:ss');
        await userEvent.click(button);
        await stable();
        expect(document.querySelector('#tp-time-hours')).not.toBeNull();
        expect(document.querySelector('#tp-time-minutes')).not.toBeNull();
        expect(document.querySelector('#tp-time-seconds')).not.toBeNull();
        expect(document.querySelector('#tp-time-period')).toBeNull();
        expect(document.querySelector('#tp-time-hours')!.getAttribute('aria-valuetext')).toBe('14');
    });

    it('hides the message while the columns are open and shows it again on close', async () => {
        const { input, button, stable } = await setup((h) => h.message.set('Times are local'));
        const fieldMessage = () => document.querySelector('[aria-label="Field validation messages"]');
        input.focus();
        await stable();
        expect(fieldMessage()).not.toBeNull();
        await userEvent.click(button);
        await stable();
        expect(fieldMessage()).toBeNull();
        // the open columns show the message inside the popover instead
        const body = document.querySelector('#tp-time-hours')!.closest('.cdk-overlay-pane')!;
        expect(body.textContent).toContain('Times are local');
        await userEvent.keyboard('{Escape}');
        await stable();
        expect(document.activeElement).toBe(input);
        expect(fieldMessage()).not.toBeNull();
    });

    it('closes the columns on a click outside', async () => {
        const { root, button, stable } = await setup();
        await userEvent.click(button);
        await stable();
        expect(document.querySelector('#tp-time-hours')).not.toBeNull();
        await userEvent.click(root.querySelector<HTMLElement>('#after')!);
        await stable();
        expect(document.querySelector('#tp-time-hours')).toBeNull();
        expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    it('does not open when disabled', async () => {
        const { input, button, stable } = await setup((h) => h.disabled.set(true));
        expect(input.disabled).toBe(true);
        expect(button.disabled).toBe(true);
        button.click();
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true }));
        await stable();
        expect(document.querySelector('#tp-time-hours')).toBeNull();
        expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    it('keeps Tab within the open columns, like upstream (focus trapped)', async () => {
        const { button, stable } = await setup();
        await userEvent.click(button);
        await stable();
        const hours = document.querySelector<HTMLElement>('#tp-time-hours')!;
        expect(document.activeElement).toBe(hours);
        await userEvent.tab();
        expect(document.activeElement!.id).toBe('tp-time-minutes');
        await userEvent.tab();
        expect(document.activeElement!.id).toBe('tp-time-period');
        await userEvent.tab();
        await stable();
        expect(document.activeElement).toBe(hours);
        expect(button.getAttribute('aria-expanded')).toBe('true');
    });
});

@Component({
    imports: [TimePicker, ReactiveFormsModule],
    template: `<fd-time-picker id="tpc" [formControl]="control" />`
})
class ChangeHost {
    readonly control = new FormControl<FdDate | null>(new FdDate(2024, 1, 1, 8, 0, 0));
}

describe('TimePicker changes', () => {
    async function setupChanges() {
        const fixture = TestBed.createComponent(ChangeHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const changes: (FdDate | null)[] = [];
        fixture.componentInstance.control.valueChanges.subscribe((value) => changes.push(value));
        return {
            fixture,
            control: fixture.componentInstance.control,
            changes,
            input: root.querySelector<HTMLInputElement>('input')!,
            button: root.querySelector<HTMLButtonElement>('button[aria-label="Open picker"]')!,
            stable: async () => {
                await fixture.whenStable();
                await new Promise((resolve) => requestAnimationFrame(resolve));
                await fixture.whenStable();
            }
        };
    }

    it('keeps an empty field valid with allowNull', async () => {
        const { control, changes, input, stable } = await setupChanges();
        await userEvent.clear(input);
        await userEvent.type(input, '{Enter}');
        await stable();
        expect(control.value).toBeNull();
        expect(changes).toEqual([null]);
        expect(control.valid).toBe(true);
        expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('does not emit a change when focus leaves an unchanged field', async () => {
        const { control, changes, input, stable } = await setupChanges();
        input.focus();
        // past the picker button and out of the picker
        await userEvent.tab();
        await userEvent.tab();
        await stable();
        expect(changes).toEqual([]);
        expect(control.touched).toBe(true);
        // retyping the same time is no change either
        await userEvent.clear(input);
        await userEvent.type(input, '8:00 AM{Enter}');
        await stable();
        expect(changes).toEqual([]);
    });

    it('does not emit a change when the columns pick the current time', async () => {
        const { changes, button, stable } = await setupChanges();
        await userEvent.click(button);
        await stable();
        const current = document.querySelector<HTMLElement>('#tpc-time-hours [data-displayed-value="8"]')!;
        await userEvent.click(current);
        await stable();
        expect(changes).toEqual([]);
        await userEvent.click(document.querySelector<HTMLElement>('#tpc-time-hours [data-displayed-value="9"]')!);
        await stable();
        expect(changes.length).toBe(1);
        expect(changes[0]!.hour).toBe(9);
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
