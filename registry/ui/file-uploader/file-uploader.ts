/*
 * Port of @fundamental-ngx/core (file-uploader) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    ElementRef,
    Injectable,
    booleanAttribute,
    computed,
    forwardRef,
    inject,
    input,
    output,
    signal,
    viewChild
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';
import { fieldBase, fieldStates, type FormState } from '@/ui/input/input';

/** Files split by the size and type limits. */
export interface FileUploadOutput {
    validFiles?: File[];
    invalidFiles?: File[];
}

const FILE_SIZE_UNITS: Record<string, number> = {
    B: 1,
    BYTE: 1,
    BYTES: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4
};

/** Bytes of a size such as "500", "1.5 MB" or "20KB"; 0 for an empty size. */
export function parseFileSize(size: string | null | undefined): number {
    if (!size) return 0;
    const match = size.trim().match(/^([\d.]+)\s*([a-zA-Z]*)$/);
    const value = match ? Number(match[1]) : NaN;
    const unit = FILE_SIZE_UNITS[(match?.[2] || 'B').toUpperCase()];
    if (isNaN(value) || !unit) throw new Error(`FileSizeError - Invalid file size "${size}"`);
    return value * unit;
}

/** Validates files against size limits and accepted extensions. */
@Injectable({ providedIn: 'root' })
export class FileUploaderService {
    /** `accept` is a list of extensions, e.g. ".png,.jpg". */
    validateFiles(
        files: File[],
        minFileSize: string | null | undefined,
        maxFileSize: string | null | undefined,
        accept: string | null | undefined
    ): FileUploadOutput {
        const max = parseFileSize(maxFileSize);
        const min = parseFileSize(minFileSize);
        const extensions = accept ? accept.toLocaleLowerCase().replace(/[\s.]/g, '').split(',') : null;
        const valid = (file: File) =>
            (!max || file.size <= max) &&
            (!min || file.size >= min) &&
            (!extensions || extensions.includes(file.name.split('.').pop()!.toLocaleLowerCase()));
        return { validFiles: files.filter(valid), invalidFiles: files.filter((f) => !valid(f)) };
    }
}

/**
 * Accepts files dropped on its element and validates them.
 *
 * ```html
 * <div fdFileDragnDrop accept=".pdf" maxFileSize="5 MB" (fileChanged)="onFiles($event)">Drop files here</div>
 * ```
 */
@Directive({
    selector: '[fdFileDragnDrop], [fd-file-drag-n-drop]',
    host: {
        '(dragover)': 'onDragover($event)',
        '(dragenter)': 'onDragenter()',
        '(dragleave)': 'onDragleave($event)',
        '(drop)': 'onDrop($event)'
    }
})
export class FileUploaderDragndrop {
    readonly multiple = input(true, { transform: booleanAttribute });
    readonly accept = input<string | null | undefined>();
    readonly maxFileSize = input<string | null | undefined>('');
    readonly minFileSize = input<string | null | undefined>('');
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly dragndrop = input(true, { transform: booleanAttribute });

    readonly fileChanged = output<FileUploadOutput>();
    readonly dragEntered = output<void>();
    readonly dragLeave = output<void>();

    private readonly service = inject(FileUploaderService);
    /** Enter and leave events of children: the drag leaves when the count is back to zero. */
    private depth = 0;

    protected onDragover(event: Event): void {
        if (this.dragndrop()) mute(event);
    }

    protected onDragenter(): void {
        if (++this.depth === 1 && this.dragndrop()) this.dragEntered.emit();
    }

    protected onDragleave(event: Event): void {
        if (--this.depth === 0 && this.dragndrop()) {
            mute(event);
            this.dragLeave.emit();
        }
    }

    protected onDrop(event: DragEvent): void {
        this.depth = 0;
        if (!this.dragndrop() || this.disabled()) return;
        mute(event);
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (!this.multiple() && files.length > 1) {
            this.fileChanged.emit({ validFiles: [], invalidFiles: files });
            return;
        }
        this.fileChanged.emit(this.service.validateFiles(files, this.minFileSize(), this.maxFileSize(), this.accept()));
    }
}

function mute(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
}

/** Emits the files chosen in a file input. */
@Directive({
    selector: 'input[type=file][fdFileSelect]',
    host: { '[attr.multiple]': 'multiple() || null', '(change)': 'onChange()' }
})
export class FileUploaderSelect {
    readonly multiple = input(true, { transform: booleanAttribute });
    readonly fileSelected = output<File[]>();
    private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

    protected onChange(): void {
        const files = Array.from(this.el.files ?? []);
        if (files.length) this.fileSelected.emit(files);
    }
}

let nextId = 0;

/**
 * File uploader: a field showing the chosen file names and a Browse button. Files can also be
 * dropped on it. Files outside the size limits or accepted extensions are reported as invalid.
 * Works with Angular forms (the value is the list of valid files).
 *
 * ```html
 * <fd-file-uploader placeholder="Select a file" buttonLabel="Browse..." accept=".png,.jpg" [(ngModel)]="files" />
 * ```
 */
