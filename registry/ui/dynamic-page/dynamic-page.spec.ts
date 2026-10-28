import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Breadcrumb, BreadcrumbItem } from '@/ui/breadcrumb/breadcrumb';
import { Button } from '@/ui/button/button';
import { MessageStrip } from '@/ui/message-strip/message-strip';
import { TabList, TabPanel } from '@/ui/tabs/tabs';
import { Toolbar, ToolbarItem } from '@/ui/toolbar/toolbar';
import {
    DynamicPage,
    DynamicPageBreadcrumb,
    DynamicPageContent,
    DynamicPageFooter,
    DynamicPageGlobalActions,
    DynamicPageHeader,
    DynamicPageHeaderSubtitle,
    DynamicPageHeaderTitle,
    DynamicPageLayoutActions,
    DynamicPageSubheader,
    type DynamicPageResponsiveSize
} from './dynamic-page';

const TEXT = 'Lorem ipsum dolor sit amet. '.repeat(200);

@Component({
    imports: [
        DynamicPage,
        DynamicPageHeader,
        DynamicPageSubheader,
        DynamicPageContent,
        DynamicPageFooter,
        DynamicPageBreadcrumb,
        Breadcrumb,
        BreadcrumbItem,
        TabList,
        TabPanel
    ],
    template: `
        <div style="height: 30rem; width: 60rem">
            <fd-dynamic-page ariaLabel="Page" [expandContent]="false" [disableSnapOnScroll]="noSnap()">
                <fd-dynamic-page-header title="Product">
                    <fd-dynamic-page-breadcrumb>
                        @if (breadcrumb()) {
                            <fd-breadcrumb>
                                <fd-breadcrumb-item><a href="#">Home</a></fd-breadcrumb-item>
                                <fd-breadcrumb-item><span aria-current="page">Product</span></fd-breadcrumb-item>
                            </fd-breadcrumb>
                        } @else {
                            <a href="#">Home</a>
                        }
                    </fd-dynamic-page-breadcrumb>
                </fd-dynamic-page-header>
                <fd-dynamic-page-subheader pinnable>Facets</fd-dynamic-page-subheader>
                @if (tabs()) {
                    <fd-tab-list ariaLabel="Sections" [stackContent]="stacked()">
                        <fd-tab title="One">
                            <fd-dynamic-page-content>{{ text }}</fd-dynamic-page-content>
                        </fd-tab>
                        <fd-tab title="Two">
                            <fd-dynamic-page-content>{{ text }}</fd-dynamic-page-content>
                        </fd-tab>
                    </fd-tab-list>
                } @else {
                    <fd-dynamic-page-content>{{ text }}</fd-dynamic-page-content>
                }
                <fd-dynamic-page-footer>Footer</fd-dynamic-page-footer>
            </fd-dynamic-page>
        </div>
    `
})
class Host {
    readonly text = TEXT;
    readonly tabs = signal(false);
    readonly stacked = signal(false);
    readonly breadcrumb = signal(true);
    readonly noSnap = signal(false);
}

@Component({
    imports: [
        DynamicPage,
        DynamicPageHeader,
        DynamicPageGlobalActions,
        DynamicPageContent,
        Toolbar,
        ToolbarItem,
        Button
    ],
    template: `
        <div style="height: 20rem" [style.width.px]="width()">
            <fd-dynamic-page ariaLabel="Page" [expandContent]="false">
                <fd-dynamic-page-header title="Product">
                    <fd-dynamic-page-global-actions>
                        <fd-toolbar fdType="transparent" clearBorder>
                            <button
                                fdToolbarItem
                                fdButton
                                variant="positive"
                                label="Accept"
                                data-label="Accept"
                            ></button>
                            <button
                                fdToolbarItem
                                fdButton
                                variant="negative"
                                label="Reject"
                                data-label="Reject"
                            ></button>
                        </fd-toolbar>
                    </fd-dynamic-page-global-actions>
                </fd-dynamic-page-header>
                <fd-dynamic-page-content>Content</fd-dynamic-page-content>
            </fd-dynamic-page>
        </div>
    `
})
class OverflowHost {
    readonly width = signal(1000);
}

