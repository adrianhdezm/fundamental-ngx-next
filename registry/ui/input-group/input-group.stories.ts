import { Component, signal } from '@angular/core';
import {
    FormControl as NgFormControl,
    FormGroup as NgFormGroup,
    FormsModule,
    ReactiveFormsModule
} from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '@/ui/button/button';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { Fieldset, FormHeader, FormItem, FormLabel } from '@/ui/form/form';
import { FormInputMessageGroup } from '@/ui/form/form-input-message-group';
import { FormMessage } from '@/ui/form/form-message';
import { Link } from '@/ui/link/link';
import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group';

const text = 'm-0 font-sap-font-family text-sap-font-small-size text-sap-content-label-color';

@Component({
    selector: 'story-input-group-form',
    imports: [InputGroup, FormItem, FormLabel, Fieldset, ReactiveFormsModule],
    template: `
        <form [formGroup]="form" class="flex max-w-96 flex-col gap-4">
            <fieldset fdFieldset>
                <div fdFormItem>
                    <label fdFormLabel for="ig-form-1">Disabled Input</label>
                    <fd-input-group
                        inputId="ig-form-1"
                        glyph="decline"
                        glyphAriaLabel="Clear"
                        placeholder="Search"
                        formControlName="disabledInput"
                        button
                    />
                </div>
                <p class="${text}">Disabled Input Value: {{ form.controls.disabledInput.value }}</p>
                <div fdFormItem class="mt-4">
                    <label fdFormLabel for="ig-form-2">Enabled Input (Type Text)</label>
                    <fd-input-group inputId="ig-form-2" placeholder="Enter text" formControlName="enabledInputText" />
                </div>
                <p class="${text}">
                    Value: {{ form.controls.enabledInputText.value }} ({{
                        typeOf(form.controls.enabledInputText.value)
                    }}), touched: {{ form.controls.enabledInputText.touched }}, dirty:
                    {{ form.controls.enabledInputText.dirty }}
                </p>
                <div fdFormItem class="mt-4">
                    <label fdFormLabel for="ig-form-3">Enabled Input (Type Number)</label>
                    <fd-input-group
                        inputId="ig-form-3"
                        type="number"
                        placeholder="Enter a number"
                        formControlName="enabledInputNumber"
                    />
                </div>
                <p class="${text}">
                    Value: {{ form.controls.enabledInputNumber.value }} ({{
                        typeOf(form.controls.enabledInputNumber.value)
                    }}), touched: {{ form.controls.enabledInputNumber.touched }}, dirty:
                    {{ form.controls.enabledInputNumber.dirty }}
                </p>
            </fieldset>
        </form>
    `
})
class StoryInputGroupForm {
    protected readonly form = new NgFormGroup({
        disabledInput: new NgFormControl({ value: 'Disabled', disabled: true }),
        enabledInputText: new NgFormControl<string | number | null>('Text'),
        enabledInputNumber: new NgFormControl<string | number | null>(42)
    });
    protected typeOf(value: unknown): string {
        return typeof value;
    }
}

@Component({
    selector: 'story-input-group-search',
    imports: [InputGroup, FormItem, FormLabel, FormsModule],
    template: `
        <div class="flex max-w-96 flex-col gap-2">
            <div fdFormItem>
                <label fdFormLabel for="ig-search-1">Search input</label>
                <fd-input-group
                    inputId="ig-search-1"
                    glyph="decline"
                    glyphAriaLabel="Clear"
                    placeholder="Search"
                    button
                    [(ngModel)]="term"
                    (addOnButtonClicked)="term.set('')"
                />
            </div>
            <p class="${text}">Search term: {{ term() }}</p>
            <div fdFormItem class="mt-4">
                <label fdFormLabel for="ig-search-2">Search input with search type</label>
                <fd-input-group
                    inputId="ig-search-2"
                    type="search"
                    glyph="search"
                    glyphAriaLabel="Search"
                    placeholder="Search"
                    button
                    [(ngModel)]="second"
                    (search)="searched.set(second())"
                    (addOnButtonClicked)="searched.set(second())"
                />
            </div>
            <p class="${text}">Search term: {{ second() }}, searched for: {{ searched() }}</p>
        </div>
    `
})
class StoryInputGroupSearch {
    protected readonly term = signal('Fiori');
    protected readonly second = signal('');
    protected readonly searched = signal('');
}

