import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import {
    MessageToastRef,
    MessageToastService,
    MessageToastTemplate,
    type MessageToastPlacement,
    type MessageToastPosition
} from './message-toast';

@Component({
    template: `<div>{{ ref.data.content }}</div>`
})
class StoryToastContent {
    protected readonly ref = inject<MessageToastRef<{ content: string }>>(MessageToastRef);
}

const TEXT = 'm-0 w-full font-sap-font-family text-sap-font-size text-sap-text-color';

@Component({
    selector: 'story-message-toast',
    imports: [Button, MessageToastTemplate],
    host: { class: 'flex flex-col gap-4' },
    template: `
        <ng-template fdMessageToastTemplate let-toast #tpl>{{ toast.data.content }}</ng-template>
        <div class="flex flex-wrap gap-2">
            <button fdButton label="Open from string" (click)="fromString()"></button>
            <button fdButton label="Open from component" (click)="fromComponent()"></button>
            <button
                fdButton
                label="Open from template"
                (click)="toasts.open(tpl, { data: { content: 'Message toast created from a template.' } })"
            ></button>
            <button
                fdButton
                label="Open animated toast"
                (click)="toasts.open('An animated message toast.', { animated: true, duration: 5000 })"
            ></button>
            <button fdButton variant="emphasized" label="Hide all" (click)="toasts.hideAll()"></button>
        </div>
        <p class="${TEXT}">Positions:</p>
        <div class="flex flex-wrap gap-2">
            @for (p of placements; track p) {
                <button fdButton [label]="p" (click)="at(p)"></button>
            }
            <button fdButton label="Custom position" (click)="at({ top: '6rem', left: '40%' })"></button>
            <button fdButton #bound label="Bound to this button" (click)="atButton()"></button>
        </div>
    `
})
class StoryMessageToast {
    protected readonly toasts = inject(MessageToastService);
    private readonly bound = viewChild.required('bound', { read: ElementRef });
    protected readonly placements: MessageToastPlacement[] = [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right'
    ];
    protected fromString(): void {
        this.toasts.open('Message toast created from a string. It disappears after 5000 ms.', { duration: 5000 });
    }
    protected fromComponent(): void {
        this.toasts.open(StoryToastContent, {
            duration: 7500,
            maxWidth: '25rem',
            data: {
                content:
                    'Message toast created from a component. It stays open while the pointer is over it, has a custom width and disappears after 7500 ms.'
            }
        });
    }
    protected at(
        position: MessageToastPosition,
        label = typeof position === 'string' ? position : 'a custom position'
    ): void {
        this.toasts.open(`Message toast at ${label}.`, { position });
    }
    protected atButton(): void {
        this.at(
            {
                boundTo: this.bound().nativeElement,
                originX: 'center',
                originY: 'top',
                overlayX: 'center',
                overlayY: 'bottom',
                offsetY: -16
            },
            'the button'
        );
    }
}

const meta: Meta = {
    title: 'Components/Message Toast',
    decorators: [moduleMetadata({ imports: [StoryMessageToast] })],
    parameters: {
        docs: {
            story: { inline: false, iframeHeight: 360 },
            description: {
                component:
                    'A message toast shows a short message about an action and disappears by itself (3 s by default; it stays while hovered). ' +
                    'Open it with the `MessageToastService` from a string, a component or a template, at a corner or edge of the screen, a custom place or next to an element. Toasts at the same place stack.'
            }
        }
    }
};
export default meta;

export const Default: StoryObj = { name: 'Message toast', render: () => ({ template: `<story-message-toast />` }) };
