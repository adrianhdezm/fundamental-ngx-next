import { Component, inject } from '@angular/core';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '@/ui/button/button';
import { Icon } from '@/ui/icon/icon';
import { AutoDismissMessageStrip, MessageStrip, MessageStripIcon } from './message-strip';
import { MessageStripAlertRef, MessageStripAlertService, type MessageStripAlertPosition } from './message-strip-alert';

const col = 'flex flex-col gap-4';
const INDICATION_COLORS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].flatMap((c) => [c, c + 'b']);

@Component({
    selector: 'story-alert-content',
    template: `Created from a component.
        <button fdButton variant="transparent" data-density="compact" label="Close" (click)="ref.dismiss()"></button>`,
    imports: [Button]
})
class AlertContent {
    protected readonly ref = inject(MessageStripAlertRef);
}

@Component({
    selector: 'story-alerts',
    imports: [Button],
    template: `
        <div class="flex flex-col gap-4">
            <div class="flex flex-wrap gap-2">
                <button fdButton label="Text top-start" (click)="openText('top-start')"></button>
                <button fdButton label="Template top-middle" (click)="openTemplate(template, 'top-middle')"></button>
                <button fdButton label="Component top-end" (click)="openComponent('top-end')"></button>
            </div>
            <div class="flex flex-wrap gap-2">
                <button fdButton label="Text bottom-start" (click)="openText('bottom-start')"></button>
                <button
                    fdButton
                    label="Template bottom-middle"
                    (click)="openTemplate(template, 'bottom-middle')"
                ></button>
                <button fdButton label="Component bottom-end" (click)="openComponent('bottom-end')"></button>
            </div>
            <button
                fdButton
                variant="transparent"
                class="self-start"
                [label]="'Dismiss all (' + alerts.openAlerts().length + ')'"
                (click)="alerts.dismissAll()"
            ></button>
        </div>
        <ng-template #template let-ref>
            Rendered from a template with its own close button.
            <button
                fdButton
                variant="transparent"
                data-density="compact"
                label="Close"
                (click)="ref.dismiss()"
            ></button>
        </ng-template>
    `
})
class AlertsDemo {
    protected readonly alerts = inject(MessageStripAlertService);
    private count = 0;
    private readonly types = ['information', 'success', 'warning', 'error'] as const;

    private strip() {
        return { type: this.types[this.count++ % 4], duration: 8000, mousePersist: true };
    }
    openText(position: MessageStripAlertPosition) {
        this.alerts.open({ position, content: `Text alert #${this.count + 1}`, messageStrip: this.strip() });
    }
    openTemplate(content: never, position: MessageStripAlertPosition) {
        this.alerts.open({ position, content, messageStrip: { ...this.strip(), duration: 0 } });
    }
    openComponent(position: MessageStripAlertPosition) {
        this.alerts.open({
            position,
            content: AlertContent,
            messageStrip: { ...this.strip(), dismissible: false, duration: 0 }
        });
    }
}

const meta: Meta<MessageStrip> = {
    title: 'Components/Message Strip',
    component: MessageStrip,
    decorators: [
        moduleMetadata({ imports: [MessageStrip, MessageStripIcon, AutoDismissMessageStrip, Icon, Button, AlertsDemo] })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Message strips show information about the current context inline, coloured by type or by an indication colour. They can be dismissible, dismiss themselves after a delay, or appear as alerts at the edges of the screen.'
            }
        }
    },
    argTypes: {
        type: { control: 'select', options: [null, 'information', 'success', 'warning', 'error'] },
        indicationColor: { control: 'select', options: [null, ...INDICATION_COLORS] }
    },
    args: { type: 'information', dismissible: true, noIcon: false }
};
export default meta;
type Story = StoryObj<MessageStrip>;

export const Playground: Story = {
    render: (args) => ({
        props: args,
        template: `<fd-message-strip ${argsToTemplate(args)}>A message strip with some information.</fd-message-strip>`
    })
};

export const Types: Story = {
    render: () => ({
        template: `
            <div class="${col}">
                <fd-message-strip type="warning">A dismissible warning message strip.</fd-message-strip>
                <fd-message-strip type="success" [dismissible]="false">A non-dismissible success message strip.</fd-message-strip>
                <fd-message-strip type="information">A dismissible information message strip.</fd-message-strip>
                <fd-message-strip type="error" [dismissible]="false">A non-dismissible error message strip.</fd-message-strip>
                <fd-message-strip>A dismissible normal message strip.</fd-message-strip>
                <fd-message-strip type="warning" noIcon>A dismissible warning message strip without icon.</fd-message-strip>
                <fd-message-strip type="information">
                    A long message wraps onto several lines. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                    eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                    exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </fd-message-strip>
            </div>`
    })
};

export const Widths: Story = {
    render: () => ({
        template: `
            <div class="${col}">
                <fd-message-strip type="warning" noIcon minWidth="200px">Minimum width 200px.</fd-message-strip>
                <fd-message-strip type="success" [dismissible]="false" width="70%">70% wide.</fd-message-strip>
                <fd-message-strip type="information" width="50%">50% wide.</fd-message-strip>
                <fd-message-strip type="error" [dismissible]="false" width="200px">200px wide, so the text wraps.</fd-message-strip>
            </div>`
    })
};

export const IndicationColors: Story = {
    name: 'Indication colors and custom icon',
    render: () => ({
        props: { colors: INDICATION_COLORS },
        template: `
            <div class="${col}">
                <fd-message-strip><fd-icon *fdMessageStripIcon glyph="survey" />A dismissible normal message strip with a custom icon.</fd-message-strip>
                @for (color of colors; track color) {
                    <fd-message-strip [indicationColor]="color">
                        <fd-icon *fdMessageStripIcon glyph="sys-enter-2" />
                        Message strip with indication color "{{ color }}"
                    </fd-message-strip>
                }
            </div>`
    })
};

export const AutoDismiss: Story = {
    name: 'Auto dismiss',
    render: () => ({
        template: `
            <div class="${col}">
                <fd-message-strip #strip="fdAutoDismissMessageStrip" type="information" autoDismiss mousePersist [duration]="5000">
                    Dismissed after 5 seconds, unless the pointer is over it; then 5 seconds after it leaves.
                </fd-message-strip>
                <button fdButton class="self-start" label="Open message strip" (click)="strip.open()"></button>
            </div>`
    })
};

export const Alerts: Story = {
    render: () => ({ template: `<story-alerts />` })
};

export const OpenAlerts: Story = {
    name: 'Open: alerts',
    tags: ['!autodocs'],
    render: Alerts.render,
    play: async ({ canvasElement }) => {
        // one alert per position: text, template and component alerts at the top and the bottom
        const buttons = [...canvasElement.querySelectorAll<HTMLElement>('button')].slice(0, 6);
        for (const button of buttons) await userEvent.click(button);
        await waitFor(() => expect(document.querySelectorAll('fd-message-strip-alert')).toHaveLength(6));
    }
};
