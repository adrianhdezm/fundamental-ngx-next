import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import {
    NumericContent,
    NumericContentKpi,
    NumericContentKpiContainer,
    NumericContentLaunchIcon,
    NumericContentLaunchIconContainer,
    NumericContentScale,
    NumericContentScaleArrow,
    NumericContentScaleContainer,
    NumericContentScaleText
} from './numeric-content';
import {
    Tile,
    TileActionClose,
    TileActionContainer,
    TileActionIndicator,
    TileBackgroundImg,
    TileBadge,
    TileContainer,
    TileContent,
    TileContentByline,
    TileContentText,
    TileDot,
    TileFooter,
    TileFooterText,
    TileHeader,
    TileHeaderContent,
    TileLogo,
    TilePageIndicator,
    TileProfileImg,
    TileRefresh,
    TileSection,
    TileSlideContainer,
    TileSubtitle,
    TileTitle,
    TileTitleContainer,
    TileToggle
} from './tile';

const TILE = [
    Tile,
    TileContainer,
    TileHeader,
    TileHeaderContent,
    TileTitleContainer,
    TileTitle,
    TileSubtitle,
    TileContent,
    TileFooter,
    TileSection,
    TileContentText,
    TileContentByline,
    TileFooterText,
    TileRefresh,
    TileProfileImg,
    TileLogo,
    TileBadge,
    TileBackgroundImg,
    TileToggle,
    TileSlideContainer,
    TilePageIndicator,
    TileDot,
    TileActionClose,
    TileActionIndicator,
    TileActionContainer,
    NumericContent,
    NumericContentLaunchIconContainer,
    NumericContentLaunchIcon,
    NumericContentKpiContainer,
    NumericContentKpi,
    NumericContentScaleContainer,
    NumericContentScale,
    NumericContentScaleArrow,
    NumericContentScaleText
];

@Component({
    selector: 'story-clickable-tiles',
    imports: [TILE],
    template: `
        <div class="flex flex-wrap items-start gap-4">
            <fd-tile type="launch" clickable (tileClick)="clicks.set(clicks() + 1)">
                <div fd-tile-header>
                    <div fd-tile-title>Sales</div>
                    <div fd-tile-subtitle>Launch tile as button</div>
                </div>
                <div fd-tile-content>
                    <div fd-numeric-content>
                        <div fd-numeric-content-launch-icon-container>
                            <i fd-numeric-content-launch-icon glyph="line-charts" role="presentation"></i>
                        </div>
                        <div fd-numeric-content-kpi-container>
                            <div fd-numeric-content-kpi state="negative">1.2</div>
                        </div>
                        <div fd-numeric-content-scale-container>
                            <div fd-numeric-content-scale state="negative">
                                <span fd-numeric-content-scale-arrow glyph="down" ariaLabel="Down"></span>
                                <span fd-numeric-content-scale-text>M</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div fd-tile-footer>
                    <span fd-tile-footer-text>EUR, current quarter</span>
                </div>
            </fd-tile>
            <a fd-tile type="launch" size="s" href="#" (tileClick)="clicks.set(clicks() + 1)">
                <div fd-tile-header>
                    <div fd-tile-title>Launch tile as link</div>
                    <div fd-tile-subtitle>Subtitle</div>
                </div>
                <div fd-tile-content>
                    <div fd-numeric-content>
                        <div fd-numeric-content-launch-icon-container>
                            <i fd-numeric-content-launch-icon glyph="line-charts" role="presentation"></i>
                        </div>
                        <div fd-numeric-content-kpi-container>
                            <div fd-numeric-content-kpi state="positive">1234</div>
                        </div>
                    </div>
                </div>
                <div fd-tile-footer>
                    <span fd-tile-footer-text>Unit, Notification</span>
                </div>
            </a>
            <p class="m-0 font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">
                Clicked {{ clicks() }} times
            </p>
        </div>
    `
})
class ClickableTiles {
    protected readonly clicks = signal(0);
}

