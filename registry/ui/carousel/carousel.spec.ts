import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    Carousel,
    CarouselDirective,
    CarouselItem,
    CarouselItemDirective,
    type CarouselActiveSlides
} from './carousel';

@Component({
    imports: [Carousel, CarouselItem],
    template: `
        <fd-carousel
            ariaLabel="Slides"
            width="300px"
            [loop]="loop()"
            [vertical]="vertical()"
            [visibleSlidesCount]="count()"
            [slideTransitionDuration]="0"
            (slideChange)="changes.push($event)"
        >
            @for (slide of slides(); track slide) {
                <fd-carousel-item>
                    <div style="width: 300px; height: 100px">Slide {{ slide }}</div>
                </fd-carousel-item>
            }
        </fd-carousel>
    `
})
class Host {
    readonly slides = signal([1, 2, 3, 4]);
    readonly loop = signal(false);
    readonly vertical = signal(false);
    readonly count = signal<number | 'auto'>(1);
    readonly changes: CarouselActiveSlides[] = [];
}

async function setup(config: { slides?: number; loop?: boolean; vertical?: boolean; count?: number } = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.slides) host.slides.set(Array.from({ length: config.slides }, (_, i) => i + 1));
    host.loop.set(!!config.loop);
    host.vertical.set(!!config.vertical);
    if (config.count) host.count.set(config.count);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const listbox = root.querySelector<HTMLElement>('[role=listbox]')!;
    const button = (label: string) => root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    return {
        fixture,
        host,
        root,
        listbox,
        previous: () => button('Go to previous item'),
        next: () => button('Go to next item'),
        selected: () =>
            [...root.querySelectorAll('[role=option][aria-selected=true]')].map((o) => o.textContent!.trim()),
        live: () => root.querySelector('[aria-live]')!.textContent!.replace(/\s+/g, ' ').trim(),
        transform: () => root.querySelector<HTMLElement>('[style*="--carousel-count"]')!.style.transform
    };
}

