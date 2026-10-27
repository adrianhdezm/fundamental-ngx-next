/*
 * Port of @fundamental-ngx/core (combobox) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    Injector,
    TemplateRef,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    effect,
    forwardRef,
    inject,
    input,
    linkedSignal,
    output,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';
import { BarElement, BarMiddle, ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import {
    Dialog,
    DialogBody,
    DialogCloseButton,
    DialogFooter,
    DialogHeader,
    DialogService,
    DialogSubheader,
    type DialogRef
} from '@/ui/dialog/dialog';
import { type IconFont } from '@/ui/icon/icon';
import { type FormState } from '@/ui/input/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/ui/input-group/input-group';
import { LIST_DROPDOWN_ITEM, ListMessage } from '@/ui/list/list';
import { Popover, PopoverBody, PopoverControl, type PopoverFillMode } from '@/ui/popover/popover';
import { Title } from '@/ui/title/title';

/** Groups the values of a combobox under headers: `{ header: values }`. */
export type ComboboxGroupFunction<T = unknown> = (items: T[]) => Record<string, T[]>;

/** Emitted when an item is chosen. */
export interface ComboboxItem<T = unknown> {
    item: T;
    index: number;
}

export interface ComboboxItemContext<T = unknown> {
    $implicit: T;
    inputText: string;
}

/** Dialog options of a combobox in mobile mode. */
export interface ComboboxMobileConfig {
    title?: string;
    /** Shows a close button in the header (default true). */
    hasCloseButton?: boolean;
    /** With an approve button the choice is applied only when it is pressed. */
    approveButtonText?: string;
    cancelButtonText?: string;
    /** Text above the list. */
    instruction?: string;
}

/**
 * Custom template of the items: `<ng-container *fdComboboxItem="let item; inputText as search">`.
 * You are responsible for highlighting the search text in it.
 */
@Directive({ selector: '[fdComboboxItem]' })
export class ComboboxItemTemplate<T = unknown> {
    readonly fdComboboxItemUse = input<T>();
    readonly templateRef = inject<TemplateRef<ComboboxItemContext<T>>>(TemplateRef);

    static ngTemplateContextGuard<T>(_dir: ComboboxItemTemplate<T>, ctx: unknown): ctx is ComboboxItemContext<T> {
        return true;
    }
}

interface DisplayedGroup<T> {
    key: string | null;
    items: { item: T; index: number }[];
}

let nextId = 0;

/**
 * Combobox: an input that suggests values from a list while typing. It filters the list,
 * completes the text inline and highlights the search text. The focus stays in the input:
 * Down and Up highlight items (and fill the input), Enter chooses, Escape closes, Alt+Down opens
 * the full list. Closed, Down and Up step through the values. In mobile mode the list opens in a
 * dialog.
 *
 * By default the value is the text; with `communicateByObject` it is the matching item (or its
 * `valueProperty`).
 *
 * ```html
 * <label fdFormLabel for="fruit">Fruit</label>
 * <fd-combobox inputId="fruit" placeholder="Type a fruit" [dropdownValues]="fruits" [(ngModel)]="fruit" />
 * ```
 */
