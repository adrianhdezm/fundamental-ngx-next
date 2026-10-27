import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { OverflowExpand, OverflowItemRef, OverflowLayout, OverflowLayoutItem } from './overflow-layout';

@Component({
    imports: [OverflowLayout, OverflowItemRef, OverflowLayoutItem],
    template: `
        <div [style.width.px]="width()">
            <fd-overflow-layout
                ariaRole="list"
                ariaLabel="Tags"
                [maxVisibleItems]="max()"
                [showMorePosition]="position()"
                [reverseHiddenItems]="reverse()"
                (visibleItemsCount)="visible.set($event)"
                (hiddenItemsCount)="hidden.set($event)"
                (hiddenItemsChange)="hiddenLabels.set($any($event).map(label))"
            >
                @for (item of items(); track item) {
                    <button
                        *fdOverflowItemRef="item; let isHidden; let globalIndex = globalIndex"
                        fdOverflowLayoutItem
                        [forceVisibility]="forced() === item"
                        (hiddenChange)="moves.push(item + ':' + $event)"
                        (click)="isHidden && forced.set(item)"
                        [attr.data-hidden]="isHidden"
                        [attr.data-index]="globalIndex"
                        [style.width.px]="itemWidth()"
                        style="flex: none"
                    >
                        {{ item }}
                    </button>
                }
            </fd-overflow-layout>
        </div>
    `
})
class Host {
    readonly layout = viewChild.required(OverflowLayout);
    readonly width = signal(450);
    readonly itemWidth = signal(100);
    readonly items = signal(['A', 'B', 'C', 'D', 'E']);
    readonly max = signal(Number.POSITIVE_INFINITY);
    readonly position = signal<'left' | 'right'>('right');
    readonly reverse = signal(false);
    readonly forced = signal<string | null>(null);
    readonly visible = signal<number | null>(null);
    readonly hidden = signal<number | null>(null);
    readonly hiddenLabels = signal<string[]>([]);
    readonly moves: string[] = [];
    readonly label = (ref: OverflowItemRef) => ref.fdOverflowItemRef() as string;
}

@Component({
    imports: [OverflowLayout, OverflowItemRef, OverflowExpand],
    template: `
        <div style="width: 350px">
            <fd-overflow-layout>
                @for (item of items; track item) {
                    <span *fdOverflowItemRef="item" style="display: inline-block; width: 100px; flex: none">{{
                        item
                    }}</span>
                }
                <ng-template fdOverflowExpand let-hiddenItems>
                    <button id="custom">{{ names(hiddenItems) }}</button>
                </ng-template>
            </fd-overflow-layout>
        </div>
    `
})
class CustomHost {
    readonly items = ['A', 'B', 'C', 'D', 'E'];
    names(refs: OverflowItemRef[]): string {
        return refs.map((ref) => ref.fdOverflowItemRef()).join(',');
    }
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function setup(config: Partial<{ width: number; max: number; position: 'left' | 'right' }> = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.width) host.width.set(config.width);
    if (config.max) host.max.set(config.max);
    if (config.position) host.position.set(config.position);
    document.body.appendChild(fixture.nativeElement);
    const root = fixture.nativeElement as HTMLElement;
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await frame();
        await fixture.whenStable();
    };
    await stable();
    const row = () => root.querySelector<HTMLElement>('[role="list"]')!;
    return {
        fixture,
        host,
        root,
        stable,
        row,
        visibleLabels: () =>
            [...row().querySelectorAll<HTMLElement>(':scope > [data-overflow-item] button')].map((b) =>
                b.textContent!.trim()
            ),
        visibleButtons: () => [...row().querySelectorAll<HTMLButtonElement>(':scope > [data-overflow-item] button')],
        moreButton: () =>
            [...root.querySelectorAll<HTMLButtonElement>('fd-overflow-layout button')].find((b) =>
                b.textContent!.trim().endsWith('more')
            ),
        popoverLabels: () =>
            [...document.querySelectorAll<HTMLElement>('.cdk-overlay-container [data-hidden]')].map((b) =>
                b.textContent!.trim()
            )
    };
}

