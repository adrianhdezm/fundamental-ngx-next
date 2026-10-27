import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Bar, BarLeft, BarElement, BarRight } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { List, ListItem, ListLink, ListTitle } from '@/ui/list/list';
import { Title } from '@/ui/title/title';
import {
    FlexibleColumnLayoutComponent,
    provideFlexibleColumnLayoutConfig,
    type FlexibleColumnLayout
} from './flexible-column-layout';

const LAYOUTS: FlexibleColumnLayout[] = [
    'OneColumnStartFullScreen',
    'OneColumnMidFullScreen',
    'OneColumnEndFullScreen',
    'TwoColumnsStartExpanded',
    'TwoColumnsMidExpanded',
    'TwoColumnsEndExpanded',
    'ThreeColumnsMidExpanded',
    'ThreeColumnsEndExpanded',
    'ThreeColumnsStartMinimized',
    'ThreeColumnsEndMinimized'
];

@Component({
    selector: 'story-fcl',
    imports: [
        FlexibleColumnLayoutComponent,
        Bar,
        BarLeft,
        BarRight,
        BarElement,
        Button,
        List,
        ListItem,
        ListLink,
        ListTitle,
        Title
    ],
    template: `
        <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-2 font-sap-font-family text-sap-font-size text-sap-text-color">
                <label for="fcl-layout">Layout</label>
                <select
                    id="fcl-layout"
                    class="h-9 rounded-sap-field-border-corner-radius border border-sap-field-border-color bg-sap-field-background px-2 text-sap-field-text-color"
                    [value]="layout()"
                    (change)="layout.set($any($event.target).value)"
                >
                    @for (l of layouts; track l) {
                        <option [value]="l" [selected]="l === layout()">{{ l }}</option>
                    }
                </select>
                <span
                    >Drag the corner to resize: below 960px one column fills the layout, below 1280px at most two.</span
                >
            </div>
            <div
                class="resize-x overflow-hidden border border-dashed border-sap-group-content-border-color"
                style="width: 100%; min-width: 20rem"
            >
                <fd-flexible-column-layout class="h-96" [(layout)]="layout" [backgroundDesign]="backgroundDesign()">
                    <ng-template #startColumn>
                        <div class="h-full bg-sap-group-content-background">
                            <div fd-bar>
                                <div fd-bar-left>
                                    <fd-bar-element
                                        ><h3 fd-title headerSize="5" class="m-0">Products</h3></fd-bar-element
                                    >
                                </div>
                            </div>
                            <ul fd-list navigationIndicator aria-label="Products">
                                @for (product of products; track product) {
                                    <li fd-list-item>
                                        <a
                                            fd-list-link
                                            href="#"
                                            [navigated]="product === selected()"
                                            (click)="$event.preventDefault(); open(product)"
                                        >
                                            <span fd-list-title>{{ product }}</span>
                                        </a>
                                    </li>
                                }
                            </ul>
                        </div>
                    </ng-template>
                    <ng-template #midColumn>
                        <div class="h-full bg-sap-group-content-background">
                            <div fd-bar>
                                <div fd-bar-left>
                                    <fd-bar-element
                                        ><h3 fd-title headerSize="5" class="m-0">{{ selected() }}</h3></fd-bar-element
                                    >
                                </div>
                                <div fd-bar-right>
                                    <fd-bar-element
                                        ><button
                                            fdButton
                                            label="Supplier"
                                            (click)="layout.set('ThreeColumnsMidExpanded')"
                                        ></button
                                    ></fd-bar-element>
                                    <fd-bar-element>
                                        <button
                                            fdButton
                                            variant="transparent"
                                            glyph="decline"
                                            ariaLabel="Close"
                                            (click)="layout.set('OneColumnStartFullScreen')"
                                        ></button>
                                    </fd-bar-element>
                                </div>
                            </div>
                            <p class="m-0 p-4 font-sap-font-family text-sap-font-size text-sap-text-color">
                                Details of {{ selected() }}: price, availability and the supplier.
                            </p>
                        </div>
                    </ng-template>
                    <ng-template #endColumn>
                        <div class="h-full bg-sap-group-content-background">
                            <div fd-bar>
                                <div fd-bar-left>
                                    <fd-bar-element
                                        ><h3 fd-title headerSize="5" class="m-0">Supplier</h3></fd-bar-element
                                    >
                                </div>
                                <div fd-bar-right>
                                    <fd-bar-element>
                                        <button
                                            fdButton
                                            variant="transparent"
                                            glyph="decline"
                                            ariaLabel="Close supplier"
                                            (click)="layout.set('TwoColumnsMidExpanded')"
                                        ></button>
                                    </fd-bar-element>
                                </div>
                            </div>
                            <p class="m-0 p-4 font-sap-font-family text-sap-font-size text-sap-text-color">
                                Very Best Screens, Walldorf
                            </p>
                        </div>
                    </ng-template>
                </fd-flexible-column-layout>
            </div>
        </div>
    `
})
class StoryFcl {
    readonly backgroundDesign = input<'solid' | 'translucent' | 'transparent'>('solid');
    readonly initial = input<FlexibleColumnLayout>('TwoColumnsMidExpanded');
    protected readonly layouts = LAYOUTS;
    protected readonly products = ['Notebook Basic 15', 'Notebook Basic 17', 'Ergo Screen E-I', 'Flat Future'];
    protected readonly selected = signal('Notebook Basic 15');
    protected readonly layout = signal<FlexibleColumnLayout>('TwoColumnsMidExpanded');

    ngOnInit(): void {
        this.layout.set(this.initial());
    }

    protected open(product: string): void {
        this.selected.set(product);
        this.layout.set('TwoColumnsMidExpanded');
    }
}

@Component({
    selector: 'story-fcl-config',
    imports: [StoryFcl],
    providers: [
        provideFlexibleColumnLayoutConfig({
            layouts: { TwoColumnsMidExpanded: { start: 50, mid: 50, end: 0 } }
        })
    ],
    template: `<story-fcl initial="TwoColumnsMidExpanded" backgroundDesign="translucent" />`
})
class StoryFclConfig {}

const meta: Meta<FlexibleColumnLayoutComponent> = {
    title: 'Components/Flexible Column Layout',
    component: FlexibleColumnLayoutComponent,
    decorators: [moduleMetadata({ imports: [StoryFcl, StoryFclConfig] })],
    parameters: {
        docs: {
            description: {
                component:
                    'The flexible column layout shows up to three columns (for example list, detail and detail of the detail). The layout sets the column widths; separator buttons between visible columns expand or collapse them. On narrow layouts the columns collapse to two or one. Column widths per layout can be changed with provideFlexibleColumnLayoutConfig.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<FlexibleColumnLayoutComponent>;

export const Default: Story = {
    name: 'List, detail and detail-detail',
    render: () => ({ template: `<story-fcl />` })
};

export const ThreeColumns: Story = {
    name: 'Three columns, transparent separators',
    render: () => ({ template: `<story-fcl initial="ThreeColumnsMidExpanded" backgroundDesign="transparent" />` })
};

export const CustomConfig: Story = {
    name: 'Custom layout widths',
    render: () => ({ template: `<story-fcl-config />` })
};
