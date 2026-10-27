import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { FdDate } from '@/lib/datetime';
import { Calendar, DateRange, type CalendarType, type DaysOfWeek, type SpecialDayRule } from './calendar';

@Component({
    imports: [Calendar],
    template: `
        <fd-calendar
            id="cal"
            [calType]="calType()"
            [allowMultipleSelection]="multiple()"
            [startingDayOfWeek]="weekStart()"
            [showWeekNumbers]="weekNumbers()"
            [disableFunction]="disable()"
            [specialDaysRules]="rules()"
            [showCalendarLegend]="!!rules().length"
            [(selectedDate)]="date"
            [(selectedRangeDate)]="range"
            [(selectedMultipleDates)]="dates"
            [(selectedMultipleDateRanges)]="ranges"
            (closeCalendar)="closes = closes + 1"
        />
    `
})
class Host {
    readonly calType = signal<CalendarType>('single');
    readonly multiple = signal(false);
    readonly weekStart = signal<DaysOfWeek | undefined>(1);
    readonly weekNumbers = signal(false);
    readonly disable = signal<((date: FdDate) => boolean) | undefined>(undefined);
    readonly rules = signal<SpecialDayRule<FdDate>[]>([]);
    readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9));
    readonly range = signal<DateRange<FdDate> | null | undefined>(null);
    readonly dates = signal<FdDate[]>([]);
    readonly ranges = signal<DateRange<FdDate>[]>([]);
    closes = 0;
}

async function setup(configure?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        await fixture.whenStable();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await fixture.whenStable();
    };
    await stable();
    const root = fixture.nativeElement as HTMLElement;
    const currentMonthDay = (label: string) =>
        root.querySelector<HTMLElement>(
            `td[data-fd-calendar-date-day="${label}"][data-fd-calendar-month-status="current"]`
        )!;
    const header = () =>
        [...root.querySelectorAll<HTMLButtonElement>('fd-calendar > div:first-child button')].map((b) =>
            b.textContent!.trim()
        );
    const button = (label: string) => root.querySelector<HTMLButtonElement>(`button[aria-label^="${label}"]`)!;
    return { fixture, host: fixture.componentInstance, root, stable, currentMonthDay, header, button };
}

