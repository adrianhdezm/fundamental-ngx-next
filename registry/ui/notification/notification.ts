/*
 * Port of @fundamental-ngx/core (notification) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { FocusTrapFactory, type FocusTrap } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
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
    afterRenderEffect,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    forwardRef,
    inject,
    input,
    model,
    signal,
    viewChild
} from '@angular/core';
import { Subject, type Observable } from 'rxjs';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon } from '@/ui/icon/icon';
import { Link } from '@/ui/link/link';

/** Handle of a notification opened by the `NotificationService`. */
export class NotificationRef<T = any, P = any> {
    data: T | undefined;
    private readonly closed = new Subject<P | undefined>();
    /** Emits the `close()` result; errors with the `dismiss()` reason. */
    readonly afterClosed: Observable<P | undefined> = this.closed.asObservable();

    close(result?: P): void {
        if (this.closed.closed) return;
        this.closed.next(result);
        this.closed.complete();
    }

    dismiss(reason?: unknown): void {
        if (this.closed.closed) return;
        this.closed.error(reason);
    }
}

export interface NotificationConfig<T = unknown> {
    id?: string;
    data?: T;
    width?: string;
    ariaLabel?: string | null;
    ariaLabelledBy?: string | null;
    /** Moves the focus into the notification and returns it when closed (default true). */
    shouldTrapFocus?: boolean;
    /** Dismisses the notification with the reason "escape" on Escape (default false). */
    escKeyCloseable?: boolean;
}

const NOTIFICATION_CONFIG = new InjectionToken<NotificationConfig>('FdNotificationConfig');

/** Title of a notification; bold while unread. */
@Directive({
    selector: '[fd-notification-title], [fdNotificationTitle]',
    host: {
        'data-nt-title': '',
        '[attr.id]': 'id()',
        '[class]': 'computedClass()'
    }
})
export class NotificationTitle {
    readonly unread = input(false, { transform: booleanAttribute });
    readonly id = input(`fd-notification-title-${nextId++}`);
    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly notification = inject(
        forwardRef(() => Notification),
        { optional: true }
    );
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex-1 p-0 text-sap-font-header6-size leading-5 text-sap-list-text-color',
            this.unread() ? 'font-bold' : 'font-normal',
            this.notification?.expanded() ? 'block overflow-visible' : 'line-clamp-2 max-h-10'
        )
    );
}
let nextId = 0;

/** Description of a notification. */
@Directive({
    selector: '[fd-notification-paragraph], [fdNotificationParagraph]',
    host: { '[attr.id]': 'id()', '[class]': 'computedClass()' }
})
export class NotificationParagraph {
    readonly id = input(`fd-notification-paragraph-${nextId++}`);
    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly notification = inject(
        forwardRef(() => Notification),
        { optional: true }
    );
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border p-0 text-sap-font-size text-sap-list-text-color',
            this.notification?.expanded() ? 'block overflow-visible' : 'line-clamp-2 max-h-11'
        )
    );
}

/** Icon and title row. */
@Directive({
    selector: 'fd-notification-header',
    host: {
        '[attr.id]': 'id()',
        class: 'm-0 box-border flex w-full gap-1 p-0 [&>fd-icon]:pt-0.5'
    }
})
export class NotificationHeader {
    readonly id = input(`fd-notification-header-${nextId++}`);
}

/**
 * Avatar, content and actions of a notification. The action buttons are described by the first
 * header (`aria-describedby`), unless they already have a description.
 */
@Directive({
    selector: 'fd-notification-body',
    host: { class: 'relative m-0 box-border flex gap-3 p-4' }
})
export class NotificationBody {
    private readonly headers = contentChildren(NotificationHeader, { descendants: true });
    private readonly actions = contentChildren<NotificationActions>(forwardRef(() => NotificationActions));

