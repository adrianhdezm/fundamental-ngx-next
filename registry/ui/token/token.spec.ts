import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Token, Tokenizer, TokenizerInput } from './token';

@Component({
    imports: [Token, Tokenizer, TokenizerInput],
    template: `
        <div [style.width]="width()">
            <fd-tokenizer>
                @for (value of values(); track value) {
                    <fd-token (onCloseClick)="remove(value)">{{ value }}</fd-token>
                }
                <input fdTokenizerInput aria-label="Values" />
            </fd-tokenizer>
        </div>
        <button type="button">Outside</button>
    `
})
class Host {
    readonly width = signal('40rem');
    readonly values = signal(['Apple', 'Banana', 'Cherry']);
    remove(value: string): void {
        this.values.update((v) => v.filter((x) => x !== value));
    }
}

@Component({
    imports: [Token],
    template: `
        <div role="listbox" aria-label="Tokens">
            <fd-token
                [disabled]="disabled()"
                [readOnly]="readOnly()"
                [(selected)]="selected"
                (onTokenClick)="clicks.push($event)"
                (onCloseClick)="closes.push($event)"
                (elementFocused)="focusEvents.push($event)"
                >Apple</fd-token
            >
        </div>
    `
})
class TokenHost {
    readonly token = viewChild.required(Token);
    readonly disabled = signal(false);
    readonly readOnly = signal(false);
    readonly selected = signal(false);
    readonly clicks: (MouseEvent | KeyboardEvent)[] = [];
    readonly closes: (MouseEvent | undefined)[] = [];
    readonly focusEvents: boolean[] = [];
}

async function setupToken(init?: (host: TokenHost) => void) {
    const fixture = TestBed.createComponent(TokenHost);
    init?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        token: root.querySelector<HTMLElement>('[role=option]')!,
        close: () => root.querySelector<HTMLElement>('[role=option] > [aria-hidden=true]')
    };
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const options = () => [...document.querySelectorAll<HTMLElement>('[role=option]')];
const focused = () => document.activeElement?.textContent?.trim();

async function setup(width = '40rem', values?: string[]) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.width.set(width);
    if (values) fixture.componentInstance.values.set(values);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, root, input: root.querySelector('input')! };
}

describe('Token', () => {
    it('emits onTokenClick on click, Enter and Space', async () => {
        const { host, token } = await setupToken();
        await userEvent.click(token);
        expect(host.clicks).toHaveLength(1);
        expect(host.clicks[0]).toBeInstanceOf(MouseEvent);
        token.focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(host.clicks).toHaveLength(3);
        expect(host.clicks.slice(1).map((e) => (e as KeyboardEvent).key)).toEqual(['Enter', ' ']);
        await userEvent.keyboard('a');
        expect(host.clicks).toHaveLength(3);
    });

    it('emits onCloseClick from the close icon only, without selecting the token', async () => {
        const { fixture, host, token, close } = await setupToken();
        await userEvent.click(close()!);
        await fixture.whenStable();
        expect(host.closes).toHaveLength(1);
        expect(host.closes[0]).toBeInstanceOf(MouseEvent);
        // the click stops at the close icon
        expect(host.clicks).toHaveLength(0);
        expect(token.getAttribute('aria-selected')).toBe('false');

        // without a click event (a programmatic call) nothing is emitted, as upstream
        host.token().closeClickHandler();
        expect(host.closes).toHaveLength(1);

        // a click on the text is a token click, not a close click
        await userEvent.click(token.firstElementChild as HTMLElement);
        expect(host.closes).toHaveLength(1);
        expect(host.clicks).toHaveLength(1);
    });
});

describe('Tokenizer', () => {
    it('lists tokens as options with their positions', async () => {
        const { root } = await setup();
        expect(root.querySelector('[role=listbox]')).not.toBeNull();
        expect(options()).toHaveLength(3);
        expect(options()[1].getAttribute('aria-posinset')).toBe('2');
        expect(options()[1].getAttribute('aria-setsize')).toBe('3');
    });

    it('moves between the input and the tokens with the arrow keys', async () => {
        const { input } = await setup();
        input.focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(focused()).toBe('Cherry');
        await userEvent.keyboard('{ArrowLeft}');
        expect(focused()).toBe('Banana');
        await userEvent.keyboard('{ArrowRight}{ArrowRight}');
        expect(document.activeElement).toBe(input);
    });

    it('removes tokens with Backspace and Delete', async () => {
        const { host, input, fixture } = await setup();
        input.focus();
        await userEvent.keyboard('{Backspace}');
        expect(focused()).toBe('Cherry');
        await userEvent.keyboard('{Backspace}');
        await fixture.whenStable();
        await wait();
        expect(host.values()).toEqual(['Apple', 'Banana']);
        expect(focused()).toBe('Banana');
        await userEvent.keyboard('{Delete}');
        await fixture.whenStable();
        expect(host.values()).toEqual(['Apple']);
        expect(document.activeElement).toBe(input);
    });

    it('selects with clicks, Shift clicks and Ctrl+A', async () => {
        const { fixture, input } = await setup();
        await userEvent.click(options()[0]);
        await fixture.whenStable();
        expect(options()[0].getAttribute('aria-selected')).toBe('true');
        // a Shift click selects the range
        options()[2].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
        await fixture.whenStable();
        expect(options().filter((o) => o.getAttribute('aria-selected') === 'true')).toHaveLength(3);
        await userEvent.click(document.querySelector<HTMLElement>('button')!);
        await fixture.whenStable();
        expect(options().filter((o) => o.getAttribute('aria-selected') === 'true')).toHaveLength(0);
        input.focus();
        await userEvent.keyboard('{Control>}a{/Control}');
        await fixture.whenStable();
        expect(options().filter((o) => o.getAttribute('aria-selected') === 'true')).toHaveLength(3);
    });

    it('selects the focused token with Space and moves to the input with Enter', async () => {
        const { fixture, input } = await setup();
        await userEvent.click(options()[0]);
        await fixture.whenStable();
        input.focus();
        await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
        expect(focused()).toBe('Banana');
        await userEvent.keyboard(' ');
        await fixture.whenStable();
        // Space selects only the focused token
        expect(options().map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
        await userEvent.keyboard(' ');
        await fixture.whenStable();
        expect(options()[1].getAttribute('aria-selected')).toBe('false');
        await userEvent.keyboard('{Enter}');
        expect(document.activeElement).toBe(input);
    });

    it('collapses tokens that do not fit into an overflow link while not focused', async () => {
        const { root, input, fixture } = await setup('14rem', [
            'Apple',
            'Banana',
            'Cherry',
            'Dragon fruit',
            'Elderberry'
        ]);
        const more = root.querySelector<HTMLElement>('[data-tokenizer-more]')!;
        expect(more).not.toBeNull();
        expect(more.textContent).toMatch(/^\d more$/);
        input.focus();
        await fixture.whenStable();
        await wait();
        expect(root.querySelector('[data-tokenizer-more]')).toBeNull();
        expect(options().every((o) => o.offsetParent !== null)).toBe(true);
    });
});
