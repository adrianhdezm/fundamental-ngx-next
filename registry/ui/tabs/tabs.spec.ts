import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { TabItem, TabLink, TabList, TabNav, TabPanel } from './tabs';

@Component({
    imports: [TabList, TabPanel, TabNav, TabItem, TabLink],
    template: `
        <div style="width: 800px">
            <fd-tab-list
                ariaLabel="Tabs"
                [collapsibleTabs]="collapsible()"
                [maxVisibleTabs]="maxVisible()"
                (selectedTabIndexChange)="index.set($event)"
            >
                <fd-tab id="t1" title="One">Content one</fd-tab>
                <fd-tab id="t2" title="Two" count="5">Content two</fd-tab>
                <fd-tab id="t3" title="Three" disabled>Content three</fd-tab>
                <fd-tab id="t4" title="Four" tabState="error">Content four</fd-tab>
            </fd-tab-list>
            <nav fd-tab-nav aria-label="Pages">
                <div fd-tab-item><a fd-tab-link href="#" [active]="page() === 'a'">A</a></div>
                <div fd-tab-item><a fd-tab-link href="#" [active]="page() === 'b'">B</a></div>
            </nav>
        </div>
    `
})
class Host {
    readonly collapsible = signal(false);
    readonly maxVisible = signal(Number.POSITIVE_INFINITY);
    readonly index = signal(-1);
    readonly page = signal('b');
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const tabs = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('fd-tab-list [role=tab]')];
const panel = (root: HTMLElement) => root.querySelector<HTMLElement>('[role=tabpanel]:not(.hidden)');

async function setup(config: { collapsible?: boolean; maxVisible?: number } = {}) {
    const fixture = TestBed.createComponent(Host);
    if (config.collapsible) fixture.componentInstance.collapsible.set(true);
    if (config.maxVisible) fixture.componentInstance.maxVisible.set(config.maxVisible);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    await fixture.whenStable();
    return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
}

describe('TabList', () => {
    it('links tabs and panels and selects the first tab', async () => {
        const { root } = await setup();
        expect(root.querySelector('[role=tablist]')?.getAttribute('aria-label')).toBe('Tabs');
        const [one] = tabs(root);
        expect(one.getAttribute('aria-selected')).toBe('true');
        expect(one.getAttribute('aria-controls')).toBe('t1-panel');
        expect(panel(root)?.id).toBe('t1-panel');
        expect(panel(root)?.getAttribute('aria-labelledby')).toBe('t1');
        expect(panel(root)?.textContent?.trim()).toBe('Content one');
    });

    it('selects tabs by click and skips disabled ones', async () => {
        const { fixture, host, root } = await setup();
        await userEvent.click(tabs(root)[1]);
        await fixture.whenStable();
        expect(panel(root)?.textContent?.trim()).toBe('Content two');
        expect(host.index()).toBe(1);
        await userEvent.click(tabs(root)[2], { force: true });
        await fixture.whenStable();
        expect(panel(root)?.textContent?.trim()).toBe('Content two');
    });

    it('moves between tabs with the arrow keys as one tab stop', async () => {
        const { fixture, root } = await setup();
        expect(root.querySelectorAll('fd-tab-list [role=tab][tabindex="0"]')).toHaveLength(1);
        tabs(root)[0].focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement?.id).toBe('t2');
        await userEvent.keyboard('{ArrowRight}');
        // the disabled tab is skipped
        expect(document.activeElement?.id).toBe('t4');
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement?.id).toBe('t1');
        await userEvent.keyboard('{End}{Enter}');
        await fixture.whenStable();
        expect(panel(root)?.textContent?.trim()).toBe('Content four');
        expect(root.querySelectorAll('fd-tab-list [role=tab][tabindex="0"]')).toHaveLength(1);
    });

    it('collapses the selected tab when collapsible', async () => {
        const { fixture, root } = await setup({ collapsible: true });
        await userEvent.click(tabs(root)[0]);
        await fixture.whenStable();
        expect(panel(root)).toBeNull();
        expect(tabs(root)[0].getAttribute('aria-selected')).toBe('false');
    });

    it('lists tabs that do not fit in a "More" menu', async () => {
        const { fixture, root } = await setup({ maxVisible: 2 });
        expect(tabs(root)).toHaveLength(2);
        const more = root.querySelector<HTMLButtonElement>('fd-tab-list button[aria-label=More]')!;
        await userEvent.click(more);
        await fixture.whenStable();
        const items = [...document.querySelectorAll<HTMLElement>('[role=menuitem]')];
        expect(items.map((i) => i.textContent?.trim())).toEqual(['Three', 'Four']);
        await userEvent.click(items[1]);
        await fixture.whenStable();
        await wait();
        expect(panel(root)?.textContent?.trim()).toBe('Content four');
        expect(tabs(root).some((t) => t.id === 't4')).toBe(true);
    });
});

describe('TabNav', () => {
    it('marks the active link and makes it the tab stop', async () => {
        const { root } = await setup();
        const links = [...root.querySelectorAll<HTMLElement>('nav [role=tab]')];
        expect(root.querySelector('nav')?.getAttribute('role')).toBe('tablist');
        expect(links[1].getAttribute('aria-selected')).toBe('true');
        expect(links[1].getAttribute('tabindex')).toBe('0');
        expect(links[0].getAttribute('tabindex')).toBe('-1');
        links[1].focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(links[0]);
    });
});
