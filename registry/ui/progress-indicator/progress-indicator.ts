/*
 * Port of @fundamental-ngx/core (progress-indicator) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    afterNextRender,
    booleanAttribute,
    computed,
    inject,
    input,
    numberAttribute,
    signal,
    viewChild
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';
import { Icon } from '@/ui/icon/icon';
import { Popover, PopoverBody, PopoverControl } from '@/ui/popover/popover';

export type ProgressIndicatorState = 'informative' | 'positive' | 'critical' | 'negative';

/** Colours of the bar, the track and the icon, and the icon, per state. */
const STATES: Record<ProgressIndicatorState | 'neutral', { vars: string; glyph: string | null }> = {
    neutral: {
        vars: '[--pi-bar:var(--sapProgress_Value_Background)] [--pi-bar-border:var(--sapProgress_Value_BorderColor)] [--pi-track:var(--sapProgress_Background)] [--pi-track-border:var(--sapProgress_BorderColor)]',
        glyph: null
    },
    informative: {
        vars: '[--pi-bar:var(--sapProgress_Value_InformationBackground)] [--pi-bar-border:var(--sapProgress_Value_InformationBorderColor)] [--pi-track:var(--sapProgress_InformationBackground)] [--pi-track-border:var(--sapProgress_InformationBorderColor)] [--pi-icon:var(--sapProgress_Value_InformationTextColor)]',
        glyph: 'information'
    },
    positive: {
        vars: '[--pi-bar:var(--sapProgress_Value_PositiveBackground)] [--pi-bar-border:var(--sapProgress_Value_PositiveBorderColor)] [--pi-track:var(--sapProgress_PositiveBackground)] [--pi-track-border:var(--sapProgress_PositiveBorderColor)] [--pi-icon:var(--sapProgress_Value_PositiveTextColor)]',
        glyph: 'sys-enter-2'
    },
    critical: {
        vars: '[--pi-bar:var(--sapProgress_Value_CriticalBackground)] [--pi-bar-border:var(--sapProgress_Value_CriticalBorderColor)] [--pi-track:var(--sapProgress_CriticalBackground)] [--pi-track-border:var(--sapProgress_CriticalBorderColor)] [--pi-icon:var(--sapProgress_Value_CriticalTextColor)]',
        glyph: 'alert'
    },
    negative: {
        vars: '[--pi-bar:var(--sapProgress_Value_NegativeBackground)] [--pi-bar-border:var(--sapProgress_Value_NegativeBorderColor)] [--pi-track:var(--sapProgress_NegativeBackground)] [--pi-track-border:var(--sapProgress_NegativeBorderColor)] [--pi-icon:var(--sapProgress_Value_NegativeTextColor)]',
        glyph: 'sys-cancel-2'
    }
};

/**
 * Progress indicator: a bar that shows how much of a task is done, with the value (or a text)
 * above it and an icon for a value state. A text that does not fit is truncated and shows in full
 * in a popover on click.
 *
 * ```html
 * <fd-progress-indicator [valueNow]="42" />
 * <fd-progress-indicator state="positive" [valueNow]="80" valueText="80 of 100 MB" />
 * ```
 */
