/*
 * Port of @fundamental-ngx/core (message-page) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChangeDetectionStrategy, Component, Directive, booleanAttribute, computed, input } from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon, type IconFont } from '@/ui/icon/icon';

export type MessagePageType = '' | 'filter' | 'search' | 'no-items' | 'error';

const GLYPH: Record<MessagePageType, string> = {
    '': 'documents',
    filter: 'filter',
    search: 'search',
    'no-items': 'product',
    error: 'document'
};

/**
 * Message page: a full-page message when there is nothing to show, e.g. no search results or a
 * missing page, with an icon, a title, a subtitle and actions. The content is a polite live region.
 *
 * ```html
 * <fd-message-page type="search">
 *     <fd-message-page-title>No matching items found.</fd-message-page-title>
 *     <fd-message-page-subtitle>Check the search term.</fd-message-page-subtitle>
 * </fd-message-page>
 * ```
 */
@Component({
    selector: 'fd-message-page',
    exportAs: 'fdMessagePage',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `
        <div
            class="m-0 box-border flex max-w-[30rem] flex-col items-center rounded-sap-element-border-corner-radius bg-sap-group-content-background p-4"
        >
            @if (hasIcon()) {
                <div class="m-0 box-border flex h-32 w-full items-center justify-center p-0">
                    <fd-icon
                        role="presentation"
                        [glyph]="computedGlyph()"
                        [font]="glyphFont()"
                        class="max-w-[30rem] text-[6rem] leading-none text-sap-content-non-interactive-icon-color opacity-50"
                    />
                </div>
            }
            <div
                role="status"
                aria-live="polite"
                class="m-0 box-border flex max-w-[30rem] flex-col items-center p-0 pb-8"
            >
                <ng-content select="fd-message-page-title" />
                <ng-content select="fd-message-page-subtitle" />
                <ng-content select="fd-message-page-actions" />
                <ng-content select="fd-message-page-more" />
                <ng-content />
            </div>
        </div>
    `
})
export class MessagePage {
    /** Kind of message; sets the icon. */
    readonly type = input<MessagePageType>('');
    readonly hasIcon = input(true, { transform: booleanAttribute });
    /** Icon instead of the one of the type. */
    readonly glyph = input<string | null | undefined>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly computedGlyph = computed(() => this.glyph() || GLYPH[this.type() ?? '']);
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex size-full items-center justify-center bg-sap-background-color p-0',
            'font-sap-font-family text-sap-font-size leading-[normal] text-sap-text-color',
            this.userClass()
        )
    );
}

@Directive({
    selector: 'fd-message-page-title',
    host: {
        class: 'm-0 mt-8 mb-2 box-border block max-w-[30rem] p-0 text-center text-sap-font-header2-size text-sap-group-title-text-color'
    }
})
export class MessagePageTitle {}

@Directive({
    selector: 'fd-message-page-subtitle',
    host: {
        class: 'm-0 mb-8 box-border block max-w-[30rem] p-0 text-center text-sap-font-header5-size text-sap-content-label-color'
    }
})
export class MessagePageSubtitle {}

@Directive({
    selector: 'fd-message-page-actions',
    host: { class: 'm-0 box-border flex min-h-8 max-w-[30rem] flex-wrap items-center justify-center gap-2 p-0' }
})
export class MessagePageActions {}

@Directive({
    selector: 'fd-message-page-more',
    host: { class: 'm-0 mt-2 box-border flex min-h-8 max-w-[30rem] items-center justify-center p-0' }
})
export class MessagePageMore {}
