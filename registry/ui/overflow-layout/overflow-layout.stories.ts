import { NgTemplateOutlet } from '@angular/common';
import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Avatar } from '@/ui/avatar/avatar';
import { Bar, BarElement, BarLeft, ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { InfoLabel, type InfoLabelColor } from '@/ui/info-label/info-label';
import { Link } from '@/ui/link/link';
import { Popover, PopoverBody, PopoverBodyHeader, PopoverControl } from '@/ui/popover/popover';
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
} from '@/ui/quick-view/quick-view';
import { Title } from '@/ui/title/title';
import { OverflowExpand, OverflowItemRef, OverflowLayout, OverflowLayoutItem } from './overflow-layout';

@Component({
    selector: 'story-overflow-layout',
    imports: [OverflowLayout, OverflowItemRef, OverflowLayoutItem, InfoLabel, Button],
    template: `
        <div class="flex flex-col gap-6">
            <div
                class="resize-x overflow-hidden border border-dashed border-sap-group-content-border-color p-2"
                style="width: 36rem; min-width: 10rem"
            >
                <fd-overflow-layout [maxVisibleItems]="max()" ariaRole="list" (hiddenItemsCount)="hidden.set($event)">
                    @for (item of items(); track item; let i = $index) {
                        <fd-info-label
                            *fdOverflowItemRef="let isHidden"
                            fdOverflowLayoutItem
                            class="me-2"
                            [color]="$any((i % 10) + 1)"
                            [label]="'Info label ' + item + (isHidden ? ' (hidden)' : '')"
                        />
                    }
                </fd-overflow-layout>
            </div>
            <p class="m-0 text-sap-font-small-size text-sap-content-label-color">
                {{ items().length }} items, {{ hidden() }} hidden. Drag the corner to resize.
            </p>
            <div class="flex gap-2">
                <button fdButton label="Add item" (click)="add()"></button>
                <button fdButton label="Remove item" (click)="remove()"></button>
                <button
                    fdButton
                    [label]="max() === 3 ? 'No limit' : 'Max 3 visible'"
                    (click)="max.set(max() === 3 ? Infinity : 3)"
                ></button>
            </div>
        </div>
    `
})
class OverflowDemo {
    protected readonly Infinity = Number.POSITIVE_INFINITY;
    protected readonly items = signal(Array.from({ length: 10 }, (_, i) => i + 1));
    protected readonly hidden = signal(0);
    protected readonly max = signal(Number.POSITIVE_INFINITY);
    protected add(): void {
        this.items.update((list) => [...list, list.length + 1]);
    }
    protected remove(): void {
        this.items.update((list) => list.slice(0, -1));
    }
}

const NOTE = 'm-0 text-sap-font-small-size text-sap-content-label-color';
const PILL =
    'm-0 cursor-pointer rounded-sap-element-border-corner-radius border-0 bg-transparent p-0 focus-visible:outline-sap';

/** Upstream "Forcing visibility of the items": a hidden item clicked in the popover moves into the row. */
@Component({
    selector: 'story-overflow-click-to-show',
    imports: [OverflowLayout, OverflowItemRef, InfoLabel, Button],
    template: `
        <div class="flex max-w-xl flex-col gap-4">
            <p class="${NOTE}">Click an item in the "More" popover to move it into the visible row.</p>
            <fd-overflow-layout ariaRole="list" ariaLabel="Info labels">
                @for (item of items(); track item) {
                    <ng-container *fdOverflowItemRef="item; forceVisibility: forced() === item; let isHidden">
                        @if (isHidden) {
                            <button type="button" class="${PILL}" (click)="forced.set(item)">
                                <fd-info-label [color]="color(item)" [label]="'Info label ' + item + ' hidden'" />
                            </button>
                        } @else {
                            <fd-info-label
                                class="me-2"
                                [color]="color(item)"
                                [label]="'Info label ' + item + (forced() === item ? ' shown' : ' visible')"
                            />
                        }
                    </ng-container>
                }
            </fd-overflow-layout>
            <div class="flex gap-2">
                <button fdButton label="Add new item" (click)="add()"></button>
                <button fdButton label="Remove item" (click)="remove()"></button>
            </div>
        </div>
    `
})
class StoryClickToShow {
    protected readonly items = signal(Array.from({ length: 15 }, (_, i) => i));
    protected readonly forced = signal<number | null>(null);
    protected color(i: number): InfoLabelColor {
        return ((i % 10) + 1) as InfoLabelColor;
    }
    protected add(): void {
        this.items.update((list) => [...list, list.length]);
    }
    protected remove(): void {
        this.items.update((list) => list.slice(0, -1));
    }
}

interface Person {
    id: string;
    name: string;
    position: string;
    email: string;
    glyph?: string;
}

