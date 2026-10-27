import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { InputGroup } from '@/ui/input-group/input-group';
import { FormControl } from '@/ui/input/input';
import { Link } from '@/ui/link/link';
import { MultiInput } from '@/ui/multi-input/multi-input';
import { Fieldset, FormGroup, FormGroupHeader, FormHeader, FormItem, FormLabel, FormLegend } from './form';
import { FormInputMessageGroup } from './form-input-message-group';
import { FormMessage } from './form-message';

/** The upstream "Form Message Input Group" example: a message group around each kind of field. */
@Component({
    selector: 'story-form-message-group',
    imports: [FormItem, FormLabel, FormControl, FormInputMessageGroup, FormMessage, InputGroup, MultiInput],
    template: `
        <div class="flex max-w-md flex-col gap-10">
            <div fdFormItem>
                <label fdFormLabel for="mg-1">Account Number</label>
                <fd-form-input-message-group>
                    <input fdFormControl id="mg-1" placeholder="Enter 10-digit account number" state="information" />
                    <fd-form-message type="information">
                        Your account number is shown on your monthly statement or in the mobile app under Account
                        Settings.
                    </fd-form-message>
                </fd-form-input-message-group>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mg-2">Password Requirements</label>
                <fd-form-input-message-group placement="bottom" [triggers]="[]" [(isOpen)]="open">
                    <fd-input-group
                        inputId="mg-2"
                        state="information"
                        button
                        addOnText="Show Requirements"
                        (addOnButtonClicked)="open.set(!open())"
                    />
                    <fd-form-message type="information">
                        Password must contain at least 8 characters, including one uppercase letter, one lowercase
                        letter, one number, and one special character.
                    </fd-form-message>
                </fd-form-input-message-group>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mg-3">Country Code</label>
                <fd-form-input-message-group
                    placement="bottom"
                    [triggers]="['mouseenter', 'mouseleave', 'focusin', 'focusout']"
                >
                    <fd-input-group
                        inputId="mg-3"
                        glyph="world"
                        glyphAriaLabel="Select country code"
                        state="information"
                        button
                    />
                    <fd-form-message type="information">
                        Select your country code from the list. This determines your tax jurisdiction and available
                        payment methods.
                    </fd-form-message>
                </fd-form-input-message-group>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mg-4">Additional Comments</label>
                <fd-form-input-message-group placement="bottom">
                    <textarea
                        fdFormControl
                        id="mg-4"
                        state="information"
                        placeholder="Provide any additional details about your request"
                    ></textarea>
                    <fd-form-message type="information">
                        Please include any relevant context or special requirements. This helps our team process your
                        request more efficiently.
                    </fd-form-message>
                </fd-form-input-message-group>
            </div>
            <div fdFormItem>
                <label fdFormLabel id="mg-label-5" for="mg-5">Dietary Restrictions</label>
                <fd-form-input-message-group [triggers]="['mouseover', 'mouseout']">
                    <fd-multi-input
                        inputId="mg-5"
                        placeholder="Select all that apply"
                        state="information"
                        [dropdownValues]="diets"
                        [(selected)]="selectedDiets"
                    />
                    <fd-form-message type="information">
                        Select all dietary restrictions that apply. This information will be shared with catering for
                        company events.
                    </fd-form-message>
                </fd-form-input-message-group>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mg-6">Budget Approval Code</label>
                <fd-form-input-message-group placement="bottom" [triggers]="[]" [(isOpen)]="openRich">
                    <fd-input-group
                        inputId="mg-6"
                        state="information"
                        button
                        addOnText="Where to Find"
                        (addOnButtonClicked)="openRich.set(!openRich())"
                    />
                    <fd-form-message type="information">
                        <div>
                            Your approval code is sent via email when your budget request is approved. Check your inbox
                            for messages with subject line starting with <code>[Budget Approved]</code>.
                        </div>
                    </fd-form-message>
                </fd-form-input-message-group>
            </div>
        </div>
    `
})
class StoryFormMessageGroup {
    readonly open = signal(false);
    readonly openRich = signal(false);
    readonly diets = [
        'Vegetarian',
        'Vegan',
        'Gluten-Free',
        'Dairy-Free',
        'Nut Allergy',
        'Shellfish Allergy',
        'Kosher',
        'Halal'
    ];
    readonly selectedDiets = signal(['Vegan']);
}

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
                FormMessage,
                FormInputMessageGroup,
                Link,
                StoryFormMessageGroup
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

export const MessageGroup: Story = {
    name: 'Message group',
    parameters: {
        docs: {
            description: {
                story:
                    'A form input message group shows the message of a field in a popover: on focus by default, on hover, ' +
                    'or controlled with `[(isOpen)]` and no triggers (here from an input group button). It works with ' +
                    'inputs, input groups, textareas and multi inputs, and the message can hold rich content.'
            }
        }
    },
    render: () => ({ template: `<story-form-message-group />` })
};

export const MessageStates: Story = {
    name: 'Message states',
    render: () => ({
        template: `
            <div class="flex max-w-md flex-col gap-10">
                <div fdFormItem>
                    <label fdFormLabel for="ms-info">Employee ID</label>
                    <fd-form-input-message-group>
                        <input fdFormControl id="ms-info" placeholder="e.g., EMP12345" state="information" />
                        <fd-form-message type="information">Your employee ID can be found on your company badge or ID card.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ms-warning">Cost Center</label>
                    <fd-form-input-message-group>
                        <input fdFormControl id="ms-warning" placeholder="e.g., CC-1000" state="warning" />
                        <fd-form-message type="warning">This cost center will be retired next quarter. Please check <a fdLink href="#">Available Cost Centers</a>.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ms-error">Email Address</label>
                    <fd-form-input-message-group>
                        <input fdFormControl id="ms-error" placeholder="your.name&#64;company.com" state="error" />
                        <fd-form-message type="error">Please enter a valid email address in the format <b>name&#64;domain.com</b>.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
                <div fdFormItem>
                    <label fdFormLabel for="ms-success">Username</label>
                    <fd-form-input-message-group>
                        <input fdFormControl id="ms-success" placeholder="Choose a unique username" state="success" />
                        <fd-form-message type="success">Great! This username is available and meets all requirements.</fd-form-message>
                    </fd-form-input-message-group>
                </div>
            </div>`
    })
};
