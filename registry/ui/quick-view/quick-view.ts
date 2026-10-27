/*
 * Port of @fundamental-ngx/core (quick-view) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, booleanAttribute, inject, input } from '@angular/core';
import { Bar, BarElement, BarLeft, BarMiddle, BarRight } from '@/ui/bar/bar';
import { FormGroup, FormGroupHeader, FormItem, FormLabel } from '@/ui/form/form';
import { PopoverBodyHeader } from '@/ui/popover/popover';
import { Title, type HeaderSize } from '@/ui/title/title';

let nextId = 0;

/**
 * Quick view: a short overview of a person, an object or a company in a popover or dialog,
 * with a header, a subheader with an avatar and groups of label-value pairs.
 *
 * ```html
 * <fd-quick-view>
 *     <fd-quick-view-title>Contact</fd-quick-view-title>
 *     <fd-quick-view-subheader>
 *         <fd-avatar size="s" label="Ann Smith" />
 *         <fd-quick-view-subheader-title>Ann Smith</fd-quick-view-subheader-title>
 *         <fd-quick-view-subheader-subtitle>Sales manager</fd-quick-view-subheader-subtitle>
 *     </fd-quick-view-subheader>
 *     <fd-quick-view-group>
 *         <fd-quick-view-group-title>Contact details</fd-quick-view-group-title>
 *         <fd-quick-view-group-item>
 *             <fd-quick-view-group-item-label>Email</fd-quick-view-group-item-label>
 *             <fd-quick-view-group-item-content><a fdLink fd-quick-view-group-item-content-element href="mailto:ann@example.com">ann@example.com</a></fd-quick-view-group-item-content>
 *         </fd-quick-view-group-item>
 *     </fd-quick-view-group>
 * </fd-quick-view>
 * ```
 */
@Component({
    selector: 'fd-quick-view',
    exportAs: 'fdQuickView',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'm-0 box-border block min-w-80 p-0 font-sap-font-family text-sap-font-size text-sap-text-color' },
    template: `
        <div [id]="id()">
            <ng-content select="fd-quick-view-title" />
            <div
                class="m-0 box-border bg-sap-group-content-background p-4 [fd-popover-body_&]:rounded-sap-element-border-corner-radius [fd-dialog-body_&]:py-0"
            >
                <ng-content select="fd-quick-view-subheader" />
                <ng-content select="fd-quick-view-group" />
                <ng-content />
            </div>
        </div>
    `
})
export class QuickView {
    readonly id = input(`fd-quick-view-${nextId++}`);
}

