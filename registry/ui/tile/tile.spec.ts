import { Component, Type, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    NumericContent,
    NumericContentKpi,
    NumericContentKpiContainer,
    NumericContentScale,
    NumericContentScaleArrow,
    NumericContentScaleContainer,
    NumericContentScaleText,
    type NumericContentSize,
    type NumericContentState
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
    TilePageIndicator,
    TileSection,
    TileSlideContainer,
    TileSubtitle,
    TileTitle,
    TileTitleContainer,
    TileToggle,
    type TileSize
} from './tile';

const LONG = 'Title with very very very very very very very very very very very very very long text';

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
const style = (el: Element) => getComputedStyle(el);

/** Resolved color of a CSS custom property. */
function cssColor(variable: string): string {
    const probe = document.createElement('span');
    probe.style.color = `var(${variable})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
}

afterEach(() => {
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('data-density');
});

@Component({
    imports: [Tile, TileHeader, TileTitle, TileContent],
    template: `
        <fd-tile id="clickable" type="launch" clickable ariaLabel="Sales" (tileClick)="clicks.set(clicks() + 1)">
            <div fd-tile-header><div fd-tile-title>Sales</div></div>
            <div fd-tile-content><button id="inner" (click)="inner.set(inner() + 1)">Inner</button></div>
        </fd-tile>
        <fd-tile id="static" type="launch" (tileClick)="clicks.set(clicks() + 1)">
            <div fd-tile-header><div fd-tile-title>Static</div></div>
        </fd-tile>
        <fd-tile id="group" type="launch" clickable role="group" ariaLabelledby="title"></fd-tile>
        <a fd-tile id="link" type="launch" href="#tile-link" (tileClick)="links.set(links() + 1)">
            <div fd-tile-header><div fd-tile-title>Link</div></div>
        </a>
        <span id="title">Labelled</span>
    `
})
class ClickHost {
    readonly clicks = signal(0);
    readonly inner = signal(0);
    readonly links = signal(0);
}

@Component({
    imports: [Tile, TileHeader, TileTitle, TileContent, TileFooter, TileFooterText],
    template: `
        <div class="flex items-start gap-4">
            <fd-tile id="regular" type="launch" [size]="size()" [double]="double()">
                <div fd-tile-header><div fd-tile-title>Title</div></div>
                <div fd-tile-content>Content</div>
                <div fd-tile-footer><span fd-tile-footer-text>Footer</span></div>
            </fd-tile>
        </div>
    `
})
class SizeHost {
    readonly size = signal<TileSize | undefined>(undefined);
    readonly double = signal(false);
}

@Component({
    imports: [
        Tile,
        TileHeader,
        TileTitle,
        TileContent,
        TileFooter,
        TileSection,
        TileContentText,
        TileContentByline,
        TileFooterText
    ],
    template: `
        <fd-tile type="feed" [size]="size()">
            <div fd-tile-header twoColumn>
                <div fd-tile-section id="h1"><div fd-tile-title>Left</div></div>
                <div fd-tile-section id="h2"><div fd-tile-title>Right</div></div>
            </div>
            <div fd-tile-content twoColumn>
                <div fd-tile-section id="c1">
                    <div fd-tile-content-text>{{ long }}</div>
                    <div fd-tile-content-byline>About 1 minute ago</div>
                </div>
                <div fd-tile-section id="c2"><span id="img" style="display:block;width:100px;height:20px"></span></div>
            </div>
            <div fd-tile-footer twoColumn>
                <div fd-tile-section id="f1"><span fd-tile-footer-text>Start</span></div>
                <div fd-tile-section id="f2"><span fd-tile-footer-text>End</span></div>
            </div>
        </fd-tile>
    `
})
class ColumnsHost {
    readonly long = LONG + ' ' + LONG;
    readonly size = signal<TileSize | undefined>(undefined);
}

@Component({
    imports: [
        Tile,
        TileContainer,
        TileHeader,
        TileTitleContainer,
        TileTitle,
        TileSubtitle,
        TileBadge,
        TileActionClose,
        TileActionIndicator,
        TileActionContainer
    ],
    template: `
        <div style="width: 1000px">
            <div fd-tile-container [list]="list()">
                @for (title of titles; track title; let i = $index) {
                    <div
                        fd-tile
                        type="line"
                        clickable
                        [disabled]="i === 2 && disabledLast()"
                        [action]="action()"
                        (tileClick)="clicked.push(i)"
                    >
                        <div fd-tile-header>
                            <div fd-tile-title-container>
                                @if (badge()) {
                                    <div fd-tile-badge>Badge</div>
                                }
                                <div fd-tile-title>{{ title }}</div>
                            </div>
                            <div fd-tile-subtitle>Subtitle</div>
                        </div>
                        @if (action()) {
                            <div fd-tile-action-container>
                                <button fd-tile-action-indicator tabindex="-1"></button>
                                <button fd-tile-action-close></button>
                            </div>
                        }
                    </div>
                }
            </div>
        </div>
    `
})
class LineHost {
    readonly titles = ['Short', 'Second', LONG + ' ' + LONG];
    readonly list = signal(false);
    readonly action = signal(false);
    readonly badge = signal(false);
    readonly disabledLast = signal(false);
    readonly clicked: number[] = [];
}

@Component({
    imports: [
        Tile,
        TileHeader,
        TileTitle,
        TileContent,
        TileFooter,
        TileFooterText,
        TileBadge,
        TileActionClose,
        TileActionIndicator
    ],
    template: `
        <div style="padding: 20px">
            <fd-tile id="tile" type="launch" [action]="action()" role="group" ariaLabel="Leave">
                <button fd-tile-action-close ariaLabel="Remove Leave" (click)="removed.set(true)"></button>
                <button fd-tile-action-indicator tabindex="-1"></button>
                <div fd-tile-badge>New</div>
                <div fd-tile-header><div fd-tile-title>Leave</div></div>
                <div fd-tile-content>Content</div>
                <div fd-tile-footer><span fd-tile-footer-text>Footer</span></div>
            </fd-tile>
        </div>
    `
})
class ActionHost {
    readonly action = signal(true);
    readonly removed = signal(false);
}

@Component({
    imports: [
        Tile,
        TileHeader,
        TileTitle,
        TileFooter,
        TileFooterText,
        TileBackgroundImg,
        TileToggle,
        TileSlideContainer,
        TilePageIndicator,
        TileDot
    ],
    template: `
        <button id="before">Before</button>
        <fd-tile type="slide" [size]="size()">
            <div fd-tile-background-img backgroundImage="assets/landscape.svg"></div>
            <button fd-tile-toggle [playing]="playing()" (click)="playing.set(!playing())"></button>
            <div fd-tile-slide-container>
                <div fd-tile-header><div fd-tile-title>Wind map</div></div>
                <div fd-tile-footer><span fd-tile-footer-text>May 14</span></div>
                <div fd-tile-page-indicator>
                    @for (page of pages; track page) {
                        <span fd-tile-dot [active]="page === current()"></span>
                    }
                </div>
            </div>
        </fd-tile>
        <button id="labelled" fd-tile-toggle ariaLabel="Stop slides"></button>
    `
})
class SlideHost {
    readonly pages = [0, 1, 2];
    readonly current = signal(1);
    readonly playing = signal(false);
    readonly size = signal<TileSize | undefined>(undefined);
}

@Component({
    imports: [Tile, TileContainer, TileHeader, TileTitleContainer, TileTitle, TileBadge],
    template: `
        <div style="padding: 20px">
            <fd-tile id="tile" type="launch">
                <div fd-tile-badge>Badge</div>
                <div fd-tile-header><div fd-tile-title>Tile</div></div>
            </fd-tile>
        </div>
        <div fd-tile-container style="width: 600px">
            <div fd-tile id="line" type="line">
                <div fd-tile-header>
                    <div fd-tile-title-container>
                        <div fd-tile-badge>Inline</div>
                        <div fd-tile-title>Line</div>
                    </div>
                </div>
            </div>
        </div>
    `
})
class BadgeHost {}

@Component({
    imports: [
        Tile,
        TileContent,
        NumericContent,
        NumericContentKpiContainer,
        NumericContentKpi,
        NumericContentScaleContainer,
        NumericContentScale,
        NumericContentScaleArrow,
        NumericContentScaleText
    ],
    template: `
        <fd-tile type="kpi" [size]="tileSize()">
            <div fd-tile-content>
                <div fd-numeric-content [size]="size()">
                    <div fd-numeric-content-kpi-container>
                        <div fd-numeric-content-kpi [state]="state()">{{ value() }}</div>
                    </div>
                    <div fd-numeric-content-scale-container>
                        <div fd-numeric-content-scale [state]="state()">
                            <span fd-numeric-content-scale-arrow glyph="up" [ariaLabel]="arrowLabel()"></span>
                            <span fd-numeric-content-scale-text>M</span>
                        </div>
                    </div>
                </div>
            </div>
        </fd-tile>
    `
})
class NumericHost {
    readonly tileSize = signal<TileSize | undefined>(undefined);
    readonly size = signal<NumericContentSize | undefined>(undefined);
    readonly state = signal<NumericContentState | undefined>(undefined);
    readonly value = signal('-1.2');
    readonly arrowLabel = signal<string | null>(null);
}

describe('Tile', () => {
    it('clickable tile is role button, focusable, emits tileClick on click, Enter and Space (not when the event comes from an inner button)', async () => {
        const { host, q } = await render(ClickHost);
        const tile = q('#clickable');
        expect(tile.getAttribute('role')).toBe('button');
        expect(tile.getAttribute('tabindex')).toBe('0');
        expect(tile.getAttribute('aria-label')).toBe('Sales');

        await userEvent.click(tile);
        expect(host.clicks()).toBe(1);

        tile.focus();
        expect(document.activeElement).toBe(tile);
        await userEvent.keyboard('{Enter}');
        expect(host.clicks()).toBe(2);
        await userEvent.keyboard(' ');
        expect(host.clicks()).toBe(3);

        const inner = q<HTMLButtonElement>('#inner');
        inner.focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        // the keys activate the inner button (Space is not swallowed); the tile sees only the bubbled clicks
        expect(host.inner()).toBe(2);
        expect(host.clicks()).toBe(5);
    });

    it('a non-clickable tile has no role, is not focusable and emits no tileClick', async () => {
        const { host, q } = await render(ClickHost);
        const tile = q('#static');
        expect(tile.hasAttribute('role')).toBe(false);
        expect(tile.hasAttribute('tabindex')).toBe(false);
        await userEvent.click(tile);
        expect(host.clicks()).toBe(0);
    });

    it('a custom role and aria-labelledby replace the button role', async () => {
        const { q } = await render(ClickHost);
        const tile = q('#group');
        expect(tile.getAttribute('role')).toBe('group');
        expect(tile.getAttribute('aria-labelledby')).toBe('title');
        expect(tile.getAttribute('tabindex')).toBe('0');
    });

    it('Tab moves through the clickable tile and the link but skips the static tile', async () => {
        const { q } = await render(ClickHost);
        q('#clickable').focus();
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(q('#inner'));
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(q('#group'));
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(q('#link'));
    });

    it('<a fd-tile> keeps link semantics and emits tileClick on click', async () => {
        const { host, q } = await render(ClickHost);
        const link = q<HTMLAnchorElement>('#link');
        expect(link.hasAttribute('role')).toBe(false);
        expect(link.hasAttribute('tabindex')).toBe(false);
        expect(link.getAttribute('href')).toBe('#tile-link');
        expect(link.tabIndex).toBe(0);

        await userEvent.click(link);
        expect(host.links()).toBe(1);
        expect(location.hash).toBe('#tile-link');

        // Enter follows the link (a native click), it does not emit twice
        link.focus();
        await userEvent.keyboard('{Enter}');
        expect(host.links()).toBe(2);
        history.replaceState(null, '', location.pathname + location.search);
    });

    it('size s and double width; header/content/footer heights per size', async () => {
        const { host, q, stable } = await render(SizeHost);
        const tile = q('#regular');
        const parts = () =>
            ['[fd-tile-header]', '[fd-tile-content]', '[fd-tile-footer]'].map((s) => Math.round(rect(q(s)).height));

        expect(Math.round(rect(tile).width)).toBe(176);
        expect(Math.round(rect(tile).height)).toBe(176);
        expect(parts()).toEqual([58, 62, 16]);

        host.double.set(true);
        await stable();
        expect(Math.round(rect(tile).width)).toBe(360);
        expect(Math.round(rect(tile).height)).toBe(176);

        host.size.set('s');
        await stable();
        expect(Math.round(rect(tile).width)).toBe(304);
        expect(Math.round(rect(tile).height)).toBe(148);

        host.double.set(false);
        await stable();
        expect(Math.round(rect(tile).width)).toBe(148);
        expect(Math.round(rect(tile).height)).toBe(148);
        expect(parts()).toEqual([52, 55, 17]);
    });

    it('two-column sections; feed tile content columns', async () => {
        const { q } = await render(ColumnsHost);
        const h1 = rect(q('#h1'));
        const h2 = rect(q('#h2'));
        // the header halves sit side by side, spread to both ends
        expect(h2.left).toBeGreaterThan(h1.right);
        expect(Math.abs(h1.top - h2.top)).toBeLessThan(1);
        expect(Math.round(h1.left)).toBe(Math.round(rect(q('[fd-tile-header]')).left));
        expect(Math.round(h2.right)).toBe(Math.round(rect(q('[fd-tile-header]')).right));

        // feed content: text column grows, the second column holds the image
        const c1 = rect(q('#c1'));
        const c2 = rect(q('#c2'));
        expect(c2.left).toBeGreaterThanOrEqual(c1.right);
        // the second column fits its content, the text column takes the rest
        expect(Math.round(c2.width)).toBe(108);
        expect(Math.round(c2.right)).toBe(Math.round(rect(q('[fd-tile-content]')).right));
        expect(style(q('#c1')).flexDirection).toBe('column');
        const text = q('[fd-tile-content-text]');
        expect(style(text).webkitLineClamp).toBe('2');
        expect(text.scrollHeight).toBeGreaterThan(text.clientHeight);
        expect(rect(q('[fd-tile-content-byline]')).top).toBeGreaterThanOrEqual(rect(text).bottom - 1);

        // footer: the last section is aligned to the end
        const f2 = q('#f2');
        expect(style(f2).justifyContent).toBe('flex-end');
        expect(Math.round(rect(f2.firstElementChild!).right)).toBe(Math.round(rect(f2).right));
    });

    it('line tile: floating vs list container, title ellipsis, compact heights, disabled', async () => {
        const { host, all, q, stable } = await render(LineHost);
        const tiles = () => all('[fd-tile]');
        const [first, second, third] = tiles();

        // floating: tiles flow in a row and wrap
        expect(Math.abs(rect(first).top - rect(second).top)).toBeLessThan(1);
        expect(rect(second).left).toBeGreaterThan(rect(first).right);
        expect(rect(third).top).toBeGreaterThan(rect(first).bottom);
        expect(Math.round(rect(first).height)).toBe(32);

        // long title truncates with an ellipsis
        const title = third.querySelector<HTMLElement>('[fd-tile-title]')!;
        expect(style(title).textOverflow).toBe('ellipsis');
        expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
        expect(rect(third).right).toBeLessThanOrEqual(rect(q('[fd-tile-container]')).right + 1);

        // list: the tiles stack vertically; a long title wraps the subtitle to a second line, up to 3.25rem
        host.list.set(true);
        await stable();
        expect(rect(second).top).toBeGreaterThanOrEqual(rect(first).bottom);
        expect(Math.round(rect(first).left)).toBe(Math.round(rect(second).left));
        expect(Math.round(rect(first).height)).toBe(32);
        expect(Math.round(rect(third).height)).toBe(52);
        const subtitle = third.querySelector('[fd-tile-subtitle]')!;
        expect(rect(subtitle).top).toBeGreaterThanOrEqual(rect(title).bottom - 1);

        // compact density
        document.documentElement.setAttribute('data-density', 'compact');
        await stable();
        expect(Math.round(rect(first).height)).toBe(26);
        expect(Math.round(rect(third).height)).toBe(46);
        host.list.set(false);
        await stable();
        expect(Math.round(rect(first).height)).toBe(26);

        // clickable line tiles
        expect(first.getAttribute('role')).toBe('button');
        await userEvent.click(first);
        expect(host.clicked).toEqual([0]);

        // disabled: not focusable, aria-disabled, no tileClick, dimmed
        host.disabledLast.set(true);
        await stable();
        expect(third.getAttribute('aria-disabled')).toBe('true');
        expect(third.hasAttribute('tabindex')).toBe(false);
        expect(style(third).pointerEvents).toBe('none');
        expect(Number(style(third).opacity)).toBe(0.5);
        third.click();
        third.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(host.clicked).toEqual([0]);
    });

    it('line tile in action mode shows the action buttons inline and keeps the badge', async () => {
        const { host, all, stable } = await render(LineHost);
        host.action.set(true);
        host.badge.set(true);
        await stable();
        const tile = all('[fd-tile]')[0];
        const close = tile.querySelector<HTMLElement>('[fd-tile-action-close]')!;
        expect(close.getAttribute('aria-label')).toBe('Remove');
        expect(tile.querySelector('[fd-tile-action-indicator]')!.getAttribute('aria-label')).toBe('More');
        expect(style(close).position).toBe('relative');
        expect(rect(close).right).toBeLessThanOrEqual(rect(tile).right + 1);
        // no overlay inside line tiles
        expect(tile.querySelector(':scope > div.absolute')).toBeNull();
        expect(style(tile.querySelector('[fd-tile-badge]')!).display).not.toBe('none');
    });

    it('action mode shows the overlay, close and indicator buttons and hides footer and badge', async () => {
        const { host, q, stable } = await render(ActionHost);
        const tile = q('#tile');
        const overlay = tile.firstElementChild as HTMLElement;
        expect(overlay.tagName).toBe('DIV');
        expect(style(overlay).position).toBe('absolute');
        expect(Math.round(rect(overlay).width)).toBe(Math.round(rect(tile).width) - 2);
        expect(Number(style(overlay).opacity)).toBeCloseTo(0.7);

        const close = q<HTMLButtonElement>('[fd-tile-action-close]');
        const indicator = q<HTMLButtonElement>('[fd-tile-action-indicator]');
        expect(close.type).toBe('button');
        expect(close.getAttribute('aria-label')).toBe('Remove Leave');
        expect(indicator.getAttribute('aria-label')).toBe('More');
        // close at the top end corner, above the overlay; indicator at the bottom end
        expect(rect(close).top).toBeLessThan(rect(tile).top);
        expect(rect(close).right).toBeGreaterThan(rect(tile).right);
        expect(Number(style(close).zIndex)).toBeGreaterThan(Number(style(overlay).zIndex));
        expect(rect(indicator).bottom).toBeLessThanOrEqual(rect(tile).bottom);
        expect(rect(indicator).bottom).toBeGreaterThan(rect(tile).bottom - 10);

        expect(style(q('[fd-tile-footer]')).display).toBe('none');
        expect(style(q('[fd-tile-badge]')).display).toBe('none');

        await userEvent.click(close);
        expect(host.removed()).toBe(true);

        host.action.set(false);
        await stable();
        expect(tile.firstElementChild).toBe(close);
        expect(style(q('[fd-tile-footer]')).display).not.toBe('none');
        expect(style(q('[fd-tile-badge]')).display).not.toBe('none');
    });

    it('slide tile: toggle button shows on hover/focus/touch, play/pause label; page dots', async () => {
        const { host, q, all, stable } = await render(SlideHost);
        const tile = q('fd-tile');
        const toggle = q<HTMLButtonElement>('fd-tile [fd-tile-toggle]');
        expect(toggle.type).toBe('button');
        expect(toggle.getAttribute('aria-label')).toBe('Play');
        const shown = () => style(toggle).opacity === '1';
        await userEvent.hover(q('#before'));
        expect(shown()).toBe(false);

        await userEvent.hover(tile);
        expect(shown()).toBe(true);
        await userEvent.hover(q('#before'));
        expect(shown()).toBe(false);

        // hidden visually only: keyboard users can still Tab to it, and focus shows it
        q('#before').focus();
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(toggle);
        expect(shown()).toBe(true);

        await userEvent.keyboard('{Enter}');
        await stable();
        expect(host.playing()).toBe(true);
        expect(toggle.getAttribute('aria-label')).toBe('Pause');
        expect(q('#labelled').getAttribute('aria-label')).toBe('Stop slides');

        // the slide band sits at the bottom
        expect(Math.round(rect(q('[fd-tile-slide-container]')).bottom)).toBe(Math.round(rect(tile).bottom) - 1);

        // page dots: one filled, the others outlined
        const dots = all('[fd-tile-dot]');
        expect(dots).toHaveLength(3);
        expect(Math.round(rect(dots[0]).width)).toBe(6);
        const transparent = 'rgba(0, 0, 0, 0)';
        expect(style(dots[1]).backgroundColor).not.toBe(transparent);
        expect(style(dots[0]).backgroundColor).toBe(transparent);
        expect(style(dots[0]).borderTopWidth).toBe('1px');
        host.current.set(2);
        await stable();
        expect(style(dots[2]).backgroundColor).not.toBe(transparent);
        expect(style(dots[1]).backgroundColor).toBe(transparent);
        expect(rect(dots[1]).left).toBeGreaterThan(rect(dots[0]).right);
    });

    it('badge position (top end) and inline in line tiles', async () => {
        const { q } = await render(BadgeHost);
        const tile = q('#tile');
        const badge = q('#tile [fd-tile-badge]');
        expect(style(badge).position).toBe('absolute');
        expect(rect(badge).top).toBeLessThan(rect(tile).top);
        // 0.5rem from the end of the padding box (inside the 1px border)
        expect(Math.round(rect(tile).right - rect(badge).right)).toBe(9);
        expect(Math.round(rect(badge).height)).toBe(16);

        const line = q('#line');
        const inline = q('#line [fd-tile-badge]');
        expect(style(inline).position).toBe('relative');
        expect(rect(inline).top).toBeGreaterThanOrEqual(rect(line).top);
        expect(rect(inline).right).toBeLessThanOrEqual(rect(q('#line [fd-tile-title]')).left);

        document.documentElement.setAttribute('dir', 'rtl');
        await new Promise((resolve) => requestAnimationFrame(resolve));
        expect(Math.round(rect(badge).left - rect(tile).left)).toBe(9);
        expect(rect(inline).left).toBeGreaterThanOrEqual(rect(q('#line [fd-tile-title]')).right);
    });

    it('numeric content sizes l/m/s, small-tile sizes, state colors, RTL value direction', async () => {
        const { host, q, stable } = await render(NumericHost);
        const content = q('[fd-numeric-content]');
        const kpi = q('[fd-numeric-content-kpi]');
        const sizes = () => [Math.round(rect(content).height), style(kpi).fontSize];

        expect(sizes()).toEqual([48, '36px']);
        host.size.set('m');
        await stable();
        expect(sizes()).toEqual([40, '32px']);
        host.size.set('s');
        await stable();
        expect(sizes()).toEqual([36, '28px']);
        host.tileSize.set('s');
        await stable();
        expect(sizes()).toEqual([38, '24px']);

        // state colors on the value and the scale
        const scale = q('[fd-numeric-content-scale]');
        expect(style(kpi).color).toBe(cssColor('--sapNeutralTextColor'));
        const states: [NumericContentState, string][] = [
            ['positive', '--sapPositiveTextColor'],
            ['negative', '--sapNegativeTextColor'],
            ['critical', '--sapCriticalTextColor'],
            ['informative', '--sapInformativeTextColor']
        ];
        for (const [state, variable] of states) {
            host.state.set(state);
            await stable();
            expect(style(kpi).color).toBe(cssColor(variable));
            expect(style(scale).color).toBe(cssColor(variable));
        }

        // the scale sits after the value
        expect(rect(q('[fd-numeric-content-scale-container]')).left).toBeGreaterThanOrEqual(
            rect(q('[fd-numeric-content-kpi-container]')).right
        );

        // RTL: the number keeps its LTR direction in small tiles
        document.documentElement.setAttribute('dir', 'rtl');
        await stable();
        expect(style(kpi).direction).toBe('ltr');
        expect(style(kpi).textAlign).toBe('right');
        expect(rect(q('[fd-numeric-content-scale-container]')).right).toBeLessThanOrEqual(
            rect(q('[fd-numeric-content-kpi-container]')).left
        );
    });

    it('scale arrow is decorative unless it has a label', async () => {
        const { host, q, stable } = await render(NumericHost);
        const arrow = q('[fd-numeric-content-scale-arrow]');
        expect(arrow.getAttribute('aria-hidden')).toBe('true');
        expect(arrow.hasAttribute('role')).toBe(false);
        expect(arrow.getAttribute('data-glyph')).toBeTruthy();
        host.arrowLabel.set('Up');
        await stable();
        expect(arrow.getAttribute('role')).toBe('img');
        expect(arrow.getAttribute('aria-label')).toBe('Up');
        expect(arrow.hasAttribute('aria-hidden')).toBe(false);
    });
});
