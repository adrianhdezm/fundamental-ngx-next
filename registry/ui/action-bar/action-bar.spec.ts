import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Button } from '@/ui/button/button';
import { Menu, MenuInteractive, MenuItem, MenuTitle, MenuTrigger } from '@/ui/menu/menu';
import {
    ActionBar,
    ActionBarActions,
    ActionBarBack,
    ActionBarDescription,
    ActionBarHeader,
    ActionBarTitle,
    type ActionBarSize
} from './action-bar';

@Component({
    imports: [
        ActionBar,
        ActionBarHeader,
        ActionBarBack,
        ActionBarTitle,
        ActionBarActions,
        ActionBarDescription,
        Button
    ],
    template: `
        <div [style.width]="width()">
            <div fd-action-bar [size]="size()">
                <div fd-action-bar-header>
                    @if (back()) {
                        <div fd-action-bar-back>
                            <button
                                fdButton
                                variant="transparent"
                                glyph="navigation-left-arrow"
                                ariaLabel="Back"
                                (click)="backClicks = backClicks + 1"
                            ></button>
                        </div>
                    }
                    <div fd-action-bar-title>{{ title() }}</div>
                    <div fd-action-bar-actions [hidden]="actionsHidden()">
                        <button fdButton label="Cancel"></button>
                        <button fdButton variant="emphasized" label="Save"></button>
                    </div>
                </div>
                <p fd-action-bar-description [withBackBtn]="back()">Action bar description</p>
            </div>
        </div>
    `
})
class Host {
    readonly size = signal<ActionBarSize>('m_l');
    readonly back = signal(true);
    readonly actionsHidden = signal(false);
    readonly width = signal('800px');
    readonly title = signal('Page Title');
    backClicks = 0;
}

@Component({
    imports: [
        ActionBar,
        ActionBarHeader,
        ActionBarTitle,
        ActionBarActions,
        Button,
        Menu,
        MenuItem,
        MenuInteractive,
        MenuTitle,
        MenuTrigger
    ],
    template: `
        <div fd-action-bar>
            <div fd-action-bar-header>
                <div fd-action-bar-title>Page Title</div>
                <div fd-action-bar-actions>
                    <button
                        fdButton
                        variant="transparent"
                        glyph="overflow"
                        ariaLabel="More"
                        [fdMenuTrigger]="menu"
                    ></button>
                    <fd-menu #menu ariaLabel="Page actions" placement="bottom-end">
                        @for (action of actions; track action) {
                            <li fd-menu-item>
                                <div fd-menu-interactive>
                                    <span fd-menu-title>{{ action }}</span>
                                </div>
                            </li>
                        }
                    </fd-menu>
                </div>
            </div>
        </div>
    `
})
class MenuHost {
    readonly actions = ['Edit', 'Delete', 'Assign', 'Expire', 'Archive'];
}

const LONG = 'A very long page title that will never fit into the action bar of this narrow test container';

async function setup(config: Partial<{ back: boolean; width: string; title: string; size: ActionBarSize }> = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.back !== undefined) host.back.set(config.back);
    if (config.width) host.width.set(config.width);
    if (config.title) host.title.set(config.title);
    if (config.size) host.size.set(config.size);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const q = (selector: string) => root.querySelector<HTMLElement>(selector)!;
    return {
        fixture,
        host,
        root,
        bar: () => q('[fd-action-bar]'),
        back: () => q('[fd-action-bar-back] button'),
        title: () => q('[fd-action-bar-title]'),
        heading: () => q('[fd-action-bar-title] h2'),
        actions: () => q('[fd-action-bar-actions]'),
        description: () => q('[fd-action-bar-description]')
    };
}

const rect = (el: HTMLElement) => el.getBoundingClientRect();

