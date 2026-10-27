/*
 * Port of @fundamental-ngx/core (object-number) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { formatNumber } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    LOCALE_ID,
    booleanAttribute,
    computed,
    inject,
    input
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

export type ObjectNumberStatus = 'negative' | 'critical' | 'positive' | 'informative';

const COLOR: Record<ObjectNumberStatus, string> = {
    positive: '[--on-c:var(--sapPositiveTextColor)]',
    critical: '[--on-c:var(--sapCriticalTextColor)]',
    negative: '[--on-c:var(--sapNegativeTextColor)]',
    informative: '[--on-c:var(--sapInformativeTextColor)]'
};

/** Inverted colours: regular, hover (--on-h-*) and active (--on-a-*). */
const INVERTED: Record<ObjectNumberStatus | 'neutral', string> = {
    neutral:
        '[--on-c:var(--sapTextColor)] [--on-bg:var(--sapNeutralBackground)] [--on-bc:var(--sapNeutralBorderColor)] [--on-h-c:var(--sapButton_Neutral_Hover_TextColor)] [--on-h-bg:var(--sapButton_Neutral_Hover_Background)] [--on-h-bc:var(--sapButton_Neutral_Hover_BorderColor)] [--on-a-c:var(--sapButton_Active_TextColor)] [--on-a-bg:var(--sapButton_Neutral_Active_Background)] [--on-a-bc:var(--sapButton_Neutral_Active_BorderColor)]',
    positive:
        '[--on-c:var(--sapButton_Success_TextColor)] [--on-bg:var(--sapButton_Success_Background)] [--on-bc:var(--sapButton_Success_BorderColor)] [--on-h-c:var(--sapButton_Success_Hover_TextColor)] [--on-h-bg:var(--sapButton_Success_Hover_Background)] [--on-h-bc:var(--sapButton_Success_Hover_BorderColor)] [--on-a-c:var(--sapButton_Accept_Selected_TextColor)] [--on-a-bg:var(--sapButton_Success_Active_Background)] [--on-a-bc:var(--sapButton_Success_Active_BorderColor)]',
    critical:
        '[--on-c:var(--sapButton_Critical_TextColor)] [--on-bg:var(--sapButton_Critical_Background)] [--on-bc:var(--sapButton_Critical_BorderColor)] [--on-h-c:var(--sapButton_Critical_Hover_TextColor)] [--on-h-bg:var(--sapButton_Critical_Hover_Background)] [--on-h-bc:var(--sapButton_Critical_Hover_BorderColor)] [--on-a-c:var(--sapButton_Attention_Selected_TextColor)] [--on-a-bg:var(--sapButton_Critical_Active_Background)] [--on-a-bc:var(--sapButton_Critical_Active_BorderColor)]',
    negative:
        '[--on-c:var(--sapButton_Negative_TextColor)] [--on-bg:var(--sapButton_Negative_Background)] [--on-bc:var(--sapButton_Negative_BorderColor)] [--on-h-c:var(--sapButton_Negative_Hover_TextColor)] [--on-h-bg:var(--sapButton_Negative_Hover_Background)] [--on-h-bc:var(--sapButton_Negative_Hover_BorderColor)] [--on-a-c:var(--sapButton_Reject_Selected_TextColor)] [--on-a-bg:var(--sapButton_Negative_Active_Background)] [--on-a-bc:var(--sapButton_Negative_Active_BorderColor)]',
    informative:
        '[--on-c:var(--sapButton_Information_TextColor)] [--on-bg:var(--sapButton_Information_Background)] [--on-bc:var(--sapButton_Information_BorderColor)] [--on-h-c:var(--sapButton_Information_Hover_TextColor)] [--on-h-bg:var(--sapButton_Information_Hover_Background)] [--on-h-bc:var(--sapButton_Information_Hover_BorderColor)] [--on-a-c:var(--sapButton_Selected_TextColor)] [--on-a-bg:var(--sapButton_Information_Active_Background)] [--on-a-bc:var(--sapButton_Information_Active_BorderColor)]'
};

const STATUS_TEXT: Record<ObjectNumberStatus, string> = {
    negative: 'Value State Error',
    critical: 'Value State Warning',
    positive: 'Value State Success',
    informative: 'Value State Information'
};

/**
 * Object number: a formatted number with an optional unit, coloured by status.
 *
 * ```html
 * <fd-object-number [number]="1000.37" [decimal]="2" unit="EUR" status="positive" />
 * <fd-object-number [number]="-2000" unit="EUR" status="negative" inverted interactive (click)="open()" />
 * ```
 */
