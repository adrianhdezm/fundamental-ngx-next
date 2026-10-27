import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { GenericTag } from './generic-tag';

const meta: Meta<GenericTag> = {
    title: 'Components/Generic Tag',
    component: GenericTag,
    decorators: [moduleMetadata({ imports: [GenericTag] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Generic tags show a key figure of an object (a name and a value) with an optional status, typically in an object page header.'
            }
        }
    },
    argTypes: { type: { control: 'select', options: [null, 'error', 'success', 'warning', 'information'] } },
    args: { name: 'Product Cost', value: '3.5M EUR', type: null }
};
export default meta;
type Story = StoryObj<GenericTag>;

export const Playground: Story = {
    render: (args) => ({ props: args, template: `<div fd-generic-tag ${argsToTemplate(args)}></div>` })
};

export const Default: Story = {
    name: 'Types',
    render: () => ({
        template: `
            <div fd-generic-tag name="Product Cost" value="3.5M EUR"></div>
            <div fd-generic-tag type="error" name="Error" value="3.5M EUR"></div>
            <div fd-generic-tag type="success" name="Success" value="3.5M EUR"></div>
            <div fd-generic-tag type="information" name="Information" value="3.5M EUR"></div>
            <div fd-generic-tag type="warning" name="Warning" value="3.5M EUR" ariaRoleDescription="Warning Generic Tag"></div>
            <div fd-generic-tag type="warning" name="Name only"></div>`
    })
};
