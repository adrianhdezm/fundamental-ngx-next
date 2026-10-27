/*
 * Port of @fundamental-ngx/core (illustrated-message) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    afterNextRender,
    booleanAttribute,
    computed,
    inject,
    input,
    signal
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { cn, type ClassValue } from '@/lib/utils';

/** An illustration: a sprite `url` (or inline SVG `file`) and the `id` of the symbol to show. */
export interface SvgItemConfig {
    id: string;
    url?: string;
    /** Inline SVG markup containing the element with `id`. */
    file?: string;
}

/** Illustrations per size; scene, dialog, spot and dot are the SAP names of large, medium, small and xsmall. */
export interface SvgConfig {
    large?: SvgItemConfig;
    medium?: SvgItemConfig;
    small?: SvgItemConfig;
    xsmall?: SvgItemConfig;
    scene?: SvgItemConfig;
    dialog?: SvgItemConfig;
    spot?: SvgItemConfig;
    dot?: SvgItemConfig;
}

export type IllustratedMessageType =
    'large' | 'medium' | 'small' | 'xsmall' | 'base' | 'scene' | 'dialog' | 'spot' | 'dot';
type Size = 'large' | 'medium' | 'small' | 'xsmall' | 'base';

const ALIAS: Record<IllustratedMessageType, Size> = {
    large: 'large',
    medium: 'medium',
    small: 'small',
    xsmall: 'xsmall',
    base: 'base',
    scene: 'large',
    dialog: 'medium',
    spot: 'small',
    dot: 'xsmall'
};

/** Sizes as CSS variables: padding, illustration, gaps, title and text. */
const SIZE: Record<Size, string> = {
    large: '[--im-p:1rem] [--im-ill:20rem] [--im-ill-h:15rem] [--im-ill-mb:1rem] [--im-title:2rem] [--im-title-mb:1rem] [--im-text:var(--sapFontLargeSize)] [--im-fig:40.625rem] [--im-act:0.5rem]',
    medium: '[--im-p:1rem] [--im-ill:10rem] [--im-ill-h:10rem] [--im-ill-mb:0.5rem] [--im-title:1.5rem] [--im-title-mb:0.5rem] [--im-text:var(--sapFontSize)] [--im-fig:19.938rem] [--im-act:0.5rem]',
    small: '[--im-p:0.5rem] [--im-ill:8rem] [--im-ill-h:8rem] [--im-ill-mb:0.5rem] [--im-title:1.25rem] [--im-title-mb:0.5rem] [--im-text:var(--sapFontSize)] [--im-fig:10.938rem] [--im-act:0.5rem]',
    xsmall: '[--im-p:0.25rem] [--im-ill:2.8125rem] [--im-ill-h:2.8125rem] [--im-ill-mb:0.25rem] [--im-title:1rem] [--im-title-mb:0.25rem] [--im-text:var(--sapFontSize)] [--im-fig:8.438rem] [--im-act:0.25rem]',
    base: '[--im-p:0.25rem] [--im-ill:0] [--im-ill-h:0] [--im-ill-mb:0] [--im-title:1rem] [--im-title-mb:0.25rem] [--im-text:var(--sapFontSize)] [--im-fig:8.375rem] [--im-act:0.25rem]'
};

function sizeForWidth(width: number): Size {
    return width >= 682 ? 'large' : width >= 361 ? 'medium' : width >= 261 ? 'small' : width >= 161 ? 'xsmall' : 'base';
}

let nextId = 0;

/**
 * Illustrated message: an SAP illustration with a title, a text and actions, for empty states,
 * errors and onboarding. Without a `type` the size follows the available width.
 *
 * ```html
 * <figure fd-illustrated-message type="dialog" [svgConfig]="noMail">
 *     <figcaption fd-illustrated-message-figcaption>
 *         <h3 fd-illustrated-message-title>No mail</h3>
 *         <p fd-illustrated-message-text>Check again later.</p>
 *     </figcaption>
 *     <fd-illustrated-message-actions><button fdButton label="Refresh"></button></fd-illustrated-message-actions>
 * </figure>
 * ```
 */