    constructor() {
        const destroyRef = inject(DestroyRef);
        const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
        const apply = () => {
            const header = this.headers()[0];
            if (!header) return;
            const id = header.id();
            for (const actions of this.actions()) {
                actions.elementRef.nativeElement
                    .querySelectorAll('button, a[fdButton]')
                    .forEach(
                        (button) =>
                            button.hasAttribute('aria-describedby') || button.setAttribute('aria-describedby', id)
                    );
            }
        };
        afterRenderEffect(apply);
        // buttons added later (e.g. by an @if) get the description too
        afterNextRender(() => {
            const observer = new MutationObserver(apply);
            observer.observe(host, { childList: true, subtree: true });
            destroyRef.onDestroy(() => observer.disconnect());
        });
    }
}

/** Header, paragraph, footer and status of a notification. */
@Directive({
    selector: 'fd-notification-content',
    host: { class: 'm-0 box-border flex w-full flex-col items-start gap-3 p-0 compact:gap-2' }
})
export class NotificationContent {}

/** Buttons at the top end, e.g. a close button. */
@Directive({
    selector: 'fd-notification-actions',
    host: { 'data-nt-actions': '', class: 'absolute end-0 top-0 m-0 box-border flex gap-0.5 ps-1 pe-2 pt-2' }
})
export class NotificationActions {
    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
}

/** A footnote, e.g. the source or the time. */
@Directive({
    selector: '[fd-notification-footer-content], [fdNotificationFooterContent]',
    host: { class: 'max-w-1/2 truncate text-sap-content-label-color only:max-w-full' }
})
export class NotificationFooterContent {}

/** A dot between footnotes. */
@Directive({
    selector: '[fd-notification-separator], [fdNotificationSeparator]',
    host: {
        role: 'presentation',
        'aria-hidden': 'true',
        class: "m-0 mx-2 p-0 text-sap-content-label-color before:content-['·']"
    }
})
export class NotificationSeparator {}

/**
 * Footnotes of a notification. A More/Less link appears when the title or the paragraph is
 * truncated; `manualShowTrigger` and `[(manualExpanded)]` take control of it.
 */
@Component({
    selector: 'fd-notification-footer',
    imports: [Link],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'm-0 box-border flex w-full items-center p-0' },
    template: `
        <ng-content />
        @if (showTrigger()) {
            <a
                fdLink
                role="button"
                tabindex="0"
                class="ms-4"
                [attr.aria-expanded]="expanded()"
                [attr.aria-label]="
                    expanded()
                        ? lessLabel() + ' button. Show less text.'
                        : moreLabel() + ' button. Show the full texts.'
                "
                (click)="toggle()"
                (keydown.enter)="toggle()"
                (keydown.space)="$event.preventDefault(); toggle()"
                >{{ expanded() ? lessLabel() : moreLabel() }}</a
            >
        }
    `
})
export class NotificationFooter {
    readonly manualShowTrigger = input<boolean | undefined>(undefined);
    readonly manualExpanded = model<boolean | undefined>(undefined);
    readonly moreLabel = input('More');
    readonly lessLabel = input('Less');
    /** @internal Set by the notification when its texts are truncated. */
    readonly autoShowTrigger = signal(false);
    private readonly autoExpanded = signal(false);
    readonly expanded = computed(() => this.manualExpanded() ?? this.autoExpanded());
    protected readonly showTrigger = computed(() => this.manualShowTrigger() ?? this.autoShowTrigger());

    protected toggle(): void {
        const next = !this.expanded();
        if (this.manualExpanded() !== undefined) this.manualExpanded.set(next);
        else this.autoExpanded.set(next);
    }
}

/** Container of message strips above the notifications. */
@Directive({
    selector: '[fd-notification-message-strip-container], [fdNotificationMessageStripContainer]',
    host: { class: 'pt-4 ps-4 pe-2 empty:p-0' }
})
export class NotificationMessageStripContainer {}

/** Wrapper of a message strip in a notification popover. */
@Directive({
    selector: '[fd-notification-message-strip], [fdNotificationMessageStrip]',
    host: { class: 'm-0 box-border block p-2' }
})
export class NotificationMessageStrip {}

