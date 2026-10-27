/*
 * Port of @fundamental-ngx/core (select) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ActiveDescendantKeyManager, LiveAnnouncer, type Highlightable } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    Injector,
    type Signal,
    type TemplateRef,
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
    model,
    numberAttribute,
    output,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';
import { ButtonBar } from '@/ui/bar/bar';
import { buttonVariants } from '@/ui/button/button';
import {
    Dialog,
    DialogBody,
    DialogCloseButton,
    DialogFooter,
    DialogHeader,
    DialogService,
    type DialogRef
} from '@/ui/dialog/dialog';
import { Icon, type IconFont } from '@/ui/icon/icon';
import { fieldBase, fieldStates, type FormState } from '@/ui/input/input';
import { LIST_DROPDOWN_ITEM, ListMessage, ListTitle } from '@/ui/list/list';
import { Popover, PopoverBody, PopoverControl, type PopoverFillMode } from '@/ui/popover/popover';
import { Title } from '@/ui/title/title';

export type TextOverflowMode = 'full' | 'ellipsis';

/** Dialog options of a select in mobile mode. */
export interface SelectMobileConfig {
    title?: string;
    /** Shows a close button in the header (default true). */
    hasCloseButton?: boolean;
    /** With an approve button the choice is applied only when it is pressed. */
    approveButtonText?: string;
    cancelButtonText?: string;
}

let nextId = 0;

/**
 * An option of a select. Plain text is shown as the title; add `fdListTitle`, `fdListSecondary`
 * and `fdListIcon` parts for richer options.
 */
