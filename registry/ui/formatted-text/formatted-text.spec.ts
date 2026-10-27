import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { FormattedText, sanitizeFormattedText, type LinkTarget } from './formatted-text';

const LONG = '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>'.repeat(20);

@Component({
    imports: [FormattedText],
    template: `
        <button id="before">Before</button>
        <fd-formatted-text
            [htmlText]="html()"
            [convertedLinksDefaultTarget]="target()"
            [width]="width()"
            [height]="height()"
        />
    `
})
class Host {
    readonly html = signal<string | null>(null);
    readonly target = signal<LinkTarget>('_blank');
    readonly width = signal<string | null>(null);
    readonly height = signal<string | null>(null);
}

async function setup(html: string | null) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.html.set(html);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        fixture,
        root,
        text: root.querySelector<HTMLElement>('fd-formatted-text')!,
        update: async (change: (host: Host) => void) => {
            change(fixture.componentInstance);
            await fixture.whenStable();
        }
    };
}

describe('FormattedText', () => {
    it('sanitizes htmlText: keeps the allowed tags and attributes, strips scripts and event handlers', async () => {
        (window as unknown as { pwned?: boolean }).pwned = false;
        const { text, update } = await setup(`
            <h3 title="Heading">Release notes</h3>
            <p class="intro" style="color: rgb(1, 2, 3)" onclick="window.pwned = true">Some <strong>bold</strong>, <em>italic</em> and <u>underlined</u> text.</p>
            <ul><li>One</li><li>Two</li></ul>
            <script>window.pwned = true</script>
            <img src="x" onerror="window.pwned = true">
            <iframe src="about:blank"></iframe>
            <div data-x="1">Unwrapped <span>text</span></div>
            <a href="javascript:window.pwned = true">Bad link</a>
            <svg><text>svg text</text></svg>
        `);
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect((window as unknown as { pwned?: boolean }).pwned).toBe(false);

        expect(text.querySelector('h3')!.textContent).toBe('Release notes');
        expect(text.querySelector('h3')!.title).toBe('Heading');
        const p = text.querySelector('p')!;
        expect(p.className).toBe('intro');
        expect(getComputedStyle(p).color).toBe('rgb(1, 2, 3)');
        expect(p.hasAttribute('onclick')).toBe(false);
        expect(p.querySelector('strong')!.textContent).toBe('bold');
        expect(getComputedStyle(p.querySelector('strong')!).fontWeight).toBe('700');
        expect(getComputedStyle(p.querySelector('em')!).fontStyle).toBe('italic');
        expect(getComputedStyle(p.querySelector('u')!).textDecorationLine).toBe('underline');
        expect(text.querySelectorAll('ul > li').length).toBe(2);
        expect(getComputedStyle(text.querySelector('ul')!).listStyleType).toBe('disc');

        expect(text.querySelector('script, img, iframe, svg, div')).toBeNull();
        expect(text.textContent).not.toContain('pwned');
        expect(text.textContent).not.toContain('svg text');
        // unknown tags are dropped, their text is kept
        expect(text.textContent).toContain('Unwrapped text');
        expect(text.querySelector('[data-x]')).toBeNull();
        const bad = [...text.querySelectorAll('a')].find((a) => a.textContent === 'Bad link')!;
        expect(bad.hasAttribute('href')).toBe(false);

        await update((h) => h.html.set('   '));
        expect(text.innerHTML).toBe('');
        await update((h) => h.html.set(null));
        expect(text.innerHTML).toBe('');
    });

    it('sanitizeFormattedText keeps safe link schemes only', () => {
        const html = sanitizeFormattedText(
            '<a href="https://sap.com">a</a><a href="mailto:x@y.z">b</a><a href="ftp://f">c</a>' +
                '<a href="/relative">d</a><a href="data:text/html,x">e</a><a href="JaVaScRiPt:alert(1)">f</a>'
        );
        const div = document.createElement('div');
        div.innerHTML = html;
        expect([...div.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
            'https://sap.com',
            'mailto:x@y.z',
            'ftp://f',
            '/relative',
            null,
            null
        ]);
    });

    it('links get convertedLinksDefaultTarget and rel noopener, and keep the link focus styles', async () => {
        const { root, text, update } = await setup(
            '<p><a href="https://sap.com">External</a> <a href="#section">Anchor</a> <a href="https://x.y" rel="author">Author</a></p>'
        );
        const links = () => [...text.querySelectorAll('a')];
        const [external, anchor, author] = links();
        expect(external.target).toBe('_blank');
        expect(external.rel).toBe('noopener');
        expect(author.rel).toBe('author noopener');
        // in-page links stay in the page
        expect(anchor.hasAttribute('target')).toBe(false);
        expect(anchor.hasAttribute('rel')).toBe(false);

        const probe = document.createElement('span');
        text.appendChild(probe);
        probe.style.color = 'var(--sapLinkColor)';
        expect(getComputedStyle(external).color).toBe(getComputedStyle(probe).color);
        probe.remove();

        // keyboard focus shows a visible focus indicator
        root.querySelector<HTMLElement>('#before')!.focus();
        await userEvent.tab();
        expect(document.activeElement).toBe(links()[0]);
        const style = getComputedStyle(links()[0]);
        expect(style.outlineStyle).not.toBe('none');
        expect(parseFloat(style.outlineWidth)).toBeGreaterThan(0);
        await userEvent.hover(links()[0]);
        expect(getComputedStyle(links()[0]).textDecorationLine).toBe('underline');

        await update((h) => h.target.set('_self'));
        expect(links()[0].target).toBe('_self');
        expect(links()[0].hasAttribute('rel')).toBe(false);
        expect(links()[2].rel).toBe('author');
        await update((h) => h.target.set(''));
        expect(links()[0].hasAttribute('target')).toBe(false);
    });

    it('width and height constrain the container', async () => {
        const { text, update } = await setup(LONG);
        expect(getComputedStyle(text).overflowY).toBe('visible');
        const full = text.getBoundingClientRect().height;
        expect(full).toBeGreaterThan(200);

        await update((h) => {
            h.height.set('10rem');
            h.width.set('300px');
        });
        const rect = text.getBoundingClientRect();
        expect(rect.height).toBe(160);
        expect(rect.width).toBe(300);
        expect(getComputedStyle(text).overflowY).toBe('auto');
        expect(getComputedStyle(text).overflowX).toBe('auto');
        expect(text.scrollHeight).toBeGreaterThan(text.clientHeight);
        text.scrollTop = 100;
        expect(text.scrollTop).toBe(100);
    });
});
