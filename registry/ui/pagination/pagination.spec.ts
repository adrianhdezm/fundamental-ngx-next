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
            [itemsPerPageOptions]="options()"
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
    readonly options = signal([10, 25]);
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

    it('shows only one ellipsis while the current page is near an end', () => {
        expect(paginationPages(50, 2)).toEqual([1, 2, 3, 4, 5, 6, 7, -1, 50]);
        expect(paginationPages(50, 5)).toEqual([1, 2, 3, 4, 5, 6, 7, -1, 50]);
        expect(paginationPages(50, 6)).toEqual([1, -1, 4, 5, 6, 7, 8, -1, 50]);
        expect(paginationPages(50, 46)).toEqual([1, -1, 44, 45, 46, 47, 48, 49, 50]);
        expect(paginationPages(50, 49)).toEqual([1, -1, 44, 45, 46, 47, 48, 49, 50]);
        expect(paginationPages(10, 9)).toEqual([1, -1, 4, 5, 6, 7, 8, 9, 10]);
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

    it('shows the "Page:" and "of" labels of the input in the mobile layout only, naming the input in both', async () => {
        const { fixture, host, root } = await setup({ page: 30 });
        const labels = () => [...root.querySelectorAll<HTMLElement>('nav span[id]')];
        const input = () => root.querySelector<HTMLInputElement>('input[type=number]')!;
        const name = () =>
            input()
                .getAttribute('aria-labelledby')!
                .split(' ')
                .map((id) => document.getElementById(id)?.textContent?.trim())
                .join(' ');
        expect(labels().map((el) => el.textContent?.trim())).toEqual(['Page:', 'of 50']);
        expect(labels().every((el) => getComputedStyle(el).display === 'none')).toBe(true);
        expect(name()).toBe('Page: of 50');
        host.mobile.set(true);
        await fixture.whenStable();
        expect(labels().every((el) => getComputedStyle(el).display !== 'none')).toBe(true);
        expect(name()).toBe('Page: of 50');
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

    it('rounds itemsPerPage down, keeps it at least 1 and falls back to 10 when it is not a number', async () => {
        const { fixture, host, root } = await setup({ total: 50 });
        const pageCount = () => {
            const of = root.querySelector('[id$="-page-of"]')?.textContent?.trim();
            return of ? of.replace('of ', '') : `${root.querySelectorAll('nav button[aria-label^="Page "]').length}`;
        };
        host.size.set(5.5);
        await fixture.whenStable();
        expect(pageCount()).toBe('10');
        host.size.set(NaN);
        await fixture.whenStable();
        expect(pageCount()).toBe('5');
        host.size.set('25' as unknown as number);
        await fixture.whenStable();
        expect(pageCount()).toBe('2');
        host.size.set(0);
        await fixture.whenStable();
        expect(pageCount()).toBe('50');
        host.size.set(-1);
        await fixture.whenStable();
        expect(pageCount()).toBe('50');
        host.size.set(7.9);
        await fixture.whenStable();
        expect(document.querySelector('fd-select [role=combobox]')?.textContent).toContain('7');
    });

    it('starts on the first page by default', async () => {
        @Component({
            imports: [Pagination],
            template: `<fd-pagination [totalItems]="50" />`
        })
        class DefaultHost {}
        const fixture = TestBed.createComponent(DefaultHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        expect(root.querySelector('[aria-current=page]')?.textContent?.trim()).toBe('1');
        expect(button(root, 'Previous page').disabled).toBe(true);
    });

    it('rounds a fractional currentPage down and keeps it in range', async () => {
        const { fixture, host, root } = await setup({ total: 50 });
        const current = () => root.querySelector('[aria-current=page]')?.textContent?.trim();
        host.page.set(3.7);
        await fixture.whenStable();
        expect(current()).toBe('3');
        host.page.set(999);
        await fixture.whenStable();
        expect(current()).toBe('5');
        expect(button(root, 'Next page').disabled).toBe(true);
        host.page.set(-2);
        await fixture.whenStable();
        expect(current()).toBe('1');
        host.page.set(null as unknown as number);
        await fixture.whenStable();
        expect(current()).toBe('1');
    });

    it('rounds items per page options down, drops values below 1, adds itemsPerPage and sorts them', async () => {
        const { fixture, host } = await setup({ total: 100 });
        host.options.set([20.7, 0, -5, 5, 20, 30.1]);
        await fixture.whenStable();
        await userEvent.click(document.querySelector<HTMLElement>('fd-select [role=combobox]')!);
        await fixture.whenStable();
        const options = () =>
            [...document.querySelectorAll<HTMLElement>('[role=listbox] [role=option]')].map((o) =>
                o.textContent?.trim()
            );
        expect(options()).toEqual(['5', '10', '20', '30']);
        await userEvent.keyboard('{Escape}');
        host.size.set(5);
        await fixture.whenStable();
        await userEvent.click(document.querySelector<HTMLElement>('fd-select [role=combobox]')!);
        await fixture.whenStable();
        expect(options()).toEqual(['5', '20', '30']);
        await userEvent.keyboard('{Escape}');
        await wait();
    });

    it('resets an invalid page in the input to the current page on Enter and on blur', async () => {
        const { fixture, host, root } = await setup({ page: 12 });
        const input = root.querySelector<HTMLInputElement>('input[type=number]')!;
        await userEvent.clear(input);
        await userEvent.type(input, '99{Enter}');
        await fixture.whenStable();
        expect(host.page()).toBe(12);
        expect(input.value).toBe('12');
        await userEvent.clear(input);
        await userEvent.type(input, '0');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        input.blur();
        await fixture.whenStable();
        expect(input.value).toBe('12');
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(host.page()).toBe(12);
    });
});
