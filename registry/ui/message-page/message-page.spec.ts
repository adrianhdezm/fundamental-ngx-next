import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { MessagePage, MessagePageSubtitle, MessagePageTitle, type MessagePageType } from './message-page';

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
});
