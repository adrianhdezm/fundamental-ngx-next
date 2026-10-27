/*
 * Port of @fundamental-ngx/core (product-switch) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Directionality } from '@angular/cdk/bidi';
import { CdkDrag, CdkDropList, type CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ViewportRuler } from '@angular/cdk/scrolling';
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
    model,
    output,
    signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { cn, type ClassValue } from '@/lib/utils';
import { Avatar, type ColorAccent } from '@/ui/avatar/avatar';
import { BusyIndicator } from '@/ui/busy-indicator/busy-indicator';
import { Button } from '@/ui/button/button';
import { Icon, type IconFont } from '@/ui/icon/icon';
import { Popover, PopoverBody, PopoverControl, type Placement, type TriggerConfig } from '@/ui/popover/popover';

/** A product of the switch: an icon or avatar, a title and an optional subtitle. */
export interface ProductSwitchItem {
    title: string;
    subtitle?: string;
    /** Called on click; otherwise `url` opens in `target`. */
    callback?: (event: Event) => void;
    url?: string;
    target?: '_self' | '_blank' | '_parent' | '_top';
    icon?: string;
    font?: IconFont;
    avatar?: {
        glyph?: string;
        label?: string;
        image?: string;
        circle?: boolean;
        transparent?: boolean;
        placeholder?: boolean;
        tile?: boolean;
        colorAccent?: ColorAccent | null;
        border?: boolean;
        ariaLabel?: string;
    };
    /** The item cannot be dragged. */
    disabledDragAndDrop?: boolean;
    /** The item keeps its position when others are dragged. */
    stickToPosition?: boolean;
}

const TARGET_LABEL: Record<string, string> = {
    _blank: 'Opens in a new tab',
    _parent: 'Opens in the parent frame',
    _top: 'Opens in the full window'
};

/**
 * The products: a grid of four (or three or two) columns that becomes a list on small screens.
 * Items can be reordered by drag and drop. Arrow keys move between them; Enter and Space open them.
 */
@Component({
    selector: 'fd-product-switch-body',
    imports: [CdkDropList, CdkDrag, Icon, Avatar, BusyIndicator],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `
        <fd-busy-indicator [loading]="busy()" block>
            <div [class]="bodyClass()">
                <ul
                    role="menu"
                    cdkDropList
                    [cdkDropListOrientation]="listMode() ? 'vertical' : 'mixed'"
                    [cdkDropListDisabled]="!dragAndDropEnabled()"
                    [cdkDropListSortPredicate]="canSortTo"
                    [class]="listClass()"
                    (cdkDropListDropped)="dropped($event)"
                >
                    @for (product of products(); track product; let i = $index) {
                        <li
                            role="menuitem"
                            tabindex="0"
                            cdkDrag
                            [cdkDragDisabled]="!!product.disabledDragAndDrop || !!product.stickToPosition"
                            [attr.aria-label]="itemLabel(product)"
                            [attr.aria-posinset]="i + 1"
                            [attr.aria-setsize]="products().length"
                            [class]="itemClass()"
                            (cdkDragStarted)="dragged = true"
                            (cdkDragEnded)="dragEnded()"
                            (click)="itemClick(product, $event)"
                            (keydown)="onKeydown($event, i)"
                        >
                            @if (product.avatar; as a) {
                                <fd-avatar
                                    size="s"
                                    [glyph]="a.glyph ?? null"
                                    [label]="a.label ?? null"
                                    [image]="a.image ?? null"
                                    [circle]="!!a.circle"
                                    [transparent]="!!a.transparent"
                                    [placeholder]="!!a.placeholder"
                                    [tile]="!!a.tile"
                                    [border]="!!a.border"
                                    [colorAccent]="a.colorAccent ?? null"
                                    [ariaLabel]="a.ariaLabel ?? null"
                                />
                            } @else {
                                <fd-icon
                                    role="presentation"
                                    [glyph]="product.icon"
                                    [font]="product.font ?? 'SAP-icons'"
                                    class="flex min-h-12 min-w-12 items-center justify-center text-[1.5rem] text-sap-content-icon-color group-active/ps:text-sap-list-active-text-color"
                                />
                            }
                            <div [class]="textClass()">
                                <div
                                    class="m-0 p-0 whitespace-normal text-sap-title-color group-active/ps:text-sap-list-active-text-color"
                                >
                                    {{ product.title }}
                                </div>
                                @if (product.subtitle) {
                                    <div
                                        class="m-0 p-0 text-sap-font-small-size whitespace-normal text-sap-content-label-color group-active/ps:text-sap-list-active-text-color"
                                    >
                                        {{ product.subtitle }}
                                    </div>
                                }
                            </div>
                        </li>
                    }
                </ul>
            </div>
        </fd-busy-indicator>
    `
})
export class ProductSwitchBody {
    readonly products = model<ProductSwitchItem[]>([]);
    readonly dragAndDropEnabled = input(true, { transform: booleanAttribute });
    /** Always shows the list layout. */
    readonly forceListMode = input(false, { transform: booleanAttribute });
    readonly busy = input(false, { transform: booleanAttribute });
    /** Emits when a product is opened. */
    readonly itemClicked = output<ProductSwitchItem>();

