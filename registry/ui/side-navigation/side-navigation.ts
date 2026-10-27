/*
 * Port of @fundamental-ngx/core (side-navigation) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    afterNextRender,
    booleanAttribute,
    computed,
    effect,
    inject,
    input,
    signal,
    untracked
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import {
    NESTED_LIST_SCOPE,
    NestedListState,
    PreparedNestedList,
    type NestedListModel
} from '@/ui/nested-list/nested-list';

/** A side navigation built from data. */
export interface SideNavigationModel {
    condensed?: boolean;
    mainNavigation: NestedListModel;
    utilityNavigation?: NestedListModel;
}

/** The main links, at the top; it scrolls when the navigation is too short. */
@Directive({
    selector: '[fd-side-nav-main], [fdSideNavigationMain]',
    host: { class: 'm-0 box-border block min-h-0 flex-1 overflow-y-auto p-0 scrollbar-sap' }
})
export class SideNavigationMain {}

/** The utility links, at the bottom. */
@Directive({
    selector: '[fd-side-nav-utility], [fdSideNavigationUtility]',
    host: { class: 'm-0 box-border block shrink-0 p-0' }
})
export class SideNavigationUtility {}

/**
 * Side navigation: main and utility nested lists in a column, with arrow-key navigation across
 * both. Condensed, it shows the icons of the first level only and opens child lists in popovers.
 * The vertical navigation is its successor in SAP Fiori.
 *
 * ```html
 * <fd-side-nav>
 *     <div fd-side-nav-main><ul fd-nested-list>...</ul></div>
 *     <div fd-side-nav-utility><ul fd-nested-list>...</ul></div>
 * </fd-side-nav>
 * ```
 */
@Component({
    selector: 'fd-side-nav',
    exportAs: 'fdSideNav',
    imports: [PreparedNestedList, SideNavigationMain, SideNavigationUtility],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [NestedListState, { provide: NESTED_LIST_SCOPE, useValue: true }],
    host: { class: 'block h-full' },
    template: `
        <nav data-nested-scope [attr.aria-label]="ariaLabel()" [class]="navClass()">
            @if (sideNavigationConfiguration(); as config) {
                @if (config.mainNavigation) {
                    <div fd-side-nav-main>
                        <fd-prepared-nested-list [condensed]="isCondensed()" [list]="config.mainNavigation" />
                    </div>
                }
                @if (config.utilityNavigation) {
                    <div fd-side-nav-utility>
                        <fd-prepared-nested-list [condensed]="isCondensed()" [list]="config.utilityNavigation" />
                    </div>
                }
            } @else {
                <ng-content />
            }
        </nav>
    `
})
export class SideNavigation {
    /** Builds the navigation from data instead of content. */
    readonly sideNavigationConfiguration = input<SideNavigationModel | null | undefined>();
    /** Shows the icons of the first level only. */
    readonly condensed = input(false, { transform: booleanAttribute });
    /** Condenses the navigation while the window is at most this wide (px). */
    readonly collapseWidth = input<number | null | undefined>();
    /** Clicking an item selects it; set false to keep the `selected` inputs of the links. */
    readonly selectable = input(true, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null>('Main Navigation');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly state = inject(NestedListState);
    private readonly narrow = signal(false);

    readonly isCondensed = computed(
        () => this.condensed() || !!this.sideNavigationConfiguration()?.condensed || this.narrow()
    );

    protected readonly navClass = computed(() =>
        cn(
            'm-0 box-border flex h-full max-h-full flex-col bg-sap-list-background p-0 font-sap-font-family',
            this.isCondensed() ? 'w-16' : 'w-full',
            this.userClass()
        )
    );

    constructor() {
        effect(() => {
            const condensed = this.isCondensed();
            const selectable = this.selectable();
            untracked(() => {
                this.state.condensed.set(condensed);
                this.state.selectable.set(selectable);
            });
        });
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const update = () => {
                const width = this.collapseWidth();
                this.narrow.set(!!width && window.innerWidth <= width);
            };
            update();
            window.addEventListener('resize', update);
            destroyRef.onDestroy(() => window.removeEventListener('resize', update));
        });
    }
}
