import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Avatar } from '@/ui/avatar/avatar';
import { BusyIndicator } from '@/ui/busy-indicator/busy-indicator';
import { Button } from '@/ui/button/button';
import { Calendar, type FdCalendarView } from '@/ui/calendar/calendar';
import {
    IllustratedMessage,
    IllustratedMessageActions,
    IllustratedMessageFigcaption,
    IllustratedMessageText,
    IllustratedMessageTitle
} from '@/ui/illustrated-message/illustrated-message';
import { Link } from '@/ui/link/link';
import {
    List,
    ListByline,
    ListContent,
    ListIcon,
    ListItem,
    ListLink,
    ListSecondary,
    ListThumbnail,
    ListTitle
} from '@/ui/list/list';
import { Menu, MenuAddon, MenuInteractive, MenuItem, MenuTitle, MenuTrigger } from '@/ui/menu/menu';
import { ObjectStatusComponent } from '@/ui/object-status/object-status';
import {
    QuickView,
    QuickViewGroup,
    QuickViewGroupItem,
    QuickViewGroupItemContent,
    QuickViewGroupItemContentElement,
    QuickViewGroupItemLabel,
    QuickViewGroupTitle,
    QuickViewSubheader,
    QuickViewSubheaderSubtitle,
    QuickViewSubheaderTitle
} from '@/ui/quick-view/quick-view';
import { Skeleton } from '@/ui/skeleton/skeleton';
import { Text } from '@/ui/text/text';
import { UNABLE_TO_LOAD } from '../../../docs/assets/illustrations';
import {
    Card,
    CardContent,
    CardCounter,
    CardExtendedHeader,
    CardFooter,
    CardFooterActionItem,
    CardHeader,
    CardHeaderAction,
    CardHeaderColumn,
    CardHeaderRow,
    CardKpiAnalytics,
    CardKpiAnalyticsContent,
    CardKpiAnalyticsLabel,
    CardKpiHeader,
    CardKpiScaleIcon,
    CardKpiScaleText,
    CardKpiValue,
    CardList,
    CardLoader,
    CardMainHeader,
    CardMedia,
    CardMediaContentContainer,
    CardMediaHeading,
    CardMediaImage,
    CardMediaImageContainer,
    CardMediaText,
    CardSecondSubtitle,
    CardSubtitle,
    CardTitle
} from './card';

const IMPORTS = [
    Card,
    CardHeader,
    CardMainHeader,
    CardTitle,
    CardSubtitle,
    CardSecondSubtitle,
    CardCounter,
    CardHeaderAction,
    CardHeaderColumn,
    CardHeaderRow,
    CardExtendedHeader,
    CardContent,
    CardFooter,
    CardFooterActionItem,
    CardLoader,
    CardList,
    CardKpiHeader,
    CardKpiValue,
    CardKpiScaleIcon,
    CardKpiScaleText,
    CardKpiAnalytics,
    CardKpiAnalyticsLabel,
    CardKpiAnalyticsContent,
    CardMedia,
    CardMediaImageContainer,
    CardMediaImage,
    CardMediaContentContainer,
    CardMediaHeading,
    CardMediaText,
    Avatar,
    BusyIndicator,
    Button,
    IllustratedMessage,
    IllustratedMessageActions,
    IllustratedMessageFigcaption,
    IllustratedMessageText,
    IllustratedMessageTitle,
    Link,
    List,
    ListByline,
    ListContent,
    ListIcon,
    ListItem,
    ListLink,
    ListTitle,
    ListSecondary,
    ListThumbnail,
    Menu,
    MenuAddon,
    MenuInteractive,
    MenuItem,
    MenuTitle,
    MenuTrigger,
    ObjectStatusComponent,
    QuickView,
    QuickViewGroup,
    QuickViewGroupItem,
    QuickViewGroupItemContent,
    QuickViewGroupItemContentElement,
    QuickViewGroupItemLabel,
    QuickViewGroupTitle,
    QuickViewSubheader,
    QuickViewSubheaderSubtitle,
    QuickViewSubheaderTitle,
    Skeleton,
    Text
];
const row = 'flex flex-wrap items-start gap-8';
/** Extended header with object statuses at the start and a timestamp at the end. */
const STATUS_HEADER = `
    <fd-card-extended-header>
        <div fd-card-header-column>
            <div fd-card-header-row>
                <span fd-object-status status="negative" glyph="error" label="Negative"></span>
                <span fd-object-status status="critical" glyph="alert" label="Critical"></span>
            </div>
        </div>
        <div fd-card-header-column align="right"><div fd-card-header-row><fd-text text="Timestamp" /></div></div>
    </fd-card-extended-header>`;