@Component({
    selector: 'story-action-tiles',
    imports: [TILE],
    template: `
        <div class="flex flex-wrap items-start gap-4">
            @for (tile of tiles(); track tile) {
                <fd-tile type="launch" action role="group" [ariaLabel]="tile">
                    <button fd-tile-action-close [ariaLabel]="'Remove ' + tile" (click)="remove(tile)"></button>
                    <button fd-tile-action-indicator tabindex="-1" [ariaLabel]="'More actions for ' + tile"></button>
                    <div fd-tile-header>
                        <div fd-tile-title>{{ tile }}</div>
                        <div fd-tile-subtitle>Subtitle</div>
                    </div>
                    <div fd-tile-content>
                        <span fd-tile-profile-img backgroundImage="assets/person.svg" ariaLabel="Profile image"></span>
                    </div>
                    <div fd-tile-footer><span fd-tile-footer-text>Footer text</span></div>
                </fd-tile>
            }
            <fd-tile type="slide" double action role="group" ariaLabel="Wind map">
                <div fd-tile-background-img backgroundImage="assets/landscape.svg"></div>
                <button fd-tile-toggle playing></button>
                <button fd-tile-action-close ariaLabel="Remove Wind map"></button>
                <button fd-tile-action-indicator tabindex="-1" ariaLabel="More actions for Wind map"></button>
                <div fd-tile-slide-container>
                    <div fd-tile-header>
                        <div fd-tile-title>Wind Map: Monitoring Real-Time and Forecasted Wind Conditions</div>
                        <div fd-tile-subtitle>SAP News</div>
                    </div>
                    <div fd-tile-footer><span fd-tile-footer-text>May 14, 2020</span></div>
                    <div fd-tile-page-indicator>
                        <span fd-tile-dot></span><span fd-tile-dot active></span><span fd-tile-dot></span>
                    </div>
                </div>
            </fd-tile>
            <button
                class="cursor-pointer border-0 bg-transparent p-0 font-sap-font-family text-sap-link-color underline"
                (click)="reset()"
            >
                Reset
            </button>
        </div>
    `
})
class ActionTiles {
    protected readonly tiles = signal(['Leave requests', 'Travel expenses']);
    protected remove(tile: string): void {
        this.tiles.update((list) => list.filter((t) => t !== tile));
    }
    protected reset(): void {
        this.tiles.set(['Leave requests', 'Travel expenses']);
    }
}

