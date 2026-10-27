/*
 * Port of @fundamental-ngx/core (popover) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { InteractivityChecker } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import {
    type ConnectedOverlayPositionChange,
    type ConnectedPosition,
    type FlexibleConnectedPositionStrategy,
    Overlay,
    type OverlayRef,
    type ScrollStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    Injectable,
    InjectionToken,
    Injector,
    type OutputRefSubscription,
    Renderer2,
    TemplateRef,
    ViewContainerRef,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChild,
    effect,
    inject,
    input,
    model,
    output,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, merge } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { cn, type ClassValue } from '@/lib/utils';
import {
    type ArrowAlign,
    type ArrowSide,
    type Placement,
    type PopoverFillMode,
    arrowFor,
    getCdkPlacement,
    withFallbackPositions
} from './popover-position';

export * from './popover-position';

/** A DOM event that opens and/or closes the popover. */
export interface TriggerConfig {
    trigger: string;
    openAction: boolean;
    closeAction: boolean;
    stopPropagation?: boolean;
}

export type PopoverBodyRole = 'dialog' | 'region' | 'menu' | 'listbox' | 'tooltip' | 'alertdialog';

/**
 * Normalises triggers. A lone trigger toggles; otherwise odd entries open and even entries close,
 * e.g. ['mouseenter', 'mouseleave'] or ['focusin', 'focusout'].
 */
export function normalizeTriggers(triggers: (string | TriggerConfig)[]): TriggerConfig[] {
    return triggers.map((t, i) =>
        typeof t === 'object'
            ? t
            : {
                  trigger: t,
                  openAction: triggers.length === 1 || i % 2 === 0,
                  closeAction: triggers.length === 1 || i % 2 === 1
              }
    );
}

/** Lets a popover body register with the popover that renders it. */
export interface PopoverBodyHost {
    registerBody(body: PopoverBody | null): void;
}
export const FD_POPOVER = new InjectionToken<PopoverBodyHost>('FdPopover');

/** Notifies popovers inside a scrollable container that their trigger moved. */
@Injectable()
export class PopoverContainerRefresh {
    readonly refresh$ = new Subject<void>();
}

/**
 * Marks a scrollable container: popovers inside it reposition while it scrolls.
 *
 * ```html
 * <div fdPopoverContainer class="overflow-auto">...</div>
 * ```
 */
@Directive({
    selector: '[fdPopoverContainer]',
    providers: [PopoverContainerRefresh],
    host: { '(scroll)': 'refresh.refresh$.next()' }
})
export class PopoverContainer {
    protected readonly refresh = inject(PopoverContainerRefresh);
}

/** Sticky header of a popover body. */
@Directive({
    selector: '[fd-popover-body-header], [fdPopoverBodyHeader]',
    host: { class: 'sticky top-0 z-[6] block' }
})
export class PopoverBodyHeader {}

/** Sticky footer of a popover body. */
@Directive({
    selector: '[fd-popover-body-footer], [fdPopoverBodyFooter]',
    host: { class: 'sticky bottom-0 z-[6] block' }
})
export class PopoverBodyFooter {}

const ARROW_BASE = [
    '[--fd-arrow:0.5rem] [--fd-arrow-anchor-w:2.25rem] [--fd-arrow-anchor-h:2.25rem] compact:[--fd-arrow-anchor-w:2rem] compact:[--fd-arrow-anchor-h:1.625rem]',
    "before:absolute before:z-[3] before:size-0 before:border-solid before:border-transparent before:content-['']",
    "after:absolute after:z-[2] after:size-0 after:border-solid after:border-transparent after:content-['']"
].join(' ');

/** Triangle classes per side: `after` is the border-coloured outline, `before` the body-coloured fill. */
const ARROW_SIDE: Record<Exclude<ArrowSide, 'none'>, string> = {
    top: [
        'top-(--fd-arrow)',
        'after:-top-(--fd-arrow) after:border-x-(length:--fd-arrow) after:border-b-(length:--fd-arrow) after:border-t-0 after:border-b-(color:--fdPopover_Border_Color)',
        'before:top-[calc(var(--fd-arrow)*-1_+_var(--fdPopover_Border_Width))] before:border-x-[calc(var(--fd-arrow)_-_var(--fdPopover_Border_Width))]',
        'before:border-b-[calc(var(--fd-arrow)_-_var(--fdPopover_Border_Width))] before:border-t-0 before:border-b-sap-group-content-background'
    ].join(' '),
    bottom: [
        '-top-(--fd-arrow)',
        'after:top-full after:border-x-(length:--fd-arrow) after:border-t-(length:--fd-arrow) after:border-b-0 after:border-t-(color:--fdPopover_Border_Color)',
        'before:top-full before:border-x-[calc(var(--fd-arrow)_-_var(--fdPopover_Border_Width))]',
        'before:border-t-[calc(var(--fd-arrow)_-_var(--fdPopover_Border_Width))] before:border-b-0 before:border-t-sap-group-content-background'
    ].join(' '),
    start: [
        'start-(--fd-arrow)',
        'after:end-full after:border-y-(length:--fd-arrow) after:border-e-(length:--fd-arrow) after:border-s-0 after:border-e-(color:--fdPopover_Border_Color)',
        'before:end-full before:border-y-[calc(var(--fd-arrow)_-_var(--fdPopover_Border_Width))]',
        'before:border-e-[calc(var(--fd-arrow)_-_var(--fdPopover_Border_Width))] before:border-s-0 before:border-e-sap-group-content-background'
    ].join(' '),
    end: [
        '-start-(--fd-arrow)',
        'after:start-full after:border-y-(length:--fd-arrow) after:border-s-(length:--fd-arrow) after:border-e-0 after:border-s-(color:--fdPopover_Border_Color)',
        'before:start-full before:border-y-[calc(var(--fd-arrow)_-_var(--fdPopover_Border_Width))]',
        'before:border-s-[calc(var(--fd-arrow)_-_var(--fdPopover_Border_Width))] before:border-e-0 before:border-s-sap-group-content-background'
    ].join(' ')
};

