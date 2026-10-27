import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Observable, delay, of } from 'rxjs';
import { Avatar } from '@/ui/avatar/avatar';
import { Button } from '@/ui/button/button';
import { Checkbox } from '@/ui/checkbox/checkbox';
import { Icon } from '@/ui/icon/icon';
import { SegmentedButton } from '@/ui/segmented-button/segmented-button';
import { Title } from '@/ui/title/title';
import {
    Tree,
    TreeDataSource,
    TreeItem,
    TreeItemButton,
    TreeItemDef,
    TreeItemIcon,
    TreeItemText,
    type TreeItemData,
    type TreeItemState,
    type TreeSelectionPlacement
} from './tree';

interface Product {
    title: string;
    icon: string;
    value?: number;
    editable?: boolean;
}

const PARTS = [Tree, TreeItem, TreeItemDef, TreeItemIcon, TreeItemText, TreeItemButton, Icon, Title];
const heading = 'mt-6 mb-2 first:mt-0';

/** A small product hierarchy with states and values. */
const products = (): Partial<TreeItemData<Product>>[] => {
    let value = 0;
    const leaf = (title: string, icon: string, state?: TreeItemState): Partial<TreeItemData<Product>> => ({
        data: { title, icon, value: ++value, editable: true },
        state,
        navigatable: true
    });
    return [
        {
            expanded: true,
            navigatable: true,
            data: { title: 'Computer systems', icon: 'laptop', value: ++value },
            children: [
                {
                    expanded: true,
                    data: { title: 'Laptops', icon: 'laptop', value: ++value },
                    children: [
                        leaf('Notebook Basic 15', 'laptop', 'success'),
                        leaf('Notebook Professional 17', 'laptop')
                    ]
                },
                {
                    data: { title: 'Desktops', icon: 'sys-monitor', value: ++value },
                    children: [
                        leaf('Office Desktop', 'sys-monitor', 'warning'),
                        leaf('Gaming Desktop', 'sys-monitor', 'error')
                    ]
                }
            ]
        },
        {
            navigatable: true,
            data: { title: 'Accessories', icon: 'add-equipment', value: ++value },
            children: [leaf('Mouse', 'add-equipment', 'default'), leaf('Keyboard', 'keyboard-and-mouse')]
        },
        { navigatable: true, data: { title: 'Software', icon: 'source-code', value: ++value } }
    ];
};

