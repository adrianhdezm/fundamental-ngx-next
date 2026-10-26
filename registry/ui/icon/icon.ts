import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { cn, cva, type ClassValue, type VariantProps } from '@/lib/utils';
import { SAP_ICONS, SAP_ICONS_BUSINESS_SUITE, SAP_ICONS_TNT, type IconGlyph } from './icon-glyphs';

export type IconFont = 'SAP-icons' | 'BusinessSuiteInAppSymbols' | 'SAP-icons-TNT';

const GLYPHS: Record<IconFont, Readonly<Record<string, IconGlyph>>> = {
    'SAP-icons': SAP_ICONS,
    BusinessSuiteInAppSymbols: SAP_ICONS_BUSINESS_SUITE,
    'SAP-icons-TNT': SAP_ICONS_TNT
};

export const iconVariants = cva(
    'inline-flex shrink-0 items-center justify-center not-italic font-normal leading-none normal-case no-underline ' +
        'before:content-[attr(data-glyph)] before:text-center before:[text-rendering:optimizeLegibility]',
    {
        variants: {
            font: {
                'SAP-icons': 'before:font-sap-content-icon-font-family',
                BusinessSuiteInAppSymbols: "before:font-['SAP-icons-Business-Suite']",
                'SAP-icons-TNT': "before:font-['SAP-icons-TNT']"
            },
            size: {
                default: 'text-[1rem]',
                sm: 'text-[1rem]',
                md: 'text-[2rem]',
                lg: 'text-[3rem]',
                xl: 'text-[4rem]',
                xxl: 'text-[5rem]'
            },
            color: {
                inherit: 'text-inherit',
                default: 'text-sap-content-icon-color',
                contrast: 'text-sap-content-contrast-icon-color',
                'non-interactive': 'text-sap-content-non-interactive-icon-color',
                tile: 'text-sap-tile-icon-color',
                marker: 'text-sap-content-marker-icon-color',
                critical: 'text-sap-critical-element-color',
                negative: 'text-sap-negative-element-color',
                neutral: 'text-sap-neutral-element-color',
                positive: 'text-sap-positive-element-color',
                information: 'text-sap-informative-element-color'
            },
            background: {
                none: '',
                default: 'text-sap-group-content-background bg-sap-content-icon-color',
                contrast: 'text-sap-content-icon-color bg-sap-group-content-background',
                'non-interactive': 'text-sap-group-content-background bg-sap-content-non-interactive-icon-color',
                tile: 'text-sap-group-content-background bg-sap-tile-icon-color',
                marker: 'text-sap-group-content-background bg-sap-content-marker-icon-color',
                critical: 'text-sap-group-content-background bg-sap-critical-element-color',
                negative: 'text-sap-group-content-background bg-sap-negative-element-color',
                neutral: 'text-sap-group-content-background bg-sap-neutral-element-color',
                positive: 'text-sap-group-content-background bg-sap-positive-element-color',
                information: 'text-sap-group-content-background bg-sap-informative-element-color'
            },
            mirrored: {
                true: 'rtl:-scale-x-100',
                false: ''
            }
        },
        defaultVariants: { font: 'SAP-icons', size: 'default', color: 'inherit', background: 'none', mirrored: false }
    }
);

type IconVariants = VariantProps<typeof iconVariants>;
export type IconSize = Exclude<IconVariants['size'], null | undefined>;
export type IconColor = Exclude<IconVariants['color'], null | undefined>;
export type IconBackground = Exclude<IconVariants['background'], null | undefined>;

/** Resolves a glyph name of an SAP icon font to its character, or '' if the font has no such glyph. */
export function iconGlyphChar(glyph: string | null | undefined, font: IconFont = 'SAP-icons'): string {
    const entry = glyph ? GLYPHS[font][glyph] : undefined;
    if (entry === undefined) return '';
    return String.fromCodePoint(typeof entry === 'number' ? entry : entry[0]);
}

/**
 * An icon from the SAP icon fonts.
 *
 * Decorative by default (aria-hidden). Give it an `ariaLabel` to expose it as an image.
 *
 * ```html
 * <fd-icon glyph="accept" />
 * <fd-icon glyph="exceptions" font="SAP-icons-TNT" color="negative" ariaLabel="Exceptions" />
 * ```
 */
@Component({
    selector: 'fd-icon',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[attr.data-glyph]': 'glyphChar() || null',
        '[attr.role]': "ariaLabel() ? 'img' : 'presentation'",
        '[attr.aria-label]': 'ariaLabel() || null',
        '[attr.aria-hidden]': 'effectiveAriaHidden()'
    }
})
export class Icon {
    /** Name of the glyph, e.g. "accept". See the Icon story for the full list. */
    readonly glyph = input<string | null | undefined>();

    /** Icon font the glyph comes from. */
    readonly font = input<IconFont>('SAP-icons');

    /** Semantic icon colour. Inherits the text colour by default. */
    readonly color = input<IconColor | null | undefined>('inherit');

    /** Semantic background colour; also switches the glyph to the contrasting colour. */
    readonly background = input<IconBackground | null | undefined>('none');

    /** Icon size: sm 1rem, md 2rem, lg 3rem, xl 4rem, xxl 5rem. */
    readonly size = input<IconSize | null | undefined>('default');

    /** Accessible name. When set the icon gets role="img"; otherwise it is hidden from assistive technology. */
    readonly ariaLabel = input<string | null | undefined>();

    /** Overrides the computed aria-hidden. */
    readonly ariaHidden = model<boolean | null | undefined>();

    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly glyphChar = computed(() => iconGlyphChar(this.glyph(), this.font()));

    protected readonly effectiveAriaHidden = computed(() => {
        const explicit = this.ariaHidden();
        if (explicit != null) return explicit;
        return this.ariaLabel() ? null : true;
    });

    protected readonly computedClass = computed(() => {
        const font = this.font();
        const entry = GLYPHS[font][this.glyph() ?? ''];
        return cn(
            iconVariants({
                font,
                size: this.size() ?? 'default',
                color: this.color() ?? 'inherit',
                background: this.background() ?? 'none',
                mirrored: Array.isArray(entry)
            }),
            this.userClass()
        );
    });
}
