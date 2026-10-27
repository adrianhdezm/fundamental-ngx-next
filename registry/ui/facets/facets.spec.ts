import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { Icon } from '@/ui/icon/icon';
import { ObjectStatusComponent } from '@/ui/object-status/object-status';
import { Facet, FacetContainer, FacetContent, FacetFormValue, FacetGroup } from './facets';

@Component({
    imports: [Facet, FacetGroup, FacetContent, FacetFormValue, FacetContainer, ObjectStatusComponent, Icon],
    template: `
        <div [style.width.px]="width()">
            <fd-facet-group ariaLabel="Product facets">
                <fd-facet id="form" type="form" facetTitle="Technical data" [headingLevel]="level()">
                    <fd-facet-content id="row1"
                        ><span>Base unit:</span><span fd-facet-form-value>Each</span></fd-facet-content
                    >
                    <fd-facet-content id="row2"
                        ><fd-icon glyph="accept" /><span fd-facet-form-value>Checked</span></fd-facet-content
                    >
                    <fd-facet-content id="row3"
                        ><span>Width:</span><span fd-facet-form-value>86 cm</span></fd-facet-content
                    >
                </fd-facet>
                <fd-facet id="kv" type="key-value" facetTitle="Status">
                    <span id="kv-status" fd-object-status status="positive" label="Delivered" large></span>
                </fd-facet>
                <fd-facet id="rating" type="rating-indicator" facetTitle="Rating" subtitle="12 reviews">
                    <fd-facet-content><span id="stars">4 of 5</span></fd-facet-content>
                </fd-facet>
                <fd-facet id="image" type="image" facetTitle="Ignored"><span id="img">Image</span></fd-facet>
                <fd-facet id="end" type="key-value" facetTitle="Price" alignEnd
                    ><span id="price">12 EUR</span></fd-facet
                >
            </fd-facet-group>
            <span id="plain-status" fd-object-status status="positive" label="Delivered" large></span>
            <fd-facet-container id="container" flexDirection="row" alignItems="center" [flexGap]="2">
                <span>One</span><span>Two</span>
            </fd-facet-container>
        </div>
    `
})
class Host {
    readonly width = signal(1200);
    readonly level = signal<number | undefined>(undefined);
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const el = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
    return { fixture, host: fixture.componentInstance, root, el, stable: () => fixture.whenStable() };
}

function cssFont(variable: string): string {
    const probe = document.createElement('div');
    probe.style.fontFamily = `var(${variable})`;
    document.body.appendChild(probe);
    const font = getComputedStyle(probe).fontFamily;
    probe.remove();
    return font;
}

