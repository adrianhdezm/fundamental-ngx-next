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
});
