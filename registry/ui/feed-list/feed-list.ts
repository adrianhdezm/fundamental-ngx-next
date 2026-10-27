/*
 * Port of @fundamental-ngx/core (feed-list-item) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    booleanAttribute,
    computed,
    forwardRef,
    inject,
    input,
    linkedSignal
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { FormattedText } from '@/ui/formatted-text/formatted-text';
import { Link } from '@/ui/link/link';

/**
 * Feed list: posts and comments with an author, a collapsible text, an avatar, actions and a
 * footer. In mobile mode the author, footer and actions go in a header above the text.
 *
 * ```html
 * <fd-feed-list ariaLabel="Comments">
 *     <fd-feed-list-item authorTitle="John Doe" text="Looks good to me.">
 *         <fd-feed-list-avatar><fd-avatar size="s" label="John Doe" /></fd-feed-list-avatar>
 *         <fd-feed-list-footer><small fd-item-footer-byline>Aug 20, 2020</small></fd-feed-list-footer>
 *     </fd-feed-list-item>
 * </fd-feed-list>
 * ```
 */
@Component({
    selector: 'fd-feed-list',
    exportAs: 'fdFeedList',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'list',
        '[attr.aria-label]': 'ariaLabel() || null',
        '[attr.aria-labelledby]': 'ariaLabelledby() || null',
        '[class]': 'computedClass()'
    },
    template: '<ng-content select="fd-feed-list-item" />'
})
export class FeedList {
    readonly ariaLabel = input<string | null | undefined>('');
    readonly ariaLabelledby = input<string | null | undefined>();
    /** Puts author, footer and actions in a header above the text. */
    readonly mobile = input(false, { transform: booleanAttribute });
    /** Stacks the items (default). */
    readonly isGroup = input(true, { transform: booleanAttribute });
    /** No borders between items. */
    readonly borderLess = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex max-w-[40rem] bg-sap-list-background p-0 font-sap-font-family text-sap-font-size text-sap-text-color',
            this.isGroup() && 'flex-col',
            this.userClass()
        )
    );
}

/** The avatar of the author. */
@Component({
    selector: 'fd-feed-list-avatar',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'm-0 me-3 box-border inline-flex h-12 max-w-12 shrink-0 grow-0 basis-12 items-center justify-center overflow-hidden p-0 [&_img]:size-full [&_img]:object-contain'
    },
    template: '<ng-content />'
})
export class FeedListAvatar {}

/** Actions of a post, e.g. a menu button. */
@Component({
    selector: 'fd-feed-list-action',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: '<ng-content />'
})
export class FeedListAction {
    private readonly item = inject(
        forwardRef(() => FeedListItem),
        { optional: true }
    );
    protected readonly computedClass = computed(() =>
        this.item?.isMobile()
            ? 'm-0 box-border block shrink-0 p-0 pb-1 ps-3'
            : 'relative -end-4 -top-4 float-end m-2 box-border block p-0 rtl:float-start'
    );
}

/** The footer of a post: bylines such as the date and a reply link. */
@Component({
    selector: 'fd-feed-list-footer',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'm-0 box-border flex p-0 pt-1.5 text-sap-font-small-size [&_[fdLink]]:[font-size:inherit]'
    },
    template: '<ng-content />'
})
export class FeedListFooter {}

/** A byline in the footer; bylines are separated by bullets. */
@Directive({
    selector: '[fd-item-footer-byline], [fdItemFooterByline]',
    host: { class: "text-sap-content-label-color not-last:after:px-1 not-last:after:content-['•']" }
})
export class FeedListFooterByline {}

/**
 * A post of a feed list: the author (a link with `authorLink`), and a text collapsed to `maxChars`
 * characters (500, or 300 in mobile mode) with a More/Less link, or rich text.
 */
