import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '@/ui/button/button';
import { Checkbox } from '@/ui/checkbox/checkbox';
import { Icon } from '@/ui/icon/icon';
import { FormControl } from '@/ui/input/input';
import { Title } from '@/ui/title/title';
import { Toolbar, ToolbarItem, ToolbarLabel, ToolbarOverflowButton, ToolbarSeparator, ToolbarSpacer } from './toolbar';

const IMPORTS = [
    Toolbar,
    ToolbarItem,
    ToolbarLabel,
    ToolbarOverflowButton,
    ToolbarSeparator,
    ToolbarSpacer,
    Button,
    Checkbox,
    FormControl,
    Icon,
    Title
];
const col = 'flex flex-col gap-6';

const meta: Meta<Toolbar> = {
    title: 'Components/Toolbar',
    component: Toolbar,
    decorators: [moduleMetadata({ imports: IMPORTS })],
    parameters: {
        docs: {
            description: {
                component:
                    'Toolbars hold a title and actions. With shouldOverflow, items that do not fit move into an overflow popover, by priority (fdOverflowPriority) and group (fdOverflowGroup).'
            }
        }
    },
    argTypes: { fdType: { control: 'select', options: ['solid', 'transparent', 'auto', 'info'] } },
    args: { fdType: 'solid', title: 'Products', clearBorder: false, shouldOverflow: true }
};
export default meta;
type Story = StoryObj<Toolbar>;

export const Playground: Story = {
    render: (args) => ({
        props: args,
        template: `
            <div class="resize-x overflow-hidden border border-dashed border-sap-group-content-border-color p-1" style="width: 40rem; min-width: 12rem">
                <fd-toolbar ${argsToTemplate(args)}>
                    <fd-toolbar-spacer />
                    <button fdButton fdToolbarOverflowButton variant="transparent" label="Add"></button>
                    <button fdButton fdToolbarOverflowButton variant="transparent" label="Edit"></button>
                    <button fdButton fdToolbarOverflowButton fdOverflowPriority="low" variant="transparent" label="Export"></button>
                    <button fdButton fdToolbarOverflowButton fdOverflowPriority="low" variant="transparent" label="Share"></button>
                    <button fdButton fdToolbarOverflowButton fdOverflowPriority="never" variant="transparent" glyph="action-settings" ariaLabel="Settings"></button>
                </fd-toolbar>
            </div>
            <p class="m-0 mt-2 text-sap-font-small-size text-sap-content-label-color">Drag the bottom-right corner to resize.</p>`
    })
};

export const Types: Story = {
    render: () => ({
        template: `
            <div class="${col}">
                <fd-toolbar fdType="solid" ariaLabel="Solid toolbar"><span fd-toolbar-label>Solid</span></fd-toolbar>
                <fd-toolbar fdType="auto" ariaLabel="Auto toolbar"><span fd-toolbar-label>Auto</span></fd-toolbar>
                <fd-toolbar fdType="transparent" clearBorder ariaLabel="Transparent toolbar"><span fd-toolbar-label>Transparent</span></fd-toolbar>
                <fd-toolbar fdType="info" ariaLabel="Info toolbar"><span fd-toolbar-label>Info</span></fd-toolbar>
                <fd-toolbar fdType="info" active ariaLabel="Active info toolbar"><fd-icon glyph="filter" /><span fd-toolbar-label>Info active: filtered by Category</span></fd-toolbar>
            </div>`
    })
};

export const TitleSpacerSeparator: Story = {
    name: 'Title, spacer and separator',
    render: () => ({
        template: `
            <div class="${col}">
                <fd-toolbar title="Toolbar title">
                    <fd-toolbar-spacer />
                    <button fdButton variant="transparent" label="Add"></button>
                    <fd-toolbar-separator />
                    <button fdButton variant="transparent" glyph="sort" ariaLabel="Sort"></button>
                    <button fdButton variant="transparent" glyph="filter" ariaLabel="Filter"></button>
                </fd-toolbar>
                <fd-toolbar ariaLabel="Fixed spacer">
                    <button fdButton variant="transparent" label="Left"></button>
                    <fd-toolbar-spacer fixed width="100px" />
                    <button fdButton variant="transparent" label="After 100px"></button>
                    <fd-toolbar-spacer />
                    <button fdButton variant="transparent" label="Right"></button>
                </fd-toolbar>
            </div>`
    })
};

export const Overflow: Story = {
    name: 'Overflow priorities and groups',
    render: () => ({
        template: `
            <div class="${col} max-w-xl">
                <fd-toolbar shouldOverflow ariaLabel="Overflow priorities">
                    <button fdButton fdToolbarOverflowButton label="Button First"></button>
                    <button fdButton fdToolbarOverflowButton label="Always" fdOverflowPriority="always"></button>
                    <button fdButton fdToolbarOverflowButton label="Never" fdOverflowPriority="never"></button>
                    <button fdButton fdToolbarOverflowButton label="Low" fdOverflowPriority="low"></button>
                    <fd-toolbar-spacer />
                    <button fdButton fdToolbarOverflowButton label="High" fdOverflowPriority="high"></button>
                    <button fdButton fdToolbarOverflowButton label="Disappear" fdOverflowPriority="disappear"></button>
                    <button fdButton fdToolbarOverflowButton label="Button Last"></button>
                </fd-toolbar>
                <fd-toolbar shouldOverflow ariaLabel="Overflow groups">
                    <button fdButton fdToolbarOverflowButton label="Button"></button>
                    <button fdButton fdToolbarOverflowButton fdOverflowPriority="never" label="Never"></button>
                    <button fdButton fdToolbarOverflowButton fdOverflowPriority="low" [fdOverflowGroup]="1" label="Gr 1 / Low"></button>
                    <button fdButton fdToolbarOverflowButton fdOverflowPriority="low" [fdOverflowGroup]="2" label="Gr 2 / Low"></button>
                    <button fdButton fdToolbarOverflowButton fdOverflowPriority="low" [fdOverflowGroup]="2" label="Gr 2 / Low"></button>
                    <button fdButton fdToolbarOverflowButton fdOverflowPriority="high" [fdOverflowGroup]="1" label="Gr 1 / High"></button>
                </fd-toolbar>
                <fd-toolbar shouldOverflow ariaLabel="Overflow with form controls">
                    <span fd-toolbar-label>Search</span>
                    <input fdFormControl fd-toolbar-item class="w-40" aria-label="Search" placeholder="Search" />
                    <fd-checkbox fd-toolbar-item label="Only mine" />
                    <button fdButton fdToolbarOverflowButton label="Apply"></button>
                    <button fdButton fdToolbarOverflowButton label="Reset" fdOverflowPriority="low"></button>
                    <button fdButton fdToolbarOverflowButton label="Save View" fdOverflowPriority="low"></button>
                </fd-toolbar>
            </div>`
    })
};

/** Clicks the overflow button of the first toolbar of the story and waits for its popover. */
async function openOverflow(canvasElement: HTMLElement): Promise<void> {
    const more = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>('fd-toolbar fd-popover-control button');
        expect(el).not.toBeNull();
        return el!;
    });
    await userEvent.click(more);
    await waitFor(() => expect(document.querySelector('.cdk-overlay-pane [data-toolbar-overflow]')).not.toBeNull());
}

export const OpenOverflow: Story = {
    name: 'Open: overflow',
    tags: ['!autodocs'],
    render: Overflow.render,
    play: ({ canvasElement }) => openOverflow(canvasElement)
};
