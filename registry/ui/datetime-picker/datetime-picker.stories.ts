import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { DatetimeAdapter, FdDate, provideDateTimeFormats } from '@/lib/datetime';
import { Button } from '@/ui/button/button';
import { type SpecialDayRule } from '@/ui/calendar/calendar';
import { FormItem, FormLabel } from '@/ui/form/form';
import { Select, SelectOption } from '@/ui/select/select';
import { Title } from '@/ui/title/title';
import { DatetimePicker } from './datetime-picker';

const heading = 'mt-6 mb-2 first:mt-0';
const value = 'mt-1 font-sap-font-family text-sap-font-size text-sap-text-color';

@Component({
    selector: 'story-datetime-picker-basic',
    imports: [DatetimePicker, Title, Button, FormItem, FormLabel],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Date and time, applied with OK</h3>
        <div fd-form-item>
            <label fd-form-label for="dtp-basic">Meeting</label>
            <fd-datetime-picker inputId="dtp-basic" [(date)]="date" />
        </div>
        <p class="${value}">Value: {{ date()?.toString() ?? 'none' }}</p>
        <button fdButton class="mt-2" label="Next day" (click)="nextDay()"></button>

        <h3 fdTitle headerSize="5" class="${heading}">Without footer: a pick applies at once</h3>
        <fd-datetime-picker [(date)]="date" [showFooter]="false" />

        <h3 fdTitle headerSize="5" class="${heading}">24-hour clock with seconds, two digits, long date</h3>
        <fd-datetime-picker
            [(date)]="date"
            [customDateTimeFormat]="{
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }"
            keepTwoDigitsTime
            [spinnerButtons]="false"
            class="w-80"
        />

        <h3 fdTitle headerSize="5" class="${heading}">Read on Enter and blur only, weekends disabled</h3>
        <fd-datetime-picker [(date)]="date" processInputOnBlur [disableFunction]="weekend" />

        <h3 fdTitle headerSize="5" class="${heading}">States and messages</h3>
        <div class="flex flex-col gap-3">
            <fd-datetime-picker [date]="date()" state="success" message="Room is free" messageType="success" />
            <fd-datetime-picker [date]="date()" state="warning" message="Late in the day" messageType="warning" />
            <fd-datetime-picker
                [date]="date()"
                state="information"
                message="Times are local"
                messageType="information"
            />
            <fd-datetime-picker [date]="date()" disabled />
        </div>
    `
})
class StoryDatetimePickerBasic {
    private readonly adapter = inject<DatetimeAdapter<FdDate>>(DatetimeAdapter);
    protected readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9, 14, 30, 0));
    protected readonly weekend = (date: FdDate) => [1, 7].includes(date.getDayOfWeek());

    protected nextDay(): void {
        this.date.set(this.adapter.addCalendarDays(this.date() ?? FdDate.getNow(), 1));
    }
}

@Component({
    selector: 'story-datetime-picker-special',
    imports: [DatetimePicker, Title],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Special days and a legend</h3>
        <fd-datetime-picker [(date)]="date" [specialDaysRules]="rules" showCalendarLegend />
    `
})
class StoryDatetimePickerSpecial {
    protected readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9, 9, 0, 0));
    protected readonly rules: SpecialDayRule<FdDate>[] = [
        { specialDayNumber: 5, legendText: 'Team meeting', rule: (d) => d.getDayOfWeek() === 3 },
        { specialDayNumber: 6, legendText: 'Release', appointment: true, rule: (d) => d.day === 15 }
    ];
}

