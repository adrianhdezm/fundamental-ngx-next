/*
 * Port of @fundamental-ngx/core (pagination) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    type TemplateRef,
    afterNextRender,
    booleanAttribute,
    computed,
    inject,
    Injector,
    input,
    model,
    numberAttribute,
    output,
    signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';
import { fieldBase } from '@/ui/input/input';
import { Select, SelectOption } from '@/ui/select/select';

/** The ellipsis between page numbers. */
const MORE = -1;
/** Pages kept at each end and on each side of the current page. */
const CORNER_PAGES = 1;
const SIDE_PAGES = 2;
/** Items per page when `itemsPerPage` is not a number. */
const DEFAULT_ITEMS_PER_PAGE = 10;

/** Items per page as upstream coerces them: a number, rounded down, at least 1, or 10 when not a number. */
function normalisePageSize(value: unknown): number {
    const size = typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
    return Math.max(1, Math.floor(Number.isFinite(size) ? size : DEFAULT_ITEMS_PER_PAGE));
}

/** The pages to show: all of them, or the ends and the neighbours of the current page with ellipses. */
export function paginationPages(totalPages: number, currentPage: number): number[] {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const shown = CORNER_PAGES * 2 + SIDE_PAGES * 2 + 1 + 2;
    if (pages.length <= shown) return pages;
    const gap = Math.round(shown / 2);
    if (currentPage - 1 < gap) return [...pages.slice(0, shown - 2), MORE, ...pages.slice(totalPages - CORNER_PAGES)];
    if (totalPages - currentPage < gap)
        return [...pages.slice(0, CORNER_PAGES), MORE, ...pages.slice(totalPages - shown + 2)];
    return [
        ...pages.slice(0, CORNER_PAGES),
        MORE,
        ...pages.slice(currentPage - SIDE_PAGES - 1, currentPage + SIDE_PAGES),
        MORE,
        ...pages.slice(totalPages - CORNER_PAGES)
    ];
}

/** What a pagination shows: the range of items on the current page. */
export interface PaginationShowing {
    from: number;
    to: number;
    totalCount: number;
}

let nextId = 0;

/**
 * Pagination: previous and next buttons, page numbers with ellipses (or, with more than nine
 * pages, an input for the current page), an optional items per page select and the number of
 * results. The arrow keys move between the controls, which form one tab stop. In mobile mode (and
 * on screens up to 1023px) it shows first, previous, the page input, next and last.
 *
 * ```html
 * <fd-pagination [totalItems]="500" [(currentPage)]="page" [itemsPerPageOptions]="[10, 20, 50]" />
 * ```
 */
