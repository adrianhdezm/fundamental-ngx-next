import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { Fieldset, FormGroup, FormHeader, FormItem, FormLegend } from '@/ui/form/form';
import { RadioButton } from './radio';

const meta: Meta<RadioButton> = {
    title: 'Components/Radio Button',
    component: RadioButton,
    decorators: [
        moduleMetadata({
            imports: [
                RadioButton,
                FormsModule,
                Fieldset,
                FormGroup,
                FormHeader,
                FormItem,
                FormLegend,
                ContentDensityDirective
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Radio buttons select exactly one option of a small set. Group them with the same `name`; ' +
                    'arrow keys move the selection inside the group, as with native radio buttons.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<RadioButton>;

const group = (legend: string, name: string, model: string, extra = '', inline = false) => `
    <fieldset fdFieldset class="mb-4">
        <legend fdFormLegend>${legend}</legend>
        <fd-form-group ${inline ? 'isInline' : ''}>
            <div fdFormItem><fd-radio-button name="${name}" value="val1" [(ngModel)]="${model}" ${extra}>Option One</fd-radio-button></div>
            <div fdFormItem><fd-radio-button name="${name}" value="val2" [(ngModel)]="${model}">Option Two</fd-radio-button></div>
            <div fdFormItem><fd-radio-button name="${name}" value="val3" [(ngModel)]="${model}">Option Three</fd-radio-button></div>
        </fd-form-group>
    </fieldset>`;

export const Examples: Story = {
    render: () => ({
        props: { v: { a: 'val1', b: 'val2', c: 'val1' } },
        template: `
            <h4 fdFormHeader class="mb-4">Radio Buttons Examples</h4>
            ${group('Radio buttons', 'radio-1', 'v.a')}
            ${group('Radio buttons disabled', 'radio-2', 'v.b', 'disabled')}
            ${group('Radio buttons - Inline', 'radio-3', 'v.c', '', true)}
            <p class="text-sap-font-small-size text-sap-content-label-color">Values: {{ v.a }}, {{ v.b }}, {{ v.c }}</p>`
    })
};

const statesTemplate = (name: string) => `
    <fd-form-group>
        <div fdFormItem><fd-radio-button name="${name}" value="val0" state="default" [(ngModel)]="value">Default Option</fd-radio-button></div>
        <div fdFormItem><fd-radio-button name="${name}" value="val1" state="success" [(ngModel)]="value">Valid(Success) Option</fd-radio-button></div>
        <div fdFormItem><fd-radio-button name="${name}" value="val2" state="warning" [(ngModel)]="value">Warning Option</fd-radio-button></div>
        <div fdFormItem><fd-radio-button name="${name}" value="val3" state="error" [(ngModel)]="value">Invalid(Error) Option</fd-radio-button></div>
        <div fdFormItem><fd-radio-button name="${name}" value="val4" state="information" [(ngModel)]="value">Information Option</fd-radio-button></div>
        <div fdFormItem><fd-radio-button name="${name}" value="val5" readOnly [(ngModel)]="value">Read-only Option</fd-radio-button></div>
    </fd-form-group>`;

export const States: Story = {
    render: () => ({
        props: { value: 'val1' },
        template: `
            <div class="flex flex-wrap gap-12">
                <fieldset fdFieldset><legend fdFormLegend>Radio button States</legend>${statesTemplate('radio-4')}</fieldset>
                <fieldset fdFieldset fdCompact><legend fdFormLegend>Radio button States compact mode</legend>${statesTemplate('radio-5')}</fieldset>
            </div>`
    })
};

export const Truncation: Story = {
    name: 'Label wrapping and truncation',
    render: () => ({
        props: { value: 'a' },
        template: `
            <div class="flex w-80 flex-col">
                <fd-radio-button name="trunc" value="a" [(ngModel)]="value">A very long label that is truncated because it does not fit into the available width</fd-radio-button>
                <fd-radio-button name="trunc" value="b" [(ngModel)]="value" wrapLabel>A very long label that wraps onto several lines because wrapLabel is set on the radio button</fd-radio-button>
                <fd-radio-button name="trunc" value="c" [(ngModel)]="value" wrapLabel valignLabel="top">A very long label that wraps and keeps the radio button aligned to the top of the first line</fd-radio-button>
            </div>`
    })
};
