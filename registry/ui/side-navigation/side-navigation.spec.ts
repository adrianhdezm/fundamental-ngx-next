import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    NestedItem,
    NestedLink,
    NestedList,
    NestedListContent,
    NestedListExpandIcon,
    NestedListHeader,
    NestedListIcon,
    NestedListPopover,
    NestedListTitle
} from '@/ui/nested-list/nested-list';
import { SideNavigation, SideNavigationMain, SideNavigationUtility, type SideNavigationModel } from './side-navigation';

@Component({
    imports: [
        SideNavigation,
        SideNavigationMain,
        SideNavigationUtility,
        NestedList,
        NestedItem,
        NestedLink,
        NestedListTitle,
        NestedListIcon,
        NestedListHeader,
        NestedListContent,
        NestedListExpandIcon,
        NestedListPopover
    ],
    template: `
        <fd-side-nav [condensed]="condensed()" [selectable]="selectable()">
            <div fd-side-nav-main>
                <ul fd-nested-list>
                    <li fd-nested-list-header>Overview</li>
                    <li fd-nested-list-item>
                        <a fd-nested-list-link [selected]="true" (click)="chosen.set('Home')">
                            <i fd-nested-list-icon glyph="home"></i><span fd-nested-list-title>Home</span>
                        </a>
                    </li>
                    <li fd-nested-list-item [(expanded)]="expanded">
                        @if (condensed()) {
                            <fd-nested-list-popover>
                                <div fd-nested-list-content>
                                    <a fd-nested-list-link><span fd-nested-list-title>Settings</span></a>
                                    <button fd-nested-list-expand-icon></button>
                                </div>
                                <ul fd-nested-list>
                                    <li fd-nested-list-item>
                                        <a fd-nested-list-link (click)="chosen.set('Profile')"
                                            ><span fd-nested-list-title>Profile</span></a
                                        >
                                    </li>
                                    <li fd-nested-list-item>
                                        <a fd-nested-list-link><span fd-nested-list-title>Security</span></a>
                                    </li>
                                </ul>
                            </fd-nested-list-popover>
                        } @else {
                            <div fd-nested-list-content>
                                <a fd-nested-list-link><span fd-nested-list-title>Settings</span></a>
                                <button fd-nested-list-expand-icon></button>
                            </div>
                            <ul fd-nested-list textOnly>
                                <li fd-nested-list-item>
                                    <a fd-nested-list-link (click)="chosen.set('Profile')"
                                        ><span fd-nested-list-title>Profile</span></a
                                    >
                                </li>
                                <li fd-nested-list-item>
                                    <a fd-nested-list-link><span fd-nested-list-title>Security</span></a>
                                </li>
                            </ul>
                        }
                    </li>
                </ul>
            </div>
            <div fd-side-nav-utility>
                <ul fd-nested-list>
                    <li fd-nested-list-item>
                        <a fd-nested-list-link><span fd-nested-list-title>Help</span></a>
                    </li>
                </ul>
            </div>
        </fd-side-nav>
    `
})
class Host {
    readonly condensed = signal(false);
    readonly selectable = signal(true);
    readonly expanded = signal(false);
    readonly chosen = signal('');
}

@Component({
    imports: [SideNavigation],
    template: `<fd-side-nav [sideNavigationConfiguration]="config" />`
})
class ModelHost {
    readonly chosen = signal('');
    readonly config: SideNavigationModel = {
        mainNavigation: {
            items: [
                { headerTitle: 'Header' },
                { link: { icon: 'home', title: 'Link 1', callback: () => this.chosen.set('Link 1') } },
                {
                    expanded: true,
                    link: { icon: 'activate', title: 'Link 2' },
                    list: {
                        textOnly: true,
                        items: [{ link: { title: 'Sublink', callback: () => this.chosen.set('Sublink') } }]
                    }
                }
            ]
        }
    };
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const row = (name: string) =>
    [...document.querySelectorAll<HTMLElement>('[role=treeitem]')].find(
        (el) => el.textContent?.trim() === name && el.offsetParent !== null
    )!;
const focused = () => document.activeElement?.textContent?.trim();

async function setup(options: { condensed?: boolean; selectable?: boolean } = {}) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.condensed.set(!!options.condensed);
    fixture.componentInstance.selectable.set(options.selectable ?? true);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
}

