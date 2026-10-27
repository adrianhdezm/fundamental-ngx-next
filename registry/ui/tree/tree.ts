/*
 * Port of @fundamental-ngx/core (tree) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals and Tailwind CSS.
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
    afterRenderEffect,
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
    viewChild,
    type Signal
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { Observable, defer, from, isObservable, of, type Subscription } from 'rxjs';
import { cn, type ClassValue } from '@/lib/utils';
import { Checkbox } from '@/ui/checkbox/checkbox';
import { Icon } from '@/ui/icon/icon';
import { RadioButton } from '@/ui/radio/radio';
import { Skeleton } from '@/ui/skeleton/skeleton';

export type TreeItemState = 'default' | 'error' | 'success' | 'warning';
export type TreeSelectionType = 'none' | 'single' | 'multiple';
export type TreeSelectionPlacement = 'left' | 'right' | 'none' | 'afterExpand';

/** A lazily loaded list of tree items, e.g. the children of an item fetched on expansion. */
export abstract class TreeDataSource<T> {
    abstract fetch(): Observable<T[]> | Promise<T[]> | T[];
    /** Number of items, to know before fetching whether an item can be expanded. */
    getTotalItems?(): Observable<number> | Promise<number> | number;
}

export type TreeAcceptableDataSource<T = unknown> = T[] | Observable<T[]> | TreeDataSource<T> | null | undefined;

/** A tree item as data: what the `*fdTreeItemDef` template gets. */
export interface TreeItemData<T = unknown> {
    id: string;
    data: T;
    children?: TreeAcceptableDataSource<Partial<TreeItemData<T>>>;
    expanded?: boolean;
    navigatable?: boolean;
    state?: TreeItemState;
    level: number;
    parentId: string | null;
}

export interface TreeItemDefContext<T = unknown> {
    $implicit: TreeItemData<T>;
}

let nextId = 0;

/** Normalizes data items: ids, levels and parents. */
export function normalizeTreeItems<T>(
    items: readonly Partial<TreeItemData<T>>[] | null | undefined,
    parentId: string | null = null,
    level = 1
): TreeItemData<T>[] {
    return (items ?? []).map((item) => ({
        ...item,
        data: item.data as T,
        id: item.id || `fd-tree-item-${nextId++}`,
        level,
        parentId
    }));
}

/** Loads a data source of any accepted kind. */
function load<T>(source: TreeAcceptableDataSource<T>): Observable<T[]> {
    if (!source) return of([]);
    if (Array.isArray(source)) return of(source);
    if (isObservable(source)) return source;
    return defer(() => {
        const result = source.fetch();
        return Array.isArray(result) ? of(result) : from(result);
    });
}

/** The number of items of a data source, or null while it is not known. */
function total<T>(source: TreeAcceptableDataSource<T>): Observable<number> | null {
    if (!source) return of(0);
    if (Array.isArray(source)) return of(source.length);
    if (isObservable(source)) return new Observable((s) => source.subscribe({ next: (v) => s.next(v.length) }));
    const count = source.getTotalItems?.();
    if (count === undefined) return null;
    return typeof count === 'number' ? of(count) : from(count);
}

/** The template of a data tree's items: `<fd-tree-item *fdTreeItemDef="let item">`. */
@Directive({ selector: '[fdTreeItemDef]' })
export class TreeItemDef<T = unknown> {
    readonly templateRef = inject<TemplateRef<TreeItemDefContext<T>>>(TemplateRef);
    /** Types the item of the template, e.g. `*fdTreeItemDef="let item; as: model"`. */
    readonly fdTreeItemDefAs = input<T>();
    static ngTemplateContextGuard<T>(_dir: TreeItemDef<T>, ctx: unknown): ctx is TreeItemDefContext<T> {
        return true;
    }
}

/** The icon of a tree item. */
@Directive({
    selector: '[fdTreeItemIcon]',
    host: {
        role: 'presentation',
        'aria-hidden': 'true',
        class: 'flex min-h-(--tree-exp) min-w-(--tree-exp) shrink-0 items-center justify-center text-[1.125rem] text-sap-content-non-interactive-icon-color group-active/row:text-sap-list-active-text-color'
    }
})
export class TreeItemIcon {}

