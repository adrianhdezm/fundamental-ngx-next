/*
 * Port of @fundamental-ngx/core (action-bar) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChangeDetectionStrategy, Component, Directive, booleanAttribute, computed, input } from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

/** Responsive size: s (small), m_l (medium/large) or xl; sets the horizontal padding. */
export type ActionBarSize = 's' | 'm_l' | 'xl';

const PADDING: Record<ActionBarSize, string> = { s: 'px-4', m_l: 'px-8', xl: 'px-12' };

/**
 * Action bar: the header of a page with a back button, title, description and page actions.
 *
 * ```html
 * <div fd-action-bar>
 *     <div fd-action-bar-header>
 *         <div fd-action-bar-back><button fdButton variant="transparent" glyph="navigation-left-arrow" ariaLabel="Back"></button></div>
 *         <div fd-action-bar-title>Page Title</div>
 *         <div fd-action-bar-actions><button fdButton variant="emphasized" label="Save"></button></div>
 *     </div>
 *     <p fd-action-bar-description withBackBtn>Description</p>
 * </div>
 * ```
 */
@Directive({
    selector: '[fd-action-bar], [fdActionBar]',
    host: { '[class]': 'computedClass()' }
})
export class ActionBar {
    readonly size = input<ActionBarSize>('m_l');
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border block max-h-[4.25rem] min-h-12 justify-between py-2 break-words font-sap-font-family text-sap-font-size',
            'bg-sap-page-header-background shadow-sap-content-header-shadow',
            PADDING[this.size()],
            this.userClass()
        )
    );
}

@Directive({
    selector: '[fd-action-bar-header], [fdActionBarHeader]',
    host: { class: 'm-0 box-border flex h-8 grow items-center p-0' }
})
export class ActionBarHeader {}

/** Hidden on small screens (below 600px). */
@Directive({
    selector: '[fd-action-bar-back], [fdActionBarBack]',
    host: { class: 'relative m-0 me-2 box-border block p-0 max-[600px]:hidden' }
})
export class ActionBarBack {}

@Component({
    selector: '[fd-action-bar-title], [fdActionBarTitle]',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'm-0 box-border min-w-0 grow basis-0 truncate p-0 pe-2 align-middle leading-[1.375rem] [text-rendering:optimizeLegibility]'
    },
    template: `
        <h2
            class="m-0 truncate p-0 font-sap-font-header-family text-sap-font-header3-size leading-[inherit] font-normal text-sap-group-title-text-color"
        >
            <ng-content />
        </h2>
    `
})
export class ActionBarTitle {}

@Directive({
    selector: '[fd-action-bar-actions], [fdActionBarActions]',
    host: {
        class: 'm-0 box-border flex h-8 items-center gap-2 p-0 visible transition-opacity duration-250 ease-in [&[hidden]]:invisible [&[hidden]]:opacity-0'
    }
})
export class ActionBarActions {}

/** Hidden on small screens (below 600px). */
@Directive({
    selector: '[fd-action-bar-description], [fdActionBarDescription]',
    host: { '[class]': 'computedClass()' }
})
export class ActionBarDescription {
    /** Aligns the description with the title next to a back button. */
    readonly withBackBtn = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border inline-block h-5 w-full truncate p-0 align-middle text-sap-content-label-color max-[600px]:hidden',
            this.withBackBtn() && 'ps-10',
            this.userClass()
        )
    );
}
