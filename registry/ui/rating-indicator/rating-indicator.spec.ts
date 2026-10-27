import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Icon } from '@/ui/icon/icon';
import { RatingIndicator, type RatingIndicatorSize } from './rating-indicator';

@Component({
    imports: [RatingIndicator, ReactiveFormsModule],
    template: `
        <fd-rating-indicator
            ariaLabel="Rating"
            [allowHalves]="halves()"
            [displayMode]="displayMode()"
            [ratings]="ratings()"
            [displayAllRatings]="displayAllRatings()"
            [formControl]="control"
            (ratingChanged)="changes.set(changes() + 1)"
        />
    `
})
class Host {
    readonly halves = signal(false);
    readonly displayMode = signal(false);
    readonly ratings = signal<Record<number, number> | null>(null);
    readonly displayAllRatings = signal(false);
    readonly changes = signal(0);
    readonly control = new FormControl<number | null>(2);
}

const rated = (root: HTMLElement) =>
    [...root.querySelectorAll('li')].map((li) => {
        const halves = [...li.querySelectorAll('fd-icon')].map((icon) =>
            icon.className.includes('text-sap-content-rated-color')
        );
        return halves[0] && halves[1] ? 1 : halves[0] ? 0.5 : 0;
    });

async function setup(
    config: { halves?: boolean; displayMode?: boolean; ratings?: Record<number, number>; value?: number | null } = {}
) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    host.halves.set(!!config.halves);
    host.displayMode.set(!!config.displayMode);
    if (config.ratings) host.ratings.set(config.ratings);
    if (config.value !== undefined) host.control.setValue(config.value);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, host, root, slider: root.querySelector<HTMLElement>('[role=slider]')! };
}

describe('RatingIndicator', () => {
    it('is a slider with the rating as its value', async () => {
        const { root, slider } = await setup();
        expect(slider.getAttribute('aria-valuemin')).toBe('0');
        expect(slider.getAttribute('aria-valuemax')).toBe('5');
        expect(slider.getAttribute('aria-valuenow')).toBe('2');
        expect(slider.getAttribute('aria-valuetext')).toBe('2 of 5');
        expect(rated(root)).toEqual([1, 1, 0, 0, 0]);
        expect(root.textContent).toContain('(2 of 5)');
    });

    it('rates with the keyboard', async () => {
        const { fixture, host, slider } = await setup();
        slider.focus();
        await userEvent.keyboard('{ArrowRight}{ArrowRight}');
        expect(host.control.value).toBe(4);
        await userEvent.keyboard('{ArrowLeft}');
        expect(host.control.value).toBe(3);
        await userEvent.keyboard('{End}');
        expect(host.control.value).toBe(5);
        await userEvent.keyboard('{Home}');
        expect(host.control.value).toBe(0);
        await userEvent.keyboard('4');
        await fixture.whenStable();
        expect(host.control.value).toBe(4);
        expect(host.changes()).toBe(6);
    });

    it('rates halves by clicking the first half of a star', async () => {
        const { fixture, host, root } = await setup({ halves: true });
        const star = root.querySelectorAll<HTMLElement>('li')[3];
        const rect = star.getBoundingClientRect();
        await userEvent.click(star, { position: { x: 2, y: rect.height / 2 } });
        expect(host.control.value).toBe(3.5);
        await userEvent.click(star, { position: { x: rect.width - 2, y: rect.height / 2 } });
        await fixture.whenStable();
        expect(host.control.value).toBe(4);
        expect(rated(root)).toEqual([1, 1, 1, 1, 0]);
    });

    it('rounds values to whole or half stars', async () => {
        const { fixture, host, root } = await setup({ halves: true, value: 2.4 });
        expect(rated(root)).toEqual([1, 1, 0.5, 0, 0]);
        host.control.setValue(4.8);
        await fixture.whenStable();
        expect(rated(root)).toEqual([1, 1, 1, 1, 1]);
    });

    it('shows the average and the number of votes of ratings', async () => {
        const { root, slider } = await setup({ value: null, ratings: { 5: 3, 3: 1 } });
        // the average 4.5 rounds down without halves
        expect(slider.getAttribute('aria-valuenow')).toBe('4');
        expect(root.textContent).toContain('(4)');
    });

    it('is read-only in display mode', async () => {
        const { host, slider } = await setup({ displayMode: true });
        expect(slider.getAttribute('aria-readonly')).toBe('true');
        slider.focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(host.control.value).toBe(2);
    });

    it('lists the votes per rating in a named popover with displayAllRatings', async () => {
        const { fixture, host, root } = await setup({ value: null, ratings: { 5: 3, 3: 1 } });
        host.displayAllRatings.set(true);
        await fixture.whenStable();
        const link = root.querySelector<HTMLElement>('a')!;
        expect(link.textContent!.trim()).toBe('4');
        expect(link.getAttribute('aria-label')).toBe('Total ratings 4');
        await userEvent.hover(link);
        await fixture.whenStable();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const body = document.querySelector<HTMLElement>('.cdk-overlay-pane fd-popover-body')!;
        expect(body).not.toBeNull();
        // the dialog needs a name (axe aria-dialog-name)
        expect(body.querySelector('[role=dialog]')!.getAttribute('aria-label')).toBe('Total ratings');
        const items = [...body.querySelectorAll('ul[aria-label="Total ratings"] > li')];
        expect(items.map((item) => item.textContent!.replace(/\s+/g, ' ').trim())).toEqual([
            '5 of 5: (3)',
            '3 of 5: (1)'
        ]);
    });
});