describe('Carousel', () => {
    it('is a listbox of slides with page indicators', async () => {
        const { root, listbox, selected, live, previous, next } = await setup();
        expect(listbox.getAttribute('aria-roledescription')).toBe('Carousel');
        expect(listbox.getAttribute('aria-label')).toBe('Slides');
        const options = root.querySelectorAll('[role=option]');
        expect(options.length).toBe(4);
        expect(options[2].getAttribute('aria-setsize')).toBe('4');
        expect(options[2].getAttribute('aria-posinset')).toBe('3');
        expect(options[2].getAttribute('aria-hidden')).toBe('true');
        expect(listbox.getAttribute('aria-activedescendant')).toBe(options[0].id);
        expect(selected()).toEqual(['Slide 1']);
        expect(live()).toBe('Displaying item 1 of 4');
        expect(root.querySelectorAll('[role=img]').length).toBe(4);
        expect(root.querySelector('[role=img]')!.getAttribute('aria-label')).toBe('Item 1 of 4 displayed');
        expect(previous().disabled).toBe(true);
        expect(next().disabled).toBe(false);
    });

    it('moves with the buttons and stops at the ends', async () => {
        const { fixture, host, selected, previous, next, transform } = await setup();
        await userEvent.click(next());
        await fixture.whenStable();
        expect(selected()).toEqual(['Slide 2']);
        expect(transform()).toBe('translateX(-300px)');
        expect(host.changes.at(-1)!.slideDirection).toBe('Next');
        await userEvent.click(next());
        await userEvent.click(next());
        await fixture.whenStable();
        expect(selected()).toEqual(['Slide 4']);
        expect(next().disabled).toBe(true);
        await userEvent.click(previous());
        await fixture.whenStable();
        expect(selected()).toEqual(['Slide 3']);
        expect(host.changes.at(-1)!.slideDirection).toBe('Previous');
        expect(host.changes.at(-1)!.activeItems.length).toBe(1);
    });

    it('moves with the arrow keys', async () => {
        const { fixture, listbox, selected } = await setup();
        listbox.focus();
        await userEvent.keyboard('{ArrowRight}{ArrowRight}');
        await fixture.whenStable();
        expect(selected()).toEqual(['Slide 3']);
        await userEvent.keyboard('{ArrowLeft}');
        await fixture.whenStable();
        expect(selected()).toEqual(['Slide 2']);
        // Up and Down only move a vertical carousel
        await userEvent.keyboard('{ArrowDown}');
        await fixture.whenStable();
        expect(selected()).toEqual(['Slide 2']);
        expect(document.activeElement).toBe(listbox);
    });

    it('moves a vertical carousel with Up and Down', async () => {
        const { fixture, listbox, selected, transform } = await setup({ vertical: true });
        listbox.focus();
        await userEvent.keyboard('{ArrowDown}');
        await fixture.whenStable();
        expect(selected()).toEqual(['Slide 2']);
        expect(transform()).toMatch(/^translateY\(-\d+px\)$/);
        await userEvent.keyboard('{ArrowUp}');
        await fixture.whenStable();
        expect(selected()).toEqual(['Slide 1']);
    });

    it('wraps around with loop', async () => {
        const { fixture, selected, previous, next } = await setup({ loop: true });
        expect(previous().disabled).toBe(false);
        await userEvent.click(previous());
        await fixture.whenStable();
        expect(selected()).toEqual(['Slide 4']);
        await userEvent.click(next());
        await fixture.whenStable();
        expect(selected()).toEqual(['Slide 1']);
    });

    it('shows several slides at once', async () => {
        const { fixture, root, selected, next } = await setup({ count: 2 });
        expect(selected()).toEqual(['Slide 1', 'Slide 2']);
        // pages: 4 slides, 2 at a time
        expect(root.querySelectorAll('[role=img]').length).toBe(3);
        await userEvent.click(next());
        await userEvent.click(next());
        await fixture.whenStable();
        expect(selected()).toEqual(['Slide 3', 'Slide 4']);
        expect(next().disabled).toBe(true);
    });

    it('shows a numeric indicator for more than eight slides', async () => {
        const { root } = await setup({ slides: 9 });
        expect(root.querySelectorAll('[role=img]').length).toBe(0);
        expect(root.textContent!.replace(/\s+/g, ' ')).toContain('1 of 9');
    });

    it('slides by dragging', async () => {
        const { fixture, root, selected, host } = await setup();
        const slides = root.querySelector<HTMLElement>('[style*="--carousel-count"]')!;
        const box = slides.getBoundingClientRect();
        const y = box.top + 50;
        const fire = (type: string, target: EventTarget, x: number) =>
            target.dispatchEvent(
                new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0, isPrimary: true })
            );
        fire('pointerdown', slides, box.left + 250);
        fire('pointermove', document, box.left + 150);
        fire('pointermove', document, box.left + 50);
        fire('pointerup', document, box.left + 50);
        await fixture.whenStable();
        expect(selected()).toEqual(['Slide 2']);
        expect(host.changes.at(-1)!.slideDirection).toBe('Next');
    });

    it('goes back to the first slide when the slides change', async () => {
        const { fixture, host, selected, next } = await setup();
        await userEvent.click(next());
        await fixture.whenStable();
        host.slides.set([1, 2, 3]);
        await fixture.whenStable();
        expect(selected()).toEqual(['Slide 1']);
        expect(fixture.nativeElement.querySelectorAll('[role=img]').length).toBe(3);
    });
});

@Component({
    imports: [CarouselDirective, CarouselItemDirective],
    template: `
        <div style="height: 30px; overflow: hidden">
            <div fdCarousel [config]="{ vertical: true, infinite: true, transition: '0ms' }">
                @for (n of numbers; track n) {
                    <div fdCarouselItem [value]="n" style="height: 30px">{{ n }}</div>
                }
            </div>
        </div>
    `
})
class DirectiveHost {
    readonly numbers = [0, 1, 2, 3, 4];
    readonly carousel = viewChild.required(CarouselDirective);
}

describe('CarouselDirective', () => {
    it('keeps the active item in the middle when infinite', async () => {
        const fixture = TestBed.createComponent(DirectiveHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const carousel = fixture.componentInstance.carousel();
        const order = () =>
            [...(fixture.nativeElement as HTMLElement).querySelectorAll('[fdCarouselItem]')].map((e) =>
                Number(e.textContent)
            );
        carousel.goToItem(carousel.items()[0]);
        // the first item moves to the middle: the last ones wrap around before it
        expect(order()).toEqual([3, 4, 0, 1, 2]);
        expect(carousel.engine.currentTransitionPx).toBe(-60);
        carousel.pickPrevious();
        expect(carousel.engine.active?.value()).toBe(4);
        expect(order()).toEqual([2, 3, 4, 0, 1]);
    });
});
