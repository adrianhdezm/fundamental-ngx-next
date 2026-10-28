import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ObjectStatusComponent, type IndicationColor, type ObjectStatus } from './object-status';

@Component({
    imports: [ObjectStatusComponent],
    template: `
        <button id="before">Before</button>
        <div [style.width]="width()">
            <span
                fdObjectStatus
                id="os"
                [status]="status()"
                [statusMessage]="statusMessage()"
                [label]="label()"
                [glyph]="glyph()"
                [glyphAriaLabel]="glyphAriaLabel()"
                [ariaLabel]="ariaLabel()"
                [indicationColor]="indication()"
                [secondaryIndication]="secondary()"
                [clickable]="clickable()"
                [ariaRoleDescription]="roleDescription()"
                [inverted]="inverted()"
                [large]="large()"
                [truncate]="truncate()"
                (click)="clicks.push('span')"
            ></span>
        </div>
        <button fdObjectStatus id="os-button" clickable label="In review" (click)="clicks.push('button')"></button>
        <ng-template #custom><b>Custom</b> text</ng-template>
        <span fdObjectStatus id="os-template" [textTemplate]="custom"></span>
    `
})
class Host {
    readonly status = signal<ObjectStatus | null>(null);
    readonly statusMessage = signal<string | null>(null);
    readonly label = signal<string | null>('Approved');
    readonly glyph = signal<string | null>(null);
    readonly glyphAriaLabel = signal<string | null>(null);
    readonly ariaLabel = signal<string | null>(null);
    readonly indication = signal<IndicationColor | null>(null);
    readonly secondary = signal(false);
    readonly clickable = signal(false);
    readonly roleDescription = signal('Object Status Button');
    readonly inverted = signal(false);
    readonly large = signal(false);
    readonly truncate = signal(false);
    readonly width = signal('auto');
    readonly clicks: string[] = [];
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const element = () => document.getElementById('os') as HTMLElement;
    const icon = () => element().querySelector('fd-icon') as HTMLElement | null;
    const text = () => element().querySelector('span:not(.sr-only-sap)') as HTMLElement | null;
    const hidden = (el = element()) =>
        Array.from(el.querySelectorAll<HTMLElement>('.sr-only-sap')).map((e) => e.textContent?.trim());
    const update = async (change: () => void) => {
        change();
        await fixture.whenStable();
    };
    return { fixture, host, element, icon, text, hidden, update };
}

/** Resolves a CSS colour (e.g. a theme variable) to its computed rgb value. */
function color(value: string): string {
    const probe = document.createElement('span');
    probe.style.color = value;
    document.body.appendChild(probe);
    const result = getComputedStyle(probe).color;
    probe.remove();
    return result;
}

