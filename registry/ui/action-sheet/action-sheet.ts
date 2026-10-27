/*
 * Port of @fundamental-ngx/core (action-sheet) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { FocusKeyManager, type FocusableOption } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    Injector,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    effect,
    forwardRef,
    inject,
    input,
    model,
    output,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Bar, BarElement, BarLeft } from '@/ui/bar/bar';
import { Button, type ButtonVariant } from '@/ui/button/button';
import type { IconFont } from '@/ui/icon/icon';
import { Popover, PopoverBody, PopoverControl, type Placement } from '@/ui/popover/popover';

export type FocusEscapeDirection = 'up' | 'down';

/**
 * Action of an action sheet: a full-width button.
 *
 * ```html
 * <li fd-action-sheet-item label="Download" glyph="download" (click)="download()"></li>
 * <li fd-action-sheet-item label="Cancel" negative isCloseButton></li>
 * ```
 */
@Component({
    selector: '[fd-action-sheet-item]',
    imports: [Button],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'none',
        class: 'm-0 box-border block w-full p-0 py-1 compact:py-[0.1875rem]',
        '(click)': 'clicked()',
        '(focusin)': 'sheetBody?.itemFocused(this)'
    },
    template: `
        <button
            fdButton
            fullWidth
            role="menuitem"
            [variant]="computedVariant()"
            [toggled]="!!toggled()"
            [label]="label()"
            [glyph]="glyph()"
            [glyphFont]="glyphFont()"
            [disabled]="isDisabled()"
            [tabindex]="tabIndex()"
            [class]="buttonClass()"
        >
            <ng-content />
        </button>
    `
})
export class ActionSheetItem implements FocusableOption {
    readonly label = input<string | null | undefined>();
    readonly glyph = input<string | null | undefined>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    /** A destructive or cancelling action, shown centred in the negative style. */
    readonly negative = input(false, { transform: booleanAttribute });
    /** Closes the action sheet when chosen. */
    readonly isCloseButton = input(false, { transform: booleanAttribute });
    readonly isDisabled = input(false, { alias: 'disabled', transform: booleanAttribute });
    readonly variant = input<ButtonVariant>('standard', { alias: 'fdType' });
    readonly toggled = input<boolean | null | undefined>();

    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly sheetBody = inject(
        forwardRef(() => ActionSheetBody),
        { optional: true }
    );
    private readonly sheet = inject(
        forwardRef(() => ActionSheet),
        { optional: true }
    );
    readonly tabIndex = signal(-1);

    protected readonly computedVariant = computed<ButtonVariant>(() =>
        this.negative() ? 'negative' : this.variant() === 'standard' ? 'transparent' : this.variant()
    );
    protected readonly buttonClass = computed(() => cn(!this.negative() && 'justify-start text-start'));

    protected clicked(): void {
        if (this.disabled) return;
        this.sheetBody?.itemFocused(this);
        if (this.isCloseButton()) this.sheet?.close();
    }

    get disabled(): boolean {
        return this.isDisabled();
    }

    focus(): void {
        this.el.querySelector('button')?.focus();
    }

    click(): void {
        this.el.querySelector('button')?.click();
    }

    getLabel(): string {
        return this.label() ?? this.el.textContent?.trim() ?? '';
    }
}

/** The list of actions. */
@Component({
    selector: 'fd-action-sheet-body',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'block w-full',
        '(keydown)': 'onKeydown($event)'
    },
    template: `
        <ul
            role="menu"
            [id]="actionSheetBodyId()"
            [attr.aria-label]="ariaLabel()"
            [attr.aria-labelledby]="ariaLabelledby()"
            [class]="listClass()"
        >
            <ng-content />
        </ul>
    `
})
export class ActionSheetBody {
    readonly actionSheetBodyId = input(`fd-action-sheet-body-${nextBodyId++}`);
    readonly ariaLabel = input<string | null>(null);
    readonly ariaLabelledby = input<string | null>(null);
    readonly focusEscapeList = output<FocusEscapeDirection>();

    readonly items = contentChildren(ActionSheetItem);
    private readonly sheet = inject(
        forwardRef(() => ActionSheet),
        { optional: true }
    );
    private readonly keyManager = new FocusKeyManager(this.items, inject(Injector))
        .withVerticalOrientation()
        .withHomeAndEnd()
        .withWrap();

    protected readonly listClass = computed(() =>
        cn(
            'm-0 box-border w-full list-none p-0 px-2 py-1 compact:px-[0.375rem] compact:py-[0.1875rem]',
            this.sheet?.mobile() &&
                'relative z-[1] w-[calc(100%_-_0.125rem)] ms-px overflow-auto rounded-sap-popover-border-corner-radius bg-sap-group-content-background shadow-sap-content-shadow1 [[data-sheet-bar]+&]:rounded-t-none'
        )
    );

    constructor() {
        // one tab stop: the active (or first enabled) action
        effect(() => {
            const items = this.items();
            untracked(() => {
                const active = this.keyManager.activeItem ?? items.find((i) => !i.disabled);
                items.forEach((i) => i.tabIndex.set(i === active ? 0 : -1));
            });
        });
    }

    /** @internal */
    itemFocused(item: ActionSheetItem): void {
        this.keyManager.updateActiveItem(item);
        this.items().forEach((i) => i.tabIndex.set(i === item ? 0 : -1));
    }

