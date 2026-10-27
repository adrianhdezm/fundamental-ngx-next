/*
 * Port of @fundamental-ngx/core (dialog) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { Overlay } from '@angular/cdk/overlay';
import { CdkPortalOutlet, ComponentPortal, TemplatePortal, type Portal } from '@angular/cdk/portal';
import { DOCUMENT, Location, NgTemplateOutlet } from '@angular/common';
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
    booleanAttribute,
    computed,
    contentChild,
    inject,
    input,
    signal,
    viewChild,
    type Provider,
    type Signal
} from '@angular/core';
import { BehaviorSubject, Subject, type Observable } from 'rxjs';
import { cn, type ClassValue } from '@/lib/utils';
import { BarLeft, BarMiddle, BarRight, Bar, BarElement, ButtonBar } from '@/ui/bar/bar';
import { BusyIndicator } from '@/ui/busy-indicator/busy-indicator';
import { Button, buttonVariants } from '@/ui/button/button';
import { Icon } from '@/ui/icon/icon';
import { FD_DEFAULT_TITLE_SIZE, Title } from '@/ui/title/title';

type DimensionValue = string | number;

/** Position of the dialog window in its backdrop; values are CSS lengths or pixels. */
export interface DialogPosition {
    top?: DimensionValue;
    bottom?: DimensionValue;
    left?: DimensionValue;
    right?: DimensionValue;
}

export type DialogDensity = 'cozy' | 'compact';

/** Options of a dialog. Provide app-wide defaults with `provideDialogDefaultConfig()`. */
export interface DialogConfig<T = unknown> {
    id?: string;
    data?: T;
    width?: DimensionValue;
    height?: DimensionValue;
    minWidth?: DimensionValue;
    minHeight?: DimensionValue;
    maxWidth?: DimensionValue;
    maxHeight?: DimensionValue;
    /** Places the window instead of centring it. */
    position?: DialogPosition;
    ariaLabel?: string | null;
    /** Id of the element that names the dialog; an `fd-dialog-title` sets it when empty. */
    ariaLabelledBy?: string | null;
    ariaDescribedBy?: string | null;
    /** Dims the page behind the dialog (default true). */
    hasBackdrop?: boolean;
    /** Dismisses the dialog with the reason "backdrop" on a backdrop click (default false). */
    backdropClickCloseable?: boolean;
    /** Classes for the backdrop (the `fd-dialog` element). */
    backdropClass?: string;
    /** Classes for the dialog window. */
    dialogPanelClass?: string;
    /** Dismisses the dialog with the reason "escape" on Escape (default true). */
    escKeyCloseable?: boolean;
    /** Keeps the focus inside the dialog and restores it when the dialog closes (default true). */
    focusTrapped?: boolean;
    /** Element the dialog is rendered in, instead of the overlay container. */
    container?: HTMLElement | 'body';
    /** Full-screen window for phones. */
    mobile?: boolean;
    /** Keeps the outer spacing and rounded corners of a mobile dialog. */
    mobileOuterSpacing?: boolean;
    verticalPadding?: boolean;
    horizontalPadding?: boolean;
    /** No paddings around the body content. */
    disablePaddings?: boolean;
    /** Horizontal paddings that follow the window width (1rem, 2rem or 3rem). */
    responsivePadding?: boolean;
    bodyMinHeight?: string;
    /** Dismisses the dialog with the reason "navigation change" when the URL changes (default true). */
    closeOnNavigation?: boolean;
    /** Forces a density inside the dialog. */
    contentDensity?: DialogDensity;
    /** The window can be dragged by its header. */
    draggable?: boolean;
    /** The window can be resized from its bottom corner. */
    resizable?: boolean;
}

const DEFAULT_CONFIG: DialogConfig = {
    hasBackdrop: true,
    backdropClickCloseable: false,
    escKeyCloseable: true,
    focusTrapped: true,
    container: 'body',
    verticalPadding: true,
    horizontalPadding: true,
    disablePaddings: false,
    responsivePadding: false,
    closeOnNavigation: true
};

export const DIALOG_DEFAULT_CONFIG = new InjectionToken<DialogConfig>('FdDialogDefaultConfig');

/** App-wide dialog defaults. */
export function provideDialogDefaultConfig(config: DialogConfig): Provider {
    return { provide: DIALOG_DEFAULT_CONFIG, useValue: config };
}

export enum DialogDismissReason {
    ESCAPE = 'escape',
    BACKDROP = 'backdrop',
    NAVIGATION_CHANGE = 'navigation change',
    SERVICE_DESTROYED = 'service destroyed'
}

export type DialogStatus = 'pending' | 'loaded' | 'closed' | 'dismissed';

export interface DialogCloseResult<P> {
    status: 'closed' | 'dismissed';
    value?: P;
    reason?: unknown;
}

