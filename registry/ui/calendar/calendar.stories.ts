import { JsonPipe } from '@angular/common';
import { Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { DatetimeAdapter, FdDate, provideDateTimeFormats } from '@/lib/datetime';
import { ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import {
    Dialog,
    DialogBody,
    DialogCloseButton,
    DialogFooter,
    DialogHeader,
    DialogService,
    DialogTemplate,
    DialogTitle
} from '@/ui/dialog/dialog';
import { SegmentedButton } from '@/ui/segmented-button/segmented-button';
import { Title } from '@/ui/title/title';
import {
    Calendar,
    CalendarCloseButton,
    CalendarLegend,
    DateRange,
    type CalendarYearGrid,
    type SpecialDayRule
} from './calendar';

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
                <h3 fdTitle headerSize="5" class="${heading}">Legend in a column</h3>
                <fd-calendar [selectedDate]="date" [specialDaysRules]="rules" showCalendarLegend legendCol />
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
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Own year and years range grids</h3>
                <fd-calendar [yearGrid]="yearGrid" [aggregatedYearGrid]="aggregatedYearGrid" />
            </div>
        </div>
    `
})
class StoryCalendarForm {
    protected readonly show = show;
    protected model: FdDate | null = new FdDate(2024, 6, 1);
    protected readonly date = new FdDate(2024, 6, 1);
    /** Five rows of three years; the years range view lists eight periods of 15 years. */
    protected readonly yearGrid: CalendarYearGrid = { rows: 5, cols: 3, yearMapping: (year) => `${year} AD` };
    protected readonly aggregatedYearGrid: CalendarYearGrid = { rows: 8, cols: 1 };
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

@Component({
    selector: 'story-calendar-mobile',
    imports: [
        Calendar,
        CalendarCloseButton,
        Button,
        ButtonBar,
        Dialog,
        DialogHeader,
        DialogBody,
        DialogFooter,
        DialogCloseButton,
        DialogTemplate,
        DialogTitle,
        Title
    ],
    template: `
        <ng-template fdDialogTemplate let-dialog #tpl>
            <fd-dialog [dialogRef]="dialog">
                <fd-dialog-header>
                    <h1 fd-title fd-dialog-title>Pick a date</h1>
                    <button
                        fd-dialog-close-button
                        fd-calendar-close-button
                        mobile
                        ariaLabel="Close calendar"
                        (click)="dialog.dismiss()"
                    ></button>
                </fd-dialog-header>
                <fd-dialog-body>
                    <fd-calendar
                        #calendar
                        [mobileLandscape]="layout() === 'landscape'"
                        [mobilePortrait]="layout() === 'portrait'"
                        [selectedDate]="date()"
                        [escapeFocusFunction]="null"
                        (closeClicked)="dialog.dismiss()"
                    />
                </fd-dialog-body>
                <fd-dialog-footer>
                    <fd-button-bar
                        variant="emphasized"
                        label="OK"
                        (click)="date.set(calendar.selectedDate()); dialog.close()"
                    />
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>
        <div class="flex flex-wrap gap-2">
            <button fdButton label="Open in landscape mode" (click)="open('landscape')"></button>
            <button fdButton label="Open in portrait mode" (click)="open('portrait')"></button>
        </div>
        <p class="${value} mt-2">Selected: {{ show(date()) }}</p>
    `
})
class StoryCalendarMobile {
    protected readonly show = show;
    protected readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9));
    protected readonly layout = signal<'landscape' | 'portrait'>('landscape');
    private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    private readonly dialogs = inject(DialogService);

    protected open(layout: 'landscape' | 'portrait'): void {
        this.layout.set(layout);
        this.dialogs.open(
            this.tpl(),
            layout === 'landscape'
                ? { mobile: true, responsivePadding: true, verticalPadding: false, width: '40rem', height: '25rem' }
                : { mobile: true, responsivePadding: true, verticalPadding: false, width: '22.5rem', height: '40rem' }
        );
    }
}

/** Clicks the button that opens the calendar dialog and waits for its grid. */
async function openMobile(canvasElement: HTMLElement, label: string): Promise<void> {
    const button = [...canvasElement.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
        b.textContent!.includes(label)
    )!;
    await userEvent.click(button);
    await waitFor(() => expect(document.querySelector('[role="dialog"] fd-calendar [role="grid"]')).not.toBeNull());
}

@Component({
    selector: 'story-calendar-reactive',
    imports: [Calendar, Title, Button, ReactiveFormsModule],
    template: `
        <form [formGroup]="form" class="${row}">
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Single date</h3>
                <fd-calendar formControlName="date" [startingDayOfWeek]="2" />
                <p class="${value}">
                    Touched: {{ form.controls.date.touched }}, dirty: {{ form.controls.date.dirty }}, valid:
                    {{ form.controls.date.valid }}<br />Selected: {{ show(form.controls.date.value) }}
                </p>
                <button fdButton type="button" label="Set invalid date" (click)="setInvalid('date')"></button>
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Several dates</h3>
                <fd-calendar formControlName="dates" allowMultipleSelection showWeekNumbers [startingDayOfWeek]="2" />
                <p class="${value}">
                    Touched: {{ form.controls.dates.touched }}, dirty: {{ form.controls.dates.dirty }}, valid:
                    {{ form.controls.dates.valid }}<br />{{ form.controls.dates.value?.length ?? 0 }} dates
                </p>
                <button fdButton type="button" label="Set invalid dates" (click)="setInvalid('dates')"></button>
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Range</h3>
                <fd-calendar formControlName="range" calType="range" [startingDayOfWeek]="2" />
                <p class="${value}">
                    Touched: {{ form.controls.range.touched }}, dirty: {{ form.controls.range.dirty }}, valid:
                    {{ form.controls.range.valid }}<br />{{ show(form.controls.range.value?.start) }} –
                    {{ show(form.controls.range.value?.end) }}
                </p>
                <button fdButton type="button" label="Set invalid range" (click)="setInvalid('range')"></button>
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Several ranges</h3>
                <fd-calendar formControlName="ranges" calType="range" allowMultipleSelection [startingDayOfWeek]="2" />
                <p class="${value}">
                    Touched: {{ form.controls.ranges.touched }}, dirty: {{ form.controls.ranges.dirty }}, valid:
                    {{ form.controls.ranges.valid }}<br />{{ form.controls.ranges.value?.length ?? 0 }} ranges
                </p>
                <button fdButton type="button" label="Set invalid ranges" (click)="setInvalid('ranges')"></button>
            </div>
        </form>
    `
})
class StoryCalendarReactive {
    protected readonly show = show;
    protected readonly form = new FormGroup({
        date: new FormControl<FdDate | null>(new FdDate(2024, 9, 20)),
        dates: new FormControl<FdDate[]>([new FdDate(2024, 9, 2), new FdDate(2024, 9, 3), new FdDate(2024, 9, 4)]),
        range: new FormControl<DateRange<FdDate> | null>(
            new DateRange(new FdDate(2024, 10, 11), new FdDate(2024, 10, 19))
        ),
        ranges: new FormControl<DateRange<FdDate>[]>([
            new DateRange(new FdDate(2024, 10, 1), new FdDate(2024, 10, 10)),
            new DateRange(new FdDate(2024, 10, 14), new FdDate(2024, 10, 18))
        ])
    });

    /** Writes a date that is not valid, like a broken value from a server. */
    protected setInvalid(control: 'date' | 'dates' | 'range' | 'ranges'): void {
        const invalid = new FdDate(NaN);
        const controls = this.form.controls;
        if (control === 'date') controls.date.setValue(invalid);
        else if (control === 'dates') controls.dates.setValue([invalid]);
        else if (control === 'range') controls.range.setValue(new DateRange(invalid, invalid));
        else controls.ranges.setValue([new DateRange(invalid, invalid)]);
    }
}

@Component({
    selector: 'story-calendar-programmatic',
    imports: [Calendar, Button, Title, FormsModule],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">The value changes from outside</h3>
        <fd-calendar [(ngModel)]="date" />
        <p class="${value}">Selected: {{ show(date) }}</p>
        <button fdButton label="Next day" (click)="nextDay()"></button>
    `
})
class StoryCalendarProgrammatic {
    private readonly adapter = inject<DatetimeAdapter<FdDate>>(DatetimeAdapter);
    protected readonly show = show;
    protected date: FdDate | null = new FdDate(2024, 3, 31);

