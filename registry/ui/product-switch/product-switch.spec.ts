import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ProductSwitch, ProductSwitchBody, type ProductSwitchItem } from './product-switch';

@Component({
    imports: [ProductSwitch, ProductSwitchBody],
    template: `
        <fd-product-switch>
            <fd-product-switch-body [(products)]="products" (itemClicked)="opened.set($event.title)" />
        </fd-product-switch>
    `
})
class Host {
    readonly opened = signal('');
    readonly products = signal<ProductSwitchItem[]>(
        Array.from({ length: 8 }, (_, i) => ({ title: `Product ${i + 1}`, icon: 'home', callback: () => undefined }))
    );
}

const wait = (ms = 100) => new Promise((r) => setTimeout(r, ms));
const focused = () => document.activeElement!.getAttribute('aria-label');

async function open() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('button')!;
    await userEvent.click(button);
    await wait();
    return { fixture, host: fixture.componentInstance, button };
}

describe('ProductSwitch', () => {
    it('opens a menu of products and focuses the first one', async () => {
        const { button } = await open();
        expect(button.getAttribute('aria-haspopup')).toBe('menu');
        expect(button.getAttribute('aria-expanded')).toBe('true');
        const items = document.querySelectorAll('[role=menu] [role=menuitem]');
        expect(items).toHaveLength(8);
        expect(items[3].getAttribute('aria-posinset')).toBe('4');
        expect(focused()).toBe('Product 1');
    });

    it('moves through the grid with the arrow keys', async () => {
        await open();
        await userEvent.keyboard('{ArrowRight}');
        expect(focused()).toBe('Product 2');
        await userEvent.keyboard('{ArrowDown}');
        expect(focused()).toBe('Product 6');
        await userEvent.keyboard('{ArrowUp}{ArrowLeft}');
        expect(focused()).toBe('Product 1');
        await userEvent.keyboard('{End}{ArrowRight}');
        expect(focused()).toBe('Product 1');
    });

    it('renders a subtitle only when given and an anchor only for items with a url', async () => {
        const fixture = TestBed.createComponent(Host);
        fixture.componentInstance.products.set([
            { title: 'Default', subtitle: 'New tab', icon: 'home', url: 'https://example.com/a' },
            { title: 'Same tab', icon: 'home', url: 'https://example.com/b', target: '_self' },
            { title: 'Callback', icon: 'home', callback: () => undefined }
        ]);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        await userEvent.click((fixture.nativeElement as HTMLElement).querySelector('button')!);
        await wait();
        const items = Array.from(document.querySelectorAll<HTMLElement>('[role=menuitem]'));
        expect(items.map((item) => item.textContent!.replace(/\s+/g, ' ').trim())).toEqual([
            'Default New tab',
            'Same tab',
            'Callback'
        ]);
        const links = items.map((item) => item.querySelector('a'));
        expect(links[0]!.getAttribute('href')).toBe('https://example.com/a');
        expect(links[0]!.target).toBe('_blank');
        expect(links[1]!.target).toBe('_self');
        expect(links[2]).toBeNull();
        // the link is for the browser only: the item is the menu item, so it is not focusable or exposed
        expect(links[0]!.getAttribute('aria-hidden')).toBe('true');
        expect(links[0]!.tabIndex).toBe(-1);
        expect(items[0].getAttribute('aria-label')).toBe('Default New tab Opens in a new tab');
        expect(items[1].getAttribute('aria-label')).toBe('Same tab');
    });

    it('opens a product with Enter and closes, returning the focus', async () => {
        const { host, button } = await open();
        await userEvent.keyboard('{ArrowRight}{Enter}');
        await wait();
        expect(host.opened()).toBe('Product 2');
        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(button);
    });
});
