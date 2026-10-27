import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import {
    LayoutPanel,
    LayoutPanelActions,
    LayoutPanelBody,
    LayoutPanelDescription,
    LayoutPanelFilters,
    LayoutPanelFooter,
    LayoutPanelHead,
    LayoutPanelHeader,
    LayoutPanelTitle
} from './layout-panel';

const IMPORTS = [
    LayoutPanel,
    LayoutPanelHeader,
    LayoutPanelHead,
    LayoutPanelTitle,
    LayoutPanelDescription,
    LayoutPanelActions,
    LayoutPanelFilters,
    LayoutPanelBody,
    LayoutPanelFooter,
    Button
];
const col = 'flex flex-col gap-6';

const meta: Meta<LayoutPanel> = {
    title: 'Components/Layout Panel',
    component: LayoutPanel,
    decorators: [moduleMetadata({ imports: IMPORTS })],
    parameters: {
        docs: {
            description: {
                component:
                    'Layout panels are rounded content containers with a header (title, description, actions), filters, body and footer.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<LayoutPanel>;

const header = `
    <fd-layout-panel-header>
        <fd-layout-panel-head>
            <h3 fd-layout-panel-title>Layout Panel Title</h3>
            <fd-layout-panel-description>Layout panel description</fd-layout-panel-description>
        </fd-layout-panel-head>
        <fd-layout-panel-actions><button fdButton label="Action"></button></fd-layout-panel-actions>
    </fd-layout-panel-header>`;

export const Default: Story = {
    name: 'Header, filters, body and footer',
    render: () => ({
        template: `
            <div class="${col}">
                <fd-layout-panel>
                    ${header}
                    <fd-layout-panel-filters>Filters: Category, Price</fd-layout-panel-filters>
                    <fd-layout-panel-body>Layout panel body</fd-layout-panel-body>
                    <fd-layout-panel-footer position="end"><button fdButton variant="emphasized" label="Save"></button><button fdButton variant="transparent" label="Cancel"></button></fd-layout-panel-footer>
                </fd-layout-panel>
                <fd-layout-panel>
                    ${header}
                    <fd-layout-panel-body bleed><img src="assets/landscape.svg" alt="Landscape" class="block h-40 w-full object-cover" /></fd-layout-panel-body>
                    <fd-layout-panel-footer position="start">Footer at the start</fd-layout-panel-footer>
                </fd-layout-panel>
                <fd-layout-panel transparent>
                    ${header}
                    <fd-layout-panel-body>Transparent layout panel</fd-layout-panel-body>
                    <fd-layout-panel-footer>Centered footer</fd-layout-panel-footer>
                </fd-layout-panel>
            </div>`
    })
};
