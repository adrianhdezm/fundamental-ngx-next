import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Menu, MenuInteractive, MenuItem, MenuTitle } from '@/ui/menu/menu';
import { SplitButton, type MainAction } from './split-button';

@Component({
    imports: [SplitButton, Menu, MenuItem, MenuInteractive, MenuTitle],
    template: `
        <fd-split-button
            [mainAction]="mainAction()"
            [selected]="selected()"
            [disabled]="disabled()"
            [fixedWidth]="fixedWidth()"
            (primaryButtonClicked)="main.set(main() + 1)"
        >
            <fd-menu>
                <li fd-menu-item (click)="chosen.set('one')">
                    <div fd-menu-interactive><span fd-menu-title>One</span></div>
                </li>
                <li fd-menu-item #two (click)="chosen.set('two')">
                    <div fd-menu-interactive><span fd-menu-title>Two</span></div>
                </li>
                <li fd-menu-item (click)="chosen.set('long')">
                    <div fd-menu-interactive><span fd-menu-title>Three has a longer title</span></div>
                </li>
            </fd-menu>
        </fd-split-button>
    `
})
class Host {
    readonly mainAction = signal<MainAction | null>(null);
    readonly main = signal(0);
    readonly chosen = signal('');
    readonly selected = signal<MenuItem | null>(null);
    readonly disabled = signal(false);
    readonly fixedWidth = signal(true);
    readonly two = viewChild.required<MenuItem>('two');
}

const wait = (ms = 80) => new Promise((r) => setTimeout(r, ms));

async function setup(mainAction: MainAction | null = null, init: (host: Host) => void = () => {}) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mainAction.set(mainAction);
    init(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    const [main, arrow] = [...fixture.nativeElement.querySelectorAll('fd-split-button button')] as HTMLElement[];
    const option = (text: string) =>
        [...document.querySelectorAll<HTMLElement>('[data-menu-link]')].find((e) => e.textContent!.trim() === text)!;
    return { fixture, host: fixture.componentInstance, main, arrow, option };
}

describe('SplitButton', () => {
    it('shows the first item as the main action and runs it from the main button', async () => {
        const { host, main } = await setup();
        expect(main.textContent!.trim()).toBe('One');
        await userEvent.click(main);
        expect(host.main()).toBe(1);
        expect(host.chosen()).toBe('one');
    });

    it('opens the menu from the arrow and makes the chosen item the main action', async () => {
        const { fixture, host, main, arrow, option } = await setup();
        expect(arrow.getAttribute('aria-haspopup')).toBe('menu');
        await userEvent.click(arrow);
        await wait();
        expect(arrow.getAttribute('aria-expanded')).toBe('true');
        await userEvent.click(option('Two'));
        await fixture.whenStable();
        expect(host.chosen()).toBe('two');
        expect(main.textContent!.trim()).toBe('Two');
        expect(arrow.getAttribute('aria-expanded')).toBe('false');
    });

    it('keeps a constant main action and runs its callback', async () => {
        let called = 0;
        const { fixture, main, arrow, option } = await setup({
            mainActionTitle: 'Main',
            keepMainAction: true,
            callback: () => called++
        });
        expect(main.textContent!.trim()).toBe('Main');
        await userEvent.click(arrow);
        await wait();
        await userEvent.click(option('Two'));
        await fixture.whenStable();
        expect(main.textContent!.trim()).toBe('Main');
        await userEvent.click(main);
        expect(called).toBe(1);
    });

    it('the selected input sets the main action and the main button runs it', async () => {
        const { fixture, host, main } = await setup({ mainActionTitle: 'Action' });
        expect(main.textContent!.trim()).toBe('Action');
        host.selected.set(host.two());
        await fixture.whenStable();
        expect(main.textContent!.trim()).toBe('Two');
        await userEvent.click(main);
        expect(host.chosen()).toBe('two');
        expect(host.main()).toBe(1);
    });

    it('ArrowDown, Enter and Space on the arrow open the menu and focus the first item', async () => {
        const { arrow } = await setup();
        for (const key of ['{ArrowDown}', '{Enter}', ' ']) {
            arrow.focus();
            await userEvent.keyboard(key);
            await wait();
            expect(arrow.getAttribute('aria-expanded')).toBe('true');
            expect(document.activeElement!.textContent!.trim()).toBe('One');
            await userEvent.keyboard('{Escape}');
            await wait();
        }
    });

    it('Escape closes the menu and returns the focus to the arrow', async () => {
        const { arrow } = await setup();
        await userEvent.click(arrow);
        await wait();
        expect(document.activeElement!.textContent!.trim()).toBe('One');
        await userEvent.keyboard('{Escape}');
        await wait();
        expect(arrow.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(arrow);
    });

    it('disabled disables both buttons and does not open the menu', async () => {
        const { fixture, host, main, arrow } = await setup(null, (h) => h.disabled.set(true));
        expect(main.hasAttribute('disabled')).toBe(true);
        expect(arrow.hasAttribute('disabled')).toBe(true);
        arrow.click();
        main.click();
        await fixture.whenStable();
        await wait();
        expect(arrow.getAttribute('aria-expanded')).toBe('false');
        expect(document.querySelector('[role=menu]')).toBeNull();
        expect(host.main()).toBe(0);
    });

    it('aria-controls points to the open menu', async () => {
        const { arrow } = await setup();
        expect(arrow.hasAttribute('aria-controls')).toBe(false);
        await userEvent.click(arrow);
        await wait();
        const menu = document.getElementById(arrow.getAttribute('aria-controls')!)!;
        expect(menu.getAttribute('role')).toBe('menu');
        expect(menu.textContent).toContain('Two');
    });

    it('fixedWidth keeps the main button width when a longer item is chosen', async () => {
        for (const fixed of [true, false]) {
            const { fixture, main, arrow, option } = await setup(null, (h) => h.fixedWidth.set(fixed));
            const before = main.getBoundingClientRect().width;
            await userEvent.click(arrow);
            await wait();
            await userEvent.click(option('Three has a longer title'));
            await fixture.whenStable();
            expect(main.textContent!.trim()).toBe('Three has a longer title');
            const after = main.getBoundingClientRect().width;
            if (fixed) expect(after).toBeCloseTo(before, 0);
            else expect(after).toBeGreaterThan(before + 10);
            fixture.destroy();
        }
    });
});