const POSITIONS = ['Marketing Manager', 'Visual Designer', 'Software Developer'];
const GLYPHS = ['accidental-leave', 'account', 'activity-individual', 'action-settings', 'add-contact', 'calendar'];
const NAMES = [
    'John Doe',
    'Sarah Parker',
    'Jason Goldwell',
    'Christian Bow',
    'Jessica Bale',
    'Jonathan Smith',
    'Gordon Jason',
    'Simon Swan',
    'Whitney Carter',
    'Chris Copper',
    'David Doe',
    'John Parker',
    'Sarah Goldwell',
    'Jason Bow',
    'Christian Bale',
    'Jessica Smith',
    'Jonathan Jason',
    'Gordon Swan',
    'Simon Carter',
    'Whitney Copper'
];
const person = (name: string, i: number): Person => ({
    id: `story-person-${i}`,
    name,
    position: POSITIONS[i % POSITIONS.length],
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    glyph: i % 2 ? GLYPHS[i % GLYPHS.length] : undefined
});

/**
 * Upstream "Overflow Layout Complex example": an avatar group. Each visible avatar opens a business
 * card; the custom "+N" control opens a popover with the hidden avatars, and clicking one shows its
 * card there. Avatars show a photo or an icon: initials in a button would not match its name.
 */
@Component({
    selector: 'story-overflow-avatar-group',
    imports: [
        NgTemplateOutlet,
        OverflowLayout,
        OverflowItemRef,
        OverflowExpand,
        Avatar,
        Bar,
        BarLeft,
        BarElement,
        ButtonBar,
        Button,
        Link,
        Popover,
        PopoverBody,
        PopoverBodyHeader,
        PopoverControl,
        Title,
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
        QuickViewGroupItemContentElement
    ],
    template: `
        <ng-template #avatar let-person let-clickable="clickable" let-select="select">
            <fd-avatar
                size="s"
                circle
                border
                [clickable]="clickable"
                [glyph]="person.glyph"
                [image]="person.glyph ? null : 'assets/person.svg'"
                [ariaLabel]="person.name"
                [attr.title]="person.name"
                (avatarClicked)="select && detail.set(person)"
            />
        </ng-template>
        <ng-template #card let-person let-back="back">
            <fd-quick-view>
                <fd-quick-view-title align="left">
                    @if (back) {
                        <fd-button-bar
                            glyph="navigation-left-arrow"
                            ariaLabel="Back"
                            title="Back"
                            (click)="detail.set(null)"
                        />
                    }
                    Business card
                </fd-quick-view-title>
                <fd-quick-view-subheader>
                    <ng-container [ngTemplateOutlet]="avatar" [ngTemplateOutletContext]="{ $implicit: person }" />
                    <fd-quick-view-subheader-title>{{ person.name }}</fd-quick-view-subheader-title>
                    <fd-quick-view-subheader-subtitle>{{ person.position }}</fd-quick-view-subheader-subtitle>
                </fd-quick-view-subheader>
                <fd-quick-view-group [attr.aria-labelledby]="person.id + '-contact'">
                    <fd-quick-view-group-title [id]="person.id + '-contact'">Contact details</fd-quick-view-group-title>
                    <fd-quick-view-group-item>
                        <fd-quick-view-group-item-label>Email</fd-quick-view-group-item-label>
                        <fd-quick-view-group-item-content>
                            <a fdLink fd-quick-view-group-item-content-element [href]="'mailto:' + person.email">{{
                                person.email
                            }}</a>
                        </fd-quick-view-group-item-content>
                    </fd-quick-view-group-item>
                </fd-quick-view-group>
            </fd-quick-view>
        </ng-template>

        <div class="flex max-w-md flex-col gap-4">
            <fd-overflow-layout ariaRole="list" ariaLabel="Team members">
                @for (person of people(); track person.id) {
                    <fd-popover
                        *fdOverflowItemRef="person"
                        class="me-1"
                        placement="top"
                        [noArrow]="false"
                        [bodyAriaLabel]="person.name"
                    >
                        <fd-popover-control>
                            <ng-container
                                [ngTemplateOutlet]="avatar"
                                [ngTemplateOutletContext]="{ $implicit: person, clickable: true }"
                            />
                        </fd-popover-control>
                        <fd-popover-body>
                            <ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{ $implicit: person }" />
                        </fd-popover-body>
                    </fd-popover>
                }
                <ng-template fdOverflowExpand let-hidden>
                    <fd-popover
                        placement="bottom"
                        [noArrow]="false"
                        [bodyAriaLabel]="'Team members (' + hidden.length + ')'"
                        (isOpenChange)="detail.set(null)"
                    >
                        <fd-popover-control>
                            <button
                                fdButton
                                variant="transparent"
                                [label]="'+' + hidden.length"
                                [ariaLabel]="'+' + hidden.length + ' more team members'"
                            ></button>
                        </fd-popover-control>
                        <fd-popover-body>
                            @if (detail(); as selected) {
                                <ng-container
                                    [ngTemplateOutlet]="card"
                                    [ngTemplateOutletContext]="{ $implicit: selected, back: true }"
                                />
                            } @else {
                                <div fdPopoverBodyHeader>
                                    <div fd-bar barDesign="header">
                                        <div fd-bar-left>
                                            <fd-bar-element>
                                                <h5 fdTitle>Team members ({{ hidden.length }})</h5>
                                            </fd-bar-element>
                                        </div>
                                    </div>
                                </div>
                                <div class="m-0 flex max-w-[19.5rem] flex-wrap gap-2 p-2" role="list">
                                    @for (ref of hidden; track ref) {
                                        <div role="listitem">
                                            <ng-container
                                                [ngTemplateOutlet]="avatar"
                                                [ngTemplateOutletContext]="{
                                                    $implicit: $any(ref).fdOverflowItemRef(),
                                                    clickable: true,
                                                    select: true
                                                }"
                                            />
                                        </div>
                                    }
                                </div>
                            }
                        </fd-popover-body>
                    </fd-popover>
                </ng-template>
            </fd-overflow-layout>
            <div class="flex gap-2">
                <button fdButton label="Add new item" (click)="add()"></button>
                <button fdButton label="Remove item" (click)="remove()"></button>
            </div>
        </div>
    `
})
class StoryAvatarGroup {
    protected readonly people = signal(NAMES.map(person));
    protected readonly detail = signal<Person | null>(null);
    protected add(): void {
        this.people.update((list) => [...list, person(`Extra User ${list.length}`, list.length)]);
    }
    protected remove(): void {
        this.people.update((list) => list.slice(0, -1));
    }
}

