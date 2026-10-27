/*
 * Port of @fundamental-ngx/core (bar) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChangeDetectionStrategy, Component, Directive, booleanAttribute, computed, input } from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Button, type ButtonVariant, type GlyphPosition } from '@/ui/button/button';
import type { IconFont } from '@/ui/icon/icon';

export type BarDesign = 'header' | 'subheader' | 'header-with-subheader' | 'footer' | 'floating-footer';
/** Responsive size of page bars: s (small), m_l (medium/large) or xl. */
export type BarSize = '' | 's' | 'm_l' | 'xl';

/** Horizontal padding (--bar-px) and floating footer offset (--bar-off) per page size. */
const PAGE_SIZE: Record<BarSize, string> = {
    '': '[--bar-px:1rem] [--bar-off:1rem]',
    s: '[--bar-px:1rem] [--bar-off:1rem]',
    m_l: '[--bar-px:2rem] [--bar-off:2rem]',
    xl: '[--bar-px:3rem] [--bar-off:3rem]'
};
const HOME_PAGE_SIZE: Record<BarSize, string> = { ...PAGE_SIZE, s: '[--bar-px:0.5rem] [--bar-off:1rem]' };

const DESIGN: Record<BarDesign, string> = {
    header: [
        '[--bar-tc:var(--sapPageHeader_TextColor)] [--bar-tf:var(--sapFontHeaderFamily)] [--bar-ts:var(--sapFontHeader5Size)]',
        'has-[+[data-bar-design=subheader]]:[--bar-shadow:none]'
    ].join(' '),
    subheader: '[--bar-h:3rem] compact:[--bar-h:2.25rem] [--bar-pb:0.25rem]',
    'header-with-subheader': 'relative z-[2] [--bar-shadow:none]',
    footer: [
        '[--bar-shadow:none] [--bar-bg:var(--sapPageFooter_Background)] [--bar-tc:var(--sapPageFooter_TextColor)]',
        'border-t-(length:--sapGroup_TitleBorderWidth) border-solid border-sap-page-footer-border-color'
    ].join(' '),
    'floating-footer': [
        '[--bar-shadow:var(--sapContent_Shadow1)] [--bar-bg:var(--sapPageFooter_Background)] [--bar-tc:var(--sapPageFooter_TextColor)]',
        'absolute inset-x-(--bar-off) bottom-2 z-[1000] rounded-sap-element-border-corner-radius [--bar-off:0.5rem]'
    ].join(' ')
};

/**
 * Bar: a horizontal container for titles and actions with left, middle and right areas, used as
 * page, dialog and popover headers, subheaders and footers.
 *
 * ```html
 * <div fd-bar barDesign="footer">
 *     <div fd-bar-right><fd-button-bar variant="emphasized" label="Save" /><fd-button-bar label="Cancel" /></div>
 * </div>
 * ```
 */
@Component({
    selector: '[fdBar], [fd-bar]',
    exportAs: 'fdBar',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.role]': 'role()',
        '[attr.data-bar-design]': 'barDesign() || null',
        '[class]': 'computedClass()'
    },
    template: `
        <ng-content select="[fd-bar-left], [fdBarLeft]" />
        <ng-content select="[fd-bar-middle], [fdBarMiddle]" />
        <ng-content select="[fd-bar-right], [fdBarRight]" />
        <ng-content />
    `
})
export class Bar {
    readonly barDesign = input<BarDesign | null | undefined>();
    /** Page paddings (and floating footer offsets) for the given size. */
    readonly inPage = input(false, { transform: booleanAttribute });
    /** Home page paddings for the given size. */
    readonly inHomePage = input(false, { transform: booleanAttribute });
    readonly size = input<BarSize>('');
    /** No shadow. */
    readonly clear = input(false, { transform: booleanAttribute });
    readonly initialSuggestionTitle = input(false, { transform: booleanAttribute });
    readonly initialSuggestionSubline = input(false, { transform: booleanAttribute });
    readonly role = input<string | null>('toolbar');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly computedClass = computed(() => {
        const design = this.barDesign();
        return cn(
            'relative z-[1] m-0 box-border flex items-center justify-between gap-2 p-0',
            'min-h-(--bar-h) ps-(--bar-px) pe-(--bar-px) pt-(--bar-pt) pb-(--bar-pb)',
            'bg-(--bar-bg) shadow-(--bar-shadow) font-sap-font-family text-sap-font-size text-sap-text-color',
            '[--bar-h:2.75rem] compact:[--bar-h:2.5rem] [--bar-px:1rem] [--bar-pt:0] [--bar-pb:0]',
            '[--bar-shadow:var(--sapContent_HeaderShadow)] [--bar-bg:var(--sapPageHeader_Background)]',
            '[--bar-tc:var(--sapTextColor)] [--bar-tf:var(--sapFontFamily)] [--bar-ts:var(--sapFontSize)]',
            design && DESIGN[design],
            this.inPage() && PAGE_SIZE[this.size()],
            this.inHomePage() && HOME_PAGE_SIZE[this.size()],
            design === 'floating-footer' && (this.inPage() || this.inHomePage()) && '[--bar-px:0.5rem]',
            this.clear() && '[--bar-shadow:none]',
            this.initialSuggestionTitle() && 'h-auto pt-2',
            this.initialSuggestionSubline() && 'h-auto pt-1 [--bar-pb:0.5rem]',
            this.userClass()
        );
    });
}

