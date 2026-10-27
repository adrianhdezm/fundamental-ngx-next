/*
 * Port of @fundamental-ngx/core (message-toast) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Directionality } from '@angular/cdk/bidi';
import { type ConnectedPosition, Overlay, type OverlayRef, type PositionStrategy } from '@angular/cdk/overlay';
import { CdkPortalOutlet, ComponentPortal, TemplatePortal, type Portal } from '@angular/cdk/portal';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    Injectable,
    InjectionToken,
    Injector,
    TemplateRef,
    Type,
    ViewContainerRef,
    afterNextRender,
    computed,
    inject,
    input,
    signal,
    viewChild,
    type Provider
} from '@angular/core';
import { Subject, type Observable } from 'rxjs';
import { cn } from '@/lib/utils';

/** Corner or edge of the screen where toasts appear; new toasts stack away from it. */
export type MessageToastPlacement =
    'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

/** A custom place on the screen, in CSS lengths. */
export interface MessageToastGlobalPosition {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    /** Centres horizontally. */
    center?: boolean;
}

/** Toasts next to an element. */
export interface MessageToastBoundPosition extends ConnectedPosition {
    boundTo: HTMLElement;
}

export type MessageToastPosition = MessageToastPlacement | MessageToastGlobalPosition | MessageToastBoundPosition;

export interface MessageToastConfig<T = unknown> {
    data?: T;
    ariaLabel?: string;
    id?: string;
    /** Where the toast appears (default bottom-center). */
    position?: MessageToastPosition;
    /** Time in ms before the toast disappears; 0 keeps it open (default 3000). */
    duration?: number;
    /** Keeps the toast open while the pointer is over it (default true). */
    mousePersist?: boolean;
    /** Slides the toast in (default false). */
    animated?: boolean;
    width?: string;
    minWidth?: string;
    maxWidth?: string;
    height?: string;
    minHeight?: string;
    maxHeight?: string;
}

const DEFAULT_CONFIG: MessageToastConfig = { duration: 3000, mousePersist: true, animated: false };

export const MESSAGE_TOAST_CONFIG = new InjectionToken<MessageToastConfig>('FdMessageToastConfig');
/** Data of a toast opened from a component. */
export const MESSAGE_TOAST_DATA = new InjectionToken<unknown>('FdMessageToastData');

/** App-wide toast defaults. */
export function provideMessageToastConfig(config: MessageToastConfig): Provider {
    return { provide: MESSAGE_TOAST_CONFIG, useValue: config };
}

/** Handle of an open toast, injectable in toast components. */
export class MessageToastRef<D = any> {
    readonly data: D;
    private readonly dismissed = new Subject<void>();
    private readonly opened = new Subject<void>();
    private timer: ReturnType<typeof setTimeout> | null = null;
    /** @internal */
    _onDismiss: () => void = () => {};

    /** Emits when the toast closes, also after its duration. */
    readonly afterTimeout: Observable<void> = this.dismissed.asObservable();

    constructor(data: D) {
        this.data = data;
    }

    afterDismissed(): Observable<void> {
        return this.dismissed.asObservable();
    }

    afterOpened(): Observable<void> {
        return this.opened.asObservable();
    }

    dismiss(): void {
        if (this.dismissed.closed) return;
        this.cancelDismiss();
        this._onDismiss();
    }

    /** Closes the toast after a time in ms. */
    dismissAfter(duration: number): void {
        this.cancelDismiss();
        this.timer = setTimeout(() => this.dismiss(), Math.min(duration, 2 ** 31 - 1));
    }

    cancelDismiss(): void {
        if (this.timer !== null) clearTimeout(this.timer);
        this.timer = null;
    }

    /** @internal */
    _opened(): void {
        this.opened.next();
        this.opened.complete();
    }

    /** @internal */
    _dismissed(): void {
        this.dismissed.next();
        this.dismissed.complete();
    }
}

/** Types the context of a toast template: `let-toast` is the ref. */
@Directive({ selector: '[fdMessageToastTemplate]' })
export class MessageToastTemplate {
    static ngTemplateContextGuard(_dir: MessageToastTemplate, ctx: unknown): ctx is { $implicit: MessageToastRef } {
        return true;
    }
}

const CONFIG = new InjectionToken<MessageToastConfig>('FdMessageToastInstanceConfig');

