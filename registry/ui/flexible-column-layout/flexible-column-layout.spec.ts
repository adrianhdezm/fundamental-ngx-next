import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    DEFAULT_FLEXIBLE_LAYOUT_CONFIG,
    FlexibleColumnLayoutComponent,
    provideFlexibleColumnLayoutConfig,
    type FlexibleColumnLayout
} from './flexible-column-layout';

@Component({
    imports: [FlexibleColumnLayoutComponent],
    template: `
        <div [style.width.px]="width()">
            <fd-flexible-column-layout
                class="h-64"
                [(layout)]="layout"
                (layoutChange)="changes.push($event)"
                [backgroundDesign]="design()"
                collapseTitleEndBtn="Collapse end"
                [expandTitleStartBtn]="expandStart()"
                [collapseTitleStartBtn]="collapseStart()"
            >
                <ng-template #startColumn><p>Start</p></ng-template>
                <ng-template #midColumn><p>Mid</p></ng-template>
                <ng-template #endColumn><p>End</p></ng-template>
            </fd-flexible-column-layout>
        </div>
    `
})
class Host {
    readonly width = signal(1400);
    readonly layout = signal<FlexibleColumnLayout>('OneColumnStartFullScreen');
    readonly design = signal<'solid' | 'translucent' | 'transparent'>('solid');
    readonly expandStart = signal<string | undefined>(undefined);
    readonly collapseStart = signal<string | undefined>(undefined);
    readonly changes: FlexibleColumnLayout[] = [];
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function setup(layout: FlexibleColumnLayout, width = 1400) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    host.layout.set(layout);
    host.width.set(width);
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await frame();
        await fixture.whenStable();
    };
    await stable();
    const root = fixture.nativeElement as HTMLElement;
    const fcl = root.querySelector<HTMLElement>('fd-flexible-column-layout')!;
    return {
        fixture,
        host,
        root,
        stable,
        resize: async (px: number) => {
            host.width.set(px);
            await stable();
        },
        columns: () => [...fcl.querySelectorAll<HTMLElement>(':scope > div:not(:has(> button))')],
        separators: () => [...fcl.querySelectorAll<HTMLElement>(':scope > div:has(> button)')],
        buttons: () => [...fcl.querySelectorAll<HTMLButtonElement>(':scope > div > button')]
    };
}