    protected nextDay(): void {
        this.date = this.adapter.addCalendarDays(this.date ?? this.adapter.today(), 1);
    }
}

@Component({
    selector: 'story-calendar-locale-switch',
    imports: [Calendar, Button, SegmentedButton, Title, FormsModule],
    providers: [provideDateTimeFormats()],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Locale, switched live (BCP 47 tags)</h3>
        <fd-segmented-button ariaLabel="Locale" [ngModel]="locale()" (ngModelChange)="setLocale($event)">
            @for (option of locales; track option.code) {
                <button fdButton [label]="option.name" [value]="option.code"></button>
            }
        </fd-segmented-button>
        <p class="${value}">Current locale: {{ locale() }}</p>
        <fd-calendar [selectedDate]="date" showWeekNumbers />
    `
})
class StoryCalendarLocaleSwitch {
    private readonly adapter = inject(DatetimeAdapter);
    protected readonly locales = [
        { code: 'en-US', name: 'English (US)' },
        { code: 'de-DE', name: 'Deutsch' },
        { code: 'fr-FR', name: 'Français' },
        { code: 'ja-JP', name: '日本語' },
        { code: 'ar-EG', name: 'العربية' }
    ];
    protected readonly locale = signal('en-US');
    protected readonly date = new FdDate(2024, 3, 9);

    constructor() {
        this.adapter.setLocale(this.locale());
    }

    protected setLocale(locale: string): void {
        this.locale.set(locale);
        this.adapter.setLocale(locale);
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
                StoryCalendarLocale,
                StoryCalendarMobile,
                StoryCalendarReactive,
                StoryCalendarProgrammatic,
                StoryCalendarLocaleSwitch
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
export const LocaleSwitcher: Story = {
    name: 'Locale switcher',
    render: () => ({ template: `<story-calendar-locale-switch />` })
};
export const ReactiveForms: Story = {
    name: 'Reactive forms',
    render: () => ({ template: `<story-calendar-reactive />` })
};
export const Programmatic: Story = {
    name: 'Programmatic date change',
    render: () => ({ template: `<story-calendar-programmatic />` })
};
export const Mobile: Story = { render: () => ({ template: `<story-calendar-mobile />` }) };
export const OpenMobileLandscape: Story = {
    name: 'Open: mobile landscape',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-calendar-mobile />` }),
    play: ({ canvasElement }) => openMobile(canvasElement, 'landscape')
};
export const OpenMobilePortrait: Story = {
    name: 'Open: mobile portrait',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-calendar-mobile />` }),
    play: ({ canvasElement }) => openMobile(canvasElement, 'portrait')
};
