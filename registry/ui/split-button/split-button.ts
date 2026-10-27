/*
 * Port of @fundamental-ngx/core (split-button) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    ElementRef,
    TemplateRef,
    booleanAttribute,
    computed,
    contentChild,
    effect,
    inject,
    input,
    linkedSignal,
    output,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Button, type ButtonVariant } from '@/ui/button/button';
import type { IconFont } from '@/ui/icon/icon';
import { Menu, type MenuItem } from '@/ui/menu/menu';

/** The action of the main button when it is not taken from the menu. */
export interface MainAction {
    mainActionTitle: string | TemplateRef<unknown>;
    /** Keeps this action on the main button when a menu item is chosen. */
    keepMainAction?: boolean;
    callback?: () => void;
}

/** Template for the main button content: `<ng-template fd-split-button-action-title>...</ng-template>`. */
@Directive({ selector: '[fd-split-button-action-title], [fdSplitButtonActionTitle]' })
export class SplitButtonActionTitle {
    readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

/** Pad, border and separator colours behind the two buttons, per button type. */
const PAD: Record<ButtonVariant, string> = {
    standard:
        '[--sb-pad:var(--sapButton_Background)] [--sb-sep:var(--sapButton_TextColor)] [--sb-bd:var(--sapButton_BorderColor)]',
    emphasized:
        '[--sb-pad:var(--sapButton_Emphasized_Background)] [--sb-sep:var(--sapButton_Emphasized_TextColor)] [--sb-bd:var(--sapButton_Emphasized_BorderColor)]',
    ghost: '[--sb-pad:var(--sapButton_Background)] [--sb-sep:var(--sapButton_TextColor)] [--sb-bd:transparent]',
    transparent:
        '[--sb-pad:var(--sapButton_Lite_Background)] [--sb-sep:var(--sapButton_Lite_TextColor)] [--sb-bd:transparent]',
    positive:
        '[--sb-pad:var(--sapButton_Accept_Background)] [--sb-sep:var(--sapButton_Accept_TextColor)] [--sb-bd:var(--sapButton_Accept_BorderColor)]',
    negative:
        '[--sb-pad:var(--sapButton_Reject_Background)] [--sb-sep:var(--sapButton_Reject_TextColor)] [--sb-bd:var(--sapButton_Reject_BorderColor)]',
    attention:
        '[--sb-pad:var(--sapButton_Attention_Background)] [--sb-sep:var(--sapButton_Attention_TextColor)] [--sb-bd:var(--sapButton_Attention_BorderColor)]'
};

/** High contrast themes keep the own background and border of each button. */
const HC_BUTTON: Record<ButtonVariant, string> = {
    standard: 'hc:bg-sap-button-background hc:border-sap-button-border-color',
    ghost: 'hc:bg-sap-button-background hc:border-sap-button-border-color',
    emphasized: 'hc:bg-sap-button-emphasized-background hc:border-sap-button-emphasized-border-color',
    transparent: 'hc:bg-sap-button-lite-background hc:border-sap-button-lite-border-color',
    positive: 'hc:bg-sap-button-accept-background hc:border-sap-button-accept-border-color',
    negative: 'hc:bg-sap-button-reject-background hc:border-sap-button-reject-border-color',
    attention: 'hc:bg-sap-button-attention-background hc:border-sap-button-attention-border-color'
};

/** Pressed look of the arrow button while the menu is open. */
const OPEN: Record<ButtonVariant, string> = {
    standard:
        'bg-sap-button-active-background! border-sap-button-active-border-color! text-sap-button-active-text-color!',
    ghost: 'bg-sap-button-active-background! border-sap-button-active-border-color! text-sap-button-active-text-color!',
    emphasized:
        'bg-sap-button-emphasized-active-background! border-sap-button-emphasized-active-border-color! text-sap-button-emphasized-active-text-color!',
    transparent:
        'bg-sap-button-lite-active-background! border-sap-button-lite-active-border-color! text-sap-button-active-text-color!',
    positive:
        'bg-sap-button-accept-active-background! border-sap-button-accept-active-border-color! text-sap-button-accept-active-text-color!',
    negative:
        'bg-sap-button-reject-active-background! border-sap-button-reject-active-border-color! text-sap-button-reject-active-text-color!',
    attention:
        'bg-sap-button-attention-active-background! border-sap-button-attention-active-border-color! text-sap-button-attention-active-text-color!'
};

/**
 * Split button: a main action and an arrow that opens a menu of alternative actions. Choosing a
 * menu item makes it the main action, unless `mainAction.keepMainAction` is set.
 *
 * ```html
 * <fd-split-button variant="emphasized" (primaryButtonClicked)="run()">
 *     <fd-menu>
 *         <li fd-menu-item><div fd-menu-interactive><span fd-menu-title>Save</span></div></li>
 *         <li fd-menu-item><div fd-menu-interactive><span fd-menu-title>Save as</span></div></li>
 *     </fd-menu>
 * </fd-split-button>
 * ```
 */
@Component({
    selector: 'fd-split-button',
    exportAs: 'fdSplitButton',
    imports: [Button, NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'inline-block align-middle' },
    template: `
        <div
            #group
            role="group"
            tabindex="-1"
            [attr.aria-label]="ariaLabel()"
            [class]="groupClass()"
            (focus)="arrowButton().nativeElement.focus()"
        >
            <button
                fdButton
                #main
                [variant]="variant()"
                [disabled]="disabled()"
                [label]="titleTemplate() ? null : mainTitle()"
                [style.width]="mainWidth()"
                [class]="mainClass()"
                (click)="onMainClick($event)"
            >
                @if (titleTemplate(); as t) {
                    <ng-container [ngTemplateOutlet]="t" />
                }
            </button>
            <button
                fdButton
                #arrow
                [variant]="variant()"
                [disabled]="disabled()"
                [glyph]="glyph()"
                [glyphFont]="glyphFont()"
                [ariaLabel]="expandButtonAriaLabel()"
                [attr.title]="expandButtonTitle() || expandButtonAriaLabel()"
                aria-haspopup="menu"
                [attr.aria-expanded]="!!menu()?.isOpen()"
                [attr.aria-controls]="menu()?.isOpen() ? menu()?.id() : null"
                [class]="arrowClass()"
                (keydown.arrowdown)="openFromKeyboard($event)"
            ></button>
            <ng-content select="fd-menu" />
        </div>
    `
})
export class SplitButton {
    /** Button type of both buttons. */
    readonly variant = input<ButtonVariant>('standard');
    readonly glyph = input('slim-arrow-down');
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly disabled = input(false, { transform: booleanAttribute });
    /** Tooltip of the arrow button. */
    readonly expandButtonTitle = input<string | null>(null);
    readonly expandButtonAriaLabel = input('More actions');
    readonly ariaLabel = input('Split button');
    /** Menu item shown as the main action. */
    readonly selected = input<MenuItem | null | undefined>();
    /** Keeps the main button width when its title changes. */
    readonly fixedWidth = input(true, { transform: booleanAttribute });
    readonly mainAction = input<MainAction | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    /** Emits on clicks on the main button. */
    readonly primaryButtonClicked = output<Event>();

