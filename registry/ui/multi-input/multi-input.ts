/*
 * Port of @fundamental-ngx/core (multi-input) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Directionality } from '@angular/cdk/bidi';
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    Injector,
    type TemplateRef,
    afterNextRender,
    booleanAttribute,
    computed,
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
import { Link } from '@/ui/link/link';
import { LIST_CHECK_GLYPH, LIST_DROPDOWN_CHECK, LIST_DROPDOWN_ITEM } from '@/ui/list/list';
import { Popover, PopoverBody, PopoverControl, type PopoverFillMode } from '@/ui/popover/popover';
import { Title } from '@/ui/title/title';
import { Token, Tokenizer, TokenizerInput } from '@/ui/token/token';

/** Dialog options of a multi-input in mobile mode. */
export interface MultiInputMobileConfig {
    title?: string;
    /** Shows a close button in the header (default true). */
    hasCloseButton?: boolean;
    /** Applies the selection; without it the selection applies right away. */
    approveButtonText?: string;
    cancelButtonText?: string;
}

interface OptionView<T, V> {
    id: string;
    item: T;
    value: V;
    label: string;
    selected: boolean;
}

/** The SAP icon font check mark of a check box. */
const CHECK_GLYPH = '';

let nextId = 0;

/**
 * Multi-input: a tokenizer field with a list of check box options. Typing filters the list and
 * completes the text; Enter selects the first match (or, with `allowNewTokens`, adds the text as a
 * new token). The focus stays in the input: Down and Up highlight options and Enter toggles the
 * highlighted one. Tokens are removed with their close icon or Backspace. In mobile mode the list
 * opens in a dialog with a select all button.
 *
 * ```html
 * <fd-multi-input ariaLabel="Fruits" placeholder="Search" [dropdownValues]="fruits" [(selected)]="chosen" />
 * ```
 */
