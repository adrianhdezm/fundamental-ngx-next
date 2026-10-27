import { Component, computed, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '@/ui/button/button';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { FormItem, FormLabel } from '@/ui/form/form';
import { InputGroup } from '@/ui/input-group/input-group';
import { Title } from '@/ui/title/title';
import { TabItem, TabLink, TabList, TabNav, TabPanel, TabTag, TabTitle, type TabModes, type TabSizes } from './tabs';

const content = 'block p-4 font-sap-font-family text-sap-font-size text-sap-text-color';
const heading = 'mt-6 mb-2 first:mt-0';

@Component({
    selector: 'story-tabs-basic',
    imports: [TabList, TabPanel, TabTitle, TabTag, Title],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Tabs from titles</h3>
        <fd-tab-list ariaLabel="Basic tabs">
            <fd-tab title="Link 1"><span class="${content}">Content for tab 1</span></fd-tab>
            <fd-tab title="Link 2"><span class="${content}">Content for tab 2</span></fd-tab>
            <fd-tab title="Link 3"><span class="${content}">Content for tab 3</span></fd-tab>
            <fd-tab title="Disabled" disabled><span class="${content}">Not shown</span></fd-tab>
        </fd-tab-list>

        <h3 fdTitle headerSize="5" class="${heading}">Semantic tabs</h3>
        <fd-tab-list ariaLabel="Semantic tabs">
            <fd-tab title="Success" tabState="success"><span class="${content}">Success content</span></fd-tab>
            <fd-tab title="Error" tabState="error"><span class="${content}">Error content</span></fd-tab>
            <fd-tab title="Warning" tabState="warning"><span class="${content}">Warning content</span></fd-tab>
            <fd-tab title="Information" tabState="information"
                ><span class="${content}">Information content</span></fd-tab
            >
            <fd-tab title="Neutral" tabState="neutral"><span class="${content}">Neutral content</span></fd-tab>
        </fd-tab-list>

        <h3 fdTitle headerSize="5" class="${heading}">Tabs with title templates and counts</h3>
        <fd-tab-list ariaLabel="Templated tabs" size="s">
            <fd-tab count="12">
                <ng-template fdTabTitleTemplate
                    ><span fd-tab-tag>Inbox <b>(12)</b></span></ng-template
                >
                <span class="${content}">Inbox</span>
            </fd-tab>
            <fd-tab title="Drafts" count="3"><span class="${content}">Drafts</span></fd-tab>
            <fd-tab title="Sent"><span class="${content}">Sent</span></fd-tab>
        </fd-tab-list>
    `
})
class StoryTabsBasic {}

@Component({
    selector: 'story-tabs-modes',
    imports: [TabList, TabPanel, Title],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Icon only</h3>
        <fd-tab-list mode="icon-only" ariaLabel="Icon only tabs">
            <fd-tab glyph="cart" title="Cart" count="3"><span class="${content}">Cart</span></fd-tab>
            <fd-tab glyph="employee" title="Employees" tabState="success"
                ><span class="${content}">Employees</span></fd-tab
            >
            <fd-tab glyph="alert" title="Alerts" tabState="warning" count="99"
                ><span class="${content}">Alerts</span></fd-tab
            >
            <fd-tab glyph="calendar" title="Calendar"><span class="${content}">Calendar</span></fd-tab>
        </fd-tab-list>

        <h3 fdTitle headerSize="5" class="${heading}">Process</h3>
        <fd-tab-list mode="process" ariaLabel="Process tabs">
            <fd-tab glyph="cart" title="Order" count="1 step"><span class="${content}">Order</span></fd-tab>
            <fd-tab glyph="shipping-status" title="Shipping" count="2 steps"
                ><span class="${content}">Shipping</span></fd-tab
            >
            <fd-tab glyph="paid-leave" title="Payment" count="3 steps"><span class="${content}">Payment</span></fd-tab>
        </fd-tab-list>

        <h3 fdTitle headerSize="5" class="${heading}">Filter</h3>
        <fd-tab-list mode="filter" ariaLabel="Filter tabs">
            <fd-tab header title="Products" count="120"><span class="${content}">All products</span></fd-tab>
            <fd-tab glyph="hint" title="New" count="12" tabState="information"
                ><span class="${content}">New products</span></fd-tab
            >
            <fd-tab glyph="message-success" title="In stock" count="80" tabState="success"
                ><span class="${content}">In stock</span></fd-tab
            >
            <fd-tab glyph="message-warning" title="Low stock" count="20" tabState="warning"
                ><span class="${content}">Low stock</span></fd-tab
            >
            <fd-tab glyph="message-error" title="Out of stock" count="8" tabState="error"
                ><span class="${content}">Out of stock</span></fd-tab
            >
        </fd-tab-list>
    `
})
class StoryTabsModes {}

@Component({
    selector: 'story-tabs-behaviour',
    imports: [TabList, TabPanel, Title, Button],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Overflow into a "More" menu</h3>
        <div class="max-w-xl">
            <fd-tab-list ariaLabel="Many tabs">
                @for (tab of many; track tab) {
                    <fd-tab [title]="tab"
                        ><span class="${content}">Content of {{ tab }}</span></fd-tab
                    >
                }
            </fd-tab-list>
        </div>

        <h3 fdTitle headerSize="5" class="${heading}">Collapsible, at most three visible</h3>
        <fd-tab-list ariaLabel="Collapsible tabs" collapsibleTabs [maxVisibleTabs]="3">
            @for (tab of many.slice(0, 6); track tab) {
                <fd-tab [title]="tab"
                    ><span class="${content}">Content of {{ tab }}</span></fd-tab
                >
            }
        </fd-tab-list>

        <h3 fdTitle headerSize="5" class="${heading}">Programmatic selection and added tabs</h3>
        <div class="mb-2 flex gap-2">
            <button fdButton label="Select tab 2" (click)="list.selectTab('story-tab-2')"></button>
            <button fdButton label="Add tab" (click)="added.update((a) => [...a, a.length + 4])"></button>
            <button fdButton label="Remove tab" (click)="added.update((a) => a.slice(0, -1))"></button>
        </div>
        <fd-tab-list #list ariaLabel="Dynamic tabs" (selectedTabIndexChange)="index.set($event)">
            <fd-tab id="story-tab-1" title="Tab 1"><span class="${content}">Tab 1</span></fd-tab>
            <fd-tab id="story-tab-2" title="Tab 2"><span class="${content}">Tab 2</span></fd-tab>
            <fd-tab id="story-tab-3" title="Tab 3"><span class="${content}">Tab 3</span></fd-tab>
            @for (n of added(); track n) {
                <fd-tab [title]="'Tab ' + n"
                    ><span class="${content}">Tab {{ n }}</span></fd-tab
                >
            }
        </fd-tab-list>
        <p class="${content} px-0">Selected index: {{ index() }}</p>
    `
})
class StoryTabsBehaviour {
    protected readonly many = [
        'Overview',
        'Details',
        'Notes',
        'Attachments',
        'History',
        'Approvals',
        'Related',
        'Settings',
        'Logs',
        'Audit'
    ];
    protected readonly added = signal<number[]>([]);
    protected readonly index = signal(0);
}

@Component({
    selector: 'story-tabs-stacked',
    imports: [TabList, TabPanel],
    template: `
        <div class="h-96">
            <fd-tab-list ariaLabel="Stacked sections" stackContent>
                @for (section of sections; track section) {
                    <fd-tab [title]="section">
                        <div class="${content} h-60 border-0 border-b border-solid border-sap-group-title-border-color">
                            <h4 class="m-0 mb-2">{{ section }}</h4>
                            <p class="m-0">
                                Scroll the content: the tabs follow. Click a tab to scroll to its section.
                            </p>
                        </div>
                    </fd-tab>
                }
            </fd-tab-list>
        </div>
    `
})
class StoryTabsStacked {
    protected readonly sections = ['General', 'Address', 'Contacts', 'Payment', 'Notes'];
}

@Component({
    selector: 'story-tabs-nav',
    imports: [TabNav, TabItem, TabLink, TabTag],
    template: `
        <nav fd-tab-nav aria-label="Pages">
            @for (page of pages; track page) {
                <div fd-tab-item>
                    <a
                        fd-tab-link
                        href="#"
                        [active]="active() === page"
                        (click)="$event.preventDefault(); active.set(page)"
                    >
                        <span fd-tab-tag>{{ page }}</span>
                    </a>
                </div>
            }
        </nav>
        <p class="${content} px-0">Showing the {{ active() }} page</p>
    `
})
class StoryTabsNav {
    protected readonly pages = ['Home', 'Products', 'Orders', 'Customers'];
    protected readonly active = signal('Home');
}

@Component({
    selector: 'story-tabs-default',
    imports: [TabList, TabPanel, Title, Button],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Default tab specified</h3>
        <fd-tab-list ariaLabel="Tabs with a default tab" defaultTab="story-default-three">
            <fd-tab id="story-default-one" title="Link 1"><span class="${content}">Content for tab 1</span></fd-tab>
            <fd-tab id="story-default-two" title="Link 2"><span class="${content}">Content for tab 2</span></fd-tab>
            <fd-tab id="story-default-three" title="Link 3"><span class="${content}">Content for tab 3</span></fd-tab>
        </fd-tab-list>

        <h3 fdTitle headerSize="5" class="${heading}">Default tab selected again when the tabs change</h3>
        <button fdButton class="mb-2" [label]="(hide() ? 'Show' : 'Hide') + ' first tab'" (click)="toggle()"></button>
        <fd-tab-list ariaLabel="Tabs that select the default tab on change" selectDefaultOnTabsChange>
            @if (!hide()) {
                <fd-tab id="story-change-one" title="Link 1"><span class="${content}">Content for tab 1</span></fd-tab>
            }
            <fd-tab id="story-change-two" title="Link 2"><span class="${content}">Content for tab 2</span></fd-tab>
            <fd-tab id="story-change-three" title="Link 3"><span class="${content}">Content for tab 3</span></fd-tab>
        </fd-tab-list>
    `
})
class StoryTabsDefault {
    protected readonly hide = signal(true);
    protected toggle(): void {
        this.hide.update((hide) => !hide);
    }
}

@Component({
    selector: 'story-tabs-form',
    imports: [TabList, TabPanel, Button, FormItem, FormLabel, InputGroup],
    template: `
        <fd-tab-list ariaLabel="Tabs with form content">
            @for (tab of [1, 2, 3]; track tab) {
                <fd-tab [title]="'Link ' + tab">
                    <div class="${content} flex flex-col items-start gap-2">
                        <span>Content for tab {{ tab }}</span>
                        @if (tab === 1) {
                            <button fdButton label="Save"></button>
                        }
                        <div fdFormItem>
                            <label fdFormLabel [for]="'story-tabs-amount-' + tab">Left aligned icon add-on</label>
                            <fd-input-group
                                placement="before"
                                glyph="cart"
                                glyphAriaLabel="Add to cart"
                                placeholder="Amount"
                                [inputId]="'story-tabs-amount-' + tab"
                            />
                        </div>
                    </div>
                </fd-tab>
            }
        </fd-tab-list>
    `
})
class StoryTabsForm {}

/** The upstream playground: mode, size, density and the title, icon and count of each tab. */
@Component({
    selector: 'story-tabs-playground',
    imports: [TabList, TabPanel, ContentDensityDirective],
    template: `
        <fd-tab-list ariaLabel="Playground tabs" [mode]="mode() || null" [size]="size()" [fdCompact]="compact()">
            @for (tab of tabs(); track $index; let first = $first) {
                <fd-tab
                    [header]="mode() === 'filter' && first"
                    [title]="tab.title"
                    [glyph]="tab.glyph"
                    [count]="tab.count"
                >
                    <span class="${content}">Content of {{ tab.title }}</span>
                </fd-tab>
            }
        </fd-tab-list>
    `
})
class StoryTabsPlayground {
    readonly mode = input<TabModes | ''>('');
    readonly size = input<TabSizes>('m');
    readonly compact = input(false);
    readonly title1 = input('Link 1');
    readonly glyph1 = input('cart');
    readonly count1 = input('1');
    readonly title2 = input('Link 2');
    readonly glyph2 = input('employee');
    readonly count2 = input('2');
    readonly title3 = input('Link 3');
    readonly glyph3 = input('calendar');
    readonly count3 = input('3');
    protected readonly tabs = computed(() => [
        { title: this.title1(), glyph: this.glyph1(), count: this.count1() },
        { title: this.title2(), glyph: this.glyph2(), count: this.count2() },
        { title: this.title3(), glyph: this.glyph3(), count: this.count3() }
    ]);
}

const meta: Meta<TabList> = {
    title: 'Components/Tabs',
    component: TabList,
    decorators: [
        moduleMetadata({
            imports: [
                StoryTabsBasic,
                StoryTabsModes,
                StoryTabsBehaviour,
                StoryTabsStacked,
                StoryTabsNav,
                StoryTabsDefault,
                StoryTabsForm,
                StoryTabsPlayground
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'A tab bar for `fd-tab` panels: titles or templates, counts, value states, icon-only, process and filter modes. Tabs that do not fit go into a "More" menu. ' +
                    'With `stackContent` all panels show one below the other and the tabs follow the scrolling. The tabs form one tab stop: Left, Right, Home and End move between them and Enter or Space selects. ' +
                    '`fd-tab-nav` styles a bar of links, e.g. for router navigation.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<TabList>;

export const Playground: StoryObj<StoryTabsPlayground> = {
    argTypes: {
        mode: { control: 'select', options: ['', 'icon-only', 'process', 'filter'] },
        size: { control: 'select', options: ['s', 'm', 'l', 'xl', 'xxl'] }
    },
    args: {
        mode: '',
        size: 'm',
        compact: false,
        title1: 'Link 1',
        glyph1: 'cart',
        count1: '1',
        title2: 'Link 2',
        glyph2: 'employee',
        count2: '2',
        title3: 'Link 3',
        glyph3: 'calendar',
        count3: '3'
    },
    render: (args) => ({
        props: args,
        template: `<story-tabs-playground [mode]="mode" [size]="size" [compact]="compact"
            [title1]="title1" [glyph1]="glyph1" [count1]="count1"
            [title2]="title2" [glyph2]="glyph2" [count2]="count2"
            [title3]="title3" [glyph3]="glyph3" [count3]="count3" />`
    })
};
export const Basic: Story = { render: () => ({ template: `<story-tabs-basic />` }) };
export const Modes: Story = { render: () => ({ template: `<story-tabs-modes />` }) };
export const Behaviour: Story = {
    name: 'Overflow, collapsible and dynamic tabs',
    render: () => ({ template: `<story-tabs-behaviour />` })
};
export const Stacked: Story = { name: 'Stacked content', render: () => ({ template: `<story-tabs-stacked />` }) };
export const DefaultTab: Story = {
    name: 'Default tab',
    render: () => ({ template: `<story-tabs-default />` })
};
export const FormContent: Story = {
    name: 'Form content',
    render: () => ({ template: `<story-tabs-form />` })
};
export const Navigation: Story = { render: () => ({ template: `<story-tabs-nav />` }) };

export const OpenMore: Story = {
    name: 'Open: More menu',
    tags: ['!autodocs'],
    render: Behaviour.render,
    play: async ({ canvasElement }) => {
        const more = await waitFor(() => {
            const el = canvasElement.querySelector<HTMLElement>('fd-tab-list button[aria-haspopup=menu]');
            expect(el).not.toBeNull();
            return el!;
        });
        await userEvent.click(more);
        await waitFor(() => expect(more.getAttribute('aria-expanded')).toBe('true'));
        await waitFor(() => expect(document.querySelector('.cdk-overlay-container [role=menuitem]')).not.toBeNull());
    }
};