@Component({
    imports: [
        DynamicPage,
        DynamicPageHeader,
        DynamicPageHeaderTitle,
        DynamicPageHeaderSubtitle,
        DynamicPageBreadcrumb,
        DynamicPageGlobalActions,
        DynamicPageLayoutActions,
        DynamicPageSubheader,
        DynamicPageContent,
        Button,
        MessageStrip
    ],
    template: `
        <div style="height: 30rem" [style.width.px]="width()">
            <fd-dynamic-page
                ariaLabel="Page"
                [expandContent]="expand()"
                [offset]="offset()"
                [autoResponsive]="autoResponsive()"
                [size]="size()"
            >
                <fd-dynamic-page-header
                    [title]="title()"
                    [subtitle]="subtitle()"
                    [titleWrap]="wrap()"
                    [subtitleWrap]="wrap()"
                    [titleId]="titleId()"
                    [headingLevel]="headingLevel()"
                    [subtitleHeadingLevel]="subtitleHeadingLevel()"
                >
                    @if (custom()) {
                        <ng-template fdDynamicPageHeaderTitle let-collapsed>
                            <span data-testid="custom-title">{{
                                collapsed ? 'Title collapsed' : 'Title expanded'
                            }}</span>
                        </ng-template>
                        <ng-template fdDynamicPageHeaderSubtitle let-collapsed>
                            <span data-testid="custom-subtitle">{{
                                collapsed ? 'Subtitle collapsed' : 'Subtitle expanded'
                            }}</span>
                        </ng-template>
                    }
                    <fd-dynamic-page-breadcrumb><a href="#">Home</a></fd-dynamic-page-breadcrumb>
                    <fd-dynamic-page-global-actions>
                        <button fdButton label="Accept"></button>
                    </fd-dynamic-page-global-actions>
                    <fd-dynamic-page-layout-actions>
                        <button fdButton glyph="decline" ariaLabel="Close"></button>
                    </fd-dynamic-page-layout-actions>
                    <fd-message-strip type="warning" [dismissible]="false">Not confirmed yet.</fd-message-strip>
                </fd-dynamic-page-header>
                <fd-dynamic-page-subheader pinnable [(collapsed)]="collapsed">Facets</fd-dynamic-page-subheader>
                <fd-dynamic-page-content>Content</fd-dynamic-page-content>
            </fd-dynamic-page>
        </div>
    `
})
class HeaderHost {
    readonly width = signal(1400);
    readonly expand = signal(false);
    readonly offset = signal(0);
    readonly autoResponsive = signal(true);
    readonly size = signal<DynamicPageResponsiveSize>('extra-large');
    readonly title = signal('Product title');
    readonly subtitle = signal('Product subtitle');
    readonly wrap = signal(false);
    readonly titleId = signal('product-title');
    readonly headingLevel = signal<number | string>(2);
    readonly subtitleHeadingLevel = signal<number | undefined>(undefined);
    readonly custom = signal(false);
    readonly collapsed = signal(false);
}

async function setupHeader(config: Partial<{ width: number; custom: boolean; expand: boolean }> = {}) {
    const fixture = TestBed.createComponent(HeaderHost);
    const host = fixture.componentInstance;
    if (config.width) host.width.set(config.width);
    host.custom.set(!!config.custom);
    host.expand.set(!!config.expand);
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await frame();
        await fixture.whenStable();
    };
    await stable();
    const root = fixture.nativeElement as HTMLElement;
    const page = fixture.debugElement.query((d) => d.componentInstance instanceof DynamicPage)
        .componentInstance as DynamicPage;
    const header = root.querySelector<HTMLElement>('fd-dynamic-page-header')!;
    const heading = () => header.querySelector<HTMLElement>('[role=heading]')!;
    /** The subtitle: below the title area when expanded, inside it when collapsed. */
    const subtitle = () =>
        [...header.querySelectorAll<HTMLElement>('span')].find((el) => el.textContent!.includes('ubtitle'))!;
    const toggle = root.querySelector<HTMLElement>('span[role=button][aria-expanded]')!;
    return { fixture, host, root, stable, page, header, heading, subtitle, toggle };
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function setup(config: { tabs?: boolean; stacked?: boolean; breadcrumb?: boolean; noSnap?: boolean } = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    host.tabs.set(!!config.tabs);
    host.stacked.set(!!config.stacked);
    host.breadcrumb.set(config.breadcrumb ?? true);
    host.noSnap.set(!!config.noSnap);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const page = fixture.debugElement.children[0].children[0].componentInstance as DynamicPage;
    const toggle = root.querySelector<HTMLElement>('span[role=button][aria-expanded]')!;
    const subheader = root.querySelector<HTMLElement>('fd-dynamic-page-subheader section')!;
    return { fixture, host, root, page, toggle, subheader };
}

async function scroll(fixture: { whenStable(): Promise<unknown> }, element: HTMLElement, top: number) {
    element.scrollTop = top;
    element.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
}

