import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { FeedList, FeedListAction, FeedListFooter, FeedListFooterByline, FeedListItem } from './feed-list';

const TEXT = 'x'.repeat(40);

@Component({
    imports: [FeedList, FeedListItem, FeedListAction, FeedListFooter, FeedListFooterByline],
    template: `
        <fd-feed-list ariaLabel="Comments" [mobile]="mobile()">
            <fd-feed-list-item authorTitle="John Doe" authorLink="https://example.com/" [text]="text" [maxChars]="10">
                <fd-feed-list-action><button type="button">Act</button></fd-feed-list-action>
                <fd-feed-list-footer
                    ><small fd-item-footer-byline>Aug 20</small
                    ><small fd-item-footer-byline>Reply</small></fd-feed-list-footer
                >
            </fd-feed-list-item>
            <fd-feed-list-item authorTitle="Cruz" text="Short <strong>rich</strong>" isRichText />
        </fd-feed-list>
    `
})
class Host {
    readonly mobile = signal(false);
    readonly text = TEXT;
}

async function setup(mobile = false) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mobile.set(mobile);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    return { fixture, root: fixture.nativeElement as HTMLElement };
}

@Component({
    imports: [FeedList, FeedListItem],
    template: `
        <fd-feed-list ariaLabel="Posts" [borderLess]="borderLess()">
            <fd-feed-list-item
                authorTitle="Jane"
                [authorLink]="link()"
                [text]="text"
                [maxChars]="10"
                [moreLabel]="moreLabel()"
                [lessLabel]="lessLabel()"
            />
            <fd-feed-list-item authorTitle="Cruz" text="Second" />
        </fd-feed-list>
    `
})
class OptionsHost {
    readonly borderLess = signal(false);
    readonly link = signal<string | null>('https://example.com/jane');
    readonly moreLabel = signal('Show {count} more');
    readonly lessLabel = signal('Show less');
    readonly text = TEXT;
}

async function setupOptions() {
    const fixture = TestBed.createComponent(OptionsHost);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
}

describe('FeedList', () => {
    it('renders a list of posts with the author as a link', async () => {
        const { root } = await setup();
        expect(root.querySelector('fd-feed-list')!.getAttribute('role')).toBe('list');
        expect(root.querySelectorAll('[role=listitem]')).toHaveLength(2);
        const author = root.querySelector<HTMLAnchorElement>('fd-feed-list-item a[href]')!;
        expect(author.textContent).toContain('John Doe');
        expect(author.getAttribute('href')).toBe('https://example.com/');
    });

    it('collapses long texts with a More/Less link', async () => {
        const { root, fixture } = await setup();
        const item = root.querySelector('fd-feed-list-item')!;
        expect(item.textContent).toContain('x'.repeat(10) + '...');
        const more = [...item.querySelectorAll('a')].find((a) => a.textContent!.includes('more'))!;
        expect(more.textContent!.trim()).toBe('30 more');
        await userEvent.click(more);
        await fixture.whenStable();
        expect(item.textContent).toContain(TEXT);
        expect(more.textContent!.trim()).toBe('Less');
    });

    it('renders rich text in full', async () => {
        const { root } = await setup();
        await new Promise((r) => setTimeout(r, 50));
        const rich = root.querySelectorAll('fd-feed-list-item')[1];
        expect(rich.querySelector('fd-formatted-text')!.innerHTML).toContain('<strong>rich</strong>');
    });

    it('moves the author, footer and actions above the text in mobile mode', async () => {
        const { root } = await setup(true);
        const item = root.querySelector('fd-feed-list-item')!;
        const header = item.firstElementChild!;
        expect(header.querySelector('fd-feed-list-footer')).not.toBeNull();
        expect(header.querySelector('fd-feed-list-action')).not.toBeNull();
        expect(item.querySelector('p')!.textContent).not.toContain('John Doe');
    });

    it('renders the author as text without authorLink', async () => {
        const { root } = await setup();
        const plain = root.querySelectorAll('fd-feed-list-item')[1];
        expect(plain.querySelector('a')).toBeNull();
        expect(plain.textContent).toContain('Cruz');
    });

    it('uses custom moreLabel and lessLabel', async () => {
        const { root, fixture } = await setupOptions();
        const more = () =>
            [...root.querySelector('fd-feed-list-item')!.querySelectorAll('a')].find((a) =>
                a.textContent!.includes('Show')
            )!;
        expect(more().textContent!.trim()).toBe('Show 30 more');
        await userEvent.click(more());
        await fixture.whenStable();
        expect(more().textContent!.trim()).toBe('Show less');
    });

    it('does not render a javascript: authorLink as a live link', async () => {
        const { root, fixture, host } = await setupOptions();
        const author = () => root.querySelector<HTMLAnchorElement>('fd-feed-list-item a[title="Jane"]')!;
        expect(author().getAttribute('href')).toBe('https://example.com/jane');
        host.link.set('javascript:alert(1)');
        await fixture.whenStable();
        expect(author().getAttribute('href')).not.toMatch(/^javascript:/);
        expect(author().protocol).not.toBe('javascript:');
    });

    it('removes the borders between items with borderLess', async () => {
        const { root, fixture, host } = await setupOptions();
        const second = root.querySelectorAll('fd-feed-list-item')[1];
        expect(getComputedStyle(second).borderTopWidth).toBe('1px');
        host.borderLess.set(true);
        await fixture.whenStable();
        expect(getComputedStyle(second).borderTopWidth).toBe('0px');
    });
});
