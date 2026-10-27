import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { TabItem, TabLink, TabList, TabNav, TabPanel, type TabModes } from './tabs';

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

@Component({
    imports: [TabList, TabPanel],
    template: `
        <fd-tab-list ariaLabel="Default tab" [defaultTab]="defaultTab()">
            @for (id of ['a', 'b', 'c']; track id) {
                <fd-tab [id]="id" [title]="'Tab ' + id">Content {{ id }}</fd-tab>
            }
        </fd-tab-list>
    `
})
class DefaultHost {
    readonly defaultTab = signal('b');
}

describe('TabList defaultTab', () => {
    it('selects the default tab first, also when the tab ids are bound', async () => {
        const fixture = TestBed.createComponent(DefaultHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        await wait();
        const root = fixture.nativeElement as HTMLElement;
        const selected = () => root.querySelector('[role=tab][aria-selected=true]')?.id;
        expect(selected()).toBe('b');
        expect(panel(root)?.textContent?.trim()).toBe('Content b');
        // until a tab is chosen, the selection follows the default
        fixture.componentInstance.defaultTab.set('c');
        await fixture.whenStable();
        expect(selected()).toBe('c');
        await userEvent.click(tabs(root)[0]);
        await fixture.whenStable();
        fixture.componentInstance.defaultTab.set('b');
        await fixture.whenStable();
        expect(selected()).toBe('a');
    });
});

@Component({
    imports: [TabList, TabPanel],
    template: `
        <div style="width: 800px">
            <fd-tab-list
                ariaLabel="Dynamic tabs"
                [mode]="mode()"
                [defaultTab]="defaultTab()"
                [selectDefaultOnTabsChange]="selectDefault()"
                (selectedTabChange)="changes.push($event.id())"
            >
                @for (id of ids(); track id) {
                    <fd-tab [id]="id" [title]="'Tab ' + id" glyph="cart">Content {{ id }}</fd-tab>
                }
            </fd-tab-list>
        </div>
    `
})
class DynamicHost {
    readonly list = viewChild.required(TabList);
    readonly ids = signal(['a', 'b', 'c']);
    readonly mode = signal<TabModes | null>(null);
    readonly defaultTab = signal<string | null>(null);
    readonly selectDefault = signal(false);
    readonly changes: string[] = [];
}

@Component({
    imports: [TabList, TabPanel],
    template: `
        <div style="width: 800px; height: 240px">
            <fd-tab-list ariaLabel="Stacked" stackContent [focusFirstFocusableElement]="focusFirst()">
                @for (id of ['s1', 's2', 's3', 's4']; track id) {
                    <fd-tab [id]="id" [title]="'Section ' + id">
                        <div style="height: 300px">
                            <button type="button" [id]="id + '-button'">Edit {{ id }}</button>
                        </div>
                    </fd-tab>
                }
            </fd-tab-list>
        </div>
    `
})
class StackHost {
    readonly focusFirst = signal(true);
}

@Component({
    imports: [TabNav, TabItem, TabLink],
    template: `
        <nav fd-tab-nav aria-label="Pages">
            @for (link of links(); track link.id) {
                <div fd-tab-item>
                    <a fd-tab-link href="#" [id]="link.id" [active]="link.active">{{ link.id }}</a>
                </div>
            }
        </nav>
    `
})
class NavHost {
    readonly links = signal([
        { id: 'a', active: false },
        { id: 'b', active: false }
    ]);
}

async function render<T>(type: new () => T) {
    const fixture = TestBed.createComponent(type);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    await fixture.whenStable();
    const stable = async () => {
        await fixture.whenStable();
        await wait();
        await fixture.whenStable();
    };
    return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement, stable };
}

const selectedId = (root: HTMLElement) => root.querySelector('fd-tab-list [role=tab][aria-selected=true]')?.id;