/** Arrow placement along the edge, aligned with the centre of a button-sized trigger. */
const ARROW_ALIGN_X: Record<ArrowAlign, string> = {
    start: 'after:start-[calc(var(--fd-arrow-anchor-w)*0.5_-_var(--fd-arrow)_-_var(--fdPopover_Border_Width))] before:start-[calc(var(--fd-arrow-anchor-w)*0.5_-_var(--fd-arrow))]',
    center: 'before:start-1/2 after:start-1/2 before:-translate-x-1/2 after:-translate-x-1/2 rtl:before:translate-x-1/2 rtl:after:translate-x-1/2',
    end: 'after:end-[calc(var(--fd-arrow-anchor-w)*0.5_-_var(--fd-arrow)_-_var(--fdPopover_Border_Width))] before:end-[calc(var(--fd-arrow-anchor-w)*0.5_-_var(--fd-arrow))]'
};
const ARROW_ALIGN_Y: Record<ArrowAlign, string> = {
    start: 'after:top-[calc(var(--fd-arrow-anchor-h)*0.5_-_var(--fd-arrow)_-_var(--fdPopover_Border_Width))] before:top-[calc(var(--fd-arrow-anchor-h)*0.5_-_var(--fd-arrow))]',
    center: 'before:top-1/2 after:top-1/2 before:-translate-y-1/2 after:-translate-y-1/2',
    end: 'after:bottom-[calc(var(--fd-arrow-anchor-h)*0.5_-_var(--fd-arrow)_-_var(--fdPopover_Border_Width))] before:bottom-[calc(var(--fd-arrow-anchor-h)*0.5_-_var(--fd-arrow))]'
};

/**
 * The visual container of popover content: SAP popover surface, shadow, optional arrow, scrolling,
 * focus trap and optional resize handle. Rendered inside the overlay of `<fd-popover>`.
 */
@Component({
    selector: 'fd-popover-body',
    imports: [NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'block max-h-full max-w-full',
        '(keydown.escape)': 'onEscape($event)'
    },
    template: `
        <div
            #surface
            [class]="surfaceClass()"
            (keydown)="trapTab($event)"
            [style.min-width]="fillWidth() !== null && fillMode() === 'at-least' ? fillWidth() + 'px' : minWidth()"
            [style.width]="fillWidth() !== null && fillMode() === 'equal' ? fillWidth() + 'px' : resizedWidth()"
            [style.max-width]="bodyMaxWidth() !== null ? bodyMaxWidth() + 'px' : maxWidth()"
            [style.min-height]="minHeight()"
            [style.max-height]="maxHeight()"
            [style.height]="resizedHeight()"
            [attr.role]="role()"
            [attr.aria-label]="ariaLabel()"
            [attr.aria-labelledby]="ariaLabelledBy()"
            [attr.aria-modal]="ariaModal()"
            [attr.id]="bodyId()"
        >
            @if (!disableScrollbar()) {
                <div class="scrollbar-sap relative w-full max-h-full max-w-full overflow-auto rounded-[inherit]">
                    <ng-container [ngTemplateOutlet]="content" />
                </div>
            } @else {
                <ng-container [ngTemplateOutlet]="content" />
            }
            @if (resizable()) {
                <span
                    role="presentation"
                    aria-hidden="true"
                    [class]="resizeHandleClass()"
                    data-glyph=""
                    (pointerdown)="startResize($event)"
                ></span>
            }
        </div>
        <ng-template #content>
            <ng-content select="[fd-popover-body-header], [fdPopoverBodyHeader]" />
            <ng-content select="[fd-popover-body-subheader]" />
            <ng-content />
            @if (text()) {
                {{ text() }}
            }
            @if (template(); as t) {
                <ng-container [ngTemplateOutlet]="t" />
            }
            <ng-content select="[fd-popover-body-footer], [fdPopoverBodyFooter]" />
        </ng-template>
    `
})
export class PopoverBody {
    readonly minWidth = input<string | null | undefined>();
    readonly maxWidth = input<string | null | undefined>();
    readonly minHeight = input<string | null | undefined>();
    readonly maxHeight = input<string | null | undefined>();
    readonly ariaModal = input<boolean | null>(null);
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    /** Emits when the body asks to close (Escape). */
    readonly closeRequest = output<void>();

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly checker = inject(InteractivityChecker);
    private readonly surface = viewChild.required<ElementRef<HTMLElement>>('surface');
    private readonly dir = inject(Directionality, { optional: true });

