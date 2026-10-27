/*
 * Port of @fundamental-ngx/core (multi-combobox) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
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
    contentChildren,
    effect,
    forwardRef,
    inject,
    input,
    linkedSignal,
    model,
    numberAttribute,
    output,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { isObservable, type Observable, type Subscription } from 'rxjs';
import { cn, type ClassValue } from '@/lib/utils';
import { BarElement, BarMiddle, ButtonBar } from '@/ui/bar/bar';
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
import { type FormState } from '@/ui/input/input';
import { LIST_CHECK_GLYPH, LIST_DROPDOWN_CHECK, LIST_DROPDOWN_ITEM } from '@/ui/list/list';
import { Popover, PopoverBody, PopoverControl, type PopoverFillMode } from '@/ui/popover/popover';
import { Title } from '@/ui/title/title';
import { Token, Tokenizer, TokenizerInput } from '@/ui/token/token';

/** How typed text matches the items: the start of any word (default), the start of the text, or anywhere. */
export type MultiComboboxMatchingStrategy = 'startsWithPerTerm' | 'startsWith' | 'contains';

/** Data of a multi-combobox: an array or an observable of one. */
export type MultiComboboxDataSource<T> = T[] | Observable<T[]> | null | undefined;

export interface MultiComboboxSelectionChangeEvent<T = unknown> {
    selectedItems: T[];
}

/** Dialog options of a multi-combobox in mobile mode. */
export interface MultiComboboxMobileConfig {
    title?: string;
    /** Shows a close button in the header (default true). */
    hasCloseButton?: boolean;
    /** Applies the selection; without it the selection applies right away. */
    approveButtonText?: string;
    cancelButtonText?: string;
}

export type MultiComboboxTemplateName =
    'optionItemTemplate' | 'groupItemTemplate' | 'secondaryItemTemplate' | 'selectedItemTemplate';

/**
 * Custom templates of a multi-combobox:
 * `<ng-template fdMultiComboboxTemplate="optionItemTemplate" let-item>` (also `groupItemTemplate`,
 * `secondaryItemTemplate` and `selectedItemTemplate`, used for selected options).
 */
@Directive({ selector: 'ng-template[fdMultiComboboxTemplate]' })
export class MultiComboboxTemplate {
    readonly name = input.required<
        'optionItemTemplate' | 'groupItemTemplate' | 'secondaryItemTemplate' | 'selectedItemTemplate'
    >({
        alias: 'fdMultiComboboxTemplate'
    });
    readonly templateRef = inject<TemplateRef<{ $implicit: unknown; index?: number }>>(TemplateRef);
}

interface Suggestion<T> {
    id: unknown;
    label: string;
    secondaryText: string;
    group: string | null;
    value: T;
}

let nextId = 0;

/**
 * Multi-combobox: chooses several items from a data source (an array or an observable) with check
 * box options shown as tokens. Typing filters the items (by default the start of any word) and
 * text that matches nothing is rejected with a brief error. The focus stays in the input: Down
 * and Up highlight options, Space toggles the highlighted option, Enter toggles it and closes,
 * Ctrl+A selects and Ctrl+Shift+A deselects all. Closed, Down and Up put the next item in the
 * input and Enter selects it. Items can be grouped and show a secondary text.
 *
 * ```html
 * <fd-multi-combobox inputId="fruits" displayKey="name" lookupKey="id" [dataSource]="fruits" [(selectedItems)]="chosen" />
 * ```
 */
