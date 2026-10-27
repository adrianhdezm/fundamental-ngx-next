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
            [legendCol]="legendCol()"
            [rangeHoverEffect]="hoverEffect()"
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
    readonly legendCol = signal(false);
    readonly hoverEffect = signal(false);
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

describe('Calendar views and grids', () => {
    /** Visible text of the header buttons: month and year, or the years range. */
    const headerOf = (root: HTMLElement) =>
        [...root.querySelectorAll<HTMLButtonElement>('fd-calendar > div:first-child button')]
            .map((b) => b.textContent!.trim())
            .filter(Boolean);

    it('grids expose aria-readonly and aria-multiselectable per selection mode', async () => {
        const { host, root, stable, button } = await setup();
        const grid = () => root.querySelector('table[role=grid]')!;
        expect(grid().getAttribute('aria-readonly')).toBe('false');
        expect(grid().getAttribute('aria-multiselectable')).toBe('false');
        host.calType.set('range');
        await stable();
        expect(grid().getAttribute('aria-multiselectable')).toBe('true');
        host.calType.set('single');
        host.multiple.set(true);
        await stable();
        expect(grid().getAttribute('aria-multiselectable')).toBe('true');
        // the text of a cell is no button of its own
        expect(root.querySelectorAll('td[role=gridcell] [role=button], td[role=gridcell] button')).toHaveLength(0);
        await userEvent.click(button('March, Select month'));
        await stable();
        expect(grid().getAttribute('aria-readonly')).toBe('false');
        expect(grid().getAttribute('aria-multiselectable')).toBe('false');
        expect(root.querySelectorAll('td[role=gridcell] button')).toHaveLength(0);
        await userEvent.click(button('2024, Select year'));
        await stable();
        expect(grid().getAttribute('aria-multiselectable')).toBe('false');
    });

    it('months with six weeks render six rows, others five or four', async () => {
        const { host, root, stable } = await setup();
        const rows = () => root.querySelectorAll('tbody tr[role=row]');
        // March 2024 starts on a Friday: six weeks
        expect(rows()).toHaveLength(6);
        // February 2015 starts on a Sunday and has 28 days: four weeks, the grid keeps its height
        host.date.set(new FdDate(2015, 2, 10));
        await stable();
        expect(rows()).toHaveLength(4);
        expect(root.querySelectorAll('tbody tr[aria-hidden=true]')).toHaveLength(2);
        // February 2020 with Monday first: the weeks of upstream's spec
        host.weekStart.set(2);
        host.date.set(new FdDate(2020, 2, 10));
        await stable();
        expect([...rows()].map((row) => [...row.querySelectorAll('td')].map((td) => td.textContent!.trim()))).toEqual([
            ['27', '28', '29', '30', '31', '1', '2'],
            ['3', '4', '5', '6', '7', '8', '9'],
            ['10', '11', '12', '13', '14', '15', '16'],
            ['17', '18', '19', '20', '21', '22', '23'],
            ['24', '25', '26', '27', '28', '29', '1']
        ]);
    });

    it('today is the tab stop when nothing is selected', async () => {
        const { root } = await setup((h) => h.date.set(null));
        const stops = root.querySelectorAll<HTMLElement>('td[tabindex="0"]');
        expect(stops).toHaveLength(1);
        expect(stops[0].getAttribute('data-fd-calendar-date-day')).toBe(String(FdDate.getNow().day));
        expect(stops[0].getAttribute('data-fd-calendar-month-status')).toBe('current');
        expect(stops[0].getAttribute('aria-label')).toContain('Today');
    });

    it('range hover marks the days up to the hovered day', async () => {
        const { root, currentMonthDay, stable } = await setup((h) => {
            h.calType.set('range');
            h.hoverEffect.set(true);
        });
        const marked = () =>
            [...root.querySelectorAll<HTMLElement>('td[data-fd-calendar-month-status="current"]')]
                .filter((td) => td.className.includes('sapList_SelectionBackgroundColor'))
                .map((td) => Number(td.getAttribute('data-fd-calendar-date-day')));
        await userEvent.click(currentMonthDay('12'));
        await userEvent.hover(currentMonthDay('16'));
        await stable();
        expect(marked()).toEqual([13, 14, 15]);
        await userEvent.hover(currentMonthDay('8'));
        await stable();
        expect(marked()).toEqual([9, 10, 11]);
    });

    it('the years-range view lists year ranges and Enter selects one', async () => {
        const { root, stable, button } = await setup();
        await userEvent.click(button('2024, Select year'));
        await stable();
        await userEvent.click(button('2024 - 2043, Select years range'));
        await stable();
        const cells = [...root.querySelectorAll<HTMLElement>('td[role=gridcell]')];
        expect(cells).toHaveLength(12);
        expect(cells.slice(0, 3).map((td) => td.textContent!.trim())).toEqual([
            '2004 - 2023',
            '2024 - 2043',
            '2044 - 2063'
        ]);
        expect(root.querySelector('table[role=grid]')!.getAttribute('aria-multiselectable')).toBe('false');
        // the period of the shown year has the focus
        expect(document.activeElement).toBe(cells[1]);
        await userEvent.keyboard('{ArrowRight}{Enter}');
        await stable();
        const years = [...root.querySelectorAll<HTMLElement>('td[data-fd-calendar-year]')];
        expect(years[0].textContent!.trim()).toBe('2044');
        expect(years).toHaveLength(20);
        expect(document.activeElement).toBe(years[0]);
    });

    it('arrow keys and Enter/Space pick a month and a year', async () => {
        const { root, stable, button } = await setup();
        await userEvent.click(button('March, Select month'));
        await stable();
        const months = () => [...root.querySelectorAll<HTMLElement>('td[data-fd-calendar-month]')];
        expect(document.activeElement).toBe(months()[2]);
        await userEvent.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(months()[5]);
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(months()[4]);
        await userEvent.keyboard('{ArrowUp}');
        expect(document.activeElement).toBe(months()[1]);
        await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(headerOf(root)).toEqual(['May', '2024']);
        await userEvent.click(button('2024, Select year'));
        await stable();
        const years = () => [...root.querySelectorAll<HTMLElement>('td[data-fd-calendar-year]')];
        expect(document.activeElement).toBe(years()[0]);
        await userEvent.keyboard('{ArrowRight}{ArrowDown}');
        expect(document.activeElement!.textContent!.trim()).toBe('2030');
        await userEvent.keyboard(' ');
        await stable();
        expect(headerOf(root)).toEqual(['May', '2030']);
    });

    it('ArrowUp on the first row and ArrowLeft on the first cell go to the previous month', async () => {
        const { root, stable, currentMonthDay } = await setup();
        // March 2024 starts on a Friday: the 2nd is in the first row
        currentMonthDay('2').focus();
        await userEvent.keyboard('{ArrowUp}');
        await stable();
        expect(headerOf(root)).toEqual(['February', '2024']);
        expect(document.activeElement!.getAttribute('aria-label')).toContain('February 24, 2024');
        // the first cell of February's grid is January 28
        const first = root.querySelector<HTMLElement>('td[role=gridcell]')!;
        expect(first.getAttribute('aria-label')).toContain('January 28, 2024');
        first.focus();
        await userEvent.keyboard('{ArrowLeft}');
        await stable();
        expect(headerOf(root)).toEqual(['January', '2024']);
        expect(document.activeElement!.getAttribute('aria-label')).toContain('January 27, 2024');
    });

    it('Space selects the focused day', async () => {
        const { host, stable, currentMonthDay } = await setup();
        currentMonthDay('9').focus();
        await userEvent.keyboard('{ArrowRight} ');
        await stable();
        expect(host.date()!.toDateString()).toBe('2024-03-10');
        expect(currentMonthDay('10').getAttribute('aria-selected')).toBe('true');
    });

    it('legend items are list items; the legend is labelled and can be a column; appointment entries show a circle', async () => {
        const { host, root, stable } = await setup((h) =>
            h.rules.set([
                { specialDayNumber: 3, legendText: 'Meeting', rule: (d) => d.day === 13 },
                { specialDayNumber: 7, legendText: 'Release', appointment: true, rule: (d) => d.day === 20 }
            ])
        );
        const legend = root.querySelector<HTMLElement>('fd-calendar-legend')!;
        expect(legend.getAttribute('role')).toBe('list');
        expect(legend.getAttribute('aria-label')).toBe('Calendar Legend');
        const items = [...legend.querySelectorAll<HTMLElement>('fd-calendar-legend-item')];
        expect(items.every((item) => item.getAttribute('role') === 'listitem' && item.tabIndex === 0)).toBe(true);
        // today, selected, work and non-work days first
        expect(items).toHaveLength(6);
        const marker = (item: HTMLElement) => getComputedStyle(item.firstElementChild!).borderTopLeftRadius;
        expect(marker(items.at(-2)!)).toBe('0px');
        expect(marker(items.at(-1)!)).not.toBe('0px');
        expect(getComputedStyle(legend).columnWidth).not.toBe('auto');
        host.legendCol.set(true);
        await stable();
        expect(getComputedStyle(legend).columnWidth).toBe('auto');
        // the legend follows the rules
        host.rules.set([{ specialDayNumber: 4, legendText: 'Holiday', rule: (d) => d.day === 1 }]);
        await stable();
        const texts = [...root.querySelectorAll('fd-calendar-legend-item')].map((i) => i.textContent!.trim());
        expect(texts.at(-1)).toBe('Holiday');
        expect(texts).not.toContain('Release');
    });
});

