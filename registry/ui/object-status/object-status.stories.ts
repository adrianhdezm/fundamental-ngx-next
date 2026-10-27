import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { ObjectStatusComponent } from './object-status';

const INDICATORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const STATUSES = [
    { status: 'negative', glyph: 'error', label: 'Negative' },
    { status: 'critical', glyph: 'alert', label: 'Critical' },
    { status: 'positive', glyph: 'sys-enter-2', label: 'Positive' },
    { status: 'informative', glyph: 'information', label: 'Informative' },
    { status: null, glyph: null, label: 'Default' }
];
const NUMBERS = [
    { status: 'negative', label: '5' },
    { status: 'critical', label: '20' },
    { status: 'positive', label: '2.99' },
    { status: 'informative', label: '10' },
    { status: null, label: '99+' }
];
const row = 'flex flex-wrap items-center gap-4';
const heading = 'm-0 mt-6 mb-2 text-sap-font-header6-size font-sap-font-header-family text-sap-title-color first:mt-0';

const meta: Meta<ObjectStatusComponent> = {
    title: 'Components/Object Status',
    component: ObjectStatusComponent,
    decorators: [moduleMetadata({ imports: [ObjectStatusComponent] })],
    parameters: {
        // Horizon's inverted status and informative text colours are below 4.5:1 by design
        a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
        docs: {
            description: {
                component:
                    'Object status shows the state of an object as semantic or generic indication colours, with an optional icon. Inverted statuses are filled badges; clickable ones behave as buttons.'
            }
        }
    },
    argTypes: {
        status: { control: 'select', options: [null, 'negative', 'critical', 'positive', 'informative'] },
        indicationColor: { control: { type: 'number', min: 1, max: 10 } }
    },
    args: {
        status: 'positive',
        glyph: 'sys-enter-2',
        label: 'Approved',
        inverted: false,
        clickable: false,
        large: false
    }
};
export default meta;
type Story = StoryObj<ObjectStatusComponent>;

export const Playground: Story = {
    render: (args) => ({ props: args, template: `<span fd-object-status ${argsToTemplate(args)}></span>` })
};

export const Default: Story = {
    name: 'Icon, text and indication colors',
    render: () => ({
        props: { statuses: STATUSES, indicators: INDICATORS },
        template: `
            <h3 class="${heading}">Icon only</h3>
            <div class="${row}">
                @for (s of statuses.slice(0, 4); track s.label) { <span fd-object-status [status]="s.status" [glyph]="s.glyph" [glyphAriaLabel]="s.label" [title]="s.label"></span> }
            </div>
            <h3 class="${heading}">Text only</h3>
            <div class="${row}">
                @for (s of statuses; track s.label) { <span fd-object-status [status]="s.status" [label]="s.label"></span> }
            </div>
            <h3 class="${heading}">Icon and text</h3>
            <div class="${row}">
                @for (s of statuses; track s.label) { <span fd-object-status [status]="s.status" [glyph]="s.glyph" [label]="s.label"></span> }
            </div>
            <h3 class="${heading}">Indication colors</h3>
            <div class="${row}">
                @for (i of indicators; track i) { <span fd-object-status [indicationColor]="i" [label]="'Indication ' + i"></span> }
            </div>
            <h3 class="${heading}">Clickable</h3>
            <div class="${row}">
                @for (s of statuses; track s.label) { <div fd-object-status clickable [status]="s.status" [glyph]="s.glyph" [label]="s.label"></div> }
            </div>
            <div class="${row} mt-4">
                @for (i of indicators; track i) { <div fd-object-status clickable [indicationColor]="i" [label]="'Indication ' + i"></div> }
            </div>`
    })
};

export const Inverted: Story = {
    render: () => ({
        props: { statuses: STATUSES, numbers: NUMBERS, indicators: INDICATORS },
        template: `
            <h3 class="${heading}">Icon only and text only</h3>
            <div class="${row}">
                @for (s of statuses.slice(0, 4); track s.label) { <span fd-object-status inverted [status]="s.status" [glyph]="s.glyph" [glyphAriaLabel]="s.label" [title]="s.label"></span> }
                @for (s of statuses; track s.label) { <span fd-object-status inverted [status]="s.status" [label]="s.label"></span> }
            </div>
            <h3 class="${heading}">Icon and text</h3>
            <div class="${row}">
                @for (s of statuses; track s.label) { <span fd-object-status inverted [status]="s.status" [glyph]="s.glyph" [label]="s.label"></span> }
            </div>
            <h3 class="${heading}">Clickable</h3>
            <div class="${row}">
                @for (s of statuses; track s.label) { <div fd-object-status inverted clickable [status]="s.status" [glyph]="s.glyph" [label]="s.label"></div> }
            </div>
            <h3 class="${heading}">Numbers</h3>
            <div class="${row}">
                @for (n of numbers; track n.label) { <span fd-object-status inverted [status]="n.status" [label]="n.label"></span> }
            </div>
            <h3 class="${heading}">Generic indication colors</h3>
            <div class="${row}">
                @for (i of indicators; track i) { <div fd-object-status inverted clickable [indicationColor]="i" [label]="'Indication ' + i"></div> }
            </div>
            <h3 class="${heading}">Secondary set of indication colors</h3>
            <div class="${row}">
                @for (i of indicators; track i) { <div fd-object-status inverted clickable secondaryIndication [indicationColor]="i" [label]="'Indication ' + i + 'b'"></div> }
            </div>`
    })
};

export const Large: Story = {
    render: () => ({
        props: { statuses: STATUSES, numbers: NUMBERS },
        template: `
            <div class="flex flex-col gap-6">
                <div class="${row}">
                    @for (s of statuses.slice(0, 4); track s.label) { <span fd-object-status large inverted [status]="s.status" [glyph]="s.glyph" [glyphAriaLabel]="s.label" [title]="s.label"></span> }
                </div>
                <div class="${row}">
                    @for (s of statuses; track s.label) { <span fd-object-status large [status]="s.status" [label]="s.label"></span> }
                </div>
                <div class="${row}">
                    @for (n of numbers; track n.label) { <span fd-object-status large [status]="n.status" [label]="n.label"></span> }
                </div>
                <div class="${row}">
                    @for (s of statuses; track s.label) { <span fd-object-status large [status]="s.status" [glyph]="s.glyph" [label]="s.label"></span> }
                </div>
                <div class="${row}">
                    @for (s of statuses; track s.label) { <div fd-object-status large inverted clickable [status]="s.status" [glyph]="s.glyph" [label]="s.label"></div> }
                </div>
            </div>`
    })
};

export const Truncated: Story = {
    render: () => ({
        template: `<div class="w-40"><span fd-object-status truncate status="informative" glyph="information" label="A very long status text that does not fit"></span></div>`
    })
};