@Component({
    selector: 'story-tree-basic',
    imports: [...PARTS],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Nested items</h3>
        <fd-tree ariaLabel="Nested items" class="max-w-lg">
            <fd-tree-item>
                <fd-icon fdTreeItemIcon glyph="account" />
                <span fdTreeItemText>Item 1 (Level 1)</span>
            </fd-tree-item>
            <fd-tree-item wrapContent [expanded]="true">
                <fd-icon fdTreeItemIcon glyph="e-care" />
                <span fdTreeItemText>Item 2 with a long description that wraps to the next line (Level 1)</span>
                <fd-tree-item [expanded]="true">
                    <span fdTreeItemText>Item 1 (Level 2)</span>
                    <fd-tree-item>
                        <span fdTreeItemText>Item 1 (Level 3)</span>
                        <fd-tree-item><span fdTreeItemText>Item 1 (Level 4)</span></fd-tree-item>
                    </fd-tree-item>
                </fd-tree-item>
                <fd-tree-item><span fdTreeItemText>Item 2 (Level 2)</span></fd-tree-item>
            </fd-tree-item>
            <fd-tree-item>
                <fd-icon fdTreeItemIcon glyph="phone" />
                <span fdTreeItemText>Item 3 (Level 1)</span>
            </fd-tree-item>
        </fd-tree>

        <h3 fdTitle headerSize="5" class="${heading}">Items from data, without borders</h3>
        <fd-tree ariaLabel="Products" [dataSource]="items" noBorder class="max-w-lg">
            <fd-tree-item
                *fdTreeItemDef="let item"
                [id]="item.id"
                [level]="item.level"
                [parentId]="item.parentId"
                [childNodes]="item.children"
                [expanded]="!!item.expanded"
            >
                <fd-icon fdTreeItemIcon [glyph]="item.data.icon" />
                <span fdTreeItemText>{{ item.data.title }}</span>
            </fd-tree-item>
        </fd-tree>

        <h3 fdTitle headerSize="5" class="${heading}">No data</h3>
        <fd-tree ariaLabel="Empty" [dataSource]="[]" class="max-w-lg">
            <fd-tree-item *fdTreeItemDef="let item"><span fdTreeItemText>-</span></fd-tree-item>
        </fd-tree>
    `
})
class StoryTreeBasic {
    protected readonly items = products() as Partial<TreeItemData<Product>>[];
}

@Component({
    selector: 'story-tree-customization',
    imports: [...PARTS, Avatar, Button],
    template: `
        <fd-tree ariaLabel="Customized items" class="max-w-lg">
            <fd-tree-item>
                <fd-icon fdTreeItemIcon glyph="account" />
                <span fdTreeItemText>Item 1 (Level 1)</span>
            </fd-tree-item>
            <fd-tree-item wrapContent>
                <fd-icon fdTreeItemIcon glyph="e-care" />
                <span fdTreeItemText>Item 2 with a long description that wraps to the next line (Level 1)</span>
                <fd-tree-item>
                    <span fdTreeItemText>Item 1 (Level 2)</span>
                    <fd-tree-item>
                        <span fdTreeItemText>Item 1 (Level 3)</span>
                        <fd-tree-item>
                            <span fdTreeItemText>Item 1 (Level 4)</span>
                            <fd-tree-item><span fdTreeItemText>Item 1 (Level 5)</span></fd-tree-item>
                        </fd-tree-item>
                    </fd-tree-item>
                </fd-tree-item>
                <fd-tree-item><span fdTreeItemText>Item 2 (Level 2)</span></fd-tree-item>
            </fd-tree-item>
            <!-- backgroundColor: any CSS colour, here a theme token -->
            <fd-tree-item backgroundColor="var(--sapList_HoverBackground)" wrapContent>
                <div fdTreeItemText class="flex items-center gap-4 py-4">
                    <fd-avatar size="s" circle glyph="product" [colorAccent]="1" />
                    <span>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias eum iste perspiciatis
                        reprehenderit! Tempora provident excepturi officiis iste! Iusto architecto libero adipisci cum
                        quaerat sed velit, voluptatibus a et recusandae.
                    </span>
                </div>
            </fd-tree-item>
            <!-- customStyles: a style object for the row -->
            <fd-tree-item [customStyles]="customStyles">
                <div fdTreeItemText class="flex items-center gap-4">
                    <fd-avatar size="s" glyph="product" [colorAccent]="9" />
                    <span class="flex-1">Product name catalog</span>
                    <button fdButton variant="transparent" glyph="overflow" ariaLabel="More" title="More"></button>
                </div>
            </fd-tree-item>
            <!-- class: classes added to the row -->
            <fd-tree-item class="bg-sap-list-group-header-background">
                <fd-icon fdTreeItemIcon glyph="phone" />
                <span fdTreeItemText>Item 5 (Level 1), with a custom class</span>
            </fd-tree-item>
        </fd-tree>
    `
})
class StoryTreeCustomization {
    protected readonly customStyles = {
        background: 'var(--sapInformationBackgroundColor)',
        paddingBlock: '1rem'
    };
}

@Component({
    selector: 'story-tree-states',
    imports: [...PARTS, Button],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Navigatable items, highlights and action buttons</h3>
        <fd-tree ariaLabel="Navigation" [dataSource]="items" navigationIndicator class="max-w-xl">
            <fd-tree-item
                *fdTreeItemDef="let item"
                [id]="item.id"
                [level]="item.level"
                [parentId]="item.parentId"
                [childNodes]="item.children"
                [expanded]="!!item.expanded"
                [navigatable]="!!item.navigatable"
                [state]="item.state"
                (treeItemClick)="clicked.set(item.data.title)"
            >
                <fd-icon fdTreeItemIcon [glyph]="item.data.icon" />
                <span fdTreeItemText>{{ item.data.title }}</span>
                <!-- one button per block, so each is projected as a tree item button -->
                @if (item.data.editable) {
                    <button
                        fdButton
                        fdTreeItemButton
                        variant="transparent"
                        glyph="edit"
                        [ariaLabel]="'Edit ' + item.data.title"
                    ></button>
                }
                @if (item.data.editable) {
                    <button
                        fdButton
                        fdTreeItemButton
                        variant="transparent"
                        glyph="decline"
                        [ariaLabel]="'Remove ' + item.data.title"
                    ></button>
                }
            </fd-tree-item>
        </fd-tree>
        <p class="font-sap-font-family text-sap-font-size text-sap-text-color">Clicked: {{ clicked() || '-' }}</p>
    `
})
class StoryTreeStates {
    protected readonly items = products();
    protected readonly clicked = signal('');
}

