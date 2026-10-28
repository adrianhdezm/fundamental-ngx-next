import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { Button } from '@/ui/button/button';
import { Link } from '@/ui/link/link';
import { SegmentedButton } from '@/ui/segmented-button/segmented-button';
import {
    GridList,
    GridListFilterBar,
    GridListFooter,
    GridListGroupHeader,
    GridListItem,
    GridListItemBody,
    GridListItemFooterBar,
    GridListItemImage,
    GridListItemToolbar,
    GridListMoreBtn,
    GridListTitleBar,
    GridListTitleBarSpacer,
    type GridListItemType,
    type GridListSelectionMode
} from './grid-list';

const GRID_LIST = [
    GridList,
    GridListItem,
    GridListItemBody,
    GridListItemImage,
    GridListItemToolbar,
    GridListItemFooterBar,
    GridListTitleBar,
    GridListTitleBarSpacer,
    GridListGroupHeader,
    GridListFilterBar,
    GridListMoreBtn,
    GridListFooter,
    Avatar,
    Button,
    Link
];

interface Product {
    id: number;
    name: string;
    vendor: string;
    type: GridListItemType;
    counter?: number;
}

const PRODUCTS: Product[] = [
    { id: 1, name: 'Notebook Basic 15', vendor: 'Very Best Screens', type: 'navigation', counter: 10 },
    { id: 2, name: 'Notebook Basic 17', vendor: 'Very Best Screens', type: 'detail' },
    { id: 3, name: 'Notebook Professional 15', vendor: 'Smartcards', type: 'active', counter: 5 },
    { id: 4, name: 'Ergo Screen E-I', vendor: 'Technocom', type: 'detailsAndActive' },
    { id: 5, name: 'Flat Future', vendor: 'Red Point Stores', type: 'inactive' }
];

const BODY = `
    <div fd-grid-list-item-body>
        <p class="m-0">781 Main Street</p>
        <p class="m-0">Anytown, SD 57401</p>
        <p class="m-0 mb-1">USA</p>
        <a fdLink href="#">sales&#64;example.com</a>
    </div>`;

@Component({
    selector: 'story-grid-list-modes',
    imports: [GRID_LIST, SegmentedButton, FormsModule],
    template: `
        <div class="flex flex-col gap-4">
            <fd-segmented-button ariaLabel="Selection mode" [(ngModel)]="mode">
                @for (m of modes; track m) {
                    <button fdButton [label]="m" [value]="m"></button>
                }
            </fd-segmented-button>
            <fd-grid-list-title-bar title="Products" class="px-2">
                <span fd-grid-list-title-bar-additional-title-item>({{ products().length }})</span>
                <fd-grid-list-title-bar-spacer />
                <button fdButton variant="transparent" glyph="sort" ariaLabel="Sort" title="Sort"></button>
                <button fdButton variant="transparent" glyph="filter" ariaLabel="Filter" title="Filter"></button>
            </fd-grid-list-title-bar>
            <fd-grid-list
                #list
                ariaLabel="Products"
                [selectionMode]="mode()"
                (selectionChange)="selection.set($event.selection)"
            >
                @for (product of products(); track product.id) {
                    <fd-grid-list-item
                        [value]="product.id"
                        [type]="product.type"
                        [counter]="product.counter"
                        [title]="product.name"
                        [description]="product.vendor"
                        [selected]="product.id === 1"
                        (press)="log.set('press ' + product.name)"
                        (detail)="log.set('detail ' + product.name)"
                        (navigate)="log.set('navigate ' + product.name)"
                        (delete)="remove(product.id)"
                    >
                        <fd-avatar
                            fd-grid-list-item-image
                            size="s"
                            image="assets/landscape.svg"
                            ariaLabel="Product image"
                        />
                        <div fd-grid-list-item-body>
                            <p class="m-0">781 Main Street</p>
                            <p class="m-0">Anytown, SD 57401</p>
                            <p class="m-0">USA</p>
                        </div>
                    </fd-grid-list-item>
                }
            </fd-grid-list>
            <div class="flex items-center gap-4 font-sap-font-family text-sap-font-size text-sap-text-color">
                <button fdButton label="Clear selection" (click)="list.clearSelection()"></button>
                <button fdButton label="Reset items" (click)="products.set(all)"></button>
                <span aria-live="polite"
                    >Selection: {{ selection().join(', ') || 'none' }} · Last event: {{ log() }}</span
                >
            </div>
        </div>
    `
})
class GridListModes {
    protected readonly modes: GridListSelectionMode[] = [
        'none',
        'multiSelect',
        'singleSelect',
        'singleSelectLeft',
        'singleSelectRight',
        'delete'
    ];
    protected readonly all = PRODUCTS;
    protected readonly mode = signal<GridListSelectionMode>('multiSelect');
    protected readonly products = signal(PRODUCTS);
    protected readonly selection = signal<unknown[]>([]);
    protected readonly log = signal('none');
    protected remove(id: number): void {
        this.products.update((list) => list.filter((p) => p.id !== id));
        this.log.set('delete ' + id);
    }
}

