import { Component, inject, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Avatar } from '@/ui/avatar/avatar';
import { Bar, BarRight } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { Menu, MenuInteractive, MenuItem, MenuTitle, MenuTrigger } from '@/ui/menu/menu';
import { MessageToastService } from '@/ui/message-toast/message-toast';
import { ObjectMarker } from '@/ui/object-marker/object-marker';
import { ObjectStatusComponent } from '@/ui/object-status/object-status';
import { ProductSwitch, ProductSwitchBody, type ProductSwitchItem } from '@/ui/product-switch/product-switch';
import { Switch } from '@/ui/switch/switch';
import {
    UserMenu,
    UserMenuBody,
    UserMenuContentContainer,
    UserMenuControl,
    UserMenuFooter,
    UserMenuHeader,
    UserMenuHeaderContainer,
    UserMenuList,
    UserMenuListItem,
    UserMenuSubline,
    UserMenuUserName
} from '@/ui/user-menu/user-menu';
import {
    ProductMenu,
    Shellbar,
    ShellbarAction,
    ShellbarActions,
    ShellbarBranding,
    ShellbarContextArea,
    ShellbarHidePriority,
    ShellbarLogo,
    ShellbarSearch,
    ShellbarSeparator,
    ShellbarSubtitle,
    ShellbarTitle,
    type ShellbarMenuItem,
    type ShellbarSize,
    type ShellbarUser,
    type ShellbarUserMenuItem
} from './shellbar';

/** A neutral placeholder logo. */
const LOGO =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'><rect width='60' height='30' rx='4' fill='%230070f2'/><text x='30' y='20' font-family='Arial' font-size='13' font-weight='bold' fill='white' text-anchor='middle'>ACME</text></svg>";

const SHELLBAR = [
    Shellbar,
    ShellbarBranding,
    ShellbarLogo,
    ShellbarTitle,
    ShellbarSubtitle,
    ShellbarSeparator,
    ShellbarContextArea,
    ShellbarHidePriority,
    ShellbarSearch,
    ShellbarActions,
    ShellbarAction,
    ProductMenu
];
const USER_MENU = [
    UserMenu,
    UserMenuBody,
    UserMenuContentContainer,
    UserMenuControl,
    UserMenuFooter,
    UserMenuHeader,
    UserMenuHeaderContainer,
    UserMenuList,
    UserMenuListItem,
    UserMenuSubline,
    UserMenuUserName,
    Avatar,
    Bar,
    BarRight,
    Button
];

/** A user menu as in the shellbar examples. */
@Component({
    selector: 'story-shellbar-user-menu',
    imports: USER_MENU,
    template: `
        <fd-user-menu #menu>
            <fd-user-menu-control>
                <fd-avatar size="xs" circle interactive label="Lisa Miller" />
            </fd-user-menu-control>
            <fd-user-menu-body>
                <div fd-user-menu-header>
                    <fd-avatar circle size="l" label="Lisa Miller" />
                    <div fd-user-menu-header-container>
                        <div fd-user-menu-user-name>Lisa Miller</div>
                        <div fd-user-menu-subline>lisa.miller&#64;test.com</div>
                        <div fd-user-menu-subline>User Experience Designer</div>
                    </div>
                    <button fdButton label="Manage Account" glyph="user-settings"></button>
                </div>
                <div fd-user-menu-content-container>
                    <fd-user-menu-list>
                        <li fd-user-menu-list-item icon="action-settings" text="Settings" (click)="menu.close()"></li>
                        <li fd-user-menu-list-item icon="message-information" text="About" (click)="menu.close()"></li>
                    </fd-user-menu-list>
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
    `
})
class StoryShellbarUserMenu {}

const PRODUCTS: ProductSwitchItem[] = [
    { title: 'Home', subtitle: 'Central Home', icon: 'home' },
    { title: 'Analytics Cloud', icon: 'business-objects-experience' },
    { title: 'Catalog', subtitle: 'Ariba', icon: 'contacts' },
    { title: 'Guided Buying', icon: 'credit-card' },
    { title: 'Strategic Procurement', icon: 'cart-3' },
    { title: 'Human Capital Management', icon: 'customer' }
];

