import { Component, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { DatetimeAdapter, FdDate, provideDateTimeFormats } from '@/lib/datetime';
import { Button } from '@/ui/button/button';
import { Select, SelectOption } from '@/ui/select/select';
import { FormItem, FormLabel } from '@/ui/form/form';
import { Title } from '@/ui/title/title';
import { TimePicker } from './time-picker';

const heading = 'mt-6 mb-2 first:mt-0';
const value = 'font-sap-font-family text-sap-font-size text-sap-text-color';

@Component({
    selector: 'story-time-picker-basic',
    imports: [TimePicker, Title, FormItem, FormLabel],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Default (the format of the locale)</h3>
        <div fd-form-item>
            <label fd-form-label for="tp-basic">Meeting time</label>
            <fd-time-picker inputId="tp-basic" [(time)]="time" />
        </div>
        <p class="${value}">Time: {{ time()?.toTimeString() ?? 'none' }}</p>

        <h3 fdTitle headerSize="5" class="${heading}">24-hour clock with seconds</h3>
        <fd-time-picker
            [(time)]="time"
            [meridian]="false"
            [displayFormat]="{ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }"
            keepTwoDigitsTime
        />

        <h3 fdTitle headerSize="5" class="${heading}">Day period format ("in the afternoon")</h3>
        <fd-time-picker [(time)]="time" [displayFormat]="dayPeriodFormat" />

        <h3 fdTitle headerSize="5" class="${heading}">Minutes in steps of 15, no spinners</h3>
        <fd-time-picker [(time)]="time" [minuteStep]="15" [spinnerButtons]="false" />

        <h3 fdTitle headerSize="5" class="${heading}">Minutes in steps of 5, 10 and 30</h3>
        <div class="flex flex-col gap-3">
            <fd-time-picker [(time)]="time" [minuteStep]="5" timePickerInputLabel="Time in 5-minute steps" />
            <fd-time-picker [(time)]="time" [minuteStep]="10" timePickerInputLabel="Time in 10-minute steps" />
            <fd-time-picker [(time)]="time" [minuteStep]="30" timePickerInputLabel="Time in 30-minute steps" />
        </div>

        <h3 fdTitle headerSize="5" class="${heading}">Compact</h3>
        <fd-time-picker [(time)]="time" data-density="compact" />

        <h3 fdTitle headerSize="5" class="${heading}">States and messages</h3>
        <div class="flex flex-col gap-3">
            <fd-time-picker [time]="time()" state="success" message="Time is available" messageType="success" />
            <fd-time-picker [time]="time()" state="warning" message="Outside office hours" messageType="warning" />
            <fd-time-picker [time]="time()" state="information" message="Times are local" messageType="information" />
            <fd-time-picker [time]="time()" disabled />
        </div>
    `
})
class StoryTimePickerBasic {
    protected readonly dayPeriodFormat = {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
        dayPeriod: true
    } as const;
    protected readonly time = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9, 14, 30, 0));
}

@Component({
    selector: 'story-time-picker-form',
    imports: [TimePicker, Title, ReactiveFormsModule, FormsModule, FormItem, FormLabel],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Reactive form, required; type a wrong time to see the error</h3>
        <div fd-form-item>
            <label fd-form-label required for="tp-form">Start</label>
            <fd-time-picker
                inputId="tp-form"
                [formControl]="control"
                [allowNull]="false"
                required
                message="Enter a time such as 9:30 AM"
                messageType="error"
                [state]="control.invalid && control.touched ? 'error' : null"
            />
        </div>
        <p class="${value}">Valid: {{ control.valid }}, value: {{ control.value?.toTimeString() ?? 'none' }}</p>
    `
})
class StoryTimePickerForm {
    protected readonly control = new FormControl<FdDate | null>(null, Validators.required);
}

@Component({
    selector: 'story-time-picker-locale',
    imports: [TimePicker, Title, Button, Select, SelectOption, ReactiveFormsModule, FormItem, FormLabel],
    providers: [provideDateTimeFormats()],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Locale (an adapter of its own)</h3>
        <div fd-form-item>
            <label fd-form-label id="tp-locale-label">Locale</label>
            <fd-select ariaLabelledBy="tp-locale-label" [value]="locale()" (valueChange)="setLocale($event)">
                @for (option of locales; track option) {
                    <li fd-option [value]="option">{{ option }}</li>
                }
            </fd-select>
        </div>
        <div fd-form-item>
            <label fd-form-label for="tp-locale">Time</label>
            <fd-time-picker inputId="tp-locale" [(time)]="time" [spinnerButtons]="false" />
        </div>

        <h3 fdTitle headerSize="5" class="${heading}">No empty value (allowNull false)</h3>
        <fd-time-picker [formControl]="control" [allowNull]="false" />
        <p class="${value}">Value: {{ control.value?.toTimeString() ?? 'none' }}, valid: {{ control.valid }}</p>
        <div class="flex gap-2">
            <button fdButton label="Set to null" (click)="control.setValue(null)"></button>
            <button fdButton label="Set a valid time" (click)="control.setValue(validTime)"></button>
        </div>
    `
})
class StoryTimePickerLocale {
    private readonly adapter = inject(DatetimeAdapter);
    protected readonly locales = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'ja-JP', 'ar-EG'];
    protected readonly locale = signal('en-US');
    protected readonly time = signal<FdDate | null | undefined>(new FdDate(2024, 3, 9, 14, 30, 0));
    protected readonly validTime = new FdDate(2024, 3, 9, 9, 15, 0);
    protected readonly control = new FormControl<FdDate | null>(new FdDate(2024, 3, 9, 9, 15, 0));

    constructor() {
        this.adapter.setLocale(this.locale());
    }

    protected setLocale(locale: unknown): void {
        this.locale.set(locale as string);
        this.adapter.setLocale(locale as string);
    }
}

const meta: Meta<TimePicker<FdDate>> = {
    title: 'Components/Time Picker',
    component: TimePicker,
    decorators: [moduleMetadata({ imports: [StoryTimePickerBasic, StoryTimePickerForm, StoryTimePickerLocale] })],
    parameters: {
        docs: {
            description: {
                component:
                    'A time picker is a time field with a button that opens the time columns. Typed times are read on Enter and when the field loses the focus; an unreadable time sets the error state. ' +
                    'The columns follow the display format (12-hour clock, seconds) unless set. Alt+Down opens the columns, Escape closes them and returns to the field.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<TimePicker<FdDate>>;

export const Basic: Story = { render: () => ({ template: `<story-time-picker-basic />` }) };
export const Forms: Story = { render: () => ({ template: `<story-time-picker-form />` }) };
export const LocaleAndNull: Story = { render: () => ({ template: `<story-time-picker-locale />` }) };

/** Opens the picker with its button and waits for the time columns. */
async function openPicker(canvasElement: HTMLElement): Promise<void> {
    await userEvent.click(canvasElement.querySelector<HTMLElement>('fd-time-picker button[aria-haspopup]')!);
    await waitFor(() => expect(document.querySelector('.cdk-overlay-pane fd-time [role="spinbutton"]')).not.toBeNull());
}

export const OpenTimeColumns: Story = {
    name: 'Open: Time columns',
    tags: ['!autodocs'],
    render: () => ({
        props: { time: new FdDate(2024, 3, 9, 14, 30, 0) },
        template: `<fd-time-picker [(time)]="time" message="Times are local" messageType="information" />`
    }),
    play: ({ canvasElement }) => openPicker(canvasElement)
};
export const OpenTimeColumnsSeconds: Story = {
    name: 'Open: 24-hour clock with seconds',
    tags: ['!autodocs'],
    render: () => ({
        props: { time: new FdDate(2024, 3, 9, 14, 30, 15) },
        template: `<fd-time-picker
            [(time)]="time"
            [displayFormat]="{ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }"
            keepTwoDigitsTime
        />`
    }),
    play: ({ canvasElement }) => openPicker(canvasElement)
};
