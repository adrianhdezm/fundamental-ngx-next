import { Component, TemplateRef, computed, inject, input, viewChild } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
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

const LONG = ' Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio ipsam cupiditate voluptatibus et.';

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
                <fd-quick-view-title [align]="align()">{{ data.title }}{{ suffix() }}</fd-quick-view-title>
            }
            <fd-quick-view-subheader>
                <fd-avatar size="s" [label]="data.subHeader.title" />
                <fd-quick-view-subheader-title [allowWrap]="long()"
                    >{{ data.subHeader.title }}{{ suffix() }}</fd-quick-view-subheader-title
                >
                <fd-quick-view-subheader-subtitle [allowWrap]="long()"
                    >{{ data.subHeader.subtitle }}{{ suffix() }}</fd-quick-view-subheader-subtitle
                >
            </fd-quick-view-subheader>
            @for (group of data.groups; track group.title) {
                <fd-quick-view-group>
                    <fd-quick-view-group-title [allowWrap]="long()"
                        >{{ group.title }}{{ suffix() }}</fd-quick-view-group-title
                    >
                    @for (item of group.items; track item.label) {
                        <fd-quick-view-group-item>
                            <fd-quick-view-group-item-label [allowWrap]="long()"
                                >{{ item.label }}{{ suffix() }}</fd-quick-view-group-item-label
                            >
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
    /** Appends a long text to every title and label, which wrap instead of truncating. */
    readonly long = input(false);
    protected readonly data = DATA;
    protected readonly suffix = computed(() => (this.long() ? LONG : ''));
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
        <fd-popover placement="right-start" [noArrow]="false" bodyAriaLabel="Employee">
            <fd-popover-control><button fdButton label="Open in a popover"></button></fd-popover-control>
            <fd-popover-body class="max-w-[37.5rem]">
                <story-quick-view [withTitle]="true" />
            </fd-popover-body>
        </fd-popover>
        <fd-popover placement="right-start" [noArrow]="false" bodyAriaLabel="Employee">
            <fd-popover-control><button fdButton label="Open without heading"></button></fd-popover-control>
            <fd-popover-body class="max-w-[37.5rem]">
                <story-quick-view />
            </fd-popover-body>
        </fd-popover>
        <button fdButton label="Open in a dialog" (click)="open()"></button>
        <ng-template #tpl let-dialog>
            <fd-dialog>
                <!-- h4: the quick view below starts at heading level 5 -->
                <fd-dialog-header><h4 fd-title>Employee</h4></fd-dialog-header>
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

export const LongTexts: Story = {
    name: 'Long texts',
    parameters: {
        docs: {
            description: {
                story: 'With `allowWrap`, the subheader title and subtitle, group titles and labels wrap instead of truncating. The header bar title still truncates.'
            }
        }
    },
    render: () => ({ template: `<story-quick-view class="block max-w-sm" [withTitle]="true" [long]="true" />` })
};

/** Clicks the button that opens the overlay and waits for the quick view inside it. */
async function openOverlay(canvasElement: HTMLElement, label: string, overlay: string): Promise<void> {
    await userEvent.click(within(canvasElement).getByRole('button', { name: label }));
    await waitFor(() => expect(document.querySelector(`${overlay} fd-quick-view`)).not.toBeNull());
}

export const OpenPopover: Story = {
    name: 'Open: In a popover',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-quick-view-overlays />` }),
    play: ({ canvasElement }) => openOverlay(canvasElement, 'Open in a popover', '.cdk-overlay-pane fd-popover-body')
};
export const OpenDialog: Story = {
    name: 'Open: In a dialog',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-quick-view-overlays />` }),
    play: ({ canvasElement }) => openOverlay(canvasElement, 'Open in a dialog', '[role=dialog]')
};
