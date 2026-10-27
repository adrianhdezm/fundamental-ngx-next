import { JsonPipe } from '@angular/common';
import { FormControl as NgFormControl, FormGroup as NgFormGroup, ReactiveFormsModule } from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { Fieldset, FormHeader, FormItem, FormLabel } from '@/ui/form/form';
import { FormInputMessageGroup } from '@/ui/form/form-input-message-group';
import { FormMessage } from '@/ui/form/form-message';
import { Link } from '@/ui/link/link';
import { FormControl } from './input';

/** Fields with value state messages, shared by the story and its open variant. */
const VALUE_STATE_MESSAGES = `
            <div class="flex max-w-md flex-col gap-4">
                <div fdFormItem>
                    <label fdFormLabel for="input-success">Email Address</label>
                    <fd-form-input-message-group>
                        <input fdFormControl id="input-success" placeholder="your.name&#64;company.com" state="success" />
                        <fd-form-message type="success">Email format is valid and the domain is verified. You will receive notifications at this address.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="input-error">VAT Number - Message appears on hover</label>
                    <fd-form-input-message-group [triggers]="['mouseenter', 'mouseleave']">
                        <input fdFormControl id="input-error" placeholder="DE123456789" state="error" />
                        <fd-form-message type="error">Invalid VAT number format. Must start with <b>country code</b> (2 letters) followed by <b>9-12 digits</b>. See <a fdLink href="#">validation rules</a>.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="input-warning">Purchase Order Amount</label>
                    <fd-form-input-message-group>
                        <input fdFormControl id="input-warning" placeholder="0.00" state="warning" />
                        <fd-form-message type="warning">The amount exceeds your approval limit and needs a second approval.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="input-info">Cost Center</label>
                    <fd-form-input-message-group>
                        <input fdFormControl id="input-info" placeholder="CC-1000" state="information" />
                        <fd-form-message type="information">The cost center is taken from your user profile.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
            </div>`;

const meta: Meta<FormControl> = {
    title: 'Components/Input',
    component: FormControl,
    decorators: [
        moduleMetadata({
            imports: [
                FormControl,
                FormItem,
                FormLabel,
                FormHeader,
                Fieldset,
                FormMessage,
                FormInputMessageGroup,
                ContentDensityDirective,
                ReactiveFormsModule,
                JsonPipe,
                Link
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Text fields for a single line (`<input fdFormControl>`) or several lines (`<textarea fdFormControl>`). ' +
                    'Pair every field with a label, and use value states with a form message that explains them.'
            }
        }
    },
    argTypes: { state: { control: 'select', options: ['default', 'success', 'error', 'warning', 'information'] } },
    args: { state: 'default' }
};
export default meta;
type Story = StoryObj<FormControl>;

export const Playground: Story = {
    render: (args) => ({
        props: args,
        template: `<div class="max-w-sm"><input fdFormControl ${argsToTemplate(args)} placeholder="Field placeholder text" aria-label="Playground" /></div>`
    })
};

export const Examples: Story = {
    render: () => ({
        template: `
            <div class="flex max-w-md flex-col gap-2">
                <h4 fdFormHeader>Examples</h4>
                <div fdFormItem>
                    <label fdFormLabel for="input-1" colon>Default Input</label>
                    <input fdFormControl id="input-1" placeholder="Field placeholder text" />
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="input-2" required colon>Required Input</label>
                    <input fdFormControl id="input-2" placeholder="Field placeholder text" aria-required="true" />
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="input-3">Password</label>
                    <input fdFormControl id="input-3" type="password" placeholder="Field placeholder text" />
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="input-4">Compact</label>
                    <input fdFormControl fdCompact id="input-4" placeholder="Field placeholder text" />
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="input-5">Number without spinner</label>
                    <input fdFormControl noNumberSpinner type="number" id="input-5" value="42" />
                </div>
            </div>`
    })
};

export const States: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Read-only fields show a dotted line; disabled fields are dimmed and not focusable.'
            }
        }
    },
    render: () => ({
        props: { states: ['default', 'success', 'information', 'warning', 'error'] },
        template: `
            <div class="flex max-w-md flex-col gap-2">
                @for (s of states; track s) {
                    <div fdFormItem>
                        <label fdFormLabel [for]="'state-' + s">{{ s }}</label>
                        <input fdFormControl [id]="'state-' + s" [state]="s" placeholder="Field placeholder text" />
                    </div>
                }
                <div fdFormItem>
                    <label fdFormLabel for="state-ro">Read-only</label>
                    <input fdFormControl id="state-ro" readonly value="Read-only value" />
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="state-dis" disabled>Disabled</label>
                    <input fdFormControl id="state-dis" disabled value="Disabled value" />
                </div>
            </div>`
    })
};

