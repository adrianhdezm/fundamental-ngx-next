import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    ElementRef,
    InjectionToken,
    booleanAttribute,
    computed,
    effect,
    inject,
    input,
    isDevMode,
    linkedSignal,
    signal,
    type OnInit
} from '@angular/core';
import { cn, cva, type ClassValue, type VariantProps } from '@/lib/utils';
import { Icon, type IconFont } from '@/ui/icon/icon';

export const buttonVariants = cva(
    [
        'relative box-border inline-flex items-center justify-center gap-1.5 align-middle',
        'h-sap-element-height max-h-sap-element-height min-w-9 px-[calc(0.625rem_-_var(--sapButton_BorderWidth))]',
        'compact:h-sap-element-compact-height compact:max-h-sap-element-compact-height compact:min-w-8 compact:px-[calc(0.5rem_-_var(--sapButton_BorderWidth))]',
        'rounded-sap-button-border-corner-radius border-solid border-width-sap-button-border-width',
        'text-sap-font-size leading-[normal] text-center whitespace-nowrap no-underline select-none cursor-pointer appearance-none outline-0 [forced-color-adjust:none]',
        // extended touch area: 2.75rem cozy, 2rem compact
        "before:absolute before:inset-x-0 before:-inset-y-[calc((2.75rem_-_var(--sapElement_Height))/2)] before:content-['']",
        'compact:before:-inset-y-[calc((2rem_-_var(--sapElement_Compact_Height))/2)]',
        // SAP focus indicator: an inner rounded frame
        "focus:z-[5] focus:after:pointer-events-none focus:after:absolute focus:after:inset-(--sapButton_BorderWidth) focus:after:content-['']",
        'focus:after:rounded-[calc(var(--sapButton_BorderCornerRadius)_-_var(--sapContent_FocusWidth))]',
        'focus:after:border-(length:--sapContent_FocusWidth) focus:after:[border-style:var(--sapContent_FocusStyle)] focus:after:border-sap-content-focus-color',
        'disabled:cursor-not-allowed disabled:opacity-(--sapContent_DisabledOpacity) disabled:shadow-none',
        'aria-disabled:cursor-not-allowed aria-disabled:opacity-(--sapContent_DisabledOpacity) aria-disabled:shadow-none'
    ],
    {
        variants: {
            variant: {
                standard: [
                    'font-sap-button-font-family bg-sap-button-background border-sap-button-border-color text-sap-button-text-color',
                    'enabled-hover:bg-sap-button-hover-background enabled-hover:border-sap-button-hover-border-color enabled-hover:text-sap-button-hover-text-color',
                    'enabled-active:bg-sap-button-active-background enabled-active:border-sap-button-active-border-color enabled-active:text-sap-button-active-text-color',
                    'toggled:bg-sap-button-selected-background toggled:border-sap-button-selected-border-color toggled:text-sap-button-selected-text-color',
                    'toggled:enabled-hover:bg-sap-button-selected-hover-background toggled:enabled-hover:border-sap-button-selected-hover-border-color toggled:enabled-hover:text-sap-button-selected-text-color',
                    'toggled:enabled-active:bg-sap-button-selected-hover-background toggled:enabled-active:border-sap-button-selected-hover-border-color toggled:enabled-active:text-sap-button-selected-text-color'
                ],
                emphasized: [
                    'font-sap-button-emphasized-font-family border-width-sap-button-emphasized-border-width',
                    'bg-sap-button-emphasized-background border-sap-button-emphasized-border-color text-sap-button-emphasized-text-color',
                    'enabled-hover:bg-sap-button-emphasized-hover-background enabled-hover:border-sap-button-emphasized-hover-border-color enabled-hover:text-sap-button-emphasized-hover-text-color',
                    'enabled-active:bg-sap-button-emphasized-active-background enabled-active:border-sap-button-emphasized-active-border-color enabled-active:text-sap-button-emphasized-active-text-color',
                    'toggled:bg-sap-button-selected-background toggled:border-sap-button-selected-border-color toggled:text-sap-button-selected-text-color',
                    'toggled:enabled-hover:bg-sap-button-selected-hover-background toggled:enabled-hover:border-sap-button-selected-hover-border-color toggled:enabled-hover:text-sap-button-selected-text-color',
                    'toggled:enabled-active:bg-sap-button-selected-hover-background toggled:enabled-active:border-sap-button-selected-hover-border-color toggled:enabled-active:text-sap-button-selected-text-color',
                    'focus:after:border-sap-content-contrast-focus-color focus:enabled-active:after:border-sap-content-focus-color',
                    'toggled:focus:after:border-sap-content-focus-color compact:focus:enabled-active:after:border-transparent'
                ],
                ghost: [
                    'font-sap-button-font-family bg-sap-button-background border-sap-button-border-color text-sap-button-text-color',
                    'enabled-hover:bg-sap-button-hover-background enabled-hover:border-sap-button-hover-border-color enabled-hover:text-sap-button-hover-text-color',
                    'enabled-active:bg-sap-button-active-background enabled-active:border-sap-button-active-border-color enabled-active:text-sap-button-active-text-color',
                    'toggled:bg-sap-button-selected-background toggled:border-sap-button-selected-border-color toggled:text-sap-button-selected-text-color',
                    'toggled:enabled-hover:bg-sap-button-selected-hover-background toggled:enabled-hover:border-sap-button-selected-hover-border-color toggled:enabled-hover:text-sap-button-selected-text-color',
                    'toggled:enabled-active:bg-sap-button-selected-hover-background toggled:enabled-active:border-sap-button-selected-hover-border-color toggled:enabled-active:text-sap-button-selected-text-color'
                ],
                positive: [
                    'font-sap-button-font-family bg-sap-button-accept-background border-sap-button-accept-border-color text-sap-button-accept-text-color',
                    'enabled-hover:bg-sap-button-accept-hover-background enabled-hover:border-sap-button-accept-hover-border-color enabled-hover:text-sap-button-accept-hover-text-color',
                    'enabled-active:bg-sap-button-accept-active-background enabled-active:border-sap-button-accept-active-border-color enabled-active:text-sap-button-accept-active-text-color',
                    'toggled:bg-sap-button-accept-selected-background toggled:border-sap-button-accept-selected-border-color toggled:text-sap-button-accept-selected-text-color',
                    'toggled:enabled-hover:bg-sap-button-accept-selected-hover-background toggled:enabled-hover:border-sap-button-accept-selected-hover-border-color toggled:enabled-hover:text-sap-button-accept-selected-text-color',
                    'toggled:enabled-active:bg-sap-button-accept-selected-hover-background toggled:enabled-active:border-sap-button-accept-selected-hover-border-color toggled:enabled-active:text-sap-button-accept-selected-text-color'
                ],
                negative: [
                    'font-sap-button-font-family bg-sap-button-reject-background border-sap-button-reject-border-color text-sap-button-reject-text-color',
                    'enabled-hover:bg-sap-button-reject-hover-background enabled-hover:border-sap-button-reject-hover-border-color enabled-hover:text-sap-button-reject-hover-text-color',
                    'enabled-active:bg-sap-button-reject-active-background enabled-active:border-sap-button-reject-active-border-color enabled-active:text-sap-button-reject-active-text-color',
                    'toggled:bg-sap-button-reject-selected-background toggled:border-sap-button-reject-selected-border-color toggled:text-sap-button-reject-selected-text-color',
                    'toggled:enabled-hover:bg-sap-button-reject-selected-hover-background toggled:enabled-hover:border-sap-button-reject-selected-hover-border-color toggled:enabled-hover:text-sap-button-reject-selected-text-color',
                    'toggled:enabled-active:bg-sap-button-reject-selected-hover-background toggled:enabled-active:border-sap-button-reject-selected-hover-border-color toggled:enabled-active:text-sap-button-reject-selected-text-color'
                ],
                attention: [
                    'font-sap-button-font-family bg-sap-button-attention-background border-sap-button-attention-border-color text-sap-button-attention-text-color',
                    'enabled-hover:bg-sap-button-attention-hover-background enabled-hover:border-sap-button-attention-hover-border-color enabled-hover:text-sap-button-attention-hover-text-color',
                    'enabled-active:bg-sap-button-attention-active-background enabled-active:border-sap-button-attention-active-border-color enabled-active:text-sap-button-attention-active-text-color',
                    'toggled:bg-sap-button-attention-selected-background toggled:border-sap-button-attention-selected-border-color toggled:text-sap-button-attention-selected-text-color',
                    'toggled:enabled-hover:bg-sap-button-attention-selected-hover-background toggled:enabled-hover:border-sap-button-attention-selected-hover-border-color toggled:enabled-hover:text-sap-button-attention-selected-text-color',
                    'toggled:enabled-active:bg-sap-button-attention-selected-hover-background toggled:enabled-active:border-sap-button-attention-selected-hover-border-color toggled:enabled-active:text-sap-button-attention-selected-text-color'
                ],
                transparent: [
                    'font-sap-button-font-family bg-sap-button-lite-background border-sap-button-lite-border-color text-sap-button-lite-text-color',
                    'enabled-hover:bg-sap-button-lite-hover-background enabled-hover:border-sap-button-lite-hover-border-color enabled-hover:text-sap-button-lite-hover-text-color',
                    'enabled-active:bg-sap-button-lite-active-background enabled-active:border-sap-button-lite-active-border-color enabled-active:text-sap-button-active-text-color',
                    'toggled:bg-sap-button-selected-background toggled:border-sap-button-selected-border-color toggled:text-sap-button-selected-text-color',
                    'toggled:enabled-hover:bg-sap-button-selected-hover-background toggled:enabled-hover:border-sap-button-selected-hover-border-color toggled:enabled-hover:text-sap-button-selected-text-color',
                    'toggled:enabled-active:bg-sap-button-selected-hover-background toggled:enabled-active:border-sap-button-selected-hover-border-color toggled:enabled-active:text-sap-button-selected-text-color'
                ]
            },
            menu: {
                true: 'max-w-48',
                false: ''
            },
            /** Fills the width of its container. */
            fullWidth: {
                true: 'flex w-full min-w-full',
                false: ''
            },
            /** Minimum width for decisive actions (OK, Cancel) in dialogs and footers. */
            decisive: {
                true: 'min-w-16',
                false: ''
            }
        },
        defaultVariants: { variant: 'standard', menu: false, fullWidth: false, decisive: false }
    }
);

