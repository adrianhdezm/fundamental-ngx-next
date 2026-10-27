import { Directionality } from '@angular/cdk/bidi';
import {
    ChangeDetectionStrategy,
    Component,
    afterRenderEffect,
    booleanAttribute,
    computed,
    contentChildren,
    effect,
    forwardRef,
    inject,
    input,
    model,
    signal,
    untracked
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';

export type SegmentedButtonValue = string | (string | null)[] | null;

/**
 * Segmented button: a group of buttons of which one (or, with toggle, several) is selected.
 * Each button's `value` attribute identifies it. Arrow keys move between the buttons.
 *
 * ```html
 * <fd-segmented-button ariaLabel="View" [(value)]="view">
 *     <button fdButton value="list" glyph="list" ariaLabel="List"></button>
 *     <button fdButton value="grid" glyph="grid" ariaLabel="Grid"></button>
 * </fd-segmented-button>
 * ```
 */
@Component({
    selector: 'fd-segmented-button',
    exportAs: 'fdSegmentedButton',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SegmentedButton), multi: true }],
    host: {
        role: 'listbox',
        '[class]': 'computedClass()',
        '[attr.aria-multiselectable]': 'toggle()',
        '[attr.aria-orientation]': 'vertical() ? "vertical" : "horizontal"',
        '[attr.aria-roledescription]': 'groupRoleDescription()',
        '[attr.aria-disabled]': 'formDisabled() || null',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.aria-labelledby]': 'ariaLabelledBy()',
        '(click)': 'onClick($event)',
        '(keydown)': 'onKeydown($event)',
        '(focusout)': 'onTouched()'
    },
    template: `<ng-content />`
})
export class SegmentedButton implements ControlValueAccessor {
    /** Several buttons can be selected; the value is then an array. */
    readonly toggle = input(false, { transform: booleanAttribute });
    readonly vertical = input(false, { transform: booleanAttribute });
    /** Value of the selected button (an array with toggle). */
    readonly value = model<SegmentedButtonValue>(null);
    /** Name of the group (required by screen readers, or use ariaLabelledBy). */
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly groupRoleDescription = input('Segmented button group');
    readonly buttonRoleDescription = input('Segmented button');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly buttons = contentChildren(Button);
    protected readonly formDisabled = signal(false);
    /** Button that is in the tab order. */
    private readonly focusIndex = signal(0);
    private readonly dir = inject(Directionality, { optional: true });

    private onChange: (value: SegmentedButtonValue) => void = () => {};
    protected onTouched: () => void = () => {};

    constructor() {
        // reflect the value and the disabled state on the buttons
        effect(() => {
            const selected = this.selectedValues();
            const disabled = this.formDisabled();
            const buttons = this.buttons();
            untracked(() =>
                buttons.forEach((button) => {
                    button.setSelected(selected.includes(valueOf(button)));
                    button.setDisabled(disabled || button.disabled());
                })
            );
        });
        afterRenderEffect(() => {
            const buttons = this.buttons();
            const focusIndex = Math.min(this.focusIndex(), buttons.length - 1);
            const disabled = this.formDisabled();
            const description = this.buttonRoleDescription();
            buttons.forEach((button, index) => {
                const el = button.elementRef.nativeElement;
                el.setAttribute('role', 'option');
                el.setAttribute('aria-roledescription', description);
                el.setAttribute('aria-posinset', String(index + 1));
                el.setAttribute('aria-setsize', String(buttons.length));
                el.setAttribute('aria-selected', String(button.selectedState()));
                el.tabIndex = !disabled && index === focusIndex ? 0 : -1;
            });
        });
        // the selected button (or the first one) takes the tab stop
        effect(() => {
            const selected = this.selectedValues();
            const index = this.buttons().findIndex((button) => selected.includes(valueOf(button)));
            untracked(() => this.focusIndex.set(Math.max(index, 0)));
        });
    }

    private readonly selectedValues = computed(() => {
        const value = this.value();
        return value == null ? [] : Array.isArray(value) ? value : [value];
    });

    protected onClick(event: MouseEvent): void {
        const index = this.buttons().findIndex((button) =>
            button.elementRef.nativeElement.contains(event.target as Node)
        );
        const button = this.buttons()[index];
        if (!button || this.formDisabled() || button.disabledState() || button.ariaDisabled()) return;
        this.focusIndex.set(index);
        const value = valueOf(button);
        let next: SegmentedButtonValue;
        if (this.toggle()) {
            const selected = this.selectedValues();
            next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
        } else {
            next = value;
        }
        this.value.set(next);
        this.onChange(next);
    }

    protected onKeydown(event: KeyboardEvent): void {
        const buttons = this.buttons();
        const current = buttons.findIndex((button) => button.elementRef.nativeElement === document.activeElement);
        if (current < 0) return;
        const rtl = this.dir?.value === 'rtl';
        const forward = this.vertical() ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
        const backward = this.vertical() ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
        let next: number;
        if (event.key === forward) next = Math.min(current + 1, buttons.length - 1);
        else if (event.key === backward) next = Math.max(current - 1, 0);
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        else return;
        event.preventDefault();
        this.focusIndex.set(next);
        buttons[next].elementRef.nativeElement.focus();
    }

    writeValue(value: SegmentedButtonValue): void {
        this.value.set(value);
    }
    registerOnChange(fn: (value: SegmentedButtonValue) => void): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
    setDisabledState(disabled: boolean): void {
        this.formDisabled.set(disabled);
    }

    protected readonly computedClass = computed(() => {
        const vertical = this.vertical();
        return cn(
            'relative box-border inline-flex w-fit align-middle [&>button]:m-0 [&>button:hover]:z-[1]',
            // Horizon: transparent buttons on a pad; high contrast: joined bordered buttons
            'rounded-sap-button-border-corner-radius bg-sap-button-background',
            '[--seg-bw:var(--sapButton_BorderWidth)] [--seg-bc:var(--sapButton_BorderColor)] shadow-[inset_0_0_0_var(--seg-bw)_var(--seg-bc)]',
            '[&>button]:border-transparent [&>button]:bg-transparent hc:[&>button]:border-sap-button-border-color hc:[&>button]:bg-sap-button-background',
            vertical
                ? [
                      'flex-col',
                      '[&>button:not(:last-child)]:rounded-b-sap-button-segment-border-corner-radius [&>button:not(:first-child)]:rounded-t-sap-button-segment-border-corner-radius',
                      'hc:[&>button:not(:last-child)]:-mb-(--sapButton_BorderWidth)'
                  ]
                : [
                      '[&>button:not(:last-child)]:rounded-e-sap-button-segment-border-corner-radius [&>button:not(:first-child)]:rounded-s-sap-button-segment-border-corner-radius',
                      'hc:[&>button:not(:last-child)]:-me-(--sapButton_BorderWidth)'
                  ],
            this.userClass()
        );
    });
}

function valueOf(button: Button): string | null {
    return button.elementRef.nativeElement.getAttribute('value');
}