describe('ObjectStatus', () => {
    it('status colours the text with the semantic text colour and the icon with the element colour', async () => {
        const { host, element, icon, update } = await setup();
        await update(() => host.glyph.set('sys-enter-2'));
        const colors: Record<ObjectStatus, [string, string]> = {
            neutral: ['--sapNeutralTextColor', '--sapNeutralElementColor'],
            positive: ['--sapPositiveTextColor', '--sapPositiveElementColor'],
            critical: ['--sapCriticalTextColor', '--sapCriticalElementColor'],
            negative: ['--sapNegativeTextColor', '--sapNegativeElementColor'],
            informative: ['--sapInformativeTextColor', '--sapInformativeElementColor']
        };
        expect(getComputedStyle(element()).color).toBe(color('var(--sapNeutralTextColor)'));
        for (const [status, [text, iconColor]] of Object.entries(colors) as [ObjectStatus, [string, string]][]) {
            await update(() => host.status.set(status));
            expect(getComputedStyle(element()).color, status).toBe(color(`var(${text})`));
            expect(getComputedStyle(icon()!).color, status).toBe(color(`var(${iconColor})`));
        }
    });

    it('renders the glyph before the label, decorative unless glyphAriaLabel is set', async () => {
        const { host, icon, text, update } = await setup();
        expect(icon()).toBeNull();
        await update(() => host.glyph.set('sys-enter-2'));
        expect(icon()?.getAttribute('data-glyph')).toBeTruthy();
        expect(icon()?.getAttribute('aria-hidden')).toBe('true');
        expect(icon()!.getBoundingClientRect().right).toBeLessThanOrEqual(text()!.getBoundingClientRect().left);
        await update(() => host.glyphAriaLabel.set('Approved'));
        expect(icon()?.getAttribute('role')).toBe('img');
        expect(icon()?.getAttribute('aria-label')).toBe('Approved');
    });

    it('icon-only status renders no text', async () => {
        const { host, icon, text, update } = await setup();
        await update(() => {
            host.label.set(null);
            host.glyph.set('alert');
        });
        expect(icon()).not.toBeNull();
        expect(text()).toBeNull();
    });

    it('inverted status is a filled badge in the button colours', async () => {
        const { host, element, update } = await setup();
        expect(getComputedStyle(element()).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        await update(() => {
            host.inverted.set(true);
            host.status.set('positive');
        });
        expect(getComputedStyle(element()).backgroundColor).toBe(color('var(--sapButton_Success_Background)'));
        expect(getComputedStyle(element()).color).toBe(color('var(--sapButton_Success_TextColor)'));
        expect(getComputedStyle(element()).borderTopColor).toBe(color('var(--sapButton_Success_BorderColor)'));
        await update(() => host.status.set(null));
        expect(getComputedStyle(element()).backgroundColor).toBe(color('var(--sapNeutralBackground)'));
    });

    it('indication colours 1–10 replace the status colour and are announced', async () => {
        const { host, element, hidden, update } = await setup();
        await update(() => host.status.set('negative'));
        for (let i = 1 as IndicationColor; i <= 10; i++) {
            await update(() => host.indication.set(i));
            expect(getComputedStyle(element()).color, `indication ${i}`).toBe(color(`var(--sapIndicationColor_${i})`));
            expect(hidden()).toContain(`Indication Color ${i}`);
        }
    });

    it('inverted indication colours, and the secondary set', async () => {
        const { host, element, hidden, update } = await setup();
        await update(() => {
            host.inverted.set(true);
            host.indication.set(6);
        });
        expect(getComputedStyle(element()).backgroundColor).toBe(color('var(--sapIndicationColor_6_Background)'));
        expect(getComputedStyle(element()).color).toBe(color('var(--sapIndicationColor_6_TextColor)'));
        await update(() => host.secondary.set(true));
        expect(getComputedStyle(element()).backgroundColor).toBe(color('var(--sapIndicationColor_6b)'));
        expect(getComputedStyle(element()).color).toBe(color('var(--sapIndicationColor_6)'));
        expect(hidden()).toContain('Indication Color 6b');
    });

    it('is neither focusable nor a button unless clickable', async () => {
        const { host, element } = await setup();
        expect(element().getAttribute('role')).toBeNull();
        expect(element().hasAttribute('tabindex')).toBe(false);
        expect(element().hasAttribute('aria-roledescription')).toBe(false);
        element().focus();
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toEqual([]);
    });

    it('ariaRoleDescription overrides the role description of a clickable status', async () => {
        const { host, element, update } = await setup();
        await update(() => host.roleDescription.set('Status link'));
        expect(element().hasAttribute('aria-roledescription')).toBe(false);
        await update(() => host.clickable.set(true));
        expect(element().getAttribute('aria-roledescription')).toBe('Status link');
    });

    it('clickable status is a focusable role button that activates with click, Enter and Space', async () => {
        const { host, element, update } = await setup();
        await update(() => host.clickable.set(true));
        expect(element().getAttribute('role')).toBe('button');
        expect(element().getAttribute('tabindex')).toBe('0');
        expect(element().getAttribute('aria-roledescription')).toBe('Object Status Button');
        expect(getComputedStyle(element()).cursor).toBe('pointer');

        (document.getElementById('before') as HTMLElement).focus();
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(element());

        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toEqual(['span']);
        await userEvent.keyboard(' ');
        expect(host.clicks).toEqual(['span', 'span']);
        await userEvent.click(element());
        expect(host.clicks).toEqual(['span', 'span', 'span']);
    });

    it('Space on a clickable status is prevented so the page does not scroll', async () => {
        const { host, element, update } = await setup();
        await update(() => host.clickable.set(true));
        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        element().dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(host.clicks).toEqual(['span']);
    });

    it('a clickable <button> status activates once (natively) with Enter and Space', async () => {
        const { host } = await setup();
        const button = document.getElementById('os-button') as HTMLButtonElement;
        button.focus();
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toEqual(['button']);
        await userEvent.keyboard(' ');
        expect(host.clicks).toEqual(['button', 'button']);
    });

    it('clickable status shows the filled focus style', async () => {
        const { host, element, update } = await setup();
        await update(() => host.clickable.set(true));
        const before = getComputedStyle(element()).backgroundColor;
        element().focus();
        expect(getComputedStyle(element()).backgroundColor).not.toBe(before);
        expect(getComputedStyle(element()).color).toBe(color('var(--sapContent_ContrastTextColor)'));
    });

    it('large uses a bigger font and icon', async () => {
        const { host, element, icon, update } = await setup();
        await update(() => host.glyph.set('sys-enter-2'));
        const regular = parseFloat(getComputedStyle(element()).fontSize);
        await update(() => host.large.set(true));
        expect(parseFloat(getComputedStyle(element()).fontSize)).toBe(24);
        expect(parseFloat(getComputedStyle(element()).fontSize)).toBeGreaterThan(regular);
        expect(parseFloat(getComputedStyle(icon()!).fontSize)).toBe(24);
    });

    it('truncate shortens long text with an ellipsis instead of wrapping', async () => {
        const { host, element, text, update } = await setup();
        await update(() => {
            host.label.set('A very long status text that does not fit into the container');
            host.width.set('120px');
        });
        const lineHeight = parseFloat(getComputedStyle(text()!).lineHeight);
        expect(text()!.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5);

        await update(() => host.truncate.set(true));
        expect(getComputedStyle(text()!).textOverflow).toBe('ellipsis');
        expect(text()!.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight + 1);
        expect(text()!.scrollWidth).toBeGreaterThan(text()!.clientWidth);
        expect(element().getBoundingClientRect().width).toBeLessThanOrEqual(120);
    });

    it('announces "Object Status" (or ariaLabel) when not clickable; clickable uses the role description', async () => {
        const { host, element, hidden, update } = await setup();
        expect(hidden()).toEqual(['Object Status']);
        await update(() => host.ariaLabel.set('Approval'));
        expect(hidden()).toEqual(['Approval']);
        await update(() => {
            host.clickable.set(true);
            host.ariaLabel.set(null);
        });
        expect(hidden()).toEqual([]);
        expect(element().getAttribute('aria-roledescription')).toBe('Object Status Button');
    });

    it('announces a status message per status, overridable with statusMessage', async () => {
        const { host, hidden, update } = await setup();
        const texts: Partial<Record<ObjectStatus, string>> = {
            critical: 'Warning issued',
            informative: 'Informative entry',
            negative: 'Invalid Entry',
            positive: 'Entry successfully validated'
        };
        for (const [status, message] of Object.entries(texts) as [ObjectStatus, string][]) {
            await update(() => host.status.set(status));
            expect(hidden()).toEqual(['Object Status', message]);
        }
        await update(() => host.status.set('neutral'));
        expect(hidden()).toEqual(['Object Status']);
        await update(() => {
            host.status.set('negative');
            host.statusMessage.set('Rejected by the manager');
        });
        expect(hidden()).toEqual(['Object Status', 'Rejected by the manager']);
    });

    it('renders a text template', async () => {
        const { hidden } = await setup();
        const status = document.getElementById('os-template') as HTMLElement;
        expect(status.querySelector('b')?.textContent).toBe('Custom');
        expect(status.textContent).toContain('Custom text');
        expect(hidden(status)).toEqual(['Object Status']);
    });
});
