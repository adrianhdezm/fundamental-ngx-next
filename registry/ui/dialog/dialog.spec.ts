import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { Component, TemplateRef, inject, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { ButtonBar } from '@/ui/bar/bar';
import { Title } from '@/ui/title/title';
import {
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    DialogRef,
    DialogService,
    DialogTemplate,
    DialogTitle,
    type DialogConfig
} from './dialog';

@Component({
    imports: [Dialog, DialogHeader, DialogBody, DialogFooter, DialogTemplate, DialogTitle, Title, ButtonBar],
    template: `
        <button id="trigger">Open</button>
        <ng-template fdDialogTemplate let-dialog #tpl>
            <fd-dialog>
                <fd-dialog-header><h1 fd-title fd-dialog-title>Title</h1></fd-dialog-header>
                <fd-dialog-body>Body {{ dialog.data }}</fd-dialog-body>
                <fd-dialog-footer>
                    <fd-button-bar variant="emphasized" label="OK" (click)="dialog.close('ok')" />
                    <fd-button-bar label="Cancel" (click)="dialog.dismiss('cancel')" />
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>
    `
})
class Host {
    readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    readonly service = inject(DialogService);
}

/** A dialog component: it injects its ref and data. */
@Component({
    imports: [Dialog, DialogHeader, DialogBody, DialogTitle, Title],
    template: `
        <fd-dialog>
            <fd-dialog-header><h1 fd-title fd-dialog-title>Component dialog</h1></fd-dialog-header>
            <fd-dialog-body>{{ ref.data?.text }}</fd-dialog-body>
        </fd-dialog>
    `
})
class ComponentDialog {
    static last: ComponentDialog | null = null;
    readonly ref = inject<DialogRef<{ text: string }>>(DialogRef);
    constructor() {
        ComponentDialog.last = this;
    }
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    document.body.appendChild(fixture.nativeElement);
    const host = fixture.componentInstance;
    const open = async (config?: DialogConfig) => {
        (fixture.nativeElement.querySelector('#trigger') as HTMLElement).focus();
        const ref = host.service.open(host.tpl(), config);
        await fixture.whenStable();
        await new Promise((r) => setTimeout(r, 50));
        return ref;
    };
    return { fixture, host, open };
}

function outcome(ref: DialogRef): Promise<{ closed?: unknown; dismissed?: unknown }> {
    return new Promise((resolve) =>
        ref.afterClosed.subscribe({
            next: (closed) => resolve({ closed }),
            error: (dismissed) => resolve({ dismissed })
        })
    );
}

const windows = () => [...document.querySelectorAll<HTMLElement>('[role=dialog]')];
const settle = () => new Promise((r) => setTimeout(r, 150));

/** Drags with the real mouse from the centre of an element by an offset. */
async function drag(el: Element, dx: number, dy: number): Promise<void> {
    const rect = el.getBoundingClientRect();
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height / 2);
    const mouse = (type: 'mousePressed' | 'mouseReleased' | 'mouseMoved', px: number, py: number) =>
        cdp().send('Input.dispatchMouseEvent', { type, x: px, y: py, button: 'left', buttons: 1, clickCount: 1 });
    await cdp().send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await mouse('mousePressed', x, y);
    for (let step = 1; step <= 5; step++) await mouse('mouseMoved', x + (dx * step) / 5, y + (dy * step) / 5);
    await mouse('mouseReleased', x + dx, y + dy);
    await new Promise((r) => requestAnimationFrame(r));
}
const near = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);

