import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    Wizard,
    WizardContent,
    WizardNavigation,
    WizardNextStep,
    WizardProgressBar,
    WizardStep,
    WizardStepIndicator,
    type WizardStepStatus
} from './wizard';

const TEXT = 'Lorem ipsum dolor sit amet. '.repeat(40);

@Component({
    imports: [
        Wizard,
        WizardNavigation,
        WizardProgressBar,
        WizardStep,
        WizardStepIndicator,
        WizardContent,
        WizardNextStep
    ],
    template: `
        <div [style.width]="width()">
            <fd-wizard contentHeight="300px" [appendToWizard]="append()" [displaySummaryStep]="showSummary()">
                <fd-wizard-navigation>
                    <ul fd-wizard-progress-bar size="sm" aria-label="Steps">
                        @for (label of labels(); track label; let i = $index; let last = $last) {
                            <li
                                fd-wizard-step
                                [status]="status()[i]"
                                (statusChange)="changed(i, $event)"
                                [label]="label"
                                [isSummary]="last && withSummary()"
                                [stepClickValidator]="validator()"
                            >
                                <fd-wizard-step-indicator>{{ i + 1 }}</fd-wizard-step-indicator>
                                <fd-wizard-content>
                                    <h3>Content {{ i + 1 }}</h3>
                                    <p>{{ text }}</p>
                                    <fd-wizard-next-step
                                        ><button (click)="go(i + 1)">Next {{ i + 1 }}</button></fd-wizard-next-step
                                    >
                                </fd-wizard-content>
                            </li>
                        }
                    </ul>
                </fd-wizard-navigation>
            </fd-wizard>
        </div>
    `
})
class Host {
    readonly text = TEXT;
    readonly labels = signal(['One', 'Two', 'Three', 'Summary']);
    readonly width = signal('1000px');
    readonly append = signal(true);
    readonly withSummary = signal(true);
    readonly showSummary = signal(false);
    readonly validator = signal<((visited: boolean, completed: boolean) => boolean) | undefined>(undefined);
    readonly status = signal<WizardStepStatus[]>(['current', 'upcoming', 'upcoming', 'upcoming']);
    readonly changes: string[] = [];

    go(step: number): void {
        this.status.update((all) => all.map((_, i) => (i < step ? 'completed' : i === step ? 'current' : 'upcoming')));
    }

    changed(index: number, status: WizardStepStatus): void {
        this.changes.push(`${index}:${status}`);
        this.status.update((all) => all.map((s, i) => (i === index ? status : s)));
    }
}

async function setup(config: Partial<{ append: boolean; width: string; labels: string[]; summary: boolean }> = {}) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.append !== undefined) host.append.set(config.append);
    if (config.width) host.width.set(config.width);
    if (config.labels) {
        host.labels.set(config.labels);
        host.status.set(config.labels.map((_, i) => (i === 0 ? 'current' : 'upcoming')));
    }
    if (config.summary !== undefined) host.withSummary.set(config.summary);
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        await fixture.whenStable();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await fixture.whenStable();
    };
    await stable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        fixture,
        host,
        root,
        stable,
        contents: () => [...root.querySelectorAll('[data-wizard-scroll] h3')].map((h) => h.textContent),
        statuses: () => [...root.querySelectorAll('[fd-wizard-step]')].map((s) => s.getAttribute('data-status')),
        container: (index: number) =>
            root
                .querySelectorAll<HTMLElement>('[fd-wizard-step]')
                [index].querySelector<HTMLElement>('[data-wizard-step-container]')!,
        scroller: () => root.querySelector<HTMLElement>('[data-wizard-scroll]')!
    };
}