@Component({
    selector: 'story-shellbar',
    imports: [...SHELLBAR, StoryShellbarUserMenu, ProductSwitch, ProductSwitchBody],
    template: `
        <div [style.max-width.px]="width()">
            <fd-shellbar
                [showNavigationButton]="navigation()"
                [showBackButton]="navigation()"
                (navigationButtonClicked)="toast('Navigation')"
                (backButtonClicked)="toast('Back')"
            >
                <fd-shellbar-branding
                    interactiveBranding
                    ariaLabel="ACME Corporate Portal home"
                    (click)="toast('Home')"
                >
                    <fd-shellbar-logo><img [src]="logo" alt="ACME" /></fd-shellbar-logo>
                    <fd-shellbar-title>Corporate Portal</fd-shellbar-title>
                </fd-shellbar-branding>
                @if (search()) {
                    <fd-shellbar-search placeholder="Search everything" (searchSubmit)="toast('Search: ' + $event)" />
                }
                <fd-shellbar-actions>
                    @for (action of actions; track action.label) {
                        <fd-shellbar-action
                            [glyph]="action.glyph"
                            [label]="action.label"
                            [notificationCount]="action.count"
                            [notificationLabel]="action.count ? action.count + ' new' : null"
                            [callback]="action.callback"
                        />
                    }
                    <story-shellbar-user-menu ngProjectAs="fd-user-menu" />
                    <fd-product-switch>
                        <fd-product-switch-body [products]="products" />
                    </fd-product-switch>
                </fd-shellbar-actions>
            </fd-shellbar>
        </div>
    `
})
class StoryShellbar {
    readonly width = input<number | null>(null);
    readonly search = input(true);
    readonly navigation = input(true);
    protected readonly logo = LOGO;
    protected readonly products = PRODUCTS.map((p) => ({ ...p, callback: () => undefined }));
    private readonly toasts = inject(MessageToastService);
    protected readonly actions = [
        { glyph: 'ai', label: 'Joule', count: 0, callback: () => this.toast('Joule') },
        { glyph: 'bell', label: 'Notifications', count: 72, callback: () => this.toast('Notifications') },
        { glyph: 'feedback', label: 'Feedback', count: 0, callback: () => this.toast('Feedback') },
        { glyph: 'sys-help', label: 'Help', count: 0, callback: () => this.toast('Help') }
    ];

    protected toast(text: string): void {
        this.toasts.open(text, { duration: 2000 });
    }
}

@Component({
    selector: 'story-shellbar-sizes',
    imports: [StoryShellbar],
    template: `
        <div class="flex flex-col gap-6">
            @for (s of sizes; track s.size) {
                <div>
                    <p class="m-0 mb-1 font-sap-font-family text-sap-font-small-size text-sap-content-label-color">
                        {{ s.size.toUpperCase() }}: {{ s.width }}px
                    </p>
                    <story-shellbar [width]="s.width" />
                </div>
            }
        </div>
    `
})
class StoryShellbarSizes {
    protected readonly sizes: { size: ShellbarSize; width: number }[] = [
        { size: 'xl', width: 1300 },
        { size: 'l', width: 1000 },
        { size: 'm', width: 560 },
        { size: 's', width: 319 }
    ];
}

@Component({
    selector: 'story-shellbar-context',
    imports: [
        ...SHELLBAR,
        ObjectStatusComponent,
        ObjectMarker,
        Switch,
        Button,
        Menu,
        MenuItem,
        MenuInteractive,
        MenuTitle,
        MenuTrigger,
        StoryShellbarUserMenu
    ],
    template: `
        <div [style.max-width.px]="width()">
            <fd-shellbar showNavigationButton>
                <fd-shellbar-branding interactiveBranding ariaLabel="ACME Corporate Portal home">
                    <fd-shellbar-logo><img [src]="logo" alt="ACME" /></fd-shellbar-logo>
                    <fd-shellbar-title>Corporate Portal</fd-shellbar-title>
                </fd-shellbar-branding>
                <fd-shellbar-context-area (contentItemVisibilityChange)="hidden.set($event.length)">
                    <fd-shellbar-separator />
                    <button fdButton variant="transparent" label="EMEA" fdMenu [fdMenuTrigger]="region"></button>
                    <fd-menu #region>
                        <li fd-menu-item>
                            <div fd-menu-interactive><span fd-menu-title>EMEA</span></div>
                        </li>
                        <li fd-menu-item>
                            <div fd-menu-interactive><span fd-menu-title>Americas</span></div>
                        </li>
                        <li fd-menu-item>
                            <div fd-menu-interactive><span fd-menu-title>APJ</span></div>
                        </li>
                    </fd-menu>
                    <fd-shellbar-separator />
                    <span
                        fd-object-status
                        inverted
                        [indicationColor]="5"
                        label="Environment"
                        fdShellbarHidePriority="4"
                    ></span>
                    <span fd-object-marker glyph="flag" label="New Feature" fdShellbarHidePriority="3"></span>
                    <fd-switch ariaLabel="Preview mode" fdShellbarHidePriority="2" />
                </fd-shellbar-context-area>
                <fd-shellbar-actions [assistiveTools]="true" [assistiveToolsCallback]="noop">
                    <fd-shellbar-action glyph="bell" label="Notifications" [notificationCount]="3" />
                    <story-shellbar-user-menu ngProjectAs="fd-user-menu" />
                </fd-shellbar-actions>
            </fd-shellbar>
            <p
                class="m-0 mt-2 font-sap-font-family text-sap-font-small-size text-sap-content-label-color"
                aria-live="polite"
            >
                Hidden context items: {{ hidden() }}
            </p>
        </div>
    `
})
class StoryShellbarContext {
    readonly width = input<number | null>(null);
    protected readonly logo = LOGO;
    protected readonly hidden = signal(0);
    protected readonly noop = () => undefined;
}

