import { Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import {
    Dialog as FdDialog,
    DialogBody,
    DialogCloseButton,
    DialogFooter,
    DialogHeader,
    DialogService,
    DialogTemplate
} from '@/ui/dialog/dialog';
import { Title } from '@/ui/title/title';
import { NO_MAIL, UNABLE_TO_LOAD } from '../../../docs/assets/illustrations';
import {
    IllustratedMessage,
    IllustratedMessageActions,
    IllustratedMessageFigcaption,
    IllustratedMessageText,
    IllustratedMessageTitle
} from './illustrated-message';

const message = (type: string, config = 'noMail', title = 'No mail', extra = '') => `
    <figure fd-illustrated-message ${type ? `type="${type}"` : ''} [svgConfig]="${config}" ${extra}>
        <figcaption fd-illustrated-message-figcaption>
            <h3 fd-illustrated-message-title>${title}</h3>
            <p fd-illustrated-message-text>
                Your inbox is empty. New messages appear here; check again later or refresh.
            </p>
        </figcaption>
        <fd-illustrated-message-actions>
            <button fdButton variant="emphasized" label="Refresh"></button>
            <button fdButton label="Settings"></button>
        </fd-illustrated-message-actions>
    </figure>`;

/** Upstream's medium example: the message in a dialog opened by a button. */
@Component({
    selector: 'story-illustrated-message-dialog',
    imports: [
        IllustratedMessage,
        IllustratedMessageFigcaption,
        IllustratedMessageTitle,
        IllustratedMessageText,
        FdDialog,
        DialogHeader,
        DialogBody,
        DialogFooter,
        DialogTemplate,
        DialogCloseButton,
        Title,
        ButtonBar,
        Button
    ],
    providers: [DialogService],
    template: `
        <ng-template fdDialogTemplate let-dialog let-dialogConfig="dialogConfig" #tpl>
            <fd-dialog [dialogRef]="dialog" [dialogConfig]="dialogConfig">
                <fd-dialog-header>
                    <h1 fd-title id="story-im-dialog-header">Unknown File Format Detected</h1>
                    <button fd-dialog-close-button title="Close" (click)="dialog.dismiss('Close button')"></button>
                </fd-dialog-header>
                <fd-dialog-body>
                    <figure fd-illustrated-message type="medium" [svgConfig]="config">
                        <figcaption fd-illustrated-message-figcaption id="story-im-dialog-description">
                            <h2 fd-illustrated-message-title>Unknown File Format</h2>
                            <p fd-illustrated-message-text>
                                We found some files that have an unknown file format. Let's take a look and fix the
                                issue.
                            </p>
                        </figcaption>
                    </figure>
                </fd-dialog-body>
                <fd-dialog-footer>
                    <fd-button-bar variant="emphasized" label="Add File Format" (click)="dialog.close('Add')" />
                    <fd-button-bar label="Close" (click)="dialog.dismiss('Close button')" />
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>
        <button fdButton label="Open dialog illustrated message" (click)="open()"></button>
        <p class="font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">{{ result() }}</p>
    `
})
class StoryIllustratedMessageDialog {
    protected readonly config = UNABLE_TO_LOAD;
    protected readonly result = signal('');
    private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    private readonly dialogs = inject(DialogService);

    protected open(): void {
        this.dialogs
            .open(this.tpl(), {
                width: '30rem',
                ariaLabelledBy: 'story-im-dialog-header',
                ariaDescribedBy: 'story-im-dialog-description'
            })
            .afterClosed.subscribe({
                next: (r) => this.result.set(`Dialog closed: ${r}`),
                error: (r) => this.result.set(`Dialog dismissed: ${r}`)
            });
    }
}

const meta: Meta<IllustratedMessage> = {
    title: 'Components/Illustrated Message',
    component: IllustratedMessage,
    decorators: [
        moduleMetadata({
            imports: [
                StoryIllustratedMessageDialog,
                IllustratedMessage,
                IllustratedMessageFigcaption,
                IllustratedMessageTitle,
                IllustratedMessageText,
                IllustratedMessageActions,
                Button
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'An illustrated message pairs an SAP illustration with a title, a text and actions, for empty states, errors and onboarding. ' +
                    'Sizes: scene (large), dialog (medium), spot (small), dot (extra small) and base (text only); without a `type` it follows the available width. ' +
                    'Illustrations come from a sprite URL or inline SVG per size (the stories use SAP illustrations from @ui5/webcomponents-fiori).'
            }
        }
    }
};
export default meta;
type Story = StoryObj<IllustratedMessage>;

const props = { noMail: NO_MAIL, unableToLoad: UNABLE_TO_LOAD };

export const Scene: Story = {
    name: 'Scene',
    render: () => ({ props, template: message('scene', 'noMail', 'No mail', 'svgAriaLabel="Empty mailbox"') })
};
export const Dialog: Story = {
    name: 'Dialog',
    render: () => ({ props, template: message('dialog', 'unableToLoad', 'Unable to load data') })
};
export const Spot: Story = { name: 'Spot', render: () => ({ props, template: message('spot') }) };
export const Dot: Story = {
    name: 'Dot',
    render: () => ({ props, template: `<div class="flex items-start gap-4 max-w-sm">${message('dot')}</div>` })
};
export const Responsive: Story = {
    name: 'Responsive (resize the box)',
    render: () => ({
        props,
        template: `<div class="resize-x overflow-hidden border border-dashed border-sap-group-content-border-color" style="width: 30rem">${message('', 'noMail', 'No mail', 'svgAriaLabel="Empty mailbox"')}</div>`
    })
};
export const TextOnly: Story = {
    name: 'Without illustration',
    render: () => ({ props, template: message('dialog', 'noMail', 'No mail', 'noSvg') })
};
export const InDialog: Story = {
    name: 'In a dialog',
    render: () => ({ template: `<story-illustrated-message-dialog />` })
};
export const OpenInDialog: Story = {
    name: 'Open: in a dialog',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-illustrated-message-dialog />` }),
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open dialog illustrated message' }));
        await waitFor(() =>
            expect(document.querySelector('fd-dialog-container [role=dialog] [fd-illustrated-message]')).not.toBeNull()
        );
        const containers = [...document.querySelectorAll<HTMLElement>('fd-dialog-container')];
        await Promise.all(containers.flatMap((c) => c.getAnimations().map((a) => a.finished)));
    }
};