@Component({
    selector: 'fd-option, [fd-option], [fdOption]',
    exportAs: 'fdOption',
    imports: [NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'option',
        tabindex: '-1',
        '[attr.id]': 'id()',
        '[attr.aria-selected]': 'selected()',
        '[attr.aria-disabled]': 'isDisabled() || null',
        '[attr.data-active]': 'active() || null',
        '[class]': 'computedClass()',
        '(click)': 'selectViaInteraction()',
        '(mousedown)': '$event.preventDefault()'
    },
    template: `
        @if (hasTitle()) {
            <ng-container [ngTemplateOutlet]="plain" />
        } @else {
            <span class="min-w-0 flex-auto whitespace-normal">
                <ng-container [ngTemplateOutlet]="plain" />
            </span>
        }
        <ng-content select="[secondary]" />
        <ng-template #plain><ng-content /></ng-template>
    `
})
export class SelectOption<T = unknown> implements Highlightable {
    readonly id = input(`fd-option-${nextId++}`);
    readonly value = input<T>();
    readonly isDisabled = input(false, { alias: 'disabled', transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    get disabled(): boolean {
        return this.isDisabled();
    }

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly select = inject<Select<T>>(
        forwardRef(() => Select),
        { optional: true }
    );
    protected readonly hasTitle = computed(() => !!this.title());
    private readonly title = contentChild(ListTitle);

    /** Highlighted by the keyboard (aria-activedescendant of the select). */
    readonly active = signal(false);
    readonly selected = computed(() => !!this.select?.isSelected(this));

    /** The text of the option, shown in the select control. */
    get viewValue(): string {
        return (this.elementRef.nativeElement.textContent ?? '').trim();
    }

    setActiveStyles(): void {
        this.active.set(true);
    }
    setInactiveStyles(): void {
        this.active.set(false);
    }
    getLabel(): string {
        return this.viewValue;
    }

    selectViaInteraction(): void {
        if (!this.isDisabled()) this.select?.selectOption(this, true);
    }

    protected readonly computedClass = computed(() => cn(LIST_DROPDOWN_ITEM, this.userClass()));
}

/**
 * Select: a field that opens a list of options. It keeps the focus while open and highlights
 * options with aria-activedescendant. Closed, the arrow keys, Home, End and typing change the
 * value directly; Enter, Space, Alt+Down and F4 open the list. In mobile mode the list opens in a
 * dialog.
 *
 * ```html
 * <label fdFormLabel id="fruit-label">Fruit</label>
 * <fd-select ariaLabelledBy="fruit-label" placeholder="Select a fruit" [(value)]="fruit">
 *     @for (option of fruits; track option) {
 *         <li fd-option [value]="option">{{ option }}</li>
 *     }
 * </fd-select>
 * ```
 */
@Component({
    selector: 'fd-select',
    exportAs: 'fdSelect',
    imports: [
        NgTemplateOutlet,
        Popover,
        PopoverControl,
        PopoverBody,
        Icon,
        ListMessage,
        Dialog,
        DialogHeader,
        DialogBody,
        DialogFooter,
        DialogCloseButton,
        ButtonBar,
        Title
    ],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '(keydown)': 'onKeydown($event)'
    },
    template: `
        @if (mobile()) {
            <ng-container [ngTemplateOutlet]="controlTpl" />
        } @else {
            <fd-popover
                class="block"
                placement="bottom-start"
                [isOpen]="isOpen()"
                [triggers]="[]"
                [noArrow]="true"
                [disabled]="!interactive()"
                [closeOnEscapeKey]="false"
                [closeOnOutsideClick]="closeOnOutsideClick()"
                [fillControlMode]="fillControlMode()"
                [maxWidth]="fillControlMode() !== 'equal' ? 600 : null"
                [focusTrapped]="false"
                [focusAutoCapture]="false"
                [restoreFocusOnClose]="false"
                [disableScrollbar]="true"
                [bodyRole]="null"
                [appendTo]="appendTo()"
                (isOpenChange)="$event ? open() : close()"
            >
                <fd-popover-control><ng-container [ngTemplateOutlet]="controlTpl" /></fd-popover-control>
                <fd-popover-body><ng-container [ngTemplateOutlet]="listTpl" /></fd-popover-body>
            </fd-popover>
        }

        <ng-template #controlTpl>
            <div
                #control
                role="combobox"
                aria-haspopup="listbox"
                [id]="controlId()"
                [attr.tabindex]="disabledState() ? -1 : tabIndex()"
                [attr.aria-expanded]="isOpen()"
                [attr.aria-controls]="isOpen() ? listId() : null"
                [attr.aria-activedescendant]="activeDescendant()"
                [attr.aria-label]="ariaLabel() || null"
                [attr.aria-labelledby]="ariaLabelledBy() || null"
                [attr.aria-describedby]="ariaDescribedBy() || null"
                [attr.aria-required]="required() || null"
                [attr.aria-disabled]="disabledState() || null"
                [attr.aria-readonly]="readonly() || null"
                [attr.aria-invalid]="state() === 'error' || null"
                [attr.title]="triggerValue()"
                [attr.data-placeholder]="!selectedOption() || null"
                [class]="controlClass()"
                (click)="toggle()"
                (blur)="onBlur()"
            >
                <span [class]="textClass()">
                    <ng-container
                        [ngTemplateOutlet]="controlTemplate() ?? defaultText"
                        [ngTemplateOutletContext]="{ $implicit: triggerValue(), selected: selectedOption() }"
                    />
                </span>
                @if (!readonly()) {
                    <span aria-hidden="true" [class]="buttonClass()">
                        <fd-icon [glyph]="glyph()" [font]="glyphFont()" />
                    </span>
                }
            </div>
        </ng-template>
        <ng-template #defaultText let-text>{{ text }}</ng-template>

        <ng-template #listTpl>
            <ul
                #list
                role="listbox"
                [id]="listId()"
                [attr.aria-labelledby]="ariaLabelledBy() || null"
                [attr.aria-label]="ariaLabel() || null"
                [attr.tabindex]="mobile() ? 0 : -1"
                [attr.cdkFocusInitial]="mobile() ? '' : null"
                [attr.aria-activedescendant]="mobile() ? activeDescendant() : null"
                [style.max-height]="mobile() ? null : maxHeight() || '45vh'"
                [class]="listClass()"
                (keydown)="mobile() && onKeydown($event)"
            >
                @if (stateMessage()) {
                    <li
                        fdListMessage
                        role="presentation"
                        [type]="messageType()"
                        [class]="
                            textOverflow() === 'full'
                                ? 'static h-auto min-h-8 py-2 leading-normal whitespace-normal'
                                : 'sticky top-0 z-[2]'
                        "
                    >
                        {{ stateMessage() }}
                    </li>
                }
                <ng-content />
            </ul>
        </ng-template>

        <ng-template #dialogTpl>
            <fd-dialog>
                <fd-dialog-header>
                    @if (mobileConfig().title) {
                        <h1 fd-title [id]="controlId() + '-dialog-title'">{{ mobileConfig().title }}</h1>
                    }
                    @if (mobileConfig().hasCloseButton !== false) {
                        <button
                            fd-dialog-close-button
                            mobile
                            [ariaLabel]="closeLabel()"
                            (click)="cancelMobile()"
                        ></button>
                    }
                </fd-dialog-header>
                <fd-dialog-body>
                    <ng-container [ngTemplateOutlet]="listTpl" />
                </fd-dialog-body>
                @if (mobileConfig().approveButtonText || mobileConfig().cancelButtonText) {
                    <fd-dialog-footer>
                        @if (mobileConfig().approveButtonText) {
                            <fd-button-bar
                                variant="emphasized"
                                [label]="mobileConfig().approveButtonText"
                                (click)="approveMobile()"
                            />
                        }
                        @if (mobileConfig().cancelButtonText) {
                            <fd-button-bar [label]="mobileConfig().cancelButtonText" (click)="cancelMobile()" />
                        }
                    </fd-dialog-footer>
                }
            </fd-dialog>
        </ng-template>
    `
})
export class Select<T = unknown> implements ControlValueAccessor {
    /** The selected value; two-way bindable. */
    readonly value = model<T | null | undefined>();
    readonly placeholder = input<string | null | undefined>();
    readonly controlId = input(`fd-select-${nextId++}`);
    readonly state = input<FormState | null | undefined>();
    /** Message shown on top of the list, coloured by the state. */
    readonly stateMessage = input<string | null | undefined>();
    /** `full` wraps the state message; `ellipsis` truncates it. */
    readonly textOverflow = input<TextOverflowMode>('ellipsis');
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly readonly = input(false, { transform: booleanAttribute });
    readonly required = input(false, { transform: booleanAttribute });
    /** Takes the width of the selected text (default) instead of the full width. */
    readonly inline = input(true, { transform: booleanAttribute });
    /** Opens the list in a full-screen dialog. */
    readonly mobile = input(false, { transform: booleanAttribute });
    readonly mobileConfig = input<SelectMobileConfig>({ hasCloseButton: true });
    readonly closeLabel = input('Close');
    /** Maximum height of the list; 45% of the viewport by default. */
    readonly maxHeight = input<string | null | undefined>();
    readonly glyph = input('slim-arrow-down');
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly closeOnOutsideClick = input(true, { transform: booleanAttribute });
    readonly fillControlMode = input<PopoverFillMode | null>('at-least');
    readonly appendTo = input<ElementRef<HTMLElement> | HTMLElement | null | undefined>();
    /** Template of the control text; context: `$implicit` (the text) and `selected` (the option). */
    readonly controlTemplate = input<TemplateRef<{ $implicit: string; selected: SelectOption<T> | undefined }>>();
    /** Compares option values with the value. */
    readonly compareWith = input<(a: T | null | undefined, b: T | null | undefined) => boolean>((a, b) => a === b);
    /** Choosing an option without a value clears the value (shows the placeholder). */
    readonly unselectMissingOption = input(true, { transform: booleanAttribute });
    readonly typeaheadDebounceInterval = input(250, { transform: numberAttribute });
    /** `closeAndSelect` selects the highlighted option when Tab closes the list. */
    readonly tabOutStrategy = input<'close' | 'closeAndSelect'>('close');
    readonly tabIndex = input(0, { transform: numberAttribute });
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly ariaDescribedBy = input<string | null | undefined>();
    readonly selectControlClass = input<ClassValue>('');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly isOpenChange = output<boolean>();