export interface DialogLoadingConfig {
    isLoading: boolean;
    loadingLabel?: string;
    /** Text shown above the busy indicator. */
    loadingContent?: string;
}

/**
 * Handle of an open dialog, injectable inside it (or `let-dialog` in a dialog template).
 * `afterClosed` emits the result of `close()` and errors with the reason of `dismiss()`.
 */
export class DialogRef<T = any, P = any> {
    data: T | undefined;

    private readonly _status = signal<DialogStatus>('pending');
    private readonly _closeResult = signal<DialogCloseResult<P> | null>(null);
    private readonly _hidden = new BehaviorSubject(false);
    private readonly _fullScreen = new BehaviorSubject(false);
    private readonly _loading = new BehaviorSubject<DialogLoadingConfig>({ isLoading: false });
    private readonly _afterClosed = new Subject<P | undefined>();
    private readonly _afterLoaded = new Subject<boolean>();
    private readonly _hiddenSignal = signal(false);
    private readonly _fullScreenSignal = signal(false);
    private readonly _loadingSignal = signal<DialogLoadingConfig>({ isLoading: false });

    readonly status: Signal<DialogStatus> = this._status.asReadonly();
    readonly closeResult = this._closeResult.asReadonly();
    readonly isLoaded = computed(() => this._status() !== 'pending');
    readonly isClosed = computed(() => this._status() === 'closed' || this._status() === 'dismissed');
    readonly isOpen = computed(() => this.isLoaded() && !this.isClosed());
    readonly isHidden = this._hiddenSignal.asReadonly();
    readonly isFullScreen = this._fullScreenSignal.asReadonly();
    readonly loadingState = this._loadingSignal.asReadonly();

    readonly afterClosed: Observable<P | undefined> = this._afterClosed.asObservable();
    readonly afterLoaded: Observable<boolean> = this._afterLoaded.asObservable();
    readonly onHide: Observable<boolean> = this._hidden.asObservable();
    readonly fullScreen: Observable<boolean> = this._fullScreen.asObservable();
    readonly onLoading: Observable<DialogLoadingConfig> = this._loading.asObservable();

    /** @internal Ends the dialog: the service disposes it. */
    readonly _ended = new Subject<void>();

    get isLoading(): boolean {
        return this._loadingSignal().isLoading;
    }

    close(result?: P): void {
        if (this.isClosed()) return;
        this._status.set('closed');
        this._closeResult.set({ status: 'closed', value: result });
        this._end();
        this._afterClosed.next(result);
        this._afterClosed.complete();
    }

    dismiss(reason?: unknown): void {
        if (this.isClosed()) return;
        this._status.set('dismissed');
        this._closeResult.set({ status: 'dismissed', reason });
        this._end();
        this._afterClosed.error(reason);
    }

    /** Hides the dialog without closing it. */
    hide(isHidden: boolean): void {
        this._hiddenSignal.set(isHidden);
        this._hidden.next(isHidden);
    }

    /** Shows a busy indicator in the dialog body. */
    loading(state: boolean | DialogLoadingConfig): void {
        const value = typeof state === 'boolean' ? { isLoading: state } : state;
        this._loadingSignal.set(value);
        this._loading.next(value);
    }

    toggleFullScreen(): void {
        this._fullScreenSignal.update((v) => !v);
        this._fullScreen.next(this._fullScreenSignal());
    }

    /** @internal */
    _loaded(): void {
        if (this._status() !== 'pending') return;
        this._status.set('loaded');
        this._afterLoaded.next(true);
        this._afterLoaded.complete();
    }

    private _end(): void {
        this._ended.next();
        this._ended.complete();
    }
}

/** Content of a dialog built from an object: title, body template and footer buttons. */
export interface DialogDefaultContent {
    title?: string;
    titleId?: string;
    titleHeadingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    content?: TemplateRef<unknown>;
    contentId?: string;
    subHeader?: TemplateRef<unknown>;
    approveButton?: string;
    approveButtonId?: string;
    approveButtonAriaLabel?: string;
    approveButtonCallback?: () => void;
    cancelButton?: string;
    cancelButtonId?: string;
    cancelButtonAriaLabel?: string;
    cancelButtonCallback?: () => void;
    /** Shows a close button in the header. */
    closeButtonCallback?: () => void;
    closeButtonTitle?: string;
    closeButtonAriaLabel?: string;
    /** Shows a full-screen toggle in the header. */
    allowFullScreen?: boolean;
    fullScreenButtonCallback?: () => void;
    fullScreenExpandButtonText?: string;
    fullScreenMinifyButtonText?: string;
}

export type DialogContentType = TemplateRef<any> | Type<unknown> | DialogDefaultContent;

/** Context of a dialog template: `let-dialog` is the DialogRef, `let-dialogConfig="dialogConfig"` the config. */
export interface DialogTemplateContext<T = any> {
    $implicit: DialogRef<T>;
    dialogConfig: DialogConfig<T>;
}

