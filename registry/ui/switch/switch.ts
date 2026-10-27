/*
 * Port of @fundamental-ngx/core (switch) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    booleanAttribute,
    computed,
    forwardRef,
    input,
    linkedSignal,
    output,
    signal,
    viewChild
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon } from '@/ui/icon/icon';

/** Track and handle colours: [unchecked, unchecked hover, checked, checked hover]. */
const COLORS = {
    standard: [
        '[--sw-track-bg:var(--sapButton_Track_Background)] [--sw-track-bc:var(--sapButton_Track_BorderColor)] [--sw-handle-bg:var(--sapButton_Handle_Background)] [--sw-handle-bc:var(--sapButton_Track_BorderColor)]',
        'group-hover/sw:[--sw-track-bg:var(--sapButton_Track_Hover_Background)] group-hover/sw:[--sw-track-bc:var(--sapButton_Track_Hover_BorderColor)] group-hover/sw:[--sw-handle-bg:var(--sapButton_Handle_Selected_Hover_Background)] group-hover/sw:[--sw-handle-bc:var(--sapButton_Handle_Hover_BorderColor)]',
        '[--sw-track-bg:var(--sapButton_Track_Selected_Background)] [--sw-track-bc:var(--sapButton_Selected_BorderColor)] [--sw-handle-bg:var(--sapButton_Selected_Background)] [--sw-handle-bc:var(--sapButton_Selected_BorderColor)]',
        'group-hover/sw:[--sw-track-bg:var(--sapButton_Track_Selected_Hover_Background)] group-hover/sw:[--sw-track-bc:var(--sapButton_Track_Selected_Hover_BorderColor)] group-hover/sw:[--sw-handle-bg:var(--sapButton_Handle_Selected_Hover_Background)] group-hover/sw:[--sw-handle-bc:var(--sapButton_Handle_Selected_Hover_BorderColor)]'
    ],
    semantic: [
        '[--sw-track-bg:var(--sapButton_Track_Negative_Background)] [--sw-track-bc:var(--sapButton_Track_Negative_BorderColor)] [--sw-handle-bg:var(--sapButton_Handle_Negative_Background)] [--sw-handle-bc:var(--sapButton_Track_Negative_Background)] hc:[--sw-handle-bc:var(--sapButton_Handle_Negative_BorderColor)]',
        'group-hover/sw:[--sw-track-bg:var(--sapButton_Track_Negative_Hover_Background)] group-hover/sw:[--sw-track-bc:var(--sapButton_Track_Negative_Hover_BorderColor)] group-hover/sw:[--sw-handle-bg:var(--sapButton_Handle_Negative_Hover_Background)] group-hover/sw:[--sw-handle-bc:var(--sapButton_Handle_Negative_Hover_BorderColor)]',
        '[--sw-track-bg:var(--sapButton_Track_Positive_Background)] [--sw-track-bc:var(--sapButton_Track_Positive_BorderColor)] [--sw-handle-bg:var(--sapButton_Handle_Positive_Background)] [--sw-handle-bc:var(--sapButton_Track_Positive_Background)] hc:[--sw-handle-bc:var(--sapButton_Handle_Positive_BorderColor)]',
        'group-hover/sw:[--sw-track-bg:var(--sapButton_Track_Positive_Hover_Background)] group-hover/sw:[--sw-track-bc:var(--sapButton_Track_Positive_Hover_BorderColor)] group-hover/sw:[--sw-handle-bg:var(--sapButton_Handle_Positive_Hover_Background)] group-hover/sw:[--sw-handle-bc:var(--sapButton_Handle_Positive_Hover_BorderColor)]'
    ]
} as const;

/** Handle offsets of the sliding track (off/on), cozy and compact. RTL mirrors them. */
const OFFSETS = {
    standard: '[--sw-off:-1.2475rem] [--sw-on:-0.5075rem] compact:[--sw-off:-0.8125rem] compact:[--sw-on:-0.3125rem]',
    text: '[--sw-off:-1.125rem] [--sw-on:-0.25rem] compact:[--sw-off:-0.5625rem] compact:[--sw-on:0.1875rem]'
};

