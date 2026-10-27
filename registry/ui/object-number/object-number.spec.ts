import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ObjectNumber, type ObjectNumberStatus } from './object-number';

registerLocaleData(localeDe);

@Component({
    imports: [ObjectNumber],
    template: `
        <fd-object-number
            [number]="number()"
            [decimal]="decimal()"
            [unit]="unit()"
            [emphasized]="emphasized()"
            [large]="large()"
            [status]="status()"
            [statusMessage]="statusMessage()"
            [interactive]="interactive()"
            [inverted]="inverted()"
            [ariaLabel]="ariaLabel()"
            (click)="clicks = clicks + 1"
        />
        <span id="plain">plain</span>
    `
})
class Host {
    readonly number = signal<number | null>(1000.37);
    readonly decimal = signal(2);
    readonly unit = signal<string | null>('EUR');
    readonly emphasized = signal(false);
    readonly large = signal(false);
    readonly status = signal<ObjectNumberStatus | null>(null);
    readonly statusMessage = signal<string | null>(null);
    readonly interactive = signal(false);
    readonly inverted = signal(false);
    readonly ariaLabel = signal<string | null>(null);
    clicks = 0;
}

async function setup(locale?: string) {
    if (locale) TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const element = () => fixture.nativeElement.querySelector('fd-object-number') as HTMLElement;
    const number = () => element().querySelector('bdi') as HTMLElement;
    const unit = () => element().querySelectorAll('bdi')[1] as HTMLElement;
    const hidden = () =>
        Array.from(element().querySelectorAll<HTMLElement>('.sr-only-sap')).map((e) => e.textContent?.trim());
    const update = async (change: () => void) => {
        change();
        await fixture.whenStable();
    };
    return { fixture, host, element, number, unit, hidden, update };
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

describe('ObjectNumber', () => {
    afterEach(() => document.documentElement.removeAttribute('dir'));

    it('formats with the given number of decimals', async () => {
        const { host, number, update } = await setup();
        expect(number().textContent).toBe('1,000.37');
        await update(() => host.decimal.set(0));
        expect(number().textContent).toBe('1,000');
        await update(() => {
            host.number.set(2.5);
            host.decimal.set(3);
        });
        expect(number().textContent).toBe('2.500');
        await update(() => host.number.set(-2000));
        expect(number().textContent).toBe('-2,000.000');
        await update(() => host.number.set(null));
        expect(number().textContent).toBe('');
    });

    it('formats with LOCALE_ID', async () => {
        const { number } = await setup('de');
        expect(number().textContent).toBe('1.000,37');
    });

    it('shows the unit after the number', async () => {
        const { host, element, number, unit, update } = await setup();
        expect(unit().textContent).toBe('EUR');
        expect(element().textContent?.replace(/\s+/g, ' ').trim()).toBe('1,000.37 EUR');
        expect(unit().getBoundingClientRect().left).toBeGreaterThan(number().getBoundingClientRect().right);
        await update(() => host.unit.set(null));
        expect(unit().textContent).toBe('');
    });

    it('emphasized makes the number bold and announces it', async () => {
        const { host, number, unit, hidden, update } = await setup();
        expect(Number(getComputedStyle(number()).fontWeight)).toBeLessThan(700);
        expect(hidden()).toEqual([]);
        await update(() => host.emphasized.set(true));
        expect(Number(getComputedStyle(number()).fontWeight)).toBeGreaterThanOrEqual(700);
        expect(Number(getComputedStyle(unit()).fontWeight)).toBeLessThan(700);
        expect(hidden()).toEqual(['Emphasized']);
    });

    it('large uses a bigger font and ignores emphasized', async () => {
        const { host, element, number, update } = await setup();
        const regular = parseFloat(getComputedStyle(element()).fontSize);
        await update(() => {
            host.large.set(true);
            host.emphasized.set(true);
        });
        expect(parseFloat(getComputedStyle(element()).fontSize)).toBe(24);
        expect(parseFloat(getComputedStyle(element()).fontSize)).toBeGreaterThan(regular);
        expect(Number(getComputedStyle(number()).fontWeight)).toBeLessThan(700);
    });

    it('status colours the number with the semantic text colour', async () => {
        const { host, element, update } = await setup();
        expect(getComputedStyle(element()).color).toBe(color('var(--sapNeutralTextColor)'));
        const colors: Record<ObjectNumberStatus, string> = {
            positive: '--sapPositiveTextColor',
            critical: '--sapCriticalTextColor',
            negative: '--sapNegativeTextColor',
            informative: '--sapInformativeTextColor'
        };
        for (const [status, variable] of Object.entries(colors) as [ObjectNumberStatus, string][]) {
            await update(() => host.status.set(status));
            expect(getComputedStyle(element()).color, status).toBe(color(`var(${variable})`));
        }
    });

    it('status has a hidden text for assistive technology, overridable with statusMessage', async () => {
        const { host, element, hidden, update } = await setup();
        const texts: Record<ObjectNumberStatus, string> = {
            negative: 'Value State Error',
            critical: 'Value State Warning',
            positive: 'Value State Success',
            informative: 'Value State Information'
        };
        for (const [status, text] of Object.entries(texts) as [ObjectNumberStatus, string][]) {
            await update(() => host.status.set(status));
            expect(hidden()).toEqual([text]);
        }
        await update(() => host.statusMessage.set('Over budget'));
        expect(hidden()).toEqual(['Over budget']);
        const srOnly = element().querySelector('.sr-only-sap') as HTMLElement;
        expect(srOnly.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    });

    it('inverted shows a filled badge in the status colours', async () => {
        const { host, element, update } = await setup();
        expect(getComputedStyle(element()).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        await update(() => host.inverted.set(true));
        expect(getComputedStyle(element()).backgroundColor).toBe(color('var(--sapNeutralBackground)'));
        await update(() => host.status.set('negative'));
        expect(getComputedStyle(element()).backgroundColor).toBe(color('var(--sapButton_Negative_Background)'));
        expect(getComputedStyle(element()).color).toBe(color('var(--sapButton_Negative_TextColor)'));
    });

    it('ariaLabel names the number', async () => {
        const { host, element, update } = await setup();
        expect(element().hasAttribute('aria-label')).toBe(false);
        await update(() => host.ariaLabel.set('Price'));
        expect(element().getAttribute('aria-label')).toBe('Price');
    });

    it('is not focusable or a button unless interactive', async () => {
        const { host, element } = await setup();
        expect(element().getAttribute('role')).toBeNull();
        expect(element().hasAttribute('tabindex')).toBe(false);
        element().focus();
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toBe(0);
    });

    it('interactive number is a focusable button that activates with click, Enter and Space', async () => {
        const { host, element, update } = await setup();
        await update(() => host.interactive.set(true));
        expect(element().getAttribute('role')).toBe('button');
        expect(element().getAttribute('tabindex')).toBe('0');
        expect(getComputedStyle(element()).cursor).toBe('pointer');

        await userEvent.click(element());
        expect(host.clicks).toBe(1);
        (document.getElementById('plain') as HTMLElement).focus();
        element().focus();
        expect(document.activeElement).toBe(element());
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toBe(2);
        await userEvent.keyboard(' ');
        expect(host.clicks).toBe(3);
    });

    it('Space on an interactive number does not scroll the page', async () => {
        const { host, element, update } = await setup();
        await update(() => host.interactive.set(true));
        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        element().dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(host.clicks).toBe(1);
    });

    it('number and unit are isolated with <bdi> for RTL', async () => {
        document.documentElement.setAttribute('dir', 'rtl');
        const { host, element, number, unit, update } = await setup();
        await update(() => host.number.set(-2000));
        expect(number().tagName).toBe('BDI');
        expect(number().getAttribute('dir')).toBe('ltr');
        expect(unit().tagName).toBe('BDI');
        expect(getComputedStyle(element()).direction).toBe('rtl');
        expect(getComputedStyle(number()).direction).toBe('ltr');
        expect(getComputedStyle(number()).unicodeBidi).toBe('isolate');
        expect(getComputedStyle(unit()).unicodeBidi).toBe('isolate');
        // the minus stays in front of the digits and the unit is laid out on the left in RTL
        expect(number().textContent).toBe('-2,000.00');
        expect(unit().getBoundingClientRect().right).toBeLessThan(number().getBoundingClientRect().left);
    });
});
