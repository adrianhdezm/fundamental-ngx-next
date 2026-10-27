import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Menu, MenuInteractive, MenuItem, MenuTitle } from '@/ui/menu/menu';
import { SplitButton, type MainAction } from './split-button';

@Component({
    imports: [SplitButton, Menu, MenuItem, MenuInteractive, MenuTitle],
    template: `
        <fd-split-button [mainAction]="mainAction()" (primaryButtonClicked)="main.set(main() + 1)">
            <fd-menu>
                <li fd-menu-item (click)="chosen.set('one')">
                    <div fd-menu-interactive><span fd-menu-title>One</span></div>
                </li>
                <li fd-menu-item (click)="chosen.set('two')">
                    <div fd-menu-interactive><span fd-menu-title>Two</span></div>
                </li>
            </fd-menu>
        </fd-split-button>
    `
})
class Host {
    readonly mainAction = signal<MainAction | null>(null);
    readonly main = signal(0);
    readonly chosen = signal('');
}

const wait = (ms = 80) => new Promise((r) => setTimeout(r, ms));

async function setup(mainAction: MainAction | null = null) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mainAction.set(mainAction);
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
});