@Component({
    selector: 'fd-multi-combobox',
    exportAs: 'fdMultiCombobox',
    imports: [
        NgTemplateOutlet,
        Popover,
        PopoverControl,
        PopoverBody,
        Tokenizer,
        Token,
        TokenizerInput,
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
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultiCombobox), multi: true }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '(focusout)': 'onFocusout($event)'
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
                [disabled]="disabledState() || readonly()"
                [closeOnEscapeKey]="false"
                [fillControlMode]="fillControlMode()"
                [maxWidth]="popoverMaxWidth()"
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
        @if (currentStateMessage() && !isOpen()) {
            <span class="sr-only-sap" aria-live="polite">{{ currentStateMessage() }}</span>
        }

        <ng-template #controlTpl let-dialog="dialog">
            <fd-tokenizer
                [state]="currentState()"
                [disabled]="disabledState()"
                [readonly]="readonly()"
                [open]="isOpen()"
                [showOverflowPopover]="false"
                [externalHiddenCount]="hiddenCount()"
                [glyph]="readonly() || dialog ? null : 'navigation-down-arrow'"
                [glyphAriaLabel]="glyphAriaLabel()"
                [glyphTitle]="addonIconTitle()"
                [glyphHasPopup]="mobile() ? 'dialog' : 'listbox'"
                [glyphExpanded]="isOpen()"
                [buttonFocusable]="buttonFocusable()"
                [tokenizerLabel]="tokensLabel()"
                (moreClickedEvent)="onMoreClicked()"
                (addOnButtonClicked)="onAddOnButtonClick($event)"
            >
                @for (token of renderedTokens(); track token.id) {
                    <fd-token
                        [disabled]="disabledState()"
                        [readOnly]="readonly()"
                        [attr.title]="token.label"
                        (onCloseClick)="toggle(token, false)"
                        (onRemove)="toggle(token, false)"
                        >{{ token.label }}</fd-token
                    >
                }
                <input
                    #field
                    fdTokenizerInput
                    type="text"
                    role="combobox"
                    autocomplete="off"
                    [id]="dialog ? id + '-dialog-input' : inputId() || id + '-input'"
                    [value]="inputText()"
                    [disabled]="disabledState()"
                    [readOnly]="readonly()"
                    [attr.cdkFocusInitial]="dialog ? '' : null"
                    [attr.placeholder]="selectedSuggestions().length ? null : placeholder() || null"
                    [attr.aria-label]="dialog ? ariaLabel() || placeholder() || null : ariaLabel() || null"
                    [attr.aria-labelledby]="dialog ? dialogLabelledBy() : ariaLabelledBy() || null"
                    [attr.aria-describedby]="currentStateMessage() ? id + '-message' : null"
                    [attr.aria-required]="required() || null"
                    [attr.aria-readonly]="readonly() || null"
                    [attr.aria-invalid]="currentState() === 'error' || null"
                    [attr.aria-autocomplete]="autoComplete() ? 'both' : 'list'"
                    [attr.aria-haspopup]="mobile() && !dialog ? 'dialog' : 'listbox'"
                    [attr.aria-expanded]="mobile() && !dialog ? isOpen() : dialog || listShown()"
                    [attr.aria-controls]="isOpen() && (dialog || mobile() || listShown()) ? listId : null"
                    [attr.aria-activedescendant]="(dialog || listShown()) && activeId() ? activeId() : null"
                    (input)="onInput(field, $any($event), dialog)"
                    (keydown)="onKeydown(field, $event, dialog)"
                    (focus)="showAllTokens.set(true)"
                />
            </fd-tokenizer>
            @if (currentStateMessage()) {
                <span class="sr-only-sap" [id]="id + '-message'">{{ currentStateMessage() }}</span>
            }
        </ng-template>

        <ng-template #listTpl let-dialog="dialog">
            <div class="flex w-full min-w-0 flex-col" (mousedown)="$event.preventDefault()">
                @if (currentStateMessage()) {
                    <div [class]="messageClass()">{{ currentStateMessage() }}</div>
                }
                <ul
                    role="listbox"
                    aria-multiselectable="true"
                    [id]="listId"
                    [attr.aria-label]="ariaLabel() || null"
                    [attr.aria-labelledby]="ariaLabelledBy() || null"
                    [attr.tabindex]="dialog ? 0 : null"
                    [attr.aria-activedescendant]="dialog && activeId() ? activeId() : null"
                    [style.max-height]="dialog ? null : maxHeight()"
                    [class]="listClass()"
                    (keydown)="dialog && onListKeydown($event)"
                >
                    @if (showSelectAll() && rows().length) {
                        <li
                            role="option"
                            [id]="id + '-select-all'"
                            [attr.aria-selected]="allSelected()"
                            [attr.data-active]="activeIndex() === -2 || null"
                            [class]="
                                optionClass() +
                                ' border-b-(length:--sapList_BorderWidth) border-solid border-sap-list-border-color'
                            "
                            (click)="selectAll(!allSelected())"
                        >
                            <span
                                aria-hidden="true"
                                [class]="checkClass"
                                [attr.data-glyph]="allSelected() ? checkGlyph : ''"
                                [attr.data-indeterminate]="someSelected() || null"
                            ></span>
                            <span class="min-w-0 flex-auto truncate">{{ selectAllText() }}</span>
                        </li>
                    }
                    @for (row of rows(); track row.key) {
                        @if (row.header !== null) {
                            <li
                                role="group"
                                class="m-0 list-none p-0"
                                [attr.aria-labelledby]="id + '-group-' + row.key"
                            >
                                @if (templates().groupItemTemplate; as tpl) {
                                    <div [id]="id + '-group-' + row.key">
                                        <ng-container
                                            [ngTemplateOutlet]="tpl"
                                            [ngTemplateOutletContext]="{ $implicit: { label: row.header } }"
                                        />
                                    </div>
                                } @else {
                                    <div [id]="id + '-group-' + row.key" [class]="groupHeaderClass">
                                        {{ row.header }}
                                    </div>
                                }
                                <ul role="none" class="m-0 list-none p-0">
                                    @for (entry of row.items; track entry.index) {
                                        <ng-container
                                            [ngTemplateOutlet]="optionTpl"
                                            [ngTemplateOutletContext]="{ $implicit: entry }"
                                        />
                                    }
                                </ul>
                            </li>
                        } @else {
                            @for (entry of row.items; track entry.index) {
                                <ng-container
                                    [ngTemplateOutlet]="optionTpl"
                                    [ngTemplateOutletContext]="{ $implicit: entry }"
                                />
                            }
                        }
                    }
                </ul>
            </div>
        </ng-template>

        <ng-template #optionTpl let-entry>
            @let selected = isSelected(entry.suggestion);
            <li
                role="option"
                [id]="optionId(entry.index)"
                [attr.aria-selected]="selected"
                [attr.data-active]="entry.index === activeIndex() || null"
                [class]="optionClass()"
                (click)="onOptionClick(entry.index, $event)"
            >
                <span
                    aria-hidden="true"
                    [class]="checkClass"
                    [attr.data-glyph]="selected ? checkGlyph : ''"
                    (click)="onCheckClick(entry.index, $event)"
                ></span>
                @if (selected && templates().selectedItemTemplate; as tpl) {
                    <ng-container
                        [ngTemplateOutlet]="tpl"
                        [ngTemplateOutletContext]="{ $implicit: entry.suggestion.value, index: entry.index }"
                    />
                } @else {
                    @if (templates().optionItemTemplate; as tpl) {
                        <ng-container
                            [ngTemplateOutlet]="tpl"
                            [ngTemplateOutletContext]="{ $implicit: entry.suggestion.value, index: entry.index }"
                        />
                    } @else {
                        @let parts = highlight(entry.suggestion.label);
                        <span class="min-w-0 flex-auto truncate" [attr.title]="entry.suggestion.label"
                            >{{ parts[0] }}<b class="font-bold">{{ parts[1] }}</b
                            >{{ parts[2] }}</span
                        >
                    }
                    @if (showSecondaryText()) {
                        @if (templates().secondaryItemTemplate; as tpl) {
                            <ng-container
                                [ngTemplateOutlet]="tpl"
                                [ngTemplateOutletContext]="{ $implicit: entry.suggestion.value }"
                            />
                        } @else {
                            <span [class]="secondaryClass()" [attr.title]="entry.suggestion.secondaryText">{{
                                entry.suggestion.secondaryText
                            }}</span>
                        }
                    }
                }
            </li>
        </ng-template>

        <ng-template #dialogTpl>
            <fd-dialog>
                <fd-dialog-header>
                    @if (mobileConfig().title) {
                        <h1 fd-title [id]="id + '-dialog-title'">{{ mobileConfig().title }}</h1>
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
                @if (mobileConfig().approveButtonText || mobileConfig().cancelButtonText) {
                    <fd-dialog-footer>
                        @if (mobileConfig().approveButtonText) {
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
export class MultiCombobox<T = unknown> implements ControlValueAccessor {
    /** The items to choose from: an array or an observable of one. */
    readonly dataSource = input<MultiComboboxDataSource<T>>();
    /** The chosen items; two-way bindable. */
    readonly selectedItems = model<T[]>([]);
    /** Property (dot path) with the text of object items. */
    readonly displayKey = input('');
    /** Property with the identifier of object items. */
    readonly lookupKey = input('');
    readonly secondaryKey = input('');
    readonly showSecondaryText = input(false, { transform: booleanAttribute });
    readonly secondaryTextAlignment = input<'left' | 'right'>('right');
    /** Groups the items by `groupKey`. */
    readonly group = input(false, { transform: booleanAttribute });
    readonly groupKey = input('');
    readonly matchingStrategy = input<MultiComboboxMatchingStrategy>('startsWithPerTerm');
    /** Shows every match instead of the first `mapLimit`. */
    readonly limitless = input(false, { transform: booleanAttribute });
    readonly mapLimit = input(12, { transform: numberAttribute });
    readonly showSelectAll = input(false, { transform: booleanAttribute });
    /** Text of the select all option; `{selected}` and `{total}` are replaced. */
    readonly selectAllLabel = input('Select All ({selected}/{total})');
    /** Error shown briefly when typed text matches no item. */
    readonly invalidEntryMessage = input<string | null | undefined>('Invalid entry');
    readonly invalidEntryDisplayTime = input(3000, { transform: numberAttribute });
    /** Completes the typed text with the first match. */
    readonly autoComplete = input(true, { transform: booleanAttribute });
    readonly placeholder = input<string | null | undefined>();
    readonly inputId = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly state = input<FormState | null | undefined>();
    readonly stateMessage = input<string | null | undefined>();
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly readonly = input(false, { transform: booleanAttribute });
    readonly required = input(false, { transform: booleanAttribute });
    readonly glyphAriaLabel = input('Show options');
    readonly addonIconTitle = input<string | null | undefined>();
    readonly openDropdownOnAddOnClicked = input(true, { transform: booleanAttribute });
    readonly buttonFocusable = input(false, { transform: booleanAttribute });
    readonly maxHeight = input('250px');
    readonly fillControlMode = input<PopoverFillMode | null>('at-least');
    readonly bodyMaxWidth = input<'none' | 'container' | number>('none');
    readonly byline = input(false, { transform: booleanAttribute });
    /** Tokens rendered while the field does not have the focus; the rest count in the "n more" link. */
    readonly maxVisibleTokens = input(12, { transform: numberAttribute });
    readonly mobile = input(false, { transform: booleanAttribute });
    readonly mobileConfig = input<MultiComboboxMobileConfig>({
        hasCloseButton: true,
        approveButtonText: 'OK',
        cancelButtonText: 'Cancel'
    });
    readonly closeLabel = input('Close');
    readonly tokensLabel = input('Selected items');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly selectionChange = output<MultiComboboxSelectionChangeEvent<T>>();
    readonly isOpenChange = output<boolean>();
    readonly addOnButtonClicked = output<Event>();

    private readonly templateDirectives = contentChildren(MultiComboboxTemplate);
    private readonly dialogTpl = viewChild.required<TemplateRef<unknown>>('dialogTpl');
    private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
    private readonly injector = inject(Injector);
    private readonly dialogs = inject(DialogService);
    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    protected readonly id = `fd-multi-combobox-${nextId++}`;
    protected readonly listId = `${this.id}-list`;
    protected readonly checkClass = LIST_DROPDOWN_CHECK;
    protected readonly checkGlyph = LIST_CHECK_GLYPH;

    /** Whether the list (or the mobile dialog) is open. */
    readonly isOpen = signal(false);
    /** The text in the input. */
    readonly inputText = signal('');
    protected readonly disabledState = linkedSignal(() => this.disabled());
    /** Highlighted option: an index, -1 for none, -2 for the select all option. */
    protected readonly activeIndex = signal(-1);
    protected readonly onlySelected = signal(false);
    protected readonly showAllTokens = signal(false);
    private readonly invalidEntry = signal(false);
    private readonly data = signal<T[]>([]);
    private dialogRef: DialogRef | null = null;
    private selectedBackup: T[] = [];
    private anchor: number | null = null;
    private invalidTimer: ReturnType<typeof setTimeout> | null = null;
    private destroyed = false;

    protected readonly templates = computed(() => {
        const result: Partial<Record<MultiComboboxTemplateName, TemplateRef<{ $implicit: unknown; index?: number }>>> =
            {};
        for (const t of this.templateDirectives()) result[t.name()] = t.templateRef;
        return result;
    });
    protected readonly dialogLabelledBy = computed(
        () => this.ariaLabelledBy() || (this.mobileConfig().title ? `${this.id}-dialog-title` : null)
    );
    protected readonly currentState = computed(() => (this.invalidEntry() ? 'error' : this.state()));
    protected readonly currentStateMessage = computed(() =>
        this.invalidEntry() ? this.invalidEntryMessage() : this.stateMessage()
    );
    private readonly isGroup = computed(() => this.group() && !!this.groupKey());

    /** All items as suggestions. */
    private readonly suggestions = computed(() => this.data().map((value) => this.toSuggestion(value)));
    private readonly selectedIds = computed(() => new Set(this.selectedItems().map((item) => this.lookup(item))));
    /** Suggestions of the chosen items, in the order of choosing. */
    readonly selectedSuggestions = computed(() => {
        const all = this.suggestions();
        return this.selectedItems().map(
            (item) => all.find((s) => s.id === this.lookup(item)) ?? this.toSuggestion(item)
        );
    });
    /** The suggestions shown in the list, grouped and limited. */
    private readonly filtered = computed(() => {
        let items = this.suggestions();
        if (this.onlySelected()) items = items.filter((s) => this.isSelected(s));
        else items = items.filter((s) => this.matches(s, this.inputText()));
        if (!this.limitless() && !this.onlySelected()) items = items.slice(0, this.mapLimit());
        if (this.isGroup()) {
            const order: string[] = [];
            const groups = new Map<string, Suggestion<T>[]>();
            for (const item of items) {
                if (!item.group) continue;
                if (!groups.has(item.group)) {
                    groups.set(item.group, []);
                    order.push(item.group);
                }
                groups.get(item.group)!.push(item);
            }
            return order.flatMap((g) => groups.get(g)!);
        }
        return items;
    });
    protected readonly rows = computed(() => {
        const items = this.filtered();
        if (!this.isGroup())
            return [{ key: 'all', header: null, items: items.map((suggestion, index) => ({ suggestion, index })) }];
        const rows: { key: string; header: string | null; items: { suggestion: Suggestion<T>; index: number }[] }[] =
            [];
        items.forEach((suggestion, index) => {
            let row = rows[rows.length - 1];
            if (!row || row.header !== suggestion.group) {
                row = { key: `${rows.length}`, header: suggestion.group, items: [] };
                rows.push(row);
            }
            row.items.push({ suggestion, index });
        });
        return rows;
    });
    protected readonly renderedTokens = computed(() => {
        const all = this.selectedSuggestions();
        return this.showAllTokens() || all.length <= this.maxVisibleTokens()
            ? all
            : all.slice(0, this.maxVisibleTokens());
    });
    protected readonly hiddenCount = computed(() => this.selectedSuggestions().length - this.renderedTokens().length);
    protected readonly allSelected = computed(() => {
        const all = this.suggestions();
        return all.length > 0 && all.every((s) => this.selectedIds().has(s.id));
    });
    protected readonly someSelected = computed(() => !this.allSelected() && this.selectedItems().length > 0);
    protected readonly selectAllText = computed(() =>
        this.selectAllLabel()
            .replace('{selected}', `${this.selectedItems().length}`)
            .replace('{total}', `${this.suggestions().length}`)
    );
    protected readonly listShown = computed(
        () => !this.mobile() && this.isOpen() && (this.filtered().length > 0 || !!this.currentStateMessage())
    );
    protected readonly activeId = computed(() => {
        const index = this.activeIndex();
        if (index === -2) return `${this.id}-select-all`;
        return index >= 0 ? this.optionId(index) : null;
    });
    protected readonly popoverMaxWidth = computed(() => {
        const max = this.bodyMaxWidth();
        if (max === 'none') return null;
        if (typeof max === 'number') return max;
        return this.elementRef.nativeElement.getBoundingClientRect().width;
    });

    constructor() {
        const destroyRef = inject(DestroyRef);
        destroyRef.onDestroy(() => {
            this.destroyed = true;
            this.dialogRef?.dismiss();
            if (this.invalidTimer) clearTimeout(this.invalidTimer);
        });
        // read arrays and observables into the data
        effect((onCleanup) => {
            const source = this.dataSource();
            let sub: Subscription | null = null;
            untracked(() => {
                if (isObservable(source)) sub = source.subscribe((items) => this.data.set(items ?? []));
                else this.data.set(source ?? []);
            });
            onCleanup(() => sub?.unsubscribe());
        });
        // keep the highlighted option visible
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

    open(): void {
        if (this.disabledState() || this.readonly() || this.isOpen()) return;
        this.isOpen.set(true);
        this.isOpenChange.emit(true);
        if (this.mobile()) this.openDialog();
    }

    close(): void {
        if (!this.isOpen()) return;
        this.isOpen.set(false);
        this.activeIndex.set(-1);
        this.onlySelected.set(false);
        this.anchor = null;
        this.setText('');
        this.isOpenChange.emit(false);
        this.onTouched();
        if (this.dialogRef) {
            const ref = this.dialogRef;
            this.dialogRef = null;
            ref.close();
            afterNextRender(() => this.field()?.nativeElement.focus(), { injector: this.injector });
        }
    }

    /** Selects all items or none. */
    selectAll(select: boolean): void {
        this.setSelected(select ? this.suggestions().map((s) => s.value) : []);
        this.setText('');
    }

    /** Whether a suggestion is chosen. */
    isSelected(suggestion: Suggestion<T>): boolean {
        return this.selectedIds().has(suggestion.id);
    }

    /** Chooses or removes a suggestion. */
    toggle(suggestion: Suggestion<T>, select = !this.isSelected(suggestion)): void {
        const rest = this.selectedItems().filter((item) => this.lookup(item) !== suggestion.id);
        this.setSelected(select ? [...rest, suggestion.value] : rest);
        if (!this.selectedItems().length) this.field()?.nativeElement.focus();
    }

    // ControlValueAccessor
    private onChange: (value: T[]) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: T[] | T | null | undefined): void {
        this.selectedItems.set(value == null ? [] : Array.isArray(value) ? [...value] : [value]);
    }
    registerOnChange(fn: (value: T[]) => void): void {
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
        return `${this.id}-option-${index}`;
    }

    protected highlight(label: string): [string, string, string] {
        const term = this.inputText().trim();
        if (!term) return [label, '', ''];
        const at = label.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
        if (at < 0) return [label, '', ''];
        return [label.slice(0, at), label.slice(at, at + term.length), label.slice(at + term.length)];
    }

    protected onInput(field: HTMLInputElement, event: InputEvent, dialog: boolean): void {
        const typed = field.value;
        // text that matches nothing is rejected
        if (typed && !this.suggestions().some((s) => this.matches(s, typed))) {
            field.value = this.inputText();
            this.showInvalidEntry();
            return;
        }
        this.setText(typed);
        this.activeIndex.set(-1);
        this.onlySelected.set(false);
        if (typed && !dialog) this.open();
        if (this.autoComplete() && typed && event.inputType?.startsWith('insert')) {
            const match = this.suggestions().find((s) =>
                s.label.toLocaleLowerCase().startsWith(typed.toLocaleLowerCase())
            );
            if (match) {
                afterNextRender(
                    () => {
                        if (field.value !== typed) return;
                        field.value = match.label;
                        field.setSelectionRange(typed.length, match.label.length);
                    },
                    { injector: this.injector }
                );
            }
        }
    }

    protected onKeydown(field: HTMLInputElement, event: KeyboardEvent, dialog: boolean): void {
        if (this.disabledState() || this.readonly()) return;
        const key = event.key;
        if (this.mobile() && !dialog) {
            if (key === 'Enter' || key === 'ArrowDown' || (key.length === 1 && !event.ctrlKey && !event.metaKey)) {
                event.preventDefault();
                this.open();
            }
            return;
        }
        const shown = dialog || this.listShown();
        const items = this.filtered();
        const first = this.showSelectAll() && items.length ? -2 : 0;
        if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'a' && shown && this.activeIndex() !== -1) {
            event.preventDefault();
            this.selectAll(!event.shiftKey);
            return;
        }
        switch (key) {
            case 'ArrowDown':
                event.preventDefault();
                if (event.altKey && !dialog) this.open();
                else if (shown && items.length) {
                    const current = this.activeIndex();
                    this.activeIndex.set(
                        current === -1 ? first : current === -2 ? 0 : Math.min(current + 1, items.length - 1)
                    );
                } else this.chooseOther(1, field);
                return;
            case 'ArrowUp':
                event.preventDefault();
                if (event.altKey && !dialog) this.close();
                else if (shown) {
                    const current = this.activeIndex();
                    this.activeIndex.set(current === 0 && first === -2 ? -2 : current <= 0 ? -1 : current - 1);
                } else this.chooseOther(-1, field);
                return;
            case ' ':
                if (shown && this.activeIndex() !== -1) {
                    event.preventDefault();
                    this.toggleActive();
                }
                return;
            case 'Enter':
                event.preventDefault();
                if (shown && this.activeIndex() !== -1) {
                    this.toggleActive();
                    if (!dialog) this.close();
                    return;
                }
                this.toggleByText(field.value);
                return;
            case 'Escape':
                if (this.isOpen() && !dialog) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.close();
                }
                return;
            case 'Tab':
                if (this.isOpen() && !dialog) this.close();
                return;
        }
    }

    /** Keys on the list in the mobile dialog work as in its input. */
    protected onListKeydown(event: KeyboardEvent): void {
        const field = document.getElementById(`${this.id}-dialog-input`) as HTMLInputElement | null;
        if (field) this.onKeydown(field, event, true);
    }

    /** A click on an option chooses it and closes the list; Shift chooses a range. */
    protected onOptionClick(index: number, event: MouseEvent): void {
        this.clickRange(index, event);
        if (!this.mobile()) this.close();
    }

    /** A click on the check box keeps the list open. */
    protected onCheckClick(index: number, event: MouseEvent): void {
        event.stopPropagation();
        this.clickRange(index, event);
        this.setText('');
    }

    protected onAddOnButtonClick(event: Event): void {
        this.addOnButtonClicked.emit(event);
        if (this.mobile()) {
            this.open();
            return;
        }
        if (this.openDropdownOnAddOnClicked() && !this.isOpen()) {
            this.setText('');
            this.open();
        } else this.close();
        this.field()?.nativeElement.focus();
    }

    /** The "n more" link lists only the chosen items. */
    protected onMoreClicked(): void {
        this.showAllTokens.set(true);
        this.onlySelected.set(true);
        this.open();
        this.field()?.nativeElement.focus();
    }

    protected onFocusout(event: FocusEvent): void {
        if (this.mobile()) return;
        const next = event.relatedTarget as Node | null;
        if (
            next &&
            (this.elementRef.nativeElement.contains(next) || (next as Element).closest?.('.cdk-overlay-container'))
        )
            return;
        // a text that names exactly one item chooses it
        const text = this.inputText();
        const match = text ? this.suggestions().filter((s) => s.label === text) : [];
        if (match.length === 1 && !this.isSelected(match[0])) this.toggle(match[0], true);
        this.close();
        this.setText('');
        this.showAllTokens.set(false);
        this.onTouched();
    }

    protected dialogApprove(): void {
        this.closeDialog();
        this.emitChange();
        this.finishDialog();
    }

    protected dialogDismiss(): void {
        this.closeDialog();
        if (this.approveMode()) this.selectedItems.set(this.selectedBackup);
        this.finishDialog();
    }

    private closeDialog(): void {
        const ref = this.dialogRef;
        this.dialogRef = null;
        ref?.close();
    }

    private finishDialog(): void {
        this.isOpen.set(false);
        this.activeIndex.set(-1);
        this.onlySelected.set(false);
        this.setText('');
        this.isOpenChange.emit(false);
        afterNextRender(() => this.field()?.nativeElement.focus(), { injector: this.injector });
    }

    private toggleActive(): void {
        const index = this.activeIndex();
        if (index === -2) this.selectAll(!this.allSelected());
        else if (this.filtered()[index]) this.toggle(this.filtered()[index]);
    }

    /** Enter in the input chooses (or removes) the item named by the text. */
    private toggleByText(text: string): void {
        const item = this.suggestions().find((s) => s.label.toLocaleLowerCase() === text.toLocaleLowerCase());
        if (!item) return;
        this.toggle(item);
        const field = this.field()?.nativeElement;
        if (field) field.value = '';
        this.setText('');
    }

    /** Down and Up in a closed field put the next unchosen item in the input. */
    private chooseOther(offset: number, field: HTMLInputElement): void {
        const items = this.suggestions();
        if (items.every((s) => this.isSelected(s))) return;
        let index = items.findIndex((s) => s.label === field.value);
        if (index < 0) index = offset > 0 ? -1 : items.length;
        for (let i = index + offset; i >= 0 && i < items.length; i += offset) {
            if (!this.isSelected(items[i])) {
                field.value = items[i].label;
                this.inputText.set(items[i].label);
                return;
            }
        }
    }

    private clickRange(index: number, event: MouseEvent): void {
        const items = this.filtered();
        const item = items[index];
        if (!item) return;
        const select = !this.isSelected(item);
        if (event.shiftKey && this.anchor !== null) {
            const [from, to] = [Math.min(this.anchor, index), Math.max(this.anchor, index)];
            const range = items.slice(from, to + 1);
            const ids = new Set(range.map((s) => s.id));
            const rest = this.selectedItems().filter((v) => !ids.has(this.lookup(v)));
            this.setSelected(select ? [...rest, ...range.map((s) => s.value)] : rest);
        } else {
            this.toggle(item, select);
        }
        this.anchor = index;
        this.activeIndex.set(index);
    }

    private showInvalidEntry(): void {
        if (!this.invalidEntryMessage()) return;
        this.invalidEntry.set(true);
        if (this.invalidTimer) clearTimeout(this.invalidTimer);
        this.invalidTimer = setTimeout(() => this.invalidEntry.set(false), this.invalidEntryDisplayTime());
    }

    private approveMode(): boolean {
        return this.mobile() && !!this.mobileConfig().approveButtonText;
    }

    private setSelected(items: T[]): void {
        this.selectedItems.set(items);
        if (!(this.approveMode() && this.dialogRef)) this.emitChange();
    }

    private emitChange(): void {
        const items = this.selectedItems();
        this.onChange(items);
        this.selectionChange.emit({ selectedItems: items });
    }

    private setText(text: string): void {
        this.inputText.set(text);
        this.anchor = null;
    }

    private matches(suggestion: Suggestion<T>, text: string): boolean {
        const term = text.trim().toLocaleLowerCase();
        if (!term) return true;
        const label = suggestion.label.toLocaleLowerCase();
        switch (this.matchingStrategy()) {
            case 'contains':
                return label.includes(term);
            case 'startsWith':
                return label.startsWith(term);
            default:
                return label.startsWith(term) || label.split(/\s+/).some((word) => word.startsWith(term));
        }
    }

    private toSuggestion(value: T): Suggestion<T> {
        return {
            id: this.lookup(value),
            label: this.displayOf(value),
            secondaryText: this.secondaryKey() ? `${getPath(value, this.secondaryKey()) ?? ''}` : '',
            group: this.isGroup() ? `${getPath(value, this.groupKey()) ?? ''}` || null : null,
            value
        };
    }

    private lookup(value: T): unknown {
        if (value != null && typeof value === 'object')
            return this.lookupKey() ? getPath(value, this.lookupKey()) : value;
        return value;
    }

    private displayOf(value: T): string {
        if (value != null && typeof value === 'object') {
            const text = this.displayKey() ? getPath(value, this.displayKey()) : undefined;
            return `${typeof text === 'function' ? text() : (text ?? '')}`;
        }
        return `${value ?? ''}`;
    }

    private openDialog(): void {
        this.selectedBackup = [...this.selectedItems()];
        const title = this.mobileConfig().title;
        const ref = this.dialogs.open(
            this.dialogTpl(),
            {
                mobile: true,
                disablePaddings: true,
                ariaLabelledBy: title ? `${this.id}-dialog-title` : (this.ariaLabelledBy() ?? null),
                ariaLabel: title || this.ariaLabelledBy() ? null : (this.ariaLabel() ?? null),
                escKeyCloseable: false,
                backdropClickCloseable: false
            },
            this.injector
        );
        this.dialogRef = ref;
        const done = () => {
            if (this.dialogRef !== ref || this.destroyed) return;
            this.dialogRef = null;
            this.finishDialog();
        };
        ref.afterClosed.subscribe({ next: done, error: done });
    }

    protected readonly computedClass = computed(() => cn('block', this.userClass()));

    protected readonly listClass = computed(() =>
        cn(
            'relative m-0 box-border block min-w-20 list-none overflow-auto bg-sap-list-background p-0 outline-none scrollbar-sap',
            this.mobile() ? 'w-full' : 'w-full max-w-[37.5rem]'
        )
    );

    protected readonly optionClass = computed(() => cn(LIST_DROPDOWN_ITEM, 'gap-x-2 ps-3', this.byline() && 'py-2'));

    protected readonly secondaryClass = computed(() =>
        cn(
            'ms-auto max-w-[40%] shrink-0 truncate ps-4 text-sap-content-label-color',
            this.secondaryTextAlignment() === 'right' ? 'text-end' : 'text-start'
        )
    );

    protected readonly messageClass = computed(() => {
        const state = this.currentState() ?? 'default';
        return cn(
            'box-border min-h-8 px-2 py-2 font-sap-font-family text-sap-font-small-size leading-normal text-sap-text-color',
            {
                default: 'bg-sap-neutral-background',
                error: 'bg-sap-error-background',
                warning: 'bg-sap-warning-background',
                success: 'bg-sap-success-background',
                information: 'bg-sap-information-background'
            }[state]
        );
    });

    protected readonly groupHeaderClass =
        'flex h-sap-element-line-height items-end border-b-(length:--sapList_BorderWidth) border-solid border-sap-list-group-header-border-color bg-sap-list-group-header-background px-[0.9375rem] py-0 font-sap-font-family text-sap-font-size font-bold text-sap-list-group-header-text-color';
}

/** Reads a dot path from an object. */
function getPath(value: unknown, path: string): any {
    return path.split('.').reduce<any>((obj, key) => (obj == null ? obj : obj[key]), value);
}
