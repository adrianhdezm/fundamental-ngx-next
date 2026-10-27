import { Dir } from '@angular/cdk/bidi';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Link } from '@/ui/link/link';
import { Breadcrumb, BreadcrumbItem, type BreadcrumbSeparatorStyle } from './breadcrumb';

@Component({
    imports: [Breadcrumb, BreadcrumbItem, Link, Dir],
    template: `
        <div [style.width]="width()" [dir]="dir()">
            <fd-breadcrumb [separatorStyle]="separatorStyle()" (hiddenItemsCount)="hidden.set($event)">
                @for (step of steps; track step) {
                    <fd-breadcrumb-item>
                        <a fdLink href="#" (click)="$event.preventDefault(); clicked.set(step)">{{ step }}</a>
                    </fd-breadcrumb-item>
                }
                <fd-breadcrumb-item><span aria-current="page">Current page</span></fd-breadcrumb-item>
            </fd-breadcrumb>
        </div>
    `
})
class Host {
    readonly steps = ['Home', 'Products', 'Computers', 'Laptops'];
    readonly width = signal('60rem');
    readonly dir = signal<'ltr' | 'rtl'>('ltr');
    readonly separatorStyle = signal<BreadcrumbSeparatorStyle>('');
    readonly hidden = signal(0);
    readonly clicked = signal('');
}

const wait = (ms = 100) => new Promise((r) => setTimeout(r, ms));

async function setup(width = '60rem', dir: 'ltr' | 'rtl' = 'ltr') {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.width.set(width);
    fixture.componentInstance.dir.set(dir);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const focusables = () =>
        [...el.querySelectorAll<HTMLElement>('fd-overflow-layout :is([fdLink], [aria-current])')].filter(
            (e) => !e.closest('[hidden]')
        );
    return { fixture, host: fixture.componentInstance, el, focusables };
}

describe('Breadcrumb', () => {
    it('is a labelled navigation list with separators and no separator after the current page', async () => {
        const { el } = await setup();
        const nav = el.querySelector('fd-breadcrumb')!;
        expect(nav.getAttribute('role')).toBe('navigation');
        expect(nav.getAttribute('aria-label')).toBe('Breadcrumb trail');
        expect(el.querySelector('[role=list]')!.querySelectorAll('[role=listitem]')).toHaveLength(5);
        const items = [...el.querySelectorAll('fd-breadcrumb-item')];
        expect(items[0].textContent).toContain('/');
        expect(items[4].textContent!.trim()).toBe('Current page');
    });

    it('has one tab stop and moves between the links with the arrow keys', async () => {
        const { focusables } = await setup();
        expect(focusables().map((e) => e.tabIndex)).toEqual([0, -1, -1, -1, -1]);
        focusables()[0].focus();
        await userEvent.keyboard('{ArrowRight}{ArrowRight}');
        expect(document.activeElement!.textContent!.trim()).toBe('Computers');
        expect(focusables()[2].tabIndex).toBe(0);
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement!.textContent!.trim()).toBe('Products');
    });

    it('collapses items that do not fit into a menu that follows their links', async () => {
        const { host, el } = await setup('16rem');
        expect(host.hidden()).toBeGreaterThan(0);
        const more = el.querySelector<HTMLElement>('[data-breadcrumb-more]')!;
        expect(more.getAttribute('aria-haspopup')).toBe('menu');
        await userEvent.click(more);
        await wait();
        const items = [...document.querySelectorAll<HTMLElement>('[role=menuitem]')];
        expect(items.length).toBe(host.hidden());
        expect(items.at(-1)!.textContent!.trim()).toBe('Home');
        await userEvent.click(items.at(-1)!);
        expect(host.clicked()).toBe('Home');
    });

    it('renders the separator of each separatorStyle and updates when it changes', async () => {
        const { fixture, host, el } = await setup();
        const separators = () =>
            [...el.querySelectorAll('fd-overflow-layout fd-breadcrumb-item')].map(
                (item) => item.querySelector(':scope > span[aria-hidden=true]')?.textContent?.trim() ?? null
            );
        expect(separators()).toEqual(['/', '/', '/', '/', null]);
        const styles: [BreadcrumbSeparatorStyle, string][] = [
            ['backslash', '\\'],
            ['double-slash', '//'],
            ['double-backslash', '\\\\'],
            ['greater-than', '>'],
            ['double-greater-than', '>>']
        ];
        for (const [style, separator] of styles) {
            host.separatorStyle.set(style);
            await fixture.whenStable();
            expect(separators()).toEqual([separator, separator, separator, separator, null]);
        }
    });

    it('restores collapsed items when the container grows', async () => {
        const { fixture, host, el, focusables } = await setup('16rem');
        expect(host.hidden()).toBeGreaterThan(0);
        host.width.set('60rem');
        await fixture.whenStable();
        await wait();
        await fixture.whenStable();
        expect(host.hidden()).toBe(0);
        expect(el.querySelector('[data-breadcrumb-more]')).toBeNull();
        expect(focusables().map((e) => e.textContent!.trim())).toEqual([
            'Home',
            'Products',
            'Computers',
            'Laptops',
            'Current page'
        ]);
    });

    it('moves from the last link to the current page and back, and stops at the first link', async () => {
        const { focusables } = await setup();
        focusables()[3].focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(focusables()[4]);
        expect(document.activeElement!.getAttribute('aria-current')).toBe('page');
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(focusables()[4]);
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement!.textContent!.trim()).toBe('Laptops');
        focusables()[0].focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement!.textContent!.trim()).toBe('Home');
    });

    it('moves next with ArrowDown and back with ArrowUp', async () => {
        const { focusables } = await setup();
        focusables()[0].focus();
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        expect(document.activeElement!.textContent!.trim()).toBe('Computers');
        await userEvent.keyboard('{ArrowUp}');
        expect(document.activeElement!.textContent!.trim()).toBe('Products');
    });

    it('mirrors ArrowLeft and ArrowRight in RTL', async () => {
        const { focusables } = await setup('60rem', 'rtl');
        focusables()[0].focus();
        await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
        expect(document.activeElement!.textContent!.trim()).toBe('Computers');
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement!.textContent!.trim()).toBe('Products');
    });
});