export type ButtonVariant = Exclude<VariantProps<typeof buttonVariants>['variant'], null | undefined>;
export type GlyphPosition = 'before' | 'after';

/** Button types that announce their semantics to screen readers through a hidden description. */
const SPECIAL_TYPE_DESCRIPTIONS: Partial<Record<ButtonVariant, string>> = {
    emphasized: 'Default Action',
    positive: 'Positive Action',
    negative: 'Negative Action',
    attention: 'Warning'
};

/** Button types that support a badge. */
export const BADGE_ENABLED_BUTTON_VARIANTS: ButtonVariant[] = ['emphasized', 'standard', 'ghost', 'transparent'];

export const FD_BUTTON = new InjectionToken<Button>('FdButton');

let nextId = 0;

/**
 * SAP Fiori button. Enhances a native `<button>` or `<a>`.
 *
 * ```html
 * <button fdButton label="Save" variant="emphasized"></button>
 * <button fdButton glyph="add" ariaLabel="Add"></button>
 * <button fdButton [toggled]="bold()" (click)="bold.set(!bold())">Bold</button>
 * ```
 */
@Component({
    selector: 'button[fdButton], a[fdButton]',
    exportAs: 'fdButton',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: FD_BUTTON, useExisting: Button }],
    host: {
        '[class]': 'computedClass()',
        '[attr.id]': 'id()',
        '[attr.type]': 'isNativeButton ? type() : null',
        '[attr.disabled]': 'isNativeButton && disabledState() ? "" : null',
        '[attr.aria-disabled]': 'ariaDisabledValue()',
        '[attr.tabindex]': '!isNativeButton && disabledState() ? -1 : null',
        '[attr.aria-pressed]': 'toggledState() ? "true" : null',
        '[attr.aria-selected]': 'selectedState() ? "true" : null',
        '[attr.aria-label]': 'computedAriaLabel()',
        '[attr.aria-describedby]': 'computedDescribedBy()',
        '(click)': 'onClick($event)'
    },
    template: `
        @if (glyph() && glyphPosition() === 'before') {
            <fd-icon [glyph]="glyph()" [font]="glyphFont()" />
        }
        @if (label()) {
            <span [class]="labelClass()">{{ label() }}</span>
        }
        <ng-content />
        @if (glyph() && glyphPosition() === 'after') {
            <fd-icon [glyph]="glyph()" [font]="glyphFont()" />
        }
        @if (menu()) {
            <fd-icon glyph="slim-arrow-down" />
        }
        <ng-content select="fd-button-badge, [fdButtonBadge]" />
        @if (!userDescribedBy() && effectiveDescription()) {
            <span class="sr-only-sap" [attr.id]="id() + '-description'">{{ effectiveDescription() }}</span>
        }
        @if (!userDescribedBy() && typeDescription()) {
            <span class="sr-only-sap" [attr.id]="id() + '-type-description'">{{ typeDescription() }}</span>
        }
    `
})
export class Button implements OnInit {
    readonly elementRef = inject<ElementRef<HTMLButtonElement | HTMLAnchorElement>>(ElementRef);
    protected readonly isNativeButton = this.elementRef.nativeElement.tagName === 'BUTTON';