    /** Focuses the first enabled action. */
    focusFirst(): void {
        this.keyManager.setFirstItemActive();
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Tab') {
            event.preventDefault();
            this.sheet?.close();
            return;
        }
        this.keyManager.onKeydown(event);
    }
}
let nextBodyId = 0;

/** Wraps the element that opens the action sheet. */
@Component({
    selector: 'fd-action-sheet-control',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'inline-block', '(click)': 'onClick()' },
    template: '<ng-content />'
})
export class ActionSheetControl {
    readonly clicked = output<void>();
    private readonly sheet = inject(
        forwardRef(() => ActionSheet),
        { optional: true }
    );
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private lastFocused: HTMLElement | null = null;

    protected onClick(): void {
        this.lastFocused = document.activeElement as HTMLElement | null;
        this.clicked.emit();
        this.sheet?.toggle();
    }

    /** @internal Returns the focus to the element that opened the sheet. */
    restoreFocus(): void {
        (this.lastFocused ?? this.el.querySelector<HTMLElement>('button, a, [tabindex]'))?.focus();
    }
}

/**
 * Action sheet: a list of actions for the control that opens it, in a popover, or on phones in a
 * sheet at the bottom of the screen. The arrow keys move between the actions; Escape and Tab close it.
 *
 * ```html
 * <fd-action-sheet>
 *     <fd-action-sheet-control><button fdButton glyph="settings" ariaLabel="Actions"></button></fd-action-sheet-control>
 *     <fd-action-sheet-body>
 *         <li fd-action-sheet-item label="Download" glyph="download"></li>
 *         <li fd-action-sheet-item label="Cancel" negative isCloseButton></li>
 *     </fd-action-sheet-body>
 * </fd-action-sheet>
 * ```
 */
@Component({
    selector: 'fd-action-sheet',
    exportAs: 'fdActionSheet',
    imports: [Popover, PopoverControl, PopoverBody, NgTemplateOutlet, Bar, BarLeft, BarElement],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'inline-block', '(keydown.escape)': 'onEscape($event)' },
    template: `
        @if (!mobile()) {
            <fd-popover
                [placement]="placement()"
                [isOpen]="isOpen()"
                (isOpenChange)="isOpen.set($event)"
                [noArrow]="noArrow()"
                [triggers]="[]"
                focusTrapped
                focusAutoCapture
                [bodyRole]="null"
            >
                <fd-popover-control><ng-container [ngTemplateOutlet]="control" /></fd-popover-control>
                <fd-popover-body><ng-container [ngTemplateOutlet]="body" /></fd-popover-body>
            </fd-popover>
        } @else {
            <ng-container [ngTemplateOutlet]="control" />
            @if (isOpen()) {
                <div
                    class="fixed inset-0 z-[999] flex flex-col justify-end before:absolute before:inset-0 before:bg-sap-block-layer-background before:opacity-(--sapBlockLayer_Opacity) before:content-['']"
                    (click)="close()"
                >
                    <div class="relative" (click)="$event.stopPropagation()">
                        <ng-container [ngTemplateOutlet]="body" />
                    </div>
                </div>
            }
        }
        <ng-template #control><ng-content select="fd-action-sheet-control" /></ng-template>
        <ng-template #body>
            @if (mobile() && controlTitle()) {
                <div
                    fd-bar
                    data-sheet-bar
                    ariaLabel="Actions"
                    class="relative z-[2] ms-px w-[calc(100%_-_var(--sapGroup_BorderWidth)*2)] rounded-t-sap-popover-border-corner-radius shadow-sap-content-shadow2"
                >
                    <div fd-bar-left>
                        <fd-bar-element>
                            <div
                                role="heading"
                                [attr.aria-level]="controlTitleHeading()"
                                class="truncate font-sap-font-header-family text-sap-font-header5-size text-sap-page-header-text-color"
                            >
                                {{ controlTitle() }}
                            </div>
                        </fd-bar-element>
                    </div>
                </div>
            }
            <ng-content select="fd-action-sheet-body" />
        </ng-template>
    `
})
export class ActionSheet {
    /** Shows the actions in a sheet at the bottom of the screen. */
    readonly mobile = input(false, { transform: booleanAttribute });
    readonly placement = input<Placement>('bottom');
    readonly noArrow = input(false, { transform: booleanAttribute });
    readonly isOpen = model(false);
    /** Title above the actions in mobile mode. */
    readonly controlTitle = input<string | null>(null);
    readonly controlTitleHeading = input<1 | 2 | 3 | 4 | 5 | 6>(2);
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly control = contentChild(ActionSheetControl);
    private readonly body = contentChild(ActionSheetBody);
    private readonly popover = viewChild(Popover);
    private readonly injector = inject(Injector);

    constructor() {
        let wasOpen = false;
        effect(() => {
            const open = this.isOpen();
            untracked(() => {
                if (open && !wasOpen) {
                    // the popover focuses the first tabbable action; the mobile sheet does it here
                    if (this.mobile()) afterNextRender(() => this.body()?.focusFirst(), { injector: this.injector });
                } else if (!open && wasOpen && this.mobile()) {
                    this.control()?.restoreFocus();
                }
                wasOpen = open;
            });
        });
        inject(DestroyRef).onDestroy(() => this.popover()?.close(false));
    }

    open(): void {
        this.isOpen.set(true);
    }

    close(): void {
        this.isOpen.set(false);
    }

    toggle(): void {
        this.isOpen.update((v) => !v);
    }

    protected onEscape(event: Event): void {
        if (this.mobile() && this.isOpen()) {
            event.stopPropagation();
            this.close();
        }
    }
}