/**
 * Types the context of a dialog template.
 *
 * ```html
 * <ng-template fdDialogTemplate let-dialog #tpl>
 *     <fd-dialog>...</fd-dialog>
 * </ng-template>
 * ```
 */
@Directive({ selector: '[fdDialogTemplate]' })
export class DialogTemplate {
    readonly templateRef = inject<TemplateRef<DialogTemplateContext>>(TemplateRef);
    static ngTemplateContextGuard(_dir: DialogTemplate, ctx: unknown): ctx is DialogTemplateContext {
        return true;
    }
}

/** The config of the dialog being rendered, provided by the service. */
const FD_DIALOG_CONFIG = new InjectionToken<DialogConfig>('FdDialogConfig');

function px(value: DimensionValue | undefined): string | null {
    return value === undefined || value === null ? null : typeof value === 'number' ? `${value}px` : value;
}

type PaddingSize = 's' | 'm' | 'l' | 'xl';
function widthToSize(width: number): PaddingSize {
    return width < 599 ? 's' : width < 1023 ? 'm' : width < 1439 ? 'l' : 'xl';
}
const PADDING: Record<PaddingSize, string> = { s: '1rem', m: '2rem', l: '2rem', xl: '3rem' };

/**
 * Opens dialogs from a template, a component or a `DialogDefaultContent` object.
 *
 * The dialog is rendered in the CDK overlay container and inherits the text direction of the
 * injector it is opened from: provide the service in a component (`providers: [DialogService]`)
 * or pass an injector to follow a local `dir`.
 *
 * ```ts
 * const ref = inject(DialogService).open(MyDialog, { data, width: '400px' });
 * ref.afterClosed.subscribe({ next: (result) => ..., error: (reason) => ... });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
    private readonly overlay = inject(Overlay);
    private readonly injector = inject(Injector);
    private readonly document = inject(DOCUMENT);
    private readonly defaults = inject(DIALOG_DEFAULT_CONFIG, { optional: true });
    private readonly _dialogs = signal<DialogRef[]>([]);

    /** Open dialogs, oldest first. */
    readonly dialogs = this._dialogs.asReadonly();
    readonly hasOpenDialogs = computed(() => this._dialogs().length > 0);
    readonly openDialogCount = computed(() => this._dialogs().length);

    constructor() {
        inject(DestroyRef).onDestroy(() => this.dismissAll(DialogDismissReason.SERVICE_DESTROYED));
    }

    open<T = any, P = any>(
        content: DialogContentType,
        config?: DialogConfig<T>,
        parentInjector?: Injector
    ): DialogRef<T, P> {
        const merged: DialogConfig<T> = { ...DEFAULT_CONFIG, ...this.defaults, ...config } as DialogConfig<T>;
        const ref = new DialogRef<T, P>();
        ref.data = merged.data;

        const injector = Injector.create({
            providers: [
                { provide: DialogRef, useValue: ref },
                { provide: FD_DIALOG_CONFIG, useValue: merged },
                { provide: DialogService, useValue: this }
            ],
            parent: parentInjector ?? this.injector
        });

        const overlayRef = this.overlay.create({ panelClass: 'fd-dialog-pane' });
        const target = merged.container;
        if (target && target !== 'body') {
            target.append(overlayRef.hostElement);
            // a dialog without backdrop in a container flows with the page content
            if (!merged.hasBackdrop) overlayRef.overlayElement.style.position = 'static';
        }
        const containerRef = overlayRef.attach(new ComponentPortal(DialogContainer, null, injector));
        containerRef.setInput('content', content);

        this._dialogs.update((list) => [...list, ref]);
        this.updateScrollLock();

        ref._ended.subscribe(() => {
            this._dialogs.update((list) => list.filter((r) => r !== ref));
            this.updateScrollLock();
            containerRef.instance.exit().then(() => overlayRef.dispose());
        });
        return ref;
    }

    dismissAll(reason?: unknown): void {
        [...this._dialogs()].forEach((ref) => ref.dismiss(reason));
    }

    private updateScrollLock(): void {
        this.document.documentElement.style.overflow = this._dialogs().length ? 'hidden' : '';
    }
}

/** Hosts the content of a dialog opened by the service and fades it in and out. */
@Component({
    selector: 'fd-dialog-container',
    imports: [CdkPortalOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'relative z-[999] block' },
    template: '<ng-template [cdkPortalOutlet]="portal()" />'
})
export class DialogContainer {
    readonly content = input.required<DialogContentType>();

