import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ObjectAttribute } from './object-attribute';

@Component({
    imports: [ObjectAttribute],
    template: `
        <button id="before">Before</button>
        <div [style.width]="width()">
            <fd-object-attribute
                [label]="label()"
                [linkText]="linkText()"
                [isLink]="isLink()"
                [disabled]="disabled()"
                (objectAttributeClick)="clicks.push($event.type)"
                >{{ content() }}</fd-object-attribute
            >
        </div>
    `
})
class Host {
    readonly label = signal<string | null>('Manufacturer');
    readonly content = signal(': Titanium');
    readonly linkText = signal<string | null>(null);
    readonly isLink = signal(false);
    readonly disabled = signal(false);
    readonly width = signal('auto');
    readonly clicks: string[] = [];
}

async function setup(config: Partial<{ linkText: string; isLink: boolean; disabled: boolean }> = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.linkText !== undefined) host.linkText.set(config.linkText);
    if (config.isLink !== undefined) host.isLink.set(config.isLink);
    if (config.disabled !== undefined) host.disabled.set(config.disabled);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const element = () => fixture.nativeElement.querySelector('fd-object-attribute') as HTMLElement;
    const link = () => element().querySelector('span') as HTMLElement | null;
    return { fixture, host, element, link };
}

describe('ObjectAttribute', () => {
    it('renders the label and projected value as plain text without a link', async () => {
        const { element, link } = await setup();
        expect(element().textContent?.trim()).toBe('Manufacturer: Titanium');
        expect(link()).toBeNull();
        expect(element().querySelector('[role="link"]')).toBeNull();
    });

    it('shows linkText as plain text without a link role or tab stop when isLink is off', async () => {
        const { host, link } = await setup({ linkText: 'Jane Doe' });
        expect(link()?.textContent).toBe('Jane Doe');
        expect(link()?.getAttribute('role')).toBeNull();
        expect(link()?.hasAttribute('tabindex')).toBe(false);
        await userEvent.click(link()!);
        expect(host.clicks).toEqual([]);
    });

    it('with isLink renders a focusable link that emits objectAttributeClick on click and Enter', async () => {
        const { host, link } = await setup({ linkText: 'Jane Doe', isLink: true });
        expect(link()?.getAttribute('role')).toBe('link');
        expect(link()?.getAttribute('tabindex')).toBe('0');
        expect(link()?.getAttribute('aria-disabled')).toBeNull();
        expect(link()?.getAttribute('title')).toBe('Jane Doe');

        await userEvent.click(link()!);
        expect(host.clicks).toEqual(['click']);

        (document.getElementById('before') as HTMLElement).focus();
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(link());
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toEqual(['click', 'keydown']);
    });

    it('disabled link is removed from the tab order, marked aria-disabled and does not emit', async () => {
        const { fixture, host, link } = await setup({ linkText: 'Jane Doe', isLink: true, disabled: true });
        expect(link()?.getAttribute('tabindex')).toBe('-1');
        expect(link()?.getAttribute('aria-disabled')).toBe('true');
        expect(getComputedStyle(link()!).pointerEvents).toBe('none');

        link()!.click();
        link()!.focus();
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toEqual([]);

        host.disabled.set(false);
        await fixture.whenStable();
        expect(link()?.getAttribute('tabindex')).toBe('0');
        link()!.click();
        expect(host.clicks).toEqual(['click']);
    });

    it('uses the link colour only for action links', async () => {
        const { fixture, host, link, element } = await setup({ linkText: 'Jane Doe' });
        expect(getComputedStyle(link()!).color).toBe(getComputedStyle(element()).color);
        host.isLink.set(true);
        await fixture.whenStable();
        expect(getComputedStyle(link()!).color).not.toBe(getComputedStyle(element()).color);
        expect(getComputedStyle(link()!).cursor).toBe('pointer');
    });

    it('truncates to a single line with an ellipsis and keeps the label as title', async () => {
        const { fixture, host, element } = await setup();
        host.label.set('A very long attribute label that does not fit into the narrow container');
        host.width.set('120px');
        await fixture.whenStable();
        const style = getComputedStyle(element());
        expect(style.textOverflow).toBe('ellipsis');
        expect(style.whiteSpace).toBe('nowrap');
        expect(element().scrollWidth).toBeGreaterThan(element().clientWidth);
        expect(element().getBoundingClientRect().width).toBeLessThanOrEqual(120);
        expect(element().getAttribute('title')).toBe(
            'A very long attribute label that does not fit into the narrow container'
        );
    });

    it('has no title without a label', async () => {
        const { fixture, host, element } = await setup();
        host.label.set(null);
        await fixture.whenStable();
        expect(element().hasAttribute('title')).toBe(false);
        expect(element().textContent?.trim()).toBe(': Titanium');
    });
});
