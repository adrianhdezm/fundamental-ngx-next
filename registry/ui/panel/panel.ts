/*
 * Port of @fundamental-ngx/core (panel) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    booleanAttribute,
    computed,
    contentChild,
    forwardRef,
    inject,
    input,
    model
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';

let nextId = 0;

/**
 * Panel: a container with a title bar whose content can be expanded and collapsed (or always
 * shown with fixed).
 *
 * ```html
 * <fd-panel [(expanded)]="open" expandAriaLabel="Details">
 *     <h4 fd-panel-title>Details</h4>
 *     <div fd-panel-content ariaLabel="Details">...</div>
 * </fd-panel>
 * ```
 */
@Component({
    selector: 'fd-panel',
    exportAs: 'fdPanel',
    imports: [Button],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.id]': 'id()',
        '[class]': 'computedClass()'
    },
    template: `
        <div [class]="headerClass()">
            @if (!fixed()) {
                <div
                    class="m-0 flex h-11 min-h-11 w-11 shrink-0 items-center justify-center p-0 compact:h-10 compact:min-h-10"
                >
                    <button
                        fdButton
                        variant="transparent"
                        class="text-base"
                        [id]="expandId()"
                        [glyph]="expanded() ? 'slim-arrow-down' : 'slim-arrow-right'"
                        [attr.aria-expanded]="expanded()"
                        [attr.aria-controls]="content()?.resolvedId()"
                        [ariaLabel]="expandAriaLabel()"
                        [attr.aria-labelledby]="
                            expandAriaLabelledBy() ? expandAriaLabelledBy() + ' ' + expandId() : null
                        "
                        [attr.title]="expandAriaLabel()"
                        (click)="toggleExpand()"
                    ></button>
                </div>
            }
            <ng-content select="[fd-panel-title], [fdPanelTitle]" />
            <ng-content />
        </div>
        @if (expanded() || fixed()) {
            <ng-content select="[fd-panel-content], [fdPanelContent]" />
        }
    `
})
export class Panel {
    readonly id = input(`fd-panel-${nextId}`);
    readonly expandId = input(`fd-panel-expand-${nextId++}`);
    /** Content always shown, no expand button. */
    readonly fixed = input(false, { transform: booleanAttribute });
    readonly expanded = model(false);
    readonly expandAriaLabel = input<string | null | undefined>();
    readonly expandAriaLabelledBy = input<string | null | undefined>();
    /** Transparent header and content. */
    readonly transparent = input(false, { transform: booleanAttribute });
    readonly noRadius = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    protected readonly content = contentChild(forwardRef(() => PanelContent));

    toggleExpand(): void {
        this.expanded.update((expanded) => !expanded);
    }

    protected readonly computedClass = computed(() =>
        cn('m-0 box-border flex flex-col p-0 not-last:mb-2', this.userClass())
    );

    protected readonly headerClass = computed(() => {
        const open = this.expanded() || this.fixed();
        return cn(
            'relative m-0 box-border flex min-h-11 w-full min-w-full items-center overflow-hidden p-0 pe-2 compact:min-h-10',
            'border-b-(length:--sapGroup_TitleBorderWidth) border-solid border-sap-group-title-border-color bg-sap-group-title-background',
            'rounded-t-sap-element-border-corner-radius has-[fd-toolbar]:pe-0',
            !open && 'rounded-b-sap-element-border-corner-radius',
            this.fixed() && 'ps-3',
            this.transparent() && 'bg-transparent',
            this.noRadius() && 'rounded-none'
        );
    });
}

@Directive({
    selector: '[fd-panel-title], [fdPanelTitle]',
    host: { '[attr.id]': 'id()', '[class]': 'computedClass()' }
})
export class PanelTitle {
    readonly id = input(`fd-panel-title-${nextId++}`);
    readonly wrap = input(true, { transform: booleanAttribute });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 w-full max-w-full flex-1 p-0 ps-1 font-sap-font-header-family text-sap-group-title-font-size font-bold text-sap-group-title-text-color',
            this.wrap() ? 'whitespace-normal break-words' : 'truncate'
        )
    );
}

/** Content of a panel; a region named by ariaLabel or ariaLabelledBy. */
@Directive({
    selector: '[fd-panel-content], [fdPanelContent]',
    host: {
        '[attr.id]': 'resolvedId()',
        '[attr.role]': 'role()',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.aria-labelledby]': 'ariaLabelledBy()',
        '[style.height]': 'height()',
        '[style.min-height]': 'minHeight()',
        '[style.max-height]': 'maxHeight()',
        '[class]': 'computedClass()'
    }
})
export class PanelContent {
    readonly id = input<string | null | undefined>();
    readonly role = input<string | null>('region');
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledBy = input<string | null | undefined>();
    readonly height = input<string | null | undefined>();
    readonly minHeight = input<string | null | undefined>();
    readonly maxHeight = input<string | null | undefined>();
    readonly noPadding = input(false, { transform: booleanAttribute });
    readonly transparent = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly panel = inject(Panel, { optional: true });
    private readonly defaultId = `fd-panel-content-${nextId++}`;
    readonly resolvedId = computed(() => this.id() ?? this.defaultId);

    protected readonly computedClass = computed(() =>
        cn(
            'scrollbar-sap m-0 box-border block overflow-auto px-4 py-[0.625rem] text-sap-text-color',
            'border-b border-solid border-transparent bg-sap-group-content-background rounded-b-sap-element-border-corner-radius',
            this.noPadding() && 'p-0',
            (this.transparent() || this.panel?.transparent()) && 'bg-transparent',
            this.panel?.noRadius() && 'rounded-none',
            this.userClass()
        )
    );
}