@Component({
    selector: 'fd-combobox',
    exportAs: 'fdCombobox',
    imports: [
        NgTemplateOutlet,
        Popover,
        PopoverControl,
        PopoverBody,
        InputGroup,
        InputGroupInput,
        InputGroupAddon,
        Button,
        ButtonBar,
        BarMiddle,
        BarElement,
        Dialog,
        DialogHeader,
        DialogSubheader,
        DialogBody,
        DialogFooter,
        DialogCloseButton,
        Title
    ],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Combobox), multi: true }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[style.width]': 'width() || null'
    },
    template: `
        @if (mobile()) {
            <ng-container [ngTemplateOutlet]="controlTpl" [ngTemplateOutletContext]="{ dialog: false }" />
        } @else {
            <fd-popover
                class="block"
                placement="bottom-start"
                [isOpen]="listShown()"
                [triggers]="[]"
                [noArrow]="true"
                [disabled]="disabledState() || readOnly()"
                [closeOnEscapeKey]="false"
                [closeOnOutsideClick]="closeOnOutsideClick()"
                [fillControlMode]="fillControlMode()"
                [maxWidth]="noDropDownMaxWidth() ? null : dropDownMaxWidthPx()"
                [focusTrapped]="false"
                [focusAutoCapture]="false"
                [restoreFocusOnClose]="false"
                [disableScrollbar]="true"
                [bodyRole]="null"
                (isOpenChange)="!$event && close()"
            >
                <fd-popover-control>
                    <ng-container [ngTemplateOutlet]="controlTpl" [ngTemplateOutletContext]="{ dialog: false }" />
                </fd-popover-control>
                <fd-popover-body>
                    <ng-container [ngTemplateOutlet]="listTpl" [ngTemplateOutletContext]="{ dialog: false }" />
                </fd-popover-body>
            </fd-popover>
        }
        <span class="sr-only-sap" aria-live="polite" [id]="comboboxId() + '-list-results'">{{ resultsText() }}</span>

        <ng-template #controlTpl let-dialog="dialog">
            <fd-input-group
                [state]="state()"
                [disabled]="disabledState()"
                [readonly]="readOnly()"
                [showFocus]="true"
                (click)="mobile() && !dialog && open()"
            >
                <input
                    #field
                    fdInputGroupInput
                    type="text"
                    role="combobox"
                    autocomplete="off"
                    [id]="dialog ? comboboxId() + '-dialog-input' : inputId() || comboboxId() + '-input'"
                    [value]="inputText()"
                    [disabled]="disabledState()"
                    [readOnly]="readOnly()"
                    [attr.cdkFocusInitial]="dialog ? '' : null"
                    [attr.placeholder]="placeholder() || null"
                    [attr.aria-label]="dialog ? ariaLabel() || placeholder() || null : ariaLabel() || null"
                    [attr.aria-labelledby]="dialog ? dialogLabelledBy() : ariaLabelledBy() || null"
                    [attr.aria-describedby]="comboboxId() + '-list-results'"
                    [attr.aria-autocomplete]="mobile() && !dialog ? null : autoComplete() ? 'both' : 'list'"
                    [attr.aria-haspopup]="mobile() && !dialog ? 'dialog' : 'listbox'"
                    [attr.aria-expanded]="mobile() && !dialog ? isOpen() : listShown()"
                    [attr.aria-controls]="(dialog || mobile() ? isOpen() : listShown()) ? listId() : null"
                    [attr.aria-activedescendant]="(dialog ? isOpen() : listShown()) ? activeId() : null"
                    [attr.aria-required]="required() || null"
                    [attr.aria-readonly]="readOnly() || null"
                    [attr.aria-invalid]="state() === 'error' || null"
                    [attr.title]="title() || null"
                    (input)="onInput(field, $any($event))"
                    (keydown)="onKeydown(field, $event, dialog)"
                    (blur)="!dialog && onBlur(field)"
                />
                @if ((isSearch() || showClearButton()) && inputText() && !readOnly()) {
                    <span fdInputGroupAddon button>
                        <button
                            fdButton
                            variant="transparent"
                            glyph="decline"
                            [ariaLabel]="clearButtonTitle()"
                            [attr.title]="clearButtonTitle()"
                            [tabindex]="clearButtonFocusable() ? null : -1"
                            [disabled]="disabledState()"
                            (click)="clear(field)"
                        ></button>
                    </span>
                }
                @if (showDropdownButton() && !readOnly() && !(dialog && !isSearch())) {
                    <span fdInputGroupAddon button>
                        <button
                            fdButton
                            variant="transparent"
                            [glyph]="isSearch() ? 'search' : glyph()"
                            [glyphFont]="isSearch() ? 'SAP-icons' : glyphFont()"
                            [ariaLabel]="glyphAriaLabel()"
                            [attr.title]="title() || glyphAriaLabel()"
                            [tabindex]="buttonFocusable() ? null : -1"
                            [attr.aria-haspopup]="mobile() ? 'dialog' : 'listbox'"
                            [attr.aria-expanded]="isOpen()"
                            [disabled]="disabledState()"
                            [class]="listShown() ? 'text-(--igBtnFocusColor,var(--sapButton_Selected_TextColor))' : ''"
                            (mousedown)="!buttonFocusable() && $event.preventDefault()"
                            (click)="onPrimaryButtonClick(field)"
                        ></button>
                    </span>
                }
            </fd-input-group>
        </ng-template>

        <ng-template #listTpl let-dialog="dialog">
            @if (dialog && mobileConfig().instruction) {
                <p class="m-0 px-4 pt-2 pb-2 font-sap-font-family text-sap-font-size text-sap-text-color">
                    {{ mobileConfig().instruction }}
                </p>
            }
            <ul
                role="listbox"
                [id]="listId()"
                [attr.aria-label]="ariaLabel() || null"
                [attr.aria-labelledby]="ariaLabelledBy() || null"
                [style.max-height]="dialog ? null : maxHeight()"
                [attr.tabindex]="dialog ? 0 : null"
                [attr.aria-activedescendant]="dialog ? activeId() : null"
                [class]="listClass()"
                (keydown)="dialog && onListKeydown($event)"
                (mousedown)="$event.preventDefault()"
            >
                <ng-content select="[fd-list-message], [fdListMessage]" />
                @for (group of groups(); track group.key; let g = $index) {
                    @if (group.key !== null) {
                        <li role="none" class="m-0 list-none p-0">
                            <ul
                                role="group"
                                class="m-0 list-none p-0"
                                [attr.aria-labelledby]="comboboxId() + '-group-' + g"
                            >
                                <li
                                    role="presentation"
                                    class="flex h-sap-element-line-height items-end border-b-(length:--sapList_BorderWidth) border-solid border-sap-list-group-header-border-color bg-sap-list-group-header-background px-[0.9375rem] py-0 font-sap-font-family text-sap-font-size font-bold text-sap-list-group-header-text-color"
                                    [id]="comboboxId() + '-group-' + g"
                                >
                                    {{ group.key }}
                                </li>
                                @for (entry of group.items; track entry.index) {
                                    <ng-container
                                        [ngTemplateOutlet]="optionTpl"
                                        [ngTemplateOutletContext]="{ $implicit: entry }"
                                    />
                                }
                            </ul>
                        </li>
                    } @else {
                        @for (entry of group.items; track entry.index) {
                            <ng-container
                                [ngTemplateOutlet]="optionTpl"
                                [ngTemplateOutletContext]="{ $implicit: entry }"
                            />
                        }
                    }
                }
            </ul>
        </ng-template>

        <ng-template #optionTpl let-entry>
            <li
                role="option"
                [id]="optionId(entry.index)"
                [attr.aria-selected]="isSelected(entry.item)"
                [attr.data-active]="entry.index === activeIndex() || null"
                [class]="optionClass()"
                (click)="onItemClick(entry.item)"
            >
                @if (customTemplate(); as tpl) {
                    <ng-container
                        [ngTemplateOutlet]="tpl"
                        [ngTemplateOutletContext]="{ $implicit: entry.item, inputText: inputText() }"
                    />
                } @else {
                    @let parts = highlight(entry.item);
                    <span class="min-w-0 flex-auto truncate"
                        >{{ parts[0] }}<b class="font-bold">{{ parts[1] }}</b
                        >{{ parts[2] }}</span
                    >
                }
            </li>
        </ng-template>

        <ng-template #dialogTpl>
            <fd-dialog>
                <fd-dialog-header>
                    @if (mobileConfig().title) {
                        <h1 fd-title [id]="comboboxId() + '-dialog-title'">{{ mobileConfig().title }}</h1>
                    }
                    @if (mobileConfig().hasCloseButton !== false) {
                        <button
                            fd-dialog-close-button
                            mobile
                            [ariaLabel]="closeLabel()"
                            (click)="dialogDismiss()"
                        ></button>
                    }
                    <div fdDialogSubheader>
                        <div fd-bar-middle class="w-full">
                            <fd-bar-element fullWidth>
                                <ng-container
                                    [ngTemplateOutlet]="controlTpl"
                                    [ngTemplateOutletContext]="{ dialog: true }"
                                />
                            </fd-bar-element>
                        </div>
                    </div>
                </fd-dialog-header>
                <fd-dialog-body>
                    <ng-container [ngTemplateOutlet]="listTpl" [ngTemplateOutletContext]="{ dialog: true }" />
                </fd-dialog-body>
                @if (approveMode() || mobileConfig().cancelButtonText) {
                    <fd-dialog-footer>
                        @if (approveMode()) {
                            <fd-button-bar
                                variant="emphasized"
                                [label]="mobileConfig().approveButtonText"
                                (click)="dialogApprove()"
                            />
                        }
                        @if (mobileConfig().cancelButtonText) {
                            <fd-button-bar [label]="mobileConfig().cancelButtonText" (click)="dialogDismiss()" />
                        }
                    </fd-dialog-footer>
                }
            </fd-dialog>
        </ng-template>
    `
})
export class Combobox<T = unknown> implements ControlValueAccessor {
    readonly comboboxId = input(`fd-combobox-${nextId++}`);
    /** Id of the input, for `<label for>`. */
    readonly inputId = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly placeholder = input<string | null | undefined>();
    readonly title = input<string | null | undefined>();
    /** The values to suggest. */
    readonly dropdownValues = input<T[] | null | undefined>([]);
    /** Text of a value. */
    readonly displayFn = input<(value: T | null | undefined) => string>((value) => (value == null ? '' : `${value}`));
    /** Filters the values by the search text; by default by the start (or with `includes` any part) of the text. */
    readonly filterFn = input<((values: T[], searchTerm: string) => T[]) | null | undefined>();
    /** Matches the search text anywhere in the values instead of at the start. */
    readonly includes = input(false, { transform: booleanAttribute });
    readonly groupFn = input<ComboboxGroupFunction<T> | null | undefined>();
    /** Template of the items; `fdComboboxItem` content takes precedence. */
    readonly itemTemplate = input<TemplateRef<ComboboxItemContext<T>> | null | undefined>();
    /** Bold search text in the items. */
    readonly highlighting = input(true, { transform: booleanAttribute });
    /** Completes the typed text with the first matching value. */
    readonly autoComplete = input(true, { transform: booleanAttribute });
    /** Values are the items (or their `valueProperty`) instead of their text. */
    readonly communicateByObject = input(false, { transform: booleanAttribute });
    readonly valueProperty = input<string | null>(null);
    readonly state = input<FormState | null | undefined>();
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly readOnly = input(false, { transform: booleanAttribute });
    readonly required = input(false, { transform: booleanAttribute });
    /** A search field: a search button and a clear button. */
    readonly isSearch = input(false, { transform: booleanAttribute });
    readonly showClearButton = input(false, { transform: booleanAttribute });
    readonly clearButtonTitle = input('Clear');
    readonly showDropdownButton = input(true, { transform: booleanAttribute });
    readonly glyph = input('navigation-down-arrow');
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly glyphAriaLabel = input('Show values');
    readonly buttonFocusable = input(false, { transform: booleanAttribute });
    readonly clearButtonFocusable = input(true, { transform: booleanAttribute });
    readonly closeOnSelect = input(true, { transform: booleanAttribute });
    /** Choosing an item puts its text in the input. */
    readonly fillOnSelect = input(true, { transform: booleanAttribute });
    readonly openOnKeyboardEvent = input(true, { transform: booleanAttribute });
    readonly closeOnOutsideClick = input(true, { transform: booleanAttribute });
    readonly maxHeight = input('50vh');
    readonly dropDownMaxWidthPx = input<number>(640);
    readonly noDropDownMaxWidth = input(false, { transform: booleanAttribute });
    readonly fillControlMode = input<PopoverFillMode | null>('at-least');
    readonly width = input<string | null | undefined>();
    /** Called on Enter and on the button. */
    readonly searchFn = input<(() => void) | null | undefined>();
    /** Two-line items (use `fdListContent`, `fdListTitle` and `fdListByline` in the item template). */
    readonly byline = input(false, { transform: booleanAttribute });
    /** `closeAndSelect` completes the text with the highlighted or completed value when Tab leaves. */
    readonly tabOutStrategy = input<'close' | 'closeAndSelect'>('closeAndSelect');
    readonly mobile = input(false, { transform: booleanAttribute });
    readonly mobileConfig = input<ComboboxMobileConfig>({ hasCloseButton: true });
    readonly closeLabel = input('Close');
    /** Announced count of the suggestions; `{count}` is replaced. */
    readonly resultsLabel = input('{count} result list items');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly itemClicked = output<ComboboxItem<T>>();
    readonly openChange = output<boolean>();
    readonly inputTextChange = output<string>();

