/*
 * Port of @fundamental-ngx/core (info-label) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon, type IconFont } from '@/ui/icon/icon';

export type InfoLabelColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type InfoLabelType = 'numeric' | 'icon';

/** Accent colours, from extensions.css (SAP avatar colours; a coloured palette in high contrast). */
const COLOR: Record<InfoLabelColor, string> = {
    1: '[--il-bg:var(--fdInfoLabel_Background_1)] [--il-c:var(--fdInfoLabel_Color_1)]',
    2: '[--il-bg:var(--fdInfoLabel_Background_2)] [--il-c:var(--fdInfoLabel_Color_2)]',
    3: '[--il-bg:var(--fdInfoLabel_Background_3)] [--il-c:var(--fdInfoLabel_Color_3)]',
    4: '[--il-bg:var(--fdInfoLabel_Background_4)] [--il-c:var(--fdInfoLabel_Color_4)]',
    5: '[--il-bg:var(--fdInfoLabel_Background_5)] [--il-c:var(--fdInfoLabel_Color_5)]',
    6: '[--il-bg:var(--fdInfoLabel_Background_6)] [--il-c:var(--fdInfoLabel_Color_6)]',
    7: '[--il-bg:var(--fdInfoLabel_Background_7)] [--il-c:var(--fdInfoLabel_Color_7)]',
    8: '[--il-bg:var(--fdInfoLabel_Background_8)] [--il-c:var(--fdInfoLabel_Color_8)]',
    9: '[--il-bg:var(--fdInfoLabel_Background_9)] [--il-c:var(--fdInfoLabel_Color_9)]',
    10: '[--il-bg:var(--fdInfoLabel_Background_10)] [--il-c:var(--fdInfoLabel_Color_10)]'
};

/**
 * Info label: a small coloured label for a status, category or count that is not interactive.
 *
 * ```html
 * <fd-info-label label="In stock" [color]="8" />
 * <fd-info-label type="icon" glyph="employee" label="Owner" />
 * <fd-info-label type="numeric" label="42k" title="Users" />
 * ```
 */
@Component({
    selector: 'fd-info-label',
    exportAs: 'fdInfoLabel',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: `
        @if (glyph()) {
            <fd-icon
                [glyph]="glyph()"
                [font]="font()"
                [ariaLabel]="label() ? null : ariaLabel()"
                class="h-(--il-h) text-(length:--il-icon) leading-(--il-h) text-inherit"
            />
        }
        @if (label()) {
            <span
                class="m-0 p-0 font-sap-font-semibold-duplex-family text-(length:--il-font) text-inherit"
                [attr.title]="title() || null"
                [attr.aria-label]="ariaLabel() || null"
                [attr.aria-labelledby]="ariaLabelledBy() || null"
                >{{ label() }}</span
            >
        }
        <span class="sr-only-sap">{{ srText() }}</span>
    `
})
export class InfoLabel {
    /** "numeric" for counts, "icon" for icon labels. */
    readonly type = input<InfoLabelType | null | undefined>();
    readonly label = input<string | null | undefined>();
    readonly glyph = input<string | null | undefined>();
    readonly font = input<IconFont>('SAP-icons');
    /** Accent colour 1-10 (default 7). */
    readonly color = input<InfoLabelColor | `${InfoLabelColor}` | null | undefined>(7);
    /** Smaller variant for display contexts such as tables. */
    readonly display = input(false, { transform: booleanAttribute });
    readonly title = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    /** Hidden text that tells screen reader users what the label is. */
    readonly srText = input('Info Label');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly validColor = computed<InfoLabelColor>(() => {
        const n = Number(this.color() ?? 7);
        return Number.isInteger(n) && n >= 1 && n <= 10 ? (n as InfoLabelColor) : 7;
    });

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border inline-flex w-auto items-center gap-1 px-1.5 py-0 align-middle',
            '[--il-h:1.375rem] [--il-icon:0.75rem] [--il-font:var(--sapFontSize)] h-(--il-h) rounded-[0.25rem]',
            'font-sap-font-family leading-[normal] border border-solid border-(--il-bg) bg-(--il-bg) text-(--il-c)',
            COLOR[this.validColor()],
            this.display() &&
                'gap-0.5 px-1 rounded-[0.1875rem] [--il-h:1rem] [--il-icon:0.625rem] [--il-font:var(--sapFontSmallSize)]',
            this.userClass()
        )
    );
}
