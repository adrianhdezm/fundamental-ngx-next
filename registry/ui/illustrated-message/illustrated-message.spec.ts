import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
    IllustratedMessage,
    IllustratedMessageFigcaption,
    IllustratedMessageText,
    IllustratedMessageTitle,
    type IllustratedMessageType,
    type SvgConfig
} from './illustrated-message';

const svg = (id: string) => `<svg id="${id}" viewBox="0 0 10 10"><rect width="10" height="10" /></svg>`;
const CONFIG: SvgConfig = {
    scene: { id: 'test-scene', file: svg('test-scene') },
    dialog: { id: 'test-dialog', file: svg('test-dialog') },
    spot: { id: 'test-spot', url: '/sprite.svg' },
    dot: { id: 'test-dot', file: svg('test-dot') }
};

@Component({
    imports: [IllustratedMessage, IllustratedMessageFigcaption, IllustratedMessageTitle, IllustratedMessageText],
    template: `
        <div [style.width]="width()">
            <figure fd-illustrated-message [type]="type()" [svgConfig]="config" [svgAriaLabel]="label()">
                <figcaption fd-illustrated-message-figcaption>
                    <h3 fd-illustrated-message-title>Title</h3>
                    <p fd-illustrated-message-text>Text</p>
                </figcaption>
            </figure>
        </div>
    `
})
class Host {
    readonly config = CONFIG;
    readonly type = signal<IllustratedMessageType | null>('dialog');
    readonly width = signal('60rem');
    readonly label = signal<string | null>(null);
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, figure: el.querySelector('figure')! };
}

describe('IllustratedMessage', () => {
    it('shows the illustration of its size from inline SVG or a sprite URL', async () => {
        const { fixture, host, figure } = await setup();
        expect(figure.querySelector('use')!.getAttribute('href')).toBe('#test-dialog');
        expect(figure.querySelector('#test-dialog')).not.toBeNull();
        expect(figure.querySelector('svg')!.getBoundingClientRect().width).toBe(160);
        host.type.set('spot');
        await fixture.whenStable();
        expect(figure.querySelector('use')!.getAttribute('href')).toBe('/sprite.svg#test-spot');
    });

    it('is decorative unless the illustration is labelled', async () => {
        const { fixture, host, figure } = await setup();
        expect(figure.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
        host.label.set('Empty mailbox');
        await fixture.whenStable();
        const svgEl = figure.querySelector('svg')!;
        expect(svgEl.getAttribute('role')).toBe('img');
        expect(svgEl.getAttribute('aria-label')).toBe('Empty mailbox');
    });

    it('follows the available width without a type', async () => {
        const { fixture, host, figure } = await setup();
        host.type.set(null);
        await fixture.whenStable();
        await new Promise((r) => setTimeout(r, 50));
        await fixture.whenStable();
        expect(figure.getAttribute('data-size')).toBe('large');
        host.width.set('12rem');
        await fixture.whenStable();
        await new Promise((r) => setTimeout(r, 50));
        await fixture.whenStable();
        expect(figure.getAttribute('data-size')).toBe('xsmall');
    });
});