    private readonly itemDirective = contentChild(ComboboxItemTemplate);
    private readonly messages = contentChildren(ListMessage, { read: ElementRef });
    private readonly dialogTpl = viewChild.required<TemplateRef<unknown>>('dialogTpl');
    private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

    private readonly injector = inject(Injector);
    private readonly dialogs = inject(DialogService);
    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    /** Whether the list (or the mobile dialog) is open. */
    readonly isOpen = signal(false);
    /** The text in the input. */
    readonly inputText = signal('');
    /** The text that filters the list; it changes only while typing. */
    private readonly searchTerm = signal('');
    private readonly modelValue = signal<unknown>(null);
    protected readonly disabledState = linkedSignal(() => this.disabled());
    protected readonly activeIndex = signal(-1);
    private dialogRef: DialogRef | null = null;
    private snapshot: { text: string; value: unknown; confirmed: { text: string; value: unknown } | null } | null =
        null;
    /** The last chosen or written value, restored when invalid text is left with Tab or an outside click. */
    private confirmed: { text: string; value: unknown } | null = null;
    private destroyed = false;

    protected readonly dialogLabelledBy = computed(
        () => this.ariaLabelledBy() || (this.mobileConfig().title ? `${this.comboboxId()}-dialog-title` : null)
    );
    protected readonly listId = computed(() => `${this.comboboxId()}-result`);
    protected readonly approveMode = computed(() => this.mobile() && !!this.mobileConfig().approveButtonText?.trim());
    protected readonly customTemplate = computed(
        () => this.itemDirective()?.templateRef ?? this.itemTemplate() ?? null
    );

