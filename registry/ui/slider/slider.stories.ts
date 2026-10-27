import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
    FormControl as NgFormControl,
    FormGroup as NgFormGroup,
    FormsModule,
    ReactiveFormsModule
} from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, waitFor } from 'storybook/test';
import { Slider, type SliderCustomValue, type SliderValue } from './slider';

const text = 'm-0 font-sap-font-family text-sap-font-size text-sap-text-color';
const small = 'm-0 font-sap-font-family text-sap-font-small-size text-sap-content-label-color';

const MONTHS: SliderCustomValue[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((label, i) => ({
    value: i + 1,
    label
}));

@Component({
    selector: 'story-slider-basic',
    imports: [Slider, FormsModule],
    template: `
        <div class="flex max-w-xl flex-col gap-2">
            <p class="${text}" id="sl-1">Default: min 0, max 100, step 1</p>
            <fd-slider ariaLabelledBy="sl-1" [(ngModel)]="one" />
            <p class="${small}">Value: {{ one() }}</p>
            <p class="${text} mt-4" id="sl-2">Negative minimum: min -100</p>
            <fd-slider ariaLabelledBy="sl-2" [min]="-100" [(ngModel)]="two" />
            <p class="${small}">Value: {{ two() }}</p>
            <p class="${text} mt-4" id="sl-3">min -50, max 50, step 5</p>
            <fd-slider ariaLabelledBy="sl-3" [min]="-50" [max]="50" [step]="5" [(ngModel)]="three" />
            <p class="${small}">Value: {{ three() }}</p>
            <p class="${text} mt-4" id="sl-4">min -1, max 1, step 0.2</p>
            <fd-slider ariaLabelledBy="sl-4" [min]="-1" [max]="1" [step]="0.2" [(ngModel)]="four" />
            <p class="${small}">Value: {{ four() }}</p>
            <p class="${text} mt-4" id="sl-5">Cozy (larger touch handles)</p>
            <fd-slider ariaLabelledBy="sl-5" cozy [(ngModel)]="one" />
            <p class="${text} mt-4" id="sl-6">Disabled</p>
            <fd-slider ariaLabelledBy="sl-6" disabled [ngModel]="30" />
        </div>
    `
})
class StorySliderBasic {
    protected readonly one = signal(30);
    protected readonly two = signal(-20);
    protected readonly three = signal(10);
    protected readonly four = signal(0.4);
}

@Component({
    selector: 'story-slider-ticks',
    imports: [Slider, FormsModule, JsonPipe],
    template: `
        <div class="flex max-w-xl flex-col gap-2">
            <p class="${text}" id="sl-t1">Tick marks</p>
            <fd-slider ariaLabelledBy="sl-t1" showTicks [max]="50" [(ngModel)]="one" />
            <p class="${text} mt-4" id="sl-t2">Ticks, labels every second tick and a read-only tooltip</p>
            <fd-slider
                ariaLabelledBy="sl-t2"
                showTicks
                showTicksLabels
                tooltipMode="readonly"
                [max]="50"
                [step]="5"
                [tickmarksBetweenLabels]="2"
                [(ngModel)]="two"
            />
            <p class="${small}">Value: {{ two() }}</p>
            <p class="${text} mt-4" id="sl-t3">Custom values</p>
            <fd-slider
                ariaLabelledBy="sl-t3"
                showTicks
                showTicksLabels
                tooltipMode="readonly"
                [customValues]="months"
                [(ngModel)]="month"
            />
            <p class="${small}">Value: {{ month() | json }}</p>
            <p class="${text} mt-4" id="sl-t4">Editable tooltip</p>
            <fd-slider ariaLabelledBy="sl-t4" tooltipMode="editable" [(ngModel)]="three" />
            <p class="${small}">Value: {{ three() }}</p>
        </div>
    `
})
class StorySliderTicks {
    protected readonly months = MONTHS;
    protected readonly one = signal(20);
    protected readonly two = signal(25);
    protected readonly three = signal(60);
    protected readonly month = signal<SliderValue>(MONTHS[2]);
}

@Component({
    selector: 'story-slider-range',
    imports: [Slider, FormsModule, JsonPipe],
    template: `
        <div class="flex max-w-xl flex-col gap-2">
            <p class="${text}" id="sl-r1">
                Range with an editable tooltip; drag the range between the handles to move both
            </p>
            <fd-slider
                ariaLabelledBy="sl-r1"
                mode="range"
                showTicks
                tooltipMode="editable"
                [step]="5"
                [(ngModel)]="range"
            />
            <p class="${small}">Min: {{ range()[0] }}, max: {{ range()[1] }}</p>
            <p class="${text} mt-4" id="sl-r2">Range with custom values</p>
            <fd-slider
                ariaLabelledBy="sl-r2"
                mode="range"
                showTicks
                showTicksLabels
                [customValues]="months"
                [(ngModel)]="months2"
            />
            <p class="${small}">Value: {{ months2() | json }}</p>
        </div>
    `
})
class StorySliderRange {
    protected readonly months = MONTHS;
    protected readonly range = signal<number[]>([20, 70]);
    protected readonly months2 = signal<SliderValue>([MONTHS[1], MONTHS[5]]);
}

const DAYS: SliderCustomValue[] = Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `Jan ${i + 1}` }));