export const ValueStateMessages: Story = {
    name: 'Value state messages',
    parameters: {
        docs: {
            description: {
                story: 'A form input message group shows the message under the field (on focus by default) and links it with aria-describedby.'
            }
        }
    },
    render: () => ({ template: VALUE_STATE_MESSAGES })
};

export const InlineHelp: Story = {
    name: 'Inline help',
    render: () => ({
        template: `
            <div class="flex max-w-md flex-col gap-2">
                <div fdFormItem>
                    <label fdFormLabel for="input-41" inlineHelpContent="Inline Help">Input with inline help</label>
                    <input fdFormControl id="input-41" placeholder="Field placeholder text" />
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="input-42" inlineHelpContent="Inline Help" inlineHelpPlacement="before">Input with inline help</label>
                    <input fdFormControl id="input-42" placeholder="Field placeholder text" />
                </div>
            </div>`
    })
};

export const ReactiveForms: Story = {
    name: 'Reactive forms',
    render: () => {
        const form = new NgFormGroup({
            inputControl: new NgFormControl('Default value'),
            disabledInputControl: new NgFormControl({ value: 'Disabled value', disabled: true })
        });
        return {
            props: { form },
            template: `
                <form [formGroup]="form" class="flex max-w-md flex-col gap-2">
                    <div fdFormItem>
                        <label fdFormLabel for="form-input-1">Default Input:</label>
                        <input fdFormControl formControlName="inputControl" id="form-input-1" placeholder="Field placeholder text" />
                    </div>
                    <div fdFormItem>
                        <label fdFormLabel for="form-input-2">Disabled Input:</label>
                        <input fdFormControl formControlName="disabledInputControl" id="form-input-2" />
                    </div>
                </form>
                <pre class="text-sap-font-small-size">{{ form.getRawValue() | json }}</pre>`
        };
    }
};

export const Textarea: Story = {
    render: () => ({
        template: `
            <div class="flex max-w-md flex-col gap-2">
                <h4 fdFormHeader>Form Header</h4>
                <div fdFormItem>
                    <label fdFormLabel colon for="textarea-11">Default textarea</label>
                    <textarea fdFormControl id="textarea-11" placeholder="Field placeholder text"></textarea>
                </div>
                <div fdFormItem>
                    <label fdFormLabel required for="textarea-12">Required textarea:</label>
                    <textarea fdFormControl id="textarea-12" rows="4" placeholder="Field placeholder text" aria-required="true"></textarea>
                </div>
                <div fdFormItem>
                    <label fdFormLabel required for="textarea-13">Compact and Required textarea:</label>
                    <textarea fdFormControl fdCompact id="textarea-13" placeholder="Field placeholder text" aria-required="true"></textarea>
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="textarea-14">Read-only textarea</label>
                    <textarea fdFormControl readonly id="textarea-14">Read-only text that cannot be changed.</textarea>
                </div>
                <div fdFormItem>
                    <label fdFormLabel colon for="textarea-success">Project Description</label>
                    <fd-form-input-message-group>
                        <textarea fdFormControl id="textarea-success" state="error" placeholder="Describe the project"></textarea>
                        <fd-form-message type="error">The description must have at least 20 characters.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
            </div>`
    })
};

export const TextareaInlineHelp: Story = {
    name: 'Textarea inline help',
    render: () => ({
        template: `
            <div class="flex max-w-md flex-col gap-2">
                <div fdFormItem>
                    <label fdFormLabel colon for="textarea-31" inlineHelpContent="Inline Help">Textarea with inline help</label>
                    <textarea fdFormControl id="textarea-31" placeholder="Field placeholder text"></textarea>
                </div>
            </div>`
    })
};