/** Extended header aligned to the bottom: two text rows and an amount. */
const TRAVEL_HEADER = `
    <fd-card-extended-header align="bottom">
        <div fd-card-header-column>
            <div fd-card-header-row><fd-text text="Las Vegas, TechEd" /></div>
            <div fd-card-header-row><fd-text text="May 3rd - 5th 2024" /></div>
        </div>
        <div fd-card-header-column align="right">
            <div fd-card-header-row>
                <span class="text-sap-font-header4-size text-sap-tile-title-text-color">956.00 EUR</span>
            </div>
        </div>
    </fd-card-extended-header>`;
const list = (n = 3) =>
    `<ul fd-list noBorder aria-label="Items">${Array.from({ length: n }, (_, i) => `<li fd-list-item><span fd-list-title>Item ${i + 1}</span><span fd-list-secondary>Secondary</span></li>`).join('')}</ul>`;

const VIEW_LABEL: Record<FdCalendarView, string> = {
    day: 'Day view',
    month: 'Month view',
    year: 'Year view',
    aggregatedYear: 'Years range view'
};

@Component({
    selector: 'story-card-calendar',
    imports: [Card, CardHeader, CardMainHeader, CardTitle, CardSubtitle, CardCounter, CardContent, Calendar],
    template: `
        <fd-card class="w-fit">
            <fd-card-header>
                <fd-card-main-header>
                    <h2 fd-card-title>My calendar</h2>
                    <h3 fd-card-subtitle>{{ label[view()] }}</h3>
                    <span fd-card-counter>4 of 10</span>
                </fd-card-main-header>
            </fd-card-header>
            <fd-card-content><fd-calendar [(activeView)]="view" /></fd-card-content>
        </fd-card>
    `
})
class StoryCardCalendar {
    protected readonly label = VIEW_LABEL;
    protected readonly view = signal<FdCalendarView>('day');
}

