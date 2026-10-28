import { NgTemplateOutlet } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Card, CardContent, CardCounter, CardHeader, CardMainHeader, CardSubtitle, CardTitle } from '@/ui/card/card';
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

const LINES = Array.from({ length: 12 }, (_, i) => i + 1);

/** Rows of the list that fit a card of the given height: none at the mini header, then one per 3 rows. */
function visibleLines(card: ResizableCardItemConfig, rowSpan: number): number {
    const header = card.cardMiniHeaderRowSpan ?? 0;
    if (rowSpan <= header) return 0;
    return Math.min(LINES.length, Math.max(1, Math.floor((rowSpan - header) / 3)));
}

@Component({
    selector: 'story-resizable-card-layout',
    host: { class: 'block' },
    imports: [
        NgTemplateOutlet,
        ResizableCardLayout,
        ResizableCardItem,
        Card,
        CardHeader,
        CardMainHeader,
        CardTitle,
        CardSubtitle,
        CardCounter,
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
            [layoutConfig]="mode() === 'layout' ? cards : null"
            (resized)="onResized($event)"
            (stepChange)="onStepChange($event)"
            (miniHeaderReached)="status.set($event.card.title() + ': mini header')"
            (miniContentReached)="status.set($event.card.title() + ': mini content')"
        >
            @for (card of cards; track card.title) {
                @switch (mode()) {
                    @case ('config') {
                        <fd-resizable-card-item [config]="card">
                            <ng-container *ngTemplateOutlet="content; context: { $implicit: card }" />
                        </fd-resizable-card-item>
                    }
                    @case ('layout') {
                        <fd-resizable-card-item>
                            <ng-container *ngTemplateOutlet="content; context: { $implicit: card }" />
                        </fd-resizable-card-item>
                    }
                    @default {
                        <fd-resizable-card-item
                            [title]="card.title"
                            [rank]="card.rank"
                            [cardWidthColSpan]="card.cardWidthColSpan ?? 1"
                            [cardHeightRowSpan]="card.cardHeightRowSpan"
                            [cardMiniHeaderRowSpan]="card.cardMiniHeaderRowSpan"
                            [cardMiniContentRowSpan]="card.cardMiniContentRowSpan"
                            [resizable]="card.resizable ?? true"
                        >
                            <ng-container *ngTemplateOutlet="content; context: { $implicit: card }" />
                        </fd-resizable-card-item>
                    }
                }
            }
        </fd-resizable-card-layout>
        <ng-template #content let-card>
            <fd-card>
                <fd-card-header>
                    <fd-card-main-header>
                        <h3 fd-card-title>{{ card.title }}</h3>
                        <h4 fd-card-subtitle>{{ card.resizable === false ? 'Not resizable' : 'Resizable' }}</h4>
                        @if (mode() === 'inputs') {
                            <span fd-card-counter>{{ linesOf(card).length }} of {{ lines.length }}</span>
                        }
                    </fd-card-main-header>
                </fd-card-header>
                <fd-card-content>
                    <ul fd-list noBorder [attr.aria-label]="card.title">
                        @for (line of linesOf(card); track line) {
                            <li fd-list-item>
                                <span fd-list-title>{{ card.title }} item {{ line }}</span>
                            </li>
                        }
                    </ul>
                </fd-card-content>
            </fd-card>
        </ng-template>
    `
})
class StoryResizableCardLayout {
    readonly cardsInput = input<ResizableCardItemConfig[]>(CARDS, { alias: 'cards' });
    /** How the cards are configured: `[config]` per item, `layoutConfig` on the layout, or the item inputs. */
    readonly mode = input<'config' | 'layout' | 'inputs'>('config');
    protected get cards(): ResizableCardItemConfig[] {
        return this.cardsInput();
    }
    protected readonly lines = LINES;
    protected readonly status = signal('');
    /** Height in rows of each card (inputs mode), updated on stepChange. */
    private readonly rowSpans = signal<Record<string, number>>({});

    protected linesOf(card: ResizableCardItemConfig): number[] {
        if (this.mode() !== 'inputs') return LINES;
        const rowSpan = this.rowSpans()[card.title ?? ''] ?? card.cardHeightRowSpan ?? 0;
        return LINES.slice(0, visibleLines(card, rowSpan));
    }

    protected onStepChange(event: ResizedEvent): void {
        const title = event.card.title();
        if (title) this.rowSpans.update((spans) => ({ ...spans, [title]: event.newCardHeightRowSpan }));
    }

    protected onResized(event: ResizedEvent): void {
        this.status.set(`${event.card.title()}: ${event.cardWidthColSpan} column(s), ${event.cardHeightRowSpan} rows.`);
        this.onStepChange(event);
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

export const LayoutConfig: Story = {
    name: 'Layout config',
    parameters: {
        docs: {
            description: {
                story: 'The same cards, configured with one `layoutConfig` array on `fd-resizable-card-layout`: each entry applies to the card at its position.'
            }
        }
    },
    render: () => ({ template: `<story-resizable-card-layout mode="layout" />` })
};

export const ItemInputs: Story = {
    name: 'Item inputs',
    parameters: {
        docs: {
            description: {
                story: 'Cards configured with the item inputs (`rank`, `cardWidthColSpan`, `cardHeightRowSpan`, mini spans, `resizable`). Each list shows as many rows as fit its card and updates on `stepChange`.'
            }
        }
    },
    render: () => ({ template: `<story-resizable-card-layout mode="inputs" />` })
};
