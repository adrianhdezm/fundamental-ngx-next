import { Component, TemplateRef, inject, signal, viewChild, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Icon } from '@/ui/icon/icon';
import {
    AutoDismissMessageStrip,
    MessageStrip,
    MessageStripIcon,
    type MessageStripIndicationColor,
    type MessageStripType
} from './message-strip';
import { MessageStripAlertRef, MessageStripAlertService, type MessageStripAlertPosition } from './message-strip-alert';

@Component({
    imports: [MessageStrip, MessageStripIcon, Icon],
    template: `
        <fd-message-strip
            id="strip"
            [type]="type()"
            [indicationColor]="indicationColor()"
            [dismissible]="dismissible()"
            [noIcon]="noIcon()"
            [dismissBtnTitle]="dismissTitle()"
            (onDismiss)="dismissed.set(dismissed() + 1)"
            >Session expires soon.</fd-message-strip
        >
        <fd-message-strip id="custom" [dismissible]="false"
            ><fd-icon *fdMessageStripIcon glyph="survey" />Survey open</fd-message-strip
        >
        <fd-message-strip id="labelled" ariaLabelledBy="ext" width="300px" minWidth="200px">Labelled</fd-message-strip>
        <span id="ext">External</span>
    `
})
class Host {
    readonly type = signal<MessageStripType | null>('warning');
    readonly indicationColor = signal<MessageStripIndicationColor | null>(null);
    readonly dismissible = signal(true);
    readonly noIcon = signal(false);
    readonly dismissTitle = signal<string | null>(null);
    readonly dismissed = signal(0);
}

@Component({
    imports: [MessageStrip, AutoDismissMessageStrip],
    template: `
        <fd-message-strip
            #auto="fdAutoDismissMessageStrip"
            id="auto"
            type="information"
            [duration]="duration()"
            [mousePersist]="mousePersist()"
            (onDismiss)="dismissed.set(dismissed() + 1)"
            >Auto dismissed</fd-message-strip
        >
        <button id="outside">Outside</button>
    `
})
class AutoHost {
    readonly auto = viewChild.required<AutoDismissMessageStrip>('auto');
    readonly mousePersist = signal(false);
    readonly duration = signal(200);
    readonly dismissed = signal(0);
}

@Component({ template: `<button id="in-alert" (click)="ref.dismiss()">Close me</button>` })
class AlertContent {
    protected readonly ref = inject(MessageStripAlertRef);
}

@Component({
    template: `<ng-template #tpl let-ref><span class="tpl">Template alert</span></ng-template>`
})
class AlertHost {
    readonly service = inject(MessageStripAlertService);
    readonly tpl = viewChild.required<TemplateRef<{ $implicit: MessageStripAlertRef }>>('tpl');
}

const frame = () => new Promise((r) => requestAnimationFrame(r));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function render<T>(type: Type<T>, configure?: (host: T) => void) {
    const fixture = TestBed.createComponent(type);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await fixture.whenStable();
    };
    await stable();
    return { fixture, host: fixture.componentInstance, root, stable };
}

const visible = (el: Element | null) => !!el && (el as HTMLElement).checkVisibility();
const alerts = () => [...document.querySelectorAll<HTMLElement>('fd-message-strip-alert')];

