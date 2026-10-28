import { Component, signal } from '@angular/core';
import { FormControl as NgFormControl, ReactiveFormsModule } from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { RatingIndicator } from './rating-indicator';

const row = 'flex flex-wrap items-center gap-4 font-sap-font-family text-sap-font-size text-sap-text-color';
const label = 'min-w-48';

@Component({
    selector: 'story-rating-default',
    imports: [RatingIndicator, ReactiveFormsModule],
    template: `
        <div class="flex flex-col gap-2">
            <div class="${row}">
                <span class="${label}" id="ri-1">Rate (whole stars)</span>
                <fd-rating-indicator
                    ariaLabelledBy="ri-1"
                    [(value)]="one"
                    (ratingChanged)="changes.set(changes() + 1)"
                />
                <span>Value: {{ one() }}, changes: {{ changes() }}</span>
            </div>
            <div class="${row}">
                <span class="${label}" id="ri-2">Halves</span>
                <fd-rating-indicator ariaLabelledBy="ri-2" allowHalves [(value)]="two" />
                <span>Value: {{ two() }}</span>
            </div>
            <div class="${row}">
                <span class="${label}" id="ri-3">7 stars, rounded from 4.6</span>
                <fd-rating-indicator ariaLabelledBy="ri-3" [indicatorCapacity]="7" [value]="4.6" />
            </div>
            <div class="${row}">
                <span class="${label}" id="ri-4">Forms</span>
                <fd-rating-indicator ariaLabelledBy="ri-4" [formControl]="control" />
                <span>Value: {{ control.value }}, touched: {{ control.touched }}</span>
            </div>
            <div class="${row}">
                <span class="${label}" id="ri-5">Disabled</span>
                <fd-rating-indicator ariaLabelledBy="ri-5" disabled allowHalves [value]="3.5" />
            </div>
            <div class="${row}">
                <span class="${label}" id="ri-6">Non-interactive</span>
                <fd-rating-indicator ariaLabelledBy="ri-6" nonInteractive [value]="2" />
            </div>
            <div class="${row}">
                <span class="${label}" id="ri-7">No value</span>
                <fd-rating-indicator ariaLabelledBy="ri-7" />
            </div>
        </div>
    `
})
class StoryRatingDefault {
    protected readonly one = signal<number | null | undefined>(2);
    protected readonly two = signal<number | null | undefined>(2.5);
    protected readonly changes = signal(0);
    protected readonly control = new NgFormControl<number | null>(4);
}

@Component({
    selector: 'story-rating-sizes',
    imports: [RatingIndicator],
    template: `
        <div class="flex flex-wrap gap-x-16 gap-y-6">
            <div class="flex flex-col gap-2">
                @for (size of sizes; track size) {
                    <div class="${row}">
                        <span class="w-16" [id]="'ri-s-' + size">{{ size }}</span>
                        <fd-rating-indicator [ariaLabelledBy]="'ri-s-' + size" [size]="size" [value]="2" />
                    </div>
                }
            </div>
            <div class="flex flex-col gap-2">
                @for (size of sizes; track size) {
                    <div class="${row}">
                        <span class="w-32" [id]="'ri-d-' + size">Display {{ size }}</span>
                        <fd-rating-indicator displayMode [ariaLabelledBy]="'ri-d-' + size" [size]="size" [value]="2" />
                    </div>
                }
            </div>
            <div class="flex flex-col gap-2">
                @for (size of sizes; track size) {
                    <div class="${row}">
                        <span class="w-32" [id]="'ri-h-' + size">Halves {{ size }}</span>
                        <fd-rating-indicator
                            allowHalves
                            [ariaLabelledBy]="'ri-h-' + size"
                            [size]="size"
                            [value]="2.5"
                        />
                    </div>
                }
            </div>
            <div class="flex flex-col gap-2">
                @for (size of sizes; track size) {
                    <div class="${row}">
                        <span class="w-32" [id]="'ri-t-' + size">Total ratings {{ size }}</span>
                        <fd-rating-indicator
                            showDynamicText
                            [ariaLabelledBy]="'ri-t-' + size"
                            [size]="size"
                            [value]="3"
                            [totalRatings]="111"
                        />
                    </div>
                }
            </div>
        </div>
    `
})
class StoryRatingSizes {
    protected readonly sizes = ['lg', 'md', 'sm', 'xs'] as const;
}

