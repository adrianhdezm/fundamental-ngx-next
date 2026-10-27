/*
 * Port of @fundamental-ngx/core (text) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    afterRenderEffect,
    booleanAttribute,
    computed,
    inject,
    input,
    model,
    signal,
    viewChild
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Link } from '@/ui/link/link';

export type Hyphenation = 'none' | 'manual' | 'auto' | null;

/**
 * Text: a paragraph with optional line limit, "More/Less" expansion, preserved whitespace and
 * hyphenation.
 *
 * ```html
 * <fd-text [text]="description" [maxLines]="3" expandable />
 * ```
 */
@Component({
    selector: 'fd-text',
    exportAs: 'fdText',
    imports: [Link],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `
        <p [class]="paragraphClass()" [style.hyphens]="hyphenation()">
            <span #clamp [class]="clampClass()" [style.--fd-lines]="maxLines()">{{ text() }}</span>
            @if (canExpand()) {
                <a
                    fdLink
                    tabindex="0"
                    role="button"
                    [attr.aria-expanded]="!isCollapsed()"
                    class="capitalize"
                    (click)="toggle()"
                    (keydown.enter)="toggle()"
                    (keydown.space)="$event.preventDefault(); toggle()"
                >
                    {{ isCollapsed() ? moreLabel() : lessLabel() }}
                </a>
            }
        </p>
    `
})
export class Text {
    readonly text = input('');
    /** Clamps the text to this many lines. */
    readonly maxLines = input<number | null>(null);
    /** Keeps line breaks and spaces of the text. */
    readonly whitespaces = input(false, { transform: booleanAttribute });
    readonly hyphenation = input<Hyphenation>(null);
    /** Shows a More/Less link when the text is clamped. */
    readonly expandable = input(false, { transform: booleanAttribute });
    /** Collapsed state of an expandable text; two-way bindable. */
    readonly isCollapsed = model(true);
    /** Smaller, label-coloured two-line text, e.g. under a title. */
    readonly subline = input(false, { transform: booleanAttribute });
    readonly moreLabel = input('More');
    readonly lessLabel = input('Less');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly clamp = viewChild.required<ElementRef<HTMLElement>>('clamp');
    /** Whether the full text is longer than maxLines. */
    private readonly overflows = signal(false);

    private readonly hasMaxLines = computed(() => (this.maxLines() ?? 0) > 0);
    protected readonly collapsed = computed(() => this.hasMaxLines() && (!this.expandable() || this.isCollapsed()));
    protected readonly canExpand = computed(() => this.expandable() && this.hasMaxLines() && this.overflows());

    protected readonly paragraphClass = computed(() =>
        cn(
            'm-0 p-0 font-sap-font-family text-sap-font-size leading-[normal] text-sap-text-color',
            'selection:bg-sap-content-selected-background hc:selection:bg-sap-selected-color selection:text-sap-content-contrast-text-color',
            this.whitespaces() && 'whitespace-pre-wrap',
            this.subline() && 'line-clamp-2 text-sap-font-small-size text-sap-content-label-color',
            this.userClass()
        )
    );

    protected readonly clampClass = computed(() => (this.collapsed() ? 'line-clamp-(--fd-lines)' : 'block'));

    constructor() {
        const observer = new ResizeObserver(() => this.measure());
        inject(DestroyRef).onDestroy(() => observer.disconnect());
        afterRenderEffect(() => {
            this.text();
            this.maxLines();
            const el = this.clamp().nativeElement;
            observer.disconnect();
            observer.observe(el);
            this.measure();
        });
    }

    protected toggle(): void {
        this.isCollapsed.update((c) => !c);
    }

    /** While clamped, the text overflows when its full height exceeds the visible lines. */
    private measure(): void {
        const el = this.clamp().nativeElement;
        if (!this.maxLines()) return this.overflows.set(false);
        // expanded: keep the last measurement (it was clamped and overflowing to get here)
        if (this.collapsed()) this.overflows.set(el.scrollHeight > el.clientHeight + 1);
    }
}
