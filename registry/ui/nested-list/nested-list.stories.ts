import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import {
    NestedItem,
    NestedLink,
    NestedList,
    NestedListContent,
    NestedListExpandIcon,
    NestedListHeader,
    NestedListIcon,
    NestedListTitle,
    PreparedNestedList,
    type NestedListModel
} from './nested-list';

const NESTED = [
    NestedList,
    NestedItem,
    NestedLink,
    NestedListTitle,
    NestedListIcon,
    NestedListHeader,
    NestedListContent,
    NestedListExpandIcon
];

@Component({
    selector: 'story-nested-list',
    imports: [...NESTED],
    template: `
        <div class="flex gap-4">
            <div class="w-72 shadow-sap-content-shadow0">
                <ul fd-nested-list [textOnly]="textOnly()">
                    <li fd-nested-list-header>Overview</li>
                    @for (link of links; track link.title) {
                        <li fd-nested-list-item>
                            <a fd-nested-list-link [selected]="$first" (click)="chosen.set(link.title)">
                                @if (!textOnly()) {
                                    <i fd-nested-list-icon [glyph]="link.icon"></i>
                                }
                                <span fd-nested-list-title>{{ link.title }}</span>
                            </a>
                        </li>
                    }
                    <li fd-nested-list-header>Administration</li>
                    <li fd-nested-list-item [(expanded)]="settingsOpen">
                        <div fd-nested-list-content>
                            <a fd-nested-list-link>
                                @if (!textOnly()) {
                                    <i fd-nested-list-icon glyph="settings"></i>
                                }
                                <span fd-nested-list-title>Settings</span>
                            </a>
                            <button fd-nested-list-expand-icon></button>
                        </div>
                        <ul fd-nested-list textOnly>
                            @for (sub of settings; track sub) {
                                <li fd-nested-list-item>
                                    <a fd-nested-list-link (click)="chosen.set(sub)">
                                        <span fd-nested-list-title>{{ sub }}</span>
                                    </a>
                                </li>
                            }
                        </ul>
                    </li>
                </ul>
            </div>
            <p class="m-0 font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">
                Chosen: {{ chosen() || 'none' }}
            </p>
        </div>
    `
})
class StoryNestedList {
    readonly textOnly = input(false);
    protected readonly settingsOpen = signal(true);
    protected readonly chosen = signal('');
    protected readonly links = [
        { icon: 'home', title: 'Home' },
        { icon: 'crossed-line-chart', title: 'Analytics' },
        { icon: 'add-equipment', title: 'Equipment' }
    ];
    protected readonly settings = ['Profile', 'Security', 'Language'];
}

@Component({
    selector: 'story-nested-list-model',
    imports: [PreparedNestedList],
    template: `
        <div class="flex gap-4">
            <div class="w-72 shadow-sap-content-shadow0">
                <fd-prepared-nested-list [list]="list" />
            </div>
            <p class="m-0 font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">
                Chosen: {{ chosen() || 'none' }}
            </p>
        </div>
    `
})
class StoryNestedListModel {
    protected readonly chosen = signal('');
    private readonly pick = (name: string) => () => this.chosen.set(name);
    protected readonly list: NestedListModel = {
        items: [
            { headerTitle: 'Header Title 1' },
            { link: { icon: 'home', title: 'Link 1', callback: this.pick('Link 1') } },
            {
                expanded: true,
                link: { icon: 'activate', title: 'Link 2' },
                list: {
                    textOnly: true,
                    items: [
                        { link: { title: 'Sublink 1', callback: this.pick('Sublink 1') } },
                        { link: { title: 'Sublink 2', callback: this.pick('Sublink 2') } }
                    ]
                }
            },
            { headerTitle: 'Header Title 2' },
            { link: { icon: 'approvals', title: 'Link 3', callback: this.pick('Link 3') } }
        ]
    };
}

const meta: Meta<NestedList> = {
    title: 'Components/Nested List',
    component: NestedList,
    decorators: [moduleMetadata({ imports: [StoryNestedList, StoryNestedListModel] })],
    parameters: {
        docs: {
            description: {
                component:
                    'A tree of navigation links with group headers and expandable child lists, usable on its own or inside a side navigation. ' +
                    'Up and Down move across the visible rows (wrapping at the ends), Home and End jump to the first and last; Right opens a child list (Left in RTL) and Left closes it. ' +
                    'Clicking an item selects it and highlights its parents; before any click, the `selected` inputs show the selection.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<NestedList>;

export const Default: Story = { render: () => ({ template: `<story-nested-list />` }) };
export const TextOnly: Story = {
    name: 'Text only',
    render: () => ({ template: `<story-nested-list [textOnly]="true" />` })
};
export const FromData: Story = {
    name: 'From data',
    render: () => ({ template: `<story-nested-list-model />` })
};