    /** The values that match the search text. */
    readonly displayedValues = computed(() => {
        const values = this.dropdownValues() ?? [];
        const term = this.searchTerm();
        if (!term) return values;
        const filter = this.filterFn();
        if (filter) return filter(values, term);
        const lower = term.toLocaleLowerCase();
        return values.filter((item) => {
            if (item == null) return false;
            const text = this.display(item).toLocaleLowerCase();
            return this.includes() ? text.includes(lower) : text.startsWith(lower);
        });
    });
    protected readonly groups = computed<DisplayedGroup<T>[]>(() => {
        const values = this.displayedValues();
        const groupFn = this.groupFn();
        let index = 0;
        if (!groupFn) return [{ key: null, items: values.map((item) => ({ item, index: index++ })) }];
        return Object.entries(groupFn(values)).map(([key, items]) => ({
            key,
            items: items.map((item) => ({ item, index: index++ }))
        }));
    });
    private readonly flatValues = computed(() => this.groups().flatMap((g) => g.items.map((e) => e.item)));
    protected readonly listShown = computed(() => !this.mobile() && this.isOpen() && this.displayedValues().length > 0);
    protected readonly activeId = computed(() => (this.activeIndex() >= 0 ? this.optionId(this.activeIndex()) : null));
    protected readonly resultsText = computed(() =>
        this.isOpen() ? this.resultsLabel().replace('{count}', `${this.displayedValues().length}`) : ''
    );

