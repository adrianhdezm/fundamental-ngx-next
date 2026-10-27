import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
    LayoutPanel,
    LayoutPanelActions,
    LayoutPanelBody,
    LayoutPanelDescription,
    LayoutPanelFilters,
    LayoutPanelFooter,
    LayoutPanelHead,
    LayoutPanelHeader,
    LayoutPanelTitle
} from './layout-panel';

const IMAGE =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

@Component({
    imports: [
        LayoutPanel,
        LayoutPanelHeader,
        LayoutPanelHead,
        LayoutPanelTitle,
        LayoutPanelDescription,
        LayoutPanelActions,
        LayoutPanelFilters,
        LayoutPanelBody,
        LayoutPanelFooter
    ],
    template: `
        <div style="width: 600px">
            <fd-layout-panel [transparent]="transparent()" [backgroundImage]="image()">
                <fd-layout-panel-footer [position]="footer()"><button>Footer action</button></fd-layout-panel-footer>
                <fd-layout-panel-body [bleed]="bleed()"><p id="body">Body</p></fd-layout-panel-body>
                <fd-layout-panel-filters>Filters</fd-layout-panel-filters>
                <fd-layout-panel-header>
                    <fd-layout-panel-actions><button>Edit</button></fd-layout-panel-actions>
                    <fd-layout-panel-head>
                        <h3 fd-layout-panel-title>Sales</h3>
                        <fd-layout-panel-description>Per quarter</fd-layout-panel-description>
                    </fd-layout-panel-head>
                </fd-layout-panel-header>
            </fd-layout-panel>
        </div>
    `
})
class Host {
    readonly transparent = signal(false);
    readonly image = signal<string | null>(null);
    readonly bleed = signal(false);
    readonly footer = signal<'start' | 'end' | null>(null);
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const q = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
    return { fixture, host: fixture.componentInstance, root, q, stable: () => fixture.whenStable() };
}

function cssColor(variable: string): string {
    const probe = document.createElement('div');
    probe.style.backgroundColor = `var(${variable})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
}

describe('LayoutPanel', () => {
    it('places header, filters, body and footer in that order whatever the projected order', async () => {
        const { q } = await setup();
        const panel = q('fd-layout-panel');
        expect(panel.id).toMatch(/^fd-layout-panel-\d+$/);
        expect([...panel.children].map((c) => c.tagName.toLowerCase())).toEqual([
            'fd-layout-panel-header',
            'fd-layout-panel-filters',
            'fd-layout-panel-body',
            'fd-layout-panel-footer'
        ]);
        const tops = [...panel.children].map((c) => c.getBoundingClientRect().top);
        expect([...tops].sort((a, b) => a - b)).toEqual(tops);
    });

    it('header with title, description, actions and filters', async () => {
        const { q } = await setup();
        const header = q('fd-layout-panel-header');
        // the head comes first and the actions sit at the end of the header
        expect(header.firstElementChild!.tagName.toLowerCase()).toBe('fd-layout-panel-head');
        const head = q('fd-layout-panel-head').getBoundingClientRect();
        const actions = q('fd-layout-panel-actions').getBoundingClientRect();
        expect(actions.left).toBeGreaterThan(head.right);
        expect(actions.right).toBeCloseTo(header.getBoundingClientRect().right - 16, 0);
        const title = q('[fd-layout-panel-title]');
        expect(title.tagName).toBe('H3');
        expect(getComputedStyle(title).fontWeight).toBe('700');
        const description = q('fd-layout-panel-description p');
        expect(description.textContent).toBe('Per quarter');
        expect(description.getBoundingClientRect().top).toBeGreaterThanOrEqual(title.getBoundingClientRect().bottom);
        expect(getComputedStyle(header).borderBottomStyle).toBe('solid');
        const filters = q('fd-layout-panel-filters');
        expect(filters.textContent!.trim()).toBe('Filters');
        expect(getComputedStyle(filters).borderBottomStyle).toBe('solid');
        expect(filters.getBoundingClientRect().top).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom);
    });

    it('body bleed removes the padding', async () => {
        const { host, q, stable } = await setup();
        const body = q('fd-layout-panel-body');
        expect(getComputedStyle(body).padding).toBe('16px');
        // the first and last children lose their outer margins
        expect(getComputedStyle(q('#body')).marginTop).toBe('0px');
        host.bleed.set(true);
        await stable();
        expect(getComputedStyle(body).padding).toBe('0px');
        expect(q('#body').getBoundingClientRect().left).toBe(q('fd-layout-panel').getBoundingClientRect().left);
    });

    it('footer position start/end', async () => {
        const { host, q, stable } = await setup();
        const footer = q('fd-layout-panel-footer');
        const button = () => q('fd-layout-panel-footer button').getBoundingClientRect();
        const box = footer.getBoundingClientRect();
        expect(getComputedStyle(footer).justifyContent).toBe('center');
        expect(button().left + button().width / 2).toBeCloseTo(box.left + box.width / 2, 0);
        host.footer.set('start');
        await stable();
        expect(getComputedStyle(footer).justifyContent).toBe('flex-start');
        expect(button().left).toBeCloseTo(box.left + 16, 0);
        host.footer.set('end');
        await stable();
        expect(getComputedStyle(footer).justifyContent).toBe('flex-end');
        expect(button().right).toBeCloseTo(box.right - 16, 0);
    });

    it('transparent variant and backgroundImage', async () => {
        const { host, q, stable } = await setup();
        const panel = q('fd-layout-panel');
        expect(getComputedStyle(panel).backgroundColor).toBe(cssColor('--sapGroup_ContentBackground'));
        expect(getComputedStyle(panel).backgroundImage).toBe('none');
        host.transparent.set(true);
        await stable();
        expect(getComputedStyle(panel).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        host.image.set(IMAGE);
        await stable();
        expect(getComputedStyle(panel).backgroundImage).toBe(`url("${IMAGE}")`);
        expect(getComputedStyle(panel).backgroundSize).toBe('cover');
        host.image.set(null);
        await stable();
        expect(panel.style.backgroundImage).toBe('');
    });
});
