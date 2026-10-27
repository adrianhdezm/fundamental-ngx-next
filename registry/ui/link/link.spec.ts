import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Link } from './link';

@Component({
    imports: [Link],
    template: `
        <button id="before">Before</button>
        <a
            id="link"
            fdLink
            href="#target"
            [emphasized]="emphasized()"
            [subtle]="subtle()"
            [inverted]="inverted()"
            [disabled]="disabled()"
            [undecorated]="undecorated()"
            [touchTarget]="touchTarget()"
            emphasizedLabel="Important"
            (click)="clicks.set(clicks() + 1); $event.preventDefault()"
            >Orders</a
        >
        <button id="after">After</button>
        <a id="action" fdLink tabindex="0" role="button">Show more</a>
        <span id="probe"></span>
        <div id="away" style="height: 20px"></div>
    `
})
class Host {
    readonly emphasized = signal(false);
    readonly subtle = signal(false);
    readonly inverted = signal(false);
    readonly disabled = signal(false);
    readonly undecorated = signal(false);
    readonly touchTarget = signal(false);
    readonly clicks = signal(0);
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    // keep the pointer of earlier tests off the element
    await userEvent.hover(root.querySelector('#away')!);
    const link = root.querySelector<HTMLAnchorElement>('#link')!;
    // read the end values of the colour and size transitions
    link.style.transition = 'none';
    const probe = root.querySelector<HTMLElement>('#probe')!;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        link,
        /** The span that carries the text decoration. */
        content: () => link.querySelector<HTMLElement>('span:not(.sr-only-sap)')!,
        srText: () => [...link.querySelectorAll('.sr-only-sap')].map((el) => el.textContent!.trim()),
        resolve: (variable: string) => {
            probe.style.color = `var(${variable})`;
            return getComputedStyle(probe).color;
        },
        update: async (change: (host: Host) => void) => {
            change(fixture.componentInstance);
            await fixture.whenStable();
        }
    };
}

describe('Link', () => {
    it('emphasized, subtle, inverted and disabled styles; disabled link is aria-disabled and not navigable', async () => {
        const { host, root, link, resolve, update } = await setup();
        expect(getComputedStyle(link).color).toBe(resolve('--sapLinkColor'));
        expect(getComputedStyle(link).fontFamily.startsWith('"72"')).toBe(true);
        expect(link.getAttribute('aria-disabled')).toBe('false');
        expect(link.hasAttribute('tabindex')).toBe(false);

        await update((h) => h.emphasized.set(true));
        expect(getComputedStyle(link).fontFamily.startsWith('"72-Bold"')).toBe(true);
        await update((h) => {
            h.emphasized.set(false);
            h.subtle.set(true);
        });
        expect(getComputedStyle(link).color).toBe(resolve('--sapLink_SubtleColor'));
        await update((h) => {
            h.subtle.set(false);
            h.inverted.set(true);
        });
        expect(getComputedStyle(link).color).toBe(resolve('--sapLink_InvertedColor'));

        await update((h) => {
            h.inverted.set(false);
            h.disabled.set(true);
        });
        expect(link.getAttribute('aria-disabled')).toBe('true');
        expect(link.getAttribute('tabindex')).toBe('-1');
        expect(getComputedStyle(link).pointerEvents).toBe('none');
        expect(getComputedStyle(link).opacity).toBe('0.4');

        // out of the tab order: Tab goes from the button before straight to the one after
        root.querySelector<HTMLElement>('#before')!.focus();
        await userEvent.tab();
        expect(document.activeElement!.id).toBe('after');
        // clicks do not reach it
        const hit = document.elementFromPoint(
            link.getBoundingClientRect().left + 2,
            link.getBoundingClientRect().top + 2
        );
        expect(link.contains(hit)).toBe(false);
        expect(host.clicks()).toBe(0);
    });

    it('is focusable and activates like a native link when enabled', async () => {
        const { host, root, link } = await setup();
        root.querySelector<HTMLElement>('#before')!.focus();
        await userEvent.tab();
        expect(document.activeElement).toBe(link);
        await userEvent.keyboard('{Enter}');
        expect(host.clicks()).toBe(1);
    });

    it('keeps the tabindex of links without href, unless disabled', async () => {
        const { root } = await setup();
        const action = root.querySelector<HTMLElement>('#action')!;
        expect(action.getAttribute('tabindex')).toBe('0');
        root.querySelector<HTMLElement>('#after')!.focus();
        await userEvent.tab();
        expect(document.activeElement).toBe(action);
    });

    it('underlines on hover and focus only; undecorated never; touchTarget enlarges the hit area', async () => {
        const { root, link, content, update } = await setup();
        const decoration = () => getComputedStyle(content()).textDecorationLine;
        expect(decoration()).toBe('none');
        await userEvent.hover(link);
        expect(decoration()).toBe('underline');
        await userEvent.unhover(link);
        expect(decoration()).toBe('none');
        link.focus();
        expect(decoration()).toBe('underline');
        link.blur();

        await update((h) => h.subtle.set(true));
        // subtle links are underlined at rest and lose the underline on hover
        expect(decoration()).toBe('underline');
        await userEvent.hover(link);
        expect(decoration()).toBe('none');
        await userEvent.unhover(link);

        await update((h) => {
            h.subtle.set(false);
            h.undecorated.set(true);
        });
        expect(decoration()).toBe('none');
        await userEvent.hover(link);
        expect(decoration()).toBe('none');
        link.focus();
        expect(decoration()).toBe('none');
        await userEvent.unhover(root.querySelector('#after')!);

        const height = link.getBoundingClientRect().height;
        expect(getComputedStyle(link).lineHeight).toBe('16px');
        await update((h) => h.touchTarget.set(true));
        expect(getComputedStyle(link).lineHeight).toBe('24px');
        expect(link.getBoundingClientRect().height).toBeGreaterThan(height);
        expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    });

    it('emphasized and subtle links announce emphasizedLabel / subtleLabel', async () => {
        const { srText, update } = await setup();
        expect(srText()).toEqual([]);
        await update((h) => h.emphasized.set(true));
        expect(srText()).toEqual(['Important']);
        await update((h) => {
            h.emphasized.set(false);
            h.subtle.set(true);
        });
        expect(srText()).toEqual(['Subtle']);
    });
});