describe('TabList with changing tabs', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('data-density');
        document.querySelector('.cdk-overlay-container')?.replaceChildren();
    });

    it('selectTab() selects a tab by id and emits selectedTabChange', async () => {
        const { host, root, stable } = await render(DynamicHost);
        host.changes.length = 0;
        host.list().selectTab('c');
        await stable();
        expect(selectedId(root)).toBe('c');
        expect(panel(root)?.textContent?.trim()).toBe('Content c');
        expect(host.changes).toEqual(['c']);
        // the panel id works too; an unknown id changes nothing
        host.list().selectTab('b-panel');
        host.list().selectTab('nope');
        await stable();
        expect(selectedId(root)).toBe('b');
        expect(host.changes).toEqual(['c', 'b']);
    });

    it('adding and removing tabs keeps the selected tab selected', async () => {
        const { host, root, stable } = await render(DynamicHost);
        await userEvent.click(tabs(root)[1]);
        await stable();
        expect(selectedId(root)).toBe('b');
        host.ids.set(['a', 'b', 'c', 'd']);
        await stable();
        expect(tabs(root).map((t) => t.id)).toEqual(['a', 'b', 'c', 'd']);
        expect(selectedId(root)).toBe('b');
        host.ids.set(['b', 'c', 'd']);
        await stable();
        expect(selectedId(root)).toBe('b');
        // removing the selected tab selects the first one
        host.ids.set(['c', 'd']);
        await stable();
        expect(selectedId(root)).toBe('c');
        expect(panel(root)?.textContent?.trim()).toBe('Content c');
    });

    it('selectDefaultOnTabsChange selects the default tab again when the tabs change', async () => {
        const { host, root, stable } = await render(DynamicHost);
        host.selectDefault.set(true);
        host.defaultTab.set('a');
        await userEvent.click(tabs(root)[2]);
        await stable();
        expect(selectedId(root)).toBe('c');
        host.ids.set(['a', 'b', 'c', 'd']);
        await stable();
        expect(selectedId(root)).toBe('a');
        // without a default among the tabs, the first one
        await userEvent.click(tabs(root)[2]);
        host.ids.set(['b', 'c', 'd']);
        await stable();
        expect(selectedId(root)).toBe('b');
    });

    it('compact density makes the tabs smaller', async () => {
        const { host, root, stable } = await render(DynamicHost);
        host.mode.set('icon-only');
        await stable();
        const icon = () => root.querySelector<HTMLElement>('[fd-tab-icon]')!.getBoundingClientRect().height;
        expect(icon()).toBe(42);
        document.documentElement.setAttribute('data-density', 'compact');
        expect(icon()).toBe(30);
        host.mode.set('filter');
        await stable();
        expect(tabs(root)[0].getBoundingClientRect().height).toBe(76);
        document.documentElement.removeAttribute('data-density');
        expect(tabs(root)[0].getBoundingClientRect().height).toBe(88);
    });

    it('Home moves to the first enabled tab', async () => {
        const { root } = await setup();
        tabs(root)[3].focus();
        await userEvent.keyboard('{Home}');
        expect(document.activeElement?.id).toBe('t1');
        await userEvent.keyboard('{End}');
        expect(document.activeElement?.id).toBe('t4');
    });

    it('the More menu opens with the keyboard and returns the focus to the More button on Escape', async () => {
        const { fixture } = await setup({ maxVisible: 2 });
        const more = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
            'fd-tab-list button[aria-label=More]'
        )!;
        more.focus();
        await userEvent.keyboard('{Enter}');
        await fixture.whenStable();
        await wait();
        expect(more.getAttribute('aria-expanded')).toBe('true');
        expect(document.querySelectorAll('.cdk-overlay-container [role=menuitem]')).toHaveLength(2);
        await userEvent.keyboard('{Escape}');
        await fixture.whenStable();
        await wait();
        expect(more.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(more);
    });
});

describe('TabList with stacked content', () => {
    it('shows every panel and marks the tab of the panel in view', async () => {
        const { root, stable } = await render(StackHost);
        const panels = [...root.querySelectorAll<HTMLElement>('[role=tabpanel]')];
        expect(panels).toHaveLength(4);
        expect(panels.every((p) => !p.classList.contains('hidden') && p.textContent!.includes('Edit'))).toBe(true);
        expect(selectedId(root)).toBe('s1');
        const container = root.querySelector<HTMLElement>('[role=region]')!;
        container.scrollTop = panels[2].offsetTop;
        await expect.poll(() => selectedId(root)).toBe('s3');
        await stable();
        expect(tabs(root)[2].getAttribute('tabindex')).toBe('0');
    });

    it('selecting a stacked tab scrolls to its panel and focuses its first focusable element', async () => {
        const { host, root, stable } = await render(StackHost);
        await userEvent.click(tabs(root)[1]);
        await stable();
        expect(selectedId(root)).toBe('s2');
        expect(document.activeElement?.id).toBe('s2-button');
        const container = root.querySelector<HTMLElement>('[role=region]')!;
        const panel2 = root.querySelectorAll<HTMLElement>('[role=tabpanel]')[1];
        await expect.poll(() => Math.round(container.scrollTop)).toBe(panel2.offsetTop);

        host.focusFirst.set(false);
        await stable();
        await userEvent.click(tabs(root)[3]);
        await stable();
        expect(selectedId(root)).toBe('s4');
        expect(document.activeElement).toBe(tabs(root)[3]);
    });
});

describe('TabNav with changing links', () => {
    it('updates the tab stop when links are added', async () => {
        const { host, root, stable } = await render(NavHost);
        const stops = () => [...root.querySelectorAll<HTMLElement>('nav [role=tab][tabindex="0"]')].map((l) => l.id);
        expect(stops()).toEqual(['a']);
        host.links.set([
            { id: 'z', active: false },
            { id: 'a', active: false },
            { id: 'b', active: false }
        ]);
        await stable();
        expect(stops()).toEqual(['z']);
        host.links.set([
            { id: 'z', active: false },
            { id: 'a', active: false },
            { id: 'b', active: false },
            { id: 'c', active: true }
        ]);
        await stable();
        expect(stops()).toEqual(['c']);
        root.querySelector<HTMLElement>('#c')!.focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement?.id).toBe('z');
    });
});
