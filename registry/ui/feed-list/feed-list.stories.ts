import { Component, input } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { ActionSheet, ActionSheetBody, ActionSheetControl, ActionSheetItem } from '@/ui/action-sheet/action-sheet';
import { Avatar } from '@/ui/avatar/avatar';
import { Button } from '@/ui/button/button';
import { Link } from '@/ui/link/link';
import {
    FeedList,
    FeedListAction,
    FeedListAvatar,
    FeedListFooter,
    FeedListFooterByline,
    FeedListItem
} from './feed-list';

const LONG =
    'Long text, you can toggle the view with the more and less link. Lorem Ipsum is simply dummy text of the printing and typesetting industry. ' +
    'Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.';

@Component({
    selector: 'story-feed-list',
    imports: [
        FeedList,
        FeedListItem,
        FeedListAvatar,
        FeedListAction,
        FeedListFooter,
        FeedListFooterByline,
        Avatar,
        Button,
        Link,
        ActionSheet,
        ActionSheetControl,
        ActionSheetBody,
        ActionSheetItem
    ],
    template: `
        <div [style.max-width]="mobile() ? '22rem' : null">
            <fd-feed-list ariaLabel="Comments" [mobile]="mobile()" [borderLess]="borderLess()">
                @for (post of posts; track post.author) {
                    <fd-feed-list-item
                        [authorTitle]="post.author"
                        [authorLink]="post.link"
                        [text]="post.text"
                        [maxChars]="maxChars()"
                        [isRichText]="!!post.rich"
                    >
                        @if (avatars()) {
                            <fd-feed-list-avatar>
                                <fd-avatar size="s" circle [label]="post.author" />
                            </fd-feed-list-avatar>
                        }
                        @if (actions()) {
                            <fd-feed-list-action>
                                <fd-action-sheet #sheet placement="bottom-end" [mobile]="mobile()">
                                    <fd-action-sheet-control>
                                        <button
                                            fdButton
                                            variant="transparent"
                                            glyph="overflow"
                                            [ariaLabel]="'Actions for the post of ' + post.author"
                                        ></button>
                                    </fd-action-sheet-control>
                                    <fd-action-sheet-body ariaLabel="Post actions">
                                        <li
                                            fd-action-sheet-item
                                            label="Edit"
                                            glyph="edit"
                                            (click)="sheet.isOpen.set(false)"
                                        ></li>
                                        <li
                                            fd-action-sheet-item
                                            label="Share"
                                            glyph="share"
                                            (click)="sheet.isOpen.set(false)"
                                        ></li>
                                        <li
                                            fd-action-sheet-item
                                            label="Delete"
                                            glyph="delete"
                                            negative
                                            (click)="sheet.isOpen.set(false)"
                                        ></li>
                                    </fd-action-sheet-body>
                                </fd-action-sheet>
                            </fd-feed-list-action>
                        }
                        <fd-feed-list-footer>
                            <small fd-item-footer-byline>{{ post.date }}</small>
                            <small fd-item-footer-byline
                                ><a fdLink href="#" (click)="$event.preventDefault()">Reply</a></small
                            >
                        </fd-feed-list-footer>
                    </fd-feed-list-item>
                }
            </fd-feed-list>
        </div>
    `
})
class StoryFeedList {
    readonly mobile = input(false);
    readonly borderLess = input(false);
    readonly avatars = input(true);
    readonly actions = input(false);
    readonly maxChars = input<number | null>(120);
    protected readonly posts = [
        { author: 'John Doe', link: 'https://example.com/', text: LONG, date: 'Aug 20, 2020' },
        {
            author: 'Cruz',
            link: null,
            text: 'Maecenas convallis velit quis felis dictum, in ultrices quam faucibus.',
            date: 'Aug 21, 2020'
        },
        {
            author: 'Sanchez',
            link: null,
            text: 'Rich text with <strong>bold</strong>, <em>italic</em> and a <a href="https://example.com">link</a>.',
            rich: true,
            date: 'Aug 22, 2020'
        }
    ];
}

const meta: Meta<FeedList> = {
    title: 'Components/Feed List',
    component: FeedList,
    decorators: [moduleMetadata({ imports: [StoryFeedList] })],
    parameters: {
        docs: {
            description: {
                component:
                    'A feed list shows posts and comments: the author (a link with `authorLink`), a text collapsed to `maxChars` characters with a More/Less link (or rich text), an avatar, actions and a footer of bylines. ' +
                    'In mobile mode the author, footer and actions go in a header above the text.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<FeedList>;

export const Default: Story = { render: () => ({ template: `<story-feed-list />` }) };
export const WithActions: Story = {
    name: 'With actions',
    render: () => ({ template: `<story-feed-list [actions]="true" />` })
};
export const NoAvatars: Story = {
    name: 'No avatars',
    render: () => ({ template: `<story-feed-list [avatars]="false" />` })
};
export const Borderless: Story = { render: () => ({ template: `<story-feed-list [borderLess]="true" />` }) };
export const Mobile: Story = {
    render: () => ({ template: `<story-feed-list [mobile]="true" [actions]="true" [maxChars]="null" />` })
};
