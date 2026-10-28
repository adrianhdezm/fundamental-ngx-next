import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    UserMenu,
    UserMenuBody,
    UserMenuContentContainer,
    UserMenuControl,
    UserMenuFooter,
    UserMenuHeader,
    UserMenuHeaderContainer,
    UserMenuList,
    UserMenuListItem,
    UserMenuSublist,
    UserMenuSubline,
    UserMenuUserName
} from './user-menu';

@Component({
    imports: [
        UserMenu,
        UserMenuBody,
        UserMenuContentContainer,
        UserMenuControl,
        UserMenuFooter,
        UserMenuHeader,
        UserMenuHeaderContainer,
        UserMenuList,
        UserMenuListItem,
        UserMenuSublist,
        UserMenuSubline,
        UserMenuUserName
    ],
    template: `
        <fd-user-menu [(isOpen)]="open" [mobile]="mobile()">
            <fd-user-menu-control>Avatar</fd-user-menu-control>
            <fd-user-menu-body>
                <div fd-user-menu-header>
                    <div fd-user-menu-header-container>
                        <div fd-user-menu-user-name id="name">Lisa Miller</div>
                        <div fd-user-menu-subline>lisa.miller&#64;test.com</div>
                    </div>
                </div>
                <div fd-user-menu-content-container>
                    <fd-user-menu-list>
                        <li
                            fd-user-menu-list-item
                            icon="action-settings"
                            text="Settings"
                            (click)="picked.set('Settings')"
                        ></li>
                        <li fd-user-menu-list-item icon="globe" text="Language" hasSubmenu [submenu]="languages"></li>
                        <li fd-user-menu-list-item icon="message-information" text="About"></li>
                    </fd-user-menu-list>
                    <ng-template #languages>
                        <div fd-user-menu-sublist>
                            <li fd-user-menu-list-item text="English" (click)="picked.set('English')"></li>
                            <li fd-user-menu-list-item text="German"></li>
                        </div>
                    </ng-template>
                </div>
            </fd-user-menu-body>
            <fd-user-menu-footer><button type="button">Sign out</button></fd-user-menu-footer>
        </fd-user-menu>
        <button type="button" id="outside">Outside</button>
    `
})
class Host {
    readonly open = signal(false);
    readonly mobile = signal(false);
    readonly picked = signal('');
}

const wait = (ms = 100) => new Promise((r) => setTimeout(r, ms));
const focusedText = () => document.activeElement?.textContent?.trim();
const item = (name: string) =>
    [...document.querySelectorAll<HTMLElement>('[role=menuitem]')].find((el) => el.textContent?.trim() === name)!;

async function setup(mobile = false) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mobile.set(mobile);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const control = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('fd-user-menu-control')!;
    return { fixture, host: fixture.componentInstance, control };
}

const NAME = 'Maximilian Alexander Featherstonehaugh-Montgomery the Third of Somewhere Rather Far Away';

@Component({
    imports: [UserMenuUserName, UserMenuSubline],
    template: `
        <div class="w-48">
            <div fd-user-menu-user-name id="clamped">{{ name }}</div>
            <div fd-user-menu-user-name truncate id="truncated">{{ name }}</div>
            <div fd-user-menu-subline id="subline">{{ name }}</div>
            <div fd-user-menu-subline wrap id="wrapped">{{ name }}</div>
        </div>
    `
})
class TextHost {
    readonly name = NAME;
}

