import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { FdDate } from '@/lib/datetime';
import { DatetimePicker } from './datetime-picker';

@Component({
    imports: [DatetimePicker],
    template: `
        <fd-datetime-picker
            id="dt"
            [(date)]="date"
            [showFooter]="footer()"
            [processInputOnBlur]="onBlur()"
            [disableFunction]="disable()"
            [message]="message()"
            messageType="information"
        />
        <button id="after">After</button>
    `
})
class Host {
    readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9, 14, 30, 0));
    readonly footer = signal(true);
    readonly onBlur = signal(false);
    readonly disable = signal<((date: FdDate) => boolean) | null>(null);
    readonly message = signal<string | null>(null);
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
        input: root.querySelector<HTMLInputElement>('fd-datetime-picker input')!,
        button: root.querySelector<HTMLButtonElement>('button[aria-label="Open picker"]')!,
        stable: async () => {
            await fixture.whenStable();
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await fixture.whenStable();
        }
    };
}

const day = (n: number) =>
    document.querySelector<HTMLElement>(
        `#dt-calendar [data-fd-calendar-month-status="current"][data-fd-calendar-date-day="${n}"]`
    )!;
const buttonNamed = (name: string) =>
    [...document.querySelectorAll('button')].find((b) => b.textContent!.trim().startsWith(name))!;