@Component({
    selector: 'fd-pagination',
    exportAs: 'fdPagination',
    imports: [NgTemplateOutlet, Button, Select, SelectOption],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `
        @if (totalItems() > 0) {
            @if (itemsPerPageTemplate() || itemsPerPageOptions().length) {
                <div class="flex shrink-0 items-center gap-2">
                    <ng-container
                        [ngTemplateOutlet]="itemsPerPageTemplate() ?? perPageTpl"
                        [ngTemplateOutletContext]="{ onSelect: onPerPage, pageOptions: pageSizeOptions() }"
                    />
                </div>
            }
            @if (totalPages() > 1) {
                <nav
                    [class]="navClass()"
                    [attr.aria-label]="ariaLabel()"
                    [attr.aria-describedby]="displayTotalItems() ? id + '-total' : null"
                    (keydown)="onNavKeydown($event)"
                    (focusin)="onFocusin($event)"
                >
                    @if (compact()) {
                        <button
                            fdButton
                            variant="transparent"
                            glyph="media-rewind"
                            data-pg-item
                            [tabindex]="tab('first')"
                            data-key="first"
                            [disabled]="isFirst()"
                            [ariaLabel]="firstLabel()"
                            [attr.title]="firstLabel()"
                            [class]="iconButtonClass"
                            (click)="goToPage(1)"
                        ></button>
                    }
                    <button
                        fdButton
                        variant="transparent"
                        glyph="navigation-left-arrow"
                        data-pg-item
                        [tabindex]="tab('previous')"
                        data-key="previous"
                        [disabled]="isFirst()"
                        [ariaLabel]="previousLabel()"
                        [attr.title]="previousLabel()"
                        [class]="iconButtonClass"
                        (click)="goToPage(page() - 1)"
                    ></button>
                    @if (!compact()) {
                        @for (page of pagesBefore(); track $index) {
                            <ng-container
                                [ngTemplateOutlet]="pageTpl"
                                [ngTemplateOutletContext]="{ $implicit: page }"
                            />
                        }
                    }
                    @if (short() && !compact()) {
                        <button
                            fdButton
                            variant="transparent"
                            data-pg-item
                            [tabindex]="tab('current')"
                            data-key="current"
                            aria-current="page"
                            [ariaLabel]="pageText(page())"
                            [class]="currentClass"
                        >
                            {{ page() }}
                        </button>
                    } @else {
                        <span [id]="id + '-page-label'" [class]="labelClass">{{ pageInputLabel() }}</span>
                        <input
                            #pageInput
                            type="number"
                            inputmode="numeric"
                            data-pg-item
                            data-key="current"
                            min="1"
                            required
                            [attr.tabindex]="tab('current')"
                            [max]="totalPages()"
                            [value]="page()"
                            [attr.aria-labelledby]="id + '-page-label ' + id + '-page-of'"
                            [attr.aria-invalid]="inputInvalid() || null"
                            [class]="inputClass()"
                            (input)="inputInvalid.set(!isValidPage(pageInput.value))"
                            (keydown.enter)="goToPage(+pageInput.value, true); pageInput.value = '' + page()"
                            (blur)="pageInput.value = '' + page(); inputInvalid.set(false)"
                        />
                        <span [id]="id + '-page-of'" [class]="labelClass">{{ ofText() }}</span>
                    }
                    @if (!compact()) {
                        @for (page of pagesAfter(); track $index) {
                            <ng-container
                                [ngTemplateOutlet]="pageTpl"
                                [ngTemplateOutletContext]="{ $implicit: page }"
                            />
                        }
                    }
                    <button
                        fdButton
                        variant="transparent"
                        glyph="navigation-right-arrow"
                        data-pg-item
                        [tabindex]="tab('next')"
                        data-key="next"
                        [disabled]="isLast()"
                        [ariaLabel]="nextLabel()"
                        [attr.title]="nextLabel()"
                        [class]="iconButtonClass"
                        (click)="goToPage(page() + 1)"
                    ></button>
                    @if (compact()) {
                        <button
                            fdButton
                            variant="transparent"
                            glyph="media-forward"
                            data-pg-item
                            [tabindex]="tab('last')"
                            data-key="last"
                            [disabled]="isLast()"
                            [ariaLabel]="lastLabel()"
                            [attr.title]="lastLabel()"
                            [class]="iconButtonClass"
                            (click)="goToPage(totalPages())"
                        ></button>
                    }
                </nav>
            }
            @if (displayTotalItems() && !compact()) {
                <span
                    [id]="id + '-total'"
                    class="shrink-0 font-sap-font-family text-sap-font-size text-sap-content-label-color"
                >
                    <ng-container
                        [ngTemplateOutlet]="displayTextTemplate() ?? totalTpl"
                        [ngTemplateOutletContext]="{ showing: showing() }"
                    />
                </span>
            }
        }

        <ng-template #pageTpl let-page>
            @if (page === more) {
                <span
                    aria-hidden="true"
                    class="block w-6 text-center font-sap-font-family text-sap-font-size text-sap-text-color"
                    >...</span
                >
            } @else {
                <button
                    fdButton
                    variant="transparent"
                    data-pg-item
                    [attr.data-key]="'page-' + page"
                    [tabindex]="tab('page-' + page)"
                    [ariaLabel]="pageText(page)"
                    [attr.title]="pageText(page)"
                    [class]="pageButtonClass"
                    (click)="goToPage(page, true)"
                >
                    {{ page }}
                </button>
            }
        </ng-template>
        <ng-template #totalTpl let-showing="showing">{{ totalText(showing) }}</ng-template>
        <ng-template #perPageTpl let-options="pageOptions">
            @if (!compact()) {
                <span
                    [id]="id + '-per-page'"
                    class="shrink-0 font-sap-font-family text-sap-font-size text-sap-content-label-color"
                    >{{ itemsPerPageLabel() }}</span
                >
            }
            <fd-select
                [ariaLabelledBy]="compact() ? null : id + '-per-page'"
                [ariaLabel]="compact() ? itemsPerPageLabel() : null"
                [value]="pageSize()"
                (valueChange)="onPerPage($any($event))"
            >
                @for (option of options; track option) {
                    <li fd-option [value]="option">{{ option }}</li>
                }
            </fd-select>
        </ng-template>
    `
})
export class Pagination {
    readonly totalItems = input(0, { transform: numberAttribute });
    /** The current page (from 1); two-way bindable. */
    readonly currentPage = model(1);
    /** Items per page; two-way bindable. Rounded down and at least 1; 10 when it is not a number. */
    readonly itemsPerPage = model(DEFAULT_ITEMS_PER_PAGE);
    /** Choices of a select for the items per page. */
    readonly itemsPerPageOptions = input<number[]>([]);
    /** Template of the items per page control; context: `onSelect(size)` and `pageOptions`. */
    readonly itemsPerPageTemplate = input<TemplateRef<{
        onSelect: (size: number) => void;
        pageOptions: number[];
    }> | null>();
    readonly displayTotalItems = input(true, { transform: booleanAttribute });
    /** Template of the results text; context: `showing` ({ from, to, totalCount }). */
    readonly displayTextTemplate = input<TemplateRef<{ showing: PaginationShowing }> | null>();
    /** The compact mobile layout; also used on screens up to 1023px. */
    readonly mobile = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input('Pagination');
    readonly firstLabel = input('First page');
    readonly previousLabel = input('Previous page');
    readonly nextLabel = input('Next page');
    readonly lastLabel = input('Last page');
    /** `{page}` is replaced. */
    readonly pageLabel = input('Page {page}');
    readonly pageInputLabel = input('Page:');
    /** `{total}` is replaced. */
    readonly ofLabel = input('of {total}');
    readonly itemsPerPageLabel = input('Results per page:');
    /** `{from}`, `{to}` and `{total}` are replaced. */
    readonly totalResultsLabel = input('{total} Results');
    /** Announced after a page change; `{page}` and `{total}` are replaced. */
    readonly pageAnnouncement = input('Page {page} of {total}');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    /** Emits the page that is requested; the page changes when `currentPage` is updated (two-way binding does). */
    readonly pageChangeStart = output<number>();