    private readonly ref = inject(DialogRef);
    private readonly config = inject(FD_DIALOG_CONFIG);
    private readonly injector = inject(Injector);
    private readonly vcr = inject(ViewContainerRef);
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    protected readonly portal = computed<Portal<unknown>>(() => {
        const content = this.content();
        if (content instanceof TemplateRef) {
            const context: DialogTemplateContext = { $implicit: this.ref, dialogConfig: this.config };
            return new TemplatePortal(content, this.vcr, context, this.injector);
        }
        if (typeof content === 'function') return new ComponentPortal(content, null, this.injector);
        const portal = new ComponentPortal(DialogDefault, null, this.injector);
        this.defaultContent = content;
        return portal;
    });

    /** @internal Object content for the default dialog. */
    defaultContent: DialogDefaultContent | null = null;

    constructor() {
        afterNextRender(() => {
            this.el.animate?.([{ opacity: 0 }, { opacity: 1 }], {
                duration: 150,
                easing: 'cubic-bezier(0, 0, 0.2, 1)'
            });
        });
    }

    /** Fades out; resolves when the dialog can be removed. */
    exit(): Promise<void> {
        const animation = this.el.animate?.([{ opacity: 1 }, { opacity: 0 }], {
            duration: 75,
            easing: 'cubic-bezier(0.4, 0, 1, 1)',
            fill: 'forwards'
        });
        return animation
            ? animation.finished.then(
                  () => undefined,
                  () => undefined
              )
            : Promise.resolve();
    }
}

/**
 * Dialog: a modal window with a header, a scrolling body and a footer, opened by the
 * `DialogService`. Inside a dialog template bind `[dialogRef]` and `[dialogConfig]`, or let it
 * inject them.
 *
 * ```html
 * <fd-dialog>
 *     <fd-dialog-header><h1 fd-title>Title</h1></fd-dialog-header>
 *     <fd-dialog-body>Content</fd-dialog-body>
 *     <fd-dialog-footer><fd-button-bar variant="emphasized" label="OK" (click)="ref.close()" /></fd-dialog-footer>
 * </fd-dialog>
 * ```
 */
@Component({
    selector: 'fd-dialog',
    exportAs: 'fdDialog',
    imports: [CdkTrapFocus, CdkDrag, CdkDragHandle, Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'hostClass()',
        '[attr.dir]': 'dir()',
        '[attr.data-density]': 'config().contentDensity || null',
        '(keydown)': 'onKeydown($event)',
        '(mousedown)': 'onMousedown($event)'
    },
    template: `
        <div
            #window
            [id]="config().id"
            [attr.role]="role()"
            aria-modal="true"
            tabindex="-1"
            [attr.aria-label]="config().ariaLabel || null"
            [attr.aria-labelledby]="labelledBy()"
            [attr.aria-describedby]="describedBy()"
            [attr.aria-description]="ariaDescription() || (resizable() ? 'Resizable' : null)"
            [cdkTrapFocus]="trapped()"
            [cdkTrapFocusAutoCapture]="config().focusTrapped !== false"
            cdkDrag
            [cdkDragDisabled]="!draggable()"
            [cdkDragBoundary]="elementRef.nativeElement"
            (cdkDragStarted)="dragging.set(true)"
            (cdkDragEnded)="dragging.set(false)"
            [style.position]="config().position && !fullScreen() ? 'absolute' : null"
            [style.top]="fullScreen() ? null : pos('top')"
            [style.bottom]="fullScreen() ? null : pos('bottom')"
            [style.left]="fullScreen() ? null : pos('left')"
            [style.right]="fullScreen() ? null : pos('right')"
            [style.width]="size().width"
            [style.height]="size().height"
            [style.min-width]="minWidth()"
            [style.min-height]="minHeight()"
            [style.max-width]="maxWidth()"
            [style.max-height]="maxHeight()"
            [style.--dlg-px]="padding()"
            [class]="windowClass()"
        >
            @if (resizable()) {
                <span
                    role="presentation"
                    aria-hidden="true"
                    class="absolute -end-2 -bottom-2 z-[1001] flex size-6 cursor-se-resize items-start justify-start overflow-hidden rtl:cursor-sw-resize"
                    (pointerdown)="startResize($event)"
                >
                    <fd-icon glyph="resize-corner" class="size-4 text-sap-button-lite-text-color rtl:-scale-x-100" />
                </span>
            }
            <div cdkDragHandle [cdkDragHandleDisabled]="!draggable()" class="shrink-0">
                <ng-content select="fd-dialog-header" />
            </div>
            <ng-content select="fd-dialog-body" />
            <ng-content select="fd-dialog-footer" />
            <ng-content />
        </div>
    `
})
export class Dialog {
    /** The dialog's ref, for dialogs declared in a template; injected otherwise. */
    readonly dialogRefInput = input<DialogRef | null | undefined>(undefined, { alias: 'dialogRef' });
    /** The dialog's config, for dialogs declared in a template; injected otherwise. */
    readonly dialogConfigInput = input<DialogConfig | null | undefined>(undefined, { alias: 'dialogConfig' });
    readonly role = input<'dialog' | 'alertdialog'>('dialog');
    readonly ariaDescription = input<string | null>(null);
    /** Classes for the dialog window (the backdrop is the host). */
    readonly windowClass_ = input<ClassValue>('', { alias: 'windowClass' });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly injectedRef = inject(DialogRef, { optional: true });
    private readonly injectedConfig = inject(FD_DIALOG_CONFIG, { optional: true });
    private readonly service = inject(DialogService, { optional: true });
    private readonly direction = inject(Directionality, { optional: true });
    private readonly location = inject(Location, { optional: true });
    private readonly window = viewChild.required<ElementRef<HTMLElement>>('window');
    private readonly drag = viewChild.required(CdkDrag);