@Component({
    selector: 'story-grid-list-more',
    imports: [GRID_LIST],
    template: `
        <fd-grid-list ariaLabel="Products">
            <fd-grid-list-title-bar title="Products" />
            @if (filtered()) {
                <fd-grid-list-filter-bar (close)="filtered.set(false)">
                    Filtered by: Vendor (Very Best Screens, Smartcards)
                </fd-grid-list-filter-bar>
            }
            @for (product of shown(); track product.id) {
                <fd-grid-list-item
                    [type]="product.type"
                    [counter]="product.counter"
                    [title]="product.name"
                    [description]="product.vendor"
                >
                    <fd-avatar
                        fd-grid-list-item-image
                        size="s"
                        image="assets/landscape.svg"
                        ariaLabel="Product image"
                    />
                    <div fd-grid-list-item-body>781 Main Street, Anytown</div>
                </fd-grid-list-item>
            }
            @if (count() < all.length) {
                <fd-grid-list-more-btn
                    [displayCount]="count()"
                    [totalCount]="all.length"
                    (showMore)="count.set(count() + 2)"
                />
            }
            <fd-grid-list-footer>Footer text: {{ count() }} of {{ all.length }} products shown.</fd-grid-list-footer>
        </fd-grid-list>
    `
})
class GridListMore {
    protected readonly all = [...PRODUCTS, ...PRODUCTS.map((p) => ({ ...p, id: p.id + 10, name: p.name + ' II' }))];
    protected readonly count = signal(4);
    protected readonly filtered = signal(true);
    protected shown(): Product[] {
        return this.all.slice(0, this.count());
    }
}

@Component({
    selector: 'story-grid-list-group',
    imports: [GRID_LIST],
    template: `
        <fd-grid-list ariaLabel="Products by company">
            <fd-grid-list-title-bar title="Products">
                <span fd-grid-list-title-bar-additional-title-item>({{ companyA.length + companyB.length }})</span>
            </fd-grid-list-title-bar>
            @if (grouped()) {
                <fd-grid-list-filter-bar (close)="grouped.set(false)">
                    Grouped by: Company (Company A, Company B)
                </fd-grid-list-filter-bar>
                <fd-grid-list-group-header>Company: Company A</fd-grid-list-group-header>
            }
            @for (n of companyA; track n) {
                <fd-grid-list-item [title]="'Title ' + n" [description]="'Description ' + n">
                    <fd-grid-list-item-toolbar>Custom text</fd-grid-list-item-toolbar>
                    <fd-avatar
                        fd-grid-list-item-image
                        size="s"
                        image="assets/landscape.svg"
                        ariaLabel="Product image"
                    />
                    <div fd-grid-list-item-body>781 Main Street, Anytown</div>
                </fd-grid-list-item>
            }
            @if (grouped()) {
                <fd-grid-list-group-header>Company: Company B</fd-grid-list-group-header>
            }
            @for (n of companyB; track n) {
                <fd-grid-list-item [title]="'Title ' + n" [description]="'Description ' + n">
                    <fd-grid-list-item-toolbar>Custom text</fd-grid-list-item-toolbar>
                    <fd-avatar
                        fd-grid-list-item-image
                        size="s"
                        image="assets/landscape.svg"
                        ariaLabel="Product image"
                    />
                    <div fd-grid-list-item-body>781 Main Street, Anytown</div>
                </fd-grid-list-item>
            }
        </fd-grid-list>
    `
})
class GridListGroup {
    protected readonly companyA = [1, 2, 3, 4];
    protected readonly companyB = [5, 6, 7];
    protected readonly grouped = signal(true);
}

