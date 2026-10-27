import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Skeleton } from './skeleton';

const row = 'flex flex-wrap items-start gap-4';
const heading = 'm-0 mt-6 mb-2 text-sap-font-header6-size font-sap-font-header-family text-sap-title-color first:mt-0';

const meta: Meta<Skeleton> = {
    title: 'Components/Skeleton',
    component: Skeleton,
    decorators: [moduleMetadata({ imports: [Skeleton] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Skeletons are shimmering placeholders shaped like the content that is still loading: rectangles, circles, text lines or any SVG shapes you project.'
            }
        }
    },
    argTypes: { type: { control: 'select', options: [null, 'rectangle', 'circle', 'text'] } },
    args: { type: 'rectangle', width: '100px', height: '50px', animated: true, textLines: 3 }
};
export default meta;
type Story = StoryObj<Skeleton>;

export const Playground: Story = {
    render: (args) => ({ props: args, template: `<fd-skeleton ${argsToTemplate(args)} />` })
};

export const Types: Story = {
    render: () => ({
        template: `
            <h3 class="${heading}">Rectangle</h3>
            <div class="${row}">
                <fd-skeleton type="rectangle" width="100px" height="50px" />
                <fd-skeleton type="rectangle" width="100px" height="50px" [animated]="false" />
            </div>
            <h3 class="${heading}">Circle (width or height is enough)</h3>
            <div class="${row}">
                <fd-skeleton type="circle" width="50px" />
                <fd-skeleton type="circle" height="50px" [animated]="false" />
            </div>
            <h3 class="${heading}">Text: 3 lines (default), 2 lines and 1 line</h3>
            <div class="${row}">
                <fd-skeleton type="text" width="100px" />
                <fd-skeleton type="text" width="100px" [animated]="false" />
                <fd-skeleton type="text" width="100px" textLines="2" />
                <fd-skeleton type="text" width="100px" textLines="1" />
            </div>`
    })
};

export const Custom: Story = {
    name: 'Custom shapes',
    render: () => ({
        template: `
            <fd-skeleton width="160px" height="110px">
                <svg:circle cx="25" cy="25" r="25" />
                <svg:rect x="60" y="0" width="100" height="16" rx="4" />
                <svg:rect x="60" y="30" width="60" height="12" rx="4" />
                <svg:rect x="0" y="60" width="160" height="8" rx="4" />
                <svg:rect x="0" y="80" width="160" height="8" rx="4" />
                <svg:rect x="0" y="100" width="100" height="8" rx="4" />
            </fd-skeleton>`
    })
};
