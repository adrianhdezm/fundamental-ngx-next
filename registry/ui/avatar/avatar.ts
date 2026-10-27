/*
 * Port of @fundamental-ngx/core (avatar) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostAttributeToken,
    booleanAttribute,
    computed,
    effect,
    inject,
    input,
    output,
    signal,
    viewChild
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon, type IconFont } from '@/ui/icon/icon';

export type AvatarSize = 'xs' | 's' | 'sm' | 'm' | 'md' | 'l' | 'lg' | 'xl';
export type ColorAccent = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type IndicationColor = ColorAccent;
export type AvatarValueState = 'positive' | 'caution' | 'negative' | 'information';

/** Accent colours: background, border, text and hover background of each SAP avatar palette. */
const ACCENT: Record<ColorAccent, string> = {
    1: '[--av-bg:var(--sapAvatar_1_Background)] [--av-border:var(--sapAvatar_1_BorderColor)] [--av-color:var(--sapAvatar_1_TextColor)] [--av-hover-bg:var(--sapAvatar_1_Hover_Background)]',
    2: '[--av-bg:var(--sapAvatar_2_Background)] [--av-border:var(--sapAvatar_2_BorderColor)] [--av-color:var(--sapAvatar_2_TextColor)] [--av-hover-bg:var(--sapAvatar_2_Hover_Background)]',
    3: '[--av-bg:var(--sapAvatar_3_Background)] [--av-border:var(--sapAvatar_3_BorderColor)] [--av-color:var(--sapAvatar_3_TextColor)] [--av-hover-bg:var(--sapAvatar_3_Hover_Background)]',
    4: '[--av-bg:var(--sapAvatar_4_Background)] [--av-border:var(--sapAvatar_4_BorderColor)] [--av-color:var(--sapAvatar_4_TextColor)] [--av-hover-bg:var(--sapAvatar_4_Hover_Background)]',
    5: '[--av-bg:var(--sapAvatar_5_Background)] [--av-border:var(--sapAvatar_5_BorderColor)] [--av-color:var(--sapAvatar_5_TextColor)] [--av-hover-bg:var(--sapAvatar_5_Hover_Background)]',
    6: '[--av-bg:var(--sapAvatar_6_Background)] [--av-border:var(--sapAvatar_6_BorderColor)] [--av-color:var(--sapAvatar_6_TextColor)] [--av-hover-bg:var(--sapAvatar_6_Hover_Background)]',
    7: '[--av-bg:var(--sapAvatar_7_Background)] [--av-border:var(--sapAvatar_7_BorderColor)] [--av-color:var(--sapAvatar_7_TextColor)] [--av-hover-bg:var(--sapAvatar_7_Hover_Background)]',
    8: '[--av-bg:var(--sapAvatar_8_Background)] [--av-border:var(--sapAvatar_8_BorderColor)] [--av-color:var(--sapAvatar_8_TextColor)] [--av-hover-bg:var(--sapAvatar_8_Hover_Background)]',
    9: '[--av-bg:var(--sapAvatar_9_Background)] [--av-border:var(--sapAvatar_9_BorderColor)] [--av-color:var(--sapAvatar_9_TextColor)] [--av-hover-bg:var(--sapAvatar_9_Hover_Background)]',
    10: '[--av-bg:var(--sapAvatar_10_Background)] [--av-border:var(--sapAvatar_10_BorderColor)] [--av-color:var(--sapAvatar_10_TextColor)] [--av-hover-bg:var(--sapAvatar_10_Hover_Background)]'
};

