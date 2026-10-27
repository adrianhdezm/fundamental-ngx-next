/*
 * Port of @fundamental-ngx/core (message-box) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    InjectionToken,
    Injectable,
    Injector,
    TemplateRef,
    Type,
    afterNextRender,
    computed,
    contentChild,
    inject,
    input,
    viewChild
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Bar, BarElement, BarLeft, BarMiddle, BarRight } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { Dialog, DialogRef, DialogService, type DialogConfig } from '@/ui/dialog/dialog';
import { Icon, type IconFont } from '@/ui/icon/icon';
import { FD_DEFAULT_TITLE_SIZE, Title } from '@/ui/title/title';

export type MessageBoxType = 'error' | 'success' | 'warning' | 'information' | 'confirmation';

/** Dialog options plus the semantic type of the message box. */
export interface MessageBoxConfig<T = unknown> extends DialogConfig<T> {
    type?: MessageBoxType;
    /** Shows the icon of the type before the title. */
    showSemanticIcon?: boolean;
    /** Icon before the title instead of the type icon. */
    customSemanticIcon?: string;
    /** Injector the message box content is created with. */
    injector?: Injector;
}

/** The handle of an open message box: a DialogRef. */
export type MessageBoxRef<T = any, P = any> = DialogRef<T, P>;
export const MessageBoxRef = DialogRef;

/** Content of a message box built from an object. */
export interface MessageBoxContent {
    title?: string;
    titleId?: string;
    titleHeadingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Text or template of the body. */
    content?: string | TemplateRef<unknown>;
    contentId?: string;
    approveButton?: string;
    approveButtonId?: string;
    approveButtonAriaLabel?: string;
    approveButtonCallback?: () => void;
    cancelButton?: string;
    cancelButtonId?: string;
    cancelButtonAriaLabel?: string;
    cancelButtonCallback?: () => void;
}

export type MessageBoxContentType = TemplateRef<any> | Type<unknown> | MessageBoxContent;

const SEMANTIC_ICON: Record<MessageBoxType, string> = {
    error: 'error',
    success: 'sys-enter-2',
    warning: 'alert',
    information: 'information',
    confirmation: 'sys-help-2'
};

/** Header shadow (a coloured line) per type. */
const TYPE_HEADER: Record<MessageBoxType, string> = {
    confirmation: '[--bar-shadow:var(--sapContent_HeaderShadow)]',
    error: '[--bar-shadow:var(--sapContent_Error_HeaderShadow)]',
    success: '[--bar-shadow:var(--sapContent_Success_HeaderShadow)]',
    warning: '[--bar-shadow:var(--sapContent_Warning_HeaderShadow)]',
    information: '[--bar-shadow:var(--sapContent_Information_HeaderShadow)]'
};
/** Semantic icon colour per type. */
const TYPE_ICON: Record<MessageBoxType, string> = {
    confirmation: '[--mb-ic:var(--sapNeutralElementColor)]',
    error: '[--mb-ic:var(--sapNegativeElementColor)]',
    success: '[--mb-ic:var(--sapPositiveElementColor)]',
    warning: '[--mb-ic:var(--sapCriticalElementColor)]',
    information: '[--mb-ic:var(--sapInformativeElementColor)]'
};

/**
 * Message box: a modal alert dialog for errors, warnings, confirmations and other messages that
 * need a decision. Open it with the `MessageBoxService` from a template, a component or a
 * `MessageBoxContent` object.
 *
 * ```html
 * <fd-message-box>
 *     <fd-message-box-header><h1 fd-title>Delete order?</h1></fd-message-box-header>
 *     <fd-message-box-body>The order will be deleted permanently.</fd-message-box-body>
 *     <fd-message-box-footer>
 *         <fd-button-bar variant="emphasized" label="Delete" (click)="ref.close('delete')" />
 *         <fd-button-bar label="Cancel" (click)="ref.dismiss()" />
 *     </fd-message-box-footer>
 * </fd-message-box>
 * ```
 */
@Component({
    selector: 'fd-message-box',
    exportAs: 'fdMessageBox',
    imports: [Dialog],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'contents' },
    template: `
        <fd-dialog
            [role]="'alertdialog'"
            [dialogRef]="messageBoxRef()"
            [dialogConfig]="messageBoxConfig()"
            [class]="userClass()"
            [windowClass]="windowClass()"
        >
            <ng-content select="fd-message-box-header" />
            <ng-content select="fd-message-box-body" />
            <ng-content select="fd-message-box-footer" />
            <ng-content />
        </fd-dialog>
    `
})
export class MessageBox {
    /** The ref, for message boxes declared in a template; injected otherwise. */
    readonly messageBoxRef = input<MessageBoxRef | null | undefined>();
    /** The config, for message boxes declared in a template; injected otherwise. */
    readonly messageBoxConfig = input<MessageBoxConfig | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly dialog = viewChild.required(Dialog);
    readonly config = computed(() => this.dialog().config() as MessageBoxConfig);
    readonly type = computed(() => this.config().type);
    protected readonly windowClass = computed(() => {
        const type = this.type();
        return cn('overflow-hidden', type && TYPE_ICON[type]);
    });
}

