import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Avatar } from '@/ui/avatar/avatar';
import { BusyIndicator } from '@/ui/busy-indicator/busy-indicator';
import { Button } from '@/ui/button/button';
import { Link } from '@/ui/link/link';
import { List, ListItem, ListSecondary, ListTitle } from '@/ui/list/list';
import { Menu, MenuAddon, MenuInteractive, MenuItem, MenuTitle, MenuTrigger } from '@/ui/menu/menu';
import { ObjectStatusComponent } from '@/ui/object-status/object-status';
import { Skeleton } from '@/ui/skeleton/skeleton';
import {
    Card,
    CardContent,
    CardCounter,
    CardExtendedHeader,
    CardFooter,
    CardFooterActionItem,
    CardHeader,
    CardHeaderAction,
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
    Link,
    List,
    ListItem,
    ListTitle,
    ListSecondary,
    Menu,
    MenuAddon,
    MenuInteractive,
    MenuItem,
    MenuTitle,
    MenuTrigger,
    ObjectStatusComponent,
    Skeleton
];
const row = 'flex flex-wrap items-start gap-8';
const list = (n = 3) =>
    `<ul fd-list noBorder aria-label="Items">${Array.from({ length: n }, (_, i) => `<li fd-list-item><span fd-list-title>Item ${i + 1}</span><span fd-list-secondary>Secondary</span></li>`).join('')}</ul>`;

const meta: Meta<Card> = {
    title: 'Components/Card',
    component: Card,
    decorators: [moduleMetadata({ imports: IMPORTS })],
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