@Component({
    selector: 'story-slider-vertical',
    imports: [Slider, FormsModule, JsonPipe],
    template: `
        <div class="flex flex-wrap gap-12">
            <div class="flex h-80 gap-12">
                <fd-slider vertical ariaLabel="Volume" [(ngModel)]="one" />
                <fd-slider vertical ariaLabel="Bass" tooltipMode="readonly" [(ngModel)]="two" />
                <fd-slider vertical ariaLabel="Range" mode="range" [(ngModel)]="range" />
                <fd-slider vertical cozy showTicks showTicksLabels ariaLabel="Treble" [step]="10" [(ngModel)]="three" />
            </div>
            <div class="flex flex-col gap-2">
                <p class="${text}" id="sl-v1">Range with an editable tooltip and ticks</p>
                <div class="h-80">
                    <fd-slider
                        vertical
                        ariaLabelledBy="sl-v1"
                        mode="range"
                        showTicks
                        tooltipMode="editable"
                        [(ngModel)]="editable"
                    />
                </div>
                <p class="${small}">Min: {{ editable()[0] }}, max: {{ editable()[1] }}</p>
            </div>
            <div class="flex flex-col gap-2">
                <p class="${text}" id="sl-v2">Range with custom values</p>
                <div class="h-80">
                    <fd-slider
                        vertical
                        ariaLabelledBy="sl-v2"
                        mode="range"
                        showTicks
                        showTicksLabels
                        [customValues]="days"
                        [(ngModel)]="dayRange"
                    />
                </div>
                <p class="${small}">Value: {{ dayRange() | json }}</p>
            </div>
        </div>
    `
})
class StorySliderVertical {
    protected readonly days = DAYS;
    protected readonly one = signal(50);
    protected readonly two = signal(30);
    protected readonly three = signal(70);
    protected readonly range = signal<number[]>([20, 60]);
    protected readonly editable = signal<number[]>([20, 70]);
    protected readonly dayRange = signal<SliderValue>([DAYS[4], DAYS[6]]);
}

@Component({
    selector: 'story-slider-form',
    imports: [Slider, ReactiveFormsModule],
    template: `
        <form [formGroup]="form" class="flex max-w-xl flex-col gap-2">
            <fd-slider ariaLabel="Percentage" formControlName="slider" />
            <p class="${small}">
                Value: {{ form.controls.slider.value }}, touched: {{ form.touched }}, dirty: {{ form.dirty }}
            </p>
        </form>
    `
})
class StorySliderForm {
    protected readonly form = new NgFormGroup({ slider: new NgFormControl<SliderValue>(40) });
}

const meta: Meta<Slider> = {
    title: 'Components/Slider',
    component: Slider,
    decorators: [
        moduleMetadata({
            imports: [
                Slider,
                StorySliderBasic,
                StorySliderTicks,
                StorySliderRange,
                StorySliderVertical,
                StorySliderForm
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Picks a number, a range or one of a list of custom values. Drag a handle or press the track; with the keyboard the arrows move by `step`, Shift+arrows and Page Up/Down by `jump`, Home and End to the ends. ' +
                    'A range slider moves both handles together from the range between them. Ticks, labels, a vertical layout and read-only or editable tooltips are optional.'
            }
        }
    },
    args: {
        ariaLabel: 'Slider',
        min: 0,
        max: 100,
        step: 1,
        mode: 'single',
        showTicks: false,
        showTicksLabels: false,
        disabled: false,
        vertical: false,
        cozy: false
    },
    argTypes: {
        mode: { control: 'inline-radio', options: ['single', 'range'] },
        tooltipMode: { control: 'select', options: [null, 'readonly', 'editable'] }
    }
};
export default meta;
type Story = StoryObj<Slider>;

export const Playground: Story = {
    render: (args) => ({ props: args, template: `<div class="max-w-xl"><fd-slider ${argsToTemplate(args)} /></div>` })
};
export const Basic: Story = { render: () => ({ template: `<story-slider-basic />` }) };
export const TicksAndLabels: Story = {
    name: 'Ticks, labels and tooltips',
    render: () => ({ template: `<story-slider-ticks />` })
};
export const Range: Story = { render: () => ({ template: `<story-slider-range />` }) };
export const Vertical: Story = { render: () => ({ template: `<story-slider-vertical />` }) };
export const Form: Story = { render: () => ({ template: `<story-slider-form />` }) };

export const OpenEditableTooltip: Story = {
    name: 'Open: Editable tooltip',
    tags: ['!autodocs'],
    render: () => ({
        props: { value: 60, range: [20, 70] },
        template: `
            <div class="flex max-w-xl flex-col gap-12 pt-12">
                <fd-slider ariaLabel="Value" tooltipMode="editable" [(value)]="value" />
                <fd-slider ariaLabel="Range" mode="range" showTicks tooltipMode="editable" [step]="5" [(value)]="range" />
            </div>`
    }),
    play: async ({ canvasElement }) => {
        let handle: HTMLElement | null = null;
        await waitFor(() => {
            handle = canvasElement.querySelector<HTMLElement>('fd-slider [role=slider]');
            expect(handle).not.toBeNull();
        });
        handle!.focus();
        await waitFor(() => expect(canvasElement.querySelector('fd-slider input')).not.toBeNull());
    }
};