/** Indication colours, which also define active (pressed/toggled) colours. */
const INDICATION: Record<IndicationColor, string> = {
    1: '[--av-bg:var(--sapIndicationColor_1_Background)] [--av-border:var(--sapIndicationColor_1_BorderColor)] [--av-color:var(--sapIndicationColor_1_TextColor)] [--av-hover-bg:var(--sapIndicationColor_1_Hover_Background)] [--av-active-bg:var(--sapIndicationColor_1_Active_Background)] [--av-active-border:var(--sapIndicationColor_1_Active_BorderColor)] [--av-active-color:var(--sapIndicationColor_1_Active_TextColor)] [--av-active-hover-bg:var(--sapIndicationColor_1_Active_Background)] [--av-active-hover-border:var(--sapIndicationColor_1_Active_BorderColor)] [--av-active-hover-color:var(--sapIndicationColor_1_Active_TextColor)]',
    2: '[--av-bg:var(--sapIndicationColor_2_Background)] [--av-border:var(--sapIndicationColor_2_BorderColor)] [--av-color:var(--sapIndicationColor_2_TextColor)] [--av-hover-bg:var(--sapIndicationColor_2_Hover_Background)] [--av-active-bg:var(--sapIndicationColor_2_Active_Background)] [--av-active-border:var(--sapIndicationColor_2_Active_BorderColor)] [--av-active-color:var(--sapIndicationColor_2_Active_TextColor)] [--av-active-hover-bg:var(--sapIndicationColor_2_Active_Background)] [--av-active-hover-border:var(--sapIndicationColor_2_Active_BorderColor)] [--av-active-hover-color:var(--sapIndicationColor_2_Active_TextColor)]',
    3: '[--av-bg:var(--sapIndicationColor_3_Background)] [--av-border:var(--sapIndicationColor_3_BorderColor)] [--av-color:var(--sapIndicationColor_3_TextColor)] [--av-hover-bg:var(--sapIndicationColor_3_Hover_Background)] [--av-active-bg:var(--sapIndicationColor_3_Active_Background)] [--av-active-border:var(--sapIndicationColor_3_Active_BorderColor)] [--av-active-color:var(--sapIndicationColor_3_Active_TextColor)] [--av-active-hover-bg:var(--sapIndicationColor_3_Active_Background)] [--av-active-hover-border:var(--sapIndicationColor_3_Active_BorderColor)] [--av-active-hover-color:var(--sapIndicationColor_3_Active_TextColor)]',
    4: '[--av-bg:var(--sapIndicationColor_4_Background)] [--av-border:var(--sapIndicationColor_4_BorderColor)] [--av-color:var(--sapIndicationColor_4_TextColor)] [--av-hover-bg:var(--sapIndicationColor_4_Hover_Background)] [--av-active-bg:var(--sapIndicationColor_4_Active_Background)] [--av-active-border:var(--sapIndicationColor_4_Active_BorderColor)] [--av-active-color:var(--sapIndicationColor_4_Active_TextColor)] [--av-active-hover-bg:var(--sapIndicationColor_4_Active_Background)] [--av-active-hover-border:var(--sapIndicationColor_4_Active_BorderColor)] [--av-active-hover-color:var(--sapIndicationColor_4_Active_TextColor)]',
    5: '[--av-bg:var(--sapIndicationColor_5_Background)] [--av-border:var(--sapIndicationColor_5_BorderColor)] [--av-color:var(--sapIndicationColor_5_TextColor)] [--av-hover-bg:var(--sapIndicationColor_5_Hover_Background)] [--av-active-bg:var(--sapIndicationColor_5_Active_Background)] [--av-active-border:var(--sapIndicationColor_5_Active_BorderColor)] [--av-active-color:var(--sapIndicationColor_5_Active_TextColor)] [--av-active-hover-bg:var(--sapIndicationColor_5_Active_Background)] [--av-active-hover-border:var(--sapIndicationColor_5_Active_BorderColor)] [--av-active-hover-color:var(--sapIndicationColor_5_Active_TextColor)]',
    6: '[--av-bg:var(--sapIndicationColor_6_Background)] [--av-border:var(--sapIndicationColor_6_BorderColor)] [--av-color:var(--sapIndicationColor_6_TextColor)] [--av-hover-bg:var(--sapIndicationColor_6_Hover_Background)] [--av-active-bg:var(--sapIndicationColor_6_Active_Background)] [--av-active-border:var(--sapIndicationColor_6_Active_BorderColor)] [--av-active-color:var(--sapIndicationColor_6_Active_TextColor)] [--av-active-hover-bg:var(--sapIndicationColor_6_Active_Background)] [--av-active-hover-border:var(--sapIndicationColor_6_Active_BorderColor)] [--av-active-hover-color:var(--sapIndicationColor_6_Active_TextColor)]',
    7: '[--av-bg:var(--sapIndicationColor_7_Background)] [--av-border:var(--sapIndicationColor_7_BorderColor)] [--av-color:var(--sapIndicationColor_7_TextColor)] [--av-hover-bg:var(--sapIndicationColor_7_Hover_Background)] [--av-active-bg:var(--sapIndicationColor_7_Active_Background)] [--av-active-border:var(--sapIndicationColor_7_Active_BorderColor)] [--av-active-color:var(--sapIndicationColor_7_Active_TextColor)] [--av-active-hover-bg:var(--sapIndicationColor_7_Active_Background)] [--av-active-hover-border:var(--sapIndicationColor_7_Active_BorderColor)] [--av-active-hover-color:var(--sapIndicationColor_7_Active_TextColor)]',
    8: '[--av-bg:var(--sapIndicationColor_8_Background)] [--av-border:var(--sapIndicationColor_8_BorderColor)] [--av-color:var(--sapIndicationColor_8_TextColor)] [--av-hover-bg:var(--sapIndicationColor_8_Hover_Background)] [--av-active-bg:var(--sapIndicationColor_8_Active_Background)] [--av-active-border:var(--sapIndicationColor_8_Active_BorderColor)] [--av-active-color:var(--sapIndicationColor_8_Active_TextColor)] [--av-active-hover-bg:var(--sapIndicationColor_8_Active_Background)] [--av-active-hover-border:var(--sapIndicationColor_8_Active_BorderColor)] [--av-active-hover-color:var(--sapIndicationColor_8_Active_TextColor)]',
    9: '[--av-bg:var(--sapIndicationColor_9_Background)] [--av-border:var(--sapIndicationColor_9_BorderColor)] [--av-color:var(--sapIndicationColor_9_TextColor)] [--av-hover-bg:var(--sapIndicationColor_9_Hover_Background)] [--av-active-bg:var(--sapIndicationColor_9_Active_Background)] [--av-active-border:var(--sapIndicationColor_9_Active_BorderColor)] [--av-active-color:var(--sapIndicationColor_9_Active_TextColor)] [--av-active-hover-bg:var(--sapIndicationColor_9_Active_Background)] [--av-active-hover-border:var(--sapIndicationColor_9_Active_BorderColor)] [--av-active-hover-color:var(--sapIndicationColor_9_Active_TextColor)]',
    10: '[--av-bg:var(--sapIndicationColor_10_Background)] [--av-border:var(--sapIndicationColor_10_BorderColor)] [--av-color:var(--sapIndicationColor_10_TextColor)] [--av-hover-bg:var(--sapIndicationColor_10_Hover_Background)] [--av-active-bg:var(--sapIndicationColor_10_Active_Background)] [--av-active-border:var(--sapIndicationColor_10_Active_BorderColor)] [--av-active-color:var(--sapIndicationColor_10_Active_TextColor)] [--av-active-hover-bg:var(--sapIndicationColor_10_Active_Background)] [--av-active-hover-border:var(--sapIndicationColor_10_Active_BorderColor)] [--av-active-hover-color:var(--sapIndicationColor_10_Active_TextColor)]'
};

