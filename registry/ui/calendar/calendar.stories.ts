import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { DatetimeAdapter, FdDate, provideDateTimeFormats } from '@/lib/datetime';
import { Title } from '@/ui/title/title';
import { Calendar, CalendarLegend, DateRange, type SpecialDayRule } from './calendar';

const heading = 'mt-6 mb-2 first:mt-0';
const value = 'font-sap-font-family text-sap-font-size text-sap-text-color';
const row = 'flex flex-wrap items-start gap-6';

/** Formats a date for the value lines of the stories. */
const show = (date: FdDate | null | undefined) => (date ? date.toDateString() : '-');

@Component({
    selector: 'story-calendar-single',
    imports: [Calendar, Title],
    template: `
        <div class="${row}">
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Single date</h3>
                <fd-calendar [(selectedDate)]="date" />
                <p class="${value}">Selected: {{ show(date()) }}</p>
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Week numbers, Monday first, no weekends</h3>
                <fd-calendar showWeekNumbers [startingDayOfWeek]="2" [markWeekends]="false" />
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Weekends and past days disabled</h3>
                <fd-calendar [selectedDate]="null" [disableFunction]="disable" />
            </div>
        </div>
    `
})
class StoryCalendarSingle {
    protected readonly show = show;
    protected readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9));
    private readonly adapter = inject<DatetimeAdapter<FdDate>>(DatetimeAdapter);
    protected readonly disable = (date: FdDate) => {
        const day = this.adapter.getDayOfWeek(date);
        return day === 1 || day === 7 || this.adapter.compareDate(date, this.adapter.today()) < 0;
    };
}

@Component({
    selector: 'story-calendar-range',
    imports: [Calendar, Title],
    template: `
        <div class="${row}">
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Range with hover effect</h3>
                <fd-calendar calType="range" rangeHoverEffect [(selectedRangeDate)]="range" />
                <p class="${value}">{{ show(range()?.start) }} – {{ show(range()?.end) }}</p>
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Several dates (Shift-click adds a span)</h3>
                <fd-calendar allowMultipleSelection showWeekNumbers [(selectedMultipleDates)]="dates" />
                <p class="${value}">{{ dates().length }} dates</p>
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Several ranges</h3>
                <fd-calendar
                    calType="range"
                    allowMultipleSelection
                    rangeHoverEffect
                    [(selectedMultipleDateRanges)]="ranges"
                />
                <p class="${value}">
                    @for (r of ranges(); track $index) {
                        <span class="block">{{ show(r.start) }} – {{ show(r.end) }}</span>
                    }
                </p>
            </div>
        </div>
    `
})
class StoryCalendarRange {
    protected readonly show = show;
    protected readonly range = signal<DateRange<FdDate> | null | undefined>(
        new DateRange(new FdDate(2024, 3, 6), new FdDate(2024, 3, 13))
    );
    protected readonly dates = signal<FdDate[]>([new FdDate(2024, 3, 4), new FdDate(2024, 3, 7)]);
    protected readonly ranges = signal<DateRange<FdDate>[]>([
        new DateRange(new FdDate(2024, 3, 4), new FdDate(2024, 3, 6))
    ]);
}

@Component({
    selector: 'story-calendar-special',
    imports: [Calendar, CalendarLegend, Title],
    template: `
        <div class="${row}">
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Special days with a legend</h3>
                <fd-calendar [selectedDate]="date" [specialDaysRules]="rules" showCalendarLegend />
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Months and years ranges</h3>
                <div class="flex flex-col gap-4">
                    <fd-calendar calType="range" dateRangeFormat="month" activeView="month" rangeHoverEffect />
                    <fd-calendar calType="range" dateRangeFormat="year" activeView="year" rangeHoverEffect />
                </div>
            </div>
        </div>
    `
})
class StoryCalendarSpecial {
    protected readonly date = new FdDate(2024, 3, 9);
    protected readonly rules: SpecialDayRule<FdDate>[] = [
        { specialDayNumber: 5, legendText: 'Team meeting', rule: (d) => d.getDayOfWeek() === 3 },
        { specialDayNumber: 6, legendText: 'Release', appointment: true, rule: (d) => d.day === 15 },
        { specialDayNumber: 10, legendText: 'Holiday', rule: (d) => d.month === 3 && d.day === 29 }
    ];
}

@Component({
    selector: 'story-calendar-form',
    imports: [Calendar, Title, FormsModule, JsonPipe],
    template: `
        <div class="${row}">
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Form control</h3>
                <fd-calendar [(ngModel)]="model" #control="ngModel" required />
                <p class="${value}">Value: {{ show(model) }}, valid: {{ control.valid }}</p>
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Navigation limited to 2024</h3>
                <fd-calendar
                    [selectedDate]="date"
                    [previousButtonDisableFunction]="noEarlier"
                    [nextButtonDisableFunction]="noLater"
                />
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Large year grid</h3>
                <fd-calendar activeView="year" [yearGrid]="{ rows: 6, cols: 4 }" />
            </div>
        </div>
    `
})
class StoryCalendarForm {
    protected readonly show = show;
    protected model: FdDate | null = new FdDate(2024, 6, 1);
    protected readonly date = new FdDate(2024, 6, 1);
    protected readonly noEarlier = (_: unknown, current: { year: number; month: number }, view: string) =>
        view === 'day' ? current.year <= 2024 && current.month <= 1 : current.year <= 2024;
    protected readonly noLater = (_: unknown, current: { year: number; month: number }, view: string) =>
        view === 'day' ? current.year >= 2024 && current.month >= 12 : current.year >= 2024;
}

@Component({
    selector: 'story-calendar-locale',
    imports: [Calendar, Title],
    providers: [provideDateTimeFormats()],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">German locale (an adapter of its own)</h3>
        <fd-calendar [selectedDate]="date" showWeekNumbers />
    `
})
class StoryCalendarLocale {
    protected readonly date = new FdDate(2024, 3, 9);

    constructor() {
        inject(DatetimeAdapter).setLocale('de-DE');
    }
}

const meta: Meta<Calendar<FdDate>> = {
    title: 'Components/Calendar',
    component: Calendar,
    decorators: [
        moduleMetadata({
            imports: [
                StoryCalendarSingle,
                StoryCalendarRange,
                StoryCalendarSpecial,
                StoryCalendarForm,
                StoryCalendarLocale
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'A calendar picks a date, several dates, a range or several ranges; the header switches to month, year and years range views. Today, weekends, special days with a legend, week numbers and disabled dates show in the day view. ' +
                    'Dates go through the `DatetimeAdapter` (by default `FdDate` and `Intl` in the locale). The arrow keys move between the cells and change the month or page at the edges; Enter and Space select.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Calendar<FdDate>>;

export const Single: Story = { name: 'Single date', render: () => ({ template: `<story-calendar-single />` }) };
export const Ranges: Story = {
    name: 'Ranges and several dates',
    render: () => ({ template: `<story-calendar-range />` })
};
export const SpecialDays: Story = {
    name: 'Special days, months and years',
    render: () => ({ template: `<story-calendar-special />` })
};
export const Forms: Story = { name: 'Forms and navigation', render: () => ({ template: `<story-calendar-form />` }) };
export const Locale: Story = { render: () => ({ template: `<story-calendar-locale />` }) };
