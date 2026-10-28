import { Component, Type, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Skeleton } from '@/ui/skeleton/skeleton';
import {
    Card,
    CardContent,
    CardCounter,
    CardFooter,
    CardFooterActionItem,
    CardHeader,
    CardHeaderAction,
    CardHeaderRow,
    CardHeaderColumn,
    CardExtendedHeader,
    CardIndicator,
    CardIndicatorTitle,
    CardIndicatorValue,
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
    CardNumericContainer,
    CardNumericHeader,
    CardSecondSubtitle,
    CardSubtitle,
    CardTitle,
    type CardKpiStatus,
    type CardType
} from './card';

const IMG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="teal"/></svg>'
    );

async function render<T>(type: Type<T>) {
    const fixture = TestBed.createComponent(type);
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        await fixture.whenStable();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await fixture.whenStable();
    };
    await stable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        stable,
        q: <E extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<E>(selector)!,
        all: <E extends HTMLElement = HTMLElement>(selector: string) => [...root.querySelectorAll<E>(selector)]
    };
}

const rect = (el: Element) => el.getBoundingClientRect();
const style = (el: Element, pseudo?: string) => getComputedStyle(el, pseudo);

function cssColor(variable: string): string {
    const probe = document.createElement('span');
    probe.style.color = `var(${variable})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
}

function cssBackground(variable: string): string {
    const probe = document.createElement('span');
    probe.style.backgroundColor = `var(${variable})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
}

afterEach(async () => {
    document.documentElement.removeAttribute('dir');
    await page.viewport(1280, 800);
});

@Component({
    imports: [
        Card,
        CardHeader,
        CardMainHeader,
        CardTitle,
        CardSubtitle,
        CardCounter,
        CardContent,
        CardFooter,
        CardFooterActionItem
    ],
    template: `
        <div style="padding: 24px; width: 320px">
            <fd-card
                id="card"
                [cardType]="cardType()"
                [badge]="badge()"
                [secondBadge]="secondBadge()"
                [ariaDescribedby]="describedby()"
            >
                <fd-card-header>
                    <fd-card-main-header>
                        <h2 fd-card-title id="title">Card Title</h2>
                        <h3 fd-card-subtitle id="subtitle">Card Subtitle</h3>
                        <span fd-card-counter id="counter" [status]="counterStatus()">3 of 10</span>
                    </fd-card-main-header>
                </fd-card-header>
                <fd-card-footer>
                    <span id="footer-text">Footer</span>
                    <button *fdCardFooterActionItem id="approve">Approve</button>
                    <button *fdCardFooterActionItem id="reject">Reject</button>
                </fd-card-footer>
                <fd-card-content><p id="content" style="margin: 0; height: 40px">Content</p></fd-card-content>
            </fd-card>
        </div>
    `
})
class StandardHost {
    readonly cardType = signal<CardType>('standard');
    readonly badge = signal<string | undefined>('Badge');
    readonly secondBadge = signal<string | undefined>(undefined);
    readonly describedby = signal<string | undefined>(undefined);
    readonly counterStatus = signal<CardKpiStatus | 'neutral'>('neutral');
}

@Component({
    imports: [Card, CardHeader, CardMainHeader, CardTitle, CardSubtitle, CardHeaderAction, CardContent],
    template: `
        <button id="before">Before</button>
        <fd-card id="card" (keyDown)="keys.push($event.key)">
            <fd-card-header>
                <fd-card-main-header [interactive]="interactive()" [title]="hint()">
                    <h2 fd-card-title>Orders</h2>
                    <h3 fd-card-subtitle>Open</h3>
                    <button fd-card-header-action id="action">More</button>
                </fd-card-main-header>
            </fd-card-header>
            <fd-card-content>Content</fd-card-content>
        </fd-card>
    `
})
class InteractiveHost {
    readonly interactive = signal(true);
    readonly hint = signal('Activate for action/navigation');
    readonly keys: string[] = [];
}

