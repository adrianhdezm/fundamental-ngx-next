import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { GenericTag, type GenericTagType } from './generic-tag';

@Component({
    imports: [GenericTag],
    template: `
        <div [style.width]="width()">
            <div
                id="tag"
                fd-generic-tag
                [type]="type()"
                [name]="name()"
                [value]="value()"
                [ariaRoleDescription]="roleDescription()"
                (click)="clicks.set(clicks() + 1)"
            ></div>
        </div>
        <span id="probe"></span>
        <div id="away" style="height: 20px"></div>
    `
})
class Host {
    readonly type = signal<GenericTagType | null>(null);
    readonly name = signal('Overdue');
    readonly value = signal<string | null>('12 days');
    readonly roleDescription = signal('Generic Tag');
    readonly width = signal('auto');
    readonly clicks = signal(0);
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    // keep the pointer of earlier tests off the element
    await userEvent.hover(root.querySelector('#away')!);
    const tag = root.querySelector<HTMLElement>('#tag')!;
    const probe = root.querySelector<HTMLElement>('#probe')!;
    return {
        fixture,
        host: fixture.componentInstance,
        tag,
        icon: () => tag.querySelector<HTMLElement>('fd-icon'),
        texts: () => [...tag.querySelectorAll<HTMLElement>(':scope > span')],
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

describe('GenericTag', () => {
    it('type (error, warning, success, information) shows the status icon and colors', async () => {
        const { tag, icon, resolve, update } = await setup();
        expect(icon()).toBeNull();
        expect(getComputedStyle(tag).backgroundColor).toBe(resolve('--sapNeutralBackground'));

        const types: [GenericTagType, string, string, string, string][] = [
            ['error', 'message-error', '--sapNegativeElementColor', '--sapErrorBackground', '--sapNegativeTextColor'],
            [
                'warning',
                'message-warning',
                '--sapCriticalElementColor',
                '--sapWarningBackground',
                '--sapCriticalTextColor'
            ],
            [
                'success',
                'message-success',
                '--sapPositiveElementColor',
                '--sapSuccessBackground',
                '--sapPositiveTextColor'
            ],
            [
                'information',
                'message-information',
                '--sapInformativeElementColor',
                '--sapInformationBackground',
                '--sapInformativeTextColor'
            ]
        ];
        const glyphs: Record<string, number> = {
            'message-error': 0xe0b1,
            'message-warning': 0xe201,
            'message-success': 0xe203,
            'message-information': 0xe202
        };
        for (const [type, glyph, element, background, text] of types) {
            await update((h) => h.type.set(type));
            expect(icon()!.dataset['glyph']).toBe(String.fromCodePoint(glyphs[glyph]));
            expect(icon()!.getAttribute('aria-hidden')).toBe('true');
            expect(getComputedStyle(icon()!).color).toBe(resolve(element));
            expect(getComputedStyle(tag).backgroundColor).toBe(resolve(background));
            // status strip on the start edge
            expect(getComputedStyle(tag).backgroundImage).toContain(resolve(element));
            const value = tag.querySelectorAll<HTMLElement>(':scope > span')[1];
            expect(getComputedStyle(value).color).toBe(resolve(text));
        }
    });

    it('name and value are rendered and separated', async () => {
        const { texts, update } = await setup();
        expect(texts().map((el) => el.textContent!.trim())).toEqual(['Overdue', '12 days']);
        const [name, value] = texts();
        expect(value.getBoundingClientRect().left - name.getBoundingClientRect().right).toBeGreaterThanOrEqual(12);
        expect(getComputedStyle(value).marginInlineStart).toBe('12px');

        await update((h) => h.value.set(null));
        expect(texts().map((el) => el.textContent!.trim())).toEqual(['Overdue']);
    });

    it('role description (ariaRoleDescription) and readable name/value for assistive technology', async () => {
        const { tag, update } = await setup();
        expect(tag.getAttribute('role')).toBe('button');
        expect(tag.getAttribute('aria-roledescription')).toBe('Generic Tag');
        await expect.element(page.getByRole('button', { name: 'Overdue 12 days' })).toBeInTheDocument();

        await update((h) => {
            h.roleDescription.set('Key figure');
            h.type.set('error');
        });
        expect(tag.getAttribute('aria-roledescription')).toBe('Key figure');
        // the status icon is decorative and does not add to the name
        await expect.element(page.getByRole('button', { name: 'Overdue 12 days', exact: true })).toBeInTheDocument();
    });

    it('is focusable and activates with click, Enter and Space', async () => {
        const { host, tag } = await setup();
        await userEvent.tab();
        expect(document.activeElement).toBe(tag);
        await userEvent.keyboard('{Enter}');
        expect(host.clicks()).toBe(1);
        await userEvent.keyboard(' ');
        expect(host.clicks()).toBe(2);
        await userEvent.click(tag);
        expect(host.clicks()).toBe(3);
        expect(getComputedStyle(tag).cursor).toBe('pointer');
    });

    it('truncation of the name with full text in title', async () => {
        const { tag, texts, update } = await setup();
        const long = 'Accumulated depreciation of fixed assets';
        await update((h) => {
            h.name.set(long);
            h.width.set('12rem');
        });
        const [name, value] = texts();
        expect(tag.getBoundingClientRect().width).toBeLessThanOrEqual(192);
        expect(getComputedStyle(name).textOverflow).toBe('ellipsis');
        expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
        expect(name.title).toBe(long);
        expect(value.title).toBe('12 days');
        // the value stays visible next to the truncated name
        expect(value.getBoundingClientRect().right).toBeLessThanOrEqual(tag.getBoundingClientRect().right);
    });
});