const SIZE: Record<AvatarSize, string> = {
    xs: 'size-8 min-w-8 max-w-8 min-h-8 max-h-8 text-[1rem] [--av-zoom-size:1.125rem] [--av-zoom-font:0.75rem] [--av-zoom-offset:-0.125rem]',
    s: 'size-12 min-w-12 max-w-12 min-h-12 max-h-12 text-[1.125rem] [--av-zoom-size:1.125rem] [--av-zoom-font:0.75rem] [--av-zoom-offset:-0.125rem]',
    sm: 'size-12 min-w-12 max-w-12 min-h-12 max-h-12 text-[1.125rem] [--av-zoom-size:1.125rem] [--av-zoom-font:0.75rem] [--av-zoom-offset:-0.125rem]',
    m: 'size-16 min-w-16 max-w-16 min-h-16 max-h-16 text-[1.5rem] [--av-zoom-size:1.125rem] [--av-zoom-font:0.75rem] [--av-zoom-offset:-0.125rem]',
    md: 'size-16 min-w-16 max-w-16 min-h-16 max-h-16 text-[1.5rem] [--av-zoom-size:1.125rem] [--av-zoom-font:0.75rem] [--av-zoom-offset:-0.125rem]',
    l: 'size-20 min-w-20 max-w-20 min-h-20 max-h-20 text-[2.25rem] [--av-zoom-size:1.25rem] [--av-zoom-font:0.875rem] [--av-zoom-offset:-0.1875rem]',
    lg: 'size-20 min-w-20 max-w-20 min-h-20 max-h-20 text-[2.25rem] [--av-zoom-size:1.25rem] [--av-zoom-font:0.875rem] [--av-zoom-offset:-0.1875rem]',
    xl: 'size-28 min-w-28 max-w-28 min-h-28 max-h-28 text-[3rem] [--av-zoom-size:1.75rem] [--av-zoom-font:1rem] [--av-zoom-offset:-0.25rem]'
};

