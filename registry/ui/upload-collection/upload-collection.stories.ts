import { Component, TemplateRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { Checkbox } from '@/ui/checkbox/checkbox';
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogService, DialogTemplate } from '@/ui/dialog/dialog';
import { FileUploader } from '@/ui/file-uploader/file-uploader';
import { Icon } from '@/ui/icon/icon';
import { MessagePage, MessagePageSubtitle, MessagePageTitle } from '@/ui/message-page/message-page';
import { Title } from '@/ui/title/title';
import { Toolbar, ToolbarLabel, ToolbarSpacer } from '@/ui/toolbar/toolbar';
import { Link } from '@/ui/link/link';
import { ListContent, ListItem, ListMessage, ListThumbnail, ListTitle } from '@/ui/list/list';
import { ObjectMarker } from '@/ui/object-marker/object-marker';
import { ObjectStatusComponent } from '@/ui/object-status/object-status';
import {
    UploadCollection,
    UploadCollectionButtonGroup,
    UploadCollectionDescription,
    UploadCollectionFormItem,
    UploadCollectionItem,
    UploadCollectionStatusGroup,
    UploadCollectionStatusItem,
    UploadCollectionTextSeparator,
    UploadCollectionThumbnail,
    UploadCollectionTitle,
    UploadCollectionTitleContainer
} from './upload-collection';

interface StoryFile {
    name: string;
    extension: string;
    icon: string;
    favorite?: boolean;
}

@Component({
    selector: 'story-upload-collection',
    imports: [
        UploadCollection,
        UploadCollectionItem,
        UploadCollectionButtonGroup,
        UploadCollectionDescription,
        UploadCollectionFormItem,
        UploadCollectionStatusGroup,
        UploadCollectionStatusItem,
        UploadCollectionTextSeparator,
        UploadCollectionThumbnail,
        UploadCollectionTitle,
        UploadCollectionTitleContainer,
        ListItem,
        ListThumbnail,
        ListContent,
        ListTitle,
        ListMessage,
        Icon,
        Link,
        ObjectMarker,
        ObjectStatusComponent
    ],
    template: `
        <div [style.max-width]="small() ? '30rem' : '60rem'">
            <fd-upload-collection [small]="small()">
                @for (file of files(); track file) {
                    <li
                        fd-list-item
                        fd-upload-collection-item
                        [(fileName)]="file.name"
                        [extension]="file.extension"
                        (deleteClicked)="remove(file)"
                    >
                        <span fd-list-thumbnail fd-upload-collection-thumbnail><fd-icon [glyph]="file.icon" /></span>
                        <div fd-list-content>
                            <div fd-upload-collection-title-container>
                                <a
                                    fdLink
                                    fd-list-title
                                    fd-upload-collection-title
                                    href="#"
                                    (click)="$event.preventDefault()"
                                ></a>
                                <fd-upload-collection-form-item />
                                @if (file.favorite) {
                                    <span fd-object-marker glyph="favorite" ariaLabel="Favorite"></span>
                                }
                            </div>
                            <div fd-upload-collection-description>
                                Uploaded by Lisa Miller
                                <span fd-upload-collection-text-separator></span>
                                1.2 MB
                            </div>
                            <div fd-upload-collection-status-group>
                                <span
                                    fd-object-status
                                    fd-upload-collection-status-item
                                    status="positive"
                                    label="Approved"
                                ></span>
                                <span fd-upload-collection-text-separator></span>
                                <span
                                    fd-object-status
                                    fd-upload-collection-status-item
                                    status="informative"
                                    label="Version 2"
                                ></span>
                            </div>
                        </div>
                        <fd-upload-collection-button-group />
                    </li>
                } @empty {
                    <li fd-list-item noData><span fd-list-title>No files uploaded</span></li>
                }
            </fd-upload-collection>
        </div>
    `
})
class StoryUploadCollection {
    readonly small = input(false);
    readonly empty = input(false);
    protected readonly files = signal<StoryFile[]>([]);

