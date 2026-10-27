import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    ElementRef,
    booleanAttribute,
    computed,
    contentChild,
    effect,
    inject,
    input
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

export type BusyIndicatorSize = 's' | 'm' | 'l';

const DOTS: Record<BusyIndicatorSize, string> = {
    s: '[--dot:0.5rem] [--dot-gap:0.0625rem]',
    m: '[--dot:1rem] [--dot-gap:0.1875rem]',
    l: '[--dot:2rem] [--dot-gap:0.25rem]'
};

const DOT =
    'relative inline-block size-(--dot) rounded-full bg-current animate-sap-busy me-(--dot-gap) motion-reduce:animate-none';

/**
 * Busy indicator: three pulsing dots that show that content is loading. Wrapping content
 * covers it with a translucent layer and makes it inert (not focusable or clickable) while loading.
 *
 * ```html
 * <fd-busy-indicator loading ariaLabel="Loading" />
 * <fd-busy-indicator [loading]="saving()" block><form>...</form></fd-busy-indicator>
 * ```
 */
@Component({
    selector: 'fd-busy-indicator',
    exportAs: 'fdBusyIndicator',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[attr.role]': "loading() ? 'progressbar' : 'presentation'",
        '[attr.tabindex]': 'loading() ? 0 : -1',
        '[attr.aria-busy]': 'loading()',
        '[attr.aria-live]': 'ariaLive()',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.aria-valuetext]': 'loading() ? ariaValueText() || "Busy" : null',
        '[attr.aria-valuemin]': '0',
        '[attr.aria-valuemax]': '100',
        '[attr.title]': 'loading() ? title() || "Please wait" : null'
    },
    template: `
        <span class="contents" [attr.inert]="loading() ? '' : null"><ng-content /></span>
        @if (loading()) {
            <div data-busy-dots [class]="dotsClass()">
                <div class="${DOT}"></div>
                <div class="${DOT} [animation-delay:0.2s]"></div>
                <div class="${DOT} me-0 [animation-delay:0.4s]"></div>
            </div>
            @if (label()) {
                <span
                    class="block text-center font-sap-font-family text-sap-font-size text-sap-page-footer-text-color [:not(:empty)+[data-busy-dots]+&]:absolute [:not(:empty)+[data-busy-dots]+&]:start-1/2 [:not(:empty)+[data-busy-dots]+&]:top-1/2 [:not(:empty)+[data-busy-dots]+&]:z-[11] [:not(:empty)+[data-busy-dots]+&]:translate-y-1/2 [:not(:empty)+[data-busy-dots]+&]:-translate-x-1/2 [:not(:empty)+[data-busy-dots]+&]:whitespace-nowrap rtl:[:not(:empty)+[data-busy-dots]+&]:translate-x-1/2"
                    >{{ label() }}</span
                >
            }
            <div
                class="absolute inset-0 z-10 bg-sap-base-color opacity-72 [:empty+[data-busy-dots]~&]:bg-transparent"
            ></div>
        }
    `
})
export class BusyIndicator {
    /** Shows the indicator and blocks the wrapped content. */
    readonly loading = input(false, { transform: booleanAttribute });
    readonly size = input<BusyIndicatorSize>('m');
    /** Wraps block content (display: block) instead of inline content. */
    readonly block = input(false, { transform: booleanAttribute });
    /** Dots in the contrast colour, for dark backgrounds. */
    readonly contrast = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null>(null);
    /** Announced value; defaults to "Busy". */
    readonly ariaValueText = input<string | null>(null);
    /** Tooltip; defaults to "Please wait". */
    readonly title = input<string | undefined>(undefined);
    /** Text below the dots. */
    readonly label = input<string | undefined>(undefined);
    readonly ariaLive = input<'assertive' | 'polite' | 'off' | null>(null);
    /** Blocks mouse wheel scrolling over the indicator while loading. */
    readonly preventWheelEvents = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    protected readonly computedClass = computed(() =>
        cn(
            'relative focus:outline-sap',
            this.block() ? 'block' : 'inline-block',
            !this.loading() && 'outline-none',
            this.userClass()
        )
    );

    protected readonly dotsClass = computed(() =>
        cn(
            'relative z-[11] block text-center text-[0] leading-none',
            this.contrast()
                ? 'text-sap-content-contrast-icon-color hc:text-sap-content-busy-color'
                : 'text-sap-content-busy-color',
            '[:not(:empty)+&]:absolute [:not(:empty)+&]:start-1/2 [:not(:empty)+&]:top-1/2 [:not(:empty)+&]:-translate-1/2 [:not(:empty)+&]:whitespace-nowrap rtl:[:not(:empty)+&]:translate-x-1/2',
            DOTS[this.size()]
        )
    );

    constructor() {
        effect((onCleanup) => {
            if (!this.preventWheelEvents()) return;
            const el = this.elementRef.nativeElement;
            const listener = (event: WheelEvent) => {
                if (this.loading()) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            };
            el.addEventListener('wheel', listener, { passive: false });
            onCleanup(() => el.removeEventListener('wheel', listener));
        });
    }
}

/**
 * Container that stacks a busy indicator and its label, e.g. inside a message toast or dialog.
 *
 * ```html
 * <div fdBusyIndicatorExtended><fd-busy-indicator loading label="Loading data" /></div>
 * ```
 */
@Directive({
    selector: '[fdBusyIndicatorExtended], [fd-busy-indicator-extended]',
    host: { class: 'flex flex-col items-center justify-center gap-4 p-4' }
})
export class BusyIndicatorExtended {
    protected readonly indicator = contentChild(BusyIndicator);
}
