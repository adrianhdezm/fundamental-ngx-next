import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ActionSheet, ActionSheetBody, ActionSheetControl, ActionSheetItem } from './action-sheet';

@Component({
    imports: [ActionSheet, ActionSheetBody, ActionSheetControl, ActionSheetItem],
    template: `
        <fd-action-sheet [mobile]="mobile()" [(isOpen)]="open">
            <fd-action-sheet-control><button id="control">Actions</button></fd-action-sheet-control>
            <fd-action-sheet-body ariaLabel="Actions">
                <li fd-action-sheet-item label="One" (click)="picked.set('one')"></li>
                <li fd-action-sheet-item label="Two" disabled></li>
                <li fd-action-sheet-item label="Three"></li>
                <li fd-action-sheet-item label="Close" isCloseButton></li>
            </fd-action-sheet-body>
        </fd-action-sheet>
    `
})
class Host {
    readonly mobile = signal(false);
    readonly open = signal(false);
    readonly picked = signal('');
}

const wait = (ms = 100) => new Promise((r) => setTimeout(r, ms));
const focused = () => document.activeElement!.textContent!.trim();

async function setup(mobile = false) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mobile.set(mobile);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const control = fixture.nativeElement.querySelector('#control') as HTMLElement;
    await userEvent.click(control);
    await wait();
    return { fixture, host: fixture.componentInstance, control };
}

describe('ActionSheet', () => {
    for (const mobile of [false, true]) {
        describe(mobile ? 'mobile' : 'popover', () => {
            it('opens a menu of actions and focuses the first one', async () => {
                const { host } = await setup(mobile);
                expect(host.open()).toBe(true);
                expect(document.querySelector('[role=menu]')!.getAttribute('aria-label')).toBe('Actions');
                expect(document.activeElement!.getAttribute('role')).toBe('menuitem');
                expect(focused()).toBe('One');
            });

            it('moves with the arrow keys over disabled actions and wraps', async () => {
                await setup(mobile);
                await userEvent.keyboard('{ArrowDown}');
                expect(focused()).toBe('Three');
                await userEvent.keyboard('{ArrowDown}{ArrowDown}');
                expect(focused()).toBe('One');
                await userEvent.keyboard('{End}');
                expect(focused()).toBe('Close');
            });

            it('closes on Escape and returns the focus to the control', async () => {
                const { host, control } = await setup(mobile);
                await userEvent.keyboard('{Escape}');
                await wait();
                expect(host.open()).toBe(false);
                expect(document.activeElement).toBe(control);
            });

            it('closes with a close button', async () => {
                const { host } = await setup(mobile);
                await userEvent.keyboard('{End}{Enter}');
                await wait();
                expect(host.open()).toBe(false);
            });
        });
    }
});
