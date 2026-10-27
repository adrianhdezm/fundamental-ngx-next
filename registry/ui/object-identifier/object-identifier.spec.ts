import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Link } from '@/ui/link/link';
import { ObjectIdentifier } from './object-identifier';

@Component({
    imports: [ObjectIdentifier, Link],
    template: `
        <fd-object-identifier
            id="oi"
            [bold]="bold()"
            [medium]="medium()"
            [description]="description()"
            [ariaLabel]="ariaLabel()"
            >Notebook Basic 15</fd-object-identifier
        >
        <fd-object-identifier id="oi-link" [description]="description()">
            @if (showLink()) {
                <a fdLink href="#order">Order 4711</a>
            }
        </fd-object-identifier>
    `
})
class Host {
    readonly bold = signal(false);
    readonly medium = signal(false);
    readonly description = signal<string | null>('Laptop, 15 inch');
    readonly ariaLabel = signal<string | null>(null);
    readonly showLink = signal(true);
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const title = () => document.getElementById('oi-title') as HTMLElement;
    const link = () => root.querySelector('a') as HTMLAnchorElement | null;
    const labelText = (element: HTMLElement) =>
        (element.getAttribute('aria-labelledby') ?? '')
            .split(' ')
            .map((id) => document.getElementById(id)?.textContent?.trim())
            .join(' ');
    return { fixture, host, root, title, link, labelText };
}

describe('ObjectIdentifier', () => {
    it('renders the title and the description below it', async () => {
        const { title } = await setup();
        expect(title().textContent?.trim()).toBe('Notebook Basic 15');
        const text = document.getElementById('oi-text') as HTMLElement;
        expect(text.textContent?.trim()).toBe('Laptop, 15 inch');
        expect(text.getBoundingClientRect().top).toBeGreaterThanOrEqual(title().getBoundingClientRect().bottom);
    });

    it('omits the description when there is none', async () => {
        const { fixture, host } = await setup();
        host.description.set(null);
        await fixture.whenStable();
        expect(document.getElementById('oi-text')).toBeNull();
    });

    it('bold title is bold, regular otherwise', async () => {
        const { fixture, host, title } = await setup();
        expect(Number(getComputedStyle(title()).fontWeight)).toBeLessThan(700);
        host.bold.set(true);
        await fixture.whenStable();
        expect(Number(getComputedStyle(title()).fontWeight)).toBeGreaterThanOrEqual(700);
    });

    it('uses the large font size unless medium', async () => {
        const { fixture, host, title } = await setup();
        const large = parseFloat(getComputedStyle(title()).fontSize);
        host.medium.set(true);
        await fixture.whenStable();
        const medium = parseFloat(getComputedStyle(title()).fontSize);
        expect(large).toBeGreaterThan(medium);
        const identifier = document.getElementById('oi') as HTMLElement;
        expect(medium).toBe(parseFloat(getComputedStyle(identifier).fontSize));
    });

    it('a projected link inherits the title font size and weight', async () => {
        const { link } = await setup();
        const linkTitle = document.getElementById('oi-link-title') as HTMLElement;
        expect(getComputedStyle(link()!).fontSize).toBe(getComputedStyle(linkTitle).fontSize);
        expect(getComputedStyle(link()!).fontWeight).toBe(getComputedStyle(linkTitle).fontWeight);
    });

    it('has a hidden role text for assistive technology, overridable with ariaLabel', async () => {
        const { fixture, host } = await setup();
        const description = document.getElementById('oi-description') as HTMLElement;
        expect(description.textContent?.trim()).toBe('Object Identifier');
        expect(description.getAttribute('aria-hidden')).toBeNull();
        expect(description.getBoundingClientRect().width).toBeLessThanOrEqual(1);
        host.ariaLabel.set('Product');
        await fixture.whenStable();
        expect(description.textContent?.trim()).toBe('Product');
    });

    it('projected link is labelled by its text, the role text and the description', async () => {
        const { link, labelText } = await setup();
        expect(link()!.id).toBe('oi-link-link-0');
        expect(link()!.getAttribute('aria-labelledby')).toBe('oi-link-link-0 oi-link-description oi-link-text');
        expect(labelText(link()!)).toBe('Order 4711 Object Identifier Laptop, 15 inch');
        // the role text is only read through the link
        expect(document.getElementById('oi-link-description')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('updates the link label when the description goes away and comes back', async () => {
        const { fixture, host, link, labelText } = await setup();
        host.description.set(null);
        await fixture.whenStable();
        expect(link()!.getAttribute('aria-labelledby')).toBe('oi-link-link-0 oi-link-description');
        expect(labelText(link()!)).toBe('Order 4711 Object Identifier');
        host.description.set('Open since Monday');
        await fixture.whenStable();
        expect(labelText(link()!)).toBe('Order 4711 Object Identifier Open since Monday');
    });

    it('keeps an existing link id', async () => {
        @Component({
            imports: [ObjectIdentifier, Link],
            template: `<fd-object-identifier id="own" description="Desc"
                ><a fdLink id="my-link" href="#x">Title</a></fd-object-identifier
            >`
        })
        class OwnId {}
        const fixture = TestBed.createComponent(OwnId);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const link = fixture.nativeElement.querySelector('a') as HTMLElement;
        expect(link.id).toBe('my-link');
        expect(link.getAttribute('aria-labelledby')).toBe('my-link own-description own-text');
    });

    it('the role text is exposed again when the link is removed', async () => {
        const { fixture, host } = await setup();
        host.showLink.set(false);
        await fixture.whenStable();
        expect(document.getElementById('oi-link-description')?.getAttribute('aria-hidden')).toBeNull();
    });
});
