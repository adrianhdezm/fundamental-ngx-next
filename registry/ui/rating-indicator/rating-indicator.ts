/*
 * Port of @fundamental-ngx/core (rating-indicator) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Directionality } from '@angular/cdk/bidi';
import {
    ChangeDetectionStrategy,
    Component,
    booleanAttribute,
    computed,
    forwardRef,
    inject,
    input,
    linkedSignal,
    model,
    output
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';
import { NgTemplateOutlet } from '@angular/common';
import { Icon } from '@/ui/icon/icon';
import { Link } from '@/ui/link/link';
import { Popover, PopoverBody, PopoverControl } from '@/ui/popover/popover';

export type RatingIndicatorSize = 'xs' | 'sm' | 'md' | 'lg';

/** Size of the icons, the gap between them and, in display mode, of unselected icons. */
const SIZES: Record<RatingIndicatorSize, string> = {
    xs: '[--ri-size:0.75rem] [--ri-gap:0.0625rem] [--ri-small:0.5625rem] [--ri-small-gap:0.0938rem]',
    sm: '[--ri-size:1.375rem] [--ri-gap:0.1875rem] [--ri-small:1.0313rem] [--ri-small-gap:0.1719rem]',
    md: '[--ri-size:1.5rem] [--ri-gap:0.1875rem] [--ri-small:1.125rem] [--ri-small-gap:0.1875rem]',
    lg: '[--ri-size:2rem] [--ri-gap:0.25rem] [--ri-small:1.5rem] [--ri-small-gap:0.25rem]'
};

interface Star {
    index: number;
    /** Whether the first and the second half are rated. */
    first: boolean;
    second: boolean;
}

/**
 * Rating indicator: shows a rating as stars (or custom icons) and, unless read-only, lets the user
 * rate. It is a slider: Left/Down and Right/Up change the rating by one (a half with
 * `allowHalves`), Home and End go to 0 and the maximum and digits set it; a click on the first
 * half of a star rates a half. With `ratings` it shows the number of votes and, with
 * `displayAllRatings`, the votes per rating in a popover.
 *
 * ```html
 * <fd-rating-indicator ariaLabel="Product rating" [(value)]="rating" />
 * <fd-rating-indicator displayMode size="sm" [value]="3.5" allowHalves />
 * ```
 */
