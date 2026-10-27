import { Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { FormLabel } from '@/ui/form/form';
import type { FormState } from '@/ui/input/input';
import { FileUploader } from './file-uploader';

@Component({
    selector: 'story-file-uploader',
    imports: [FileUploader, FormLabel, Button, FormsModule],
    template: `
        <div class="flex max-w-md flex-col gap-1 font-sap-font-family text-sap-font-size text-sap-text-color">
            <label fd-form-label [for]="id" [required]="required()">{{ label() }}</label>
            <fd-file-uploader
                #uploader
                [id]="id"
                [placeholder]="placeholder()"
                [state]="state()"
                [accept]="accept()"
                [maxFileSize]="maxFileSize()"
                [minFileSize]="minFileSize()"
                [disabled]="disabled()"
                [dragndrop]="dragndrop()"
                [multiple]="multiple()"
                [required]="required()"
                [width]="width()"
                [(ngModel)]="files"
                (selectedInvalidFiles)="invalid.set($event)"
            />
            <p class="m-0 mt-2" aria-live="polite">
                @if (files().length) {
                    Selected: {{ names(files()) }}
                } @else {
                    No file selected
                }
                @if (invalid().length) {
                    <br />Rejected: {{ names(invalid()) }}
                }
            </p>
            @if (files().length) {
                <button
                    fdButton
                    variant="transparent"
                    label="Clear"
                    class="self-start"
                    (click)="uploader.clear()"
                ></button>
            }
        </div>
    `
})
class StoryFileUploader {
    readonly label = input('Upload Document');
    readonly placeholder = input('Select a file');
    readonly state = input<FormState>('default');
    readonly accept = input<string | null>(null);
    readonly maxFileSize = input('');
    readonly minFileSize = input('');
    readonly disabled = input(false);
    readonly dragndrop = input(true);
    readonly multiple = input(true);
    readonly required = input(false);
    readonly width = input<string | null>(null);
    protected readonly id = `story-file-${Math.random().toString(36).slice(2, 8)}`;
    protected readonly files = signal<File[]>([]);
    protected readonly invalid = signal<File[]>([]);
    protected names(files: File[]): string {
        return files.map((f) => f.name).join(', ');
    }
}

const meta: Meta<FileUploader> = {
    title: 'Components/File Uploader',
    component: FileUploader,
    decorators: [moduleMetadata({ imports: [StoryFileUploader] })],
    parameters: {
        docs: {
            description: {
                component:
                    'The file uploader shows the chosen file names in a field next to a Browse button; the field opens the file dialog on click, Enter and Space, and files can be dropped on it. ' +
                    'Files outside `minFileSize`/`maxFileSize` or the `accept` extensions are reported through `selectedInvalidFiles`. The value for Angular forms is the list of valid files. ' +
                    'The drop-target directive (`fdFileDragnDrop`) and the validation service can also be used on their own.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<FileUploader>;

export const Default: Story = {
    render: () => ({ template: `<story-file-uploader accept=".png,.jpg,.pdf" [required]="true" />` })
};
export const States: Story = {
    render: () => ({
        template: `
            <div class="flex flex-col gap-4">
                <story-file-uploader label="Upload Document (Success)" state="success" />
                <story-file-uploader label="Upload Document (Error)" state="error" />
                <story-file-uploader label="Upload Document (Warning)" state="warning" />
                <story-file-uploader label="Upload Document (Information)" state="information" />
            </div>
        `
    })
};
export const SizeLimits: Story = {
    name: 'Size limits',
    render: () => ({ template: `<story-file-uploader label="Up to 20 KB" maxFileSize="20 KB" minFileSize="1 KB" />` })
};
export const SingleFile: Story = {
    name: 'Single file',
    render: () => ({ template: `<story-file-uploader [multiple]="false" />` })
};
export const DragDisabled: Story = {
    name: 'Drop disabled',
    render: () => ({ template: `<story-file-uploader [dragndrop]="false" />` })
};
export const Disabled: Story = { render: () => ({ template: `<story-file-uploader [disabled]="true" />` }) };
export const Truncation: Story = {
    render: () => ({ template: `<story-file-uploader width="8rem" placeholder="A long placeholder that truncates" />` })
};