describe('UserMenu', () => {
    afterEach(() => document.documentElement.removeAttribute('dir'));

    it('opens from the control in a popover labelled by the user name and focuses the first item', async () => {
        const { host, control } = await setup();
        expect(control.getAttribute('role')).toBe('button');
        expect(control.getAttribute('aria-expanded')).toBe('false');
        await userEvent.click(control);
        await wait();
        expect(host.open()).toBe(true);
        expect(control.getAttribute('aria-expanded')).toBe('true');
        const dialog = document.querySelector('[role=dialog]')!;
        expect(dialog.getAttribute('aria-labelledby')).toBe('name');
        expect(dialog.querySelectorAll('[role=menu] > [role=none]')).toHaveLength(3);
        expect(focusedText()).toBe('Settings');
    });

    it('moves between items with the arrow keys and keeps one tab stop', async () => {
        const { control } = await setup();
        control.focus();
        await userEvent.keyboard('{Enter}');
        await wait();
        await userEvent.keyboard('{ArrowDown}');
        expect(focusedText()).toBe('Language');
        expect(item('Language').tabIndex).toBe(0);
        expect(item('Settings').tabIndex).toBe(-1);
        await userEvent.keyboard('{End}');
        expect(focusedText()).toBe('About');
        await userEvent.keyboard('{Home}');
        expect(focusedText()).toBe('Settings');
    });

    it('opens a submenu with the Right arrow and closes it with the Left arrow', async () => {
        const { control } = await setup();
        control.focus();
        await userEvent.keyboard('{Enter}');
        await wait();
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await wait(150);
        expect(item('Language').getAttribute('aria-expanded')).toBe('true');
        expect(focusedText()).toBe('English');
        await userEvent.keyboard('{ArrowDown}');
        expect(focusedText()).toBe('German');
        await userEvent.keyboard('{ArrowLeft}');
        await wait();
        expect(item('Language').getAttribute('aria-expanded')).toBe('false');
        expect(focusedText()).toBe('Language');
    });

    it('opens a submenu on hover', async () => {
        const { host, control } = await setup();
        await userEvent.click(control);
        await wait();
        await userEvent.hover(item('Language'));
        await wait();
        expect(item('Language').getAttribute('aria-expanded')).toBe('true');
        await userEvent.click(item('English'));
        expect(host.picked()).toBe('English');
    });

    it('closes with Escape and returns the focus to the control', async () => {
        const { host, control } = await setup();
        control.focus();
        await userEvent.keyboard('{Enter}');
        await wait();
        await userEvent.keyboard('{Escape}');
        await wait();
        expect(host.open()).toBe(false);
        expect(document.activeElement).toBe(control);
    });

    it('opens in a dialog in mobile mode and shows submenus in place of the main view', async () => {
        const { host, control } = await setup(true);
        await userEvent.click(control);
        await wait(300);
        expect(document.querySelector('[role=dialog]')).not.toBeNull();
        await userEvent.click(item('Language'));
        await wait(200);
        expect(document.querySelector('h1')?.textContent?.trim()).toBe('Language');
        expect(focusedText()).toBe('English');
        await userEvent.click(item('English'));
        expect(host.picked()).toBe('English');
        await userEvent.click(document.querySelector<HTMLElement>('[aria-label="Go back"]')!);
        await wait();
        expect(focusedText()).toBe('Language');
        await userEvent.click(document.querySelector<HTMLElement>('[aria-label="Close"]')!);
        await wait(300);
        expect(host.open()).toBe(false);
    });

    it('keeps clicks inside the body from bubbling out of the menu', async () => {
        const { host, control } = await setup();
        await userEvent.click(control);
        await wait();
        const outside = vi.fn();
        document.addEventListener('click', outside);
        try {
            await userEvent.click(document.getElementById('name')!);
            await userEvent.click(item('Settings'));
            expect(host.picked()).toBe('Settings');
            expect(outside).not.toHaveBeenCalled();
            await userEvent.click(document.querySelector<HTMLElement>('fd-user-menu-footer button')!);
            expect(outside).toHaveBeenCalledOnce();
        } finally {
            document.removeEventListener('click', outside);
        }
    });

    it('the control is a focusable button (tabindex 0, aria-haspopup dialog)', async () => {
        const { control } = await setup();
        expect(control.getAttribute('role')).toBe('button');
        expect(control.tabIndex).toBe(0);
        expect(control.getAttribute('aria-haspopup')).toBe('dialog');
        await userEvent.tab();
        expect(document.activeElement).toBe(control);
    });

    it('opens with Space and ignores other keys on the control', async () => {
        const { host, control } = await setup();
        control.focus();
        await userEvent.keyboard('a{ArrowDown}{Tab}');
        await wait();
        expect(host.open()).toBe(false);
        control.focus();
        await userEvent.keyboard('[Space]');
        await wait();
        expect(host.open()).toBe(true);
        expect(focusedText()).toBe('Settings');
    });

    it('reopening after moving the focus starts on the first item', async () => {
        const { control } = await setup();
        control.focus();
        await userEvent.keyboard('{Enter}');
        await wait();
        await userEvent.keyboard('{End}');
        expect(focusedText()).toBe('About');
        await userEvent.keyboard('{Escape}');
        await wait();
        await userEvent.keyboard('{Enter}');
        await wait();
        expect(focusedText()).toBe('Settings');
        expect(item('Settings').tabIndex).toBe(0);
        expect(item('About').tabIndex).toBe(-1);
    });

    it('moving the focus out of the menu resets the tab stop to the first item', async () => {
        const { control } = await setup();
        control.focus();
        await userEvent.keyboard('{Enter}');
        await wait();
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Language').tabIndex).toBe(0);
        // moving within the menu (into a submenu) keeps the item
        await userEvent.keyboard('{ArrowRight}');
        await wait(150);
        expect(focusedText()).toBe('English');
        expect(item('Language').tabIndex).toBe(0);
        await userEvent.keyboard('{ArrowLeft}');
        await wait();
        // leaving the menu makes the first item the tab stop again
        document.getElementById('outside')!.focus();
        await wait();
        expect(item('Language').tabIndex).toBe(-1);
        expect(item('Settings').tabIndex).toBe(0);
    });

    it('submenu arrows are mirrored in RTL', async () => {
        document.documentElement.setAttribute('dir', 'rtl');
        const { control } = await setup();
        control.focus();
        await userEvent.keyboard('{Enter}');
        await wait();
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await wait(150);
        expect(item('Language').getAttribute('aria-expanded')).toBe('false');
        await userEvent.keyboard('{ArrowLeft}');
        await wait(150);
        expect(item('Language').getAttribute('aria-expanded')).toBe('true');
        expect(focusedText()).toBe('English');
        await userEvent.keyboard('{ArrowRight}');
        await wait();
        expect(item('Language').getAttribute('aria-expanded')).toBe('false');
        expect(focusedText()).toBe('Language');
    });

    it('mobile mode focuses the first item when it opens', async () => {
        const { control } = await setup(true);
        await userEvent.click(control);
        await wait(300);
        expect(document.querySelector('[role=dialog]')).not.toBeNull();
        expect(focusedText()).toBe('Settings');
    });

    it('user name clamps to two lines, truncate keeps one line', async () => {
        const fixture = TestBed.createComponent(TextHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const lineHeight = (el: HTMLElement) => parseFloat(getComputedStyle(el).lineHeight);
        const clamped = document.getElementById('clamped')!;
        expect(clamped.clientHeight).toBeCloseTo(2 * lineHeight(clamped), 0);
        expect(clamped.scrollHeight).toBeGreaterThan(clamped.clientHeight);
        const truncated = document.getElementById('truncated')!;
        expect(truncated.clientHeight).toBeCloseTo(lineHeight(truncated), 0);
        expect(getComputedStyle(truncated).textOverflow).toBe('ellipsis');
    });

    it('a subline truncates to one line unless it wraps', async () => {
        const fixture = TestBed.createComponent(TextHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const subline = document.getElementById('subline')!;
        const wrapped = document.getElementById('wrapped')!;
        expect(getComputedStyle(subline).textOverflow).toBe('ellipsis');
        expect(subline.scrollWidth).toBeGreaterThan(subline.clientWidth);
        expect(wrapped.clientHeight).toBeGreaterThan(2 * subline.clientHeight);
        expect(wrapped.scrollWidth).toBe(wrapped.clientWidth);
    });
});
