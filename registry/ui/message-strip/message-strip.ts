/*
 * Port of @fundamental-ngx/core (message-strip) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    TemplateRef,
    booleanAttribute,
    computed,
    contentChild,
    inject,
    input,
    output,
    signal
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';
import { Icon } from '@/ui/icon/icon';

export type MessageStripType = 'warning' | 'success' | 'information' | 'error';
export type MessageStripIndicationColor =
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | '1b'
    | '2b'
    | '3b'
    | '4b'
    | '5b'
    | '6b'
    | '7b'
    | '8b'
    | '9b'
    | '10b';

/** Background (--ms-bg), border (--ms-bc) and icon (--ms-ic) colours of each type. */
const TYPE: Record<MessageStripType | 'neutral', string> = {
    neutral:
        '[--ms-bg:var(--sapNeutralBackground)] [--ms-bc:var(--sapNeutralBorderColor)] [--ms-ic:var(--sapNeutralElementColor)]',
    warning:
        '[--ms-bg:var(--sapWarningBackground)] [--ms-bc:var(--sapMessage_WarningBorderColor)] [--ms-ic:var(--sapCriticalElementColor)]',
    error: '[--ms-bg:var(--sapErrorBackground)] [--ms-bc:var(--sapMessage_ErrorBorderColor)] [--ms-ic:var(--sapNegativeElementColor)]',
    success:
        '[--ms-bg:var(--sapSuccessBackground)] [--ms-bc:var(--sapMessage_SuccessBorderColor)] [--ms-ic:var(--sapPositiveElementColor)]',
    information:
        '[--ms-bg:var(--sapInformationBackground)] [--ms-bc:var(--sapMessage_InformationBorderColor)] [--ms-ic:var(--sapInformativeElementColor)]'
};
const INDICATION: Record<MessageStripIndicationColor, string> = {
    '1': '[--ms-bg:var(--sapIndicationColor_1_Background)] [--ms-bc:var(--sapIndicationColor_1_BorderColor)]',
    '2': '[--ms-bg:var(--sapIndicationColor_2_Background)] [--ms-bc:var(--sapIndicationColor_2_BorderColor)]',
    '3': '[--ms-bg:var(--sapIndicationColor_3_Background)] [--ms-bc:var(--sapIndicationColor_3_BorderColor)]',
    '4': '[--ms-bg:var(--sapIndicationColor_4_Background)] [--ms-bc:var(--sapIndicationColor_4_BorderColor)]',
    '5': '[--ms-bg:var(--sapIndicationColor_5_Background)] [--ms-bc:var(--sapIndicationColor_5_BorderColor)]',
    '6': '[--ms-bg:var(--sapIndicationColor_6_Background)] [--ms-bc:var(--sapIndicationColor_6_BorderColor)]',
    '7': '[--ms-bg:var(--sapIndicationColor_7_Background)] [--ms-bc:var(--sapIndicationColor_7_BorderColor)]',
    '8': '[--ms-bg:var(--sapIndicationColor_8_Background)] [--ms-bc:var(--sapIndicationColor_8_BorderColor)]',
    '9': '[--ms-bg:var(--sapIndicationColor_9_Background)] [--ms-bc:var(--sapIndicationColor_9_BorderColor)]',
    '10': '[--ms-bg:var(--sapIndicationColor_10_Background)] [--ms-bc:var(--sapIndicationColor_10_BorderColor)]',
    '1b': '[--ms-bg:var(--sapIndicationColor_1b_Background)] [--ms-bc:var(--sapIndicationColor_1b_BorderColor)]',
    '2b': '[--ms-bg:var(--sapIndicationColor_2b_Background)] [--ms-bc:var(--sapIndicationColor_2b_BorderColor)]',
    '3b': '[--ms-bg:var(--sapIndicationColor_3b_Background)] [--ms-bc:var(--sapIndicationColor_3b_BorderColor)]',
    '4b': '[--ms-bg:var(--sapIndicationColor_4b_Background)] [--ms-bc:var(--sapIndicationColor_4b_BorderColor)]',
    '5b': '[--ms-bg:var(--sapIndicationColor_5b_Background)] [--ms-bc:var(--sapIndicationColor_5b_BorderColor)]',
    '6b': '[--ms-bg:var(--sapIndicationColor_6b_Background)] [--ms-bc:var(--sapIndicationColor_6b_BorderColor)]',
    '7b': '[--ms-bg:var(--sapIndicationColor_7b_Background)] [--ms-bc:var(--sapIndicationColor_7b_BorderColor)]',
    '8b': '[--ms-bg:var(--sapIndicationColor_8b_Background)] [--ms-bc:var(--sapIndicationColor_8b_BorderColor)]',
    '9b': '[--ms-bg:var(--sapIndicationColor_9b_Background)] [--ms-bc:var(--sapIndicationColor_9b_BorderColor)]',
    '10b': '[--ms-bg:var(--sapIndicationColor_10b_Background)] [--ms-bc:var(--sapIndicationColor_10b_BorderColor)]'
};
/** Text and icon colours on a strong (1-10) or light (1b-10b) indication background. */
const INDICATION_STRONG =
    '[--ms-tc:var(--sapContent_ContrastTextColor)] [--ms-ic:var(--sapContent_ContrastTextColor)] [--ms-btn:var(--sapContent_ContrastIconColor)] [--ms-focus:var(--sapContent_ContrastFocusColor)] [text-shadow:var(--sapContent_ContrastTextShadow)]';