    readonly ref = computed(() => this.dialogRefInput() ?? this.injectedRef);
    readonly config = computed<DialogConfig>(() => ({
        ...DEFAULT_CONFIG,
        ...(this.dialogConfigInput() ?? this.injectedConfig ?? {})
    }));

    /** Id of the title, registered by `fd-dialog-title` when the config names none. */
    readonly titleId = signal<string | null>(null);
    protected readonly labelledBy = computed(() => this.config().ariaLabelledBy || this.titleId());
    /** Id of the element that describes the dialog, when the config names none. */
    readonly descriptionId = signal<string | null>(null);
    protected readonly describedBy = computed(() => this.config().ariaDescribedBy || this.descriptionId());

    protected readonly dragging = signal(false);
    private readonly resized = signal<{ width: string; height: string } | null>(null);
    private readonly paddingSize = signal<PaddingSize | null>(null);

    readonly mobile = computed(() => !!this.config().mobile);
    readonly fullScreen = computed(() => this.ref()?.isFullScreen() ?? false);
    protected readonly hidden = computed(() => this.ref()?.isHidden() ?? false);
    protected readonly draggable = computed(() => !!this.config().draggable && !this.fullScreen() && !this.mobile());
    protected readonly resizable = computed(() => !!this.config().resizable && !this.fullScreen() && !this.mobile());
    protected readonly trapped = computed(() => this.config().focusTrapped !== false && !this.hidden());
    protected readonly dir = computed(() => this.direction?.valueSignal() ?? 'ltr');
    protected readonly padding = computed(() => {
        const size = this.paddingSize();
        return this.config().responsivePadding && size ? PADDING[size] : null;
    });

    /** Only the oldest open dialog dims the page, so stacked dialogs keep one block layer. */
    private readonly showsBackdrop = computed(() => {
        const ref = this.ref();
        const open = this.service?.dialogs() ?? [];
        return !!this.config().hasBackdrop && (!ref || !open.includes(ref) || open[0] === ref);
    });

    protected readonly size = computed(() => {
        const resized = this.resized();
        if (resized && !this.fullScreen()) return resized;
        return { width: px(this.config().width), height: px(this.config().height) };
    });
    protected readonly minWidth = computed(() => px(this.config().minWidth));
    protected readonly minHeight = computed(() => px(this.config().minHeight));
    protected readonly maxWidth = computed(() => px(this.config().maxWidth));
    protected readonly maxHeight = computed(() => px(this.config().maxHeight));

    protected readonly hostClass = computed(() => {
        const config = this.config();
        const targeted = (config.container && config.container !== 'body') || !!config.position;
        return cn(
            'm-0 box-border p-0 font-sap-font-family text-sap-font-size text-sap-text-color',
            config.hasBackdrop
                ? 'fixed inset-0 z-[999] flex items-center justify-center'
                : targeted
                  ? 'relative inline-block'
                  : 'fixed start-1/2 top-1/2 z-[1000] block -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2',
            this.showsBackdrop() &&
                "before:absolute before:inset-0 before:bg-sap-block-layer-background before:opacity-(--sapBlockLayer_Opacity) before:content-['']",
            this.hidden() && 'hidden',
            config.backdropClass,
            this.userClass()
        );
    });

