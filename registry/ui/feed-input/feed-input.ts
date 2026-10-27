/*
 * Port of @fundamental-ngx/core (feed-input) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    ElementRef,
    afterNextRender,
    booleanAttribute,
    computed,
    inject,
    input,
    output,
    signal
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { buttonVariants } from '@/ui/button/button';
import { Icon } from '@/ui/icon/icon';
import { fieldBase, textareaBase } from '@/ui/input/input';

/**
 * Feed input: a growing text area to post to a feed, with the user's avatar and a send button
 * that is enabled once there is text. Below 20rem the avatar hides.
 *
 * ```html
 * <fd-feed-input ariaLabel="Post a comment">
 *     <fd-avatar fdFeedInputAvatar size="s" label="John Doe" />
 *     <textarea fdFeedInputTextarea placeholder="Post something here"></textarea>
 *     <button fdFeedInputButton ariaLabel="Send" (click)="post()"></button>
 * </fd-feed-input>
 * ```
 */
@Component({
    selector: 'fd-feed-input',
    exportAs: 'fdFeedInput',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block h-full @container' },
    template: `
        <div role="group" [attr.aria-label]="ariaLabel()" [class]="computedClass()">
            <div
                class="m-0 my-4 box-border flex gap-2 bg-sap-group-content-background py-4 ps-4 pe-2 font-sap-font-family @max-[20rem]:my-0"
            >
                <ng-content />
            </div>
        </div>
    `
})
export class FeedInput {
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    /** Current text of the text area. */
    readonly value = signal('');

    protected readonly computedClass = computed(() =>
        cn('m-0 box-border h-full p-0', this.disabled() && 'cursor-not-allowed', this.userClass())
    );
}

/** The avatar of the posting user; hidden in narrow feed inputs. */
@Directive({
    selector: '[fdFeedInputAvatar]',
    host: { class: 'shrink-0 @max-[20rem]:hidden' }
})
export class FeedInputAvatar {}

/** The text area of a feed input. It grows with its text, up to `fdFeedInputTextareaMaxRows` rows. */
@Directive({
    selector: 'textarea[fdFeedInputTextarea]',
    host: {
        rows: '1',
        '[class]': 'computedClass()',
        '[disabled]': 'feed?.disabled() || null',
        '(input)': 'onInput()'
    }
})
export class FeedInputTextarea {
    /** Maximum number of rows before the text area scrolls; 20rem by default. */
    readonly fdFeedInputTextareaMaxRows = input<number | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    /** Emits the text on every change. */
    readonly valueChange = output<string>();

    readonly elementRef = inject<ElementRef<HTMLTextAreaElement>>(ElementRef);
    protected readonly feed = inject(FeedInput, { optional: true });

    protected readonly computedClass = computed(() =>
        cn(
            fieldBase,
            textareaBase,
            'm-0 min-h-12 max-h-80 flex-1 px-2 py-1.5',
            this.feed?.disabled() &&
                // a disabled feed input keeps its placeholder readable
                'disabled:pointer-events-auto disabled:cursor-not-allowed disabled:placeholder:not-italic disabled:placeholder:text-sap-text-color disabled:placeholder:opacity-100',
            this.userClass()
        )
    );

    constructor() {
        afterNextRender(() => {
            const el = this.elementRef.nativeElement;
            const rows = this.fdFeedInputTextareaMaxRows();
            if (rows) el.style.maxHeight = `${this.lineHeight() * rows}px`;
            this.feed?.value.set(el.value);
            if (el.value) this.resize();
        });
    }

    protected onInput(): void {
        const value = this.elementRef.nativeElement.value;
        this.resize();
        this.feed?.value.set(value);
        this.valueChange.emit(value);
    }

    /** Fits the height to the text. */
    resize(): void {
        const el = this.elementRef.nativeElement;
        const style = getComputedStyle(el);
        el.style.height = 'inherit';
        el.style.height = `${parseFloat(style.borderTopWidth) + el.scrollHeight + parseFloat(style.borderBottomWidth)}px`;
    }

    private lineHeight(): number {
        const style = getComputedStyle(this.elementRef.nativeElement);
        const lineHeight = parseFloat(style.lineHeight);
        return isNaN(lineHeight) ? parseFloat(style.fontSize) * 1.1 : lineHeight;
    }
}

/** The send button of a feed input; enabled when the text area has text. */
@Component({
    selector: 'button[fdFeedInputButton]',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        type: 'button',
        'data-density': 'cozy',
        '[disabled]': 'inactive()',
        '[attr.aria-disabled]': 'inactive() || null',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.title]': 'ariaLabel()',
        '[class]': 'computedClass()'
    },
    template: '<fd-icon glyph="paper-plane" class="rtl:-scale-x-100" />'
})
export class FeedInputButton {
    readonly ariaLabel = input<string | null>('Send');
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly feed = inject(FeedInput, { optional: true });
    /** Disabled while the feed input is disabled or empty. */
    protected readonly inactive = computed(() => !!this.feed && (this.feed.disabled() || !this.feed.value().trim()));
    protected readonly computedClass = computed(() =>
        cn(buttonVariants({ variant: 'standard' }), 'my-1.5 shrink-0 self-end', this.userClass())
    );
}
