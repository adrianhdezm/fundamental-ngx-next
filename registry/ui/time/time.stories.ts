import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { FdDate } from '@/lib/datetime';
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

const meta: Meta<Time<FdDate>> = {
    title: 'Components/Time',
    component: Time,
    decorators: [moduleMetadata({ imports: [StoryTimeBasic, StoryTimeOptions] })],
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
