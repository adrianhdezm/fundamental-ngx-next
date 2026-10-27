import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { BusyIndicator } from '@/ui/busy-indicator/busy-indicator';
import { Button } from '@/ui/button/button';
import { Checkbox } from '@/ui/checkbox/checkbox';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { RadioButton } from '@/ui/radio/radio';
import {
    List,
    ListByline,
    ListBylineLeft,
    ListBylineRight,
    ListContent,
    ListFooter,
    ListGroupHeader,
    ListIcon,
    ListItem,
    ListLink,
    ListMessage,
    ListSecondary,
    ListSubline,
    ListThumbnail,
    ListTitle,
    ListTitleText
} from './list';

@Component({
    selector: 'story-growing-list',
    imports: [List, ListItem, ListTitle, ListTitleText, ListGroupHeader, ListFooter, BusyIndicator],
    template: `
        <ul fd-list aria-label="Grouped">
            <li fd-list-group-header><span fd-list-title>List group header</span></li>
            @for (i of items(); track i) {
                <li fd-list-item>
                    <span fd-list-title>List item {{ i }}</span>
                </li>
            }
            <li fd-list-item action growing>
                <button fd-list-title (click)="more()">
                    <fd-busy-indicator [loading]="loading()" size="s" ariaLabel="Loading" />
                    <span fd-list-title-text>Show more</span>
                </button>
            </li>
            <li fd-list-footer>List footer</li>
        </ul>
    `
})
class GrowingList {
    protected readonly items = signal([1, 2, 3]);
    protected readonly loading = signal(false);
    protected more(): void {
        this.loading.set(true);
        setTimeout(() => {
            this.items.update((list) => [...list, list.length + 1, list.length + 2]);
            this.loading.set(false);
        }, 600);
    }
}

const IMPORTS = [
    GrowingList,
    List,
    ListItem,
    ListTitle,
    ListTitleText,
    ListSecondary,
    ListIcon,
    ListLink,
    ListGroupHeader,
    ListFooter,
    ListMessage,
    ListContent,
    ListByline,
    ListBylineLeft,
    ListBylineRight,
    ListThumbnail,
    ListSubline,
    Avatar,
    BusyIndicator,
    Button,
    Checkbox,
    RadioButton,
    ContentDensityDirective,
    FormsModule
];
const grid = 'grid grid-cols-1 gap-8 lg:grid-cols-2';
const heading = 'm-0 mb-2 text-sap-font-header6-size font-sap-font-header-family text-sap-title-color';

