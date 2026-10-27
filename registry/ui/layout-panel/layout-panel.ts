import { ChangeDetectionStrategy, Component, Directive, booleanAttribute, computed, input } from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';

let nextId = 0;
const BORDER = 'border-solid border-sap-group-title-border-color';

/**
 * Layout panel: a rounded content container with header (title, description, actions),
 * filters, body and footer.
 *
 * ```html
 * <fd-layout-panel>
 *     <fd-layout-panel-header>
 *         <fd-layout-panel-head><h3 fd-layout-panel-title>Sales</h3></fd-layout-panel-head>
 *         <fd-layout-panel-actions><button fdButton label="Edit"></button></fd-layout-panel-actions>
 *     </fd-layout-panel-header>
 *     <fd-layout-panel-body>...</fd-layout-panel-body>
 * </fd-layout-panel>
 * ```
 */
@Component({
    selector: 'fd-layout-panel',
    exportAs: 'fdLayoutPanel',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.id]': 'id()',
        '[style.background-image]': 'backgroundImage() ? "url(\\"" + backgroundImage() + "\\")" : null',
        '[class]': 'computedClass()'
    },
    template: `
        <ng-content select="fd-layout-panel-header" />
        <ng-content select="fd-layout-panel-filters" />
        <ng-content select="fd-layout-panel-body" />
        <ng-content select="fd-layout-panel-footer" />
        <ng-content />
    `
})
export class LayoutPanel {
    readonly id = input(`fd-layout-panel-${nextId++}`);
    readonly backgroundImage = input<string | null | undefined>();
    readonly transparent = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border block overflow-hidden rounded-2xl p-0 font-sap-font-family text-sap-font-size text-sap-text-color',
            'bg-cover bg-center',
            this.transparent() ? 'bg-transparent' : 'bg-sap-group-content-background',
            this.userClass()
        )
    );
}

@Component({
    selector: 'fd-layout-panel-header',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: `m-0 box-border flex min-h-10 items-center justify-between border-b p-4 ${BORDER}` },
    template: `<ng-content select="fd-layout-panel-head" /><ng-content
            select="fd-layout-panel-actions"
        /><ng-content />`
})
export class LayoutPanelHeader {}

@Component({
    selector: 'fd-layout-panel-head',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'm-0 block min-w-0 p-0' }
})
export class LayoutPanelHead {}

/** Title of a layout panel (use on a heading element). */
@Directive({
    selector: '[fd-layout-panel-title], [fdLayoutPanelTitle]',
    host: {
        class: 'm-0 flex-1 p-0 font-sap-font-header-family text-sap-group-title-font-size font-bold text-sap-group-title-text-color'
    }
})
export class LayoutPanelTitle {}

@Component({
    selector: 'fd-layout-panel-description',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<p class="m-0 mt-1 p-0 text-sap-content-label-color"><ng-content /></p>`
})
export class LayoutPanelDescription {}

@Component({
    selector: 'fd-layout-panel-actions',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'm-0 flex items-center gap-2 p-0 text-sap-font-small-size text-sap-neutral-text-color' }
})
export class LayoutPanelActions {}

@Component({
    selector: 'fd-layout-panel-filters',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: `m-0 box-border block border-b px-4 py-2 transition-all duration-150 ease-in ${BORDER}` }
})
export class LayoutPanelFilters {}

@Component({
    selector: 'fd-layout-panel-body',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' }
})
export class LayoutPanelBody {
    /** Content reaches the panel edges (no padding). */
    readonly bleed = input(false, { transform: booleanAttribute });
    protected readonly computedClass = computed(() =>
        cn('m-0 box-border block h-full p-4 [&>:first-child]:mt-0 [&>:last-child]:mb-0', this.bleed() && 'p-0')
    );
}

@Component({
    selector: 'fd-layout-panel-footer',
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'computedClass()' }
})
export class LayoutPanelFooter {
    readonly position = input<'start' | 'end' | null | undefined>();
    protected readonly computedClass = computed(() =>
        cn(
            `m-0 box-border flex items-center justify-center gap-2 border-t px-4 py-2 ${BORDER}`,
            this.position() === 'start' && 'justify-start',
            this.position() === 'end' && 'justify-end'
        )
    );
}