/**
 * A notification: an item with a title, a description, footnotes and actions, in a list, a group
 * or a banner opened by the `NotificationService`.
 *
 * ```html
 * <fd-notification>
 *     <fd-notification-body>
 *         <fd-notification-content>
 *             <fd-notification-header><h4 fd-notification-title unread>New order</h4></fd-notification-header>
 *             <p fd-notification-paragraph>Order 4711 was placed.</p>
 *         </fd-notification-content>
 *     </fd-notification-body>
 * </fd-notification>
 * ```
 */
@Component({
    selector: 'fd-notification',
    exportAs: 'fdNotification',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        tabindex: '0',
        '[attr.id]': 'config?.id || null',
        '[attr.role]': 'role()',
        '[attr.aria-level]': 'ariaLevel()',
        '[attr.aria-label]': 'config?.ariaLabel || null',
        '[attr.aria-labelledby]': 'labelledBy()',
        '[attr.data-selected]': 'selected() ? "" : null',
        '[attr.dir]': 'dir()',
        '[style.width]': 'width() || config?.width || null',
        '[class]': 'computedClass()',
        '(keydown)': 'onKeydown($event)'
    },
    template: '<ng-content />'
})
export class Notification {
    readonly width = input<string | null | undefined>();
    readonly selected = input(false, { transform: booleanAttribute });
    /** Called on Enter and Delete/Backspace, e.g. to open or remove the notification. */
    readonly actionKeyHandler = input<((event: KeyboardEvent, key: 'enter' | 'delete') => void) | null>(null);
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    protected readonly config = inject(NOTIFICATION_CONFIG, { optional: true });
    private readonly ref = inject(NotificationRef, { optional: true });
    private readonly direction = inject(Directionality, { optional: true });
    private readonly title = contentChild(NotificationTitle, { descendants: true });
    private readonly paragraph = contentChild(NotificationParagraph, { descendants: true });
    private readonly footer = contentChild(NotificationFooter, { descendants: true });

    /** Set by a group list. */
    readonly role = signal<string | null>(null);
    readonly ariaLevel = signal<number | null>(null);
    readonly expanded = computed(() => this.footer()?.expanded() ?? false);
    protected readonly dir = computed(() => (this.config ? (this.direction?.valueSignal() ?? null) : null));
    protected readonly labelledBy = computed(
        () => this.config?.ariaLabelledBy || this.title()?.id() || this.paragraph()?.id() || null
    );

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex cursor-pointer flex-col p-0 font-sap-font-family text-sap-font-size text-sap-text-color',
            'rounded-sap-tile-border-corner-radius border-(length:--sapList_BorderWidth) border-solid border-sap-list-border-color',
            'bg-sap-list-background enabled-hover:bg-sap-list-hover-background',
            'active:border-sap-list-active-background active:bg-sap-list-selection-background-color',
            'data-selected:border-sap-list-selection-border-color data-selected:bg-sap-list-selection-background-color data-selected:enabled-hover:bg-sap-list-hover-selection-background',
            'focus:outline-sap focus:-outline-offset-4',
            // room for the action buttons next to the title
            'has-[[data-nt-actions]_button]:[&_[data-nt-title]]:pe-8 compact:has-[[data-nt-actions]_button]:[&_[data-nt-title]]:pe-11',
            'has-[[data-nt-actions]_button+button]:[&_[data-nt-title]]:pe-[4.375rem] compact:has-[[data-nt-actions]_button+button]:[&_[data-nt-title]]:pe-[4.875rem]',
            this.config && 'shadow-sap-content-shadow2',
            this.userClass()
        )
    );

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const check = () => {
                const truncated = [this.title(), this.paragraph()].some((t) => {
                    const el = t?.elementRef.nativeElement;
                    return !!el && el.scrollHeight > el.clientHeight + 1;
                });
                this.footer()?.autoShowTrigger.set(truncated || this.expanded());
            };
            check();
            const observer = new ResizeObserver(check);
            observer.observe(this.elementRef.nativeElement);
            destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape' && this.config?.escKeyCloseable && this.ref) {
            event.stopPropagation();
            this.ref.dismiss('escape');
            return;
        }
        const handler = this.actionKeyHandler();
        if (!handler || isEditable(event.target, this.elementRef.nativeElement)) return;
        if (event.key === 'Enter') handler(event, 'enter');
        else if (event.key === 'Delete' || event.key === 'Backspace') handler(event, 'delete');
    }

    /** Focuses the element at the same place as in another notification, or the notification. */
    focusByPath(path: number[]): void {
        let el: Element | null = this.elementRef.nativeElement;
        for (const index of path) el = el?.children.item(index) ?? null;
        (el instanceof HTMLElement && el.matches(FOCUSABLE) ? el : this.elementRef.nativeElement).focus();
    }

    /** Child indexes from the notification to an element inside it. */
    pathTo(target: Element): number[] {
        const path: number[] = [];
        for (let el: Element | null = target; el && el !== this.elementRef.nativeElement; el = el.parentElement) {
            if (!el.parentElement) break;
            path.unshift(Array.from(el.parentElement.children).indexOf(el));
        }
        return path;
    }
}

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function isEditable(target: EventTarget | null, host: HTMLElement): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true;
    const interactive = target.closest('button, a[href], [role="button"], [role="link"]');
    return !!interactive && interactive !== host;
}

