/*
 * Port of @fundamental-ngx/core (avatar-group) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    TemplateRef,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    inject,
    input,
    output,
    signal,
    viewChild
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { type AvatarSize } from '@/ui/avatar/avatar';
import { Bar, BarElement, BarLeft, ButtonBar } from '@/ui/bar/bar';
import { Popover, PopoverBody, PopoverBodyHeader, PopoverControl, type Placement } from '@/ui/popover/popover';

export type AvatarGroupType = 'group' | 'individual';
export type AvatarGroupOrientation = 'horizontal' | 'vertical';

/** Gap between avatars of individual groups and overlap of group-type avatars, per size. */
const GAP: Record<AvatarSize, string> = {
    xs: '[--ag-gap:0.0625rem] [--ag-overlap:-0.5rem]',
    s: '[--ag-gap:0.125rem] [--ag-overlap:-1.25rem]',
    sm: '[--ag-gap:0.125rem] [--ag-overlap:-1.25rem]',
    m: '[--ag-gap:0.125rem] [--ag-overlap:-1.625rem]',
    md: '[--ag-gap:0.125rem] [--ag-overlap:-1.625rem]',
    l: '[--ag-gap:0.125rem] [--ag-overlap:-2rem]',
    lg: '[--ag-gap:0.125rem] [--ag-overlap:-2rem]',
    xl: '[--ag-gap:0.25rem] [--ag-overlap:-2.75rem]'
};
const OVERFLOW_SIZE: Record<AvatarSize, string> = {
    xs: 'size-8 text-[0.75rem]',
    s: 'size-12 text-sap-font-size',
    sm: 'size-12 text-sap-font-size',
    m: 'size-16 text-[1.25rem]',
    md: 'size-16 text-[1.25rem]',
    l: 'size-20 text-[1.5rem]',
    lg: 'size-20 text-[1.5rem]',
    xl: 'size-28 text-[2rem]'
};

/** Inner focus frame of round avatar triggers. */
const FOCUS_RING =
    "relative rounded-full outline-none focus-visible:after:pointer-events-none focus-visible:after:absolute focus-visible:after:-inset-1 focus-visible:after:rounded-full focus-visible:after:content-[''] focus-visible:after:border-(length:--sapContent_FocusWidth) focus-visible:after:[border-style:var(--sapContent_FocusStyle)] focus-visible:after:border-sap-content-focus-color";

/**
 * An avatar of a group: `<fd-avatar *fdAvatarGroupItem="details; title: 'Jane Doe'" ... />`.
 * The optional details template is shown in a popover (individual groups) or the overflow list.
 */
@Directive({ selector: '[fdAvatarGroupItem]' })
export class AvatarGroupItem {
    readonly templateRef = inject(TemplateRef);
    /** Details template; a string (e.g. empty) means no details. */
    readonly fdAvatarGroupItem = input<TemplateRef<unknown> | string | null | undefined>();
    /** Title of the details view in the overflow popover. */
    readonly fdAvatarGroupItemTitle = input<string | null | undefined>();
    /** Always visible, never moved to the overflow popover. */
    readonly fdAvatarGroupItemForceVisibility = input(false, { transform: booleanAttribute });

    readonly details = computed(() => {
        const details = this.fdAvatarGroupItem();
        return details instanceof TemplateRef ? details : null;
    });
}

/** Custom overflow button: `<ng-template fdAvatarGroupOverflowButton let-hiddenItems="hiddenItems">`. */
@Directive({ selector: '[fdAvatarGroupOverflowButton]' })
export class AvatarGroupOverflowButton {
    readonly templateRef = inject<TemplateRef<{ hiddenItems: AvatarGroupItem[] }>>(TemplateRef);
}

/** Custom overflow popover content: `<ng-template fdAvatarGroupOverflowBody let-hiddenItems="hiddenItems">`. */
@Directive({ selector: '[fdAvatarGroupOverflowBody]' })
export class AvatarGroupOverflowBody {
    readonly templateRef = inject<TemplateRef<{ hiddenItems: AvatarGroupItem[] }>>(TemplateRef);
}

