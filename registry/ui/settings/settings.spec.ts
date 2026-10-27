import { Component, viewChild, type TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { List, ListItem, ListLink, ListTitle } from '@/ui/list/list';
import {
    SettingsContainer,
    SettingsContent,
    SettingsListArea,
    SettingsListContainer,
    SettingsListItem
} from './settings';

@Component({
    imports: [
        SettingsContainer,
        SettingsContent,
        SettingsListArea,
        SettingsListContainer,
        SettingsListItem,
        List,
        ListItem,
        ListLink,
        ListTitle
    ],
    template: `
        <div style="height: 30rem">
            <fd-settings-container #container backBtnAriaLabel="Back">
                <div fd-settings-list-area>
                    <div fd-settings-list-container>
                        <ul fd-list aria-label="Settings">
                            <li fd-list-item [settingsListTpl]="account" selected>
                                <a fd-list-link><span fd-list-title>User Account</span></a>
                            </li>
                            <li fd-list-item [settingsListTpl]="language">
                                <a fd-list-link><span fd-list-title>Language</span></a>
                            </li>
                        </ul>
                    </div>
                </div>
            </fd-settings-container>
        </div>
        <ng-template #account><div fd-settings-content class="account">Account view</div></ng-template>
        <ng-template #language><div fd-settings-content class="language">Language view</div></ng-template>
        <ng-template #detail><div fd-settings-content class="detail">Detail view</div></ng-template>
    `
})
class Host {
    readonly container = viewChild.required<SettingsContainer>('container');
    readonly detail = viewChild.required<TemplateRef<unknown>>('detail');
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const item = (name: string) =>
    [...document.querySelectorAll<HTMLElement>('[fd-list-item]')].find((li) => li.textContent?.trim() === name)!;
const title = () => document.querySelector('[fd-settings-header] [role=heading]')?.textContent?.trim();
const back = () => document.querySelector<HTMLElement>('button[fd-settings-header-button]');

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
}

describe('SettingsContainer', () => {
    afterEach(async () => {
        await page.viewport(1280, 800);
        window.dispatchEvent(new Event('resize'));
    });

    it('shows the list and the view of the selected item side by side on large screens', async () => {
        const { root } = await setup();
        expect(root.querySelector('fd-settings-container')!.getAttribute('data-settings-view')).toBe('lg');
        expect(root.querySelector('[fd-settings-list-area]')).not.toBeNull();
        expect(root.querySelector('.account')!.textContent).toBe('Account view');
        expect(title()).toBe('User Account');
        expect(back()).toBeNull();
    });

    it('opens the view of a clicked item and moves the selection', async () => {
        const { root } = await setup();
        await userEvent.click(item('Language'));
        await wait();
        expect(root.querySelector('.language')).not.toBeNull();
        expect(root.querySelector('.account')).toBeNull();
        expect(title()).toBe('Language');
        expect(item('Language').hasAttribute('data-selected')).toBe(true);
        expect(item('User Account').hasAttribute('data-selected')).toBe(false);
    });

    it('pushes further views with a back button', async () => {
        const { host, root } = await setup();
        host.container().pushView(host.detail(), 'Details');
        await wait();
        expect(root.querySelector('.detail')).not.toBeNull();
        expect(title()).toBe('Details');
        expect(document.activeElement).toBe(back());
        await userEvent.click(back()!);
        await wait();
        expect(title()).toBe('User Account');
        expect(back()).toBeNull();
    });

    it('replaces the list with the view on medium screens', async () => {
        await page.viewport(800, 700);
        window.dispatchEvent(new Event('resize'));
        const { root } = await setup();
        expect(root.querySelector('fd-settings-container')!.getAttribute('data-settings-view')).toBe('md');
        expect(root.querySelector('[fd-settings-detail-area]')).toBeNull();
        await userEvent.click(item('Language'));
        await wait();
        expect(root.querySelector('[fd-settings-list-area]')).toBeNull();
        expect(root.querySelector('.language')).not.toBeNull();
        await userEvent.click(back()!);
        await wait();
        expect(root.querySelector('[fd-settings-list-area]')).not.toBeNull();
        expect(document.activeElement?.textContent?.trim()).toBe('Language');
    });
});
