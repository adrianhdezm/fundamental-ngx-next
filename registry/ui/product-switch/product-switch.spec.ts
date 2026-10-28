import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ProductSwitch, ProductSwitchBody, ProductSwitchButton, type ProductSwitchItem } from './product-switch';

const products = (count: number): ProductSwitchItem[] =>
    Array.from({ length: count }, (_, i) => ({ title: `Product ${i + 1}`, icon: 'home', callback: () => undefined }));

@Component({
    imports: [ProductSwitch, ProductSwitchBody, ProductSwitchButton],
    template: `
        <fd-product-switch
            [(isOpen)]="isOpen"
            [disabled]="disabled()"
            (isOpenChange)="openChanges.set(openChanges() + 1)"
        >
            @if (custom()) {
                <ng-template fdProductSwitchButton>
                    <button type="button" class="custom" aria-haspopup="menu">Products</button>
                </ng-template>
            }
            <fd-product-switch-body
                [(products)]="products"
                [busy]="busy()"
                [forceListMode]="list()"
                [dragAndDropEnabled]="dnd()"
                (itemClicked)="opened.set($event.title)"
            />
        </fd-product-switch>
    `
})
class Host {
    readonly opened = signal('');
    readonly products = signal<ProductSwitchItem[]>(products(8));
    readonly isOpen = signal(false);
    readonly openChanges = signal(0);
    readonly disabled = signal(false);
    readonly custom = signal(false);
    readonly busy = signal(false);
    readonly list = signal(false);
    readonly dnd = signal(true);
}

const wait = (ms = 100) => new Promise((r) => setTimeout(r, ms));
const focused = () => document.activeElement!.getAttribute('aria-label');
const items = () => Array.from(document.querySelectorAll<HTMLElement>('[role=menu] [role=menuitem]'));
const titles = (list: ProductSwitchItem[]) => list.map((p) => p.title);

async function render(setup: (host: Host) => void = () => undefined) {
    const fixture = TestBed.createComponent(Host);
    setup(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('button')!;
    return { fixture, host: fixture.componentInstance, button };
}

async function open(setup?: (host: Host) => void) {
    const rendered = await render(setup);
    await userEvent.click(rendered.button);
    await wait();
    return rendered;
}

/** Number of items in the first row of the grid. */
function columns(): number {
    const top = items()[0].getBoundingClientRect().top;
    return items().filter((item) => Math.abs(item.getBoundingClientRect().top - top) < 1).length;
}

const center = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
};
const mouse = (type: string, at: { clientX: number; clientY: number }) =>
    new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: 1, detail: 1, view: window, ...at });

/** Drags `from` onto `to` with the mouse, as the CDK sees it, and returns once the drop is done. */
async function drag(from: HTMLElement, to: HTMLElement): Promise<void> {
    const start = center(from);
    const end = center(to);
    from.dispatchEvent(mouse('mousedown', start));
    for (let step = 1; step <= 10; step++) {
        const at = {
            clientX: start.clientX + ((end.clientX - start.clientX) * step) / 10,
            clientY: start.clientY + ((end.clientY - start.clientY) * step) / 10
        };
        document.dispatchEvent(mouse('mousemove', at));
        await new Promise(requestAnimationFrame);
    }
    document.dispatchEvent(mouse('mouseup', end));
}