/** A list of notifications or notification groups. */
@Directive({
    selector: '[fd-notification-list], [fdNotificationList]',
    host: {
        role: 'list',
        '[attr.aria-label]': 'ariaLabel()',
        class: 'm-0 box-border block size-full list-none overflow-auto p-0'
    }
})
export class NotificationList {
    readonly ariaLabel = input('Notifications');
}

/** A notification popover body: header toolbar, message strips and the list. */
@Directive({
    selector: '[fd-notification-popover], [fdNotificationPopover]',
    host: {
        role: 'dialog',
        class: 'm-0 box-border flex max-h-[40rem] w-[27rem] max-w-[27rem] flex-col p-0 max-sm:w-auto max-sm:max-w-[25rem]'
    }
})
export class NotificationPopover {}

/** Title of a notification group header. */
@Directive({
    selector: '[fd-notification-group-header-title], [fdNotificationGroupHeaderTitle]',
    host: {
        role: 'heading',
        '[attr.aria-level]': 'ariaLevel()',
        '[attr.id]': 'id()',
        class: 'm-0 box-border truncate p-0 font-sap-font-header-family text-sap-font-header5-size leading-8 font-normal text-sap-group-title-text-color'
    }
})
export class NotificationGroupHeaderTitle {
    readonly ariaLevel = input<1 | 2 | 3 | 4 | 5 | 6>(3);
    readonly id = input(`fd-notification-group-header-title-${nextId++}`);
}

/** Expands and collapses a notification group. */
@Component({
    selector: 'fd-notification-group-header',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'button',
        tabindex: '0',
        '[attr.title]': 'title()',
        '[attr.aria-controls]': 'controls()',
        '[attr.aria-expanded]': 'expanded()',
        class: 'sticky top-0 z-10 m-0 mt-3 mb-2 box-border flex h-sap-element-line-height cursor-pointer items-center gap-3 p-0 px-2 bg-sap-list-group-header-background focus:outline-sap focus:-outline-offset-4',
        '(click)': 'toggle()',
        '(keydown.enter)': 'onKey($event)',
        '(keydown.space)': 'onKey($event)'
    },
    template: `
        <span
            class="mx-2 inline-flex items-center justify-center text-[1rem] [&>fd-icon]:size-4 [&>fd-icon]:text-sap-content-icon-color"
        >
            <fd-icon [glyph]="expanded() ? 'slim-arrow-down' : 'slim-arrow-right'" />
        </span>
        <ng-content />
    `
})
export class NotificationGroupHeader {
    readonly title = input<string>('Expand/Collapse');
    readonly expanded = signal(false);
    readonly controls = signal<string | null>(null);

    toggle(): void {
        this.expanded.update((v) => !v);
    }

    protected onKey(event: Event): void {
        event.preventDefault();
        this.toggle();
    }
}