    // state driven by <fd-popover>
    readonly noArrow = signal(true);
    readonly arrowSide = signal<ArrowSide>('none');
    readonly arrowAlign = signal<ArrowAlign>('start');
    readonly focusTrapped = signal(false);
    readonly closeOnEscape = signal(true);
    readonly disableScrollbar = signal(false);
    readonly resizable = signal(false);
    readonly role = signal<string | null>('dialog');
    readonly ariaLabel = signal<string | null>(null);
    readonly ariaLabelledBy = signal<string | null>(null);
    readonly bodyId = signal<string | null>(null);
    readonly bodyMaxWidth = signal<number | null>(null);
    readonly fillMode = signal<PopoverFillMode | null>(null);
    readonly fillWidth = signal<number | null>(null);
    readonly additionalClass = signal<string | null>(null);
    readonly text = signal<string | null>(null);
    readonly template = signal<TemplateRef<unknown> | null>(null);
    protected readonly resizedWidth = signal<string | null>(null);
    protected readonly resizedHeight = signal<string | null>(null);

    constructor() {
        const host = inject(FD_POPOVER, { optional: true, skipSelf: false });
        host?.registerBody(this);
        inject(DestroyRef).onDestroy(() => host?.registerBody(null));
    }

    protected readonly surfaceClass = computed(() => {
        const side = this.noArrow() ? 'none' : this.arrowSide();
        return cn(
            'relative flex max-h-full max-w-full whitespace-nowrap',
            'font-sap-font-family text-sap-font-size leading-[normal] text-sap-text-color',
            'rounded-sap-popover-border-corner-radius bg-sap-group-content-background transition-all duration-[125ms]',
            side === 'none'
                ? 'shadow-sap-content-shadow1'
                : ['shadow-sap-content-shadow2', ARROW_BASE, ARROW_SIDE[side]],
            side === 'top' || side === 'bottom' ? ARROW_ALIGN_X[this.arrowAlign()] : '',
            side === 'start' || side === 'end' ? ARROW_ALIGN_Y[this.arrowAlign()] : '',
            this.additionalClass(),
            this.userClass()
        );
    });

    protected readonly resizeHandleClass = computed(() =>
        cn(
            'absolute -bottom-2 -end-2 flex size-6 cursor-se-resize items-start overflow-hidden text-sap-button-lite-text-color',
            'after:flex after:size-4 after:font-sap-content-icon-font-family after:text-[1rem] after:leading-4 after:content-[attr(data-glyph)]',
            'rtl:cursor-sw-resize rtl:after:-scale-x-100',
            this.arrowSide() === 'bottom' && 'top-[-0.5rem] bottom-auto -rotate-90 cursor-ne-resize'
        )
    );

    protected onEscape(event: Event): void {
        if (this.closeOnEscape()) {
            event.stopPropagation();
            this.closeRequest.emit();
        }
    }

    /** Moves focus to the first tabbable element of the body (or the one marked `cdkFocusRegionStart`). */
    focusFirstTabbable(): void {
        requestAnimationFrame(() => {
            const surface = this.surface().nativeElement;
            const start = surface.querySelector<HTMLElement>('[cdkFocusRegionStart], [cdk-focus-region-start]');
            (start ?? this.tabbables()[0])?.focus();
        });
    }

    /**
     * Keeps Tab inside the body while `focusTrapped`: Tab on the last tabbable element wraps to the first and
     * Shift+Tab on the first to the last. Unlike the CDK focus trap, this adds no `aria-hidden` focusable anchors,
     * which axe reports (aria-hidden-focus) and which upstream's focus trap does not render either.
     */
    protected trapTab(event: KeyboardEvent): void {
        if (event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey || !this.focusTrapped()) return;
        const tabbables = this.tabbables();
        if (!tabbables.length) {
            event.preventDefault();
            return;
        }
        const active = document.activeElement;
        const inside = !!active && this.surface().nativeElement.contains(active);
        // tabbable elements the browser would move to from the focused element
        const ahead = inside
            ? tabbables.filter((el) =>
                  event.shiftKey
                      ? el.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_FOLLOWING
                      : active.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING
              )
            : [];
        // wrap around when focus would leave the body
        const target = ahead.length ? null : event.shiftKey ? tabbables[tabbables.length - 1] : tabbables[0];
        if (target) {
            event.preventDefault();
            target.focus();
        }
    }

    /** Tabbable elements of the body, in DOM order. */
    private tabbables(): HTMLElement[] {
        return [...this.surface().nativeElement.querySelectorAll<HTMLElement>('*')].filter(
            (el) => this.checker.isFocusable(el) && this.checker.isTabbable(el)
        );
    }

