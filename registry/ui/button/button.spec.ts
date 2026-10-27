import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Menu, MenuInteractive, MenuItem, MenuTitle, MenuTrigger } from '@/ui/menu/menu';
import { Button, ButtonBadge, type ButtonVariant, type GlyphPosition } from './button';

@Component({
    imports: [Button],
    template: `
        <button id="before">Before</button>
        <button
            id="btn"
            fdButton
            [variant]="variant()"
            [label]="label()"
            [glyph]="glyph()"
            [glyphPosition]="glyphPosition()"
            [ariaLabel]="ariaLabel()"
            [toggled]="toggled()"
            [selected]="selected()"
            [disabled]="disabled()"
            [aria-disabled]="ariaDisabled()"
            [ariaDescription]="description()"
            [ariaTypeDescription]="typeDescription()"
            [ariaDescribedBy]="describedBy()"
            (click)="clicks.set(clicks() + 1)"
        ></button>
        <a id="anchor" fdButton href="#" label="Anchor" [disabled]="disabled()" (click)="anchorClick($event)"></a>
        <button id="after">After</button>
        <span id="probe"></span>
        <span id="external">External description</span>
    `
})
class Host {
    readonly variant = signal<ButtonVariant>('standard');
    readonly label = signal<string | null>('Save');
    readonly glyph = signal<string | null>(null);
    readonly glyphPosition = signal<GlyphPosition>('before');
    readonly ariaLabel = signal<string | null>(null);
    readonly toggled = signal(false);
    readonly selected = signal(false);
    readonly disabled = signal(false);
    readonly ariaDisabled = signal(false);
    readonly description = signal<string | null>(null);
    readonly typeDescription = signal<string | null>(null);
    readonly describedBy = signal<string | null>(null);
    readonly clicks = signal(0);
    readonly anchorClicks = signal(0);

