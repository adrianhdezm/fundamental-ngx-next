import { Component, inject, signal } from '@angular/core';
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
    NestedListState,
    NestedListTitle
} from './nested-list';

const NESTED = [
    NestedList,
    NestedItem,
    NestedLink,
    NestedListTitle,
    NestedListIcon,
    NestedListHeader,
    NestedListContent,
    NestedListExpandIcon
];

/** A nested list on its own, outside a side navigation. */
@Component({
    imports: [...NESTED],
    template: `
        <ul fd-nested-list>
            <li fd-nested-list-header>Overview</li>
            <li fd-nested-list-item>
                <a fd-nested-list-link [selected]="homeSelected()">
                    <i fd-nested-list-icon glyph="home"></i><span fd-nested-list-title>Home</span>
                </a>
            </li>
            <li fd-nested-list-item [(expanded)]="expanded">
                <div fd-nested-list-content [selected]="settingsSelected()">
                    <a fd-nested-list-link><span fd-nested-list-title>Settings</span></a>
                    <button fd-nested-list-expand-icon></button>
                </div>
                <ul fd-nested-list textOnly>
                    <li fd-nested-list-item>
                        <a fd-nested-list-link><span fd-nested-list-title>Profile</span></a>
                    </li>
                    <li fd-nested-list-item>
                        <a fd-nested-list-link><span fd-nested-list-title>Security</span></a>
                    </li>
                </ul>
            </li>
            <li fd-nested-list-item>
                <a fd-nested-list-link><span fd-nested-list-title>Help</span></a>
            </li>
        </ul>
    `
})
class Host {
    readonly expanded = signal(false);
    readonly homeSelected = signal(false);
    readonly settingsSelected = signal(false);
}

/** A condensed list, without a side navigation: the state is provided by the host. */
@Component({
    imports: [...NESTED, NestedListPopover],
    providers: [NestedListState],
    template: `
        <div class="w-16">
            <ul fd-nested-list>
                <li fd-nested-list-item>
                    <a fd-nested-list-link
                        ><i fd-nested-list-icon glyph="home"></i><span fd-nested-list-title>Home</span></a
                    >
                </li>
                <li fd-nested-list-item [(expanded)]="expanded">
                    <fd-nested-list-popover>
                        <div fd-nested-list-content>
                            <a fd-nested-list-link
                                ><i fd-nested-list-icon glyph="settings"></i
                                ><span fd-nested-list-title>Settings</span></a
                            >
                            <button fd-nested-list-expand-icon></button>
                        </div>
                        <ul fd-nested-list>
                            <li fd-nested-list-item>
                                <a fd-nested-list-link><span fd-nested-list-title>Profile</span></a>
                            </li>
                        </ul>
                    </fd-nested-list-popover>
                </li>
            </ul>
        </div>
        <button id="outside">Outside</button>
    `
})
class CondensedHost {
    readonly expanded = signal(false);
    constructor() {
        inject(NestedListState).condensed.set(true);
    }
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const row = (name: string) =>
    [...document.querySelectorAll<HTMLElement>('[role=treeitem]')].find(
        (el) => el.textContent?.trim() === name && el.offsetParent !== null
    )!;
const focused = () => document.activeElement?.textContent?.trim();

const popoverBody = () => document.querySelector('.cdk-overlay-pane fd-popover-body');

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
}

describe('NestedList', () => {
    it('wraps ArrowUp on the first row to the last and ArrowDown on the last row to the first', async () => {
        const { host } = await setup();
        row('Home').focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(focused()).toBe('Help');
        await userEvent.keyboard('{ArrowDown}');
        expect(focused()).toBe('Home');

        host.expanded.set(true);
        await wait();
        row('Help').focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(focused()).toBe('Security');
        await userEvent.keyboard('{End}{ArrowDown}');
        expect(focused()).toBe('Home');
    });

    it('gives leaf rows no aria-expanded and ignores ArrowRight on them', async () => {
        const { host } = await setup();
        const home = row('Home');
        expect(home.hasAttribute('aria-expanded')).toBe(false);
        expect(row('Settings').getAttribute('aria-expanded')).toBe('false');
        home.focus();
        await userEvent.keyboard('{ArrowRight}');
        await wait();
        expect(focused()).toBe('Home');
        expect(host.expanded()).toBe(false);
        expect(row('Settings').getAttribute('aria-expanded')).toBe('false');
    });

    it('reflects [selected] and [(expanded)] set from outside', async () => {
        const { host, root } = await setup();
        expect(row('Home').getAttribute('aria-selected')).toBe('false');
        host.homeSelected.set(true);
        await wait();
        expect(row('Home').getAttribute('aria-selected')).toBe('true');
        host.homeSelected.set(false);
        host.settingsSelected.set(true);
        await wait();
        expect(row('Home').getAttribute('aria-selected')).toBe('false');
        expect(row('Settings').getAttribute('aria-selected')).toBe('true');

        const group = root.querySelector('[role=group]')!;
        expect(group.getAttribute('aria-hidden')).toBe('true');
        host.expanded.set(true);
        await wait();
        expect(row('Settings').getAttribute('aria-expanded')).toBe('true');
        expect(group.hasAttribute('aria-hidden')).toBe(false);
        expect(row('Profile')).toBeTruthy();
        host.expanded.set(false);
        await wait();
        expect(row('Settings').getAttribute('aria-expanded')).toBe('false');
        expect(group.getAttribute('aria-hidden')).toBe('true');
    });

    it('works without a side navigation: the arrow keys move within the top list', async () => {
        const { host, root } = await setup();
        const tree = root.querySelector('[role=tree]')!;
        expect(tree.hasAttribute('data-nested-scope')).toBe(true);
        expect(tree.getAttribute('aria-roledescription')).toBe('Navigation List Tree');
        row('Home').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(focused()).toBe('Settings');
        await userEvent.keyboard('{ArrowRight}');
        await wait();
        expect(host.expanded()).toBe(true);
        await userEvent.keyboard('{ArrowDown}');
        expect(focused()).toBe('Profile');
        expect(row('Profile').getAttribute('aria-level')).toBe('2');
        await userEvent.keyboard('{End}');
        expect(focused()).toBe('Help');
        await userEvent.click(row('Profile'));
        await wait();
        expect(row('Profile').getAttribute('aria-selected')).toBe('true');
        expect(row('Settings').getAttribute('aria-selected')).toBe('true');
    });

    it('opens the popover on click when condensed and resets expanded when Escape or an outside click closes it', async () => {
        const fixture = TestBed.createComponent(CondensedHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        await wait();
        const host = fixture.componentInstance;
        const settings = row('Settings');
        expect(settings.getAttribute('aria-haspopup')).toBe('tree');
        expect(document.querySelector<HTMLElement>('[fd-nested-list-expand-icon]')!.className).toBe('hidden');

        await userEvent.click(settings);
        await wait(150);
        expect(host.expanded()).toBe(true);
        expect(settings.getAttribute('aria-expanded')).toBe('true');
        expect(popoverBody()?.textContent).toContain('Profile');

        await userEvent.keyboard('{Escape}');
        await wait(150);
        expect(host.expanded()).toBe(false);
        expect(settings.getAttribute('aria-expanded')).toBe('false');
        expect(popoverBody()).toBeNull();

        await userEvent.click(settings);
        await wait(150);
        expect(host.expanded()).toBe(true);
        await userEvent.click(document.getElementById('outside')!);
        await wait(150);
        expect(host.expanded()).toBe(false);
        expect(popoverBody()).toBeNull();
    });
});