describe('Dialog', () => {
    afterEach(() => TestBed.inject(DialogService).dismissAll());

    it('is a labelled modal that takes the focus and gives it back when closed', async () => {
        const { open } = await setup();
        const ref = await open({ data: 'one' });
        const win = windows()[0];
        expect(win.getAttribute('aria-modal')).toBe('true');
        expect(document.getElementById(win.getAttribute('aria-labelledby')!)!.textContent).toBe('Title');
        expect(win.contains(document.activeElement)).toBe(true);
        expect(ref.isOpen()).toBe(true);

        const result = outcome(ref);
        await userEvent.click(win.querySelector<HTMLElement>('fd-button-bar button')!);
        expect(await result).toEqual({ closed: 'ok' });
        await settle();
        expect(windows()).toHaveLength(0);
        expect(document.activeElement!.id).toBe('trigger');
    });

    it('dismisses on Escape unless escKeyCloseable is false', async () => {
        const { open } = await setup();
        const kept = await open({ escKeyCloseable: false });
        await userEvent.keyboard('{Escape}');
        expect(kept.isOpen()).toBe(true);
        kept.close();
        await settle();

        const ref = await open();
        const result = outcome(ref);
        await userEvent.keyboard('{Escape}');
        expect(await result).toEqual({ dismissed: 'escape' });
        expect(ref.status()).toBe('dismissed');
    });

    it('keeps the focus inside the dialog', async () => {
        const { open } = await setup();
        await open();
        const win = windows()[0];
        for (let i = 0; i < 5; i++) {
            await userEvent.keyboard('{Tab}');
            expect(win.contains(document.activeElement)).toBe(true);
        }
    });

    it('dismisses on a backdrop click only when backdropClickCloseable', async () => {
        const { open } = await setup();
        const ref = await open();
        const backdrop = document.querySelector<HTMLElement>('fd-dialog')!;
        backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(ref.isOpen()).toBe(true);
        ref.close();
        await settle();

        const closable = await open({ backdropClickCloseable: true });
        const result = outcome(closable);
        document.querySelector<HTMLElement>('fd-dialog')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(await result).toEqual({ dismissed: 'backdrop' });
    });

    it('dims the page once for stacked dialogs', async () => {
        const { open, host } = await setup();
        await open();
        await open();
        expect(host.service.openDialogCount()).toBe(2);
        const layers = [...document.querySelectorAll('fd-dialog')].map((d) => getComputedStyle(d, '::before').content);
        expect(layers).toEqual(['""', 'none']);
    });

    it('hides, shows a loader and toggles full screen through its ref', async () => {
        const { open, fixture } = await setup();
        const ref = await open();
        ref.hide(true);
        await fixture.whenStable();
        expect(getComputedStyle(document.querySelector('fd-dialog')!).display).toBe('none');
        ref.hide(false);
        ref.loading({ isLoading: true, loadingLabel: 'Fetching' });
        ref.toggleFullScreen();
        await fixture.whenStable();
        expect(document.querySelector('fd-dialog-body [role=progressbar]')).not.toBeNull();
        expect(windows()[0].getBoundingClientRect().width).toBe(window.innerWidth);
    });

    it('builds a dialog from an object with its footer buttons', async () => {
        const service = TestBed.inject(DialogService);
        let approved = false;
        const ref = service.open({
            title: 'Object title',
            approveButton: 'Approve',
            approveButtonCallback: () => (approved = true),
            cancelButton: 'Cancel',
            closeButtonCallback: () => ref.dismiss('x')
        });
        await settle();
        const win = windows()[0];
        expect(document.getElementById(win.getAttribute('aria-labelledby')!)!.textContent!.trim()).toBe('Object title');
        expect(document.activeElement!.textContent).toContain('Approve');
        await userEvent.click(document.activeElement as HTMLElement);
        expect(approved).toBe(true);
        const result = outcome(ref);
        await userEvent.click(win.querySelector<HTMLElement>('button[fd-dialog-close-button]')!);
        expect(await result).toEqual({ dismissed: 'x' });
    });

    it('opens a component and injects its DialogRef and data', async () => {
        const service = TestBed.inject(DialogService);
        const ref = service.open(ComponentDialog, { data: { text: 'From a component' } });
        await settle();
        const win = windows()[0];
        expect(win.querySelector('fd-dialog-body')!.textContent!.trim()).toBe('From a component');
        expect(document.getElementById(win.getAttribute('aria-labelledby')!)!.textContent).toBe('Component dialog');
        expect(ComponentDialog.last!.ref).toBe(ref);
        expect(ref.data).toEqual({ text: 'From a component' });
        const result = outcome(ref);
        ComponentDialog.last!.ref.close('done');
        expect(await result).toEqual({ closed: 'done' });
    });

    it('builds an object dialog without buttons with no footer', async () => {
        TestBed.inject(DialogService).open({ title: 'No buttons' });
        await settle();
        const win = windows()[0];
        expect(document.getElementById(win.getAttribute('aria-labelledby')!)!.textContent!.trim()).toBe('No buttons');
        expect(win.querySelector('fd-dialog-footer')).toBeNull();
        expect(win.querySelector('button')).toBeNull();
    });

    it('dismissAll closes every open dialog and removes the overlays', async () => {
        const { open, host } = await setup();
        const first = outcome(await open());
        const second = outcome(await open());
        expect(host.service.openDialogCount()).toBe(2);
        expect(document.documentElement.style.overflow).toBe('hidden');
        host.service.dismissAll('all');
        expect(await first).toEqual({ dismissed: 'all' });
        expect(await second).toEqual({ dismissed: 'all' });
        expect(host.service.hasOpenDialogs()).toBe(false);
        await settle();
        expect(windows()).toHaveLength(0);
        expect(document.querySelectorAll('.fd-dialog-pane')).toHaveLength(0);
        expect(document.documentElement.style.overflow).toBe('');
    });

    it('close() sets the status closed and exposes the result; dismiss() the reason', async () => {
        const { open } = await setup();
        const ref = await open();
        expect(ref.status()).toBe('loaded');
        expect(ref.closeResult()).toBeNull();
        ref.close('saved');
        expect(ref.status()).toBe('closed');
        expect(ref.isClosed()).toBe(true);
        expect(ref.isOpen()).toBe(false);
        expect(ref.closeResult()).toEqual({ status: 'closed', value: 'saved' });
        // a closed dialog stays closed
        ref.dismiss('late');
        expect(ref.status()).toBe('closed');
        await settle();

        const dismissed = await open();
        dismissed.afterClosed.subscribe({ error: () => undefined });
        dismissed.dismiss('cancel');
        expect(dismissed.status()).toBe('dismissed');
        expect(dismissed.closeResult()).toEqual({ status: 'dismissed', reason: 'cancel' });
    });

    it('places the dialog at the configured position', async () => {
        const { open } = await setup();
        await open({ position: { top: '40px', left: 60 } });
        const backdrop = document.querySelector('fd-dialog')!.getBoundingClientRect();
        let rect = windows()[0].getBoundingClientRect();
        near(rect.top - backdrop.top, 40);
        near(rect.left - backdrop.left, 60);
        TestBed.inject(DialogService).dismissAll();
        await settle();

        await open({ position: { bottom: 30, right: '20px' } });
        rect = windows()[0].getBoundingClientRect();
        near(backdrop.bottom - rect.bottom, 30);
        near(backdrop.right - rect.right, 20);
    });

    it('applies width, height and min/max sizes', async () => {
        const { open } = await setup();
        await open({ width: 500, maxWidth: '400px', height: 100, minHeight: '300px' });
        let rect = windows()[0].getBoundingClientRect();
        near(rect.width, 400);
        near(rect.height, 300);
        TestBed.inject(DialogService).dismissAll();
        await settle();

        await open({ width: '100px', minWidth: '200px', height: '400px', maxHeight: '300px' });
        rect = windows()[0].getBoundingClientRect();
        near(rect.width, 200);
        near(rect.height, 300);
    });

    it('applies dialogPanelClass to the window and backdropClass to the backdrop', async () => {
        const { open } = await setup();
        await open({ dialogPanelClass: 'custom-panel', backdropClass: 'custom-backdrop' });
        expect(windows()[0].classList).toContain('custom-panel');
        expect(document.querySelector('fd-dialog')!.classList).toContain('custom-backdrop');
    });

    it('mobile mode fills the viewport, mobileOuterSpacing keeps a margin', async () => {
        const { open } = await setup();
        await open({ mobile: true, width: '300px' });
        const viewport = document.querySelector('fd-dialog')!.getBoundingClientRect();
        let rect = windows()[0].getBoundingClientRect();
        expect(rect.width).toBe(viewport.width);
        expect(rect.height).toBe(viewport.height);
        TestBed.inject(DialogService).dismissAll();
        await settle();

        // 5% of the width and 3% of the height on each side, with rounded corners
        await open({ mobile: true, mobileOuterSpacing: true });
        rect = windows()[0].getBoundingClientRect();
        near(rect.width, viewport.width * 0.9);
        near(rect.height, viewport.height * 0.94);
        near(rect.left, viewport.width * 0.05);
        near(rect.top, viewport.height * 0.03);
        expect(getComputedStyle(windows()[0]).borderTopLeftRadius).not.toBe('0px');
    });

    it('drags by the header only when draggable', async () => {
        const { open } = await setup();
        await open({ width: '20rem' });
        let win = windows()[0];
        let before = win.getBoundingClientRect();
        await drag(win.querySelector('[data-dialog-header]')!, 40, 30);
        expect(win.getBoundingClientRect().left).toBe(before.left);
        TestBed.inject(DialogService).dismissAll();
        await settle();

        await open({ width: '20rem', draggable: true });
        win = windows()[0];
        before = win.getBoundingClientRect();
        // the body is no drag handle
        await drag(win.querySelector('fd-dialog-body')!, 40, 30);
        expect(win.getBoundingClientRect().left).toBe(before.left);
        await drag(win.querySelector('[data-dialog-header]')!, 40, 30);
        const after = win.getBoundingClientRect();
        near(after.left - before.left, 40);
        near(after.top - before.top, 30);
    });

    it('resizes with the handle when resizable and announces it', async () => {
        const { open } = await setup();
        await open({ width: '20rem' });
        expect(windows()[0].hasAttribute('aria-description')).toBe(false);
        expect(windows()[0].querySelector(':scope > span[aria-hidden=true]')).toBeNull();
        TestBed.inject(DialogService).dismissAll();
        await settle();

        await open({ width: '20rem', height: '12rem', resizable: true });
        const win = windows()[0];
        expect(win.getAttribute('aria-description')).toBe('Resizable');
        const before = win.getBoundingClientRect();
        const handle = win.querySelector(':scope > span[aria-hidden=true]')!;
        const grip = handle.getBoundingClientRect();
        await drag(handle, 50, 40);
        // the bottom end corner follows the pointer
        const after = win.getBoundingClientRect();
        near(after.right, Math.round(grip.left + grip.width / 2) + 50);
        near(after.bottom, Math.round(grip.top + grip.height / 2) + 40);
        expect(after.width).toBeGreaterThan(before.width + 40);
        expect(after.height).toBeGreaterThan(before.height + 30);
        // the window stays where it was
        near(after.left, before.left);
        near(after.top, before.top);
    });

    it('applies ariaLabel and ariaDescribedBy from the config', async () => {
        const { open } = await setup();
        await open({ ariaLabel: 'Custom label', ariaDescribedBy: 'external-description' });
        const win = windows()[0];
        expect(win.getAttribute('aria-label')).toBe('Custom label');
        expect(win.getAttribute('aria-describedby')).toBe('external-description');
        expect(win.getAttribute('role')).toBe('dialog');
    });

    it('dismisses on navigation unless closeOnNavigation is false', async () => {
        TestBed.configureTestingModule({ providers: [provideLocationMocks()] });
        const { open } = await setup();
        const location = TestBed.inject(Location);
        const kept = await open({ closeOnNavigation: false });
        location.go('/elsewhere');
        expect(kept.isOpen()).toBe(true);
        kept.close();
        await settle();

        const ref = await open();
        const result = outcome(ref);
        location.go('/next');
        expect(await result).toEqual({ dismissed: 'navigation change' });
    });
});