/** A message toast: a short message that disappears by itself. */
@Component({
    selector: 'fd-message-toast',
    imports: [CdkPortalOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'alert',
        'aria-live': 'polite',
        tabindex: '-1',
        '[attr.id]': 'id',
        '[attr.aria-label]': 'config.ariaLabel || null',
        '[style.width]': 'config.width',
        '[style.min-width]': 'config.minWidth',
        '[style.max-width]': 'config.maxWidth',
        '[style.height]': 'config.height',
        '[style.min-height]': 'config.minHeight',
        '[style.max-height]': 'config.maxHeight',
        '[class]': 'computedClass',
        '(mouseover)': 'onMouseover()',
        '(mouseleave)': 'onMouseleave()'
    },
    template: `
        @if (text(); as t) {
            {{ t }}
        } @else {
            <ng-template [cdkPortalOutlet]="portal()" />
        }
    `
})
export class MessageToast {
    readonly config = inject(CONFIG);
    readonly ref = inject(MessageToastRef);
    readonly text = signal<string | null>(null);
    readonly portal = signal<Portal<unknown> | null>(null);
    protected readonly id = this.config.id ?? `fd-message-toast-${nextId++}`;
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    protected readonly computedClass = cn(
        'pointer-events-auto m-0 box-border inline-flex w-auto max-w-60 p-4 outline-none',
        'rounded-sap-element-border-corner-radius bg-sap-indication-color-9-background shadow-(--sapContent_Lite_Shadow)',
        'text-center font-sap-font-family text-sap-font-size text-sap-content-contrast-text-color'
    );

    constructor() {
        afterNextRender(() => {
            const done = () => {
                this.ref._opened();
                const duration = this.config.duration ?? 0;
                // a toast hovered before it finished opening waits for the mouse to leave
                if (duration > 0 && !(this.config.mousePersist && this.hovered)) this.ref.dismissAfter(duration);
            };
            if (this.config.animated && this.el.animate) {
                this.el
                    .animate(
                        [
                            { opacity: 0, transform: 'translateY(1rem)' },
                            { opacity: 1, transform: 'translateY(0)' }
                        ],
                        { duration: 150, easing: 'cubic-bezier(0, 0, 0.2, 1)' }
                    )
                    .finished.then(done, done);
            } else {
                done();
            }
        });
    }

    private hovered = false;

    protected onMouseover(): void {
        this.hovered = true;
        if (this.config.mousePersist) this.ref.cancelDismiss();
    }

    protected onMouseleave(): void {
        this.hovered = false;
        const duration = this.config.duration ?? 0;
        if (this.config.mousePersist && duration > 0) this.ref.dismissAfter(duration);
    }

    /** Fades out; resolves when the toast can be removed. */
    exit(): Promise<void> {
        const animation = this.config.animated
            ? this.el.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration: 75, fill: 'forwards' })
            : undefined;
        return animation
            ? animation.finished.then(
                  () => undefined,
                  () => undefined
              )
            : Promise.resolve();
    }
}
let nextId = 0;

/** The column of toasts at one position. */
@Component({
    selector: 'fd-message-toast-stack',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: '<ng-container #outlet />'
})
export class MessageToastStack {
    /** New toasts are added above the older ones. */
    readonly upwards = input(false);
    readonly align = input<'start' | 'center' | 'end'>('center');
    readonly outlet = viewChild.required('outlet', { read: ViewContainerRef });
    protected readonly computedClass = computed(() =>
        cn(
            'pointer-events-none flex gap-4',
            this.upwards() ? 'flex-col-reverse' : 'flex-col',
            { start: 'items-start', center: 'items-center', end: 'items-end' }[this.align()]
        )
    );
}

const PLACEMENT: Record<MessageToastPlacement, MessageToastGlobalPosition> = {
    'top-left': { top: '1rem', left: '1rem' },
    'top-center': { top: '1rem', center: true },
    'top-right': { top: '1rem', right: '1rem' },
    'bottom-left': { bottom: '1rem', left: '1rem' },
    'bottom-center': { bottom: '1rem', center: true },
    'bottom-right': { bottom: '1rem', right: '1rem' }
};

interface Stack {
    overlay: OverlayRef;
    stack: MessageToastStack;
    toasts: MessageToastRef[];
}