describe('SideNavigation', () => {
    it('renders trees of rows with levels, described by their group header', async () => {
        const { root } = await setup();
        const tree = root.querySelector('nav [role=tree]')!;
        expect(tree.getAttribute('aria-roledescription')).toBe('Navigation List Tree');
        const home = row('Home');
        expect(home.tagName).toBe('A');
        expect(home.getAttribute('aria-level')).toBe('1');
        expect(home.getAttribute('aria-describedby')).toBe(root.querySelector('[fd-nested-list-header]')!.id);
        const settings = row('Settings');
        expect(settings.hasAttribute('fd-nested-list-content')).toBe(true);
        expect(settings.getAttribute('aria-expanded')).toBe('false');
        expect(root.querySelector('[role=group]')!.getAttribute('aria-hidden')).toBe('true');
    });

    it('expands with the button and the arrow keys and moves across all visible rows', async () => {
        const { host, root } = await setup();
        await userEvent.click(root.querySelector<HTMLElement>('[fd-nested-list-expand-icon]')!);
        await wait();
        expect(host.expanded()).toBe(true);
        expect(row('Settings').getAttribute('aria-expanded')).toBe('true');
        row('Home').focus();
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        expect(focused()).toBe('Profile');
        expect(row('Profile').getAttribute('aria-level')).toBe('2');
        await userEvent.keyboard('{End}');
        expect(focused()).toBe('Help');
        await userEvent.keyboard('{Home}{ArrowDown}{ArrowLeft}');
        await wait();
        expect(host.expanded()).toBe(false);
        await userEvent.keyboard('{ArrowDown}');
        expect(focused()).toBe('Help');
        await userEvent.keyboard('{ArrowUp}{ArrowRight}');
        await wait();
        expect(host.expanded()).toBe(true);
    });

    it('selects the clicked row and highlights its parent', async () => {
        const { host } = await setup();
        host.expanded.set(true);
        await wait();
        expect(row('Home').getAttribute('aria-selected')).toBe('true');
        await userEvent.click(row('Profile'));
        await wait();
        expect(host.chosen()).toBe('Profile');
        expect(row('Profile').getAttribute('aria-selected')).toBe('true');
        expect(row('Settings').getAttribute('aria-selected')).toBe('true');
        expect(row('Home').getAttribute('aria-selected')).toBe('false');
    });

    it('keeps the selected inputs when items are not selectable', async () => {
        await setup({ selectable: false });
        await userEvent.click(row('Help'));
        await wait();
        expect(row('Home').getAttribute('aria-label')).toBe('Home, Selected');
        expect(row('Help').hasAttribute('aria-selected')).toBe(false);
    });

    it('opens child lists in popovers when condensed', async () => {
        const { host, root } = await setup({ condensed: true });
        expect(root.querySelector('nav')!.className).toContain('w-16');
        expect(root.querySelector<HTMLElement>('[fd-nested-list-header]')!.className).toBe('hidden');
        row('Settings').focus();
        await userEvent.keyboard('{ArrowRight}');
        await wait(150);
        expect(host.expanded()).toBe(true);
        expect(focused()).toBe('Profile');
        await userEvent.keyboard('{Enter}');
        expect(host.chosen()).toBe('Profile');
        await userEvent.keyboard('{ArrowLeft}');
        await wait();
        expect(host.expanded()).toBe(false);
        expect(focused()).toBe('Settings');
    });

    it('builds the navigation from data', async () => {
        const fixture = TestBed.createComponent(ModelHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        await wait();
        expect(document.querySelector('[fd-nested-list-header]')!.textContent!.trim()).toBe('Header');
        expect(row('Link 2').getAttribute('aria-expanded')).toBe('true');
        await userEvent.click(row('Sublink'));
        expect(fixture.componentInstance.chosen()).toBe('Sublink');
    });
});