/** Overflow popover content: the avatars, and the details of the one chosen. */
@Component({
    selector: 'fd-avatar-group-overflow-list',
    imports: [NgTemplateOutlet, Bar, BarLeft, BarElement, ButtonBar, PopoverBodyHeader],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block max-w-80' },
    template: `
        <div fdPopoverBodyHeader>
            <div fd-bar barDesign="header" [attr.aria-label]="heading()">
                <div fd-bar-left>
                    @if (selected()) {
                        <fd-button-bar
                            glyph="navigation-left-arrow"
                            [ariaLabel]="backLabel()"
                            [title]="backLabel()"
                            (click)="back()"
                        />
                    }
                    <fd-bar-element>
                        <span
                            role="heading"
                            [attr.aria-level]="headingLevel()"
                            class="font-sap-font-header-family text-sap-font-header5-size font-bold text-sap-title-color"
                            >{{ heading() }}</span
                        >
                    </fd-bar-element>
                </div>
            </div>
        </div>
        @if (selected(); as item) {
            <ng-container [ngTemplateOutlet]="item.details()" />
        } @else {
            <div role="list" class="flex flex-wrap gap-2 p-4 whitespace-normal">
                @for (item of items(); track item) {
                    <div
                        role="listitem"
                        [attr.tabindex]="item.details() ? 0 : null"
                        [attr.aria-haspopup]="item.details() ? 'dialog' : null"
                        [class]="item.details() ? focusRing + ' cursor-pointer' : ''"
                        (click)="open(item)"
                        (keydown.enter)="open(item)"
                        (keydown.space)="$event.preventDefault(); open(item)"
                    >
                        <ng-container [ngTemplateOutlet]="item.templateRef" />
                    </div>
                }
            </div>
        }
    `
})
export class AvatarGroupOverflowList {
    readonly items = input<AvatarGroupItem[]>([]);
    readonly title = input<string | null | undefined>();
    readonly headingLevel = input<number>(5);
    readonly backLabel = input('Back');

    protected readonly focusRing = FOCUS_RING;
    protected readonly selected = signal<AvatarGroupItem | null>(null);
    protected readonly heading = computed(() => this.selected()?.fdAvatarGroupItemTitle() ?? this.title() ?? '');
    private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    protected open(item: AvatarGroupItem): void {
        if (!item.details()) return;
        this.selected.set(item);
        requestAnimationFrame(() =>
            this.element.querySelector<HTMLElement>('button, a, input, [tabindex="0"]')?.focus()
        );
    }

    protected back(): void {
        const item = this.selected();
        this.selected.set(null);
        requestAnimationFrame(() => {
            const index = this.items().indexOf(item!);
            this.element.querySelectorAll<HTMLElement>('[role=listitem]')[index]?.focus();
        });
    }
}

/**
 * Avatar group: avatars of a team or set of people. Individual groups show each avatar with its
 * own details popover; group-type groups overlap the avatars and open one popover with all of
 * them. Avatars that do not fit (or exceed maxVisibleItems) go into an overflow popover.
 *
 * ```html
 * <fd-avatar-group size="s" overflowPopoverTitle="Team">
 *     @for (p of people; track p.id) {
 *         <fd-avatar *fdAvatarGroupItem="details; title: p.name" circle border size="s" [label]="p.name" />
 *     }
 * </fd-avatar-group>
 * ```
 */