/**
 * Opens message toasts from a string, a component or a template. Toasts at the same position
 * stack; bottom positions grow upwards.
 *
 * ```ts
 * inject(MessageToastService).open('Order saved', { duration: 5000 });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MessageToastService {
    private readonly overlay = inject(Overlay);
    private readonly injector = inject(Injector);
    private readonly defaults = inject(MESSAGE_TOAST_CONFIG, { optional: true });
    private readonly stacks = new Map<unknown, Stack>();
    private defaultPosition: MessageToastPosition = 'bottom-center';
    private readonly open$ = signal(0);

    /** Number of open toasts. */
    readonly openCount = computed(() => this.open$());

    constructor() {
        inject(DestroyRef).onDestroy(() => this.hideAll());
    }

    open<D = any>(
        content: string | Type<unknown> | TemplateRef<any>,
        config?: MessageToastConfig<D>
    ): MessageToastRef<D> {
        const merged = { ...DEFAULT_CONFIG, ...this.defaults, ...config } as MessageToastConfig<D>;
        const ref = new MessageToastRef<D>((typeof content === 'string' ? content : merged.data) as D);
        const position = merged.position ?? this.defaultPosition;
        const stack = this.stackFor(position);

        const injector = Injector.create({
            providers: [
                { provide: MessageToastRef, useValue: ref },
                { provide: CONFIG, useValue: merged },
                { provide: MESSAGE_TOAST_DATA, useValue: merged.data }
            ],
            parent: this.injector
        });
        const toastRef = stack.stack.outlet().createComponent(MessageToast, { injector });
        const toast = toastRef.instance;
        if (typeof content === 'string') toast.text.set(content);
        else if (content instanceof TemplateRef)
            toast.portal.set(new TemplatePortal(content, stack.stack.outlet(), { $implicit: ref }, injector));
        else toast.portal.set(new ComponentPortal(content, null, injector));
        toastRef.changeDetectorRef.detectChanges();

        stack.toasts.push(ref);
        this.open$.update((n) => n + 1);
        ref._onDismiss = () => {
            toast.exit().then(() => {
                toastRef.destroy();
                stack.toasts.splice(stack.toasts.indexOf(ref), 1);
                this.open$.update((n) => n - 1);
                ref._dismissed();
                if (!stack.toasts.length) {
                    stack.overlay.dispose();
                    this.stacks.forEach((s, key) => s === stack && this.stacks.delete(key));
                }
            });
        };
        return ref;
    }

    /** Closes all open toasts. */
    hideAll(): void {
        this.stacks.forEach((stack) => [...stack.toasts].forEach((ref) => ref.dismiss()));
    }

    hasOpenMessageToasts(): boolean {
        return this.open$() > 0;
    }

    /** Position of toasts opened without a position. */
    setNewPositionStrategy(position: MessageToastPosition): void {
        this.defaultPosition = position;
    }

    private stackFor(position: MessageToastPosition): Stack {
        const key =
            typeof position === 'string' ? position : ((position as MessageToastBoundPosition).boundTo ?? position);
        const existing = this.stacks.get(key);
        if (existing) return existing;

        const global = typeof position === 'string' ? PLACEMENT[position] : position;
        let strategy: PositionStrategy;
        let upwards = false;
        let align: 'start' | 'center' | 'end' = 'center';
        if ('boundTo' in global) {
            const bound = global as MessageToastBoundPosition;
            strategy = this.overlay
                .position()
                .flexibleConnectedTo(bound.boundTo)
                .withPositions([bound])
                .withPush(false);
            upwards = bound.overlayY === 'bottom';
            align = bound.overlayX === 'center' ? 'center' : bound.overlayX;
        } else {
            const g = this.overlay.position().global();
            if (global.top) g.top(global.top);
            if (global.bottom) g.bottom(global.bottom);
            if (global.left) g.left(global.left);
            if (global.right) g.right(global.right);
            if (global.center) g.centerHorizontally();
            strategy = g;
            upwards = !global.top && !!global.bottom;
            align = global.center ? 'center' : global.right && !global.left ? 'end' : 'start';
        }
        const overlay = this.overlay.create({
            positionStrategy: strategy,
            panelClass: 'pointer-events-none',
            direction: this.injector.get(Directionality, null)?.value ?? 'ltr'
        });
        const stackRef = overlay.attach(new ComponentPortal(MessageToastStack, null, this.injector));
        stackRef.setInput('upwards', upwards);
        stackRef.setInput('align', align);
        stackRef.changeDetectorRef.detectChanges();
        const stack: Stack = { overlay, stack: stackRef.instance, toasts: [] };
        this.stacks.set(key, stack);
        return stack;
    }
}
