import { Component, signal, type TrackByFunction } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import {
    Timeline,
    TimelineNode,
    TimelineNodeBody,
    TimelineNodeDef,
    TimelineNodeHeader,
    TimelineNodeHeaderInfo,
    TimelineNodeHeaderInfoTitle,
    type TimelineAxis,
    type TimelineSidePosition
} from './timeline';

interface Post {
    title: string;
    text: string;
}

const LONG = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. '.repeat(6);

const POSTS: Post[] = [
    { title: 'First', text: 'Short text.' },
    { title: 'Second', text: LONG },
    { title: 'Third', text: 'Another short text.' },
    { title: 'Fourth', text: LONG },
    { title: 'Fifth', text: 'The end.' }
];

@Component({
    imports: [
        Timeline,
        TimelineNode,
        TimelineNodeDef,
        TimelineNodeHeader,
        TimelineNodeHeaderInfo,
        TimelineNodeHeaderInfoTitle,
        TimelineNodeBody
    ],
    template: `
        <div [style.width.px]="width()">
            <fd-timeline
                [dataSource]="posts()"
                [axis]="axis()"
                [layout]="layout()"
                [trackBy]="trackBy()"
                ariaLabel="Activity"
            >
                <fd-timeline-node
                    *fdTimelineNodeDef="let post of posts(); let i = index"
                    [ariaLabel]="post.title"
                    [attr.data-index]="i"
                    [glyph]="i === 0 ? 'calendar' : null"
                >
                    <fd-timeline-node-header>
                        <fd-timeline-node-header-info>
                            <span fdTimelineNodeHeaderInfoTitle>{{ post.title }}</span>
                        </fd-timeline-node-header-info>
                    </fd-timeline-node-header>
                    <fd-timeline-node-body [content]="post.text" [maxLines]="2" />
                </fd-timeline-node>
            </fd-timeline>
        </div>
    `
})
class Host {
    readonly width = signal(800);
    readonly posts = signal<Post[] | null>(POSTS);
    readonly axis = signal<TimelineAxis>('vertical');
    readonly layout = signal<TimelineSidePosition>('right');
    readonly trackBy = signal<TrackByFunction<Post> | undefined>(undefined);
}

@Component({
    imports: [Timeline, TimelineNode, TimelineNodeDef],
    template: `
        <fd-timeline [dataSource]="posts">
            <fd-timeline-node *fdTimelineNodeDef="let post" class="first-template">A {{ post }}</fd-timeline-node>
            <fd-timeline-node *fdTimelineNodeDef="let post of posts; let i = index" class="second-template"
                >B {{ post }} {{ i }}</fd-timeline-node
            >
        </fd-timeline>
    `
})
class TemplatesHost {
    readonly posts = ['one', 'two', 'three'];
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function setup(
    config: Partial<{
        axis: TimelineAxis;
        layout: TimelineSidePosition;
        posts: Post[] | null;
        trackBy: TrackByFunction<Post>;
    }> = {}
) {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    if (config.axis) host.axis.set(config.axis);
    if (config.layout) host.layout.set(config.layout);
    if (config.posts !== undefined) host.posts.set(config.posts);
    if (config.trackBy) host.trackBy.set(config.trackBy);
    document.body.appendChild(fixture.nativeElement);
    const root = fixture.nativeElement as HTMLElement;
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await frame();
        await fixture.whenStable();
    };
    await stable();
    const timeline = root.querySelector<HTMLElement>('fd-timeline')!;
    const nodes = () =>
        [...timeline.querySelectorAll<HTMLElement>('fd-timeline-node')].sort(
            (a, b) => Number(a.dataset['index']) - Number(b.dataset['index'])
        );
    const parts = (node: HTMLElement) => {
        const [container, post] = [...node.children] as HTMLElement[];
        const [wrapper, line] = [...container.children] as HTMLElement[];
        return { marker: wrapper.firstElementChild as HTMLElement, line, post };
    };
    return {
        fixture,
        host,
        root,
        stable,
        timeline,
        nodes,
        parts,
        lists: () => [timeline.children[0] as HTMLElement, timeline.children[2] as HTMLElement],
        indexes: (list: HTMLElement) =>
            [...list.querySelectorAll<HTMLElement>('fd-timeline-node')].map((n) => Number(n.dataset['index']))
    };
}