describe('Calendar shift-click', () => {
    const days = (dates: FdDate[]) => dates.map((d) => d.toDateString()).sort();
    /** Several dates, March 2024 shown through a first selected date (no anchor yet). */
    const multiple = (h: Host) => {
        h.multiple.set(true);
        h.dates.set([new FdDate(2024, 3, 1)]);
    };

    it('shift-click without an anchor selects only the clicked date', async () => {
        const { host, currentMonthDay, stable } = await setup(multiple);
        await userEvent.keyboard('{Shift>}');
        await userEvent.click(currentMonthDay('15'));
        await userEvent.keyboard('{/Shift}');
        await stable();
        // no span from the 1st, which was not clicked
        expect(days(host.dates())).toEqual(['2024-03-01', '2024-03-15']);
    });

    it('shift-click fills across months and in reverse', async () => {
        const { host, currentMonthDay, stable, button } = await setup(multiple);
        await userEvent.click(currentMonthDay('30'));
        await userEvent.click(button('Next month'));
        await stable();
        await userEvent.keyboard('{Shift>}');
        await userEvent.click(currentMonthDay('2'));
        await userEvent.keyboard('{/Shift}');
        await stable();
        expect(days(host.dates())).toEqual(['2024-03-01', '2024-03-30', '2024-03-31', '2024-04-01', '2024-04-02']);
        // a later anchor and an earlier click
        await userEvent.click(currentMonthDay('12'));
        await userEvent.keyboard('{Shift>}');
        await userEvent.click(currentMonthDay('9'));
        await userEvent.keyboard('{/Shift}');
        await stable();
        expect(days(host.dates())).toEqual([
            '2024-03-01',
            '2024-03-30',
            '2024-03-31',
            '2024-04-01',
            '2024-04-02',
            '2024-04-09',
            '2024-04-10',
            '2024-04-11',
            '2024-04-12'
        ]);
    });
});

