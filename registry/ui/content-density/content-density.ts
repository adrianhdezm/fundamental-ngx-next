/*
 * Port of @fundamental-ngx/core (content-density) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Directive, booleanAttribute, computed, input } from '@angular/core';

export type ContentDensity = 'cozy' | 'compact' | 'condensed';

/**
 * Sets the content density for an element and everything inside it.
 *
 * Components read density from the closest `data-density` attribute through the Tailwind
 * `compact:` and `condensed:` variants, so density is pure CSS and needs no injection.
 *
 * ```html
 * <section fdContentDensity="compact">...</section>
 * <button fdButton fdCompact>Save</button>
 * ```
 */
@Directive({
    selector: '[fdContentDensity], [fdCompact], [fdCozy], [fdCondensed]',
    host: { '[attr.data-density]': 'density()' }
})
export class ContentDensityDirective {
    /** Explicit density. */
    readonly fdContentDensity = input<ContentDensity | '' | null | undefined>();
    /** Shorthand for compact density. */
    readonly fdCompact = input(false, { transform: booleanAttribute });
    /** Shorthand for cozy density (resets an inherited compact density). */
    readonly fdCozy = input(false, { transform: booleanAttribute });
    /** Shorthand for condensed density (tables and lists). */
    readonly fdCondensed = input(false, { transform: booleanAttribute });

    readonly density = computed<ContentDensity | null>(() => {
        const explicit = this.fdContentDensity();
        if (explicit) return explicit;
        if (this.fdCompact()) return 'compact';
        if (this.fdCondensed()) return 'condensed';
        if (this.fdCozy()) return 'cozy';
        return null;
    });
}