/** The notifications of a group; arrow keys, Home and End move between them. */
@Directive({
    selector: 'fd-notification-group-list',
    host: {
        role: 'list',
        '[attr.id]': 'id()',
        class: 'm-0 mx-2 mb-2 box-border flex list-none flex-col gap-2 p-0',
        '(keydown)': 'onKeydown($event)'
    }
})
export class NotificationGroupList {
    readonly id = input(`fd-notification-group-list-${nextId++}`);
    readonly notifications = contentChildren(Notification);

    constructor() {
        afterNextRender(() =>
            this.notifications().forEach((n) => {
                n.role.set('listitem');
                n.ariaLevel.set(2);
            })
        );
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const target = event.target as HTMLElement;
        if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
        const list = this.notifications();
        if (!list.length) return;
        const current = list.findIndex((n) => n.elementRef.nativeElement.contains(target));
        const last = list.length - 1;
        const next =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? last
                  : event.key === 'ArrowDown'
                    ? current === -1
                        ? 0
                        : Math.min(current + 1, last)
                    : current === -1
                      ? last
                      : Math.max(current - 1, 0);
        if (next === current) return;
        event.preventDefault();
        list[next].focusByPath(current === -1 ? [] : list[current].pathTo(target));
    }
}

/** "Show more" item at the end of a group. */
@Directive({
    selector: 'fd-notification-group-growing-item',
    host: {
        role: 'button',
        tabindex: '0',
        '[attr.aria-label]': 'ariaLabel()',
        class: 'mx-2 mb-2 box-border flex cursor-pointer flex-col items-center justify-center gap-2 p-4 rounded-sap-tile-border-corner-radius border-(length:--sapList_BorderWidth) border-solid border-sap-list-border-color bg-sap-list-background enabled-hover:bg-sap-list-hover-background active:bg-sap-list-selection-background-color focus:outline-sap focus:-outline-offset-4'
    }
})
export class NotificationGroupGrowingItem {
    readonly ariaLabel = input<string | null>(null);
}

@Directive({
    selector: '[fd-notification-group-growing-item-title], [fdNotificationGroupGrowingItemTitle]',
    host: { class: 'm-0 p-0 font-sap-font-family text-sap-font-size font-bold text-sap-button-text-color' }
})
export class NotificationGroupGrowingItemTitle {}

/** A collapsible group of notifications, e.g. "Today". */
@Component({
    selector: 'fd-notification-group',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'listitem',
        tabindex: '-1',
        'aria-level': '1',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.aria-labelledby]': 'title()?.id() ?? null',
        '[attr.aria-description]': 'header()?.expanded() ? expandedDescription() : collapsedDescription()',
        class: 'm-0 box-border block list-none p-0'
    },
    template: `
        <ng-content select="fd-notification-group-header" />
        @if (header()?.expanded()) {
            <ng-content select="fd-notification-group-list" />
            <ng-content select="fd-notification-group-growing-item" />
        }
    `
})
export class NotificationGroup {
    /** Starts expanded. */
    readonly expanded = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null>(null);
    readonly expandedDescription = input('Notification group expanded');
    readonly collapsedDescription = input('Notification group collapsed');
    protected readonly header = contentChild(NotificationGroupHeader);
    protected readonly title = contentChild(NotificationGroupHeaderTitle, { descendants: true });
    private readonly list = contentChild(NotificationGroupList);

    constructor() {
        afterNextRender(() => {
            this.header()?.expanded.set(this.expanded());
            this.header()?.controls.set(this.list()?.id() ?? null);
        });
    }
}

/** The column of notifications opened by the service, at the top end of the screen. */
@Component({
    selector: 'fd-notification-container',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'flex max-w-[26rem] flex-col items-end gap-2 max-sm:max-w-[24rem]' },
    template: '<ng-container #outlet />'
})
export class NotificationContainer {
    readonly outlet = viewChild.required('outlet', { read: ViewContainerRef });
}

/** Renders the content of a notification opened by the service. */
@Component({
    selector: 'fd-notification-host',
    imports: [NgTemplateOutlet, NgComponentOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'contents' },
    template: `
        @if (template(); as t) {
            <ng-container *ngTemplateOutlet="t; context: context(); injector: contentInjector()" />
        } @else if (component(); as c) {
            <ng-container *ngComponentOutlet="c; injector: contentInjector()" />
        }
    `
})
export class NotificationHost {
    readonly template = signal<TemplateRef<unknown> | null>(null);
    readonly component = signal<Type<unknown> | null>(null);
    readonly context = signal<{ $implicit: NotificationRef } | null>(null);
    readonly contentInjector = signal<Injector | undefined>(undefined);
}