@Component({
    selector: 'fd-file-uploader',
    exportAs: 'fdFileUploader',
    imports: [Button, FileUploaderDragndrop, FileUploaderSelect],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FileUploader), multi: true }],
    host: { '[class]': 'hostClass()' },
    template: `
        <div
            fdFileDragnDrop
            class="m-0 box-border flex w-full items-center gap-1 p-0"
            [accept]="accept()"
            [maxFileSize]="maxFileSize()"
            [minFileSize]="minFileSize()"
            [dragndrop]="dragndrop()"
            [disabled]="isDisabled()"
            [multiple]="multiple()"
            (fileChanged)="handleDrop($event)"
            (dragEntered)="onDragEnter.emit()"
            (dragLeave)="onDragLeave.emit()"
        >
            <input
                #textInput
                type="text"
                autocomplete="off"
                aria-live="polite"
                [id]="id()"
                [class]="inputClass()"
                [attr.aria-label]="ariaLabel() || null"
                [attr.aria-labelledby]="ariaLabelledBy() || null"
                [attr.aria-required]="required() || null"
                [attr.aria-invalid]="state() === 'error' || null"
                [attr.title]="fileNames() || placeholder() || null"
                [attr.placeholder]="fileNames() || placeholder() || null"
                [value]="fileNames()"
                [style.width]="width()"
                [hidden]="inputHidden()"
                [disabled]="isDisabled()"
                (click)="open()"
                (keydown)="onKeydown($event)"
                (blur)="onTouched()"
            />
            <button
                fdButton
                type="button"
                [label]="buttonLabel()"
                [ariaLabel]="buttonAriaLabel()"
                [disabled]="isDisabled()"
                (click)="open()"
            ></button>
            <ng-content />
        </div>
        <input
            #fileInput
            fdFileSelect
            type="file"
            class="hidden"
            tabindex="-1"
            aria-hidden="true"
            [attr.accept]="accept() || null"
            [multiple]="multiple()"
            [disabled]="isDisabled()"
            (fileSelected)="selectHandler($event)"
        />
    `
})
export class FileUploader implements ControlValueAccessor {
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly required = input(false, { transform: booleanAttribute });
    readonly multiple = input(true, { transform: booleanAttribute });
    /** Accepted extensions, e.g. ".png,.jpg". */
    readonly accept = input<string | null | undefined>();
    /** Accepts dropped files. */
    readonly dragndrop = input(true, { transform: booleanAttribute });
    /** Size limits, e.g. "20 KB" or "5 MB". */
    readonly maxFileSize = input<string | null | undefined>('');
    readonly minFileSize = input<string | null | undefined>('');
    readonly id = input(`fd-file-uploader-input-${nextId++}`);
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly placeholder = input<string | null | undefined>();
    readonly buttonLabel = input<string | null | undefined>('Browse...');
    readonly buttonAriaLabel = input<string | null | undefined>();
    readonly state = input<FormState | null | undefined>('default');
    /** Maximum number of files chosen at once; more are reported as invalid. */
    readonly fileLimit = input<number | null | undefined>();
    /** Hides the field, leaving the button. */
    readonly inputHidden = input(false, { transform: booleanAttribute });
    readonly width = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly selectedFilesChanged = output<File[]>();
    readonly selectedInvalidFiles = output<File[]>();
    readonly onDragEnter = output<void>();
    readonly onDragLeave = output<void>();

    private readonly service = inject(FileUploaderService);
    private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
    private readonly textInput = viewChild.required<ElementRef<HTMLInputElement>>('textInput');
    private readonly formDisabled = signal(false);
    readonly validFiles = signal<File[]>([]);
    readonly invalidFiles = signal<File[]>([]);

    protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
    protected readonly fileNames = computed(() =>
        this.validFiles()
            .map((f) => f.name)
            .join(' ')
    );
    protected readonly hostClass = computed(() => cn('flex', this.userClass()));
    protected readonly inputClass = computed(() =>
        cn(
            fieldBase,
            fieldStates[this.state() ?? 'default'],
            // the field shows the file names: a caret-less, non-editable text
            'my-0 min-w-0 flex-1 cursor-pointer text-transparent [text-shadow:0_0_0_var(--sapTextColor)] select-none placeholder:text-sap-text-color',
            this.validFiles().length && 'placeholder:not-italic',
            // a fixed width replaces the growing field
            this.width() && 'flex-none'
        )
    );

    private onChange: (files: File[]) => void = () => undefined;
    protected onTouched: () => void = () => undefined;

    writeValue(files: File[] | null | undefined): void {
        if (!files?.length) {
            if (this.validFiles().length) this.clear(false);
            return;
        }
        this.validFiles.set(files);
    }

    registerOnChange(fn: (files: File[]) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
        this.formDisabled.set(disabled);
    }

    /** Opens the file dialog. */
    open(): void {
        if (!this.isDisabled()) this.fileInput().nativeElement.click();
    }

    /** Removes the chosen files. */
    clear(propagate = true): void {
        const had = this.validFiles().length > 0 || this.invalidFiles().length > 0;
        this.validFiles.set([]);
        this.invalidFiles.set([]);
        this.fileInput().nativeElement.value = '';
        if (had && propagate) this.propagate();
    }

    protected handleDrop(output: FileUploadOutput): void {
        this.validFiles.set(output.validFiles ?? []);
        this.invalidFiles.set(output.invalidFiles ?? []);
        this.propagate();
    }

    protected selectHandler(files: File[]): void {
        const limit = this.fileLimit();
        if (limit && files.length > limit) {
            this.validFiles.set([]);
            this.invalidFiles.set(files);
        } else {
            const output = this.service.validateFiles(files, this.minFileSize(), this.maxFileSize(), this.accept());
            this.validFiles.set(output.validFiles ?? []);
            this.invalidFiles.set(output.invalidFiles ?? []);
        }
        this.propagate();
        this.textInput().nativeElement.focus();
    }

    /** Enter and Space open the file dialog; typing is ignored. */
    protected onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' || event.key === ' ') this.open();
        if (event.key !== 'Tab') event.preventDefault();
    }

    private propagate(): void {
        this.onChange(this.validFiles());
        this.selectedFilesChanged.emit(this.validFiles());
        this.selectedInvalidFiles.emit(this.invalidFiles());
    }
}
