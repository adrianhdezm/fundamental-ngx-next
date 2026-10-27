import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Avatar, avatarInitials, labelColorAccent, type AvatarSize, type ColorAccent } from './avatar';

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="red"/></svg>')}`;
const BACKUP = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="blue"/></svg>')}`;
const BROKEN = 'data:image/png;base64,AAAA';

@Component({
    imports: [Avatar],
    template: `
        <button id="before">Before</button>
        <fd-avatar
            id="main"
            [label]="label()"
            [glyph]="glyph()"
            [image]="image()"
            [ariaLabel]="ariaLabel()"
            [size]="size()"
            [circle]="circle()"
            [border]="border()"
            [tile]="tile()"
            [transparent]="transparent()"
            [colorAccent]="colorAccent()"
            [clickable]="clickable()"
            [zoomGlyph]="zoomGlyph()"
            (avatarClicked)="clicks.set(clicks() + 1)"
            (zoomGlyphClicked)="zooms.set(zooms() + 1)"
        />
        <span id="probe"></span>
    `
})
class Host {
    readonly label = signal<string | null>('John Doe');
    readonly glyph = signal<string | null>(null);
    readonly image = signal<string | null>(null);
    readonly ariaLabel = signal<string | null>(null);
    readonly size = signal<AvatarSize>('l');
    readonly circle = signal(false);
    readonly border = signal(false);
    readonly tile = signal(false);
    readonly transparent = signal(false);
    readonly colorAccent = signal<ColorAccent | null>(null);
    readonly clickable = signal(false);
    readonly zoomGlyph = signal<string | null>(null);
    readonly clicks = signal(0);
    readonly zooms = signal(0);
}

@Component({
    imports: [Avatar],
    template: `
        <fd-avatar id="content" [image]="broken" alterIcon="content|alt">Jane Roe</fd-avatar>
        <fd-avatar id="alt" [image]="broken" alterIcon="content|alt" alt="Max Mustermann" />
        <fd-avatar id="backup" [image]="broken" alterIcon="backup" [backupImage]="backup" ariaLabel="Backup" />
        <fd-avatar id="backup-broken" [image]="broken" alterIcon="backup|alt" [backupImage]="broken" alt="Ann Lee" />
        <fd-avatar id="default" [image]="broken" alterIcon="default-icon|content" ariaLabel="Default">Kim Ho</fd-avatar>
        <fd-avatar id="none" [image]="broken" ariaLabel="None">Kim Ho</fd-avatar>
    `
})
class FallbackHost {
    readonly broken = BROKEN;
    readonly backup = BACKUP;
}

