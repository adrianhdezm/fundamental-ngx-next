import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { DatetimeAdapter, FdDate, provideDateTimeFormats } from '@/lib/datetime';
import { DateRange, type SpecialDayRule } from '@/ui/calendar/calendar';
import { FormItem, FormLabel } from '@/ui/form/form';
import { Select, SelectOption } from '@/ui/select/select';
import { Title } from '@/ui/title/title';
import { DatePicker } from './date-picker';

const heading = 'mt-6 mb-2 first:mt-0';
const value = 'mt-1 font-sap-font-family text-sap-font-size text-sap-text-color';

@Component({
    selector: 'story-date-picker-single',
    imports: [DatePicker, Title, FormItem, FormLabel],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Single date</h3>
        <div fd-form-item>
            <label fd-form-label for="dp-single">Delivery date</label>
            <fd-date-picker inputId="dp-single" placeholder="mm/dd/yyyy" [(selectedDate)]="date" />
        </div>
        <p class="${value}">Date: {{ date()?.toDateString() ?? 'none' }}</p>

        <h3 fdTitle headerSize="5" class="${heading}">Long format, today button, week starts on Monday</h3>
        <fd-date-picker
            [(selectedDate)]="date"
            [customDateTimeFormat]="{ year: 'numeric', month: 'long', day: 'numeric' }"
            [startingDayOfWeek]="2"
            [showWeekNumbers]="false"
            showTodayButton
        />

        <h3 fdTitle headerSize="5" class="${heading}">Read on Enter and blur only, opening above</h3>
        <fd-date-picker [(selectedDate)]="date" processInputOnBlur placement="top-start" />

        <h3 fdTitle headerSize="5" class="${heading}">Months and years</h3>
        <div class="flex flex-wrap gap-4">
            <fd-date-picker [(selectedDate)]="date" dateRangeFormat="month" />
            <fd-date-picker [(selectedDate)]="date" dateRangeFormat="year" />
        </div>

        <h3 fdTitle headerSize="5" class="${heading}">States and messages</h3>
        <div class="flex flex-col gap-3">
            <fd-date-picker [selectedDate]="date()" state="success" message="Date is available" messageType="success" />
            <fd-date-picker [selectedDate]="date()" state="warning" message="Weekend delivery" messageType="warning" />
            <fd-date-picker
                [selectedDate]="date()"
                state="information"
                message="Dates are local"
                messageType="information"
            />
            <fd-date-picker [selectedDate]="date()" disabled />
        </div>
    `
})
class StoryDatePickerSingle {
    protected readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9));
}

@Component({
    selector: 'story-date-picker-range',
    imports: [DatePicker, Title],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Range with hover effect</h3>
        <fd-date-picker type="range" [(selectedRangeDate)]="range" rangeHoverEffect showTodayButton />
        <p class="${value}">Range: {{ range()?.start?.toDateString() }} to {{ range()?.end?.toDateString() }}</p>

        <h3 fdTitle headerSize="5" class="${heading}">Multiple dates (Shift+click fills a span)</h3>
        <fd-date-picker [(selectedMultipleDates)]="dates" allowMultipleSelection class="w-96" />
        <p class="${value}">{{ dates().length }} dates</p>

        <h3 fdTitle headerSize="5" class="${heading}">Multiple ranges</h3>
        <fd-date-picker type="range" [(selectedMultipleDateRanges)]="ranges" allowMultipleSelection class="w-96" />
        <p class="${value}">{{ ranges().length }} ranges</p>
    `
})
class StoryDatePickerRange {
    protected readonly range = signal<DateRange<FdDate> | null>(
        new DateRange(new FdDate(2024, 3, 4), new FdDate(2024, 3, 8))
    );
    protected readonly dates = signal([new FdDate(2024, 3, 4), new FdDate(2024, 3, 6)]);
    protected readonly ranges = signal([
        new DateRange(new FdDate(2024, 3, 4), new FdDate(2024, 3, 6)),
        new DateRange(new FdDate(2024, 3, 18), new FdDate(2024, 3, 20))
    ]);
}