const AREA =
    'm-0 box-border flex min-w-0 flex-[0_1_auto] items-center gap-2 p-0 has-[button,input]:min-w-fit has-[h1,h2,h3,h4,h5,h6]:min-w-0 has-[h1,h2,h3,h4,h5,h6]:shrink only:w-full only:flex-[1_1_100%]';

@Directive({
    selector: '[fd-bar-left], [fdBarLeft]',
    host: { '[class]': 'computedClass()' }
})
export class BarLeft {
    readonly stackContentsVertically = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(AREA, this.stackContentsVertically() && 'flex-col', this.userClass())
    );
}

@Directive({
    selector: '[fd-bar-middle], [fdBarMiddle]',
    host: { '[class]': 'computedClass()' }
})
export class BarMiddle {
    readonly stackContentsVertically = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(AREA, 'justify-center', this.stackContentsVertically() && 'flex-col', this.userClass())
    );
}

@Directive({
    selector: '[fd-bar-right], [fdBarRight]',
    host: { '[class]': 'computedClass()' }
})
export class BarRight {
    readonly stackContentsVertically = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(AREA, 'justify-end', this.stackContentsVertically() && 'flex-col', this.userClass())
    );
}

const ELEMENT =
    'm-0 box-border flex max-h-full max-w-full items-center justify-center p-0 [text-wrap:auto] text-(--bar-tc) font-(family-name:--bar-tf) text-(length:--bar-ts)';

/** An item of a bar area. */
@Directive({
    selector: 'fd-bar-element, [fdBarElement]',
    host: { '[class]': 'computedClass()' }
})
export class BarElement {
    /** Stretches the element (and its first child) over the area. */
    readonly fullWidth = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(ELEMENT, this.fullWidth() && 'w-full [&>*:first-child]:grow', this.userClass())
    );
}

let nextButtonBarId = 0;

/** A transparent (by default) button as a bar element. */
@Component({
    selector: 'fd-button-bar',
    exportAs: 'fdButtonBar',
    imports: [Button],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[style.pointer-events]': 'disabled() ? "none" : null'
    },
    template: `
        <button
            fdButton
            [id]="id()"
            [type]="type()"
            [variant]="variant()"
            [label]="label()"
            [glyph]="glyph()"
            [glyphFont]="glyphFont()"
            [glyphPosition]="glyphPosition()"
            [fdMenu]="fdMenu()"
            [disabled]="disabled()"
            [ariaLabel]="ariaLabel()"
            [attr.title]="title()"
        >
            <ng-content />
        </button>
    `
})
export class ButtonBar {
    readonly id = input(`fd-button-bar-${nextButtonBarId++}`);
    readonly variant = input<ButtonVariant>('transparent');
    readonly label = input<string | null | undefined>();
    readonly glyph = input<string | null | undefined>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly glyphPosition = input<GlyphPosition>('before');
    readonly fdMenu = input(false, { transform: booleanAttribute });
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly type = input<string>('button');
    readonly ariaLabel = input<string | null | undefined>();
    readonly title = input<string | null | undefined>();
    readonly fullWidth = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly computedClass = computed(() =>
        cn(ELEMENT, this.fullWidth() && 'w-full [&>*:first-child]:grow', this.userClass())
    );
}