const meta: Meta<OverflowLayout> = {
    title: 'Components/Overflow Layout',
    component: OverflowLayout,
    decorators: [
        moduleMetadata({
            imports: [
                OverflowDemo,
                StoryClickToShow,
                StoryAvatarGroup,
                OverflowLayout,
                OverflowItemRef,
                OverflowLayoutItem,
                OverflowExpand,
                InfoLabel,
                Button
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Overflow layouts show as many items as fit in one row (and at most maxVisibleItems); the rest go into a "N more" popover. Items with forceVisibility always stay visible.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<OverflowLayout>;

export const Default: Story = { name: 'Resizable', render: () => ({ template: `<story-overflow-layout />` }) };

export const AlwaysVisible: Story = {
    name: 'Forced visibility, start position and custom "more"',
    render: () => ({
        props: { labels: Array.from({ length: 12 }, (_, i) => i + 1) },
        template: `
            <div class="flex max-w-xl flex-col gap-6">
                <fd-overflow-layout>
                    @for (item of labels; track item) {
                        <fd-info-label *fdOverflowItemRef fdOverflowLayoutItem [forceVisibility]="item === 12" class="me-2" [color]="item === 12 ? 8 : 6" [label]="item === 12 ? 'Always visible' : 'Label ' + item" />
                    }
                </fd-overflow-layout>
                <fd-overflow-layout showMorePosition="left" reverseHiddenItems>
                    @for (item of labels; track item) {
                        <fd-info-label *fdOverflowItemRef fdOverflowLayoutItem class="ms-2" [color]="3" [label]="'Label ' + item" />
                    }
                    <ng-template fdOverflowExpand let-hidden>
                        <button fdButton variant="transparent" [label]="'+' + hidden.length"></button>
                    </ng-template>
                </fd-overflow-layout>
            </div>`
    })
};

export const ClickToShow: Story = {
    name: 'Click to show',
    render: () => ({ template: `<story-overflow-click-to-show />` })
};

export const AvatarGroup: Story = {
    name: 'Avatar group',
    render: () => ({ template: `<story-overflow-avatar-group />` })
};

/** Clicks the "more" control of the first overflow layout and waits for its popover. */
async function openMore(canvasElement: HTMLElement, control: string): Promise<void> {
    const more = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>(control);
        expect(el).not.toBeNull();
        return el!;
    });
    await userEvent.click(more);
    await waitFor(() => expect(document.querySelector('.cdk-overlay-pane fd-popover-body')).not.toBeNull());
}

export const OpenMore: Story = {
    name: 'Open: more popover',
    tags: ['!autodocs'],
    render: Default.render,
    play: ({ canvasElement }) => openMore(canvasElement, 'fd-overflow-layout fd-popover-control button')
};
export const OpenClickToShow: Story = {
    name: 'Open: click to show',
    tags: ['!autodocs'],
    render: ClickToShow.render,
    play: ({ canvasElement }) => openMore(canvasElement, 'fd-overflow-layout fd-popover-control button')
};
export const OpenAvatarGroup: Story = {
    name: 'Open: avatar group',
    tags: ['!autodocs'],
    render: AvatarGroup.render,
    play: ({ canvasElement }) => openMore(canvasElement, 'fd-overflow-layout button[fdButton]')
};