    protected startResize(event: PointerEvent): void {
        event.preventDefault();
        const surface = this.surface().nativeElement;
        const rect = surface.getBoundingClientRect();
        const rtl = this.dir?.value === 'rtl';
        const startX = event.clientX;
        const startY = event.clientY;
        const handle = event.target as HTMLElement;
        handle.setPointerCapture(event.pointerId);
        const move = (e: PointerEvent) => {
            const dx = (e.clientX - startX) * (rtl ? -1 : 1);
            const dy = (e.clientY - startY) * (this.arrowSide() === 'bottom' ? -1 : 1);
            this.resizedWidth.set(`${Math.max(rect.width + dx, 48)}px`);
            this.resizedHeight.set(`${Math.max(rect.height + dy, 48)}px`);
        };
        const up = () => {
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', up);
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
    }
}

/**
 * Wraps the element that opens the popover. With a `click` trigger its first child becomes
 * tabbable, and Space/Enter toggle the popover.
 */
@Directive({
    selector: 'fd-popover-control, [fdPopoverControl]',
    host: { class: 'block' }
})
export class PopoverControl {
    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    makeTabbable(): void {
        const child = this.elementRef.nativeElement.children[0] as HTMLElement | undefined;
        if (child && child.getAttribute('tabindex') !== '-1' && child.tabIndex < 0) child.tabIndex = 0;
    }
}

/** Configuration of a popover; every field is optional. */
export interface PopoverConfig {
    placement?: Placement | null;
    cdkPositions?: ConnectedPosition[] | null;
    fixedPosition?: boolean;
    triggers?: (string | TriggerConfig)[];
    disabled?: boolean;
    noArrow?: boolean;
    closeOnOutsideClick?: boolean;
    closeOnEscapeKey?: boolean;
    closeOnNavigation?: boolean;
    focusTrapped?: boolean;
    focusAutoCapture?: boolean;
    restoreFocusOnClose?: boolean;
    fillControlMode?: PopoverFillMode | null;
    maxWidth?: number | null;
    disableScrollbar?: boolean;
    resizable?: boolean;
    applyOverlay?: boolean;
    scrollStrategy?: ScrollStrategy | null;
    appendTo?: ElementRef<HTMLElement> | HTMLElement | null;
    additionalBodyClass?: string | null;
    bodyRole?: string | null;
    bodyAriaLabel?: string | null;
    bodyAriaLabelledBy?: string | null;
    bodyId?: string | null;
}

const DEFAULT_CONFIG: Required<PopoverConfig> = {
    placement: 'bottom-start',
    cdkPositions: null,
    fixedPosition: false,
    triggers: ['click'],
    disabled: false,
    noArrow: true,
    closeOnOutsideClick: true,
    closeOnEscapeKey: true,
    closeOnNavigation: true,
    focusTrapped: true,
    focusAutoCapture: true,
    restoreFocusOnClose: true,
    fillControlMode: null,
    maxWidth: null,
    disableScrollbar: false,
    resizable: false,
    applyOverlay: false,
    scrollStrategy: null,
    appendTo: null,
    additionalBodyClass: null,
    bodyRole: 'dialog',
    bodyAriaLabel: null,
    bodyAriaLabelledBy: null,
    bodyId: null
};

/**
 * Overlay behaviour of a popover: trigger listeners, positioning with fallbacks, outside click and
 * Escape handling, focus capture and restore, fill modes and the modal backdrop.
 *
 * Provide it on a component or directive that owns a popover (`<fd-popover>`, inline help, menus,
 * pickers) and call `initialise()` with the trigger element.
 */
@Injectable()
export class PopoverService implements PopoverBodyHost {
    readonly config = signal<Required<PopoverConfig>>({ ...DEFAULT_CONFIG });
    readonly isOpen = signal(false);
    readonly triggerElement = signal<HTMLElement | null>(null);
    /** Body rendered by this popover: projected, or the default body attached for text/template content. */
    readonly body = signal<PopoverBody | null>(null);
    /** Text content for a popover without its own body. */
    readonly text = signal<string | null>(null);
    /** Template content for a popover without its own body. */
    readonly template = signal<TemplateRef<unknown> | null>(null);

    private readonly overlay = inject(Overlay);
    private readonly renderer = inject(Renderer2);
    private readonly injector = inject(Injector);
    private readonly destroyRef = inject(DestroyRef);
    private readonly dir = inject(Directionality, { optional: true });
    private readonly containerRefresh = inject(PopoverContainerRefresh, { optional: true });

    private overlayRef: OverlayRef | null = null;
    private bodyTemplate: { template: TemplateRef<unknown>; vcr: ViewContainerRef } | null = null;
    private readonly closed$ = new Subject<void>();
    private listeners: (() => void)[] = [];
    private hoverCloseTimer: ReturnType<typeof setTimeout> | null = null;
    private lastFocused: HTMLElement | null = null;
    private ignoreTriggers = false;
    private closeRequest: OutputRefSubscription | null = null;

    readonly direction = computed(() => this.dir?.valueSignal() ?? 'ltr');

    constructor() {
        // re-attach trigger listeners when the trigger or the triggers change
        effect(() => {
            const el = this.triggerElement();
            const triggers = normalizeTriggers(this.config().triggers);
            untracked(() => this.listen(el, triggers));
        });
        // keep an open body in sync with the configuration
        effect(() => {
            const body = this.body();
            const config = this.config();
            const text = this.text();
            const template = this.template();
            if (body) untracked(() => this.configureBody(body, config, text, template));
        });
        this.containerRefresh?.refresh$.pipe(takeUntilDestroyed()).subscribe(() => this.refreshPosition());
        this.destroyRef.onDestroy(() => {
            this.removeListeners();
            this.clearHoverTimer();
            this.detach(false);
        });
    }

