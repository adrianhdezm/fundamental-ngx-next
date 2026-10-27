import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Panel, PanelContent, PanelTitle } from './panel';

@Component({
    imports: [Panel, PanelTitle, PanelContent],
    template: `
        <fd-panel
            [(expanded)]="expanded"
            [fixed]="fixed()"
            [transparent]="transparent()"
            expandAriaLabel="Show details"
            expandAriaLabelledBy="title"
        >
            <h4 fd-panel-title id="title">Details</h4>
            <button id="action">Edit</button>
            <div fd-panel-content ariaLabelledBy="title" maxHeight="5rem"><p id="text">Content</p></div>
        </fd-panel>
    `
})
class Host {
    readonly expanded = signal(false);
    readonly fixed = signal(false);
    readonly transparent = signal(false);
}

const LONG = 'A very long panel title that does not fit into the narrow panel header at all';

@Component({
    imports: [Panel, PanelTitle, PanelContent],
    template: `
        <fd-panel fixed class="w-60 mt-4" id="layout">
            <h4 fd-panel-title [wrap]="wrap()">{{ title }}</h4>
            <div
                fd-panel-content
                ariaLabel="Layout"
                class="text-sap-negative-color"
                [height]="height()"
                [minHeight]="minHeight()"
                [maxHeight]="maxHeight()"
                [noPadding]="noPadding()"
                [transparent]="transparentContent()"
            >
                <div id="filler" [style.height]="fillerHeight()"></div>
            </div>
        </fd-panel>
    `
})
class LayoutHost {
    readonly title = LONG;
    readonly wrap = signal(true);
    readonly height = signal<string | null>(null);
    readonly minHeight = signal<string | null>(null);
    readonly maxHeight = signal<string | null>(null);
    readonly noPadding = signal(false);
    readonly transparentContent = signal(false);
    readonly fillerHeight = signal('1rem');
}

async function setupLayout() {
    const fixture = TestBed.createComponent(LayoutHost);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        host: fixture.componentInstance,
        update: async (change: (host: LayoutHost) => void) => {
            change(fixture.componentInstance);
            await fixture.whenStable();
        },
        panel: () => root.querySelector<HTMLElement>('fd-panel')!,
        title: () => root.querySelector<HTMLElement>('[fd-panel-title]')!,
        content: () => root.querySelector<HTMLElement>('[fd-panel-content]')!
    };
}

async function setup(config: { fixed?: boolean; expanded?: boolean } = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.fixed) host.fixed.set(true);
    if (config.expanded) host.expanded.set(true);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        fixture,
        host,
        root,
        stable: () => fixture.whenStable(),
        expandButton: () => root.querySelector<HTMLButtonElement>('fd-panel > div > div > button'),
        content: () => root.querySelector<HTMLElement>('[fd-panel-content]'),
        header: () => root.querySelector<HTMLElement>('fd-panel > div')!
    };
}

