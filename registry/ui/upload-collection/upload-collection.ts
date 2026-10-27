/*
 * Port of @fundamental-ngx/core (upload-collection) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    Injector,
    afterNextRender,
    afterRenderEffect,
    booleanAttribute,
    computed,
    forwardRef,
    inject,
    input,
    model,
    output,
    signal
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';
import { FormControl } from '@/ui/input/input';
import { List } from '@/ui/list/list';

/**
 * Upload collection: a list of uploaded files with their names, descriptions, statuses and buttons
 * to rename and delete them. Long file names are shortened in the middle, keeping the extension.
 *
 * ```html
 * <fd-upload-collection>
 *     <li fd-list-item fd-upload-collection-item fileName="Report" extension="pdf" (deleteClicked)="remove()">
 *         <span fd-list-thumbnail fd-upload-collection-thumbnail><fd-icon glyph="pdf-attachment" /></span>
 *         <div fd-list-content>
 *             <div fd-upload-collection-title-container><a fdLink fd-list-title fd-upload-collection-title href="#"></a>
 *                 <fd-upload-collection-form-item /></div>
 *             <div fd-upload-collection-description>Uploaded today</div>
 *         </div>
 *         <fd-upload-collection-button-group />
 *     </li>
 * </fd-upload-collection>
 * ```
 */
@Component({
    selector: 'fd-upload-collection',
    exportAs: 'fdUploadCollection',
    changeDetection: ChangeDetectionStrategy.OnPush,
    // the collection is the list, so its items find it
    hostDirectives: [{ directive: List, inputs: ['selection'] }],
    host: {
        class: 'block',
        '[attr.data-small]': 'small() || null',
        '[attr.aria-label]': 'ariaLabel()'
    },
    template: '<ng-content />'
})
export class UploadCollection {
    /** Narrow layout: the buttons wrap below the file. */
    readonly small = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null>('Uploaded files');

    constructor() {
        inject(List).bylineDefault.set(true);
    }
}

/** A file of an upload collection; place it on an `li fd-list-item`. */
@Directive({
    selector: '[fd-upload-collection-item], [fdUploadCollectionItem]',
    exportAs: 'fdUploadCollectionItem',
    host: {
        // the content keeps its place next to the thumbnail when the buttons wrap
        class: 'flex-nowrap [[data-small]_&]:flex-wrap [&>[fd-list-content]]:min-w-0 [&>[fd-list-content]]:basis-0 [&>[fd-list-content]]:grow'
    }
})
export class UploadCollectionItem {
    /** File name without the extension; changes when renamed. */
    readonly fileName = model('');
    readonly extension = input('');

    /** Emits the item after a rename. */
    readonly fileNameChanged = output<UploadCollectionItem>();
    readonly deleteClicked = output<UploadCollectionItem>();

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    /** Whether the file name is being edited. */
    readonly editMode = signal(false);
    /** The name in the edit field. */
    readonly draftName = signal('');
    readonly fullName = computed(() => (this.extension() ? `${this.fileName()}.${this.extension()}` : this.fileName()));

    startEdit(): void {
        this.draftName.set(this.fileName());
        this.editMode.set(true);
    }

    cancelEdit(): void {
        this.editMode.set(false);
        this.focusEditButton();
    }

    /** Applies the edited name unless it is empty. */
    confirmEdit(): void {
        const name = this.draftName().trim();
        if (!name) return;
        this.fileName.set(name);
        this.editMode.set(false);
        this.fileNameChanged.emit(this);
        this.focusEditButton();
    }

    delete(): void {
        this.deleteClicked.emit(this);
    }

    private readonly injector = inject(Injector);

    /** Back on the edit button after renaming. */
    private focusEditButton(): void {
        afterNextRender(
            () =>
                this.elementRef.nativeElement
                    .querySelector<HTMLElement>('fd-upload-collection-button-group button')
                    ?.focus(),
            { injector: this.injector }
        );
    }
}

/** The file icon or preview. */
@Directive({
    selector: '[fd-upload-collection-thumbnail], [fdUploadCollectionThumbnail]',
    host: { class: 'self-start' }
})
export class UploadCollectionThumbnail {}