@Component({
    selector: '[fd-illustrated-message], [fdIllustratedMessage]',
    exportAs: 'fdIllustratedMessage',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.id]': 'id()',
        '[attr.data-size]': 'size()',
        '[class]': 'computedClass()'
    },
    template: `
        <div class="m-0 box-border flex flex-col items-center p-0">
            @if (!noSvg() && size() !== 'base') {
                <svg
                    class="m-0 mb-(--im-ill-mb) box-border flex size-(--im-ill) max-h-(--im-ill-h) max-w-(--im-ill) p-0"
                    preserveAspectRatio="xMidYMid meet"
                    [attr.role]="svgAriaLabel() ? 'img' : null"
                    [attr.aria-label]="svgAriaLabel() || null"
                    [attr.aria-hidden]="svgAriaLabel() ? null : 'true'"
                >
                    <use [attr.href]="href()" />
                </svg>
            }
            @if (inlineSvg(); as svg) {
                <div hidden [innerHTML]="svg"></div>
            }
            <ng-content select="[fd-illustrated-message-figcaption], [fdIllustratedMessageFigcaption]" />
        </div>
        <ng-content />
    `
})
export class IllustratedMessage {
    /** Size; responsive to the width when not set. */
    readonly type = input<IllustratedMessageType | null | undefined>();
    readonly svgConfig = input<SvgConfig | null | undefined>();
    /** Accessible name of the illustration; decorative without it. */
    readonly svgAriaLabel = input<string | null | undefined>();
    /** Text only, without the illustration. */
    readonly noSvg = input(false, { transform: booleanAttribute });
    readonly id = input(`fd-illustrated-message-${nextId++}`);
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly sanitizer = inject(DomSanitizer);
    private readonly width = signal(0);

    readonly size = computed<Size>(() => {
        const type = this.type();
        return type ? ALIAS[type] : sizeForWidth(this.width());
    });

    private readonly item = computed<SvgItemConfig | undefined>(() => {
        const c = this.svgConfig();
        if (!c) return undefined;
        const size = this.size();
        return {
            large: c.large ?? c.scene,
            medium: c.medium ?? c.dialog,
            small: c.small ?? c.spot,
            xsmall: c.xsmall ?? c.dot,
            base: undefined
        }[size];
    });
    protected readonly href = computed(() => {
        const item = this.item();
        return item ? `${item.url ?? ''}#${item.id}` : null;
    });
    protected readonly inlineSvg = computed(() => {
        const file = this.item()?.file;
        return file ? this.sanitizer.bypassSecurityTrustHtml(file) : null;
    });

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex w-full flex-col items-center p-(--im-p) text-center [forced-color-adjust:none]',
            'font-sap-font-family text-sap-font-size leading-[normal] font-normal text-sap-text-color',
            SIZE[this.size()],
            this.userClass()
        )
    );

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const observer = new ResizeObserver(() => this.width.set(this.el.offsetWidth));
            observer.observe(this.el);
            destroyRef.onDestroy(() => observer.disconnect());
        });
    }
}

/** The title and text of an illustrated message (a `<figcaption>` in a `<figure>`). */
@Directive({
    selector: '[fd-illustrated-message-figcaption], [fdIllustratedMessageFigcaption]',
    host: { class: 'm-0 box-border flex max-w-(--im-fig) flex-col items-center overflow-hidden p-0' }
})
export class IllustratedMessageFigcaption {}

@Directive({
    selector: '[fd-illustrated-message-title], [fdIllustratedMessageTitle]',
    host: {
        class: 'm-0 mb-(--im-title-mb) box-border w-full p-0 text-center font-sap-font-bold-family text-(length:--im-title) leading-[normal] text-sap-group-title-text-color'
    }
})
export class IllustratedMessageTitle {}

@Directive({
    selector: '[fd-illustrated-message-text], [fdIllustratedMessageText]',
    host: {
        class: 'm-0 box-border p-0 text-center text-(length:--im-text) leading-[normal] text-wrap text-sap-text-color'
    }
})
export class IllustratedMessageText {}

/** Buttons below the message. */
@Directive({
    selector: 'fd-illustrated-message-actions, [fdIllustratedMessageActions]',
    host: { class: 'm-0 mt-(--im-act) box-border flex items-center justify-center gap-2 p-0' }
})
export class IllustratedMessageActions {}