    constructor() {
        inject(DestroyRef).onDestroy(() => {
            this.destroyed = true;
            this.dialogRef?.dismiss();
        });
        // an outside click leaves the field like Tab: invalid text reverts to the last choice
        const doc = inject(DOCUMENT);
        const onMousedown = (event: MouseEvent) => this.onDocumentMousedown(event);
        doc.addEventListener('mousedown', onMousedown, true);
        inject(DestroyRef).onDestroy(() => doc.removeEventListener('mousedown', onMousedown, true));
        // list messages are presentational in the listbox
        effect(() => {
            for (const message of this.messages()) {
                const el = message.nativeElement as HTMLElement;
                if (!el.hasAttribute('role')) el.setAttribute('role', 'presentation');
            }
        });
        // keep the highlighted item visible
        effect(() => {
            const id = this.activeId();
            if (!id) return;
            untracked(() =>
                afterNextRender(() => document.getElementById(id)?.scrollIntoView?.({ block: 'nearest' }), {
                    injector: this.injector
                })
            );
        });
    }

    /** The value: the text, or with `communicateByObject` the item (or its `valueProperty`). */
    getValue(): unknown {
        return this.modelValue();
    }

    open(): void {
        if (this.disabledState() || this.readOnly() || this.isOpen()) return;
        this.isOpen.set(true);
        this.openChange.emit(true);
        if (this.mobile()) {
            this.snapshot = { text: this.inputText(), value: this.modelValue(), confirmed: this.confirmed };
            this.searchTerm.set('');
            this.openDialog();
        }
    }

    close(): void {
        if (!this.isOpen()) return;
        this.isOpen.set(false);
        this.activeIndex.set(-1);
        this.openChange.emit(false);
        if (this.dialogRef) {
            const ref = this.dialogRef;
            this.dialogRef = null;
            ref.close();
            afterNextRender(() => this.field()?.nativeElement.focus(), { injector: this.injector });
        }
    }