/** The icon of the message box type; place it in the header to replace the automatic one. */
@Component({
    selector: 'fd-message-box-semantic-icon',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'presentation',
        'aria-hidden': 'true',
        class: 'me-2 inline-flex text-[1rem] text-(--mb-ic,var(--sapContent_IconColor))'
    },
    template: `<fd-icon [glyph]="icon()" [font]="glyphFont()" />`
})
export class MessageBoxSemanticIcon {
    readonly glyph = input<string | null | undefined>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    private readonly messageBox = inject(MessageBox, { optional: true });
    protected readonly icon = computed(() => {
        const config = this.messageBox?.config();
        const type = config?.type;
        return this.glyph() || config?.customSemanticIcon || (type ? SEMANTIC_ICON[type] : '');
    });
}

const BAR = '[--bar-px:var(--dlg-px)] shrink-0';

/**
 * Header of a message box: the semantic icon and an `[fd-title]`. Put `fd-bar-left`/`-middle`/
 * `-right` areas directly inside for a custom header.
 */
@Component({
    selector: 'fd-message-box-header',
    imports: [Bar, BarLeft, BarElement, MessageBoxSemanticIcon],
    providers: [{ provide: FD_DEFAULT_TITLE_SIZE, useValue: 5 }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `
        <header>
            <div fd-bar role="group" barDesign="header" data-dialog-bar [class]="barClass()">
                @if (custom()) {
                    <ng-content
                        select="[fd-bar-left], [fdBarLeft], [fd-bar-middle], [fdBarMiddle], [fd-bar-right], [fdBarRight]"
                    />
                } @else {
                    <div fd-bar-left>
                        <fd-bar-element>
                            @if (showIcon()) {
                                <fd-message-box-semantic-icon />
                            }
                            <ng-content select="fd-message-box-semantic-icon" />
                            <ng-content select="[fd-title], [fdTitle]" />
                        </fd-bar-element>
                    </div>
                }
            </div>
            <ng-content />
        </header>
    `
})
export class MessageBoxHeader {
    private readonly messageBox = inject(MessageBox, { optional: true });
    private readonly projectedIcon = contentChild(MessageBoxSemanticIcon);
    private readonly title = contentChild(Title, { descendants: true });
    private readonly left = contentChild(BarLeft);
    private readonly middle = contentChild(BarMiddle);
    private readonly right = contentChild(BarRight);
    protected readonly custom = computed(() => !!(this.left() || this.middle() || this.right()));
    protected readonly barClass = computed(() => {
        const type = this.messageBox?.type();
        return cn(BAR, 'relative', type && TYPE_HEADER[type]);
    });
    protected readonly showIcon = computed(() => {
        const config = this.messageBox?.config();
        return !this.projectedIcon() && !!((config?.type && config.showSemanticIcon) || config?.customSemanticIcon);
    });

    constructor() {
        // the title names the message box unless the config names another element
        afterNextRender(() => {
            const el = this.title()?.elementRef.nativeElement;
            const dialog = this.messageBox?.dialog();
            if (!el || !dialog || dialog.titleId()) return;
            if (!el.id) el.id = `fd-message-box-title-${nextId++}`;
            dialog.titleId.set(el.id);
        });
    }
}
let nextId = 0;

/** Scrolling body of a message box. */
@Component({
    selector: 'fd-message-box-body',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: '<ng-content />'
})
export class MessageBoxBody {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly messageBox = inject(MessageBox, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border block grow overflow-auto p-0 px-(--dlg-px) scrollbar-sap',
            'bg-sap-group-content-background font-sap-font-family text-sap-font-size text-sap-text-color',
            this.messageBox?.config().verticalPadding !== false && 'py-4',
            this.userClass()
        )
    );
}

