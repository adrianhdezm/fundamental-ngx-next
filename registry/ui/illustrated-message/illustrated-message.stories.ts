import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { NO_MAIL, UNABLE_TO_LOAD } from '../../../docs/assets/illustrations';
import {
    IllustratedMessage,
    IllustratedMessageActions,
    IllustratedMessageFigcaption,
    IllustratedMessageText,
    IllustratedMessageTitle
} from './illustrated-message';

const message = (type: string, config = 'noMail', title = 'No mail', extra = '') => `
    <figure fd-illustrated-message ${type ? `type="${type}"` : ''} [svgConfig]="${config}" ${extra}>
        <figcaption fd-illustrated-message-figcaption>
            <h3 fd-illustrated-message-title>${title}</h3>
            <p fd-illustrated-message-text>
                Your inbox is empty. New messages appear here; check again later or refresh.
            </p>
        </figcaption>
        <fd-illustrated-message-actions>
            <button fdButton variant="emphasized" label="Refresh"></button>
            <button fdButton label="Settings"></button>
        </fd-illustrated-message-actions>
    </figure>`;

const meta: Meta<IllustratedMessage> = {
    title: 'Components/Illustrated Message',
    component: IllustratedMessage,
    decorators: [
        moduleMetadata({
            imports: [
                IllustratedMessage,
                IllustratedMessageFigcaption,
                IllustratedMessageTitle,
                IllustratedMessageText,
                IllustratedMessageActions,
                Button
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'An illustrated message pairs an SAP illustration with a title, a text and actions, for empty states, errors and onboarding. ' +
                    'Sizes: scene (large), dialog (medium), spot (small), dot (extra small) and base (text only); without a `type` it follows the available width. ' +
                    'Illustrations come from a sprite URL or inline SVG per size (the stories use SAP illustrations from @ui5/webcomponents-fiori).'
            }
        }
    }
};
export default meta;
type Story = StoryObj<IllustratedMessage>;

const props = { noMail: NO_MAIL, unableToLoad: UNABLE_TO_LOAD };

export const Scene: Story = { name: 'Scene', render: () => ({ props, template: message('scene') }) };
export const Dialog: Story = {
    name: 'Dialog',
    render: () => ({ props, template: message('dialog', 'unableToLoad', 'Unable to load data') })
};
export const Spot: Story = { name: 'Spot', render: () => ({ props, template: message('spot') }) };
export const Dot: Story = {
    name: 'Dot',
    render: () => ({ props, template: `<div class="flex items-start gap-4 max-w-sm">${message('dot')}</div>` })
};
export const Responsive: Story = {
    name: 'Responsive (resize the box)',
    render: () => ({
        props,
        template: `<div class="resize-x overflow-hidden border border-dashed border-sap-group-content-border-color" style="width: 30rem">${message('', 'noMail', 'No mail', 'svgAriaLabel="Empty mailbox"')}</div>`
    })
};
export const TextOnly: Story = {
    name: 'Without illustration',
    render: () => ({ props, template: message('dialog', 'noMail', 'No mail', 'noSvg') })
};
