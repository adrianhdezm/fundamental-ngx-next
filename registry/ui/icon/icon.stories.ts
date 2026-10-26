import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Icon } from './icon';
import { SAP_ICONS, SAP_ICONS_BUSINESS_SUITE, SAP_ICONS_TNT } from './icon-glyphs';

const COLORS = [
    'default',
    'contrast',
    'non-interactive',
    'tile',
    'marker',
    'critical',
    'negative',
    'neutral',
    'positive',
    'information'
] as const;

const meta: Meta<Icon> = {
    title: 'Components/Icon',
    component: Icon,
    decorators: [moduleMetadata({ imports: [Icon] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Icons from the SAP icon fonts (SAP-icons, SAP-icons-TNT and Business Suite). Icons are decorative ' +
                    'unless they get an `ariaLabel`, which gives them `role="img"`. Glyphs marked for mirroring flip in RTL.'
            }
        }
    },
    argTypes: {
        font: { control: 'inline-radio', options: ['SAP-icons', 'SAP-icons-TNT', 'BusinessSuiteInAppSymbols'] },
        size: { control: 'select', options: ['default', 'sm', 'md', 'lg', 'xl', 'xxl'] },
        color: { control: 'select', options: ['inherit', ...COLORS] },
        background: { control: 'select', options: ['none', ...COLORS] }
    },
    args: { glyph: 'accept', font: 'SAP-icons', size: 'md', color: 'default', background: 'none' } as Partial<Icon> &
        Record<string, unknown>
};
export default meta;
type Story = StoryObj<Icon>;

export const Playground: Story = {
    render: (args) => ({ props: args, template: `<fd-icon ${argsToTemplate(args)} />` })
};

export const Sizes: Story = {
    render: () => ({
        props: { sizes: ['sm', 'md', 'lg', 'xl', 'xxl'] },
        template: `
            <div class="flex items-end gap-6 text-sap-content-icon-color">
                @for (s of sizes; track s) {
                    <div class="flex flex-col items-center gap-2">
                        <fd-icon glyph="lightbulb" [size]="s" />
                        <span class="text-sap-font-small-size">{{ s }}</span>
                    </div>
                }
            </div>
        `
    })
};

export const Colors: Story = {
    render: () => ({
        props: { colors: COLORS },
        template: `
            <div class="flex flex-col gap-4">
                <div class="flex flex-wrap gap-4">
                    @for (c of colors; track c) {
                        <div class="flex w-24 flex-col items-center gap-1">
                            <fd-icon glyph="lightbulb" size="md" [color]="c" />
                            <span class="text-sap-font-small-size">{{ c }}</span>
                        </div>
                    }
                </div>
                <div class="flex flex-wrap gap-4">
                    @for (c of colors; track c) {
                        <div class="flex w-24 flex-col items-center gap-1">
                            <fd-icon glyph="lightbulb" size="md" [background]="c" />
                            <span class="text-sap-font-small-size">{{ c }}</span>
                        </div>
                    }
                </div>
            </div>
        `
    })
};

export const Accessible: Story = {
    name: 'Accessible icon',
    render: () => ({
        template: `
            <p class="flex items-center gap-2">
                <fd-icon glyph="message-error" color="negative" ariaLabel="Error" />
                <span>An icon with <code>ariaLabel</code> is announced as an image named "Error".</span>
            </p>
        `
    })
};

export const RTL: Story = {
    name: 'Mirroring in RTL',
    parameters: {
        docs: { description: { story: 'Switch Direction to RTL in the toolbar: directional glyphs flip.' } }
    },
    render: () => ({
        template: `
            <div class="flex gap-4 text-sap-content-icon-color">
                <fd-icon glyph="navigation-right-arrow" size="md" />
                <fd-icon glyph="nav-back" size="md" />
                <fd-icon glyph="arrow-right" size="md" />
                <fd-icon glyph="accept" size="md" />
            </div>
        `
    })
};

function gallery(map: Record<string, unknown>, font: string): StoryObj<Icon> {
    return {
        render: () => ({
            props: { glyphs: Object.keys(map), font, filter: '' },
            template: `
                <input class="mb-4 h-sap-element-height w-72 rounded-sap-field-border-corner-radius border border-sap-field-border-color bg-sap-field-background px-2 text-sap-field-text-color"
                    placeholder="Search icons" aria-label="Search icons" #q (input)="filter = q.value" />
                <div class="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2">
                    @for (g of glyphs; track g) {
                        @if (!filter || g.includes(filter)) {
                            <div class="flex flex-col items-center gap-2 rounded-sap-element-border-corner-radius bg-sap-tile-background p-3 text-center text-sap-content-icon-color">
                                <fd-icon [glyph]="g" [font]="font" size="md" />
                                <span class="w-full truncate text-sap-font-small-size text-sap-content-label-color" [title]="g">{{ g }}</span>
                            </div>
                        }
                    }
                </div>
            `
        })
    };
}

export const SapIcons: Story = { name: 'All SAP-icons', ...gallery(SAP_ICONS, 'SAP-icons') };
export const TntIcons: Story = { name: 'All SAP-icons-TNT', ...gallery(SAP_ICONS_TNT, 'SAP-icons-TNT') };
export const BusinessSuiteIcons: Story = {
    name: 'All Business Suite icons',
    ...gallery(SAP_ICONS_BUSINESS_SUITE, 'BusinessSuiteInAppSymbols')
};