const INDICATION_LIGHT =
    '[--ms-tc:var(--sapTextColor)] [--ms-ic:var(--sapContent_IconColor)] [--ms-btn:var(--sapContent_IconColor)] [--ms-focus:var(--sapContent_FocusColor)] [text-shadow:none]';

const GLYPH: Record<MessageStripType, string> = {
    warning: 'alert',
    success: 'sys-enter-2',
    error: 'error',
    information: 'information'
};
const ANNOUNCEMENT: Record<MessageStripType, string> = {
    warning: 'Warning Message Strip',
    success: 'Success Message Strip',
    error: 'Error Message Strip',
    information: 'Information Message Strip'
};

/** Custom icon of a message strip: `<fd-icon *fdMessageStripIcon glyph="survey" />`. */
@Directive({ selector: '[fdMessageStripIcon]' })
export class MessageStripIcon {
    readonly templateRef = inject(TemplateRef);
}

let nextId = 0;

/**
 * Message strip: an inline message about the current context, coloured by type, optionally
 * dismissible.
 *
 * ```html
 * <fd-message-strip type="warning">Your session expires in 5 minutes.</fd-message-strip>
 * <fd-message-strip indicationColor="6"><fd-icon *fdMessageStripIcon glyph="survey" />Survey open</fd-message-strip>
 * ```
 */
@Component({
    selector: 'fd-message-strip',
    exportAs: 'fdMessageStrip',
    imports: [Button, Icon, NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'note',
        '[class]': 'computedClass()',
        '[attr.id]': 'id()',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.aria-labelledby]': 'ariaLabelledBy() || id() + "-hidden-text " + id() + "-content-text"',
        '[style.width]': 'width()',
        '[style.min-width]': 'minWidth()',
        '[style.margin-bottom]': 'marginBottom()'
    },
    template: `
        @if (showIcon()) {
            <div
                class="absolute start-0 top-[0.4375rem] m-0 flex w-10 items-center justify-center p-0 text-base text-(--ms-ic) [&_fd-icon]:flex [&_fd-icon]:size-4 [&_fd-icon]:items-center [&_fd-icon]:justify-center [&_fd-icon]:leading-none"
                aria-hidden="true"
            >
                @if (icon(); as icon) {
                    <ng-container [ngTemplateOutlet]="icon.templateRef" />
                } @else {
                    <fd-icon [glyph]="glyph()" />
                }
            </div>
        }
        <span class="sr-only-sap" [id]="id() + '-hidden-text'">{{ hiddenText() }}</span>
        <p class="m-0 p-0 leading-4 break-words whitespace-normal text-(--ms-tc)" [id]="id() + '-content-text'">
            <ng-content />
        </p>
        @if (dismissible()) {
            <button
                fdButton
                variant="transparent"
                glyph="decline"
                data-density="compact"
                [class]="closeClass()"
                [attr.aria-controls]="id()"
                [ariaLabel]="closeLabel()"
                [attr.title]="closeLabel()"
                (click)="dismiss()"
            ></button>
        }
    `
})
export class MessageStrip {
    readonly id = input(`fd-message-strip-${nextId++}`);
    readonly type = input<MessageStripType | null | undefined>();
    /** Generic colour 1-10 (strong) or 1b-10b (light), instead of a type. */
    readonly indicationColor = input<MessageStripIndicationColor | null | undefined>();
    readonly dismissible = input(true, { transform: booleanAttribute });
    readonly noIcon = input(false, { transform: booleanAttribute });
    /** Close button label; defaults to "<type announcement> Close". */
    readonly dismissBtnTitle = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly width = input<string | null | undefined>();
    readonly minWidth = input<string | null | undefined>();
    readonly marginBottom = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly onDismiss = output<void>();

