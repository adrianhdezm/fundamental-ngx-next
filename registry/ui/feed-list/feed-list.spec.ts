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
});