    readonly options = contentChildren<SelectOption<T>>(SelectOption, { descendants: true });
    private readonly controlRef = viewChild<ElementRef<HTMLElement>>('control');
    private readonly dialogTpl = viewChild.required<TemplateRef<unknown>>('dialogTpl');

    /** Whether the list is open. */
    readonly isOpen = signal(false);
    protected readonly disabledState = linkedSignal(() => this.disabled());
    /** The pending value in mobile mode with an approve button. */
    private readonly pendingValue = linkedSignal(() => this.value());

    private readonly injector = inject(Injector);
    private readonly dialogs = inject(DialogService);
    private readonly announcer = inject(LiveAnnouncer);
    private readonly dir = inject(Directionality, { optional: true });
    private readonly keyManager = new ActiveDescendantKeyManager<SelectOption<T>>(
        this.options as Signal<SelectOption<T>[]>,
        this.injector
    );
    private dialogRef: DialogRef | null = null;
    private destroyed = false;

    protected readonly listId = computed(() => `${this.controlId()}-list-box`);
    protected readonly interactive = computed(() => !this.disabledState() && !this.readonly());
    protected readonly messageType = computed(() => {
        const state = this.state();
        return state && state !== 'default' ? state : null;
    });
    private readonly approveMode = computed(() => this.mobile() && !!this.mobileConfig().approveButtonText);

