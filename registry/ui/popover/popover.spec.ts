import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    Popover,
    PopoverBody,
    PopoverControl,
    PopoverTrigger,
    arrowFor,
    getCdkPlacement,
    normalizeTriggers,
    type Placement,
    type PopoverFillMode
} from './popover';

@Component({
    imports: [Popover, PopoverBody, PopoverControl],
    template: `
        <button data-testid="outside">Outside</button>
        <div [style.padding-top]="offsetTop()" [style.padding-inline-start]="offsetLeft()">
            <fd-popover
                id="pop"
                [(isOpen)]="open"
                (beforeOpen)="beforeOpen = beforeOpen + 1"
                [placement]="placement()"
                [triggers]="triggers()"
                [noArrow]="noArrow()"
                [disabled]="disabled()"
                [closeOnOutsideClick]="outsideClick()"
                [closeOnEscapeKey]="escapeKey()"
                [focusTrapped]="trapped()"
                [focusAutoCapture]="autoCapture()"
                [restoreFocusOnClose]="restore()"
                [fixedPosition]="fixed()"
                [fillControlMode]="fill()"
                [maxWidth]="maxWidth()"
                bodyAriaLabel="Details"
            >
                <fd-popover-control>
                    <button data-testid="trigger" [style.width.px]="triggerWidth()" style="height: 36px">Open</button>
                </fd-popover-control>
                <fd-popover-body>
                    <div style="padding: 8px" [style.width]="contentWidth()">
                        <button data-testid="first">First</button>
                        <button data-testid="last">Last</button>
                    </div>
                </fd-popover-body>
            </fd-popover>
        </div>
    `
})
class Host {
    readonly open = signal(false);
    readonly placement = signal<Placement | undefined>(undefined);
    readonly triggers = signal<string[] | undefined>(undefined);
    readonly noArrow = signal<boolean | undefined>(undefined);
    readonly disabled = signal<boolean | undefined>(undefined);
    readonly outsideClick = signal<boolean | undefined>(undefined);
    readonly escapeKey = signal<boolean | undefined>(undefined);
    readonly trapped = signal<boolean | undefined>(undefined);
    readonly autoCapture = signal<boolean | undefined>(undefined);
    readonly restore = signal<boolean | undefined>(undefined);
    readonly fixed = signal<boolean | undefined>(undefined);
    readonly fill = signal<PopoverFillMode | null>(null);
    readonly maxWidth = signal<number | null>(null);
    readonly triggerWidth = signal(80);
    readonly contentWidth = signal('auto');
    readonly offsetTop = signal('100px');
    readonly offsetLeft = signal('400px');
    beforeOpen = 0;
}

@Component({
    imports: [Popover, PopoverTrigger],
    template: `
        <button data-testid="external" [fdPopoverTrigger]="pop">More</button>
        <fd-popover #pop id="external-pop" text="Plain text content" bodyRole="region" />
    `
})
class TriggerHost {}

type Config = Partial<{
    [K in keyof Host as Host[K] extends { set: (v: never) => void } ? K : never]: Host[K] extends {
        set: (v: infer V) => void;
    }
        ? V
        : never;
}>;

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function setup(config: Config = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    for (const [key, value] of Object.entries(config)) {
        (host[key as keyof Config] as { set: (v: unknown) => void }).set(value);
    }
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await fixture.whenStable();
        await frame();
    };
    await stable();
    const root = fixture.nativeElement as HTMLElement;
    const el = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
    return {
        fixture,
        host,
        root,
        stable,
        el,
        trigger: () => el('trigger'),
        body: () => document.querySelector<HTMLElement>('.cdk-overlay-pane fd-popover-body'),
        surface: () =>
            document.querySelector<HTMLElement>('.cdk-overlay-pane fd-popover-body > div:not(.cdk-focus-trap-anchor)')!
    };
}

const rect = (el: Element) => el.getBoundingClientRect();
/** Positions match within the sub-pixel rounding of the overlay. */
const near = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1.5);

afterEach(() => {
    document.documentElement.removeAttribute('dir');
});