function cssColor(variable: string): string {
    const probe = document.createElement('div');
    probe.style.backgroundColor = `var(${variable})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
}

describe('FlexibleColumnLayout', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('dir');
        document.documentElement.removeAttribute('data-sap-theme');
    });

    it('each layout sets the start/mid/end widths from the layout definitions; hidden columns are aria-hidden and invisible', async () => {
        const layouts = DEFAULT_FLEXIBLE_LAYOUT_CONFIG.layouts;
        // these layouts adapt on wide screens, so they are checked between the break points
        const medium: FlexibleColumnLayout[] = ['TwoColumnsEndExpanded', 'ThreeColumnsStartMinimized'];
        for (const layout of Object.keys(layouts) as FlexibleColumnLayout[]) {
            const { fixture, host, columns } = await setup(layout, medium.includes(layout) ? 1100 : 1400);
            expect(host.layout()).toBe(layout);
            const { start, mid, end } = layouts[layout];
            const cols = columns();
            // the columns transition their width and visibility
            await Promise.all(cols.flatMap((c) => c.getAnimations().map((a) => a.finished)));
            expect(cols.map((c) => c.style.width)).toEqual([`${start}%`, `${mid}%`, `${end}%`]);
            [start, mid, end].forEach((width, i) => {
                expect(cols[i].getAttribute('aria-hidden')).toBe(width ? null : 'true');
                expect(getComputedStyle(cols[i]).visibility).toBe(width ? 'visible' : 'hidden');
            });
            expect(cols.map((c) => c.textContent!.trim())).toEqual(['Start', 'Mid', 'End']);
            fixture.destroy();
        }
    });

    it('separators appear only between visible columns with the right arrow direction (mirrored in RTL)', async () => {
        const one = await setup('OneColumnStartFullScreen');
        expect(one.separators()).toHaveLength(0);
        one.fixture.destroy();

        const two = await setup('TwoColumnsStartExpanded');
        expect(two.buttons().map((b) => b.getAttribute('aria-label'))).toEqual(['Collapse']);
        two.fixture.destroy();

        const { buttons, separators, columns } = await setup('ThreeColumnsMidExpanded');
        expect(separators()).toHaveLength(2);
        // start separator sits between start and mid, end separator between mid and end
        const [start, mid, end] = columns();
        expect(start.nextElementSibling).toBe(separators()[0]);
        expect(mid.nextElementSibling).toBe(separators()[1]);
        expect(separators()[1].nextElementSibling).toBe(end);
        const [startButton, endButton] = buttons();
        expect(startButton.getAttribute('aria-label')).toBe('Expand');
        expect(startButton.title).toBe('Expand');
        expect(endButton.getAttribute('aria-label')).toBe('Collapse end');
        const startIcon = startButton.querySelector<HTMLElement>('fd-icon')!;
        const endIcon = endButton.querySelector<HTMLElement>('fd-icon')!;
        expect(startIcon.getAttribute('data-glyph')).toBe(String.fromCharCode(0xe1ed)); // slim-arrow-right
        expect(endIcon.getAttribute('data-glyph')).toBe(String.fromCharCode(0xe1ee)); // slim-arrow-left
        expect(getComputedStyle(startIcon).scale).not.toContain('-1');
        document.documentElement.setAttribute('dir', 'rtl');
        expect(getComputedStyle(startIcon).scale).toBe('-1 1');
        expect(getComputedStyle(endIcon).scale).toBe('-1 1');
    });

    it('clicking a separator or its button switches to the next layout and emits layoutChange', async () => {
        const { host, stable, separators, buttons, columns } = await setup('TwoColumnsMidExpanded', 1100);
        await userEvent.click(buttons()[0]);
        await stable();
        expect(host.layout()).toBe('TwoColumnsStartExpanded');
        expect(host.changes).toEqual(['TwoColumnsStartExpanded']);
        expect(columns()[0].style.width).toBe('67%');
        // the separator itself (outside the button) toggles back
        const separator = separators()[0];
        const rect = separator.getBoundingClientRect();
        await userEvent.click(separator, { position: { x: rect.width / 2, y: 4 } });
        await stable();
        expect(host.layout()).toBe('TwoColumnsMidExpanded');
        expect(host.changes).toEqual(['TwoColumnsStartExpanded', 'TwoColumnsMidExpanded']);
    });

    it('the start separator switches ThreeColumnsMidExpanded to ThreeColumnsEndMinimized', async () => {
        const { host, stable, buttons, columns } = await setup('ThreeColumnsMidExpanded');
        await userEvent.click(buttons()[0]);
        await stable();
        expect(host.layout()).toBe('ThreeColumnsEndMinimized');
        expect(host.changes).toEqual(['ThreeColumnsEndMinimized']);
        expect(columns().map((c) => c.style.width)).toEqual(['33%', '67%', '0%']);
    });

    it('expandTitleStartBtn and collapseTitleStartBtn label the start separator button', async () => {
        const { host, stable, buttons } = await setup('TwoColumnsStartExpanded');
        host.expandStart.set('Expand start');
        host.collapseStart.set('Collapse start');
        await stable();
        expect(buttons()[0].getAttribute('aria-label')).toBe('Collapse start');
        expect(buttons()[0].title).toBe('Collapse start');

        host.layout.set('ThreeColumnsMidExpanded');
        await stable();
        const [start, end] = buttons();
        expect(start.getAttribute('aria-label')).toBe('Expand start');
        expect(start.title).toBe('Expand start');
        // the end separator keeps its own label
        expect(end.getAttribute('aria-label')).toBe('Collapse end');
    });

    it('the separator buttons are keyboard operable', async () => {
        const { host, stable, buttons } = await setup('ThreeColumnsMidExpanded');
        buttons()[1].focus();
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(host.layout()).toBe('ThreeColumnsEndExpanded');
        // only the end separator is left
        expect(buttons()).toHaveLength(1);
        buttons()[0].focus();
        await userEvent.keyboard(' ');
        await stable();
        expect(host.layout()).toBe('ThreeColumnsMidExpanded');
    });

    it('below smBreakPoint 2/3 column layouts collapse to one full-screen column and restore when wide again', async () => {
        const { host, resize, columns, separators } = await setup('TwoColumnsMidExpanded', 1100);
        await resize(800);
        expect(host.layout()).toBe('OneColumnMidFullScreen');
        expect(columns().map((c) => c.style.width)).toEqual(['0%', '100%', '0%']);
        expect(separators()).toHaveLength(0);
        await resize(1100);
        expect(host.layout()).toBe('TwoColumnsMidExpanded');

        host.layout.set('ThreeColumnsEndMinimized');
        await resize(800);
        expect(host.layout()).toBe('OneColumnEndFullScreen');
        await resize(1100);
        expect(host.layout()).toBe('ThreeColumnsEndMinimized');
    });

    it('between sm and lg three-column layouts reduce to two columns; above lg TwoColumnsEndExpanded becomes three columns', async () => {
        const { host, resize, columns } = await setup('ThreeColumnsMidExpanded', 1400);
        await resize(1100);
        expect(host.layout()).toBe('ThreeColumnsStartMinimized');
        expect(columns()[0].getAttribute('aria-hidden')).toBe('true');
        await resize(1400);
        expect(host.layout()).toBe('ThreeColumnsMidExpanded');

        host.layout.set('ThreeColumnsEndExpanded');
        await resize(1100);
        expect(host.layout()).toBe('TwoColumnsEndExpanded');
        await resize(1400);
        expect(host.layout()).toBe('ThreeColumnsEndExpanded');
        expect(columns().map((c) => c.style.width)).toEqual(['25%', '25%', '50%']);
    });

    it('a layout chosen while narrow replaces the one to restore', async () => {
        const { host, stable, resize } = await setup('TwoColumnsMidExpanded', 1100);
        await resize(800);
        expect(host.layout()).toBe('OneColumnMidFullScreen');
        host.layout.set('OneColumnStartFullScreen');
        await stable();
        await resize(1100);
        expect(host.layout()).toBe('OneColumnStartFullScreen');

        // a multi-column layout chosen while narrow collapses and is the one restored later
        await resize(800);
        host.layout.set('ThreeColumnsEndExpanded');
        await stable();
        expect(host.layout()).toBe('OneColumnEndFullScreen');
        await resize(1400);
        expect(host.layout()).toBe('ThreeColumnsEndExpanded');
    });

    it('provideFlexibleColumnLayoutConfig overrides some widths and keeps the defaults', async () => {
        TestBed.configureTestingModule({
            providers: provideFlexibleColumnLayoutConfig({
                layouts: { TwoColumnsMidExpanded: { start: 40, mid: 60, end: 0 } }
            })
        });
        const { host, stable, columns } = await setup('TwoColumnsMidExpanded', 1100);
        expect(columns().map((c) => c.style.width)).toEqual(['40%', '60%', '0%']);
        host.layout.set('TwoColumnsStartExpanded');
        await stable();
        expect(columns().map((c) => c.style.width)).toEqual(['67%', '33%', '0%']);
    });

    it('backgroundDesign solid/translucent/transparent, including high contrast', async () => {
        const { host, stable, separators } = await setup('TwoColumnsMidExpanded', 1100);
        const background = () => getComputedStyle(separators()[0]).backgroundColor;
        expect(background()).toBe(cssColor('--sapContent_ForegroundColor'));
        host.design.set('translucent');
        await stable();
        expect(background()).toBe(cssColor('--sapGroup_ContentBackground'));
        host.design.set('transparent');
        await stable();
        expect(background()).toBe('rgba(0, 0, 0, 0)');

        document.documentElement.setAttribute('data-sap-theme', 'sap_horizon_hcb');
        expect(background()).toBe(cssColor('--sapBackgroundColor'));
        host.design.set('translucent');
        await stable();
        expect(background()).toBe(cssColor('--sapBackgroundColor'));
        host.design.set('solid');
        await stable();
        expect(background()).toBe(cssColor('--sapContent_ForegroundColor'));
    });
});
