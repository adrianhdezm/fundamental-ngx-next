import { Component, ElementRef, signal, viewChild, viewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import {
    Toolbar,
    ToolbarItem,
    ToolbarLabel,
    ToolbarSeparator,
    ToolbarSpacer,
    toolbarOverflow,
    type OverflowPriority,
    type ToolbarOverflowItem
} from './toolbar';

@Component({
    imports: [Toolbar, ToolbarItem, ToolbarSpacer],
    template: `
        <div [style.width.px]="width()">
            <fd-toolbar shouldOverflow [forceOverflow]="force()" ariaLabel="Actions" [(overflowOpen)]="open">
                <fd-toolbar-spacer />
                <button #item fd-toolbar-item id="a" style="width: 100px">A</button>
                <button #item fd-toolbar-item id="b" fdOverflowPriority="low" style="width: 100px">B</button>
                <button #item fd-toolbar-item id="c" [fdOverflowGroup]="1" style="width: 100px">C</button>
                <button #item fd-toolbar-item id="d" [fdOverflowGroup]="1" style="width: 100px">D</button>
                <button #item fd-toolbar-item id="e" fdOverflowPriority="never" style="width: 100px">E</button>
                <button #item fd-toolbar-item id="g" fdOverflowPriority="disappear" style="width: 100px">G</button>
                <button #item fd-toolbar-item id="f" fdOverflowPriority="always" style="width: 100px">F</button>
            </fd-toolbar>
        </div>
    `
})
class OverflowHost {
    readonly toolbar = viewChild.required(Toolbar);
    readonly items = viewChildren('item', { read: ElementRef });
    readonly width = signal(1000);
    readonly force = signal(false);
    readonly open = signal(false);
}

@Component({
    imports: [Toolbar, ToolbarSpacer, ToolbarSeparator, ToolbarLabel],
    template: `
        <fd-toolbar [title]="title()" [headingLevel]="3" [ariaOrientation]="orientation()" style="width: 600px">
            <span fd-toolbar-label id="label">Filtered by category</span>
            <fd-toolbar-spacer id="fixed" fixed width="50px" />
            <button id="one">One</button>
            <fd-toolbar-separator />
            <fd-toolbar-spacer id="flex" />
            <button id="two">Two</button>
        </fd-toolbar>
    `
})
class PartsHost {
    readonly title = signal<string | null>('Products');
    readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
}

@Component({
    imports: [Toolbar, ToolbarLabel],
    template: `
        <fd-toolbar fdType="info" [active]="active()" ariaLabel="Filter info" (click)="clicks = clicks + 1">
            <span fd-toolbar-label>Filtered by Category</span>
        </fd-toolbar>
    `
})
class InfoHost {
    readonly active = signal(true);
    clicks = 0;
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function render<T>(type: new () => T) {
    const fixture = TestBed.createComponent(type);
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await frame();
        await fixture.whenStable();
    };
    await stable();
    return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement, stable };
}

async function setupOverflow(width = 1000) {
    const fixture = TestBed.createComponent(OverflowHost);
    fixture.componentInstance.width.set(width);
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await frame();
        await fixture.whenStable();
    };
    await stable();
    const root = fixture.nativeElement as HTMLElement;
    const toolbar = root.querySelector<HTMLElement>('fd-toolbar')!;
    const moreButton = () => toolbar.querySelector<HTMLButtonElement>('button[aria-haspopup]');
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        stable,
        toolbar,
        moreButton,
        /** Ids of the items in the toolbar row, in DOM order. */
        inRow: () => [...toolbar.querySelectorAll<HTMLElement>(':scope > button[id]')].map((b) => b.id),
        /** Ids of the items in the overflow panel, wherever it is. */
        inPanel: () => {
            const panel = fixture.componentInstance
                .items()
                .map((ref) => (ref.nativeElement as HTMLElement).parentElement!)
                .find((parent) => parent.hasAttribute('data-toolbar-overflow'));
            return panel ? [...panel.querySelectorAll<HTMLElement>(':scope > button[id]')].map((b) => b.id) : [];
        },
        open: async () => {
            await userEvent.click(moreButton()!);
            await stable();
        }
    };
}

