import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    Menu,
    MenuAddon,
    MenuInteractive,
    MenuItem,
    MenuSegmentedButtonHeader,
    MenuSegmentedButtonOption,
    MenuTitle,
    MenuToggle,
    MenuTrigger,
    Submenu
} from './menu';

@Component({
    imports: [
        Menu,
        Submenu,
        MenuItem,
        MenuInteractive,
        MenuTitle,
        MenuAddon,
        MenuTrigger,
        MenuToggle,
        MenuSegmentedButtonHeader,
        MenuSegmentedButtonOption
    ],
    template: `
        <button id="trigger" [fdMenuTrigger]="menu">Open</button>
        <fd-menu #menu ariaLabel="Test menu" (activePath)="path.set($event.length)">
            <li fd-menu-item [submenu]="sub">
                <div fd-menu-interactive><span fd-menu-title>Parent</span><fd-menu-addon submenuIndicator /></div>
            </li>
            <li fd-menu-item disabled>
                <a fd-menu-interactive><span fd-menu-title>Disabled</span></a>
            </li>
            <li fd-menu-item (onSelect)="selected.set('leaf')">
                <a fd-menu-interactive><span fd-menu-title>Leaf</span></a>
            </li>
            <li fd-menu-item>
                <button fd-menu-interactive toggle [(checked)]="toggled"><span fd-menu-title>Toggle</span></button>
            </li>
            <li fd-menu-item fdMenuSegmentedButtonHeader [(value)]="sort">
                <button fd-menu-interactive><span fd-menu-title>Sort</span></button>
            </li>
            <li fd-menu-item fdMenuSegmentedButtonOption value="asc">
                <button fd-menu-interactive><span fd-menu-title>Asc</span></button>
            </li>
            <li fd-menu-item fdMenuSegmentedButtonOption value="desc">
                <button fd-menu-interactive><span fd-menu-title>Desc</span></button>
            </li>
        </fd-menu>
        <fd-submenu #sub>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Child 1</span></a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Child 2</span></a>
            </li>
        </fd-submenu>
    `
})
class Host {
    readonly path = signal(0);
    readonly selected = signal('');
    readonly toggled = signal(false);
    readonly sort = signal<string | null>('asc');
}

const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const item = (text: string) =>
    [...document.querySelectorAll<HTMLElement>('[data-menu-link]')].find((e) => e.textContent!.trim() === text)!;
const focused = () => document.activeElement!.textContent!.trim();

async function open() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
    await userEvent.click(trigger);
    await wait();
    return { fixture, host: fixture.componentInstance, trigger };
}

describe('Menu', () => {
    it('opens from its trigger, announces it and focuses the first item', async () => {
        const { trigger } = await open();
        expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(document.getElementById(trigger.getAttribute('aria-controls')!)!.getAttribute('role')).toBe('menu');
        expect(focused()).toBe('Parent');
        expect(item('Leaf').getAttribute('aria-posinset')).toBe('3');
        expect(item('Leaf').getAttribute('aria-setsize')).toBe('7');
    });

    it('skips disabled items with the arrow keys and closes on Escape', async () => {
        const { trigger } = await open();
        await userEvent.keyboard('{ArrowDown}');
        expect(focused()).toBe('Leaf');
        await userEvent.keyboard('{ArrowUp}');
        expect(focused()).toBe('Parent');
        await userEvent.keyboard('{End}');
        expect(focused()).toBe('Desc');
        await userEvent.keyboard('{Escape}');
        await wait();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(trigger);
    });

    it('opens a submenu with ArrowRight and returns with ArrowLeft', async () => {
        const { host } = await open();
        await userEvent.keyboard('{ArrowRight}');
        await wait();
        const parent = item('Parent');
        expect(parent.getAttribute('aria-expanded')).toBe('true');
        expect(focused()).toBe('Child 1');
        expect(host.path()).toBe(1);
        await userEvent.keyboard('{ArrowLeft}');
        expect(parent.getAttribute('aria-expanded')).toBe('false');
        expect(focused()).toBe('Parent');
    });

    it('selects a plain item and closes the menu', async () => {
        const { host, trigger } = await open();
        await userEvent.keyboard('{ArrowDown}{Enter}');
        await wait();
        expect(host.selected()).toBe('leaf');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('keeps the menu open for toggles and single-choice options', async () => {
        const { host, trigger } = await open();
        await userEvent.click(item('Toggle'));
        expect(host.toggled()).toBe(true);
        expect(item('Toggle').getAttribute('role')).toBe('menuitemcheckbox');
        expect(item('Toggle').getAttribute('aria-checked')).toBe('true');
        await userEvent.click(item('Desc'));
        await wait();
        expect(host.sort()).toBe('desc');
        expect(item('Desc').getAttribute('aria-checked')).toBe('true');
        expect(item('Asc').getAttribute('aria-checked')).toBe('false');
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });
});
