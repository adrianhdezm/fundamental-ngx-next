import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Card, CardContent, CardHeader, CardMainHeader, CardSubtitle, CardTitle } from '@/ui/card/card';
import { List, ListItem, ListTitle } from '@/ui/list/list';
import {
    ResizableCardItem,
    ResizableCardLayout,
    type ResizableCardItemConfig,
    type ResizedEvent
} from './resizable-card-layout';

const CARDS: ResizableCardItemConfig[] = [
    {
        title: 'Sales orders',
        rank: 1,
        cardWidthColSpan: 1,
        cardHeightRowSpan: 25,
        cardMiniHeaderRowSpan: 5,
        cardMiniContentRowSpan: 12
    },
    {
        title: 'Open invoices',
        rank: 2,
        cardWidthColSpan: 1,
        cardHeightRowSpan: 18,
        cardMiniHeaderRowSpan: 5,
        cardMiniContentRowSpan: 8
    },
    {
        title: 'Deliveries',
        rank: 3,
        cardWidthColSpan: 2,
        cardHeightRowSpan: 20,
        cardMiniHeaderRowSpan: 5,
        cardMiniContentRowSpan: 8
    },
    {
        title: 'Top customers',
        rank: 4,
        cardWidthColSpan: 2,
        cardHeightRowSpan: 13,
        cardMiniHeaderRowSpan: 5,
        cardMiniContentRowSpan: 8
    },
    {
        title: 'Returns',
        rank: 5,
        cardWidthColSpan: 1,
        cardHeightRowSpan: 13,
        cardMiniHeaderRowSpan: 5,
        cardMiniContentRowSpan: 8
    },
    {
        title: 'Messages',
        rank: 6,
        cardWidthColSpan: 1,
        cardHeightRowSpan: 16,
        cardMiniHeaderRowSpan: 5,
        cardMiniContentRowSpan: 8,
        resizable: false
    }
];

@Component({
    selector: 'story-resizable-card-layout',
    host: { class: 'block' },
    imports: [
        ResizableCardLayout,
        ResizableCardItem,
        Card,
        CardHeader,
        CardMainHeader,
        CardTitle,
        CardSubtitle,
        CardContent,
        List,
        ListItem,
        ListTitle
    ],
    template: `
        <p class="m-0 font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">
            Drag the edges or the corner of a card to resize it. {{ status() }}
        </p>
        <fd-resizable-card-layout
            (resized)="onResized($event)"
            (miniHeaderReached)="status.set($event.card.title() + ': mini header')"
            (miniContentReached)="status.set($event.card.title() + ': mini content')"
        >
            @for (card of cards; track card.title) {
                <fd-resizable-card-item [config]="card">
                    <fd-card>
                        <fd-card-header>
                            <fd-card-main-header>
                                <h3 fd-card-title>{{ card.title }}</h3>
                                <h4 fd-card-subtitle>{{ card.resizable === false ? 'Not resizable' : 'Resizable' }}</h4>
                            </fd-card-main-header>
                        </fd-card-header>
                        <fd-card-content>
                            <ul fd-list noBorder [attr.aria-label]="card.title">
                                @for (line of lines; track line) {
                                    <li fd-list-item>
                                        <span fd-list-title>{{ card.title }} item {{ line }}</span>
                                    </li>
                                }
                            </ul>
                        </fd-card-content>
                    </fd-card>
                </fd-resizable-card-item>
            }
        </fd-resizable-card-layout>
    `
})
class StoryResizableCardLayout {
    readonly cardsInput = input<ResizableCardItemConfig[]>(CARDS, { alias: 'cards' });
    protected get cards(): ResizableCardItemConfig[] {
        return this.cardsInput();
    }
    protected readonly lines = Array.from({ length: 12 }, (_, i) => i + 1);
    protected readonly status = signal('');
    protected onResized(event: ResizedEvent): void {
        this.status.set(`${event.card.title()}: ${event.cardWidthColSpan} column(s), ${event.cardHeightRowSpan} rows.`);
    }
}

const meta: Meta<ResizableCardLayout> = {
    title: 'Components/Resizable Card Layout',
    component: ResizableCardLayout,
    decorators: [moduleMetadata({ imports: [StoryResizableCardLayout] })],
    parameters: {
        docs: {
            description: {
                component:
                    'The resizable card layout places cards in columns of 20rem (one to four, by the available width). Cards are resized by dragging their right edge, bottom edge or corner; widths snap to columns and heights to 1rem rows, down to the mini content or mini header height. Other cards move to make room.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<ResizableCardLayout>;

export const Default: Story = {
    name: 'Resizable cards',
    render: () => ({ template: `<story-resizable-card-layout />` })
};