export const TextareaStates: Story = {
    name: 'Textarea states',
    parameters: {
        docs: {
            description: {
                story: 'Textareas with value state messages (shown on focus), plus disabled and read-only textareas.'
            }
        }
    },
    render: () => ({
        template: `
            <div class="flex max-w-md flex-col gap-4">
                <div fdFormItem>
                    <label fdFormLabel colon for="textarea-state-success">Project Description</label>
                    <fd-form-input-message-group>
                        <textarea fdFormControl id="textarea-state-success" state="success" placeholder="Describe the project scope and objectives"></textarea>
                        <fd-form-message type="success">Description meets the <b>minimum requirement</b> of 100 characters. You can submit the form.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel colon for="textarea-state-error">Security Policy</label>
                    <fd-form-input-message-group>
                        <textarea fdFormControl id="textarea-state-error" state="error" aria-errormessage="textarea-state-error-message" placeholder="Define security requirements and compliance standards"></textarea>
                        <fd-form-message type="error" id="textarea-state-error-message">Policy must include <code>authentication</code>, <code>authorization</code>, and <code>data encryption</code> sections. See <a fdLink href="#">template</a>.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel colon for="textarea-state-warning">Customer Feedback</label>
                    <fd-form-input-message-group>
                        <textarea fdFormControl id="textarea-state-warning" state="warning" placeholder="Enter customer comments and concerns"></textarea>
                        <fd-form-message type="warning">This feedback contains <b>potentially sensitive information</b>. Ensure proper data handling before submission.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel colon for="textarea-state-info">Release Notes</label>
                    <fd-form-input-message-group>
                        <textarea fdFormControl id="textarea-state-info" state="information" placeholder="List new features, improvements, and bug fixes"></textarea>
                        <fd-form-message type="information">Use <code>markdown</code> formatting for better readability. Include ticket references in format <code>JIRA-1234</code>.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel colon disabled for="textarea-state-disabled">System Logs (Processing)</label>
                    <textarea fdFormControl id="textarea-state-disabled" disabled placeholder="Logs are being processed..."></textarea>
                </div>
                <div fdFormItem>
                    <label fdFormLabel colon for="textarea-state-readonly">Terms and Conditions</label>
                    <textarea fdFormControl id="textarea-state-readonly" readonly>Standard terms (non-editable)</textarea>
                </div>
            </div>`
    })
};

export const TextareaReactiveForms: Story = {
    name: 'Textarea reactive forms',
    render: () => {
        const form = new NgFormGroup({
            textAreaControl: new NgFormControl(''),
            disabledTextAreaControl: new NgFormControl({ value: 'Disabled value', disabled: true })
        });
        return {
            props: { form },
            template: `
                <form [formGroup]="form" class="max-w-md">
                    <fieldset fdFieldset>
                        <div fdFormItem>
                            <label fdFormLabel colon for="textarea-21">Textarea</label>
                            <textarea fdFormControl formControlName="textAreaControl" id="textarea-21" placeholder="Field placeholder text"></textarea>
                        </div>
                        <div fdFormItem>
                            <label fdFormLabel colon for="textarea-22">Disabled Textarea</label>
                            <textarea fdFormControl formControlName="disabledTextAreaControl" id="textarea-22" placeholder="Field placeholder text"></textarea>
                        </div>
                    </fieldset>
                </form>
                <pre class="text-sap-font-small-size">Value: {{ form.getRawValue() | json }}
Touched: {{ form.touched }}  Dirty: {{ form.dirty }}  Valid: {{ form.valid }}</pre>`
        };
    }
};

/** Points at the error field (its message opens on hover) so axe checks the open message popover with rich content. */
export const OpenValueStateMessage: Story = {
    name: 'Open: value state message',
    tags: ['!autodocs'],
    render: () => ({ template: VALUE_STATE_MESSAGES }),
    play: async ({ canvasElement }) => {
        const input = canvasElement.querySelector<HTMLInputElement>('#input-error')!;
        await userEvent.click(input);
        await waitFor(() =>
            expect(document.querySelector('.cdk-overlay-container fd-form-message')?.textContent).toContain(
                'Invalid VAT number format'
            )
        );
    }
};
