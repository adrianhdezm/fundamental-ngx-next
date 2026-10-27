import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ObjectMarker } from './object-marker';

@Component({
    imports: [ObjectMarker],
    template: `
        <button id="before">Before</button>
        <span
            fdObjectMarker
            id="om"
            [glyph]="glyph()"
            [label]="label()"
            [title]="title()"
            [clickable]="clickable()"
            [statusText]="statusText()"
            [ariaLabelledBy]="labelledBy()"
            (click)="clicks.push('span')"
        ></span>
        <a
            fdObjectMarker
            id="om-link"
            clickable
            href="#marker"
            label="Unsaved changes"
            (click)="anchorClick($event)"
        ></a>
    `
})
class Host {
    readonly glyph = signal<string | null>('private');
    readonly label = signal<string | null>('Locked');
    readonly title = signal<string | null>(null);
    readonly clickable = signal(false);
    readonly statusText = signal<string | null>(null);
    readonly labelledBy = signal<string | null>(null);
    readonly clicks: string[] = [];

    anchorClick(event: Event): void {
        event.preventDefault();
        this.clicks.push('anchor');
    }
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const marker = () => document.getElementById('om') as HTMLElement;
    const icon = () => marker().querySelector('fd-icon') as HTMLElement | null;
    const name = (element: HTMLElement) =>
        (element.getAttribute('aria-labelledby') ?? '')
            .split(' ')
            .map((id) => document.getElementById(id)?.textContent?.trim())
            .join(' ');
    return { fixture, host, marker, icon, name };
}

describe('ObjectMarker', () => {
    it('label with glyph: icon is presentational, name is the status text and the label', async () => {
        const { marker, icon, name } = await setup();
        expect(marker().getAttribute('role')).toBeNull();
        expect(icon()?.getAttribute('role')).toBe('presentation');
        expect(icon()?.hasAttribute('title')).toBe(false);
        expect(document.getElementById('om-label')?.textContent).toBe('Locked');
        expect(name(marker())).toBe('Inactive Object Marker Locked');
        // icon before the label
        expect(icon()!.getBoundingClientRect().right).toBeLessThanOrEqual(
            document.getElementById('om-label')!.getBoundingClientRect().left + 0.5
        );
    });

    it('label only renders no icon', async () => {
        const { fixture, host, icon, name, marker } = await setup();
        host.glyph.set(null);
        await fixture.whenStable();
        expect(icon()).toBeNull();
        expect(name(marker())).toBe('Inactive Object Marker Locked');
    });

    it('glyph-only marker is an image named by its title (defaulting to the glyph name)', async () => {
        const { fixture, host, marker, icon, name } = await setup();
        host.label.set(null);
        await fixture.whenStable();
        expect(marker().getAttribute('role')).toBe('img');
        expect(icon()?.getAttribute('title')).toBe('private');
        expect(name(marker())).toBe('Inactive Object Marker private');

        host.title.set('Locked by Jane');
        await fixture.whenStable();
        expect(icon()?.getAttribute('title')).toBe('Locked by Jane');
        expect(name(marker())).toBe('Inactive Object Marker Locked by Jane');
    });

    it('statusText and ariaLabelledBy override the accessible name', async () => {
        const { fixture, host, marker, name } = await setup();
        host.statusText.set('Draft');
        await fixture.whenStable();
        expect(name(marker())).toBe('Draft Locked');
        host.labelledBy.set('before');
        await fixture.whenStable();
        expect(marker().getAttribute('aria-labelledby')).toBe('before');
    });

    it('non-clickable markers are not in the tab order', async () => {
        const { marker } = await setup();
        expect(marker().getAttribute('tabindex')).toBe('-1');
        (document.getElementById('before') as HTMLElement).focus();
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).not.toBe(marker());
    });

    it('clickable marker is a focusable link announced as active', async () => {
        const { fixture, host, marker, name } = await setup();
        host.clickable.set(true);
        await fixture.whenStable();
        expect(marker().getAttribute('role')).toBe('link');
        expect(marker().getAttribute('tabindex')).toBe('0');
        expect(name(marker())).toBe('Active Object Marker Locked');
        expect(getComputedStyle(marker()).cursor).toBe('pointer');

        (document.getElementById('before') as HTMLElement).focus();
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(marker());
    });

    it('clickable marker activates with a click and with Enter', async () => {
        const { fixture, host, marker } = await setup();
        host.clickable.set(true);
        await fixture.whenStable();
        await userEvent.click(marker());
        expect(host.clicks).toEqual(['span']);
        marker().focus();
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toEqual(['span', 'span']);
    });

    it('Enter does not activate a non-clickable marker', async () => {
        const { host, marker } = await setup();
        marker().focus();
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toEqual([]);
    });

    it('a clickable anchor marker activates once with Enter (natively)', async () => {
        const { host } = await setup();
        const anchor = document.getElementById('om-link') as HTMLAnchorElement;
        expect(anchor.getAttribute('role')).toBe('link');
        anchor.focus();
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toEqual(['anchor']);
    });

    it('clickable marker shows the filled focus style', async () => {
        const { fixture, host, marker } = await setup();
        host.clickable.set(true);
        await fixture.whenStable();
        const before = getComputedStyle(marker()).backgroundColor;
        marker().focus();
        // background transitions in over 125ms
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(document.activeElement).toBe(marker());
        expect(getComputedStyle(marker()).backgroundColor).not.toBe(before);
    });
});