@Component({
    imports: [Card, CardHeader, CardMainHeader, CardTitle],
    template: `
        <div id="spacer" style="height: 40px"></div>
        <fd-card
            id="card"
            [role]="role()"
            [cardType]="cardType()"
            [ariaLabel]="ariaLabel()"
            [ariaRoledescription]="roleDescription()"
            [ariaDescription]="description()"
            [selected]="selected()"
            [interactive]="interactive()"
        >
            <fd-card-header>
                <fd-card-main-header><h2 fd-card-title id="title">Title</h2></fd-card-main-header>
            </fd-card-header>
        </fd-card>
    `
})
class RoleHost {
    readonly role = signal('region');
    readonly cardType = signal<CardType>('standard');
    readonly ariaLabel = signal<string | undefined>(undefined);
    readonly roleDescription = signal<string | undefined>(undefined);
    readonly description = signal<string | undefined>(undefined);
    readonly selected = signal(false);
    readonly interactive = signal(false);
}

@Component({
    imports: [
        Card,
        CardHeader,
        CardMainHeader,
        CardTitle,
        CardSubtitle,
        CardSecondSubtitle,
        CardHeaderRow,
        CardKpiHeader,
        CardKpiValue,
        CardKpiScaleIcon,
        CardKpiScaleText,
        CardKpiAnalytics,
        CardKpiAnalyticsLabel,
        CardKpiAnalyticsContent,
        CardNumericHeader,
        CardNumericContainer,
        CardIndicator,
        CardIndicatorTitle,
        CardIndicatorValue
    ],
    template: `
        <div style="width: 400px">
            <fd-card cardType="analytical">
                <fd-card-header>
                    <fd-card-main-header>
                        <h2 fd-card-title>Failure Breakdown</h2>
                        <h3 fd-card-subtitle>By plant</h3>
                        <fd-card-kpi-header>
                            <strong fd-card-kpi-value [status]="status()">42.2</strong>
                            <span fd-card-kpi-scale-icon id="icon">up</span>
                            <span fd-card-kpi-scale-text id="scale">%</span>
                            <div fd-card-kpi-analytics id="a1">
                                <span fd-card-kpi-analytics-label>Deviation</span>
                                <span fd-card-kpi-analytics-content>7.52%</span>
                            </div>
                            <div fd-card-kpi-analytics id="a2">
                                <span fd-card-kpi-analytics-label>Target</span>
                                <span fd-card-kpi-analytics-content>45%</span>
                            </div>
                        </fd-card-kpi-header>
                        <h4 fd-card-second-subtitle id="second">Q1, 2019</h4>
                    </fd-card-main-header>
                </fd-card-header>
                <fd-card-numeric-header>
                    <div fd-card-header-row>
                        <fd-card-numeric-container>
                            <strong fd-card-kpi-value status="negative">7</strong>
                            <span fd-card-kpi-scale-text>K</span>
                        </fd-card-numeric-container>
                        <fd-card-indicator id="ind">
                            <span fd-card-indicator-title>Target</span>
                            <span fd-card-indicator-value>8 K</span>
                        </fd-card-indicator>
                    </div>
                </fd-card-numeric-header>
            </fd-card>
        </div>
    `
})
class KpiHost {
    readonly status = signal<CardKpiStatus | undefined>('positive');
}

@Component({
    imports: [Card, CardHeader, CardMainHeader, CardTitle, CardContent, CardLoader, Skeleton],
    template: `
        <fd-card id="card" [isLoading]="loading()" badge="New">
            <fd-card-header>
                <fd-card-main-header><h2 fd-card-title>Loading</h2></fd-card-main-header>
            </fd-card-header>
            <fd-card-content><p id="content">Content</p></fd-card-content>
            <fd-card-loader>
                <fd-skeleton type="rectangle" width="100%" height="4rem" [animated]="false" />
            </fd-card-loader>
        </fd-card>
    `
})
class LoaderHost {
    readonly loading = signal(true);
}