const VALUE_STATE: Record<AvatarValueState, { glyph: string; class: string }> = {
    positive: {
        glyph: 'sys-enter-2',
        class: 'bg-sap-success-background border-sap-success-border-color text-sap-positive-text-color'
    },
    caution: {
        glyph: 'warning',
        class: 'bg-sap-warning-background border-sap-warning-border-color text-sap-critical-text-color'
    },
    negative: {
        glyph: 'error',
        class: 'bg-sap-error-background border-sap-error-border-color text-sap-negative-text-color'
    },
    information: {
        glyph: 'information',
        class: 'bg-sap-information-background border-sap-information-border-color text-sap-informative-text-color'
    }
};

/** Letters of any script, for initials. */
const LETTERS = /^\p{L}+$/u;

/** Initials of up to three words, or null. */
export function avatarInitials(label: string | null | undefined): string | null {
    const words = (label ?? '').split(' ').filter(Boolean);
    if (!words.length || words.length > 3) return null;
    const initials = words.map((w) => [...w][0]).join('');
    return LETTERS.test(initials) ? initials : null;
}

let nextId = 0;

/**
 * Avatar: an image, initials or an icon representing a person, object or entity.
 *
 * Image loading falls back to `alterIcon` options ("content", "alt", "backup", "default-icon",
 * separated by `|`), then to the person placeholder icon.
 *
 * ```html
 * <fd-avatar label="John Doe" [colorAccent]="3" circle />
 * <fd-avatar image="/photo.jpg" ariaLabel="John Doe" size="s" circle clickable (avatarClicked)="open()" />
 * ```
 */
@Component({
    selector: 'fd-avatar',
    exportAs: 'fdAvatar',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[style.background-image]': 'bgImage()',
        '[attr.tabindex]': 'tabindex()',
        '[attr.id]': 'id()',
        '[attr.aria-label]': 'accessibleName()',
        '[attr.aria-labelledby]': 'ariaLabelledby() || null',
        '[attr.role]': 'role()',
        '(click)': 'onClick($event)',
        '(keydown.enter)': 'onClick($event)',
        '(keydown.space)': 'onClick($event)'
    },
    template: `
        @if (initials()) {
            {{ initials() }}
        }
        @if (zoomGlyph() || valueState()) {
            <fd-icon [glyph]="badgeGlyph()" [class]="badgeClass()" (mousedown)="zoomClicked($event)" />
        }
        @if (glyph() || showDefault()) {
            <fd-icon
                class="flex items-center justify-center text-[1em]"
                [font]="font()"
                [glyph]="glyph() || 'person-placeholder'"
            />
        }
        <div #content class="hidden"><ng-content /></div>
    `
})
export class Avatar {
    readonly id = input(`fd-avatar-${nextId++}`);
    /** Accessible name; needed for images and icons. */
    readonly ariaLabel = input<string | null | undefined>(null);
    readonly ariaLabelledby = input<string | null | undefined>(null);
    /** Name to show as initials (up to three words). */
    readonly label = input<string | null | undefined>(null);
    readonly size = input<AvatarSize>('l');
    readonly font = input<IconFont>('SAP-icons');
    /** Icon shown instead of initials or an image. */
    readonly glyph = input<string | null | undefined>(null);
    /** Icon of the small badge at the bottom-end corner, e.g. "edit". */
    readonly zoomGlyph = input<string | null | undefined>(null);
    readonly circle = input(false, { transform: booleanAttribute });
    /** Hover and press styles without a click handler. */
    readonly interactive = input(false, { transform: booleanAttribute });
    /** Transparent background. */
    readonly transparent = input(false, { transform: booleanAttribute });
    /** Scales the image to fit (contain) instead of covering. */
    readonly contain = input(false, { transform: booleanAttribute });
    readonly placeholder = input(false, { transform: booleanAttribute });
    /** Tile background, for avatars inside tiles. */
    readonly tile = input(false, { transform: booleanAttribute });
    readonly border = input(false, { transform: booleanAttribute });
    readonly colorAccent = input<ColorAccent | null | undefined>(null);
    /** Indication colour; used when no accent colour is set. */
    readonly colorIndication = input<IndicationColor | null | undefined>(null);
    /** Picks a random accent colour. */
    readonly random = input(false, { transform: booleanAttribute });
    /** Makes the avatar a button (role, tabindex, Enter/Space). */
    readonly clickable = input(false, { transform: booleanAttribute });
    /** Shows a value state badge instead of the zoom glyph. */
    readonly valueState = input<AvatarValueState | null | undefined>(null);
    /** Image URL. */
    readonly image = input<string | null | undefined>(null);
    /** Fallbacks when the image fails, e.g. "content|alt|backup|default-icon". */
    readonly alterIcon = input<string | null | undefined>(null);
    readonly backupImage = input<string | null | undefined>(null);
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly avatarClicked = output<Event>();
    readonly zoomGlyphClicked = output<void>();

    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly hostTabindex = inject(new HostAttributeToken('tabindex'), { optional: true });
    private readonly hostAlt = inject(new HostAttributeToken('alt'), { optional: true });
    private readonly content = viewChild<ElementRef<HTMLElement>>('content');