    protected readonly menu = contentChild(Menu);
    private readonly titleDirective = contentChild(SplitButtonActionTitle);
    private readonly group = viewChild.required<ElementRef<HTMLElement>>('group');
    private readonly mainButton = viewChild.required('main', { read: ElementRef<HTMLElement> });
    protected readonly arrowButton = viewChild.required('arrow', { read: ElementRef<HTMLElement> });

    /** The menu item currently shown as the main action. */
    readonly selectedItem = linkedSignal<MenuItem | null>(() => this.selected() ?? null);
    protected readonly mainWidth = signal<string | null>(null);

    private readonly keepMainAction = computed(() => !!this.mainAction()?.keepMainAction);
    protected readonly titleTemplate = computed<TemplateRef<unknown> | null>(() => {
        const title = this.mainAction()?.mainActionTitle;
        if (title instanceof TemplateRef && (this.keepMainAction() || !this.selectedItem())) return title;
        return this.selectedItem() ? null : (this.titleDirective()?.templateRef ?? null);
    });
    protected readonly mainTitle = computed(() => {
        const title = this.mainAction()?.mainActionTitle;
        if (typeof title === 'string' && (this.keepMainAction() || !this.selectedItem())) return title;
        return this.selectedItem()?.titleText() ?? '';
    });

