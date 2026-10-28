import { Component, TemplateRef, inject, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { MessageToastRef, MessageToastService, MessageToastTemplate } from './message-toast';

@Component({ template: `<span class="content">{{ ref.data.text }}</span>` })
class ToastContent {
    readonly ref = inject<MessageToastRef<{ text: string }>>(MessageToastRef);
}

@Component({
    imports: [MessageToastTemplate],
    template: `<ng-template fdMessageToastTemplate let-toast #tpl
        ><span class="tpl">{{ toast.data.text }}</span></ng-template
    >`
})
class TemplateHost {
    readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const toasts = () => [...document.querySelectorAll<HTMLElement>('fd-message-toast')];

describe('MessageToast', () => {
    afterEach(async () => {
        TestBed.inject(MessageToastService).hideAll();
        await wait();
    });

    it('announces a string message and disappears after its duration', async () => {
        const service = TestBed.inject(MessageToastService);
        let dismissed = false;
        service
            .open('Saved', { duration: 200 })
            .afterDismissed()
            .subscribe(() => (dismissed = true));
        await wait();
        expect(toasts()).toHaveLength(1);
        expect(toasts()[0].getAttribute('role')).toBe('alert');
        expect(toasts()[0].textContent!.trim()).toBe('Saved');
        await wait(300);
        expect(dismissed).toBe(true);
        expect(toasts()).toHaveLength(0);
    });

    it('renders components with their data and stays open while hovered', async () => {
        // park the real pointer away from the toasts, so only the events below reach them
        const corner = document.createElement('div');
        corner.style.cssText = 'position:fixed;top:0;left:0;width:10px;height:10px';
        document.body.appendChild(corner);
        await userEvent.hover(corner);
        const service = TestBed.inject(MessageToastService);
        service.open(ToastContent, { data: { text: 'From a component' }, duration: 400 });
        await wait(50);
        expect(toasts()[0].querySelector('.content')!.textContent).toBe('From a component');
        toasts()[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        await wait(600);
        expect(toasts()).toHaveLength(1);
        toasts()[0].dispatchEvent(new MouseEvent('mouseleave'));
        await wait(700);
        expect(toasts()).toHaveLength(0);
        corner.remove();
    });

    it('stacks toasts at a position and closes them all', async () => {
        const service = TestBed.inject(MessageToastService);
        service.open('One', { position: 'top-right', duration: 0 });
        service.open('Two', { position: 'top-right', duration: 0 });
        service.open('Three', { position: 'bottom-left', duration: 0 });
        await wait();
        const [one, two] = toasts();
        expect(one.parentElement).toBe(two.parentElement);
        expect(two.getBoundingClientRect().top).toBeGreaterThan(one.getBoundingClientRect().top);
        expect(service.openCount()).toBe(3);
        service.hideAll();
        await wait();
        expect(toasts()).toHaveLength(0);
        expect(service.hasOpenMessageToasts()).toBe(false);
    });

    it('opens a toast from a template with its data', async () => {
        const fixture = TestBed.createComponent(TemplateHost);
        await fixture.whenStable();
        const ref = TestBed.inject(MessageToastService).open(fixture.componentInstance.tpl(), {
            data: { text: 'From a template' },
            duration: 0
        });
        await wait();
        expect(toasts()).toHaveLength(1);
        expect(toasts()[0].querySelector('.tpl')!.textContent).toBe('From a template');
        expect(ref.data).toEqual({ text: 'From a template' });
    });

    it('afterOpened emits once the toast is shown; ref.dismiss() closes it and emits afterDismissed', async () => {
        const service = TestBed.inject(MessageToastService);
        const ref = service.open('Opened', { duration: 0, animated: true });
        let opened = 0;
        let dismissed = 0;
        ref.afterOpened().subscribe(() => opened++);
        ref.afterDismissed().subscribe(() => dismissed++);
        expect(opened).toBe(0);
        await expect.poll(() => opened).toBe(1);
        expect(toasts()).toHaveLength(1);
        // a toast with duration 0 stays until dismissed
        await wait(200);
        expect(toasts()).toHaveLength(1);
        ref.dismiss();
        await expect.poll(() => dismissed).toBe(1);
        expect(toasts()).toHaveLength(0);
        expect(service.openCount()).toBe(0);
        ref.dismiss();
        expect(dismissed).toBe(1);
    });

    it('a custom top/left position places the toast there', async () => {
        TestBed.inject(MessageToastService).open('Placed', { position: { top: '100px', left: '50px' }, duration: 0 });
        await wait();
        const rect = toasts()[0].getBoundingClientRect();
        expect(Math.round(rect.top)).toBe(100);
        expect(Math.round(rect.left)).toBe(50);
    });

    it('boundTo places the toast next to the element', async () => {
        const anchor = document.createElement('button');
        anchor.textContent = 'Anchor';
        anchor.style.cssText = 'position:fixed;top:200px;left:300px;width:120px;height:30px';
        document.body.appendChild(anchor);
        TestBed.inject(MessageToastService).open('Bound', {
            position: { boundTo: anchor, originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' },
            duration: 0
        });
        await wait();
        const toast = toasts()[0].getBoundingClientRect();
        const box = anchor.getBoundingClientRect();
        expect(Math.abs(toast.top - box.bottom)).toBeLessThanOrEqual(1);
        expect(Math.abs(toast.left + toast.width / 2 - (box.left + box.width / 2))).toBeLessThanOrEqual(1);
        anchor.remove();
    });

    it('maxWidth limits the toast width', async () => {
        const service = TestBed.inject(MessageToastService);
        const text = 'A long message toast that would be wider than one hundred pixels on a single line.';
        service.open(text, { maxWidth: '100px', duration: 0, position: 'top-left' });
        service.open(text, { duration: 0, position: 'bottom-left' });
        await wait();
        const [limited, wide] = toasts();
        expect(limited.getBoundingClientRect().width).toBeLessThanOrEqual(100);
        expect(wide.getBoundingClientRect().width).toBeGreaterThan(100);
    });
});
