import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Button } from '@/ui/button/button';
import { ContentDensityDirective, type ContentDensity } from './content-density';

@Component({
    imports: [ContentDensityDirective, Button],
    template: `
        <button fdButton label="Root" data-testid="root"></button>
        <section [fdContentDensity]="outer()" data-testid="outer">
            <button fdButton label="Outer" data-testid="outer-button"></button>
            <div fdCozy data-testid="island">
                <button fdButton label="Island" data-testid="island-button"></button>
            </div>
        </section>
        <div fdCompact data-testid="compact"></div>
        <div fdCondensed data-testid="condensed"></div>
        <div fdCozy data-testid="cozy"></div>
        <div fdContentDensity="condensed" fdCompact data-testid="explicit"></div>
        <div fdContentDensity data-testid="none"></div>
    `
})
class Host {
    readonly outer = signal<ContentDensity | null>(null);
}

async function setup(outer: ContentDensity | null = null) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.outer.set(outer);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
    const height = (id: string) => el(id).getBoundingClientRect().height;
    return { fixture, host: fixture.componentInstance, el, height };
}

describe('ContentDensity', () => {
    it('sets data-density from the explicit input or the shorthands', async () => {
        const { el } = await setup();
        expect(el('outer').hasAttribute('data-density')).toBe(false);
        expect(el('compact').getAttribute('data-density')).toBe('compact');
        expect(el('condensed').getAttribute('data-density')).toBe('condensed');
        expect(el('cozy').getAttribute('data-density')).toBe('cozy');
        // the explicit density wins over a shorthand
        expect(el('explicit').getAttribute('data-density')).toBe('condensed');
        // an empty attribute sets no density
        expect(el('none').hasAttribute('data-density')).toBe(false);
    });

    it('data-density="compact" on an ancestor switches compact: utilities on descendants', async () => {
        const { fixture, host, el, height } = await setup();
        const cozy = height('outer-button');
        expect(cozy).toBe(height('root'));

        host.outer.set('compact');
        await fixture.whenStable();
        expect(el('outer').getAttribute('data-density')).toBe('compact');
        expect(height('outer-button')).toBeLessThan(cozy);
        // outside the subtree nothing changes
        expect(height('root')).toBe(cozy);

        host.outer.set('cozy');
        await fixture.whenStable();
        expect(height('outer-button')).toBe(cozy);
    });

    it('density on the document element applies to the whole page', async () => {
        const { height } = await setup();
        const cozy = height('root');
        document.documentElement.setAttribute('data-density', 'compact');
        try {
            expect(height('root')).toBeLessThan(cozy);
            // a cozy island still restores cozy sizes
            expect(height('island-button')).toBe(cozy);
        } finally {
            document.documentElement.removeAttribute('data-density');
        }
    });

    it('a cozy island inside a compact subtree restores cozy sizes', async () => {
        const { height } = await setup('compact');
        const cozy = height('root');
        expect(height('outer-button')).toBeLessThan(cozy);
        expect(height('island-button')).toBe(cozy);
    });

    it('condensed falls back to compact sizes where no condensed size exists', async () => {
        const { fixture, host, height } = await setup('compact');
        const compact = height('outer-button');

        host.outer.set('condensed');
        await fixture.whenStable();
        expect(height('outer-button')).toBe(compact);
        expect(height('outer-button')).toBeLessThan(height('root'));
        // a cozy island resets condensed as well
        expect(height('island-button')).toBe(height('root'));
    });
});