    /** The option of the current value. */
    readonly selectedOption = computed(() => this.findOption(this.value()));
    protected readonly triggerValue = computed(() => this.selectedOption()?.viewValue || this.placeholder() || '');
    private readonly activeId = signal<string | null>(null);
    protected readonly activeDescendant = computed(() => (this.isOpen() ? this.activeId() : null));

    constructor() {
        this.keyManager
            .withTypeAhead(this.typeaheadDebounceInterval())
            .withVerticalOrientation()
            .withHorizontalOrientation(this.dir?.value === 'rtl' ? 'rtl' : 'ltr')
            .withAllowedModifierKeys(['shiftKey']);
        this.keyManager.change.subscribe(() => {
            const option = this.keyManager.activeItem;
            this.activeId.set(option?.id() ?? null);
            if (!option) return;
            if (this.isOpen()) option.elementRef.nativeElement.scrollIntoView?.({ block: 'nearest' });
            else option.selectViaInteraction();
        });
        inject(DestroyRef).onDestroy(() => {
            this.destroyed = true;
            this.keyManager.destroy();
            this.dialogRef?.dismiss();
        });
        // keep the highlighted option in sync with the value while closed
        effect(() => {
            const option = this.selectedOption();
            untracked(() => {
                if (!this.isOpen()) this.syncActive(option);
            });
        });
    }

    /** Whether an option holds the current (or, in mobile approve mode, the pending) value. */
    isSelected(option: SelectOption<T>): boolean {
        const value = this.approveMode() && this.isOpen() ? this.pendingValue() : this.value();
        return option.value() != null && this.compare(option.value(), value);
    }

    open(): void {
        if (!this.interactive() || this.isOpen() || !this.options().length) return;
        this.isOpen.set(true);
        this.pendingValue.set(this.value());
        this.keyManager.withHorizontalOrientation(null);
        const selected = this.selectedOption();
        if (selected && !selected.disabled) this.keyManager.setActiveItem(selected);
        else this.keyManager.setFirstItemActive();
        this.isOpenChange.emit(true);
        if (this.mobile()) this.openDialog();
        else {
            this.focus();
            afterNextRender(
                () => this.keyManager.activeItem?.elementRef.nativeElement.scrollIntoView?.({ block: 'nearest' }),
                { injector: this.injector }
            );
        }
    }

    close(tabOut = false): void {
        if (!this.isOpen()) return;
        if (tabOut && this.tabOutStrategy() === 'closeAndSelect') this.keyManager.activeItem?.selectViaInteraction();
        this.isOpen.set(false);
        this.keyManager.withHorizontalOrientation(this.dir?.value === 'rtl' ? 'rtl' : 'ltr');
        this.syncActive(this.selectedOption());
        this.onTouched();
        this.isOpenChange.emit(false);
        if (this.dialogRef) {
            const ref = this.dialogRef;
            this.dialogRef = null;
            ref.close();
            afterNextRender(() => this.focus(), { injector: this.injector });
        }
    }