describe('DatetimePicker', () => {
    it('shows the date and time in the field', async () => {
        const { input, button } = await setup();
        expect(input.value).toBe('3/9/2024, 2:30 PM');
        expect(input.getAttribute('aria-label')).toBe('Date and time input');
        expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens on the date with the time columns of the format', async () => {
        const { button, stable } = await setup();
        await userEvent.click(button);
        await stable();
        expect((document.activeElement as HTMLElement).getAttribute('data-fd-calendar-date-day')).toBe('9');
        expect(document.querySelector('#dt-time-hours')!.getAttribute('aria-valuetext')).toBe('2');
        expect(document.querySelector('#dt-time-period')).not.toBeNull();
        expect(document.querySelector('#dt-time-seconds')).toBeNull();
    });

    it('applies the picked date and time with OK', async () => {
        const { host, input, button, stable } = await setup();
        await userEvent.click(button);
        await stable();
        await userEvent.click(day(12));
        const hours = document.querySelector<HTMLElement>('#dt-time-hours')!;
        hours.focus();
        await userEvent.keyboard('{ArrowDown}');
        await stable();
        // not applied yet
        expect(host.date()!.day).toBe(9);
        await userEvent.click(buttonNamed('OK'));
        await stable();
        expect(host.date()!.toString()).toBe(new FdDate(2024, 3, 12, 15, 30, 0).toString());
        expect(input.value).toBe('3/12/2024, 3:30 PM');
        expect(document.querySelector('#dt-calendar')).toBeNull();
        expect(document.activeElement).toBe(input);
    });

    it('drops the picked values with Cancel and Escape', async () => {
        const { host, button, stable } = await setup();
        await userEvent.click(button);
        await stable();
        await userEvent.click(day(12));
        await userEvent.click(buttonNamed('Cancel'));
        await stable();
        expect(host.date()!.day).toBe(9);
        await userEvent.click(button);
        await stable();
        await userEvent.click(day(13));
        await userEvent.keyboard('{Escape}');
        await stable();
        expect(host.date()!.day).toBe(9);
        expect(document.querySelector('#dt-calendar')).toBeNull();
    });

    it('applies at once without the footer', async () => {
        const { host, button, stable } = await setup((h) => h.footer.set(false));
        await userEvent.click(button);
        await stable();
        expect(buttonNamed('OK')).toBeUndefined();
        await userEvent.click(day(20));
        await stable();
        expect(host.date()!.day).toBe(20);
        expect(host.date()!.hour).toBe(14);
    });

    it('reads typed values; the error shows once the field was left', async () => {
        const { host, input, stable } = await setup();
        await userEvent.clear(input);
        await userEvent.type(input, '4/1/2024, 9:15 AM');
        await stable();
        expect(host.date()!.toString()).toBe(new FdDate(2024, 4, 1, 9, 15, 0).toString());
        await userEvent.clear(input);
        await userEvent.type(input, 'tomorrowish');
        await stable();
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        await userEvent.tab();
        await stable();
        expect(input.value).toBe('tomorrowish');
        expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('reads on Enter only with processInputOnBlur, and checks the disable function', async () => {
        const { host, input, stable } = await setup((h) => {
            h.onBlur.set(true);
            h.disable.set((d) => d.day === 13);
        });
        await userEvent.clear(input);
        await userEvent.type(input, '3/13/2024, 8:00 AM');
        await stable();
        expect(host.date()!.day).toBe(9);
        await userEvent.keyboard('{Enter}');
        await userEvent.tab();
        await stable();
        expect(host.date()!.day).toBe(13);
        expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('references the state and the message from aria-describedby', async () => {
        const { host, input, stable } = await setup();
        expect(input.hasAttribute('aria-describedby')).toBe(false);
        host.message.set('Times are local');
        await stable();
        const description = () => document.getElementById(input.getAttribute('aria-describedby')!)!;
        expect(description().textContent).toContain('Times are local');
        await userEvent.clear(input);
        await userEvent.type(input, 'tomorrowish');
        await userEvent.tab();
        await stable();
        expect(description().textContent).toContain('Value state Error');
        expect(description().textContent).toContain('Times are local');
    });

    it('keeps aria-haspopup "dialog" on the button, as the picker opens in a dialog', async () => {
        // upstream says "grid" on the date picker input; the popup here is the popover body with role="dialog"
        const { button, stable } = await setup();
        expect(button.getAttribute('aria-haspopup')).toBe('dialog');
        await userEvent.click(button);
        await stable();
        expect(document.querySelector('#dt-calendar')!.closest('[role="dialog"]')).not.toBeNull();
    });

    it('opens with F4', async () => {
        const { input, stable } = await setup();
        input.focus();
        await userEvent.keyboard('{F4}');
        await stable();
        expect(document.querySelector('#dt-calendar')).not.toBeNull();
    });
});

@Component({
    imports: [DatetimePicker],
    template: `<fd-datetime-picker id="dt" mobile [(date)]="date" [mobileConfig]="{ title: 'Meeting' }" />`
})
class MobileHost {
    readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9, 14, 30, 0));
}

describe('DatetimePicker mobile', () => {
    it('shows the calendar or the time in a dialog and applies with OK', async () => {
        const fixture = TestBed.createComponent(MobileHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const stable = async () => {
            await fixture.whenStable();
            await new Promise((resolve) => setTimeout(resolve, 150));
            await fixture.whenStable();
        };
        const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
        await userEvent.click(input);
        await stable();
        expect(document.querySelector('[role=dialog]')!.textContent).toContain('Meeting');
        const time = document.querySelector<HTMLElement>('#dt-time-hours')!.closest<HTMLElement>('fd-time')!;
        expect(getComputedStyle(time).display).toBe('none');
        await userEvent.click(day(11));
        await userEvent.click(buttonNamed('Time'));
        await stable();
        expect(getComputedStyle(time).display).not.toBe('none');
        expect(getComputedStyle(document.querySelector('#dt-calendar')!).display).toBe('none');
        await userEvent.click(buttonNamed('OK'));
        await stable();
        expect(fixture.componentInstance.date()!.day).toBe(11);
        expect(document.querySelector('#dt-calendar')).toBeNull();
    });
});

@Component({
    imports: [DatetimePicker, ReactiveFormsModule],
    template: `<fd-datetime-picker [formControl]="control" [allowNull]="false" />`
})
class FormHost {
    readonly control = new FormControl<FdDate | null>(new FdDate(2024, 1, 15, 8, 0, 0));
}

describe('DatetimePicker forms', () => {
    it('writes, reads, validates and disables', async () => {
        const fixture = TestBed.createComponent(FormHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
        expect(input.value).toBe('1/15/2024, 8:00 AM');
        await userEvent.clear(input);
        await userEvent.type(input, '2/2/2024, 10:00 AM');
        expect(fixture.componentInstance.control.value!.toString()).toBe(new FdDate(2024, 2, 2, 10, 0, 0).toString());
        await userEvent.clear(input);
        await fixture.whenStable();
        expect(fixture.componentInstance.control.value).toBeNull();
        expect(fixture.componentInstance.control.errors).toEqual({ dateValidation: { valid: false } });
        fixture.componentInstance.control.disable();
        await fixture.whenStable();
        expect(input.disabled).toBe(true);
    });
});
