import { Component } from '@angular/core';
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
    QuickViewSubheaderTitle
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
});
