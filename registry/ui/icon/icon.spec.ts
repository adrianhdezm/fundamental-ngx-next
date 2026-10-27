import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { Icon, iconGlyphChar, type IconBackground, type IconColor, type IconFont, type IconSize } from './icon';

@Component({
    imports: [Icon],
    template: `
        <fd-icon
            id="icon"
            [glyph]="glyph()"
            [font]="font()"
            [size]="size()"
            [color]="color()"
            [background]="background()"
            [ariaLabel]="ariaLabel()"
            [ariaHidden]="ariaHidden()"
        />
        <span id="probe"></span>
    `
})
class Host {
    readonly glyph = signal<string | null>('accept');
    readonly font = signal<IconFont>('SAP-icons');
    readonly size = signal<IconSize>('default');
    readonly color = signal<IconColor>('inherit');
    readonly background = signal<IconBackground>('none');
    readonly ariaLabel = signal<string | null>(null);
    readonly ariaHidden = signal<boolean | null>(null);
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const icon = root.querySelector<HTMLElement>('#icon')!;
    const probe = root.querySelector<HTMLElement>('#probe')!;
    /** The computed colour of a theme variable, to compare with the icon's colours. */
    const resolve = (variable: string) => {
        probe.style.color = `var(${variable})`;
        return getComputedStyle(probe).color;
    };
    return {
        fixture,
        host: fixture.componentInstance,
        icon,
        resolve,
        before: () => getComputedStyle(icon, '::before'),
        update: async (change: (host: Host) => void) => {
            change(fixture.componentInstance);
            await fixture.whenStable();
        }
    };
}

describe('Icon', () => {
    afterEach(() => document.documentElement.removeAttribute('dir'));

    it('resolves glyph names of SAP-icons, TNT and Business Suite fonts; unknown glyph renders nothing', async () => {
        const { icon, before, update } = await setup();
        expect(icon.dataset['glyph']).toBe(String.fromCodePoint(0xe05b));
        expect(before().content).toBe(`"${String.fromCodePoint(0xe05b)}"`);
        expect(before().fontFamily).toContain('SAP-icons');

        await update((h) => {
            h.font.set('SAP-icons-TNT');
            h.glyph.set('actor');
        });
        expect(icon.dataset['glyph']).toBe(String.fromCodePoint(0xe03c));
        expect(before().fontFamily).toContain('SAP-icons-TNT');

        await update((h) => {
            h.font.set('BusinessSuiteInAppSymbols');
            h.glyph.set('add-note');
        });
        expect(icon.dataset['glyph']).toBe(String.fromCodePoint(0xe008));
        expect(before().fontFamily).toContain('SAP-icons-Business-Suite');

        // a name of another font does not resolve
        await update((h) => h.glyph.set('accept'));
        expect(icon.hasAttribute('data-glyph')).toBe(false);
        await update((h) => {
            h.font.set('SAP-icons');
            h.glyph.set('no-such-glyph');
        });
        expect(icon.hasAttribute('data-glyph')).toBe(false);
        expect(before().content).toBe('""');
        await update((h) => h.glyph.set(null));
        expect(icon.hasAttribute('data-glyph')).toBe(false);
        expect(iconGlyphChar('accept')).toBe(String.fromCodePoint(0xe05b));
        expect(iconGlyphChar('nope')).toBe('');
    });

    it('mirrored glyphs flip in RTL', async () => {
        const { icon, update } = await setup();
        await update((h) => h.glyph.set('arrow-left'));
        expect(getComputedStyle(icon).scale).toBe('none');

        document.documentElement.dir = 'rtl';
        expect(getComputedStyle(icon).scale.startsWith('-1')).toBe(true);

        // glyphs without a mirrored form keep their direction
        await update((h) => h.glyph.set('accept'));
        expect(getComputedStyle(icon).scale).toBe('none');
    });

    it('decorative icons are aria-hidden; ariaLabel makes them role img', async () => {
        const { icon, update } = await setup();
        expect(icon.getAttribute('aria-hidden')).toBe('true');
        expect(icon.getAttribute('role')).toBe('presentation');
        expect(icon.hasAttribute('aria-label')).toBe(false);

        await update((h) => h.ariaLabel.set('Accepted'));
        expect(icon.getAttribute('role')).toBe('img');
        expect(icon.getAttribute('aria-label')).toBe('Accepted');
        expect(icon.hasAttribute('aria-hidden')).toBe(false);

        // an explicit ariaHidden wins
        await update((h) => h.ariaHidden.set(true));
        expect(icon.getAttribute('aria-hidden')).toBe('true');
        await update((h) => {
            h.ariaLabel.set(null);
            h.ariaHidden.set(false);
        });
        expect(icon.getAttribute('aria-hidden')).toBe('false');
    });

    it('size, color and background variants', async () => {
        const { icon, resolve, update } = await setup();
        const sizes: [IconSize, string][] = [
            ['default', '16px'],
            ['sm', '16px'],
            ['md', '32px'],
            ['lg', '48px'],
            ['xl', '64px'],
            ['xxl', '80px']
        ];
        for (const [size, px] of sizes) {
            await update((h) => h.size.set(size));
            expect(getComputedStyle(icon).fontSize).toBe(px);
        }

        // inherits the text colour by default
        icon.parentElement!.style.color = 'rgb(1, 2, 3)';
        expect(getComputedStyle(icon).color).toBe('rgb(1, 2, 3)');
        await update((h) => h.color.set('negative'));
        expect(getComputedStyle(icon).color).toBe(resolve('--sapNegativeElementColor'));
        await update((h) => h.color.set('information'));
        expect(getComputedStyle(icon).color).toBe(resolve('--sapInformativeElementColor'));
        expect(getComputedStyle(icon).backgroundColor).toBe('rgba(0, 0, 0, 0)');

        // a background switches the glyph to the contrasting colour
        await update((h) => {
            h.color.set('inherit');
            h.background.set('positive');
        });
        expect(getComputedStyle(icon).backgroundColor).toBe(resolve('--sapPositiveElementColor'));
        expect(getComputedStyle(icon).color).toBe(resolve('--sapGroup_ContentBackground'));
    });
});
