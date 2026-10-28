import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { DatetimeAdapter, FdDate } from '@/lib/datetime';
import { Button } from '@/ui/button/button';
import { Title } from '@/ui/title/title';
import { Time } from './time';

const heading = 'mt-6 mb-2 first:mt-0';
const value = 'font-sap-font-family text-sap-font-size text-sap-text-color';
const row = 'flex flex-wrap items-start gap-8';

@Component({
    selector: 'story-time-basic',
    imports: [Time, Title],
    template: `
        <div class="${row}">
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">24-hour clock</h3>
                <fd-time [(time)]="time" />
                <p class="${value}">{{ time().toTimeString() }}</p>
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">12-hour clock with two digits</h3>
                <fd-time [(time)]="time" meridian keepTwoDigits [displaySeconds]="false" activeView="meridian" />
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Hours only, without spinners</h3>
                <fd-time [(time)]="time" [displayMinutes]="false" [displaySeconds]="false" [spinnerButtons]="false" />
            </div>
        </div>
    `
})
class StoryTimeBasic {
    protected readonly time = signal(new FdDate(2024, 3, 9, 14, 30, 15));
}

@Component({
    selector: 'story-time-options',
    imports: [Time, Title, FormsModule],
    template: `
        <div class="${row}">
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Minutes in steps of 15</h3>
                <fd-time [(time)]="time" [minuteStep]="15" [displaySeconds]="false" activeView="minute" />
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Five values, compact</h3>
                <fd-time [(time)]="time" [elementsAtOnce]="5" data-density="compact" />
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Tablet</h3>
                <fd-time [(time)]="time" tablet [displaySeconds]="false" />
            </div>
            <div>
                <h3 fdTitle headerSize="5" class="${heading}">Form control, disabled</h3>
                <fd-time [(ngModel)]="model" disabled />
            </div>
        </div>
    `
})
class StoryTimeOptions {
    protected readonly time = signal(new FdDate(2024, 3, 9, 9, 45, 0));
    protected model = new FdDate(2024, 3, 9, 18, 0, 0);
}

@Component({
    selector: 'story-time-programmatic',
    imports: [Time, Title, Button],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Programmatically changed time</h3>
        <fd-time [(time)]="time" />
        <p class="${value}">Selected time: {{ time().hour }}h {{ time().minute }}m {{ time().second }}s</p>
        <button fdButton label="Set hours to 11" (click)="setHours(11)"></button>
    `
})
class StoryTimeProgrammatic {
    private readonly adapter = inject<DatetimeAdapter<FdDate>>(DatetimeAdapter);
    protected readonly time = signal(new FdDate(2024, 3, 9, 12, 0, 0));

    protected setHours(hours: number): void {
        this.time.set(this.adapter.setHours(this.time(), hours));
    }
}

@Component({
    selector: 'story-time-reactive-form',
    imports: [Time, Title, ReactiveFormsModule],
    template: `
        <form [formGroup]="form">
            <h3 fdTitle headerSize="5" class="${heading}">Select time</h3>
            <fd-time formControlName="time" />
            <p class="${value}">
                Time:
                @if (form.controls.time.value; as time) {
                    {{ time.hour }}h {{ time.minute }}m {{ time.second }}s
                } @else {
                    none
                }
            </p>
            <p class="${value}">Touched: {{ form.touched }}, dirty: {{ form.dirty }}, valid: {{ form.valid }}</p>
        </form>
    `
})
class StoryTimeReactiveForm {
    protected readonly form = new FormGroup({ time: new FormControl<FdDate | null>(null) });
}

const meta: Meta<Time<FdDate>> = {
    title: 'Components/Time',
    component: Time,
    decorators: [
        moduleMetadata({
            imports: [StoryTimeBasic, StoryTimeOptions, StoryTimeProgrammatic, StoryTimeReactiveForm]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Time picks hours, minutes, seconds and the period in columns. The active column shows a window of values; the others show the selected value. ' +
                    'Each column is a spinbutton: Up and Down, Page Up and Page Down, Home and End, the mouse wheel, dragging, typing digits (or A and P) and the spinner buttons change it; Left and Right move between the columns.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Time<FdDate>>;

export const Basic: Story = { render: () => ({ template: `<story-time-basic />` }) };
export const Options: Story = { render: () => ({ template: `<story-time-options />` }) };
export const Programmatic: Story = { render: () => ({ template: `<story-time-programmatic />` }) };
export const ReactiveForm: Story = { render: () => ({ template: `<story-time-reactive-form />` }) };
