import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Icon } from '@/ui/icon/icon';
import { Link } from './link';

const meta: Meta<Link> = {
    title: 'Components/Link',
    component: Link,
    decorators: [moduleMetadata({ imports: [Link, Icon] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Links navigate to another page or open external content. Use buttons for actions. ' +
                    'Emphasized and subtle links add a hidden hint for screen readers.'
            }
        }
    },
    args: { emphasized: false, subtle: false, undecorated: false, inverted: false, disabled: false, touchTarget: false }
};
export default meta;
type Story = StoryObj<Link>;

export const Playground: Story = {
    render: (args) => ({ props: args, template: `<a fdLink href="#" ${argsToTemplate(args)}>Link text</a>` })
};

export const Standard: Story = {
    render: () => ({
        template: `
            <div class="flex flex-col items-start gap-4">
                <a fdLink href="#">Standard Link</a>
                <a fdLink href="https://www.sap.com" target="_blank" rel="noopener noreferrer">External Link (href)</a>
            </div>
        `
    })
};

export const VisualModifiers: Story = {
    name: 'Visual modifiers',
    render: () => ({
        template: `
            <div class="flex flex-col items-start gap-4">
                <a fdLink href="#" emphasized>Emphasized Link</a>
                <a fdLink href="#" subtle>Subtle Link</a>
                <a fdLink href="#" undecorated>Undecorated Link</a>
                <a fdLink href="#" subtle undecorated>Subtle Undecorated Link</a>
            </div>
        `
    })
};

export const Inverted: Story = {
    render: () => ({
        template: `
            <div class="rounded-sap-field-border-corner-radius bg-sap-shell-color p-4">
                <a fdLink href="#" inverted>Inverted Link</a>
            </div>
        `
    })
};

export const States: Story = {
    render: () => ({
        template: `
            <div class="flex flex-col items-start gap-4">
                <a fdLink href="#" disabled>Disabled Link</a>
                <a fdLink href="#" touchTarget>Touch Target Link</a>
                <p class="max-w-64">Long links wrap: <a fdLink href="#">this link has a long text that wraps onto the next line</a>.</p>
            </div>
        `
    })
};

export const Icons: Story = {
    name: 'Icon support',
    render: () => ({
        template: `
            <div class="flex flex-col items-start gap-4">
                <a fdLink href="#">Icon Right Link <fd-icon glyph="arrow-right" /></a>
                <a fdLink href="#"><fd-icon glyph="arrow-left" /> Icon Left Link</a>
                <a fdLink href="#"><fd-icon glyph="arrow-left" /> Link with Both Icons <fd-icon glyph="arrow-right" /></a>
                <a fdLink href="#" emphasized><fd-icon glyph="arrow-right" /> Emphasized Link with Icon</a>
            </div>
        `
    })
};
