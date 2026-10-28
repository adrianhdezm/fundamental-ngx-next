import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { DatetimeAdapter, FdDate } from '@/lib/datetime';
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
        // a disabled date is read but not emitted, as upstream: the bound date keeps its day
        expect(host.date()!.day).toBe(9);
        expect(input.value).toBe('3/13/2024, 8:00 AM');
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

@Component({
    imports: [DatetimePicker, ReactiveFormsModule],
    template: `<fd-datetime-picker
        id="dt"
        [formControl]="control"
        [showFooter]="footer()"
        [allowNull]="allowNull()"
        [disableFunction]="disable()"
        (dateChange)="changes.push($event)"
    />`
})
class EmitHost {
    readonly control = new FormControl<FdDate | null>(new FdDate(2024, 3, 9, 14, 30, 0));
    readonly footer = signal(true);
    readonly allowNull = signal(true);
    readonly disable = signal<((date: FdDate) => boolean) | null>(null);
    readonly changes: (FdDate | null)[] = [];
}

describe('DatetimePicker dateChange', () => {
    async function setupEmit(configure?: (host: EmitHost) => void) {
        const fixture = TestBed.createComponent(EmitHost);
        configure?.(fixture.componentInstance);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector<HTMLInputElement>('input')!;
        const stable = async () => {
            await fixture.whenStable();
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await fixture.whenStable();
        };
        const open = async () => {
            await userEvent.click(root.querySelector<HTMLButtonElement>('button[aria-label="Open picker"]')!);
            await stable();
        };
        /** Puts the whole text in the field at once, as a paste does. */
        const enter = async (text: string) => {
            input.value = text;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            await stable();
        };
        const changes = () => fixture.componentInstance.changes.map((d) => d?.toString() ?? null);
        return { fixture, host: fixture.componentInstance, input, stable, open, enter, changes };
    }

    it('emits once per accepted change and not for writeValue, Cancel or a no-op submit', async () => {
        const { host, input, stable, open, enter, changes } = await setupEmit();
        host.control.setValue(new FdDate(2024, 3, 10, 9, 0, 0));
        await stable();
        expect(input.value).toBe('3/10/2024, 9:00 AM');
        expect(changes()).toEqual([]);
        // Cancel drops a picked day
        await open();
        await userEvent.click(day(12));
        await userEvent.click(buttonNamed('Cancel'));
        await stable();
        expect(changes()).toEqual([]);
        // OK without a change
        await open();
        await userEvent.click(buttonNamed('OK'));
        await stable();
        expect(changes()).toEqual([]);
        // OK with a change
        await open();
        await userEvent.click(day(12));
        await userEvent.click(buttonNamed('OK'));
        await stable();
        expect(changes()).toEqual([new FdDate(2024, 3, 12, 9, 0, 0).toString()]);
        expect(host.control.value!.toString()).toBe(new FdDate(2024, 3, 12, 9, 0, 0).toString());
        // typed and accepted once, then Enter and blur add nothing
        await enter('4/1/2024, 9:15 AM');
        await enter('4/1/2024, 9:15 AM');
        input.focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.tab();
        await stable();
        expect(changes()).toEqual([
            new FdDate(2024, 3, 12, 9, 0, 0).toString(),
            new FdDate(2024, 4, 1, 9, 15, 0).toString()
        ]);
        // the form writing the emitted value back does not emit again
        host.control.setValue(host.changes.at(-1)!);
        await stable();
        expect(changes()).toHaveLength(2);
    });

    it('emits null once when an allowed value is cleared', async () => {
        const { host, enter, changes } = await setupEmit();
        await enter('');
        await enter('');
        expect(changes()).toEqual([null]);
        expect(host.control.value).toBeNull();
        expect(host.control.valid).toBe(true);
    });

    it('does not emit for unreadable, disabled or disallowed null input, but passes it to the form', async () => {
        const { host, enter, changes } = await setupEmit((h) => {
            h.allowNull.set(false);
            h.disable.set((d) => d.day === 13);
        });
        await enter('not a date');
        expect(changes()).toEqual([]);
        expect(host.control.value).not.toBeNull();
        expect(host.control.errors).toEqual({ dateValidation: { valid: false } });
        await enter('3/13/2024, 8:00 AM');
        expect(changes()).toEqual([]);
        expect(host.control.value!.toString()).toBe(new FdDate(2024, 3, 13, 8, 0, 0).toString());
        expect(host.control.errors).toEqual({ dateValidation: { valid: false } });
        await enter('');
        expect(changes()).toEqual([]);
        expect(host.control.value).toBeNull();
        expect(host.control.errors).toEqual({ dateValidation: { valid: false } });
        // a valid value emits again
        await enter('3/14/2024, 8:00 AM');
        expect(changes()).toEqual([new FdDate(2024, 3, 14, 8, 0, 0).toString()]);
        expect(host.control.valid).toBe(true);
    });

    it('emits once without the footer and keeps the popover open after a day pick', async () => {
        const { host, open, stable, changes } = await setupEmit((h) => h.footer.set(false));
        await open();
        await userEvent.click(day(9));
        await stable();
        // the same day and time: nothing to apply
        expect(changes()).toEqual([]);
        await userEvent.click(day(20));
        await stable();
        expect(changes()).toEqual([new FdDate(2024, 3, 20, 14, 30, 0).toString()]);
        expect(host.control.value!.day).toBe(20);
        expect(document.querySelector('#dt-calendar')).not.toBeNull();
    });
});

