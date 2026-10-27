import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Icon } from '@/ui/icon/icon';
import { List } from '@/ui/list/list';
import {
    ListNavigationItem,
    ListNavigationItemArrow,
    ListNavigationItemText,
    VerticalNavigation,
    VerticalNavigationGroupHeader
} from './vertical-navigation';

const IMPORTS = [
    VerticalNavigation,
    VerticalNavigationGroupHeader,
    ListNavigationItem,
    ListNavigationItemText,
    ListNavigationItemArrow,
    List,
    Icon
];

interface Entry {
    glyph?: string;
    text: string;
    children?: string[];
}

@Component({
    selector: 'story-vertical-nav',
    imports: IMPORTS,
    template: `
        <div class="flex h-[30rem] items-start gap-6">
            <fd-vertical-navigation [condensed]="condensed()">
                @for (entry of entries; track entry.text) {
                    <li
                        fd-list-navigation-item
                        [indicated]="current() === entry.text"
                        [expanded]="expandFirst() && $index === 1"
                        (click)="!entry.children && current.set(entry.text)"
                    >
                        @if (icons() && entry.glyph) {
                            <fd-icon [glyph]="entry.glyph" />
                        }
                        <span fd-list-navigation-item-text>{{ entry.text }}</span>
                        @if (entry.children) {
                            <button fd-list-navigation-item-arrow></button>
                        }
                        <!-- a separate block: the list is projected on its own -->
                        @if (entry.children) {
                            <ul fd-list>
                                @for (child of entry.children; track child) {
                                    <li
                                        fd-list-navigation-item
                                        [indicated]="current() === child"
                                        (click)="current.set(child)"
                                    >
                                        <span fd-list-navigation-item-text>{{ child }}</span>
                                    </li>
                                }
                            </ul>
                        }
                    </li>
                }
                @if (grouping()) {
                    <li fd-vertical-navigation-group-header>Employee Services</li>
                    @for (entry of services; track entry.text) {
                        <li
                            fd-list-navigation-item
                            [indicated]="current() === entry.text"
                            (click)="current.set(entry.text)"
                        >
                            <fd-icon [glyph]="entry.glyph" />
                            <span fd-list-navigation-item-text>{{ entry.text }}</span>
                        </li>
                    }
                }
            </fd-vertical-navigation>
            <p class="m-0 font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">
                Current page: {{ current() }}
            </p>
        </div>
    `
})
class StoryVerticalNav {
    readonly condensed = input(false);
    readonly icons = input(true);
    readonly grouping = input(false);
    readonly expandFirst = input(false);
    readonly initial = input('Overview');
    protected readonly current = signal('');
    protected readonly entries: Entry[] = [
        { glyph: 'home', text: 'Overview' },
        { glyph: 'calendar', text: 'Calendar', children: ['Today', 'Upcoming Events Upcoming Events'] },
        { glyph: 'customer', text: 'Customers', children: ['Accounts', 'Contacts'] },
        { glyph: 'shipping-status', text: 'Deliveries' }
    ];
    protected readonly services: Entry[] = [
        { glyph: 'headset', text: 'Support' },
        { glyph: 'meal', text: 'Lunch' },
        { glyph: 'stethoscope', text: 'Health' }
    ];

    constructor() {
        queueMicrotask(() => this.current.set(this.initial()));
    }
}

const meta: Meta<VerticalNavigation> = {
    title: 'Components/Vertical Navigation',
    component: VerticalNavigation,
    decorators: [moduleMetadata({ imports: [StoryVerticalNav] })],
    parameters: {
        docs: {
            description: {
                component:
                    'The vertical navigation lists the pages of an application with icons, texts and second-level items; `indicated` marks the current page (on a collapsed parent when a child is current). ' +
                    'Condensed, it shows the icons only and opens second-level items in a panel over the content. ' +
                    'Up and Down move between visible items, Right and Left (mirrored in RTL) expand and collapse, Enter and Space toggle or activate.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<VerticalNavigation>;

export const Default: Story = {
    render: () => ({ template: `<story-vertical-nav [expandFirst]="true" initial="Today" />` })
};
export const Condensed: Story = {
    render: () => ({ template: `<story-vertical-nav [condensed]="true" initial="Today" />` })
};
export const Grouping: Story = {
    render: () => ({ template: `<story-vertical-nav [grouping]="true" initial="Support" />` })
};
export const NoIcons: Story = {
    name: 'No icons',
    render: () => ({ template: `<story-vertical-nav [icons]="false" [expandFirst]="true" />` })
};
export const OpenCondensed: Story = {
    name: 'Open: condensed panel',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-vertical-nav [condensed]="true" [expandFirst]="true" initial="Today" />` })
};
