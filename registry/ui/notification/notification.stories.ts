import { Component, TemplateRef, inject, input, signal, viewChild } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { Button } from '@/ui/button/button';
import { Icon } from '@/ui/icon/icon';
import { MessageStrip } from '@/ui/message-strip/message-strip';
import { ObjectStatusComponent } from '@/ui/object-status/object-status';
import { Popover, PopoverBody, PopoverControl } from '@/ui/popover/popover';
import { Title } from '@/ui/title/title';
import {
    Notification,
    NotificationActions,
    NotificationBody,
    NotificationContent,
    NotificationFooter,
    NotificationFooterContent,
    NotificationGroup,
    NotificationGroupGrowingItem,
    NotificationGroupGrowingItemTitle,
    NotificationGroupHeader,
    NotificationGroupHeaderTitle,
    NotificationGroupList,
    NotificationHeader,
    NotificationList,
    NotificationMessageStrip,
    NotificationParagraph,
    NotificationPopover,
    NotificationRef,
    NotificationSeparator,
    NotificationService,
    NotificationTitle
} from './notification';

const PARTS = [
    Notification,
    NotificationBody,
    NotificationContent,
    NotificationHeader,
    NotificationTitle,
    NotificationParagraph,
    NotificationFooter,
    NotificationFooterContent,
    NotificationSeparator,
    NotificationActions,
    Avatar,
    Icon,
    ObjectStatusComponent,
    Button
];

const LONG =
    'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

@Component({
    selector: 'story-notification-item',
    imports: PARTS,
    template: `
        <fd-notification [selected]="selected()" (click)="clicked()">
            <fd-notification-body>
                <fd-avatar size="xs" glyph="batch-payments" colorAccent="10" ariaLabel="Payments" />
                <fd-notification-content>
                    <fd-notification-header>
                        <fd-icon glyph="error" color="negative" ariaLabel="Negative" />
                        <h4 fd-notification-title [unread]="unread()">{{ title() }}</h4>
                    </fd-notification-header>
                    <p fd-notification-paragraph>{{ text() }}</p>
                    <fd-notification-footer>
                        <span fd-notification-footer-content>Product name</span>
                        <span fd-notification-separator></span>
                        <span fd-notification-footer-content>Feature name</span>
                        <span fd-notification-separator></span>
                        <span fd-notification-footer-content>11:11 AM</span>
                    </fd-notification-footer>
                    <span
                        fd-object-status
                        [indicationColor]="2"
                        secondaryIndication
                        inverted
                        label="Important"
                        glyph="high-priority"
                    ></span>
                </fd-notification-content>
                <fd-notification-actions>
                    @for (action of actions(); track action) {
                        <button
                            fdButton
                            variant="transparent"
                            [glyph]="action"
                            [ariaLabel]="action"
                            [title]="action"
                        ></button>
                    }
                </fd-notification-actions>
            </fd-notification-body>
        </fd-notification>
    `
})
class StoryNotificationItem {
    readonly title = input('Notification title');
    readonly text = input('Description of the notification topic');
    readonly unread = input(false);
    readonly selected = input(false);
    readonly actions = input<string[]>(['decline']);
    protected clicked(): void {}
}

@Component({
    selector: 'story-notification-states',
    imports: [StoryNotificationItem],
    host: { class: 'flex max-w-[27rem] flex-col gap-2' },
    template: `
        <story-notification-item title="Unread notification" unread />
        <story-notification-item title="Selected notification" selected [actions]="['accept', 'decline']" />
        <story-notification-item
            title="Notification title (unread) ${LONG}"
            unread
            [text]="'Description of notification topic ${LONG}'"
            [actions]="['accept', 'decline']"
        />
    `
})
class StoryNotificationStates {}