/** The title and markers of a file; the title gives way to the edit field while renaming. */
@Directive({
    selector: '[fd-upload-collection-title-container], [fdUploadCollectionTitleContainer]',
    host: {
        '[class]':
            'item?.editMode() ? "flex items-baseline [&>[fd-object-marker]]:hidden" : "flex min-w-0 items-center gap-0 [&>[fd-object-marker]]:shrink-0"'
    }
})
export class UploadCollectionTitleContainer {
    protected readonly item = inject(UploadCollectionItem, { optional: true });
}

/**
 * The file name, usually a link. Its text is the name and extension, shortened in the middle when
 * it does not fit.
 */
@Directive({
    selector: '[fd-upload-collection-title], [fdUploadCollectionTitle]',
    host: {
        '[style.display]': 'item?.editMode() ? "none" : null',
        // a shortened name keeps the full name as its tooltip
        '[attr.title]': 'item?.fullName() ?? null',
        class: 'me-2 min-w-0 flex-none shrink'
    }
})
export class UploadCollectionTitle {
    protected readonly item = inject(UploadCollectionItem, { optional: true });
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    constructor() {
        // the text goes in the inner element of a link (or the element itself), then shortens to fit
        afterRenderEffect(() => {
            const name = this.item?.fullName() ?? '';
            if (this.item?.editMode()) return;
            this.fit(name);
        });
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const observer = new ResizeObserver(() => this.fit(this.item?.fullName() ?? ''));
            observer.observe(this.el.parentElement ?? this.el);
            destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    private textTarget(): HTMLElement {
        const inner = this.el.firstElementChild as HTMLElement | null;
        return inner && inner.tagName === 'SPAN' ? inner : this.el;
    }

    /** Cuts the middle of the name until the title fits its container. */
    private fit(name: string): void {
        const target = this.textTarget();
        const container = this.el.parentElement;
        target.textContent = name;
        if (!container || !container.clientWidth) return;
        let text = name;
        let guard = 50;
        while (this.el.getBoundingClientRect().width * 1.05 >= container.getBoundingClientRect().width && guard-- > 0) {
            const keep = Math.floor(text.length * 0.8);
            if (keep < 4) break;
            const left = Math.floor(keep / 2);
            text = `${text.substring(0, left)}...${text.substring(text.length - left + 3)}`;
            target.textContent = text;
        }
    }
}

/** A line of description below the title. */
@Directive({
    selector: '[fd-upload-collection-description], [fdUploadCollectionDescription]',
    host: {
        class: 'm-0 box-border block truncate p-0 pt-2.5 text-sap-font-size leading-4 text-sap-content-label-color'
    }
})
export class UploadCollectionDescription {}

/** A bullet between texts or statuses. */
@Directive({
    selector:
        '[fd-upload-collection-text-separator], fd-upload-collection-text-separator, [fdUploadCollectionTextSeparator]',
    host: {
        'aria-hidden': 'true',
        class: "m-0 p-0 leading-none text-sap-content-label-color before:content-['•']"
    }
})
export class UploadCollectionTextSeparator {}

/** Statuses of a file, e.g. upload state and approval. */
@Directive({
    selector: '[fd-upload-collection-status-group], [fdUploadCollectionStatusGroup]',
    host: { class: 'm-0 mt-1.5 box-border flex min-w-0 items-center truncate p-0 text-sap-font-size leading-4' }
})
export class UploadCollectionStatusGroup {}

/** A status in the status group; it shrinks and truncates. */
@Directive({
    selector: '[fd-upload-collection-status-item], [fdUploadCollectionStatusItem]',
    host: { class: 'mx-1 min-w-0 shrink first:ms-0 [&_span]:truncate' }
})
export class UploadCollectionStatusItem {}

/**
 * The edit field of the file name, shown while renaming, with the extension after it. Works with
 * Angular forms (the value is the file name).
 */
@Component({
    selector: 'fd-upload-collection-form-item',
    imports: [FormControl],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UploadCollectionFormItem), multi: true }],
    host: { '[class]': 'item?.editMode() ? "m-0 box-border flex min-w-0 flex-1 items-baseline p-0" : "hidden"' },
    template: `
        @if (item?.editMode()) {
            <input
                #field
                fdFormControl
                type="text"
                required
                class="w-3/5 [[data-small]_&]:w-3/4"
                [attr.aria-label]="ariaLabel()"
                [placeholder]="placeholder()"
                [value]="item.draftName()"
                [state]="item.draftName() ? null : 'error'"
                (input)="onInput(field.value)"
                (keydown.enter)="item.confirmEdit()"
                (keydown.escape)="item.cancelEdit()"
                (click)="$event.stopPropagation()"
            />
            <span class="ms-1.5 inline-block truncate text-sap-font-size leading-4 text-sap-content-label-color"
                >.{{ item.extension() }}</span
            >
        }
    `
})
export class UploadCollectionFormItem implements ControlValueAccessor {
    readonly placeholder = input('Filename');
    readonly ariaLabel = input('Filename');
    /** Emits the name while it is edited. */
    readonly fileNameChanged = output<string>();
    protected readonly item = inject(UploadCollectionItem, { optional: true });
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private onChange: (value: string) => void = () => undefined;
    private onTouched: () => void = () => undefined;

