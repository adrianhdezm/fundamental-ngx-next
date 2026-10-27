import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { FeedInput, FeedInputAvatar, FeedInputButton, FeedInputTextarea } from './feed-input';

const PHOTO =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' fill='%23a2c4e6'/><circle cx='40' cy='31' r='15' fill='%23557a9e'/><path d='M12 80c3-18 15-26 28-26s25 8 28 26z' fill='%23557a9e'/></svg>";

@Component({
    selector: 'story-feed-input',
    imports: [FeedInput, FeedInputAvatar, FeedInputTextarea, FeedInputButton, Avatar],
    template: `
        <div [style.max-width]="width()">
            <fd-feed-input ariaLabel="Post a comment" [disabled]="disabled()">
                @if (avatar() === 'image') {
                    <fd-avatar fdFeedInputAvatar size="s" [image]="photo" ariaLabel="John Doe" />
                }
                @if (avatar() === 'placeholder') {
                    <fd-avatar fdFeedInputAvatar size="s" placeholder glyph="person-placeholder" ariaLabel="John Doe" />
                }
                @if (avatar() === 'circle') {
                    <fd-avatar fdFeedInputAvatar size="s" circle [image]="photo" ariaLabel="John Doe" />
                }
                <textarea
                    #text
                    fdFeedInputTextarea
                    aria-label="Comment"
                    [fdFeedInputTextareaMaxRows]="maxRows()"
                    [placeholder]="disabled() ? 'Disabled' : 'Post something here'"
                ></textarea>
                <button fdFeedInputButton ariaLabel="Send" (click)="posted.set(text.value)"></button>
            </fd-feed-input>
        </div>
        <p class="m-0 font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">
            {{ posted() ? 'Posted: ' + posted() : '' }}
        </p>
    `
})
class StoryFeedInput {
    readonly avatar = input<'image' | 'placeholder' | 'circle' | 'none'>('image');
    readonly disabled = input(false);
    readonly maxRows = input<number | null>(null);
    readonly width = input('none');
    protected readonly photo = PHOTO;
    protected readonly posted = signal('');
}

const meta: Meta<FeedInput> = {
    title: 'Components/Feed Input',
    component: FeedInput,
    decorators: [moduleMetadata({ imports: [StoryFeedInput] })],
    parameters: {
        docs: {
            description: {
                component:
                    'The feed input posts to a feed: the user avatar, a text area that grows with its text (up to `fdFeedInputTextareaMaxRows` rows, 20rem by default) and a send button that is enabled once there is text. ' +
                    'Below 20rem the avatar hides.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<FeedInput>;

export const Default: Story = { render: () => ({ template: `<story-feed-input />` }) };
export const CircleAvatar: Story = {
    name: 'Circle avatar',
    render: () => ({ template: `<story-feed-input avatar="circle" />` })
};
export const PlaceholderAvatar: Story = {
    name: 'Placeholder avatar',
    render: () => ({ template: `<story-feed-input avatar="placeholder" />` })
};
export const NoAvatar: Story = {
    name: 'No avatar',
    render: () => ({ template: `<story-feed-input avatar="none" />` })
};
export const Grow: Story = {
    name: 'Grow up to 7 rows',
    render: () => ({ template: `<story-feed-input [maxRows]="7" />` })
};
export const Disabled: Story = { render: () => ({ template: `<story-feed-input [disabled]="true" />` }) };
export const Narrow: Story = {
    name: 'Narrow (below 20rem)',
    render: () => ({ template: `<story-feed-input width="18rem" />` })
};
