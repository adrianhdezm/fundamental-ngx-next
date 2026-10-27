import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Icon } from '@/ui/icon/icon';
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

const meta: Meta<UploadCollection> = {
    title: 'Components/Upload Collection',
    component: UploadCollection,
    decorators: [moduleMetadata({ imports: [StoryUploadCollection] })],
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
