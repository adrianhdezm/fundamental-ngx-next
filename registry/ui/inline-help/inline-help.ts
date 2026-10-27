/*
 * Port of @fundamental-ngx/core (inline-help) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ScrollStrategy } from '@angular/cdk/overlay';
import {
    Directive,
    ElementRef,
    EmbeddedViewRef,
    Renderer2,
    TemplateRef,
    booleanAttribute,
    computed,
    effect,
    inject,
    input,
    type OnDestroy
} from '@angular/core';
import { cn } from '@/lib/utils';
import { Icon } from '@/ui/icon/icon';
import { FD_POPOVER, PopoverService, type Placement, type TriggerConfig } from '@/ui/popover/popover';

const DEFAULT_TRIGGERS: TriggerConfig[] = [
    { trigger: 'mouseenter', openAction: true, closeAction: false },
    { trigger: 'mouseleave', openAction: false, closeAction: true },
    { trigger: 'focusin', openAction: true, closeAction: false },
    { trigger: 'focusout', openAction: false, closeAction: true }
];

const BODY_CLASS = 'p-3 text-sap-font-small-size whitespace-normal';
/** The arrow centres on an icon-sized trigger. */
const ICON_BODY_CLASS = '[--fd-arrow-anchor-w:1.375rem] [--fd-arrow-anchor-h:1.375rem]';

let nextId = 0;

/**
 * Inline help: a tooltip-like popover with help text, shown on hover and focus.
 * The text is also rendered off-screen inside the trigger for screen readers.
 *
 * ```html
 * <fd-icon glyph="question-mark" fdInlineHelp="Explains the field" tabindex="0" />
 * <input fdFormControl fdInlineHelp="Format: YYYY-MM-DD" placement="right" />
 * ```
 */
@Directive({
    selector: '[fdInlineHelp], [fd-inline-help]',
    exportAs: 'fdInlineHelp',
    providers: [PopoverService, { provide: FD_POPOVER, useExisting: PopoverService }],
    host: {
        '[attr.aria-describedby]': 'bodyId() + "-text"'
    }
})
export class InlineHelp implements OnDestroy {
    /** Help text, or a template for rich content. */
    readonly content = input<string | TemplateRef<unknown> | null | undefined>('', { alias: 'fdInlineHelp' });
    /** Same as `fdInlineHelp`, for the fundamental-ngx attribute spelling. */
    readonly contentAlias = input<string | TemplateRef<unknown> | null | undefined>(undefined, {
        alias: 'fd-inline-help'
    });
    readonly placement = input<Placement | null>(null);
    readonly triggers = input<(string | TriggerConfig)[]>(DEFAULT_TRIGGERS);
    readonly closeOnOutsideClick = input(false, { transform: booleanAttribute });
    readonly closeOnEscapeKey = input(false, { transform: booleanAttribute });
    readonly closeOnNavigation = input(true, { transform: booleanAttribute });
    readonly restoreFocusOnClose = input(true, { transform: booleanAttribute });
    readonly noArrow = input(false, { transform: booleanAttribute });
    readonly fixedPosition = input(false, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly additionalBodyClass = input<string | null>(null);
    readonly appendTo = input<ElementRef<HTMLElement> | HTMLElement | null>(null);
    readonly maxWidth = input<number | null>(null);
    readonly scrollStrategy = input<ScrollStrategy | null>(null);
    readonly bodyId = input(`fd-inline-help-${nextId++}`);
    readonly bodyRole = input('tooltip');

    protected readonly popover = inject(PopoverService);
    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly renderer = inject(Renderer2);
    private readonly isIcon = this.elementRef.nativeElement.tagName === 'FD-ICON';
    /** Void elements such as <input> cannot hold the off-screen text; it goes right after them. */
    private readonly isVoid = ['INPUT', 'IMG', 'TEXTAREA', 'SELECT'].includes(this.elementRef.nativeElement.tagName);
    private srElement: HTMLElement | null = null;
    private srView: EmbeddedViewRef<unknown> | null = null;

    private readonly resolvedContent = computed(() => this.contentAlias() ?? this.content());

    constructor() {
        // an icon trigger is focusable, so it must stay visible to assistive technology
        const icon = inject(Icon, { self: true, optional: true });
        if (icon && icon.ariaHidden() == null) icon.ariaHidden.set(false);
        this.popover.initialise(this.elementRef);
        effect(() => {
            this.popover.refreshConfiguration({
                placement: this.placement() ?? 'bottom',
                triggers: this.triggers(),
                noArrow: this.noArrow(),
                closeOnEscapeKey: this.closeOnEscapeKey(),
                closeOnOutsideClick: this.closeOnOutsideClick(),
                closeOnNavigation: this.closeOnNavigation(),
                restoreFocusOnClose: this.restoreFocusOnClose(),
                fixedPosition: this.fixedPosition(),
                appendTo: this.appendTo(),
                maxWidth: this.maxWidth(),
                scrollStrategy: this.scrollStrategy(),
                disabled: this.disabled(),
                bodyRole: this.bodyRole(),
                bodyId: this.bodyId(),
                focusTrapped: false,
                focusAutoCapture: false,
                additionalBodyClass: cn(BODY_CLASS, this.isIcon && ICON_BODY_CLASS, this.additionalBodyClass())
            });
        });
        effect(() => {
            const content = this.resolvedContent();
            this.popover.updateContent(content);
            this.renderScreenReaderText(content);
        });
    }

    open(): void {
        this.popover.open();
    }

    close(): void {
        this.popover.close();
    }

    ngOnDestroy(): void {
        this.srElement?.remove();
        this.srView?.destroy();
    }

    /** Keeps an off-screen copy of the help text inside the trigger for assistive technology. */
    private renderScreenReaderText(content: string | TemplateRef<unknown> | null | undefined): void {
        this.srView?.destroy();
        this.srView = null;
        this.srElement?.remove();
        let el: HTMLElement = this.renderer.createElement('span');
        if (typeof content === 'string') {
            el.textContent = content;
        } else if (content) {
            this.srView = content.createEmbeddedView(null);
            this.srView.detectChanges();
            const node = this.srView.rootNodes[0];
            if (node instanceof HTMLElement) el = node;
            else el.textContent = node?.textContent ?? '';
        }
        el.classList.add('sr-only-sap');
        el.id = `${this.bodyId()}-text`;
        const host = this.elementRef.nativeElement;
        if (this.isVoid) host.after(el);
        else this.renderer.appendChild(host, el);
        this.srElement = el;
    }
}
