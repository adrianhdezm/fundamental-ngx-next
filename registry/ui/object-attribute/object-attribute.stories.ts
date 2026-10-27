import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { ObjectAttribute } from './object-attribute';

const heading = 'm-0 mt-6 mb-2 text-sap-font-header6-size font-sap-font-header-family text-sap-title-color first:mt-0';

const meta: Meta<ObjectAttribute> = {
    title: 'Components/Object Attribute',
    component: ObjectAttribute,
    decorators: [moduleMetadata({ imports: [ObjectAttribute] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Object attributes show a single-line property of an object, truncated with an ellipsis. The value can be an action link.'
            }
        }
    },
    args: { label: 'Owner: ', linkText: 'Jane Doe', isLink: true, disabled: false }
};
export default meta;
type Story = StoryObj<ObjectAttribute>;

export const Playground: Story = {
    render: (args) => ({ props: args, template: `<fd-object-attribute ${argsToTemplate(args)} />` })
};

export const Default: Story = {
    name: 'Text, links and truncation',
    render: () => ({
        props: { clicks: 0 },
        template: `
            <h3 class="${heading}">Text</h3>
            <fd-object-attribute label="Text placed inside attribute">: Checked</fd-object-attribute>
            <h3 class="${heading}">Link with an action</h3>
            <fd-object-attribute isLink label="Check" linkText="Notify action" (objectAttributeClick)="clicks = clicks + 1">: </fd-object-attribute>
            <p class="m-0 mt-1 text-sap-font-small-size text-sap-content-label-color">Clicked {{ clicks }} times</p>
            <h3 class="${heading}">Disabled link</h3>
            <fd-object-attribute isLink disabled linkText="Navigate to home" />
            <h3 class="${heading}">Truncation in a 120px container</h3>
            <div class="w-[120px]"><fd-object-attribute label="very very very very Looooooooooooooooooooooong Text" /></div>`
    })
};
