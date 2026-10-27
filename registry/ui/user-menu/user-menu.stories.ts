import { Component, afterNextRender, inject, input, signal, viewChild } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { Bar, BarRight } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { List, ListContent, ListItem, ListSubline, ListTitle } from '@/ui/list/list';
import { MessageStrip } from '@/ui/message-strip/message-strip';
import { MessageToastService } from '@/ui/message-toast/message-toast';
import { Panel, PanelContent, PanelTitle } from '@/ui/panel/panel';
import {
    UserMenu,
    UserMenuBody,
    UserMenuContentContainer,
    UserMenuControl,
    UserMenuControlElement,
    UserMenuFooter,
    UserMenuHeader,
    UserMenuHeaderContainer,
    UserMenuHeaderContentArea,
    UserMenuList,
    UserMenuListItem,
    UserMenuSublist,
    UserMenuSubline,
    UserMenuUserName
} from './user-menu';

const PHOTO =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' fill='%23a2c4e6'/><circle cx='40' cy='31' r='15' fill='%23557a9e'/><path d='M12 80c3-18 15-26 28-26s25 8 28 26z' fill='%23557a9e'/></svg>";

@Component({
    selector: 'story-user-menu',
    imports: [
        UserMenu,
        UserMenuBody,
        UserMenuContentContainer,
        UserMenuControl,
        UserMenuControlElement,
        UserMenuFooter,
        UserMenuHeader,
        UserMenuHeaderContainer,
        UserMenuHeaderContentArea,
        UserMenuList,
        UserMenuListItem,
        UserMenuSublist,
        UserMenuSubline,
        UserMenuUserName,
        Avatar,
        Bar,
        BarRight,
        Button,
        List,
        ListItem,
        ListContent,
        ListTitle,
        ListSubline,
        MessageStrip,
        Panel,
        PanelTitle,
        PanelContent
    ],
    template: `
        <div class="flex justify-end">
            <fd-user-menu #menu [mobile]="mobile()">
                <fd-user-menu-control>
                    <fd-avatar
                        fd-user-menu-control-element
                        size="xs"
                        circle
                        interactive
                        ariaLabel="Lisa Miller"
                        [image]="photo"
                    />
                </fd-user-menu-control>

                <fd-user-menu-body>
                    <div fd-user-menu-header>
                        <fd-avatar circle size="l" label="Lisa Miller" zoomGlyph="edit" title="Edit avatar" />
                        <div fd-user-menu-header-container>
                            <div fd-user-menu-user-name>{{ name() }}</div>
                            <div fd-user-menu-subline>lisa.miller&#64;test.com</div>
                            <div fd-user-menu-subline>User Experience Designer</div>
                            <div fd-user-menu-subline>Primary Employment</div>
                        </div>
                        <div fd-user-menu-header-content-area>
                            <fd-message-strip type="information" [dismissible]="false">
                                This is an information message.
                            </fd-message-strip>
                        </div>
                        <button fdButton label="Manage Account" glyph="user-settings"></button>
                    </div>
                    <div fd-user-menu-content-container>
                        <fd-panel
                            transparent
                            noRadius
                            [(expanded)]="expanded"
                            [expandAriaLabel]="expanded() ? 'Hide other accounts' : 'Show other accounts'"
                        >
                            <h5 fd-panel-title>Accounts (3)</h5>
                            <button
                                fdButton
                                variant="transparent"
                                glyph="user-edit"
                                ariaLabel="Add account"
                                title="Add account"
                            ></button>
                            <div fd-panel-content noPadding ariaLabel="Other accounts">
                                <ul fd-list subline>
                                    @for (account of accounts; track account.mail) {
                                        <li fd-list-item interactive [active]="$first">
                                            <fd-avatar size="s" circle [label]="account.name" />
                                            <div fd-list-content>
                                                <div fd-list-title>{{ account.name }}</div>
                                                <div fd-list-subline>{{ account.mail }}</div>
                                            </div>
                                        </li>
                                    }
                                </ul>
                            </div>
                        </fd-panel>

                        <fd-user-menu-list ariaLabel="User actions">
                            <li
                                fd-user-menu-list-item
                                icon="action-settings"
                                text="Settings"
                                subtitle="Configure profile"
                                (click)="picked('Settings')"
                            ></li>
                            <li
                                fd-user-menu-list-item
                                icon="card"
                                text="Menu Item"
                                subtitle="Menu Item Subtitle"
                                hasSubmenu
                                [submenu]="sublist"
                            ></li>
                            @for (item of items(); track $index) {
                                <li fd-user-menu-list-item icon="card" [text]="item" (click)="picked(item)"></li>
                            }
                            <li fd-user-menu-list-item icon="official-service" text="Legal Information"></li>
                            <li
                                fd-user-menu-list-item
                                icon="message-information"
                                text="About"
                                (click)="picked('About')"
                            ></li>
                        </fd-user-menu-list>

                        <ng-template #sublist>
                            <div fd-user-menu-sublist hasIcons>
                                <li
                                    fd-user-menu-list-item
                                    icon="card"
                                    text="Sub-menu Item"
                                    subtitle="Sub-menu Item Subtitle"
                                    iconAfter="accept"
                                    iconAfterActive
                                    (click)="picked('Sub-menu Item 1')"
                                ></li>
                                <li
                                    fd-user-menu-list-item
                                    text="Sub-menu Item"
                                    hasSubmenu
                                    [submenu]="secondSublist"
                                ></li>
                            </div>
                        </ng-template>
                        <ng-template #secondSublist>
                            <div fd-user-menu-sublist hasIcons>
                                <li
                                    fd-user-menu-list-item
                                    icon="card"
                                    text="Second Level Item 1"
                                    subtitle="Second Level Subtitle"
                                    iconAfter="accept"
                                    iconAfterActive
                                    (click)="picked('Second Level Item 1')"
                                ></li>
                                <li
                                    fd-user-menu-list-item
                                    text="Second Level Item 2"
                                    (click)="picked('Second Level Item 2')"
                                ></li>
                            </div>
                        </ng-template>
                    </div>
                </fd-user-menu-body>

                <fd-user-menu-footer>
                    <div fd-bar barDesign="footer">
                        <div fd-bar-right>
                            <button fdButton variant="transparent" label="Sign Out" glyph="log"></button>
                        </div>
                    </div>
                </fd-user-menu-footer>
            </fd-user-menu>
        </div>
    `
})
class StoryUserMenu {
    readonly mobile = input(false);
    readonly count = input(20);
    readonly autoOpen = input(false);
    readonly name = input('Lisa Miller');
    protected readonly photo = PHOTO;
    protected readonly expanded = signal(true);
    protected readonly accounts = [
        { name: 'Lisa Miller', mail: 'lisa.miller@test.com' },
        { name: 'John Doe', mail: 'john.doe@test.com' },
        { name: 'Jane Doe', mail: 'jane.doe@test.com' }
    ];
    protected readonly items = signal<string[]>([]);
    private readonly menu = viewChild.required<UserMenu>('menu');
    private readonly toasts = inject(MessageToastService);

