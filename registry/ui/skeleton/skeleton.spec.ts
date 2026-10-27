import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';
import { Skeleton, type SkeletonType } from './skeleton';

@Component({
    imports: [Skeleton],
    template: `
        <fd-skeleton
            id="main"
            [type]="type()"
            [width]="width()"
            [height]="height()"
            [textLines]="textLines()"
            [animated]="animated()"
        />
        <fd-skeleton id="second" type="rectangle" width="40px" height="20px" />
        <fd-skeleton id="custom" width="160px" height="50px">
            <svg:circle cx="25" cy="25" r="25" />
            <svg:rect x="60" y="0" width="100" height="16" rx="4" />
        </fd-skeleton>
        <div style="width: 300px">
            <fd-skeleton id="bare" />
            <fd-skeleton id="text-default" type="text" />
            <fd-skeleton id="text-string" type="text" textLines="2" />
        </div>
    `
})
class Host {
    readonly type = signal<SkeletonType | null>('rectangle');
    readonly width = signal<string | null>('100px');
    readonly height = signal<string | null>('50px');
    readonly textLines = signal(3);
    readonly animated = signal(true);
}

async function setup(configure?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const skeleton = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
    const parts = (id: string) => {
        const el = skeleton(id);
        return {
            el,
            svg: el.querySelector('svg')!,
            mask: el.querySelector('mask')!,
            gradient: el.querySelector('linearGradient')!,
            fillRect: el.querySelector<SVGRectElement>('svg > rect')!
        };
    };
    return { fixture, host: fixture.componentInstance, root, parts, stable: () => fixture.whenStable() };
}

const size = (el: Element) => {
    const { width, height } = el.getBoundingClientRect();
    return [width, height];
};