@Component({
    imports: [Calendar, ReactiveFormsModule],
    template: `
        <fd-calendar id="cm" allowMultipleSelection [formControl]="dates" />
        <fd-calendar id="cr" calType="range" [formControl]="range" />
        <fd-calendar id="cmr" calType="range" allowMultipleSelection [formControl]="ranges" />
    `
})
class ModesFormHost {
    readonly dates = new FormControl<FdDate[] | null>([new FdDate(2024, 3, 4)]);
    readonly range = new FormControl<DateRange<FdDate> | null>(
        new DateRange(new FdDate(2024, 3, 4), new FdDate(2024, 3, 8))
    );
    readonly ranges = new FormControl<DateRange<FdDate>[] | null>([
        new DateRange(new FdDate(2024, 3, 4), new FdDate(2024, 3, 8))
    ]);
}

describe('Calendar forms, all modes', () => {
    async function setupForms() {
        const fixture = TestBed.createComponent(ModesFormHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const day = (id: string, label: string) =>
            root.querySelector<HTMLElement>(
                `#${id} td[data-fd-calendar-date-day="${label}"][data-fd-calendar-month-status="current"]`
            )!;
        return { fixture, host: fixture.componentInstance, root, day };
    }

    it('writeValue validates multiple dates, ranges and multiple ranges', async () => {
        const { fixture, host } = await setupForms();
        const invalid = new FdDate(NaN);
        const error = { dateValidation: { valid: false } };
        expect([host.dates.errors, host.range.errors, host.ranges.errors]).toEqual([null, null, null]);
        host.dates.setValue([new FdDate(2024, 3, 4), invalid]);
        host.range.setValue(new DateRange(new FdDate(2024, 3, 4), invalid));
        host.ranges.setValue([new DateRange(invalid, new FdDate(2024, 3, 8))]);
        await fixture.whenStable();
        expect([host.dates.errors, host.range.errors, host.ranges.errors]).toEqual([error, error, error]);
        // a range without its end is not complete
        host.range.setValue(new DateRange(new FdDate(2024, 3, 4), null));
        host.dates.setValue([new FdDate(2024, 5, 1), new FdDate(2024, 5, 2)]);
        host.ranges.setValue([
            new DateRange(new FdDate(2024, 5, 1), new FdDate(2024, 5, 3)),
            new DateRange(new FdDate(2024, 5, 10), new FdDate(2024, 5, 12))
        ]);
        await fixture.whenStable();
        expect([host.dates.errors, host.range.errors, host.ranges.errors]).toEqual([null, error, null]);
        host.range.setValue(new DateRange(new FdDate(2024, 3, 4), new FdDate(2024, 3, 9)));
        await fixture.whenStable();
        expect(host.range.errors).toBeNull();
    });

    it('writing a value resets the shift anchor', async () => {
        const { fixture, host, day } = await setupForms();
        await userEvent.click(day('cm', '5'));
        await fixture.whenStable();
        expect(host.dates.value!.map((d) => d.day)).toEqual([4, 5]);
        host.dates.setValue([]);
        await fixture.whenStable();
        await userEvent.keyboard('{Shift>}');
        await userEvent.click(day('cm', '9'));
        await userEvent.keyboard('{/Shift}');
        await fixture.whenStable();
        // no fill from the 5th: the anchor was dropped
        expect(host.dates.value!.map((d) => d.day)).toEqual([9]);
    });
});