    constructor() {
        queueMicrotask(() => this.items.set(Array.from({ length: this.count() }, (_, i) => `Menu Item ${i + 1}`)));
        afterNextRender(() => this.autoOpen() && setTimeout(() => this.menu().open(), 50));
    }

    protected picked(action: string): void {
        this.toasts.open(`${action} action performed`, { duration: 5000 });
        this.menu().close();
    }
}

const meta: Meta<UserMenu> = {
    title: 'Components/User Menu',
    component: UserMenu,
    decorators: [moduleMetadata({ imports: [StoryUserMenu] })],
    parameters: {
        docs: {
            story: { inline: false, iframeHeight: 720 },
            description: {
                component:
                    'The user menu opens from the avatar of the signed-in user, usually in the shellbar. It shows the user name and details, ' +
                    'free header content, panels such as other accounts, a list of actions with optional submenus, and a footer. ' +
                    'When the user name scrolls out of view it appears in a header bar. Arrow keys move between items; the Right arrow (Left in RTL) opens a submenu and the Left arrow or Escape closes it. ' +
                    'In mobile mode the menu opens in a full-screen dialog and submenus replace the main view.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<UserMenu>;

export const Default: Story = { render: () => ({ template: `<story-user-menu />` }) };
export const Mobile: Story = { render: () => ({ template: `<story-user-menu [mobile]="true" />` }) };
export const OpenDesktop: Story = {
    name: 'Open: desktop',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-user-menu [autoOpen]="true" [count]="2" />` })
};
export const OpenLong: Story = {
    name: 'Open: long name, scrolling',
    tags: ['!autodocs'],
    render: () => ({
        template: `<story-user-menu [autoOpen]="true" name="Maximilian Alexander Featherstonehaugh-Montgomery the Third" />`
    })
};
export const OpenMobile: Story = {
    name: 'Open: mobile',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-user-menu [autoOpen]="true" [mobile]="true" [count]="2" />` })
};