    protected readonly windowClass = computed(() => {
        const config = this.config();
        const full = this.mobile() || this.fullScreen();
        return cn(
            'relative m-0 box-border flex flex-col p-0 outline-none [--dlg-px:1rem]',
            'min-w-80 min-h-[7.5rem] max-w-[calc(100vw_-_10%)] max-h-[calc(100vh_-_6%)]',
            'rounded-sap-element-border-corner-radius shadow-sap-content-shadow3',
            !this.resizable() && 'overflow-hidden',
            full &&
                'fixed! inset-0! size-full! min-w-full! max-w-full! min-h-full! max-h-full! translate-none! rounded-none',
            full && '[&_[data-dialog-bar]]:rounded-none [&_[data-dialog-body]]:rounded-none',
            this.mobile() &&
                config.mobileOuterSpacing &&
                'rounded-sap-element-border-corner-radius max-w-[calc(100vw_-_10%)]! max-h-[calc(100vh_-_6%)]!',
            this.draggable() &&
                (this.dragging()
                    ? 'enabled-hover:[&_[data-dialog-header]]:cursor-grabbing'
                    : '[@media(hover:hover)]:[&_[data-dialog-header]]:cursor-grab'),
            config.dialogPanelClass,
            this.windowClass_()
        );
    });

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const el = this.window().nativeElement;
            if (this.config().focusTrapped === false) el.focus();
            if (this.config().responsivePadding) {
                const observer = new ResizeObserver(([entry]) =>
                    this.paddingSize.set(widthToSize(entry.contentRect.width))
                );
                observer.observe(el);
                destroyRef.onDestroy(() => observer.disconnect());
            }
            this.ref()?._loaded();
        });
        if (this.location) {
            const stop = this.location.onUrlChange(() => {
                if (this.config().closeOnNavigation) this.ref()?.dismiss(DialogDismissReason.NAVIGATION_CHANGE);
            });
            destroyRef.onDestroy(() => stop());
        }
    }

    protected pos(side: keyof DialogPosition): string | null {
        return px(this.config().position?.[side]);
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape' && this.config().escKeyCloseable) {
            event.stopPropagation();
            this.ref()?.dismiss(DialogDismissReason.ESCAPE);
        }
    }

    protected onMousedown(event: MouseEvent): void {
        if (this.config().backdropClickCloseable && event.target === this.elementRef.nativeElement) {
            this.ref()?.dismiss(DialogDismissReason.BACKDROP);
        }
    }

    /** Resizes from the bottom end corner; the window is pinned to its current place first. */
    protected startResize(event: PointerEvent): void {
        event.preventDefault();
        const el = this.window().nativeElement;
        const host = this.elementRef.nativeElement.getBoundingClientRect();
        const start = el.getBoundingClientRect();
        const rtl = this.dir() === 'rtl';
        this.drag().reset();
        Object.assign(el.style, {
            position: 'absolute',
            top: `${start.top - host.top}px`,
            left: `${start.left - host.left}px`,
            right: '',
            bottom: ''
        });
        if (rtl) Object.assign(el.style, { left: '', right: `${host.right - start.right}px` });
        const handle = event.currentTarget as HTMLElement;
        handle.setPointerCapture(event.pointerId);
        const move = (e: PointerEvent) => {
            const dx = rtl ? start.left - e.clientX : e.clientX - start.right;
            const maxW = rtl ? start.right - host.left : host.right - start.left;
            const width = Math.min(Math.max(start.width + dx, 0), maxW);
            const height = Math.min(Math.max(start.height + e.clientY - start.bottom, 0), host.bottom - start.top);
            this.resized.set({ width: `${width}px`, height: `${height}px` });
        };
        const up = () => {
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', up);
            handle.removeEventListener('pointercancel', up);
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
        handle.addEventListener('pointercancel', up);
    }
}

/** Marks the dialog title: the dialog is labelled by it unless the config names another element. */
let nextTitleId = 0;
@Directive({
    selector: '[fd-dialog-title], [fdDialogTitle]',
    host: { '[attr.id]': 'id()' }
})
export class DialogTitle {
    readonly id = input(`fd-dialog-title-${nextTitleId++}`);
    constructor() {
        const dialog = inject(Dialog, { optional: true });
        afterNextRender(() => {
            if (dialog && !dialog.titleId()) dialog.titleId.set(this.id());
        });
    }
}

/** Content of a dialog subheader bar, e.g. a search field: `<div fdDialogSubheader><div fd-bar-middle>...</div></div>`. */
@Directive({
    selector: '[fdDialogSubheader], [fd-dialog-subheader]',
    host: { class: 'contents' }
})
export class DialogSubheader {}

const BAR = '[--bar-px:var(--dlg-px)] shrink-0';

/**
 * Header of a dialog. Projects an `[fd-title]` at the start and the full-screen and close buttons
 * at the end; put `fd-bar-left`/`fd-bar-middle`/`fd-bar-right` areas directly inside for a custom header.
 */
