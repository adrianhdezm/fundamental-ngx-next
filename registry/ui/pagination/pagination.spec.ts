import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Pagination, paginationPages } from './pagination';

@Component({
    imports: [Pagination],
    template: `
        <fd-pagination
            [totalItems]="total()"
            [mobile]="mobile()"
            [itemsPerPageOptions]="[10, 25]"
            [(currentPage)]="page"
            [(itemsPerPage)]="size"
            (pageChangeStart)="requested.set($event)"
        />
    `
})
class Host {
    readonly total = signal(500);
    readonly mobile = signal(false);
    readonly page = signal(1);
    readonly size = signal(10);
    readonly requested = signal<number | null>(null);
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const button = (root: HTMLElement, label: string) =>
    root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;

async function setup(config: { total?: number; page?: number; mobile?: boolean } = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.total) host.total.set(config.total);
    if (config.page) host.page.set(config.page);
    host.mobile.set(!!config.mobile);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    return { fixture, host, root: fixture.nativeElement as HTMLElement };
}

describe('paginationPages', () => {
    it('shows all pages up to nine and ellipses beyond', () => {
        expect(paginationPages(5, 2)).toEqual([1, 2, 3, 4, 5]);
        expect(paginationPages(50, 1)).toEqual([1, 2, 3, 4, 5, 6, 7, -1, 50]);
        expect(paginationPages(50, 25)).toEqual([1, -1, 23, 24, 25, 26, 27, -1, 50]);
        expect(paginationPages(50, 50)).toEqual([1, -1, 44, 45, 46, 47, 48, 49, 50]);
    });
});

describe('Pagination', () => {
    it('goes to pages with the buttons and disables them at the ends', async () => {
        const { fixture, host, root } = await setup({ total: 50 });
        expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Pagination');
        expect(button(root, 'Previous page').disabled).toBe(true);
        await userEvent.click(button(root, 'Page 3'));
        await fixture.whenStable();
        expect(host.page()).toBe(3);
        expect(host.requested()).toBe(3);
        expect(root.querySelector('[aria-current=page]')?.textContent?.trim()).toBe('3');
        await userEvent.click(button(root, 'Next page'));
        expect(host.page()).toBe(4);
        host.page.set(5);
        await fixture.whenStable();
        expect(button(root, 'Next page').disabled).toBe(true);
        expect(root.textContent).toContain('50 Results');
    });

    it('takes a page from the input when there are more than nine pages', async () => {
        const { fixture, host, root } = await setup({ page: 30 });
        const input = root.querySelector<HTMLInputElement>('input[type=number]')!;
        expect(input.value).toBe('30');
        expect(root.textContent).toContain('of 50');
        await userEvent.clear(input);
        await userEvent.type(input, '42{Enter}');
        await fixture.whenStable();
        expect(host.page()).toBe(42);
        await userEvent.clear(input);
        await userEvent.type(input, '99');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        await userEvent.keyboard('{Enter}');
        expect(host.page()).toBe(42);
    });

    it('moves between the controls with the arrow keys as one tab stop', async () => {
        const { fixture, root } = await setup({ total: 50, page: 2 });
        const tabbable = [...root.querySelectorAll('nav [tabindex="0"]')];
        expect(tabbable).toHaveLength(1);
        expect(tabbable[0].textContent?.trim()).toBe('2');
        (tabbable[0] as HTMLElement).focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement?.textContent?.trim()).toBe('3');
        await userEvent.keyboard('{Home}');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Previous page');
        await fixture.whenStable();
        expect(root.querySelectorAll('nav [tabindex="0"]')).toHaveLength(1);
    });

    it('changes the items per page and keeps the page in range', async () => {
        const { fixture, host } = await setup({ page: 50 });
        const select = document.querySelector<HTMLElement>('fd-select [role=combobox]')!;
        await userEvent.click(select);
        await fixture.whenStable();
        await userEvent.click(
            [...document.querySelectorAll<HTMLElement>('[role=option]')].find((o) => o.textContent?.trim() === '25')!
        );
        await fixture.whenStable();
        expect(host.size()).toBe(25);
        expect(host.page()).toBe(20);
    });

    it('shows first and last buttons in mobile mode', async () => {
        const { fixture, host, root } = await setup({ mobile: true, page: 3 });
        expect(button(root, 'Page 2')).toBeNull();
        await userEvent.click(button(root, 'Last page'));
        await fixture.whenStable();
        expect(host.page()).toBe(50);
        await userEvent.click(button(root, 'First page'));
        expect(host.page()).toBe(1);
        await wait();
    });
});
