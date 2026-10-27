/*
 * Port of @fundamental-ngx/core (breadcrumb) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Directionality } from '@angular/cdk/bidi';
import { CdkPortalOutlet, DomPortal } from '@angular/cdk/portal';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    afterEveryRender,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    inject,
    input,
    output
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon } from '@/ui/icon/icon';
import { Link } from '@/ui/link/link';
import { Menu, MenuInteractive, MenuItem, MenuTitle, MenuTrigger } from '@/ui/menu/menu';
import {
    OverflowExpand,
    OverflowItemRef,
    OverflowLayout,
    OverflowLayoutItem
} from '@/ui/overflow-layout/overflow-layout';

export type BreadcrumbSeparatorStyle =
    '' | 'backslash' | 'double-slash' | 'double-backslash' | 'greater-than' | 'double-greater-than';

const SEPARATOR: Record<BreadcrumbSeparatorStyle, string> = {
    '': '/',
    backslash: '\\',
    'double-slash': '//',
    'double-backslash': '\\\\',
    'greater-than': '>',
    'double-greater-than': '>>'
};
const SEPARATOR_CLASS = 'm-0 mx-1 p-0 text-sap-text-color';

/** Focusable elements of the trail, in order. */
const FOCUSABLE = 'a[fdLink], [fdLink], [aria-current], [data-breadcrumb-more]';

/**
 * A step of the trail: a link, or the current page as text with `aria-current="page"`.
 *
 * ```html
 * <fd-breadcrumb-item><a fdLink href="/products">Products</a></fd-breadcrumb-item>
 * <fd-breadcrumb-item><span aria-current="page">Laptops</span></fd-breadcrumb-item>
 * ```
 */
@Component({
    selector: 'fd-breadcrumb-item',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'm-0 box-border inline-flex items-center whitespace-nowrap py-px p-0 text-sap-content-label-color [&_[fdLink]]:leading-6 [&_[fdLink]]:whitespace-nowrap'
    },
    template: `<ng-content />
        @if (separator()) {
            <span aria-hidden="true" class="${SEPARATOR_CLASS}">{{ separator() }}</span>
        }`
})
export class BreadcrumbItem {
    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly link = contentChild(Link);
    readonly portal = new DomPortal(this.elementRef);
    private readonly breadcrumb = inject(Breadcrumb_, { optional: true });

    /** Separator after the item; none after a last item without link. */
    protected readonly separator = computed(() => {
        const breadcrumb = this.breadcrumb;
        const last = breadcrumb?.items().at(-1) === this;
        return last && !this.link() ? '' : SEPARATOR[breadcrumb?.separatorStyle() ?? ''];
    });

    /** Text shown for the item in the overflow menu. */
    text(): string {
        const target = this.target();
        return (target.querySelector(':scope > span') ?? target).textContent?.trim() ?? '';
    }

    /** The element that performs the item's navigation. */
    target(): HTMLElement {
        return (
            this.elementRef.nativeElement.querySelector<HTMLElement>('[fdLink], a, button') ??
            this.elementRef.nativeElement
        );
    }

    disabled(): boolean {
        return this.target().getAttribute('aria-disabled') === 'true';
    }
}

/** Base token so items can reach the breadcrumb declared after them. */
abstract class Breadcrumb_ {
    abstract readonly items: () => readonly BreadcrumbItem[];
    abstract readonly separatorStyle: () => BreadcrumbSeparatorStyle;
}

/**
 * Breadcrumb: the trail from the root to the current page. Items that do not fit collapse into
 * an overflow menu at the start. Arrow keys move between the visible links (one tab stop).
 *
 * ```html
 * <fd-breadcrumb>
 *     <fd-breadcrumb-item><a fdLink href="/">Home</a></fd-breadcrumb-item>
 *     <fd-breadcrumb-item><span aria-current="page">Laptops</span></fd-breadcrumb-item>
 * </fd-breadcrumb>
 * ```
 */