/** The text of a tree item. */
@Directive({
    selector: '[fdTreeItemText]',
    host: {
        class: 'm-0 block w-full min-w-0 truncate p-0 text-(length:--tree-font) leading-(--tree-h) text-sap-list-text-color group-active/row:text-sap-list-active-text-color group-data-[wrap]/row:leading-[1.4] group-data-[wrap]/row:whitespace-normal'
    }
})
export class TreeItemText {}

/** An action button at the end of a tree item. */
@Directive({
    selector: '[fdTreeItemButton]',
    host: { class: 'ms-(--fdList_Button_Spacing,0.125rem) shrink-0' }
})
export class TreeItemButton {}

/** Indentation per level by the deepest expanded level, as in fundamental-styles. */
function levelIndent(level: number, expandedLevel: number): number {
    if (level <= 1 || expandedLevel < 1) return 0;
    if (expandedLevel >= 6) return (level - 1) * 0.25;
    if (expandedLevel === 1) return level === 2 ? 1.5 : 0;
    if (expandedLevel === 2) return level === 2 ? 1 : level === 3 ? 2.5 : 0;
    return level <= 6 ? (level - 1) * 0.5 : 0;
}

const HIGHLIGHT: Record<TreeItemState, string> = {
    default:
        'shadow-[inset_0.375rem_0_0_0_var(--sapInformationBorderColor)] rtl:shadow-[inset_-0.375rem_0_0_0_var(--sapInformationBorderColor)]',
    error: 'shadow-[inset_0.375rem_0_0_0_var(--sapErrorBorderColor)] rtl:shadow-[inset_-0.375rem_0_0_0_var(--sapErrorBorderColor)]',
    warning:
        'shadow-[inset_0.375rem_0_0_0_var(--sapWarningBorderColor)] rtl:shadow-[inset_-0.375rem_0_0_0_var(--sapWarningBorderColor)]',
    success:
        'shadow-[inset_0.375rem_0_0_0_var(--sapSuccessBorderColor)] rtl:shadow-[inset_-0.375rem_0_0_0_var(--sapSuccessBorderColor)]'
};

/** Late reference to Tree for the item declared before it. */
function forwardTree(): typeof Tree {
    return Tree;
}

/**
 * A tree item: a row with an expander, an icon, a text and buttons, and its children, either
 * nested `fd-tree-item` elements or the `childNodes` of a data tree, loaded when it expands.
 */