describe('Wizard', () => {
    it('shows the steps in a list and the content of the current step', async () => {
        const { root, contents, container } = await setup();
        expect(root.querySelector('fd-wizard')!.getAttribute('role')).toBe('region');
        expect(root.querySelector('nav')!.getAttribute('aria-label')).toBe('Wizard');
        expect(root.querySelector('ul')!.getAttribute('role')).toBe('list');
        // the summary is no step of the progress bar
        expect(root.querySelectorAll<HTMLElement>('[fd-wizard-step]')[3].style.display).toBe('none');
        expect(contents()).toEqual(['Content 1']);
        expect(container(0).getAttribute('aria-current')).toBe('step');
        expect(container(0).tabIndex).toBe(0);
        expect(container(1).tabIndex).toBe(-1);
        expect(container(1).getAttribute('aria-disabled')).toBe('true');
    });

    it('appends the content of the steps as they become current', async () => {
        const { root, host, stable, contents, scroller } = await setup();
        await userEvent.click(root.querySelector('button')!);
        await stable();
        expect(contents()).toEqual(['Content 1', 'Content 2']);
        // the completed step's next button hides and its connector turns active
        const firstStep = root.querySelector('[fd-wizard-step]')!;
        expect(firstStep.querySelector<HTMLElement>('fd-wizard-next-step')?.style.display ?? 'none').toBe('none');
        expect(firstStep.querySelector('span[class*="border-b"]')!.className).toContain(
            'border-sap-content-selected-foreground-color'
        );
        await new Promise((resolve) => setTimeout(resolve, 600));
        expect(scroller().scrollTop).toBeGreaterThan(0);
        // the focus moved into the new step
        expect(document.activeElement!.textContent).toBe('Next 2');
        expect(host.status().slice(0, 2)).toEqual(['completed', 'current']);
    });

    it('goes back to a visited step when it is clicked', async () => {
        const { host, fixture, stable, statuses, container } = await setup();
        host.go(2);
        await stable();
        expect(container(2).getAttribute('aria-disabled')).toBeNull();
        await userEvent.click(container(0));
        await stable();
        expect(statuses()).toEqual(['current', 'upcoming', 'upcoming', 'upcoming']);
        expect(host.status()).toEqual(['current', 'upcoming', 'upcoming', 'upcoming']);
        expect(host.changes).toContain('0:current');
        // an upcoming step that was visited can be clicked again
        await userEvent.click(container(2));
        await stable();
        expect(statuses()[2]).toBe('current');
    });

    it('asks the step click validator', async () => {
        const { host, fixture, stable, statuses, container } = await setup();
        host.go(1);
        host.validator.set(() => false);
        await stable();
        await userEvent.click(container(0));
        await stable();
        expect(statuses()[1]).toBe('current');
    });

    it('moves the focus between visited steps with the arrow keys', async () => {
        const { host, fixture, stable, container, statuses } = await setup();
        host.go(2);
        await stable();
        container(2).focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(container(1));
        await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
        expect(document.activeElement).toBe(container(0));
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(container(1));
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(statuses()[1]).toBe('current');
    });

    it('shows only the current step without appendToWizard', async () => {
        const { host, fixture, stable, contents } = await setup({ append: false });
        host.go(1);
        await stable();
        expect(contents()).toEqual(['Content 2']);
    });

    it('replaces the steps by the summary', async () => {
        const { root, host, fixture, stable, contents } = await setup();
        host.go(3);
        await stable();
        expect(contents()).toEqual(['Content 4']);
        expect(root.querySelector<HTMLElement>('ul')!.style.display).toBe('none');
        host.go(1);
        await stable();
        expect(root.querySelector<HTMLElement>('ul')!.style.display).toBe('');
        expect(contents()).toEqual(['Content 1', 'Content 2', 'Content 3']);
    });

    it('makes the step whose content scrolls to the top current', async () => {
        const { host, fixture, stable, statuses, scroller } = await setup();
        host.go(2);
        await stable();
        await new Promise((resolve) => setTimeout(resolve, 700));
        scroller().scrollTop = 0;
        scroller().dispatchEvent(new Event('scroll'));
        await stable();
        expect(statuses().slice(0, 3)).toEqual(['current', 'upcoming', 'upcoming']);
        expect(host.status()[0]).toBe('current');
    });

    it('stacks steps that do not fit and lists them in the indicator', async () => {
        const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const { root, host, fixture, stable } = await setup({ width: '600px', labels, summary: false });
        host.go(3);
        await stable();
        const steps = [...root.querySelectorAll<HTMLElement>('[fd-wizard-step]')];
        const stacked = steps.filter((step) => step.hasAttribute('data-stacked'));
        expect(stacked.length).toBeGreaterThan(0);
        const labelled = steps.filter((step) => !step.hasAttribute('data-stacked'));
        for (const step of labelled) expect(step.getBoundingClientRect().width).toBeGreaterThanOrEqual(167);
        const trigger = root.querySelector<HTMLElement>('[aria-haspopup=menu]')!;
        expect(trigger.textContent).toContain('Steps');
        await userEvent.click(trigger);
        await stable();
        const items = [...document.querySelectorAll('[fd-action-sheet-item]')].map((item) => item.textContent!.trim());
        expect(items.length).toBeGreaterThan(1);
        expect(items).toContain('C');
    });
});
