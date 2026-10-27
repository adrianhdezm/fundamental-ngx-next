import { Component, afterNextRender, input, signal, viewChild } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { ActionSheet, ActionSheetBody, ActionSheetControl, ActionSheetItem } from './action-sheet';

@Component({
    selector: 'story-action-sheet',
    imports: [ActionSheet, ActionSheetBody, ActionSheetControl, ActionSheetItem, Button],
    template: `
        <div class="relative">
            <fd-action-sheet [mobile]="mobile()" controlTitle="Choose an action" [(isOpen)]="open" #sheet>
                <fd-action-sheet-control>
                    <button
                        fdButton
                        glyph="settings"
                        [ariaLabel]="mobile() ? 'Open action sheet (mobile)' : 'Open action sheet'"
                        [title]="'Open action sheet'"
                        [id]="id + '-control'"
                        aria-haspopup="menu"
                        [attr.aria-expanded]="open()"
                        [attr.aria-controls]="id + '-body'"
                    ></button>
                </fd-action-sheet-control>
                <fd-action-sheet-body [actionSheetBodyId]="id + '-body'" [ariaLabelledby]="id + '-control'">
                    <li fd-action-sheet-item label="Search" glyph="search" (click)="picked('Search', sheet)"></li>
                    <li fd-action-sheet-item label="Download" glyph="download" (click)="picked('Download', sheet)"></li>
                    <li fd-action-sheet-item label="Accept" glyph="accept" (click)="picked('Accept', sheet)"></li>
                    <li fd-action-sheet-item label="Reject" glyph="cancel" disabled></li>
                    <li fd-action-sheet-item label="Decide later" isCloseButton></li>
                    @if (mobile()) {
                        <li fd-action-sheet-item label="Cancel" negative isCloseButton></li>
                    }
                </fd-action-sheet-body>
            </fd-action-sheet>
        </div>
        <p class="font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">{{ last() }}</p>
    `
})
class StoryActionSheet {
    readonly mobile = input(false);
    readonly autoOpen = input(false);
    protected readonly id = `story-sheet-${Math.random().toString(36).slice(2, 7)}`;
    protected readonly open = signal(false);
    protected readonly last = signal('');
    private readonly sheet = viewChild.required(ActionSheet);
    constructor() {
        afterNextRender(() => this.autoOpen() && setTimeout(() => this.sheet().open(), 50));
    }
    protected picked(action: string, sheet: ActionSheet): void {
        this.last.set(`${action} action performed`);
        sheet.close();
    }
}

const meta: Meta<ActionSheet> = {
    title: 'Components/Action Sheet',
    component: ActionSheet,
    decorators: [moduleMetadata({ imports: [StoryActionSheet] })],
    parameters: {
        docs: {
            story: { inline: false, iframeHeight: 420 },
            description: {
                component:
                    'An action sheet lists the actions for the control that opens it: in a popover, or in mobile mode in a sheet at the bottom of the screen. ' +
                    'ArrowUp/ArrowDown, Home and End move between the actions; Escape and Tab close it and the focus returns to the control. Close buttons close it when chosen.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<ActionSheet>;

export const Default: Story = { name: 'Action sheet', render: () => ({ template: `<story-action-sheet />` }) };
export const Mobile: Story = { name: 'Mobile', render: () => ({ template: `<story-action-sheet [mobile]="true" />` }) };
export const OpenDefault: Story = {
    name: 'Open: action sheet',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-action-sheet [autoOpen]="true" />` })
};
export const OpenMobile: Story = {
    name: 'Open: mobile',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-action-sheet [mobile]="true" [autoOpen]="true" />` })
};