    /** Whether an item is the current value. */
    isSelected(item: T): boolean {
        if (this.communicateByObject()) return this.toValue(item) === this.modelValue();
        return this.display(item) === this.inputText();
    }

    // ControlValueAccessor
    private onChange: (value: unknown) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: unknown): void {
        let item: unknown = value;
        const prop = this.valueProperty();
        if (this.communicateByObject() && prop && value != null) {
            item =
                (this.dropdownValues() ?? []).find(
                    (v) => v != null && (v as Record<string, unknown>)[prop] === value
                ) ?? value;
        }
        const text = value == null ? '' : this.display(item as T);
        this.inputText.set(text);
        this.searchTerm.set('');
        this.modelValue.set(this.communicateByObject() ? (value ?? null) : text);
        this.confirmed = { text, value: this.modelValue() };
        const field = this.field()?.nativeElement;
        if (field) field.value = text;
    }
    registerOnChange(fn: (value: unknown) => void): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
    setDisabledState(disabled: boolean): void {
        this.disabledState.set(disabled);
        if (disabled) this.close();
    }

    protected optionId(index: number): string {
        return `${this.comboboxId()}-option-${index}`;
    }

    /** The text of an item split around the search text, for bolding it. */
    protected highlight(item: T): [string, string, string] {
        const text = this.display(item);
        const term = this.searchTerm();
        if (!this.highlighting() || !term) return [text, '', ''];
        const at = text.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
        if (at < 0) return [text, '', ''];
        return [text.slice(0, at), text.slice(at, at + term.length), text.slice(at + term.length)];
    }

    protected onInput(field: HTMLInputElement, event: InputEvent): void {
        const typed = field.value;
        this.setText(typed);
        this.searchTerm.set(typed);
        this.activeIndex.set(-1);
        if (this.openOnKeyboardEvent() && typed) this.open();
        // complete the text inline with the first value that starts with it
        if (this.autoComplete() && typed && event.inputType?.startsWith('insert') && !event.isComposing) {
            const match = (this.dropdownValues() ?? []).find(
                (item) => item != null && this.display(item).toLocaleLowerCase().startsWith(typed.toLocaleLowerCase())
            );
            if (match) {
                const text = this.display(match);
                // after the render, which writes the typed text to the input
                afterNextRender(
                    () => {
                        if (field.value !== typed) return;
                        field.value = text;
                        field.setSelectionRange(typed.length, text.length);
                    },
                    { injector: this.injector }
                );
            }
        }
    }

    protected onKeydown(field: HTMLInputElement, event: KeyboardEvent, dialog: boolean): void {
        if (this.readOnly() || this.disabledState()) return;
        const key = event.key;
        if (this.mobile() && !dialog) {
            if (key === 'Enter' || key === ' ' || (event.altKey && key === 'ArrowDown') || key.length === 1) {
                event.preventDefault();
                this.open();
            }
            return;
        }
        const open = dialog || this.listShown();
        const values = this.flatValues();
        if (key === 'Tab') {
            if (this.isOpen() && !dialog) this.leave(field);
            return;
        }
        if (key === 'Enter') {
            if (open && this.activeIndex() >= 0 && values[this.activeIndex()] !== undefined) {
                event.preventDefault();
                this.choose(values[this.activeIndex()], field, true);
                return;
            }
            this.acceptCompletion(field);
            this.searchFn()?.();
            if (!dialog) this.close();
            return;
        }
        if (key === 'Escape') {
            if (this.isOpen() && !dialog) {
                event.preventDefault();
                field.value = this.inputText();
                this.close();
            }
            return;
        }
        if (
            key === 'ArrowRight' &&
            field.selectionStart !== field.selectionEnd &&
            field.selectionEnd === field.value.length
        ) {
            this.acceptCompletion(field);
            return;
        }
        if (key === 'ArrowDown') {
            event.preventDefault();
            if (event.altKey && !dialog) {
                this.searchTerm.set('');
                this.open();
                return;
            }
            if (open) this.moveActive(1, field);
            else this.chooseOther(1, field);
            return;
        }
        if (key === 'ArrowUp') {
            event.preventDefault();
            if (event.altKey && !dialog) {
                this.close();
                return;
            }
            if (open) this.moveActive(-1, field);
            else this.chooseOther(-1, field);
            return;
        }
    }

    /** Keys on the list in the mobile dialog work as in its input. */
    protected onListKeydown(event: KeyboardEvent): void {
        const field = this.dialogField();
        if (field) this.onKeydown(field, event, true);
    }

    protected onBlur(field: HTMLInputElement): void {
        if (this.isOpen()) return;
        this.acceptCompletion(field);
        this.onTouched();
    }

    protected onItemClick(item: T): void {
        const field = this.isOpen() && this.dialogRef ? this.dialogField() : this.field()?.nativeElement;
        this.choose(item, field ?? null, true);
    }

    protected onPrimaryButtonClick(field: HTMLInputElement): void {
        if (this.mobile()) {
            this.open();
            return;
        }
        this.searchFn()?.();
        this.searchTerm.set('');
        if (this.isOpen()) this.close();
        else this.open();
        field.focus();
    }

    protected clear(field: HTMLInputElement): void {
        field.value = '';
        this.setText('');
        this.searchTerm.set('');
        this.activeIndex.set(-1);
        field.focus();
    }

    protected dialogApprove(): void {
        this.snapshot = null;
        this.confirm();
        this.propagate();
        this.close();
    }

    protected dialogDismiss(): void {
        if (this.snapshot) {
            this.inputText.set(this.snapshot.text);
            this.modelValue.set(this.snapshot.value);
            this.confirmed = this.snapshot.confirmed;
            const field = this.field()?.nativeElement;
            if (field) field.value = this.snapshot.text;
            this.snapshot = null;
        }
        this.close();
    }

    /** Chooses an item: fills the input, updates the value and closes the list. */
    private choose(item: T, field: HTMLInputElement | null, close: boolean): void {
        const index = (this.dropdownValues() ?? []).indexOf(item);
        if (this.fillOnSelect()) {
            const text = this.display(item);
            if (field) field.value = text;
            this.inputText.set(text);
            this.inputTextChange.emit(text);
            this.modelValue.set(this.communicateByObject() ? this.toValue(item) : text);
            if (!this.approveMode()) {
                this.confirm();
                this.propagate();
            }
        }
        this.itemClicked.emit({ item, index });
        if (close && this.closeOnSelect() && !this.approveMode()) {
            this.searchTerm.set('');
            this.close();
            this.field()?.nativeElement.focus();
        }
    }

    /** Down and Up in a closed combobox step through the values. */
    private chooseOther(offset: number, field: HTMLInputElement): void {
        const values = this.dropdownValues() ?? [];
        const current = values.findIndex((item) => item != null && this.display(item) === this.inputText());
        const next = values[current + offset];
        if (next !== undefined && (current >= 0 || offset > 0)) this.choose(next, field, false);
    }

    /** Highlights the next or previous item and fills the input with it. */
    private moveActive(offset: number, field: HTMLInputElement): void {
        const values = this.flatValues();
        if (!values.length) return;
        const next = this.activeIndex() + offset;
        if (next < 0) {
            this.activeIndex.set(-1);
            return;
        }
        const index = Math.min(next, values.length - 1);
        this.activeIndex.set(index);
        this.choose(values[index], field, false);
    }

    /** Takes over an inline completion as the text. */
    private acceptCompletion(field: HTMLInputElement): void {
        const text = field.value;
        const match = (this.dropdownValues() ?? []).filter((item) => item != null && this.display(item) === text);
        if (text !== this.inputText()) {
            field.setSelectionRange(text.length, text.length);
            this.setText(text);
            if (match.length === 1) this.searchTerm.set(text);
        }
        // a text that names one value is a choice
        if (match.length === 1 && !(this.approveMode() && this.isOpen())) this.confirm();
    }

    /**
     * Leaving the field with Tab or an outside click: a unique inline completion is taken over;
     * otherwise free text stays in text mode with `closeAndSelect` and without `autoComplete`, and
     * any other text that is not the last choice reverts to it.
     */
    private leave(field: HTMLInputElement): void {
        const closeAndSelect = this.tabOutStrategy() === 'closeAndSelect';
        if (closeAndSelect && this.completedCandidate(field) !== undefined) {
            this.acceptCompletion(field);
        } else if (closeAndSelect && !this.communicateByObject()) {
            field.value = this.inputText();
        } else if (!this.autoComplete()) {
            this.confirm();
        } else {
            this.revert(field);
            const active = this.flatValues()[this.activeIndex()];
            if (closeAndSelect && active !== undefined && !this.inputText()) this.choose(active, field, false);
        }
        this.close();
    }

    /** The one value named by the input text, or by the text with its inline completion. */
    private completedCandidate(field: HTMLInputElement): T | undefined {
        const value = field.value;
        const completing =
            value !== this.inputText() &&
            field.selectionStart === this.inputText().length &&
            field.selectionEnd === value.length;
        if (value !== this.inputText() && !completing) return undefined;
        const matches = (this.dropdownValues() ?? []).filter((item) => item != null && this.display(item) === value);
        return matches.length === 1 ? matches[0] : undefined;
    }

    private onDocumentMousedown(event: MouseEvent): void {
        if (this.mobile() || !this.closeOnOutsideClick() || this.disabledState() || this.readOnly()) return;
        const target = event.target as Node | null;
        if (!target || this.elementRef.nativeElement.contains(target)) return;
        const list = document.getElementById(this.listId());
        if (list && (list.closest('.cdk-overlay-pane') ?? list).contains(target)) return;
        const field = this.field()?.nativeElement;
        if (!field || this.inputText() === (this.confirmed?.text ?? '')) return;
        this.leave(field);
    }

    private confirm(): void {
        this.confirmed = { text: this.inputText(), value: this.modelValue() };
    }

    /** Puts the last choice back in the input and the value. */
    private revert(field: HTMLInputElement): void {
        const text = this.confirmed?.text ?? '';
        field.value = text;
        if (text === this.inputText() && this.modelValue() === (this.confirmed?.value ?? null)) return;
        this.inputText.set(text);
        this.inputTextChange.emit(text);
        this.searchTerm.set('');
        this.modelValue.set(this.confirmed ? this.confirmed.value : this.communicateByObject() ? null : '');
        this.propagate();
    }

    private setText(text: string): void {
        this.inputText.set(text);
        this.inputTextChange.emit(text);
        if (this.communicateByObject()) {
            const matches = (this.dropdownValues() ?? []).filter((item) => item != null && this.display(item) === text);
            if (matches.length === 1) this.modelValue.set(this.toValue(matches[0]));
            else if (matches.length === 0) this.modelValue.set(null);
        } else {
            this.modelValue.set(text);
        }
        if (!this.approveMode() || !this.isOpen()) this.propagate();
    }

    private propagate(): void {
        this.onChange(this.modelValue());
    }

    private toValue(item: T): unknown {
        const prop = this.valueProperty();
        return prop && item != null && typeof item === 'object' ? (item as Record<string, unknown>)[prop] : item;
    }

    private display(item: T | null | undefined): string {
        return this.displayFn()(item);
    }

    private dialogField(): HTMLInputElement | null {
        return document.getElementById(`${this.comboboxId()}-dialog-input`) as HTMLInputElement | null;
    }

    private openDialog(): void {
        const title = this.mobileConfig().title;
        const ref = this.dialogs.open(
            this.dialogTpl(),
            {
                mobile: true,
                disablePaddings: true,
                ariaLabelledBy: title ? `${this.comboboxId()}-dialog-title` : (this.ariaLabelledBy() ?? null),
                ariaLabel: title || this.ariaLabelledBy() ? null : (this.ariaLabel() ?? null),
                escKeyCloseable: true,
                backdropClickCloseable: false
            },
            this.injector
        );
        this.dialogRef = ref;
        const done = () => {
            if (this.dialogRef !== ref || this.destroyed) return;
            // closed with Escape: discard like cancel
            this.dialogRef = null;
            if (this.snapshot) this.dialogDismiss();
            this.isOpen.set(false);
            this.activeIndex.set(-1);
            this.openChange.emit(false);
        };
        ref.afterClosed.subscribe({ next: done, error: done });
    }

    protected readonly computedClass = computed(() =>
        cn(
            'inline-block max-w-full align-middle',
            (this.width() || this.isSearch() || this.showClearButton()) && 'block',
            this.userClass()
        )
    );

    protected readonly listClass = computed(() =>
        cn(
            'relative m-0 box-border block min-w-20 list-none overflow-auto bg-sap-list-background p-0 outline-none scrollbar-sap',
            this.mobile() ? 'w-full' : 'w-full max-w-[40rem] rounded-[inherit]',
            this.messages().length > 0 && 'pt-8'
        )
    );

    protected readonly optionClass = computed(() => cn(LIST_DROPDOWN_ITEM, this.byline() && 'py-2'));
}
