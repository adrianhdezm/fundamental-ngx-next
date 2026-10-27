import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    booleanAttribute,
    computed,
    inject,
    input,
    numberAttribute
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

export type FacetType = 'form' | 'key-value' | 'image' | 'rating-indicator' | 'custom';

let nextId = 0;

/**
 * Group of facets in an object page header: facets wrap and keep their spacing.
 *
 * ```html
 * <fd-facet-group ariaLabel="Product facets">
 *     <fd-facet type="key-value" facetTitle="Status">
 *         <span fd-object-status status="positive" label="Delivery" large></span>
 *     </fd-facet>
 * </fd-facet-group>
 * ```
 */
@Component({
    selector: 'fd-facet-group',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'group',
        '[attr.aria-label]': 'ariaLabel()',
        '[class]': 'computedClass()'
    }
})
export class FacetGroup {
    readonly ariaLabel = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex flex-wrap items-start gap-8 p-0 font-sap-font-family text-sap-font-size text-sap-text-color',
            this.userClass()
        )
    );
}

/**
 * A facet: a titled block of key information (form fields, a key value, a rating or an image).
 */
@Component({
    selector: 'fd-facet',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.id]': 'id()',
        '[attr.role]': 'type() !== "image" ? "group" : null',
        '[attr.aria-labelledby]': 'type() !== "image" && facetTitle() ? titleId : null',
        '[class]': 'computedClass()'
    },
    template: `
        @if (type() !== 'image' && facetTitle()) {
            <div
                class="m-0 p-0 font-sap-font-family text-sap-font-large-size leading-[normal] font-normal text-sap-title-color"
                [id]="titleId"
                [attr.role]="headingLevel() ? 'heading' : null"
                [attr.aria-level]="headingLevel()"
            >
                {{ facetTitle() }}
            </div>
        }
        @if (type() === 'rating-indicator' && subtitle()) {
            <span class="m-0 p-0 text-sap-font-small-size text-sap-content-label-color">{{ subtitle() }}</span>
        }
        <ng-content />
    `
})
export class Facet {
    readonly id = input(`fd-facet-${nextId}`);
    readonly type = input<FacetType>('custom');
    readonly facetTitle = input<string | null | undefined>();
    /** Text below the title of a rating facet, e.g. the number of reviews. */
    readonly subtitle = input<string | null | undefined>();
    /** Makes the title a heading of this level. */
    readonly headingLevel = input<number | undefined, unknown>(undefined, {
        transform: (v: unknown) =>
            v === null || v === undefined || v === '' ? undefined : numberAttribute(String(v).replace(/\D/g, ''))
    });
    /** Pushes the facet to the end of the group. */
    readonly alignEnd = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly titleId = `fd-facet-title-${nextId++}`;

    protected readonly computedClass = computed(() => {
        const type = this.type();
        return cn(
            'm-0 box-border block p-0 font-sap-font-family text-sap-font-size text-sap-text-color',
            this.alignEnd() ? 'order-1 ms-8 flex flex-1 flex-col items-end' : 'me-8',
            type !== 'image' && 'mb-4',
            type === 'image' && '-order-1 flex',
            type === 'form' && 'flex flex-col',
            type === 'key-value' && '[&_[fd-object-status]]:font-sap-font-family',
            type === 'rating-indicator' && 'inline-flex flex-col items-start justify-start',
            this.userClass()
        );
    });
}

/** A row of a form facet (label and value), or the content of a rating facet. */
@Directive({
    selector: 'fd-facet-content, [fd-facet-content]',
    host: { '[class]': 'computedClass()' }
})
export class FacetContent {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly facet = inject(Facet, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex p-0',
            this.facet?.type() === 'form' && 'items-baseline gap-1 not-last:mb-2 [&_fd-icon]:me-2',
            this.facet?.type() === 'rating-indicator' && 'flex-col',
            this.userClass()
        )
    );
}

/** Value of a form facet row. */
@Directive({
    selector: '[fd-facet-form-value], [fdFacetFormValue]',
    host: {
        class: 'm-0 p-0 font-sap-font-family text-sap-font-size font-normal text-sap-group-title-text-color'
    }
})
export class FacetFormValue {}

/** Flex container for laying out facets or facet content. */
@Component({
    selector: 'fd-facet-container',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[style.gap.rem]': 'flexGap()',
        '[style.flex-direction]': 'flexDirection()',
        '[style.align-items]': 'alignItems()',
        '[style.justify-content]': 'justifyContent()',
        class: 'flex'
    }
})
export class FacetContainer {
    readonly flexDirection = input<'row' | 'row-reverse' | 'column' | 'column-reverse'>('column');
    readonly alignItems = input('start');
    readonly justifyContent = input('start');
    /** Gap in rem. */
    readonly flexGap = input(1);
}