@Component({
    imports: [
        Card,
        CardHeader,
        CardMainHeader,
        CardTitle,
        CardMedia,
        CardMediaImageContainer,
        CardMediaImage,
        CardMediaContentContainer,
        CardMediaHeading,
        CardMediaText
    ],
    template: `
        <div style="width: 320px">
            <fd-card id="image-card">
                <fd-card-media [hasPadding]="padding()">
                    <div fd-card-media-image-container>
                        <img fd-card-media-image [src]="img" alt="Landscape" style="max-height: 160px" />
                    </div>
                </fd-card-media>
                <fd-card-header
                    ><fd-card-main-header><h2 fd-card-title>Title</h2></fd-card-main-header></fd-card-header
                >
            </fd-card>
            <fd-card id="shell-card">
                <fd-card-media [shellColor]="shell()" [legendColor]="legend()">
                    <div fd-card-media-content-container>
                        <div fd-card-media-heading id="heading">Shell colour</div>
                        <p fd-card-media-text>Media text</p>
                    </div>
                </fd-card-media>
            </fd-card>
        </div>
        <fd-card id="banner" cardType="banner" style="height: 288px">
            <fd-card-media>
                <div fd-card-media-content-container [legendColor]="13">
                    <div fd-card-media-heading [level]="3">Banner</div>
                    <p fd-card-media-text>Text</p>
                </div>
                <div fd-card-media-image-container><img fd-card-media-image [src]="img" alt="Landscape" /></div>
            </fd-card-media>
        </fd-card>
        <fd-card id="text-banner" cardType="banner">
            <fd-card-media [shellColor]="13">
                <div fd-card-media-content-container>
                    <div fd-card-media-heading>Text only</div>
                </div>
            </fd-card-media>
        </fd-card>
    `
})
class MediaHost {
    readonly img = IMG;
    readonly padding = signal(false);
    readonly shell = signal<number | undefined>(3);
    readonly legend = signal<number | undefined>(undefined);
}

@Component({
    imports: [Card, CardHeader, CardMainHeader, CardTitle, CardList],
    template: `
        <button id="before">Before</button>
        <div fd-card-list ariaLabel="Products" style="display: flex; gap: 8px">
            @for (p of products; track p; let i = $index) {
                <fd-card
                    style="width: 200px"
                    role="listitem"
                    [ariaPosinset]="i + 1"
                    [ariaSetsize]="products.length"
                    [selected]="i === 1"
                >
                    <fd-card-header>
                        <fd-card-main-header
                            ><h2 fd-card-title>{{ p }}</h2></fd-card-main-header
                        >
                    </fd-card-header>
                </fd-card>
            }
        </div>
        <button id="after">After</button>
    `
})
class ListHost {
    readonly products = ['One', 'Two', 'Three', 'Four'];
}

@Component({
    imports: [Card, CardHeader, CardMainHeader, CardTitle, CardContent],
    template: `
        <fd-card id="three">
            <fd-card-header id="top"
                ><fd-card-main-header><h2 fd-card-title>Top</h2></fd-card-main-header></fd-card-header
            >
            <fd-card-content id="middle"><p style="margin: 0; height: 40px">Content</p></fd-card-content>
            <fd-card-header id="bottom"
                ><fd-card-main-header><h2 fd-card-title>Bottom</h2></fd-card-main-header></fd-card-header
            >
        </fd-card>
        <fd-card id="badged" badge="Badge">
            <fd-card-content id="badged-content"><p style="margin: 0; height: 40px">Content</p></fd-card-content>
        </fd-card>
        <fd-card id="only">
            <fd-card-content id="only-content"><p style="margin: 0; height: 40px">Content</p></fd-card-content>
        </fd-card>
    `
})
class CornerHost {}

@Component({
    imports: [
        Card,
        CardHeader,
        CardMainHeader,
        CardTitle,
        CardSubtitle,
        CardSecondSubtitle,
        CardExtendedHeader,
        CardHeaderColumn,
        CardHeaderRow
    ],
    template: `
        <fd-card id="extended" style="width: 400px">
            <fd-card-header id="extended-header">
                <fd-card-main-header>
                    <h2 fd-card-title>Travel Request</h2>
                    <h3 fd-card-subtitle id="sub">Marie Johnson</h3>
                    <h4 fd-card-second-subtitle id="second">Q1, 2024</h4>
                </fd-card-main-header>
                <fd-card-extended-header id="ext" [align]="align()">
                    <div fd-card-header-column id="start-column">
                        <div fd-card-header-row><span>Las Vegas</span><span>TechEd</span></div>
                        <div fd-card-header-row><span>May 3rd - 5th</span></div>
                    </div>
                    <div fd-card-header-column align="right" id="end-column">
                        <div fd-card-header-row><span id="amount" style="font-size: 1.4rem">956.00 EUR</span></div>
                    </div>
                </fd-card-extended-header>
            </fd-card-header>
        </fd-card>
    `
})
class ExtendedHost {
    readonly align = signal<'top' | 'bottom' | null>('bottom');
}