describe('Toolbar', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('data-density');
        document.querySelector('.cdk-overlay-container')?.replaceChildren();
    });

    it('shouldOverflow moves items that do not fit into the overflow popover, by priority and group', async () => {
        const { inRow, inPanel, moreButton, open, root } = await setupOverflow(500);
        // never stays, the high item stays longer than the low one, and C overflows with D (same group)
        expect(inRow()).toEqual(['a', 'e']);
        expect(inPanel()).toEqual(['d', 'c', 'b', 'g', 'f']);
        const more = moreButton()!;
        expect(more.getAttribute('aria-label')).toBe('More');
        expect(more.title).toBe('More');
        // a separator divides the items from the more button
        expect(more.closest('fd-popover')!.previousElementSibling!.getAttribute('role')).toBe('separator');

        await open();
        const overlay = document.querySelector('.cdk-overlay-container')!;
        expect([...overlay.querySelectorAll('[data-toolbar-overflow] > button')].map((b) => b.id)).toEqual([
            'd',
            'c',
            'b',
            'g',
            'f'
        ]);
        // disappear items are not shown in the popover
        expect(getComputedStyle(overlay.querySelector('#g')!).display).toBe('none');
        // the first item of the popover takes the focus
        expect(document.activeElement).toBe(overlay.querySelector('#d'));
        expect(root.querySelector('#d')).toBeNull();
    });

    it('always items overflow even when there is room', async () => {
        const { inRow, inPanel, moreButton } = await setupOverflow(1000);
        expect(inRow()).toEqual(['a', 'b', 'c', 'd', 'e', 'g']);
        expect(inPanel()).toEqual(['f']);
        expect(moreButton()).not.toBeNull();
    });

    it('forceOverflow puts all overflowable items in the popover', async () => {
        const { host, stable, inRow, inPanel } = await setupOverflow(1000);
        host.force.set(true);
        await stable();
        expect(inRow()).toEqual([]);
        expect(inPanel().sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        host.force.set(false);
        await stable();
        expect(inRow()).toEqual(['a', 'b', 'c', 'd', 'e', 'g']);
    });

    it('overflown items are restored to their places when there is room; placeholders keep the order', async () => {
        const { host, stable, inRow, inPanel, open, moreButton } = await setupOverflow(500);
        await open();
        expect(host.open()).toBe(true);
        host.width.set(1000);
        await stable();
        expect(inRow()).toEqual(['a', 'b', 'c', 'd', 'e', 'g']);
        expect(inPanel()).toEqual(['f']);
        // restored items are visible again
        expect(getComputedStyle(document.querySelector('#g')!).display).not.toBe('none');
        host.width.set(500);
        await stable();
        expect(inRow()).toEqual(['a', 'e']);
        host.width.set(1000);
        await stable();
        expect(inRow()).toEqual(['a', 'b', 'c', 'd', 'e', 'g']);
        expect(moreButton()).not.toBeNull();
    });

    it('updateCollapsibleItems recomputes the overflow after items change their width', async () => {
        const { host, stable, root, inRow } = await setupOverflow(1000);
        expect(inRow()).toEqual(['a', 'b', 'c', 'd', 'e', 'g']);
        root.querySelectorAll<HTMLElement>('fd-toolbar > button').forEach((b) => (b.style.width = '200px'));
        host.toolbar().updateCollapsibleItems();
        await stable();
        expect(inRow()).not.toContain('b');
        expect(inRow()).toContain('a');
        expect(inRow()).toContain('e');
    });

    it('spacer, separator, label; title renders a heading', async () => {
        const { root, host, stable } = await render(PartsHost);
        const toolbar = root.querySelector<HTMLElement>('fd-toolbar')!;
        const heading = toolbar.querySelector<HTMLElement>('[role="heading"]')!;
        expect(heading.textContent).toBe('Products');
        expect(heading.getAttribute('aria-level')).toBe('3');
        expect(heading.title).toBe('Products');
        expect(toolbar.firstElementChild).toBe(heading);
        expect(toolbar.getAttribute('aria-labelledby')).toBe(heading.id);
        await expect.element(page.getByRole('toolbar', { name: 'Products' })).toBeInTheDocument();

        expect(root.querySelector('#fixed')!.getBoundingClientRect().width).toBe(50);
        // the flexible spacer pushes the last button to the end
        const end = toolbar.getBoundingClientRect().right - parseFloat(getComputedStyle(toolbar).paddingRight);
        expect(root.querySelector('#two')!.getBoundingClientRect().right).toBeCloseTo(end, 0);
        expect(root.querySelector('#flex')!.getBoundingClientRect().width).toBeGreaterThan(100);
        const separator = root.querySelector<HTMLElement>('fd-toolbar-separator')!;
        expect(separator.getAttribute('role')).toBe('separator');
        expect(separator.getBoundingClientRect().width).toBe(1);
        expect(separator.getBoundingClientRect().height).toBe(32);
        const label = root.querySelector<HTMLElement>('#label')!;
        expect(getComputedStyle(label).textOverflow).toBe('ellipsis');

        host.title.set(null);
        await stable();
        expect(toolbar.querySelector('[role="heading"]')).toBeNull();
        expect(toolbar.getAttribute('aria-labelledby')).toBeNull();
    });

    it('info (active) type is clickable with keyboard', async () => {
        const { root, host, stable } = await render(InfoHost);
        const toolbar = root.querySelector<HTMLElement>('fd-toolbar')!;
        expect(toolbar.tabIndex).toBe(0);
        await userEvent.click(toolbar);
        expect(host.clicks).toBe(1);
        toolbar.focus();
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toBe(2);
        await userEvent.keyboard(' ');
        expect(host.clicks).toBe(3);

        host.active.set(false);
        await stable();
        expect(toolbar.hasAttribute('tabindex')).toBe(false);
        toolbar.focus();
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toBe(3);
    });

    it('role toolbar with orientation and labelling', async () => {
        const { root, host, stable } = await render(PartsHost);
        const toolbar = root.querySelector<HTMLElement>('fd-toolbar')!;
        expect(toolbar.getAttribute('role')).toBe('toolbar');
        expect(toolbar.getAttribute('aria-orientation')).toBe('horizontal');
        host.orientation.set('vertical');
        await stable();
        expect(toolbar.getAttribute('aria-orientation')).toBe('vertical');
        expect(toolbar.id).toMatch(/^fd-toolbar-\d+$/);

        const overflow = await setupOverflow();
        expect(overflow.toolbar.getAttribute('aria-label')).toBe('Actions');
        expect(overflow.toolbar.getAttribute('aria-labelledby')).toBeNull();
    });

    it('compact density makes the toolbar lower', async () => {
        const { root } = await render(PartsHost);
        const toolbar = root.querySelector<HTMLElement>('fd-toolbar')!;
        // a toolbar with a title keeps its height
        expect(toolbar.getBoundingClientRect().height).toBe(44);
        document.documentElement.setAttribute('data-density', 'compact');
        expect(toolbar.getBoundingClientRect().height).toBe(44);
        document.documentElement.removeAttribute('data-density');

        const { toolbar: plain, stable, inRow } = await setupOverflow(500);
        expect(plain.getBoundingClientRect().height).toBe(44);
        expect(inRow()).toEqual(['a', 'e']);
        document.documentElement.setAttribute('data-density', 'compact');
        expect(plain.getBoundingClientRect().height).toBe(32);
        expect(getComputedStyle(plain.querySelector('fd-toolbar-separator')!).height).toBe('24px');
    });
});

describe('toolbarOverflow', () => {
    const item = (priority: OverflowPriority, group = 0, width = 98): ToolbarOverflowItem & { name: string } => ({
        name: `${priority}${group}`,
        priority,
        group,
        width
    });

    it('keeps the items that fit, highest priority first, and overflows the rest', () => {
        const items = [item('low'), item('high'), item('never'), item('always')];
        const names = (available: number) => toolbarOverflow(items, available, 0).map((i) => i.name);
        expect(names(1000)).toEqual(['always0']);
        expect(names(250)).toEqual(['low0', 'always0']);
        expect(names(150)).toEqual(['high0', 'low0', 'always0']);
        // the used width (a title) counts
        expect(toolbarOverflow(items, 250, 100).map((i) => i.name)).toEqual(['high0', 'low0', 'always0']);
    });

    it('overflows a group as a whole, but not its never members', () => {
        const items = [item('high', 1), item('low', 1), item('never', 1), item('high')];
        // only low1 does not fit, but its group overflows with it
        expect(toolbarOverflow(items, 250, 0).map((i) => i.name)).toEqual(['high0', 'high1', 'low1']);
        expect(toolbarOverflow(items, 1000, 0)).toEqual([]);
    });
});
