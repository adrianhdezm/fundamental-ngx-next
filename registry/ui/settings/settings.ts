/*
 * Port of @fundamental-ngx/core (settings) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Directionality } from '@angular/cdk/bidi';
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    Injector,
    TemplateRef,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChildren,
    forwardRef,
    inject,
    input,
    signal
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Bar, BarElement, BarLeft } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import type { DialogConfig } from '@/ui/dialog/dialog';
import { ListItem } from '@/ui/list/list';
import { Title, type HeaderSize } from '@/ui/title/title';

export type SettingsViewMode = 'lg' | 'md' | 'sm';
export type SettingsSpacingSize = 'small' | 'medium' | 'large' | 'form' | undefined;

/** A view pushed on top of the detail area, e.g. the details of a setting. */
export interface SettingsStackedView {
    template: TemplateRef<unknown>;
    title: string;
}

/**
 * Classes of a settings dialog window: 60rem by 42.5rem on large screens, narrower on medium ones,
 * and full screen on small ones, following the view mode of the settings container inside.
 */
export const SETTINGS_DIALOG_CLASS = [
    'w-[60rem] h-[42.5rem] max-w-[60rem] max-h-[42.5rem]',
    'has-[[data-settings-view=md]]:w-[80%] has-[[data-settings-view=md]]:max-w-[40rem] has-[[data-settings-view=md]]:h-[88%]',
    'has-[[data-settings-view=sm]]:w-full has-[[data-settings-view=sm]]:max-w-full has-[[data-settings-view=sm]]:h-full has-[[data-settings-view=sm]]:max-h-full',
    'has-[[data-settings-view=sm]]:rounded-none has-[[data-settings-view=sm]]:shadow-none'
].join(' ');

/** Dialog options for settings: no body paddings and the settings window size. */
export function settingsDialogConfig<T>(config: DialogConfig<T> = {}): DialogConfig<T> {
    return {
        ...config,
        disablePaddings: true,
        dialogPanelClass: cn(SETTINGS_DIALOG_CLASS, config.dialogPanelClass)
    };
}

/** Marks an element as the root of settings. */
@Directive({ selector: '[fd-settings], [fdSettings]', host: { class: 'block' } })
export class Settings {}

/** A list item that opens a settings view: its template shows in the detail area when clicked. */
@Directive({
    selector: '[fd-list-item][settingsListTpl], [fdListItem][settingsListTpl]'
})
export class SettingsListItem {
    readonly settingsListTpl = input<TemplateRef<unknown> | null | undefined>();
    readonly item = inject(ListItem);
    readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    /** Text of the item title. */
    title(): string {
        return this.el.querySelector('[fd-list-title], [fdListTitle]')?.textContent?.trim() ?? '';
    }
}

/** The main list of settings; it scrolls. */
@Directive({
    selector: '[settingsList]',
    host: { class: 'min-h-0 flex-1 overflow-y-auto scrollbar-sap' }
})
export class SettingsList {}

/** A list at the bottom of the list area, e.g. Reset Settings. */
@Directive({
    selector: '[settingsListFooter]',
    host: { class: 'shrink-0 border-0 border-t border-solid border-sap-list-border-color' }
})
export class SettingsListFooter {}

/** The column of the list of settings, with a header bar. */
@Directive({
    selector: '[fd-settings-list-area], [fdSettingsListArea]',
    host: { '[class]': 'computedClass()' }
})
export class SettingsListArea {
    private readonly container = inject(
        forwardRef(() => SettingsContainer),
        { optional: true }
    );
    protected readonly computedClass = computed(() => {
        const mode = this.container?.viewMode() ?? 'lg';
        return cn(
            'm-0 box-border flex h-full shrink-0 flex-col p-0 font-sap-font-family',
            mode === 'lg'
                ? 'w-80 min-w-80 max-w-80 border-0 border-e border-solid border-sap-list-border-color [&_[fd-list-link]]:after:hidden'
                : 'w-full min-w-full max-w-full'
        );
    });
}

/** The lists of the list area: the main list and an optional footer list. */
@Directive({
    selector: '[fd-settings-list-container], [fdSettingsListContainer]',
    host: { class: 'relative m-0 box-border flex h-full min-h-0 flex-col justify-between overflow-hidden p-0' }
})
export class SettingsListContainer {}

/** The column that shows the selected setting. */
@Directive({
    selector: '[fd-settings-detail-area], [fdSettingsDetailArea]',
    host: { class: 'm-0 box-border flex h-full w-full max-w-full flex-col overflow-hidden p-0' }
})
export class SettingsDetailArea {}

/** The header bar of the detail area. */
@Directive({ selector: '[fd-settings-header], [fdSettingsHeader]', host: { class: 'shrink-0' } })
export class SettingsHeader {}