@Component({
    selector: 'fd-tree-item',
    exportAs: 'fdTreeItem',
    imports: [NgTemplateOutlet, FormsModule, Icon, Skeleton, Checkbox, RadioButton],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { role: 'none', class: 'block' },
    template: `
        <div
            #row
            role="treeitem"
            [attr.id]="id()"
            [attr.tabindex]="tree?.tabbableItem() === self ? 0 : -1"
            [attr.aria-label]="ariaLabel() || null"
            [attr.aria-level]="level()"
            [attr.aria-setsize]="setSize()"
            [attr.aria-posinset]="position()"
            [attr.aria-expanded]="expandable() ? expanded() : null"
            [attr.aria-selected]="selectable() ? selected() : null"
            [attr.data-wrap]="wrapContent() || null"
            [class]="rowClass()"
            [style.background-color]="backgroundColor() || null"
            [style]="customStyles() ?? null"
            (click)="onClick($event)"
            (keydown.enter)="onClick($any($event))"
            (keydown.space)="$event.preventDefault(); onClick($any($event))"
            (focus)="tree?.focusedItem.set(self)"
        >
            @if (placement() === 'left') {
                <ng-container [ngTemplateOutlet]="selectionControl" [ngTemplateOutletContext]="{ first: true }" />
            }
            @if (expandable()) {
                <span
                    aria-hidden="true"
                    class="flex min-h-(--tree-exp) min-w-(--tree-exp) shrink-0 cursor-pointer items-center justify-center text-sap-button-icon-color"
                    [style.margin-inline-start]="placement() === 'left' ? null : indent()"
                    (click)="toggle($event)"
                >
                    <fd-icon
                        [glyph]="expanded() ? 'navigation-down-arrow' : 'navigation-right-arrow'"
                        class="text-(length:--tree-exp-icon) text-sap-button-icon-color group-active/row:text-sap-list-active-text-color"
                    />
                </span>
            } @else if (countLoading()) {
                <span
                    aria-hidden="true"
                    class="flex min-h-(--tree-exp) min-w-(--tree-exp) shrink-0 items-center justify-center"
                    [style.margin-inline-start]="indent()"
                >
                    <fd-skeleton type="rectangle" width="1rem" height="1rem" />
                </span>
            }
            @if (placement() === 'afterExpand' && expandable()) {
                <ng-container [ngTemplateOutlet]="selectionControl" [ngTemplateOutletContext]="{ first: false }" />
            }
            <div [class]="contentClass()" [style.margin-inline-start]="contentIndent()">
                <ng-content select="[fdTreeItemIcon]" />
                <ng-content select="[fdTreeItemText]" />
            </div>
            <ng-content select="[fdTreeItemButton]" />
            @if (placement() === 'right') {
                <ng-container [ngTemplateOutlet]="selectionControl" [ngTemplateOutletContext]="{ first: false }" />
            }
            @if (navigatable() && tree?.navigationIndicator()) {
                <fd-icon
                    glyph="slim-arrow-right"
                    class="flex min-h-(--tree-exp) min-w-10 shrink-0 items-center justify-center text-xs text-sap-content-non-interactive-icon-color last:-me-4"
                />
            }
        </div>
        @if (expanded()) {
            <div class="block">
                <ng-content select="fd-tree-item" />
                @if (childrenLoading()) {
                    @for (row of loadingRows; track $index) {
                        <div
                            role="treeitem"
                            [attr.aria-level]="level() + 1"
                            aria-busy="true"
                            [attr.aria-label]="tree?.loadingLabel()"
                            [class]="loadingRowClass()"
                        >
                            <fd-skeleton type="text" width="6.25rem" [textLines]="1" />
                        </div>
                    }
                }
                @if (tree?.itemTemplate(); as template) {
                    @for (child of children(); track child.id) {
                        <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: child }" />
                    }
                }
            </div>
        }

        <ng-template #selectionControl let-first="first">
            <span
                class="flex shrink-0 items-center [&_label]:m-0"
                [style.margin-inline-start]="first && !tree?.independentSections() ? leafIndent() : null"
            >
                @if (tree?.selection() === 'multiple') {
                    <fd-checkbox
                        tabIndexValue="-1"
                        standalone
                        aria-hidden="true"
                        [ngModel]="selected()"
                        [ngModelOptions]="{ standalone: true }"
                    />
                } @else {
                    <fd-radio-button
                        standalone
                        aria-hidden="true"
                        [tabIndex]="-1"
                        [value]="true"
                        [selectedValue]="selected()"
                    />
                }
            </span>
        </ng-template>
    `
})
export class TreeItem<T = unknown> {
    /** The value selected by the item; its id by default. */
    readonly value = input<unknown>();
    readonly id = input(`fd-tree-item-${nextId++}`);
    readonly ariaLabel = input<string | null | undefined>();
    /** Id of the parent item (data trees). */
    readonly parentId = input<string | null | undefined>();
    /** The item navigates somewhere on click: hover and press states, and the navigation indicator. */
    readonly navigatable = input(false, { transform: booleanAttribute });
    /** Highlight indicator at the start of the item. */
    readonly state = input<TreeItemState | null | undefined>();
    /** The children of a data tree item. */
    readonly childNodes = input<TreeAcceptableDataSource<Partial<TreeItemData<T>>>>();
    /** Wraps a long text instead of truncating it. */
    readonly wrapContent = input(false, { transform: booleanAttribute });
    /** Level of the item; nested items count their parents. */
    readonly levelInput = input<number | null | undefined>(undefined, { alias: 'level' });
    readonly expanded = model(false);
    readonly backgroundColor = input<string | null | undefined>();
    readonly customStyles = input<Record<string, string> | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly treeItemClick = output<MouseEvent | KeyboardEvent>();