const meta: Meta<Card> = {
    title: 'Components/Card',
    component: Card,
    decorators: [moduleMetadata({ imports: [...IMPORTS, StoryCardCalendar] })],
    parameters: {
        // Horizon's inverted badges and white text on shell category colours are below 4.5:1 by design
        a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
        docs: {
            description: {
                component:
                    'Cards group information about one topic: a header (title, subtitle, avatar, counter, KPI), content and an optional footer with actions. Badges sit on the top edge. Cards with role button or listitem are interactive.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Card>;

export const Standard: Story = {
    name: 'Header, content and badges',
    render: () => ({
        template: `
            <div class="${row}">
                <fd-card class="w-80" badge="Badge" badgeIcon="example" [badgeColor]="2">
                    <fd-card-header><fd-card-main-header><h2 fd-card-title>Card Title</h2></fd-card-main-header></fd-card-header>
                    <fd-card-content>${list(2)}</fd-card-content>
                </fd-card>
                <fd-card class="w-80" cardType="list" badge="Updated" [badgeColor]="4" secondBadgeIcon="pushpin-on" [secondBadgeColor]="4">
                    <fd-card-header>
                        <fd-card-main-header interactive>
                            <fd-avatar circle size="s" label="John Doe" image="assets/person.svg" />
                            <h2 fd-card-title>List card</h2>
                            <h3 fd-card-subtitle>Card Subtitle</h3>
                            <span fd-card-counter status="positive">3 of 10</span>
                        </fd-card-main-header>
                    </fd-card-header>
                    <fd-card-content>${list(3)}</fd-card-content>
                </fd-card>
                <fd-card class="w-80" badge="Badge with a very long text that should truncate on the first line" badgeStatus="positive" badgeIcon="example">
                    <fd-card-content><img src="assets/landscape.svg" alt="Landscape" class="block h-40 w-full object-cover" /></fd-card-content>
                    <fd-card-header>
                        <fd-card-main-header><h2 fd-card-title>Header at the bottom</h2><h3 fd-card-subtitle>Card Subtitle</h3></fd-card-main-header>
                    </fd-card-header>
                </fd-card>
            </div>`
    })
};

export const FooterAndLoading: Story = {
    name: 'Footer actions, header action and loading',
    render: () => ({
        template: `
            <div class="${row}">
                <fd-card class="w-80" cardType="list">
                    <fd-card-header>
                        <fd-card-main-header>
                            <h2 fd-card-title>Card Title</h2>
                            <h3 fd-card-subtitle>With header action</h3>
                            <button fdButton fd-card-header-action variant="transparent" glyph="overflow" ariaLabel="More"></button>
                        </fd-card-main-header>
                    </fd-card-header>
                    <fd-card-content>${list(3)}</fd-card-content>
                    <fd-card-footer>
                        <button *fdCardFooterActionItem fdButton variant="positive" label="Approve"></button>
                        <button *fdCardFooterActionItem fdButton variant="negative" label="Reject"></button>
                    </fd-card-footer>
                </fd-card>
                <fd-card class="w-80" isLoading>
                    <fd-card-header><fd-card-main-header><h2 fd-card-title>Loading</h2></fd-card-main-header></fd-card-header>
                    <fd-card-loader><fd-busy-indicator loading ariaLabel="Loading card" /></fd-card-loader>
                </fd-card>
                <fd-card class="w-80" cardType="object">
                    <fd-card-header><fd-card-main-header><h2 fd-card-title>Object card</h2><h3 fd-card-subtitle>Content with spacing</h3></fd-card-main-header></fd-card-header>
                    <fd-card-content>
                        <p class="m-0 text-sap-text-color">Object cards show attributes of an object in their content area.</p>
                    </fd-card-content>
                </fd-card>
            </div>`
    })
};

export const Analytical: Story = {
    name: 'Analytical (KPI header)',
    render: () => ({
        template: `
            <div class="${row}">
                <fd-card class="w-96" cardType="analytical">
                    <fd-card-header>
                        <fd-card-main-header>
                            <h2 fd-card-title>Failure Breakdown</h2>
                            <h3 fd-card-subtitle>By plant</h3>
                            <fd-card-kpi-header>
                                <strong fd-card-kpi-value status="positive">42.2</strong>
                                <span fd-card-kpi-scale-icon fd-object-status status="positive" glyph="up" glyphAriaLabel="Up"></span>
                                <span fd-card-kpi-scale-text fd-object-status status="positive" label="%"></span>
                                <div fd-card-kpi-analytics><span fd-card-kpi-analytics-label>Deviation</span><span fd-card-kpi-analytics-content>7.52%</span></div>
                                <div fd-card-kpi-analytics><span fd-card-kpi-analytics-label>Target</span><span fd-card-kpi-analytics-content>45%</span></div>
                            </fd-card-kpi-header>
                            <h4 fd-card-second-subtitle>Q1, 2019</h4>
                        </fd-card-main-header>
                    </fd-card-header>
                    <fd-card-content class="p-4"><fd-skeleton type="rectangle" width="100%" height="8rem" [animated]="false" /></fd-card-content>
                </fd-card>
            </div>`
    })
};

export const Interactive: Story = {
    name: 'Interactive cards in a card list',
    render: () => ({
        template: `
            <div fd-card-list ariaLabel="Products" class="${row}">
                @for (p of ['Notebook Basic 15', 'Notebook Basic 17', 'Notebook Basic 18']; track p; let i = $index) {
                    <fd-card class="w-72" role="listitem" [ariaPosinset]="i + 1" [ariaSetsize]="3" [selected]="i === 1">
                        <fd-card-header>
                            <fd-card-main-header>
                                <fd-avatar size="s" glyph="product" ariaLabel="Product" />
                                <h2 fd-card-title>{{ p }}</h2>
                                <h3 fd-card-subtitle>HT-100{{ i }}</h3>
                            </fd-card-main-header>
                        </fd-card-header>
                    </fd-card>
                }
            </div>
            <div fd-card-list ariaLabel="Requests" class="${row} mt-8">
                <fd-card
                    class="w-96"
                    role="listitem"
                    badge="New"
                    badgeIcon="example"
                    [badgeColor]="2"
                    badgeAriaLabel="New card"
                    ariaRoledescription="Catalog Item Card"
                >
                    <fd-card-header>
                        <fd-card-main-header>
                            <fd-avatar glyph="cart" circle size="s" ariaLabel="Cart" />
                            <h2 fd-card-title>Card Title</h2>
                            <h3 fd-card-subtitle>Card Subtitle</h3>
                            <span fd-card-counter status="positive">3 of 10</span>
                        </fd-card-main-header>
                        ${STATUS_HEADER}
                    </fd-card-header>
                    <fd-card-content />
                </fd-card>
                <fd-card class="w-96" role="listitem" badgeIcon="example" [badgeColor]="3" badgeAriaLabel="Requires attention">
                    <fd-card-header>
                        <fd-card-main-header>
                            <fd-avatar glyph="travel-expense" size="s" ariaLabel="Travel expense" />
                            <h2 fd-card-title>Travel Request</h2>
                            <h3 fd-card-subtitle>Marie Johnson</h3>
                            <span fd-card-counter>2 hours ago</span>
                        </fd-card-main-header>
                        ${TRAVEL_HEADER}
                    </fd-card-header>
                    <fd-card-footer>
                        <button *fdCardFooterActionItem fdButton variant="positive" label="Approve"></button>
                        <button *fdCardFooterActionItem fdButton variant="negative" label="Reject"></button>
                    </fd-card-footer>
                </fd-card>
            </div>`
    })
};

export const Media: Story = {
    render: () => ({
        template: `
            <div class="${row}">
                <fd-card class="w-80">
                    <fd-card-media>
                        <div fd-card-media-image-container><img fd-card-media-image src="assets/landscape.svg" alt="Landscape" class="max-h-48" /></div>
                    </fd-card-media>
                    <fd-card-header>
                        <fd-card-main-header>
                            <fd-avatar glyph="cart" circle size="s" ariaLabel="Cart" />
                            <h2 fd-card-title>Card Title</h2>
                            <h3 fd-card-subtitle>Card Subtitle</h3>
                        </fd-card-main-header>
                    </fd-card-header>
                    <fd-card-footer>
                        <button *fdCardFooterActionItem fdButton variant="positive" label="Approve"></button>
                        <button *fdCardFooterActionItem fdButton variant="negative" label="Reject"></button>
                    </fd-card-footer>
                </fd-card>
                <fd-card class="w-80 h-fit">
                    <fd-card-media hasPadding>
                        <div fd-card-media-image-container><img fd-card-media-image src="assets/landscape.svg" alt="Landscape" class="max-h-48" /></div>
                    </fd-card-media>
                    <fd-card-header><fd-card-main-header><h2 fd-card-title>Media with padding</h2></fd-card-main-header></fd-card-header>
                </fd-card>
                <fd-card class="w-80 h-fit">
                    <fd-card-media [shellColor]="3">
                        <div fd-card-media-content-container>
                            <div fd-card-media-heading>Shell colour</div>
                            <p fd-card-media-text>Media text on a shell category colour.</p>
                        </div>
                    </fd-card-media>
                </fd-card>
            </div>`
    })
};

export const Banner: Story = {
    render: () => ({
        template: `
            <div class="mb-8">
                <fd-card cardType="banner">
                    <fd-card-media [shellColor]="13">
                        <div fd-card-media-content-container>
                            <div fd-card-media-heading>Get Ready for the AI Learning Days!</div>
                            <p fd-card-media-text>Lorem ipsum dolor sit amet consectetur adipisicing elit. At aperiam in incidunt distinctio, ad blanditiis autem voluptatibus dolore labore eos harum placeat.</p>
                            <button fdButton label="Register"></button>
                        </div>
                    </fd-card-media>
                </fd-card>
            </div>
            <div>
                <fd-card cardType="banner" class="h-72">
                    <fd-card-media>
                        <div fd-card-media-content-container [legendColor]="13">
                            <div fd-card-media-heading>AI Learning Days: register now</div>
                            <p fd-card-media-text>Lorem ipsum dolor sit amet consectetur adipisicing elit. At aperiam in incidunt distinctio.</p>
                            <button fdButton variant="emphasized" label="Register"></button>
                        </div>
                        <div fd-card-media-image-container><img fd-card-media-image src="assets/landscape.svg" alt="Landscape" /></div>
                    </fd-card-media>
                </fd-card>
            </div>`
    })
};

export const ExtendedHeader: Story = {
    name: 'Extended header and header interaction',
    render: () => ({
        template: `
            <div class="${row}">
                <fd-card class="w-96">
                    <fd-card-header>
                        <fd-card-main-header>
                            <fd-avatar glyph="cart" circle size="s" ariaLabel="Cart" />
                            <h2 fd-card-title>Card Title</h2>
                            <h3 fd-card-subtitle>Card Subtitle</h3>
                            <span fd-card-counter status="positive">3 of 10</span>
                            <button fdButton fd-card-header-action variant="transparent" glyph="overflow" ariaLabel="More" title="More"></button>
                        </fd-card-main-header>
                        ${STATUS_HEADER}
                    </fd-card-header>
                    <fd-card-content><div class="h-32"></div></fd-card-content>
                </fd-card>
                <fd-card class="w-96">
                    <fd-card-header>
                        <fd-card-main-header interactive>
                            <fd-avatar glyph="travel-expense" size="s" ariaLabel="Travel expense" />
                            <h2 fd-card-title>Travel Request</h2>
                            <h3 fd-card-subtitle>Marie Johnson</h3>
                            <span fd-card-counter>2 hours ago</span>
                            <button fdButton fd-card-header-action variant="transparent" glyph="overflow" ariaLabel="More" title="More"></button>
                        </fd-card-main-header>
                        ${TRAVEL_HEADER}
                    </fd-card-header>
                    <fd-card-footer>
                        <button *fdCardFooterActionItem fdButton variant="positive" label="Approve"></button>
                        <button *fdCardFooterActionItem fdButton variant="negative" label="Reject"></button>
                    </fd-card-footer>
                </fd-card>
                <fd-card class="w-96">
                    <fd-card-content><div class="h-32"></div></fd-card-content>
                    <fd-card-header>
                        <fd-card-main-header interactive>
                            <fd-avatar glyph="cart" circle size="s" ariaLabel="Cart" />
                            <h2 fd-card-title>Interactive header at the bottom</h2>
                            <h3 fd-card-subtitle>Card Subtitle</h3>
                            <span fd-card-counter status="positive">3 of 10</span>
                        </fd-card-main-header>
                    </fd-card-header>
                </fd-card>
            </div>`
    })
};

export const EmptyState: Story = {
    name: 'Empty state',
    render: () => ({
        props: { config: UNABLE_TO_LOAD },
        template: `
            <fd-card class="w-96">
                <fd-card-header>
                    <fd-card-main-header interactive>
                        <fd-avatar glyph="cart" circle size="s" ariaLabel="Cart" />
                        <h2 fd-card-title>Card Title</h2>
                        <h3 fd-card-subtitle>Card Subtitle</h3>
                    </fd-card-main-header>
                </fd-card-header>
                <fd-card-content>
                    <figure fd-illustrated-message type="dialog" [svgConfig]="config" svgAriaLabel="Unable to load data">
                        <figcaption fd-illustrated-message-figcaption>
                            <h3 fd-illustrated-message-title>Unable to load data</h3>
                            <p fd-illustrated-message-text>Try reloading. If that still doesn't help, check with your administrator.</p>
                        </figcaption>
                        <fd-illustrated-message-actions><button fdButton label="Reload"></button></fd-illustrated-message-actions>
                    </figure>
                </fd-card-content>
            </fd-card>`
    })
};

/** An attribute group of an object card: a title and label/text pairs. */
const attributes = (title: string) => `
    <div class="flex min-w-40 flex-1 flex-col gap-4">
        <div class="text-sap-font-header6-size font-bold text-sap-group-title-text-color">${title}</div>
        ${[1, 2, 3].map(() => `<div class="flex flex-col gap-1"><span class="text-sap-content-label-color">Label</span><span class="text-sap-text-color">Text</span></div>`).join('')}
    </div>`;

export const ObjectCard: Story = {
    name: 'Object card',
    render: () => ({
        template: `
            <div class="${row}">
                @for (layout of [['w-72', 'stacked'], ['w-[30rem]', 'side by side']]; track layout[0]) {
                    <fd-card [class]="layout[0]" cardType="object">
                        <fd-card-header>
                            <fd-card-main-header>
                                <fd-avatar image="assets/person.svg" circle size="s" ariaLabel="Photo of John Li" />
                                <h2 fd-card-title>Groups {{ layout[1] }}</h2>
                                <h3 fd-card-subtitle>Card Subtitle</h3>
                            </fd-card-main-header>
                        </fd-card-header>
                        <fd-card-content>
                            <div class="flex flex-wrap gap-x-8 gap-y-6">${attributes('Group Title 1')}${attributes('Group Title 2')}</div>
                        </fd-card-content>
                    </fd-card>
                }
            </div>`
    })
};

export const CalendarCard: Story = {
    name: 'Calendar card',
    render: () => ({ template: `<story-card-calendar />` })
};

const CONTACT = [
    {
        title: 'Contact Details',
        items: [
            { label: 'Mobile', value: '+89181818181', href: 'tel:+89181818181' },
            { label: 'Phone', value: '+2828282828', href: 'tel:+2828282828' },
            { label: 'Email', value: 'mail@example.com', href: 'mailto:mail@example.com' }
        ]
    },
    {
        title: 'Company',
        items: [
            { label: 'Name', value: 'Company A', href: '' },
            { label: 'Address', value: '481 West Street, Anytown 45066, USA', href: '' }
        ]
    }
];

export const QuickViewCard: Story = {
    name: 'Quick view card',
    render: () => ({
        props: { groups: CONTACT },
        template: `
            <fd-card class="w-96" cardType="quickView">
                <fd-card-header><fd-card-main-header><h2 fd-card-title>Contact Card</h2></fd-card-main-header></fd-card-header>
                <fd-card-content>
                    <fd-quick-view>
                        <fd-quick-view-subheader>
                            <fd-avatar size="s" image="assets/person.svg" ariaLabel="Photo of Ann Smith" />
                            <fd-quick-view-subheader-title [headerSize]="3">Ann Smith</fd-quick-view-subheader-title>
                            <fd-quick-view-subheader-subtitle>Senior sales manager</fd-quick-view-subheader-subtitle>
                        </fd-quick-view-subheader>
                        @for (group of groups; track group.title) {
                            <fd-quick-view-group>
                                <fd-quick-view-group-title [headingLevel]="4">{{ group.title }}</fd-quick-view-group-title>
                                @for (item of group.items; track item.label) {
                                    <fd-quick-view-group-item>
                                        <fd-quick-view-group-item-label>{{ item.label }}</fd-quick-view-group-item-label>
                                        <fd-quick-view-group-item-content>
                                            @if (item.href) {
                                                <a fdLink fd-quick-view-group-item-content-element [href]="item.href">{{ item.value }}</a>
                                            } @else {
                                                <div fd-quick-view-group-item-content-element>{{ item.value }}</div>
                                            }
                                        </fd-quick-view-group-item-content>
                                    </fd-quick-view-group-item>
                                }
                            </fd-quick-view-group>
                        }
                    </fd-quick-view>
                </fd-card-content>
                <fd-card-footer>
                    <button *fdCardFooterActionItem fdButton label="Assign to Project"></button>
                </fd-card-footer>
            </fd-card>`
    })
};

export const LinkListCard: Story = {
    name: 'Link list card',
    render: () => ({
        props: {
            contacts: [
                ['Donna Moore', 'Company A'],
                ['Elena Petrova', 'Company B'],
                ['Julia Armstrong', 'Company C'],
                ['John Li', 'Company D'],
                ['Richard Wilson', 'Company E'],
                ['Sabine Mayer', 'Company F']
            ],
            links: [
                ['leads', 'Career'],
                ['address-book', 'Company Directory'],
                ['notes', 'Development Plan'],
                ['target-group', 'Business Goals'],
                ['travel-itinerary', 'Travel and Expenses'],
                ['general-leave-request', 'Time Off']
            ]
        },
        template: `
            <div class="${row}">
                <fd-card class="w-80" cardType="linkList">
                    <fd-card-header><fd-card-main-header><h2 fd-card-title>Recent Contacts</h2></fd-card-main-header></fd-card-header>
                    <fd-card-content>
                        <ul fd-list byline noBorder aria-label="Recent contacts">
                            @for (c of contacts; track c[0]) {
                                <li fd-list-item>
                                    <a fd-list-link href="#">
                                        <span fd-list-thumbnail><fd-avatar size="s" image="assets/person.svg" [ariaLabel]="'Photo of ' + c[0]" /></span>
                                        <div fd-list-content>
                                            <div fd-list-title>{{ c[0] }}</div>
                                            <div fd-list-byline>{{ c[1] }}</div>
                                        </div>
                                    </a>
                                </li>
                            }
                        </ul>
                    </fd-card-content>
                </fd-card>
                <fd-card class="w-80" cardType="linkList">
                    <fd-card-header><fd-card-main-header><h2 fd-card-title>Quick Links</h2></fd-card-main-header></fd-card-header>
                    <fd-card-content>
                        <ul fd-list noBorder aria-label="Quick links">
                            @for (l of links; track l[1]) {
                                <li fd-list-item>
                                    <a fd-list-link href="#"><i fd-list-icon [glyph]="l[0]"></i><span fd-list-title>{{ l[1] }}</span></a>
                                </li>
                            }
                        </ul>
                    </fd-card-content>
                </fd-card>
            </div>`
    })
};

const SKELETON_LIST = `
    <ul fd-list noBorder aria-label="Loading items" aria-busy="true">
        @for (i of [1, 2, 3]; track i) {
            <li fd-list-item><fd-skeleton type="text" width="30%" [textLines]="1" class="my-auto" /></li>
        }
    </ul>`;

export const LoadingPlaceholders: Story = {
    name: 'Loading placeholders',
    render: () => ({
        template: `
            <div class="${row}">
                <fd-card class="w-80" ariaLabel="Loading card">
                    <fd-card-header>
                        <fd-card-main-header><fd-skeleton type="text" [textLines]="1" class="my-auto" /></fd-card-main-header>
                    </fd-card-header>
                    <fd-card-content>${SKELETON_LIST}</fd-card-content>
                </fd-card>
                <fd-card class="w-80" ariaLabel="Loading card with the header at the bottom">
                    <fd-card-content><fd-skeleton type="rectangle" width="100%" height="12rem" /></fd-card-content>
                    <fd-card-header>
                        <fd-card-main-header><fd-skeleton type="text" [textLines]="1" class="my-auto" /></fd-card-main-header>
                    </fd-card-header>
                </fd-card>
                <fd-card class="w-80" cardType="list" badge="New" ariaLabel="Loading card with avatar">
                    <fd-card-header>
                        <fd-card-main-header>
                            <fd-skeleton width="100%" height="48px">
                                <svg:circle cx="24" cy="24" r="24" />
                                <svg:rect x="60" y="0" rx="4" width="80%" height="12" />
                                <svg:rect x="60" y="20" rx="4" width="50%" height="8" />
                            </fd-skeleton>
                        </fd-card-main-header>
                    </fd-card-header>
                    <fd-card-content>${SKELETON_LIST}</fd-card-content>
                </fd-card>
            </div>`
    })
};

const FOOTER_OVERFLOW = `
    <div class="${row}">
        <fd-card class="w-80" cardType="list">
            <fd-card-header><fd-card-main-header><h2 fd-card-title>Footer actions</h2></fd-card-main-header></fd-card-header>
            <fd-card-content>${list(4)}</fd-card-content>
            <fd-card-footer>
                <button *fdCardFooterActionItem fdButton variant="positive" label="Start"></button>
                <button *fdCardFooterActionItem fdButton variant="positive" label="Center"></button>
                <button *fdCardFooterActionItem fdButton variant="negative" label="End"></button>
            </fd-card-footer>
        </fd-card>
        <fd-card class="w-80" cardType="list">
            <fd-card-header><fd-card-main-header><h2 fd-card-title>Footer actions with overflow</h2></fd-card-main-header></fd-card-header>
            <fd-card-content>${list(4)}</fd-card-content>
            <fd-card-footer>
                <button *fdCardFooterActionItem fdButton variant="positive" label="Start"></button>
                <button *fdCardFooterActionItem fdButton variant="negative" label="End"></button>
                <ng-template fdCardFooterActionItem>
                    <button fdButton variant="transparent" glyph="overflow" ariaLabel="More actions" [fdMenuTrigger]="overflow"></button>
                    <fd-menu #overflow ariaLabel="More actions">
                        <li fd-menu-item><a fd-menu-interactive><fd-menu-addon position="before" glyph="cart" /><span fd-menu-title>Option 1</span></a></li>
                        <li fd-menu-item><a fd-menu-interactive><fd-menu-addon position="before" glyph="accept" /><span fd-menu-title>Option 2</span></a></li>
                        <li fd-menu-item><a fd-menu-interactive><span fd-menu-title>Option 3</span><fd-menu-addon glyph="menu" /></a></li>
                    </fd-menu>
                </ng-template>
            </fd-card-footer>
        </fd-card>
        <fd-card class="w-80" cardType="list">
            <fd-card-header><fd-card-main-header><h2 fd-card-title>Footer with a link</h2></fd-card-main-header></fd-card-header>
            <fd-card-content>${list(4)}</fd-card-content>
            <fd-card-footer><a fdLink href="#">Link to some action or details page</a></fd-card-footer>
        </fd-card>
    </div>`;

export const FooterOverflow: Story = {
    name: 'Footer with overflow and link',
    render: () => ({ template: FOOTER_OVERFLOW })
};

export const OpenFooterOverflow: Story = {
    name: 'Open: footer overflow menu',
    tags: ['!autodocs'],
    render: () => ({ template: FOOTER_OVERFLOW }),
    play: async ({ canvasElement }) => {
        const trigger = canvasElement.querySelector<HTMLElement>('[aria-label="More actions"][aria-haspopup]')!;
        await userEvent.click(trigger);
        await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('true'));
        await waitFor(() => expect(document.querySelector('.cdk-overlay-container [role=menuitem]')).not.toBeNull());
    }
};
