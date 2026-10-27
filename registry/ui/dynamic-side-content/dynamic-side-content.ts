/*
 * Port of @fundamental-ngx/core (dynamic-side-content) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    InjectionToken,
    computed,
    contentChildren,
    forwardRef,
    input
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

export type DynamicSideContentPosition = 'left' | 'right' | 'bottom' | 'equalSplit' | 'none';
/** sm hides the side content; md and lg give the main content two thirds, xl three quarters. */
export type DynamicSideContentSize = 'sm' | 'md' | 'lg' | 'xl';

let nextId = 0;

/** Main and side content, queried together to know which one was projected first. */
const DSC_CHILD = new InjectionToken<unknown>('DynamicSideContentChild');

/** Main content of a dynamic side content layout. */
@Component({
    selector: 'fd-dynamic-side-content-main',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: DSC_CHILD, useExisting: forwardRef(() => DynamicSideContentMain) }],
    host: { '[attr.id]': 'id()', 'data-dsc-main': '', '[class]': 'userClass()' }
})
export class DynamicSideContentMain {
    readonly id = input(`fd-dynamic-side-content-main-${nextId++}`);
    readonly userClass = input<ClassValue>('', { alias: 'class' });
}

/** Side content of a dynamic side content layout. */
@Component({
    selector: 'fd-dynamic-side-content-side',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: DSC_CHILD, useExisting: forwardRef(() => DynamicSideContentSide) }],
    host: { '[attr.id]': 'id()', 'data-dsc-side': '', '[class]': 'userClass()' }
})
export class DynamicSideContentSide {
    readonly id = input(`fd-dynamic-side-content-side-${nextId++}`);
    readonly userClass = input<ClassValue>('', { alias: 'class' });
}

/**
 * Dynamic side content: main content with supplementary side content next to it (left or right),
 * below it, or in an equal split. The size hides the side content (sm) or sets the share of the
 * main content.
 *
 * ```html
 * <fd-dynamic-side-content position="right" size="md">
 *     <fd-dynamic-side-content-main>...</fd-dynamic-side-content-main>
 *     <fd-dynamic-side-content-side>...</fd-dynamic-side-content-side>
 * </fd-dynamic-side-content>
 * ```
 */
@Component({
    selector: 'fd-dynamic-side-content',
    imports: [NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.id]': 'id()', '[class]': 'computedClass()' },
    template: `
        @if (sideBefore()) {
            <ng-container [ngTemplateOutlet]="side" />
        }
        <ng-content select="fd-dynamic-side-content-main" />
        @if (!sideBefore()) {
            <ng-container [ngTemplateOutlet]="side" />
        }
        <ng-template #side><ng-content select="fd-dynamic-side-content-side" /></ng-template>
    `
})
export class DynamicSideContent {
    /** none and equalSplit keep the order of the projected content. */
    readonly position = input<DynamicSideContentPosition>('none');
    readonly size = input<DynamicSideContentSize>('xl');
    readonly id = input(`fd-dynamic-side-content-${nextId++}`);
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly children = contentChildren(DSC_CHILD);

    /** Whether the side content was projected before the main content. */
    private readonly sideProjectedFirst = computed(() => this.children()[0] instanceof DynamicSideContentSide);

    protected readonly sideBefore = computed(() => {
        const position = this.position();
        if (position === 'left') return true;
        if (position === 'right' || position === 'bottom') return false;
        return this.sideProjectedFirst();
    });

    protected readonly computedClass = computed(() => {
        const size = this.size();
        const position = this.position();
        const below = position === 'bottom';
        const equal = position === 'equalSplit';
        return cn(
            'm-0 box-border flex w-full p-0 font-sap-font-family text-sap-font-size text-sap-text-color',
            '[&>[data-dsc-main]]:m-0 [&>[data-dsc-main]]:box-border [&>[data-dsc-main]]:block [&>[data-dsc-main]]:p-0',
            '[&>[data-dsc-side]]:m-0 [&>[data-dsc-side]]:box-border [&>[data-dsc-side]]:block [&>[data-dsc-side]]:flex-[1_1_0] [&>[data-dsc-side]]:p-0',
            size === 'sm'
                ? '[&>[data-dsc-main]]:w-full [&>[data-dsc-side]]:hidden'
                : size === 'xl'
                  ? '[&>[data-dsc-main]]:w-3/4'
                  : '[&>[data-dsc-main]]:w-[66.666%]',
            equal &&
                'flex-row [&>[data-dsc-main]]:w-1/2 [&>[data-dsc-main]]:flex-[1_1_50%] [&>[data-dsc-side]]:w-1/2 [&>[data-dsc-side]]:flex-[1_1_50%]',
            below &&
                'flex-col [&>[data-dsc-main]]:w-full [&>[data-dsc-side]]:block [&>[data-dsc-side]]:w-full [&>[data-dsc-side]]:flex-none',
            this.userClass()
        );
    });
}
