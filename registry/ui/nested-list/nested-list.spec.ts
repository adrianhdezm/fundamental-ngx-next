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

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const row = (name: string) =>
    [...document.querySelectorAll<HTMLElement>('[role=treeitem]')].find(
        (el) => el.textContent?.trim() === name && el.offsetParent !== null
    )!;
const focused = () => document.activeElement?.textContent?.trim();

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
});