    /** Element id. Generated when not set. */
    readonly id = input(`fd-button-${nextId++}`);

    /** Visual type of the button. */
    readonly variant = input<ButtonVariant>('standard');

    /** Text of the button. Content projection works too. */
    readonly label = input<string | null | undefined>();

    /** Glyph name of an SAP icon shown in the button. */
    readonly glyph = input<string | null | undefined>();

    /** Whether the glyph goes before or after the label. */
    readonly glyphPosition = input<GlyphPosition>('before');

    /** Icon font of the glyph. */
    readonly glyphFont = input<IconFont>('SAP-icons');

    /** Shows the menu arrow; use for buttons that open a menu. */
    readonly menu = input(false, { alias: 'fdMenu', transform: booleanAttribute });

    /** Toggle button state, exposed as aria-pressed. */
    readonly toggled = input(false, { transform: booleanAttribute });

    /** Selected state inside a group, exposed as aria-selected. */
    readonly selected = input(false, { transform: booleanAttribute });

    /** Native disabled state. On anchors it becomes aria-disabled and removes the link from the tab order. */
    readonly disabled = input(false, { transform: booleanAttribute });

    /** Disabled for assistive technology while staying focusable (e.g. to keep a tooltip reachable). */
    readonly ariaDisabled = input(false, { alias: 'aria-disabled', transform: booleanAttribute });