@Component({
    selector: 'fd-avatar-group',
    exportAs: 'fdAvatarGroup',
    imports: [NgTemplateOutlet, Popover, PopoverControl, PopoverBody, AvatarGroupOverflowList],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `
        @if (type() === 'individual') {
            <div #row role="list" [attr.aria-label]="ariaLabel() || 'Individual avatar group'" [class]="rowClass()">
                @for (item of visibleItems(); track item) {
                    <div role="listitem" data-avatar-group-item class="flex">
                        @if (item.details()) {
                            <fd-popover [noArrow]="false" [placement]="placement()">
                                <fd-popover-control>
                                    <div
                                        role="button"
                                        tabindex="0"
                                        aria-haspopup="dialog"
                                        [class]="focusRing + ' flex cursor-pointer'"
                                    >
                                        <ng-container [ngTemplateOutlet]="item.templateRef" />
                                    </div>
                                </fd-popover-control>
                                <fd-popover-body><ng-container [ngTemplateOutlet]="item.details()" /></fd-popover-body>
                            </fd-popover>
                        } @else {
                            <ng-container [ngTemplateOutlet]="item.templateRef" />
                        }
                    </div>
                }
                @if (hiddenItems().length) {
                    <div role="listitem" data-avatar-group-overflow class="flex">
                        <fd-popover
                            [noArrow]="false"
                            [placement]="placement()"
                            [bodyAriaLabel]="overflowPopoverTitle()"
                        >
                            <fd-popover-control>
                                <div
                                    role="button"
                                    tabindex="0"
                                    aria-haspopup="dialog"
                                    [attr.aria-label]="'+' + hiddenItems().length + ' more'"
                                    [class]="focusRing + ' flex cursor-pointer'"
                                >
                                    <ng-container [ngTemplateOutlet]="overflowButtonTemplate" />
                                </div>
                            </fd-popover-control>
                            <fd-popover-body
                                ><ng-container
                                    [ngTemplateOutlet]="overflowBodyTemplate"
                                    [ngTemplateOutletContext]="{ $implicit: hiddenItems() }"
                            /></fd-popover-body>
                        </fd-popover>
                    </div>
                }
            </div>
        } @else {
            <fd-popover [noArrow]="false" [placement]="placement()" [bodyAriaLabel]="overflowPopoverTitle()">
                <fd-popover-control>
                    <div #row role="button" tabindex="0" aria-haspopup="dialog" [class]="rowClass()">
                        <span class="sr-only-sap">{{
                            ariaLabel() || 'Avatar group, ' + items().length + ' avatars'
                        }}</span>
                        @for (item of visibleItems(); track item) {
                            <div data-avatar-group-item class="flex" aria-hidden="true">
                                <ng-container [ngTemplateOutlet]="item.templateRef" />
                            </div>
                        }
                        @if (hiddenItems().length) {
                            <div data-avatar-group-overflow class="flex" aria-hidden="true">
                                <ng-container [ngTemplateOutlet]="overflowButtonTemplate" />
                            </div>
                        }
                    </div>
                </fd-popover-control>
                <fd-popover-body
                    ><ng-container
                        [ngTemplateOutlet]="overflowBodyTemplate"
                        [ngTemplateOutletContext]="{ $implicit: items() }"
                /></fd-popover-body>
            </fd-popover>
        }

        <ng-template #overflowButtonTemplate>
            @if (customButton(); as custom) {
                <ng-container
                    [ngTemplateOutlet]="custom.templateRef"
                    [ngTemplateOutletContext]="{ hiddenItems: hiddenItems() }"
                />
            } @else {
                <span [class]="overflowButtonClass()"
                    ><bdi dir="ltr">+{{ hiddenItems().length }}</bdi></span
                >
            }
        </ng-template>
        <ng-template #overflowBodyTemplate let-list>
            @if (customBody(); as custom) {
                <ng-container
                    [ngTemplateOutlet]="custom.templateRef"
                    [ngTemplateOutletContext]="{ hiddenItems: list }"
                />
            } @else {
                <fd-avatar-group-overflow-list
                    [items]="list"
                    [title]="overflowPopoverTitle()"
                    [headingLevel]="overflowHeadingLevel()"
                />
            }
        </ng-template>
    `
})
export class AvatarGroup {
    readonly type = input<AvatarGroupType>('individual');
    /** Size of the avatars (also sizes the overflow button and spacing). */
    readonly size = input<AvatarSize>('l');
    readonly orientation = input<AvatarGroupOrientation>('horizontal');
    /** Upper limit of visible avatars; the rest go to the overflow popover. */
    readonly maxVisibleItems = input<number | null | undefined>();
    readonly overflowButtonShape = input<'circle' | 'square'>('circle');
    readonly overflowPopoverTitle = input<string | null | undefined>();
    readonly overflowHeadingLevel = input(5);
    readonly placement = input<Placement | undefined>(undefined);
    readonly ariaLabel = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly visibleCountChange = output<number>();

    protected readonly focusRing = FOCUS_RING;
    readonly items = contentChildren(AvatarGroupItem);
    protected readonly customButton = contentChild(AvatarGroupOverflowButton);
    protected readonly customBody = contentChild(AvatarGroupOverflowBody);
    private readonly row = viewChild<ElementRef<HTMLElement>>('row');
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    /** Measured widths (including spacing) of avatars and the overflow button. */
    private readonly widths = new Map<AvatarGroupItem | 'overflow', number>();
    private readonly available = signal(Number.POSITIVE_INFINITY);
    /** Bumped after each measurement so the visibility is recomputed with the new widths. */
    private readonly measured = signal(0);