describe('Skeleton', () => {
    afterEach(async () => {
        await cdp().send('Emulation.setEmulatedMedia', { features: [] });
    });

    it('rectangle fills the given size with a rounded rectangle', async () => {
        const { parts } = await setup();
        const { el, svg, mask } = parts('main');
        expect(size(el)).toEqual([100, 50]);
        expect(svg.getAttribute('aria-hidden')).toBe('true');
        const shapes = [...mask.children];
        expect(shapes).toHaveLength(1);
        expect(shapes[0].tagName).toBe('rect');
        expect(shapes[0].getAttribute('width')).toBe('100%');
        expect(shapes[0].getAttribute('height')).toBe('100%');
        expect(shapes[0].getAttribute('rx')).toBe('4');
        expect(getComputedStyle(el).cursor).toBe('wait');
    });

    it('circle is square when only width or height is given', async () => {
        const { host, parts, stable } = await setup((h) => {
            h.type.set('circle');
            h.height.set(null);
            h.width.set('40px');
        });
        const { el, mask } = parts('main');
        expect(size(el)).toEqual([40, 40]);
        expect(mask.querySelector('circle')!.getAttribute('r')).toBe('50%');
        host.width.set(null);
        host.height.set('30px');
        await stable();
        expect(size(el)).toEqual([30, 30]);
    });

    it('text draws textLines lines, the last of several at 60% width', async () => {
        const { host, parts, stable } = await setup((h) => {
            h.type.set('text');
            h.height.set(null);
            h.width.set('200px');
        });
        const { el, mask } = parts('main');
        const lines = () => [...mask.querySelectorAll('rect')];
        expect(lines().map((l) => [l.getAttribute('y'), l.getAttribute('width')])).toEqual([
            ['0', '100%'],
            ['20', '100%'],
            ['40', '60%']
        ]);
        expect(size(el)).toEqual([200, 60]);
        host.textLines.set(2);
        await stable();
        expect(lines().map((l) => l.getAttribute('width'))).toEqual(['100%', '60%']);
        expect(size(el)).toEqual([200, 40]);
        host.textLines.set(1);
        await stable();
        expect(lines().map((l) => l.getAttribute('width'))).toEqual(['100%']);
        expect(size(el)).toEqual([200, 8]);
    });

    it('text with textLines 0 draws no lines but keeps the one-line height', async () => {
        const { parts } = await setup((h) => {
            h.type.set('text');
            h.height.set(null);
            h.width.set('200px');
            h.textLines.set(0);
        });
        const { el, mask } = parts('main');
        expect(mask.querySelectorAll('rect')).toHaveLength(0);
        expect(size(el)).toEqual([200, 8]);
    });

    it('uses type null, 3 text lines and no size by default', async () => {
        const { parts } = await setup();
        const bare = parts('bare');
        expect(bare.mask.children).toHaveLength(0);
        expect(bare.el.style.width).toBe('');
        expect(bare.el.style.height).toBe('');
        const text = parts('text-default');
        expect([...text.mask.querySelectorAll('rect')].map((l) => l.getAttribute('width'))).toEqual([
            '100%',
            '100%',
            '60%'
        ]);
        expect(size(text.el)).toEqual([300, 60]);
    });

    it('coerces a string textLines attribute', async () => {
        const { parts } = await setup();
        const { el, mask } = parts('text-string');
        expect([...mask.querySelectorAll('rect')].map((l) => l.getAttribute('width'))).toEqual(['100%', '60%']);
        expect(size(el)).toEqual([300, 40]);
    });

    it('text without a width fills its container', async () => {
        const { parts, root } = await setup((h) => {
            h.type.set('text');
            h.width.set(null);
            h.height.set(null);
        });
        root.style.display = 'block';
        root.style.width = '300px';
        expect(size(parts('main').el)[0]).toBe(300);
    });

    it('custom SVG shapes are projected into the mask', async () => {
        const { parts } = await setup();
        const { el, mask } = parts('custom');
        expect(size(el)).toEqual([160, 50]);
        const shapes = [...mask.children];
        expect(shapes.map((s) => s.tagName)).toEqual(['circle', 'rect']);
        expect(shapes.every((s) => s instanceof SVGElement)).toBe(true);
        expect(shapes[0].getAttribute('r')).toBe('25');
    });

    it('each instance has unique gradient and mask ids that its fill references', async () => {
        const { parts } = await setup();
        const ids = new Set<string>();
        for (const id of ['main', 'second', 'custom']) {
            const { mask, gradient, fillRect } = parts(id);
            ids.add(mask.id);
            ids.add(gradient.id);
            expect(fillRect.getAttribute('mask')).toBe(`url(#${mask.id})`);
            expect(fillRect.getAttribute('fill')).toBe(`url(#${gradient.id})`);
            expect(document.querySelectorAll(`[id="${mask.id}"]`)).toHaveLength(1);
        }
        expect(ids.size).toBe(6);
    });

    it('animates with the shimmer gradient by default', async () => {
        const { parts } = await setup();
        const { fillRect, gradient } = parts('main');
        expect(getComputedStyle(fillRect).fill).toContain(`#${gradient.id}`);
        expect(gradient.querySelector('animate')!.getAttribute('repeatCount')).toBe('indefinite');
        const animatedStop = gradient.querySelectorAll('stop')[1];
        expect(getComputedStyle(animatedStop).animationName).not.toBe('none');
    });

    it('animated=false uses a solid fill', async () => {
        const { parts } = await setup((h) => h.animated.set(false));
        const { fillRect } = parts('main');
        expect(fillRect.hasAttribute('fill')).toBe(false);
        expect(getComputedStyle(fillRect).fill).toMatch(/^rgb/);
    });

    it('prefers-reduced-motion uses a solid fill and stops the CSS animation', async () => {
        const { parts } = await setup();
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
        });
        expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
        const { fillRect, gradient } = parts('main');
        expect(getComputedStyle(fillRect).fill).toMatch(/^rgb/);
        expect(getComputedStyle(gradient.querySelectorAll('stop')[1]).animationName).toBe('none');
    });
});
