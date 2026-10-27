import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { BusyIndicator } from '@/ui/busy-indicator/busy-indicator';
import { List, ListItem, ListTitle } from '@/ui/list/list';
import { InfiniteScroll } from './infinite-scroll';

@Component({
    selector: 'story-infinite-list',
    imports: [InfiniteScroll, List, ListItem, ListTitle, BusyIndicator],
    template: `
        <ul
            fd-list
            fdInfiniteScroll
            [scrollOffset]="40"
            (onScrollAction)="more()"
            aria-label="Infinite list"
            class="scrollbar-sap block h-72 max-w-md overflow-auto"
        >
            @for (i of items(); track i) {
                <li fd-list-item>
                    <span fd-list-title>Item {{ i }}</span>
                </li>
            }
            <li fd-list-item noData>
                <span fd-list-title><fd-busy-indicator [loading]="loading()" size="s" ariaLabel="Loading more" /></span>
            </li>
        </ul>
        <p class="m-0 mt-2 text-sap-font-small-size text-sap-content-label-color">{{ items().length }} items loaded</p>
    `
})
class InfiniteList {
    protected readonly items = signal(Array.from({ length: 20 }, (_, i) => i + 1));
    protected readonly loading = signal(false);
    protected more(): void {
        if (this.loading()) return;
        this.loading.set(true);
        setTimeout(() => {
            this.items.update((list) => [...list, ...Array.from({ length: 10 }, (_, i) => list.length + i + 1)]);
            this.loading.set(false);
        }, 500);
    }
}

const meta: Meta<InfiniteScroll> = {
    title: 'Components/Infinite Scroll',
    component: InfiniteScroll,
    decorators: [moduleMetadata({ imports: [InfiniteList] })],
    parameters: {
        docs: {
            description: {
                component: 'Emits onScrollAction when a scroll container nears its end, e.g. to load more list items.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<InfiniteScroll>;

export const Default: Story = { name: 'Loading more items', render: () => ({ template: `<story-infinite-list />` }) };