@Component({
    selector: 'story-shellbar-simple',
    imports: [...SHELLBAR],
    template: `
        <fd-shellbar>
            <fd-shellbar-logo><img [src]="logo" alt="ACME" /></fd-shellbar-logo>
            <fd-product-menu control="Corporate Portal" [items]="productItems" closePopoverOnSelect />
            <fd-shellbar-subtitle>Subtitle</fd-shellbar-subtitle>
            <fd-shellbar-actions [user]="user" [userMenu]="userMenu">
                <fd-shellbar-action
                    glyph="bell"
                    label="Notifications"
                    [notificationCount]="5"
                    notificationLabel="5 unread"
                />
                <fd-shellbar-action glyph="sys-help" label="Help" />
            </fd-shellbar-actions>
        </fd-shellbar>
    `
})
class StoryShellbarSimple {
    protected readonly logo = LOGO;
    protected readonly user: ShellbarUser = { fullName: 'William Wallingham', colorAccent: 6 };
    protected readonly userMenu: ShellbarUserMenuItem[] = [{ text: 'Settings' }, { text: 'Sign Out' }];
    protected readonly productItems: ShellbarMenuItem[] = [
        { name: 'Application A' },
        { name: 'Application B', glyph: 'action-settings' },
        { name: 'Application C' }
    ];
}

/** Clicks the button named `name` in the story and waits for the menu it opens. */
function openFrom(name: string | RegExp): Story['play'] {
    return async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name }));
        await waitFor(() => expect(document.querySelector('.cdk-overlay-container [role=menuitem]')).not.toBeNull());
    };
}

const meta: Meta<Shellbar> = {
    title: 'Components/Shellbar',
    component: Shellbar,
    decorators: [
        moduleMetadata({ imports: [StoryShellbar, StoryShellbarSizes, StoryShellbarContext, StoryShellbarSimple] })
    ],
    parameters: {
        layout: 'padded',
        docs: {
            story: { inline: false, iframeHeight: 420 },
            description: {
                component:
                    'The shellbar is the top bar of an application: navigation and back buttons, the branding (logo and title), an optional context area, a search field, actions, the user menu and the product switch. ' +
                    'Its size follows its width (s below 320px, m below 600px, l below 1240px, xl above). Actions that do not fit collapse into an overflow menu, context area items hide by `fdShellbarHidePriority`, ' +
                    'and the search moves from the middle (xl) behind a search button; on small sizes it opens in place of everything else. Transparent buttons inside the shellbar take the shell colours.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Shellbar>;

export const Basic: Story = { render: () => ({ template: `<story-shellbar />` }) };
export const Responsive: Story = {
    name: 'Responsive sizes',
    parameters: { docs: { story: { iframeHeight: 520 } } },
    render: () => ({ template: `<story-shellbar-sizes />` })
};
export const ContextArea: Story = {
    name: 'Context area',
    render: () => ({ template: `<story-shellbar-context />` })
};
export const ContextAreaOverflow: Story = {
    name: 'Context area overflow',
    render: () => ({ template: `<story-shellbar-context [width]="480" />` })
};
export const ProductMenuAndSimpleUserMenu: Story = {
    name: 'Product menu and simple user menu',
    render: () => ({ template: `<story-shellbar-simple />` })
};
export const OpenUserMenu: Story = {
    name: 'Open: user menu',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-shellbar />` }),
    play: openFrom('Lisa Miller')
};
export const OpenProductSwitch: Story = {
    name: 'Open: product switch',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-shellbar />` }),
    play: openFrom('Product switch')
};
export const OpenProductMenu: Story = {
    name: 'Open: product menu',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-shellbar-simple />` }),
    play: openFrom('Corporate Portal')
};
export const OpenSimpleUserMenu: Story = {
    name: 'Open: simple user menu',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-shellbar-simple />` }),
    play: openFrom('William Wallingham')
};