    /** Connects the trigger and, optionally, the template that holds a projected `<fd-popover-body>`. */
    initialise(
        trigger: HTMLElement | ElementRef<HTMLElement>,
        bodyTemplate?: { template: TemplateRef<unknown>; vcr: ViewContainerRef } | null
    ): void {
        this.triggerElement.set(trigger instanceof ElementRef ? trigger.nativeElement : trigger);
        this.bodyTemplate = bodyTemplate ?? null;
    }

    /** Merges configuration; undefined fields keep their value. */
    refreshConfiguration(config: PopoverConfig): void {
        const defined = Object.fromEntries(Object.entries(config).filter(([, v]) => v !== undefined));
        this.config.update((c) => ({ ...c, ...defined }));
    }

    /** Sets text or template content for popovers without their own body. */
    updateContent(content: string | TemplateRef<unknown> | null | undefined): void {
        this.text.set(typeof content === 'string' ? content : null);
        this.template.set(content instanceof TemplateRef ? content : null);
    }

    registerBody(body: PopoverBody | null): void {
        this.body.set(body);
    }

    open(): void {
        const trigger = this.triggerElement();
        if (this.overlayRef?.hasAttached() || this.config().disabled || !trigger) return;
        const config = this.config();
        const strategy = this.positionStrategy();
        this.overlayRef = this.overlay.create({
            direction: this.direction(),
            positionStrategy: strategy,
            scrollStrategy: config.scrollStrategy ?? this.overlay.scrollStrategies.reposition(),
            disposeOnNavigation: config.closeOnNavigation,
            hasBackdrop: this.isModal(),
            backdropClass: 'bg-(--fdModal_BackgroundColor)'
        });
        if (this.bodyTemplate && this.body() && !this.template()) {
            this.overlayRef
                .attach(new TemplatePortal(this.bodyTemplate.template, this.bodyTemplate.vcr))
                .detectChanges();
        } else {
            const injector = Injector.create({
                providers: [{ provide: FD_POPOVER, useValue: this }],
                parent: this.injector
            });
            this.overlayRef.attach(new ComponentPortal(PopoverBody, null, injector));
        }
        const body = this.body();
        if (body) this.configureBody(body, config, this.text(), this.template());
        this.isOpen.set(true);
        this.trackPosition(strategy);
        this.listenForClose(trigger);
        this.setupOverlayHover();
        this.fillWidth(trigger);
        this.setModal(true);
        if (config.focusAutoCapture) {
            this.lastFocused = document.activeElement as HTMLElement | null;
            this.body()?.focusFirstTabbable();
        }
        this.overlayRef.updatePosition();
    }

    close(restoreFocus = true): void {
        if (!this.overlayRef) return;
        this.detach(restoreFocus);
        this.isOpen.set(false);
    }

    toggle(openAction = true, closeAction = true, restoreFocus = true): void {
        if (this.isOpen()) {
            if (closeAction) this.close(restoreFocus);
        } else if (openAction) {
            this.open();
        }
    }

    setIgnoreTriggers(ignore: boolean): void {
        this.ignoreTriggers = ignore;
    }

    refreshPosition(): void {
        this.overlayRef?.updatePosition();
    }

    applyNewPosition(positions: ConnectedPosition[]): void {
        if (!this.overlayRef) return;
        const strategy = this.positionStrategy(positions);
        this.overlayRef.updatePositionStrategy(strategy);
        this.trackPosition(strategy);
    }

    /** The overlay pane element while open. */
    get overlayElement(): HTMLElement | null {
        return this.overlayRef?.overlayElement ?? null;
    }

    private configureBody(
        body: PopoverBody,
        config: Required<PopoverConfig>,
        text: string | null,
        template: TemplateRef<unknown> | null
    ): void {
        body.noArrow.set(config.noArrow);
        body.focusTrapped.set(config.focusTrapped);
        body.closeOnEscape.set(config.closeOnEscapeKey);
        body.disableScrollbar.set(config.disableScrollbar);
        body.resizable.set(config.resizable);
        body.role.set(config.bodyRole);
        body.ariaLabel.set(config.bodyAriaLabel);
        body.ariaLabelledBy.set(config.bodyAriaLabelledBy);
        body.bodyId.set(config.bodyId);
        body.bodyMaxWidth.set(config.maxWidth);
        body.fillMode.set(config.fillControlMode);
        body.additionalClass.set(config.additionalBodyClass);
        body.text.set(text);
        body.template.set(template);
    }