const SECONDS_FORMAT = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
};

@Component({
    imports: [DatetimePicker],
    template: `
        <fd-datetime-picker id="dis" disabled [date]="date" />
        <fd-datetime-picker id="sec" [date]="date" [customDateTimeFormat]="secondsFormat" />
        <fd-datetime-picker id="cus" [(date)]="custom" [customDateTimeFormat]="secondsFormat" />
        <fd-datetime-picker id="leg" [date]="date" [specialDaysRules]="rules" showCalendarLegend legendCol />
        <fd-datetime-picker id="msg" [date]="date" message="Times are local" messageType="information" />
    `
})
class ModesHost {
    readonly date = new FdDate(2024, 3, 9, 14, 30, 15);
    readonly custom = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9, 14, 30, 0));
    readonly secondsFormat = SECONDS_FORMAT;
    readonly rules = [
        { specialDayNumber: 5, legendText: 'Team meeting', rule: (d: FdDate) => d.day === 13 },
        { specialDayNumber: 6, legendText: 'Release', appointment: true, rule: (d: FdDate) => d.day === 15 }
    ];
}

describe('DatetimePicker modes', () => {
    async function setupModes() {
        const fixture = TestBed.createComponent(ModesHost);
        document.body.appendChild(fixture.nativeElement);
        const stable = async () => {
            await fixture.whenStable();
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await fixture.whenStable();
        };
        await stable();
        const root = fixture.nativeElement as HTMLElement;
        const picker = (id: string) => root.querySelector<HTMLElement>(`fd-datetime-picker#${id}`)!;
        const button = (id: string) => picker(id).querySelector<HTMLButtonElement>('button[aria-label="Open picker"]')!;
        const open = async (id: string) => {
            await userEvent.click(button(id));
            await stable();
        };
        return {
            fixture,
            host: fixture.componentInstance,
            stable,
            open,
            button,
            input: (id: string) => picker(id).querySelector<HTMLInputElement>('input')!
        };
    }

    it('does not open when disabled', async () => {
        const { input, button, stable } = await setupModes();
        expect(button('dis').disabled).toBe(true);
        button('dis').click();
        input('dis').dispatchEvent(new KeyboardEvent('keydown', { key: 'F4', bubbles: true }));
        await stable();
        expect(document.querySelector('#dis-calendar')).toBeNull();
        expect(button('dis').getAttribute('aria-expanded')).toBe('false');
    });

    it('shows 24-hour columns with seconds for a matching format', async () => {
        const { input, open } = await setupModes();
        expect(input('sec').value).toBe('3/9/2024, 14:30:15');
        await open('sec');
        expect(document.querySelector('#sec-time-hours')!.getAttribute('aria-valuetext')).toBe('14');
        expect(document.querySelector('#sec-time-seconds')!.getAttribute('aria-valuetext')).toBe('15');
        expect(document.querySelector('#sec-time-period')).toBeNull();
    });

    it('parses typed text with customDateTimeFormat', async () => {
        const { host, input, stable } = await setupModes();
        const adapter = TestBed.inject(DatetimeAdapter);
        const parse = vi.spyOn(adapter, 'parse');
        expect(input('cus').value).toBe('3/9/2024, 14:30:00');
        await userEvent.clear(input('cus'));
        await userEvent.type(input('cus'), '3/12/2024, 16:45:30');
        await userEvent.tab();
        await stable();
        // the format of the picker, not the provided one, reads the text
        expect(parse).toHaveBeenLastCalledWith('3/12/2024, 16:45:30', SECONDS_FORMAT);
        expect(host.custom()!.toString()).toBe(new FdDate(2024, 3, 12, 16, 45, 30).toString());
        expect(input('cus').value).toBe('3/12/2024, 16:45:30');
        parse.mockRestore();
    });

    it('renders the legend inside the calendar', async () => {
        const { open } = await setupModes();
        await open('leg');
        const legend = document.querySelector<HTMLElement>('#leg-calendar fd-calendar-legend')!;
        expect(legend).not.toBeNull();
        expect(getComputedStyle(legend).columnWidth).toBe('auto');
        const items = [...legend.querySelectorAll('fd-calendar-legend-item')].map((i) => i.textContent!.trim());
        expect(items.slice(-2)).toEqual(['Team meeting', 'Release']);
        expect(document.querySelectorAll('fd-calendar-legend')).toHaveLength(1);
    });

    it('hides the message while open and shows it again on close', async () => {
        const { input, open, stable } = await setupModes();
        /** The message shown next to the field, not the one inside the picker. */
        const fieldMessage = () =>
            [...document.querySelectorAll('[aria-label="Field validation messages"] fd-form-message')].find((m) =>
                m.textContent!.includes('Times are local')
            );
        input('msg').focus();
        await stable();
        expect(fieldMessage()).toBeDefined();
        await open('msg');
        expect(fieldMessage()).toBeUndefined();
        // the picker shows it inside instead
        expect(document.querySelector('#msg-calendar')!.closest('[role="dialog"]')!.textContent).toContain(
            'Times are local'
        );
        await userEvent.keyboard('{Escape}');
        await stable();
        expect(document.activeElement).toBe(input('msg'));
        expect(fieldMessage()).toBeDefined();
    });
});

describe('DatetimePicker reopening', () => {
    it('reopens on the month of the submitted date', async () => {
        const { host, button, stable } = await setup();
        await userEvent.click(button);
        await stable();
        const header = () =>
            [...document.querySelectorAll<HTMLButtonElement>('#dt-calendar > div:first-child button')]
                .map((b) => b.textContent!.trim())
                .filter(Boolean);
        expect(header()).toEqual(['March', '2024']);
        await userEvent.click(document.querySelector<HTMLButtonElement>('#dt-calendar button[aria-label^="Next"]')!);
        await userEvent.click(document.querySelector<HTMLButtonElement>('#dt-calendar button[aria-label^="Next"]')!);
        await stable();
        expect(header()).toEqual(['May', '2024']);
        await userEvent.click(day(15));
        await userEvent.click(buttonNamed('OK'));
        await stable();
        expect(host.date()!.toDateString()).toBe('2024-05-15');
        await userEvent.click(button);
        await stable();
        expect(header()).toEqual(['May', '2024']);
        expect((document.activeElement as HTMLElement).getAttribute('data-fd-calendar-date-day')).toBe('15');
    });
});