@Component({
    selector: 'fd-multi-input',
    exportAs: 'fdMultiInput',
    imports: [
        NgTemplateOutlet,
        Popover,
        PopoverControl,
        PopoverBody,
        Tokenizer,
        Token,
        TokenizerInput,
        Link,
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
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultiInput), multi: true }],
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
                [placement]="placement() === 'top' ? 'top-start' : 'bottom-start'"
                [isOpen]="listShown()"
                [triggers]="[]"
                [noArrow]="true"
                [disabled]="disabledState()"
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

        <ng-template #controlTpl let-dialog="dialog">
            <fd-tokenizer
                [state]="state()"
                [disabled]="disabledState()"
                [open]="isOpen()"
                [showOverflowPopover]="false"
                [externalHiddenCount]="hiddenCount()"
                [glyph]="displayAddonButton() && !dialog ? glyph() : null"
                [glyphFont]="glyphFont()"
                [glyphAriaLabel]="addOnButtonAriaLabel()"
                [glyphTitle]="addonIconTitle()"
                [glyphHasPopup]="mobile() ? 'dialog' : 'listbox'"
                [glyphExpanded]="isOpen()"
                [buttonFocusable]="buttonFocusable()"
                [tokenizerLabel]="tokensLabel()"
                [class]="glyphMirrored() ? '[&>div>button_fd-icon]:-scale-x-100' : ''"
                (moreClickedEvent)="onMoreClicked()"
                (addOnButtonClicked)="onAddOnButtonClick($event)"
            >
                @for (option of renderedTokens(); track option.id) {
                    <fd-token
                        [disabled]="disabledState()"
                        [attr.title]="option.label"
                        (onCloseClick)="toggle(option, false)"
                        (onRemove)="toggle(option, false)"
                        >{{ option.label }}</fd-token
                    >
                }
                <input
                    #field
                    fdTokenizerInput
                    type="text"
                    role="combobox"
                    autocomplete="off"
                    [id]="dialog ? id + '-dialog-input' : inputId() || id + '-input'"
                    [value]="searchTerm()"
                    [disabled]="disabledState()"
                    [attr.cdkFocusInitial]="dialog ? '' : null"
                    [attr.placeholder]="selectedOptions().length ? null : placeholder() || null"
                    [attr.aria-label]="dialog ? ariaLabel() || placeholder() || null : ariaLabel() || null"
                    [attr.aria-labelledby]="dialog ? dialogLabelledBy() : ariaLabelledBy() || null"
                    [attr.aria-required]="required() || null"
                    [attr.aria-invalid]="state() === 'error' || null"
                    [attr.aria-autocomplete]="autoComplete() && !includes() ? 'both' : 'list'"
                    [attr.aria-haspopup]="mobile() && !dialog ? 'dialog' : 'listbox'"
                    [attr.aria-expanded]="mobile() && !dialog ? isOpen() : dialog || listShown()"
                    [attr.aria-controls]="isOpen() && (dialog || mobile() || listShown()) ? listId : null"
                    [attr.aria-activedescendant]="
                        (dialog || listShown()) && activeIndex() >= 0 ? optionId(activeIndex()) : null
                    "
                    [attr.title]="title() || null"
                    (input)="onInput(field, $any($event), dialog)"
                    (keydown)="onKeydown(field, $event, dialog)"
                    (focus)="showAllTokens.set(true)"
                />
            </fd-tokenizer>
        </ng-template>

        <ng-template #listTpl let-dialog="dialog">
            <div class="flex w-full min-w-0 flex-col">
                <ul
                    role="listbox"
                    aria-multiselectable="true"
                    [id]="listId"
                    [attr.aria-label]="ariaLabel() || null"
                    [attr.aria-labelledby]="ariaLabelledBy() || null"
                    [attr.tabindex]="dialog ? 0 : null"
                    [attr.aria-activedescendant]="dialog && activeIndex() >= 0 ? optionId(activeIndex()) : null"
                    [style.max-height]="dialog ? null : maxHeight()"
                    [class]="listClass()"
                    (mousedown)="$event.preventDefault()"
                    (keydown)="dialog && onListKeydown($event)"
                >
                    @for (option of displayedOptions(); track option.id; let i = $index) {
                        <li
                            role="option"
                            [id]="optionId(i)"
                            [attr.aria-selected]="option.selected"
                            [attr.data-active]="i === activeIndex() || null"
                            [class]="optionClass()"
                            (click)="onOptionClick(option, i, $event)"
                        >
                            <span
                                aria-hidden="true"
                                [class]="checkClass"
                                [attr.data-glyph]="option.selected ? checkGlyph : ''"
                            ></span>
                            @if (itemTemplate(); as tpl) {
                                <ng-container
                                    [ngTemplateOutlet]="tpl"
                                    [ngTemplateOutletContext]="{ $implicit: option.item }"
                                />
                            } @else {
                                @let parts = highlightParts(option.label);
                                <span class="min-w-0 flex-auto truncate"
                                    >{{ parts[0] }}<b class="font-bold">{{ parts[1] }}</b
                                    >{{ parts[2] }}</span
                                >
                            }
                        </li>
                    }
                </ul>
                @if (showAllButton() && !onlySelected() && displayedOptions().length < allItems().length) {
                    <div
                        class="flex justify-end bg-sap-list-background px-4 py-2 font-sap-font-family text-sap-font-size"
                    >
                        <a
                            fdLink
                            href="#"
                            (click)="$event.preventDefault(); showAll()"
                            (mousedown)="$event.preventDefault()"
                            >{{ showAllLabel().replace('{count}', '' + allItems().length) }}</a
                        >
                    </div>
                }
            </div>
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
                            <fd-bar-element class="min-w-0 flex-1">
                                <ng-container
                                    [ngTemplateOutlet]="controlTpl"
                                    [ngTemplateOutletContext]="{ dialog: true }"
                                />
                            </fd-bar-element>
                            <fd-bar-element>
                                <button
                                    fdButton
                                    glyph="multiselect-all"
                                    [variant]="allSelected() ? 'emphasized' : 'transparent'"
                                    [ariaLabel]="selectAllLabel()"
                                    [attr.aria-pressed]="allSelected()"
                                    (click)="selectAllItems(!allSelected())"
                                ></button>
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
export class MultiInput<T = unknown, V = unknown> implements ControlValueAccessor {
    /** The values of the selected items; two-way bindable. */
    readonly selected = model<V[]>([]);
    /** Whether the list is open; two-way bindable. */
    readonly open = model(false);
    readonly dropdownValues = input<T[] | null | undefined>([]);
    /** Text of an item. */
    readonly displayFn = input<(item: T) => string>((item) =>
        item != null && typeof item === 'object' && 'label' in item
            ? `${(item as { label: unknown }).label}`
            : `${item}`
    );
    /** Value of an item in `selected`. */
    readonly valueFn = input<(item: T) => V>((item) =>
        item != null && typeof item === 'object' && 'value' in item
            ? (item as { value: V }).value
            : (item as unknown as V)
    );
    /** Filters the items by the search text; by default by the start (or with `includes` any part) of the text. */
    readonly filterFn = input<((items: T[], searchTerm: string) => T[]) | null | undefined>();
    readonly includes = input(false, { transform: booleanAttribute });
    /** Bold search text in the options. */
    readonly highlight = input(true, { transform: booleanAttribute });
    /** Completes the typed text with the first matching item. */
    readonly autoComplete = input(true, { transform: booleanAttribute });
    readonly itemTemplate = input<TemplateRef<{ $implicit: T }> | null | undefined>();
    /** Enter adds a typed text that matches no item as a new token. */
    readonly allowNewTokens = input(false, { transform: booleanAttribute });
    readonly newTokenParseFn = input<(text: string) => T>((text) => text as unknown as T);
    readonly newTokenValidateFn = input<(text: string) => boolean>((text) => !!text);
    readonly placeholder = input<string | null | undefined>('');
    readonly inputId = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly title = input<string | null | undefined>();
    readonly state = input<FormState | null | undefined>();
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly required = input(false, { transform: booleanAttribute });
    readonly glyph = input('value-help');
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly displayAddonButton = input(true, { transform: booleanAttribute });
    readonly addOnButtonAriaLabel = input('Show options');
    readonly addonIconTitle = input<string | null | undefined>();
    readonly openDropdownOnAddOnClicked = input(true, { transform: booleanAttribute });
    readonly buttonFocusable = input(false, { transform: booleanAttribute });
    readonly maxHeight = input('300px');
    readonly fillControlMode = input<PopoverFillMode | null>('at-least');
    /** Maximum width of the list: none, the width of the field or pixels. */
    readonly bodyMaxWidth = input<'none' | 'container' | number>('none');
    readonly placement = input<'top' | 'bottom'>('bottom');
    /** A link under a filtered list that shows all items again; `{count}` is the number of items. */
    readonly showAllButton = input(true, { transform: booleanAttribute });
    readonly showAllLabel = input('Show All ({count})');
    /** Tokens rendered while the field does not have the focus; the rest count in the "n more" link. */
    readonly maxVisibleTokens = input(12, { transform: numberAttribute });
    readonly byline = input(false, { transform: booleanAttribute });
    readonly mobile = input(false, { transform: booleanAttribute });
    readonly mobileConfig = input<MultiInputMobileConfig>({ hasCloseButton: true, approveButtonText: 'Select' });
    readonly closeLabel = input('Close');
    readonly selectAllLabel = input('Select all');
    readonly tokensLabel = input('Selected values');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly searchTermChange = output<string>();
    readonly addOnButtonClicked = output<Event>();
    readonly allItemsSelectedChange = output<boolean>();