@Component({
    selector: 'fd-progress-indicator',
    exportAs: 'fdProgressIndicator',
    imports: [Icon, Button, Popover, PopoverControl, PopoverBody],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `
        @if (truncated()) {
            <fd-popover
                class="absolute inset-x-0 top-0 block"
                placement="bottom"
                [noArrow]="false"
                fillControlMode="equal"
                [(isOpen)]="open"
            >
                <fd-popover-control>
                    <button
                        #label
                        type="button"
                        [class]="
                            labelClass +
                            ' cursor-pointer appearance-none border-0 bg-transparent p-0 text-start outline-none focus-visible:outline-sap'
                        "
                    >
                        {{ text() }}
                    </button>
                </fd-popover-control>
                <fd-popover-body>
                    <div
                        class="flex max-w-[95vw] items-center justify-between gap-2 py-1 ps-2 font-sap-font-family text-sap-font-size whitespace-normal text-sap-text-color"
                    >
                        <span>{{ text() }}</span>
                        <button
                            fdButton
                            variant="transparent"
                            glyph="decline"
                            [ariaLabel]="closeLabel()"
                            (click)="open.set(false)"
                        ></button>
                    </div>
                </fd-popover-body>
            </fd-popover>
        } @else {
            <span #label aria-hidden="true" [class]="labelClass + ' absolute inset-x-0 top-0'">{{ text() }}</span>
        }
        <div
            role="progressbar"
            [attr.aria-valuemin]="valueMin()"
            [attr.aria-valuemax]="valueMax()"
            [attr.aria-valuenow]="valueNow()"
            [attr.aria-valuetext]="text()"
            [attr.aria-label]="ariaLabel() || null"
            [attr.aria-labelledby]="ariaLabelledBy() || null"
            [class]="trackClass()"
        >
            @if (percent() > 0) {
                <div [class]="barClass()" [style.width.%]="percent()"></div>
            }
            @if (glyph(); as glyph) {
                <fd-icon [glyph]="glyph" [class]="iconClass" />
            }
        </div>
    `
})
export class ProgressIndicator {
    readonly valueNow = input(0, { transform: numberAttribute });
    readonly valueMin = input(0, { transform: numberAttribute });
    readonly valueMax = input(100, { transform: numberAttribute });
    /** Text of the value; the percentage by default. */
    readonly valueText = input<string | null | undefined>();
    readonly unit = input('%');
    readonly state = input<ProgressIndicatorState | null | undefined>();
    /** Animates changes of the value. */
    readonly animate = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly closeLabel = input('Close');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly label = viewChild<ElementRef<HTMLElement>>('label');
    protected readonly truncated = signal(false);
    protected readonly open = signal(false);

    protected readonly percent = computed(() => {
        const range = this.valueMax() - this.valueMin();
        if (range <= 0) return 0;
        return Math.min(100, Math.max(0, ((this.valueNow() - this.valueMin()) / range) * 100));
    });
    protected readonly text = computed(() => this.valueText() || `${this.valueNow()}${this.unit()}`);
    protected readonly glyph = computed(() => STATES[this.state() ?? 'neutral']?.glyph ?? null);

    constructor() {
        const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const check = () => {
                const label = this.label()?.nativeElement;
                if (label) this.truncated.set(label.scrollWidth > label.clientWidth + 1);
            };
            const observer = new ResizeObserver(check);
            observer.observe(host);
            check();
            destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    protected readonly computedClass = computed(() =>
        cn(
            'relative m-0 my-2 box-border block h-8 w-full pt-5 pb-1.5 font-sap-font-family',
            STATES[this.state() ?? 'neutral']?.vars ?? STATES.neutral.vars,
            this.userClass()
        )
    );

    /** The track; Horizon draws dots at its ends in the bar colour. */
    protected readonly trackClass = computed(() =>
        cn(
            'relative box-border flex h-1.5 min-h-1.5 w-[calc(100%-1.25rem)] min-w-16 rounded-[0.5rem] border border-solid border-(--pi-track-border) bg-(--pi-track)',
            "before:absolute before:start-0 before:top-0 before:size-1 before:rounded-full before:bg-(--pi-bar) before:content-['']",
            "after:absolute after:end-0 after:top-0 after:size-1 after:rounded-full after:bg-(--pi-bar) after:content-['']"
        )
    );

    protected readonly barClass = computed(() =>
        cn(
            'absolute -start-px -bottom-[0.1875rem] box-border h-2.5 min-w-2.5 rounded-[0.5rem] border border-solid border-(--pi-bar-border) bg-(--pi-bar)',
            this.percent() >= 100 && 'end-[-0.0625rem] w-auto!',
            this.animate() && 'transition-[width,min-width] duration-500 ease-in-out'
        )
    );

    protected readonly labelClass =
        'block max-w-full truncate leading-normal text-sap-progress-font-size text-sap-field-text-color select-none';

    protected readonly iconClass =
        'absolute -end-5 -bottom-2.5 text-sap-font-large-size text-(--pi-icon) [&_*]:align-middle';
}