describe('MessageStrip', () => {
    it('is a note labelled by its hidden type description and its text', async () => {
        const { root } = await render(Host);
        const strip = root.querySelector<HTMLElement>('#strip')!;
        expect(strip.getAttribute('role')).toBe('note');
        expect(strip.getAttribute('aria-labelledby')).toBe('strip-hidden-text strip-content-text');
        const hidden = document.getElementById('strip-hidden-text')!;
        expect(hidden.textContent).toBe('Warning Message Strip Closable');
        expect(hidden.getBoundingClientRect().width).toBeLessThanOrEqual(1);
        expect(document.getElementById('strip-content-text')!.textContent!.trim()).toBe('Session expires soon.');
        await expect
            .element(page.getByRole('note', { name: 'Warning Message Strip Closable Session expires soon.' }))
            .toBeInTheDocument();
        const labelled = root.querySelector<HTMLElement>('#labelled')!;
        expect(labelled.getAttribute('aria-labelledby')).toBe('ext');
        expect(labelled.style.width).toBe('300px');
        expect(labelled.style.minWidth).toBe('200px');
    });

    it('types use the semantic colours, their icon and type description', async () => {
        const { host, root, stable } = await render(Host);
        const strip = root.querySelector<HTMLElement>('#strip')!;
        const hidden = document.getElementById('strip-hidden-text')!;
        const backgrounds = new Set<string>();
        const glyphs = new Set<string>();
        for (const [type, text] of [
            ['warning', 'Warning Message Strip'],
            ['error', 'Error Message Strip'],
            ['success', 'Success Message Strip'],
            ['information', 'Information Message Strip']
        ] as const) {
            host.type.set(type);
            await stable();
            expect(hidden.textContent).toBe(`${text} Closable`);
            backgrounds.add(getComputedStyle(strip).backgroundColor);
            const iconBox = strip.querySelector('div[aria-hidden=true]')!;
            expect(iconBox).not.toBeNull();
            glyphs.add(iconBox.querySelector('fd-icon')!.outerHTML);
        }
        expect(backgrounds.size).toBe(4);
        expect(glyphs.size).toBe(4);
        host.type.set(null);
        await stable();
        expect(hidden.textContent).toBe('Message strip');
        expect(strip.querySelector('div[aria-hidden=true]')).toBeNull();
    });

    it('noIcon hides the icon; a custom icon template replaces it', async () => {
        const { host, root, stable } = await render(Host);
        const strip = root.querySelector<HTMLElement>('#strip')!;
        const withIcon = parseFloat(getComputedStyle(strip).paddingInlineStart);
        host.noIcon.set(true);
        await stable();
        expect(strip.querySelector('div[aria-hidden=true]')).toBeNull();
        expect(parseFloat(getComputedStyle(strip).paddingInlineStart)).toBeLessThan(withIcon);
        const custom = root.querySelector('#custom div[aria-hidden=true] fd-icon')!;
        expect(custom).not.toBeNull();
        expect(root.querySelectorAll('#custom fd-icon')).toHaveLength(1);
    });

    it('indication colours change the background and text colour', async () => {
        const { host, root, stable } = await render(Host);
        const strip = root.querySelector<HTMLElement>('#strip')!;
        const text = document.getElementById('strip-content-text')!;
        const base = getComputedStyle(strip).backgroundColor;
        host.indicationColor.set('6');
        await stable();
        const strong = getComputedStyle(strip).backgroundColor;
        const strongText = getComputedStyle(text).color;
        expect(strong).not.toBe(base);
        host.indicationColor.set('6b');
        await stable();
        expect(getComputedStyle(strip).backgroundColor).not.toBe(strong);
        expect(getComputedStyle(text).color).not.toBe(strongText);
    });

    it('the dismiss button closes the strip and emits onDismiss', async () => {
        const { host, root, stable } = await render(Host);
        const strip = root.querySelector<HTMLElement>('#strip')!;
        const close = strip.querySelector<HTMLButtonElement>('button')!;
        expect(close.getAttribute('aria-label')).toBe('Warning Message Strip Close');
        expect(close.title).toBe('Warning Message Strip Close');
        expect(close.getAttribute('aria-controls')).toBe('strip');
        await userEvent.click(close);
        await stable();
        expect(host.dismissed()).toBe(1);
        expect(visible(strip)).toBe(false);
    });

    it('the dismiss button works from the keyboard and takes a custom title', async () => {
        const { host, root, stable } = await render(Host, (h) => h.dismissTitle.set('Hide message'));
        const close = root.querySelector<HTMLButtonElement>('#strip button')!;
        expect(close.getAttribute('aria-label')).toBe('Hide message');
        close.focus();
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(host.dismissed()).toBe(1);
    });

    it('dismissible=false hides the dismiss button', async () => {
        const { host, root, stable } = await render(Host, (h) => h.dismissible.set(false));
        const strip = root.querySelector<HTMLElement>('#strip')!;
        expect(strip.querySelector('button')).toBeNull();
        expect(document.getElementById('strip-hidden-text')!.textContent).toBe('Warning Message Strip');
        host.dismissible.set(true);
        await stable();
        expect(strip.querySelector('button')).not.toBeNull();
    });

    it('open() shows a dismissed strip again', async () => {
        const { fixture, root, stable } = await render(Host);
        const strip = root.querySelector<HTMLElement>('#strip')!;
        await userEvent.click(strip.querySelector('button')!);
        await stable();
        expect(visible(strip)).toBe(false);
        (fixture.debugElement.children[0].componentInstance as MessageStrip).open();
        await stable();
        expect(visible(strip)).toBe(true);
    });

    describe('auto dismiss', () => {
        it('starts hidden, open() shows it and it dismisses itself after the duration', async () => {
            const { host, root, stable } = await render(AutoHost, (h) => h.duration.set(600));
            const strip = root.querySelector<HTMLElement>('#auto')!;
            expect(visible(strip)).toBe(false);
            host.auto().open();
            await stable();
            expect(visible(strip)).toBe(true);
            await wait(200);
            await stable();
            expect(visible(strip)).toBe(true);
            await wait(600);
            await stable();
            expect(visible(strip)).toBe(false);
            expect(host.dismissed()).toBe(1);
        });

        it('mousePersist pauses the timer while hovered and restarts it on leave', async () => {
            const { host, root, stable } = await render(AutoHost, (h) => {
                h.mousePersist.set(true);
                h.duration.set(1000);
            });
            const strip = root.querySelector<HTMLElement>('#auto')!;
            host.auto().open();
            await stable();
            await userEvent.hover(strip);
            await wait(1300);
            await stable();
            expect(visible(strip)).toBe(true);
            await userEvent.hover(root.querySelector('#outside')!);
            await wait(400);
            await stable();
            expect(visible(strip)).toBe(true);
            await wait(900);
            await stable();
            expect(visible(strip)).toBe(false);
        });

        it('without mousePersist hovering does not keep it open', async () => {
            const { host, root, stable } = await render(AutoHost, (h) => h.duration.set(1000));
            const strip = root.querySelector<HTMLElement>('#auto')!;
            host.auto().open();
            await stable();
            await userEvent.hover(strip);
            await wait(1300);
            await stable();
            expect(visible(strip)).toBe(false);
            expect(host.dismissed()).toBe(1);
        });
    });

    describe('MessageStripAlertService', () => {
        afterEach(() => page.viewport(1280, 800));

        const positions: MessageStripAlertPosition[] = [
            'top-start',
            'top-middle',
            'top-end',
            'bottom-start',
            'bottom-middle',
            'bottom-end'
        ];

        it('opens alerts in the six positions', async () => {
            const { host, stable } = await render(AlertHost);
            for (const position of positions) {
                host.service.open({ content: position, position, messageStrip: { type: 'information', duration: 0 } });
            }
            await stable();
            await stable();
            expect(alerts()).toHaveLength(6);
            expect(host.service.openAlerts()).toHaveLength(6);
            const rectOf = (text: string) =>
                alerts()
                    .find((a) => a.textContent!.includes(text))!
                    .querySelector('fd-message-strip')!
                    .getBoundingClientRect();
            const width = window.innerWidth;
            const height = window.innerHeight;
            for (const position of positions) {
                const rect = rectOf(position);
                const [vertical, horizontal] = position.split('-');
                if (vertical === 'top') expect(rect.top).toBeLessThan(height / 4);
                else expect(rect.bottom).toBeGreaterThan((height * 3) / 4);
                const centre = rect.left + rect.width / 2;
                if (horizontal === 'start') expect(rect.left).toBeLessThan(width / 4);
                else if (horizontal === 'end') expect(rect.right).toBeGreaterThan((width * 3) / 4);
                else expect(Math.abs(centre - width / 2)).toBeLessThan(2);
            }
            host.service.dismissAll();
            await stable();
            expect(alerts()).toHaveLength(0);
            expect(host.service.openAlerts()).toHaveLength(0);
        });

        it('newest alerts come first, and alerts are announced with role alert', async () => {
            const { host, stable } = await render(AlertHost);
            host.service.open({ content: 'First', messageStrip: { duration: 0 } });
            host.service.open({ content: 'Second', messageStrip: { duration: 0, type: 'success' } });
            await stable();
            await stable();
            const list = alerts();
            expect(list.map((a) => a.textContent!.includes('Second'))).toEqual([true, false]);
            expect(list.every((a) => a.getAttribute('role') === 'alert')).toBe(true);
            expect(list[0].querySelector('[role=note]')!.getAttribute('aria-labelledby')).toBeTruthy();
            await expect.element(page.getByRole('alert').first()).toBeInTheDocument();
        });

        it('the dismiss button and the ref close an alert; afterDismissed and onDismiss fire', async () => {
            const { host, stable } = await render(AlertHost);
            let onDismiss = 0;
            let afterDismissed = 0;
            const ref = host.service.open({
                content: 'Closable',
                messageStrip: { duration: 0, onDismiss: () => onDismiss++ }
            });
            ref.afterDismissed.subscribe(() => afterDismissed++);
            const other = host.service.open({ content: 'Other', messageStrip: { duration: 0 } });
            await stable();
            await stable();
            const closable = alerts().find((a) => a.textContent!.includes('Closable'))!;
            await userEvent.click(closable.querySelector('button')!);
            await stable();
            expect(onDismiss).toBe(1);
            expect(afterDismissed).toBe(1);
            expect(alerts()).toHaveLength(1);
            other.dismiss();
            await stable();
            expect(alerts()).toHaveLength(0);
        });

        it('alerts dismiss themselves after the duration', async () => {
            const { host, stable } = await render(AlertHost);
            host.service.open({ content: 'Short', messageStrip: { duration: 500 } });
            await stable();
            await stable();
            expect(alerts()).toHaveLength(1);
            expect(visible(alerts()[0].querySelector('fd-message-strip'))).toBe(true);
            await wait(700);
            await stable();
            expect(alerts()).toHaveLength(0);
        });

        it('renders template and component content; components can inject the ref', async () => {
            const { host, stable } = await render(AlertHost);
            host.service.open({ content: host.tpl(), messageStrip: { duration: 0 } });
            host.service.open({ content: AlertContent, messageStrip: { duration: 0 } });
            await stable();
            await stable();
            expect(document.querySelector('fd-message-strip-alert .tpl')!.textContent).toBe('Template alert');
            await userEvent.click(document.querySelector<HTMLElement>('#in-alert')!);
            await stable();
            expect(alerts()).toHaveLength(1);
            expect(document.querySelector('#in-alert')).toBeNull();
        });

        it('collapses all positions to the middle on narrow screens', async () => {
            await page.viewport(500, 800);
            await frame();
            const { host, stable } = await render(AlertHost);
            host.service.open({ content: 'Start', position: 'top-start', messageStrip: { duration: 0 } });
            host.service.open({ content: 'End', position: 'bottom-end', messageStrip: { duration: 0 } });
            await stable();
            await stable();
            for (const alert of alerts()) {
                const rect = alert.querySelector('fd-message-strip')!.getBoundingClientRect();
                const centre = rect.left + rect.width / 2;
                expect(Math.abs(centre - window.innerWidth / 2)).toBeLessThan(2);
            }
            host.service.dismissAll();
            await stable();
        });
    });
});
