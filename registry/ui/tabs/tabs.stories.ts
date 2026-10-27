import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '@/ui/button/button';
import { Title } from '@/ui/title/title';
import { TabItem, TabLink, TabList, TabNav, TabPanel, TabTag, TabTitle } from './tabs';

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

const meta: Meta<TabList> = {
    title: 'Components/Tabs',
    component: TabList,
    decorators: [
        moduleMetadata({
            imports: [StoryTabsBasic, StoryTabsModes, StoryTabsBehaviour, StoryTabsStacked, StoryTabsNav]
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

export const Basic: Story = { render: () => ({ template: `<story-tabs-basic />` }) };
export const Modes: Story = { render: () => ({ template: `<story-tabs-modes />` }) };
export const Behaviour: Story = {
    name: 'Overflow, collapsible and dynamic tabs',
    render: () => ({ template: `<story-tabs-behaviour />` })
};
export const Stacked: Story = { name: 'Stacked content', render: () => ({ template: `<story-tabs-stacked />` }) };
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