describe('Calendar', () => {
    it('shows the month of the selected date as a grid', async () => {
        const { root, header, currentMonthDay } = await setup();
        expect(root.querySelector('fd-calendar')!.getAttribute('role')).toBe('group');
        expect(header()).toEqual(['', 'March', '2024', '']);
        const grid = root.querySelector('table[role=grid]')!;
        expect(grid.getAttribute('aria-roledescription')).toBe('Calendar');
        const headers = [...grid.querySelectorAll('thead th')].map((th) => th.textContent!.trim());
        expect(headers).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
        const nine = currentMonthDay('9');
        expect(nine.getAttribute('aria-selected')).toBe('true');
        expect(nine.getAttribute('aria-label')).toContain('March 9, 2024');
        expect(nine.getAttribute('aria-label')).toContain('Selected date');
        expect(nine.tabIndex).toBe(0);
        expect(root.querySelectorAll('td[tabindex="0"]')).toHaveLength(1);
        // March 2024 starts on a Friday: 5 days of February before it
        expect(root.querySelectorAll('td[role=gridcell]')[5].textContent!.trim()).toBe('1');
    });

    it('starts the week on the given day and shows week numbers', async () => {
        const { root } = await setup((h) => {
            h.weekStart.set(2);
            h.weekNumbers.set(true);
        });
        const headers = [...root.querySelectorAll('thead th')].map((th) => th.textContent!.trim());
        expect(headers.slice(1, 3)).toEqual(['Mon', 'Tue']);
        expect(headers[0]).toBe('Calendar week');
        const weeks = [...root.querySelectorAll('tbody th[data-fd-calendar-week]')].map((th) => th.textContent!.trim());
        expect(weeks[0]).toBe('9');
        expect(weeks.at(-1)).toBe('13');
    });

    it('selects a date with a click', async () => {
        const { host, currentMonthDay, stable } = await setup();
        await userEvent.click(currentMonthDay('14'));
        await stable();
        expect(host.date()!.toDateString()).toBe('2024-03-14');
        expect(host.closes).toBe(1);
        expect(currentMonthDay('14').getAttribute('aria-selected')).toBe('true');
    });

    it('does not select disabled dates', async () => {
        const { host, currentMonthDay, stable } = await setup((h) => h.disable.set(() => true));
        const target = currentMonthDay('14');
        expect(target.getAttribute('aria-disabled')).toBe('true');
        target.click();
        await stable();
        expect(host.date()!.toDateString()).toBe('2024-03-09');
    });

    it('moves with the arrow keys across months and selects with Enter', async () => {
        const { host, root, header, stable, currentMonthDay } = await setup();
        currentMonthDay('9').focus();
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await stable();
        expect(document.activeElement!.getAttribute('aria-label')).toContain('March 17, 2024');
        for (let i = 0; i < 3; i++) await userEvent.keyboard('{ArrowDown}');
        await stable();
        expect(header()[1]).toBe('April');
        expect(document.activeElement!.getAttribute('aria-label')).toContain('April 7, 2024');
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(host.date()!.toDateString()).toBe('2024-04-07');
        // Tab keeps the focus in the calendar: back to the previous button
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement!.id).toBe('cal-header-left-arrow');
        expect(root.contains(document.activeElement)).toBe(true);
    });

    it('navigates months, and picks a month and a year in their views', async () => {
        const { root, header, button, stable } = await setup();
        await userEvent.click(button('Next month'));
        await userEvent.click(button('Next month'));
        await stable();
        expect(header()[1]).toBe('May');
        await userEvent.click(button('May, Select month'));
        await stable();
        const months = [...root.querySelectorAll('td[data-fd-calendar-month]')];
        expect(months).toHaveLength(12);
        expect(document.activeElement).toBe(months[4]);
        await userEvent.click(months[7]);
        await stable();
        expect(header()[1]).toBe('August');
        await userEvent.click(button('2024, Select year'));
        await stable();
        const years = [...root.querySelectorAll('td[data-fd-calendar-year]')];
        expect(years).toHaveLength(20);
        expect(years[0].textContent!.trim()).toBe('2024');
        await userEvent.click(button('Next year'));
        await stable();
        expect(root.querySelector('td[data-fd-calendar-year]')!.textContent!.trim()).toBe('2044');
        await userEvent.click(root.querySelector('td[data-fd-calendar-year="2050"]')!);
        await stable();
        expect(header()).toEqual(['', 'August', '2050', '']);
    });

    it('picks a range in either order', async () => {
        const { host, currentMonthDay, stable } = await setup((h) => h.calType.set('range'));
        await userEvent.click(currentMonthDay('20'));
        await stable();
        expect(host.range()!.start!.day).toBe(20);
        expect(host.range()!.end).toBeNull();
        await userEvent.click(currentMonthDay('12'));
        await stable();
        expect([host.range()!.start!.day, host.range()!.end!.day]).toEqual([12, 20]);
        expect(currentMonthDay('15').className).toContain('sapList_SelectionBackgroundColor');
        expect(currentMonthDay('12').getAttribute('aria-label')).toContain('Range start');
    });

    it('selects several dates and spans with Shift', async () => {
        const { host, currentMonthDay, stable } = await setup((h) => h.multiple.set(true));
        await userEvent.click(currentMonthDay('4'));
        await userEvent.click(currentMonthDay('6'));
        await stable();
        expect(host.dates().map((d) => d.day)).toEqual([4, 6]);
        await userEvent.click(currentMonthDay('4'));
        await stable();
        expect(host.dates().map((d) => d.day)).toEqual([6]);
        await userEvent.keyboard('{Shift>}');
        await userEvent.click(currentMonthDay('9'));
        await userEvent.keyboard('{/Shift}');
        await stable();
        // the deselected 4 is the anchor of the span
        expect(
            host
                .dates()
                .map((d) => d.day)
                .sort((a, b) => a - b)
        ).toEqual([4, 5, 6, 7, 8, 9]);
    });

    it('merges several overlapping ranges', async () => {
        const { host, currentMonthDay, stable } = await setup((h) => {
            h.calType.set('range');
            h.multiple.set(true);
        });
        // a second range around the first one swallows it
        for (const label of ['4', '6', '2', '8']) {
            await userEvent.click(currentMonthDay(label));
            await stable();
        }
        expect(host.ranges().map((r) => `${r.start!.day}-${r.end!.day}`)).toEqual(['2-8']);
    });

    it('marks special days and lists them in the legend', async () => {
        const { root, stable, currentMonthDay } = await setup((h) =>
            h.rules.set([
                { specialDayNumber: 3, legendText: 'Meeting', rule: (d) => d.day === 13 },
                { specialDayNumber: 7, legendText: 'Release', rule: (d) => d.day === 20 }
            ])
        );
        expect(currentMonthDay('13').style.getPropertyValue('--cal-legend')).toBe('var(--sapLegendColor3)');
        const legend = root.querySelector('fd-calendar-legend')!;
        expect(legend.getAttribute('role')).toBe('list');
        const items = [...legend.querySelectorAll<HTMLElement>('fd-calendar-legend-item')];
        expect(items.map((i) => i.textContent!.trim()).slice(-2)).toEqual(['Meeting', 'Release']);
        // while an entry has the focus, only its days keep the marker
        items.at(-1)!.focus();
        await stable();
        expect(currentMonthDay('13').className).not.toContain('shadow-[inset_0_-0.3125rem');
        expect(currentMonthDay('20').className).toContain('shadow-[inset_0_-0.3125rem');
    });
});

@Component({
    imports: [Calendar, ReactiveFormsModule],
    template: `<fd-calendar [formControl]="control" />`
})
class FormHost {
    readonly control = new FormControl<FdDate | null>(new FdDate(2024, 5, 5), Validators.required);
}

describe('Calendar forms', () => {
    it('writes and reads the value and validates it', async () => {
        const fixture = TestBed.createComponent(FormHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        expect(root.textContent).toContain('May');
        const cell = root.querySelector<HTMLElement>(
            'td[data-fd-calendar-date-day="20"][data-fd-calendar-month-status="current"]'
        )!;
        await userEvent.click(cell);
        expect(fixture.componentInstance.control.value!.toDateString()).toBe('2024-05-20');
        fixture.componentInstance.control.setValue(new FdDate(2024, 2, 30));
        await fixture.whenStable();
        expect(fixture.componentInstance.control.errors).toEqual({ dateValidation: { valid: false } });
    });
});