    private readonly dialogTpl = viewChild.required<TemplateRef<unknown>>('dialogTpl');
    private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
    private readonly injector = inject(Injector);
    private readonly dialogs = inject(DialogService);
    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly dir = inject(Directionality, { optional: true });

    protected readonly id = `fd-multi-input-${nextId++}`;
    protected readonly listId = `${this.id}-list`;
    protected readonly checkGlyph = LIST_CHECK_GLYPH;

    readonly searchTerm = signal('');
    protected readonly disabledState = linkedSignal(() => this.disabled());
    protected readonly activeIndex = signal(-1);
    protected readonly onlySelected = signal(false);
    protected readonly showAllTokens = signal(false);
    /** Items added as new tokens. */
    private readonly addedItems = signal<T[]>([]);
    private dialogRef: DialogRef | null = null;
    private selectedBackup: V[] = [];
    private anchor: number | null = null;
    private destroyed = false;

    readonly isOpen = computed(() => this.open());
    protected readonly dialogLabelledBy = computed(
        () => this.ariaLabelledBy() || (this.mobileConfig().title ? `${this.id}-dialog-title` : null)
    );
    protected readonly allItems = computed(() => [...(this.dropdownValues() ?? []), ...this.addedItems()]);
    private readonly filteredItems = computed(() => {
        const items = this.allItems();
        const term = this.searchTerm().trim();
        if (!term) return items;
        const filter = this.filterFn();
        if (filter) return filter(items, term);
        const lower = term.toLocaleLowerCase();
        return items.filter((item) => {
            if (item == null) return false;
            const label = this.displayFn()(item).toLocaleLowerCase();
            return this.includes() ? label.includes(lower) : label.startsWith(lower);
        });
    });
    private readonly selectedSet = computed(() => new Set(this.selected()));
    protected readonly displayedOptions = computed(() => {
        const options = this.filteredItems().map((item) => this.toOption(item));
        return this.onlySelected() ? options.filter((o) => o.selected) : options;
    });
    /** Options of the selected values, in selection order. */
    readonly selectedOptions = computed(() => {
        const items = this.allItems();
        return this.selected().map((value) => {
            const item = items.find((i) => i != null && Object.is(this.valueFn()(i), value)) ?? (value as unknown as T);
            return this.toOption(item, value);
        });
    });
    protected readonly renderedTokens = computed(() => {
        const all = this.selectedOptions();
        return this.showAllTokens() || all.length <= this.maxVisibleTokens()
            ? all
            : all.slice(0, this.maxVisibleTokens());
    });
    protected readonly hiddenCount = computed(() => this.selectedOptions().length - this.renderedTokens().length);
    protected readonly allSelected = computed(() => {
        const options = this.displayedOptions();
        return options.length > 0 && options.every((o) => o.selected);
    });
    protected readonly listShown = computed(() => !this.mobile() && this.open() && this.displayedOptions().length > 0);
    protected readonly glyphMirrored = computed(() => this.glyph() === 'value-help' && this.dir?.value === 'rtl');
    protected readonly popoverMaxWidth = computed(() => {
        const max = this.bodyMaxWidth();
        if (max === 'none') return null;
        if (typeof max === 'number') return max;
        return this.elementRef.nativeElement.getBoundingClientRect().width;
    });