    protected readonly more = MORE;
    protected readonly id = `fd-pagination-${nextId++}`;
    private readonly announcer = inject(LiveAnnouncer);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly injector = inject(Injector);
    private readonly narrow = toSignal(
        inject(BreakpointObserver)
            .observe('(max-width: 1023px)')
            .pipe(map((state) => state.matches)),
        { initialValue: false }
    );

    protected readonly inputInvalid = signal(false);
    /** The control that is the tab stop. */
    private readonly tabStop = signal<string | null>(null);

    /** `itemsPerPage`, normalised. */
    protected readonly pageSize = computed(() => normalisePageSize(this.itemsPerPage()));
    protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));
    protected readonly page = computed(() =>
        Math.min(Math.max(1, Math.floor(this.currentPage()) || 1), this.totalPages())
    );
    protected readonly compact = computed(() => this.mobile() || this.narrow());
    protected readonly short = computed(() => this.totalPages() <= 9);
    private readonly pages = computed(() => paginationPages(this.totalPages(), this.page()));
    protected readonly pagesBefore = computed(() => this.pages().slice(0, this.pages().indexOf(this.page())));
    protected readonly pagesAfter = computed(() => this.pages().slice(this.pages().indexOf(this.page()) + 1));
    protected readonly isFirst = computed(() => this.page() <= 1);
    protected readonly isLast = computed(() => this.page() >= this.totalPages());
    protected readonly pageSizeOptions = computed(() => {
        const options = [
            ...new Set(
                this.itemsPerPageOptions()
                    .map((v) => Math.floor(v))
                    .filter((v) => v > 0)
            )
        ];
        if (!options.includes(this.pageSize())) options.push(this.pageSize());
        return options.sort((a, b) => a - b);
    });
    readonly showing = computed<PaginationShowing>(() => {
        const size = this.pageSize();
        return {
            from: Math.min((this.page() - 1) * size + 1, this.totalItems()),
            to: Math.min(this.page() * size, this.totalItems()),
            totalCount: this.totalItems()
        };
    });
    protected readonly ofText = computed(() => this.ofLabel().replace('{total}', `${this.totalPages()}`));

    /** Requests a page; out of range pages are ignored. */
    goToPage(page: number, keepFocus = false): void {
        if (!this.isValidPage(`${page}`) || page === this.page()) return;
        this.currentPage.set(page);
        this.pageChangeStart.emit(page);
        this.announcer.announce(
            this.pageAnnouncement().replace('{page}', `${page}`).replace('{total}', `${this.totalPages()}`)
        );
        this.tabStop.set('current');
        if (keepFocus) afterNextRender(() => this.focusKey('current'), { injector: this.injector });
    }

    protected isValidPage(value: string): boolean {
        const page = Number(value);
        return Number.isInteger(page) && page >= 1 && page <= this.totalPages();
    }

    protected readonly onPerPage = (size: number): void => {
        if (!size || size === this.pageSize()) return;
        this.itemsPerPage.set(size);
        const last = Math.max(1, Math.ceil(this.totalItems() / size));
        if (this.currentPage() > last) {
            this.currentPage.set(last);
            this.pageChangeStart.emit(last);
        }
    };

    protected pageText(page: number): string {
        return this.pageLabel().replace('{page}', `${page}`);
    }

    protected totalText(showing: PaginationShowing): string {
        return this.totalResultsLabel()
            .replace('{from}', `${showing.from}`)
            .replace('{to}', `${showing.to}`)
            .replace('{total}', `${showing.totalCount}`);
    }

    /** The tab index of a control: 0 for the tab stop (the current page by default). */
    protected tab(key: string): number {
        return (this.tabStop() ?? 'current') === key ? 0 : -1;
    }

    protected onFocusin(event: FocusEvent): void {
        const key = (event.target as HTMLElement).closest<HTMLElement>('[data-pg-item]')?.dataset['key'];
        if (key) this.tabStop.set(key);
    }

    /** Left and Right (and Home and End) move between the controls. */
    protected onNavKeydown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' && (event.key === 'Home' || event.key === 'End')) return;
        const items = this.items();
        const index = items.findIndex((el) => el === target || el.contains(target));
        if (index < 0) return;
        const rtl = getComputedStyle(this.host).direction === 'rtl';
        let next = -1;
        if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next = Math.min(index + 1, items.length - 1);
        else if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) next = Math.max(index - 1, 0);
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = items.length - 1;
        else return;
        event.preventDefault();
        items[next]?.focus();
    }

    private items(): HTMLElement[] {
        return [...this.host.querySelectorAll<HTMLElement>('[data-pg-item]')].filter(
            (el) => !(el as HTMLButtonElement).disabled
        );
    }

    private focusKey(key: string): void {
        this.host.querySelector<HTMLElement>(`[data-pg-item][data-key="${key}"]`)?.focus();
    }

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex h-11 w-full items-center justify-between gap-4 px-4 py-0 font-sap-font-family',
            this.userClass()
        )
    );

    protected readonly navClass = computed(() =>
        cn('mx-auto flex items-center justify-center gap-1', this.compact() && 'me-0')
    );

    protected readonly iconButtonClass = 'rtl:[&_fd-icon]:rotate-180';
    protected readonly pageButtonClass = 'min-w-9 px-2 compact:min-w-8';
    /** The current page in short paginations looks pressed. */
    protected readonly currentClass =
        'min-w-9 px-2 compact:min-w-8 bg-sap-button-lite-active-background border-sap-button-lite-active-border-color text-sap-button-active-text-color';
    protected readonly labelClass = 'shrink-0 font-sap-font-family text-sap-font-size text-sap-content-label-color';

    protected readonly inputClass = computed(() =>
        cn(
            fieldBase,
            'w-auto max-w-20 min-w-10 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            this.inputInvalid() && 'border-sap-field-invalid-color'
        )
    );
}