    constructor() {
        queueMicrotask(() =>
            this.files.set(
                this.empty()
                    ? []
                    : [
                          { name: 'Quarterly_Report', extension: 'pdf', icon: 'pdf-attachment', favorite: true },
                          { name: 'Team_Photo', extension: 'jpg', icon: 'card' },
                          {
                              name: 'A_Very_Long_File_Name_That_Does_Not_Fit_Into_The_Available_Space_Of_The_Collection_Item',
                              extension: 'xlsx',
                              icon: 'excel-attachment'
                          }
                      ]
            )
        );
    }

    protected remove(file: StoryFile): void {
        this.files.update((files) => files.filter((f) => f !== file));
    }
}

const ITEM_PARTS = [
    UploadCollection,
    UploadCollectionItem,
    UploadCollectionButtonGroup,
    UploadCollectionDescription,
    UploadCollectionFormItem,
    UploadCollectionStatusGroup,
    UploadCollectionStatusItem,
    UploadCollectionTextSeparator,
    UploadCollectionThumbnail,
    UploadCollectionTitle,
    UploadCollectionTitleContainer,
    ListItem,
    ListThumbnail,
    ListContent,
    ListTitle,
    Icon,
    Link,
    ObjectMarker,
    ObjectStatusComponent
];

interface CustomFile {
    name: string;
    extension: string;
    icon: string;
    allowEdit: boolean;
    allowDelete: boolean;
    disableEdit?: boolean;
    disableDelete?: boolean;
}

/** Upstream's customization example: buttons hidden or disabled per file. */
@Component({
    selector: 'story-upload-collection-custom',
    imports: ITEM_PARTS,
    template: `
        <div class="max-w-[60rem]">
            <fd-upload-collection>
                @for (file of files(); track file) {
                    <li
                        fd-list-item
                        fd-upload-collection-item
                        [(fileName)]="file.name"
                        [extension]="file.extension"
                        (deleteClicked)="remove(file)"
                    >
                        <span fd-list-thumbnail fd-upload-collection-thumbnail><fd-icon [glyph]="file.icon" /></span>
                        <div fd-list-content>
                            <div fd-upload-collection-title-container>
                                <a
                                    fdLink
                                    fd-list-title
                                    fd-upload-collection-title
                                    href="#"
                                    (click)="$event.preventDefault()"
                                ></a>
                                <fd-upload-collection-form-item />
                            </div>
                            <div fd-upload-collection-description>{{ file.note }}</div>
                        </div>
                        <fd-upload-collection-button-group
                            [allowFileNameEdit]="file.allowEdit"
                            [allowFileDeletion]="file.allowDelete"
                            [disableFileNameEdit]="!!file.disableEdit"
                            [disableFileDeletion]="!!file.disableDelete"
                        />
                    </li>
                }
            </fd-upload-collection>
        </div>
    `
})
class StoryUploadCollectionCustom {
    protected readonly files = signal<(CustomFile & { note: string })[]>([
        {
            name: 'Default_Buttons',
            extension: 'txt',
            icon: 'attachment-text-file',
            allowEdit: true,
            allowDelete: true,
            note: 'Rename and delete'
        },
        {
            name: 'Disabled_Buttons',
            extension: 'jpg',
            icon: 'attachment-photo',
            allowEdit: true,
            allowDelete: true,
            disableEdit: true,
            disableDelete: true,
            note: 'Rename and delete are disabled'
        },
        {
            name: 'Rename_Only',
            extension: 'pdf',
            icon: 'pdf-attachment',
            allowEdit: true,
            allowDelete: false,
            note: 'No delete button'
        },
        {
            name: 'No_Buttons',
            extension: 'xlsx',
            icon: 'excel-attachment',
            allowEdit: false,
            allowDelete: false,
            note: 'No buttons'
        }
    ]);

    protected remove(file: CustomFile): void {
        this.files.update((files) => files.filter((f) => f !== file));
    }
}

interface ComplexFile {
    name: string;
    extension: string;
    icon: string;
    selected: boolean;
    flagged?: boolean;
}

/**
 * Upstream's complex example: a toolbar with the count, a file uploader and actions for the
 * selected files, checkboxes for the selection and a confirmation dialog before deleting.
 */
