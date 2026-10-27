import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    MicroProcessFlow,
    MicroProcessFlowFocusableItem,
    MicroProcessFlowIcon,
    MicroProcessFlowIntermediaryItem,
    MicroProcessFlowItem
} from './micro-process-flow';

@Component({
    imports: [
        MicroProcessFlow,
        MicroProcessFlowItem,
        MicroProcessFlowIcon,
        MicroProcessFlowFocusableItem,
        MicroProcessFlowIntermediaryItem
    ],
    template: `
        <button id="before">Before</button>
        <fd-micro-process-flow [transitionSpeed]="0" [independentSteps]="independent()">
            @for (step of steps(); track step; let first = $first) {
                <fd-micro-process-flow-item [state]="first ? 'positive' : 'none'" [intermediate]="first">
                    <fd-micro-process-flow-icon
                        fd-micro-process-flow-focusable-item
                        glyph="pending"
                        [ariaLabel]="'Step ' + step"
                        [attr.data-step]="step"
                    />
                    <span fd-micro-process-flow-intermediary-item>between</span>
                </fd-micro-process-flow-item>
            }
        </fd-micro-process-flow>
        <button id="after">After</button>
    `
})
class Host {
    readonly steps = signal([1, 2, 3]);
    readonly independent = signal(false);
}

async function setup(count = 3) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.steps.set(Array.from({ length: count }, (_, i) => i + 1));
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        fixture,
        root,
        icons: () => [...root.querySelectorAll<HTMLElement>('fd-micro-process-flow-icon')],
        tabbable: () =>
            [...root.querySelectorAll<HTMLElement>('fd-micro-process-flow-icon')]
                .filter((icon) => icon.tabIndex === 0)
                .map((icon) => Number(icon.dataset['step'])),
        links: () => [...root.querySelectorAll('[role=button]')].map((b) => b.getAttribute('aria-label'))
    };
}

describe('MicroProcessFlow', () => {
    it('joins the steps with connectors, but not after the last', async () => {
        const { root, fixture } = await setup();
        const items = root.querySelectorAll('fd-micro-process-flow-item');
        expect(items[0].textContent).toContain('between');
        expect(items[2].textContent).not.toContain('between');
        // the intermediate connector draws a mark; independent steps hide the lines
        const connector = items[0].querySelector<HTMLElement>('[class*="before:border-b"]')!;
        expect(connector.className).toContain('after:bg-sap-negative-element-color');
        fixture.componentInstance.independent.set(true);
        await fixture.whenStable();
        expect(connector.className).toContain('before:border-transparent');
        expect(root.querySelector('fd-icon')!.getAttribute('aria-label')).toBe('Step 1');
    });

    it('is one tab stop; Left and Right move between the steps', async () => {
        const { fixture, root, tabbable } = await setup();
        expect(tabbable()).toEqual([1, 2, 3]);
        root.querySelector<HTMLElement>('#before')!.focus();
        await userEvent.tab();
        await fixture.whenStable();
        expect(document.activeElement!.getAttribute('data-step')).toBe('1');
        // inside the flow no step is in the tab order, so Tab leaves it
        expect(tabbable()).toEqual([]);
        await userEvent.keyboard('{ArrowRight}{ArrowRight}');
        expect(document.activeElement!.getAttribute('data-step')).toBe('3');
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement!.getAttribute('data-step')).toBe('3');
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement!.getAttribute('data-step')).toBe('2');
        await userEvent.tab();
        await fixture.whenStable();
        expect(document.activeElement!.id).toBe('after');
        expect(tabbable()).toEqual([1, 2, 3]);
    });

    it('shows how many steps are hidden and scrolls to them', async () => {
        const { fixture, root, tabbable, links } = await setup(20);
        expect(links()).toHaveLength(1);
        const hidden = Number(links()[0]!.split(' ')[0]);
        const visible = tabbable();
        expect(visible[0]).toBe(1);
        expect(visible.length + hidden).toBe(20);
        await userEvent.click(root.querySelector('[aria-label$="next steps"]')!);
        await fixture.whenStable();
        // the previous link takes room too
        expect(links()[0]).toBe('1 previous steps');
        expect(tabbable()[0]).toBe(2);
        expect(1 + tabbable().length + Number(links()[1]!.split(' ')[0])).toBe(20);
        await userEvent.click(root.querySelector('[aria-label$="previous steps"]')!);
        await fixture.whenStable();
        expect(links()).toEqual([`${hidden} next steps`]);
    });

    it('scrolls a step into view when the arrow keys reach it', async () => {
        const { fixture, icons, links } = await setup(20);
        const visible = 20 - Number(links()[0]!.split(' ')[0]);
        icons()[0].focus();
        for (let i = 0; i < visible; i++) await userEvent.keyboard('{ArrowRight}');
        await fixture.whenStable();
        expect(document.activeElement!.getAttribute('data-step')).toBe(String(visible + 1));
        expect(links()[0]).toBe('1 previous steps');
        const flow = icons()[0].closest('fd-micro-process-flow')!.getBoundingClientRect();
        const focused = document.activeElement!.getBoundingClientRect();
        expect(focused.right).toBeLessThanOrEqual(flow.right);
    });
});