@Component({
    imports: [RatingIndicator, Icon],
    template: `
        <fd-rating-indicator
            ariaLabel="Rating"
            [value]="value()"
            [allowHalves]="halves()"
            [size]="size()"
            [indicatorCapacity]="capacity()"
            [ratedIcon]="ratedIcon()"
            [unratedIcon]="unratedIcon()"
            [dynamicTextIndicator]="indicator()"
        />
        <fd-icon id="ref-rated" glyph="heart" />
        <fd-icon id="ref-unrated" glyph="heart-2" />
        <fd-icon id="ref-star" glyph="favorite" />
        <fd-icon id="ref-empty" glyph="unfavorite" />
    `
})
class OptionsHost {
    readonly value = signal<number | null>(2);
    readonly halves = signal(false);
    readonly size = signal<RatingIndicatorSize>('md');
    readonly capacity = signal<number>(5);
    readonly ratedIcon = signal<string | null>(null);
    readonly unratedIcon = signal<string | null>(null);
    readonly indicator = signal('of');
}

async function setupOptions(configure?: (host: OptionsHost) => void) {
    const fixture = TestBed.createComponent(OptionsHost);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const indicator = root.querySelector<HTMLElement>('fd-rating-indicator')!;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        indicator,
        slider: indicator.querySelector<HTMLElement>('[role=slider]')!,
        stars: () => [...indicator.querySelectorAll<HTMLElement>('[role=slider] li')],
        stable: () => fixture.whenStable()
    };
}

describe('RatingIndicator options', () => {
    it('uses custom rated and unrated icons', async () => {
        const { root, stars, stable, host } = await setupOptions();
        const glyphs = () => stars().map((star) => star.querySelector('fd-icon')!.getAttribute('data-glyph'));
        const ref = (id: string) => root.querySelector(`#${id}`)!.getAttribute('data-glyph');
        expect(glyphs()).toEqual([
            ref('ref-star'),
            ref('ref-star'),
            ref('ref-empty'),
            ref('ref-empty'),
            ref('ref-empty')
        ]);
        host.ratedIcon.set('heart');
        host.unratedIcon.set('heart-2');
        await stable();
        expect(glyphs()).toEqual([
            ref('ref-rated'),
            ref('ref-rated'),
            ref('ref-unrated'),
            ref('ref-unrated'),
            ref('ref-unrated')
        ]);
    });

    it('sizes the icons with size', async () => {
        const { stars, stable, host } = await setupOptions();
        const width = () => stars()[0].getBoundingClientRect().width;
        const sizes: Record<RatingIndicatorSize, number> = { xs: 12, sm: 22, md: 24, lg: 32 };
        for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
            host.size.set(size);
            await stable();
            expect(width()).toBe(sizes[size]);
        }
    });

    it('sets the maximum with indicatorCapacity and falls back to 5 for 0', async () => {
        const { slider, stars, stable, host } = await setupOptions((h) => h.capacity.set(7));
        expect(stars()).toHaveLength(7);
        expect(slider.getAttribute('aria-valuemax')).toBe('7');
        expect(slider.getAttribute('aria-valuetext')).toBe('2 of 7');
        host.capacity.set(4);
        host.halves.set(true);
        host.value.set(3.5);
        await stable();
        expect(stars()).toHaveLength(4);
        expect(slider.getAttribute('aria-valuetext')).toBe('3.5 of 4');
        host.capacity.set(0);
        await stable();
        expect(stars()).toHaveLength(5);
        expect(slider.getAttribute('aria-valuemax')).toBe('5');
    });

    it('shows half values in the value text', async () => {
        const { indicator, slider } = await setupOptions((h) => {
            h.halves.set(true);
            h.value.set(3.5);
        });
        expect(slider.getAttribute('aria-valuenow')).toBe('3.5');
        expect(slider.getAttribute('aria-valuetext')).toBe('3.5 of 5');
        expect(indicator.textContent).toContain('(3.5 of 5)');
    });

    it('puts dynamicTextIndicator between the rating and the maximum', async () => {
        const { indicator, slider } = await setupOptions((h) => h.indicator.set('von'));
        expect(slider.getAttribute('aria-valuetext')).toBe('2 von 5');
        expect(indicator.textContent).toContain('(2 von 5)');
    });
});

describe('RatingIndicator events and forms', () => {
    it('emits ratingChanged on a click', async () => {
        const { fixture, host, root } = await setup();
        await userEvent.click(root.querySelectorAll<HTMLElement>('li')[3]);
        await fixture.whenStable();
        expect(host.control.value).toBe(4);
        expect(host.changes()).toBe(1);
        // the same rating again is no change
        await userEvent.click(root.querySelectorAll<HTMLElement>('li')[3]);
        expect(host.changes()).toBe(1);
    });

    it('disables the rating with a disabled form control', async () => {
        const { fixture, host, root, slider } = await setup();
        host.control.disable();
        await fixture.whenStable();
        expect(slider.getAttribute('tabindex')).toBe('-1');
        expect(slider.getAttribute('aria-disabled')).toBe('true');
        root.querySelectorAll<HTMLElement>('li')[4].click();
        slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        await fixture.whenStable();
        expect(host.control.value).toBe(2);
        expect(host.changes()).toBe(0);
        host.control.enable();
        await fixture.whenStable();
        expect(slider.getAttribute('tabindex')).toBe('0');
        expect(slider.hasAttribute('aria-disabled')).toBe(false);
    });
});