describe('DynamicPage', () => {
    it('moves the global actions of a toolbar into its overflow when the page is small', async () => {
        const fixture = TestBed.createComponent(OverflowHost);
        document.body.appendChild(fixture.nativeElement);
        const stable = async () => {
            await fixture.whenStable();
            await frame();
            await frame();
            await fixture.whenStable();
        };
        await stable();
        const root = fixture.nativeElement as HTMLElement;
        const toolbar = root.querySelector<HTMLElement>('fd-toolbar')!;
        const more = () => toolbar.querySelector('button[aria-label="More"]');
        const inline = () => [...toolbar.querySelectorAll(':scope > button')].map((b) => b.getAttribute('data-label'));
        expect(inline()).toEqual(['Accept', 'Reject']);
        expect(more()).toBeNull();

        fixture.componentInstance.width.set(500);
        await stable();
        expect(inline()).toEqual([]);
        expect(more()).not.toBeNull();

        fixture.componentInstance.width.set(1000);
        await stable();
        expect(inline()).toEqual(['Accept', 'Reject']);
        expect(more()).toBeNull();
    });

    it('toggles the header by clicking the title area but not its links', async () => {
        const { fixture, root, toggle, subheader } = await setup({ breadcrumb: false });
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        await userEvent.click(root.querySelector('[role=heading]')!);
        await fixture.whenStable();
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        expect(subheader.hidden).toBe(true);
        root.querySelector('fd-dynamic-page-breadcrumb a')!.addEventListener('click', (e) => e.preventDefault());
        await userEvent.click(root.querySelector('fd-dynamic-page-breadcrumb a')!);
        await fixture.whenStable();
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('toggles the header with Enter and Space on the header button', async () => {
        const { fixture, toggle } = await setup();
        toggle.focus();
        await userEvent.keyboard('{Enter}');
        await fixture.whenStable();
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        await userEvent.keyboard(' ');
        await fixture.whenStable();
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });

    it('collapses the header while the content scrolls, unless pinned', async () => {
        const { fixture, root, page, toggle } = await setup();
        const content = root.querySelector<HTMLElement>('fd-dynamic-page-content')!;
        expect(page.scrollElement()).toBe(content);
        expect(content.tabIndex).toBe(0);
        await scroll(fixture, content, 200);
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        await scroll(fixture, content, 0);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        await userEvent.click(root.querySelector('button[aria-label="Pin Header"]')!);
        await scroll(fixture, content, 200);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });

    it('keeps the header expanded with disableSnapOnScroll', async () => {
        const { fixture, root, toggle } = await setup({ noSnap: true });
        await scroll(fixture, root.querySelector<HTMLElement>('fd-dynamic-page-content')!, 200);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });

    it('scrolls the content of tabs in the tab list and collapses the header from it', async () => {
        const { fixture, root, page, toggle } = await setup({ tabs: true });
        const list = fixture.debugElement.query((d) => d.componentInstance instanceof TabList)
            .componentInstance as TabList;
        const area = list.scrollElement();
        expect(page.scrollElement()).toBe(area);
        expect(page.hasTabs()).toBe(true);
        const content = root.querySelector<HTMLElement>('fd-dynamic-page-content')!;
        expect(content.hasAttribute('tabindex')).toBe(false);
        expect(area.scrollHeight).toBeGreaterThan(area.clientHeight);
        await scroll(fixture, area, 200);
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        await scroll(fixture, area, 0);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });

    it('leaves room for the footer below each content, or only the last with stacked tabs', async () => {
        const spacers = (root: HTMLElement) =>
            [...root.querySelectorAll('fd-dynamic-page-content')].map(
                (c) => !!c.querySelector(':scope > [aria-hidden=true]')
            );
        const single = await setup();
        expect(spacers(single.root)).toEqual([true]);
        single.fixture.destroy();
        const stacked = await setup({ tabs: true, stacked: true });
        expect(spacers(stacked.root)).toEqual([false, true]);
    });

    it('does not nest a navigation landmark around an fd-breadcrumb', async () => {
        const withBreadcrumb = await setup();
        expect(withBreadcrumb.root.querySelectorAll('[role=navigation], nav').length).toBe(1);
        expect(withBreadcrumb.root.querySelector('fd-breadcrumb')!.getAttribute('role')).toBe('navigation');
        withBreadcrumb.fixture.destroy();
        const plain = await setup({ breadcrumb: false });
        const nav = plain.root.querySelector('[role=navigation]')!;
        expect(nav.getAttribute('aria-label')).toBe('Breadcrumbs');
        expect(nav.querySelector('a')).not.toBeNull();
    });

    describe('header', () => {
        it('global and layout actions are labelled toolbars', async () => {
            const { root } = await setupHeader();
            const global = root.querySelector('fd-dynamic-page-global-actions')!;
            const layout = root.querySelector('fd-dynamic-page-layout-actions')!;
            expect(global.getAttribute('role')).toBe('toolbar');
            expect(global.getAttribute('aria-label')).toBe('Global actions');
            expect(layout.getAttribute('role')).toBe('toolbar');
            expect(layout.getAttribute('aria-label')).toBe('Layout actions');
            const subheader = root.querySelector('fd-dynamic-page-subheader [role=toolbar]')!;
            expect(subheader.getAttribute('aria-label')).toBe('Header actions');
        });

        it('renders title and subtitle, and moves the subtitle into the title area when collapsed', async () => {
            const { fixture, host, header, heading, subtitle, toggle } = await setupHeader();
            expect(heading().textContent!.trim()).toBe('Product title');
            expect(subtitle().textContent!.trim()).toBe('Product subtitle');
            // expanded: the subtitle is a row of its own below the title area
            expect(subtitle().parentElement).toBe(header);

            toggle.click();
            await fixture.whenStable();
            expect(subtitle().parentElement).not.toBe(header);
            expect(subtitle().parentElement!.contains(heading())).toBe(true);

            host.title.set('Renamed');
            await fixture.whenStable();
            expect(heading().textContent!.trim()).toBe('Renamed');
        });

        it('truncates the title and subtitle unless titleWrap/subtitleWrap are set', async () => {
            const { fixture, host, heading, subtitle } = await setupHeader();
            expect(getComputedStyle(heading()).whiteSpace).toBe('nowrap');
            expect(getComputedStyle(heading()).textOverflow).toBe('ellipsis');
            expect(getComputedStyle(subtitle()).whiteSpace).toBe('nowrap');

            host.wrap.set(true);
            await fixture.whenStable();
            expect(getComputedStyle(heading()).whiteSpace).toBe('normal');
            expect(getComputedStyle(subtitle()).whiteSpace).toBe('normal');
        });

        it('uses titleId for the heading and sets aria-level from headingLevel', async () => {
            const { fixture, host, heading, toggle } = await setupHeader();
            expect(heading().id).toBe('product-title');
            expect(heading().getAttribute('aria-level')).toBe('2');
            // the header toggle is described by the title
            expect(toggle.getAttribute('aria-describedby')).toBe('product-title');

            host.titleId.set('custom-id');
            host.headingLevel.set('h3');
            await fixture.whenStable();
            expect(heading().id).toBe('custom-id');
            expect(heading().getAttribute('aria-level')).toBe('3');
            expect(toggle.getAttribute('aria-describedby')).toBe('custom-id');
        });

        it('gives the subtitle a heading role only with subtitleHeadingLevel', async () => {
            const { fixture, host, subtitle } = await setupHeader();
            expect(subtitle().hasAttribute('role')).toBe(false);
            expect(subtitle().hasAttribute('aria-level')).toBe(false);

            host.subtitleHeadingLevel.set(3);
            await fixture.whenStable();
            expect(subtitle().getAttribute('role')).toBe('heading');
            expect(subtitle().getAttribute('aria-level')).toBe('3');
        });

        it('derives the size from the width and honours size when autoResponsive is false', async () => {
            const { host, stable, page, root } = await setupHeader({ width: 599 });
            const article = root.querySelector<HTMLElement>('article')!;
            const padding = () => getComputedStyle(article).getPropertyValue('--dp-px').trim();
            expect(page.size()).toBe('small');
            expect(padding()).toBe('1rem');
            for (const [width, size] of [
                [600, 'medium'],
                [1023, 'medium'],
                [1024, 'large'],
                [1439, 'large'],
                [1440, 'extra-large']
            ] as const) {
                host.width.set(width);
                await stable();
                expect(page.size()).toBe(size);
            }
            expect(padding()).toBe('3rem');

            host.autoResponsive.set(false);
            host.size.set('small');
            await stable();
            expect(page.size()).toBe('small');
            expect(padding()).toBe('1rem');
        });

        it('moves the layout actions into the breadcrumb row below 1280px', async () => {
            const { host, stable, root, heading } = await setupHeader({ width: 1300 });
            const layout = () => root.querySelector<HTMLElement>('fd-dynamic-page-layout-actions')!;
            const breadcrumb = root.querySelector<HTMLElement>('fd-dynamic-page-breadcrumb')!;
            const centre = (el: HTMLElement) => {
                const rect = el.getBoundingClientRect();
                return rect.top + rect.height / 2;
            };
            // wide: in the title row, next to the global actions
            expect(Math.abs(centre(layout()) - centre(heading()))).toBeLessThan(
                Math.abs(centre(layout()) - centre(breadcrumb))
            );

            host.width.set(1279);
            await stable();
            expect(Math.abs(centre(layout()) - centre(breadcrumb))).toBeLessThan(
                Math.abs(centre(layout()) - centre(heading()))
            );
            expect(layout().getBoundingClientRect().bottom).toBeLessThanOrEqual(heading().getBoundingClientRect().top);
        });

        it('passes the collapsed state to custom title and subtitle templates', async () => {
            const { fixture, root, toggle } = await setupHeader({ custom: true });
            const text = (id: string) => root.querySelector(`[data-testid="${id}"]`)!.textContent!.trim();
            expect(text('custom-title')).toBe('Title expanded');
            expect(text('custom-subtitle')).toBe('Subtitle expanded');
            toggle.click();
            await fixture.whenStable();
            expect(text('custom-title')).toBe('Title collapsed');
            expect(text('custom-subtitle')).toBe('Subtitle collapsed');
        });

        it('renders a message strip in the header; clicking it does not toggle the header', async () => {
            const { fixture, header, toggle } = await setupHeader();
            const strip = header.querySelector<HTMLElement>('fd-message-strip')!;
            expect(strip).not.toBeNull();
            expect(strip.getBoundingClientRect().top).toBeGreaterThan(
                header.querySelector('[role=heading]')!.getBoundingClientRect().bottom
            );
            await userEvent.click(strip);
            await fixture.whenStable();
            expect(toggle.getAttribute('aria-expanded')).toBe('true');
        });

        it('pin button toggles its pressed state and label', async () => {
            const { fixture, root } = await setupHeader();
            const pin = () =>
                root.querySelector<HTMLButtonElement>(
                    'button[aria-label="Pin Header"], button[aria-label="Unpin Header"]'
                )!;
            expect(pin().getAttribute('aria-label')).toBe('Pin Header');
            expect(pin().title).toBe('Pin Header');
            expect(pin().getAttribute('aria-pressed')).toBeNull();

            await userEvent.click(pin());
            await fixture.whenStable();
            expect(pin().getAttribute('aria-label')).toBe('Unpin Header');
            expect(pin().title).toBe('Unpin Header');
            expect(pin().getAttribute('aria-pressed')).toBe('true');

            await userEvent.click(pin());
            await fixture.whenStable();
            expect(pin().getAttribute('aria-label')).toBe('Pin Header');
            expect(pin().getAttribute('aria-pressed')).toBeNull();
        });

        it('collapse button switches between Collapse and Expand Header and updates collapsed', async () => {
            const { fixture, host, root, toggle } = await setupHeader();
            const button = () =>
                root.querySelector<HTMLButtonElement>('fd-dynamic-page-subheader button[aria-expanded]')!;
            expect(button().getAttribute('aria-label')).toBe('Collapse Header');
            expect(button().getAttribute('aria-expanded')).toBe('true');

            await userEvent.click(button());
            await fixture.whenStable();
            expect(host.collapsed()).toBe(true);
            expect(button().getAttribute('aria-label')).toBe('Expand Header');
            expect(button().title).toBe('Expand Header');
            expect(button().getAttribute('aria-expanded')).toBe('false');
            expect(toggle.getAttribute('aria-expanded')).toBe('false');
            // the pin button is hidden while collapsed
            expect(root.querySelector('button[aria-label="Pin Header"]')).toBeNull();

            // collapsing from the title area updates the model too
            toggle.click();
            await fixture.whenStable();
            expect(host.collapsed()).toBe(false);
            expect(button().getAttribute('aria-label')).toBe('Collapse Header');

            // and the model drives the page
            host.collapsed.set(true);
            await fixture.whenStable();
            expect(toggle.getAttribute('aria-expanded')).toBe('false');
        });

        it('fills the viewport below its top, minus offset', async () => {
            const { host, stable, root } = await setupHeader({ expand: true });
            const article = root.querySelector<HTMLElement>('article')!;
            const expected = (offset: number) => window.innerHeight - article.getBoundingClientRect().top - offset;
            expect(article.getBoundingClientRect().height).toBeCloseTo(expected(0), 0);

            host.offset.set(50);
            await stable();
            // the offset applies on the next measure
            host.width.set(1300);
            await stable();
            expect(article.getBoundingClientRect().height).toBeCloseTo(expected(50), 0);
        });
    });
});
