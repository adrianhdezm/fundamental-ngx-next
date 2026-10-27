import { JsonPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { Link } from '@/ui/link/link';
import { Checkbox } from './checkbox';

const meta: Meta<Checkbox> = {
    title: 'Components/Checkbox',
    component: Checkbox,
    decorators: [moduleMetadata({ imports: [Checkbox, FormsModule, ReactiveFormsModule, JsonPipe, Button, Link] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Checkboxes select one or more options. The whole label is clickable; Space toggles the focused checkbox. ' +
                    'A tristate checkbox shows a mixed state, for example for "select all".'
            }
        }
    },
    argTypes: { state: { control: 'select', options: ['default', 'success', 'error', 'warning', 'information'] } },
    args: {
        label: 'Option',
        state: 'default',
        disabled: false,
        readonly: false,
        displayOnly: false,
        required: false,
        tristate: false
    }
};
export default meta;
type Story = StoryObj<Checkbox>;

const valueText = 'class="ms-2 text-sap-font-small-size text-sap-content-label-color"';

export const Playground: Story = {
    render: (args) => ({
        props: { ...args, model: false },
        template: `<fd-checkbox ${argsToTemplate(args)} [(ngModel)]="model" />`
    })
};

export const Default: Story = {
    render: () => ({
        props: { value: false },
        template: `
            <label for="defaultCheckbox" class="block text-sap-content-label-color">Default checkbox</label>
            <fd-checkbox label="Option 1" [(ngModel)]="value" required inputId="defaultCheckbox" />
            <span ${valueText}>Value: {{ value }}</span>`
    })
};

export const Tristate: Story = {
    render: () => ({
        props: { v1: null, v2: null },
        template: `
            <div class="flex items-center">Third state selectable:
                <fd-checkbox label="Option 1" tristate tristateSelectable [(ngModel)]="v1" /><span ${valueText}>Value: {{ v1 | json }}</span></div>
            <div class="flex items-center">Third state unselectable:
                <fd-checkbox label="Option 2" tristate [(ngModel)]="v2" /><span ${valueText}>Value: {{ v2 | json }}</span></div>`
    })
};

export const CustomValues: Story = {
    name: 'Custom values',
    render: () => ({
        props: { v1: 'No', v2: 'I dont have an opinion' },
        template: `
            <div class="flex items-center">
                <fd-checkbox label="I accept the new Terms of Service" [values]="{ trueValue: 'Yes', falseValue: 'No' }" [(ngModel)]="v1" />
                <span ${valueText}>Value: {{ v1 }}</span>
            </div>
            <div class="flex items-center">
                <fd-checkbox label="Banana is the best fruit" tristate tristateSelectable
                    [values]="{ trueValue: 'Yes', falseValue: 'No', thirdStateValue: 'I dont have an opinion' }" [(ngModel)]="v2" />
                <span ${valueText}>Value: {{ v2 }}</span>
            </div>`
    })
};

export const CustomLabel: Story = {
    name: 'Custom label',
    render: () => ({
        props: { value: false },
        template: `<fd-checkbox [(ngModel)]="value">I accept&nbsp;<a fdLink href="#">Terms and conditions</a></fd-checkbox><span ${valueText}>Value: {{ value }}</span>`
    })
};

export const LabelWrapping: Story = {
    name: 'Label wrapping',
    render: () => ({
        template: `
            <div class="max-w-xl">
                <fd-checkbox wrapLabel>LABEL WILL BE POSITIONED IN THE MIDDLE. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Corporis ea eos in porro quae ullam. Aliquid corporis doloribus exercitationem facilis hic illo labore laudantium quam reprehenderit sapiente.</fd-checkbox>
                <fd-checkbox wrapLabel valignLabel="top">LABEL WILL BE POSITIONED ON THE TOP. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Corporis ea eos in porro quae ullam. Aliquid corporis doloribus exercitationem facilis hic illo labore laudantium quam reprehenderit sapiente.</fd-checkbox>
            </div>`
    })
};

export const States: Story = {
    render: () => ({
        props: {
            v: { a: true, b: true, c: true, d: true, e: true, f: true, g: false, h: null, i: true, j: true, k: null }
        },
        template: `
            <div class="flex flex-col gap-2">
                <p>States:</p>
                <div class="flex flex-wrap">
                    <fd-checkbox [(ngModel)]="v.a" label="No state" />
                    <fd-checkbox [(ngModel)]="v.b" state="information" label="Info state" />
                    <fd-checkbox [(ngModel)]="v.c" state="success" label="Success state" />
                    <fd-checkbox [(ngModel)]="v.d" state="warning" label="Warning state" />
                    <fd-checkbox [(ngModel)]="v.e" state="error" label="Error state" />
                </div>
                <p>Disabled:</p>
                <div><fd-checkbox [(ngModel)]="v.f" disabled label="Disabled label" /></div>
                <p>Read only:</p>
                <div class="flex flex-wrap">
                    <fd-checkbox [(ngModel)]="v.g" readonly label="Readonly label when false" />
                    <fd-checkbox [(ngModel)]="v.h" readonly tristate label="Readonly label when null (in tristate)" />
                    <fd-checkbox [(ngModel)]="v.i" readonly label="Readonly label when true" />
                </div>
                <p>Display-only:</p>
                <div class="flex items-center gap-2">
                    <fd-checkbox [(ngModel)]="v.j" displayOnly label="Display-only label" />
                    <button fdButton (click)="v.j = !v.j">Change value to {{ v.j ? 'false' : 'true' }}</button>
                </div>
                <div class="flex items-center gap-2">
                    <fd-checkbox [(ngModel)]="v.k" displayOnly tristate label="Display-only tristate label" />
                    <button fdButton (click)="v.k = v.k === null ? true : v.k ? false : null">Next tristate value</button>
                </div>
            </div>`
    })
};

/** Upstream's "Accept all" pattern: a tristate parent that reflects and drives three agreements. */
@Component({
    selector: 'story-checkbox-accept-all',
    imports: [Checkbox, ReactiveFormsModule, JsonPipe],
    template: `
        <form [formGroup]="form" class="flex flex-col">
            <fd-checkbox formControlName="acceptAll" label="Accept all" tristate [tristateSelectable]="false" />
            <fieldset formGroupName="agreements" class="m-0 flex flex-col border-0 p-0 ps-6">
                <legend class="sr-only-sap">Agreements</legend>
                <fd-checkbox formControlName="termsAndConditions" label="I accept Terms and Conditions" />
                <fd-checkbox formControlName="marketing" label="I want to receive Marketing Materials" />
                <fd-checkbox formControlName="newsletter" label="I want to sign up for a Newsletter" />
            </fieldset>
        </form>
        <small class="mt-2 block text-sap-font-small-size text-sap-content-label-color">
            Form value: {{ form.getRawValue() | json }}<br />
            Form touched: {{ form.touched }}<br />
            Form dirty: {{ form.dirty }}<br />
            Form valid: {{ form.valid }}
        </small>
    `
})
class AcceptAllStory {
    protected readonly form = new FormGroup({
        acceptAll: new FormControl<boolean | null>(false),
        agreements: new FormGroup({
            termsAndConditions: new FormControl<boolean | null>(false),
            marketing: new FormControl<boolean | null>(false),
            newsletter: new FormControl<boolean | null>(false)
        })
    });

    constructor() {
        const { acceptAll, agreements } = this.form.controls;
        const destroyRef = inject(DestroyRef);
        acceptAll.valueChanges
            .pipe(takeUntilDestroyed(destroyRef))
            .subscribe((accept) =>
                agreements.setValue({ termsAndConditions: accept, marketing: accept, newsletter: accept })
            );
        agreements.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
            const values = Object.values(agreements.getRawValue());
            const all = values.every(Boolean) ? true : values.some(Boolean) ? null : false;
            acceptAll.setValue(all, { emitEvent: false });
        });
    }
}

export const ReactiveForms: Story = {
    name: 'Reactive forms',
    decorators: [moduleMetadata({ imports: [AcceptAllStory] })],
    render: () => {
        const form = new FormGroup({
            accepted: new FormControl(true),
            newsletter: new FormControl({ value: false, disabled: true })
        });
        return {
            props: { form },
            template: `
                <story-checkbox-accept-all />
                <form [formGroup]="form" class="mt-6 flex flex-col">
                    <fd-checkbox formControlName="accepted" label="I accept the terms" />
                    <fd-checkbox formControlName="newsletter" label="Newsletter (disabled control)" />
                </form>
                <pre class="text-sap-font-small-size">{{ form.getRawValue() | json }}</pre>
                <button fdButton label="Toggle newsletter enabled"
                    (click)="form.controls.newsletter.disabled ? form.controls.newsletter.enable() : form.controls.newsletter.disable()"></button>`
        };
    }
};