/** The back button of the detail area header. */
@Directive({ selector: '[fd-settings-header-button], [fdSettingsHeaderButton]' })
export class SettingsHeaderButton {}

/** Content of a settings view: scrolls, with paddings unless `noPadding`. */
@Directive({
    selector: '[fd-settings-content], [fdSettingsContent]',
    host: { '[class]': 'computedClass()' }
})
export class SettingsContent {
    readonly noPadding = input(false, { transform: booleanAttribute });
    readonly noBackground = input(false, { transform: booleanAttribute });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border block h-full w-full overflow-y-auto font-sap-font-family text-sap-font-size text-sap-text-color scrollbar-sap',
            this.noPadding() ? 'p-0' : 'p-4',
            this.noBackground() && 'bg-transparent'
        )
    );
}

/** The main part of a settings view, below a profile card. */
@Directive({
    selector: '[fd-settings-content-container], [fdSettingsContentContainer]',
    host: { class: 'm-0 box-border block flex-1 p-0' }
})
export class SettingsContentContainer {}

/** Vertical space between settings: 0.5rem by default, `form` between form items. */
@Directive({
    selector: '[fd-settings-spacing], [fdSettingsSpacing]',
    host: { role: 'presentation', 'aria-hidden': 'true', '[class]': 'computedClass()' }
})
export class SettingsSpacing {
    readonly size = input<SettingsSpacingSize>();
    protected readonly computedClass = computed(() => {
        const size = this.size();
        return cn(
            'm-0 box-border block w-full p-0',
            size === 'form'
                ? 'h-2.5'
                : size === 'small'
                  ? 'h-4'
                  : size === 'medium'
                    ? 'h-8'
                    : size === 'large'
                      ? 'h-12'
                      : 'h-2'
        );
    });
}

/** The user's avatar, name and details at the top of the user account view. */
@Directive({
    selector: '[fd-settings-profile-card], [fdSettingsProfileCard]',
    host: {
        class: 'm-0 box-border flex w-full max-w-full flex-col items-center gap-1 overflow-hidden px-0 pt-10 pb-4 font-sap-font-family [&_button]:mt-1'
    }
})
export class SettingsProfileCard {}

@Directive({
    selector: '[fd-settings-profile-card-name], [fdSettingsProfileCardName]',
    host: {
        class: 'm-0 mt-1 box-border p-0 font-sap-font-semibold-duplex-family text-sap-font-large-size leading-[1.4rem] break-all whitespace-normal text-sap-text-color'
    }
})
export class SettingsProfileCardName {}

@Directive({
    selector: '[fd-settings-profile-card-subline], [fdSettingsProfileCardSubline]',
    host: { class: 'm-0 box-border p-0 font-sap-font-family text-sap-font-size break-all text-sap-content-label-color' }
})
export class SettingsProfileCardSubline {}

/** Markers kept for compatibility: a settings dialog sizes itself through `settingsDialogConfig`. */
@Directive({ selector: '[fd-settings-dialog-body], [fdSettingsDialogBody]', host: { class: 'flex p-0' } })
export class SettingsDialogBody {}

@Directive({ selector: '[fd-settings-dialog-content], [fdSettingsDialogContent]' })
export class SettingsDialogContent {}

/**
 * Settings: a list of settings and the view of the selected one, side by side on large screens.
 * On medium and small screens the list and the view replace each other, with a back button.
 * Views can push further views (`pushView`), e.g. the details of a notification setting.
 *
 * ```html
 * <fd-settings-container #settings backBtnAriaLabel="Back">
 *     <div fd-settings-list-area>
 *         <div fd-bar barDesign="header">...</div>
 *         <div fd-settings-list-container>
 *             <ul fd-list noBorder settingsList>
 *                 <li fd-list-item [settingsListTpl]="account" selected>
 *                     <a fd-list-link navigationIndicator><span fd-list-title>User Account</span></a>
 *                 </li>
 *             </ul>
 *         </div>
 *     </div>
 * </fd-settings-container>
 * <ng-template #account><div fd-settings-content>...</div></ng-template>
 * ```
 */
