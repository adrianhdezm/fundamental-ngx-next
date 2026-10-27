import { NgTemplateOutlet } from '@angular/common';
import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { Card, CardContent, CardHeader, CardMainHeader, CardSubtitle, CardTitle } from '@/ui/card/card';
import { MessagePage, MessagePageTitle } from '@/ui/message-page/message-page';
import { Title } from '@/ui/title/title';
import { Carousel, CarouselItem, type CarouselBackgroundOptions } from './carousel';

const COLORS = ['7eb8da', '81c784', 'ffb74d', 'e57373', 'ba68c8', '4dd0e1', 'a1887f', '90a4ae', 'f06292', 'aed581'];

/** A coloured placeholder image with a label. */
const image = (index: number, size = 500) =>
    `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect fill='#${COLORS[index % COLORS.length]}' width='${size}' height='${size}'/><text fill='#fff' font-family='sans-serif' font-size='${size / 16}' x='${size / 2}' y='${size / 2}' dominant-baseline='middle' text-anchor='middle'>Slide ${index + 1}</text></svg>`
    )}`;

const heading = 'mt-6 mb-2 first:mt-0';

const slides = (count: number, size = 500) =>
    Array.from({ length: count }, (_, index) => ({ index, src: image(index, size) }));

@Component({
    selector: 'story-carousel-basic',
    imports: [Carousel, CarouselItem, Title],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">One slide at a time</h3>
        <div class="flex justify-center">
            <fd-carousel width="31.25rem" ariaLabel="Photos">
                @for (slide of five; track slide) {
                    <fd-carousel-item><img [src]="slide.src" [alt]="'Slide ' + (slide.index + 1)" /></fd-carousel-item>
                }
            </fd-carousel>
        </div>

        <h3 fdTitle headerSize="5" class="${heading}">Many slides: a numeric indicator</h3>
        <div class="flex justify-center">
            <fd-carousel width="31.25rem" ariaLabel="More photos">
                @for (slide of ten; track slide) {
                    <fd-carousel-item><img [src]="slide.src" [alt]="'Slide ' + (slide.index + 1)" /></fd-carousel-item>
                }
            </fd-carousel>
        </div>
    `
})
class StoryCarouselBasic {
    protected readonly five = slides(5);
    protected readonly ten = slides(10);
}

@Component({
    selector: 'story-carousel-navigation',
    imports: [Carousel, CarouselItem, Title],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Buttons over the slides, indicators on top</h3>
        <div class="flex justify-center">
            <fd-carousel
                width="31.25rem"
                ariaLabel="Horizontal navigation"
                [navigatorInPageIndicator]="false"
                pageIndicatorsOrientation="top"
            >
                @for (slide of five; track slide) {
                    <fd-carousel-item><img [src]="slide.src" [alt]="'Slide ' + (slide.index + 1)" /></fd-carousel-item>
                }
            </fd-carousel>
        </div>

        <h3 fdTitle headerSize="5" class="${heading}">Vertical</h3>
        <div class="flex justify-center">
            <fd-carousel
                width="18.75rem"
                height="22.5rem"
                ariaLabel="Vertical navigation"
                vertical
                [navigatorInPageIndicator]="false"
            >
                @for (slide of small; track slide) {
                    <fd-carousel-item><img [src]="slide.src" [alt]="'Slide ' + (slide.index + 1)" /></fd-carousel-item>
                }
            </fd-carousel>
        </div>

        <h3 fdTitle headerSize="5" class="${heading}">Looped</h3>
        <div class="flex justify-center">
            <fd-carousel width="31.25rem" ariaLabel="Looped" loop>
                @for (slide of five; track slide) {
                    <fd-carousel-item><img [src]="slide.src" [alt]="'Slide ' + (slide.index + 1)" /></fd-carousel-item>
                }
            </fd-carousel>
        </div>

        <h3 fdTitle headerSize="5" class="${heading}">Without navigation buttons (swipe or use the arrow keys)</h3>
        <div class="flex justify-center">
            <fd-carousel width="31.25rem" ariaLabel="Swipe only" [navigation]="false">
                @for (slide of five; track slide) {
                    <fd-carousel-item><img [src]="slide.src" [alt]="'Slide ' + (slide.index + 1)" /></fd-carousel-item>
                }
            </fd-carousel>
        </div>

        <h3 fdTitle headerSize="5" class="${heading}">Without page indicators</h3>
        <div class="flex justify-center">
            <fd-carousel width="31.25rem" ariaLabel="No indicators" [pageIndicator]="false">
                @for (slide of five; track slide) {
                    <fd-carousel-item><img [src]="slide.src" [alt]="'Slide ' + (slide.index + 1)" /></fd-carousel-item>
                }
            </fd-carousel>
        </div>
    `
})
class StoryCarouselNavigation {
    protected readonly five = slides(5);
    protected readonly small = slides(5, 300);
}

@Component({
    selector: 'story-carousel-cards',
    imports: [
        NgTemplateOutlet,
        Carousel,
        CarouselItem,
        Card,
        CardHeader,
        CardMainHeader,
        CardTitle,
        CardSubtitle,
        CardContent,
        Button,
        Title
    ],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Two cards at a time</h3>
        <div class="flex justify-center">
            <fd-carousel [visibleSlidesCount]="2" ariaLabel="Cards" (slideChange)="last.set($event.slideDirection)">
                @for (card of cards(); track card) {
                    <fd-carousel-item>
                        <ng-container *ngTemplateOutlet="cardTpl; context: { $implicit: card, name: 'Card' }" />
                    </fd-carousel-item>
                }
            </fd-carousel>
        </div>
        <p class="font-sap-font-family text-sap-font-size text-sap-text-color">Last slide: {{ last() }}</p>

        <h3 fdTitle headerSize="5" class="${heading}">As many as fit (resize the window) and changing slides</h3>
        <div class="mb-2 flex gap-2">
            <button fdButton label="Add card" (click)="cards.update((c) => [...c, c.length + 1])"></button>
            <button fdButton label="Remove card" (click)="cards.update((c) => c.slice(0, -1))"></button>
        </div>
        <fd-carousel visibleSlidesCount="auto" ariaLabel="Fitting cards">
            @for (card of cards(); track card) {
                <fd-carousel-item>
                    <ng-container *ngTemplateOutlet="cardTpl; context: { $implicit: card, name: 'Product' }" />
                </fd-carousel-item>
            }
        </fd-carousel>

        <ng-template #cardTpl let-card let-name="name">
            <div class="w-75 p-2 leading-normal">
                <fd-card>
                    <fd-card-header>
                        <fd-card-main-header>
                            <h2 fd-card-title>{{ name }} {{ card }}</h2>
                            <h3 fd-card-subtitle>Subtitle of {{ name.toLowerCase() }} {{ card }}</h3>
                        </fd-card-main-header>
                    </fd-card-header>
                    <fd-card-content>
                        <p class="m-0 p-4 font-sap-font-family text-sap-font-size text-sap-text-color">
                            Content of {{ name.toLowerCase() }} {{ card }}.
                        </p>
                    </fd-card-content>
                </fd-card>
            </div>
        </ng-template>
    `
})
class StoryCarouselCards {
    protected readonly cards = signal([1, 2, 3, 4, 5, 6]);
    protected readonly last = signal('None');
}