let nextId = 0;

/**
 * Switch: turns a setting on or off immediately. A semantic switch shows accept/decline colours;
 * `activeText`/`inactiveText` show short texts (e.g. ON/OFF) instead of icons.
 *
 * ```html
 * <fd-switch [(ngModel)]="wifi" ariaLabel="Wi-Fi" />
 * <fd-switch semantic [(checked)]="approved">Approved</fd-switch>
 * ```
 */
@Component({
    selector: 'fd-switch',
    exportAs: 'fdSwitch',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Switch), multi: true }],
    host: {
        '[class]': 'hostClass()',
        '[attr.id]': 'id()',
        '(focusout)': 'onTouched()'
    },
    template: `
        <label [class]="labelClass()" [attr.aria-label]="ariaLabel() || null" (click)="focus()">
            <span class="relative inline-block">
                <input
                    #input
                    type="checkbox"
                    role="switch"
                    class="peer absolute m-0 size-0 p-0 opacity-0 appearance-none"
                    [id]="id() + '-input'"
                    [attr.name]="name() || null"
                    [disabled]="disabledState()"
                    [checked]="isChecked()"
                    [attr.aria-required]="required() || null"
                    [attr.aria-checked]="isChecked()"
                    [attr.aria-labelledby]="labelledBy()"
                    (change)="toggle($event)"
                />
                <span [class]="sliderClass()">
                    <span [class]="trackClass()" aria-hidden="true">
                        @if (activeText()) {
                            <span [class]="textClass(true)">{{ activeText() }}</span>
                        } @else {
                            <fd-icon role="presentation" glyph="accept" [class]="iconClass(true)" />
                        }
                        <span [class]="handleClass()" role="presentation"></span>
                        @if (inactiveText()) {
                            <span [class]="textClass(false)">{{ inactiveText() }}</span>
                        } @else {
                            <fd-icon
                                role="presentation"
                                [glyph]="semantic() ? 'decline' : 'less'"
                                [class]="iconClass(false)"
                            />
                        }
                    </span>
                </span>
                @if (semantic()) {
                    <span [id]="id() + '-semantic-label'" class="hidden">{{
                        isChecked() ? acceptLabel() : declineLabel()
                    }}</span>
                }
            </span>
            <ng-content />
        </label>
    `
})
export class Switch implements ControlValueAccessor {
    readonly id = input(`fd-switch-${nextId++}`);
    /** On/off state; two-way bindable with [(checked)]. */
    readonly checked = input(false, { transform: booleanAttribute });
    /** Accept/decline colours and icons. */
    readonly semantic = input(false, { transform: booleanAttribute });
    /** Short text shown when on (e.g. "ON"); replaces the icon. */
    readonly activeText = input('');
    /** Short text shown when off (e.g. "OFF"); replaces the icon. */
    readonly inactiveText = input('');
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly required = input(false, { transform: booleanAttribute });
    readonly name = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    /** Announced state of semantic switches. */
    readonly acceptLabel = input('Accept');
    readonly declineLabel = input('Decline');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly checkedChange = output<boolean>();

    private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

    readonly isChecked = linkedSignal(() => this.checked());
    protected readonly disabledState = linkedSignal(() => this.disabled());
    /** Transitions only after the first user change, so the initial state does not animate in. */
    private readonly animate = signal(false);

    private readonly hasText = computed(() => !!(this.activeText() || this.inactiveText()));

    protected readonly labelledBy = computed(
        () =>
            [this.ariaLabelledBy(), this.semantic() ? `${this.id()}-semantic-label` : ''].filter(Boolean).join(' ') ||
            null
    );

    protected readonly hostClass = computed(() => cn('block', this.userClass()));