@Component({
    selector: 'fd-dialog-header',
    imports: [Bar, BarLeft, BarRight, BarElement],
    providers: [{ provide: FD_DEFAULT_TITLE_SIZE, useValue: 5 }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `
        <header data-dialog-header>
            <div
                fd-bar
                role="group"
                data-dialog-bar
                [barDesign]="subheader() ? 'header-with-subheader' : 'header'"
                class="${BAR} rounded-t-sap-element-border-corner-radius"
            >
                @if (custom()) {
                    <ng-content
                        select="[fd-bar-left], [fdBarLeft], [fd-bar-middle], [fdBarMiddle], [fd-bar-right], [fdBarRight]"
                    />
                }
                @if (!custom()) {
                    <div fd-bar-left>
                        <fd-bar-element fullWidth><ng-content select="[fd-title], [fdTitle]" /></fd-bar-element>
                    </div>
                }
                @if (!custom()) {
                    <div fd-bar-right>
                        <fd-bar-element>
                            @if (!dialog?.mobile()) {
                                <ng-content select="[fd-dialog-full-screen-toggler-button]" />
                            }
                            <ng-content select="[fd-dialog-close-button]" />
                        </fd-bar-element>
                    </div>
                }
            </div>
            @if (subheader()) {
                <div fd-bar barDesign="subheader" data-dialog-bar class="${BAR}">
                    <ng-content select="[fdDialogSubheader], [fd-dialog-subheader]" />
                </div>
            }
            <ng-content />
        </header>
    `
})
export class DialogHeader {
    protected readonly dialog = inject(Dialog, { optional: true });
    private readonly left = contentChild(BarLeft, { descendants: false });
    private readonly middle = contentChild(BarMiddle, { descendants: false });
    private readonly right = contentChild(BarRight, { descendants: false });
    protected readonly subheader = contentChild(DialogSubheader, { descendants: false });
    protected readonly custom = computed(() => !!(this.left() || this.middle() || this.right()));
}

/** Scrolling body of a dialog; shows a busy indicator while the dialog is loading. */
@Component({
    selector: 'fd-dialog-body',
    imports: [BusyIndicator],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        'data-dialog-body': '',
        '[class]': 'computedClass()',
        '[style.min-height]': 'config()?.bodyMinHeight || null'
    },
    template: `
        <ng-content />
        @if (loading().isLoading) {
            <div class="mt-6 mb-2 text-center">
                @if (loading().loadingContent) {
                    <p class="m-0 mb-4 text-sap-font-size text-sap-text-color">{{ loading().loadingContent }}</p>
                }
                <fd-busy-indicator
                    loading
                    size="l"
                    [label]="loading().loadingLabel"
                    [ariaLabel]="loading().loadingLabel || 'Loading'"
                />
            </div>
        }
    `
})
export class DialogBody {
    /** No paddings, e.g. for a list that fills the body. */
    readonly disablePaddings = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly dialog = inject(Dialog, { optional: true });
    protected readonly config = computed(() => this.dialog?.config());
    protected readonly loading = computed(() => this.dialog?.ref()?.loadingState() ?? { isLoading: false });

    protected readonly computedClass = computed(() => {
        const config = this.config() ?? DEFAULT_CONFIG;
        const none = config.disablePaddings || this.disablePaddings();
        return cn(
            'relative m-0 box-border block grow overflow-auto p-0 scrollbar-sap',
            'bg-sap-group-content-background font-sap-font-family text-sap-font-size text-sap-text-color',
            'rounded-sap-element-border-corner-radius not-first:rounded-t-none not-last:rounded-b-none',
            !none && config.verticalPadding !== false && 'py-4',
            !none && (config.horizontalPadding !== false || config.responsivePadding) && 'px-(--dlg-px)',
            this.userClass()
        );
    });
}

/**
 * Footer of a dialog: its buttons go to the end; put `fd-bar-left`/`fd-bar-right` areas directly
 * inside for a custom footer.
 */
@Component({
    selector: 'fd-dialog-footer',
    imports: [Bar, BarRight],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `
        <footer>
            <div
                fd-bar
                barDesign="footer"
                data-dialog-bar
                class="${BAR} overflow-hidden rounded-b-sap-element-border-corner-radius [&_button[fdButton]]:min-w-16"
            >
                @if (custom()) {
                    <ng-content
                        select="[fd-bar-left], [fdBarLeft], [fd-bar-middle], [fdBarMiddle], [fd-bar-right], [fdBarRight]"
                    />
                } @else {
                    <div fd-bar-right><ng-content /></div>
                }
            </div>
        </footer>
    `
})
export class DialogFooter {
    private readonly left = contentChild(BarLeft, { descendants: false });
    private readonly middle = contentChild(BarMiddle, { descendants: false });
    private readonly right = contentChild(BarRight, { descendants: false });
    protected readonly custom = computed(() => !!(this.left() || this.middle() || this.right()));
}

const HEADER_BUTTON = buttonVariants({ variant: 'transparent' });

/** Close button for the dialog header. */
@Component({
    selector: 'button[fd-dialog-close-button], button[fdDialogCloseButton]',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        type: 'button',
        '[class]': 'computedClass()',
        '[attr.data-density]': 'mobile() ? null : "compact"',
        '[attr.aria-label]': 'ariaLabel() || "Close"',
        '[attr.title]': 'title() || null'
    },
    template: '<fd-icon glyph="decline" /><ng-content />'
})
export class DialogCloseButton {
    readonly mobile = input(false, { transform: booleanAttribute });
    readonly title = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() => cn(HEADER_BUTTON, this.userClass()));
}

