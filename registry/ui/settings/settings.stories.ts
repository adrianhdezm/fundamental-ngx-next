import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, input, signal, viewChild, type TemplateRef } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { Bar, BarElement, BarLeft, ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { Dialog, DialogBody, DialogFooter, DialogService, DialogTemplate } from '@/ui/dialog/dialog';
import { FormItem, FormLabel } from '@/ui/form/form';
import { FormControl } from '@/ui/input/input';
import { List, ListContent, ListGroupHeader, ListIcon, ListItem, ListLink, ListTitle } from '@/ui/list/list';
import { MessageStrip } from '@/ui/message-strip/message-strip';
import { Switch } from '@/ui/switch/switch';
import { Title } from '@/ui/title/title';
import { Toolbar } from '@/ui/toolbar/toolbar';
import {
    SettingsContainer,
    SettingsContent,
    SettingsContentContainer,
    SettingsList,
    SettingsListArea,
    SettingsListContainer,
    SettingsListFooter,
    SettingsListItem,
    SettingsProfileCard,
    SettingsProfileCardName,
    SettingsProfileCardSubline,
    SettingsSpacing,
    settingsDialogConfig
} from './settings';

const IMPORTS = [
    SettingsContainer,
    SettingsContent,
    SettingsContentContainer,
    SettingsList,
    SettingsListArea,
    SettingsListContainer,
    SettingsListFooter,
    SettingsListItem,
    SettingsProfileCard,
    SettingsProfileCardName,
    SettingsProfileCardSubline,
    SettingsSpacing,
    Avatar,
    Bar,
    BarLeft,
    BarElement,
    ButtonBar,
    Button,
    FormItem,
    FormLabel,
    FormControl,
    List,
    ListItem,
    ListLink,
    ListIcon,
    ListTitle,
    ListContent,
    ListGroupHeader,
    MessageStrip,
    Switch,
    Title,
    Toolbar,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogTemplate,
    NgTemplateOutlet
];

@Component({
    selector: 'story-settings',
    imports: IMPORTS,
    template: `
        @if (inline()) {
            <div
                class="h-[42.5rem] max-w-[60rem] overflow-hidden rounded-sap-element-border-corner-radius bg-sap-group-content-background shadow-sap-content-shadow1"
            >
                <ng-container *ngTemplateOutlet="settings" />
            </div>
        } @else {
            <button fdButton label="Open settings" glyph="action-settings" (click)="open()"></button>
            <p class="m-0 mt-2 font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">
                {{ result() }}
            </p>
        }

        <ng-template fdDialogTemplate let-dialog #dialogTpl>
            <fd-dialog>
                <fd-dialog-body>
                    <ng-container *ngTemplateOutlet="settings" />
                </fd-dialog-body>
                <fd-dialog-footer>
                    @if (resetMode()) {
                        <fd-button-bar variant="emphasized" label="Save" (click)="dialog.close('Save')" />
                        <fd-button-bar label="Cancel" (click)="dialog.dismiss('Cancel')" />
                    } @else {
                        <fd-button-bar label="Close" (click)="dialog.close('Close')" />
                    }
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>

        <ng-template #settings>
            <fd-settings-container #container backBtnAriaLabel="Navigate Back">
                <div fd-settings-list-area>
                    <div fd-bar barDesign="header">
                        <div fd-bar-left>
                            <fd-bar-element
                                ><h2 fd-title [headerSize]="5" id="settings-title">Settings</h2></fd-bar-element
                            >
                        </div>
                    </div>
                    <div fd-settings-list-container>
                        <ul fd-list navigationIndicator noBorder settingsList aria-labelledby="settings-title">
                            @for (entry of entries; track entry.title) {
                                <li
                                    fd-list-item
                                    [settingsListTpl]="templates[entry.tpl]"
                                    [selected]="$first"
                                    (click)="resetMode.set(false)"
                                >
                                    <a fd-list-link navigationIndicator>
                                        <i fd-list-icon [glyph]="entry.glyph"></i>
                                        <span fd-list-title>{{ entry.title }}</span>
                                    </a>
                                </li>
                            }
                        </ul>
                        <ul fd-list navigationIndicator noBorder settingsListFooter aria-label="Reset">
                            <li fd-list-item [settingsListTpl]="reset" (click)="resetMode.set(true)">
                                <a fd-list-link navigationIndicator>
                                    <i fd-list-icon glyph="reset"></i>
                                    <span fd-list-title>Reset Settings</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </fd-settings-container>
        </ng-template>

        <ng-template #account>
            <div fd-settings-content>
                <div fd-settings-profile-card>
                    <fd-avatar
                        circle
                        size="xl"
                        [image]="photo"
                        ariaLabel="Edit avatar of Alain Chevallier"
                        zoomGlyph="edit"
                    />
                    <div fd-settings-profile-card-name>Alain Chevallier</div>
                    <div fd-settings-profile-card-subline>alain.chevallier&#64;example.com</div>
                    <div fd-settings-profile-card-subline>Delivery Manager</div>
                    <button fdButton label="Manage Account" glyph="user-settings"></button>
                </div>
                <div fd-settings-content-container>
                    <span fd-settings-spacing size="small"></span>
                    <div fd-form-item>
                        <label fd-form-label for="settings-name">Display name</label>
                        <input fdFormControl id="settings-name" value="Alain Chevallier" />
                    </div>
                </div>
            </div>
        </ng-template>

        <ng-template #appearance>
            <div fd-settings-content noPadding>
                <fd-toolbar title="Themes" />
                <ul fd-list aria-label="Themes">
                    <li fd-list-group-header><span fd-list-title>SAP Horizon</span></li>
                    @for (theme of themes; track theme) {
                        <li fd-list-item interactive [selected]="theme === 'Morning Horizon'">
                            <fd-avatar [colorAccent]="7" glyph="product" size="s" />
                            <div fd-list-content>
                                <div fd-list-title>{{ theme }}</div>
                            </div>
                        </li>
                    }
                </ul>
            </div>
        </ng-template>

        <ng-template #language>
            <div fd-settings-content>
                @for (field of languageFields; track field.id) {
                    <div fd-form-item>
                        <label fd-form-label [for]="field.id">{{ field.label }}</label>
                        <input fdFormControl [id]="field.id" [value]="field.value" />
                    </div>
                    <span fd-settings-spacing size="form"></span>
                }
            </div>
        </ng-template>

        <ng-template #notifications>
            <div fd-settings-content noPadding>
                <ul fd-list aria-label="Notification sources">
                    @for (source of sources; track source) {
                        <li fd-list-item>
                            <a
                                fd-list-link
                                navigationIndicator
                                href="#"
                                (click)="$event.preventDefault(); container().pushView(detail, source)"
                            >
                                <span fd-list-title>{{ source }}</span>
                            </a>
                        </li>
                    }
                </ul>
            </div>
        </ng-template>

        <ng-template #detail>
            <div fd-settings-content>
                <label class="flex items-center gap-2"
                    ><fd-switch [checked]="true" ariaLabel="Allow notifications" />Allow notifications</label
                >
                <span fd-settings-spacing size="small"></span>
                <label class="flex items-center gap-2"><fd-switch ariaLabel="Play a sound" />Play a sound</label>
            </div>
        </ng-template>

        <ng-template #reset>
            <div fd-settings-content>
                <fd-message-strip type="warning" [dismissible]="false">
                    Resetting restores the default settings and signs you out.
                </fd-message-strip>
            </div>
        </ng-template>
    `
})
class StorySettings {
    readonly inline = input(false);
    readonly autoOpen = input(false);
    protected readonly photo =
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' fill='%23a2c4e6'/><circle cx='40' cy='31' r='15' fill='%23557a9e'/><path d='M12 80c3-18 15-26 28-26s25 8 28 26z' fill='%23557a9e'/></svg>";
    protected readonly result = signal('');
    protected readonly resetMode = signal(false);
    protected readonly container = viewChild.required<SettingsContainer>('container');
    private readonly dialogTpl = viewChild.required<TemplateRef<unknown>>('dialogTpl');
    private readonly account = viewChild.required<TemplateRef<unknown>>('account');
    private readonly appearance = viewChild.required<TemplateRef<unknown>>('appearance');
    private readonly languageTpl = viewChild.required<TemplateRef<unknown>>('language');
    private readonly notificationsTpl = viewChild.required<TemplateRef<unknown>>('notifications');
    private readonly dialogs = inject(DialogService);

    protected readonly entries = [
        { glyph: 'user-settings', title: 'User Account', tpl: 'account' },
        { glyph: 'palette', title: 'Appearance', tpl: 'appearance' },
        { glyph: 'globe', title: 'Language & Region', tpl: 'language' },
        { glyph: 'bell', title: 'Notifications', tpl: 'notifications' }
    ] as const;
    protected readonly themes = [
        'Automatic',
        'Morning Horizon',
        'Evening Horizon',
        'High Contrast Black',
        'High Contrast White'
    ];
    protected readonly sources = ['Leave Requests', 'Purchase Orders', 'Travel Expenses'];
    protected readonly languageFields = [
        { id: 'settings-language', label: 'Display Language', value: 'English (United States)' },
        { id: 'settings-region', label: 'Region', value: 'United States' },
        { id: 'settings-date', label: 'Date Format', value: 'MM.DD.YYYY' },
        { id: 'settings-time', label: 'Time Format', value: '12 Hour' }
    ];

    protected get templates(): Record<string, TemplateRef<unknown>> {
        return {
            account: this.account(),
            appearance: this.appearance(),
            language: this.languageTpl(),
            notifications: this.notificationsTpl()
        };
    }

    constructor() {
        queueMicrotask(() => this.autoOpen() && setTimeout(() => this.open(), 50));
    }

    protected open(): void {
        const ref = this.dialogs.open(this.dialogTpl(), settingsDialogConfig({ ariaLabelledBy: 'settings-title' }));
        ref.afterClosed.subscribe({
            next: (r) => this.result.set(`Closed: ${r}`),
            error: (r) => this.result.set(`Dismissed: ${r}`)
        });
    }
}

const meta: Meta<SettingsContainer> = {
    title: 'Components/Settings',
    component: SettingsContainer,
    decorators: [moduleMetadata({ imports: [StorySettings] })],
    parameters: {
        docs: {
            story: { inline: false, iframeHeight: 760 },
            description: {
                component:
                    'Settings show a list of settings next to the view of the selected one, usually in a dialog (`settingsDialogConfig()` sizes it). ' +
                    'Each list item passes its view as `settingsListTpl`. On medium and small screens (below 1024px and 600px) the list and the view replace each other, with a back button; ' +
                    'views can push further views with `pushView(template, title)`.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<SettingsContainer>;

export const Dialog_: Story = { name: 'Dialog', render: () => ({ template: `<story-settings />` }) };
export const Inline: Story = { render: () => ({ template: `<story-settings [inline]="true" />` }) };
export const OpenDialog: Story = {
    name: 'Open: dialog',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-settings [autoOpen]="true" />` })
};