@Component({
    selector: 'story-date-picker-disable',
    imports: [DatePicker, Title],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Weekends disabled; typing one sets the error state</h3>
        <fd-date-picker [(selectedDate)]="date" [disableFunction]="weekend" />

        <h3 fdTitle headerSize="5" class="${heading}">Range starting on a weekday and ending in 2024</h3>
        <fd-date-picker
            type="range"
            [(selectedRangeDate)]="range"
            [disableRangeStartFunction]="weekend"
            [disableRangeEndFunction]="after2024"
        />

        <h3 fdTitle headerSize="5" class="${heading}">Multiple dates, weekends disabled</h3>
        <fd-date-picker [(selectedMultipleDates)]="dates" allowMultipleSelection [disableFunction]="weekend" />

        <h3 fdTitle headerSize="5" class="${heading}">Navigation limited to 2024</h3>
        <fd-date-picker
            [(selectedDate)]="date"
            [previousButtonDisableFunction]="atStart"
            [nextButtonDisableFunction]="atEnd"
        />
    `
})
class StoryDatePickerDisable {
    protected readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 12));
    protected readonly range = signal<DateRange<FdDate> | null>(null);
    protected readonly dates = signal<FdDate[]>([]);
    protected readonly weekend = (date: FdDate) => [1, 7].includes(date.getDayOfWeek());
    protected readonly after2024 = (date: FdDate) => date.year > 2024;
    protected readonly atStart = (_: unknown, current: { year: number; month: number }, view: string) =>
        view === 'day' ? current.year <= 2024 && current.month <= 1 : current.year <= 2024;
    protected readonly atEnd = (_: unknown, current: { year: number; month: number }, view: string) =>
        view === 'day' ? current.year >= 2024 && current.month >= 12 : current.year >= 2024;
}

@Component({
    selector: 'story-date-picker-special',
    imports: [DatePicker, Title],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Special days and a legend</h3>
        <fd-date-picker [(selectedDate)]="date" [specialDaysRules]="rules" showCalendarLegend />

        <h3 fdTitle headerSize="5" class="${heading}">Legend in a column</h3>
        <fd-date-picker [(selectedDate)]="date" [specialDaysRules]="rules" showCalendarLegend legendCol />
    `
})
class StoryDatePickerSpecial {
    protected readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9));
    protected readonly rules: SpecialDayRule<FdDate>[] = [
        { specialDayNumber: 5, legendText: 'Team meeting', rule: (d) => d.getDayOfWeek() === 3 },
        { specialDayNumber: 6, legendText: 'Release', appointment: true, rule: (d) => d.day === 15 },
        { specialDayNumber: 10, legendText: 'Holiday', rule: (d) => d.month === 3 && d.day === 29 }
    ];
}

