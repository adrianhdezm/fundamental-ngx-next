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

    it('references the state and the message from aria-describedby', async () => {
        const { host, input, stable } = await setup();
        expect(input().hasAttribute('aria-describedby')).toBe(false);
        host.message.set('Dates are local');
        await stable();
        const description = () => document.getElementById(input().getAttribute('aria-describedby')!)!;
        expect(description().textContent).toContain('Dates are local');
        await userEvent.clear(input());
        await userEvent.type(input(), 'someday');
        await stable();
        expect(description().textContent).toContain('Value state Error');
        expect(description().textContent).toContain('Dates are local');
    });

    it('keeps aria-haspopup "dialog" on the button, as the calendar opens in a dialog', async () => {
        // upstream says "grid" on the input; the popup here is the popover body with role="dialog"
        const { button, stable } = await setup();
        expect(button().getAttribute('aria-haspopup')).toBe('dialog');
        await userEvent.click(button());
        await stable();
        expect(document.querySelector('#dp-calendar')!.closest('[role="dialog"]')).not.toBeNull();
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

@Component({
    imports: [DatePicker],
    template: `
        <fd-date-picker id="dis" disabled [selectedDate]="date()" />
        <fd-date-picker id="req" required />
        <fd-date-picker id="mut" allowMultipleSelection showTodayButton [(selectedMultipleDates)]="dates" />
        <fd-date-picker
            id="mur"
            type="range"
            allowMultipleSelection
            showTodayButton
            [(selectedMultipleDateRanges)]="ranges"
        />
        <fd-date-picker
            id="rgd"
            type="range"
            [(selectedRangeDate)]="range"
            [disableRangeStartFunction]="weekend"
            [disableRangeEndFunction]="after2024"
        />
        <fd-date-picker id="leg" [selectedDate]="date()" [specialDaysRules]="rules" showCalendarLegend legendCol />
    `
})
class ModesHost {
    readonly date = signal<FdDate | null>(new FdDate(2024, 3, 9));
    readonly dates = signal<FdDate[]>([new FdDate(2000, 10, 10)]);
    readonly ranges = signal<DateRange<FdDate>[]>([]);
    readonly range = signal<DateRange<FdDate> | null>(null);
    readonly weekend = (date: FdDate) => [1, 7].includes(date.getDayOfWeek());
    readonly after2024 = (date: FdDate) => date.year > 2024;
    readonly rules = [
        { specialDayNumber: 5, legendText: 'Team meeting', rule: (d: FdDate) => d.day === 13 },
        { specialDayNumber: 6, legendText: 'Release', appointment: true, rule: (d: FdDate) => d.day === 15 }
    ];
}

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
    const picker = (id: string) => root.querySelector<HTMLElement>(`fd-date-picker#${id}`)!;
    const button = (id: string) => picker(id).querySelector<HTMLButtonElement>('button[aria-label="Open picker"]')!;
    const open = async (id: string) => {
        await userEvent.click(button(id));
        await stable();
    };
    /** Month and year shown in the header of an open calendar. */
    const header = (id: string) =>
        [...document.querySelectorAll<HTMLButtonElement>(`#${id}-calendar > div:first-child button`)]
            .map((b) => b.textContent!.trim())
            .filter(Boolean);
    const todayButton = () => [...document.querySelectorAll('button')].find((b) => b.textContent!.trim() === 'Today')!;
    return {
        fixture,
        host: fixture.componentInstance,
        stable,
        open,
        header,
        todayButton,
        button,
        input: (id: string) => picker(id).querySelector<HTMLInputElement>('input')!
    };
}

describe('DatePicker modes', () => {
    it('does not open when disabled', async () => {
        const { input, button, stable } = await setupModes();
        expect(button('dis').disabled).toBe(true);
        button('dis').click();
        input('dis').dispatchEvent(new KeyboardEvent('keydown', { key: 'F4', bubbles: true }));
        await stable();
        expect(document.querySelector('#dis-calendar')).toBeNull();
        expect(button('dis').getAttribute('aria-expanded')).toBe('false');
    });

    it('sets aria-required', async () => {
        const { input } = await setupModes();
        expect(input('req').getAttribute('aria-required')).toBe('true');
        expect(input('dis').hasAttribute('aria-required')).toBe(false);
    });

    it('keeps the displayed month when adding a multiple date', async () => {
        const { host, input, open, header, stable } = await setupModes();
        await open('mut');
        expect(header('mut')).toEqual(['October', '2000']);
        await userEvent.click(document.querySelector<HTMLButtonElement>('#mut-calendar button[aria-label^="Next"]')!);
        await stable();
        expect(header('mut')).toEqual(['November', '2000']);
        await userEvent.click(dayCell('mut-calendar', 10));
        await stable();
        expect(header('mut')).toEqual(['November', '2000']);
        expect(host.dates().map((d) => d.toDateString())).toEqual(['2000-10-10', '2000-11-10']);
        expect(input('mut').value).toBe('10/10/2000, 11/10/2000');
    });

    it('today button navigates to today in multiple mode', async () => {
        const { host, open, header, todayButton, stable } = await setupModes();
        await open('mut');
        expect(header('mut')).toEqual(['October', '2000']);
        await userEvent.click(todayButton());
        await stable();
        const today = FdDate.getNow();
        expect(host.dates().map((d) => d.toDateString())).toEqual([today.toDateString()]);
        const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(today.toDate());
        expect(header('mut')).toEqual([month, String(today.year)]);
    });

    it('picks, types and rejects multiple date ranges', async () => {
        const { host, input, open, todayButton, stable } = await setupModes();
        await open('mur');
        await userEvent.click(dayCell('mur-calendar', 2));
        await userEvent.click(dayCell('mur-calendar', 4));
        await stable();
        expect(host.ranges()).toHaveLength(1);
        expect(host.ranges()[0].start!.day).toBe(2);
        expect(host.ranges()[0].end!.day).toBe(4);
        // the calendar stays open for more ranges
        expect(document.querySelector('#mur-calendar')).not.toBeNull();
        await userEvent.click(todayButton());
        await stable();
        const today = FdDate.getNow().toDateString();
        expect(host.ranges().map((r) => [r.start!.toDateString(), r.end!.toDateString()])).toEqual([[today, today]]);
        await userEvent.keyboard('{Escape}');
        await stable();
        await userEvent.clear(input('mur'));
        await userEvent.type(input('mur'), '3/1/2024 - 3/3/2024, 3/12/2024 - 3/10/2024');
        await stable();
        expect(host.ranges().map((r) => `${r.start!.toDateString()}/${r.end!.toDateString()}`)).toEqual([
            '2024-03-01/2024-03-03',
            '2024-03-10/2024-03-12'
        ]);
        expect(input('mur').hasAttribute('aria-invalid')).toBe(false);
        await userEvent.clear(input('mur'));
        await userEvent.type(input('mur'), '3/1/2024 - 3/3/2024, sometime');
        await userEvent.tab();
        await stable();
        expect(input('mur').getAttribute('aria-invalid')).toBe('true');
        expect(input('mur').value).toBe('3/1/2024 - 3/3/2024, sometime');
    });

    it('accepts a reversed typed range and marks it invalid when its start or end is disabled', async () => {
        const { host, input, stable } = await setupModes();
        const type = async (text: string) => {
            await userEvent.clear(input('rgd'));
            await userEvent.type(input('rgd'), text);
            await stable();
        };
        await type('3/15/2024 - 3/11/2024');
        expect(host.range()!.start!.toDateString()).toBe('2024-03-11');
        expect(host.range()!.end!.toDateString()).toBe('2024-03-15');
        expect(input('rgd').hasAttribute('aria-invalid')).toBe(false);
        // March 9, 2024 is a Saturday: the start is disabled
        await type('3/9/2024 - 3/15/2024');
        expect(input('rgd').getAttribute('aria-invalid')).toBe('true');
        await type('3/11/2024 - 3/15/2024');
        expect(input('rgd').hasAttribute('aria-invalid')).toBe(false);
        // the end is after 2024
        await type('3/11/2024 - 1/6/2025');
        expect(input('rgd').getAttribute('aria-invalid')).toBe('true');
    });

    it('renders the legend inside the calendar with legendCol', async () => {
        const { open } = await setupModes();
        await open('leg');
        const legend = document.querySelector<HTMLElement>('#leg-calendar fd-calendar-legend')!;
        expect(legend).not.toBeNull();
        expect(legend.getAttribute('role')).toBe('list');
        expect(getComputedStyle(legend).columnWidth).toBe('auto');
        const items = [...legend.querySelectorAll('fd-calendar-legend-item')].map((i) => i.textContent!.trim());
        expect(items.slice(-2)).toEqual(['Team meeting', 'Release']);
        // the picker renders no legend of its own
        expect(document.querySelectorAll('fd-calendar-legend')).toHaveLength(1);
    });
});

@Component({
    imports: [DatePicker, ReactiveFormsModule],
    template: `
        <fd-date-picker id="fm" allowMultipleSelection [formControl]="dates" />
        <fd-date-picker id="fr" type="range" allowMultipleSelection [formControl]="ranges" />
    `
})
class MultiFormHost {
    readonly dates = new FormControl<FdDate[] | null>([new FdDate(2024, 1, 2), new FdDate(2024, 1, 3)]);
    readonly ranges = new FormControl<DateRange<FdDate>[] | null>([
        new DateRange(new FdDate(2024, 1, 1), new FdDate(2024, 1, 5))
    ]);
}

describe('DatePicker multiple forms', () => {
    it('writes and clears multiple dates and multiple ranges through the form', async () => {
        const fixture = TestBed.createComponent(MultiFormHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const dates = root.querySelector<HTMLInputElement>('#fm input')!;
        const ranges = root.querySelector<HTMLInputElement>('#fr input')!;
        const host = fixture.componentInstance;
        expect(dates.value).toBe('1/2/2024, 1/3/2024');
        expect(ranges.value).toBe('1/1/2024 - 1/5/2024');
        host.dates.setValue([new FdDate(2024, 6, 1)]);
        host.ranges.setValue([
            new DateRange(new FdDate(2024, 6, 1), new FdDate(2024, 6, 3)),
            new DateRange(new FdDate(2024, 6, 10), new FdDate(2024, 6, 12))
        ]);
        await fixture.whenStable();
        expect(dates.value).toBe('6/1/2024');
        expect(ranges.value).toBe('6/1/2024 - 6/3/2024, 6/10/2024 - 6/12/2024');
        host.dates.setValue(null);
        host.ranges.setValue(null);
        await fixture.whenStable();
        expect(dates.value).toBe('');
        expect(ranges.value).toBe('');
        expect(host.dates.valid).toBe(true);
        await userEvent.type(dates, '7/4/2024, 7/5/2024');
        expect(host.dates.value!.map((d) => d.toDateString())).toEqual(['2024-07-04', '2024-07-05']);
    });
});
