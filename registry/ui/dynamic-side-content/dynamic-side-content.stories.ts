import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { DynamicSideContent, DynamicSideContentMain, DynamicSideContentSide } from './dynamic-side-content';

const meta: Meta<DynamicSideContent> = {
    title: 'Components/Dynamic Side Content',
    component: DynamicSideContent,
    decorators: [moduleMetadata({ imports: [DynamicSideContent, DynamicSideContentMain, DynamicSideContentSide] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Dynamic side content shows supplementary content next to (left or right), below or in an equal split with the main content. The size hides the side content (sm, for small screens) or sets the share of the main content (md and lg: two thirds, xl: three quarters). With position none or equalSplit the projected order is kept; left, right and bottom place the side content regardless of the order.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<DynamicSideContent>;

const BOX =
    'flex h-20 items-center justify-center border border-solid border-sap-list-border-color bg-sap-group-content-background';
const HEADING = 'm-0 mt-4 mb-2 font-sap-font-family text-sap-font-header5-size font-bold text-sap-title-color';

const layout = (attrs: string, sideFirst = false) => {
    const main = `<fd-dynamic-side-content-main><div class="${BOX}">Main content</div></fd-dynamic-side-content-main>`;
    const side = `<fd-dynamic-side-content-side><div class="${BOX}">Side content</div></fd-dynamic-side-content-side>`;
    return `<fd-dynamic-side-content ${attrs}>${sideFirst ? side + main : main + side}</fd-dynamic-side-content>`;
};

export const Basic: Story = {
    name: 'Projected order',
    render: () => ({
        template: `
            <h3 class="${HEADING}">Main content first</h3>${layout('')}
            <h3 class="${HEADING}">Side content first</h3>${layout('', true)}`
    })
};

export const Positioning: Story = {
    name: 'Positions',
    render: () => ({
        template: `
            <h3 class="${HEADING}">Left (side projected second)</h3>${layout('position="left"')}
            <h3 class="${HEADING}">Right (side projected first)</h3>${layout('position="right"', true)}
            <h3 class="${HEADING}">Bottom</h3>${layout('position="bottom"', true)}
            <h3 class="${HEADING}">Equal split</h3>${layout('position="equalSplit"', true)}`
    })
};

export const Sizes: Story = {
    name: 'Sizes',
    render: () => ({
        template: `
            <h3 class="${HEADING}">sm: side content hidden</h3>${layout('size="sm" position="right"')}
            <h3 class="${HEADING}">md and lg: main content two thirds</h3>${layout('size="md" position="right"')}
            <h3 class="${HEADING}">xl: main content three quarters</h3>${layout('size="xl" position="right"')}`
    })
};