    protected readonly tree = inject(forwardTree(), { optional: true });
    private readonly parentItem = inject(TreeItem, { optional: true, skipSelf: true });
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly row = viewChild<ElementRef<HTMLElement>>('row');
    private readonly projectedChildren = contentChildren(TreeItem);
    protected readonly self = this as TreeItem;
    protected readonly loadingRows = Array.from({ length: 5 });

    readonly level: Signal<number> = computed(
        () => this.levelInput() ?? (this.parentItem ? this.parentItem.level() + 1 : 1)
    );
    /** Size of the item's set and its position, from the rendered tree. */
    readonly setSize = signal<number | null>(null);
    readonly position = signal<number | null>(null);
    /** Children of a data tree item, loaded on expansion. */
    readonly children = signal<TreeItemData<T>[]>([]);
    protected readonly childrenLoading = signal(false);
    private readonly childCount = signal<number | null>(null);
    protected readonly countLoading = computed(
        () => !!this.childNodes() && this.childCount() === null && !this.childrenLoaded()
    );
    private readonly childrenLoaded = signal(false);

    readonly hasProjectedChildren = computed(() => this.projectedChildren().length > 0);
    /** The item has children to show. */
    readonly expandable = computed(
        () => this.hasProjectedChildren() || (this.childCount() ?? 0) > 0 || this.children().length > 0
    );
    readonly itemValue = computed(() => this.value() ?? this.id());
    protected readonly selectable = computed(() => (this.tree?.selection() ?? 'none') !== 'none');
    readonly selected = computed(() => this.tree?.isSelected(this.itemValue()) ?? false);
    protected readonly placement = computed(() =>
        this.selectable() ? (this.tree?.selectionPlacement() ?? 'none') : 'none'
    );

    /** Start indentation of the item's level. */
    protected readonly indent = computed(() => `${levelIndent(this.level(), this.tree?.expandedLevel() ?? 0)}rem`);
    /** Indentation of an item without expander: its level plus the expander's width. */
    protected readonly leafIndent = computed(() => `calc(${this.indent()} + var(--tree-exp))`);
    protected readonly contentIndent = computed(() => {
        if (this.expandable() || this.countLoading()) return null;
        const placement = this.placement();
        if (placement === 'left' && !this.tree?.independentSections()) return null;
        return this.leafIndent();
    });

    constructor() {
        const destroyRef = inject(DestroyRef);
        let countSub: Subscription | undefined;
        let childSub: Subscription | undefined;
        // the number of children of a data item
        effect(() => {
            const source = this.childNodes();
            untracked(() => {
                countSub?.unsubscribe();
                this.childCount.set(null);
                countSub = total(source)?.subscribe((count) => this.childCount.set(count));
            });
        });
        // load the children of a data item when it expands; drop them when it collapses
        effect(() => {
            const expanded = this.expanded();
            const source = this.childNodes();
            untracked(() => {
                childSub?.unsubscribe();
                if (!expanded || !source) {
                    this.children.set([]);
                    this.childrenLoaded.set(false);
                    this.childrenLoading.set(false);
                    return;
                }
                this.childrenLoading.set(true);
                childSub = load(source).subscribe((items) => {
                    this.children.set(normalizeTreeItems(items, this.id(), this.level() + 1));
                    this.childCount.set(items.length);
                    this.childrenLoaded.set(true);
                    this.childrenLoading.set(false);
                });
            });
        });
        effect(() => {
            const tree = this.tree;
            if (!tree) return;
            tree.reportExpanded(this.self, this.level(), this.expanded() && this.expandable());
        });
        this.tree?.register(this.self);
        destroyRef.onDestroy(() => {
            countSub?.unsubscribe();
            childSub?.unsubscribe();
            this.tree?.unregister(this.self);
        });
    }

    /** The row element, which takes the focus; null before it renders. */
    rowElement(): HTMLElement | null {
        return this.row()?.nativeElement ?? null;
    }

    focus(): void {
        this.rowElement()?.focus();
    }