/** Full-screen toggle for the dialog header; bind `(click)` to `dialogRef.toggleFullScreen()`. */
@Component({
    selector: 'button[fd-dialog-full-screen-toggler-button], button[fdDialogFullScreenTogglerButton]',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        type: 'button',
        '[class]': 'computedClass()',
        '[attr.data-density]': 'mobile() ? null : "compact"',
        '[attr.aria-label]': 'title() || (fullScreen() ? "Exit full screen" : "Enter full screen")',
        '[attr.aria-pressed]': 'null',
        '[attr.title]': 'title() || null'
    },
    template: `<fd-icon [glyph]="fullScreen() ? 'exit-full-screen' : 'full-screen'" />`
})
export class DialogFullScreenTogglerButton {
    readonly mobile = input(false, { transform: booleanAttribute });
    /** The dialog's ref when the button is declared in a dialog template; injected otherwise. */
    readonly dialogRef = input<DialogRef | null | undefined>();
    readonly title = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly injectedRef = inject(DialogRef, { optional: true });
    private readonly dialog = inject(Dialog, { optional: true });
    readonly fullScreen = computed(
        () => (this.dialogRef() ?? this.injectedRef ?? this.dialog?.ref())?.isFullScreen() ?? false
    );
    protected readonly computedClass = computed(() => cn(HEADER_BUTTON, this.userClass()));
}

let nextDefaultId = 0;

/** The dialog rendered for `DialogDefaultContent` objects. */
@Component({
    selector: 'fd-dialog-default',
    imports: [
        Dialog,
        DialogHeader,
        DialogBody,
        DialogFooter,
        DialogSubheader,
        DialogCloseButton,
        DialogFullScreenTogglerButton,
        Title,
        BarElement,
        Button,
        ButtonBar,
        NgTemplateOutlet
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @let c = content();
        <fd-dialog>
            <fd-dialog-header>
                <div role="heading" [attr.aria-level]="c.titleHeadingLevel || 1" fd-title [id]="titleId">
                    {{ c.title }}
                </div>
                @if (c.allowFullScreen) {
                    <button
                        fd-dialog-full-screen-toggler-button
                        #fs
                        [title]="
                            (fs.fullScreen() ? c.fullScreenMinifyButtonText : c.fullScreenExpandButtonText) || null
                        "
                        (click)="c.fullScreenButtonCallback?.()"
                    ></button>
                }
                @if (c.closeButtonCallback) {
                    <button
                        fd-dialog-close-button
                        [title]="c.closeButtonTitle"
                        [ariaLabel]="c.closeButtonAriaLabel"
                        (click)="c.closeButtonCallback()"
                    ></button>
                }
                @if (c.subHeader) {
                    <div fdDialogSubheader><ng-container [ngTemplateOutlet]="c.subHeader" /></div>
                }
            </fd-dialog-header>
            @if (c.content) {
                <fd-dialog-body [id]="contentId">
                    <ng-container [ngTemplateOutlet]="c.content" />
                </fd-dialog-body>
            }
            @if (c.approveButton || c.cancelButton) {
                <fd-dialog-footer>
                    @if (c.approveButton) {
                        <fd-bar-element>
                            <button
                                fdButton
                                cdkFocusInitial
                                variant="emphasized"
                                [id]="c.approveButtonId || approveId"
                                [label]="c.approveButton"
                                [ariaLabel]="c.approveButtonAriaLabel"
                                (click)="c.approveButtonCallback?.()"
                            ></button>
                        </fd-bar-element>
                    }
                    @if (c.cancelButton) {
                        <fd-button-bar
                            [id]="c.cancelButtonId || cancelId"
                            [label]="c.cancelButton"
                            [ariaLabel]="c.cancelButtonAriaLabel"
                            (click)="c.cancelButtonCallback?.()"
                        />
                    }
                </fd-dialog-footer>
            }
        </fd-dialog>
    `
})
export class DialogDefault {
    private readonly container = inject(DialogContainer, { optional: true });
    private readonly config = inject(FD_DIALOG_CONFIG, { optional: true });
    protected readonly content = signal<DialogDefaultContent>(this.container?.defaultContent ?? {});
    private readonly n = nextDefaultId++;
    protected readonly titleId = this.content().titleId || `fd-dialog-default-title-${this.n}`;
    protected readonly contentId = this.content().contentId || `fd-dialog-default-content-${this.n}`;
    protected readonly approveId = `fd-dialog-default-approve-${this.n}`;
    protected readonly cancelId = `fd-dialog-default-cancel-${this.n}`;

    constructor() {
        if (this.config) {
            this.config.ariaLabelledBy ??= this.titleId;
            if (this.content().content) this.config.ariaDescribedBy ??= this.contentId;
        }
    }
}