    protected readonly labelClass = computed(() => {
        const kind = this.semantic() ? 'semantic' : 'standard';
        const colors = COLORS[kind];
        const on = this.isChecked();
        return cn(
            'group/sw relative m-0 box-border flex w-fit max-w-full items-center gap-2 overflow-visible',
            'px-[0.3125rem] py-2.5 compact:py-1.5 cursor-pointer',
            'font-sap-font-family text-sap-font-size leading-[normal] text-sap-content-label-color',
            this.semantic() && 'compact:py-[0.1875rem] compact:px-0',
            on ? [colors[2], colors[3]] : [colors[0], colors[1]],
            this.hasText() ? OFFSETS.text : OFFSETS.standard,
            this.disabledState() && 'pointer-events-none cursor-auto opacity-(--sapContent_DisabledOpacity)'
        );
    });

    protected readonly sliderClass = computed(() =>
        cn(
            'relative m-0 block box-content p-0 rounded-[0.75rem] border-0',
            'h-6 w-10 compact:h-5 compact:w-8',
            this.hasText() && 'w-[2.875rem] compact:w-[2.75rem]',
            'bg-(--sw-track-bg) shadow-[inset_0_0_0_0.0625rem_var(--sw-track-bc)]',
            // focus frame around the track
            "peer-focus:before:absolute peer-focus:before:block peer-focus:before:content-['']",
            'peer-focus:before:-inset-[calc(var(--sapContent_FocusWidth)*2)] peer-focus:before:rounded-[calc(0.75rem_+_var(--sapContent_FocusWidth)*2)]',
            'peer-focus:before:border-(length:--sapContent_FocusWidth) peer-focus:before:[border-style:var(--sapContent_FocusStyle)] peer-focus:before:border-sap-content-focus-color',
            this.animate() && 'transition-all duration-100'
        )
    );

    protected readonly trackClass = computed(() =>
        cn(
            'absolute top-1/2 m-0 flex min-w-[4.25rem] compact:min-w-[3.125rem] items-center justify-center p-0',
            '[--sw-dir:1] rtl:[--sw-dir:-1]',
            this.isChecked() ? '[--sw-x:var(--sw-on)]' : '[--sw-x:var(--sw-off)]',
            '[transform:translate(calc(var(--sw-x)*var(--sw-dir)),-50%)]',
            this.animate() && 'transition-all duration-100'
        )
    );

    protected readonly handleClass = computed(() =>
        cn(
            'm-0 box-content p-0 bg-clip-padding hc:box-border',
            'min-h-5 min-w-6 rounded-[0.75rem] compact:min-h-4 compact:min-w-5',
            this.hasText() && 'min-w-7 compact:min-w-7',
            'border-[0.125rem] border-solid border-(--sw-handle-bc) bg-(--sw-handle-bg)'
        )
    );

    protected iconClass(on: boolean): string {
        const visible = on === this.isChecked();
        return cn(
            'absolute flex w-7 min-w-7 items-center justify-center leading-[1.375rem]',
            'text-sap-font-large-size compact:text-sap-font-size',
            this.semantic()
                ? on
                    ? 'text-sap-button-track-positive-border-color'
                    : 'text-sap-button-track-negative-border-color'
                : on
                  ? 'text-sap-button-handle-selected-text-color'
                  : 'text-sap-button-handle-text-color',
            visible ? 'visible opacity-100' : 'invisible opacity-0',
            this.animate() && 'transition-[visibility,opacity] delay-[30ms] duration-0'
        );
    }

    protected textClass(on: boolean): string {
        const visible = on === this.isChecked();
        return cn(
            'absolute flex w-7 items-center justify-center leading-none uppercase',
            'font-sap-font-semibold-duplex-family text-sap-font-small-size',
            on ? 'text-sap-button-handle-selected-text-color' : 'text-sap-button-handle-text-color',
            visible ? 'visible opacity-100' : 'invisible opacity-0'
        );
    }

    protected onChange: (value: boolean) => void = () => {};
    protected onTouched: () => void = () => {};

    writeValue(value: boolean): void {
        this.isChecked.set(!!value);
    }

    registerOnChange(fn: (value: boolean) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
        this.disabledState.set(disabled);
    }

    focus(): void {
        this.inputRef().nativeElement.focus();
    }

    protected toggle(event: Event): void {
        const value = (event.target as HTMLInputElement).checked;
        this.animate.set(true);
        this.isChecked.set(value);
        this.onChange(value);
        this.checkedChange.emit(value);
    }
}