    private readonly direction = inject(Directionality, { optional: true });
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly viewportWidth = signal(0);
    protected dragged = false;

    private readonly columns = computed(() => {
        const n = this.products().length;
        return n >= 7 ? 4 : n >= 3 ? 3 : 2;
    });
    protected readonly listMode = computed(
        () => this.forceListMode() || this.viewportWidth() < (this.columns() === 4 ? 776 : 588)
    );

    protected readonly bodyClass = computed(() =>
        cn(
            'm-0 box-border max-h-[33rem] w-fit overflow-y-auto bg-sap-list-background px-4 py-6 scrollbar-sap',
            'rounded-sap-popover-border-corner-radius',
            this.listMode() && 'w-full max-w-[353px] max-h-screen overflow-x-hidden rounded-none p-4'
        )
    );
    protected readonly listClass = computed(() =>
        cn(
            'relative m-0 box-border flex list-none flex-wrap gap-2 p-0',
            this.listMode()
                ? 'w-full flex-col gap-0'
                : { 4: 'w-[46.5rem]', 3: 'w-[34.75rem]', 2: 'w-[23rem]' }[this.columns()]
        )
    );
    protected readonly itemClass = computed(() =>
        cn(
            'group/ps m-0 box-border flex cursor-pointer gap-1 rounded-sap-element-border-corner-radius bg-sap-list-background',
            'outline-2 -outline-offset-2 outline-transparent hover:bg-sap-list-hover-background',
            'active:bg-sap-list-active-background active:outline-sap-content-focus-color',
            'focus:outline-(length:--sapContent_FocusWidth) focus:[outline-style:var(--sapContent_FocusStyle)] focus:outline-sap-content-focus-color',
            '[&.cdk-drag-preview]:shadow-sap-content-shadow3 [&.cdk-drag-placeholder]:opacity-0',
            this.listMode()
                ? 'min-h-24 max-w-full flex-auto flex-row gap-3 p-4 text-start'
                : 'min-h-[7.375rem] max-w-[11.25rem] flex-[1_0_25%] flex-col items-center px-2 py-4 text-center'
        )
    );
    protected readonly textClass = computed(() =>
        cn('m-0 flex w-full flex-col gap-1 p-0', this.listMode() && 'h-full justify-between')
    );