describe('Card', () => {
    it('header, content and footer render in order; badges at the top end corner (two at most)', async () => {
        const { host, q, all, stable } = await render(StandardHost);
        const card = q('#card');
        const header = q('fd-card-header');
        const content = q('fd-card-content');
        const footer = q('fd-card-footer');
        // the footer is projected last, even when written before the content
        expect([...card.children].map((c) => c.tagName.toLowerCase())).toEqual([
            'div',
            'fd-card-header',
            'fd-card-content',
            'fd-card-footer'
        ]);
        expect(rect(content).top).toBeGreaterThanOrEqual(rect(header).bottom - 1);
        expect(rect(footer).top).toBeGreaterThanOrEqual(rect(content).bottom - 1);

        // footer actions sit at the end, after the footer content
        const approve = q('#approve');
        const reject = q('#reject');
        expect(rect(reject).left).toBeGreaterThan(rect(approve).right);
        expect(Math.round(rect(footer).right - rect(reject).right)).toBe(16);
        expect(rect(approve).left).toBeGreaterThan(rect(q('#footer-text')).right);

        // the counter sits at the end of the header
        expect(rect(q('#counter')).left).toBeGreaterThan(rect(q('#title')).right);

        const badges = () => all('[data-card-badges] > [fd-object-status]');
        expect(badges().map((b) => b.textContent!.trim().replace('Object Status', ''))).toEqual(['Badge']);
        const badgeBox = q('[data-card-badges]');
        expect(rect(badgeBox).top).toBeLessThan(rect(card).top);
        expect(Math.round(rect(card).right - rect(badgeBox).right)).toBe(9);

        host.secondBadge.set('Second');
        await stable();
        expect(badges().map((b) => b.textContent!.trim().replace('Object Status', ''))).toEqual(['Badge', 'Second']);
        expect(rect(badges()[1]).left).toBeGreaterThan(rect(badges()[0]).right);
        expect(Math.round(rect(badges()[1]).right)).toBe(Math.round(rect(badgeBox).right));

        host.badge.set(undefined);
        host.secondBadge.set(undefined);
        await stable();
        expect(q('[data-card-badges]')).toBeNull();

        document.documentElement.setAttribute('dir', 'rtl');
        host.badge.set('Badge');
        await stable();
        expect(Math.round(q('[data-card-badges]').getBoundingClientRect().left - rect(card).left)).toBe(9);
    });

    it('the card is labelled by its title and described by subtitle, counter and badges', async () => {
        const { host, q, stable } = await render(StandardHost);
        const card = q('#card');
        expect(card.getAttribute('role')).toBe('region');
        expect(card.getAttribute('aria-labelledby')).toBe('title');
        expect(card.getAttribute('aria-describedby')).toBe('subtitle counter card-badge');
        expect(q('#card-badge').textContent!.trim().startsWith('Badge')).toBe(true);
        expect(card.getAttribute('tabindex')).toBe('-1');

        host.secondBadge.set('Second');
        host.describedby.set('extra');
        await stable();
        expect(card.getAttribute('aria-describedby')).toBe('subtitle counter card-badge card-second-badge extra');
        expect(q('fd-card-header').getAttribute('role')).toBe('group');
        expect(q('fd-card-header').getAttribute('aria-roledescription')).toBe('Card Header');
    });

    it('counter color follows its status', async () => {
        const { host, q, stable } = await render(StandardHost);
        const counter = q('#counter');
        expect(style(counter).color).toBe(cssColor('--sapNeutralTextColor'));
        host.counterStatus.set('negative');
        await stable();
        expect(style(counter).color).toBe(cssColor('--sapNegativeTextColor'));
    });

    it('interactive main header: focusable, Enter/Space emit, aria-description carries the hint', async () => {
        const { host, q, stable } = await render(InteractiveHost);
        const button = q('fd-card-main-header [role="button"]');
        expect(button.getAttribute('tabindex')).toBe('0');
        expect(button.getAttribute('aria-description')).toBe('Activate for action/navigation');
        expect(button.getAttribute('title')).toBe('Activate for action/navigation');
        expect(button.contains(q('[fd-card-title]'))).toBe(true);
        // the header action stays outside the button
        expect(button.contains(q('#action'))).toBe(false);

        q('#before').focus();
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(button);
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(host.keys).toEqual(['Enter', ' ']);

        // focus frame drawn inside the area
        expect(style(button, '::before').position).toBe('absolute');
        expect(style(button, '::before').borderTopStyle).not.toBe('none');

        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(q('#action'));

        host.hint.set('Open orders');
        await stable();
        expect(button.getAttribute('aria-description')).toBe('Open orders');

        host.interactive.set(false);
        await stable();
        const area = q('fd-card-main-header > div');
        expect(area.hasAttribute('role')).toBe(false);
        expect(area.hasAttribute('tabindex')).toBe(false);
        expect(area.hasAttribute('aria-description')).toBe(false);
        expect(area.hasAttribute('title')).toBe(false);
    });

    it('card role description and hint are exposed on the host', async () => {
        const { host, q, stable } = await render(RoleHost);
        const card = q('#card');
        expect(card.getAttribute('aria-roledescription')).toBe('Standard Card');
        expect(card.hasAttribute('aria-description')).toBe(false);

        host.cardType.set('quickView');
        await stable();
        expect(card.getAttribute('aria-roledescription')).toBe('QuickView Card');
        host.roleDescription.set('Product card');
        await stable();
        expect(card.getAttribute('aria-roledescription')).toBe('Product card');

        host.role.set('listitem');
        await stable();
        expect(card.getAttribute('role')).toBe('listitem');
        expect(card.getAttribute('aria-description')).toBe('Active, Press Enter to activate');
        expect(card.getAttribute('tabindex')).toBe('0');
        host.description.set('Opens the product');
        await stable();
        expect(card.getAttribute('aria-description')).toBe('Opens the product');

        // an explicit label replaces the title reference
        expect(card.getAttribute('aria-labelledby')).toBe('title');
        host.ariaLabel.set('Product');
        await stable();
        expect(card.getAttribute('aria-label')).toBe('Product');
        expect(card.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('role button makes the whole card focusable and interactive', async () => {
        const { host, q, stable } = await render(RoleHost);
        const card = q('#card');
        await userEvent.hover(q('#spacer'));
        expect(style(card).cursor).not.toBe('pointer');
        host.role.set('button');
        await stable();
        expect(card.getAttribute('tabindex')).toBe('0');
        expect(style(card).cursor).toBe('pointer');
        expect(card.hasAttribute('aria-description')).toBe(false);
        card.focus();
        expect(style(card, '::before').position).toBe('absolute');

        // start with the pointer away from the card (an earlier spec may have left it anywhere)
        await userEvent.hover(q('#spacer'));
        const before = style(card).backgroundColor;
        expect(before).toBe(cssBackground('--sapTile_Background'));
        await userEvent.hover(card);
        expect(style(card).backgroundColor).toBe(cssBackground('--sapTile_Hover_Background'));
        expect(style(card).backgroundColor).not.toBe(before);
    });

    it('selected card shows the selection border (data-selected), not aria-selected on listitems', async () => {
        const { host, q, stable } = await render(RoleHost);
        const card = q('#card');
        host.role.set('listitem');
        await stable();
        expect(card.hasAttribute('data-selected')).toBe(false);
        expect(style(card, '::before').content).toBe('none');

        host.selected.set(true);
        await stable();
        expect(card.hasAttribute('data-selected')).toBe(true);
        expect(card.hasAttribute('aria-selected')).toBe(false);
        const frame = style(card, '::before');
        expect(frame.position).toBe('absolute');
        expect(frame.borderTopColor).toBe(cssColor('--sapContent_FocusColor'));
        expect(frame.borderTopStyle).not.toBe('none');

        // a non-interactive card shows no selection frame
        host.role.set('region');
        await stable();
        expect(style(card, '::before').content).toBe('none');
        host.interactive.set(true);
        await stable();
        expect(style(card, '::before').position).toBe('absolute');
    });

    it('KPI header: value, scale icon/text, analytics labels and indicators', async () => {
        const { host, q, stable } = await render(KpiHost);
        const value = q('fd-card-kpi-header [fd-card-kpi-value]');
        expect(value.textContent).toBe('42.2');
        expect(style(value).fontSize).toBe('36px');
        expect(style(value).color).toBe(cssColor('--sapPositiveTextColor'));
        host.status.set(undefined);
        await stable();
        expect(style(value).color).toBe(cssColor('--sapNeutralTextColor'));
        host.status.set('critical');
        await stable();
        expect(style(value).color).toBe(cssColor('--sapCriticalTextColor'));

        // scale icon above the scale text, both after the value
        const icon = q('#icon');
        const scale = q('#scale');
        expect(rect(icon).left).toBeGreaterThanOrEqual(rect(value).right);
        expect(rect(scale).top).toBeGreaterThan(rect(icon).top);

        // analytics follow the KPI, labels above their values
        const [a1, a2] = [q('#a1'), q('#a2')];
        expect(rect(a1).left).toBeGreaterThan(rect(scale).right);
        expect(rect(a2).left).toBeGreaterThan(rect(a1).right);
        const label = a1.querySelector('[fd-card-kpi-analytics-label]')!;
        const content = a1.querySelector('[fd-card-kpi-analytics-content]')!;
        expect(rect(content).top).toBeGreaterThanOrEqual(rect(label).bottom - 1);
        expect(style(label).color).toBe(cssColor('--sapTile_TextColor'));
        expect(style(content).color).toBe(cssColor('--sapTile_TitleTextColor'));

        // the second subtitle comes below the KPI
        expect(rect(q('#second')).top).toBeGreaterThanOrEqual(rect(q('fd-card-kpi-header')).bottom);

        // numeric header with an indicator at the end
        const numeric = q('fd-card-numeric-header');
        expect(numeric.getAttribute('role')).toBe('group');
        expect(numeric.getAttribute('aria-roledescription')).toBe('Numeric content');
        const indicator = q('#ind');
        expect(rect(indicator).left).toBeGreaterThan(rect(q('fd-card-numeric-container')).right - 1);
        expect(Math.round(rect(indicator).right)).toBe(Math.round(rect(numeric).right) - 16);
        const title = indicator.querySelector('[fd-card-indicator-title]')!;
        const indValue = indicator.querySelector('[fd-card-indicator-value]')!;
        expect(rect(indValue).top).toBeGreaterThanOrEqual(rect(title).bottom - 1);
        expect(Math.round(rect(indValue).right)).toBe(Math.round(rect(indicator).right));
        expect(style(q('fd-card-numeric-container [fd-card-kpi-value]')).color).toBe(
            cssColor('--sapNegativeTextColor')
        );
    });

    it('KPI values keep their LTR direction in RTL', async () => {
        const { q, stable } = await render(KpiHost);
        document.documentElement.setAttribute('dir', 'rtl');
        await stable();
        expect(style(q('[fd-card-kpi-value]')).direction).toBe('ltr');
        expect(style(q('[fd-card-kpi-analytics-content]')).direction).toBe('ltr');
        // the analytics are laid out from the right
        expect(rect(q('#a2')).right).toBeLessThan(rect(q('#a1')).left);
    });

    it('loader state shows skeletons and hides content from assistive technology', async () => {
        const { host, q, stable } = await render(LoaderHost);
        const card = q('#card');
        expect(q('fd-card-loader')).not.toBeNull();
        expect(q('fd-card-loader fd-skeleton')).not.toBeNull();
        expect(q('fd-card-loader svg')!.getAttribute('aria-hidden')).toBe('true');
        // header, content and badges are not rendered at all
        expect(card.querySelector('fd-card-header')).toBeNull();
        expect(card.querySelector('#content')).toBeNull();
        expect(card.querySelector('[data-card-badges]')).toBeNull();
        expect(card.textContent!.trim()).toBe('');
        expect(rect(q('fd-card-loader')).height).toBeGreaterThanOrEqual(80);

        host.loading.set(false);
        await stable();
        expect(card.querySelector('fd-card-loader')).toBeNull();
        expect(card.querySelector('#content')!.textContent).toBe('Content');
        expect(card.querySelector('[data-card-badges]')).not.toBeNull();
    });

    it('media card: image container/banner variants, shell and legend colors, responsive banner sizes', async () => {
        const { host, q, stable } = await render(MediaHost);
        const imageCard = q('#image-card');
        const media = q('#image-card fd-card-media');
        const image = q('#image-card img');
        expect(media.getAttribute('role')).toBe('group');
        expect(media.getAttribute('aria-roledescription')).toBe('Card Media Block');
        // the image fills the card width, no rounding
        expect(Math.round(rect(image).width)).toBe(Math.round(rect(imageCard).width) - 2);
        expect(style(image).borderTopLeftRadius).toBe('0px');
        expect(style(image).objectFit).toBe('cover');

        host.padding.set(true);
        await stable();
        expect(Math.round(rect(image).left - rect(imageCard).left)).toBe(17);
        expect(style(image).borderTopLeftRadius).toBe('8px');

        // shell colour: background and text colours of the category
        const shellMedia = q('#shell-card fd-card-media');
        const heading = q('#heading');
        expect(heading.getAttribute('role')).toBe('heading');
        expect(heading.getAttribute('aria-level')).toBe('2');
        expect(q('#shell-card').getAttribute('aria-labelledby')).toBe(heading.id);
        expect(style(shellMedia).backgroundColor).toBe(cssBackground('--sapShell_Category_3_Background'));
        expect(style(heading).color).toBe(cssColor('--sapShell_Category_3_TextColor'));
        host.shell.set(undefined);
        host.legend.set(5);
        await stable();
        expect(style(shellMedia).backgroundColor).toBe(cssBackground('--sapLegendBackgroundColor5'));
        expect(style(heading).color).toBe(cssColor('--sapTextColor'));
        host.legend.set(undefined);
        await stable();
        expect(style(shellMedia).backgroundColor).toBe(cssBackground('--sapTile_Background'));

        // legend colour on the content container of a banner
        const banner = q('#banner');
        const container = q('#banner [fd-card-media-content-container]');
        expect(style(container).backgroundColor).toBe(cssBackground('--sapLegendBackgroundColor13'));
        expect(q('#banner [fd-card-media-heading]').getAttribute('aria-level')).toBe('3');

        // banner: text and image side by side, half each
        const bannerImage = q('#banner [fd-card-media-image-container]');
        const inner = rect(banner).width - 2;
        expect(Math.round(rect(container).width)).toBe(Math.round(inner / 2));
        expect(Math.round(rect(bannerImage).width)).toBe(Math.round(inner / 2));
        expect(rect(bannerImage).left).toBeGreaterThanOrEqual(rect(container).right - 1);
        expect(Math.round(rect(bannerImage).height)).toBe(Math.round(rect(banner).height) - 2);
        expect(style(container).paddingLeft).toBe('48px');
        // a text-only banner uses 80% for the text
        const textBanner = q('#text-banner');
        expect(Math.round(rect(q('#text-banner [fd-card-media-content-container]')).width)).toBe(
            Math.round((rect(textBanner).width - 2) * 0.8)
        );

        // below lg: 80% text, 20% image
        await page.viewport(800, 800);
        await stable();
        const mid = rect(banner).width - 2;
        expect(Math.round(rect(container).width)).toBe(Math.round(mid * 0.8));
        expect(Math.round(rect(bannerImage).width)).toBe(Math.round(mid * 0.2));

        // below sm: the image stacks above the text, 10rem high, full width
        await page.viewport(500, 800);
        await stable();
        const small = rect(banner).width - 2;
        expect(Math.round(rect(bannerImage).width)).toBe(Math.round(small));
        expect(Math.round(rect(bannerImage).height)).toBe(160);
        expect(Math.round(rect(container).width)).toBe(Math.round(small));
        expect(rect(container).top).toBeGreaterThanOrEqual(rect(bannerImage).bottom - 1);
    });

    it('card list: arrow keys move focus between cards, Home/End jump', async () => {
        const { q, all } = await render(ListHost);
        const list = q('[fd-card-list]');
        expect(list.getAttribute('role')).toBe('list');
        expect(list.getAttribute('aria-label')).toBe('Products');
        expect(list.getAttribute('aria-roledescription')).toBe('Card List');
        const cards = all('fd-card');
        expect(cards.map((c) => c.getAttribute('aria-posinset'))).toEqual(['1', '2', '3', '4']);
        expect(cards.every((c) => c.getAttribute('aria-setsize') === '4')).toBe(true);
        // the header inside a list item is not a separate target
        expect(style(q('fd-card fd-card-main-header > div')).pointerEvents).toBe('none');

        q('#before').focus();
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(cards[0]);
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(cards[1]);
        await userEvent.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(cards[2]);
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(cards[1]);
        await userEvent.keyboard('{ArrowUp}');
        expect(document.activeElement).toBe(cards[0]);
        // no wrap at the ends
        await userEvent.keyboard('{ArrowUp}');
        expect(document.activeElement).toBe(cards[0]);
        await userEvent.keyboard('{End}');
        expect(document.activeElement).toBe(cards[3]);
        await userEvent.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(cards[3]);
        await userEvent.keyboard('{Home}');
        expect(document.activeElement).toBe(cards[0]);

        // every card is a tab stop
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(cards[1]);
    });

    it('card list ignores keys from elements that are not cards', async () => {
        const { q } = await render(ListHost);
        const list = q('[fd-card-list]');
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
        q('#before').focus();
        list.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(q('#before'));
    });

    it('corner rounding of the first/last part follows the card radius', async () => {
        const { q } = await render(CornerHost);
        const radius = style(q('#three')).borderTopLeftRadius;
        expect(radius).not.toBe('0px');
        const corners = (el: Element) => {
            const s = style(el);
            return [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius];
        };
        expect(corners(q('#top'))).toEqual([radius, radius, '0px', '0px']);
        expect(corners(q('#middle'))).toEqual(['0px', '0px', '0px', '0px']);
        expect(corners(q('#bottom'))).toEqual(['0px', '0px', radius, radius]);
        // badges come first in the DOM, the content after them still gets the top corners
        expect(corners(q('#badged-content'))).toEqual([radius, radius, radius, radius]);
        expect(corners(q('#only-content'))).toEqual([radius, radius, radius, radius]);
        // the bottom header of the three-part card has a top border instead of a bottom one
        expect(style(q('#bottom fd-card-main-header')).borderTopWidth).toBe('1px');
        expect(style(q('#top fd-card-main-header')).borderBottomWidth).toBe('1px');
    });

    it('aria-describedby includes the second subtitle', async () => {
        const { q } = await render(ExtendedHost);
        expect(q('#extended').getAttribute('aria-describedby')).toBe('sub second');
    });

    it('extended header: a group whose end column aligns to the end and whose content can sit at the bottom', async () => {
        const { host, q, stable } = await render(ExtendedHost);
        const ext = q('#ext');
        expect(ext.getAttribute('role')).toBe('group');
        expect(ext.getAttribute('aria-roledescription')).toBe('Extended content');
        // the extended header follows the main header inside the card header
        expect(rect(ext).top).toBeGreaterThanOrEqual(rect(q('fd-card-main-header')).bottom - 1);

        // columns sit side by side; the end column's content hugs the end edge
        const start = rect(q('#start-column'));
        const end = rect(q('#end-column'));
        expect(end.left).toBeGreaterThanOrEqual(start.right - 1);
        expect(Math.abs(rect(q('#amount')).right - end.right)).toBeLessThan(1);
        // rows lay out their items side by side
        const [a, b] = [...q('#start-column [fd-card-header-row]').children].map(rect);
        expect(b.left).toBeGreaterThan(a.right - 1);

        // align bottom: the shorter end column sits at the bottom of the taller start column
        expect(Math.abs(end.bottom - start.bottom)).toBeLessThan(1);
        expect(end.top).toBeGreaterThan(start.top + 1);
        host.align.set('top');
        await stable();
        expect(Math.abs(rect(q('#end-column')).top - rect(q('#start-column')).top)).toBeLessThan(1);
    });
});