@Component({
    selector: 'story-carousel-backgrounds',
    imports: [Carousel, CarouselItem, Title],
    template: `
        @for (variant of variants; track variant.label) {
            <h3 fdTitle headerSize="5" class="${heading}">{{ variant.label }}</h3>
            <div class="flex justify-center">
                <fd-carousel
                    width="25rem"
                    [ariaLabel]="variant.label"
                    [contentBackground]="variant.content"
                    [pageIndicatorBackground]="variant.indicators"
                    [noPaginationContainerBorder]="!!variant.noBorder"
                >
                    @for (slide of three; track slide) {
                        <fd-carousel-item class="p-6">
                            <img [src]="slide.src" [alt]="'Slide ' + (slide.index + 1)" />
                        </fd-carousel-item>
                    }
                </fd-carousel>
            </div>
        }
    `
})
class StoryCarouselBackgrounds {
    protected readonly three = slides(3, 200);
    protected readonly variants: {
        label: string;
        content: CarouselBackgroundOptions;
        indicators: CarouselBackgroundOptions;
        noBorder?: boolean;
    }[] = [
        { label: 'Transparent content', content: 'transparent', indicators: 'solid' },
        { label: 'Solid content', content: 'solid', indicators: 'solid' },
        { label: 'Transparent page indicators', content: 'solid', indicators: 'transparent' },
        { label: 'Translucent page indicators', content: 'solid', indicators: 'translucent' },
        { label: 'Page indicators without a border', content: 'solid', indicators: 'solid', noBorder: true }
    ];
}

@Component({
    selector: 'story-carousel-states',
    imports: [Carousel, CarouselItem, MessagePage, MessagePageTitle, Button, Title],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Loading a slide</h3>
        <div class="flex flex-col items-center gap-2">
            <fd-carousel width="18.75rem" height="25rem" ariaLabel="Loading">
                <fd-carousel-item [loading]="loading()"><img [src]="first.src" alt="Slide 1" /></fd-carousel-item>
                <fd-carousel-item><img [src]="second.src" alt="Slide 2" /></fd-carousel-item>
            </fd-carousel>
            <button
                fdButton
                [label]="loading() ? 'Stop loading' : 'Start loading'"
                (click)="loading.set(!loading())"
            ></button>
        </div>

        <h3 fdTitle headerSize="5" class="${heading}">Error message</h3>
        <div class="flex justify-center">
            <fd-carousel width="31.25rem" height="25rem" ariaLabel="Error">
                <fd-message-page type="error">
                    <fd-message-page-title>Items could not be loaded.</fd-message-page-title>
                </fd-message-page>
            </fd-carousel>
        </div>
    `
})
class StoryCarouselStates {
    protected readonly loading = signal(true);
    protected readonly first = slides(1, 300)[0];
    protected readonly second = slides(2, 300)[1];
}

const meta: Meta<Carousel> = {
    title: 'Components/Carousel',
    component: Carousel,
    decorators: [
        moduleMetadata({
            imports: [
                StoryCarouselBasic,
                StoryCarouselNavigation,
                StoryCarouselCards,
                StoryCarouselBackgrounds,
                StoryCarouselStates
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'A carousel shows one or more slides at a time, with navigation buttons, page indicators (dots, or "2 of 9" for more than eight slides) and swiping. ' +
                    'The carousel is one tab stop: Left and Right (Up and Down when vertical) move between the slides. `loop` wraps around; `visibleSlidesCount="auto"` shows as many slides as fit. ' +
                    '`fdCarousel` and `fdCarouselItem` add the same sliding and swiping to any element.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Carousel>;

export const Basic: Story = { render: () => ({ template: `<story-carousel-basic />` }) };
export const Navigation: Story = {
    name: 'Navigation, vertical and loop',
    render: () => ({ template: `<story-carousel-navigation />` })
};
export const MultipleSlides: Story = {
    name: 'Several slides at once',
    render: () => ({ template: `<story-carousel-cards />` })
};
export const Backgrounds: Story = { render: () => ({ template: `<story-carousel-backgrounds />` }) };
export const States: Story = {
    name: 'Loading and error',
    render: () => ({ template: `<story-carousel-states />` })
};
