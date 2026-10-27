import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { InfoLabel } from './info-label';

const COLORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const meta: Meta<InfoLabel> = {
    title: 'Components/Info Label',
    component: InfoLabel,
    decorators: [moduleMetadata({ imports: [InfoLabel] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Info labels highlight a status, category or count. They are not interactive and come in ten accent colours.'
            }
        }
    },
    argTypes: {
        color: { control: { type: 'number', min: 1, max: 10 } },
        type: { control: 'select', options: [null, 'numeric', 'icon'] }
    },
    args: { label: 'Default', color: 7, display: false }
};
export default meta;
type Story = StoryObj<InfoLabel>;

export const Playground: Story = {
    render: (args) => ({ props: args, template: `<fd-info-label ${argsToTemplate(args)} />` })
};

export const Colors: Story = {
    name: 'Accent colors, icons and numbers',
    render: () => ({
        props: { colors: COLORS },
        template: `
            <div class="flex flex-wrap gap-12">
                <div class="flex flex-col items-start gap-2">
                    @for (c of colors; track c) { <fd-info-label [label]="'Default ' + c" [color]="c" [title]="'Accent color ' + c" /> }
                </div>
                <div class="flex flex-col items-start gap-2">
                    @for (c of colors; track c) { <fd-info-label type="icon" glyph="component" font="BusinessSuiteInAppSymbols" [label]="'With icon ' + c" [color]="c" /> }
                </div>
                <div class="flex flex-col items-start gap-2">
                    <fd-info-label type="numeric" color="1" label="6" title="Total Items" />
                    <fd-info-label type="numeric" color="2" label="42k" title="Users Count" />
                    <fd-info-label type="numeric" color="3" label="14.7" title="Average Rating" />
                    <fd-info-label type="icon" glyph="employee" color="6" ariaLabel="Employee" />
                </div>
            </div>`
    })
};

export const Display: Story = {
    name: 'Display size',
    render: () => ({
        props: { colors: COLORS },
        template: `<div class="flex flex-wrap gap-2">@for (c of colors; track c) { <fd-info-label display [label]="'Display ' + c" [color]="c" /> }<fd-info-label display type="icon" glyph="employee" label="With icon" /></div>`
    })
};