    toggle(): void {
        if (this.isOpen()) this.close();
        else this.open();
    }

    focus(): void {
        this.controlRef()?.nativeElement.focus();
    }

    /** Selects an option, as a click or the keyboard does. */
    selectOption(option: SelectOption<T>, userInput = false): void {
        const value = option.value();
        const next = value == null && this.unselectMissingOption() ? undefined : value;
        if (this.approveMode() && this.isOpen()) {
            this.pendingValue.set(next);
            this.keyManager.setActiveItem(option);
            return;
        }
        if (!this.compare(next, this.value()) || (next == null && this.value() != null)) {
            this.value.set(next);
            this.onChange(next);
            if (!this.isOpen()) this.announcer.announce(option.viewValue);
        }
        if (userInput && this.isOpen()) {
            this.close();
            this.focus();
        }
    }

    // ControlValueAccessor
    private onChange: (value: T | null | undefined) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: T | null | undefined): void {
        this.value.set(value);
    }
    registerOnChange(fn: (value: T | null | undefined) => void): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
    setDisabledState(disabled: boolean): void {
        this.disabledState.set(disabled);
        if (disabled) this.close();
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (!this.interactive()) return;
        if (this.isOpen()) this.handleOpenKeydown(event);
        else this.handleClosedKeydown(event);
    }

    protected onBlur(): void {
        if (!this.isOpen()) this.onTouched();
    }

    protected approveMobile(): void {
        const value = this.pendingValue();
        if (!this.compare(value, this.value())) {
            this.value.set(value);
            this.onChange(value);
        }
        this.close();
    }

    protected cancelMobile(): void {
        this.pendingValue.set(this.value());
        this.close();
    }

    private handleClosedKeydown(event: KeyboardEvent): void {
        const key = event.key;
        const modifier = event.ctrlKey || event.metaKey || event.shiftKey;
        if (
            (!this.keyManager.isTyping() && (key === 'Enter' || key === ' ') && !modifier && !event.altKey) ||
            (event.altKey && key === 'ArrowDown') ||
            key === 'F4'
        ) {
            event.preventDefault();
            this.open();
        } else if (key === 'Home' || key === 'End') {
            event.preventDefault();
            if (key === 'Home') this.keyManager.setFirstItemActive();
            else this.keyManager.setLastItemActive();
        } else if (key !== 'Tab') {
            this.keyManager.onKeydown(event);
        }
    }

    private handleOpenKeydown(event: KeyboardEvent): void {
        const key = event.key;
        const typing = this.keyManager.isTyping();
        if (key === 'Home' || key === 'End') {
            event.preventDefault();
            if (key === 'Home') this.keyManager.setFirstItemActive();
            else this.keyManager.setLastItemActive();
        } else if (key === 'Escape' || (event.altKey && (key === 'ArrowUp' || key === 'ArrowDown')) || key === 'F4') {
            event.preventDefault();
            event.stopPropagation();
            if (this.approveMode()) this.cancelMobile();
            else this.close();
            this.focus();
        } else if (!typing && (key === 'Enter' || key === ' ') && this.keyManager.activeItem) {
            event.preventDefault();
            this.keyManager.activeItem.selectViaInteraction();
        } else if (key === 'Tab') {
            if (this.mobile()) event.preventDefault();
            else this.close(true);
        } else {
            this.keyManager.onKeydown(event);
        }
    }

    /** Highlights an option without selecting it. */
    private syncActive(option: SelectOption<T> | undefined): void {
        if (option) this.keyManager.updateActiveItem(option);
        else this.keyManager.updateActiveItem(-1);
        this.activeId.set(option?.id() ?? null);
    }

    private findOption(value: T | null | undefined): SelectOption<T> | undefined {
        if (value == null) return undefined;
        return this.options().find((option) => option.value() != null && this.compare(option.value(), value));
    }

    private compare(a: T | null | undefined, b: T | null | undefined): boolean {
        try {
            return this.compareWith()(a, b);
        } catch {
            return false;
        }
    }

