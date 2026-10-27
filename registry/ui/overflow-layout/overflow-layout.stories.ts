import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { InfoLabel } from '@/ui/info-label/info-label';
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

const meta: Meta<OverflowLayout> = {
    title: 'Components/Overflow Layout',
    component: OverflowLayout,
    decorators: [
        moduleMetadata({
            imports: [
                OverflowDemo,
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