@Component({
    selector: 'story-tree-selection',
    imports: [...PARTS, FormsModule, JsonPipe, SegmentedButton, Button, Checkbox],
    template: `
        <div class="mb-4 flex flex-wrap items-center gap-4">
            <fd-segmented-button [(ngModel)]="placement" ariaLabel="Selection placement">
                <button fdButton value="none" label="None"></button>
                <button fdButton value="left" label="Left"></button>
                <button fdButton value="afterExpand" label="After expander"></button>
                <button fdButton value="right" label="Right"></button>
            </fd-segmented-button>
            <fd-checkbox [(ngModel)]="independent" label="Independent sections" />
        </div>

        <h3 fdTitle headerSize="5" class="${heading}">Single selection</h3>
        <fd-tree
            ariaLabel="Single selection"
            selection="single"
            [selectionPlacement]="placement"
            [independentSections]="independent"
            [dataSource]="items"
            [(ngModel)]="single"
            class="max-w-xl"
        >
            <fd-tree-item
                *fdTreeItemDef="let item"
                [id]="'single-' + item.id"
                [value]="item.data.value"
                [level]="item.level"
                [parentId]="item.parentId"
                [childNodes]="item.children"
                [expanded]="!!item.expanded"
            >
                <fd-icon fdTreeItemIcon [glyph]="item.data.icon" />
                <span fdTreeItemText>{{ item.data.title }}</span>
            </fd-tree-item>
        </fd-tree>
        <p class="font-sap-font-family text-sap-font-size text-sap-text-color">Value: {{ single | json }}</p>

        <h3 fdTitle headerSize="5" class="${heading}">Multiple selection</h3>
        <fd-tree
            ariaLabel="Multiple selection"
            selection="multiple"
            [selectionPlacement]="placement === 'none' ? 'left' : placement"
            [independentSections]="independent"
            [dataSource]="items"
            [(ngModel)]="multiple"
            class="max-w-xl"
        >
            <fd-tree-item
                *fdTreeItemDef="let item"
                [id]="'multiple-' + item.id"
                [value]="item.data.value"
                [level]="item.level"
                [parentId]="item.parentId"
                [childNodes]="item.children"
                [expanded]="!!item.expanded"
            >
                <fd-icon fdTreeItemIcon [glyph]="item.data.icon" />
                <span fdTreeItemText>{{ item.data.title }}</span>
            </fd-tree-item>
        </fd-tree>
        <p class="font-sap-font-family text-sap-font-size text-sap-text-color">Value: {{ multiple | json }}</p>
    `
})
class StoryTreeSelection {
    protected readonly items = products();
    protected placement: TreeSelectionPlacement = 'left';
    protected independent = false;
    protected single: number | null = 3;
    protected multiple: number[] = [3, 4];
}

/** Children fetched on expansion, as from a server. */
class LazyChildren extends TreeDataSource<Partial<TreeItemData<Product>>> {
    constructor(private readonly level: number) {
        super();
    }

    fetch(): Observable<Partial<TreeItemData<Product>>[]> {
        return of(
            Array.from({ length: 5 }, (_, i) => ({
                data: { title: `Item ${i + 1} (Level ${this.level})`, icon: 'folder-blank' },
                children: this.level < 4 ? new LazyChildren(this.level + 1) : []
            }))
        ).pipe(delay(1500));
    }

    override getTotalItems(): number {
        return 5;
    }
}

@Component({
    selector: 'story-tree-lazy',
    imports: [...PARTS],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Children load when an item expands</h3>
        <fd-tree ariaLabel="Lazy tree" [dataSource]="items" class="max-w-lg">
            <fd-tree-item
                *fdTreeItemDef="let item"
                [id]="item.id"
                [level]="item.level"
                [parentId]="item.parentId"
                [childNodes]="item.children"
            >
                <fd-icon fdTreeItemIcon [glyph]="item.data.icon" />
                <span fdTreeItemText>{{ item.data.title }}</span>
            </fd-tree-item>
        </fd-tree>
    `
})
class StoryTreeLazy {
    protected readonly items = new LazyChildren(1);
}

const meta: Meta<Tree> = {
    title: 'Components/Tree',
    component: Tree,
    decorators: [
        moduleMetadata({
            imports: [StoryTreeBasic, StoryTreeCustomization, StoryTreeStates, StoryTreeSelection, StoryTreeLazy]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'A tree shows a hierarchy of items that expand and collapse. Nest `fd-tree-item` elements, or pass a `dataSource` (an array, an Observable or a `TreeDataSource`) and an item template (`*fdTreeItemDef`); children of data items load when they expand. ' +
                    'Items can be navigatable, highlighted and selected (single or multiple, as a form control). The tree is one tab stop: Up and Down move between the items, Right and Left expand and collapse them and move between parents and children, Enter and Space select.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Tree>;

export const Basic: Story = { render: () => ({ template: `<story-tree-basic />` }) };
export const Customization: Story = { render: () => ({ template: `<story-tree-customization />` }) };
export const States: Story = {
    name: 'Navigation, highlights and buttons',
    render: () => ({ template: `<story-tree-states />` })
};
export const Selection: Story = { render: () => ({ template: `<story-tree-selection />` }) };
export const LazyLoading: Story = {
    name: 'Lazy loading',
    render: () => ({ template: `<story-tree-lazy />` })
};