describe('Popover', () => {
    describe('opening and closing', () => {
        it('opens on click into the overlay with a labelled dialog body', async () => {
            const { host, root, stable, trigger, body, surface } = await setup();
            expect(body()).toBeNull();
            // the control's button stays the tab stop
            expect(trigger().tabIndex).toBe(0);
            await userEvent.click(trigger());
            await stable();
            expect(body()).not.toBeNull();
            expect(root.contains(body())).toBe(false);
            expect(host.open()).toBe(true);
            expect(surface().getAttribute('role')).toBe('dialog');
            expect(surface().getAttribute('aria-label')).toBe('Details');
            expect(surface().id).toBe('pop-body');
            expect(body()!.textContent).toContain('First');

            // a second click on the trigger closes it
            await userEvent.click(trigger());
            await stable();
            expect(body()).toBeNull();
            expect(host.open()).toBe(false);
        });

        it('closes on outside click', async () => {
            const { host, stable, el, trigger, body } = await setup();
            await userEvent.click(trigger());
            await stable();
            await userEvent.click(el('outside'));
            await stable();
            expect(body()).toBeNull();
            expect(host.open()).toBe(false);
            // focus moved elsewhere, so it is not pulled back
            expect(document.activeElement).toBe(el('outside'));
        });

        it('closes on Escape and returns focus to the trigger', async () => {
            const { host, stable, el, trigger, body } = await setup();
            await userEvent.click(trigger());
            await stable();
            expect(document.activeElement).toBe(el('first'));
            await userEvent.keyboard('{Escape}');
            await stable();
            expect(body()).toBeNull();
            expect(host.open()).toBe(false);
            expect(document.activeElement).toBe(trigger());
        });

        it('closeOnOutsideClick=false and closeOnEscapeKey=false keep it open', async () => {
            const { stable, el, trigger, body } = await setup({ outsideClick: false, escapeKey: false });
            await userEvent.click(trigger());
            await stable();
            await userEvent.click(el('outside'));
            await stable();
            expect(body()).not.toBeNull();
            el('first').focus();
            await userEvent.keyboard('{Escape}');
            await stable();
            expect(body()).not.toBeNull();
        });

        it('opens with Alt+ArrowDown on the trigger', async () => {
            const { host, stable, trigger, body } = await setup();
            trigger().focus();
            await userEvent.keyboard('{ArrowDown}');
            await stable();
            expect(body()).toBeNull();
            await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
            await stable();
            expect(body()).not.toBeNull();
            expect(host.open()).toBe(true);
        });

        it('opens and closes on hover with configured triggers', async () => {
            const { stable, el, trigger, body } = await setup({ triggers: ['mouseenter', 'mouseleave'] });
            trigger().click();
            await stable();
            // click is no trigger now
            expect(body()).toBeNull();
            await userEvent.hover(trigger());
            await stable();
            expect(body()).not.toBeNull();
            // moving into the body keeps it open
            await userEvent.hover(el('first'));
            await wait(100);
            await stable();
            expect(body()).not.toBeNull();
            await userEvent.hover(el('outside'));
            await wait(100);
            await stable();
            expect(body()).toBeNull();
        });

        it('a disabled popover does not open', async () => {
            const { host, stable, trigger, body } = await setup({ disabled: true });
            trigger().click();
            await stable();
            expect(body()).toBeNull();
            expect(host.open()).toBe(false);
        });
    });

    describe('isOpen', () => {
        it('two-way binding opens, closes and reports user changes; beforeOpen emits', async () => {
            const { fixture, host, stable, trigger, body } = await setup();
            host.open.set(true);
            await stable();
            expect(body()).not.toBeNull();
            expect(host.beforeOpen).toBe(1);

            host.open.set(false);
            await stable();
            expect(body()).toBeNull();

            await userEvent.click(trigger());
            await stable();
            expect(host.open()).toBe(true);
            expect(host.beforeOpen).toBe(2);
            await userEvent.keyboard('{Escape}');
            await stable();
            expect(host.open()).toBe(false);
            fixture.destroy();
        });
    });

    describe('position', () => {
        it('opens below the trigger aligned to its start by default', async () => {
            const { stable, trigger, surface } = await setup();
            await userEvent.click(trigger());
            await stable();
            near(rect(surface()).top, rect(trigger()).bottom);
            near(rect(surface()).left, rect(trigger()).left);
        });

        it('follows the placement input', async () => {
            const { fixture, host, stable, trigger, surface } = await setup({ offsetTop: '300px' });
            host.placement.set('top-end');
            await fixture.whenStable();
            await userEvent.click(trigger());
            await stable();
            near(rect(surface()).bottom, rect(trigger()).top);
            near(rect(surface()).right, rect(trigger()).right);
            await userEvent.keyboard('{Escape}');
            await stable();

            host.placement.set('right');
            await fixture.whenStable();
            await userEvent.click(trigger());
            await stable();
            near(rect(surface()).left, rect(trigger()).right);
            const middle = (r: DOMRect) => (r.top + r.bottom) / 2;
            near(middle(rect(surface())), middle(rect(trigger())));
        });

        it('flips when there is no room below', async () => {
            const { stable, trigger, surface } = await setup({ offsetTop: '740px', placement: 'bottom-start' });
            await userEvent.click(trigger());
            await stable();
            expect(rect(trigger()).bottom).toBeGreaterThan(760);
            near(rect(surface()).bottom, rect(trigger()).top);
        });

        it('fixedPosition keeps the placement even without room', async () => {
            const { stable, trigger, surface } = await setup({ offsetTop: '740px', fixed: true });
            await userEvent.click(trigger());
            await stable();
            near(rect(surface()).top, rect(trigger()).bottom);
        });

        it('follows RTL: start aligns to the right, left/right placements stay physical', async () => {
            document.documentElement.setAttribute('dir', 'rtl');
            const { fixture, host, stable, trigger, surface } = await setup();
            await userEvent.click(trigger());
            await stable();
            near(rect(surface()).right, rect(trigger()).right);
            await userEvent.keyboard('{Escape}');
            await stable();

            host.placement.set('right');
            await fixture.whenStable();
            await userEvent.click(trigger());
            await stable();
            near(rect(surface()).left, rect(trigger()).right);
        });

        it('position helpers: RTL swap, fallbacks and arrow sides', () => {
            expect(getCdkPlacement('left', 'rtl')).toEqual(getCdkPlacement('right'));
            expect(getCdkPlacement('right-start', 'rtl')).toEqual(getCdkPlacement('left-start'));
            expect(getCdkPlacement('bottom-start', 'rtl')).toEqual(getCdkPlacement('bottom-start'));
            expect(arrowFor(getCdkPlacement('bottom'))).toEqual({ side: 'top', align: 'center' });
            expect(arrowFor(getCdkPlacement('top-end'))).toEqual({ side: 'bottom', align: 'end' });
            expect(arrowFor(getCdkPlacement('right-start'))).toEqual({ side: 'start', align: 'start' });
            expect(arrowFor(getCdkPlacement('left'))).toEqual({ side: 'end', align: 'center' });
            expect(normalizeTriggers(['click'])).toEqual([{ trigger: 'click', openAction: true, closeAction: true }]);
            expect(normalizeTriggers(['focusin', 'focusout'])).toEqual([
                { trigger: 'focusin', openAction: true, closeAction: false },
                { trigger: 'focusout', openAction: false, closeAction: true }
            ]);
        });
    });

    describe('arrow', () => {
        it('has no arrow by default', async () => {
            const { stable, trigger, surface } = await setup();
            await userEvent.click(trigger());
            await stable();
            expect(getComputedStyle(surface(), '::after').content).toBe('none');
            expect(getComputedStyle(surface(), '::before').content).toBe('none');
        });

        it('noArrow=false draws an arrow pointing at the trigger and leaves room for it', async () => {
            const { stable, trigger, surface } = await setup({ noArrow: false });
            await userEvent.click(trigger());
            await stable();
            const after = getComputedStyle(surface(), '::after');
            expect(after.content).toBe('""');
            // arrow on top of the body, below a trigger opening downwards
            expect(after.top).toBe('-8px');
            expect(after.borderBottomWidth).toBe('8px');
            near(rect(surface()).top - rect(trigger()).bottom, 8);
        });

        it('the arrow moves to the bottom when the popover opens upwards', async () => {
            const { stable, trigger, surface } = await setup({ noArrow: false, placement: 'top' });
            await userEvent.click(trigger());
            await stable();
            const after = getComputedStyle(surface(), '::after');
            expect(after.borderTopWidth).toBe('8px');
            expect(after.borderBottomWidth).toBe('0px');
            near(rect(trigger()).top - rect(surface()).bottom, 8);
            // centred on the body
            const arrowCenter = parseFloat(after.left) + parseFloat(after.borderLeftWidth);
            expect(Math.abs(arrowCenter - rect(surface()).width / 2)).toBeLessThanOrEqual(10);
        });
    });

    describe('focus', () => {
        it('moves focus into the body and traps Tab inside it', async () => {
            const { stable, el, trigger } = await setup();
            await userEvent.click(trigger());
            await stable();
            expect(document.activeElement).toBe(el('first'));
            await userEvent.tab();
            expect(document.activeElement).toBe(el('last'));
            await userEvent.tab();
            expect(document.activeElement).toBe(el('first'));
            await userEvent.tab({ shift: true });
            expect(document.activeElement).toBe(el('last'));
        });

        it('traps focus without aria-hidden focusable anchors', async () => {
            const { stable, el, trigger } = await setup();
            await userEvent.click(trigger());
            await stable();
            const pane = document.querySelector('.cdk-overlay-pane')!;
            // axe aria-hidden-focus: nothing hidden from assistive technology may take focus
            const hiddenFocusable = [
                ...pane.querySelectorAll<HTMLElement>('[aria-hidden="true"], [aria-hidden="true"] *')
            ].filter((node) => node.tabIndex >= 0);
            expect(hiddenFocusable).toEqual([]);
            // Tab from a non-tabbable element inside the body moves on to the next tabbable one
            const text = el('first').parentElement!;
            text.tabIndex = -1;
            text.focus();
            await userEvent.tab();
            expect(document.activeElement).toBe(el('first'));
            await userEvent.tab({ shift: true });
            expect(document.activeElement).toBe(el('last'));
        });

        it('focusTrapped=false lets Tab leave the body', async () => {
            const { stable, el, trigger, body } = await setup({ trapped: false });
            await userEvent.click(trigger());
            await stable();
            el('last').focus();
            await userEvent.tab();
            expect(body()!.contains(document.activeElement)).toBe(false);
        });

        it('focusAutoCapture=false leaves focus on the trigger', async () => {
            const { stable, trigger, body } = await setup({ autoCapture: false });
            await userEvent.click(trigger());
            await stable();
            expect(body()).not.toBeNull();
            expect(document.activeElement).toBe(trigger());
        });

        it('restoreFocusOnClose=false does not return focus to the trigger', async () => {
            const { stable, trigger, body } = await setup({ restore: false });
            await userEvent.click(trigger());
            await stable();
            await userEvent.keyboard('{Escape}');
            await stable();
            expect(body()).toBeNull();
            expect(document.activeElement).not.toBe(trigger());
        });
    });

    describe('fillControlMode', () => {
        it('at-least makes the body at least as wide as the trigger', async () => {
            const { stable, trigger, surface } = await setup({ fill: 'at-least', triggerWidth: 300 });
            await userEvent.click(trigger());
            await stable();
            near(rect(surface()).width, 300);
            await userEvent.keyboard('{Escape}');
            await stable();
        });

        it('at-least still grows with wider content', async () => {
            const { stable, trigger, surface } = await setup({
                fill: 'at-least',
                triggerWidth: 100,
                contentWidth: '250px'
            });
            await userEvent.click(trigger());
            await stable();
            expect(rect(surface()).width).toBeGreaterThanOrEqual(250);
        });

        it('equal makes the body exactly as wide as the trigger and follows it', async () => {
            const { host, stable, trigger, surface } = await setup({
                fill: 'equal',
                triggerWidth: 200,
                contentWidth: '400px'
            });
            await userEvent.click(trigger());
            await stable();
            near(rect(surface()).width, 200);
            host.triggerWidth.set(260);
            await stable();
            // the body animates its size
            await wait(200);
            near(rect(surface()).width, 260);
        });

        it('maxWidth caps the filled width', async () => {
            const { stable, trigger, surface } = await setup({ fill: 'equal', triggerWidth: 300, maxWidth: 180 });
            await userEvent.click(trigger());
            await stable();
            near(rect(surface()).width, 180);
        });

        it('fit-content sizes the body to its content', async () => {
            const { stable, trigger, surface } = await setup({ fill: 'fit-content', triggerWidth: 300 });
            await userEvent.click(trigger());
            await stable();
            expect(rect(surface()).width).toBeLessThan(300);
        });
    });

    describe('fdPopoverTrigger', () => {
        it('connects an external trigger with aria-haspopup, aria-controls and aria-expanded', async () => {
            const fixture = TestBed.createComponent(TriggerHost);
            document.body.appendChild(fixture.nativeElement);
            await fixture.whenStable();
            await frame();
            const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
                '[data-testid="external"]'
            )!;
            expect(trigger.getAttribute('aria-haspopup')).toBe('true');
            expect(trigger.getAttribute('aria-controls')).toBe('external-pop');
            expect(trigger.getAttribute('aria-expanded')).toBe('false');

            await userEvent.click(trigger);
            await fixture.whenStable();
            await frame();
            await fixture.whenStable();
            expect(trigger.getAttribute('aria-expanded')).toBe('true');
            const surface = document.querySelector<HTMLElement>(
                '.cdk-overlay-pane fd-popover-body > div:not(.cdk-focus-trap-anchor)'
            )!;
            expect(surface.textContent!.trim()).toBe('Plain text content');
            expect(surface.getAttribute('role')).toBe('region');
            near(rect(surface).top, rect(trigger).bottom);

            await userEvent.keyboard('{Escape}');
            await fixture.whenStable();
            expect(trigger.getAttribute('aria-expanded')).toBe('false');
            expect(document.querySelector('.cdk-overlay-pane fd-popover-body')).toBeNull();
        });
    });
});
