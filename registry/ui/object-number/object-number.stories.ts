import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { ObjectNumber } from './object-number';

const row = 'flex flex-wrap items-center gap-6';
const heading = 'm-0 mt-6 mb-2 text-sap-font-header6-size font-sap-font-header-family text-sap-title-color first:mt-0';
const ITEMS = [
    { number: -2000, status: 'negative' },
    { number: 0, status: 'critical' },
    { number: 1000.37, status: 'positive' },
    { number: 100.88, status: 'informative' },
    { number: 999, status: null }
];

const meta: Meta<ObjectNumber> = {
    title: 'Components/Object Number',
    component: ObjectNumber,
    decorators: [moduleMetadata({ imports: [ObjectNumber] })],
    parameters: {
        // Horizon's inverted status colours are below 4.5:1 by design
        a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
        docs: {
            description: {
                component:
                    'Object numbers display a formatted number and its unit of measurement, coloured by value state. They can be emphasized, large, inverted or interactive.'
            }
        }
    },
    argTypes: { status: { control: 'select', options: [null, 'negative', 'critical', 'positive', 'informative'] } },
    args: {
        number: 1000.37,
        decimal: 2,
        unit: 'EUR',
        status: 'positive',
        emphasized: false,
        large: false,
        inverted: false,
        interactive: false
    }
};
export default meta;
type Story = StoryObj<ObjectNumber>;

export const Playground: Story = {
    render: (args) => ({ props: args, template: `<fd-object-number ${argsToTemplate(args)} />` })
};

export const Default: Story = {
    name: 'Status, emphasized, decimals and units',
    render: () => ({
        props: { items: ITEMS },
        template: `
            <h3 class="${heading}">Status</h3>
            <div class="${row}">@for (i of items; track i.number) { <fd-object-number [number]="i.number" unit="EUR" [status]="i.status" [decimal]="2" /> }</div>
            <h3 class="${heading}">Emphasized</h3>
            <div class="${row}">@for (i of items; track i.number) { <fd-object-number [number]="i.number" unit="EUR" [status]="i.status" [decimal]="2" emphasized /> }</div>
            <h3 class="${heading}">Decimals</h3>
            <div class="${row}">
                <fd-object-number [number]="2000" unit="EUR" status="negative" [decimal]="2" />
                <fd-object-number [number]="0.446" unit="EUR" status="critical" [decimal]="3" />
                <fd-object-number [number]="1000.3" unit="EUR" status="positive" [decimal]="1" />
                <fd-object-number [number]="100.88" unit="EUR" status="informative" />
            </div>
            <h3 class="${heading}">Units</h3>
            <div class="${row}">
                <fd-object-number [number]="2000" unit="EUR" />
                <fd-object-number [number]="0" unit="USD" status="informative" />
            </div>
            <h3 class="${heading}">Truncation in a 100px container</h3>
            <div class="flex flex-col gap-2">
                <div class="w-[100px]"><fd-object-number [number]="-2000" unit="EUR" status="negative" [decimal]="2" /></div>
                <div class="w-[100px]"><fd-object-number [number]="3000" unit="Floating unit" status="negative" [decimal]="2" /></div>
                <div class="w-[100px]"><fd-object-number [number]="500000234" unit="USD" status="negative" [decimal]="2" /></div>
            </div>`
    })
};

export const Interactive: Story = {
    name: 'Interactive and inverted',
    render: () => ({
        props: { items: ITEMS },
        template: `
            <h3 class="${heading}">Interactive</h3>
            <div class="${row}">@for (i of items; track i.number) { <fd-object-number [number]="i.number" unit="EUR" [status]="i.status" [decimal]="2" interactive [emphasized]="$even" /> }</div>
            <h3 class="${heading}">Inverted</h3>
            <div class="${row}">@for (i of items; track i.number) { <fd-object-number [number]="i.number" unit="EUR" [status]="i.status" [decimal]="2" inverted /> }</div>
            <h3 class="${heading}">Inverted interactive</h3>
            <div class="${row}">@for (i of items; track i.number) { <fd-object-number [number]="i.number" unit="EUR" [status]="i.status" [decimal]="2" inverted interactive /> }</div>`
    })
};

export const Large: Story = {
    render: () => ({
        props: { items: ITEMS },
        template: `<div class="${row}">@for (i of items; track i.number) { <fd-object-number [number]="i.number" unit="EUR" [status]="i.status" [decimal]="2" large /> }</div>`
    })
};