@Component({
    selector: 'story-upload-collection-complex',
    imports: [
        ...ITEM_PARTS,
        FormsModule,
        Checkbox,
        Button,
        ButtonBar,
        FileUploader,
        Toolbar,
        ToolbarLabel,
        ToolbarSpacer,
        Title,
        Dialog,
        DialogHeader,
        DialogBody,
        DialogFooter,
        DialogTemplate,
        MessagePage,
        MessagePageTitle,
        MessagePageSubtitle
    ],
    providers: [DialogService],
    template: `
        <ng-template fdDialogTemplate let-dialog let-dialogConfig="dialogConfig" #confirm>
            <fd-dialog [dialogRef]="dialog" [dialogConfig]="dialogConfig">
                <fd-dialog-header>
                    <h1 fd-title id="story-uc-confirm-title">Delete Confirmation</h1>
                </fd-dialog-header>
                <fd-dialog-body>
                    <p class="m-0" id="story-uc-confirm-text">Are you sure you want to delete {{ dialog.data }}?</p>
                </fd-dialog-body>
                <fd-dialog-footer>
                    <fd-button-bar variant="emphasized" label="Yes" (click)="dialog.close('Yes')" />
                    <fd-button-bar label="Cancel" (click)="dialog.dismiss('Cancel')" />
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>
        <div class="max-w-[60rem]">
            <fd-toolbar ariaLabel="Uploads">
                <span fd-toolbar-label fd-title headerSize="5">Uploads ({{ files().length }})</span>
                <fd-toolbar-spacer />
                <fd-file-uploader
                    data-density="compact"
                    inputHidden
                    multiple
                    buttonLabel="Upload"
                    ariaLabel="Choose files to upload"
                    (selectedFilesChanged)="add($event)"
                />
                <button
                    fdButton
                    data-density="compact"
                    label="Download"
                    [disabled]="selectedCount() === 0"
                    (click)="status.set('Downloading ' + selectedCount() + ' files')"
                ></button>
                <button
                    fdButton
                    data-density="compact"
                    label="Delete Multiple"
                    [disabled]="selectedCount() < 2"
                    (click)="removeSelected()"
                ></button>
            </fd-toolbar>
            @if (files().length) {
                <fd-upload-collection selection>
                    @for (file of files(); track file) {
                        <li
                            fd-list-item
                            fd-upload-collection-item
                            ariaRole="listitem"
                            [(fileName)]="file.name"
                            [extension]="file.extension"
                            (fileNameChanged)="status.set('Renamed to ' + $event.fullName())"
                            (deleteClicked)="confirmDelete(file)"
                        >
                            <fd-checkbox
                                [ngModel]="file.selected"
                                (ngModelChange)="toggle(file, $event)"
                                [ariaLabel]="'Select ' + file.name + '.' + file.extension"
                            />
                            <span fd-list-thumbnail fd-upload-collection-thumbnail
                                ><fd-icon [glyph]="file.icon"
                            /></span>
                            <div fd-list-content>
                                <div fd-upload-collection-title-container>
                                    <a
                                        fdLink
                                        fd-list-title
                                        fd-upload-collection-title
                                        href="#"
                                        (click)="$event.preventDefault()"
                                    ></a>
                                    <fd-upload-collection-form-item />
                                    @if (file.flagged) {
                                        <span fd-object-marker glyph="flag" ariaLabel="Flagged"></span>
                                        <span fd-object-marker glyph="favorite" ariaLabel="Favorite"></span>
                                    }
                                </div>
                                <div fd-upload-collection-description>
                                    This is the file description
                                    <span fd-upload-collection-text-separator></span>
                                    This is an additional description
                                </div>
                                <div fd-upload-collection-status-group>
                                    <span
                                        fd-object-status
                                        fd-upload-collection-status-item
                                        status="negative"
                                        label="Negative object status"
                                    ></span>
                                    <span fd-upload-collection-text-separator></span>
                                    <span
                                        fd-object-status
                                        fd-upload-collection-status-item
                                        status="positive"
                                        label="Positive object status"
                                    ></span>
                                </div>
                            </div>
                            <fd-upload-collection-button-group />
                        </li>
                    }
                </fd-upload-collection>
            } @else {
                <fd-message-page glyph="attachment" class="mt-8">
                    <fd-message-page-title>No files found.</fd-message-page-title>
                    <fd-message-page-subtitle>Use the "Upload" button to upload files.</fd-message-page-subtitle>
                </fd-message-page>
            }
            <p class="font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">{{ status() }}</p>
        </div>
    `
})
class StoryUploadCollectionComplex {
    protected readonly files = signal<ComplexFile[]>([
        { name: 'File_Name_1', extension: 'txt', icon: 'attachment-text-file', selected: false },
        { name: 'File_Name_2', extension: 'jpg', icon: 'attachment-photo', selected: false, flagged: true },
        { name: 'File_Name_3', extension: 'pdf', icon: 'pdf-attachment', selected: false }
    ]);
    protected readonly selectedCount = computed(() => this.files().filter((f) => f.selected).length);
    protected readonly status = signal('');
    private readonly confirm = viewChild.required<TemplateRef<unknown>>('confirm');
    private readonly dialogs = inject(DialogService);