    private listen(el: HTMLElement | null, triggers: TriggerConfig[]): void {
        this.removeListeners();
        if (!el) return;
        const hover = triggers.some((t) => t.trigger === 'mouseenter' || t.trigger === 'mouseleave');
        for (const t of triggers) {
            this.listeners.push(
                this.renderer.listen(el, t.trigger, (event: Event) => {
                    if (this.ignoreTriggers || this.config().disabled) return;
                    if (hover && t.trigger === 'mouseenter' && t.openAction) {
                        this.clearHoverTimer();
                        if (!this.isOpen()) this.open();
                    } else if (hover && t.trigger === 'mouseleave' && t.closeAction) {
                        this.scheduleHoverClose();
                    } else {
                        this.toggle(t.openAction, t.closeAction, t.trigger !== 'focusout');
                    }
                    if (t.stopPropagation) event.stopImmediatePropagation();
                })
            );
        }
    }

    private removeListeners(): void {
        this.listeners.forEach((off) => off());
        this.listeners = [];
    }

    private detach(restoreFocus: boolean): void {
        if (!this.overlayRef) return;
        this.closed$.next();
        this.closeRequest?.unsubscribe();
        this.closeRequest = null;
        this.clearHoverTimer();
        this.overlayRef.dispose();
        this.overlayRef = null;
        this.setModal(false);
        const config = this.config();
        if (restoreFocus && config.restoreFocusOnClose && config.focusAutoCapture && this.lastFocused) {
            this.lastFocused.focus();
        }
        this.lastFocused = null;
    }

    private positionStrategy(forced?: ConnectedPosition[]): FlexibleConnectedPositionStrategy {
        const config = this.config();
        let positions = forced ??
            config.cdkPositions ?? [getCdkPlacement(config.placement ?? 'bottom-start', this.direction())];
        if (!config.fixedPosition) positions = withFallbackPositions(positions);
        const appendTo = config.appendTo;
        const anchor = appendTo
            ? appendTo instanceof ElementRef
                ? appendTo.nativeElement
                : appendTo
            : this.triggerElement()!;
        return this.overlay
            .position()
            .flexibleConnectedTo(anchor)
            .withPositions(positions)
            .withPush(false)
            .withGrowAfterOpen(true);
    }

    private trackPosition(strategy: FlexibleConnectedPositionStrategy): void {
        strategy.positionChanges.pipe(takeUntil(this.closed$)).subscribe((change: ConnectedOverlayPositionChange) => {
            const { side, align } = arrowFor(change.connectionPair);
            this.body()?.arrowSide.set(side);
            this.body()?.arrowAlign.set(align);
        });
    }

    private listenForClose(trigger: HTMLElement): void {
        const ref = this.overlayRef!;
        merge(
            ref.detachments(),
            ref.keydownEvents().pipe(filter((e) => e.key === 'Escape' && this.config().closeOnEscapeKey))
        )
            .pipe(takeUntil(this.closed$))
            .subscribe(() => this.close());
        ref.outsidePointerEvents()
            .pipe(
                filter((e) => this.config().closeOnOutsideClick && !trigger.contains(e.composedPath()[0] as Node)),
                takeUntil(this.closed$)
            )
            .subscribe(() => {
                // restore focus only when it is still inside the popover or on the trigger
                const active = document.activeElement;
                this.close(
                    !active ||
                        active === document.body ||
                        active.contains(trigger) ||
                        ref.overlayElement.contains(active)
                );
            });
        this.closeRequest = this.body()?.closeRequest.subscribe(() => this.close()) ?? null;
    }

    private setupOverlayHover(): void {
        const triggers = normalizeTriggers(this.config().triggers);
        if (!this.overlayRef || !triggers.some((t) => t.trigger === 'mouseenter' || t.trigger === 'mouseleave')) return;
        const el = this.overlayRef.overlayElement;
        const enter = this.renderer.listen(el, 'mouseenter', () => this.clearHoverTimer());
        const leave = this.renderer.listen(el, 'mouseleave', () => this.scheduleHoverClose());
        this.closed$.pipe(take(1)).subscribe(() => {
            enter();
            leave();
        });
    }

    private scheduleHoverClose(): void {
        this.clearHoverTimer();
        this.hoverCloseTimer = setTimeout(() => {
            this.hoverCloseTimer = null;
            this.close();
        }, 50);
    }

    private clearHoverTimer(): void {
        if (this.hoverCloseTimer !== null) {
            clearTimeout(this.hoverCloseTimer);
            this.hoverCloseTimer = null;
        }
    }

    private fillWidth(trigger: HTMLElement): void {
        const { fillControlMode, maxWidth } = this.config();
        const body = this.body();
        if (!body || !fillControlMode || fillControlMode === 'fit-content') return;
        const update = () => body.fillWidth.set(Math.min(trigger.offsetWidth, maxWidth ?? Number.MAX_SAFE_INTEGER));
        update();
        const observer = new ResizeObserver(update);
        observer.observe(trigger);
        this.closed$.pipe(take(1)).subscribe(() => observer.disconnect());
    }

    /** Modal popovers dim the page; only when outside click or Escape cannot close them. */
    private isModal(): boolean {
        const c = this.config();
        return c.applyOverlay && (!c.closeOnOutsideClick || !c.closeOnEscapeKey);
    }