@Component({
    selector: 'story-date-picker-form',
    imports: [DatePicker, Title, ReactiveFormsModule, FormItem, FormLabel],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Reactive form, required; type a wrong date to see the error</h3>
        <div fd-form-item>
            <label fd-form-label required for="dp-form">Start</label>
            <fd-date-picker
                inputId="dp-form"
                [formControl]="single"
                [allowNull]="false"
                required
                message="Enter a date such as 3/9/2024"
                messageType="error"
                [state]="single.invalid && single.touched ? 'error' : null"
            />
        </div>
        <p class="${value}">Valid: {{ single.valid }}, value: {{ single.value?.toDateString() ?? 'none' }}</p>

        <h3 fdTitle headerSize="5" class="${heading}">Range</h3>
        <fd-date-picker type="range" [formControl]="range" />
        <p class="${value}">
            Valid: {{ range.valid }}, value: {{ range.value?.start?.toDateString() }} to
            {{ range.value?.end?.toDateString() }}
        </p>

        <h3 fdTitle headerSize="5" class="${heading}">Multiple dates and multiple ranges</h3>
        <div class="flex flex-col gap-3">
            <fd-date-picker [formControl]="multi" allowMultipleSelection class="w-96" />
            <fd-date-picker type="range" [formControl]="multiRange" allowMultipleSelection class="w-96" />
        </div>
        <p class="${value}">{{ multi.value?.length }} dates, {{ multiRange.value?.length }} ranges</p>
    `
})
class StoryDatePickerForm {
    protected readonly single = new FormControl<FdDate | null>(null, Validators.required);
    protected readonly range = new FormControl<DateRange<FdDate> | null>(
        new DateRange(new FdDate(2024, 3, 4), new FdDate(2024, 3, 8))
    );
    protected readonly multi = new FormControl<FdDate[]>([new FdDate(2024, 3, 4)]);
    protected readonly multiRange = new FormControl<DateRange<FdDate>[]>([
        new DateRange(new FdDate(2024, 3, 4), new FdDate(2024, 3, 6))
    ]);
}

@Component({
    selector: 'story-date-picker-locale',
    imports: [DatePicker, Title, Select, SelectOption, FormItem, FormLabel],
    providers: [provideDateTimeFormats()],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Locale (an adapter of its own)</h3>
        <div fd-form-item>
            <label fd-form-label id="dp-locale-label">Locale</label>
            <fd-select ariaLabelledBy="dp-locale-label" [value]="locale()" (valueChange)="setLocale($event)">
                @for (option of locales; track option) {
                    <li fd-option [value]="option">{{ option }}</li>
                }
            </fd-select>
        </div>
        <div fd-form-item>
            <label fd-form-label for="dp-locale">Date</label>
            <fd-date-picker inputId="dp-locale" [(selectedDate)]="date" />
        </div>
        <div fd-form-item class="mt-3">
            <label fd-form-label for="dp-locale-range">Range</label>
            <fd-date-picker inputId="dp-locale-range" type="range" [(selectedRangeDate)]="range" />
        </div>
    `
})
class StoryDatePickerLocale {
    private readonly adapter = inject(DatetimeAdapter);
    protected readonly locales = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'ja-JP', 'ar-EG'];
    protected readonly locale = signal('en-US');
    protected readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9));
    protected readonly range = signal<DateRange<FdDate> | null>(
        new DateRange(new FdDate(2024, 3, 4), new FdDate(2024, 3, 8))
    );

    constructor() {
        this.adapter.setLocale(this.locale());
    }

    protected setLocale(locale: unknown): void {
        this.locale.set(locale as string);
        this.adapter.setLocale(locale as string);
    }
}

@Component({
    selector: 'story-date-picker-mobile',
    imports: [DatePicker, Title],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Mobile: the calendar opens in a dialog</h3>
        <fd-date-picker
            mobile
            [(selectedDate)]="date"
            [mobileConfig]="{ title: 'Delivery date', approveButtonText: 'Save', cancelButtonText: 'Cancel' }"
        />
        <p class="${value}">Date: {{ date()?.toDateString() ?? 'none' }}</p>

        <h3 fdTitle headerSize="5" class="${heading}">Mobile range</h3>
        <fd-date-picker
            mobile
            type="range"
            [(selectedRangeDate)]="range"
            [mobileConfig]="{ title: 'Trip', approveButtonText: 'Save', cancelButtonText: 'Cancel' }"
        />
    `
})
class StoryDatePickerMobile {
    protected readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9));
    protected readonly range = signal<DateRange<FdDate> | null>(null);
}

const meta: Meta<DatePicker<FdDate>> = {
    title: 'Components/Date Picker',
    component: DatePicker,
    decorators: [
        moduleMetadata({
            imports: [
                StoryDatePickerSingle,
                StoryDatePickerRange,
                StoryDatePickerDisable,
                StoryDatePickerSpecial,
                StoryDatePickerForm,
                StoryDatePickerLocale,
                StoryDatePickerMobile
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'A date picker is a date field with a button that opens a calendar. It picks a date, a range, or several dates or ranges. Typed dates are read while typing (or on Enter and blur with `processInputOnBlur`); an unreadable or disabled date sets the error state. ' +
                    'F4 and Alt+Down open the calendar, Escape closes it and returns to the field. In mobile mode the calendar opens in a dialog that can be approved or cancelled.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<DatePicker<FdDate>>;

export const Single: Story = { render: () => ({ template: `<story-date-picker-single />` }) };
export const RangeAndMultiple: Story = { render: () => ({ template: `<story-date-picker-range />` }) };
export const DisableFunctions: Story = { render: () => ({ template: `<story-date-picker-disable />` }) };
export const SpecialDays: Story = { render: () => ({ template: `<story-date-picker-special />` }) };
export const Forms: Story = { render: () => ({ template: `<story-date-picker-form />` }) };
export const Locale: Story = { render: () => ({ template: `<story-date-picker-locale />` }) };
export const Mobile: Story = { render: () => ({ template: `<story-date-picker-mobile />` }) };