describe('Timeline', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('dir');
    });

    it('renders nodes from the data source with the node template (single or per index)', async () => {
        const { nodes, host, stable } = await setup();
        expect(nodes().map((n) => n.querySelector('[fdTimelineNodeHeaderInfoTitle]')!.textContent)).toEqual(
            POSTS.map((p) => p.title)
        );
        expect(nodes()[0].querySelector('fd-icon')).not.toBeNull();
        expect(nodes()[1].querySelector('fd-icon')).toBeNull();
        host.posts.set(POSTS.slice(0, 2));
        await stable();
        expect(nodes()).toHaveLength(2);

        const fixture = TestBed.createComponent(TemplatesHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const rendered = [...(fixture.nativeElement as HTMLElement).querySelectorAll('fd-timeline-node')];
        // one template per index; an index without a template renders nothing
        expect(rendered.map((n) => n.textContent!.trim())).toEqual(['A one', 'B two 1']);
    });

    it('layout left/right/top/bottom puts all nodes on one side; double alternates by index', async () => {
        const { host, stable, lists, indexes, nodes, parts } = await setup();
        expect(indexes(lists()[0])).toEqual([]);
        expect(indexes(lists()[1])).toEqual([0, 1, 2, 3, 4]);
        for (const node of nodes()) {
            const { marker, post } = parts(node);
            expect(post.getBoundingClientRect().left).toBeGreaterThan(marker.getBoundingClientRect().right);
        }

        host.layout.set('left');
        await stable();
        expect(indexes(lists()[0])).toEqual([0, 1, 2, 3, 4]);
        expect(indexes(lists()[1])).toEqual([]);
        for (const node of nodes()) {
            const { marker, post } = parts(node);
            expect(post.getBoundingClientRect().right).toBeLessThan(marker.getBoundingClientRect().left);
        }

        host.layout.set('double');
        await stable();
        expect(indexes(lists()[0])).toEqual([0, 2, 4]);
        expect(indexes(lists()[1])).toEqual([1, 3]);
        // all markers sit on the same line
        const centers = nodes().map((n) => {
            const rect = parts(n).marker.getBoundingClientRect();
            return Math.round(rect.left + rect.width / 2);
        });
        expect(new Set(centers).size).toBe(1);

        host.axis.set('horizontal');
        host.layout.set('top');
        await stable();
        expect(indexes(lists()[0])).toEqual([0, 1, 2, 3, 4]);
        for (const node of nodes()) {
            const { marker, post } = parts(node);
            expect(post.getBoundingClientRect().bottom).toBeLessThan(marker.getBoundingClientRect().top);
        }
        host.layout.set('bottom');
        await stable();
        expect(indexes(lists()[1])).toEqual([0, 1, 2, 3, 4]);
        for (const node of nodes()) {
            const { marker, post } = parts(node);
            expect(post.getBoundingClientRect().top).toBeGreaterThan(marker.getBoundingClientRect().bottom);
        }
        host.layout.set('double');
        await stable();
        expect(indexes(lists()[0])).toEqual([0, 2, 4]);
        expect(indexes(lists()[1])).toEqual([1, 3]);
    });

    it('connecting lines reach the next node along the axis; the last line is hidden', async () => {
        const vertical = await setup();
        const checkVertical = () => {
            const nodes = vertical.nodes();
            nodes.forEach((node, i) => {
                const { line } = vertical.parts(node);
                if (i === nodes.length - 1) {
                    expect(line.style.opacity).toBe('0');
                    return;
                }
                expect(line.style.opacity).toBe('');
                const next = vertical.parts(nodes[i + 1]).marker.getBoundingClientRect();
                expect(line.getBoundingClientRect().bottom + 4).toBeCloseTo(next.top, 0);
            });
        };
        checkVertical();
        vertical.fixture.destroy();

        const horizontal = await setup({ axis: 'horizontal', layout: 'bottom' });
        const checkHorizontal = (rtl: boolean) => {
            const nodes = horizontal.nodes();
            nodes.slice(0, -1).forEach((node, i) => {
                const line = horizontal.parts(node).line.getBoundingClientRect();
                const next = horizontal.parts(nodes[i + 1]).marker.getBoundingClientRect();
                if (rtl) expect(line.left - 4).toBeCloseTo(next.right, 0);
                else expect(line.right + 4).toBeCloseTo(next.left, 0);
            });
            expect(horizontal.parts(nodes.at(-1)!).line.style.opacity).toBe('0');
        };
        checkHorizontal(false);
        document.documentElement.setAttribute('dir', 'rtl');
        horizontal.timeline.style.width = '99%';
        await horizontal.stable();
        checkHorizontal(true);
    });

    it('double vertical layout spaces alternating nodes so each comes after the previous', async () => {
        const { nodes, parts } = await setup({ layout: 'double' });
        const markers = nodes().map((n) => parts(n).marker.getBoundingClientRect());
        for (let i = 1; i < markers.length; i++) {
            expect(markers[i].top).toBeGreaterThanOrEqual(markers[i - 1].bottom + 24 - 0.5);
        }
        // the lines run from one side to the node on the other side
        nodes()
            .slice(0, -1)
            .forEach((node, i) => {
                const line = parts(node).line.getBoundingClientRect();
                expect(line.bottom + 4).toBeCloseTo(markers[i + 1].top, 0);
            });
    });

    it('lines update when a post resizes (e.g. More/Less in the body) or the timeline resizes', async () => {
        const { host, stable, nodes, parts } = await setup();
        const lineToNext = () => parts(nodes()[1]).line.getBoundingClientRect().height;
        const reaches = () =>
            expect(parts(nodes()[1]).line.getBoundingClientRect().bottom + 4).toBeCloseTo(
                parts(nodes()[2]).marker.getBoundingClientRect().top,
                0
            );
        const collapsed = lineToNext();
        const more = [...nodes()[1].querySelectorAll<HTMLElement>('[role="button"]')].find(
            (b) => b.textContent!.trim() === 'More'
        )!;
        expect(more.getAttribute('aria-expanded')).toBe('false');
        await userEvent.click(more);
        await stable();
        expect(more.textContent!.trim()).toBe('Less');
        expect(lineToNext()).toBeGreaterThan(collapsed);
        reaches();
        const expanded = lineToNext();

        host.width.set(400);
        await stable();
        expect(lineToNext()).toBeGreaterThan(expanded);
        reaches();
    });

    it('without data shows three loading placeholders and aria-busy', async () => {
        const { timeline, host, stable, lists, nodes } = await setup({ posts: null });
        expect(timeline.getAttribute('aria-busy')).toBe('true');
        expect(lists()[1].querySelectorAll('fd-timeline-node')).toHaveLength(3);
        expect(lists()[1].querySelectorAll('fd-skeleton').length).toBeGreaterThanOrEqual(3);
        host.layout.set('left');
        await stable();
        expect(lists()[0].querySelectorAll('fd-timeline-node')).toHaveLength(3);
        expect(lists()[1].querySelectorAll('fd-timeline-node')).toHaveLength(0);

        host.posts.set(POSTS);
        await stable();
        expect(timeline.hasAttribute('aria-busy')).toBe(false);
        expect(timeline.querySelector('fd-skeleton')).toBeNull();
        expect(nodes()).toHaveLength(5);
    });

    it('role list / listitem; arrows of the posts point to the line in LTR and RTL', async () => {
        const { timeline, nodes, parts, host, stable } = await setup();
        expect(timeline.getAttribute('role')).toBe('list');
        await expect.element(page.getByRole('list', { name: 'Activity' })).toBeInTheDocument();
        expect(nodes().every((n) => n.getAttribute('role') === 'listitem')).toBe(true);
        await expect.element(page.getByRole('listitem', { name: 'Second' })).toBeInTheDocument();

        const arrow = (node: HTMLElement) => getComputedStyle(parts(node).post, '::after');
        // posts right of the line point left (to the start)
        expect(arrow(nodes()[0]).rotate).toBe('-135deg');
        expect(arrow(nodes()[0]).left).toBe('-7px');
        document.documentElement.setAttribute('dir', 'rtl');
        expect(arrow(nodes()[0]).rotate).toBe('45deg');
        expect(arrow(nodes()[0]).right).toBe('-7px');
        // posts on the other side point the other way
        host.layout.set('left');
        await stable();
        expect(arrow(nodes()[0]).rotate).toBe('-135deg');
        expect(arrow(nodes()[0]).left).toBe('-7px');
        document.documentElement.removeAttribute('dir');
        expect(arrow(nodes()[0]).rotate).toBe('45deg');
        expect(arrow(nodes()[0]).right).toBe('-7px');
    });

    it('with trackBy, replacing the data keeps the DOM nodes of unchanged items', async () => {
        const { host, nodes, stable } = await setup({ trackBy: (_, post) => post.title });
        const before = nodes();
        host.posts.set(POSTS.map((post) => ({ ...post })));
        await stable();
        const after = nodes();
        expect(after).toHaveLength(5);
        after.forEach((node, i) => expect(node).toBe(before[i]));
        // a changed item is re-rendered, the others are kept
        host.posts.set(POSTS.map((post, i) => (i === 2 ? { ...post, title: 'Changed' } : { ...post })));
        await stable();
        const changed = nodes();
        expect(changed[2]).not.toBe(before[2]);
        expect(changed[2].getAttribute('aria-label')).toBe('Changed');
        [0, 1, 3, 4].forEach((i) => expect(changed[i]).toBe(before[i]));
    });

    it('without trackBy, new data objects re-render the nodes', async () => {
        const { host, nodes, stable } = await setup();
        const before = nodes();
        host.posts.set(POSTS.map((post) => ({ ...post })));
        await stable();
        const after = nodes();
        expect(after).toHaveLength(5);
        after.forEach((node, i) => {
            expect(node).not.toBe(before[i]);
            expect(node.getAttribute('aria-label')).toBe(POSTS[i].title);
        });
    });

    it('appending an item adds a node and extends the previous line', async () => {
        const { host, nodes, parts, stable } = await setup();
        expect(parts(nodes()[4]).line.style.opacity).toBe('0');
        host.posts.set([...POSTS, { title: 'Sixth', text: 'One more.' }]);
        await stable();
        const all = nodes();
        expect(all).toHaveLength(6);
        expect(all[5].getAttribute('aria-label')).toBe('Sixth');
        const { line } = parts(all[4]);
        expect(line.style.opacity).toBe('');
        const next = parts(all[5]).marker.getBoundingClientRect();
        expect(line.getBoundingClientRect().bottom + 4).toBeCloseTo(next.top, 0);
        expect(parts(all[5]).line.style.opacity).toBe('0');
    });
});
