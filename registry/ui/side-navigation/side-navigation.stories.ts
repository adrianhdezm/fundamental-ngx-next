import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import {
    NestedItem,
    NestedLink,
    NestedList,
    NestedListContent,
    NestedListExpandIcon,
    NestedListHeader,
    NestedListIcon,
    NestedListPopover,
    NestedListTitle
} from '@/ui/nested-list/nested-list';
import { SideNavigation, SideNavigationMain, SideNavigationUtility, type SideNavigationModel } from './side-navigation';

const NESTED = [
    NestedList,
    NestedItem,
    NestedLink,
    NestedListTitle,
    NestedListIcon,
    NestedListHeader,
    NestedListContent,
    NestedListExpandIcon,
    NestedListPopover
];

@Component({
    selector: 'story-side-nav',
    imports: [SideNavigation, SideNavigationMain, SideNavigationUtility, ...NESTED],
    template: `
        <div class="flex h-[32rem] gap-4">
            <div [class]="condensed() ? 'w-16 shadow-sap-content-shadow0' : 'w-72 shadow-sap-content-shadow0'">
                <fd-side-nav [condensed]="condensed()" [selectable]="selectable()">
                    <div fd-side-nav-main>
                        <ul fd-nested-list>
                            <li fd-nested-list-header>Overview</li>
                            <li fd-nested-list-item>
                                <a fd-nested-list-link [selected]="!selectable()" (click)="chosen.set('Home')">
                                    <i fd-nested-list-icon glyph="home"></i>
                                    <span fd-nested-list-title>Home</span>
                                </a>
                            </li>
                            <li fd-nested-list-item>
                                <a fd-nested-list-link (click)="chosen.set('Analytics')">
                                    <i fd-nested-list-icon glyph="crossed-line-chart"></i>
                                    <span fd-nested-list-title>Analytics</span>
                                </a>
                            </li>
                            <li fd-nested-list-header>Administration</li>
                            <li fd-nested-list-item [(expanded)]="settingsOpen">
                                @if (condensed()) {
                                    <fd-nested-list-popover>
                                        <div fd-nested-list-content>
                                            <a fd-nested-list-link>
                                                <i fd-nested-list-icon glyph="settings"></i>
                                                <span fd-nested-list-title>Settings</span>
                                            </a>
                                            <button fd-nested-list-expand-icon></button>
                                        </div>
                                        <ul fd-nested-list>
                                            @for (sub of settings; track sub) {
                                                <li fd-nested-list-item>
                                                    <a fd-nested-list-link (click)="chosen.set(sub)">
                                                        <span fd-nested-list-title>{{ sub }}</span>
                                                    </a>
                                                </li>
                                            }
                                        </ul>
                                    </fd-nested-list-popover>
                                } @else {
                                    <div fd-nested-list-content>
                                        <a fd-nested-list-link>
                                            <i fd-nested-list-icon glyph="settings"></i>
                                            <span fd-nested-list-title>Settings</span>
                                        </a>
                                        <button fd-nested-list-expand-icon></button>
                                    </div>
                                    <ul fd-nested-list textOnly>
                                        @for (sub of settings; track sub) {
                                            <li fd-nested-list-item>
                                                <a fd-nested-list-link (click)="chosen.set(sub)">
                                                    <span fd-nested-list-title>{{ sub }}</span>
                                                </a>
                                            </li>
                                        }
                                    </ul>
                                }
                            </li>
                            <li fd-nested-list-item>
                                <a fd-nested-list-link (click)="chosen.set('Equipment')">
                                    <i fd-nested-list-icon glyph="add-equipment"></i>
                                    <span fd-nested-list-title>Equipment</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div fd-side-nav-utility>
                        <ul fd-nested-list>
                            <li fd-nested-list-item>
                                <a fd-nested-list-link (click)="chosen.set('Notifications')">
                                    <i fd-nested-list-icon glyph="bell"></i>
                                    <span fd-nested-list-title>Notifications</span>
                                </a>
                            </li>
                            <li fd-nested-list-item>
                                <a fd-nested-list-link (click)="chosen.set('Help')">
                                    <i fd-nested-list-icon glyph="sys-help"></i>
                                    <span fd-nested-list-title>Help</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </fd-side-nav>
            </div>
            <p class="m-0 font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">
                Chosen: {{ chosen() || 'none' }}
            </p>
        </div>
    `
})
class StorySideNav {
    readonly condensed = input(false);
    readonly selectable = input(true);
    protected readonly settingsOpen = signal(true);
    protected readonly chosen = signal('');
    protected readonly settings = ['Profile', 'Security', 'Language', 'Notifications'];
}

