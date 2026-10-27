import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { Panel, PanelContent, PanelTitle } from './panel';

const lorem =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ut laoreet lorem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aenean sagittis aliquam justo et suscipit. Nam molestie, magna at elementum pulvinar, nisi enim venenatis ante, id convallis mi neque nec risus.';

const meta: Meta<Panel> = {
    title: 'Components/Panel',
    component: Panel,
    decorators: [moduleMetadata({ imports: [Panel, PanelTitle, PanelContent, Button] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Panels group content under a title bar. Expandable panels show and hide their content with the arrow button; fixed panels always show it.'
            }
        }
    },
    args: { expanded: true, fixed: false, transparent: false, noRadius: false }
};
export default meta;
type Story = StoryObj<Panel>;

export const Expandable: Story = {
    render: (args) => ({
        props: args,
        template: `
            <fd-panel [(expanded)]="expanded" [fixed]="fixed" [transparent]="transparent" [noRadius]="noRadius" expandAriaLabel="Panel details" expandAriaLabelledBy="panel-title-1">
                <h4 fd-panel-title id="panel-title-1">Panel Header</h4>
                <div fd-panel-content ariaLabel="Panel content">${lorem}</div>
            </fd-panel>
            <fd-panel expandAriaLabel="Collapsed panel">
                <h4 fd-panel-title>Collapsed panel</h4>
                <div fd-panel-content ariaLabel="Collapsed panel content">${lorem}</div>
            </fd-panel>
            <p class="m-0 mt-4 text-sap-font-small-size text-sap-content-label-color">expanded: {{ expanded }}</p>`
    })
};

export const Fixed: Story = {
    name: 'Fixed, header actions, fixed height and transparent',
    render: () => ({
        template: `
            <fd-panel fixed>
                <h4 fd-panel-title>Fixed panel</h4>
                <div fd-panel-content ariaLabel="Fixed content">${lorem}</div>
            </fd-panel>
            <fd-panel [expanded]="true" expandAriaLabel="Panel with actions">
                <h4 fd-panel-title>Panel with header actions</h4>
                <button fdButton variant="transparent" label="Edit"></button>
                <button fdButton variant="transparent" glyph="delete" ariaLabel="Delete"></button>
                <div fd-panel-content ariaLabel="Content with actions">${lorem}</div>
            </fd-panel>
            <fd-panel [expanded]="true" expandAriaLabel="Fixed height panel">
                <h4 fd-panel-title>Fixed height content (scrolls)</h4>
                <div fd-panel-content ariaLabel="Scrolling content" height="5rem" tabindex="0">${lorem} ${lorem}</div>
            </fd-panel>
            <fd-panel [expanded]="true" transparent expandAriaLabel="Transparent panel">
                <h4 fd-panel-title>Transparent panel</h4>
                <div fd-panel-content ariaLabel="Transparent content">${lorem}</div>
            </fd-panel>`
    })
};