    protected readonly bgImage = signal<string | null>(null);
    private readonly imageLoaded = signal(false);
    private readonly fallbackInitials = signal<string | null>(null);
    /** Text the fallback initials came from (projected content or alt). */
    private readonly fallbackName = signal<string | null>(null);
    private readonly forceDefault = signal(false);
    private readonly randomAccent = signal<ColorAccent>(randomColorAccent());
    private loadToken = 0;

    protected readonly initials = computed(() => {
        if (this.imageLoaded()) return null;
        return this.fallbackInitials() ?? (this.forceDefault() ? null : avatarInitials(this.label()));
    });

    protected readonly showDefault = computed(
        () => this.forceDefault() || (!this.initials() && !this.imageLoaded() && !this.glyph() && !this.image())
    );

    /** Explicit label, else the name behind the initials, else the alt text. */
    protected readonly accessibleName = computed(
        () => this.ariaLabel() || this.label() || this.fallbackName() || this.hostAlt || null
    );

    protected readonly tabindex = computed(() => this.hostTabindex ?? (this.clickable() ? 0 : null));
    protected readonly role = computed(() => (this.zoomGlyph() || this.clickable() ? 'button' : 'img'));

    protected readonly badgeGlyph = computed(() => {
        const state = this.valueState();
        return state ? VALUE_STATE[state].glyph : this.zoomGlyph();
    });

    protected readonly badgeClass = computed(() => {
        const state = this.valueState();
        return cn(
            'absolute z-[5] flex items-center justify-center rounded-full border border-solid',
            'size-(--av-zoom-size) text-(length:--av-zoom-font) bottom-(--av-zoom-pos) end-(--av-zoom-pos)',
            state
                ? VALUE_STATE[state].class
                : 'bg-sap-button-emphasized-background border-sap-button-emphasized-border-color text-sap-button-emphasized-text-color'
        );
    });

