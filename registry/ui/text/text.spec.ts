import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Text, type Hyphenation } from './text';

const LONG = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(12);

@Component({
    imports: [Text],
    template: `
        <div style="width: 300px">
            <fd-text
                [text]="text()"
                [maxLines]="maxLines()"
                [expandable]="expandable()"
                [(isCollapsed)]="collapsed"
                [whitespaces]="whitespaces()"
                [hyphenation]="hyphenation()"
                [subline]="subline()"
                [moreLabel]="moreLabel()"
                [lessLabel]="lessLabel()"
            />
        </div>
    `
})
class Host {
    readonly text = signal(LONG);
    readonly maxLines = signal<number | null>(null);
    readonly expandable = signal(false);
    readonly collapsed = signal(true);
    readonly whitespaces = signal(false);
    readonly hyphenation = signal<Hyphenation>(null);
    readonly subline = signal(false);
    readonly moreLabel = signal('more');
    readonly lessLabel = signal('Less');
}

async function setup(configure?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        await fixture.whenStable();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await fixture.whenStable();
    };
    await stable();
    const root = fixture.nativeElement as HTMLElement;
    const paragraph = root.querySelector<HTMLElement>('p')!;
    return {
        fixture,
        host: fixture.componentInstance,
        paragraph,
        clamp: paragraph.querySelector<HTMLElement>('span')!,
        toggle: () => paragraph.querySelector<HTMLElement>('a[role=button]'),
        stable,
        update: async (change: (host: Host) => void) => {
            change(fixture.componentInstance);
            await stable();
        }
    };
}

describe('Text', () => {
    it('maxLines clamps the text', async () => {
        const { clamp, toggle, update } = await setup();
        const full = clamp.getBoundingClientRect().height;
        await update((h) => h.maxLines.set(2));
        const clamped = clamp.getBoundingClientRect().height;
        expect(clamped).toBeLessThan(full);
        expect(clamped).toBeLessThanOrEqual(2 * 20);
        expect(clamp.scrollHeight).toBeGreaterThan(clamp.clientHeight);
        expect(getComputedStyle(clamp).webkitLineClamp).toBe('2');
        // not expandable: no More link
        expect(toggle()).toBeNull();

        await update((h) => h.maxLines.set(4));
        expect(clamp.getBoundingClientRect().height).toBeGreaterThan(clamped);
        await update((h) => h.maxLines.set(null));
        expect(clamp.getBoundingClientRect().height).toBe(full);
    });

    it('expandable shows More/Less and toggles [(isCollapsed)]', async () => {
        const { host, clamp, toggle, update, stable } = await setup((h) => {
            h.maxLines.set(2);
            h.expandable.set(true);
        });
        const clamped = clamp.getBoundingClientRect().height;
        expect(toggle()!.textContent!.trim()).toBe('more');
        expect(toggle()!.getAttribute('aria-expanded')).toBe('false');

        await userEvent.click(toggle()!);
        await stable();
        expect(host.collapsed()).toBe(false);
        expect(clamp.getBoundingClientRect().height).toBeGreaterThan(clamped);
        expect(toggle()!.textContent!.trim()).toBe('Less');
        expect(toggle()!.getAttribute('aria-expanded')).toBe('true');

        // keyboard: Enter and Space
        toggle()!.focus();
        expect(document.activeElement).toBe(toggle());
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(host.collapsed()).toBe(true);
        expect(clamp.getBoundingClientRect().height).toBe(clamped);
        await userEvent.keyboard(' ');
        await stable();
        expect(host.collapsed()).toBe(false);
        expect(document.activeElement).toBe(toggle());

        // the parent sets the state
        await update((h) => h.collapsed.set(true));
        expect(clamp.getBoundingClientRect().height).toBe(clamped);
        expect(toggle()!.getAttribute('aria-expanded')).toBe('false');
    });

    it('shows no toggle when the text fits in maxLines', async () => {
        const { toggle, update } = await setup((h) => {
            h.maxLines.set(2);
            h.expandable.set(true);
            h.text.set('Short text');
        });
        expect(toggle()).toBeNull();
        await update((h) => h.text.set(LONG));
        expect(toggle()).not.toBeNull();
        await update((h) => h.text.set('Short again'));
        expect(toggle()).toBeNull();
    });

    it('whitespace preserve and hyphenation', async () => {
        const { paragraph, clamp, update } = await setup((h) => h.text.set('First line\nSecond line\n\nFourth   line'));
        expect(getComputedStyle(paragraph).whiteSpaceCollapse).toBe('collapse');
        const collapsed = clamp.getBoundingClientRect().height;
        await update((h) => h.whitespaces.set(true));
        expect(getComputedStyle(paragraph).whiteSpaceCollapse).toBe('preserve');
        expect(clamp.getBoundingClientRect().height).toBeGreaterThanOrEqual(collapsed * 3.5);
        expect(clamp.innerText).toContain('Fourth   line');

        expect(paragraph.style.hyphens).toBe('');
        await update((h) => h.hyphenation.set('auto'));
        expect(getComputedStyle(paragraph).hyphens).toBe('auto');
        await update((h) => h.hyphenation.set('manual'));
        expect(getComputedStyle(paragraph).hyphens).toBe('manual');
        await update((h) => h.hyphenation.set('none'));
        expect(getComputedStyle(paragraph).hyphens).toBe('none');
    });

    it('subline variant', async () => {
        const { paragraph, update } = await setup();
        const probe = document.createElement('span');
        paragraph.appendChild(probe);
        probe.style.color = 'var(--sapContent_LabelColor)';
        const labelColor = getComputedStyle(probe).color;
        probe.remove();
        expect(getComputedStyle(paragraph).fontSize).toBe('14px');

        await update((h) => h.subline.set(true));
        expect(getComputedStyle(paragraph).fontSize).toBe('12px');
        expect(getComputedStyle(paragraph).color).toBe(labelColor);
        // two lines at most
        expect(getComputedStyle(paragraph).webkitLineClamp).toBe('2');
        const lineHeight = parseFloat(getComputedStyle(paragraph).fontSize) * 1.5;
        expect(paragraph.getBoundingClientRect().height).toBeLessThanOrEqual(2 * lineHeight);
    });

    it('maxLines 0 or negative does not clamp and shows no toggle', async () => {
        const { clamp, toggle, update } = await setup((h) => h.expandable.set(true));
        const full = clamp.getBoundingClientRect().height;
        for (const lines of [0, -1, -5]) {
            await update((h) => h.maxLines.set(lines));
            expect(clamp.getBoundingClientRect().height).toBe(full);
            expect(getComputedStyle(clamp).webkitLineClamp).toBe('none');
            expect(toggle()).toBeNull();
        }
        await update((h) => h.maxLines.set(2));
        expect(clamp.getBoundingClientRect().height).toBeLessThan(full);
        expect(toggle()).not.toBeNull();
    });

    it('custom moreLabel and lessLabel replace the toggle text', async () => {
        const { toggle, update, stable } = await setup((h) => {
            h.maxLines.set(2);
            h.expandable.set(true);
            h.moreLabel.set('Show all');
            h.lessLabel.set('Show fewer');
        });
        expect(toggle()!.textContent!.trim()).toBe('Show all');
        await userEvent.click(toggle()!);
        await stable();
        expect(toggle()!.textContent!.trim()).toBe('Show fewer');
        await update((h) => h.lessLabel.set('Collapse'));
        expect(toggle()!.textContent!.trim()).toBe('Collapse');
    });
});