@Component({
    selector: 'story-notification-group',
    imports: [
        ...PARTS,
        NotificationList,
        NotificationGroup,
        NotificationGroupHeader,
        NotificationGroupHeaderTitle,
        NotificationGroupList,
        NotificationGroupGrowingItem,
        NotificationGroupGrowingItemTitle,
        NotificationPopover,
        NotificationMessageStrip,
        MessageStrip,
        Popover,
        PopoverBody,
        PopoverControl,
        Title
    ],
    template: `
        <fd-popover [noArrow]="false" [isOpen]="open()" (isOpenChange)="open.set($event)">
            <fd-popover-control><button fdButton label="Open notification group"></button></fd-popover-control>
            <fd-popover-body>
                <div fd-notification-popover aria-labelledby="story-notifications-title">
                    <div class="flex items-center gap-2 px-4 py-2">
                        <h4 fdTitle id="story-notifications-title" class="flex-1">Notifications</h4>
                        <button fdButton variant="transparent" label="Clear all"></button>
                        <button fdButton variant="transparent" glyph="sort" ariaLabel="Sort notifications"></button>
                    </div>
                    <div fd-notification-message-strip>
                        <fd-message-strip type="warning" dismissible
                            >A dismissible warning message strip.</fd-message-strip
                        >
                    </div>
                    <ul fd-notification-list>
                        @for (group of groups; track group.title) {
                            <fd-notification-group [expanded]="group.expanded">
                                <fd-notification-group-header>
                                    <span fd-notification-group-header-title>{{ group.title }}</span>
                                </fd-notification-group-header>
                                <fd-notification-group-list>
                                    @for (item of group.items; track item) {
                                        <fd-notification [actionKeyHandler]="onKey">
                                            <fd-notification-body>
                                                <fd-avatar size="xs" glyph="batch-payments" ariaLabel="Payments" />
                                                <fd-notification-content>
                                                    <fd-notification-header>
                                                        <h4 fd-notification-title [unread]="$first">{{ item }}</h4>
                                                    </fd-notification-header>
                                                    <p fd-notification-paragraph>
                                                        Description of the notification topic.
                                                    </p>
                                                    <fd-notification-footer>
                                                        <span fd-notification-footer-content>Product name</span>
                                                        <span fd-notification-separator></span>
                                                        <span fd-notification-footer-content>11:11 AM</span>
                                                    </fd-notification-footer>
                                                </fd-notification-content>
                                                <fd-notification-actions>
                                                    <button
                                                        fdButton
                                                        variant="transparent"
                                                        glyph="decline"
                                                        ariaLabel="Clear notification"
                                                    ></button>
                                                </fd-notification-actions>
                                            </fd-notification-body>
                                        </fd-notification>
                                    }
                                </fd-notification-group-list>
                                <fd-notification-group-growing-item ariaLabel="Show more notifications">
                                    <span fd-notification-group-growing-item-title>More (2)</span>
                                </fd-notification-group-growing-item>
                            </fd-notification-group>
                        }
                    </ul>
                </div>
            </fd-popover-body>
        </fd-popover>
        <p class="font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">{{ last() }}</p>
    `
})
class StoryNotificationGroup {
    readonly open = signal(false);
    readonly autoOpen = input(false);
    protected readonly last = signal('');
    protected readonly groups = [
        { title: 'Today', expanded: true, items: ['Leave request approved', 'New purchase order', 'Invoice overdue'] },
        { title: 'Yesterday', expanded: false, items: ['Meeting moved', 'Report ready'] }
    ];
    protected readonly onKey = (_: KeyboardEvent, key: 'enter' | 'delete') =>
        this.last.set(key === 'enter' ? 'Notification opened' : 'Notification removed');
    constructor() {
        queueMicrotask(() => this.autoOpen() && this.open.set(true));
    }
}