    protected readonly icon = contentChild(MessageStripIcon);
    /** False after dismiss() until open(). */
    readonly visible = signal(true);

    protected readonly showIcon = computed(() => !this.noIcon() && (!!this.icon() || !!this.type()));
    protected readonly glyph = computed(() => {
        const type = this.type();
        return type ? GLYPH[type] : '';
    });
    protected readonly hiddenText = computed(() => {
        const type = this.type();
        if (!type) return 'Message strip';
        return this.dismissible() ? `${ANNOUNCEMENT[type]} Closable` : ANNOUNCEMENT[type];
    });
    protected readonly closeLabel = computed(() => {
        const type = this.type();
        return this.dismissBtnTitle() || (type ? `${ANNOUNCEMENT[type]} Close` : 'Close');
    });

    dismiss(): void {
        this.visible.set(false);
        this.onDismiss.emit();
    }

    open(): void {
        this.visible.set(true);
    }

    protected readonly computedClass = computed(() => {
        const indication = this.indicationColor();
        const showIcon = this.showIcon();
        const dismissible = this.dismissible();
        return cn(
            'relative m-0 box-border block h-auto min-h-8 py-[0.4375rem] font-sap-font-family text-sap-font-size',
            'border-solid border-width-sap-message-border-width border-(--ms-bc) bg-(--ms-bg) rounded-sap-popover-border-corner-radius',
            '[--ms-tc:var(--sapTextColor)] [--ms-btn:var(--sapButton_Lite_TextColor)] [--ms-focus:var(--sapContent_FocusColor)]',
            showIcon ? 'ps-[2.4375rem]' : 'ps-[0.9375rem]',
            dismissible ? 'pe-[2.4375rem]' : 'pe-[0.9375rem]',
            TYPE[this.type() ?? 'neutral'],
            indication && [INDICATION[indication], indication.endsWith('b') ? INDICATION_LIGHT : INDICATION_STRONG],
            !this.visible() && 'hidden',
            this.userClass()
        );
    });

    protected readonly closeClass = computed(() =>
        cn(
            'absolute end-0.5 top-0.5',
            this.indicationColor() && [
                'text-(--ms-btn) enabled-hover:text-(--ms-btn) enabled-active:text-(--ms-btn)',
                'enabled-hover:bg-sap-message-button-hover-background enabled-hover:border-(--ms-btn)',
                'enabled-active:bg-sap-message-button-hover-background enabled-active:border-(--ms-btn)',
                'focus:after:border-(--ms-focus)'
            ]
        )
    );
}

/**
 * Dismisses a dismissible message strip after `duration` ms, optionally not while the pointer is
 * over it. Opens hidden: call `open()` (exported as `fdAutoDismissMessageStrip`) to show it and
 * start the timer.
 */
@Directive({
    selector: 'fd-message-strip[autoDismiss], fd-message-strip[duration], fd-message-strip[mousePersist]',
    exportAs: 'fdAutoDismissMessageStrip',
    host: {
        '(mouseenter)': 'pointerChange(true)',
        '(mouseleave)': 'pointerChange(false)'
    }
})
export class AutoDismissMessageStrip {
    readonly autoDismiss = input(true, { transform: booleanAttribute });
    /** Milliseconds before dismissal; negative values never dismiss. */
    readonly duration = input(10000);
    /** Keeps the strip open while the pointer is over it. */
    readonly mousePersist = input(false, { transform: booleanAttribute });

    private readonly strip = inject(MessageStrip, { host: true });
    private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
    private timer?: ReturnType<typeof setTimeout>;
    private pointerInside = false;

    constructor() {
        this.strip.visible.set(false);
        this.strip.onDismiss.subscribe(() => this.stop());
        inject(DestroyRef).onDestroy(() => this.stop());
    }

    open(): void {
        this.strip.open();
        this.pointerInside = this.element.nativeElement.matches(':hover');
        this.stop();
        this.start();
    }

    protected pointerChange(inside: boolean): void {
        this.pointerInside = inside;
        if (!this.mousePersist()) return;
        if (inside) this.stop();
        else this.start();
    }

    private start(): void {
        if (!this.autoDismiss() || !this.strip.dismissible() || !this.strip.visible() || this.duration() < 0) return;
        if (this.mousePersist() && this.pointerInside) return;
        this.stop();
        this.timer = setTimeout(() => this.strip.dismiss(), this.duration());
    }

    private stop(): void {
        clearTimeout(this.timer);
        this.timer = undefined;
    }
}
