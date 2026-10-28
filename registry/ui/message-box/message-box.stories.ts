import { Component, TemplateRef, inject, input, signal, viewChild } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { BarElement, BarLeft, BarRight, ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { Title } from '@/ui/title/title';
import {
    MessageBox,
    MessageBoxBody,
    MessageBoxFooter,
    MessageBoxHeader,
    MessageBoxRef,
    MessageBoxSemanticIcon,
    MessageBoxService,
    MessageBoxTemplate,
    type MessageBoxConfig,
    type MessageBoxType
} from './message-box';

const PARTS = [
    MessageBox,
    MessageBoxHeader,
    MessageBoxBody,
    MessageBoxFooter,
    MessageBoxSemanticIcon,
    MessageBoxTemplate,
    Title,
    ButtonBar,
    Button
];
const TEXT = 'font-sap-font-family text-sap-font-size text-sap-text-color';

function report(ref: MessageBoxRef, set: (text: string) => void): void {
    ref.afterClosed.subscribe({
        next: (value) => set(`Message box closed with result: ${value}`),
        error: (reason) => set(`Message box dismissed with result: ${reason}`)
    });
}

@Component({
    selector: 'story-message-box',
    imports: PARTS,
    providers: [MessageBoxService],
    host: { class: 'flex flex-wrap items-center gap-2' },
    template: `
        <ng-template fdMessageBoxTemplate let-messageBox #tpl>
            <fd-message-box>
                <fd-message-box-header>
                    <h1 fd-title>{{ messageBox.data.title }}</h1>
                </fd-message-box-header>
                <fd-message-box-body>{{ messageBox.data.text }}</fd-message-box-body>
                <fd-message-box-footer>
                    <fd-button-bar variant="emphasized" label="OK" (click)="messageBox.close('OK')" />
                    <fd-button-bar label="Cancel" (click)="messageBox.dismiss('Cancel')" />
                </fd-message-box-footer>
            </fd-message-box>
        </ng-template>
        @for (action of actions(); track action.label) {
            <button fdButton [label]="action.label" (click)="open(action.config)"></button>
        }
        <p class="m-0 w-full ${TEXT}" aria-live="polite">{{ status() }}</p>
    `
})
class StoryMessageBox {
    readonly kind = input<'template' | 'types' | 'position' | 'mobile'>('template');
    private readonly service = inject(MessageBoxService);
    private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    protected readonly status = signal('');

    protected actions(): { label: string; config: MessageBoxConfig }[] {
        const text = 'Pineapples are tropical fruits. Do you want to read more about them?';
        switch (this.kind()) {
            case 'types':
                return (['confirmation', 'error', 'success', 'warning', 'information'] as MessageBoxType[]).map(
                    (type) => ({
                        label: type[0].toUpperCase() + type.slice(1),
                        config: {
                            type,
                            showSemanticIcon: true,
                            width: '22rem',
                            data: {
                                title: type[0].toUpperCase() + type.slice(1),
                                text: `A message box of type ${type}.`
                            }
                        }
                    })
                );
            case 'position':
                return [
                    {
                        label: 'Open at the top',
                        config: { position: { top: '2rem' }, width: '22rem', data: { title: 'Positioned', text } }
                    }
                ];
            case 'mobile':
                return [
                    {
                        label: 'Open in mobile mode',
                        config: {
                            mobile: true,
                            type: 'warning',
                            showSemanticIcon: true,
                            data: { title: 'Mobile', text }
                        }
                    }
                ];
            default:
                return [
                    { label: 'Open from template', config: { width: '24rem', data: { title: 'Pineapples', text } } }
                ];
        }
    }

    protected open(config: MessageBoxConfig): void {
        report(this.service.open(this.tpl(), config), (t) => this.status.set(t));
    }
}

/** A message box component; it injects its ref. */
@Component({
    imports: PARTS,
    template: `
        <fd-message-box>
            <fd-message-box-header>
                <fd-message-box-semantic-icon glyph="cart" />
                <h1 fd-title>Checkout</h1>
            </fd-message-box-header>
            <fd-message-box-body>
                <p class="m-0">Your cart holds {{ ref.data.count }} items. Continue to checkout?</p>
            </fd-message-box-body>
            <fd-message-box-footer>
                <fd-button-bar variant="emphasized" label="Checkout" (click)="ref.close('checkout')" />
                <fd-button-bar label="Cancel" (click)="ref.dismiss('cancel')" />
            </fd-message-box-footer>
        </fd-message-box>
    `
})
class StoryMessageBoxContent {
    protected readonly ref = inject<MessageBoxRef<{ count: number }>>(MessageBoxRef);
}

/** A custom header and footer. */
@Component({
    imports: [...PARTS, BarLeft, BarRight, BarElement],
    template: `
        <fd-message-box>
            <fd-message-box-header>
                <div fd-bar-left>
                    <fd-bar-element><h1 fd-title>Complex message box</h1></fd-bar-element>
                </div>
                <div fd-bar-right>
                    <fd-bar-element
                        ><fd-button-bar glyph="decline" ariaLabel="Close" (click)="ref.dismiss('x')"
                    /></fd-bar-element>
                </div>
            </fd-message-box-header>
            <fd-message-box-body>
                <p class="m-0">Headers and footers can hold their own bar areas.</p>
            </fd-message-box-body>
            <fd-message-box-footer>
                <div fd-bar-left><fd-bar-element>3 of 5 steps done</fd-bar-element></div>
                <div fd-bar-right>
                    <fd-button-bar variant="emphasized" label="Continue" (click)="ref.close('next')" />
                </div>
            </fd-message-box-footer>
        </fd-message-box>
    `
})
class StoryMessageBoxComplex {
    protected readonly ref = inject(MessageBoxRef);
}

@Component({
    selector: 'story-message-box-other',
    imports: [Button],
    providers: [MessageBoxService],
    host: { class: 'flex flex-wrap items-center gap-2' },
    template: `
        <button fdButton label="Open from component" (click)="component()"></button>
        <button fdButton label="Open from object" (click)="object()"></button>
        <button fdButton label="Open with custom header and footer" (click)="complex()"></button>
        <p class="m-0 w-full ${TEXT}" aria-live="polite">{{ status() }}</p>
    `
})
class StoryMessageBoxOther {
    private readonly service = inject(MessageBoxService);
    protected readonly status = signal('');
    protected component(): void {
        report(this.service.open(StoryMessageBoxContent, { data: { count: 3 }, width: '22rem' }), (t) =>
            this.status.set(t)
        );
    }
    protected object(): void {
        const ref: MessageBoxRef = this.service.open(
            {
                title: 'Delete order',
                content: 'The order 4711 will be deleted permanently. Do you want to continue?',
                approveButton: 'Delete',
                approveButtonCallback: () => ref.close('Deleted'),
                cancelButton: 'Cancel',
                cancelButtonCallback: () => ref.dismiss('Canceled')
            },
            { type: 'confirmation', showSemanticIcon: true, width: '24rem' }
        );
        report(ref, (t) => this.status.set(t));
    }
    protected complex(): void {
        report(this.service.open(StoryMessageBoxComplex, { width: '26rem' }), (t) => this.status.set(t));
    }
}

const meta: Meta<MessageBox> = {
    title: 'Components/Message Box',
    component: MessageBox,
    decorators: [moduleMetadata({ imports: [StoryMessageBox, StoryMessageBoxOther] })],
    parameters: {
        docs: {
            story: { inline: false, iframeHeight: 420 },
            description: {
                component:
                    'A message box is a modal alert dialog for messages that need a decision: errors, warnings, successes, information and confirmations. ' +
                    'Open it with the `MessageBoxService` from a template, a component or a content object. The semantic type colours the header shadow and the optional icon. ' +
                    'It traps the focus, closes on Escape and returns the focus when it closes.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<MessageBox>;

export const TemplateBased: Story = { name: 'Template-based', render: () => ({ template: `<story-message-box />` }) };
export const Others: Story = {
    name: 'Component, object and custom layout',
    render: () => ({ template: `<story-message-box-other />` })
};
export const Types: Story = {
    name: 'Semantic types',
    render: () => ({ template: `<story-message-box kind="types" />` })
};
export const Position: Story = {
    name: 'Custom position',
    render: () => ({ template: `<story-message-box kind="position" />` })
};
export const Mobile: Story = { name: 'Mobile', render: () => ({ template: `<story-message-box kind="mobile" />` }) };

/** Clicks the button with this label and waits until the message box has faded in. */
async function openMessageBox(canvasElement: HTMLElement, label: string): Promise<void> {
    const button = [...canvasElement.querySelectorAll<HTMLElement>('button')].find(
        (b) => b.textContent!.trim() === label
    )!;
    await userEvent.click(button);
    await waitFor(() => expect(document.querySelector('fd-dialog-container [role=alertdialog]')).not.toBeNull());
    const container = document.querySelector<HTMLElement>('fd-dialog-container')!;
    await Promise.all(container.getAnimations().map((a) => a.finished));
}

export const OpenConfirmation: Story = {
    name: 'Open: confirmation',
    tags: ['!autodocs'],
    render: Types.render,
    play: ({ canvasElement }) => openMessageBox(canvasElement, 'Confirmation')
};
export const OpenError: Story = {
    name: 'Open: error',
    tags: ['!autodocs'],
    render: Types.render,
    play: ({ canvasElement }) => openMessageBox(canvasElement, 'Error')
};
export const OpenSuccess: Story = {
    name: 'Open: success',
    tags: ['!autodocs'],
    render: Types.render,
    play: ({ canvasElement }) => openMessageBox(canvasElement, 'Success')
};
export const OpenWarning: Story = {
    name: 'Open: warning',
    tags: ['!autodocs'],
    render: Types.render,
    play: ({ canvasElement }) => openMessageBox(canvasElement, 'Warning')
};
export const OpenInformation: Story = {
    name: 'Open: information',
    tags: ['!autodocs'],
    render: Types.render,
    play: ({ canvasElement }) => openMessageBox(canvasElement, 'Information')
};
export const OpenObject: Story = {
    name: 'Open: object',
    tags: ['!autodocs'],
    render: Others.render,
    play: ({ canvasElement }) => openMessageBox(canvasElement, 'Open from object')
};
export const OpenComponent: Story = {
    name: 'Open: component',
    tags: ['!autodocs'],
    render: Others.render,
    play: ({ canvasElement }) => openMessageBox(canvasElement, 'Open from component')
};
export const OpenComplex: Story = {
    name: 'Open: custom header and footer',
    tags: ['!autodocs'],
    render: Others.render,
    play: ({ canvasElement }) => openMessageBox(canvasElement, 'Open with custom header and footer')
};
export const OpenPosition: Story = {
    name: 'Open: position',
    tags: ['!autodocs'],
    render: Position.render,
    play: ({ canvasElement }) => openMessageBox(canvasElement, 'Open at the top')
};
export const OpenMobile: Story = {
    name: 'Open: mobile',
    tags: ['!autodocs'],
    render: Mobile.render,
    play: ({ canvasElement }) => openMessageBox(canvasElement, 'Open in mobile mode')
};
