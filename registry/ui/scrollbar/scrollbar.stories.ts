import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Scrollbar } from './scrollbar';

const text = Array.from(
    { length: 12 },
    (_, i) =>
        `<p class="m-0 mb-3 w-[48rem] text-sap-text-color">Paragraph ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>`
).join('');
const box =
    'h-48 w-full max-w-lg rounded-sap-element-border-corner-radius border border-sap-group-content-border-color bg-sap-group-content-background p-4';

const meta: Meta<Scrollbar> = {
    title: 'Components/Scrollbar',
    component: Scrollbar,
    decorators: [moduleMetadata({ imports: [Scrollbar] })],
    parameters: {
        docs: {
            description: {
                component: 'A scroll container with SAP-themed scrollbars. Either direction can be turned off.'
            }
        }
    },
    args: { noHorizontalScroll: false, noVerticalScroll: false, alwaysVisible: false }
};
export default meta;
type Story = StoryObj<Scrollbar>;

export const Playground: Story = {
    render: (args) => ({
        props: args,
        template: `<div fdScrollbar tabindex="0" aria-label="Scrollable text" ${argsToTemplate(args)} class="${box}">${text}</div>`
    })
};

export const Directions: Story = {
    render: () => ({
        template: `
            <div class="flex flex-col gap-6">
                <div fdScrollbar tabindex="0" aria-label="Both directions" class="${box}">${text}</div>
                <div fdScrollbar noHorizontalScroll tabindex="0" aria-label="Vertical only" class="${box}">${text}</div>
                <div fdScrollbar noVerticalScroll tabindex="0" aria-label="Horizontal only" class="${box}">${text}</div>
            </div>`
    })
};
