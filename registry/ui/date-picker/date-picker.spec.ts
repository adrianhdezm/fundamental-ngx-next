import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { FdDate } from '@/lib/datetime';
import { DateRange } from '@/ui/calendar/calendar';
import { DatePicker } from './date-picker';

@Component({
    imports: [DatePicker],
    template: `
        <fd-date-picker
            id="dp"
            [(selectedDate)]="date"
            [disableFunction]="disable()"
            [processInputOnBlur]="onBlur()"
            [showTodayButton]="today()"
            [message]="message()"
            messageType="information"
        />
        <fd-date-picker id="rg" type="range" [(selectedRangeDate)]="range" />
        <fd-date-picker id="mu" allowMultipleSelection [(selectedMultipleDates)]="dates" />
        <button id="after">After</button>
    `
})
class Host {
    readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9));
    readonly range = signal<DateRange<FdDate> | null>(null);
    readonly dates = signal<FdDate[]>([]);
    readonly disable = signal<((date: FdDate) => boolean) | null>(null);
    readonly onBlur = signal(false);
    readonly today = signal(false);
    readonly message = signal<string | null>(null);
}

async function setup(configure?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const picker = (id: string) => root.querySelector<HTMLElement>(`fd-date-picker#${id}`)!;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        input: (id = 'dp') => picker(id).querySelector<HTMLInputElement>('input')!,
        button: (id = 'dp') => picker(id).querySelector<HTMLButtonElement>('button[aria-label="Open picker"]')!,
        stable: async () => {
            await fixture.whenStable();
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await fixture.whenStable();
        }
    };
}

/** The cell of a day of the current month in an open calendar. */
function dayCell(calendarId: string, day: number): HTMLElement {
    const cells = document.querySelectorAll<HTMLElement>(
        `#${calendarId} [data-fd-calendar-month-status="current"][data-fd-calendar-date-day="${day}"]`
    );
    return cells[0];
}

describe('DatePicker', () => {
    it('shows the date in the field', async () => {
        const { input, button } = await setup();
        expect(input().value).toBe('3/9/2024');
        expect(input().getAttribute('aria-label')).toBe('Date input');
        expect(input('rg').getAttribute('aria-label')).toBe('Date range input');
        expect(button().getAttribute('aria-expanded')).toBe('false');
    });

    it('opens the calendar on the date, picks a day and closes', async () => {
        const { host, input, button, stable } = await setup();
        await userEvent.click(button());
        await stable();
        expect(button().getAttribute('aria-expanded')).toBe('true');
        const active = document.activeElement as HTMLElement;
        expect(active.getAttribute('data-fd-calendar-date-day')).toBe('9');
        await userEvent.keyboard('{ArrowRight}{Enter}');
        await stable();
        expect(host.date()!.toDateString()).toBe('2024-03-10');
        expect(input().value).toBe('3/10/2024');
        expect(document.querySelector('#dp-calendar')).toBeNull();
        expect(document.activeElement).toBe(input());
    });

    it('opens with F4 and Alt+Down and closes with Escape', async () => {
        const { input, stable } = await setup();
        input().focus();
        await userEvent.keyboard('{F4}');
        await stable();
        expect(document.querySelector('#dp-calendar')).not.toBeNull();
        await userEvent.keyboard('{Escape}');
        await stable();
        expect(document.querySelector('#dp-calendar')).toBeNull();
        expect(document.activeElement).toBe(input());
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await stable();
        expect(document.querySelector('#dp-calendar')).not.toBeNull();
    });

    it('reads typed dates while typing, and an unreadable date sets the error state', async () => {
        const { host, input, stable } = await setup();
        await userEvent.clear(input());
        await userEvent.type(input(), ' 4/1/2024');
        await stable();
        expect(host.date()!.toDateString()).toBe('2024-04-01');
        // what was typed stays, spaces included
        expect(input().value).toBe(' 4/1/2024');
        await userEvent.clear(input());
        await userEvent.type(input(), 'someday');
        await userEvent.tab();
        await stable();
        expect(input().value).toBe('someday');
        expect(input().getAttribute('aria-invalid')).toBe('true');
        await userEvent.clear(input());
        await stable();
        expect(host.date()).toBeNull();
        expect(input().hasAttribute('aria-invalid')).toBe(false);
    });

    it('reads on Enter and blur only with processInputOnBlur', async () => {
        const { host, input, stable } = await setup((h) => h.onBlur.set(true));
        await userEvent.clear(input());
        await userEvent.type(input(), '5/20/2024');
        await stable();
        expect(host.date()!.toDateString()).toBe('2024-03-09');
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(host.date()!.toDateString()).toBe('2024-05-20');
    });

    it('sets the error state for a disabled date', async () => {
        const { input, stable } = await setup((h) => h.disable.set((d) => d.day === 13));
        await userEvent.clear(input());
        await userEvent.type(input(), '3/13/2024');
        await userEvent.tab();
        await stable();
        expect(input().getAttribute('aria-invalid')).toBe('true');
    });

    it('picks a range with two clicks and reads a typed range', async () => {
        const { host, input, button, stable } = await setup();
        await userEvent.click(button('rg'));
        await stable();
        await userEvent.click(dayCell('rg-calendar', 4));
        await stable();
        expect(host.range()).toBeNull();
        await userEvent.click(dayCell('rg-calendar', 2));
        await stable();
        expect(host.range()!.start!.day).toBe(2);
        expect(host.range()!.end!.day).toBe(4);
        expect(input('rg').value).toMatch(/^\d+\/2\/\d{4} - \d+\/4\/\d{4}$/);
        expect(document.querySelector('#rg-calendar')).toBeNull();
        await userEvent.clear(input('rg'));
        await userEvent.type(input('rg'), '6/10/2024 - 6/1/2024');
        await stable();
        // the ends are ordered
        expect(host.range()!.start!.toDateString()).toBe('2024-06-01');
        expect(host.range()!.end!.toDateString()).toBe('2024-06-10');
    });

    it('picks multiple dates and keeps the calendar open', async () => {
        const { host, input, button, stable } = await setup();
        await userEvent.click(button('mu'));
        await stable();
        await userEvent.click(dayCell('mu-calendar', 3));
        await userEvent.click(dayCell('mu-calendar', 5));
        await stable();
        expect(host.dates()).toHaveLength(2);
        expect(document.querySelector('#mu-calendar')).not.toBeNull();
        expect(input('mu').value.split(', ')).toHaveLength(2);
    });

    it('selects today with the today button', async () => {
        const { host, button, stable } = await setup((h) => h.today.set(true));
        await userEvent.click(button());
        await stable();
        const today = [...document.querySelectorAll('button')].find((b) => b.textContent!.trim() === 'Today')!;
        await userEvent.click(today);
        await stable();
        expect(host.date()!.toDateString()).toBe(FdDate.getNow().toDateString());
        expect(document.querySelector('#dp-calendar')).toBeNull();
    });

    it('shows the message in the popover', async () => {
        const { button, stable } = await setup((h) => h.message.set('Dates are local'));
        await userEvent.click(button());
        await stable();
        const body = document.querySelector('#dp-calendar')!.parentElement!;
        expect(body.textContent).toContain('Dates are local');
    });
});