const meta: Meta<List> = {
    title: 'Components/List',
    component: List,
    decorators: [moduleMetadata({ imports: IMPORTS })],
    parameters: {
        docs: {
            description: {
                component:
                    'Lists show items with titles, secondary text, icons, bylines, links and selection controls. One item is in the tab order; arrow keys, Home, End, Page Up and Page Down move between items.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<List>;

export const Default: Story = {
    name: 'Standard, secondary text and icons',
    render: () => ({
        template: `
            <div class="${grid}">
                <section>
                    <h3 class="${heading}">Standard (with unread items)</h3>
                    <ul fd-list aria-label="Standard list">
                        <li fd-list-item><span fd-list-title>List item 1</span></li>
                        <li fd-list-item><span fd-list-title>List item 2</span></li>
                        <li fd-list-item unread><span fd-list-title>Unread list item 3</span></li>
                        <li fd-list-item unread><span fd-list-title>Unread list item 4</span></li>
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Compact</h3>
                    <ul fd-list fdCompact aria-label="Compact list">
                        <li fd-list-item><span fd-list-title>List item 1</span></li>
                        <li fd-list-item><span fd-list-title>List item 2</span></li>
                        <li fd-list-item><span fd-list-title>List item 3</span></li>
                        <li fd-list-item><span fd-list-title>List item 4</span></li>
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Secondary text and counters</h3>
                    <ul fd-list aria-label="Secondary text">
                        <li fd-list-item><span fd-list-title>Neutral</span><span fd-list-secondary>Secondary</span></li>
                        <li fd-list-item><span fd-list-title>Positive</span><span fd-list-secondary type="positive">Approved</span></li>
                        <li fd-list-item><span fd-list-title>Critical</span><span fd-list-secondary type="critical">Pending</span></li>
                        <li fd-list-item><span fd-list-title>Negative</span><span fd-list-secondary type="negative">Rejected</span></li>
                        <li fd-list-item><span fd-list-title>Informative</span><span fd-list-secondary type="informative">New</span></li>
                        <li fd-list-item [counter]="1234.5"><span fd-list-title>With counter</span></li>
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Icons</h3>
                    <ul fd-list aria-label="Icons">
                        <li fd-list-item><i fd-list-icon glyph="cart"></i><span fd-list-title>Icon before</span></li>
                        <li fd-list-item><span fd-list-title>Icon after</span><i fd-list-icon glyph="wrench"></i></li>
                        <li fd-list-item><i fd-list-icon glyph="history"></i><span fd-list-title>Icon and secondary</span><span fd-list-secondary>Secondary</span></li>
                        <li fd-list-item><fd-avatar size="xs" label="John Doe" image="assets/person.svg" /><span fd-list-title>Avatar</span></li>
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Borderless</h3>
                    <ul fd-list noBorder aria-label="Borderless">
                        <li fd-list-item><span fd-list-title>List item 1</span></li>
                        <li fd-list-item selected><span fd-list-title>List item 2 (selected)</span></li>
                        <li fd-list-item><span fd-list-title>List item 3</span></li>
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Wrapping text</h3>
                    <ul fd-list aria-label="Wrapping">
                        <li fd-list-item>
                            <span fd-list-title wrap>A very long title that wraps onto several lines instead of being truncated with an ellipsis at the end of the item</span>
                            <span fd-list-secondary>Secondary</span>
                        </li>
                        <li fd-list-item><span fd-list-title>A very long title that is truncated with an ellipsis at the end of the list item</span></li>
                    </ul>
                </section>
            </div>`
    })
};

export const Interactive: Story = {
    name: 'Interactive, groups, actions and footer',
    render: () => ({
        template: `
            <div class="${grid}">
                <section>
                    <h3 class="${heading}">Interactive (click or Enter toggles selection)</h3>
                    <ul fd-list aria-label="Interactive">
                        <li fd-list-item interactive><span fd-list-title>List item 1</span></li>
                        <li fd-list-item interactive selected><span fd-list-title>List item 2</span></li>
                        <li fd-list-item interactive><span fd-list-title>List item 3</span><span fd-list-secondary>Secondary</span></li>
                        <li fd-list-item interactive inactive><span fd-list-title>Inactive item</span></li>
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Group header, growing item and footer</h3>
                    <story-growing-list />
                </section>
                <section>
                    <h3 class="${heading}">Action items</h3>
                    <ul fd-list aria-label="Actions">
                        <li fd-list-item><span fd-list-title>Regular item</span></li>
                        <li fd-list-item action><button fd-list-title>Action 1</button></li>
                        <li fd-list-item action><button fd-list-title>Action 2</button></li>
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Buttons in items</h3>
                    <ul fd-list aria-label="Buttons">
                        <li fd-list-item><span fd-list-title>Edit or delete</span><button fdButton variant="transparent" glyph="edit" ariaLabel="Edit"></button><button fdButton variant="transparent" glyph="delete" ariaLabel="Delete"></button></li>
                        <li fd-list-item><span fd-list-title>Message</span><span fd-list-secondary>Info</span><button fdButton variant="transparent" glyph="decline" ariaLabel="Remove"></button></li>
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Message</h3>
                    <ul fd-list hasMessage aria-label="With message">
                        <li fd-list-message type="error">Error message</li>
                        <li fd-list-item><span fd-list-title>List item 1</span></li>
                        <li fd-list-item><span fd-list-title>List item 2</span></li>
                    </ul>
                </section>
            </div>`
    })
};

export const Selection: Story = {
    render: () => ({
        props: {
            multi: [
                { label: 'Item 1', selected: true },
                { label: 'Item 2', selected: false },
                { label: 'Item 3', selected: false }
            ],
            single: 'radio2'
        },
        template: `
            <div class="${grid}">
                <section>
                    <h3 class="${heading}">Multi selection</h3>
                    <ul fd-list selection role="listbox" aria-multiselectable="true" aria-label="Multi selection">
                        @for (item of multi; track item.label) {
                            <li fd-list-item>
                                <fd-checkbox [(ngModel)]="item.selected" [ariaLabel]="item.label" />
                                <span fd-list-title>{{ item.label }}</span>
                            </li>
                        }
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Single selection (compact)</h3>
                    <ul fd-list selection fdCompact role="listbox" aria-label="Single selection">
                        @for (v of ['radio1', 'radio2', 'radio3']; track v) {
                            <li fd-list-item>
                                <fd-radio-button name="list-radio" [value]="v" [(ngModel)]="single" [ariaLabel]="v" />
                                <span fd-list-title>{{ v }}</span>
                            </li>
                        }
                    </ul>
                    <p class="m-0 mt-2 text-sap-font-small-size text-sap-content-label-color">Selected: {{ single }}</p>
                </section>
            </div>`
    })
};

export const Navigation: Story = {
    name: 'Navigation (links)',
    render: () => ({
        template: `
            <div class="${grid}">
                <section>
                    <h3 class="${heading}">Links</h3>
                    <ul fd-list aria-label="Navigation">
                        <li fd-list-item><a fd-list-link href="#"><span fd-list-title>List item 1</span></a></li>
                        <li fd-list-item><a fd-list-link href="#" navigated><i fd-list-icon glyph="history"></i><span fd-list-title>List item 2 (navigated)</span></a></li>
                        <li fd-list-item selected><a fd-list-link href="#"><span fd-list-title>List item 3 (selected)</span><i fd-list-icon glyph="map"></i></a></li>
                        <li fd-list-item [counter]="42"><a fd-list-link href="#"><i fd-list-icon glyph="cart"></i><span fd-list-title>List item 4 with counter</span></a></li>
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Navigation indicator</h3>
                    <ul fd-list navigationIndicator aria-label="Navigation indicator">
                        <li fd-list-item><a fd-list-link href="#" navigationIndicator><span fd-list-title>List item 1</span></a></li>
                        <li fd-list-item><a fd-list-link href="#" navigationIndicator><span fd-list-title>List item 2</span><span fd-list-secondary>Secondary</span></a></li>
                        <li fd-list-item><a fd-list-link href="#"><span fd-list-title>Without indicator</span></a></li>
                    </ul>
                </section>
            </div>`
    })
};

export const Byline: Story = {
    name: 'Byline and subline',
    render: () => ({
        template: `
            <div class="${grid}">
                <section>
                    <h3 class="${heading}">Byline</h3>
                    <ul fd-list byline aria-label="Byline">
                        <li fd-list-item>
                            <span fd-list-thumbnail><fd-avatar size="s" label="John Doe" image="assets/person.svg" /></span>
                            <div fd-list-content><div fd-list-title>Title</div><div fd-list-byline>Byline (description)</div></div>
                        </li>
                        <li fd-list-item>
                            <i fd-list-thumbnail fd-list-icon glyph="activate"></i>
                            <div fd-list-content>
                                <div fd-list-title>Two-column byline</div>
                                <div fd-list-byline twoCol><div fd-list-byline-left>First text item</div><div fd-list-byline-right status="positive">Available</div></div>
                            </div>
                        </li>
                        <li fd-list-item unread>
                            <div fd-list-content>
                                <div fd-list-title>Unread item</div>
                                <div fd-list-byline twoCol><div fd-list-byline-left>Byline</div><div fd-list-byline-right status="negative">Overdue</div></div>
                            </div>
                        </li>
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Byline navigation</h3>
                    <ul fd-list byline navigationIndicator aria-label="Byline navigation">
                        <li fd-list-item>
                            <a fd-list-link href="#" navigationIndicator>
                                <span fd-list-thumbnail><fd-avatar size="s" glyph="product" ariaLabel="Product" /></span>
                                <div fd-list-content><div fd-list-title>Notebook Basic 15</div><div fd-list-byline>HT-1000</div></div>
                            </a>
                        </li>
                        <li fd-list-item>
                            <a fd-list-link href="#" navigationIndicator>
                                <span fd-list-thumbnail><fd-avatar size="s" glyph="product" ariaLabel="Product" /></span>
                                <div fd-list-content><div fd-list-title>Notebook Basic 17</div><div fd-list-byline>HT-1001</div></div>
                            </a>
                        </li>
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Subline</h3>
                    <ul fd-list subline aria-label="Subline">
                        <li fd-list-item>
                            <fd-avatar size="s" label="Jane Doe" />
                            <div fd-list-content><div fd-list-title>Jane Doe</div><div fd-list-subline>Software Developer</div></div>
                        </li>
                        <li fd-list-item>
                            <fd-avatar size="s" label="Max Mustermann" />
                            <div fd-list-content><div fd-list-title>Max Mustermann</div><div fd-list-subline>Product Owner</div></div>
                        </li>
                    </ul>
                </section>
            </div>`
    })
};