@Component({
    selector: 'fd-breadcrumb',
    exportAs: 'fdBreadcrumb',
    imports: [
        OverflowLayout,
        OverflowItemRef,
        OverflowLayoutItem,
        OverflowExpand,
        CdkPortalOutlet,
        Menu,
        MenuItem,
        MenuInteractive,
        MenuTitle,
        MenuTrigger,
        Link,
        Icon
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: Breadcrumb_, useExisting: Breadcrumb }],
    host: {
        role: 'navigation',
        '[attr.aria-label]': 'ariaLabel()',
        '[class]': 'computedClass()',
        '(keydown)': 'onKeydown($event)',
        '(focusin)': 'onFocusin($event)'
    },
    template: `
        <fd-overflow-layout
            showMorePosition="left"
            ariaRole="list"
            class="justify-start"
            [reverseHiddenItems]="!reverse()"
            [enableKeyboardNavigation]="false"
            (visibleItemsCount)="visibleItemsCount.emit($event)"
            (hiddenItemsCount)="hiddenItemsCount.emit($event)"
        >
            @for (item of items(); track item) {
                <div *fdOverflowItemRef="item" fdOverflowLayoutItem class="flex">
                    <ng-template [cdkPortalOutlet]="item.portal" />
                </div>
            }
            <ng-template fdOverflowExpand let-hidden>
                <span class="m-0 inline-flex items-center whitespace-nowrap p-0 py-px text-sap-content-label-color">
                    <a
                        fdLink
                        data-breadcrumb-more
                        role="button"
                        tabindex="-1"
                        [attr.aria-label]="moreLabel()"
                        [attr.title]="moreLabel()"
                        class="leading-6"
                        [fdMenuTrigger]="menu"
                        (keydown.enter)="$event.preventDefault(); menu.open()"
                        (keydown.space)="$event.preventDefault(); menu.open()"
                    >
                        <fd-icon glyph="overflow" />
                        <fd-icon glyph="slim-arrow-down" />
                    </a>
                    <span aria-hidden="true" class="${SEPARATOR_CLASS}">{{ separator() }}</span>
                </span>
                <fd-menu #menu [placement]="rtl() ? 'bottom-end' : 'bottom-start'" [ariaLabel]="moreLabel()">
                    @for (ref of hidden; track ref) {
                        <li fd-menu-item [disabled]="$any(ref).fdOverflowItemRef().disabled()">
                            <a fd-menu-interactive (click)="$any(ref).fdOverflowItemRef().target().click()">
                                <span fd-menu-title>{{ $any(ref).fdOverflowItemRef().text() }}</span>
                            </a>
                        </li>
                    }
                </fd-menu>
            </ng-template>
        </fd-overflow-layout>
        <div hidden><ng-content /></div>
    `
})
export class Breadcrumb extends Breadcrumb_ {
    /** Lists the collapsed items from the root down instead of from the current page up. */
    readonly reverse = input(false, { transform: booleanAttribute });
    readonly separatorStyle = input<BreadcrumbSeparatorStyle>('');
    readonly ariaLabel = input('Breadcrumb trail');
    readonly moreLabel = input('More');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly visibleItemsCount = output<number>();
    readonly hiddenItemsCount = output<number>();

    readonly items = contentChildren(BreadcrumbItem);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly direction = inject(Directionality, { optional: true });
    protected readonly rtl = computed(() => this.direction?.valueSignal() === 'rtl');

    protected readonly separator = computed(() => SEPARATOR[this.separatorStyle()]);

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 mb-2 box-border flex flex-wrap items-center p-0 font-sap-font-family text-sap-font-size',
            this.userClass()
        )
    );

    constructor() {
        super();
        // one tab stop: the last focused visible link, or the first one
        afterEveryRender(() => {
            const visible = this.focusables();
            const current = visible.includes(this.current!) ? this.current : visible[0];
            this.host.querySelectorAll<HTMLElement>(FOCUSABLE).forEach((el) => (el.tabIndex = el === current ? 0 : -1));
        });
    }

    private current: HTMLElement | null = null;

    private focusables(): HTMLElement[] {
        return Array.from(this.host.querySelectorAll<HTMLElement>(`fd-overflow-layout :is(${FOCUSABLE})`)).filter(
            (el) => !el.closest('[hidden]') && el.getAttribute('aria-disabled') !== 'true'
        );
    }

    protected onFocusin(event: FocusEvent): void {
        const target = event.target as HTMLElement;
        const visible = this.focusables();
        if (!visible.includes(target)) return;
        this.current = target;
        visible.forEach((el) => (el.tabIndex = el === target ? 0 : -1));
    }

    protected onKeydown(event: KeyboardEvent): void {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
        if (!keys.includes(event.key) || event.defaultPrevented) return;
        const visible = this.focusables();
        const index = visible.indexOf(event.target as HTMLElement);
        if (index === -1) return;
        const next =
            event.key === 'ArrowDown' || event.key === (this.rtl() ? 'ArrowLeft' : 'ArrowRight')
                ? index + 1
                : index - 1;
        const el = visible[Math.max(0, Math.min(next, visible.length - 1))];
        if (el !== visible[index]) {
            event.preventDefault();
            el.focus();
        }
    }
}