/**
 * Opens notifications from a template or component at the top end of the screen. The content is
 * an `<fd-notification>`; it gets the `NotificationRef` (`let-ref` in templates).
 *
 * ```ts
 * const ref = inject(NotificationService).open(OrderNotification, { data: order });
 * ref.afterClosed.subscribe(...);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
    private readonly overlay = inject(Overlay);
    private readonly injector = inject(Injector);
    private readonly focusTrapFactory = inject(FocusTrapFactory);
    private overlayRef: OverlayRef | null = null;
    private container: NotificationContainer | null = null;
    private readonly open$ = signal<NotificationRef[]>([]);
    private previousFocus: HTMLElement | null = null;

    /** Open notifications. */
    readonly notifications = this.open$.asReadonly();

    open<T = any, P = any>(
        content: TemplateRef<any> | Type<unknown>,
        config: NotificationConfig<T> = {}
    ): NotificationRef<T, P> {
        const merged: NotificationConfig<T> = { shouldTrapFocus: true, escKeyCloseable: false, ...config };
        const ref = new NotificationRef<T, P>();
        ref.data = merged.data;
        const container = this.ensureContainer();
        const injector = Injector.create({
            providers: [
                { provide: NotificationRef, useValue: ref },
                { provide: NOTIFICATION_CONFIG, useValue: merged }
            ],
            parent: this.injector
        });
        const hostRef = container.outlet().createComponent(NotificationHost, { injector });
        const host = hostRef.instance;
        host.contentInjector.set(injector);
        if (content instanceof TemplateRef) {
            host.context.set({ $implicit: ref });
            host.template.set(content);
        } else {
            host.component.set(content);
        }
        hostRef.changeDetectorRef.detectChanges();

        let trap: FocusTrap | null = null;
        if (merged.shouldTrapFocus) {
            if (!this.open$().length) this.previousFocus = document.activeElement as HTMLElement | null;
            const host = hostRef.location.nativeElement as HTMLElement;
            const notification = host.querySelector<HTMLElement>('fd-notification') ?? host;
            trap = this.focusTrapFactory.create(notification);
            notification.focus();
        }
        this.open$.update((list) => [...list, ref]);

        const remove = () => {
            trap?.destroy();
            hostRef.destroy();
            this.open$.update((list) => list.filter((r) => r !== ref));
            if (!this.open$().length) {
                this.overlayRef?.dispose();
                this.overlayRef = null;
                this.container = null;
                this.previousFocus?.focus();
                this.previousFocus = null;
            } else if (merged.shouldTrapFocus) {
                // the focus moves to the newest remaining notification
                const hosts = this.container?.outlet().length ?? 0;
                const last = this.overlayRef?.overlayElement.querySelectorAll<HTMLElement>('fd-notification');
                if (hosts && last?.length) last[last.length - 1].focus();
            }
        };
        ref.afterClosed.subscribe({ next: remove, error: remove });
        return ref;
    }

    /** Closes all notifications. */
    destroyAll(): void {
        [...this.open$()].forEach((ref) => ref.close());
    }

    isAnyOpened(): boolean {
        return this.open$().length > 0;
    }

    private ensureContainer(): NotificationContainer {
        if (this.container) return this.container;
        const rtl = (this.injector.get(Directionality, null)?.value ?? 'ltr') === 'rtl';
        const position = this.overlay.position().global().top('2rem');
        this.overlayRef = this.overlay.create({
            positionStrategy: rtl ? position.left('2rem') : position.right('2rem'),
            panelClass: 'z-[5000]'
        });
        const ref = this.overlayRef.attach(new ComponentPortal(NotificationContainer, null, this.injector));
        ref.changeDetectorRef.detectChanges();
        this.container = ref.instance;
        return this.container;
    }
}