    /** Keeps the trigger above the dimmed page of a modal popover. */
    private setModal(open: boolean): void {
        if (!this.isModal()) return;
        const trigger = this.triggerElement();
        trigger?.classList.toggle('relative', open);
        trigger?.classList.toggle('z-[1001]', open);
    }
}

let nextId = 0;

/**
 * Popover: content in an overlay next to a trigger. Positioned with the CDK overlay, flips when it
 * does not fit, closes on outside click and Escape, and returns focus to the trigger.
 *
 * ```html
 * <fd-popover placement="bottom-start">
 *   <fd-popover-control><button fdButton label="Open"></button></fd-popover-control>
 *   <fd-popover-body><div class="p-4">Content</div></fd-popover-body>
 * </fd-popover>
 *
 * <button fdButton [fdPopoverTrigger]="pop" label="External trigger"></button>
 * <fd-popover #pop><fd-popover-body>...</fd-popover-body></fd-popover>
 * ```
 */
@Component({
    selector: 'fd-popover',
    exportAs: 'fdPopover',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [PopoverService, { provide: FD_POPOVER, useExisting: PopoverService }],
    host: {
        '[class]': 'hostClass()',
        '[attr.id]': 'id()',
        '(keydown.escape)': 'onEscape($event)',
        '(keydown.space)': 'onControlKey($event)',
        '(keydown.enter)': 'onControlKey($event)'
    },
    template: `
        @if (!trigger()) {
            <div #origin [class]="controlClass()" (keydown)="onTriggerKeydown($event)">
                <ng-content select="fd-popover-control, [fdPopoverControl]" />
            </div>
        }
        <ng-template #bodyTemplate>
            <ng-content select="fd-popover-body" />
            <ng-content />
        </ng-template>
    `
})
export class Popover {
    /** Element id; also referenced by aria-controls of the trigger. */
    readonly id = input(`fd-popover-${nextId++}`);
    /** Opens and closes the popover; two-way bindable. */
    readonly isOpen = model(false);
    /** All options at once; individual inputs take precedence when set. */
    readonly config = input<PopoverConfig>({});
    /** Preferred placement. The popover flips when it does not fit. */
    readonly placement = input<Placement | undefined>(undefined);
    /** Exact CDK positions; replaces `placement`. */
    readonly cdkPositions = input<ConnectedPosition[] | null | undefined>(undefined);
    /** Keeps the placement even when it does not fit. */
    readonly fixedPosition = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
    /** Events on the trigger that open/close the popover (default: click). */
    readonly triggers = input<(string | TriggerConfig)[] | undefined>(undefined);
    /** External trigger element; used instead of `fd-popover-control`. */
    readonly trigger = model<ElementRef<HTMLElement> | HTMLElement | null>(null);
    /** Element the popover is positioned against, when different from the trigger. */
    readonly appendTo = input<ElementRef<HTMLElement> | HTMLElement | null | undefined>(undefined);
    readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
    /** Hides the arrow (default true, as in fundamental-ngx). */
    readonly noArrow = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
    readonly closeOnOutsideClick = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
    readonly closeOnEscapeKey = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
    /** Keeps Tab inside the body (default true). */
    readonly focusTrapped = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
    /** Moves focus into the body when it opens (default true). */
    readonly focusAutoCapture = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
    /** Returns focus to the previously focused element on close (default true). */
    readonly restoreFocusOnClose = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
    /** Body width relative to the trigger. */
    readonly fillControlMode = input<PopoverFillMode | null | undefined>(undefined);
    /** Maximum body width in px. */
    readonly maxWidth = input<number | null | undefined>(undefined);
    /** Renders the content without the scrolling wrapper. */
    readonly disableScrollbar = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
    /** Lets the user resize the body with a corner handle. */
    readonly resizable = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
    /** Dims the page while open, when outside click or Escape closing is disabled. */
    readonly applyOverlay = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
    readonly scrollStrategy = input<ScrollStrategy | null | undefined>(undefined);
    readonly closeOnNavigation = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
    /** Prevents page scrolling when Space toggles the popover. */
    readonly preventSpaceKeyScroll = input(true, { transform: booleanAttribute });
    readonly additionalBodyClass = input<string | null | undefined>(undefined);
    readonly additionalTriggerClass = input<string | null>(null);
    readonly bodyRole = input<PopoverBodyRole | (string & {}) | null | undefined>(undefined);
    readonly bodyAriaLabel = input<string | null | undefined>(undefined);
    readonly bodyAriaLabelledBy = input<string | null | undefined>(undefined);
    /** Plain text content, for simple popovers without a body. */
    readonly text = input<string | null>(null);
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly beforeOpen = output<void>();

    readonly service = inject(PopoverService);
    readonly control = contentChild(PopoverControl);
    private readonly projectedBody = contentChild(PopoverBody);
    private readonly origin = viewChild<ElementRef<HTMLElement>>('origin');
    private readonly bodyTemplate = viewChild.required<TemplateRef<unknown>>('bodyTemplate');
    private readonly vcr = inject(ViewContainerRef);

    protected readonly hostClass = computed(() => cn('relative inline-block max-w-full', this.userClass()));
    protected readonly controlClass = computed(() =>
        cn(
            'relative cursor-pointer focus-visible:outline-sap [&>a]:whitespace-nowrap',
            this.disabled() && 'cursor-auto pointer-events-none',
            this.additionalTriggerClass()
        )
    );