describe('OverflowLayout', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('dir');
        document.querySelector('.cdk-overlay-container')?.replaceChildren();
    });

    it('shows as many items as fit in the row (and at most maxVisibleItems); the rest go into the "N more" popover', async () => {
        const { host, stable, row, visibleLabels, moreButton, popoverLabels } = await setup();
        expect(row().getAttribute('aria-label')).toBe('Tags');
        expect(row().querySelector('[data-overflow-item]')!.getAttribute('role')).toBe('listitem');
        expect(visibleLabels()).toEqual(['A', 'B', 'C']);
        expect(moreButton()!.textContent!.trim()).toBe('2 more');
        // the items and the more button fit into the layout
        const layout = row().parentElement!.getBoundingClientRect();
        expect(moreButton()!.getBoundingClientRect().right).toBeLessThanOrEqual(layout.right);

        await userEvent.click(moreButton()!);
        await stable();
        expect(popoverLabels()).toEqual(['D', 'E']);
        // the popover dialog is named like the button that opens it
        const body = document.querySelector<HTMLElement>('.cdk-overlay-container fd-popover-body [role=dialog]')!;
        expect(body.getAttribute('role')).toBe('dialog');
        expect(body.getAttribute('aria-label')).toBe('2 more');
        const popoverItems = [...document.querySelectorAll<HTMLElement>('.cdk-overlay-container [data-hidden]')];
        // the item template knows it renders in the popover and its index among all items
        expect(popoverItems.map((b) => b.dataset['hidden'])).toEqual(['true', 'true']);
        expect(popoverItems.map((b) => b.dataset['index'])).toEqual(['3', '4']);
        expect(row().querySelector('button')!.dataset['hidden']).toBe('false');

        host.max.set(2);
        await stable();
        expect(visibleLabels()).toEqual(['A', 'B']);
        expect(moreButton()!.textContent!.trim()).toBe('3 more');

        host.max.set(Number.POSITIVE_INFINITY);
        host.width.set(1000);
        await stable();
        expect(visibleLabels()).toEqual(['A', 'B', 'C', 'D', 'E']);
        expect(moreButton()).toBeUndefined();
    });

    it('forceVisibility keeps an item visible; hiddenChange emits on moves', async () => {
        const { host, stable, visibleLabels } = await setup();
        // the first layout moved the items that do not fit
        expect(host.moves).toEqual(['D:true', 'E:true']);
        host.moves.length = 0;
        host.forced.set('E');
        await stable();
        expect(visibleLabels()).toEqual(['A', 'B', 'E']);
        expect([...host.moves].sort()).toEqual(['C:true', 'E:false']);
        host.forced.set(null);
        await stable();
        expect(visibleLabels()).toEqual(['A', 'B', 'C']);
        expect([...host.moves].sort()).toEqual(['C:false', 'C:true', 'E:false', 'E:true']);
        // a forced item stays visible when the layout gets narrower
        host.forced.set('A');
        await stable();
        host.width.set(200);
        await stable();
        expect(visibleLabels()).toEqual(['A']);
    });

    it('showMorePosition left overflows from the start; reverseHiddenItems reverses the popover order', async () => {
        const { host, root, stable, visibleLabels, moreButton, popoverLabels } = await setup({ position: 'left' });
        expect(visibleLabels()).toEqual(['C', 'D', 'E']);
        const layout = root.querySelector('fd-overflow-layout')!;
        expect(layout.firstElementChild!.contains(moreButton()!)).toBe(true);
        expect(moreButton()!.getBoundingClientRect().right).toBeLessThanOrEqual(
            root.querySelector('[role="list"]')!.getBoundingClientRect().left
        );
        await userEvent.click(moreButton()!);
        await stable();
        expect(popoverLabels()).toEqual(['A', 'B']);
        host.reverse.set(true);
        await stable();
        expect(popoverLabels()).toEqual(['B', 'A']);
    });

    it('custom fdOverflowExpand template receives the hidden items', async () => {
        const fixture = TestBed.createComponent(CustomHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        await frame();
        await frame();
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        expect(root.querySelector('#custom')!.textContent).toBe('D,E');
        expect(root.querySelector('fd-popover')).toBeNull();
    });

    it('visibleItemsCount / hiddenItemsCount / hiddenItemsChange emit after resizes and item changes', async () => {
        const { host, stable } = await setup();
        expect([host.visible(), host.hidden()]).toEqual([3, 2]);
        expect(host.hiddenLabels()).toEqual(['D', 'E']);
        host.width.set(300);
        await stable();
        expect([host.visible(), host.hidden()]).toEqual([2, 3]);
        expect(host.hiddenLabels()).toEqual(['C', 'D', 'E']);
        host.items.set(['A', 'B']);
        await stable();
        expect([host.visible(), host.hidden()]).toEqual([2, 0]);
        expect(host.hiddenLabels()).toEqual([]);
        host.items.set(['A', 'B', 'C', 'D', 'E', 'F']);
        await stable();
        expect([host.visible(), host.hidden()]).toEqual([2, 4]);
        expect(host.hiddenLabels()).toEqual(['C', 'D', 'E', 'F']);
    });

    it('arrow keys move focus between visible focusable items (RTL aware)', async () => {
        const { visibleButtons } = await setup();
        const [a, b, c] = visibleButtons();
        a.focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(b);
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(c);
        // the last visible item does not move to the more button
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(c);
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(b);

        document.documentElement.setAttribute('dir', 'rtl');
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(a);
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(b);
    });

    it('triggerRecalculation re-measures after content changes', async () => {
        const { host, stable, visibleLabels } = await setup({ width: 1000 });
        expect(visibleLabels()).toEqual(['A', 'B', 'C', 'D', 'E']);
        host.itemWidth.set(300);
        await stable();
        host.layout().triggerRecalculation();
        await stable();
        expect(visibleLabels()).toEqual(['A', 'B', 'C']);
        host.itemWidth.set(100);
        await stable();
        host.layout().triggerRecalculation();
        await stable();
        expect(visibleLabels()).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('re-measures by itself when the items change width, without triggerRecalculation', async () => {
        const { host, stable, visibleLabels } = await setup({ width: 1000 });
        expect(visibleLabels()).toEqual(['A', 'B', 'C', 'D', 'E']);
        host.itemWidth.set(300);
        await stable();
        await stable();
        expect(visibleLabels()).toEqual(['A', 'B', 'C']);
        host.itemWidth.set(100);
        await stable();
        await stable();
        expect(visibleLabels()).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('moves a hidden item out of the popover when a click forces its visibility', async () => {
        const { host, stable, visibleLabels, moreButton, popoverLabels } = await setup();
        await userEvent.click(moreButton()!);
        await stable();
        expect(popoverLabels()).toEqual(['D', 'E']);
        await userEvent.click(
            [...document.querySelectorAll<HTMLElement>('.cdk-overlay-container [data-hidden]')].find(
                (b) => b.textContent!.trim() === 'E'
            )!
        );
        await stable();
        expect(host.forced()).toBe('E');
        expect(visibleLabels()).toEqual(['A', 'B', 'E']);
        expect(popoverLabels()).toEqual(['C', 'D']);
    });
});