@Component({
    selector: 'story-datetime-picker-form',
    imports: [DatetimePicker, Title, Button, ReactiveFormsModule, FormItem, FormLabel],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Reactive form, required; leave a wrong value to see the error</h3>
        <div fd-form-item>
            <label fd-form-label required for="dtp-form">Start</label>
            <fd-datetime-picker
                inputId="dtp-form"
                [formControl]="control"
                [allowNull]="false"
                required
                message="Enter a date and time such as 3/9/2024, 2:30 PM"
                messageType="information"
            />
        </div>
        <p class="${value}">Valid: {{ control.valid }}, value: {{ control.value?.toString() ?? 'none' }}</p>
        <div class="mt-2 flex gap-2">
            <button fdButton label="Set to null" (click)="control.setValue(null)"></button>
            <button fdButton label="Disable" (click)="toggle()"></button>
        </div>
    `
})
class StoryDatetimePickerForm {
    protected readonly control = new FormControl<FdDate | null>(new FdDate(2024, 3, 9, 8, 0, 0), Validators.required);

    protected toggle(): void {
        if (this.control.disabled) this.control.enable();
        else this.control.disable();
    }
}

@Component({
    selector: 'story-datetime-picker-locale',
    imports: [DatetimePicker, Title, Select, SelectOption, FormItem, FormLabel],
    providers: [provideDateTimeFormats()],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Locale (an adapter of its own)</h3>
        <div fd-form-item>
            <label fd-form-label id="dtp-locale-label">Locale</label>
            <fd-select ariaLabelledBy="dtp-locale-label" [value]="locale()" (valueChange)="setLocale($event)">
                @for (option of locales; track option) {
                    <li fd-option [value]="option">{{ option }}</li>
                }
            </fd-select>
        </div>
        <div fd-form-item>
            <label fd-form-label for="dtp-locale">Date and time</label>
            <fd-datetime-picker inputId="dtp-locale" [(date)]="date" />
        </div>
    `
})
class StoryDatetimePickerLocale {
    private readonly adapter = inject(DatetimeAdapter);
    protected readonly locales = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'ja-JP', 'ar-EG'];
    protected readonly locale = signal('en-US');
    protected readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9, 14, 30, 0));

    constructor() {
        this.adapter.setLocale(this.locale());
    }

    protected setLocale(locale: unknown): void {
        this.locale.set(locale as string);
        this.adapter.setLocale(locale as string);
    }
}

@Component({
    selector: 'story-datetime-picker-mobile',
    imports: [DatetimePicker, Title],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Mobile portrait: date or time</h3>
        <fd-datetime-picker
            mobile
            [(date)]="date"
            [mobileConfig]="{ title: 'Meeting', approveButtonText: 'Save', cancelButtonText: 'Cancel' }"
        />

        <h3 fdTitle headerSize="5" class="${heading}">Mobile landscape: side by side</h3>
        <fd-datetime-picker mobile mobileLandscape [(date)]="date" [mobileConfig]="{ title: 'Meeting' }" />
        <p class="${value}">Value: {{ date()?.toString() ?? 'none' }}</p>
    `
})
class StoryDatetimePickerMobile {
    protected readonly date = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9, 14, 30, 0));
}

const meta: Meta<DatetimePicker<FdDate>> = {
    title: 'Components/Datetime Picker',
    component: DatetimePicker,
    decorators: [
        moduleMetadata({
            imports: [
                StoryDatetimePickerBasic,
                StoryDatetimePickerSpecial,
                StoryDatetimePickerForm,
                StoryDatetimePickerLocale,
                StoryDatetimePickerMobile
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'A datetime picker opens a calendar and time columns side by side; the picked values apply with OK and are dropped with Cancel, or apply at once without the footer. On narrow screens a switch shows either the calendar or the time. ' +
                    'Typed values are read while typing (or on Enter and blur with `processInputOnBlur`); an unreadable or disabled date sets the error state once the field was left. F4 and Alt+Down open the picker, Escape closes it.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<DatetimePicker<FdDate>>;

export const Basic: Story = { render: () => ({ template: `<story-datetime-picker-basic />` }) };
export const SpecialDays: Story = { render: () => ({ template: `<story-datetime-picker-special />` }) };
export const Forms: Story = { render: () => ({ template: `<story-datetime-picker-form />` }) };
export const Locale: Story = { render: () => ({ template: `<story-datetime-picker-locale />` }) };
export const Mobile: Story = { render: () => ({ template: `<story-datetime-picker-mobile />` }) };
