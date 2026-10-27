import { Component, TemplateRef, inject, input, viewChild } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { Button } from '@/ui/button/button';
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogService } from '@/ui/dialog/dialog';
import { ButtonBar } from '@/ui/bar/bar';
import { Link } from '@/ui/link/link';
import { Popover, PopoverBody, PopoverControl } from '@/ui/popover/popover';
import { Title } from '@/ui/title/title';
import {
    QuickView,
    QuickViewGroup,
    QuickViewGroupItem,
    QuickViewGroupItemContent,
    QuickViewGroupItemContentElement,
    QuickViewGroupItemLabel,
    QuickViewGroupTitle,
    QuickViewSubheader,
    QuickViewSubheaderSubtitle,
    QuickViewSubheaderTitle,
    QuickViewTitle
} from './quick-view';

const PARTS = [
    QuickView,
    QuickViewTitle,
    QuickViewSubheader,
    QuickViewSubheaderTitle,
    QuickViewSubheaderSubtitle,
    QuickViewGroup,
    QuickViewGroupTitle,
    QuickViewGroupItem,
    QuickViewGroupItemLabel,
    QuickViewGroupItemContent,
    QuickViewGroupItemContentElement,
    Avatar,
    Link
];

const DATA = {
    title: 'Employee',
    subHeader: { title: 'Ann Smith', subtitle: 'Senior sales manager' },
    groups: [
        {
            title: 'Contact details',
            items: [
                { label: 'Mobile', value: '+1 202 555 0175', href: 'tel:+12025550175' },
                { label: 'Phone', value: '+1 202 555 0123', href: 'tel:+12025550123' },
                { label: 'Email', value: 'ann.smith@example.com', href: 'mailto:ann.smith@example.com' }
            ]
        },
        {
            title: 'Company',
            items: [
                { label: 'Name', value: 'Example Corp.' },
                { label: 'Address', value: '481 West Street, Anytown 45066, USA' }
            ]
        }
    ]
};

@Component({
    selector: 'story-quick-view',
    imports: PARTS,
    template: `
        <fd-quick-view>
            @if (withTitle()) {
                <fd-quick-view-title [align]="align()">{{ data.title }}</fd-quick-view-title>
            }
            <fd-quick-view-subheader>
                <fd-avatar size="s" [label]="data.subHeader.title" />
                <fd-quick-view-subheader-title>{{ data.subHeader.title }}</fd-quick-view-subheader-title>
                <fd-quick-view-subheader-subtitle>{{ data.subHeader.subtitle }}</fd-quick-view-subheader-subtitle>
            </fd-quick-view-subheader>
            @for (group of data.groups; track group.title) {
                <fd-quick-view-group>
                    <fd-quick-view-group-title>{{ group.title }}</fd-quick-view-group-title>
                    @for (item of group.items; track item.label) {
                        <fd-quick-view-group-item>
                            <fd-quick-view-group-item-label>{{ item.label }}</fd-quick-view-group-item-label>
                            <fd-quick-view-group-item-content>
                                @if (item.href) {
                                    <a fdLink fd-quick-view-group-item-content-element [href]="item.href">{{
                                        item.value
                                    }}</a>
                                } @else {
                                    <div fd-quick-view-group-item-content-element>{{ item.value }}</div>
                                }
                            </fd-quick-view-group-item-content>
                        </fd-quick-view-group-item>
                    }
                </fd-quick-view-group>
            }
        </fd-quick-view>
    `
})
class StoryQuickView {
    readonly withTitle = input(false);
    readonly align = input<'left' | 'middle' | 'right'>('middle');
    protected readonly data = DATA;
}

@Component({
    selector: 'story-quick-view-overlays',
    imports: [
        StoryQuickView,
        Popover,
        PopoverBody,
        PopoverControl,
        Button,
        Dialog,
        DialogHeader,
        DialogBody,
        DialogFooter,
        ButtonBar,
        Title
    ],
    providers: [DialogService],
    host: { class: 'flex flex-wrap gap-2' },
    template: `
        <fd-popover placement="right-start" [noArrow]="false">
            <fd-popover-control><button fdButton label="Open in a popover"></button></fd-popover-control>
            <fd-popover-body class="max-w-[37.5rem]">
                <story-quick-view [withTitle]="true" />
            </fd-popover-body>
        </fd-popover>
        <button fdButton label="Open in a dialog" (click)="open()"></button>
        <ng-template #tpl let-dialog>
            <fd-dialog>
                <fd-dialog-header><h1 fd-title fdTitle>Employee</h1></fd-dialog-header>
                <fd-dialog-body><story-quick-view /></fd-dialog-body>
                <fd-dialog-footer
                    ><fd-button-bar variant="emphasized" label="Close" (click)="dialog.close()"
                /></fd-dialog-footer>
            </fd-dialog>
        </ng-template>
    `
})
class StoryQuickViewOverlays {
    private readonly dialogs = inject(DialogService);
    private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    protected open(): void {
        this.dialogs.open(this.tpl(), { width: '25rem', ariaLabel: 'Employee' });
    }
}

const meta: Meta<QuickView> = {
    title: 'Components/Quick View',
    component: QuickView,
    decorators: [moduleMetadata({ imports: [StoryQuickView, StoryQuickViewOverlays] })],
    parameters: {
        docs: {
            description: {
                component:
                    'A quick view gives a short overview of a person, an object or a company: an optional header, a subheader with an avatar, and groups of label-value pairs. ' +
                    'Values marked `fd-quick-view-group-item-content-element` are labelled by their label. Use it in a popover or a dialog.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<QuickView>;

export const Default: Story = {
    name: 'Quick view',
    render: () => ({ template: `<story-quick-view class="block max-w-sm" />` })
};
export const WithTitle: Story = {
    name: 'With header',
    render: () => ({ template: `<story-quick-view class="block max-w-sm" [withTitle]="true" align="left" />` })
};
export const Overlays: Story = {
    name: 'In a popover or a dialog',
    parameters: { docs: { story: { inline: false, iframeHeight: 560 } } },
    render: () => ({ template: `<story-quick-view-overlays />` })
};