    toggle(event?: Event): void {
        event?.stopPropagation();
        this.expanded.set(!this.expanded());
        this.focus();
    }

    protected onClick(event: MouseEvent | KeyboardEvent): void {
        event.stopPropagation();
        this.treeItemClick.emit(event);
        if (this.selectable()) this.tree?.toggleSelection(this.itemValue());
    }

    protected readonly rowClass = computed(() => {
        const root = this.level() === 1;
        const selected = this.selectable() && this.selected();
        const interactive = this.navigatable() || this.selectable();
        return cn(
            'group/row relative m-0 box-border flex min-h-(--tree-h) w-full items-center border-0 border-b border-solid p-0 pe-4 outline-none',
            "focus:before:pointer-events-none focus:before:absolute focus:before:inset-0.5 focus:before:bottom-px focus:before:border-(length:--sapContent_FocusWidth) focus:before:[border-style:var(--sapContent_FocusStyle)] focus:before:border-sap-content-focus-color focus:before:content-['']",
            root
                ? [
                      'bg-sap-list-background',
                      this.tree?.noBorder() ? 'border-transparent' : 'border-sap-list-border-color'
                  ]
                : 'border-transparent bg-sap-list-alternating-background',
            selected && 'border-sap-list-selection-border-color bg-sap-list-selection-background-color',
            interactive && [
                'cursor-pointer hover:bg-sap-list-hover-background active:border-sap-list-active-background active:bg-sap-list-active-background',
                selected && 'hover:bg-sap-list-hover-selection-background'
            ],
            this.wrapContent() && 'py-1',
            this.state() && HIGHLIGHT[this.state() as TreeItemState],
            this.userClass()
        );
    });

    protected readonly contentClass = computed(() =>
        cn(
            'm-0 box-border flex min-h-(--tree-h) w-full min-w-0 items-center p-0',
            this.wrapContent() ? 'whitespace-normal' : 'truncate'
        )
    );

    protected readonly loadingRowClass = computed(() =>
        cn(
            'm-0 box-border flex min-h-(--tree-h) w-full items-center border-0 border-b border-solid border-transparent bg-sap-list-alternating-background p-0 pe-4'
        )
    );
}

const ROOT_ROW =
    'm-0 box-border flex min-h-(--tree-h) w-full items-center border-0 border-b border-solid border-sap-list-border-color bg-sap-list-background p-0 pe-4';

/**
 * Tree: a hierarchy of items that expand and collapse. Nest `fd-tree-item` elements, or pass a
 * `dataSource` and an item template (`*fdTreeItemDef`); children of data items can load lazily.
 * Items can be selected (single or multiple, with a form control) and navigatable. The tree is
 * one tab stop: Up and Down move between the items, Right and Left expand, collapse and move
 * between parents and children.
 *
 * ```html
 * <fd-tree ariaLabel="Products">
 *     <fd-tree-item>
 *         <span fdTreeItemText>Laptops</span>
 *         <fd-tree-item><span fdTreeItemText>Notebook Basic</span></fd-tree-item>
 *     </fd-tree-item>
 * </fd-tree>
 * ```
 */
