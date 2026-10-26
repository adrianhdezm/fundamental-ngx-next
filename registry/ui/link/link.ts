import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

/**
 * SAP Fiori link. Apply to an `<a>` (or a `<button>` for in-page actions).
 * Project `<fd-icon>` before or after the text for icon links.
 *
 * ```html
 * <a fdLink href="/orders">Orders</a>
 * <a fdLink emphasized routerLink="/new">Create order <fd-icon glyph="arrow-right" /></a>
 * ```
 */
@Component({
    selector: '[fdLink]',
    exportAs: 'fdLink',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[attr.aria-disabled]': 'disabled() ? "true" : "false"',
        '[attr.tabindex]': 'disabled() ? -1 : null'
    },
    template: `
        <span [class]="contentClass()"><ng-content /></span>
        @if (emphasized()) {
            <span class="sr-only-sap">{{ emphasizedLabel() }}</span>
        }
        @if (subtle()) {
            <span class="sr-only-sap">{{ subtleLabel() }}</span>
        }
    `
})
export class Link {
    /** Bold link for important navigation. */
    readonly emphasized = input(false, { transform: booleanAttribute });
    /** Disables the link: aria-disabled, out of the tab order, no pointer events. */
    readonly disabled = input(false, { transform: booleanAttribute });
    /** For dark backgrounds such as the shell. */
    readonly inverted = input(false, { transform: booleanAttribute });
    /** Less prominent link, underlined at rest. */
    readonly subtle = input(false, { transform: booleanAttribute });
    /** Never underlined. */
    readonly undecorated = input(false, { transform: booleanAttribute });
    /** 1.5rem line height to meet the WCAG 2.2 minimum target size inside lists and tables. */
    readonly touchTarget = input(false, { transform: booleanAttribute });
    /** Announced after emphasized links. */
    readonly emphasizedLabel = input('Emphasized');
    /** Announced after subtle links. */
    readonly subtleLabel = input('Subtle');

    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly computedClass = computed(() =>
        cn(
            'group/link inline-flex items-center cursor-pointer bg-transparent p-0 border-0 font-sap-font-family text-sap-font-size',
            'leading-4 whitespace-normal break-words [overflow-wrap:break-word] no-underline',
            'text-sap-link-color text-shadow-sap-content-text-shadow transition-all duration-[125ms] ease-in',
            'visited:text-sap-link-visited-color hover:text-sap-link-hover-color active:text-sap-link-active-color',
            // Horizon: filled focus; high contrast: outline
            'focus:outline-none focus:shadow-none focus:z-[5] focus:text-sap-content-contrast-text-color focus:[text-shadow:none]',
            'focus:bg-sap-content-focus-color focus:rounded-[0.125rem] active:focus:bg-transparent',
            'hc:focus:bg-transparent hc:focus:rounded-none hc:focus:outline-(length:--sapContent_FocusWidth) hc:focus:outline-offset-[0.125rem]',
            'hc:focus:[outline-style:var(--sapContent_FocusStyle)] hc:focus:outline-sap-content-focus-color',
            '[&_fd-icon]:leading-none [&_fd-icon:first-child]:me-0.5 [&_fd-icon:last-child]:ms-0.5',
            this.emphasized() && 'font-sap-font-bold-family',
            this.touchTarget() && 'leading-6',
            this.subtle() && 'text-sap-link-subtle-color',
            this.inverted() &&
                'text-sap-link-inverted-color hover:text-sap-link-inverted-color [text-shadow:none] focus:outline-sap-content-contrast-focus-color',
            this.disabled() &&
                'pointer-events-none opacity-(--sapContent_DisabledOpacity) text-sap-link-color visited:text-sap-link-color',
            this.userClass()
        )
    );

    protected readonly contentClass = computed(() => {
        if (this.undecorated()) return 'no-underline has-[fd-icon]:leading-(--sapContent_LineHeight)';
        return cn(
            'has-[fd-icon]:leading-(--sapContent_LineHeight)',
            this.subtle()
                ? 'underline group-hover/link:no-underline group-active/link:underline'
                : '[text-decoration:var(--sapLink_TextDecoration)] group-hover/link:[text-decoration:var(--sapLink_Hover_TextDecoration)] group-active/link:[text-decoration:var(--sapLink_Active_TextDecoration)]',
            'group-focus/link:underline',
            this.disabled() && '[text-decoration:var(--sapLink_TextDecoration)]'
        );
    });
}