/** Footer of a message box: its buttons go to the end. */
@Component({
    selector: 'fd-message-box-footer',
    imports: [Bar, BarRight],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `
        <footer>
            <div fd-bar barDesign="footer" data-dialog-bar class="${BAR} [&_button[fdButton]]:min-w-16">
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
export class MessageBoxFooter {
    private readonly left = contentChild(BarLeft);
    private readonly middle = contentChild(BarMiddle);
    private readonly right = contentChild(BarRight);
    protected readonly custom = computed(() => !!(this.left() || this.middle() || this.right()));
}

/** Types the context of a message box template: `let-messageBox` is the ref. */
@Directive({ selector: '[fdMessageBoxTemplate]' })
export class MessageBoxTemplate {
    readonly templateRef = inject<TemplateRef<{ $implicit: MessageBoxRef }>>(TemplateRef);
    static ngTemplateContextGuard(_dir: MessageBoxTemplate, ctx: unknown): ctx is { $implicit: MessageBoxRef } {
        return true;
    }
}

const MESSAGE_BOX_CONTENT = new InjectionToken<MessageBoxContent>('FdMessageBoxContent');
export const MESSAGE_BOX_DEFAULT_CONFIG = new InjectionToken<MessageBoxConfig>('FdMessageBoxDefaultConfig');

/**
 * Opens message boxes. Provide it in a component (`providers: [MessageBoxService]`) to inherit
 * its text direction, or use the root instance.
 *
 * ```ts
 * const ref = inject(MessageBoxService).open(
 *     { title: 'Error', content: 'The order could not be saved.', approveButton: 'Close', approveButtonCallback: () => ref.close() },
 *     { type: 'error', showSemanticIcon: true }
 * );
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MessageBoxService {
    private readonly dialogs = inject(DialogService);
    private readonly injector = inject(Injector);
    private readonly defaults = inject(MESSAGE_BOX_DEFAULT_CONFIG, { optional: true });

    /** Open message boxes and dialogs of the underlying dialog service. */
    readonly dialogsOpen = computed(() => this.dialogs.openDialogCount());

    open<T = any, P = any>(content: MessageBoxContentType, config?: MessageBoxConfig<T>): MessageBoxRef<T, P> {
        const merged: MessageBoxConfig<T> = {
            responsivePadding: true,
            ...this.defaults,
            ...config
        } as MessageBoxConfig<T>;
        const parent = merged.injector ?? this.injector;
        if (content instanceof TemplateRef || typeof content === 'function') {
            return this.dialogs.open(content, merged, parent);
        }
        const injector = Injector.create({ providers: [{ provide: MESSAGE_BOX_CONTENT, useValue: content }], parent });
        return this.dialogs.open(MessageBoxDefault, merged, injector);
    }

    dismissAll(reason?: unknown): void {
        this.dialogs.dismissAll(reason);
    }
}

let nextDefaultId = 0;

/** The message box rendered for `MessageBoxContent` objects. */
@Component({
    selector: 'fd-message-box-default',
    imports: [
        MessageBox,
        MessageBoxHeader,
        MessageBoxBody,
        MessageBoxFooter,
        Title,
        BarElement,
        Button,
        NgTemplateOutlet
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <fd-message-box>
            <fd-message-box-header>
                <div fd-title role="heading" [attr.aria-level]="c.titleHeadingLevel || 2" [id]="titleId">
                    {{ c.title }}
                </div>
            </fd-message-box-header>
            <fd-message-box-body [id]="contentId">
                @if (template; as t) {
                    <ng-container [ngTemplateOutlet]="t" />
                } @else {
                    {{ c.content }}
                }
            </fd-message-box-body>
            @if (c.approveButton || c.cancelButton) {
                <fd-message-box-footer>
                    @if (c.approveButton) {
                        <fd-bar-element>
                            <button
                                fdButton
                                cdkFocusInitial
                                variant="emphasized"
                                [id]="c.approveButtonId || id + '-approve'"
                                [label]="c.approveButton"
                                [ariaLabel]="c.approveButtonAriaLabel"
                                (click)="c.approveButtonCallback?.()"
                            ></button>
                        </fd-bar-element>
                    }
                    @if (c.cancelButton) {
                        <fd-bar-element>
                            <button
                                fdButton
                                variant="transparent"
                                [id]="c.cancelButtonId || id + '-cancel'"
                                [label]="c.cancelButton"
                                [ariaLabel]="c.cancelButtonAriaLabel"
                                (click)="c.cancelButtonCallback?.()"
                            ></button>
                        </fd-bar-element>
                    }
                </fd-message-box-footer>
            }
        </fd-message-box>
    `
})
export class MessageBoxDefault {
    protected readonly c = inject(MESSAGE_BOX_CONTENT);
    protected readonly id = `fd-message-box-default-${nextDefaultId++}`;
    protected readonly titleId = this.c.titleId || `${this.id}-title`;
    protected readonly contentId = this.c.contentId || `${this.id}-content`;
    protected readonly template = this.c.content instanceof TemplateRef ? this.c.content : null;

    private readonly messageBox = viewChild.required(MessageBox);

    constructor() {
        // the body describes the message box unless the config names another element
        afterNextRender(() => {
            const dialog = this.messageBox().dialog();
            if (!dialog.descriptionId()) dialog.descriptionId.set(this.contentId);
        });
    }
}
