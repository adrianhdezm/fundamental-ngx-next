import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
    MessagePage,
    MessagePageActions,
    MessagePageMore,
    MessagePageSubtitle,
    MessagePageTitle,
    type MessagePageType
} from './message-page';

@Component({
    imports: [MessagePage, MessagePageTitle, MessagePageSubtitle],
    template: `
        <fd-message-page [type]="type()" [glyph]="glyph()" [hasIcon]="hasIcon()">
            <fd-message-page-title>Nothing here</fd-message-page-title>
            <fd-message-page-subtitle>Try again</fd-message-page-subtitle>
        </fd-message-page>
    `
})
class Host {
    readonly type = signal<MessagePageType>('search');
    readonly glyph = signal<string | null>(null);
    readonly hasIcon = signal(true);
}

@Component({
    imports: [MessagePage, MessagePageTitle, MessagePageSubtitle, MessagePageActions, MessagePageMore],
    template: `
        <div style="height: 600px">
            <fd-message-page>
                <!-- projected out of order: the page puts each part in its slot -->
                <fd-message-page-more><button id="more">Show details</button></fd-message-page-more>
                <fd-message-page-actions>
                    <button id="primary">Contact support</button>
                    <button id="secondary">Reload page</button>
                </fd-message-page-actions>
                <fd-message-page-subtitle>Check the address</fd-message-page-subtitle>
                <fd-message-page-title>Page not found</fd-message-page-title>
            </fd-message-page>
        </div>
    `
})
class PartsHost {}

async function setupParts() {
    const fixture = TestBed.createComponent(PartsHost);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const part = (selector: string) => root.querySelector<HTMLElement>(selector)!;
    return {
        status: part('[role=status]'),
        title: part('fd-message-page-title'),
        subtitle: part('fd-message-page-subtitle'),
        actions: part('fd-message-page-actions'),
        more: part('fd-message-page-more'),
        part
    };
}

const box = (el: Element) => el.getBoundingClientRect();

describe('MessagePage', () => {
    it('announces its content and shows the icon of its type', async () => {
        const fixture = TestBed.createComponent(Host);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        const status = el.querySelector('[role=status]')!;
        expect(status.getAttribute('aria-live')).toBe('polite');
        expect(status.textContent).toContain('Nothing here');
        const icon = () => el.querySelector('fd-icon');
        const searchGlyph = icon()!.getAttribute('data-glyph');
        fixture.componentInstance.type.set('filter');
        await fixture.whenStable();
        expect(icon()!.getAttribute('data-glyph')).not.toBe(searchGlyph);
        expect(icon()!.getAttribute('role')).toBe('presentation');
        fixture.componentInstance.glyph.set('retail-store');
        await fixture.whenStable();
        const custom = icon()!.getAttribute('data-glyph');
        fixture.componentInstance.type.set('error');
        await fixture.whenStable();
        expect(icon()!.getAttribute('data-glyph')).toBe(custom);
        fixture.componentInstance.hasIcon.set(false);
        await fixture.whenStable();
        expect(icon()).toBeNull();
    });

    it('renders the subtitle below the title', async () => {
        const { status, title, subtitle } = await setupParts();
        expect([...status.children].slice(0, 2)).toEqual([title, subtitle]);
        expect(subtitle.textContent!.trim()).toBe('Check the address');
        expect(box(subtitle).top).toBeGreaterThanOrEqual(box(title).bottom);
        // both centred in the page
        const centre = (el: Element) => (box(el).left + box(el).right) / 2;
        expect(Math.abs(centre(subtitle) - centre(title))).toBeLessThanOrEqual(1);
        expect(status.textContent).toContain('Check the address');
    });

    it('renders actions and the more area after the subtitle', async () => {
        const { status, subtitle, actions, more, part } = await setupParts();
        expect([...status.children].slice(2)).toEqual([actions, more]);
        expect(box(actions).top).toBeGreaterThanOrEqual(box(subtitle).bottom);
        expect(box(more).top).toBeGreaterThanOrEqual(box(actions).bottom);
        // the actions sit side by side
        const primary = part('#primary');
        const secondary = part('#secondary');
        expect(box(primary).top).toBe(box(secondary).top);
        expect(box(secondary).left).toBeGreaterThan(box(primary).right);
        expect(more.contains(part('#more'))).toBe(true);
    });
});