const meta: Meta<Tile> = {
    title: 'Components/Tile',
    component: Tile,
    decorators: [moduleMetadata({ imports: [...TILE, ClickableTiles, ActionTiles] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Tiles are fixed-size containers on a launchpad that show app information (launch, KPI and feed tiles), news (slide tiles) or links (line tiles). Tiles have a regular and a small size and can be double width. Interactive tiles are clickable (role button, Enter and Space emit tileClick) or links (`<a fd-tile>`).'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Tile>;

const ROW = 'flex flex-wrap items-start gap-4';
const HEADING = 'm-0 mb-2 w-full font-sap-font-family text-sap-font-header5-size font-bold text-sap-title-color';

const generic = (attrs: string) => `
    <fd-tile ${attrs}>
        <div fd-tile-header class="bg-sap-information-background"></div>
        <div fd-tile-content class="bg-sap-information-background"></div>
        <div fd-tile-footer class="bg-sap-information-background"></div>
    </fd-tile>`;

export const Sizes: Story = {
    name: 'Sizes and layout',
    render: () => ({
        template: `
            <div class="${ROW}">
                ${generic('')}${generic('size="s"')}${generic('double')}${generic('size="s" double')}
            </div>`
    })
};

const twoColumns = (attrs: string) => `
    <fd-tile ${attrs}>
        ${['header', 'content', 'footer']
            .map(
                (part) => `<div fd-tile-${part} twoColumn>
                    <div fd-tile-section class="bg-sap-information-background"></div>
                    <div fd-tile-section class="bg-sap-information-background"></div>
                </div>`
            )
            .join('')}
    </fd-tile>`;

export const Columns: Story = {
    name: 'Two-column sections',
    render: () => ({
        template: `<div class="${ROW}">${twoColumns('')}${twoColumns('size="s"')}${twoColumns('double')}${twoColumns('size="s" double')}</div>`
    })
};

const kpi = (attrs: string, ncSize: string, state: string) => `
    <fd-tile type="kpi" ${attrs}>
        <div fd-tile-header>
            <h3 fd-tile-title>KPI tile title text</h3>
            <div fd-tile-subtitle>KPI tile subtitle</div>
        </div>
        <div fd-tile-content>
            <div fd-numeric-content ${ncSize}>
                <div fd-numeric-content-kpi-container>
                    <i fd-numeric-content-kpi glyph="line-charts" ${state} role="presentation"></i>
                </div>
                <div fd-numeric-content-kpi-container>
                    <div fd-numeric-content-kpi ${state}>1.2</div>
                </div>
                <div fd-numeric-content-scale-container>
                    <div fd-numeric-content-scale ${state}>
                        <span fd-numeric-content-scale-arrow glyph="down" ariaLabel="Down"></span>
                        <span fd-numeric-content-scale-text>M</span>
                    </div>
                </div>
            </div>
        </div>
        <div fd-tile-footer twoColumn>
            <div fd-tile-section>
                <button fd-tile-refresh></button>
                <span fd-tile-footer-text>Now</span>
            </div>
            <div fd-tile-section>
                <span fd-tile-footer-text>Footer</span>
            </div>
        </div>
    </fd-tile>`;

export const KpiTile: Story = {
    name: 'KPI tile',
    render: () => ({
        template: `
            <div class="flex flex-col gap-6">
                <div class="${ROW}"><h3 class="${HEADING}">Large numeric content (default)</h3>
                    ${kpi('', '', 'state="negative"')}${kpi('size="s"', '', 'state="positive"')}</div>
                <div class="${ROW}"><h3 class="${HEADING}">Medium numeric content</h3>
                    ${kpi('', 'size="m"', 'state="critical"')}${kpi('size="s"', 'size="m"', 'state="informative"')}</div>
                <div class="${ROW}"><h3 class="${HEADING}">Small numeric content</h3>
                    ${kpi('', 'size="s"', '')}${kpi('size="s"', 'size="s"', '')}</div>
            </div>`
    })
};

const launch = (attrs: string) => `
    <fd-tile type="launch" ${attrs}>
        <div fd-tile-header>
            <div fd-tile-title>Launch tile title text</div>
            <div fd-tile-subtitle>Launch tile subtitle</div>
        </div>
        <div fd-tile-content>
            <div fd-numeric-content>
                <div fd-numeric-content-launch-icon-container>
                    <i fd-numeric-content-launch-icon glyph="line-charts" role="presentation"></i>
                </div>
                <div fd-numeric-content-kpi-container>
                    <div fd-numeric-content-kpi state="negative">1.2</div>
                </div>
                <div fd-numeric-content-scale-container>
                    <div fd-numeric-content-scale state="negative">
                        <span fd-numeric-content-scale-arrow glyph="down" ariaLabel="Down"></span>
                        <span fd-numeric-content-scale-text>M</span>
                    </div>
                </div>
            </div>
        </div>
        <div fd-tile-footer twoColumn>
            <div fd-tile-section>
                <button fd-tile-refresh></button>
                <span fd-tile-footer-text>Now</span>
            </div>
            <div fd-tile-section><span fd-tile-footer-text>Footer</span></div>
        </div>
    </fd-tile>`;

const headerContent = (attrs: string) => `
    <fd-tile type="launch" ${attrs}>
        <div fd-tile-header-content>
            <div fd-tile-title>Launch tile title text lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod</div>
            <div fd-tile-subtitle>Subtitle text</div>
        </div>
        <div fd-tile-footer><span fd-tile-footer-text>Footer</span></div>
    </fd-tile>`;

const profile = (attrs: string) => `
    <fd-tile type="launch" ${attrs}>
        <div fd-tile-header>
            <div fd-tile-title>Launch tile (profile) title text</div>
            <div fd-tile-subtitle>Launch tile subtitle</div>
        </div>
        <div fd-tile-content>
            <span fd-tile-profile-img backgroundImage="assets/person.svg" ariaLabel="Profile image"></span>
        </div>
        <div fd-tile-footer><span fd-tile-footer-text>Footer text</span></div>
    </fd-tile>`;

const logo = (attrs: string) => `
    <fd-tile type="launch" ${attrs}>
        <div fd-tile-header>
            <div fd-tile-title>Launch tile (logo) title text</div>
            <div fd-tile-subtitle>Launch tile subtitle</div>
        </div>
        <div fd-tile-content>
            <img fd-tile-logo src="assets/landscape.svg" alt="Company logo" />
        </div>
        <div fd-tile-footer><span fd-tile-footer-text>Footer text</span></div>
    </fd-tile>`;

export const LaunchTile: Story = {
    name: 'Launch tile',
    render: () => ({
        template: `
            <div class="flex flex-col gap-6">
                <div class="${ROW}"><h3 class="${HEADING}">Numeric content and launch icon</h3>${launch('')}${launch('size="s"')}</div>
                <div class="${ROW}"><h3 class="${HEADING}">Combined header and content</h3>${headerContent('')}${headerContent('size="s"')}</div>
                <div class="${ROW}"><h3 class="${HEADING}">Profile</h3>${profile('')}${profile('size="s"')}</div>
                <div class="${ROW}"><h3 class="${HEADING}">Logo</h3>${logo('')}${logo('size="s"')}</div>
            </div>`
    })
};

export const Clickable: Story = {
    name: 'Clickable and link tiles',
    render: () => ({ template: `<story-clickable-tiles />` })
};

const feed = (attrs: string, state: string) => `
    <fd-tile type="feed" double ${attrs}>
        <div fd-tile-header>
            <div fd-tile-title>Feed tile title text sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</div>
            <div fd-tile-subtitle>Feed tile subtitle text</div>
        </div>
        <div fd-tile-content twoColumn>
            <div fd-tile-section>
                <div fd-tile-content-text>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt magna aliqua.</div>
                <div fd-tile-content-byline>About 1 minute ago</div>
            </div>
            <div fd-tile-section>
                <div fd-numeric-content>
                    <div fd-numeric-content-kpi-container>
                        <div fd-numeric-content-kpi ${state}>35</div>
                    </div>
                </div>
            </div>
        </div>
        <div fd-tile-footer><span fd-tile-footer-text>Footer</span></div>
    </fd-tile>`;

export const FeedTile: Story = {
    name: 'Feed tile',
    render: () => ({ template: `<div class="${ROW}">${feed('', '')}${feed('size="s"', 'state="negative"')}</div>` })
};

export const BadgeTile: Story = {
    name: 'Badge tile',
    render: () => ({
        template: `
            <div class="${ROW} pt-3">
                <fd-tile type="launch">
                    <div fd-tile-badge>Badge</div>
                    <div fd-tile-header>
                        <div fd-tile-title>Launch tile title</div>
                        <div fd-tile-subtitle>Subtitle</div>
                    </div>
                    <div fd-tile-content>
                        <span fd-tile-profile-img backgroundImage="assets/person.svg" ariaLabel="Profile image"></span>
                    </div>
                    <div fd-tile-footer><span fd-tile-footer-text>Footer</span></div>
                </fd-tile>
                <fd-tile type="launch" size="s">
                    <div fd-tile-badge>Badge with very very very very very long text</div>
                    <div fd-tile-header>
                        <div fd-tile-title>Launch tile title</div>
                        <div fd-tile-subtitle>Subtitle</div>
                    </div>
                    <div fd-tile-content>
                        <span fd-tile-profile-img backgroundImage="assets/person.svg" ariaLabel="Profile image"></span>
                    </div>
                    <div fd-tile-footer><span fd-tile-footer-text>Unit, Notification</span></div>
                </fd-tile>
                ${feed('', '').replace('<div fd-tile-header>', '<div fd-tile-badge>New</div><div fd-tile-header>')}
            </div>`
    })
};

const slide = (attrs: string, dots: number, playing: boolean) => `
    <fd-tile type="slide" role="group" ariaLabel="Wind map news" ${attrs}>
        <div fd-tile-background-img backgroundImage="assets/landscape.svg"></div>
        <button fd-tile-toggle ${playing ? 'playing' : ''}></button>
        <div fd-tile-slide-container>
            <div fd-tile-header>
                <div fd-tile-title>Wind Map: Monitoring Real-Time and Forecasted Wind Conditions Across the Globe</div>
                <div fd-tile-subtitle>SAP News</div>
            </div>
            <div fd-tile-footer><span fd-tile-footer-text>May 14, 2020</span></div>
            <div fd-tile-page-indicator>
                ${Array.from({ length: dots }, (_, i) => `<span fd-tile-dot ${i === 2 ? 'active' : ''}></span>`).join('')}
            </div>
        </div>
    </fd-tile>`;

export const SlideTile: Story = {
    name: 'Slide tile',
    render: () => ({
        template: `<div class="${ROW}">${slide('', 5, false)}${slide('size="s"', 5, false)}${slide('double', 7, true)}${slide('double size="s"', 7, true)}</div>`
    })
};

const TEXTS: [string, string][] = [
    ['Title', 'Subtitle'],
    ['Title with very very very very very very long text', 'Subtitle with very very very very very very long text'],
    ['Title: Sed do eiusmod tempor incididunt ut labore', 'Subtitle: Aute irure dolor in reprehenderit'],
    ['Title: Iusto odio dignissimos ducimus', 'Subtitle: Lorem ipsum dolor sit amet']
];

const line =
    (badge: boolean, action: boolean, disabled = false) =>
    (texts: [string, string]) => `
    <div fd-tile type="line" ${action ? 'action' : 'clickable'} ${disabled ? 'disabled' : ''}>
        <div fd-tile-header>
            ${
                badge
                    ? `<div fd-tile-title-container><div fd-tile-badge>Badge</div><div fd-tile-title>${texts[0]}</div></div>`
                    : `<div fd-tile-title>${texts[0]}</div>`
            }
            <div fd-tile-subtitle>${texts[1]}</div>
        </div>
        ${
            action
                ? `<div fd-tile-action-container>
                    <button fd-tile-action-indicator tabindex="-1"></button>
                    <button fd-tile-action-close></button>
                </div>`
                : ''
        }
    </div>`;

export const LineTile: Story = {
    name: 'Line (link) tile',
    render: () => ({
        template: `
            <div class="flex max-w-3xl flex-col gap-6">
                <h3 class="${HEADING}">Floating</h3>
                <div fd-tile-container>${TEXTS.map(line(false, false)).join('')}</div>
                <h3 class="${HEADING}">List</h3>
                <div fd-tile-container list>${TEXTS.map(line(false, false)).join('')}</div>
                <h3 class="${HEADING}">Floating with badge</h3>
                <div fd-tile-container>${TEXTS.map(line(true, false)).join('')}</div>
                <h3 class="${HEADING}">Floating in action mode, disabled</h3>
                <div fd-tile-container>${TEXTS.slice(0, 3).map(line(false, true)).join('')}${line(false, true, true)(TEXTS[3])}</div>
                <h3 class="${HEADING}">List in action mode</h3>
                <div fd-tile-container list>${TEXTS.map(line(true, true)).join('')}</div>
            </div>`
    })
};

export const ActionMode: Story = {
    name: 'Action mode',
    render: () => ({ template: `<story-action-tiles />` })
};