    protected toggle(file: ComplexFile, selected: boolean): void {
        // the items track the file objects, so the file is updated in place
        file.selected = selected;
        this.files.update((files) => [...files]);
    }

    protected add(files: File[]): void {
        const added = files.map((file) => {
            const dot = file.name.lastIndexOf('.');
            return {
                name: dot > 0 ? file.name.slice(0, dot) : file.name,
                extension: dot > 0 ? file.name.slice(dot + 1) : '',
                icon: 'attachment',
                selected: false
            };
        });
        this.files.update((list) => [...list, ...added]);
    }

    protected removeSelected(): void {
        this.files.update((files) => files.filter((f) => !f.selected));
    }

    protected confirmDelete(file: ComplexFile): void {
        this.dialogs
            .open(this.confirm(), {
                data: `${file.name}.${file.extension}`,
                width: '25rem',
                ariaLabelledBy: 'story-uc-confirm-title',
                ariaDescribedBy: 'story-uc-confirm-text'
            })
            .afterClosed.subscribe({
                next: () => {
                    this.files.update((files) => files.filter((f) => f !== file));
                    this.status.set(`Deleted ${file.name}.${file.extension}`);
                },
                error: () => undefined
            });
    }
}

/** Upstream's no-data example: a message page in place of the empty collection. */
@Component({
    selector: 'story-upload-collection-no-data',
    imports: [MessagePage, MessagePageTitle, MessagePageSubtitle],
    template: `
        <fd-message-page glyph="attachment">
            <fd-message-page-title>No files found.</fd-message-page-title>
            <fd-message-page-subtitle>Drop files to upload, or use the "+" button.</fd-message-page-subtitle>
        </fd-message-page>
    `
})
class StoryUploadCollectionNoData {}

const meta: Meta<UploadCollection> = {
    title: 'Components/Upload Collection',
    component: UploadCollection,
    decorators: [
        moduleMetadata({
            imports: [
                StoryUploadCollection,
                StoryUploadCollectionCustom,
                StoryUploadCollectionComplex,
                StoryUploadCollectionNoData
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'The upload collection lists uploaded files with a thumbnail, the file name, descriptions and statuses. The edit button renames a file in place (Enter or Ok confirms, Escape or Cancel discards) and the delete button removes it. ' +
                    'Long names are shortened in the middle, keeping the extension. In the small layout the buttons wrap below the file.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<UploadCollection>;

export const Default: Story = { render: () => ({ template: `<story-upload-collection />` }) };
export const Small: Story = { render: () => ({ template: `<story-upload-collection [small]="true" />` }) };
export const Empty: Story = { render: () => ({ template: `<story-upload-collection [empty]="true" />` }) };
export const NoData: Story = {
    name: 'No data',
    render: () => ({ template: `<story-upload-collection-no-data />` })
};
export const Customization: Story = { render: () => ({ template: `<story-upload-collection-custom />` }) };
export const Complex: Story = { render: () => ({ template: `<story-upload-collection-complex />` }) };
export const OpenDeleteConfirmation: Story = {
    name: 'Open: delete confirmation',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-upload-collection-complex />` }),
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getAllByRole('button', { name: 'Delete' })[0]);
        await waitFor(() => expect(document.querySelector('fd-dialog-container [role=dialog]')).not.toBeNull());
        const containers = [...document.querySelectorAll<HTMLElement>('fd-dialog-container')];
        await Promise.all(containers.flatMap((c) => c.getAnimations().map((a) => a.finished)));
    }
};
