import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Bar, BarElement, BarLeft, BarMiddle, BarRight, ButtonBar, type BarDesign, type BarSize } from './bar';

@Component({
    imports: [Bar, BarLeft, BarMiddle, BarRight, BarElement, ButtonBar],
    template: `
        <div style="position: relative; height: 300px" [style.width]="width()">
            <div
                fd-bar
                data-testid="bar"
                aria-label="Test bar"
                [barDesign]="design()"
                [inPage]="inPage()"
                [inHomePage]="inHomePage()"
                [size]="size()"
                [clear]="clear()"
                [role]="role()"
            >
                <div fd-bar-left data-testid="left">
                    <fd-button-bar ariaLabel="Back" glyph="navigation-left-arrow" (click)="clicks.push('back')" />
                    <fd-bar-element
                        ><h4 data-testid="title" style="margin: 0" class="truncate">{{ title() }}</h4></fd-bar-element
                    >
                </div>
                <div fd-bar-middle data-testid="middle"><fd-bar-element>Middle</fd-bar-element></div>
                <div fd-bar-right data-testid="right">
                    <fd-button-bar
                        data-testid="save"
                        label="Save"
                        glyph="save"
                        variant="emphasized"
                        title="Save the changes"
                        [disabled]="disabled()"
                        (click)="clicks.push('save')"
                    />
                    <fd-button-bar data-testid="cancel" label="Cancel" (click)="clicks.push('cancel')" />
                </div>
            </div>
        </div>
    `
})
class Host {
    readonly design = signal<BarDesign | null>(null);
    readonly inPage = signal(false);
    readonly inHomePage = signal(false);
    readonly size = signal<BarSize>('');
    readonly clear = signal(false);
    readonly role = signal<string | null>('toolbar');
    readonly disabled = signal(false);
    readonly width = signal('1000px');
    readonly title = signal('Title');
    readonly clicks: string[] = [];
}

@Component({
    imports: [Bar, BarMiddle],
    template: `
        <div fd-bar barDesign="header" data-testid="header"><div fd-bar-middle>Header</div></div>
        <div fd-bar barDesign="subheader" data-testid="subheader"><div fd-bar-middle>Sub</div></div>
        <div fd-bar barDesign="header" data-testid="alone"><div fd-bar-middle>Alone</div></div>
    `
})
class HeaderHost {}

@Component({
    imports: [Bar, BarMiddle, BarElement],
    template: `
        <div fd-bar data-testid="layout-bar" aria-label="Layout bar" style="width: 600px">
            <div fd-bar-middle data-testid="area">
                <fd-bar-element data-testid="element" [fullWidth]="fullWidth()">
                    <input data-testid="input" aria-label="Field" size="5" />
                </fd-bar-element>
            </div>
        </div>
        <div
            fd-bar
            data-testid="tall-bar"
            aria-label="Suggestions"
            [initialSuggestionTitle]="suggestionTitle()"
            [initialSuggestionSubline]="suggestionSubline()"
        >
            <div fd-bar-left>
                <fd-bar-element><div style="height: 64px">Suggestion</div></fd-bar-element>
            </div>
        </div>
    `
})
class LayoutHost {
    readonly fullWidth = signal(false);
    readonly suggestionTitle = signal(false);
    readonly suggestionSubline = signal(false);
}

async function setup(config: Partial<{ design: BarDesign; width: string; title: string }> = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.design) host.design.set(config.design);
    if (config.width) host.width.set(config.width);
    if (config.title) host.title.set(config.title);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
    const button = (id: string) => el(id).querySelector('button')!;
    return { fixture, host, root, el, button, bar: () => el('bar') };
}

/** Resolves a CSS value with theme variables the way the browser computes it. */
function themed(property: 'backgroundColor' | 'boxShadow' | 'borderTopColor', value: string): string {
    const probe = document.createElement('div');
    probe.style[property] = value;
    if (property === 'borderTopColor') probe.style.borderTopStyle = 'solid';
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe)[property];
    probe.remove();
    return computed;
}

const rect = (el: Element) => el.getBoundingClientRect();
const center = (el: Element) => (rect(el).left + rect(el).right) / 2;