    constructor() {
        inject(DestroyRef).onDestroy(() => {
            this.destroyed = true;
            this.dialogRef?.dismiss();
        });
        let previous: boolean | null = null;
        effect(() => {
            const all = this.allSelected();
            if (all !== previous) {
                previous = all;
                untracked(() => this.allItemsSelectedChange.emit(all));
            }
        });
        // keep the highlighted option visible
        effect(() => {
            const index = this.activeIndex();
            if (index < 0) return;
            untracked(() =>
                afterNextRender(
                    () => document.getElementById(this.optionId(index))?.scrollIntoView?.({ block: 'nearest' }),
                    { injector: this.injector }
                )
            );
        });
        // a mobile multi-input opened from outside opens its dialog
        effect(() => {
            if (this.open() && this.mobile() && !this.dialogRef) untracked(() => this.openDialog());
        });
    }

    openList(): void {
        if (this.disabledState() || this.open()) return;
        this.open.set(true);
    }

    close(): void {
        if (!this.open()) return;
        this.open.set(false);
        this.activeIndex.set(-1);
        this.onlySelected.set(false);
        this.setSearch('');
        if (this.dialogRef) {
            const ref = this.dialogRef;
            this.dialogRef = null;
            ref.close();
            afterNextRender(() => this.field()?.nativeElement.focus(), { injector: this.injector });
        }
    }

