import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { FormControl } from '@/ui/input/input';
import { Fieldset, FormGroup, FormGroupHeader, FormHeader, FormItem, FormLabel, FormLegend } from './form';
import { FormMessage } from './form-message';

const meta: Meta = {
    title: 'Components/Form',
    decorators: [
        moduleMetadata({
            imports: [
                FormControl,
                Fieldset,
                FormGroup,
                FormGroupHeader,
                FormHeader,
                FormItem,
                FormLabel,
                FormLegend,
                FormMessage
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Building blocks for forms: header, fieldset and legend, groups, items, labels with required/colon ' +
                    'markers and inline help, and value state messages.'
            }
        }
    }
};
export default meta;
type Story = StoryObj;

export const Labels: Story = {
    render: () => ({
        template: `
            <div class="flex max-w-md flex-col gap-3">
                <div fdFormItem><label fdFormLabel for="l1">Default label</label><input fdFormControl id="l1" /></div>
                <div fdFormItem><label fdFormLabel for="l2" required>Required label</label><input fdFormControl id="l2" /></div>
                <div fdFormItem><label fdFormLabel for="l3" colon>Label with colon</label><input fdFormControl id="l3" /></div>
                <div fdFormItem><label fdFormLabel for="l4" required colon>Required with colon</label><input fdFormControl id="l4" /></div>
                <div fdFormItem><label fdFormLabel for="l5" inlineHelpContent="Help text for this field">With inline help</label><input fdFormControl id="l5" /></div>
                <div fdFormItem><label fdFormLabel for="l6" disabled>Disabled label</label><input fdFormControl id="l6" disabled /></div>
                <div fdFormItem class="w-48"><label fdFormLabel for="l7" allowWrap>A long label that is allowed to wrap onto several lines</label><input fdFormControl id="l7" /></div>
                <div fdFormItem horizontal><label fdFormLabel for="l8">Horizontal</label><input fdFormControl id="l8" /><label fdFormLabel unitDescription>EUR</label></div>
            </div>`
    })
};

export const FieldsetAndGroups: Story = {
    name: 'Fieldset and groups',
    render: () => ({
        template: `
            <h4 fdFormHeader>Address</h4>
            <fieldset fdFieldset class="mt-4 max-w-lg">
                <legend fdFormLegend>Shipping address</legend>
                <fd-form-group withSpacing>
                    <div fdFormItem><label fdFormLabel for="g1" required>Street</label><input fdFormControl id="g1" /></div>
                    <div fdFormItem><label fdFormLabel for="g2">City</label><input fdFormControl id="g2" /></div>
                </fd-form-group>
            </fieldset>
            <fieldset fdFieldset class="mt-4 max-w-lg">
                <legend fdFormLegend>Inline group</legend>
                <fd-form-group isInline withSpacing>
                    <div fdFormItem isInline><label fdFormLabel for="g3">Postal code</label><input fdFormControl id="g3" /></div>
                    <div fdFormItem isInline><label fdFormLabel for="g4">Country</label><input fdFormControl id="g4" /></div>
                </fd-form-group>
            </fieldset>
            <div class="mt-4 max-w-lg">
                <div fdFormGroupHeader>Group header</div>
            </div>`
    })
};

export const Messages: Story = {
    render: () => ({
        props: { types: ['error', 'warning', 'success', 'information'] },
        template: `
            <div class="flex flex-col gap-3">
                @for (t of types; track t) {
                    <fd-form-message [type]="t">This is a {{ t }} message that explains the value state of a field.</fd-form-message>
                }
                <fd-form-message type="information" static>Static message</fd-form-message>
                <fd-form-message type="warning" embedded>Embedded message without shadow</fd-form-message>
            </div>`
    })
};