@Component({
    selector: 'story-rating-ratings',
    imports: [RatingIndicator],
    template: `
        <div class="flex flex-col gap-2">
            <div class="${row}">
                <span class="${label}" id="ri-r1">Average of ratings</span>
                <fd-rating-indicator ariaLabelledBy="ri-r1" allowHalves [ratings]="ratings" />
            </div>
            <div class="${row}">
                <span class="${label}" id="ri-r2">Votes per rating on hover</span>
                <fd-rating-indicator
                    ariaLabelledBy="ri-r2"
                    displayMode
                    displayAllRatings
                    allowHalves
                    [ratings]="ratings"
                />
            </div>
            <div class="${row}">
                <span class="${label}" id="ri-r6">7 stars, votes per rating</span>
                <fd-rating-indicator
                    ariaLabelledBy="ri-r6"
                    [indicatorCapacity]="7"
                    displayAllRatings
                    [ratings]="ratingsOfSeven"
                />
            </div>
            <div class="${row}">
                <span class="${label}" id="ri-r7">Wrong ratings data (an array)</span>
                <fd-rating-indicator ariaLabelledBy="ri-r7" size="lg" displayAllRatings [ratings]="wrongRatings" />
            </div>
            <div class="${row}">
                <span class="${label}" id="ri-r3">Average and total given</span>
                <fd-rating-indicator ariaLabelledBy="ri-r3" nonInteractive [ratingAverage]="3.2" [totalRatings]="126" />
            </div>
            <div class="${row}">
                <span class="${label}" id="ri-r4">Custom icons</span>
                <fd-rating-indicator
                    ariaLabelledBy="ri-r4"
                    allowHalves
                    ratedIcon="decline"
                    unratedIcon="circle-task-2"
                    [value]="2.5"
                />
            </div>
            <div class="${row}">
                <span class="${label}" id="ri-r5">Custom icons, large</span>
                <fd-rating-indicator
                    ariaLabelledBy="ri-r5"
                    size="lg"
                    ratedIcon="heart"
                    unratedIcon="heart-2"
                    [value]="3"
                />
            </div>
        </div>
    `
})
class StoryRatingRatings {
    protected readonly ratings = { 1: 4, 2: 2, 3: 9, 4: 23, 5: 41 };
    protected readonly ratingsOfSeven = { 1: 1, 2: 100, 5: 1, 7: 10 };
    /** Upstream's example of wrong data: an array is read as votes per index. */
    protected readonly wrongRatings: Record<number, number> = [1, 2, 3, 4, 5];
}

const meta: Meta<RatingIndicator> = {
    title: 'Components/Rating Indicator',
    component: RatingIndicator,
    decorators: [
        moduleMetadata({ imports: [RatingIndicator, StoryRatingDefault, StoryRatingSizes, StoryRatingRatings] })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Shows a rating as stars or custom icons and lets the user rate. It is a slider: Left/Down and Right/Up change the rating by one (or a half with `allowHalves`), Home and End go to 0 and the maximum and digit keys set it; clicking the first half of a star rates a half. ' +
                    'With `ratings` it shows the average and the number of votes, and with `displayAllRatings` the votes per rating in a popover.'
            }
        }
    },
    argTypes: { size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] } },
    args: { ariaLabel: 'Rating', size: 'md', allowHalves: false, displayMode: false, disabled: false }
};
export default meta;
type Story = StoryObj<RatingIndicator>;

export const Playground: Story = {
    render: (args) => ({
        props: { ...args, value: 3 },
        template: `<fd-rating-indicator ${argsToTemplate(args)} [(value)]="value" />`
    })
};
export const Default: Story = { render: () => ({ template: `<story-rating-default />` }) };
export const Sizes: Story = { name: 'Sizes and display mode', render: () => ({ template: `<story-rating-sizes />` }) };
export const Ratings: Story = {
    name: 'Ratings and custom icons',
    render: () => ({ template: `<story-rating-ratings />` })
};

/** Hovers the number of votes and waits for the votes per rating. */
async function openVotes(canvasElement: HTMLElement): Promise<void> {
    await userEvent.hover(canvasElement.querySelector<HTMLElement>('fd-rating-indicator a')!);
    await waitFor(() => expect(document.querySelector('.cdk-overlay-pane fd-popover-body ul li')).not.toBeNull());
}

export const OpenVotes: Story = {
    name: 'Open: Votes per rating',
    tags: ['!autodocs'],
    render: () => ({
        props: { ratings: { 1: 4, 2: 2, 3: 9, 4: 23, 5: 41 } },
        template: `<fd-rating-indicator ariaLabel="Product rating" displayMode displayAllRatings allowHalves [ratings]="ratings" />`
    }),
    play: ({ canvasElement }) => openVotes(canvasElement)
};
