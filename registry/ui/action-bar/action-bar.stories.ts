import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { Menu, MenuInteractive, MenuItem, MenuTitle, MenuTrigger } from '@/ui/menu/menu';
import {
    ActionBar,
    ActionBarActions,
    ActionBarBack,
    ActionBarDescription,
    ActionBarHeader,
    ActionBarTitle
} from './action-bar';

const IMPORTS = [
    ActionBar,
    ActionBarHeader,
    ActionBarBack,
    ActionBarTitle,
    ActionBarActions,
    ActionBarDescription,
    Button,
    Menu,
    MenuItem,
    MenuInteractive,
    MenuTitle,
    MenuTrigger
];
const col = 'flex flex-col gap-8';
const label = 'm-0 mb-2 text-sap-font-small-size text-sap-content-label-color';

const bar = (opts: { back?: boolean; title?: string; description?: string; size?: string } = {}) => `
    <div fd-action-bar ${opts.size ? `size="${opts.size}"` : ''}>
        <div fd-action-bar-header>
            ${opts.back === false ? '' : '<div fd-action-bar-back><button fdButton variant="transparent" glyph="navigation-left-arrow" ariaLabel="Back"></button></div>'}
            <div fd-action-bar-title>${opts.title ?? 'Page Title'}</div>
            <div fd-action-bar-actions>
                <button fdButton label="Cancel"></button>
                <button fdButton variant="emphasized" label="Save"></button>
            </div>
        </div>
        ${opts.description === '' ? '' : `<p fd-action-bar-description ${opts.back === false ? '' : 'withBackBtn'}>${opts.description ?? 'Action bar description'}</p>`}
    </div>`;

/** The overflow button and its menu of page actions; `menuInputs` adds inputs to the menu. */
const actionsMenu = (menuInputs = '') => `
    <button fdButton variant="transparent" glyph="overflow" ariaLabel="More" [fdMenuTrigger]="menu"></button>
    <fd-menu #menu ariaLabel="Page actions" placement="bottom-end" ${menuInputs}>
        ${['Edit', 'Delete', 'Assign', 'Expire', 'Archive']
            .map((a) => `<li fd-menu-item><div fd-menu-interactive><span fd-menu-title>${a}</span></div></li>`)
            .join('')}
    </fd-menu>`;

const meta: Meta<ActionBar> = {
    title: 'Components/Action Bar',
    component: ActionBar,
    decorators: [moduleMetadata({ imports: IMPORTS })],
    parameters: {
        docs: {
            description: {
                component:
                    'The action bar is the header of a page: back button, title, description and page actions. The back button and description are hidden below 600px.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<ActionBar>;

export const Default: Story = {
    name: 'Back button, title and description',
    render: () => ({
        template: `
            <div class="${col}">
                <div><p class="${label}">With back button</p>${bar()}</div>
                <div><p class="${label}">Without back button</p>${bar({ back: false })}</div>
                <div><p class="${label}">Without description</p>${bar({ description: '' })}</div>
                <div>
                    <p class="${label}">Long title and description are truncated</p>
                    ${bar({
                        title: 'Page Title Demo for very very very very very very very very very very very very very very very very very very very long text',
                        description:
                            'Action bar Description with a very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very long text'
                    })}
                </div>
            </div>`
    })
};

export const Sizes: Story = {
    name: 'Responsive paddings',
    render: () => ({
        template: `
            <div class="${col}">
                <div><p class="${label}">s</p>${bar({ size: 's' })}</div>
                <div><p class="${label}">m_l (default)</p>${bar({ size: 'm_l' })}</div>
                <div><p class="${label}">xl</p>${bar({ size: 'xl' })}</div>
            </div>`
    })
};

export const ContextualMenu: Story = {
    name: 'Contextual menu',
    render: () => ({
        template: `
            <div fd-action-bar>
                <div fd-action-bar-header>
                    <div fd-action-bar-title>Page Title</div>
                    <div fd-action-bar-actions>${actionsMenu()}</div>
                </div>
            </div>`
    })
};

const MOBILE = `
    <p class="${label}">Below a 600px wide viewport the back button and description are hidden; resize the window to see it. The overflow button opens the actions in a mobile menu.</p>
    <div fd-action-bar size="s">
        <div fd-action-bar-header>
            <div fd-action-bar-back><button fdButton variant="transparent" glyph="navigation-left-arrow" ariaLabel="Back"></button></div>
            <div fd-action-bar-title>Page Title</div>
            <div fd-action-bar-actions>${actionsMenu(`mobile [mobileConfig]="{ title: 'Actions', hasCloseButton: true }"`)}</div>
        </div>
        <p fd-action-bar-description withBackBtn>Action bar description</p>
    </div>`;

export const Mobile: Story = {
    name: 'Small screen',
    render: () => ({ template: MOBILE })
};