    protected readonly groupClass = computed(() => {
        const variant = this.variant();
        return cn(
            'relative inline-flex align-middle outline-none',
            PAD[variant],
            // the pad behind the buttons: background and border of a single button
            "before:absolute before:inset-0 before:rounded-sap-button-border-corner-radius before:bg-(--sb-pad) before:content-['']",
            'before:shadow-[inset_0_0_0_var(--sapButton_BorderWidth)_var(--sb-bd)] hc:before:shadow-none',
            // the separator between the buttons
            "after:absolute after:end-[2.125rem] after:top-1/2 after:z-10 after:mx-0.5 after:block after:h-4 after:w-(--sapButton_BorderWidth) after:-translate-y-1/2 after:bg-(--sb-sep) after:content-['']",
            'compact:after:end-[1.875rem] hover:after:hidden hc:after:hidden',
            this.userClass()
        );
    });

    private readonly buttonClass = computed(() =>
        cn(
            'm-0 border-transparent bg-transparent enabled-hover:z-[1] enabled-hover:shadow-none focus:z-[2]',
            HC_BUTTON[this.variant()]
        )
    );
    protected readonly mainClass = computed(() =>
        cn(
            this.buttonClass(),
            'justify-start hc:rounded-e-none hc:-me-px',
            this.variant() === 'emphasized' && 'hc:-me-(--sapButton_Emphasized_BorderWidth)',
            '[&>span]:block [&>span]:max-w-34 compact:[&>span]:max-w-36 [&>span]:truncate'
        )
    );
    protected readonly arrowClass = computed(() =>
        cn(this.buttonClass(), 'hc:rounded-s-none', this.menu()?.isOpen() && OPEN[this.variant()])
    );

    constructor() {
        // the group opens the menu, so the menu is placed below both buttons
        effect(() => this.menu()?.trigger.set(this.group().nativeElement));
        // without a title, the first menu item is the main action
        effect(() => {
            const menu = this.menu();
            if (!menu || this.mainAction() || this.titleDirective() || this.selectedItem()) return;
            const first = menu.items()[0];
            if (first) untracked(() => this.selectedItem.set(first));
        });
        // mark the main action in the menu
        effect(() => {
            const selected = this.keepMainAction() ? null : this.selectedItem();
            for (const item of this.menu()?.items() ?? []) item.selected.set(item === selected);
        });
        // a chosen menu item becomes the main action
        effect(() => {
            const path = this.menu()?.path() ?? [];
            const last = path[path.length - 1];
            if (!last || last.submenu()) return;
            untracked(() => this.choose(last));
        });
    }

    private choose(item: MenuItem): void {
        if (this.keepMainAction() || item === this.selectedItem()) return;
        if (this.fixedWidth() && !this.mainWidth()) {
            this.mainWidth.set(`${this.mainButton().nativeElement.getBoundingClientRect().width}px`);
        }
        this.selectedItem.set(item);
    }

    protected onMainClick(event: Event): void {
        event.stopPropagation();
        this.primaryButtonClicked.emit(event);
        const item = this.keepMainAction() ? null : this.selectedItem();
        if (item) item.click();
        else this.mainAction()?.callback?.();
    }

    protected openFromKeyboard(event: Event): void {
        const menu = this.menu();
        if (!menu || menu.isOpen()) return;
        event.preventDefault();
        menu.open();
    }
}
