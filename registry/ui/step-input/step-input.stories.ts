import { Component, signal } from '@angular/core';
import { FormControl as NgFormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { FormItem, FormLabel } from '@/ui/form/form';
import { FormInputMessageGroup } from '@/ui/form/form-input-message-group';
import { FormMessage } from '@/ui/form/form-message';
import { StepInput } from './step-input';

const small = 'm-0 mt-1 block font-sap-font-family text-sap-font-small-size text-sap-content-label-color';
const grid = 'grid max-w-3xl grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-6';

@Component({
    selector: 'story-step-input-default',
    imports: [StepInput, FormItem, FormLabel, ContentDensityDirective],
    template: `
        <div class="${grid}">
            <div fdFormItem>
                <label fdFormLabel for="si-1">Default (min 1, max 2)</label>
                <fd-step-input inputId="si-1" [min]="1" [max]="2" [(value)]="one" />
                <small class="${small}">Value: {{ one() }}</small>
            </div>
            <div fdFormItem fdContentDensity="compact">
                <label fdFormLabel for="si-2">Compact</label>
                <fd-step-input inputId="si-2" [(value)]="two" />
                <small class="${small}">Value: {{ two() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-3">Full width</label>
                <fd-step-input inputId="si-3" isFullWidth [(value)]="three" />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-4">Wheel disabled, step 0.5</label>
                <fd-step-input inputId="si-4" disableWheel [step]="0.5" [(value)]="four" />
                <small class="${small}">Value: {{ four() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-5">Read-only</label>
                <fd-step-input inputId="si-5" readonly [value]="12" />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-6">Disabled</label>
                <fd-step-input inputId="si-6" disabled [value]="3" />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-7">Without buttons, centered</label>
                <fd-step-input inputId="si-7" textAlign="center" [hasStepButtons]="false" [(value)]="two" />
            </div>
        </div>
    `
})
class StoryStepInputDefault {
    protected readonly one = signal<number | null | undefined>(1);
    protected readonly two = signal<number | null | undefined>(100);
    protected readonly three = signal<number | null | undefined>(null);
    protected readonly four = signal<number | null | undefined>(2.5);
}

@Component({
    selector: 'story-step-input-format',
    imports: [StepInput, FormItem, FormLabel],
    template: `
        <div class="${grid}">
            <div fdFormItem>
                <label fdFormLabel for="si-f1">4 minimum fraction digits</label>
                <fd-step-input inputId="si-f1" [minFractionDigits]="4" [(value)]="one" />
                <small class="${small}">Value: {{ one() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-f2">1 maximum fraction digit</label>
                <fd-step-input inputId="si-f2" [maxFractionDigits]="1" [step]="0.1" [(value)]="two" />
                <small class="${small}">Value: {{ two() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-f9">Integers only</label>
                <fd-step-input inputId="si-f9" [maxFractionDigits]="0" [(value)]="nine" />
                <small class="${small}">Value: {{ nine() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-f10">Min max limitation (-10 to 10)</label>
                <fd-step-input inputId="si-f10" [min]="-10" [max]="10" [(value)]="ten" />
                <small class="${small}">Value: {{ ten() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-f3">No grouping</label>
                <fd-step-input inputId="si-f3" [useGrouping]="false" [step]="1000" [(value)]="three" />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-f4">Custom icons</label>
                <fd-step-input
                    inputId="si-f4"
                    incrementButtonIcon="arrow-top"
                    decrementButtonIcon="arrow-bottom"
                    [(value)]="four"
                />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-f5">Euro</label>
                <fd-step-input inputId="si-f5" mode="currency" currency="EUR" [(value)]="five" />
                <small class="${small}">Value: {{ five() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-f6">Japanese yen</label>
                <fd-step-input inputId="si-f6" mode="currency" currency="JPY" [step]="100" [(value)]="six" />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-f11">US dollars, custom label</label>
                <fd-step-input inputId="si-f11" mode="currency" currency="USD" unit="Grand" [(value)]="eleven" />
                <small class="${small}">Value: {{ eleven() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-f7">German locale</label>
                <fd-step-input inputId="si-f7" locale="de-DE" [minFractionDigits]="2" [(value)]="seven" />
                <small class="${small}">Value: {{ seven() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-f12">Spanish locale</label>
                <fd-step-input inputId="si-f12" locale="es-ES" [(value)]="twelve" />
                <small class="${small}">Value: {{ twelve() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-f13">Polish locale</label>
                <fd-step-input inputId="si-f13" locale="pl-PL" [(value)]="thirteen" />
                <small class="${small}">Value: {{ thirteen() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-f14">Saudi Arabia locale (Arabic digits)</label>
                <fd-step-input inputId="si-f14" locale="ar-SA" [(value)]="fourteen" />
                <small class="${small}">Value: {{ fourteen() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-f8">Unit</label>
                <fd-step-input inputId="si-f8" unit="kg" [min]="0" [(value)]="eight" />
            </div>
        </div>
    `
})
class StoryStepInputFormat {
    protected readonly one = signal<number | null | undefined>(1.5);
    protected readonly two = signal<number | null | undefined>(0.3);
    protected readonly three = signal<number | null | undefined>(12000);
    protected readonly four = signal<number | null | undefined>(5);
    protected readonly five = signal<number | null | undefined>(19.99);
    protected readonly six = signal<number | null | undefined>(2500);
    protected readonly seven = signal<number | null | undefined>(1234.5);
    protected readonly eight = signal<number | null | undefined>(70);
    protected readonly nine = signal<number | null | undefined>(3);
    protected readonly ten = signal<number | null | undefined>(0);
    protected readonly eleven = signal<number | null | undefined>(12);
    protected readonly twelve = signal<number | null | undefined>(12345.5);
    protected readonly thirteen = signal<number | null | undefined>(12345.5);
    protected readonly fourteen = signal<number | null | undefined>(12345.5);
}

@Component({
    selector: 'story-step-input-states',
    imports: [StepInput, FormItem, FormLabel, FormInputMessageGroup, FormMessage],
    template: `
        <div class="${grid}">
            @for (state of states; track state) {
                <div fdFormItem>
                    <label fdFormLabel [for]="'si-s-' + state">{{ state }}</label>
                    <fd-form-input-message-group>
                        <fd-step-input [inputId]="'si-s-' + state" [state]="state" [value]="10" />
                        <fd-form-message [type]="state">{{ state }} message</fd-form-message>
                    </fd-form-input-message-group>
                </div>
            }
        </div>
    `
})
class StoryStepInputStates {
    protected readonly states = ['success', 'error', 'warning', 'information'] as const;
}

@Component({
    selector: 'story-step-input-form',
    imports: [StepInput, FormItem, FormLabel, ReactiveFormsModule, FormsModule, Button],
    template: `
        <div class="${grid}">
            <div fdFormItem>
                <label fdFormLabel for="si-form" required>Reactive forms (min value 0)</label>
                <fd-step-input inputId="si-form" required [min]="0" [formControl]="control" />
                <small class="${small}">
                    Value: {{ control.value }}, dirty: {{ control.dirty }}, touched: {{ control.touched }}, status:
                    {{ control.status }}
                </small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-form-limits" required>Reactive forms (min value 5, max value 10)</label>
                <fd-step-input
                    inputId="si-form-limits"
                    required
                    [min]="5"
                    [max]="10"
                    [state]="limited.invalid ? 'error' : null"
                    [formControl]="limited"
                />
                <small class="${small}">
                    Value: {{ limited.value }}, dirty: {{ limited.dirty }}, touched: {{ limited.touched }}, status:
                    {{ limited.status }}
                    @if (limited.hasError('required')) {
                        (a value is required)
                    }
                </small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-form-template">Template driven forms</label>
                <fd-step-input inputId="si-form-template" [(ngModel)]="templateValue" />
                <small class="${small}">Value: {{ templateValue }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-form-disabled">Disabled control</label>
                <fd-step-input inputId="si-form-disabled" [formControl]="disabledControl" />
                <small class="${small}">
                    Value: {{ disabledControl.value }}, dirty: {{ disabledControl.dirty }}, touched:
                    {{ disabledControl.touched }}, status: {{ disabledControl.status }}
                </small>
                <button fdButton class="mt-2" label="Toggle disabled state" (click)="toggleDisabled()"></button>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="si-form-readonly">Read-only control</label>
                <fd-step-input inputId="si-form-readonly" readonly [(ngModel)]="readonlyValue" />
                <small class="${small}">Value: {{ readonlyValue }}</small>
            </div>
        </div>
    `
})
class StoryStepInputForm {
    protected readonly control = new NgFormControl<number | null>(null, Validators.required);
    protected readonly limited = new NgFormControl<number | null>(5, [
        Validators.required,
        Validators.min(5),
        Validators.max(10)
    ]);
    protected readonly disabledControl = new NgFormControl<number | null>({ value: 100, disabled: true });
    protected templateValue: number | null = 100;
    protected readonlyValue: number | null = 100;

    protected toggleDisabled(): void {
        if (this.disabledControl.enabled) this.disabledControl.disable();
        else this.disabledControl.enable();
    }
}

const meta: Meta<StepInput> = {
    title: 'Components/Step Input',
    component: StepInput,
    decorators: [
        moduleMetadata({
            imports: [StepInput, StoryStepInputDefault, StoryStepInputFormat, StoryStepInputStates, StoryStepInputForm]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'A number field with decrement and increment buttons that repeat while pressed. The value is formatted for the locale as a decimal or a currency and parsed back from what is typed. ' +
                    'Up and Down step the value, Page Up and Page Down by ten steps, Home and End go to the limits, and the mouse wheel steps while the field has the focus.'
            }
        }
    },
    argTypes: {
        state: { control: 'select', options: ['default', 'success', 'error', 'warning', 'information'] },
        mode: { control: 'inline-radio', options: ['decimal', 'currency'] }
    },
    args: { ariaLabel: 'Quantity', step: 1, state: 'default', disabled: false, readonly: false }
};
export default meta;
type Story = StoryObj<StepInput>;

export const Playground: Story = {
    render: (args) => ({
        props: { ...args, value: 5 },
        template: `<fd-step-input ${argsToTemplate(args)} [(value)]="value" />`
    })
};
export const Default: Story = { render: () => ({ template: `<story-step-input-default />` }) };
export const Formats: Story = {
    name: 'Formats, currencies and units',
    render: () => ({ template: `<story-step-input-format />` })
};
export const States: Story = { render: () => ({ template: `<story-step-input-states />` }) };
export const Form: Story = { render: () => ({ template: `<story-step-input-form />` }) };
