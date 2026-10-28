import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Avatar } from '@/ui/avatar/avatar';
import { FeedInput, FeedInputAvatar, FeedInputButton, FeedInputTextarea } from './feed-input';

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

@Component({
    imports: [FeedInput, FeedInputTextarea, FeedInputButton, FeedInputAvatar, Avatar],
    template: `
        <div [style.width]="width()">
            <fd-feed-input ariaLabel="Post a comment">
                <fd-avatar fdFeedInputAvatar size="s" label="John Doe" />
                <textarea
                    fdFeedInputTextarea
                    aria-label="Comment"
                    [style.line-height]="lineHeight()"
                    [style.font-size]="fontSize()"
                    [fdFeedInputTextareaMaxRows]="maxRows()"
                    (valueChange)="values.push($event)"
                ></textarea>
                <button fdFeedInputButton></button>
            </fd-feed-input>
        </div>
    `
})
class SizingHost {
    readonly width = signal('600px');
    readonly maxRows = signal<number | null>(null);
    readonly lineHeight = signal<string | null>(null);
    readonly fontSize = signal<string | null>(null);
    readonly values: string[] = [];
}

async function setupSizing(change?: (host: SizingHost) => void) {
    const fixture = TestBed.createComponent(SizingHost);
    change?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        fixture,
        host: fixture.componentInstance,
        textarea: root.querySelector('textarea')!,
        avatar: root.querySelector<HTMLElement>('fd-avatar')!
    };
}

const lines = (count: number) =>
    Array.from({ length: count }, (_, i) => `line ${i + 1}`).join('{Shift>}{Enter}{/Shift}');

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

    it('emits valueChange while typing', async () => {
        const { host, textarea, fixture } = await setupSizing();
        await userEvent.type(textarea, 'Hi!');
        await fixture.whenStable();
        expect(host.values).toEqual(['H', 'Hi', 'Hi!']);
        await userEvent.clear(textarea);
        expect(host.values.at(-1)).toBe('');
    });

    it('caps the height at 20rem without max rows', async () => {
        const { textarea, fixture } = await setupSizing();
        expect(textarea.style.maxHeight).toBe('');
        expect(getComputedStyle(textarea).maxHeight).toBe('320px');
        await userEvent.type(textarea, lines(30));
        await fixture.whenStable();
        expect(textarea.getBoundingClientRect().height).toBe(320);
        expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight);
    });

    it('computes the row cap when line-height is normal', async () => {
        const { textarea } = await setupSizing((host) => {
            host.maxRows.set(2);
            host.lineHeight.set('normal');
            host.fontSize.set('20px');
        });
        expect(getComputedStyle(textarea).lineHeight).toBe('normal');
        // like upstream, a normal line height counts as 1.1 times the font size
        expect(parseFloat(textarea.style.maxHeight)).toBeCloseTo(20 * 1.1 * 2, 5);
    });

    it('hides the avatar below 20rem', async () => {
        const { host, avatar, fixture } = await setupSizing();
        expect(getComputedStyle(avatar).display).not.toBe('none');
        host.width.set('300px');
        await fixture.whenStable();
        expect(getComputedStyle(avatar).display).toBe('none');
        host.width.set('400px');
        await fixture.whenStable();
        expect(getComputedStyle(avatar).display).not.toBe('none');
    });
});