@Component({
    selector: 'fd-object-number',
    exportAs: 'fdObjectNumber',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[attr.aria-labelledby]': 'ariaLabelledBy()',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.tabindex]': 'interactive() ? 0 : null',
        '[attr.role]': 'interactive() ? "button" : null',
        '(keydown.enter)': 'activate($event)',
        '(keydown.space)': 'activate($event)'
    },
    template: `
        <span [class]="numberClass()"
            ><bdi dir="ltr">{{ formattedNumber() }}</bdi
            >&nbsp;</span
        >
        <span [class]="partClass()" class="font-sap-font-light-family"
            ><bdi>{{ unit() }}</bdi></span
        >
        @if (emphasized()) {
            <span class="sr-only-sap">{{ emphasizedText() }}</span>
        }
        @if (status()) {
            <span class="sr-only-sap">{{ statusMessage() || statusText() }}</span>
        }
    `
})
export class ObjectNumber {
    readonly number = input<number | null | undefined>();
    /** Fixed number of decimal places. */
    readonly decimal = input(0);
    readonly unit = input<string | null | undefined>();
    /** Bold number (ignored when large). */
    readonly emphasized = input(false, { transform: booleanAttribute });
    readonly large = input(false, { transform: booleanAttribute });
    readonly status = input<ObjectNumberStatus | null | undefined>();
    /** Announced instead of the default text of the status. */
    readonly statusMessage = input<string | null | undefined>();
    readonly emphasizedText = input('Emphasized');
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    /** Clickable number with role="button". */
    readonly interactive = input(false, { transform: booleanAttribute });
    /** Filled badge style. */
    readonly inverted = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly locale = inject(LOCALE_ID);
    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    protected readonly formattedNumber = computed(() => {
        const number = this.number();
        if (number == null) return '';
        const decimal = this.decimal();
        return formatNumber(number, this.locale, `1.${decimal}-${decimal}`);
    });

    protected readonly statusText = computed(() => {
        const status = this.status();
        return status ? STATUS_TEXT[status] : '';
    });

    /** role="button" hosts activate with Enter and Space like native buttons. */
    protected activate(event: Event): void {
        const host = this.elementRef.nativeElement;
        if (!this.interactive() || event.target !== host) return;
        event.preventDefault();
        host.click();
    }

    protected readonly partClass = computed(() =>
        cn(
            'm-0 inline-block max-w-full truncate p-0 align-middle text-inherit',
            'leading-[inherit] [min-height:inherit]',
            this.inverted() ? '[text-shadow:none]' : 'text-shadow-sap-content-text-shadow',
            this.interactive() && !this.inverted() && 'underline group-hover/on:no-underline'
        )
    );

    protected readonly numberClass = computed(() =>
        cn(this.partClass(), !this.large() && this.emphasized() && 'font-bold')
    );

    protected readonly computedClass = computed(() => {
        const status = this.status();
        const inverted = this.inverted();
        const interactive = this.interactive();
        return cn(
            'group/on relative m-0 box-border inline-block max-w-full p-0 align-middle',
            'min-h-4 leading-4 text-sap-font-size font-sap-font-family text-(--on-c) [--on-c:var(--sapNeutralTextColor)]',
            status && COLOR[status],
            this.large() && 'min-h-8 leading-8 text-2xl font-sap-font-light-family',
            inverted && [
                'min-h-4 leading-4 px-1 py-[0.1875rem] text-sap-font-small-size font-sap-font-bold-family',
                'border border-solid border-(--on-bc) bg-(--on-bg) rounded-sap-button-border-corner-radius',
                INVERTED[status ?? 'neutral']
            ],
            interactive && [
                'cursor-pointer focus:z-[5] focus:outline-none',
                'focus:after:pointer-events-none focus:after:absolute focus:after:content-[""]',
                'focus:after:border-(length:--sapContent_FocusWidth) focus:after:[border-style:var(--sapContent_FocusStyle)] focus:after:border-sap-content-focus-color',
                inverted
                    ? [
                          'focus:after:-inset-0.5 focus:after:rounded-sap-button-border-corner-radius',
                          'hover:text-(--on-h-c) hover:bg-(--on-h-bg) hover:border-(--on-h-bc)',
                          'active:text-(--on-a-c) active:bg-(--on-a-bg) active:border-(--on-a-bc)'
                      ]
                    : 'focus:after:-inset-[0.1875rem] focus:after:rounded-[0.25rem]'
            ],
            this.userClass()
        );
    });
}
