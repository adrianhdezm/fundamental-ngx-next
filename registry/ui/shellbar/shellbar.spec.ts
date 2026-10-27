import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    Shellbar,
    ShellbarAction,
    ShellbarActions,
    ShellbarBranding,
    ShellbarContextArea,
    ShellbarHidePriority,
    ShellbarSearch,
    ShellbarTitle,
    type ShellbarSize
} from './shellbar';

@Component({
    imports: [
        Shellbar,
        ShellbarAction,
        ShellbarActions,
        ShellbarBranding,
        ShellbarContextArea,
        ShellbarHidePriority,
        ShellbarSearch,
        ShellbarTitle
    ],
    template: `
        <div [style.width.px]="width()">
            <fd-shellbar
                [size]="size()"
                showNavigationButton
                showBackButton
                (navigationButtonClicked)="clicked.set('navigation')"
                (backButtonClicked)="clicked.set('back')"
            >
                <fd-shellbar-branding interactiveBranding ariaLabel="Home" (click)="clicked.set('home')">
                    <fd-shellbar-title>Corporate Portal</fd-shellbar-title>
                </fd-shellbar-branding>
                @if (context()) {
                    <fd-shellbar-context-area (contentItemVisibilityChange)="hidden.set($event)">
                        <span class="inline-block w-40" fdShellbarHidePriority="1">First</span>
                        <span class="inline-block w-40" fdShellbarHidePriority="2">Second</span>
                    </fd-shellbar-context-area>
                }
                <fd-shellbar-search (searchSubmit)="searched.set($event)" />
                <fd-shellbar-actions>
                    <fd-shellbar-action
                        glyph="bell"
                        label="Notifications"
                        [notificationCount]="3"
                        [callback]="notify"
                    />
                    <fd-shellbar-action glyph="feedback" label="Feedback" [toggled]="toggled()" [callback]="toggle" />
                    <fd-shellbar-action glyph="sys-help" label="Help" />
                </fd-shellbar-actions>
            </fd-shellbar>
        </div>
    `
})
class Host {
    readonly width = signal(1300);
    readonly size = signal<ShellbarSize | undefined>(undefined);
    readonly context = signal(false);
    readonly clicked = signal('');
    readonly searched = signal<string | null>(null);
    readonly hidden = signal<HTMLElement[]>([]);
    readonly toggled = signal(false);
    readonly notify = () => this.clicked.set('notifications');
    readonly toggle = () => this.toggled.update((v) => !v);
}

const wait = (ms = 100) => new Promise((r) => setTimeout(r, ms));

async function setup(width = 1300, context = false) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.width.set(width);
    fixture.componentInstance.context.set(context);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait(150);
    const root = fixture.nativeElement as HTMLElement;
    const bar = root.querySelector<HTMLElement>('[data-size]')!;
    const button = (name: RegExp) =>
        [...root.querySelectorAll<HTMLElement>('button')].find(
            (b) => name.test(b.getAttribute('aria-label') ?? '') && b.offsetParent !== null
        );
    return { fixture, host: fixture.componentInstance, root, bar, button };
}

describe('Shellbar', () => {
    it('takes its size from its width and shows the search in the middle when extra large', async () => {
        const { bar, root } = await setup(1300);
        expect(bar.dataset['size']).toBe('xl');
        expect(root.querySelector('[role=search]')!.parentElement!.closest('[data-size]')).toBe(bar);
        expect((root.querySelector('[role=search]') as HTMLElement).offsetParent).not.toBeNull();
    });

    it('names actions with their notifications and runs their callbacks', async () => {
        const { host, button } = await setup(1300);
        const bell = button(/^Notifications/)!;
        expect(bell.getAttribute('aria-label')).toBe('Notifications, 3');
        await userEvent.click(bell);
        expect(host.clicked()).toBe('notifications');
    });

    it('makes the interactive branding a link reachable with the keyboard', async () => {
        const { host, root } = await setup(1300);
        const branding = root.querySelector<HTMLElement>('fd-shellbar-branding')!;
        expect(branding.getAttribute('role')).toBe('link');
        branding.focus();
        await userEvent.keyboard('{Enter}');
        expect(host.clicked()).toBe('home');
    });

    it('opens the search from a button below extra large and submits it', async () => {
        const { host, button, bar, fixture } = await setup(1000);
        expect(bar.dataset['size']).toBe('l');
        await userEvent.click(button(/^Search$/)!);
        await wait();
        const input = fixture.nativeElement.querySelector('input[type=search]') as HTMLInputElement;
        expect(document.activeElement).toBe(input);
        await userEvent.keyboard('orders{Enter}');
        expect(host.searched()).toBe('orders');
    });

    it('collapses actions that do not fit into an overflow menu', async () => {
        const { button, bar } = await setup(340);
        expect(bar.dataset['size']).toBe('m');
        expect(button(/^Help$/)).toBeUndefined();
        const overflow = button(/^Collapsed Item Menu/)!;
        expect(overflow.getAttribute('aria-label')).toBe('Collapsed Item Menu, 3');
        await userEvent.click(overflow);
        await wait();
        const items = [...document.querySelectorAll('[role=menuitem]')].map((i) => i.textContent?.trim());
        expect(items).toEqual(['Search', 'Notifications3', 'Feedback', 'Help']);
    });

    it('opens the search in place of everything else on small screens', async () => {
        const { host, bar, root } = await setup(300);
        host.size.set('s');
        await wait();
        const search = root.querySelector<HTMLElement>('[role=search]')!;
        expect(search.offsetParent).toBeNull();
        root.querySelector<HTMLElement>('fd-shellbar-actions [aria-label^="Collapsed"]')!.click();
        await wait();
        (document.querySelector('[role=menuitem]') as HTMLElement).click();
        await wait();
        expect(search.offsetParent).not.toBeNull();
        expect(bar.querySelector<HTMLElement>('fd-shellbar-actions')!.offsetParent).toBeNull();
        const cancel = [...bar.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Cancel')!;
        await userEvent.click(cancel);
        await wait();
        expect(search.offsetParent).toBeNull();
    });

    it('hides context area items by priority when space runs out', async () => {
        const { host } = await setup(460, true);
        await wait();
        expect(host.hidden().length).toBeGreaterThan(0);
    });

    it('contentItemVisibilityChange emits the hidden items and restores them when space returns', async () => {
        const { host, fixture } = await setup(460, true);
        await wait();
        const hidden = host.hidden();
        // the item with the highest priority number hides first
        expect(hidden.map((el) => el.textContent)).toEqual(hidden.length === 1 ? ['Second'] : ['Second', 'First']);
        expect(hidden.every((el) => el.offsetParent === null)).toBe(true);
        host.width.set(1300);
        await fixture.whenStable();
        await wait(200);
        expect(host.hidden()).toEqual([]);
        expect(hidden.every((el) => el.offsetParent !== null)).toBe(true);
    });
});