describe('ActionBar', () => {
    it('back button has an accessible name and is clickable', async () => {
        const { host, back } = await setup();
        expect(back().getAttribute('aria-label')).toBe('Back');
        expect(back().getAttribute('type')).toBe('button');
        await userEvent.click(back());
        expect(host.backClicks).toBe(1);
        back().focus();
        await userEvent.keyboard('{Enter}');
        expect(host.backClicks).toBe(2);
    });

    it('back button comes first in the header, before the title', async () => {
        const { back, title } = await setup();
        expect(rect(back()).right).toBeLessThanOrEqual(rect(title()).left);
    });

    it('renders the title as a level 2 heading', async () => {
        const { heading } = await setup();
        expect(heading().tagName).toBe('H2');
        expect(heading().textContent!.trim()).toBe('Page Title');
    });

    it('the title is tall enough for its descenders', async () => {
        const { heading } = await setup({ title: 'Typography' });
        const range = document.createRange();
        range.selectNodeContents(heading());
        // the heading clips its overflow: its box must hold the glyphs' full ascent and descent
        expect(rect(heading()).height).toBeGreaterThanOrEqual(range.getBoundingClientRect().height - 0.5);
    });

    it('a long title truncates on one line', async () => {
        const { heading } = await setup({ width: '400px', title: LONG });
        const style = getComputedStyle(heading());
        expect(style.whiteSpace).toBe('nowrap');
        expect(style.textOverflow).toBe('ellipsis');
        expect(heading().scrollWidth).toBeGreaterThan(heading().clientWidth);
        // stays on one line, the header keeps its height
        expect(heading().getBoundingClientRect().height).toBeLessThanOrEqual(32);
    });

    it('the long title never pushes the actions out of the bar', async () => {
        const { bar, actions } = await setup({ width: '400px', title: LONG });
        expect(rect(actions()).right).toBeLessThanOrEqual(rect(bar()).right);
        expect(rect(actions()).width).toBeGreaterThan(100);
    });

    it('description is rendered below the title', async () => {
        const { title, description } = await setup();
        expect(rect(description()).top).toBeGreaterThanOrEqual(rect(title()).bottom);
        expect(description().textContent!.trim()).toBe('Action bar description');
    });

    it('withBackBtn indents the description to the title next to the back button', async () => {
        const { fixture, host, title, description } = await setup();
        const indent = () => parseFloat(getComputedStyle(description()).paddingInlineStart);
        expect(indent()).toBe(40);
        expect(Math.abs(rect(description()).left + indent() - rect(title()).left)).toBeLessThanOrEqual(4);

        host.back.set(false);
        await fixture.whenStable();
        expect(indent()).toBe(0);
        expect(rect(description()).left).toBe(rect(title()).left);
    });

    it('actions area aligns to the end in LTR and RTL', async () => {
        const { fixture, bar, actions, title } = await setup();
        const padding = () => parseFloat(getComputedStyle(bar()).paddingRight);
        expect(rect(bar()).right - rect(actions()).right).toBeCloseTo(padding(), 0);
        expect(rect(title()).left).toBeLessThan(rect(actions()).left);

        document.documentElement.setAttribute('dir', 'rtl');
        try {
            await fixture.whenStable();
            expect(rect(actions()).left - rect(bar()).left).toBeCloseTo(padding(), 0);
            expect(rect(title()).right).toBeGreaterThan(rect(actions()).right);
        } finally {
            document.documentElement.removeAttribute('dir');
        }
    });

    it('size sets the horizontal padding', async () => {
        const { fixture, host, bar } = await setup({ size: 's' });
        const padding = () => getComputedStyle(bar()).paddingLeft;
        expect(padding()).toBe('16px');
        host.size.set('m_l');
        await fixture.whenStable();
        expect(padding()).toBe('32px');
        host.size.set('xl');
        await fixture.whenStable();
        expect(padding()).toBe('48px');
    });

    it('the hidden attribute hides the actions', async () => {
        const { fixture, host, actions } = await setup();
        expect(actions().checkVisibility({ visibilityProperty: true })).toBe(true);
        host.actionsHidden.set(true);
        await fixture.whenStable();
        expect(actions().checkVisibility({ visibilityProperty: true })).toBe(false);
    });

    it('hides the back button and description on small screens', async () => {
        const { back, description } = await setup({ width: '100%' });
        expect(rect(back()).width).toBeGreaterThan(0);
        await page.viewport(500, 800);
        try {
            expect(getComputedStyle(back().parentElement!).display).toBe('none');
            expect(getComputedStyle(description()).display).toBe('none');
        } finally {
            await page.viewport(1280, 800);
        }
        expect(getComputedStyle(description()).display).not.toBe('none');
    });

    it('the overflow button in the actions opens its menu and gets the focus back on Escape', async () => {
        const fixture = TestBed.createComponent(MenuHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const more = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('button[aria-label=More]')!;
        await userEvent.click(more);
        await new Promise((r) => setTimeout(r, 60));
        expect(more.getAttribute('aria-expanded')).toBe('true');
        const menu = document.getElementById(more.getAttribute('aria-controls')!)!;
        expect(menu.getAttribute('role')).toBe('menu');
        // placement bottom-end: the menu ends under the end of the button
        expect(Math.abs(menu.getBoundingClientRect().right - more.getBoundingClientRect().right)).toBeLessThan(2);
        expect(document.activeElement!.textContent!.trim()).toBe('Edit');
        await userEvent.keyboard('{Escape}');
        await new Promise((r) => setTimeout(r, 60));
        expect(more.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(more);
    });
});