describe('ProductSwitch', () => {
    afterEach(() => vi.restoreAllMocks());

    it('opens a menu of products and focuses the first one', async () => {
        const { button } = await open();
        expect(button.getAttribute('aria-haspopup')).toBe('menu');
        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(items()).toHaveLength(8);
        expect(items()[3].getAttribute('aria-posinset')).toBe('4');
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

    it('ArrowDown/ArrowUp move by three columns with 3–6 products', async () => {
        await open((host) => host.products.set(products(6)));
        await userEvent.keyboard('{ArrowRight}{ArrowDown}');
        expect(focused()).toBe('Product 5');
        await userEvent.keyboard('{ArrowUp}');
        expect(focused()).toBe('Product 2');
    });

    it('lays out two, three or four columns by product count', async () => {
        const { host } = await open((h) => h.products.set(products(2)));
        expect(columns()).toBe(2);
        host.products.set(products(6));
        await wait();
        expect(columns()).toBe(3);
        host.products.set(products(8));
        await wait();
        expect(columns()).toBe(4);
    });

    it('forceListMode shows a list where ArrowDown/ArrowUp wrap', async () => {
        await open((host) => {
            host.list.set(true);
            host.products.set(products(3));
        });
        expect(columns()).toBe(1);
        await userEvent.keyboard('{ArrowUp}');
        expect(focused()).toBe('Product 3');
        await userEvent.keyboard('{ArrowDown}');
        expect(focused()).toBe('Product 1');
        await userEvent.keyboard('{ArrowDown}');
        expect(focused()).toBe('Product 2');
    });

    it('busy shows the busy indicator', async () => {
        const { host } = await open();
        expect(document.querySelector('[role=progressbar]')).toBeNull();
        host.busy.set(true);
        await wait();
        const indicator = document.querySelector('[role=progressbar]')!;
        expect(indicator.getAttribute('aria-busy')).toBe('true');
        expect(indicator.contains(items()[0])).toBe(true);
    });

    it('renders a subtitle only when given and an anchor only for items with a url', async () => {
        await open((host) =>
            host.products.set([
                { title: 'Default', subtitle: 'New tab', icon: 'home', url: 'https://example.com/a' },
                { title: 'Same tab', icon: 'home', url: 'https://example.com/b', target: '_self' },
                { title: 'Callback', icon: 'home', callback: () => undefined }
            ])
        );
        expect(items().map((item) => item.textContent!.replace(/\s+/g, ' ').trim())).toEqual([
            'Default New tab',
            'Same tab',
            'Callback'
        ]);
        const links = items().map((item) => item.querySelector('a'));
        expect(links[0]!.getAttribute('href')).toBe('https://example.com/a');
        expect(links[0]!.target).toBe('_blank');
        expect(links[1]!.target).toBe('_self');
        expect(links[2]).toBeNull();
        // the link is for the browser only: the item is the menu item, so it is not focusable or exposed
        expect(links[0]!.getAttribute('aria-hidden')).toBe('true');
        expect(links[0]!.tabIndex).toBe(-1);
        expect(items()[0].getAttribute('aria-label')).toBe('Default New tab Opens in a new tab');
        expect(items()[1].getAttribute('aria-label')).toBe('Same tab');
    });

    it('url items open with window.open in _blank by default or their target, not when a callback is set', async () => {
        const windowOpen = vi.spyOn(window, 'open').mockReturnValue(null);
        const callback = vi.fn();
        const list: ProductSwitchItem[] = [
            { title: 'Default', icon: 'home', url: 'https://example.com/a' },
            { title: 'Same tab', icon: 'home', url: 'https://example.com/b', target: '_self' },
            { title: 'Callback', icon: 'home', url: 'https://example.com/c', callback },
            { title: 'Nothing', icon: 'home' }
        ];
        const { host, button } = await open((h) => h.products.set(list));
        await userEvent.click(items()[0]);
        expect(windowOpen).toHaveBeenLastCalledWith('https://example.com/a', '_blank');
        for (const index of [1, 2, 3]) {
            await userEvent.click(button);
            await wait();
            await userEvent.click(items()[index]);
        }
        expect(windowOpen).toHaveBeenCalledTimes(2);
        expect(windowOpen).toHaveBeenLastCalledWith('https://example.com/b', '_self');
        expect(callback).toHaveBeenCalledOnce();
        expect(host.opened()).toBe('Nothing');
    });

    it('the callback receives the click event', async () => {
        const callback = vi.fn();
        await open((host) => host.products.set([{ title: 'One', icon: 'home', callback }]));
        const item = items()[0];
        await userEvent.click(item);
        expect(callback).toHaveBeenCalledOnce();
        const event = callback.mock.calls[0][0] as MouseEvent;
        expect(event).toBeInstanceOf(MouseEvent);
        expect(event.type).toBe('click');
        expect(item.contains(event.target as Node)).toBe(true);
    });

    it('Space opens the focused product', async () => {
        const { host, button } = await open();
        await userEvent.keyboard('{ArrowRight}{ArrowRight}[Space]');
        await wait();
        expect(host.opened()).toBe('Product 3');
        expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    it('setting isOpen opens the menu and isOpenChange is not emitted on init', async () => {
        const { fixture, host, button } = await render();
        expect(host.openChanges()).toBe(0);
        expect(items()).toHaveLength(0);
        host.isOpen.set(true);
        await fixture.whenStable();
        await wait();
        expect(items()).toHaveLength(8);
        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(host.openChanges()).toBe(0);
        await userEvent.keyboard('{Escape}');
        await wait();
        expect(host.isOpen()).toBe(false);
        expect(host.openChanges()).toBe(1);
    });

    it('a disabled product switch does not open', async () => {
        const { host, button } = await render((h) => h.disabled.set(true));
        button.click();
        button.focus();
        await userEvent.keyboard('{Enter}');
        await wait();
        expect(items()).toHaveLength(0);
        expect(host.isOpen()).toBe(false);
    });

    it('a custom fdProductSwitchButton replaces the grid button', async () => {
        const { fixture, button } = await open((host) => host.custom.set(true));
        const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
        expect(buttons).toHaveLength(1);
        expect(button.classList).toContain('custom');
        expect(button.textContent).toBe('Products');
        expect(items()).toHaveLength(8);
    });

    it('dropping an item emits the reordered products, sticky items keep their place', async () => {
        const { host } = await open((h) =>
            h.products.set([
                { title: 'Home', icon: 'home', stickToPosition: true, disabledDragAndDrop: true },
                ...products(7).slice(1)
            ])
        );
        await drag(items()[2], items()[4]);
        await wait();
        expect(titles(host.products())).toEqual([
            'Home',
            'Product 2',
            'Product 4',
            'Product 5',
            'Product 3',
            'Product 6',
            'Product 7'
        ]);
        // nothing can be sorted into the place of a sticky item
        await drag(items()[1], items()[0]);
        await wait();
        expect(titles(host.products())[0]).toBe('Home');
    });

    it('a click that ends a drag does not open the product, the next click does', async () => {
        const { host } = await open();
        const item = items()[1];
        await drag(item, items()[3]);
        // the browser fires a click on mouseup
        item.click();
        expect(host.opened()).toBe('');
        await wait();
        items()[0].click();
        expect(host.opened()).toBe('Product 1');
    });

    it('dragAndDropEnabled false or disabledDragAndDrop makes items not draggable', async () => {
        const { host } = await open((h) =>
            h.products.set([{ title: 'Fixed', icon: 'home', disabledDragAndDrop: true }, ...products(3).slice(1)])
        );
        const before = titles(host.products());
        await drag(items()[0], items()[2]);
        await wait();
        expect(titles(host.products())).toEqual(before);

        host.dnd.set(false);
        await wait();
        await drag(items()[1], items()[2]);
        await wait();
        expect(titles(host.products())).toEqual(before);
    });
});
