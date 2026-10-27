import { DatePipe } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { Button } from '@/ui/button/button';
import {
    Timeline,
    TimelineHeaderInfoSubTitle,
    TimelineNode,
    TimelineNodeBody,
    TimelineNodeDef,
    TimelineNodeFooter,
    TimelineNodeHeader,
    TimelineNodeHeaderInfo,
    TimelineNodeHeaderInfoText,
    TimelineNodeHeaderInfoTitle,
    type TimelineAxis,
    type TimelineSidePosition
} from './timeline';

interface Post {
    user: string;
    title: string;
    date: Date;
    post: string;
    glyph?: string;
    action?: boolean;
}

const POSTS: Post[] = [
    {
        user: 'John Li',
        title: 'created the sales order',
        date: new Date(2026, 2, 3, 9, 15),
        post: 'Sales order 4711 for 120 notebooks was created and sent for approval.',
        glyph: 'sales-order',
        action: true
    },
    {
        user: 'Sarah Miller',
        title: 'approved the order',
        date: new Date(2026, 2, 3, 11, 40),
        post: 'Approved. Please make sure that the delivery date is confirmed by the vendor before the end of the week, because the customer needs the notebooks for the onboarding of new employees.',
        glyph: 'approvals'
    },
    {
        user: 'Very Best Screens',
        title: 'confirmed the delivery',
        date: new Date(2026, 2, 4, 8, 5),
        post: 'Delivery confirmed for March 10.',
        glyph: 'shipping-status',
        action: true
    },
    {
        user: 'John Li',
        title: 'added a comment',
        date: new Date(2026, 2, 5, 16, 20),
        post: 'Customer asked for a partial delivery of 60 notebooks on March 8. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
        glyph: 'comment'
    },
    {
        user: 'Warehouse',
        title: 'shipped the goods',
        date: new Date(2026, 2, 8, 7, 0),
        post: 'Partial delivery of 60 notebooks shipped.',
        glyph: 'shipping-status'
    }
];

@Component({
    selector: 'story-timeline',
    imports: [
        DatePipe,
        Avatar,
        Button,
        Timeline,
        TimelineNode,
        TimelineNodeDef,
        TimelineNodeHeader,
        TimelineNodeHeaderInfo,
        TimelineNodeHeaderInfoTitle,
        TimelineNodeHeaderInfoText,
        TimelineHeaderInfoSubTitle,
        TimelineNodeBody,
        TimelineNodeFooter
    ],
    template: `
        <fd-timeline [dataSource]="data()" [axis]="axis()" [layout]="layout()" ariaLabel="Order history">
            <fd-timeline-node *fdTimelineNodeDef="let node" [glyph]="glyphs() ? node.glyph : null">
                <fd-timeline-node-header>
                    <fd-avatar circle size="xs" [label]="node.user" />
                    <fd-timeline-node-header-info>
                        <span fd-timeline-node-header-info-title>{{ node.user }}</span>
                        <span fd-timeline-node-header-info-text>{{ node.title }}</span>
                        <div fd-timeline-header-info-sub-title>{{ node.date | date: 'short' }}</div>
                    </fd-timeline-node-header-info>
                </fd-timeline-node-header>
                <fd-timeline-node-body [content]="node.post" [maxLines]="maxLines()" />
                @if (node.action) {
                    <fd-timeline-node-footer>
                        <button fdButton variant="transparent" data-density="compact" label="Reply"></button>
                        <button fdButton variant="transparent" data-density="compact" label="Forward"></button>
                    </fd-timeline-node-footer>
                }
            </fd-timeline-node>
        </fd-timeline>
    `
})
class StoryTimeline {
    readonly axis = input<TimelineAxis>('vertical');
    readonly layout = input<TimelineSidePosition>('right');
    readonly glyphs = input(true);
    readonly maxLines = input<number | null>(null);
    readonly data = input<Post[] | null>(POSTS);
}

@Component({
    selector: 'story-timeline-loading',
    imports: [Button, StoryTimeline],
    template: `
        <div class="flex flex-col items-start gap-4">
            <button
                fdButton
                [label]="data() ? 'Reload' : 'Load posts'"
                (click)="data.set(data() ? null : posts)"
            ></button>
            <story-timeline class="block w-full" [data]="data()" />
        </div>
    `
})
class StoryTimelineLoading {
    protected readonly posts = POSTS;
    protected readonly data = signal<Post[] | null>(null);
}

const meta: Meta<Timeline> = {
    title: 'Components/Timeline',
    component: Timeline,
    decorators: [moduleMetadata({ imports: [StoryTimeline, StoryTimelineLoading] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Timelines show posts in chronological order along a vertical or horizontal line, on one side or alternating on both sides (double). Nodes are rendered from a data source with a `*fdTimelineNodeDef` template; without data the timeline shows loading placeholders. Each node shows a dot or an icon on the line.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Timeline>;

const SCROLL = 'block h-[37.5rem] overflow-auto scrollbar-sap';

export const Vertical: Story = {
    name: 'Vertical, right',
    render: () => ({ template: `<story-timeline class="${SCROLL}" />` })
};

export const VerticalLeft: Story = {
    name: 'Vertical, left, dots and collapsed text',
    render: () => ({ template: `<story-timeline class="${SCROLL}" layout="left" [glyphs]="false" [maxLines]="2" />` })
};

export const VerticalDouble: Story = {
    name: 'Vertical, double-sided',
    render: () => ({ template: `<story-timeline class="${SCROLL}" layout="double" />` })
};

export const Horizontal: Story = {
    name: 'Horizontal, bottom',
    render: () => ({
        template: `<story-timeline class="${SCROLL}" axis="horizontal" layout="bottom" [maxLines]="3" />`
    })
};

export const HorizontalTop: Story = {
    name: 'Horizontal, top',
    render: () => ({ template: `<story-timeline class="${SCROLL}" axis="horizontal" layout="top" [maxLines]="3" />` })
};

export const HorizontalDouble: Story = {
    name: 'Horizontal, double-sided',
    render: () => ({
        template: `<story-timeline class="${SCROLL}" axis="horizontal" layout="double" [maxLines]="3" />`
    })
};

export const Loading: Story = {
    name: 'Loading',
    render: () => ({ template: `<story-timeline-loading />` })
};
