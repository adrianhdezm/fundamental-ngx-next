import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { PopoverConfig } from '@/ui/popover/popover';
import {
    Menu,
    type MenuMobileConfig,
    MenuAddon,
    MenuInteractive,
    MenuItem,
    MenuSegmentedButtonHeader,
    MenuSegmentedButtonOption,
    MenuShortcut,
    MenuSubtitle,
    MenuContent,
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

/** A menu whose options are all host signals. */
@Component({
    imports: [
        Menu,
        Submenu,
        MenuItem,
        MenuInteractive,
        MenuTitle,
        MenuSubtitle,
        MenuContent,
        MenuAddon,
        MenuShortcut,
        MenuTrigger
    ],
    template: `
        <button id="trigger" [fdMenuTrigger]="menu">Open</button>
        <button id="outside">Outside</button>
        <fd-menu
            #menu
            ariaLabel="Configurable menu"
            [(isOpen)]="open"
            [disabled]="disabled()"
            [mobile]="mobile()"
            [mobileConfig]="mobileConfig()"
            [restoreFocusOnClose]="restoreFocus()"
            [disableScrollbar]="noScrollbar()"
            [openOnHoverTime]="hoverTime()"
            (beforeOpen)="events.push(rendered() ? 'beforeOpen (rendered)' : 'beforeOpen')"
            (isOpenChange)="events.push('isOpenChange: ' + $event)"
        >
            <li fd-menu-item disabled>
                <a fd-menu-interactive><span fd-menu-title>First disabled</span></a>
            </li>
            <li fd-menu-item [submenu]="sub">
                <div fd-menu-interactive><span fd-menu-title>Parent</span><fd-menu-addon submenuIndicator /></div>
            </li>
            <li fd-menu-item (onSelect)="selected.set(selected() + 1)">
                <a fd-menu-interactive>
                    <fd-menu-addon position="before" glyph="cart" />
                    <div fd-menu-content>
                        <span fd-menu-title [truncate]="truncate()">{{ long }}</span>
                        <span fd-menu-subtitle [truncate]="truncate()">{{ long }}</span>
                    </div>
                    <fd-menu-addon glyph="decline" />
                </a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive>
                    <span fd-menu-title>Save</span>
                    <span fd-menu-shortcut [hideOnMobile]="hideShortcut()">Ctrl + S</span>
                </a>
            </li>
            <li fd-menu-item disabled (onSelect)="selected.set(selected() + 100)">
                <a fd-menu-interactive><span fd-menu-title>Last disabled</span></a>
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
class ConfigHost {
    readonly menu = viewChild.required<Menu>('menu');
    readonly open = signal(false);
    readonly disabled = signal(false);
    readonly mobile = signal(false);
    readonly mobileConfig = signal<MenuMobileConfig>({ hasCloseButton: true });
    readonly restoreFocus = signal(true);
    readonly noScrollbar = signal(false);
    readonly hoverTime = signal(0);
    readonly truncate = signal(false);
    readonly hideShortcut = signal(true);
    readonly selected = signal(0);
    readonly events: string[] = [];
    protected rendered(): boolean {
        return !!document.querySelector('[aria-label="Configurable menu"]');
    }
    readonly long = 'A very long menu item text that does not fit into the width of the menu and wraps or is truncated';
}

/** A menu without submenus, so its body keeps the scroll container. */
@Component({
    imports: [Menu, MenuItem, MenuInteractive, MenuTitle, MenuTrigger],
    template: `
        <button id="trigger" class="w-80" [fdMenuTrigger]="menu">Open</button>
        <fd-menu #menu ariaLabel="Plain menu" [config]="config()" [disableScrollbar]="noScrollbar()">
            @for (n of [1, 2, 3]; track n) {
                <li fd-menu-item>
                    <a fd-menu-interactive
                        ><span fd-menu-title>Option {{ n }}</span></a
                    >
                </li>
            }
        </fd-menu>
    `
})
class PlainHost {
    readonly config = signal<PopoverConfig>({});
    readonly noScrollbar = signal(false);
}

const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const item = (text: string) =>
    [...document.querySelectorAll<HTMLElement>('[data-menu-link]')].find((e) => e.textContent!.trim() === text)!;
const focused = () => document.activeElement!.textContent!.trim();
/** The interactive element of an item, by the text of its title. */
const link = (title: string) =>
    [...document.querySelectorAll<HTMLElement>('[data-menu-link]')].find(
        (e) => e.querySelector('[fd-menu-title]')?.textContent!.trim() === title
    );
const settle = async (fixture: { whenStable(): Promise<unknown> }, ms = 60) => {
    await fixture.whenStable();
    await wait(ms);
};

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

    it('a second trigger click closes the menu', async () => {
        const { trigger } = await open();
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        await userEvent.click(trigger);
        await wait();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(item('Leaf')).toBeUndefined();
        await userEvent.click(trigger);
        await wait();
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('Enter and Space on a submenu parent open it and focus its first child', async () => {
        await open();
        expect(focused()).toBe('Parent');
        await userEvent.keyboard('{Enter}');
        await wait();
        expect(item('Parent').getAttribute('aria-expanded')).toBe('true');
        expect(focused()).toBe('Child 1');
        await userEvent.keyboard('{ArrowLeft}');
        expect(item('Parent').getAttribute('aria-expanded')).toBe('false');
        await userEvent.keyboard(' ');
        await wait();
        expect(item('Parent').getAttribute('aria-expanded')).toBe('true');
        expect(focused()).toBe('Child 1');
    });

    it('shows a check mark on a toggle that is on and a dot on the chosen option', async () => {
        await open();
        const mark = (el: HTMLElement) => el.querySelector<HTMLElement>('[aria-hidden=true]')!;
        expect(mark(item('Toggle')).querySelector('fd-icon')).toBeNull();
        await userEvent.click(item('Toggle'));
        const check = mark(item('Toggle')).querySelector<HTMLElement>('fd-icon')!;
        expect(check.getBoundingClientRect().width).toBeGreaterThan(0);
        const dot = () => mark(item('Asc')).querySelector<HTMLElement>('span');
        expect(dot()!.getBoundingClientRect().width).toBeGreaterThan(0);
        expect(mark(item('Desc')).querySelector('span')).toBeNull();
        await userEvent.click(item('Desc'));
        await wait();
        expect(dot()).toBeNull();
        expect(mark(item('Desc')).querySelector('span')).not.toBeNull();
    });
});

async function setup(init: (host: ConfigHost) => void = () => {}) {
    const fixture = TestBed.createComponent(ConfigHost);
    init(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
    return { fixture, host: fixture.componentInstance, trigger };
}

describe('Menu options', () => {
    it('a disabled menu does not open from its trigger', async () => {
        const { fixture, host, trigger } = await setup((h) => h.disabled.set(true));
        await userEvent.click(trigger);
        await wait();
        expect(host.open()).toBe(false);
        expect(document.querySelector('[role=menu]')).toBeNull();
        trigger.focus();
        await userEvent.keyboard('{ArrowDown}');
        await fixture.whenStable();
        await wait();
        expect(host.open()).toBe(false);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        host.mobile.set(true);
        await fixture.whenStable();
        await userEvent.click(trigger);
        await wait();
        expect(host.open()).toBe(false);
        expect(document.querySelector('[role=dialog]')).toBeNull();
    });

    it('takes options from config unless a direct input sets them', async () => {
        const fixture = TestBed.createComponent(PlainHost);
        fixture.componentInstance.config.set({
            placement: 'top-start',
            fillControlMode: 'equal',
            additionalBodyClass: 'config-body'
        });
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const trigger = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
        await userEvent.click(trigger);
        await wait();
        const menu = document.querySelector<HTMLElement>('[aria-label="Plain menu"]')!;
        const body = document.querySelector<HTMLElement>('.config-body')!;
        expect(body).not.toBeNull();
        // the placement input has a default, so it wins over config.placement
        expect(menu.getBoundingClientRect().top).toBeGreaterThanOrEqual(trigger.getBoundingClientRect().bottom - 1);
        // fillControlMode has no value of its own, so config.fillControlMode applies
        expect(Math.round(body.getBoundingClientRect().width)).toBe(Math.round(trigger.getBoundingClientRect().width));
    });

    it('open(), close() and toggle() drive isOpen, render the items only while open and emit isOpenChange once', async () => {
        const { fixture, host } = await setup();
        const menu = host.menu();
        expect(link('Save')).toBeUndefined();
        menu.open();
        await settle(fixture);
        expect(host.open()).toBe(true);
        expect(link('Save')).toBeDefined();
        menu.toggle();
        await settle(fixture);
        expect(host.open()).toBe(false);
        expect(link('Save')).toBeUndefined();
        menu.toggle();
        await settle(fixture);
        expect(link('Save')).toBeDefined();
        menu.open();
        await settle(fixture);
        menu.close();
        await settle(fixture);
        expect(link('Save')).toBeUndefined();
        menu.close();
        await settle(fixture);
        expect(host.events.filter((e) => e.startsWith('isOpenChange'))).toEqual([
            'isOpenChange: true',
            'isOpenChange: false',
            'isOpenChange: true',
            'isOpenChange: false'
        ]);
    });

    it('emits beforeOpen once per opening, before the items render', async () => {
        const { fixture, host, trigger } = await setup();
        host.menu().open();
        await settle(fixture);
        expect(host.events.filter((e) => e.startsWith('beforeOpen'))).toEqual(['beforeOpen']);
        host.menu().close();
        await settle(fixture);
        await userEvent.click(trigger);
        await settle(fixture);
        expect(host.open()).toBe(true);
        expect(host.events.filter((e) => e.startsWith('beforeOpen'))).toHaveLength(2);
    });

    it('Home and End focus the first and last enabled items', async () => {
        const { trigger } = await setup();
        await userEvent.click(trigger);
        await wait();
        expect(document.activeElement).toBe(link('Parent'));
        await userEvent.keyboard('{End}');
        expect(document.activeElement).toBe(link('Save'));
        await userEvent.keyboard('{Home}');
        expect(document.activeElement).toBe(link('Parent'));
        // no wrap-around past the ends
        await userEvent.keyboard('{ArrowUp}');
        expect(document.activeElement).toBe(link('Parent'));
    });

    it('Space activates the focused item and closes the menu', async () => {
        const { host, trigger } = await setup();
        await userEvent.click(trigger);
        await wait();
        await userEvent.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(link(host.long));
        await userEvent.keyboard(' ');
        await wait();
        expect(host.selected()).toBe(1);
        expect(host.open()).toBe(false);
    });

    it('clicking a disabled item does nothing', async () => {
        const { host, trigger } = await setup();
        await userEvent.click(trigger);
        await wait();
        const disabled = link('Last disabled')!;
        expect(disabled.getAttribute('aria-disabled')).toBe('true');
        expect(disabled.getAttribute('tabindex')).toBe('-1');
        disabled.click();
        await wait();
        expect(host.selected()).toBe(0);
        expect(host.open()).toBe(true);
    });

    it('hovering a submenu parent opens it after openOnHoverTime and hovering a sibling closes it', async () => {
        const { fixture, host, trigger } = await setup();
        await userEvent.click(trigger);
        await wait();
        const parent = link('Parent')!;
        await userEvent.hover(parent);
        await wait();
        expect(parent.getAttribute('aria-expanded')).toBe('true');
        expect(link('Child 1')).toBeDefined();
        await userEvent.hover(link('Save')!);
        await wait();
        expect(parent.getAttribute('aria-expanded')).toBe('false');
        host.hoverTime.set(300);
        await fixture.whenStable();
        await userEvent.hover(parent);
        await wait(100);
        expect(parent.getAttribute('aria-expanded')).toBe('false');
        await wait(300);
        expect(parent.getAttribute('aria-expanded')).toBe('true');
    });

    it('submenu parents announce their submenu except in mobile mode', async () => {
        const { fixture, host, trigger } = await setup();
        await userEvent.click(trigger);
        await wait();
        let parent = link('Parent')!;
        expect(parent.getAttribute('aria-haspopup')).toBe('menu');
        expect(parent.getAttribute('aria-expanded')).toBe('false');
        expect(document.getElementById(parent.getAttribute('aria-controls')!)!.getAttribute('role')).toBe('menu');
        expect(link('Save')!.hasAttribute('aria-haspopup')).toBe(false);
        host.menu().close();
        host.mobile.set(true);
        await settle(fixture);
        await userEvent.click(trigger);
        await expect.poll(() => document.querySelector('[role=dialog]')).not.toBeNull();
        await wait();
        parent = link('Parent')!;
        expect(parent.hasAttribute('aria-haspopup')).toBe(false);
        expect(parent.hasAttribute('aria-expanded')).toBe(false);
        expect(parent.hasAttribute('aria-controls')).toBe(false);
    });

    it('mobile mode opens a dialog with the mobileConfig title and buttons', async () => {
        const { fixture, host, trigger } = await setup((h) => {
            h.mobile.set(true);
            h.mobileConfig.set({
                title: 'Groceries',
                approveButtonText: 'Apply',
                cancelButtonText: 'Cancel',
                hasCloseButton: true
            });
        });
        const dialog = () => document.querySelector<HTMLElement>('[role=dialog]');
        const button = (name: string) =>
            [...dialog()!.querySelectorAll<HTMLElement>('button')].find(
                (b) => b.textContent!.trim().startsWith(name) || b.getAttribute('aria-label') === name
            );
        for (const name of ['Apply', 'Cancel', 'Close']) {
            await userEvent.click(trigger);
            await expect.poll(dialog).not.toBeNull();
            await settle(fixture);
            expect(host.open()).toBe(true);
            const title = document.getElementById(dialog()!.getAttribute('aria-labelledby')!)!;
            expect(title.textContent!.trim()).toBe('Groceries');
            expect(button(name)).toBeDefined();
            await userEvent.click(button(name)!);
            await expect.poll(dialog).toBeNull();
            expect(host.open()).toBe(false);
        }
        host.mobileConfig.set({ title: 'Groceries', hasCloseButton: false });
        await settle(fixture);
        await userEvent.click(trigger);
        await expect.poll(dialog).not.toBeNull();
        await settle(fixture);
        expect(button('Close')).toBeUndefined();
        expect(button('Apply')).toBeUndefined();
    });

    it('mobile mode navigates into a submenu and back', async () => {
        const { fixture, trigger } = await setup((h) => {
            h.mobile.set(true);
            h.mobileConfig.set({ title: 'Groceries' });
        });
        await userEvent.click(trigger);
        await expect.poll(() => document.querySelector('[role=dialog]')).not.toBeNull();
        await settle(fixture);
        const heading = () => document.querySelector<HTMLElement>('[role=dialog] h1')!.textContent!.trim();
        expect(heading()).toBe('Groceries');
        await userEvent.click(link('Parent')!);
        await settle(fixture);
        expect(heading()).toBe('Parent');
        expect(link('Save')).toBeUndefined();
        expect(document.activeElement).toBe(link('Child 1'));
        const back = document.querySelector<HTMLElement>('[aria-label="Go to previous menu level: Parent"]')!;
        await userEvent.click(back);
        await settle(fixture);
        expect(heading()).toBe('Groceries');
        expect(link('Child 1')).toBeUndefined();
        expect(document.activeElement).toBe(link('Parent'));
    });

    it('hides shortcuts in mobile mode unless hideOnMobile is false', async () => {
        const { fixture, host, trigger } = await setup();
        const shortcut = () => document.querySelector<HTMLElement>('[fd-menu-shortcut]')!;
        await userEvent.click(trigger);
        await wait();
        expect(shortcut().getBoundingClientRect().width).toBeGreaterThan(0);
        host.menu().close();
        host.mobile.set(true);
        await settle(fixture);
        await userEvent.click(trigger);
        await expect.poll(() => document.querySelector('[role=dialog]')).not.toBeNull();
        await settle(fixture);
        expect(getComputedStyle(shortcut()).display).toBe('none');
        host.hideShortcut.set(false);
        await settle(fixture);
        expect(shortcut().getBoundingClientRect().width).toBeGreaterThan(0);
    });

    it('renders addons before and after the title', async () => {
        const { host, trigger } = await setup();
        await userEvent.click(trigger);
        await wait();
        const el = link(host.long)!;
        const [before, after] = [...el.querySelectorAll<HTMLElement>('fd-menu-addon')].map((a) =>
            a.getBoundingClientRect()
        );
        const title = el.querySelector<HTMLElement>('[fd-menu-title]')!.getBoundingClientRect();
        expect(before.right).toBeLessThanOrEqual(title.left + 1);
        expect(after.left).toBeGreaterThanOrEqual(title.right - 1);
    });

    it('truncate clips the title and subtitle to one line', async () => {
        const { fixture, host, trigger } = await setup();
        await userEvent.click(trigger);
        await wait();
        const el = link(host.long)!;
        const title = el.querySelector<HTMLElement>('[fd-menu-title]')!;
        const subtitle = el.querySelector<HTMLElement>('[fd-menu-subtitle]')!;
        // one line of text: the height of the short "Save" title
        const line = link('Save')!.querySelector<HTMLElement>('[fd-menu-title]')!.offsetHeight;
        expect(title.offsetHeight).toBeGreaterThan(line * 1.5);
        expect(subtitle.offsetHeight).toBeGreaterThan(line * 1.5);
        host.truncate.set(true);
        await settle(fixture);
        for (const text of [title, subtitle]) {
            expect(text.offsetHeight).toBeLessThan(line * 1.5);
            expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
            expect(getComputedStyle(text).textOverflow).toBe('ellipsis');
        }
    });

    it('disableScrollbar removes the scroll container', async () => {
        const fixture = TestBed.createComponent(PlainHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const trigger = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
        const scroller = () => {
            const pane = document.querySelector('.cdk-overlay-pane');
            let el = document.querySelector('[aria-label="Plain menu"]')!.parentElement;
            for (; el && el !== pane; el = el.parentElement) {
                if (getComputedStyle(el).overflowY === 'auto') return el;
            }
            return null;
        };
        await userEvent.click(trigger);
        await wait();
        expect(scroller()).not.toBeNull();
        await userEvent.click(trigger);
        await wait();
        fixture.componentInstance.noScrollbar.set(true);
        await fixture.whenStable();
        await userEvent.click(trigger);
        await wait();
        expect(document.querySelector('[aria-label="Plain menu"]')).not.toBeNull();
        expect(scroller()).toBeNull();
    });

    it('restoreFocusOnClose=false leaves the focus where it was', async () => {
        const { host, trigger } = await setup((h) => h.restoreFocus.set(false));
        await userEvent.click(trigger);
        await wait();
        expect(document.activeElement).toBe(link('Parent'));
        await userEvent.keyboard('{Escape}');
        await wait();
        expect(host.open()).toBe(false);
        expect(document.activeElement).not.toBe(trigger);
    });
});