    constructor() {
        const ruler = inject(ViewportRuler);
        this.viewportWidth.set(ruler.getViewportSize().width);
        ruler
            .change(100)
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.viewportWidth.set(ruler.getViewportSize().width));
    }

    protected itemLabel(item: ProductSwitchItem): string {
        const parts = [item.title];
        if (item.subtitle) parts.push(item.subtitle);
        const target = item.target ?? '_blank';
        if (item.url && target !== '_self') parts.push(TARGET_LABEL[target]);
        return parts.join(' ');
    }

    /** Sticky items keep their index. */
    protected readonly canSortTo = (index: number): boolean => !this.products()[index]?.stickToPosition;

    protected dropped(event: CdkDragDrop<unknown>): void {
        if (event.previousIndex === event.currentIndex) return;
        const items = [...this.products()];
        moveItemInArray(items, event.previousIndex, event.currentIndex);
        this.products.set(items);
    }

    /** The click that ends a drag does not open the product. */
    protected dragEnded(): void {
        setTimeout(() => (this.dragged = false));
    }

    protected itemClick(item: ProductSwitchItem, event: Event): void {
        if (this.dragged) {
            this.dragged = false;
            return;
        }
        this.itemClicked.emit(item);
        if (item.callback) item.callback(event);
        else if (item.url) window.open(item.url, item.target ?? '_blank');
    }

    protected onKeydown(event: KeyboardEvent, index: number): void {
        if (event.key === 'Tab') return;
        const items = Array.from(this.el.querySelectorAll<HTMLElement>('[role=menuitem]'));
        const last = items.length - 1;
        const rtl = this.direction?.valueSignal() === 'rtl';
        let next: number | null = null;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            items[index].click();
            return;
        }
        if (this.listMode()) {
            if (event.key === 'ArrowDown') next = index === last ? 0 : index + 1;
            if (event.key === 'ArrowUp') next = index === 0 ? last : index - 1;
        } else {
            const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
            const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
            if (event.key === forward) next = index === last ? 0 : index + 1;
            if (event.key === backward) next = index - 1;
            if (event.key === 'ArrowDown') next = index + this.columns();
            if (event.key === 'ArrowUp') next = index - this.columns();
        }
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = last;
        if (next === null) return;
        event.preventDefault();
        items[next]?.focus();
    }
}

/** Custom trigger: `<ng-template fdProductSwitchButton>...</ng-template>`. */
@Directive({ selector: '[fdProductSwitchButton]' })
export class ProductSwitchButton {
    readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * Product switch: a grid button (in the shellbar) that opens the products of the user.
 *
 * ```html
 * <fd-product-switch>
 *     <fd-product-switch-body [(products)]="products" />
 * </fd-product-switch>
 * ```
 */
@Component({
    selector: 'fd-product-switch',
    exportAs: 'fdProductSwitch',
    imports: [Popover, PopoverControl, PopoverBody, Button, NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'inline-block' },
    template: `
        <fd-popover
            [placement]="placement()"
            [(isOpen)]="isOpen"
            [disabled]="disabled()"
            [triggers]="triggers()"
            [closeOnEscapeKey]="closeOnEscapeKey()"
            [closeOnOutsideClick]="closeOnOutsideClick()"
            [noArrow]="noArrow()"
            [disableScrollbar]="true"
            [focusTrapped]="focusTrapped()"
            focusAutoCapture
            [bodyRole]="null"
            (beforeOpen)="beforeOpen.emit()"
        >
            <fd-popover-control>
                @if (customButton(); as custom) {
                    <ng-container [ngTemplateOutlet]="custom.templateRef" />
                } @else {
                    <button
                        fdButton
                        variant="transparent"
                        glyph="grid"
                        data-density="cozy"
                        aria-haspopup="menu"
                        [attr.aria-expanded]="isOpen()"
                        [ariaLabel]="ariaLabel()"
                        [attr.title]="ariaLabel()"
                        [class]="buttonClass()"
                    ></button>
                }
            </fd-popover-control>
            <fd-popover-body><ng-content /></fd-popover-body>
        </fd-popover>
    `
})
export class ProductSwitch {
    readonly placement = input<Placement>('bottom-end');
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly closeOnEscapeKey = input(true, { transform: booleanAttribute });
    readonly closeOnOutsideClick = input(true, { transform: booleanAttribute });
    readonly noArrow = input(true, { transform: booleanAttribute });
    readonly triggers = input<(string | TriggerConfig)[]>(['click']);
    readonly focusTrapped = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input('Product switch');
    /** Classes of the default trigger button, e.g. shellbar button styles. */
    readonly buttonClass = input<ClassValue>('');
    readonly isOpen = model(false);
    readonly beforeOpen = output<void>();
    protected readonly customButton = contentChild(ProductSwitchButton);
    private readonly body = contentChild(ProductSwitchBody);

    constructor() {
        // choosing a product closes the switch
        effect((onCleanup) => {
            const sub = this.body()?.itemClicked.subscribe(() => this.isOpen.set(false));
            onCleanup(() => sub?.unsubscribe());
        });
    }
}
