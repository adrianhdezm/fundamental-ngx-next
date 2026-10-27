import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    ElementRef,
    TemplateRef,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    forwardRef,
    inject,
    input,
    output
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Avatar } from '@/ui/avatar/avatar';
import { ObjectStatusComponent, type IndicationColor, type ObjectStatus } from '@/ui/object-status/object-status';

export type CardType =
    'standard' | 'component' | 'analytical' | 'list' | 'table' | 'object' | 'quickView' | 'linkList' | 'banner';
export type CardKpiStatus = 'positive' | 'negative' | 'critical' | 'informative';
/** Shell category colour 1-16. */
export type CardShellColor = number;
/** Legend colour 1-20. */
export type CardLegendColor = number;

const TEXT_STATUS: Record<CardKpiStatus | 'neutral', string> = {
    neutral: 'text-sap-neutral-text-color',
    positive: 'text-sap-positive-text-color',
    negative: 'text-sap-negative-text-color',
    critical: 'text-sap-critical-text-color',
    informative: 'text-sap-informative-text-color'
};

/** Media background (--cm-bg), heading (--cm-hc, --cm-hs) and text (--cm-tc) colours per shell category. */
const SHELL_COLOR: Record<number, string> = {
    1: '[--cm-bg:var(--sapShell_Category_1_Background)] [--cm-hc:var(--sapShell_Category_1_TextColor)] [--cm-hs:var(--sapShell_Category_1_TextShadow)] [--cm-tc:var(--sapShell_Category_1_TextColor)] [--cm-cbg:transparent]',
    2: '[--cm-bg:var(--sapShell_Category_2_Background)] [--cm-hc:var(--sapShell_Category_2_TextColor)] [--cm-hs:var(--sapShell_Category_2_TextShadow)] [--cm-tc:var(--sapShell_Category_2_TextColor)] [--cm-cbg:transparent]',
    3: '[--cm-bg:var(--sapShell_Category_3_Background)] [--cm-hc:var(--sapShell_Category_3_TextColor)] [--cm-hs:var(--sapShell_Category_3_TextShadow)] [--cm-tc:var(--sapShell_Category_3_TextColor)] [--cm-cbg:transparent]',
    4: '[--cm-bg:var(--sapShell_Category_4_Background)] [--cm-hc:var(--sapShell_Category_4_TextColor)] [--cm-hs:var(--sapShell_Category_4_TextShadow)] [--cm-tc:var(--sapShell_Category_4_TextColor)] [--cm-cbg:transparent]',
    5: '[--cm-bg:var(--sapShell_Category_5_Background)] [--cm-hc:var(--sapShell_Category_5_TextColor)] [--cm-hs:var(--sapShell_Category_5_TextShadow)] [--cm-tc:var(--sapShell_Category_5_TextColor)] [--cm-cbg:transparent]',
    6: '[--cm-bg:var(--sapShell_Category_6_Background)] [--cm-hc:var(--sapShell_Category_6_TextColor)] [--cm-hs:var(--sapShell_Category_6_TextShadow)] [--cm-tc:var(--sapShell_Category_6_TextColor)] [--cm-cbg:transparent]',
    7: '[--cm-bg:var(--sapShell_Category_7_Background)] [--cm-hc:var(--sapShell_Category_7_TextColor)] [--cm-hs:var(--sapShell_Category_7_TextShadow)] [--cm-tc:var(--sapShell_Category_7_TextColor)] [--cm-cbg:transparent]',
    8: '[--cm-bg:var(--sapShell_Category_8_Background)] [--cm-hc:var(--sapShell_Category_8_TextColor)] [--cm-hs:var(--sapShell_Category_8_TextShadow)] [--cm-tc:var(--sapShell_Category_8_TextColor)] [--cm-cbg:transparent]',
    9: '[--cm-bg:var(--sapShell_Category_9_Background)] [--cm-hc:var(--sapShell_Category_9_TextColor)] [--cm-hs:var(--sapShell_Category_9_TextShadow)] [--cm-tc:var(--sapShell_Category_9_TextColor)] [--cm-cbg:transparent]',
    10: '[--cm-bg:var(--sapShell_Category_10_Background)] [--cm-hc:var(--sapShell_Category_10_TextColor)] [--cm-hs:var(--sapShell_Category_10_TextShadow)] [--cm-tc:var(--sapShell_Category_10_TextColor)] [--cm-cbg:transparent]',
    11: '[--cm-bg:var(--sapShell_Category_11_Background)] [--cm-hc:var(--sapShell_Category_11_TextColor)] [--cm-hs:var(--sapShell_Category_11_TextShadow)] [--cm-tc:var(--sapShell_Category_11_TextColor)] [--cm-cbg:transparent]',
    12: '[--cm-bg:var(--sapShell_Category_12_Background)] [--cm-hc:var(--sapShell_Category_12_TextColor)] [--cm-hs:var(--sapShell_Category_12_TextShadow)] [--cm-tc:var(--sapShell_Category_12_TextColor)] [--cm-cbg:transparent]',
    13: '[--cm-bg:var(--sapShell_Category_13_Background)] [--cm-hc:var(--sapShell_Category_13_TextColor)] [--cm-hs:var(--sapShell_Category_13_TextShadow)] [--cm-tc:var(--sapShell_Category_13_TextColor)] [--cm-cbg:transparent]',
    14: '[--cm-bg:var(--sapShell_Category_14_Background)] [--cm-hc:var(--sapShell_Category_14_TextColor)] [--cm-hs:var(--sapShell_Category_14_TextShadow)] [--cm-tc:var(--sapShell_Category_14_TextColor)] [--cm-cbg:transparent]',
    15: '[--cm-bg:var(--sapShell_Category_15_Background)] [--cm-hc:var(--sapShell_Category_15_TextColor)] [--cm-hs:var(--sapShell_Category_15_TextShadow)] [--cm-tc:var(--sapShell_Category_15_TextColor)] [--cm-cbg:transparent]',
    16: '[--cm-bg:var(--sapShell_Category_16_Background)] [--cm-hc:var(--sapShell_Category_16_TextColor)] [--cm-hs:var(--sapShell_Category_16_TextShadow)] [--cm-tc:var(--sapShell_Category_16_TextColor)] [--cm-cbg:transparent]'
};
/** Media colours per legend colour. */
const LEGEND_COLOR: Record<number, string> = {
    1: '[--cm-bg:var(--sapLegendBackgroundColor1)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    2: '[--cm-bg:var(--sapLegendBackgroundColor2)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    3: '[--cm-bg:var(--sapLegendBackgroundColor3)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    4: '[--cm-bg:var(--sapLegendBackgroundColor4)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    5: '[--cm-bg:var(--sapLegendBackgroundColor5)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    6: '[--cm-bg:var(--sapLegendBackgroundColor6)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    7: '[--cm-bg:var(--sapLegendBackgroundColor7)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    8: '[--cm-bg:var(--sapLegendBackgroundColor8)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    9: '[--cm-bg:var(--sapLegendBackgroundColor9)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    10: '[--cm-bg:var(--sapLegendBackgroundColor10)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    11: '[--cm-bg:var(--sapLegendBackgroundColor11)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    12: '[--cm-bg:var(--sapLegendBackgroundColor12)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    13: '[--cm-bg:var(--sapLegendBackgroundColor13)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    14: '[--cm-bg:var(--sapLegendBackgroundColor14)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    15: '[--cm-bg:var(--sapLegendBackgroundColor15)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    16: '[--cm-bg:var(--sapLegendBackgroundColor16)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    17: '[--cm-bg:var(--sapLegendBackgroundColor17)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    18: '[--cm-bg:var(--sapLegendBackgroundColor18)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    19: '[--cm-bg:var(--sapLegendBackgroundColor19)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]',
    20: '[--cm-bg:var(--sapLegendBackgroundColor20)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none] [--cm-cbg:transparent]'
};
/** The same colours on a content container (e.g. over an image). */
const CONTAINER_SHELL_COLOR: Record<number, string> = {
    1: '[--cm-cbg:var(--sapShell_Category_1_Background)] [--cm-hc:var(--sapShell_Category_1_TextColor)] [--cm-hs:var(--sapShell_Category_1_TextShadow)] [--cm-tc:var(--sapShell_Category_1_TextColor)]',
    2: '[--cm-cbg:var(--sapShell_Category_2_Background)] [--cm-hc:var(--sapShell_Category_2_TextColor)] [--cm-hs:var(--sapShell_Category_2_TextShadow)] [--cm-tc:var(--sapShell_Category_2_TextColor)]',
    3: '[--cm-cbg:var(--sapShell_Category_3_Background)] [--cm-hc:var(--sapShell_Category_3_TextColor)] [--cm-hs:var(--sapShell_Category_3_TextShadow)] [--cm-tc:var(--sapShell_Category_3_TextColor)]',
    4: '[--cm-cbg:var(--sapShell_Category_4_Background)] [--cm-hc:var(--sapShell_Category_4_TextColor)] [--cm-hs:var(--sapShell_Category_4_TextShadow)] [--cm-tc:var(--sapShell_Category_4_TextColor)]',
    5: '[--cm-cbg:var(--sapShell_Category_5_Background)] [--cm-hc:var(--sapShell_Category_5_TextColor)] [--cm-hs:var(--sapShell_Category_5_TextShadow)] [--cm-tc:var(--sapShell_Category_5_TextColor)]',
    6: '[--cm-cbg:var(--sapShell_Category_6_Background)] [--cm-hc:var(--sapShell_Category_6_TextColor)] [--cm-hs:var(--sapShell_Category_6_TextShadow)] [--cm-tc:var(--sapShell_Category_6_TextColor)]',
    7: '[--cm-cbg:var(--sapShell_Category_7_Background)] [--cm-hc:var(--sapShell_Category_7_TextColor)] [--cm-hs:var(--sapShell_Category_7_TextShadow)] [--cm-tc:var(--sapShell_Category_7_TextColor)]',
    8: '[--cm-cbg:var(--sapShell_Category_8_Background)] [--cm-hc:var(--sapShell_Category_8_TextColor)] [--cm-hs:var(--sapShell_Category_8_TextShadow)] [--cm-tc:var(--sapShell_Category_8_TextColor)]',
    9: '[--cm-cbg:var(--sapShell_Category_9_Background)] [--cm-hc:var(--sapShell_Category_9_TextColor)] [--cm-hs:var(--sapShell_Category_9_TextShadow)] [--cm-tc:var(--sapShell_Category_9_TextColor)]',
    10: '[--cm-cbg:var(--sapShell_Category_10_Background)] [--cm-hc:var(--sapShell_Category_10_TextColor)] [--cm-hs:var(--sapShell_Category_10_TextShadow)] [--cm-tc:var(--sapShell_Category_10_TextColor)]',
    11: '[--cm-cbg:var(--sapShell_Category_11_Background)] [--cm-hc:var(--sapShell_Category_11_TextColor)] [--cm-hs:var(--sapShell_Category_11_TextShadow)] [--cm-tc:var(--sapShell_Category_11_TextColor)]',
    12: '[--cm-cbg:var(--sapShell_Category_12_Background)] [--cm-hc:var(--sapShell_Category_12_TextColor)] [--cm-hs:var(--sapShell_Category_12_TextShadow)] [--cm-tc:var(--sapShell_Category_12_TextColor)]',
    13: '[--cm-cbg:var(--sapShell_Category_13_Background)] [--cm-hc:var(--sapShell_Category_13_TextColor)] [--cm-hs:var(--sapShell_Category_13_TextShadow)] [--cm-tc:var(--sapShell_Category_13_TextColor)]',
    14: '[--cm-cbg:var(--sapShell_Category_14_Background)] [--cm-hc:var(--sapShell_Category_14_TextColor)] [--cm-hs:var(--sapShell_Category_14_TextShadow)] [--cm-tc:var(--sapShell_Category_14_TextColor)]',
    15: '[--cm-cbg:var(--sapShell_Category_15_Background)] [--cm-hc:var(--sapShell_Category_15_TextColor)] [--cm-hs:var(--sapShell_Category_15_TextShadow)] [--cm-tc:var(--sapShell_Category_15_TextColor)]',
    16: '[--cm-cbg:var(--sapShell_Category_16_Background)] [--cm-hc:var(--sapShell_Category_16_TextColor)] [--cm-hs:var(--sapShell_Category_16_TextShadow)] [--cm-tc:var(--sapShell_Category_16_TextColor)]'
};
const CONTAINER_LEGEND_COLOR: Record<number, string> = {
    1: '[--cm-cbg:var(--sapLegendBackgroundColor1)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    2: '[--cm-cbg:var(--sapLegendBackgroundColor2)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    3: '[--cm-cbg:var(--sapLegendBackgroundColor3)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    4: '[--cm-cbg:var(--sapLegendBackgroundColor4)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    5: '[--cm-cbg:var(--sapLegendBackgroundColor5)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    6: '[--cm-cbg:var(--sapLegendBackgroundColor6)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    7: '[--cm-cbg:var(--sapLegendBackgroundColor7)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    8: '[--cm-cbg:var(--sapLegendBackgroundColor8)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    9: '[--cm-cbg:var(--sapLegendBackgroundColor9)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    10: '[--cm-cbg:var(--sapLegendBackgroundColor10)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    11: '[--cm-cbg:var(--sapLegendBackgroundColor11)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    12: '[--cm-cbg:var(--sapLegendBackgroundColor12)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    13: '[--cm-cbg:var(--sapLegendBackgroundColor13)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    14: '[--cm-cbg:var(--sapLegendBackgroundColor14)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    15: '[--cm-cbg:var(--sapLegendBackgroundColor15)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    16: '[--cm-cbg:var(--sapLegendBackgroundColor16)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    17: '[--cm-cbg:var(--sapLegendBackgroundColor17)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    18: '[--cm-cbg:var(--sapLegendBackgroundColor18)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    19: '[--cm-cbg:var(--sapLegendBackgroundColor19)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]',
    20: '[--cm-cbg:var(--sapLegendBackgroundColor20)] [--cm-hc:var(--sapTextColor)] [--cm-tc:var(--sapTextColor)] [--cm-hs:none]'
};

/** Inner focus frame of interactive card areas. */
const FAKE_OUTLINE = [
    "focus:outline-none focus:before:pointer-events-none focus:before:absolute focus:before:inset-px focus:before:z-[3] focus:before:block focus:before:content-['']",
    'focus:before:rounded-(--card-fr) focus:before:border-(length:--sapContent_FocusWidth) focus:before:[border-style:var(--sapContent_FocusStyle)] focus:before:border-sap-content-focus-color'
];

/** Rounded top and bottom corners of card parts depending on their position (badges come first). */
const PART_CORNERS =
    'first:rounded-t-(--card-r) last:rounded-b-(--card-r) [[data-card-badges]+&]:rounded-t-(--card-r) first:[--card-fr:var(--card-r)_var(--card-r)_0_0] last:[--card-fr:0_0_var(--card-r)_var(--card-r)] only:[--card-fr:var(--card-r)]';

let nextId = 0;

/**
 * Card: a container for a header (title, subtitle, avatar, counter, KPI), content and footer,
 * with optional badges. Interactive cards (role button or listitem) have hover, pressed and
 * focus states.
 *
 * ```html
 * <fd-card badge="New" [badgeColor]="6">
 *     <fd-card-header><fd-card-main-header><h2 fd-card-title>Orders</h2></fd-card-main-header></fd-card-header>
 *     <fd-card-content>...</fd-card-content>
 * </fd-card>
 * ```
 */
@Component({
    selector: 'fd-card',
    exportAs: 'fdCard',
    imports: [ObjectStatusComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[attr.id]': 'id()',
        '[attr.role]': 'role()',
        '[attr.aria-labelledby]': 'ariaLabel() ? null : (cardTitle()?.id() ?? mediaHeading()?.id() ?? null)',
        '[attr.aria-describedby]': 'describedBy()',
        '[attr.aria-roledescription]': 'ariaRoledescription() || roleDescription()',
        '[attr.aria-description]':
            'role() === "listitem" ? ariaDescription() || "Active, Press Enter to activate" : null',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.tabindex]': 'role() === "listitem" || role() === "button" ? 0 : -1',
        '[attr.data-selected]': 'selected() ? "" : null',
        '[attr.aria-posinset]': 'role() === "listitem" ? ariaPosinset() : null',
        '[attr.aria-setsize]': 'role() === "listitem" ? ariaSetsize() : null',
        '(keydown)': 'keyDown.emit($event)'
    },
    template: `
        @if (!isLoading()) {
            @if (badge() || badgeIcon() || secondBadge() || secondBadgeIcon()) {
                <div
                    data-card-badges
                    class="absolute -top-2 end-2 z-10 m-0 flex max-w-[calc(100%_-_1rem)] min-w-[1.375rem] items-center gap-1 p-0"
                >
                    @if (badge() || badgeIcon()) {
                        <span
                            fd-object-status
                            inverted
                            [class]="badgeClass"
                            [id]="id() + '-badge'"
                            [glyph]="badgeIcon()"
                            [status]="badgeStatus()"
                            [indicationColor]="badgeColor()"
                            [secondaryIndication]="badgeColorSecondary()"
                            [label]="badge()"
                            [ariaLabel]="badgeAriaLabel()"
                        ></span>
                    }
                    @if (secondBadge() || secondBadgeIcon()) {
                        <span
                            fd-object-status
                            inverted
                            [class]="badgeClass"
                            [id]="id() + '-second-badge'"
                            [glyph]="secondBadgeIcon()"
                            [status]="secondBadgeStatus()"
                            [indicationColor]="secondBadgeColor()"
                            [secondaryIndication]="secondBadgeColorSecondary()"
                            [label]="secondBadge()"
                            [ariaLabel]="secondBadgeAriaLabel()"
                        ></span>
                    }
                </div>
            }
            <ng-content />
            <ng-content select="fd-card-footer" />
        } @else {
            <ng-content select="fd-card-loader" />
        }
    `
})
export class Card {
    readonly id = input(`fd-card-${nextId++}`);
    readonly cardType = input<CardType>('standard');
    /** Loading state: shows the fd-card-loader content instead of the card content. */
    readonly isLoading = input(false, { transform: booleanAttribute });
    /** region by default; button or listitem make the whole card interactive. */
    readonly role = input<string>('region');
    /** Hover, pressed and focus states on the whole card. */
    readonly interactive = input(false, { transform: booleanAttribute });
    /** Selected state (visual; list item cards cannot expose it to assistive technology). */
    readonly selected = input(false, { transform: booleanAttribute });
    readonly ariaPosinset = input<number | null | undefined>();
    readonly ariaSetsize = input<number | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaRoledescription = input<string | null | undefined>();
    readonly ariaDescription = input<string | null | undefined>();
    readonly ariaDescribedby = input<string | null | undefined>();

    readonly badge = input<string | null | undefined>();
    readonly badgeIcon = input<string | null | undefined>();
    readonly badgeColor = input<IndicationColor | null | undefined>();
    readonly badgeColorSecondary = input(false, { transform: booleanAttribute });
    readonly badgeStatus = input<ObjectStatus | null | undefined>();
    readonly badgeAriaLabel = input<string | null | undefined>();
    readonly secondBadge = input<string | null | undefined>();
    readonly secondBadgeIcon = input<string | null | undefined>();
    readonly secondBadgeColor = input<IndicationColor | null | undefined>();
    readonly secondBadgeColorSecondary = input(false, { transform: booleanAttribute });
    readonly secondBadgeStatus = input<ObjectStatus | null | undefined>();
    readonly secondBadgeAriaLabel = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly keyDown = output<KeyboardEvent>();

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    protected readonly cardTitle = contentChild(
        forwardRef(() => CardTitle),
        { descendants: true }
    );
    protected readonly mediaHeading = contentChild(
        forwardRef(() => CardMediaHeading),
        { descendants: true }
    );
    private readonly subtitle = contentChild(
        forwardRef(() => CardSubtitle),
        { descendants: true }
    );
    private readonly secondSubtitle = contentChild(
        forwardRef(() => CardSecondSubtitle),
        { descendants: true }
    );
    private readonly counter = contentChild(
        forwardRef(() => CardCounter),
        { descendants: true }
    );

    protected readonly badgeClass =
        'max-w-full min-h-0 rounded-lg px-1 py-0 [&>span]:truncate [&>span]:leading-[0.875rem] [&>*]:leading-[0.875rem]';

    protected readonly roleDescription = computed(() => {
        const type = this.cardType();
        return `${type.charAt(0).toUpperCase()}${type.slice(1)} Card`;
    });

    protected readonly describedBy = computed(() => {
        const id = this.id();
        const ids = [
            this.subtitle()?.id(),
            this.secondSubtitle()?.id(),
            this.counter()?.id(),
            (this.badge() || this.badgeIcon()) && `${id}-badge`,
            (this.secondBadge() || this.secondBadgeIcon()) && `${id}-second-badge`,
            this.ariaDescribedby()
        ].filter(Boolean);
        return ids.join(' ') || null;
    });

    protected readonly computedClass = computed(() => {
        const interactive = this.interactive() || this.role() === 'listitem' || this.role() === 'button';
        return cn(
            'relative m-0 box-border flex min-h-full w-full flex-1 flex-col p-0 font-sap-font-family text-sap-font-size',
            'rounded-(--card-r) border border-solid border-(--card-bc) bg-(--card-bg) shadow-(--card-shadow)',
            '[--card-r:var(--sapTile_BorderCornerRadius)] [--card-fr:var(--card-r)] [--card-bc:var(--sapTile_BorderColor)] [--card-bg:var(--sapTile_Background)]',
            '[--card-shadow:var(--sapContent_Shadow0)] hc:[--card-shadow:none] [--card-hts:0.25rem] compact:[--card-hts:0.5rem]',
            // media defaults, overridden by media colours and banner layout
            '[--cm-hc:var(--sapTile_TitleTextColor)] [--cm-tc:var(--sapTile_TextColor)] [--cm-hs:none] [--cm-cbg:var(--sapTile_Background)]',
            '[--cm-iw:100%] [--cm-ih:100%] [--cm-cw:100%] [--cm-ch:100%] [--cm-cp:1rem] [--cm-ir:0]',
            interactive && [
                'cursor-pointer',
                'enabled-hover:[--card-bg:var(--sapTile_Hover_Background)] enabled-hover:[--card-shadow:var(--sapContent_Shadow2)] hc:enabled-hover:[--card-shadow:none]',
                'active:[--card-bg:var(--sapTile_Active_Background)] active:[--card-shadow:none] active:[--card-bc:var(--sapTile_Interactive_BorderColor)]',
                FAKE_OUTLINE,
                "data-selected:before:pointer-events-none data-selected:before:absolute data-selected:before:inset-px data-selected:before:z-[3] data-selected:before:rounded-(--card-r) data-selected:before:content-['']",
                'data-selected:before:border-(length:--sapContent_FocusWidth) data-selected:before:[border-style:var(--sapContent_FocusStyle)] data-selected:before:border-sap-content-focus-color'
            ],
            this.cardType() === 'banner' && 'h-full',
            this.userClass()
        );
    });
}

/** Header area of a card (above or below the content). */
@Component({
    selector: 'fd-card-header',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'group',
        '[attr.aria-roledescription]': 'ariaRoleDescription()',
        class: `group/ch m-0 block overflow-hidden p-0 ${PART_CORNERS}`
    }
})
export class CardHeader {
    readonly ariaRoleDescription = input('Card Header');
}

/** Main header: avatar, title, subtitle, KPI, second subtitle, counter and header actions. */
@Component({
    selector: 'fd-card-main-header',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `
        @if (hasText()) {
            <div
                [class]="containerClass()"
                [attr.role]="interactive() ? 'button' : null"
                [attr.tabindex]="interactive() ? 0 : null"
                [attr.aria-description]="interactive() ? title() : null"
                [attr.title]="interactive() ? title() : null"
            >
                <ng-content select="fd-avatar" />
                <div class="m-0 flex h-full w-full flex-col gap-(--card-hts) self-center p-0">
                    @if (cardTitle()) {
                        <div class="m-0 flex w-full items-start justify-between p-0">
                            <ng-content select="[fd-card-title], [fdCardTitle]" />
                        </div>
                    }
                    @if (subtitle()) {
                        <div [class]="subtitleAreaClass()">
                            <ng-content select="[fd-card-subtitle], [fdCardSubtitle]" />
                        </div>
                    }
                    <ng-content select="fd-card-kpi-header" />
                    <ng-content select="[fd-card-second-subtitle], [fdCardSecondSubtitle]" />
                </div>
            </div>
        }
        @if (counter() || action()) {
            <div class="z-[5] m-0 flex flex-col items-end gap-1 p-0">
                <ng-content select="[fd-card-header-action], [fdCardHeaderAction]" />
                <ng-content select="[fd-card-counter], [fdCardCounter]" />
            </div>
        }
        <ng-content />
    `
})
export class CardMainHeader {
    /** The header area is a button (navigates or acts). */
    readonly interactive = input(false, { transform: booleanAttribute });
    /** Label and tooltip of the interactive header. */
    readonly title = input('Activate for action/navigation');

    protected readonly cardTitle = contentChild(forwardRef(() => CardTitle));
    protected readonly subtitle = contentChild(forwardRef(() => CardSubtitle));
    protected readonly counter = contentChild(forwardRef(() => CardCounter));
    protected readonly action = contentChild(forwardRef(() => CardHeaderAction));
    private readonly kpi = contentChild(forwardRef(() => CardKpiHeader));
    private readonly secondSubtitle = contentChild(forwardRef(() => CardSecondSubtitle));
    private readonly avatar = contentChild(Avatar);
    private readonly card = inject(Card, { optional: true });

    protected readonly hasText = computed(
        () => !!(this.cardTitle() || this.subtitle() || this.kpi() || this.secondSubtitle() || this.avatar())
    );

    protected readonly subtitleAreaClass = computed(() =>
        cn('m-0 flex items-end p-0', this.card?.cardType() === 'analytical' && 'mt-2')
    );

    protected readonly containerClass = computed(() => {
        const role = this.card?.role();
        return cn(
            'relative m-0 flex h-fit w-full flex-1 items-start gap-2 p-0',
            (this.interactive() || role === 'button') && FAKE_OUTLINE,
            role === 'listitem' && 'pointer-events-none'
        );
    });

    protected readonly computedClass = computed(() =>
        cn(
            'relative m-0 box-border flex gap-2 px-4 pt-4 pb-3 no-underline bg-(--card-bg)',
            'border-b border-solid border-transparent group-last/ch:border-t group-last/ch:border-b-0 group-last/ch:pb-4',
            'group-only/ch:border-y-0 group-only/ch:pb-4',
            this.interactive() && [
                'cursor-pointer enabled-hover:bg-sap-tile-hover-background has-[[role=button]:active]:bg-sap-tile-active-background'
            ]
        )
    );
}

/** Extra header area for custom content (e.g. a micro chart). */
@Component({
    selector: 'fd-card-extended-header',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'group',
        '[attr.aria-roledescription]': 'ariaRoleDescription()',
        '[class]': 'computedClass()'
    }
})
export class CardExtendedHeader {
    readonly ariaRoleDescription = input('Extended content');
    readonly align = input<'top' | 'bottom' | null>(null);
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 flex items-center gap-2 px-4 py-2',
            this.align() === 'top' && 'items-start',
            this.align() === 'bottom' && 'items-end'
        )
    );
}

/** Numeric header area (KPI, indicators). */
@Component({
    selector: 'fd-card-numeric-header',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'group',
        '[attr.aria-roledescription]': 'ariaRoleDescription()',
        class: 'm-0 flex flex-col gap-1 px-4 py-1'
    }
})
export class CardNumericHeader {
    readonly ariaRoleDescription = input('Numeric content');
}

@Directive({ selector: '[fd-card-header-row], [fdCardHeaderRow]', host: { class: 'm-0 flex gap-2 p-0' } })
export class CardHeaderRow {}

@Directive({
    selector: '[fd-card-header-column], [fdCardHeaderColumn]',
    host: {
        '[class]':
            'align() === "right" ? "m-0 flex flex-1 flex-col items-end gap-1 p-0" : "m-0 flex flex-1 flex-col items-start gap-1 p-0"'
    }
})
export class CardHeaderColumn {
    readonly align = input<'left' | 'right'>('left');
}

/** Element placed in the header actions area (e.g. a button). */
@Directive({ selector: '[fd-card-header-action], [fdCardHeaderAction]' })
export class CardHeaderAction {}

let nextPartId = 0;

@Directive({
    selector: '[fd-card-title], [fdCardTitle]',
    host: { '[attr.id]': 'id()', '[class]': 'computedClass()' }
})
export class CardTitle {
    readonly id = input(`fd-card-title-${nextPartId++}`);
    private readonly card = inject(Card, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 max-h-[4.2rem] max-w-full p-0 font-sap-font-header-family text-sap-font-header6-size font-bold break-words text-sap-tile-title-text-color line-clamp-3',
            this.card?.cardType() === 'analytical' && 'max-h-[2.8rem] line-clamp-2'
        )
    );
}

@Directive({
    selector: '[fd-card-subtitle], [fdCardSubtitle]',
    host: {
        '[attr.id]': 'id()',
        class: 'm-0 line-clamp-2 max-h-10 max-w-full p-0 text-sap-font-size font-normal break-words text-sap-tile-text-color'
    }
})
export class CardSubtitle {
    readonly id = input(`fd-card-subtitle-${nextPartId++}`);
}

@Directive({
    selector: '[fd-card-second-subtitle], [fdCardSecondSubtitle]',
    host: {
        '[attr.id]': 'id()',
        class: 'm-0 mt-1 w-full truncate p-0 text-sap-font-small-size font-normal text-sap-tile-text-color'
    }
})
export class CardSecondSubtitle {
    readonly id = input(`fd-card-second-subtitle-${nextPartId++}`);
}

/** Counter at the end of the header (e.g. "3 of 10"), coloured by status. */
@Directive({
    selector: '[fd-card-counter], [fdCardCounter]',
    host: { '[attr.id]': 'id()', '[class]': 'computedClass()' }
})
export class CardCounter {
    readonly id = input(`fd-card-counter-${nextPartId++}`);
    readonly status = input<CardKpiStatus | 'neutral' | null | undefined>('neutral');
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 ms-4 mt-[0.125rem] p-0 text-sap-font-small-size whitespace-nowrap',
            TEXT_STATUS[this.status() ?? 'neutral']
        )
    );
}

/** KPI header: value, scale and analytics (deviation, target...). */
@Component({
    selector: 'fd-card-kpi-header',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'm-0 mt-2 flex overflow-hidden p-0' },
    template: `
        <div class="m-0 flex h-12 w-auto shrink-0 p-0">
            <div class="m-0 me-[0.375rem] flex h-full items-center overflow-hidden p-0 pt-0.5">
                <ng-content select="[fd-card-kpi-value], [fdCardKpiValue]" />
            </div>
            <div class="m-0 flex h-full overflow-hidden p-0 pt-2 pb-[0.375rem]">
                <div class="m-0 flex flex-col items-center justify-between p-0">
                    <ng-content select="[fd-card-kpi-scale-icon], [fdCardKpiScaleIcon]" />
                    <ng-content select="[fd-card-kpi-scale-text], [fdCardKpiScaleText]" />
                </div>
            </div>
        </div>
        <div class="m-0 ms-8 flex w-full overflow-x-hidden p-0 whitespace-nowrap">
            <ng-content select="[fd-card-kpi-analytics], [fdCardKpiAnalytics]" />
        </div>
    `
})
export class CardKpiHeader {}

@Directive({
    selector: '[fd-card-kpi-value], [fdCardKpiValue]',
    host: { '[class]': 'computedClass()' }
})
export class CardKpiValue {
    readonly status = input<CardKpiStatus | null | undefined>();
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 p-0 text-[2.25rem] leading-[normal] font-light rtl:[direction:ltr]',
            TEXT_STATUS[this.status() ?? 'neutral']
        )
    );
}

@Directive({
    selector: '[fd-card-kpi-scale-icon], [fdCardKpiScaleIcon]',
    host: { class: 'text-[0.875rem] leading-[normal]' }
})
export class CardKpiScaleIcon {}

@Directive({
    selector: '[fd-card-kpi-scale-text], [fdCardKpiScaleText]',
    host: { class: 'm-0 p-0 text-[0.875rem] leading-[normal]' }
})
export class CardKpiScaleText {}

@Directive({
    selector: '[fd-card-kpi-analytics], [fdCardKpiAnalytics]',
    host: {
        class: 'm-0 ms-4 flex max-w-[calc(50%_-_1rem)] flex-col items-end justify-end overflow-hidden p-0 pb-1 text-sap-font-small-size'
    }
})
export class CardKpiAnalytics {}

@Directive({
    selector: '[fd-card-kpi-analytics-label], [fdCardKpiAnalyticsLabel]',
    host: { class: 'm-0 p-0 pb-1 text-sap-tile-text-color' }
})
export class CardKpiAnalyticsLabel {}

@Directive({
    selector: '[fd-card-kpi-analytics-content], [fdCardKpiAnalyticsContent]',
    host: { class: 'm-0 p-0 text-sap-tile-title-text-color rtl:[direction:ltr] rtl:text-end' }
})
export class CardKpiAnalyticsContent {}

/** Indicator (title and value) in a numeric header. */
@Component({
    selector: 'fd-card-indicator',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'm-0 flex flex-col items-end gap-0.5 p-0 pt-2' },
    template: `<ng-content select="[fd-card-indicator-title], [fdCardIndicatorTitle]" /><ng-content
            select="[fd-card-indicator-value], [fdCardIndicatorValue]"
        />`
})
export class CardIndicator {}

@Directive({
    selector: '[fd-card-indicator-title], [fdCardIndicatorTitle]',
    host: { class: 'm-0 p-0 text-sap-font-small-size text-sap-tile-text-color' }
})
export class CardIndicatorTitle {}

@Directive({
    selector: '[fd-card-indicator-value], [fdCardIndicatorValue]',
    host: { class: 'm-0 p-0 text-end text-sap-font-small-size text-sap-tile-title-text-color' }
})
export class CardIndicatorValue {}

/** KPI block of a numeric header (same structure as fd-card-kpi-header without analytics). */
@Component({
    selector: 'fd-card-numeric-container',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'm-0 flex-1 p-0' },
    template: `
        <div class="m-0 flex h-12 w-auto shrink-0 p-0">
            <div class="m-0 me-[0.375rem] flex h-full items-center overflow-hidden p-0 pt-0.5">
                <ng-content select="[fd-card-kpi-value], [fdCardKpiValue]" />
            </div>
            <div class="m-0 flex h-full overflow-hidden p-0 pt-2 pb-[0.375rem]">
                <div class="m-0 flex flex-col items-center justify-between p-0">
                    <ng-content select="[fd-card-kpi-scale-icon], [fdCardKpiScaleIcon]" />
                    <ng-content select="[fd-card-kpi-scale-text], [fdCardKpiScaleText]" />
                </div>
            </div>
        </div>
    `
})
export class CardNumericContainer {}

/** Content area of a card. */
@Component({
    selector: 'fd-card-content',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' }
})
export class CardContent {
    private readonly card = inject(Card, { optional: true });
    protected readonly computedClass = computed(() => {
        const type = this.card?.cardType();
        return cn(
            `relative m-0 block flex-[1_0_auto] p-0 first:overflow-hidden last:overflow-hidden [[data-card-badges]+&]:overflow-hidden ${PART_CORNERS}`,
            '[--card-fr:0]',
            FAKE_OUTLINE,
            type === 'object' && 'p-4',
            type === 'table' && 'compact:pb-2'
        );
    });
}

/** Template of a footer action: `<button *fdCardFooterActionItem fdButton label="Save"></button>`. */
@Directive({ selector: '[fdCardFooterActionItem]' })
export class CardFooterActionItem {
    readonly templateRef = inject(TemplateRef);
}

/** Footer with content and right-aligned actions. */
@Component({
    selector: 'fd-card-footer',
    imports: [NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'm-0 flex items-center rounded-b-(--card-r) border-t border-solid border-transparent bg-(--card-bg) px-4 pt-3 pb-4 first:rounded-t-(--card-r)'
    },
    template: `
        <ng-content />
        @if (actions().length) {
            <div class="m-0 flex w-full justify-end gap-2 p-0">
                @for (action of actions(); track action) {
                    <ng-container [ngTemplateOutlet]="action.templateRef" />
                }
            </div>
        }
    `
})
export class CardFooter {
    protected readonly actions = contentChildren(CardFooterActionItem);
}

/** Shown instead of the card content while the card is loading. */
@Component({
    selector: 'fd-card-loader',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'm-0 flex min-h-20 items-center justify-center p-0' }
})
export class CardLoader {}

/** Media block: image and text, optionally on a shell or legend colour. */
@Component({
    selector: 'fd-card-media',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'group',
        '[attr.aria-roledescription]': 'ariaRoleDescription()',
        '[class]': 'computedClass()'
    }
})
export class CardMedia {
    readonly ariaRoleDescription = input('Card Media Block');
    /** Image inset from the card edges with rounded corners. */
    readonly hasPadding = input(false, { transform: booleanAttribute });
    readonly shellColor = input<CardShellColor | null | undefined>();
    readonly legendColor = input<CardLegendColor | null | undefined>();
    private readonly card = inject(Card, { optional: true });

    protected readonly computedClass = computed(() => {
        const shell = this.shellColor();
        const legend = this.legendColor();
        const banner = this.card?.cardType() === 'banner';
        return cn(
            'relative m-0 box-border flex h-full min-h-0 [flex-direction:var(--cm-dir)] overflow-hidden bg-(--cm-bg) p-0',
            '[--cm-dir:row] [--cm-bg:var(--sapTile_Background)] rounded-t-(--card-r) only:rounded-(--card-r)',
            this.hasPadding() && 'px-4 pt-4 [--cm-ir:0.5rem]',
            shell && SHELL_COLOR[shell],
            legend && LEGEND_COLOR[legend],
            banner && [
                // side by side, stacked below 600px
                '[--cm-cw:80%] [--cm-cp:3rem] has-[[data-card-media-image]]:[--cm-cw:50%] has-[[data-card-media-image]]:[--cm-iw:50%]',
                'max-lg:has-[[data-card-media-image]]:[--cm-cw:80%] max-lg:has-[[data-card-media-image]]:[--cm-iw:20%]',
                'max-sm:[--cm-cw:100%] max-sm:has-[[data-card-media-image]]:[--cm-dir:column-reverse] max-sm:has-[[data-card-media-image]]:[--cm-iw:100%]',
                'max-sm:has-[[data-card-media-image]]:[--cm-cw:100%] max-sm:has-[[data-card-media-image]]:[--cm-ih:10rem] max-sm:has-[[data-card-media-image]]:[--cm-ch:auto]'
            ]
        );
    });
}

@Directive({
    selector: '[fd-card-media-image-container], [fdCardMediaImageContainer]',
    host: { 'data-card-media-image': '', class: 'm-0 flex h-(--cm-ih) min-h-0 w-(--cm-iw) shrink-0 p-0' }
})
export class CardMediaImageContainer {}

@Directive({
    selector: 'img[fd-card-media-image], img[fdCardMediaImage]',
    host: { class: 'h-full min-h-0 w-full flex-1 rounded-(--cm-ir) object-cover' }
})
export class CardMediaImage {}

/** Text block of a media card, optionally overlaying the image. */
@Directive({
    selector: '[fd-card-media-content-container], [fdCardMediaContentContainer]',
    host: { '[class]': 'computedClass()' }
})
export class CardMediaContentContainer {
    /** Positions the text over the image. */
    readonly isOverlay = input(false, { transform: booleanAttribute });
    readonly shellColor = input<CardShellColor | null | undefined>();
    readonly legendColor = input<CardLegendColor | null | undefined>();
    protected readonly computedClass = computed(() => {
        const shell = this.shellColor();
        const legend = this.legendColor();
        return cn(
            'relative z-[3] m-0 box-border flex h-(--cm-ch) max-h-full w-(--cm-cw) flex-col items-start justify-center gap-4',
            'bg-(--cm-cbg) px-(--cm-cp) py-(--cm-cp)',
            this.isOverlay() &&
                'absolute start-12 top-1/2 h-fit w-[calc(50%_-_3rem)] -translate-y-1/2 max-sm:end-12 max-sm:w-auto max-sm:p-4',
            shell && CONTAINER_SHELL_COLOR[shell],
            legend && CONTAINER_LEGEND_COLOR[legend]
        );
    });
}

@Directive({
    selector: '[fd-card-media-heading], [fdCardMediaHeading]',
    host: {
        role: 'heading',
        '[attr.aria-level]': 'level()',
        '[attr.id]': 'id()',
        class: 'm-0 p-0 font-sap-font-header-family text-sap-font-header3-size font-bold text-(--cm-hc) [text-shadow:var(--cm-hs)]'
    }
})
export class CardMediaHeading {
    readonly id = input(`fd-card-media-heading-${nextPartId++}`);
    readonly level = input<number | null | undefined>(2);
}

@Directive({
    selector: '[fd-card-media-text], [fdCardMediaText]',
    host: { class: 'm-0 p-0 text-sap-font-size font-normal text-(--cm-tc)' }
})
export class CardMediaText {}

/**
 * List of interactive cards (role listitem): arrow keys move between the cards.
 *
 * ```html
 * <div fd-card-list ariaLabel="Products"><fd-card role="listitem">...</fd-card></div>
 * ```
 */
@Directive({
    selector: '[fd-card-list], [fdCardList]',
    host: {
        role: 'list',
        '[attr.aria-roledescription]': 'ariaRoleDescription()',
        '[attr.aria-label]': 'ariaLabel()',
        '(keydown)': 'onKeydown($event)'
    }
})
export class CardList {
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaRoleDescription = input('Card List');
    private readonly cards = contentChildren(Card, { descendants: true });

    protected onKeydown(event: KeyboardEvent): void {
        const cards = this.cards().map((card) => card.elementRef.nativeElement);
        const index = cards.indexOf(document.activeElement as HTMLElement);
        if (index < 0) return;
        const keys: Record<string, number> = {
            ArrowDown: index + 1,
            ArrowRight: index + 1,
            ArrowUp: index - 1,
            ArrowLeft: index - 1,
            Home: 0,
            End: cards.length - 1
        };
        const next = keys[event.key];
        if (next === undefined || next < 0 || next >= cards.length) return;
        event.preventDefault();
        cards[next].focus();
    }
}
