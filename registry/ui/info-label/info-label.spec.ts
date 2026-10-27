import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { InfoLabel, type InfoLabelColor, type InfoLabelType } from './info-label';

@Component({
    imports: [InfoLabel],
    template: `
        <fd-info-label
            id="label"
            [type]="type()"
            [label]="label()"
            [glyph]="glyph()"
            [color]="color()"
            [display]="display()"
            [title]="title()"
            [ariaLabel]="ariaLabel()"
            [srText]="srText()"
        />
        <span id="probe"></span>
    `
})
class Host {
    readonly type = signal<InfoLabelType | null>(null);
    readonly label = signal<string | null>('In stock');
    readonly glyph = signal<string | null>(null);
    readonly color = signal<InfoLabelColor | `${InfoLabelColor}` | null>(null);
    readonly display = signal(false);
    readonly title = signal<string | null>(null);
    readonly ariaLabel = signal<string | null>(null);
    readonly srText = signal('Info Label');
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const label = root.querySelector<HTMLElement>('#label')!;
    const probe = root.querySelector<HTMLElement>('#probe')!;
    return {
        fixture,
        label,
        icon: () => label.querySelector<HTMLElement>('fd-icon'),
        text: () => label.querySelector<HTMLElement>('span:not(.sr-only-sap)'),
        srOnly: () => label.querySelector<HTMLElement>('.sr-only-sap')!,
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

describe('InfoLabel', () => {
    afterEach(() => document.documentElement.removeAttribute('data-sap-theme'));

    it('colors 1–10 use the accent tokens (high contrast palette in HCB/HCW)', async () => {
        const { label, resolve, update } = await setup();
        // default colour 7
        expect(getComputedStyle(label).backgroundColor).toBe(resolve('--sapAvatar_7_Background'));
        expect(getComputedStyle(label).color).toBe(resolve('--sapAvatar_7_TextColor'));

        for (let c = 1; c <= 10; c++) {
            await update((h) => h.color.set(c as InfoLabelColor));
            expect(getComputedStyle(label).backgroundColor).toBe(resolve(`--sapAvatar_${c}_Background`));
            expect(getComputedStyle(label).color).toBe(resolve(`--sapAvatar_${c}_TextColor`));
            expect(getComputedStyle(label).borderColor).toBe(resolve(`--sapAvatar_${c}_Background`));
        }
        // strings work too; out-of-range values fall back to 7
        await update((h) => h.color.set('3'));
        expect(getComputedStyle(label).backgroundColor).toBe(resolve('--sapAvatar_3_Background'));
        await update((h) => h.color.set(42 as InfoLabelColor));
        expect(getComputedStyle(label).backgroundColor).toBe(resolve('--sapAvatar_7_Background'));

        await update((h) => h.color.set(1));
        const horizon = getComputedStyle(label).backgroundColor;
        document.documentElement.setAttribute('data-sap-theme', 'sap_horizon_hcb');
        expect(getComputedStyle(label).backgroundColor).toBe('rgb(54, 36, 1)');
        expect(getComputedStyle(label).color).toBe('rgb(253, 165, 3)');
        expect(getComputedStyle(label).backgroundColor).not.toBe(horizon);
        document.documentElement.setAttribute('data-sap-theme', 'sap_horizon_hcw');
        expect(getComputedStyle(label).backgroundColor).toBe('rgb(255, 194, 24)');
        expect(getComputedStyle(label).color).toBe('rgb(95, 41, 0)');
    });

    it('label with glyph, glyph only (needs ariaLabel), numeric type', async () => {
        const { label, icon, text, update } = await setup();
        expect(icon()).toBeNull();
        expect(text()!.textContent).toBe('In stock');

        await update((h) => {
            h.type.set('icon');
            h.glyph.set('employee');
            h.label.set('Owner');
        });
        expect(icon()!.dataset['glyph']).toBeTruthy();
        expect(icon()!.getAttribute('aria-hidden')).toBe('true');
        expect(icon()!.compareDocumentPosition(text()!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        // icon and text sit side by side, vertically centred
        const ir = icon()!.getBoundingClientRect();
        const tr = text()!.getBoundingClientRect();
        expect(ir.right).toBeLessThanOrEqual(tr.left);
        expect(Math.abs(ir.top + ir.height / 2 - (tr.top + tr.height / 2))).toBeLessThanOrEqual(1);

        // glyph only: the icon carries the accessible name
        await update((h) => {
            h.label.set(null);
            h.ariaLabel.set('Employee');
        });
        expect(text()).toBeNull();
        expect(icon()!.getAttribute('role')).toBe('img');
        expect(icon()!.getAttribute('aria-label')).toBe('Employee');
        await expect.element(page.getByRole('img', { name: 'Employee' })).toBeInTheDocument();

        // numeric: the label holds the number, title explains it
        await update((h) => {
            h.type.set('numeric');
            h.glyph.set(null);
            h.ariaLabel.set(null);
            h.label.set('42k');
            h.title.set('Users');
        });
        expect(icon()).toBeNull();
        expect(text()!.textContent).toBe('42k');
        expect(text()!.title).toBe('Users');
        expect(label.getBoundingClientRect().height).toBe(22);
    });

    it('ariaLabel of a text label goes to the text', async () => {
        const { text, update } = await setup();
        expect(text()!.hasAttribute('aria-label')).toBe(false);
        await update((h) => {
            h.glyph.set('employee');
            h.ariaLabel.set('Status: in stock');
        });
        expect(text()!.getAttribute('aria-label')).toBe('Status: in stock');
        // not repeated on the icon
        expect(text()!.parentElement!.querySelector('fd-icon')!.hasAttribute('aria-label')).toBe(false);
    });

    it('display variant and srText for assistive technology', async () => {
        const { label, text, srOnly, update } = await setup();
        expect(label.getBoundingClientRect().height).toBe(22);
        expect(getComputedStyle(text()!).fontSize).toBe('14px');

        await update((h) => h.display.set(true));
        expect(label.getBoundingClientRect().height).toBe(16);
        expect(getComputedStyle(text()!).fontSize).toBe('12px');

        expect(srOnly().textContent).toBe('Info Label');
        expect(srOnly().getBoundingClientRect().width).toBeLessThanOrEqual(1);
        await update((h) => h.srText.set('Stock status'));
        expect(srOnly().textContent).toBe('Stock status');
    });
});