@Component({
    imports: [Avatar],
    template: `
        <fd-avatar random label="Jane Doe" />
        <fd-avatar random label="Jane Doe" />
        <fd-avatar random label="Grace Hopper" />
    `
})
class RandomHost {}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function until(condition: () => boolean) {
    for (let i = 0; i < 50 && !condition(); i++) await new Promise((resolve) => setTimeout(resolve, 20));
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const avatar = root.querySelector<HTMLElement>('#main')!;
    const probe = root.querySelector<HTMLElement>('#probe')!;
    return {
        fixture,
        host: fixture.componentInstance,
        avatar,
        glyph: () => avatar.querySelector<HTMLElement>('fd-icon:not(.absolute)')?.dataset['glyph'],
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

const char = (code: number) => String.fromCodePoint(code);
const PERSON_PLACEHOLDER = char(0xe0ca);

describe('Avatar', () => {
    it('renders initials from label, a glyph, or the image as background', async () => {
        const { fixture, avatar, glyph, update } = await setup();
        expect(avatar.textContent!.trim()).toBe('JD');
        expect(avatar.querySelector('fd-icon')).toBeNull();

        await update((h) => h.label.set('Ana María López'));
        expect(avatar.textContent!.trim()).toBe('AML');
        // more than three words, or no letters: the placeholder icon
        await update((h) => h.label.set('One Two Three Four'));
        expect(avatar.textContent!.trim()).toBe('');
        expect(glyph()).toBe(PERSON_PLACEHOLDER);
        expect(avatarInitials('1st Floor')).toBeNull();
        expect(avatarInitials('Ölaf Ünal')).toBe('ÖÜ');

        await update((h) => {
            h.label.set(null);
            h.glyph.set('employee');
            h.ariaLabel.set('Employee');
        });
        expect(glyph()).toBe(char(0xe036));

        await update((h) => {
            h.glyph.set(null);
            h.label.set('John Doe');
            h.image.set(IMAGE);
        });
        await until(() => avatar.style.backgroundImage !== '');
        await fixture.whenStable();
        expect(getComputedStyle(avatar).backgroundImage).toContain('data:image/svg+xml');
        // the image replaces the initials
        expect(avatar.textContent!.trim()).toBe('');
        expect(avatar.querySelector('fd-icon')).toBeNull();
        expect(getComputedStyle(avatar).backgroundSize).toBe('cover');
    });

    it('falls back through alterIcon order (content, alt, backup image, default icon) when the image fails to load', async () => {
        const fixture = TestBed.createComponent(FallbackHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const get = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
        const glyph = (id: string) => get(id).querySelector<HTMLElement>('fd-icon')?.dataset['glyph'];
        const text = (id: string) =>
            [...get(id).childNodes]
                .filter((node) => node.nodeType === Node.TEXT_NODE)
                .map((node) => node.textContent)
                .join('')
                .trim();
        await until(() => text('content') !== '' && get('backup').style.backgroundImage !== '');
        await new Promise((resolve) => setTimeout(resolve, 100));
        await fixture.whenStable();

        expect(text('content')).toBe('JR');
        expect(get('content').getAttribute('aria-label')).toBe('Jane Roe');
        // no content: the next option, alt
        expect(text('alt')).toBe('MM');
        expect(get('alt').getAttribute('aria-label')).toBe('Max Mustermann');
        expect(get('backup').style.backgroundImage).toContain('blue');
        expect(glyph('backup')).toBeUndefined();
        // a failing backup image ends at the placeholder icon
        expect(glyph('backup-broken')).toBe(PERSON_PLACEHOLDER);
        expect(text('backup-broken')).toBe('');
        expect(glyph('default')).toBe(PERSON_PLACEHOLDER);
        expect(text('default')).toBe('');
        expect(glyph('none')).toBe(PERSON_PLACEHOLDER);
        // projected content itself stays hidden
        expect(get('none').querySelector<HTMLElement>('.hidden')!.getBoundingClientRect().width).toBe(0);
    });

    it('has role img with the aria-label, or is presentational without one', async () => {
        const { avatar, update } = await setup();
        expect(avatar.getAttribute('role')).toBe('img');
        // the label names the initials
        expect(avatar.getAttribute('aria-label')).toBe('John Doe');

        await update((h) => h.ariaLabel.set('Account of John'));
        expect(avatar.getAttribute('aria-label')).toBe('Account of John');

        await update((h) => {
            h.ariaLabel.set(null);
            h.label.set(null);
            h.glyph.set('employee');
        });
        expect(avatar.getAttribute('role')).toBe('presentation');
        expect(avatar.hasAttribute('aria-label')).toBe(false);
        // the inner icon is decorative
        expect(avatar.querySelector('fd-icon')!.getAttribute('aria-hidden')).toBe('true');
    });

    it('clickable avatar is a button: focusable, Enter and Space emit avatarClicked', async () => {
        const { fixture, host, avatar, update } = await setup();
        expect(avatar.hasAttribute('tabindex')).toBe(false);
        await userEvent.click(avatar);
        expect(host.clicks()).toBe(0);

        await update((h) => h.clickable.set(true));
        expect(avatar.getAttribute('role')).toBe('button');
        expect(avatar.getAttribute('tabindex')).toBe('0');
        expect(getComputedStyle(avatar).cursor).toBe('pointer');
        (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#before')!.focus();
        await userEvent.tab();
        expect(document.activeElement).toBe(avatar);
        await userEvent.keyboard('{Enter}');
        expect(host.clicks()).toBe(1);
        await userEvent.keyboard(' ');
        expect(host.clicks()).toBe(2);
        await userEvent.click(avatar);
        expect(host.clicks()).toBe(3);
        expect(host.zooms()).toBe(0);
    });

    it('zoom glyph shows a badge that emits zoomGlyphClicked', async () => {
        const { host, avatar, update } = await setup();
        await update((h) => h.zoomGlyph.set('edit'));
        expect(avatar.getAttribute('role')).toBe('button');
        const badge = avatar.querySelector<HTMLElement>('fd-icon')!;
        const a = avatar.getBoundingClientRect();
        const b = badge.getBoundingClientRect();
        // at the bottom-end corner
        expect(b.right).toBeGreaterThan(a.right - b.width);
        expect(b.bottom).toBeGreaterThan(a.bottom - b.height);
        await userEvent.click(badge);
        expect(host.zooms()).toBe(1);
        expect(document.activeElement).toBe(avatar);
        expect(avatar.getAttribute('tabindex')).toBe('0');
        // the whole avatar is the zoom button, also from the keyboard
        await userEvent.keyboard('{Enter}');
        expect(host.zooms()).toBe(2);
        await userEvent.click(avatar, { position: { x: 5, y: 5 } });
        expect(host.zooms()).toBe(3);
        expect(host.clicks()).toBe(0);

        // clickable and zoom: one event of each per click
        await update((h) => h.clickable.set(true));
        await userEvent.click(badge);
        expect(host.zooms()).toBe(4);
        expect(host.clicks()).toBe(1);
    });

    it('size, circle, border, tile, transparent and colorAccent apply the expected token classes', async () => {
        const { avatar, resolve, update } = await setup();
        const sizes: [AvatarSize, number][] = [
            ['xs', 32],
            ['s', 48],
            ['m', 64],
            ['l', 80],
            ['xl', 112]
        ];
        for (const [size, px] of sizes) {
            await update((h) => h.size.set(size));
            const rect = avatar.getBoundingClientRect();
            expect([rect.width, rect.height]).toEqual([px, px]);
        }
        const style = () => getComputedStyle(avatar);
        // default accent 6
        expect(style().backgroundColor).toBe(resolve('--sapAvatar_6_Background'));
        expect(style().color).toBe(resolve('--sapAvatar_6_TextColor'));
        const radius = () => parseFloat(style().borderRadius);
        expect(radius()).toBeLessThan(56);

        await update((h) => h.circle.set(true));
        expect(radius()).toBeGreaterThanOrEqual(56);
        await update((h) => h.colorAccent.set(3));
        expect(style().backgroundColor).toBe(resolve('--sapAvatar_3_Background'));
        expect(style().color).toBe(resolve('--sapAvatar_3_TextColor'));
        await update((h) => h.border.set(true));
        expect(style().borderColor).toBe(resolve('--sapGroup_ContentBorderColor'));
        await update((h) => {
            h.border.set(false);
            h.transparent.set(true);
        });
        expect(style().backgroundColor).toBe(resolve('--sapAvatar_Lite_Background'));
        expect(style().color).toBe(resolve('--sapContent_IconColor'));
        await update((h) => {
            h.transparent.set(false);
            h.tile.set(true);
        });
        expect(style().backgroundColor).toBe(resolve('--sapTile_Background'));
        expect(style().color).toBe(resolve('--sapTile_IconColor'));
    });

    it('random color accent is stable for the same label', async () => {
        const render = async () => {
            const fixture = TestBed.createComponent(RandomHost);
            document.body.appendChild(fixture.nativeElement);
            await fixture.whenStable();
            await frame();
            const colors = [...(fixture.nativeElement as HTMLElement).querySelectorAll('fd-avatar')].map(
                (el) => getComputedStyle(el).backgroundColor
            );
            fixture.destroy();
            return colors;
        };
        const first = await render();
        expect(first[0]).toBe(first[1]);
        expect(await render()).toEqual(first);
        expect(labelColorAccent('Jane Doe')).toBe(labelColorAccent('Jane Doe'));
        // names spread over the palette
        const accents = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(labelColorAccent));
        expect(accents.size).toBeGreaterThan(5);
        for (const accent of accents) expect(accent >= 1 && accent <= 10).toBe(true);
    });
});

/** Stands in for `Image`: records each request and lets the test decide when it loads or fails. */
class FakeImage {
    static requests: FakeImage[] = [];
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    private url = '';
    set src(url: string) {
        this.url = url;
        FakeImage.requests.push(this);
    }
    get src(): string {
        return this.url;
    }
    load(): void {
        this.onload?.();
    }
    fail(): void {
        this.onerror?.();
    }
}

@Component({
    imports: [Avatar],
    template: `
        @for (id of ids(); track id) {
            <fd-avatar
                [id]="'avatar-' + id"
                [image]="image()"
                [label]="label()"
                [size]="size()"
                [alterIcon]="alterIcon()"
                [backupImage]="backup()"
                ariaLabel="Photo"
            />
        }
    `
})
class ImageHost {
    readonly ids = signal([1]);
    readonly image = signal<string | null>(null);
    readonly label = signal('John Doe');
    readonly size = signal<AvatarSize>('l');
    readonly alterIcon = signal<string | null>(null);
    readonly backup = signal<string | null>(null);
}

describe('Avatar image loading', () => {
    beforeEach(() => {
        FakeImage.requests = [];
        vi.stubGlobal('Image', FakeImage);
    });
    afterEach(() => vi.unstubAllGlobals());

    async function setupImages() {
        const fixture = TestBed.createComponent(ImageHost);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        return {
            fixture,
            host: fixture.componentInstance,
            avatar: (id = 1) => root.querySelector<HTMLElement>(`#avatar-${id}`)!,
            urls: () => FakeImage.requests.map((r) => r.src),
            update: async (change: (host: ImageHost) => void) => {
                change(fixture.componentInstance);
                await fixture.whenStable();
            }
        };
    }

    it('returns to a previously loaded URL without a new request', async () => {
        const { avatar, urls, update } = await setupImages();
        await update((h) => h.image.set('/one.png'));
        FakeImage.requests[0].load();
        await update((h) => h.image.set('/two.png'));
        FakeImage.requests[1].load();
        await update(() => {});
        expect(avatar().style.backgroundImage).toContain('/two.png');

        await update((h) => h.image.set('/one.png'));
        expect(urls()).toEqual(['/one.png', '/two.png']);
        expect(avatar().style.backgroundImage).toContain('/one.png');
        expect(avatar().textContent!.trim()).toBe('');
    });
});