    /** Native type of a `<button>`; defaults to "button" so it never submits a form by accident. */
    readonly type = input<'button' | 'submit' | 'reset' | string | null | undefined>('button');

    /** Fills the width of its container. */
    readonly fullWidth = input(false, { transform: booleanAttribute });

    /** Minimum width for decisive actions. */
    readonly decisive = input(false, { transform: booleanAttribute });

    /** Accessible name. Icon-only buttons need it. */
    readonly ariaLabel = input<string | null | undefined>();

    /** Extra description announced after the name. */
    readonly ariaDescription = input<string | null | undefined>();

    /** Overrides the default description of the special types (emphasized, positive, negative, attention). */
    readonly ariaTypeDescription = input<string | null | undefined>();

    /** Ids of elements that describe the button. Replaces the generated descriptions. */
    readonly ariaDescribedBy = input<string | null | undefined>();

    readonly userClass = input<ClassValue>('', { alias: 'class' });

    /** Internal state, writable by parents such as segmented buttons and toolbars. */
    readonly toggledState = linkedSignal(() => this.toggled());
    readonly selectedState = linkedSignal(() => this.selected());
    readonly variantState = linkedSignal(() => this.variant());
    readonly disabledState = linkedSignal(() => this.disabled());

    private readonly nativeAriaLabel = signal<string | null>(null);
    private readonly nativeDescription = signal<string | null>(null);
    private readonly nativeDescribedBy = signal<string | null>(null);

    protected readonly userDescribedBy = computed(() => this.ariaDescribedBy() ?? this.nativeDescribedBy());

    protected readonly effectiveDescription = computed(() => this.ariaDescription() ?? this.nativeDescription());

    protected readonly typeDescription = computed(() => {
        const fallback = SPECIAL_TYPE_DESCRIPTIONS[this.variantState()];
        return fallback ? this.ariaTypeDescription() || fallback : null;
    });