@Component({
    selector: 'fd-feed-list-item',
    exportAs: 'fdFeedListItem',
    imports: [NgTemplateOutlet, FormattedText, Link],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'listitem',
        '[attr.aria-label]': 'ariaLabel() || null',
        '[attr.aria-labelledby]': 'ariaLabelledby() || null',
        '[class]': 'computedClass()'
    },
    template: `
        @if (isMobile()) {
            <div class="m-0 box-border flex justify-between p-0">
                <div class="m-0 box-border flex p-0">
                    <ng-container [ngTemplateOutlet]="avatarTpl" />
                    <div>
                        <ng-container [ngTemplateOutlet]="authorTpl" />
                        <ng-container [ngTemplateOutlet]="footerTpl" />
                    </div>
                </div>
                <ng-container [ngTemplateOutlet]="actionTpl" />
            </div>
        } @else {
            <ng-container [ngTemplateOutlet]="avatarTpl" />
        }
        <div class="m-0 box-border min-w-0 flex-1 p-0">
            @if (!isMobile()) {
                <ng-container [ngTemplateOutlet]="actionTpl" />
            }
            <p [class]="isMobile() ? 'm-0 p-0 pt-2.5' : 'm-0 p-0'">
                @if (isRichText()) {
                    @if (!isMobile()) {
                        <ng-container [ngTemplateOutlet]="authorTpl" />
                    }
                    <fd-formatted-text [htmlText]="text()" />
                } @else {
                    @if (!isMobile()) {
                        <ng-container [ngTemplateOutlet]="authorTpl" />
                    }
                    <span>{{ shownText() }}</span>
                    @if (hasMore()) {
                        <a fdLink href="#" class="ms-1 cursor-pointer" (click)="$event.preventDefault(); toggle()">{{
                            collapsed() ? moreLabel().replace('{count}', '' + hiddenCount()) : lessLabel()
                        }}</a>
                    }
                }
            </p>
            @if (!isMobile()) {
                <ng-container [ngTemplateOutlet]="footerTpl" />
            }
        </div>

        <ng-template #avatarTpl><ng-content select="fd-feed-list-avatar" /></ng-template>
        <ng-template #actionTpl><ng-content select="fd-feed-list-action" /></ng-template>
        <ng-template #footerTpl><ng-content select="fd-feed-list-footer" /></ng-template>
        <ng-template #authorTpl>
            <!-- the colon and the space come from CSS, so whitespace in the template does not matter -->
            <span class="m-0 me-1 p-0 font-bold after:content-[':']">
                @if (authorLink()) {
                    <a
                        fdLink
                        emphasized
                        target="_blank"
                        class="inline-block max-w-3/4 truncate align-top"
                        [attr.href]="authorLink()"
                        [attr.title]="authorTitle()"
                        >{{ authorTitle() }}</a
                    >
                } @else {
                    <span>{{ authorTitle() }}</span>
                }
            </span>
        </ng-template>
    `
})
export class FeedListItem {
    readonly authorTitle = input('');
    readonly authorLink = input<string | null | undefined>();
    readonly text = input('');
    /** Characters shown before the More link; 500, or 300 in mobile mode, by default. */
    readonly maxChars = input<number | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>('');
    readonly ariaLabelledby = input<string | null | undefined>();
    /** The text is HTML, shown in full with fd-formatted-text. */
    readonly isRichText = input(false, { transform: booleanAttribute });
    readonly mobile = input(false, { transform: booleanAttribute });
    /** Text of the More link; `{count}` is the number of hidden characters. */
    readonly moreLabel = input('{count} more');
    readonly lessLabel = input('Less');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly list = inject(FeedList, { optional: true });
    readonly isMobile = computed(() => this.mobile() || !!this.list?.mobile());
    protected readonly collapsed = linkedSignal(() => {
        this.text();
        return true;
    });
    protected readonly limit = computed(() => this.maxChars() || (this.isMobile() ? 300 : 500));
    protected readonly hasMore = computed(() => !this.isRichText() && this.text().length > this.limit());
    protected readonly hiddenCount = computed(() => this.text().length - this.limit());
    protected readonly shownText = computed(() =>
        this.hasMore() && this.collapsed() ? `${this.text().substring(0, this.limit())}...` : this.text()
    );

    protected readonly computedClass = computed(() => {
        const borderless = !!this.list?.borderLess();
        return cn(
            'm-0 box-border p-4',
            this.isMobile() ? 'block' : 'flex',
            borderless
                ? 'pt-4 pb-3 [&+&]:py-3 last:pb-4'
                : '[&+&]:border-0 [&+&]:border-t [&+&]:border-solid [&+&]:border-sap-list-border-color [&+&]:last:border-b',
            this.userClass()
        );
    });

    protected toggle(): void {
        this.collapsed.update((v) => !v);
    }
}
