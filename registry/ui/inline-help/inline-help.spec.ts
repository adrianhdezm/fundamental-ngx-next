import type { ScrollStrategy } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Icon } from '@/ui/icon/icon';
import type { Placement } from '@/ui/popover/popover';
import { InlineHelp } from './inline-help';

@Component({
    imports: [Icon, InlineHelp],
    template: `
        <div style="padding: 200px">
            <button id="before">Before</button>
            @if (show()) {
                <fd-icon
                    id="help"
                    glyph="question-mark"
                    tabindex="0"
                    [fdInlineHelp]="text()"
                    bodyId="help-body"
                    [placement]="placement()"
                    [closeOnEscapeKey]="closeOnEscape()"
                    [disabled]="disabled()"
                    [noArrow]="noArrow()"
                    [maxWidth]="maxWidth()"
                    [appendTo]="appendTo()"
                    [scrollStrategy]="scrollStrategy()"
                    [restoreFocusOnClose]="restore()"
                    [additionalBodyClass]="bodyClass()"
                />
            }
            <input id="field" aria-label="Field" fdInlineHelp="Format: YYYY-MM-DD" bodyId="field-body" />
            <ng-template #rich
                ><span class="rich">Rich <b>help</b></span></ng-template
            >
            <span id="rich-trigger" tabindex="0" [fdInlineHelp]="rich" bodyId="rich-body">Rich</span>
            <button id="click" fdInlineHelp="Clicked help" bodyId="click-body" [triggers]="clickTriggers">Click</button>
        </div>
    `
})
class Host {
    readonly placement = signal<Placement | null>(null);
    readonly closeOnEscape = signal(true);
    readonly disabled = signal(false);
    readonly show = signal(true);
    readonly text = signal('Explains the field');
    readonly noArrow = signal(false);
    readonly maxWidth = signal<number | null>(null);
    readonly appendTo = signal<HTMLElement | null>(null);
    readonly scrollStrategy = signal<ScrollStrategy | null>(null);
    readonly restore = signal(true);
    readonly bodyClass = signal<string | null>(null);
    readonly clickTriggers = ['click'];
}

const frame = () => new Promise((r) => requestAnimationFrame(r));
const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const body = (id: string) => document.getElementById(id);

async function setup(configure?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await fixture.whenStable();
        await frame();
    };
    await stable();
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        icon: root.querySelector<HTMLElement>('#help')!,
        stable
    };
}