@Component({
    selector: 'fd-tree',
    exportAs: 'fdTree',
    imports: [NgTemplateOutlet, Skeleton],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Tree), multi: true }],
    host: {
        role: 'tree',
        '[attr.aria-label]': 'ariaLabel() || null',
        '[attr.aria-multiselectable]': 'selection() === "multiple" || null',
        '[class]': 'computedClass()',
        '(keydown)': 'onKeydown($event)'
    },
    template: `
        @if (itemTemplate(); as template) {
            @if (!loaded()) {
                @for (row of loadingRows; track $index) {
                    <div
                        role="treeitem"
                        aria-level="1"
                        aria-busy="true"
                        [attr.aria-label]="loadingLabel()"
                        class="${ROOT_ROW}"
                    >
                        <fd-skeleton type="text" width="6.25rem" [textLines]="1" class="ms-4" />
                    </div>
                }
            } @else if (items().length) {
                @for (item of items(); track item.id) {
                    <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }" />
                }
            } @else {
                <div role="treeitem" aria-level="1" class="${ROOT_ROW} justify-center">
                    <span class="text-(length:--tree-font) text-sap-list-text-color">{{ noDataText() }}</span>
                </div>
            }
        } @else {
            <ng-content />
        }
    `
})
export class Tree<T = unknown> implements ControlValueAccessor {
    readonly dataSource = input<TreeAcceptableDataSource<Partial<TreeItemData<T>>>>();
    readonly ariaLabel = input<string | null | undefined>();
    /** Removes the borders between the top level items. */
    readonly noBorder = input(false, { transform: booleanAttribute });
    readonly selection = input<TreeSelectionType>('none');
    /** Where the checkbox or radio button of a selectable item goes. */
    readonly selectionPlacement = input<TreeSelectionPlacement>('none');
    /** Puts the selection controls of a left placement in one column. */
    readonly independentSections = input(false, { transform: booleanAttribute });
    /** Shows an arrow at the end of navigatable items. */
    readonly navigationIndicator = input(false, { transform: booleanAttribute });
    readonly noDataText = input('No data');
    /** Name of the placeholder rows while items load. */
    readonly loadingLabel = input('Loading');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly dataRequested = output<boolean>();
    readonly dataReceived = output<boolean>();
    /** The selected value: one value, or an array with multiple selection. */
    readonly selectedChange = output<unknown>();

    private readonly itemDef = contentChild(TreeItemDef);
    readonly itemTemplate = computed(() => this.itemDef()?.templateRef ?? null);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly loadingRows = Array.from({ length: 5 });

    protected readonly items = signal<TreeItemData<T>[]>([]);
    protected readonly loaded = signal(false);
    private readonly selectedValues = signal<unknown[]>([]);
    private readonly registered = signal<ReadonlySet<TreeItem>>(new Set());
    private readonly expandedByLevel = signal<ReadonlyMap<TreeItem, number>>(new Map());
    /** The item that has (or last had) the focus. */
    readonly focusedItem = signal<TreeItem | null>(null);
    /** Version of the rendered rows, bumped when items come and go. */
    private readonly rows = signal(0);

    /** The deepest level up to which every level has an expanded item; it sets the indentation. */
    readonly expandedLevel = computed(() => {
        const levels = new Set(this.expandedByLevel().values());
        let level = 0;
        while (levels.has(level + 1)) level++;
        return level;
    });

    /** The first rendered item, known after rendering. */
    private readonly firstItem = signal<TreeItem | null>(null);
    /** The item in the tab order: the focused or the first one. */
    readonly tabbableItem = computed(() => {
        const focused = this.focusedItem();
        if (focused && this.registered().has(focused)) return focused;
        return this.firstItem();
    });