@Component({
    imports: PARTS,
    template: `
        <fd-notification>
            <fd-notification-body>
                <fd-avatar size="xs" glyph="product" ariaLabel="Product" />
                <fd-notification-content>
                    <fd-notification-header>
                        <fd-icon glyph="sys-enter-2" color="positive" ariaLabel="Positive" />
                        <h4 fd-notification-title unread>{{ ref.data.title }}</h4>
                    </fd-notification-header>
                    <p fd-notification-paragraph>Opened from a component with the notification service.</p>
                    <fd-notification-footer>
                        <span fd-notification-footer-content>Orders</span>
                        <span fd-notification-separator></span>
                        <span fd-notification-footer-content>Just now</span>
                    </fd-notification-footer>
                </fd-notification-content>
                <fd-notification-actions>
                    <button
                        fdButton
                        variant="transparent"
                        glyph="accept"
                        ariaLabel="Approve"
                        (click)="ref.close('approved')"
                    ></button>
                    <button
                        fdButton
                        variant="transparent"
                        glyph="decline"
                        ariaLabel="Close"
                        (click)="ref.dismiss('closed')"
                    ></button>
                </fd-notification-actions>
            </fd-notification-body>
        </fd-notification>
    `
})
class StoryNotificationContent {
    protected readonly ref = inject<NotificationRef<{ title: string }>>(NotificationRef);
}

@Component({
    selector: 'story-notification-service',
    imports: [...PARTS],
    providers: [NotificationService],
    template: `
        <ng-template #tpl let-ref>
            <fd-notification width="25rem">
                <fd-notification-body>
                    <fd-notification-content>
                        <fd-notification-header>
                            <h4 fd-notification-title>Opened from a template</h4>
                        </fd-notification-header>
                        <p fd-notification-paragraph>Press Escape to dismiss it.</p>
                    </fd-notification-content>
                    <fd-notification-actions>
                        <button
                            fdButton
                            variant="transparent"
                            glyph="decline"
                            ariaLabel="Close"
                            (click)="ref.close('closed')"
                        ></button>
                    </fd-notification-actions>
                </fd-notification-body>
            </fd-notification>
        </ng-template>
        <div class="flex flex-wrap gap-2">
            <button fdButton label="Open from component" (click)="fromComponent()"></button>
            <button fdButton label="Open from template" (click)="fromTemplate()"></button>
            <button fdButton label="Close all" (click)="service.destroyAll()"></button>
        </div>
        <p class="font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">{{ status() }}</p>
    `
})
class StoryNotificationService {
    protected readonly service = inject(NotificationService);
    private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    protected readonly status = signal('');
    private count = 0;
    protected fromComponent(): void {
        this.report(
            this.service.open(StoryNotificationContent, {
                data: { title: `New order ${++this.count}` },
                width: '25rem'
            })
        );
    }
    protected fromTemplate(): void {
        this.report(this.service.open(this.tpl(), { escKeyCloseable: true }));
    }
    private report(ref: NotificationRef): void {
        ref.afterClosed.subscribe({
            next: (r) => this.status.set(`Notification closed: ${r}`),
            error: (r) => this.status.set(`Notification dismissed: ${r}`)
        });
    }
}

const meta: Meta<Notification> = {
    title: 'Components/Notification',
    component: Notification,
    decorators: [
        moduleMetadata({ imports: [StoryNotificationStates, StoryNotificationGroup, StoryNotificationService] })
    ],
    parameters: {
        docs: {
            story: { inline: false, iframeHeight: 520 },
            description: {
                component:
                    'A notification informs about an event with a title, a description, footnotes, a status and actions. Long texts are clamped to two lines with a More/Less link. ' +
                    'Notifications appear in lists and collapsible groups (arrow keys, Home and End move between them) or as banners opened by the `NotificationService`.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Notification>;

export const States: Story = { name: 'Notifications', render: () => ({ template: `<story-notification-states />` }) };
export const Group: Story = {
    name: 'Groups in a popover',
    render: () => ({ template: `<story-notification-group />` })
};
export const Service: Story = { name: 'Service', render: () => ({ template: `<story-notification-service />` }) };
export const OpenGroup: Story = {
    name: 'Open: groups',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-notification-group [autoOpen]="true" />` })
};