    private openDialog(): void {
        const title = this.mobileConfig().title;
        const ref = this.dialogs.open(
            this.dialogTpl(),
            {
                mobile: true,
                disablePaddings: true,
                ariaLabelledBy: title ? `${this.controlId()}-dialog-title` : (this.ariaLabelledBy() ?? null),
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
            this.pendingValue.set(this.value());
            this.isOpen.set(false);
            this.isOpenChange.emit(false);
            this.syncActive(this.selectedOption());
        };
        ref.afterClosed.subscribe({ next: done, error: done });
    }

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 my-1 box-border max-w-full compact:my-[0.1875rem]',
            this.inline() ? 'inline-block w-fit align-middle' : 'block',
            this.userClass()
        )
    );

    protected readonly controlClass = computed(() => {
        const state = this.state() ?? 'default';
        return cn(
            fieldBase,
            // the field shadow is drawn by a frame that the focus does not remove; value states keep theirs
            "shadow-none focus:shadow-none after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-sap-field-shadow after:content-['']",
            fieldStates[state],
            'group/select my-0 flex cursor-pointer items-center justify-between gap-1 overflow-visible p-0 compact:my-0 compact:p-0',
            'aria-expanded:outline-none',
            // field button look of the arrow, as in input groups
            '[--sapButton_Lite_Background:transparent] [--sapButton_Lite_Hover_Background:transparent] [--sapButton_Lite_Active_Background:transparent]',
            '[--sapButton_Lite_BorderColor:transparent] [--sapButton_Lite_Hover_BorderColor:transparent] [--sapButton_Lite_Active_BorderColor:transparent]',
            '[--sapButton_Lite_TextColor:var(--sapField_TextColor)] [--sapButton_Lite_Hover_TextColor:var(--sapField_TextColor)]',
            '[--sapButton_BorderCornerRadius:var(--sapField_BorderCornerRadius)]',
            this.readonly() && 'cursor-text',
            this.disabledState() && 'pointer-events-none opacity-(--sapContent_DisabledOpacity)',
            this.selectControlClass()
        );
    });

    protected readonly textClass = computed(() =>
        cn(
            'm-0 box-border inline-block min-w-11 truncate ps-2.5 pe-0 text-sap-text-color compact:min-w-8 compact:ps-2',
            !this.selectedOption() && 'font-normal text-sap-field-placeholder-text-color italic',
            // value state backgrounds in high contrast need the full text colour
            !this.selectedOption() && (this.state() ?? 'default') !== 'default' && 'hc:text-sap-field-text-color',
            this.readonly() && 'pe-2.5',
            !this.selectedOption() && (this.readonly() || this.disabledState()) && 'invisible'
        )
    );

    protected readonly buttonClass = computed(() => {
        const state = this.state() ?? 'default';
        return cn(
            buttonVariants({ variant: 'transparent' }),
            'shrink-0 rounded-sap-field-border-corner-radius border-0 text-sap-font-size',
            'hover:shadow-sap-field-hover-shadow',
            state === 'success' &&
                'hover:shadow-sap-content-positive-shadow group-focus/select:text-sap-button-accept-selected-text-color group-focus/select:shadow-sap-content-positive-shadow',
            state === 'error' &&
                'hover:shadow-sap-content-negative-shadow group-focus/select:text-sap-button-reject-selected-text-color group-focus/select:shadow-sap-content-negative-shadow',
            state === 'warning' &&
                'hover:shadow-sap-content-critical-shadow group-focus/select:text-sap-button-attention-selected-text-color group-focus/select:shadow-sap-content-critical-shadow',
            state === 'information' &&
                'hover:shadow-sap-content-informative-shadow group-focus/select:text-sap-button-selected-text-color group-focus/select:shadow-sap-content-informative-shadow'
        );
    });

    protected readonly listClass = computed(() =>
        cn(
            'm-0 box-border block min-w-20 list-none overflow-auto bg-sap-list-background p-0 outline-none scrollbar-sap',
            this.mobile() ? 'w-full' : 'w-full max-w-[40rem] rounded-[inherit]'
        )
    );
}
