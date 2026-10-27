import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { Link } from '@/ui/link/link';
import {
    MessagePage,
    MessagePageActions,
    MessagePageMore,
    MessagePageSubtitle,
    MessagePageTitle
} from './message-page';

const meta: Meta<MessagePage> = {
    title: 'Components/Message Page',
    component: MessagePage,
    decorators: [
        moduleMetadata({
            imports: [
                MessagePage,
                MessagePageTitle,
                MessagePageSubtitle,
                MessagePageActions,
                MessagePageMore,
                Button,
                Link
            ]
        })
    ],
    argTypes: { type: { control: 'select', options: ['', 'filter', 'search', 'no-items', 'error'] } },
    parameters: {
        docs: {
            description: {
                component:
                    'A message page fills the page when there is nothing to show: no items, no search or filter results, or an error. ' +
                    'The type sets the icon; the title, subtitle and actions are announced as a polite status.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<MessagePage>;

const frame = (inner: string) => `<div class="h-[32rem]">${inner}</div>`;

export const Actions: Story = {
    name: 'With actions',
    render: () => ({
        template: frame(`
            <fd-message-page>
                <fd-message-page-title>Sorry, we can’t find this page.</fd-message-page-title>
                <fd-message-page-subtitle>
                    <b>The page might have been moved or deleted.</b> Check the address or go back to the home page.
                    <i>Contact support if the problem persists.</i>
                </fd-message-page-subtitle>
                <fd-message-page-actions>
                    <button fdButton variant="emphasized" label="Contact support"></button>
                    <button fdButton label="Reload page"></button>
                </fd-message-page-actions>
                <fd-message-page-more>
                    <button fdButton variant="transparent" label="Show details"></button>
                </fd-message-page-more>
            </fd-message-page>`)
    })
};

export const Types: Story = {
    name: 'Types',
    args: { type: 'search' },
    render: (args) => ({
        props: args,
        template: frame(`
            <fd-message-page [type]="type">
                <fd-message-page-title>No matching items found.</fd-message-page-title>
                <fd-message-page-subtitle>Check the filter settings or the search term.</fd-message-page-subtitle>
            </fd-message-page>`)
    })
};

export const Error: Story = {
    name: 'Error',
    render: () => ({
        template: frame(`
            <fd-message-page type="error">
                <fd-message-page-title>Sorry, we can’t find this page.</fd-message-page-title>
                <fd-message-page-subtitle><a fdLink href="#">Home page</a></fd-message-page-subtitle>
            </fd-message-page>`)
    })
};

export const CustomIcon: Story = {
    name: 'Custom icon and no icon',
    render: () => ({
        template: `<div class="grid h-[24rem] grid-cols-2 gap-4">
            <fd-message-page glyph="retail-store">
                <fd-message-page-title>The store is closed.</fd-message-page-title>
                <fd-message-page-more><button fdButton label="Show details"></button></fd-message-page-more>
            </fd-message-page>
            <fd-message-page [hasIcon]="false">
                <fd-message-page-title>Sorry, we can’t find this page.</fd-message-page-title>
            </fd-message-page>
        </div>`
    })
};
