import { Component, signal } from '@angular/core';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '@/ui/button/button';
import { ProgressIndicator } from './progress-indicator';

const box = 'flex max-w-xl flex-col gap-2';

@Component({
    selector: 'story-progress-animation',
    imports: [ProgressIndicator, Button],
    template: `
        <div class="${box}">
            <fd-progress-indicator animate ariaLabel="Upload" [valueNow]="value()" />
            <div class="flex gap-2">
                <button fdButton label="-10" (click)="value.set(Math.max(0, value() - 10))"></button>
                <button fdButton label="+10" (click)="value.set(Math.min(100, value() + 10))"></button>
            </div>
        </div>
    `
})
class StoryProgressAnimation {
    protected readonly Math = Math;
    protected readonly value = signal(30);
}

const meta: Meta<ProgressIndicator> = {
    title: 'Components/Progress Indicator',
    component: ProgressIndicator,
    decorators: [moduleMetadata({ imports: [ProgressIndicator, StoryProgressAnimation] })],
    parameters: {
        docs: {
            description: {
                component:
                    'A bar that shows the progress of a task with its value (or a text) above it and an icon for a value state. ' +
                    'A text that does not fit is truncated and shows in full in a popover on click. Give it an accessible name with `ariaLabel` or `ariaLabelledBy`.'
            }
        }
    },
    argTypes: { state: { control: 'select', options: [null, 'informative', 'positive', 'critical', 'negative'] } },
    args: { valueNow: 42, valueMin: 0, valueMax: 100, ariaLabel: 'Progress', animate: false }
};
export default meta;
type Story = StoryObj<ProgressIndicator>;

export const Playground: Story = {
    render: (args) => ({
        props: args,
        template: `<div class="max-w-xl"><fd-progress-indicator ${argsToTemplate(args)} /></div>`
    })
};

export const Values: Story = {
    render: () => ({
        template: `
            <div class="${box}">
                <fd-progress-indicator ariaLabel="Empty" [valueNow]="0" />
                <fd-progress-indicator ariaLabel="Started" [valueNow]="42" />
                <fd-progress-indicator ariaLabel="Most" [valueNow]="69" />
                <fd-progress-indicator ariaLabel="Done" [valueNow]="100" />
                <fd-progress-indicator ariaLabel="Download" [valueNow]="80" valueText="80 of 100 MB" />
                <fd-progress-indicator ariaLabel="Upload" [valueNow]="25" unit="MB" />
                <fd-progress-indicator ariaLabel="Steps" [valueMin]="1" [valueMax]="5" [valueNow]="3" valueText="Step 3 of 5" />
            </div>
        `
    })
};

export const States: Story = {
    render: () => ({
        template: `
            <div class="${box}">
                <fd-progress-indicator ariaLabel="Neutral" [valueNow]="42" />
                <fd-progress-indicator ariaLabel="Informative" state="informative" [valueNow]="42" />
                <fd-progress-indicator ariaLabel="Positive" state="positive" [valueNow]="42" />
                <fd-progress-indicator ariaLabel="Critical" state="critical" [valueNow]="42" />
                <fd-progress-indicator ariaLabel="Negative" state="negative" [valueNow]="42" />
            </div>
        `
    })
};

const TRUNCATION = `
    <div class="w-56">
        <fd-progress-indicator
            ariaLabel="Import"
            state="informative"
            [valueNow]="35"
            valueText="Importing 35 of 100 records from the customer master data, please wait"
        />
    </div>
`;

export const Truncation: Story = { render: () => ({ template: TRUNCATION }) };

export const OpenTruncation: Story = {
    name: 'Open: Truncation popover',
    tags: ['!autodocs'],
    render: () => ({ template: TRUNCATION }),
    play: async ({ canvasElement }) => {
        let label: HTMLElement | null = null;
        await waitFor(() => {
            label = canvasElement.querySelector<HTMLElement>('fd-progress-indicator fd-popover-control button');
            expect(label).not.toBeNull();
        });
        await userEvent.click(label!);
        await waitFor(() =>
            expect(document.querySelector('.cdk-overlay-container fd-popover-body')?.textContent).toContain(
                'please wait'
            )
        );
    }
};

export const Animation: Story = { render: () => ({ template: `<story-progress-animation />` }) };