    private onChange: (value: unknown) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        const destroyRef = inject(DestroyRef);
        let sub: Subscription | undefined;
        effect(() => {
            const source = this.dataSource();
            untracked(() => {
                sub?.unsubscribe();
                if (source === undefined) return;
                this.loaded.set(false);
                this.dataRequested.emit(true);
                sub = load(source).subscribe((items) => {
                    this.items.set(normalizeTreeItems(items));
                    this.loaded.set(true);
                    this.dataReceived.emit(true);
                });
            });
        });
        destroyRef.onDestroy(() => sub?.unsubscribe());
        // the set sizes and positions of the rendered rows
        afterRenderEffect(() => {
            this.rows();
            this.expandedByLevel();
            untracked(() => this.updatePositions());
        });
    }

    register(item: TreeItem): void {
        this.registered.update((items) => new Set(items).add(item));
        this.rows.update((v) => v + 1);
    }

    unregister(item: TreeItem): void {
        this.registered.update((items) => {
            const next = new Set(items);
            next.delete(item);
            return next;
        });
        this.reportExpanded(item, 0, false);
        if (this.focusedItem() === item) this.focusedItem.set(null);
        this.rows.update((v) => v + 1);
    }

    reportExpanded(item: TreeItem, level: number, expanded: boolean): void {
        const current = this.expandedByLevel().get(item);
        if (expanded ? current === level : current === undefined) return;
        this.expandedByLevel.update((map) => {
            const next = new Map(map);
            if (expanded) next.set(item, level);
            else next.delete(item);
            return next;
        });
        this.rows.update((v) => v + 1);
    }

    isSelected(value: unknown): boolean {
        return this.selectedValues().includes(value);
    }

    toggleSelection(value: unknown): void {
        const selected = this.selectedValues();
        const next = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : this.selection() === 'multiple'
              ? [...selected, value]
              : [value];
        this.selectedValues.set(next);
        const output = this.selection() === 'multiple' ? next : (next[0] ?? null);
        this.onChange(output);
        this.onTouched();
        this.selectedChange.emit(output);
    }

    writeValue(value: unknown): void {
        this.selectedValues.set(value == null ? [] : Array.isArray(value) ? [...value] : [value]);
    }

    registerOnChange(fn: (value: unknown) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    /** The items whose rows show, in document order. */
    private visibleItems(): TreeItem[] {
        const byRow = new Map<HTMLElement, TreeItem>();
        for (const item of this.registered()) {
            const row = item.rowElement();
            if (row) byRow.set(row, item);
        }
        return Array.from(this.host.querySelectorAll<HTMLElement>('[role=treeitem]'))
            .map((row) => byRow.get(row))
            .filter((item): item is TreeItem => !!item);
    }

    protected onKeydown(event: KeyboardEvent): void {
        const items = this.visibleItems();
        const index = items.findIndex((item) => item.rowElement() === document.activeElement);
        if (index < 0) return;
        const item = items[index];
        const rtl = getComputedStyle(this.host).direction === 'rtl';
        const expandKey = rtl ? 'ArrowLeft' : 'ArrowRight';
        const collapseKey = rtl ? 'ArrowRight' : 'ArrowLeft';
        let target: TreeItem | undefined;
        if (event.key === 'ArrowDown') target = items[index + 1];
        else if (event.key === 'ArrowUp') target = items[index - 1];
        else if (event.key === 'Home') target = items[0];
        else if (event.key === 'End') target = items.at(-1);
        else if (event.key === expandKey) {
            event.preventDefault();
            if (!item.expandable()) return;
            if (!item.expanded()) item.expanded.set(true);
            else if (items[index + 1]?.level() === item.level() + 1) target = items[index + 1];
        } else if (event.key === collapseKey) {
            event.preventDefault();
            if (item.expanded() && item.expandable()) item.expanded.set(false);
            else target = this.parentOf(item, items, index);
        } else return;
        event.preventDefault();
        target?.focus();
    }

    /** The closest item before the given one with a lower level. */
    private parentOf(item: TreeItem, items: TreeItem[], index: number): TreeItem | undefined {
        for (let i = index - 1; i >= 0; i--) if (items[i].level() < item.level()) return items[i];
        return undefined;
    }

    /** Sets the size of each item's set and its position among its siblings. */
    private updatePositions(): void {
        const items = this.visibleItems();
        this.firstItem.set(items[0] ?? null);
        const groups = new Map<TreeItem | null, TreeItem[]>();
        items.forEach((item, index) => {
            const parent = item.level() > 1 ? (this.parentOf(item, items, index) ?? null) : null;
            const siblings = groups.get(parent) ?? [];
            siblings.push(item);
            groups.set(parent, siblings);
        });
        for (const siblings of groups.values()) {
            siblings.forEach((item, index) => {
                item.setSize.set(siblings.length);
                item.position.set(index + 1);
            });
        }
    }

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border block w-full list-none p-0 font-sap-font-family text-sap-font-size text-sap-text-color',
            '[--tree-exp:2.75rem] [--tree-exp-icon:var(--sapFontLargeSize)] [--tree-h:2.75rem] [--tree-font:var(--sapFontLargeSize)]',
            'compact:[--tree-exp:2rem] compact:[--tree-exp-icon:var(--sapFontSmallSize)] compact:[--tree-h:2rem] compact:[--tree-font:var(--sapFontSize)]',
            this.userClass()
        )
    );
}