    anchorClick(event: Event): void {
        event.preventDefault();
        this.anchorClicks.update((n) => n + 1);
    }
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const probe = root.querySelector<HTMLElement>('#probe')!;
    const button = root.querySelector<HTMLButtonElement>('#btn')!;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        button,
        anchor: root.querySelector<HTMLAnchorElement>('#anchor')!,
        icons: () => [...button.querySelectorAll<HTMLElement>('fd-icon')],
        /** Accessible description, from the elements aria-describedby points to. */
        description: () =>
            (button.getAttribute('aria-describedby') ?? '')
                .split(' ')
                .filter(Boolean)
                .map((id) => document.getElementById(id)?.textContent?.trim())
                .join(' '),
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

describe('Button', () => {
    afterEach(() => document.documentElement.removeAttribute('data-density'));

    it('variants (standard, emphasized, positive, negative, attention, transparent, ghost) use their token classes in all states', async () => {
        const { root, button, resolve, update } = await setup();
        const after = root.querySelector('#after')!;
        const variants: [ButtonVariant, string, string, string][] = [
            ['standard', 'Button', 'Button_Hover', 'Button_Selected'],
            ['emphasized', 'Button_Emphasized', 'Button_Emphasized_Hover', 'Button_Selected'],
            ['positive', 'Button_Accept', 'Button_Accept_Hover', 'Button_Accept_Selected'],
            ['negative', 'Button_Reject', 'Button_Reject_Hover', 'Button_Reject_Selected'],
            ['attention', 'Button_Attention', 'Button_Attention_Hover', 'Button_Attention_Selected'],
            ['transparent', 'Button_Lite', 'Button_Lite_Hover', 'Button_Selected'],
            ['ghost', 'Button', 'Button_Hover', 'Button_Selected']
        ];
        const bg = () => getComputedStyle(button).backgroundColor;
        for (const [variant, rest, hover, toggled] of variants) {
            await update((h) => {
                h.variant.set(variant);
                h.toggled.set(false);
                h.disabled.set(false);
            });
            expect(bg(), variant).toBe(resolve(`--sap${rest}_Background`));
            await userEvent.hover(button);
            expect(bg(), `${variant} hover`).toBe(resolve(`--sap${hover}_Background`));
            await userEvent.hover(after);

            await update((h) => h.toggled.set(true));
            expect(bg(), `${variant} toggled`).toBe(resolve(`--sap${toggled}_Background`));

            // disabled: rest colours at reduced opacity, no hover colours
            await update((h) => {
                h.toggled.set(false);
                h.disabled.set(true);
            });
            expect(getComputedStyle(button).opacity).toBe('0.4');
            expect(getComputedStyle(button).cursor).toBe('not-allowed');
            await userEvent.hover(button, { force: true });
            expect(bg(), `${variant} disabled hover`).toBe(resolve(`--sap${rest}_Background`));
            await userEvent.hover(after);
        }
        // emphasized text uses its own colour
        await update((h) => {
            h.variant.set('emphasized');
            h.disabled.set(false);
        });
        expect(getComputedStyle(button).color).toBe(resolve('--sapButton_Emphasized_TextColor'));
    });

    it('glyph-only button requires ariaLabel; glyph before/after label', async () => {
        const { button, icons, update } = await setup();
        expect(icons()).toHaveLength(0);
        await update((h) => h.glyph.set('add'));
        const label = () => button.querySelector('span')!;
        expect(icons()).toHaveLength(1);
        expect(icons()[0].compareDocumentPosition(label()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(icons()[0].getBoundingClientRect().right).toBeLessThanOrEqual(label().getBoundingClientRect().left);
        expect(icons()[0].getAttribute('aria-hidden')).toBe('true');

        await update((h) => h.glyphPosition.set('after'));
        expect(icons()[0].getBoundingClientRect().left).toBeGreaterThanOrEqual(label().getBoundingClientRect().right);

        // glyph only: named by ariaLabel
        await update((h) => {
            h.label.set(null);
            h.ariaLabel.set('Add item');
        });
        expect(button.textContent!.trim()).toBe('');
        expect(button.getAttribute('aria-label')).toBe('Add item');
        await expect.element(page.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
        // square icon button
        const rect = button.getBoundingClientRect();
        expect(rect.width).toBe(rect.height);

        // icon-only special buttons fall back to the glyph name
        await update((h) => {
            h.ariaLabel.set(null);
            h.variant.set('negative');
            h.glyph.set('decline-all');
        });
        expect(button.getAttribute('aria-label')).toBe('decline all');
        await update((h) => h.variant.set('standard'));
        expect(button.hasAttribute('aria-label')).toBe(false);
    });

    it('disabled vs aria-disabled: aria-disabled stays focusable but swallows clicks', async () => {
        const { host, root, button, anchor, update } = await setup();
        await userEvent.click(button);
        expect(host.clicks()).toBe(1);
        expect(document.activeElement).toBe(button);

        await update((h) => h.disabled.set(true));
        expect(button.disabled).toBe(true);
        expect(button.hasAttribute('aria-disabled')).toBe(false);
        await userEvent.click(button, { force: true });
        expect(host.clicks()).toBe(1);
        root.querySelector<HTMLElement>('#before')!.focus();
        await userEvent.tab();
        // the disabled button and anchor are skipped
        expect(document.activeElement!.id).toBe('after');

        // anchors: aria-disabled, out of the tab order, clicks swallowed
        expect(anchor.getAttribute('aria-disabled')).toBe('true');
        expect(anchor.getAttribute('tabindex')).toBe('-1');
        await userEvent.click(anchor, { force: true });
        expect(host.anchorClicks()).toBe(0);

        await update((h) => {
            h.disabled.set(false);
            h.ariaDisabled.set(true);
        });
        expect(button.disabled).toBe(false);
        expect(button.getAttribute('aria-disabled')).toBe('true');
        expect(getComputedStyle(button).opacity).toBe('0.4');
        root.querySelector<HTMLElement>('#before')!.focus();
        await userEvent.tab();
        expect(document.activeElement).toBe(button);
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        await userEvent.click(button, { force: true });
        expect(host.clicks()).toBe(1);

        await update((h) => h.ariaDisabled.set(false));
        await userEvent.click(anchor);
        expect(host.anchorClicks()).toBe(1);
    });

    it('toggled and selected set aria-pressed / aria-selected and the toggled styles', async () => {
        const { button, resolve, update } = await setup();
        expect(button.hasAttribute('aria-pressed')).toBe(false);
        expect(button.hasAttribute('aria-selected')).toBe(false);

        await update((h) => h.toggled.set(true));
        expect(button.getAttribute('aria-pressed')).toBe('true');
        expect(getComputedStyle(button).backgroundColor).toBe(resolve('--sapButton_Selected_Background'));
        expect(getComputedStyle(button).color).toBe(resolve('--sapButton_Selected_TextColor'));
        expect(getComputedStyle(button).borderColor).toBe(resolve('--sapButton_Selected_BorderColor'));

        await update((h) => {
            h.toggled.set(false);
            h.selected.set(true);
        });
        expect(button.hasAttribute('aria-pressed')).toBe(false);
        expect(button.getAttribute('aria-selected')).toBe('true');
        expect(getComputedStyle(button).backgroundColor).toBe(resolve('--sapButton_Selected_Background'));
    });

    it('fdMenu adds the menu arrow and aria-haspopup', async () => {
        @Component({
            imports: [Button, Menu, MenuItem, MenuInteractive, MenuTitle, MenuTrigger],
            template: `
                <button id="plain" fdButton label="Plain"></button>
                <button id="menu" fdButton fdMenu label="Actions" [fdMenuTrigger]="menu"></button>
                <fd-menu #menu>
                    <li fd-menu-item>
                        <a fd-menu-interactive href="#"><span fd-menu-title>Edit</span></a>
                    </li>
                </fd-menu>
            `
        })
        class MenuHost {}
        const fixture = TestBed.createComponent(MenuHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const plain = root.querySelector<HTMLElement>('#plain')!;
        const trigger = root.querySelector<HTMLElement>('#menu')!;
        expect(plain.querySelector('fd-icon')).toBeNull();
        const arrow = trigger.querySelector<HTMLElement>('fd-icon')!;
        expect(arrow.dataset['glyph']).toBe(String.fromCodePoint(0xe1ef));
        // the arrow sits at the end, after the label
        expect(arrow.getBoundingClientRect().left).toBeGreaterThanOrEqual(
            trigger.querySelector('span')!.getBoundingClientRect().right
        );
        expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');

        await userEvent.click(trigger);
        await fixture.whenStable();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        await userEvent.keyboard('{Escape}');
        await fixture.whenStable();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('type defaults to "button" inside forms', async () => {
        @Component({
            imports: [Button],
            template: `
                <form (submit)="$event.preventDefault(); submits.set(submits() + 1)">
                    <input id="field" />
                    <button id="plain" fdButton label="Plain"></button>
                    <button id="submit" fdButton type="submit" label="Submit"></button>
                </form>
            `
        })
        class FormHost {
            readonly submits = signal(0);
        }
        const fixture = TestBed.createComponent(FormHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const plain = root.querySelector<HTMLButtonElement>('#plain')!;
        const submit = root.querySelector<HTMLButtonElement>('#submit')!;
        expect(plain.type).toBe('button');
        expect(submit.type).toBe('submit');

        await userEvent.click(plain);
        expect(fixture.componentInstance.submits()).toBe(0);
        await userEvent.click(submit);
        expect(fixture.componentInstance.submits()).toBe(1);
    });

    it('semantic variants announce their meaning through the hidden description', async () => {
        const { button, description, update } = await setup();
        expect(button.hasAttribute('aria-describedby')).toBe(false);

        const types: [ButtonVariant, string][] = [
            ['emphasized', 'Default Action'],
            ['positive', 'Positive Action'],
            ['negative', 'Negative Action'],
            ['attention', 'Warning']
        ];
        for (const [variant, text] of types) {
            await update((h) => h.variant.set(variant));
            expect(description()).toBe(text);
            // the description is visually hidden
            const hidden = document.getElementById(button.getAttribute('aria-describedby')!)!;
            expect(hidden.getBoundingClientRect().width).toBeLessThanOrEqual(1);
        }
        await expect.element(page.elementLocator(button)).toHaveAccessibleDescription('Warning');

        await update((h) => {
            h.variant.set('emphasized');
            h.typeDescription.set('Primary');
            h.description.set('Saves the draft');
        });
        expect(description()).toBe('Saves the draft Primary');

        // an explicit aria-describedby replaces the generated descriptions
        await update((h) => h.describedBy.set('external'));
        expect(button.getAttribute('aria-describedby')).toBe('external');
        expect(description()).toBe('External description');
        expect(button.querySelector('.sr-only-sap')).toBeNull();

        await update((h) => {
            h.describedBy.set(null);
            h.description.set(null);
            h.variant.set('transparent');
        });
        expect(button.hasAttribute('aria-describedby')).toBe(false);
    });

    it('badge (fd-button-badge) shows content and attention style', async () => {
        @Component({
            imports: [Button, ButtonBadge],
            template: `
                <button id="count" fdButton glyph="bell" ariaLabel="Notifications">
                    <fd-button-badge [content]="count()" />
                </button>
                <button id="dot" fdButton label="Inbox"><fd-button-badge attention /></button>
            `
        })
        class BadgeHost {
            readonly count = signal<number | null>(12);
        }
        const fixture = TestBed.createComponent(BadgeHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const button = root.querySelector<HTMLElement>('#count')!;
        const badge = button.querySelector<HTMLElement>('fd-button-badge')!;
        expect(badge.textContent).toBe('12');
        // at the top-end corner, overlapping the edge
        const b = button.getBoundingClientRect();
        const r = badge.getBoundingClientRect();
        expect(r.top).toBeLessThan(b.top);
        expect(r.right).toBeGreaterThan(b.right);
        expect(r.height).toBe(16);

        fixture.componentInstance.count.set(5);
        await fixture.whenStable();
        expect(badge.textContent).toBe('5');

        const dot = root.querySelector<HTMLElement>('#dot fd-button-badge')!;
        expect(dot.textContent).toBe('');
        const d = dot.getBoundingClientRect();
        expect(d.width).toBe(12);
        expect(d.height).toBe(12);
        expect(getComputedStyle(dot).borderRadius).not.toBe('0px');

        // compact: the counter moves inline next to the content
        document.documentElement.setAttribute('data-density', 'compact');
        expect(getComputedStyle(badge).position).toBe('static');
        expect(getComputedStyle(dot).position).toBe('absolute');
    });

    it('compact density shrinks height via data-density', async () => {
        const { button } = await setup();
        expect(button.getBoundingClientRect().height).toBe(36);
        document.documentElement.setAttribute('data-density', 'compact');
        expect(button.getBoundingClientRect().height).toBe(26);
        // a cozy island inside compact content
        button.parentElement!.setAttribute('data-density', 'cozy');
        expect(button.getBoundingClientRect().height).toBe(36);
        button.parentElement!.removeAttribute('data-density');
    });

    it('focuses the button on click', async () => {
        const { button } = await setup();
        button.addEventListener('mousedown', (event) => event.preventDefault());
        await userEvent.click(button);
        expect(document.activeElement).toBe(button);
    });
});