@Component({
    selector: 'fd-settings-container',
    exportAs: 'fdSettingsContainer',
    imports: [
        NgTemplateOutlet,
        Bar,
        BarLeft,
        BarElement,
        Button,
        Title,
        SettingsDetailArea,
        SettingsHeader,
        SettingsHeaderButton
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.data-settings-view]': 'viewMode()',
        class: 'm-0 box-border flex h-full w-full p-0 font-sap-font-family'
    },
    template: `
        @if (showListArea()) {
            <ng-content select="[fd-settings-list-area], [fdSettingsListArea]" />
        }
        @if (showDetailArea()) {
            <div fd-settings-detail-area>
                <div fd-bar barDesign="header" fd-settings-header>
                    <div fd-bar-left>
                        @if (viewMode() !== 'lg' || hasStackedView()) {
                            <fd-bar-element>
                                <button
                                    fdButton
                                    fd-settings-header-button
                                    variant="transparent"
                                    [glyph]="rtl() ? 'navigation-right-arrow' : 'navigation-left-arrow'"
                                    [ariaLabel]="backBtnAriaLabel()"
                                    [attr.title]="backBtnAriaLabel()"
                                    (click)="onHeaderBackClick()"
                                ></button>
                            </fd-bar-element>
                        }
                        <fd-bar-element>
                            <div
                                fd-title
                                role="heading"
                                [attr.aria-level]="detailsAreaTitleHeading()"
                                [headerSize]="detailsAreaTitleHeadingSize()"
                            >
                                {{ currentTitle() }}
                            </div>
                        </fd-bar-element>
                    </div>
                </div>
                <div class="min-h-0 flex-1">
                    @if (currentTemplate(); as tpl) {
                        <ng-container [ngTemplateOutlet]="tpl" />
                    }
                </div>
            </div>
        }
    `
})
export class SettingsContainer {
    /** Heading level of the detail area title. */
    readonly detailsAreaTitleHeading = input<1 | 2 | 3 | 4 | 5 | 6>(2);
    readonly detailsAreaTitleHeadingSize = input<HeaderSize>(5);
    readonly backBtnAriaLabel = input('Navigate Back');

    private readonly items = contentChildren(SettingsListItem, { descendants: true });
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly direction = inject(Directionality, { optional: true });
    private readonly injector = inject(Injector);
    private readonly width = signal(typeof window === 'undefined' ? 1280 : window.innerWidth);
    private readonly viewStack = signal<SettingsStackedView[]>([]);
    /** On medium and small screens: whether the detail view replaces the list. */
    private readonly detailOpen = signal(false);
    readonly activeItem = signal<SettingsListItem | null>(null);

    readonly rtl = computed(() => this.direction?.valueSignal() === 'rtl');
    /** lg from 1024px, md from 600px, sm below (window width). */
    readonly viewMode = computed<SettingsViewMode>(() => {
        const width = this.width();
        return width < 600 ? 'sm' : width < 1024 ? 'md' : 'lg';
    });
    readonly showListArea = computed(() => this.viewMode() === 'lg' || !this.detailOpen());
    readonly showDetailArea = computed(() => this.viewMode() === 'lg' || this.detailOpen());
    readonly hasStackedView = computed(() => this.viewStack().length > 0);
    readonly currentTitle = computed(() => this.viewStack().at(-1)?.title ?? this.activeItem()?.title() ?? '');
    protected readonly currentTemplate = computed(
        () => this.viewStack().at(-1)?.template ?? this.activeItem()?.settingsListTpl() ?? null
    );

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const resize = () => this.width.set(window.innerWidth);
            window.addEventListener('resize', resize);
            destroyRef.onDestroy(() => window.removeEventListener('resize', resize));
            // the selected item opens first
            const items = this.items();
            const selected = items.find((i) => i.item.isSelected()) ?? null;
            if (selected) this.activeItem.set(selected);
            // in a dialog, the selected item (or the first) takes the focus once the dialog has placed it
            if (this.el.closest('[role=dialog]') && this.showListArea())
                setTimeout(() => (selected ?? items[0])?.item.element.focus());

            this.el.addEventListener('click', (event) => this.onClick(event));
        });
    }

    /** Shows a further view in the detail area, with a back button. */
    pushView(template: TemplateRef<unknown>, title: string): void {
        this.viewStack.update((stack) => [...stack, { template, title }]);
        this.focusBackButton();
    }

    /** Back to the previous view. */
    popView(): void {
        this.viewStack.update((stack) => stack.slice(0, -1));
    }

    clearViewStack(): void {
        this.viewStack.set([]);
    }

    /** Opens the view of a list item. */
    select(item: SettingsListItem): void {
        this.items().forEach((i) => i.item.setSelected(i === item));
        this.activeItem.set(item);
        this.clearViewStack();
        if (this.viewMode() !== 'lg') {
            this.detailOpen.set(true);
            this.focusBackButton();
        }
    }

    protected onHeaderBackClick(): void {
        if (this.hasStackedView()) {
            this.popView();
            return;
        }
        if (this.viewMode() !== 'lg') {
            this.detailOpen.set(false);
            const item = this.activeItem();
            afterNextRender(() => (item ?? this.items()[0])?.item.element.focus(), { injector: this.injector });
        }
    }

    private onClick(event: MouseEvent): void {
        const target = event.target as Element;
        const item = this.items().find((i) => i.el.contains(target));
        if (item) this.select(item);
    }

    private focusBackButton(): void {
        afterNextRender(() => this.el.querySelector<HTMLElement>('button[fd-settings-header-button]')?.focus(), {
            injector: this.injector
        });
    }
}