    /** Items in display order: forced ones first, as in the original component. */
    private readonly visibility = computed(() => {
        const items = this.items();
        const max = this.maxVisibleItems();
        const vertical = this.orientation() === 'vertical';
        const available = vertical ? Number.POSITIVE_INFINITY : this.available();
        this.measured();
        const forced = items.filter((item) => item.fdAvatarGroupItemForceVisibility());
        const regular = items.filter((item) => !item.fdAvatarGroupItemForceVisibility());
        const width = (item: AvatarGroupItem) => this.widths.get(item) ?? this.averageWidth();
        let used = forced.reduce((sum, item) => sum + width(item), 0);
        const slots = max != null ? Math.max(0, max - forced.length) : Number.POSITIVE_INFINITY;
        const visible: AvatarGroupItem[] = [];
        for (const item of regular) {
            if (visible.length >= slots || used + width(item) > available) break;
            used += width(item);
            visible.push(item);
        }
        let hidden = regular.slice(visible.length);
        // make room for the overflow button
        if (hidden.length && visible.length) {
            const overflow = this.widths.get('overflow') ?? this.averageWidth();
            while (
                visible.length &&
                (max != null ? visible.length + forced.length >= max : used + overflow > available)
            ) {
                const moved = visible.pop()!;
                used -= width(moved);
                hidden = [moved, ...hidden];
                if (max != null) break;
            }
        }
        return { visible: [...forced, ...visible], hidden };
    });
    readonly visibleItems = computed(() => this.visibility().visible);
    readonly hiddenItems = computed(() => this.visibility().hidden);

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const observer = new ResizeObserver(() => this.measure());
            observer.observe(this.host);
            destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    private averageWidth(): number {
        const known = [...this.widths.entries()].filter(([key]) => key !== 'overflow').map(([, width]) => width);
        return known.length ? known.reduce((a, b) => a + b, 0) / known.length : 0;
    }

    /** Remembers the widths of the rendered avatars and recomputes the visible ones. */
    private measure(): void {
        const row = this.row()?.nativeElement;
        if (!row) return;
        const style = getComputedStyle(row);
        const gap = parseFloat(style.columnGap) || 0;
        const visible = this.visibleItems();
        row.querySelectorAll<HTMLElement>(':scope > [data-avatar-group-item]').forEach((el, index) => {
            const margin = parseFloat(getComputedStyle(el).marginInlineStart) || 0;
            if (visible[index]) this.widths.set(visible[index], el.getBoundingClientRect().width + gap + margin);
        });
        const overflow = row.querySelector<HTMLElement>(':scope > [data-avatar-group-overflow]');
        if (overflow) this.widths.set('overflow', overflow.getBoundingClientRect().width + gap);
        this.available.set(this.host.clientWidth);
        this.measured.update((n) => n + 1);
        this.visibleCountChange.emit(this.visibleItems().length);
    }

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex max-w-full p-0',
            this.orientation() === 'vertical' && 'h-full flex-col',
            this.userClass()
        )
    );

    protected readonly rowClass = computed(() => {
        const vertical = this.orientation() === 'vertical';
        const group = this.type() === 'group';
        return cn(
            'm-0 flex min-w-0 p-0',
            GAP[this.size()],
            vertical && 'flex-col',
            group
                ? [
                      FOCUS_RING,
                      'cursor-pointer rounded-none [&_fd-avatar]:pointer-events-none',
                      vertical
                          ? '[&>[data-avatar-group-item]~*]:mt-(--ag-overlap)'
                          : '[&>[data-avatar-group-item]~*]:ms-(--ag-overlap)',
                      'enabled-hover:[&_fd-avatar]:[--av-bg:var(--sapAvatar_6_Hover_Background)] enabled-hover:[&_fd-avatar]:[--av-border:var(--sapAvatar_Hover_BorderColor)]',
                      'active:[&_fd-avatar]:[--av-bg:var(--sapButton_Active_Background)] active:[&_fd-avatar]:[--av-border:var(--sapButton_Active_BorderColor)] active:[&_fd-avatar]:[--av-color:var(--sapButton_Active_TextColor)]'
                  ]
                : 'gap-(--ag-gap)'
        );
    });

    protected readonly overflowButtonClass = computed(() =>
        cn(
            'box-border inline-flex shrink-0 cursor-pointer items-center justify-center font-sap-font-family font-bold',
            'border-(length:--av-ob-w) border-solid border-sap-avatar-1-border-color bg-sap-avatar-1-background text-sap-avatar-1-text-color',
            '[--av-ob-w:0.0625rem] hc:[--av-ob-w:0.125rem] enabled-hover:bg-sap-avatar-1-hover-background',
            OVERFLOW_SIZE[this.size()],
            this.overflowButtonShape() === 'circle' ? 'rounded-full' : 'rounded-sap-element-border-corner-radius'
        )
    );
}
