import { Component, TemplateRef, inject, signal } from '@angular/core';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '@/ui/button/button';
import { FormControl } from '@/ui/input/input';
import { MessageToastService } from '@/ui/message-toast/message-toast';
import { BusyIndicator, BusyIndicatorExtended } from './busy-indicator';

/** Opens an extended busy indicator in a message toast that stays until "Hide all". */
@Component({
    selector: 'story-busy-indicator-toast',
    imports: [BusyIndicator, BusyIndicatorExtended, Button],
    host: { class: 'flex flex-wrap gap-2' },
    template: `
        <button fdButton label="Open from template" (click)="open(template)"></button>
        <button fdButton variant="emphasized" label="Hide all" (click)="toasts.hideAll()"></button>
        <ng-template #template>
            <div fdBusyIndicatorExtended>
                <fd-busy-indicator loading contrast ariaLabel="Loading" title="Please wait" ariaValueText="Busy" />
            </div>
        </ng-template>
    `
})
class StoryBusyIndicatorToast {
    protected readonly toasts = inject(MessageToastService);
    protected open(template: TemplateRef<unknown>): void {
        this.toasts.open(template, { mousePersist: true, duration: 0 });
    }
}

const meta: Meta<BusyIndicator> = {
    title: 'Components/Busy Indicator',
    component: BusyIndicator,
    decorators: [
        moduleMetadata({
            imports: [BusyIndicator, BusyIndicatorExtended, Button, FormControl, StoryBusyIndicatorToast]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'The busy indicator shows that an action or a part of the page is loading. It is a progressbar ' +
                    'with an accessible name; wrapped content is covered and taken out of keyboard reach while loading.'
            }
        }
    },
    argTypes: { size: { control: 'inline-radio', options: ['s', 'm', 'l'] } },
    args: { loading: true, size: 'm', ariaLabel: 'Loading', label: '' }
};
export default meta;
type Story = StoryObj<BusyIndicator>;

export const Playground: Story = {
    render: (args) => ({ props: args, template: `<fd-busy-indicator ${argsToTemplate(args)} />` })
};

export const Basic: Story = {
    render: () => ({
        template: `<div class="text-center"><fd-busy-indicator loading ariaLabel="Loading" title="Please wait" /></div>`
    })
};

export const Sizes: Story = {
    render: () => ({
        props: { sizes: ['s', 'm', 'l'] },
        template: `
            <div class="flex flex-col gap-6">
                @for (size of sizes; track size) {
                    <div class="text-center"><fd-busy-indicator loading [size]="size" [ariaLabel]="size + ' size loading'" ariaValueText="Busy" /></div>
                }
            </div>`
    })
};

export const Contrast: Story = {
    render: () => ({
        template: `<div class="rounded-sap-element-border-corner-radius bg-sap-shell-interactive-text-color p-6 text-center"><fd-busy-indicator loading contrast ariaLabel="Loading" /></div>`
    })
};

export const Wrapper: Story = {
    name: 'As a wrapper',
    parameters: {
        docs: {
            description: {
                story: 'While loading, the wrapped content is covered and Tab skips over it. Toggle loading to interact with the form.'
            }
        }
    },
    render: () => ({
        props: { loading: signal(true) },
        template: `
            <h5 id="busy-label-1" class="mb-2 font-sap-font-header-family text-sap-font-header5-size text-sap-title-color">Busy Indicator as a block wrapper</h5>
            <fd-busy-indicator [loading]="loading()" block aria-labelledby="busy-label-1" ariaValueText="Busy">
                <form class="flex max-w-sm flex-col gap-2 p-2">
                    <label for="bi-name" class="text-sap-content-label-color">Name:</label>
                    <input fdFormControl id="bi-name" />
                    <label for="bi-surname" class="text-sap-content-label-color">Surname:</label>
                    <input fdFormControl id="bi-surname" />
                    <label for="bi-password" class="text-sap-content-label-color">Password:</label>
                    <input fdFormControl id="bi-password" type="password" />
                </form>
            </fd-busy-indicator>

            <h5 id="busy-label-2" class="mb-2 mt-6 font-sap-font-header-family text-sap-font-header5-size text-sap-title-color">Busy Indicator as an inline wrapper</h5>
            <fd-busy-indicator [loading]="loading()" size="s" aria-labelledby="busy-label-2" ariaValueText="Busy">
                <button fdButton label="Save"></button>
            </fd-busy-indicator>

            <div class="mt-6"><button fdButton [label]="loading() ? 'Disable loading' : 'Enable loading'" (click)="loading.set(!loading())"></button></div>
        `
    })
};

export const Extended: Story = {
    name: 'With label (extended)',
    render: () => ({
        template: `
            <div fdBusyIndicatorExtended class="w-[23.125rem] rounded-sap-element-border-corner-radius bg-sap-page-footer-background shadow-sap-content-shadow2">
                <fd-busy-indicator loading ariaLabel="Loading" label="Loading data..." ariaValueText="Busy" />
            </div>`
    })
};

export const WithMessageToast: Story = {
    name: 'With message toast',
    parameters: {
        docs: {
            description: {
                story: 'An extended busy indicator in a message toast opened from a template. The toast stays open until "Hide all".'
            }
        }
    },
    render: () => ({ template: `<story-busy-indicator-toast />` })
};

export const OpenMessageToast: Story = {
    name: 'Open: message toast',
    tags: ['!autodocs'],
    render: WithMessageToast.render,
    play: async ({ canvasElement }) => {
        await userEvent.click(canvasElement.querySelector<HTMLElement>('button')!);
        await waitFor(() => expect(document.querySelector('fd-message-toast [role=progressbar]')).not.toBeNull());
    }
};