    /** Selects all options (of the current search) or none. */
    selectAllItems(selectAll: boolean): void {
        if (selectAll) {
            const values = new Set(this.selected());
            this.allItems().forEach((item) => values.add(this.valueFn()(item)));
            this.setSelected([...values]);
        } else {
            this.setSelected([]);
        }
    }

    // ControlValueAccessor
    private onChange: (value: V[]) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: V[] | null | undefined): void {
        this.selected.set(value ? [...value] : []);
    }
    registerOnChange(fn: (value: V[]) => void): void {
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

    protected highlightParts(label: string): [string, string, string] {
        const term = this.searchTerm().trim();
        if (!this.highlight() || !term) return [label, '', ''];
        const at = label.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
        if (at < 0) return [label, '', ''];
        return [label.slice(0, at), label.slice(at, at + term.length), label.slice(at + term.length)];
    }

    /** Selects or deselects an option. */
    toggle(option: OptionView<T, V>, select = !option.selected): void {
        const values = this.selected().filter((v) => !Object.is(v, option.value));
        this.setSelected(select ? [...values, option.value] : values);
        if (!this.selected().length) this.field()?.nativeElement.focus();
    }

    protected onInput(field: HTMLInputElement, event: InputEvent, dialog: boolean): void {
        const typed = field.value;
        this.setSearch(typed);
        this.activeIndex.set(-1);
        this.onlySelected.set(false);
        if (typed && !dialog) this.openList();
        if (
            this.autoComplete() &&
            !this.includes() &&
            !this.mobile() &&
            typed &&
            event.inputType?.startsWith('insert')
        ) {
            const match = this.allItems().find(
                (item) =>
                    item != null && this.displayFn()(item).toLocaleLowerCase().startsWith(typed.toLocaleLowerCase())
            );
            if (match) {
                const label = this.displayFn()(match);
                afterNextRender(
                    () => {
                        if (field.value !== typed) return;
                        field.value = label;
                        field.setSelectionRange(typed.length, label.length);
                    },
                    { injector: this.injector }
                );
            }
        }
    }

    protected onKeydown(field: HTMLInputElement, event: KeyboardEvent, dialog: boolean): void {
        if (this.disabledState()) return;
        const key = event.key;
        if (this.mobile() && !dialog) {
            if (
                key === 'Enter' ||
                key === 'ArrowDown' ||
                key === 'ArrowUp' ||
                (key.length === 1 && !event.ctrlKey && !event.metaKey)
            ) {
                event.preventDefault();
                this.openList();
            }
            return;
        }
        const options = this.displayedOptions();
        const shown = dialog || this.listShown();
        switch (key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!this.open()) this.openList();
                else if (shown && options.length)
                    this.activeIndex.set(Math.min(this.activeIndex() + 1, options.length - 1));
                return;
            case 'ArrowUp':
                event.preventDefault();
                if (event.altKey && !dialog) this.close();
                else if (shown) this.activeIndex.set(Math.max(this.activeIndex() - 1, -1));
                else this.openList();
                return;
            case 'Enter': {
                event.preventDefault();
                const active = options[this.activeIndex()];
                if (shown && active) {
                    this.toggle(active);
                    return;
                }
                this.submit(field);
                return;
            }
            case 'Escape':
                if (this.open() && !dialog) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.close();
                }
                return;
            case 'Tab':
                if (this.open() && !dialog) this.close();
                return;
        }
    }

    /** Keys on the list in the mobile dialog work as in its input. */
    protected onListKeydown(event: KeyboardEvent): void {
        const field = document.getElementById(`${this.id}-dialog-input`) as HTMLInputElement | null;
        if (field) this.onKeydown(field, event, true);
    }

    protected onOptionClick(option: OptionView<T, V>, index: number, event: MouseEvent): void {
        const select = !option.selected;
        if (event.shiftKey && this.anchor !== null) {
            const [from, to] = [Math.min(this.anchor, index), Math.max(this.anchor, index)];
            const range = this.displayedOptions().slice(from, to + 1);
            const values = this.selected().filter((v) => !range.some((o) => Object.is(o.value, v)));
            this.setSelected(select ? [...values, ...range.map((o) => o.value)] : values);
        } else {
            this.toggle(option, select);
        }
        this.anchor = index;
        this.activeIndex.set(index);
    }

    protected onAddOnButtonClick(event: Event): void {
        this.addOnButtonClicked.emit(event);
        if (this.mobile()) {
            this.openList();
            return;
        }
        if (this.openDropdownOnAddOnClicked() && !this.open()) {
            this.setSearch('');
            this.openList();
        } else this.close();
        this.field()?.nativeElement.focus();
    }

    /** The "n more" link lists only the selected items. */
    protected onMoreClicked(): void {
        this.showAllTokens.set(true);
        this.onlySelected.set(true);
        this.setSearch('');
        this.openList();
        this.field()?.nativeElement.focus();
    }

    protected showAll(): void {
        this.setSearch('');
        const field = this.dialogRef
            ? (document.getElementById(`${this.id}-dialog-input`) as HTMLInputElement | null)
            : this.field()?.nativeElement;
        field?.focus();
    }

    protected onFocusout(event: FocusEvent): void {
        const next = event.relatedTarget as Node | null;
        if (
            next &&
            (this.elementRef.nativeElement.contains(next) || (next as Element).closest?.('.cdk-overlay-container'))
        )
            return;
        this.onTouched();
        this.showAllTokens.set(false);
    }

    protected dialogApprove(): void {
        this.closeDialog();
        this.onChange(this.selected());
        this.finishDialog();
    }

    protected dialogDismiss(): void {
        this.closeDialog();
        if (this.approveMode()) this.selected.set(this.selectedBackup);
        this.finishDialog();
    }

    private closeDialog(): void {
        const ref = this.dialogRef;
        this.dialogRef = null;
        ref?.close();
    }

    private finishDialog(): void {
        this.open.set(false);
        this.activeIndex.set(-1);
        this.onlySelected.set(false);
        this.setSearch('');
        afterNextRender(() => this.field()?.nativeElement.focus(), { injector: this.injector });
    }

    /** Enter selects the first match, or adds the text as a new token. */
    private submit(field: HTMLInputElement): void {
        const text = field.value.trim() ? field.value : this.searchTerm();
        if (!text) return;
        const first = this.filteredItems()[0];
        if (first !== undefined && this.autoComplete()) {
            const option = this.toOption(first);
            if (!option.selected) this.toggle(option, true);
        } else if (this.allowNewTokens() && this.newTokenValidateFn()(text)) {
            const item = this.newTokenParseFn()(text);
            this.addedItems.update((items) => [...items, item]);
            this.toggle(this.toOption(item), true);
        } else {
            return;
        }
        field.value = '';
        this.setSearch('');
        if (!this.mobile()) this.close();
    }

    private approveMode(): boolean {
        return this.mobile() && !!this.mobileConfig().approveButtonText;
    }

    private setSelected(values: V[]): void {
        this.selected.set(values);
        if (!(this.approveMode() && this.dialogRef)) this.onChange(values);
    }

    private setSearch(term: string): void {
        if (term === this.searchTerm()) return;
        this.searchTerm.set(term);
        this.searchTermChange.emit(term);
        this.anchor = null;
    }

    private toOption(item: T, value: V = this.valueFn()(item)): OptionView<T, V> {
        return {
            id: `${String(value)}`,
            item,
            value,
            label: this.displayFn()(item),
            selected: this.selectedSet().has(value)
        };
    }

    private openDialog(): void {
        this.selectedBackup = [...this.selected()];
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

    protected readonly checkClass = LIST_DROPDOWN_CHECK;

    protected readonly listClass = computed(() =>
        cn(
            'relative m-0 box-border block min-w-20 list-none overflow-auto bg-sap-list-background p-0 outline-none scrollbar-sap',
            this.mobile() ? 'w-full' : 'w-full max-w-[37.5rem] rounded-[inherit]'
        )
    );

    protected readonly computedClass = computed(() => cn('block', this.userClass()));

    protected readonly optionClass = computed(() => cn(LIST_DROPDOWN_ITEM, 'gap-x-2 ps-3', this.byline() && 'py-2'));
}
