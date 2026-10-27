import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Card, CardContent, CardHeader, CardMainHeader, CardSubtitle, CardTitle } from '@/ui/card/card';
import { CardDefinition, FixedCardLayout, type CardDropped, type ColumnsWidthConfig } from './fixed-card-layout';

const CARDS = [
    { title: 'Sales orders', lines: 3 },
    { title: 'Open invoices', lines: 6 },
    { title: 'Deliveries', lines: 2 },
    { title: 'Top customers', lines: 5 },
    { title: 'Returns', lines: 1 },
    { title: 'Stock alerts', lines: 4 },
    { title: 'Approvals', lines: 2 },
    { title: 'Messages', lines: 3 }
];

@Component({
    selector: 'story-fixed-card-layout',
    imports: [FixedCardLayout, CardDefinition, Card, CardHeader, CardMainHeader, CardTitle, CardSubtitle, CardContent],
    template: `
        <div class="flex flex-col gap-3">
            <p class="m-0 font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">
                {{ columns() }} columns. Drag a card, or focus it and press Alt with an arrow key, to move it.
                {{ last() }}
            </p>
            <fd-fixed-card-layout
                [maxColumns]="maxColumns()"
                [columnsWidthConfig]="widthConfig()"
                [disableDragDrop]="disableDragDrop()"
                (layoutChange)="columns.set($event.numberOfColumns)"
                (cardDraggedDropped)="dropped($event)"
            >
                @for (card of cards; track card.title; let i = $index) {
                    <ng-template [fdCardDef]="i + 1">
                        <fd-card>
                            <fd-card-header>
                                <fd-card-main-header>
                                    <h3 fd-card-title [id]="'fcl-card-' + i">{{ card.title }}</h3>
                                    <h4 fd-card-subtitle>Card {{ i + 1 }}</h4>
                                </fd-card-main-header>
                            </fd-card-header>
                            <fd-card-content>
                                <div class="p-4 font-sap-font-family text-sap-font-size text-sap-text-color">
                                    @for (line of lineNumbers(card.lines); track line) {
                                        <p class="m-0 mb-2">Line {{ line }} of {{ card.title.toLowerCase() }}</p>
                                    }
                                </div>
                            </fd-card-content>
                        </fd-card>
                    </ng-template>
                }
            </fd-fixed-card-layout>
        </div>
    `
})
class StoryFixedCardLayout {
    readonly maxColumns = input(10);
    readonly widthConfig = input<ColumnsWidthConfig | null>(null);
    readonly disableDragDrop = input(false);
    protected readonly cards = CARDS;
    protected readonly columns = signal(0);
    protected readonly last = signal('');
    protected lineNumbers(count: number): number[] {
        return Array.from({ length: count }, (_, i) => i + 1);
    }
    protected dropped(event: CardDropped): void {
        this.last.set(`Moved card ${event.previousIndex + 1} to position ${event.currentIndex + 1}.`);
    }
}

const meta: Meta<FixedCardLayout> = {
    title: 'Components/Fixed Card Layout',
    component: FixedCardLayout,
    decorators: [moduleMetadata({ imports: [StoryFixedCardLayout] })],
    parameters: {
        docs: {
            description: {
                component:
                    'The fixed card layout places cards row by row in as many columns of at least 20rem as fit (at most maxColumns). Cards keep their own height. They can be reordered by dragging, or with Alt and the arrow keys; the arrow keys alone move the focus between cards.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<FixedCardLayout>;

export const Default: Story = {
    name: 'Responsive columns',
    render: () => ({ template: `<story-fixed-card-layout />` })
};

export const MaxColumns: Story = {
    name: 'At most two columns',
    render: () => ({ template: `<story-fixed-card-layout [maxColumns]="2" />` })
};

export const ColumnWidths: Story = {
    name: 'Custom column widths',
    render: () => ({
        props: { widthConfig: { 1: 2, 2: 1, 3: 1 } },
        template: `<story-fixed-card-layout [maxColumns]="3" [widthConfig]="widthConfig" />`
    })
};

export const DisabledDragDrop: Story = {
    name: 'Drag and drop disabled',
    render: () => ({ template: `<story-fixed-card-layout [disableDragDrop]="true" />` })
};