@Component({
    selector: 'story-side-nav-model',
    imports: [SideNavigation],
    template: `
        <div class="flex h-[34rem] gap-4">
            <div [class]="condensed() ? 'w-16 shadow-sap-content-shadow0' : 'w-72 shadow-sap-content-shadow0'">
                <fd-side-nav [sideNavigationConfiguration]="config" [condensed]="condensed()" />
            </div>
            <p class="m-0 font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">
                Chosen: {{ chosen() || 'none' }}
            </p>
        </div>
    `
})
class StorySideNavModel {
    readonly condensed = input(false);
    protected readonly chosen = signal('');
    private readonly pick = (name: string) => () => this.chosen.set(name);
    protected readonly config: SideNavigationModel = {
        mainNavigation: {
            items: [
                { headerTitle: 'Header Title 1' },
                { link: { icon: 'home', title: 'Link 1', callback: this.pick('Link 1') } },
                { headerTitle: 'Header Title 2' },
                { link: { icon: 'account', title: 'Link 2', callback: this.pick('Link 2') } },
                {
                    expanded: true,
                    link: { icon: 'activate', title: 'Link 3' },
                    list: {
                        textOnly: true,
                        items: [
                            { link: { title: 'Sublink 1', callback: this.pick('Sublink 1') } },
                            { link: { title: 'Sublink 2', selected: true, callback: this.pick('Sublink 2') } },
                            { link: { title: 'Sublink 3', callback: this.pick('Sublink 3') } }
                        ]
                    }
                },
                { link: { icon: 'approvals', title: 'Link 4', callback: this.pick('Link 4') } }
            ]
        },
        utilityNavigation: {
            items: [
                { link: { icon: 'action-settings', title: 'Settings', callback: this.pick('Settings') } },
                { link: { icon: 'log', title: 'Sign Out', callback: this.pick('Sign Out') } }
            ]
        }
    };
}

const meta: Meta<SideNavigation> = {
    title: 'Components/Side Navigation',
    component: SideNavigation,
    decorators: [
        moduleMetadata({
            imports: [StorySideNav, StorySideNavModel]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'The side navigation holds main and utility nested lists. Items open child lists with the expand button or the Right arrow (Left in RTL) and close them with the Left arrow; ' +
                    'Up and Down move across all visible items, Enter and Space activate them. Clicking an item selects it and highlights its parents. ' +
                    'Condensed, it shows the first-level icons only and opens child lists in popovers. In fundamental-ngx the side navigation is deprecated in favour of the vertical navigation.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<SideNavigation>;

export const Default: Story = { render: () => ({ template: `<story-side-nav />` }) };
export const Condensed: Story = { render: () => ({ template: `<story-side-nav [condensed]="true" />` }) };
export const NotSelectable: Story = {
    name: 'Not selectable',
    render: () => ({ template: `<story-side-nav [selectable]="false" />` })
};
export const FromData: Story = {
    name: 'From data',
    render: () => ({ template: `<story-side-nav-model />` })
};
export const FromDataCondensed: Story = {
    name: 'From data, condensed',
    render: () => ({ template: `<story-side-nav-model [condensed]="true" />` })
};
/** Opens the child list of a condensed first-level row in its popover from the keyboard. */
async function openChildPopover(canvas: HTMLElement, title: string): Promise<void> {
    const row = await waitFor(() => {
        const el = [...canvas.querySelectorAll<HTMLElement>('[aria-haspopup=tree]')].find(
            (r) => r.textContent?.trim() === title
        );
        expect(el).toBeTruthy();
        return el!;
    });
    if (row.getAttribute('aria-expanded') !== 'true') {
        row.focus();
        await userEvent.keyboard('{ArrowRight}');
    }
    await waitFor(() =>
        expect(document.querySelector('.cdk-overlay-pane fd-popover-body [role=treeitem]')).not.toBeNull()
    );
}

export const OpenCondensed: Story = {
    name: 'Open: condensed popover',
    tags: ['!autodocs'],
    render: Condensed.render,
    play: ({ canvasElement }) => openChildPopover(canvasElement, 'Settings')
};
export const OpenFromDataCondensed: Story = {
    name: 'Open: from data, condensed',
    tags: ['!autodocs'],
    render: FromDataCondensed.render,
    play: ({ canvasElement }) => openChildPopover(canvasElement, 'Link 3')
};