/** Header bar of a quick view, sticky in a popover. */
@Component({
    selector: 'fd-quick-view-title',
    imports: [PopoverBodyHeader, Bar, BarLeft, BarMiddle, BarRight, BarElement, NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `
        <div fd-popover-body-header>
            <div fd-bar barDesign="header" role="group">
                @switch (align()) {
                    @case ('left') {
                        <div fd-bar-left><ng-container [ngTemplateOutlet]="element" /></div>
                    }
                    @case ('right') {
                        <div fd-bar-right><ng-container [ngTemplateOutlet]="element" /></div>
                    }
                    @default {
                        <div fd-bar-middle><ng-container [ngTemplateOutlet]="element" /></div>
                    }
                }
            </div>
        </div>
        <ng-template #element>
            <fd-bar-element class="min-w-0 [&]:block [&]:truncate"><ng-content /></fd-bar-element>
        </ng-template>
    `
})
export class QuickViewTitle {
    readonly align = input<'left' | 'middle' | 'right'>('middle');
}

/** Avatar, title and subtitle of the object. */
@Component({
    selector: 'fd-quick-view-subheader',
    imports: [Bar, BarLeft],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `
        <div
            fd-bar
            barDesign="header-with-subheader"
            role="group"
            class="h-auto min-h-0 [--bar-px:0] pb-3 [--bar-pb:0.75rem] [&_fd-avatar]:me-3 [&>[fd-bar-left]]:items-start"
        >
            <div fd-bar-left>
                <ng-content select="fd-avatar" />
                <div class="flex h-full min-w-0 max-w-full flex-col justify-center gap-1">
                    <ng-content select="fd-quick-view-subheader-title" />
                    <ng-content select="fd-quick-view-subheader-subtitle" />
                </div>
            </div>
        </div>
    `
})
export class QuickViewSubheader {}

/** Name of the object. */
@Component({
    selector: 'fd-quick-view-subheader-title',
    imports: [Title],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block min-w-0' },
    template: `<span
        role="heading"
        [attr.aria-level]="headerSize()"
        fdTitle
        [headerSize]="headerSize()"
        [wrap]="allowWrap()"
        ><ng-content
    /></span>`
})
export class QuickViewSubheaderTitle {
    readonly allowWrap = input(false, { transform: booleanAttribute });
    readonly headerSize = input<HeaderSize>(5);
}

/** A short description of the object, e.g. a job title. */
@Component({
    selector: 'fd-quick-view-subheader-subtitle',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block min-w-0' },
    template: `<div
        class="m-0 p-0 text-sap-tile-text-color"
        [class.truncate]="!allowWrap()"
        [class.whitespace-normal]="allowWrap()"
    >
        <ng-content />
    </div>`
})
export class QuickViewSubheaderSubtitle {
    readonly allowWrap = input(false, { transform: booleanAttribute });
}

/** A group of label-value pairs. */
@Component({
    selector: 'fd-quick-view-group',
    imports: [FormGroup],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `<fd-form-group role="group"><ng-content /></fd-form-group>`
})
export class QuickViewGroup {}

/** Title of a group. */
@Component({
    selector: 'fd-quick-view-group-title',
    imports: [FormGroupHeader],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `
        <div fdFormGroupHeader noBorder noPadding>
            <span
                role="heading"
                [attr.aria-level]="headingLevel()"
                [id]="id()"
                [class]="allowWrap() ? 'whitespace-normal' : 'truncate'"
            >
                <ng-content />
            </span>
        </div>
    `
})
export class QuickViewGroupTitle {
    readonly allowWrap = input(false, { transform: booleanAttribute });
    readonly id = input(`fd-quick-view-group-title-${nextId++}`);
    readonly headingLevel = input<HeaderSize>(3);
}

/** A label and its value. */
@Component({
    selector: 'fd-quick-view-group-item',
    imports: [FormItem],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block pt-3 [fd-quick-view-group-title+&]:pt-0' },
    template: `<div fd-form-item [id]="id()" class="gap-1 [&_[fdLink]]:self-start"><ng-content /></div>`
})
export class QuickViewGroupItem {
    readonly id = input(`fd-quick-view-group-item-${nextId++}`);
}

/** Label of a group item. */
@Component({
    selector: 'fd-quick-view-group-item-label',
    imports: [FormLabel],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `<label fd-form-label [id]="(item?.id() ?? '') + '-label'" [allowWrap]="allowWrap()"
        ><ng-content
    /></label>`
})
export class QuickViewGroupItemLabel {
    readonly allowWrap = input(false, { transform: booleanAttribute });
    protected readonly item = inject(QuickViewGroupItem, { optional: true });
}

/** Value of a group item; mark the value element with `fd-quick-view-group-item-content-element`. */
@Directive({
    selector: 'fd-quick-view-group-item-content',
    host: { class: 'block' }
})
export class QuickViewGroupItemContent {}

/** The value element: it is labelled by the item label. */
@Directive({
    selector: '[fd-quick-view-group-item-content-element], [fdQuickViewGroupItemContentElement]',
    host: {
        '[attr.id]': 'id()',
        '[attr.aria-labelledby]': 'item ? item.id() + "-label " + id() : null'
    }
})
export class QuickViewGroupItemContentElement {
    protected readonly item = inject(QuickViewGroupItem, { optional: true });
    protected id(): string | null {
        return this.item ? `${this.item.id()}-content` : null;
    }
}