describe('Bar', () => {
    it('is a toolbar with left, middle and right areas in order', async () => {
        const { bar, el } = await setup();
        expect(bar().getAttribute('role')).toBe('toolbar');
        expect(bar().getAttribute('aria-label')).toBe('Test bar');
        expect(rect(el('left')).left).toBeCloseTo(rect(bar()).left + 16, 0);
        expect(rect(el('left')).right).toBeLessThan(rect(el('middle')).left);
        expect(rect(el('middle')).right).toBeLessThan(rect(el('right')).left);
        expect(rect(el('right')).right).toBeCloseTo(rect(bar()).right - 16, 0);
    });

    it('role toolbar can be overridden or removed', async () => {
        const { fixture, host, bar } = await setup();
        host.role.set('group');
        await fixture.whenStable();
        expect(bar().getAttribute('role')).toBe('group');
        host.role.set(null);
        await fixture.whenStable();
        expect(bar().hasAttribute('role')).toBe(false);
    });

    it('defaults to the page header background and shadow', async () => {
        const { bar } = await setup();
        const style = getComputedStyle(bar());
        expect(bar().hasAttribute('data-bar-design')).toBe(false);
        expect(style.backgroundColor).toBe(themed('backgroundColor', 'var(--sapPageHeader_Background)'));
        expect(style.boxShadow).toContain(themed('boxShadow', 'var(--sapContent_HeaderShadow)'));
        expect(style.boxShadow).not.toBe('none');
        expect(rect(bar()).height).toBe(44);
    });

    it('clear removes the shadow', async () => {
        const { fixture, host, bar } = await setup();
        host.clear.set(true);
        await fixture.whenStable();
        expect(getComputedStyle(bar()).boxShadow).toBe('none');
    });

    it('header uses the page header text color and the header font', async () => {
        const { el } = await setup({ design: 'header' });
        const middle = el('middle').querySelector('fd-bar-element')!;
        const probe = document.createElement('div');
        probe.style.color = 'var(--sapPageHeader_TextColor)';
        probe.style.fontSize = 'var(--sapFontHeader5Size)';
        document.body.appendChild(probe);
        expect(getComputedStyle(middle).color).toBe(getComputedStyle(probe).color);
        expect(getComputedStyle(middle).fontSize).toBe(getComputedStyle(probe).fontSize);
        probe.remove();
        expect(el('bar').getAttribute('data-bar-design')).toBe('header');
    });

    it('a header followed by a subheader drops its shadow; the subheader is taller', async () => {
        const fixture = TestBed.createComponent(HeaderHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const el = (id: string) => (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${id}"]`)!;
        expect(getComputedStyle(el('header')).boxShadow).toBe('none');
        expect(getComputedStyle(el('alone')).boxShadow).not.toBe('none');
        expect(rect(el('subheader')).height).toBe(48);
        expect(getComputedStyle(el('subheader')).paddingBottom).toBe('4px');
    });

    it('footer uses the page footer background with a top border and no shadow', async () => {
        const { bar } = await setup({ design: 'footer' });
        const style = getComputedStyle(bar());
        expect(style.backgroundColor).toBe(themed('backgroundColor', 'var(--sapPageFooter_Background)'));
        expect(style.boxShadow).toBe('none');
        expect(style.borderTopStyle).toBe('solid');
        expect(style.borderTopColor).toBe(themed('borderTopColor', 'var(--sapPageFooter_BorderColor)'));
    });

    it('floating footer floats above the bottom of its container with a shadow', async () => {
        const { bar } = await setup({ design: 'floating-footer' });
        const container = bar().parentElement!;
        const style = getComputedStyle(bar());
        expect(style.position).toBe('absolute');
        expect(style.boxShadow).toContain(themed('boxShadow', 'var(--sapContent_Shadow1)'));
        expect(style.backgroundColor).toBe(themed('backgroundColor', 'var(--sapPageFooter_Background)'));
        expect(rect(container).bottom - rect(bar()).bottom).toBe(8);
        expect(rect(bar()).left - rect(container).left).toBe(8);
        expect(rect(container).right - rect(bar()).right).toBe(8);
    });

    it('inPage paddings follow size s, m_l and xl', async () => {
        const { fixture, host, bar } = await setup();
        const padding = () => [getComputedStyle(bar()).paddingInlineStart, getComputedStyle(bar()).paddingInlineEnd];
        expect(padding()).toEqual(['16px', '16px']);
        host.inPage.set(true);
        for (const [size, px] of [
            ['s', '16px'],
            ['m_l', '32px'],
            ['xl', '48px']
        ] as const) {
            host.size.set(size);
            await fixture.whenStable();
            expect(padding()).toEqual([px, px]);
        }
    });

    it('inHomePage paddings follow every size and the default', async () => {
        const { fixture, host, bar } = await setup();
        const padding = () => [getComputedStyle(bar()).paddingInlineStart, getComputedStyle(bar()).paddingInlineEnd];
        host.inHomePage.set(true);
        for (const [size, px] of [
            ['', '16px'],
            ['s', '8px'],
            ['m_l', '32px'],
            ['xl', '48px']
        ] as const) {
            host.size.set(size);
            await fixture.whenStable();
            expect(padding()).toEqual([px, px]);
        }
    });

    it('fullWidth makes a bar element fill its area', async () => {
        const fixture = TestBed.createComponent(LayoutHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
        const area = el('area');
        expect(rect(area).width).toBe(rect(el('layout-bar')).width - 32);
        expect(rect(el('element')).width).toBeLessThan(rect(area).width / 2);

        fixture.componentInstance.fullWidth.set(true);
        await fixture.whenStable();
        expect(rect(el('element')).width).toBe(rect(area).width);
        // Its first child grows with it.
        expect(rect(el('input')).width).toBe(rect(area).width);
    });

    it('initialSuggestionTitle and initialSuggestionSubline let the bar grow with their paddings', async () => {
        const fixture = TestBed.createComponent(LayoutHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const host = fixture.componentInstance;
        const bar = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-testid="tall-bar"]')!;
        const paddings = () => [getComputedStyle(bar).paddingTop, getComputedStyle(bar).paddingBottom];
        // The 64px content is taller than the bar: it grows to fit, without padding.
        expect(paddings()).toEqual(['0px', '0px']);
        expect(rect(bar).height).toBe(64);

        host.suggestionTitle.set(true);
        await fixture.whenStable();
        expect(paddings()).toEqual(['8px', '0px']);
        expect(rect(bar).height).toBe(72);

        host.suggestionTitle.set(false);
        host.suggestionSubline.set(true);
        await fixture.whenStable();
        expect(paddings()).toEqual(['4px', '8px']);
        expect(rect(bar).height).toBe(76);
    });

    it('a floating footer in a page is offset by the page size', async () => {
        const { fixture, host, bar } = await setup({ design: 'floating-footer' });
        host.inPage.set(true);
        host.size.set('m_l');
        await fixture.whenStable();
        const container = bar().parentElement!;
        expect(rect(bar()).left - rect(container).left).toBe(32);
        expect(getComputedStyle(bar()).paddingInlineStart).toBe('8px');
    });

    it('middle stays centred between equal side areas', async () => {
        const fixture = TestBed.createComponent(Host);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const left = root.querySelector<HTMLElement>('[fd-bar-left]')!;
        const right = root.querySelector<HTMLElement>('[fd-bar-right]')!;
        left.style.width = right.style.width = '200px';
        const bar = root.querySelector('[fd-bar]')!;
        expect(Math.abs(center(root.querySelector('[fd-bar-middle]')!) - center(bar))).toBeLessThanOrEqual(1);
    });

    it('areas truncate titles before buttons', async () => {
        const long = 'A very long title that does not fit next to the buttons of this bar at all';
        const { el, button } = await setup({ width: '360px', title: long });
        const title = el('title');
        expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
        // the buttons keep their full size and stay inside the bar
        for (const id of ['save', 'cancel']) {
            const b = button(id);
            expect(b.scrollWidth).toBeLessThanOrEqual(b.clientWidth);
            expect(rect(b).right).toBeLessThanOrEqual(rect(el('bar')).right);
        }
        expect(rect(el('right')).right).toBeCloseTo(rect(el('bar')).right - 16, 0);
    });

    it('button-bar renders a transparent button with label and glyph', async () => {
        const { button } = await setup();
        const cancel = button('cancel');
        expect(cancel.getAttribute('type')).toBe('button');
        expect(cancel.textContent!.trim()).toBe('Cancel');
        expect(getComputedStyle(cancel).backgroundColor).toBe(
            themed('backgroundColor', 'var(--sapButton_Lite_Background)')
        );
        const save = button('save');
        expect(save.textContent!.trim().startsWith('Save')).toBe(true);
        expect(save.querySelector('fd-icon')!.getAttribute('data-glyph')).toBeTruthy();
        expect(save.getAttribute('title')).toBe('Save the changes');
        expect(save.id).toMatch(/^fd-button-bar-\d+$/);
        // icon-only buttons are named by ariaLabel
        const back = button('left');
        expect(back.getAttribute('aria-label')).toBe('Back');
    });

    it('button-bar is compact in compact density', async () => {
        const { button } = await setup();
        const cozy = rect(button('cancel')).height;
        expect(cozy).toBe(36);
        document.documentElement.setAttribute('data-density', 'compact');
        try {
            expect(rect(button('cancel')).height).toBe(26);
        } finally {
            document.documentElement.removeAttribute('data-density');
        }
    });

    it('compact density makes the bar shorter', async () => {
        const { bar } = await setup();
        document.documentElement.setAttribute('data-density', 'compact');
        try {
            expect(rect(bar()).height).toBe(40);
        } finally {
            document.documentElement.removeAttribute('data-density');
        }
    });

    it('button-bar clicks reach the host; a disabled one is inert', async () => {
        const { fixture, host, button } = await setup();
        await userEvent.click(button('save'));
        button('cancel').focus();
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toEqual(['save', 'cancel']);

        host.disabled.set(true);
        await fixture.whenStable();
        expect(button('save').disabled).toBe(true);
        button('save').click();
        expect(host.clicks).toEqual(['save', 'cancel']);
    });
});
