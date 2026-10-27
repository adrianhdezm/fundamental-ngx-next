import { Component, TemplateRef, inject, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
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
});