const meta: Meta<GridList> = {
    title: 'Components/Grid List',
    component: GridList,
    decorators: [moduleMetadata({ imports: [...GRID_LIST, GridListModes, GridListMore, GridListGroup] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Grid lists show items as cards in a responsive grid (layoutPattern sets the items per row for XL, L, M and S screens). Items can be selected (multiSelect, singleSelect with or without a radio button), deleted, navigated or activated. Arrow keys move between items (up and down by row), Enter or F2 moves into the item and Escape or F2 back, Space selects; in multi selection Shift with arrows, Home, End or a click selects ranges.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<GridList>;

export const SelectionModes: Story = {
    name: 'Selection modes and item types',
    render: () => ({ template: `<story-grid-list-modes />` })
};

const item = (attrs: string, extra = '') => `
    <fd-grid-list-item ${attrs} title="John Li" description="Product Owner, Company B">
        ${extra}
        <fd-avatar fd-grid-list-item-image size="s" image="assets/person.svg" ariaLabel="Photo of John Li" />
        ${BODY}
    </fd-grid-list-item>`;

export const States: Story = {
    name: 'States',
    render: () => ({
        template: `
            <fd-grid-list ariaLabel="Contacts">
                <fd-grid-list-title-bar title="Contacts">
                    <span fd-grid-list-title-bar-additional-title-item>(6)</span>
                </fd-grid-list-title-bar>
                <fd-grid-list-group-header>State: unread</fd-grid-list-group-header>
                ${item('state="unread" type="navigation" counter="10"')}
                <fd-grid-list-group-header>State: error</fd-grid-list-group-header>
                ${item('state="error" status="error" type="detail"')}
                ${item('state="error"', '<fd-grid-list-item-footer-bar>Custom error message</fd-grid-list-item-footer-bar>')}
                <fd-grid-list-group-header>State: locked</fd-grid-list-group-header>
                ${item('state="locked"')}
                <fd-grid-list-group-header>State: draft</fd-grid-list-group-header>
                ${item('state="draft"', '<fd-grid-list-item-toolbar>Custom text</fd-grid-list-item-toolbar>')}
                ${item('state="draft" type="active" navigated')}
            </fd-grid-list>`
    })
};

export const Statuses: Story = {
    name: 'Highlight statuses',
    render: () => ({
        template: `
            <fd-grid-list ariaLabel="Contacts">
                ${item('status="success"')}${item('status="warning"')}${item('status="error"')}${item('status="neutral"')}
            </fd-grid-list>`
    })
};

export const Layout: Story = {
    name: 'Layout patterns',
    render: () => ({
        template: `
            <div class="flex flex-col gap-6">
                <fd-grid-list ariaLabel="Two per row" layoutPattern="XL2-L2-M2-S1">
                    <fd-grid-list-title-bar title="layoutPattern XL2-L2-M2-S1" />
                    ${item('type="active"')}${item('type="active"')}${item('type="active"')}
                </fd-grid-list>
                <fd-grid-list ariaLabel="Item spans" layoutPattern="XL4-L3-M2-S1">
                    <fd-grid-list-title-bar title="Item layoutItemPattern XL6-L8-M12 next to default items" />
                    ${item('layoutItemPattern="XL6-L8-M12"')}${item('')}${item('')}
                </fd-grid-list>
                <fd-grid-list ariaLabel="Fixed width" layoutPattern="XL6-L4-M3-S2">
                    <fd-grid-list-title-bar title="Fixed item width, auto height and no padding" />
                    <fd-grid-list-item width="12rem" autoHeight title="Auto height"><div fd-grid-list-item-body>Short</div></fd-grid-list-item>
                    <fd-grid-list-item width="12rem" title="Row height"><div fd-grid-list-item-body>Stretches to the row</div></fd-grid-list-item>
                    <fd-grid-list-item width="12rem" noPadding>
                        <img fd-grid-list-item-body src="assets/landscape.svg" alt="Landscape" class="block h-32 object-cover" />
                    </fd-grid-list-item>
                    <fd-grid-list-item width="12rem" autoHeight title="Tall content">
                        <div fd-grid-list-item-body>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
                    </fd-grid-list-item>
                </fd-grid-list>
            </div>`
    })
};

export const More: Story = {
    name: 'Filter bar, more button and footer',
    render: () => ({ template: `<story-grid-list-more />` })
};

export const Group: Story = {
    name: 'Groups',
    render: () => ({ template: `<story-grid-list-group />` })
};

export const FocusProgrammatically: Story = {
    name: 'Focusing an item programmatically',
    render: () => ({
        props: { products: PRODUCTS },
        template: `
            <fd-grid-list #list ariaLabel="Products">
                <fd-grid-list-title-bar title="Products">
                    <span fd-grid-list-title-bar-additional-title-item>({{ products.length }})</span>
                    <fd-grid-list-title-bar-spacer />
                    <button fdButton variant="transparent" label="Focus first" (click)="list.items()[0].focus()"></button>
                    <button fdButton variant="transparent" label="Focus last" (click)="list.items()[list.items().length - 1].focus()"></button>
                </fd-grid-list-title-bar>
                @for (product of products; track product.id) {
                    <fd-grid-list-item
                        [type]="product.type"
                        [counter]="product.counter"
                        [title]="product.name"
                        [description]="product.vendor"
                    >
                        <fd-avatar fd-grid-list-item-image size="s" image="assets/landscape.svg" ariaLabel="Product image" />
                        ${BODY}
                    </fd-grid-list-item>
                }
            </fd-grid-list>`
    })
};

export const HeadingLevel: Story = {
    name: 'Heading level',
    render: () => ({
        props: { products: PRODUCTS },
        template: `
            <fd-grid-list ariaLabel="Products">
                <fd-grid-list-title-bar title="Products (heading level 3)" [headingLevel]="3">
                    <span fd-grid-list-title-bar-additional-title-item>({{ products.length }})</span>
                </fd-grid-list-title-bar>
                <fd-grid-list-group-header [headingLevel]="4">Group (heading level 4)</fd-grid-list-group-header>
                @for (product of products; track product.id) {
                    <fd-grid-list-item [title]="product.name" [description]="product.vendor" [titleLevel]="5">
                        <fd-avatar fd-grid-list-item-image size="s" image="assets/landscape.svg" ariaLabel="Product image" />
                    </fd-grid-list-item>
                }
            </fd-grid-list>`
    })
};
