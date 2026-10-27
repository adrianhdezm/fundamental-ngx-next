import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Breadcrumb, BreadcrumbItem } from '@/ui/breadcrumb/breadcrumb';
import { TabList, TabPanel } from '@/ui/tabs/tabs';
import {
    DynamicPage,
    DynamicPageBreadcrumb,
    DynamicPageContent,
    DynamicPageFooter,
    DynamicPageHeader,
    DynamicPageSubheader
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
});