describe('Panel', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('data-density');
    });

    it('expand button toggles [(expanded)] and controls the content via aria-controls / aria-expanded', async () => {
        const { host, stable, expandButton, content } = await setup();
        const button = expandButton()!;
        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(content()).toBeNull();
        const controls = button.getAttribute('aria-controls')!;
        expect(controls).toMatch(/^fd-panel-content-\d+$/);

        await userEvent.click(button);
        await stable();
        expect(host.expanded()).toBe(true);
        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(content()!.id).toBe(controls);
        expect(content()!.getAttribute('role')).toBe('region');
        expect(content()!.style.maxHeight).toBe('5rem');

        button.focus();
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(host.expanded()).toBe(false);
        expect(content()).toBeNull();
        await userEvent.keyboard(' ');
        await stable();
        expect(host.expanded()).toBe(true);

        // the bound value drives the panel too
        host.expanded.set(false);
        await stable();
        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(content()).toBeNull();
    });

    it('fixed panels have no expand button and always show the content', async () => {
        const { host, stable, expandButton, content, root } = await setup({ fixed: true });
        expect(expandButton()).toBeNull();
        expect(content()).not.toBeNull();
        expect(root.querySelector('#text')!.textContent).toBe('Content');
        // extra header content stays in the header
        expect(root.querySelector('#action')!.closest('fd-panel > div')).not.toBeNull();
        host.fixed.set(false);
        await stable();
        expect(expandButton()).not.toBeNull();
        expect(content()).toBeNull();
    });

    it('title is the label of the expand button and content region', async () => {
        const { root, expandButton } = await setup({ expanded: true });
        const button = expandButton()!;
        expect(button.getAttribute('aria-labelledby')).toBe(`title ${button.id}`);
        expect(button.title).toBe('Show details');
        await expect.element(page.getByRole('button', { name: 'Details Show details' })).toBeInTheDocument();
        await expect.element(page.getByRole('region', { name: 'Details' })).toBeInTheDocument();
        expect(root.querySelector('fd-panel')!.id).toMatch(/^fd-panel-\d+$/);
    });

    it('header and content corners follow the expanded state', async () => {
        const { host, stable, header } = await setup();
        expect(getComputedStyle(header()).borderBottomLeftRadius).not.toBe('0px');
        host.expanded.set(true);
        await stable();
        expect(getComputedStyle(header()).borderBottomLeftRadius).toBe('0px');
        host.transparent.set(true);
        await stable();
        expect(getComputedStyle(header()).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('compact density sizes', async () => {
        const { header, expandButton } = await setup();
        const button = expandButton()!;
        const cozyButton = button.getBoundingClientRect().height;
        expect(getComputedStyle(header()).minHeight).toBe('44px');
        expect(button.parentElement!.getBoundingClientRect().height).toBe(44);
        document.documentElement.setAttribute('data-density', 'compact');
        expect(getComputedStyle(header()).minHeight).toBe('40px');
        expect(button.parentElement!.getBoundingClientRect().height).toBe(40);
        expect(button.getBoundingClientRect().height).toBeLessThan(cozyButton);
    });

    it('content height, minHeight and maxHeight size the content and make it scroll', async () => {
        const { update, content } = await setupLayout();
        const height = () => content().getBoundingClientRect().height;
        const auto = height();
        await update((h) => h.minHeight.set('10rem'));
        expect(height()).toBe(160);
        await update((h) => {
            h.minHeight.set(null);
            h.fillerHeight.set('20rem');
            h.maxHeight.set('6rem');
        });
        expect(height()).toBe(96);
        expect(content().scrollHeight).toBeGreaterThan(content().clientHeight);
        await update((h) => {
            h.maxHeight.set(null);
            h.height.set('5rem');
        });
        expect(height()).toBe(80);
        expect(content().scrollHeight).toBeGreaterThan(content().clientHeight);
        await update((h) => {
            h.height.set(null);
            h.fillerHeight.set('1rem');
        });
        expect(height()).toBe(auto);
    });

    it('title wraps long text by default and truncates when wrap is false', async () => {
        const { update, title } = await setupLayout();
        const height = () => title().getBoundingClientRect().height;
        expect(getComputedStyle(title()).whiteSpace).toBe('normal');
        const wrapped = height();
        await update((h) => h.wrap.set(false));
        expect(getComputedStyle(title()).whiteSpace).toBe('nowrap');
        expect(getComputedStyle(title()).textOverflow).toBe('ellipsis');
        // one line instead of several
        expect(wrapped).toBeGreaterThan(height() * 1.5);
        expect(title().scrollWidth).toBeGreaterThan(title().clientWidth);
    });

    it('noPadding and transparent content remove padding and background', async () => {
        const { update, content } = await setupLayout();
        const style = () => getComputedStyle(content());
        expect(style().paddingLeft).toBe('16px');
        expect(style().paddingTop).toBe('10px');
        expect(style().backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        await update((h) => h.noPadding.set(true));
        expect(style().paddingLeft).toBe('0px');
        expect(style().paddingTop).toBe('0px');
        await update((h) => h.transparentContent.set(true));
        expect(style().backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('class input is merged into the panel and content classes', async () => {
        const { panel, content } = await setupLayout();
        expect(panel().getBoundingClientRect().width).toBe(240);
        expect(getComputedStyle(panel()).marginTop).toBe('16px');
        expect(getComputedStyle(panel()).display).toBe('flex');
        // the user's text colour wins over the default content colour
        const probe = document.createElement('span');
        probe.style.color = 'var(--sapNegativeColor)';
        document.body.appendChild(probe);
        expect(getComputedStyle(content()).color).toBe(getComputedStyle(probe).color);
        probe.remove();
        expect(getComputedStyle(content()).overflow).toBe('auto');
    });
});
