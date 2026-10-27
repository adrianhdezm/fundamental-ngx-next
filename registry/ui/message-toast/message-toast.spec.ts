import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { MessageToastRef, MessageToastService } from './message-toast';

@Component({ template: `<span class="content">{{ ref.data.text }}</span>` })
class ToastContent {
    readonly ref = inject<MessageToastRef<{ text: string }>>(MessageToastRef);
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
});
