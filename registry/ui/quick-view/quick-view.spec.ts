import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
    QuickView,
    QuickViewGroup,
    QuickViewGroupItem,
    QuickViewGroupItemContent,
    QuickViewGroupItemContentElement,
    QuickViewGroupItemLabel,
    QuickViewGroupTitle,
    QuickViewSubheader,
    QuickViewSubheaderSubtitle,
    QuickViewSubheaderTitle,
    QuickViewTitle
} from './quick-view';

@Component({
    imports: [
        QuickView,
        QuickViewSubheader,
        QuickViewSubheaderTitle,
        QuickViewGroup,
        QuickViewGroupTitle,
        QuickViewGroupItem,
        QuickViewGroupItemLabel,
        QuickViewGroupItemContent,
        QuickViewGroupItemContentElement
    ],
    template: `
        <fd-quick-view>
            <fd-quick-view-subheader
                ><fd-quick-view-subheader-title>Ann Smith</fd-quick-view-subheader-title></fd-quick-view-subheader
            >
            <fd-quick-view-group>
                <fd-quick-view-group-title [headingLevel]="4">Contact</fd-quick-view-group-title>
                <fd-quick-view-group-item>
                    <fd-quick-view-group-item-label>Email</fd-quick-view-group-item-label>
                    <fd-quick-view-group-item-content>
                        <a fd-quick-view-group-item-content-element href="mailto:ann@example.com"
                            >ann&#64;example.com</a
                        >
                    </fd-quick-view-group-item-content>
                </fd-quick-view-group-item>
            </fd-quick-view-group>
        </fd-quick-view>
    `
})
class Host {}

const LONG = 'A very long text that does not fit on one line of the quick view and has to wrap or truncate';

@Component({
    imports: [
        QuickView,
        QuickViewTitle,
        QuickViewSubheader,
        QuickViewSubheaderTitle,
        QuickViewSubheaderSubtitle,
        QuickViewGroup,
        QuickViewGroupTitle,
        QuickViewGroupItem,
        QuickViewGroupItemLabel,
        QuickViewGroupItemContent,
        QuickViewGroupItemContentElement
    ],
    template: `
        <fd-quick-view id="employee" style="width: 320px">
            <fd-quick-view-title [align]="align()"><span data-testid="title">Employee</span></fd-quick-view-title>
            <fd-quick-view-subheader>
                <fd-quick-view-subheader-title [allowWrap]="wrap()">${LONG}</fd-quick-view-subheader-title>
                <fd-quick-view-subheader-subtitle [allowWrap]="wrap()">${LONG}</fd-quick-view-subheader-subtitle>
            </fd-quick-view-subheader>
            <fd-quick-view-group>
                <fd-quick-view-group-title [allowWrap]="wrap()">${LONG}</fd-quick-view-group-title>
                <fd-quick-view-group-item>
                    <fd-quick-view-group-item-label [allowWrap]="wrap()">${LONG}</fd-quick-view-group-item-label>
                    <fd-quick-view-group-item-content>
                        <div fd-quick-view-group-item-content-element>Value</div>
                    </fd-quick-view-group-item-content>
                </fd-quick-view-group-item>
            </fd-quick-view-group>
        </fd-quick-view>
    `
})
class LayoutHost {
    readonly align = signal<'left' | 'middle' | 'right'>('middle');
    readonly wrap = signal(false);
}

async function setupLayout() {
    const fixture = TestBed.createComponent(LayoutHost);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

describe('QuickView', () => {
    it('labels each value with its label and marks titles as headings', async () => {
        const fixture = TestBed.createComponent(Host);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        const value = el.querySelector('a')!;
        const ids = value.getAttribute('aria-labelledby')!.split(' ');
        expect(ids.map((id) => document.getElementById(id)!.textContent!.trim())).toEqual(['Email', 'ann@example.com']);
        const headings = [...el.querySelectorAll('[role=heading]')];
        expect(headings.map((h) => [h.textContent!.trim(), h.getAttribute('aria-level')])).toEqual([
            ['Ann Smith', '5'],
            ['Contact', '4']
        ]);
        expect(el.querySelector('fd-form-group')!.getAttribute('role')).toBe('group');
    });

    it('names each group by its title', async () => {
        const fixture = TestBed.createComponent(Host);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        const group = el.querySelector('fd-quick-view-group [role=group]')!;
        const title = el.querySelector('fd-quick-view-group-title [role=heading]')!;
        expect(title.id).toMatch(/^fd-quick-view-group-title-/);
        expect(group.getAttribute('aria-labelledby')).toBe(title.id);
        expect(document.getElementById(group.getAttribute('aria-labelledby')!)!.textContent!.trim()).toBe('Contact');
    });

    it('renders the id on the quick view', async () => {
        const { el } = await setupLayout();
        expect(el.querySelector('fd-quick-view > div')!.id).toBe('employee');
        const fixture = TestBed.createComponent(Host);
        await fixture.whenStable();
        // a generated id when none is given
        expect((fixture.nativeElement as HTMLElement).querySelector('fd-quick-view > div')!.id).toMatch(
            /^fd-quick-view-\d+$/
        );
    });

    it('shows the title in a header bar on the left, middle or right by align', async () => {
        const { fixture, host, el } = await setupLayout();
        const bar = () => el.querySelector('fd-quick-view-title [fd-bar]')!.getBoundingClientRect();
        const title = () => el.querySelector('[data-testid="title"]')!.getBoundingClientRect();
        const centre = (r: DOMRect) => (r.left + r.right) / 2;

        expect(Math.abs(centre(title()) - centre(bar()))).toBeLessThanOrEqual(2);

        host.align.set('left');
        await fixture.whenStable();
        expect(title().left - bar().left).toBeLessThan(bar().width / 4);
        expect(centre(title())).toBeLessThan(centre(bar()) - 20);

        host.align.set('right');
        await fixture.whenStable();
        expect(bar().right - title().right).toBeLessThan(bar().width / 4);
        expect(centre(title())).toBeGreaterThan(centre(bar()) + 20);
    });

    it('allowWrap wraps the titles and labels instead of truncating', async () => {
        const { fixture, host, el } = await setupLayout();
        const texts = () =>
            [
                'fd-quick-view-subheader-title [role=heading]',
                'fd-quick-view-subheader-subtitle > div',
                'fd-quick-view-group-title [role=heading]',
                'fd-quick-view-group-item-label label > span'
            ].map((selector) => el.querySelector<HTMLElement>(selector)!);
        const lineHeight = (e: HTMLElement) => parseFloat(getComputedStyle(e).fontSize) * 1.6;

        for (const text of texts()) {
            expect(getComputedStyle(text).textOverflow).toBe('ellipsis');
            expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
            expect(text.getBoundingClientRect().height).toBeLessThan(lineHeight(text));
        }

        host.wrap.set(true);
        await fixture.whenStable();
        for (const text of texts()) {
            expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
            expect(text.getBoundingClientRect().height).toBeGreaterThan(lineHeight(text));
        }
    });
});