    protected readonly computedClass = computed(() => {
        const accent = this.random() ? this.randomAccent() : this.colorAccent();
        const indication = !accent ? this.colorIndication() : null;
        const interactive = this.interactive() || this.clickable() || !!this.zoomGlyph() || this.hostTabindex === '0';
        return cn(
            // defaults: accent 6, theme radius, interaction colours of buttons
            '[--av-bg:var(--sapAvatar_6_Background)] [--av-border:var(--sapAvatar_6_BorderColor)] [--av-color:var(--sapAvatar_6_TextColor)]',
            '[--av-hover-bg:var(--sapAvatar_6_Hover_Background)] [--av-hover-border:var(--sapAvatar_Hover_BorderColor)]',
            '[--av-active-bg:var(--sapButton_Active_Background)] [--av-active-border:var(--sapButton_Active_BorderColor)] [--av-active-color:var(--sapButton_Active_TextColor)]',
            '[--av-active-hover-bg:var(--sapButton_Selected_Hover_Background)] [--av-active-hover-border:var(--sapButton_Selected_Hover_BorderColor)] [--av-active-hover-color:var(--sapButton_Selected_TextColor)]',
            '[--av-zoom-pos:var(--av-zoom-offset)]',
            'relative box-border m-0 p-0 inline-flex shrink-0 items-center justify-center overflow-visible align-middle',
            'font-sap-font-family font-normal leading-[normal] [forced-color-adjust:none]',
            'rounded-sap-element-border-corner-radius border border-solid border-(--av-border) bg-(--av-bg) text-(--av-color)',
            'bg-center bg-no-repeat bg-cover',
            // SAP focus: a frame outside the avatar
            "focus:outline-none focus:z-[5] focus:after:pointer-events-none focus:after:absolute focus:after:-inset-[0.3125rem] focus:after:content-['']",
            'focus:after:rounded-[0.9rem] hc:focus:after:rounded-none',
            'focus:after:border-(length:--sapContent_FocusWidth) focus:after:[border-style:var(--sapContent_FocusStyle)] focus:after:border-sap-content-focus-color',
            SIZE[this.size()],
            accent ? ACCENT[accent] : indication ? INDICATION[indication] : '',
            this.circle() && 'rounded-full focus:after:rounded-full hc:focus:after:rounded-none [--av-zoom-pos:0]',
            this.contain() && 'bg-contain',
            this.border() && '[--av-border:var(--sapGroup_ContentBorderColor)]',
            this.transparent() &&
                '[--av-bg:var(--sapAvatar_Lite_Background)] [--av-border:var(--sapAvatar_Lite_BorderColor)] [--av-color:var(--sapContent_IconColor)] [--av-hover-border:var(--sapContent_IconColor)] [--av-hover-bg:var(--sapAvatar_Lite_Background)]',
            this.tile() &&
                '[--av-bg:var(--sapTile_Background)] [--av-border:var(--sapAvatar_Lite_BorderColor)] [--av-color:var(--sapTile_IconColor)] [--av-hover-border:var(--sapTile_IconColor)] [--av-hover-bg:var(--sapTile_Background)]',
            this.placeholder() &&
                '[--av-bg:var(--sapContent_ImagePlaceholderBackground)] [--av-border:var(--sapAvatar_Lite_BorderColor)] [--av-color:var(--sapContent_ImagePlaceholderForegroundColor)] [--av-hover-border:var(--sapContent_ImagePlaceholderForegroundColor)] [--av-hover-bg:var(--sapContent_ImagePlaceholderBackground)]',
            interactive && [
                'cursor-pointer hover:bg-(--av-hover-bg) hover:border-(--av-hover-border)',
                'active:bg-(--av-active-bg) active:border-(--av-active-border) active:text-(--av-active-color)',
                'active:hover:bg-(--av-active-hover-bg) active:hover:border-(--av-active-hover-border) active:hover:text-(--av-active-hover-color)',
                'toggled:bg-(--av-active-bg) toggled:border-(--av-active-border) toggled:text-(--av-active-color)',
                'aria-disabled:opacity-(--sapContent_DisabledOpacity) focus:p-0.5'
            ],
            this.userClass()
        );
    });

    constructor() {
        effect(() => {
            const image = this.image();
            this.imageLoaded.set(false);
            this.forceDefault.set(false);
            this.fallbackInitials.set(null);
            this.fallbackName.set(null);
            this.bgImage.set(null);
            if (image) this.load(image, () => this.onImageError());
        });
    }

    protected onClick(event: Event): void {
        if (!this.clickable()) return;
        event.preventDefault();
        this.avatarClicked.emit(event);
        if (this.zoomGlyph()) this.zoomGlyphClicked.emit();
    }

    protected zoomClicked(event: Event): void {
        event.preventDefault();
        this.elementRef.nativeElement.focus();
        this.zoomGlyphClicked.emit();
    }

    private load(url: string, onError: () => void): void {
        const token = ++this.loadToken;
        const img = new Image();
        img.onload = () => {
            if (token !== this.loadToken) return;
            this.bgImage.set(`url("${url}")`);
            this.imageLoaded.set(true);
        };
        img.onerror = () => token === this.loadToken && onError();
        img.src = url;
    }

    private onImageError(): void {
        for (const option of (this.alterIcon() ?? '').split('|')) {
            if (option === 'content' && this.useInitials(this.content()?.nativeElement.textContent)) return;
            if (option === 'alt' && this.useInitials(this.hostAlt ?? this.elementRef.nativeElement.getAttribute('alt')))
                return;
            if (option === 'backup' && this.backupImage()) {
                this.load(this.backupImage()!, () => this.forceDefault.set(true));
                return;
            }
            if (option === 'default-icon') break;
        }
        this.forceDefault.set(true);
    }

    private useInitials(text: string | null | undefined): boolean {
        const initials = avatarInitials(text?.trim());
        if (initials) {
            this.fallbackInitials.set(initials);
            this.fallbackName.set(text!.trim());
        }
        return !!initials;
    }
}

export function randomColorAccent(): ColorAccent {
    return (Math.floor(Math.random() * 10) + 1) as ColorAccent;
}