    protected readonly computedDescribedBy = computed(() => {
        const user = this.userDescribedBy();
        if (user != null) return user || null;
        const ids: string[] = [];
        if (this.effectiveDescription()) ids.push(`${this.id()}-description`);
        if (this.typeDescription()) ids.push(`${this.id()}-type-description`);
        return ids.length ? ids.join(' ') : null;
    });

    protected readonly computedAriaLabel = computed(() => {
        if (this.ariaLabel()) return this.ariaLabel();
        if (this.nativeAriaLabel()) return this.nativeAriaLabel();
        // icon-only special buttons fall back to the glyph name
        if (SPECIAL_TYPE_DESCRIPTIONS[this.variantState()] && !this.label()) {
            return this.glyph()?.replace(/-/g, ' ') || null;
        }
        return null;
    });

    protected readonly ariaDisabledValue = computed(() => {
        if (this.ariaDisabled()) return 'true';
        return !this.isNativeButton && this.disabledState() ? 'true' : null;
    });

    protected readonly labelClass = computed(() =>
        cn('truncate font-[inherit] text-inherit', this.menu() && 'flex-1 text-start leading-4')
    );

    protected readonly computedClass = computed(() =>
        cn(
            buttonVariants({
                variant: this.variantState(),
                menu: this.menu(),
                fullWidth: this.fullWidth(),
                decisive: this.decisive()
            }),
            this.userClass()
        )
    );

    ngOnInit(): void {
        const el = this.elementRef.nativeElement;
        this.nativeAriaLabel.set(el.getAttribute('aria-label'));
        this.nativeDescribedBy.set(el.getAttribute('aria-describedby'));
        const description = el.getAttribute('aria-description');
        if (description) {
            this.nativeDescription.set(description);
            // avoid announcing the description twice
            el.removeAttribute('aria-description');
        }
    }

    /** Safari does not focus buttons on click; focus them so the focus indicator shows consistently. */
    protected onClick(event: Event): void {
        if (!this.isNativeButton && this.disabledState()) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        const target = event.currentTarget as HTMLElement | null;
        if (target && document.activeElement !== target) target.focus();
    }

    setDisabled(value: boolean): void {
        this.disabledState.set(value);
    }

    setToggled(value: boolean): void {
        this.toggledState.set(value);
    }

    setSelected(value: boolean): void {
        this.selectedState.set(value);
    }

    setVariant(value: ButtonVariant): void {
        this.variantState.set(value);
    }
}

/**
 * Counter badge on a button (up to 4 characters). Supported on standard, emphasized, ghost and
 * transparent buttons.
 *
 * ```html
 * <button fdButton glyph="bell" ariaLabel="Notifications"><fd-button-badge content="12" /></button>
 * ```
 */
@Directive({
    selector: 'fd-button-badge, [fdButtonBadge]',
    host: {
        '[class]': 'computedClass()',
        '[textContent]': 'content() ?? ""'
    }
})
export class ButtonBadge {
    /** Badge text, usually a number. */
    readonly content = input<string | number | null | undefined>();

    /** Dot-only badge for attention without a number. */
    readonly attention = input(false, { transform: booleanAttribute });

    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly button = inject(FD_BUTTON, { optional: true });

    protected readonly computedClass = computed(() =>
        cn(
            'z-[1] box-border inline-flex items-center justify-center whitespace-nowrap',
            'absolute -top-[0.3125rem] -end-[0.3125rem] h-4 px-[0.3125rem] rounded-lg',
            'border border-solid border-sap-content-badge-border-color bg-sap-content-badge-background',
            'font-sap-font-family text-sap-font-small-size text-sap-content-badge-text-color leading-[normal]',
            'compact:static compact:ms-1',
            this.attention() &&
                'size-3 px-0 -top-[0.1875rem] -end-[0.1875rem] compact:absolute compact:ms-0 compact:size-2.5',
            this.userClass()
        )
    );

    constructor() {
        if (isDevMode()) {
            effect(() => {
                const text = String(this.content() ?? '');
                if (text.length > 4) console.warn('fd-button-badge: content should not be longer than 4 characters');
                const variant = this.button?.variantState();
                if (variant && !BADGE_ENABLED_BUTTON_VARIANTS.includes(variant)) {
                    console.warn(`fd-button-badge: supported on ${BADGE_ENABLED_BUTTON_VARIANTS.join(', ')} buttons`);
                }
            });
        }
    }
}
