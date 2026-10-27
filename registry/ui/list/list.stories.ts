import { Component, computed, signal, viewChild, type ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { BusyIndicator } from '@/ui/busy-indicator/busy-indicator';
import { Button } from '@/ui/button/button';
import { Checkbox } from '@/ui/checkbox/checkbox';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { Icon } from '@/ui/icon/icon';
import { InfiniteScroll } from '@/ui/infinite-scroll/infinite-scroll';
import { InputGroup } from '@/ui/input-group/input-group';
import { RadioButton } from '@/ui/radio/radio';
import { Skeleton } from '@/ui/skeleton/skeleton';
import { Toolbar, ToolbarLabel, ToolbarSpacer } from '@/ui/toolbar/toolbar';
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

@Component({
    selector: 'story-list-filter-sort',
    imports: [List, ListItem, ListTitle, Button, InputGroup, Toolbar, ToolbarLabel, ToolbarSpacer, FormsModule],
    template: `
        <div class="max-w-xl">
            <fd-toolbar ariaLabel="Filter and sort">
                <label fd-toolbar-label for="list-filter-search">Filter for list elements</label>
                <fd-toolbar-spacer />
                <fd-input-group
                    inputId="list-filter-search"
                    glyph="decline"
                    glyphAriaLabel="Clear"
                    placeholder="Search"
                    button
                    [(ngModel)]="term"
                    (addOnButtonClicked)="term.set('')"
                />
                <button
                    fdButton
                    glyph="sort-ascending"
                    ariaLabel="Sort ascending"
                    title="Sort ascending"
                    (click)="ascending.set(true)"
                ></button>
                <button
                    fdButton
                    glyph="sort-descending"
                    ariaLabel="Sort descending"
                    title="Sort descending"
                    (click)="ascending.set(false)"
                ></button>
            </fd-toolbar>
            <ul fd-list aria-label="Fruits">
                @for (item of shown(); track item) {
                    <li fd-list-item>
                        <span fd-list-title>{{ item }}</span>
                        <button
                            fdButton
                            variant="transparent"
                            glyph="delete"
                            [ariaLabel]="'Remove ' + item"
                            title="Remove"
                            (click)="remove(item)"
                        ></button>
                    </li>
                } @empty {
                    <li fd-list-item noData><span fd-list-title>No results found!</span></li>
                }
            </ul>
            <p class="m-0 mt-2 text-sap-font-small-size text-sap-content-label-color" aria-live="polite">
                Sorted {{ ascending() ? 'ascending' : 'descending' }}
            </p>
        </div>
    `
})
class FilterSortList {
    protected readonly term = signal('');
    protected readonly ascending = signal(true);
    private readonly items = signal(['Apple', 'Banana', 'Orange', 'Pineapple', 'Strawberry']);
    protected readonly shown = computed(() => {
        const term = this.term().toLocaleLowerCase();
        const sign = this.ascending() ? 1 : -1;
        return this.items()
            .filter((item) => item.toLocaleLowerCase().includes(term))
            .sort((a, b) => a.localeCompare(b) * sign);
    });
    protected remove(item: string): void {
        this.items.update((items) => items.filter((i) => i !== item));
    }
}

@Component({
    selector: 'story-list-keyboard',
    imports: [List, ListItem, ListTitle, Button],
    template: `
        <div class="flex max-w-md flex-col items-start gap-4">
            <button
                #before
                fdButton
                label="Focused when the focus leaves the list upwards"
                (click)="list().setItemActive(0)"
            ></button>
            <ul fd-list aria-label="Keyboard support" (focusEscapeList)="escaped($event)">
                @for (i of [1, 2, 3, 4]; track i) {
                    <li fd-list-item>
                        <span fd-list-title>List item {{ i }}</span>
                    </li>
                }
            </ul>
            <p class="m-0 text-sap-font-small-size text-sap-content-label-color" aria-live="polite">{{ message() }}</p>
        </div>
    `
})
class KeyboardList {
    protected readonly list = viewChild.required(List);
    private readonly before = viewChild.required<ElementRef<HTMLElement>>('before');
    protected readonly message = signal(
        'Arrow Up on the first item focuses the button; the button focuses the first item.'
    );
    protected escaped(direction: 'up' | 'down'): void {
        if (direction === 'up') this.before().nativeElement.focus();
        else this.message.set('End of list reached');
    }
}

@Component({
    selector: 'story-list-infinite',
    imports: [List, ListItem, ListTitle, BusyIndicator, InfiniteScroll],
    template: `
        <fd-busy-indicator size="l" block [loading]="loading()" ariaLabel="Loading" class="max-w-md">
            <ul
                fd-list
                fdInfiniteScroll
                [scrollOffset]="40"
                (onScrollAction)="more()"
                aria-label="Infinite scroll"
                class="scrollbar-sap block max-h-[15.625rem] overflow-y-scroll"
            >
                @for (item of items(); track $index) {
                    <li fd-list-item>
                        <span fd-list-title>{{ item }}</span>
                    </li>
                }
            </ul>
        </fd-busy-indicator>
    `
})
class InfiniteList {
    protected readonly items = signal<string[]>(Array.from({ length: 10 }, () => 'Initially shown item'));
    protected readonly loading = signal(false);
    protected more(): void {
        if (this.loading()) return;
        this.loading.set(true);
        setTimeout(() => {
            this.items.update((items) => [
                ...items,
                ...Array.from({ length: 5 }, (_, i) => `Element ${items.length + i}`)
            ]);
            this.loading.set(false);
        }, 1000);
    }
}

@Component({
    selector: 'story-list-loading',
    imports: [List, ListItem, ListTitle, ListContent, ListByline, ListThumbnail, Button, Icon, Skeleton],
    template: `
        <button
            fdButton
            class="mb-4"
            [label]="loading() ? 'Show items' : 'Show loading'"
            (click)="loading.set(!loading())"
        ></button>
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <ul fd-list aria-label="Loading list" [attr.aria-busy]="loading() || null">
                @for (i of [1, 2, 3]; track i) {
                    <li fd-list-item>
                        @if (loading()) {
                            <fd-skeleton type="text" width="40%" [textLines]="1" class="my-auto" />
                        } @else {
                            <span fd-list-title>List item {{ i }}</span>
                        }
                    </li>
                }
            </ul>
            <ul fd-list byline aria-label="Loading byline list" [attr.aria-busy]="loading() || null">
                @for (i of [1, 2, 3]; track i) {
                    <li fd-list-item>
                        @if (loading()) {
                            <fd-skeleton width="100%" height="48px" class="my-auto">
                                <svg:rect x="0" y="0" width="48" height="48" rx="4" />
                                <svg:rect x="60" y="0" width="40%" height="12" rx="4" />
                                <svg:rect x="60" y="20" width="30%" height="8" rx="4" />
                            </fd-skeleton>
                        } @else {
                            <span fd-list-thumbnail><fd-icon glyph="activate" /></span>
                            <div fd-list-content>
                                <div fd-list-title>Title {{ i }}</div>
                                <div fd-list-byline>Byline text</div>
                            </div>
                        }
                    </li>
                }
            </ul>
        </div>
    `
})
class LoadingList {
    protected readonly loading = signal(true);
}

const IMPORTS = [
    GrowingList,
    FilterSortList,
    KeyboardList,
    InfiniteList,
    LoadingList,
    Icon,
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
            disabled: [
                { label: 'Item 1', selected: true },
                { label: 'Item 2', selected: false },
                { label: 'Item 3', selected: true }
            ],
            compact: [
                { label: 'Item 1', selected: false },
                { label: 'Item 2', selected: true },
                { label: 'Item 3', selected: false }
            ],
            single: 'radio2',
            singleCompact: 'radio1'
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
                    <h3 class="${heading}">Multi selection with disabled checkboxes</h3>
                    <ul fd-list selection role="listbox" aria-multiselectable="true" aria-label="Multi selection, disabled">
                        @for (item of disabled; track item.label) {
                            <li fd-list-item aria-disabled="true">
                                <fd-checkbox [(ngModel)]="item.selected" disabled [ariaLabel]="item.label" />
                                <span fd-list-title>{{ item.label }}</span>
                            </li>
                        }
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Multi selection (compact)</h3>
                    <ul fd-list selection fdCompact role="listbox" aria-multiselectable="true" aria-label="Compact multi selection">
                        @for (item of compact; track item.label) {
                            <li fd-list-item>
                                <fd-checkbox [(ngModel)]="item.selected" [ariaLabel]="item.label" />
                                <span fd-list-title>{{ item.label }}</span>
                            </li>
                        }
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">Single selection</h3>
                    <ul fd-list selection role="listbox" aria-label="Single selection">
                        @for (v of ['radio1', 'radio2', 'radio3']; track v) {
                            <li fd-list-item>
                                <fd-radio-button name="list-radio-cozy" [value]="v" [(ngModel)]="single" [ariaLabel]="v" />
                                <span fd-list-title>{{ v }}</span>
                            </li>
                        }
                    </ul>
                    <p class="m-0 mt-2 text-sap-font-small-size text-sap-content-label-color">Selected: {{ single }}</p>
                </section>
                <section>
                    <h3 class="${heading}">Single selection (compact)</h3>
                    <ul fd-list selection fdCompact role="listbox" aria-label="Compact single selection">
                        @for (v of ['radio1', 'radio2', 'radio3']; track v) {
                            <li fd-list-item>
                                <fd-radio-button name="list-radio" [value]="v" [(ngModel)]="singleCompact" [ariaLabel]="v" />
                                <span fd-list-title>{{ v }}</span>
                            </li>
                        }
                    </ul>
                    <p class="m-0 mt-2 text-sap-font-small-size text-sap-content-label-color">Selected: {{ singleCompact }}</p>
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

export const FilterSort: Story = {
    name: 'Filter and sort',
    render: () => ({ template: `<story-list-filter-sort />` })
};

export const Complex: Story = {
    name: 'Complex (borderless, groups and footer)',
    render: () => ({
        template: `
            <ul fd-list noBorder aria-label="Complex list" class="max-w-xl">
                <li fd-list-group-header><span fd-list-title>Group Header 1</span></li>
                <li fd-list-item><i fd-list-icon glyph="cart"></i><span fd-list-title>List item 1</span></li>
                <li fd-list-item><i fd-list-icon glyph="wrench"></i><span fd-list-title>List item 2</span></li>
                <li fd-list-item><i fd-list-icon glyph="lightbulb"></i><span fd-list-title>List item 3</span></li>
                <li fd-list-item><i fd-list-icon glyph="history"></i><span fd-list-title>List item 4</span></li>
                <li fd-list-group-header><span fd-list-title>Group Header 2</span></li>
                <li fd-list-item><i fd-list-icon glyph="cart"></i><span fd-list-title>List item 5</span></li>
                <li fd-list-item><i fd-list-icon glyph="wrench"></i><span fd-list-title>List item 6</span></li>
                <li fd-list-item><i fd-list-icon glyph="lightbulb"></i><span fd-list-title>List item 7</span></li>
                <li fd-list-item><i fd-list-icon glyph="history"></i><span fd-list-title>List item 8</span></li>
                <li fd-list-footer>Footer text</li>
            </ul>`
    })
};

export const KeyboardSupport: Story = {
    name: 'Keyboard support',
    render: () => ({ template: `<story-list-keyboard />` })
};

export const InfiniteScrollList: Story = {
    name: 'Infinite scroll',
    render: () => ({ template: `<story-list-infinite />` })
};

export const Loading: Story = {
    render: () => ({ template: `<story-list-loading />` })
};

const longText =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ut laoreet lorem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aenean sagittis aliquam justo et suscipit.';

export const BylineBorderless: Story = {
    name: 'Byline: borderless',
    render: () => ({
        template: `
            <ul fd-list byline noBorder aria-label="Borderless byline" class="max-w-xl">
                <li fd-list-item>
                    <span fd-list-thumbnail><fd-icon glyph="activate" /></span>
                    <div fd-list-content><div fd-list-title>Title</div><div fd-list-byline>Byline Text</div></div>
                </li>
                <li fd-list-item>
                    <span fd-list-thumbnail><fd-icon glyph="employee" /></span>
                    <div fd-list-content><div fd-list-title>List item with no byline</div></div>
                </li>
                <li fd-list-item>
                    <span fd-list-thumbnail><fd-icon glyph="calendar" /></span>
                    <div fd-list-content>
                        <div fd-list-title>List Item With Two-Column Byline</div>
                        <div fd-list-byline twoCol>
                            <div fd-list-byline-left>First text item in Byline (Standard text item)</div>
                            <div fd-list-byline-right>Second text item in Byline (Can be semantic (Status) or not)</div>
                        </div>
                    </div>
                </li>
            </ul>`
    })
};

export const BylineSelection: Story = {
    name: 'Byline: selection',
    render: () => ({
        props: {
            items: [
                { title: 'Title 1', byline: 'Byline 1', glyph: 'calendar', selected: false },
                { title: 'Title 2', byline: 'Byline 2', glyph: 'activate', selected: true },
                { title: 'Title 3', byline: 'Byline 3', glyph: 'employee', selected: false }
            ],
            single: 'radio1'
        },
        template: `
            <div class="${grid}">
                <section>
                    <h3 class="${heading}">With checkboxes</h3>
                    <ul fd-list byline selection role="listbox" aria-multiselectable="true" aria-label="Byline with checkboxes">
                        @for (item of items; track item.title) {
                            <li fd-list-item>
                                <fd-checkbox [(ngModel)]="item.selected" [ariaLabel]="item.title" />
                                <span fd-list-thumbnail><fd-icon [glyph]="item.glyph" /></span>
                                <div fd-list-content><div fd-list-title>{{ item.title }}</div><div fd-list-byline>{{ item.byline }}</div></div>
                            </li>
                        }
                    </ul>
                </section>
                <section>
                    <h3 class="${heading}">With radio buttons</h3>
                    <ul fd-list byline selection role="listbox" aria-label="Byline with radio buttons">
                        @for (item of items; track item.title; let i = $index) {
                            <li fd-list-item>
                                <fd-radio-button name="list-byline-radio" [value]="'radio' + (i + 1)" [(ngModel)]="single" [ariaLabel]="item.title" />
                                <span fd-list-thumbnail><fd-icon [glyph]="item.glyph" /></span>
                                <div fd-list-content><div fd-list-title>{{ item.title }}</div><div fd-list-byline>{{ item.byline }}</div></div>
                            </li>
                        }
                    </ul>
                </section>
            </div>`
    })
};

export const BylineButtons: Story = {
    name: 'Byline: buttons and counter',
    render: () => ({
        template: `
            <ul fd-list byline aria-label="Byline with buttons" class="max-w-xl">
                <li fd-list-item>
                    <span fd-list-thumbnail><fd-icon glyph="activate" /></span>
                    <div fd-list-content><div fd-list-title>Title</div><div fd-list-byline>Byline Text</div></div>
                    <button fdButton variant="transparent" glyph="edit" ariaLabel="Edit" title="Edit"></button>
                    <button fdButton variant="transparent" glyph="decline" ariaLabel="Decline" title="Decline"></button>
                </li>
                <li fd-list-item [counter]="132441">
                    <span fd-list-thumbnail><fd-icon glyph="activate" /></span>
                    <div fd-list-content><div fd-list-title>Byline list with counter</div><div fd-list-byline>Byline Text</div></div>
                </li>
            </ul>`
    })
};

export const BylineWrap: Story = {
    name: 'Byline: wrap',
    render: () => ({
        props: { longText },
        template: `
            <ul fd-list byline aria-label="Wrapping byline" class="max-w-xl">
                <li fd-list-item>
                    <span fd-list-thumbnail><fd-icon glyph="activate" /></span>
                    <div fd-list-content>
                        <div fd-list-title wrap>Long Title - {{ longText }}</div>
                        <div fd-list-byline wrap>Long byline text - {{ longText }}</div>
                    </div>
                </li>
                <li fd-list-item>
                    <span fd-list-thumbnail><fd-icon glyph="activate" /></span>
                    <div fd-list-content>
                        <div fd-list-title wrap>Long Title - {{ longText }}</div>
                        <div fd-list-byline twoCol>
                            <div fd-list-byline-left wrap>Long First Column - {{ longText }}</div>
                            <div fd-list-byline-right wrap>Long Second Column - {{ longText }}</div>
                        </div>
                    </div>
                </li>
            </ul>`
    })
};

export const BylineInteractive: Story = {
    name: 'Byline: interactive',
    render: () => ({
        template: `
            <ul fd-list byline aria-label="Interactive byline" class="max-w-xl">
                <li fd-list-item interactive>
                    <span fd-list-thumbnail><fd-icon glyph="activate" /></span>
                    <div fd-list-content><div fd-list-title>Title</div><div fd-list-byline>Byline Text</div></div>
                </li>
                <li fd-list-item interactive>
                    <span fd-list-thumbnail><fd-icon glyph="employee" /></span>
                    <div fd-list-content><div fd-list-title>Title</div><div fd-list-byline>Byline Text</div></div>
                </li>
                <li fd-list-item interactive selected>
                    <span fd-list-thumbnail><fd-icon glyph="calendar" /></span>
                    <div fd-list-content><div fd-list-title>Title (selected)</div><div fd-list-byline>Byline Text</div></div>
                </li>
                <li fd-list-item interactive selected>
                    <span fd-list-thumbnail><fd-icon glyph="activate" /></span>
                    <div fd-list-content><div fd-list-title>Title (selected)</div><div fd-list-byline>Byline Text</div></div>
                </li>
            </ul>`
    })
};

export const BylineUnread: Story = {
    name: 'Byline: unread',
    render: () => ({
        template: `
            <ul fd-list byline unreadIndicator aria-label="Unread byline" class="max-w-xl">
                <li fd-list-item unread aria-description="unread">
                    <span fd-list-thumbnail><fd-icon glyph="activate" /></span>
                    <div fd-list-content><div fd-list-title>Title</div><div fd-list-byline>Byline Text</div></div>
                </li>
                <li fd-list-item>
                    <span fd-list-thumbnail><fd-icon glyph="employee" /></span>
                    <div fd-list-content><div fd-list-title>List item with no byline</div></div>
                </li>
                <li fd-list-item unread aria-description="unread">
                    <span fd-list-thumbnail><fd-icon glyph="calendar" /></span>
                    <div fd-list-content>
                        <div fd-list-title>List Item With Two-Column Byline</div>
                        <div fd-list-byline twoCol>
                            <div fd-list-byline-left>First text item in Byline (Standard text item)</div>
                            <div fd-list-byline-right>Second text item in Byline (Can be semantic (Status) or not)</div>
                        </div>
                    </div>
                </li>
                <li fd-list-item>
                    <div fd-list-content><div fd-list-title>Text-Only List Item</div><div fd-list-byline>Byline Text (description)</div></div>
                </li>
            </ul>`
    })
};