@Component({
    selector: 'fd-rating-indicator',
    exportAs: 'fdRatingIndicator',
    imports: [NgTemplateOutlet, Icon, Link, Popover, PopoverControl, PopoverBody],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RatingIndicator), multi: true }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        // the dimmed text belongs to the disabled control
        '[attr.aria-disabled]': 'disabledState() || null'
    },
    template: `
        <div
            role="slider"
            [attr.tabindex]="disabledState() ? -1 : 0"
            [attr.aria-label]="ariaLabel() || null"
            [attr.aria-labelledby]="ariaLabelledBy() || null"
            [attr.aria-roledescription]="ariaRoledescription()"
            aria-valuemin="0"
            [attr.aria-valuemax]="indicatorCapacity()"
            [attr.aria-valuenow]="current()"
            [attr.aria-valuetext]="valueText()"
            [attr.aria-readonly]="readonlyState() || null"
            [attr.aria-disabled]="disabledState() || null"
            [class]="containerClass()"
            (keydown)="onKeydown($event)"
            (blur)="onTouched()"
        >
            <ng-container *ngTemplateOutlet="starsTpl; context: { $implicit: stars(), interactive: interactive() }" />
        </div>
        @if (showDynamicText() && !hideDynamicText()) {
            @if (displayAllRatings() && ratingItems().length) {
                <fd-popover
                    placement="top"
                    [noArrow]="false"
                    [bodyAriaLabel]="totalRatingsLabel()"
                    [triggers]="['mouseenter', 'mouseleave', 'focusin', 'focusout']"
                >
                    <fd-popover-control>
                        <span [class]="dynamicTextClass"
                            >(<a
                                fdLink
                                href="#"
                                [attr.aria-label]="totalRatingsLabel() + ' ' + votes()"
                                (click)="$event.preventDefault()"
                                >{{ votes() }}</a
                            >)</span
                        >
                    </fd-popover-control>
                    <fd-popover-body>
                        <ul [class]="popoverListClass()" [attr.aria-label]="totalRatingsLabel()">
                            @for (item of ratingItems(); track item.rate) {
                                <li
                                    class="flex items-center gap-2 px-4 py-2 font-sap-font-family text-sap-font-small-size text-sap-content-label-color"
                                >
                                    <span class="sr-only-sap"
                                        >{{ item.rate }} {{ dynamicTextIndicator() }} {{ indicatorCapacity() }}:</span
                                    >
                                    <span class="inline-flex" aria-hidden="true">
                                        <ng-container
                                            *ngTemplateOutlet="
                                                starsTpl;
                                                context: { $implicit: starsFor(item.rate), interactive: false }
                                            "
                                        />
                                    </span>
                                    ({{ item.votes }})
                                </li>
                            }
                        </ul>
                    </fd-popover-body>
                </fd-popover>
            } @else {
                <span [class]="dynamicTextClass">{{ dynamicText() }}</span>
            }
        }

        <ng-template #starsTpl let-stars let-interactive="interactive">
            <ul [class]="listClass" aria-hidden="true">
                @for (star of stars; track star.index) {
                    <li
                        [class]="itemClass()"
                        [attr.data-small]="displayMode() && !star.first && !star.second ? '' : null"
                        (click)="interactive && onStarClick($event, star.index)"
                    >
                        <fd-icon
                            [glyph]="star.first ? ratedGlyph() : unratedGlyph()"
                            [class]="halfClass(star.first, true)"
                        />
                        <fd-icon
                            [glyph]="star.second ? ratedGlyph() : unratedGlyph()"
                            [class]="halfClass(star.second, false)"
                        />
                    </li>
                }
            </ul>
        </ng-template>
    `
})
export class RatingIndicator implements ControlValueAccessor {
    /** The rating; two-way bindable. Without a value, the average of `ratings` (or `ratingAverage`) shows. */
    readonly value = model<number | null | undefined>();
    readonly indicatorCapacity = input(5, { transform: (v: unknown) => Math.max(1, Math.round(Number(v)) || 5) });
    /** Rates in halves. */
    readonly allowHalves = input(false, { transform: booleanAttribute });
    readonly size = input<RatingIndicatorSize>('md');
    /** Read-only, with smaller unselected icons. */
    readonly displayMode = input(false, { transform: booleanAttribute });
    /** Read-only without the display mode look. */
    readonly nonInteractive = input(false, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    /** Votes per rating, e.g. `{ 1: 3, 5: 12 }`; sets the average and the number of votes. */
    readonly ratings = input<Record<number, number> | null | undefined>();
    readonly ratingAverage = input<number | null | undefined>();
    readonly totalRatings = input<number | null | undefined>();
    /** Shows the votes per rating in a popover from the number of votes. */
    readonly displayAllRatings = input(false, { transform: booleanAttribute });
    readonly showDynamicText = input(true, { transform: booleanAttribute });
    /** The word between the rating and the maximum in "(2 of 5)". */
    readonly dynamicTextIndicator = input('of');
    readonly totalRatingsLabel = input('Total ratings');
    /** Icons of rated and unrated values; stars by default. */
    readonly ratedIcon = input<string | null | undefined>();
    readonly unratedIcon = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly ariaRoledescription = input('Rating Indicator');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly ratingChanged = output<number>();

    private readonly dir = inject(Directionality, { optional: true });
    protected readonly disabledState = linkedSignal(() => this.disabled());
    protected readonly readonlyState = computed(() => this.displayMode() || this.nonInteractive());
    protected readonly interactive = computed(() => !this.readonlyState() && !this.disabledState());

    protected readonly ratingItems = computed(() =>
        Object.entries(this.ratings() ?? {})
            .map(([rate, votes]) => ({ rate: Number(rate), votes: Number(votes) }))
            .filter((r) => r.rate > 0 && !isNaN(r.votes))
            .sort((a, b) => b.rate - a.rate)
    );
    private readonly average = computed(() => {
        const items = this.ratingItems();
        const votes = items.reduce((sum, r) => sum + r.votes, 0);
        if (votes) return items.reduce((sum, r) => sum + r.rate * r.votes, 0) / votes;
        return this.ratingAverage() ?? null;
    });
    protected readonly votes = computed(() => {
        const items = this.ratingItems();
        return items.length ? items.reduce((sum, r) => sum + r.votes, 0) : (this.totalRatings() ?? null);
    });
    /** The shown rating, rounded to a whole (or half) value within the capacity. */
    readonly current = computed(() => this.round(this.value() ?? this.average() ?? 0));
    protected readonly ratedGlyph = computed(() => this.ratedIcon() || 'favorite');
    protected readonly unratedGlyph = computed(
        () => this.unratedIcon() || (this.displayMode() && !this.ratedIcon() ? 'favorite' : 'unfavorite')
    );
    protected readonly stars = computed(() => this.starsFor(this.current()));
    protected readonly valueText = computed(
        () => `${this.current()} ${this.dynamicTextIndicator()} ${this.indicatorCapacity()}`
    );
    protected readonly hideDynamicText = computed(() => !this.current() && this.votes() == null);
    protected readonly dynamicText = computed(() =>
        this.votes() != null ? `(${this.votes()})` : `(${this.valueText()})`
    );

    // ControlValueAccessor
    private onChange: (value: number) => void = () => {};
    protected onTouched: () => void = () => {};

    writeValue(value: number | null | undefined): void {
        this.value.set(value);
    }
    registerOnChange(fn: (value: number) => void): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
    setDisabledState(disabled: boolean): void {
        this.disabledState.set(disabled);
    }

    protected starsFor(value: number): Star[] {
        return Array.from({ length: this.indicatorCapacity() }, (_, index) => ({
            index,
            first: value >= index + 0.5,
            second: value >= index + 1
        }));
    }

    protected onStarClick(event: MouseEvent, index: number): void {
        const item = event.currentTarget as HTMLElement;
        const rect = item.getBoundingClientRect();
        const rtl = this.dir?.value === 'rtl';
        const firstHalf = rtl ? event.clientX > rect.left + rect.width / 2 : event.clientX < rect.left + rect.width / 2;
        this.select(this.allowHalves() && firstHalf ? index + 0.5 : index + 1);
        (item.closest('[role=slider]') as HTMLElement | null)?.focus();
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (!this.interactive()) return;
        const step = this.allowHalves() ? 0.5 : 1;
        const rtl = this.dir?.value === 'rtl';
        const current = this.current();
        let next: number | null = null;
        switch (event.key) {
            case 'ArrowUp':
            case rtl ? 'ArrowLeft' : 'ArrowRight':
                next = current + step;
                break;
            case 'ArrowDown':
            case rtl ? 'ArrowRight' : 'ArrowLeft':
                next = current - step;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = this.indicatorCapacity();
                break;
            default:
                if (/^\d$/.test(event.key)) next = Number(event.key);
        }
        if (next === null) return;
        event.preventDefault();
        this.select(Math.max(0, Math.min(this.indicatorCapacity(), next)));
    }

    private select(value: number): void {
        if (value === this.current() && this.value() != null) return;
        this.value.set(value);
        this.onChange(value);
        this.ratingChanged.emit(value);
    }

    private round(value: number): number {
        if (!value) return 0;
        const whole = Math.floor(value);
        const fraction = value - whole;
        let result = whole;
        if (this.allowHalves() && fraction > 0.25 && fraction <= 0.5) result = whole + 0.5;
        else if (fraction > 0.5) result = whole + 1;
        return Math.min(this.indicatorCapacity(), Math.max(0, result));
    }

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 my-[0.8125rem] inline-flex items-center gap-2 p-0 align-middle',
            SIZES[this.size()] ?? SIZES.md,
            this.interactive() && 'cursor-pointer hover:opacity-90',
            this.disabledState() && 'pointer-events-none opacity-(--sapContent_DisabledOpacity)',
            this.userClass()
        )
    );

    protected readonly containerClass = computed(() =>
        cn(
            'm-0 inline-flex items-center rounded-[0.5rem] p-1 outline-none',
            !this.disabledState() &&
                'focus-visible:outline-(length:--sapContent_FocusWidth) focus-visible:[outline-style:var(--sapContent_FocusStyle)] focus-visible:outline-sap-content-focus-color focus-visible:-outline-offset-2'
        )
    );

    /** The popover renders outside the host, so it needs the size variables itself. */
    protected readonly popoverListClass = computed(() => cn('m-0 list-none px-0 py-2', SIZES[this.size()] ?? SIZES.md));

    protected readonly listClass = 'm-0 inline-flex list-none items-center gap-(--ri-gap) p-0';

    protected readonly itemClass = computed(() =>
        cn(
            'relative m-0 inline-flex size-(--ri-size) items-center justify-center p-0',
            // display mode shows unrated icons smaller
            'data-[small]:mx-(--ri-small-gap) data-[small]:size-(--ri-small)'
        )
    );

    /** One half of an icon, clipped to its side. */
    protected halfClass(rated: boolean, first: boolean): string {
        return cn(
            'absolute start-0 top-0 text-(length:--ri-size) [[data-small]_&]:text-(length:--ri-small)',
            rated ? 'text-sap-content-rated-color' : 'text-sap-content-unrated-color',
            first
                ? '[clip-path:inset(0_48%_0_0)] rtl:[clip-path:inset(0_0_0_48%)]'
                : '[clip-path:inset(0_0_0_50%)] rtl:[clip-path:inset(0_50%_0_0)]'
        );
    }

    protected readonly dynamicTextClass =
        'm-0 truncate p-0 font-sap-font-family text-sap-font-small-size text-sap-content-label-color';
}
