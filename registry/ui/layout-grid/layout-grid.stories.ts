import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { LayoutGrid, LayoutGridCol, LayoutGridRow } from './layout-grid';

const block =
    'flex h-16 items-center justify-center rounded-sap-element-border-corner-radius border border-sap-indication-color-5 bg-sap-indication-color-5-background text-sap-indication-color-5-text-color';
const alt =
    'flex h-16 items-center justify-center rounded-sap-element-border-corner-radius border border-sap-indication-color-6 bg-sap-indication-color-6-background text-sap-indication-color-6-text-color';
const heading = 'm-0 mt-6 mb-2 text-sap-font-header6-size font-sap-font-header-family text-sap-title-color first:mt-0';

const meta: Meta<LayoutGrid> = {
    title: 'Components/Layout Grid',
    component: LayoutGrid,
    decorators: [moduleMetadata({ imports: [LayoutGrid, LayoutGridRow, LayoutGridCol] })],
    parameters: {
        docs: {
            description: {
                component:
                    'A responsive 12-column grid. Columns span 1-12 columns, with separate spans and offsets from 600px (md), 1024px (lg) and 1440px (xl) on. Gutters are 0.25rem on small screens and 0.5rem from 600px on.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<LayoutGrid>;

export const Basic: Story = {
    render: () => ({
        template: `
            <fd-layout-grid>
                @for (n of [1,2,3,4,5,6,7,8,9,10,11,12]; track n) { <div fdLayoutGridCol="1"><div class="${block}">1</div></div> }
                @for (n of [1,2,3,4,5,6]; track n) { <div fdLayoutGridCol="2"><div class="${alt}">2</div></div> }
                @for (n of [1,2,3,4]; track n) { <div fdLayoutGridCol="3"><div class="${block}">3</div></div> }
                @for (n of [1,2,3]; track n) { <div fdLayoutGridCol="4"><div class="${alt}">4</div></div> }
                <div fdLayoutGridCol="6"><div class="${block}">6</div></div>
                <div fdLayoutGridCol="6"><div class="${block}">6</div></div>
                <div fdLayoutGridCol="12"><div class="${alt}">12</div></div>
            </fd-layout-grid>`
    })
};

export const Responsive: Story = {
    name: 'Responsive spans and offsets',
    render: () => ({
        props: { blockClass: block, altClass: alt },
        template: `
            <h3 class="${heading}">12 / md 6 / lg 4 / xl 3 (resize the window)</h3>
            <fd-layout-grid>
                @for (n of [1,2,3,4]; track n) {
                    <div fdLayoutGridCol="12" colMd="6" colLg="4" colXl="3"><div [class]="n % 2 ? blockClass : altClass">Column {{ n }}</div></div>
                }
            </fd-layout-grid>
            <h3 class="${heading}">Offsets</h3>
            <fd-layout-grid>
                <div fdLayoutGridCol="4" colOffset="4"><div class="${block}">4, offset 4</div></div>
                <div fdLayoutGridCol="6" colOffset="6"><div class="${alt}">6, offset 6</div></div>
                <div fdLayoutGridCol="6" colOffset="0" colOffsetMd="3" colOffsetLg="6"><div class="${block}">offset 0 / md 3 / lg 6</div></div>
            </fd-layout-grid>
            <h3 class="${heading}">Responsive offset: md 1 / lg 2 / xl 4</h3>
            <fd-layout-grid>
                <div fdLayoutGridCol="6" colOffsetMd="1" colOffsetLg="2" colOffsetXl="4"><div class="${alt}">6, offset md 1 / lg 2 / xl 4</div></div>
            </fd-layout-grid>`
    })
};

export const GrowingAndNesting: Story = {
    name: 'Growing, nesting and rows',
    render: () => ({
        template: `
            <h3 class="${heading}">Growing columns share the remaining space</h3>
            <fd-layout-grid>
                <div fdLayoutGridCol="3"><div class="${block}">3</div></div>
                <div fdLayoutGridCol colGrow><div class="${alt}">grow</div></div>
                <div fdLayoutGridCol colGrow><div class="${alt}">grow</div></div>
            </fd-layout-grid>
            <h3 class="${heading}">Nested grid</h3>
            <fd-layout-grid>
                <div fdLayoutGridCol="6"><div class="${block}">6</div></div>
                <div fdLayoutGridCol="6">
                    <fd-layout-grid class="px-0">
                        <div fdLayoutGridCol="6"><div class="${alt}">nested 6</div></div>
                        <div fdLayoutGridCol="6"><div class="${alt}">nested 6</div></div>
                    </fd-layout-grid>
                </div>
            </fd-layout-grid>
            <h3 class="${heading}">Explicit rows</h3>
            <fd-layout-grid>
                <div fdLayoutGridRow>
                    <div fdLayoutGridCol="4"><div class="${block}">row 1</div></div>
                </div>
                <div fdLayoutGridRow>
                    <div fdLayoutGridCol="4"><div class="${alt}">row 2</div></div>
                    <div fdLayoutGridCol="4"><div class="${alt}">row 2</div></div>
                </div>
            </fd-layout-grid>`
    })
};

export const NoGap: Story = {
    name: 'Without gaps',
    render: () => ({
        template: `
            @for (variant of ['noGap', 'noHorizontalGap', 'noVerticalGap']; track variant) {
                <h3 class="${heading}">{{ variant }}</h3>
                <fd-layout-grid [noGap]="variant === 'noGap'" [noHorizontalGap]="variant === 'noHorizontalGap'" [noVerticalGap]="variant === 'noVerticalGap'">
                    @for (n of [1,2,3,4,5,6]; track n) { <div fdLayoutGridCol="4"><div class="${block}">4</div></div> }
                </fd-layout-grid>
            }`
    })
};
