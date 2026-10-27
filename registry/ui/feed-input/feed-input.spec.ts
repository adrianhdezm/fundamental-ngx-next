import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { FeedInput, FeedInputButton, FeedInputTextarea } from './feed-input';

@Component({
    imports: [FeedInput, FeedInputTextarea, FeedInputButton],
    template: `
        <fd-feed-input ariaLabel="Post a comment" [disabled]="disabled()">
            <textarea #text fdFeedInputTextarea aria-label="Comment" [fdFeedInputTextareaMaxRows]="3"></textarea>
            <button fdFeedInputButton (click)="posted.set(text.value)"></button>
        </fd-feed-input>
    `
})
class Host {
    readonly disabled = signal(false);
    readonly posted = signal('');
}

async function setup(disabled = false) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.disabled.set(disabled);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        fixture,
        host: fixture.componentInstance,
        textarea: root.querySelector('textarea')!,
        button: root.querySelector<HTMLButtonElement>('button')!,
        group: root.querySelector('[role=group]')!
    };
}

describe('FeedInput', () => {
    it('enables the send button once there is text', async () => {
        const { host, textarea, button, group, fixture } = await setup();
        expect(group.getAttribute('aria-label')).toBe('Post a comment');
        expect(button.disabled).toBe(true);
        expect(button.getAttribute('aria-label')).toBe('Send');
        await userEvent.type(textarea, 'Hello');
        await fixture.whenStable();
        expect(button.disabled).toBe(false);
        await userEvent.click(button);
        expect(host.posted()).toBe('Hello');
        await userEvent.clear(textarea);
        await fixture.whenStable();
        expect(button.disabled).toBe(true);
    });

    it('grows with its text up to the maximum rows', async () => {
        const { textarea, fixture } = await setup();
        const start = textarea.offsetHeight;
        await userEvent.type(
            textarea,
            'one{Shift>}{Enter}{/Shift}two{Shift>}{Enter}{/Shift}three{Shift>}{Enter}{/Shift}four{Shift>}{Enter}{/Shift}five'
        );
        await fixture.whenStable();
        expect(textarea.offsetHeight).toBeGreaterThan(start);
        const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
        expect(parseFloat(textarea.style.maxHeight)).toBeCloseTo(lineHeight * 3, 0);
        expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight);
    });

    it('disables the text area and the button', async () => {
        const { textarea, button } = await setup(true);
        expect(textarea.disabled).toBe(true);
        expect(button.disabled).toBe(true);
    });
});