const meta: Meta<InputGroup> = {
    title: 'Components/Input Group',
    component: InputGroup,
    decorators: [
        moduleMetadata({
            imports: [
                InputGroup,
                InputGroupInput,
                InputGroupAddon,
                Button,
                FormItem,
                FormLabel,
                FormHeader,
                FormMessage,
                FormInputMessageGroup,
                ContentDensityDirective,
                Link,
                StoryInputGroupForm,
                StoryInputGroupSearch
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'An input with text, icon or button addons before or after it. With its own input the group is a form control (`ngModel`, reactive forms); ' +
                    'project an `fdInputGroupInput` and `fdInputGroupAddon` parts for other layouts. A text or icon addon describes the input; a button addon needs an accessible name.'
            }
        }
    },
    argTypes: {
        placement: { control: 'inline-radio', options: ['before', 'after'] },
        state: { control: 'select', options: ['default', 'success', 'error', 'warning', 'information'] }
    },
    args: {
        placement: 'after',
        addOnText: '$',
        placeholder: 'Amount',
        ariaLabel: 'Amount',
        button: false,
        disabled: false,
        readonly: false,
        inline: false,
        state: 'default'
    }
};
export default meta;
type Story = StoryObj<InputGroup>;

export const Playground: Story = {
    render: (args) => ({
        props: args,
        template: `<div class="max-w-96"><fd-input-group ${argsToTemplate(args)} /></div>`
    })
};

export const TextAddon: Story = {
    name: 'Text addon',
    render: () => ({
        template: `
            <div class="flex max-w-96 flex-col gap-4">
                <h4 fdFormHeader>Form Header</h4>
                <div fdFormItem>
                    <label fdFormLabel required for="ig-text-1">Left Aligned Text Add-on</label>
                    <fd-input-group inputId="ig-text-1" addOnText="$" placement="before" required placeholder="Amount" />
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ig-text-2">Right Aligned Text Add-on</label>
                    <fd-input-group inputId="ig-text-2" addOnText="$" placement="after" placeholder="Amount" />
                </div>
                <div fdFormItem>
                    <fd-input-group addOnText="$" placeholder="Amount" ariaLabel="Right Aligned Text Add-on (aria-label)" />
                </div>
            </div>
        `
    })
};

export const IconAddon: Story = {
    name: 'Icon addon',
    render: () => ({
        template: `
            <div class="flex max-w-96 flex-col gap-4">
                <div fdFormItem>
                    <label fdFormLabel for="ig-icon-1">Left Aligned Icon Add-on</label>
                    <fd-input-group inputId="ig-icon-1" placement="before" glyph="cart" glyphAriaLabel="Add to Cart" placeholder="Amount" />
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ig-icon-2">Right Aligned Icon Add-on</label>
                    <fd-input-group inputId="ig-icon-2" glyph="cart" glyphAriaLabel="Add to Cart" placeholder="Amount" />
                </div>
            </div>
        `
    })
};

export const ButtonAddon: Story = {
    name: 'Button addon',
    render: () => ({
        template: `
            <div class="flex max-w-96 flex-col gap-4">
                <div fdFormItem>
                    <label fdFormLabel for="ig-button-1">Left Aligned Icon Button Add-on</label>
                    <fd-input-group inputId="ig-button-1" placement="before" glyph="cart" glyphAriaLabel="Add to Cart" placeholder="Amount" button />
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ig-button-2">Right Aligned Text Button Add-on</label>
                    <fd-input-group inputId="ig-button-2" addOnText="Submit" placeholder="Amount" button />
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ig-button-3">Button that keeps the focus in the input</label>
                    <fd-input-group inputId="ig-button-3" glyph="value-help" glyphAriaLabel="Value help" placeholder="Value" button [buttonFocusable]="false" />
                </div>
            </div>
        `
    })
};

export const Complex: Story = {
    name: 'Projected parts',
    render: () => ({
        template: `
            <div class="flex max-w-96 flex-col gap-4">
                <div fdFormItem>
                    <label fdFormLabel id="ig-complex-label-1" for="ig-complex-1">Input Group with complex button addon</label>
                    <fd-input-group>
                        <input id="ig-complex-1" fdInputGroupInput />
                        <span fdInputGroupAddon button>
                            <button fdButton variant="transparent" glyph="calendar" ariaLabel="Calendar" title="Calendar"></button>
                        </span>
                    </fd-input-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ig-complex-2">Input Group with complex span addon</label>
                    <fd-input-group>
                        <input id="ig-complex-2" fdInputGroupInput aria-describedby="ig-complex-addon-2" />
                        <span id="ig-complex-addon-2" fdInputGroupAddon>Addon</span>
                    </fd-input-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ig-complex-3">Addons on both sides</label>
                    <fd-input-group>
                        <span fdInputGroupAddon id="ig-complex-addon-3a">https://</span>
                        <input id="ig-complex-3" fdInputGroupInput placeholder="example" aria-describedby="ig-complex-addon-3a ig-complex-addon-3b" />
                        <span fdInputGroupAddon id="ig-complex-addon-3b">.com</span>
                        <span fdInputGroupAddon button>
                            <button fdButton variant="transparent" glyph="decline" ariaLabel="Clear"></button>
                        </span>
                    </fd-input-group>
                </div>
            </div>
        `
    })
};

const STATES = `
            <div class="flex max-w-96 flex-col gap-4">
                <div fdFormItem>
                    <label fdFormLabel for="ig-state-1">Discount Code</label>
                    <fd-form-input-message-group>
                        <fd-input-group inputId="ig-state-1" addOnText="Apply" state="information" placeholder="Enter promo code" button />
                        <fd-form-message type="information">Use code <code>WELCOME20</code> for 20% off your first order. Valid until end of month.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ig-state-2">Invitation Code</label>
                    <fd-form-input-message-group>
                        <fd-input-group inputId="ig-state-2" addOnText="Verify" state="success" placeholder="8-digit code" button />
                        <fd-form-message type="success">Code verified successfully. You can now access the conference portal.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ig-state-3">Account Number</label>
                    <fd-form-input-message-group>
                        <fd-input-group inputId="ig-state-3" addOnText="Check" state="warning" placeholder="10-digit account number" button />
                        <fd-form-message type="warning">This account number matches a <b>closed account</b>. Verify the number or contact <a fdLink href="#">support</a>.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ig-state-4">License Key</label>
                    <fd-form-input-message-group>
                        <fd-input-group inputId="ig-state-4" addOnText="Activate" state="error" placeholder="XXXX-XXXX-XXXX-XXXX" button />
                        <fd-form-message type="error">Invalid license key format. Keys must be 16 characters (letters and numbers) separated by dashes.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ig-state-5">Read only</label>
                    <fd-input-group inputId="ig-state-5" addOnText="EUR" readonly [value]="'1,200.00'" />
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ig-state-6">Disabled</label>
                    <fd-input-group inputId="ig-state-6" glyph="search" glyphAriaLabel="Search" button disabled placeholder="Search" />
                </div>
            </div>
        `;

export const States: Story = { render: () => ({ template: STATES }) };

export const Compact: Story = {
    render: () => ({
        template: `
            <div class="flex max-w-96 flex-col gap-4" fdContentDensity="compact">
                <div fdFormItem>
                    <label fdFormLabel for="ig-compact-1">Compact size</label>
                    <fd-input-group inputId="ig-compact-1" addOnText="$" placement="before" placeholder="Amount" />
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ig-compact-2">Compact size button</label>
                    <fd-input-group inputId="ig-compact-2" glyph="cart" glyphAriaLabel="Add to cart" placeholder="Amount" button />
                </div>
            </div>
        `
    })
};

export const Inline: Story = {
    render: () => ({
        template: `
            <p class="m-0 font-sap-font-family text-sap-font-size text-sap-text-color">
                Pay
                <fd-input-group inline addOnText="EUR" placeholder="0.00" ariaLabel="Amount" class="w-48" />
                by the end of the month.
            </p>
        `
    })
};

export const Forms: Story = { render: () => ({ template: `<story-input-group-form />` }) };

export const Search: Story = { render: () => ({ template: `<story-input-group-search />` }) };

/** Focuses a stateful input group so its message popover opens and axe checks it. */
export const OpenStates: Story = {
    name: 'Open: states',
    tags: ['!autodocs'],
    render: () => ({ template: STATES }),
    play: async ({ canvasElement }) => {
        const input = canvasElement.querySelector<HTMLInputElement>('#ig-state-4')!;
        await userEvent.click(input);
        await waitFor(() =>
            expect(document.querySelector('.cdk-overlay-container fd-form-message')?.textContent).toContain(
                'license key'
            )
        );
    }
};