    constructor() {
        // inputs and config -> service; an input left unset keeps the value of the config object
        effect(() => {
            const inputs: PopoverConfig = {
                placement: this.placement(),
                cdkPositions: this.cdkPositions(),
                fixedPosition: this.fixedPosition(),
                triggers: this.triggers(),
                disabled: this.disabled(),
                noArrow: this.noArrow(),
                closeOnOutsideClick: this.closeOnOutsideClick(),
                closeOnEscapeKey: this.closeOnEscapeKey(),
                closeOnNavigation: this.closeOnNavigation(),
                focusTrapped: this.focusTrapped(),
                focusAutoCapture: this.focusAutoCapture(),
                restoreFocusOnClose: this.restoreFocusOnClose(),
                fillControlMode: this.fillControlMode(),
                maxWidth: this.maxWidth(),
                disableScrollbar: this.disableScrollbar(),
                resizable: this.resizable(),
                applyOverlay: this.applyOverlay(),
                scrollStrategy: this.scrollStrategy(),
                appendTo: this.appendTo(),
                additionalBodyClass: this.additionalBodyClass(),
                bodyRole: this.bodyRole(),
                bodyAriaLabel: this.bodyAriaLabel(),
                bodyAriaLabelledBy: this.bodyAriaLabelledBy(),
                bodyId: `${this.id()}-body`
            };
            const set = Object.fromEntries(Object.entries(inputs).filter(([, v]) => v !== undefined));
            this.service.refreshConfiguration({ ...this.config(), ...set });
        });
        // content without <fd-popover-body> renders inside a default body
        effect(() => {
            this.service.text.set(this.text());
            this.service.template.set(this.projectedBody() ? null : this.bodyTemplate());
        });
        // trigger element
        effect(() => {
            const t = this.trigger();
            const el = t ? (t instanceof ElementRef ? t.nativeElement : t) : this.origin()?.nativeElement;
            if (el) this.service.initialise(el, { template: this.bodyTemplate(), vcr: this.vcr });
        });
        // isOpen model <-> service
        let previous = false;
        effect(() => {
            const open = this.isOpen();
            untracked(() => {
                if (open && !previous) this.beforeOpen.emit();
                previous = open;
                if (open && !this.service.isOpen()) this.service.open();
                if (!open && this.service.isOpen()) this.service.close();
            });
        });
        effect(() => {
            const open = this.service.isOpen();
            untracked(() => {
                if (open !== this.isOpen()) {
                    if (open) this.beforeOpen.emit();
                    previous = open;
                    this.isOpen.set(open);
                }
            });
        });
        afterNextRender(() => {
            const triggers = this.service.config().triggers;
            if (triggers.some((t) => (typeof t === 'string' ? t : t.trigger) === 'click'))
                this.control()?.makeTabbable();
        });
    }

    open(): void {
        this.service.open();
    }

    close(restoreFocus = true): void {
        this.service.close(restoreFocus);
    }

    toggle(): void {
        this.service.toggle();
    }

    setIgnoreTriggers(ignore: boolean): void {
        this.service.setIgnoreTriggers(ignore);
    }

    refreshPosition(): void {
        this.service.refreshPosition();
    }

    applyNewPosition(positions: ConnectedPosition[]): void {
        this.service.applyNewPosition(positions);
    }

    /** Alt+ArrowDown opens the popover from the trigger. */
    onTriggerKeydown(event: KeyboardEvent): void {
        if (event.key === 'ArrowDown' && event.altKey && !this.service.config().disabled) {
            event.preventDefault();
            event.stopPropagation();
            this.open();
        }
    }

    protected onEscape(event: Event): void {
        if (this.service.config().closeOnEscapeKey && this.service.isOpen()) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.close();
        }
    }

    protected onControlKey(event: Event): void {
        if (!this.preventSpaceKeyScroll()) return;
        const active = document.activeElement as HTMLElement | null;
        const control = this.control()?.elementRef.nativeElement.children[0];
        if (control && control === active && !['INPUT', 'TEXTAREA', 'BUTTON', 'A'].includes(active.tagName)) {
            event.preventDefault();
            this.toggle();
        }
    }
}

/** Boolean input that stays undefined when not set, so a config object can supply the value. */
function optionalBoolean(value: unknown): boolean | undefined {
    return value === undefined ? undefined : booleanAttribute(value);
}

/**
 * Makes any element the trigger of a popover and exposes aria-haspopup/controls/expanded.
 *
 * ```html
 * <button fdButton [fdPopoverTrigger]="pop" label="More"></button>
 * <fd-popover #pop>...</fd-popover>
 * ```
 */
@Directive({
    selector: '[fdPopoverTrigger]',
    host: {
        '[attr.aria-haspopup]': 'popover() ? "true" : null',
        '[attr.aria-controls]': 'popover()?.id() ?? null',
        '[attr.aria-expanded]': 'popover() ? popover()!.isOpen() : null'
    }
})
export class PopoverTrigger {
    readonly popover = input<Popover | null | undefined>(null, { alias: 'fdPopoverTrigger' });
    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    constructor() {
        effect(() => {
            this.popover()?.trigger.set(this.elementRef);
        });
    }
}
