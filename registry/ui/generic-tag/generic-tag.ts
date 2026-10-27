import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input } from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon } from '@/ui/icon/icon';

export type GenericTagType = 'error' | 'success' | 'warning' | 'information';

/** Decorator (--gt-deco), background (--gt-bg), icon (--gt-ic) and value (--gt-vc) colours. */
const TYPE: Record<GenericTagType | 'neutral', string> = {
    neutral:
        '[--gt-deco:var(--sapNeutralElementColor)] [--gt-bg:var(--sapNeutralBackground)] [--gt-ic:var(--sapNeutralElementColor)] [--gt-vc:var(--sapNeutralTextColor)]',
    error: '[--gt-deco:var(--sapNegativeElementColor)] [--gt-bg:var(--sapErrorBackground)] [--gt-ic:var(--sapNegativeElementColor)] [--gt-vc:var(--sapNegativeTextColor)]',
    warning:
        '[--gt-deco:var(--sapCriticalElementColor)] [--gt-bg:var(--sapWarningBackground)] [--gt-ic:var(--sapCriticalElementColor)] [--gt-vc:var(--sapCriticalTextColor)]',
    success:
        '[--gt-deco:var(--sapPositiveElementColor)] [--gt-bg:var(--sapSuccessBackground)] [--gt-ic:var(--sapPositiveElementColor)] [--gt-vc:var(--sapPositiveTextColor)]',
    information:
        '[--gt-deco:var(--sapInformativeElementColor)] [--gt-bg:var(--sapInformationBackground)] [--gt-ic:var(--sapInformativeElementColor)] [--gt-vc:var(--sapInformativeTextColor)]'
};

/**
 * Generic tag: a key figure (name and value) with an optional status, shown in object page headers.
 *
 * ```html
 * <div fd-generic-tag name="Product Cost" value="3.5M EUR"></div>
 * <div fd-generic-tag type="error" name="Overdue" value="12 days" (click)="open()"></div>
 * ```
 */
@Component({
    selector: '[fdGenericTag], [fd-generic-tag]',
    exportAs: 'fdGenericTag',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'button',
        tabindex: '0',
        '[class]': 'computedClass()',
        '[attr.aria-roledescription]': 'ariaRoleDescription()',
        '(keydown.enter)': 'activate($event)',
        '(keydown.space)': 'activate($event)'
    },
    template: `
        @if (type()) {
            <fd-icon [glyph]="'message-' + type()" class="flex items-center justify-center text-base text-(--gt-ic)" />
        }
        <span [class]="textClass" class="text-(--gt-nc)">{{ name() }}</span>
        @if (value()) {
            <span [class]="textClass" class="ms-3 text-(--gt-vc)">{{ value() }}</span>
        }
    `
})
export class GenericTag {
    readonly type = input<GenericTagType | null | undefined>();
    readonly name = input.required<string>();
    readonly value = input<string | null | undefined>();
    readonly ariaRoleDescription = input('Generic Tag');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    protected readonly textClass = 'm-0 min-w-[1.5625rem] truncate p-0 text-shadow-(--gt-ts)';

    /** role="button" hosts activate with Enter and Space like native buttons. */
    protected activate(event: Event): void {
        const host = this.elementRef.nativeElement;
        if (event.target !== host || host instanceof HTMLButtonElement) return;
        event.preventDefault();
        host.click();
    }

    protected readonly computedClass = computed(() =>
        cn(
            'mx-0 my-[0.5625rem] compact:my-[0.1875rem] box-border flex h-[1.625rem] w-fit cursor-pointer items-center gap-[0.375rem] ps-3 pe-[0.375rem]',
            'font-sap-font-family text-sap-font-size rounded-sap-button-border-corner-radius shadow-sap-content-shadow0',
            '[--gt-nc:var(--sapList_TextColor)] [--gt-ts:var(--sapContent_TextShadow)] [--gt-pos:0] rtl:[--gt-pos:100%]',
            // status decorator strip on the start edge over the background colour
            '[background:var(--gt-pos)_0_/_0.375rem_100%_no-repeat_linear-gradient(0deg,var(--gt-deco),var(--gt-deco))_var(--gt-bg)]',
            TYPE[this.type() ?? 'neutral'],
            'enabled-hover:[--gt-bg:var(--sapList_Hover_Background)] enabled-hover:[--gt-ts:none]',
            'hc:enabled-hover:[--gt-nc:var(--sapList_Active_TextColor)] hc:enabled-hover:[--gt-vc:var(--sapList_Active_TextColor)] hc:enabled-hover:[--gt-ic:var(--sapList_Active_TextColor)]',
            'active:[--gt-bg:var(--sapList_Active_Background)] active:[--gt-ts:none] active:[--gt-nc:var(--sapList_Active_TextColor)]',
            'active:[--gt-vc:var(--sapList_Active_TextColor)] active:[--gt-ic:var(--sapList_Active_TextColor)]',
            'focus:outline-sap active:outline-sap hc:outline-offset-[-0.1875rem]',
            this.userClass()
        )
    );
}