@Component({
    imports: [DatePicker],
    template: `<fd-date-picker
        id="mob"
        mobile
        [(selectedDate)]="date"
        [mobileConfig]="{ title: 'Pick', approveButtonText: 'Save', cancelButtonText: 'Cancel' }"
    />`
})
class MobileHost {
    readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9));
}

describe('DatePicker mobile', () => {
    it('opens a dialog; cancel restores the date, save keeps it', async () => {
        const fixture = TestBed.createComponent(MobileHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const stable = async () => {
            await fixture.whenStable();
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await fixture.whenStable();
        };
        const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
        await userEvent.click(input);
        await stable();
        const dialog = document.querySelector('[role=dialog]')!;
        expect(dialog.textContent).toContain('Pick');
        await userEvent.click(dayCell('mob-calendar', 12));
        await stable();
        expect(fixture.componentInstance.date()!.day).toBe(12);
        // still open
        expect(document.querySelector('#mob-calendar')).not.toBeNull();
        const buttonNamed = (name: string) =>
            [...document.querySelectorAll('button')].find((b) => b.textContent!.trim().startsWith(name))!;
        await userEvent.click(buttonNamed('Cancel'));
        await stable();
        expect(fixture.componentInstance.date()!.day).toBe(9);
        expect(input.value).toBe('3/9/2024');
        await userEvent.click(input);
        await stable();
        await userEvent.click(dayCell('mob-calendar', 20));
        await userEvent.click(buttonNamed('Save'));
        await new Promise((resolve) => setTimeout(resolve, 150));
        await stable();
        expect(fixture.componentInstance.date()!.day).toBe(20);
        expect(document.querySelector('#mob-calendar')).toBeNull();
    });
});

@Component({
    imports: [DatePicker, ReactiveFormsModule],
    template: `
        <fd-date-picker id="f1" [formControl]="single" [allowNull]="false" />
        <fd-date-picker id="f2" type="range" [formControl]="range" />
    `
})
class FormHost {
    readonly single = new FormControl<FdDate | null>(new FdDate(2024, 1, 15));
    readonly range = new FormControl<DateRange<FdDate> | null>(
        new DateRange(new FdDate(2024, 1, 1), new FdDate(2024, 1, 5))
    );
}

describe('DatePicker forms', () => {
    it('writes, reads, validates and disables', async () => {
        const fixture = TestBed.createComponent(FormHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const single = root.querySelector<HTMLInputElement>('#f1 input')!;
        const range = root.querySelector<HTMLInputElement>('#f2 input')!;
        expect(single.value).toBe('1/15/2024');
        expect(range.value).toBe('1/1/2024 - 1/5/2024');
        await userEvent.clear(single);
        await userEvent.type(single, '2/2/2024');
        expect(fixture.componentInstance.single.value!.toDateString()).toBe('2024-02-02');
        await userEvent.clear(single);
        await fixture.whenStable();
        expect(fixture.componentInstance.single.value).toBeNull();
        expect(fixture.componentInstance.single.errors).toEqual({ dateValidation: { valid: false } });
        fixture.componentInstance.range.setValue(new DateRange(new FdDate(2024, 7, 1), new FdDate(2024, 7, 9)));
        await fixture.whenStable();
        expect(range.value).toBe('7/1/2024 - 7/9/2024');
        fixture.componentInstance.range.disable();
        await fixture.whenStable();
        expect(range.disabled).toBe(true);
    });
});