describe('Facets', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('dir');
    });

    it('facet group is a group with an accessible name; facets wrap with the reference spacing', async () => {
        const { host, root, el, stable } = await setup();
        const group = root.querySelector<HTMLElement>('fd-facet-group')!;
        expect(group.getAttribute('role')).toBe('group');
        await expect.element(page.getByRole('group', { name: 'Product facets' })).toBeInTheDocument();
        expect(getComputedStyle(group).columnGap).toBe('32px');
        expect(getComputedStyle(el('form')).marginInlineEnd).toBe('32px');
        expect(getComputedStyle(el('form')).marginBottom).toBe('16px');
        expect(el('kv').getBoundingClientRect().top).toBe(el('form').getBoundingClientRect().top);
        host.width.set(300);
        await stable();
        // on a narrow width the facets wrap to new lines
        expect(el('kv').getBoundingClientRect().top).toBeGreaterThan(el('form').getBoundingClientRect().bottom);
    });

    it('non-image facets are groups labelled by their title; headingLevel makes the title a heading', async () => {
        const { host, el, stable } = await setup();
        const facet = el('form');
        expect(facet.getAttribute('role')).toBe('group');
        const title = document.getElementById(facet.getAttribute('aria-labelledby')!)!;
        expect(title.textContent!.trim()).toBe('Technical data');
        expect(title.hasAttribute('role')).toBe(false);
        await expect.element(page.getByRole('group', { name: 'Technical data' })).toBeInTheDocument();
        await expect.element(page.getByRole('group', { name: 'Status' })).toBeInTheDocument();
        host.level.set(3);
        await stable();
        expect(title.getAttribute('role')).toBe('heading');
        expect(title.getAttribute('aria-level')).toBe('3');
        await expect.element(page.getByRole('heading', { name: 'Technical data', level: 3 })).toBeInTheDocument();
    });

    it('image facets come first (order -1) and have no title', async () => {
        const { el } = await setup();
        const image = el('image');
        expect(image.hasAttribute('role')).toBe(false);
        expect(image.hasAttribute('aria-labelledby')).toBe(false);
        expect(image.textContent!.trim()).toBe('Image');
        expect(getComputedStyle(image).order).toBe('-1');
        // the image is the last in the DOM but the first in the row
        expect(image.getBoundingClientRect().left).toBeLessThan(el('form').getBoundingClientRect().left);
        expect(getComputedStyle(image).marginBottom).toBe('0px');
    });

    it('form facet rows space evenly and icons get an end margin', async () => {
        const { el } = await setup();
        const rows = ['row1', 'row2', 'row3'].map(el);
        expect(rows.map((r) => getComputedStyle(r).marginBottom)).toEqual(['8px', '8px', '0px']);
        expect(rows.map((r) => getComputedStyle(r).alignItems)).toEqual(['baseline', 'baseline', 'baseline']);
        expect(getComputedStyle(rows[0]).columnGap).toBe('4px');
        const gaps = [
            rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().bottom,
            rows[2].getBoundingClientRect().top - rows[1].getBoundingClientRect().bottom
        ];
        expect(gaps[0]).toBeCloseTo(gaps[1], 0);
        expect(getComputedStyle(rows[1].querySelector('fd-icon')!).marginInlineEnd).toBe('8px');
        // the rows stack in a column
        expect(rows[1].getBoundingClientRect().top).toBeGreaterThan(rows[0].getBoundingClientRect().top);
    });

    it('key-value facets use the regular font family for large object statuses', async () => {
        const { el } = await setup();
        const regular = cssFont('--sapFontFamily');
        expect(getComputedStyle(el('kv-status')).fontFamily).toBe(regular);
        expect(getComputedStyle(el('plain-status')).fontFamily).not.toBe(regular);
    });

    it('rating facet shows the subtitle (review count) under the title', async () => {
        const { el, root } = await setup();
        const rating = el('rating');
        const [title, subtitle] = [...rating.children] as HTMLElement[];
        expect(title.textContent!.trim()).toBe('Rating');
        expect(subtitle.textContent).toBe('12 reviews');
        expect(subtitle.getBoundingClientRect().top).toBeGreaterThanOrEqual(title.getBoundingClientRect().bottom);
        expect(el('stars').getBoundingClientRect().top).toBeGreaterThanOrEqual(subtitle.getBoundingClientRect().bottom);
        // other facet types ignore the subtitle
        expect(root.querySelector('#kv')!.textContent).not.toContain('reviews');
    });

    it('alignEnd pushes the facet to the end in LTR and RTL', async () => {
        const { root, el } = await setup();
        const group = root.querySelector<HTMLElement>('fd-facet-group')!;
        const groupRect = () => group.getBoundingClientRect();
        expect(el('price').getBoundingClientRect().right).toBeCloseTo(groupRect().right, 0);
        expect(el('end').getBoundingClientRect().left).toBeGreaterThan(el('rating').getBoundingClientRect().right);
        document.documentElement.setAttribute('dir', 'rtl');
        expect(el('price').getBoundingClientRect().left).toBeCloseTo(groupRect().left, 0);
        expect(el('end').getBoundingClientRect().right).toBeLessThan(el('rating').getBoundingClientRect().left);
    });

    it('facet container lays out its content with the given flex options', async () => {
        const { el } = await setup();
        const style = getComputedStyle(el('container'));
        expect(style.display).toBe('flex');
        expect(style.flexDirection).toBe('row');
        expect(style.alignItems).toBe('center');
        expect(style.columnGap).toBe('32px');
    });
});
