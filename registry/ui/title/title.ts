import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    InjectionToken,
    booleanAttribute,
    computed,
    inject,
    input
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

export type HeaderSize = 1 | 2 | 3 | 4 | 5 | 6;

/** Default visual size for titles inside a component (e.g. dialogs use 5). */
export const FD_DEFAULT_TITLE_SIZE = new InjectionToken<HeaderSize>('FdDefaultTitleSize');

const SIZE: Record<HeaderSize, string> = {
    1: 'text-sap-font-header1-size',
    2: 'text-sap-font-header2-size',
    3: 'text-sap-font-header3-size',
    4: 'text-sap-font-header4-size',
    5: 'text-sap-font-header5-size',
    6: 'text-sap-font-header6-size'
};

/**
 * Title: a heading with the SAP header typography. The visual size follows the heading level
 * unless `headerSize` decouples them, so the document outline stays semantic.
 *
 * ```html
 * <h2 fdTitle>Section</h2>
 * <h1 fdTitle [headerSize]="4">Page title styled smaller</h1>
 * ```
 */
@Component({
    selector: '[fdTitle], [fd-title]',
    exportAs: 'fdTitle',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' },
    template: '<ng-content />'
})
export class Title {
    /** Visual size, independent of the heading level. */
    readonly headerSize = input<HeaderSize | null>(null);
    /** Wraps long titles instead of truncating them. */
    readonly wrap = input(false, { transform: booleanAttribute });
    /** Clamps to two lines. */
    readonly twoLineClamp = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly defaultSize = inject(FD_DEFAULT_TITLE_SIZE, { optional: true });

    readonly size = computed<HeaderSize>(() => {
        const explicit = this.headerSize() ?? this.defaultSize;
        if (explicit) return explicit;
        const match = /^H([1-6])$/.exec(this.elementRef.nativeElement.tagName);
        return match ? (Number(match[1]) as HeaderSize) : 5;
    });

    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border p-0 truncate font-sap-font-header-family font-normal leading-[normal] text-sap-text-color',
            SIZE[this.size()],
            this.wrap() && 'overflow-auto whitespace-normal text-clip',
            this.twoLineClamp() && 'line-clamp-2 whitespace-normal',
            this.userClass()
        )
    );
}