    constructor() {
        // the field takes the focus when editing starts
        afterRenderEffect(() => {
            if (this.item?.editMode()) this.el.querySelector('input')?.focus();
        });
    }

    protected onInput(value: string): void {
        this.item?.draftName.set(value);
        this.onChange(value);
        this.onTouched();
        this.fileNameChanged.emit(value);
    }

    writeValue(value: string | null): void {
        if (value != null) this.item?.draftName.set(value);
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
}

/** Edit and delete buttons of a file; Ok and Cancel while renaming. */
@Component({
    selector: 'fd-upload-collection-button-group',
    imports: [Button],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'm-0 box-border flex shrink-0 items-center gap-0.5 p-0 ms-4 [[data-small]_&]:ms-0 [[data-small]_&]:mt-3 [[data-small]_&]:basis-full [[data-small]_&]:gap-2'
    },
    template: `
        @if (!item?.editMode()) {
            @if (allowFileNameEdit()) {
                <button
                    fdButton
                    variant="transparent"
                    glyph="edit"
                    [ariaLabel]="editLabel()"
                    [disabled]="disableFileNameEdit()"
                    (click)="$event.stopPropagation(); edit()"
                ></button>
            }
            @if (allowFileDeletion()) {
                <button
                    fdButton
                    variant="transparent"
                    glyph="decline"
                    [ariaLabel]="deleteLabel()"
                    [disabled]="disableFileDeletion()"
                    (click)="$event.stopPropagation(); remove()"
                ></button>
            }
        } @else {
            <button
                fdButton
                variant="transparent"
                [label]="okText()"
                [disabled]="!item.draftName().trim()"
                (click)="$event.stopPropagation(); ok()"
            ></button>
            <button
                fdButton
                variant="transparent"
                [label]="cancelText()"
                (click)="$event.stopPropagation(); cancel()"
            ></button>
        }
    `
})
export class UploadCollectionButtonGroup {
    readonly allowFileNameEdit = input(true, { transform: booleanAttribute });
    readonly allowFileDeletion = input(true, { transform: booleanAttribute });
    readonly disableFileNameEdit = input(false, { transform: booleanAttribute });
    readonly disableFileDeletion = input(false, { transform: booleanAttribute });
    readonly editLabel = input('Edit');
    readonly deleteLabel = input('Delete');
    readonly okText = input('Ok');
    readonly cancelText = input('Cancel');

    /** Emits true when editing starts and false when it is cancelled. */
    readonly editClicked = output<boolean>();
    readonly okClicked = output<void>();
    readonly deleteClicked = output<void>();

    protected readonly item = inject(UploadCollectionItem, { optional: true });

    protected edit(): void {
        this.item?.startEdit();
        this.editClicked.emit(true);
    }

    protected remove(): void {
        this.item?.delete();
        this.deleteClicked.emit();
    }

    protected ok(): void {
        this.item?.confirmEdit();
        this.okClicked.emit();
    }

    protected cancel(): void {
        this.item?.cancelEdit();
        this.editClicked.emit(false);
    }
}