describe('InlineHelp', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('dir');
        document.querySelectorAll('[role=tooltip]').forEach((el) => el.closest('.cdk-overlay-pane')?.remove());
    });

    it('opens on hover and closes when the pointer leaves', async () => {
        const { icon, root, stable } = await setup();
        expect(body('help-body')).toBeNull();
        await userEvent.hover(icon);
        await stable();
        const tooltip = body('help-body')!;
        expect(tooltip).not.toBeNull();
        expect(tooltip.getAttribute('role')).toBe('tooltip');
        expect(tooltip.textContent).toContain('Explains the field');
        await userEvent.hover(root.querySelector('#before')!);
        await stable();
        await wait(150);
        expect(body('help-body')).toBeNull();
    });

    it('opens on focus and closes on blur, keeping focus on the trigger', async () => {
        const { icon, root, stable } = await setup();
        root.querySelector<HTMLElement>('#before')!.focus();
        await userEvent.tab();
        await stable();
        expect(document.activeElement).toBe(icon);
        expect(body('help-body')).not.toBeNull();
        await userEvent.tab();
        await stable();
        await wait(150);
        expect(body('help-body')).toBeNull();
    });

    it('closes on Escape when closeOnEscapeKey is set', async () => {
        const { icon, stable } = await setup();
        icon.focus();
        await stable();
        expect(body('help-body')).not.toBeNull();
        await userEvent.keyboard('{Escape}');
        await stable();
        await wait(150);
        expect(body('help-body')).toBeNull();
        expect(document.activeElement).toBe(icon);
    });

    it('stays open on Escape without closeOnEscapeKey', async () => {
        const { icon, stable } = await setup((h) => h.closeOnEscape.set(false));
        icon.focus();
        await stable();
        await userEvent.keyboard('{Escape}');
        await stable();
        expect(body('help-body')).not.toBeNull();
    });

    it('a disabled inline help does not open', async () => {
        const { icon, stable } = await setup((h) => h.disabled.set(true));
        icon.focus();
        await userEvent.hover(icon);
        await stable();
        expect(body('help-body')).toBeNull();
    });

    it('custom triggers: click toggles the help', async () => {
        const { root, stable } = await setup();
        const button = root.querySelector<HTMLElement>('#click')!;
        await userEvent.hover(button);
        await stable();
        expect(body('click-body')).toBeNull();
        await userEvent.click(button);
        await stable();
        expect(body('click-body')!.textContent).toContain('Clicked help');
        await userEvent.click(button);
        await stable();
        await wait(150);
        expect(body('click-body')).toBeNull();
    });

    it('the help text is referenced via aria-describedby with an off-screen copy in the trigger', async () => {
        const { icon, root } = await setup();
        expect(icon.getAttribute('aria-describedby')).toBe('help-body-text');
        const text = document.getElementById('help-body-text')!;
        expect(text.textContent).toBe('Explains the field');
        expect(icon.contains(text)).toBe(true);
        expect(text.getBoundingClientRect().width).toBeLessThanOrEqual(1);
        // the icon trigger stays visible to assistive technology
        expect(icon.getAttribute('aria-hidden')).not.toBe('true');

        const field = root.querySelector<HTMLInputElement>('#field')!;
        expect(field.getAttribute('aria-describedby')).toBe('field-body-text');
        const fieldText = document.getElementById('field-body-text')!;
        expect(fieldText.previousElementSibling).toBe(field);
        expect(fieldText.textContent).toBe('Format: YYYY-MM-DD');
    });

    it('template content renders in the body and in the screen reader text', async () => {
        const { root, stable } = await setup();
        const trigger = root.querySelector<HTMLElement>('#rich-trigger')!;
        expect(document.getElementById('rich-body-text')!.textContent).toBe('Rich help');
        trigger.focus();
        await stable();
        expect(body('rich-body')!.querySelector('b')!.textContent).toBe('help');
    });

    it('placement positions the body next to the trigger', async () => {
        const { icon, host, stable } = await setup((h) => h.placement.set('right'));
        icon.focus();
        await stable();
        const rect = body('help-body')!.getBoundingClientRect();
        expect(rect.left).toBeGreaterThanOrEqual(icon.getBoundingClientRect().right - 1);
        icon.blur();
        await stable();
        await wait(150);
        host.placement.set('top');
        await stable();
        icon.focus();
        await stable();
        expect(body('help-body')!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
            icon.getBoundingClientRect().top + 1
        );
    });

    it('placement follows RTL: start-aligned placements align with the right edge, left/right stay physical', async () => {
        document.documentElement.setAttribute('dir', 'rtl');
        const { icon, host, stable } = await setup((h) => h.placement.set('bottom-start'));
        icon.focus();
        await stable();
        const iconRect = icon.getBoundingClientRect();
        let rect = body('help-body')!.getBoundingClientRect();
        expect(rect.top).toBeGreaterThanOrEqual(iconRect.bottom - 1);
        expect(Math.abs(rect.right - iconRect.right)).toBeLessThanOrEqual(1);
        icon.blur();
        await stable();
        await wait(150);
        host.placement.set('right');
        await stable();
        icon.focus();
        await stable();
        rect = body('help-body')!.getBoundingClientRect();
        expect(rect.left).toBeGreaterThanOrEqual(iconRect.right - 1);
    });

    it('the help closes when the trigger is destroyed', async () => {
        const { icon, host, stable } = await setup();
        icon.focus();
        await stable();
        expect(body('help-body')).not.toBeNull();
        host.show.set(false);
        await stable();
        expect(body('help-body')).toBeNull();
        expect(document.querySelector('.cdk-overlay-pane')).toBeNull();
    });

    it('Escape closes a hover-opened help when closeOnEscapeKey is set', async () => {
        const { icon, stable } = await setup();
        await userEvent.hover(icon);
        await stable();
        expect(body('help-body')).not.toBeNull();
        expect(document.activeElement).not.toBe(icon);
        await userEvent.keyboard('{Escape}');
        await stable();
        expect(body('help-body')).toBeNull();
    });

    it('Escape leaves a hover-opened help open without closeOnEscapeKey', async () => {
        const { icon, stable } = await setup((h) => h.closeOnEscape.set(false));
        await userEvent.hover(icon);
        await stable();
        expect(document.activeElement).not.toBe(icon);
        await userEvent.keyboard('{Escape}');
        await stable();
        expect(body('help-body')).not.toBeNull();
    });

    it('shows an arrow pointing at the trigger; noArrow hides it', async () => {
        const { icon, host, stable } = await setup();
        icon.focus();
        await stable();
        expect(getComputedStyle(body('help-body')!, '::after').content).toBe('""');
        icon.blur();
        await stable();
        await wait(150);
        host.noArrow.set(true);
        await stable();
        icon.focus();
        await stable();
        expect(getComputedStyle(body('help-body')!, '::after').content).toBe('none');
        expect(getComputedStyle(body('help-body')!, '::before').content).toBe('none');
    });

    it('maxWidth limits the body width', async () => {
        const { icon, stable } = await setup((h) => {
            h.text.set('A long help text that would be much wider than the limit if it were not wrapped. '.repeat(3));
            h.maxWidth.set(200);
        });
        icon.focus();
        await stable();
        const rect = body('help-body')!.getBoundingClientRect();
        expect(Math.abs(rect.width - 200)).toBeLessThanOrEqual(1);
        // the text wraps onto several lines instead
        expect(rect.height).toBeGreaterThan(60);
    });

    it('appendTo positions the body against the given element', async () => {
        const anchor = document.createElement('div');
        anchor.style.cssText = 'position: fixed; top: 400px; left: 600px; width: 40px; height: 40px';
        document.body.appendChild(anchor);
        const { icon, stable } = await setup((h) => {
            h.placement.set('bottom-start');
            h.appendTo.set(anchor);
        });
        icon.focus();
        await stable();
        const rect = body('help-body')!.getBoundingClientRect();
        // below the anchor (8px arrow gap) and aligned with its start edge, not with the icon
        expect(Math.abs(rect.top - 448)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(rect.left - 600)).toBeLessThanOrEqual(1.5);
        anchor.remove();
    });

    it('a custom scrollStrategy is used', async () => {
        const calls: string[] = [];
        const strategy: ScrollStrategy = {
            attach: () => calls.push('attach'),
            enable: () => calls.push('enable'),
            disable: () => calls.push('disable'),
            detach: () => calls.push('detach')
        };
        const { icon, stable } = await setup((h) => h.scrollStrategy.set(strategy));
        icon.focus();
        await stable();
        expect(body('help-body')).not.toBeNull();
        expect(calls).toEqual(['attach', 'enable']);
        icon.blur();
        await stable();
        await wait(150);
        expect(calls).toContain('disable');
    });

    it('closing never moves focus: inline help leaves focus where it is, with or without restoreFocusOnClose', async () => {
        for (const restore of [true, false]) {
            const { fixture, icon, root, stable } = await setup((h) => {
                h.restore.set(restore);
                h.closeOnEscape.set(true);
            });
            await userEvent.hover(icon);
            await stable();
            const before = root.querySelector<HTMLElement>('#before')!;
            before.focus();
            await userEvent.keyboard('{Escape}');
            await stable();
            expect(body('help-body')).toBeNull();
            expect(document.activeElement).toBe(before);
            fixture.destroy();
        }
    });

    it('additionalBodyClass is applied to the body', async () => {
        const { icon, stable } = await setup((h) => h.bodyClass.set('bg-sap-information-background'));
        icon.focus();
        await stable();
        const surface = body('help-body')!;
        // the body animates its colours
        await wait(200);
        expect(surface.classList).toContain('bg-sap-information-background');
        // it replaces the default surface colour
        const reference = document.createElement('div');
        reference.className = 'bg-sap-information-background';
        document.body.appendChild(reference);
        expect(getComputedStyle(surface).backgroundColor).toBe(getComputedStyle(reference).backgroundColor);
        reference.remove();
    });
});
