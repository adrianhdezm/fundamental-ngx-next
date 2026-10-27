/*
 * Port of @fundamental-ngx/core (wizard) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { InteractivityChecker } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    Injector,
    type Signal,
    TemplateRef,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    effect,
    inject,
    input,
    model,
    output,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { ActionSheet, ActionSheetBody, ActionSheetControl, ActionSheetItem } from '@/ui/action-sheet/action-sheet';
import { Icon, type IconFont } from '@/ui/icon/icon';

export type WizardStepStatus = 'completed' | 'current' | 'upcoming' | 'active';
export type WizardSize = 'sm' | 'md' | 'lg' | 'xl';
export type WizardContentBackground = 'solid' | 'list' | 'transparent';

/** Narrower steps stack their labels. */
export const STEP_MIN_WIDTH = 168;
/** Width of a stacked step that shows its connector. */
const STACKED_TOP_WIDTH = 64;
/** Width of a stacked step, and the extra room after the last one. */
const STACKED_WIDTH = 4;
const STACKED_LAST_OFFSET = 38;

/** Late references for the parts declared before the wizard. */
function forwardWizard(): typeof Wizard {
    return Wizard;
}
function forwardStep(): typeof WizardStep {
    return WizardStep;
}

/** Horizontal paddings per size, shared by the progress bar, the content and the next step. */
const SIZE_PADDING: Record<WizardSize, string> = {
    sm: 'px-4',
    md: 'px-8',
    lg: 'px-8',
    xl: 'px-12'
};

/** The bar of steps, a `ul` inside `fd-wizard-navigation`. */
@Directive({
    selector: '[fd-wizard-progress-bar]',
    host: {
        role: 'list',
        'data-wizard-pad': '',
        '[class]': 'computedClass()',
        '[style.display]': 'visible() ? null : "none"'
    }
})
export class WizardProgressBar {
    readonly size = input<WizardSize | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    /** Hidden while the summary shows. */
    readonly visible = signal(true);

    protected readonly computedClass = computed(() =>
        cn(
            'relative z-10 m-0 box-border table h-16 w-full table-fixed list-none p-0 pt-4',
            'bg-sap-object-header-background font-sap-font-family text-sap-font-size text-sap-text-color shadow-sap-content-header-shadow',
            SIZE_PADDING[this.size() as WizardSize],
            this.userClass()
        )
    );
}

/** The navigation landmark around the progress bar. */
@Component({
    selector: 'fd-wizard-navigation',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    template: `<nav class="m-0 p-0" [attr.aria-label]="ariaLabel() || wizard?.ariaLabel() || null"><ng-content /></nav>`
})
export class WizardNavigation {
    readonly ariaLabel = input<string | null | undefined>();
    protected readonly wizard = inject(forwardWizard(), { optional: true });
}

/** The button to the next step at the end of a step's content; hidden once the step is completed. */
@Component({
    selector: 'fd-wizard-next-step',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[style.display]': 'hidden() ? "none" : null', class: 'block' },
    template: `<div [class]="computedClass()"><ng-content /></div>`
})
export class WizardNextStep {
    /** Floats the button at the bottom of the wizard. */
    readonly floating = input(false, { transform: booleanAttribute });
    /** Hides the button once its step is completed (except on the last step). */
    readonly canHide = input(true, { transform: booleanAttribute });

    private readonly step = inject(forwardStep(), { optional: true });
    private readonly wizard = inject(forwardWizard(), { optional: true });

    protected readonly hidden = computed(() => {
        const step = this.step;
        const wizard = this.wizard;
        if (!step || !wizard) return false;
        return (
            this.canHide() &&
            step.isCompleted() &&
            wizard.appendToWizard() &&
            step !== wizard.lastNavStep() &&
            !(step.branching() && step.status() === 'current')
        );
    });

    protected readonly computedClass = computed(() =>
        cn('m-0 mt-4 box-border p-0', this.floating() && 'absolute bottom-14')
    );
}

/**
 * The content of a step. It renders in the wizard's scrolling area below the progress bar, not
 * inside the step.
 */
@Component({
    selector: 'fd-wizard-content',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'hidden' },
    template: `
        <ng-template #contentTemplate>
            <section
                data-wizard-pad
                [attr.id]="contentId()"
                [attr.aria-label]="step?.label() || step?.ariaLabel() || null"
                [class]="computedClass()"
            >
                <div
                    class="m-0 box-border rounded-(--sapElement_BorderCornerRadius) bg-sap-group-content-background p-4 font-sap-font-family text-sap-font-size text-sap-text-color"
                >
                    <ng-content />
                </div>
            </section>
        </ng-template>
    `
})
export class WizardContent {
    readonly contentBackground = input<WizardContentBackground | null | undefined>();
    readonly size = input<WizardSize | null | undefined>();
    readonly contentTemplate = viewChild.required<TemplateRef<unknown>>('contentTemplate');
    readonly nextStep = contentChild(WizardNextStep);

    protected readonly step = inject(forwardStep(), { optional: true });
    private readonly wizard = inject(forwardWizard(), { optional: true });
    protected readonly contentId = computed(() => (this.step ? `${this.step.id()}-content` : null));
    /** The last content shown fills the scrolling area. */
    private readonly tall = computed(() => !!this.step && this.wizard?.shownSteps().at(-1) === this.step);

    protected readonly computedClass = computed(() => {
        const background = this.contentBackground();
        return cn(
            'm-0 box-border block w-full p-0 pt-4',
            background === 'solid'
                ? 'bg-sap-shell-background hc:bg-sap-background-color'
                : background === 'list'
                  ? 'bg-sap-group-content-background hc:bg-sap-background-color'
                  : background === 'transparent'
                    ? 'bg-transparent hc:bg-sap-background-color'
                    : 'bg-sap-background-color',
            SIZE_PADDING[this.size() as WizardSize],
            this.tall() && 'pb-6'
        );
    });
}

/**
 * The round indicator of a step, with an icon or a number. When steps stack on narrow screens, the
 * indicator next to them opens an action sheet that lists them.
 */
@Component({
    selector: 'fd-wizard-step-indicator',
    imports: [NgTemplateOutlet, Icon, ActionSheet, ActionSheetControl, ActionSheetBody, ActionSheetItem],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'contents' },
    template: `
        @if (stackedItems().length > 1) {
            <fd-action-sheet class="pointer-events-auto">
                <fd-action-sheet-control (click)="$event.stopPropagation()">
                    <span role="button" tabindex="0" aria-haspopup="menu" [class]="indicatorClass()">
                        <ng-container [ngTemplateOutlet]="content" />
                        <!-- named by its visible text and the label of the list -->
                        <span class="sr-only-sap">{{ stackedLabel() }}</span>
                    </span>
                </fd-action-sheet-control>
                <fd-action-sheet-body [ariaLabel]="stackedLabel()">
                    @for (step of stackedItems(); track step) {
                        <li
                            fd-action-sheet-item
                            [label]="step.label()"
                            [glyph]="step.glyph()"
                            [glyphFont]="glyphFont()"
                            [disabled]="!step.visited()"
                            (click)="itemClicked(step, $event)"
                        ></li>
                    }
                </fd-action-sheet-body>
            </fd-action-sheet>
        } @else {
            <span [class]="indicatorClass()" (click)="itemClicked(stackedItems()[0], $event)">
                <ng-container [ngTemplateOutlet]="content" />
            </span>
        }
        <ng-template #content>
            @if (glyph(); as glyph) {
                <fd-icon [glyph]="glyph" [font]="glyphFont()" class="text-sap-font-large-size text-(--wz-icon)" />
            }
            <ng-content />
        </ng-template>
    `
})
export class WizardStepIndicator {
    readonly glyph = input<string | null | undefined>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    /** Label of the list of stacked steps. */
    readonly stackedLabel = input('Steps');
    readonly stepIndicatorItemClicked = output<WizardStep>();

    private readonly step = inject(forwardStep(), { optional: true });
    /** The steps stacked behind this indicator. */
    readonly stackedItems = computed(() => this.step?.stackedItems() ?? []);

    protected itemClicked(step: WizardStep | undefined, event: Event): void {
        if (!step?.visited()) return;
        event.preventDefault();
        event.stopPropagation();
        this.stepIndicatorItemClicked.emit(step);
        this.step?.stepIndicatorItemClicked.emit(step);
        step.wizard?.goToStep(step);
    }

    protected readonly indicatorClass = computed(() =>
        cn(
            'relative m-0 ms-[0.1875rem] me-2 box-border flex size-8 min-h-8 min-w-8 shrink-0 items-center justify-center rounded-full border border-solid p-0',
            'border-(--wz-border) bg-(--wz-bg) font-sap-font-family text-sap-font-size text-(--wz-color)',
            // the selection bar under the current step
            this.step?.status() === 'current' &&
                "after:absolute after:-start-[0.1875rem] after:-bottom-4 after:inline-block after:h-[0.188rem] after:w-[calc(100%+0.375rem)] after:rounded-t-[0.125rem] after:bg-sap-selected-color after:transition-all after:duration-150 after:ease-in after:content-[''] hc:after:h-[0.313rem] hc:after:bg-sap-content-selected-foreground-color"
        )
    );
}

let nextStepId = 0;

/** Colours of a step's indicator and label per look. */
const STEP_LOOK = {
    completed:
        '[--wz-bg:var(--sapObjectHeader_Background)] [--wz-border:var(--sapContent_Selected_ForegroundColor)] [--wz-color:var(--sapContent_Selected_ForegroundColor)] [--wz-icon:var(--sapContent_Selected_ForegroundColor)] [--wz-label:var(--sapTextColor)]',
    current:
        '[--wz-bg:var(--sapContent_Selected_ForegroundColor)] hc:[--wz-bg:var(--sapContent_Selected_Background)] [--wz-border:var(--sapContent_Selected_ForegroundColor)] [--wz-color:var(--sapContent_ContrastTextColor)] [--wz-icon:var(--sapContent_ContrastIconColor)] [--wz-label:var(--sapContent_Selected_ForegroundColor)]',
    upcoming:
        '[--wz-bg:var(--sapObjectHeader_Background)] [--wz-border:var(--sapList_BorderColor)] [--wz-color:var(--sapContent_LabelColor)] [--wz-icon:var(--sapContent_LabelColor)] [--wz-label:var(--sapContent_LabelColor)]',
    active: '[--wz-bg:var(--sapActiveColor)] [--wz-border:var(--sapActiveColor)] [--wz-color:var(--sapContent_ContrastTextColor)] [--wz-icon:var(--sapContent_ContrastIconColor)] [--wz-label:var(--sapContent_LabelColor)]'
};

/**
 * A step of the wizard, an `li` of the progress bar: its indicator, label and connector, and its
 * content. Completed and visited steps can be clicked to go back to them.
 */
@Component({
    selector: '[fd-wizard-step]',
    exportAs: 'fdWizardStep',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'listitem',
        '[attr.aria-label]': 'ariaLabel() || null',
        '[attr.data-status]': 'status()',
        '[attr.data-stacked]': 'stacked() || null',
        '[class]': 'computedClass()',
        '[style.display]': 'hiddenSummary() ? "none" : null'
    },
    template: `
        <div class="m-0 box-border flex h-8 items-center p-0">
            @if (label() || optionalText()) {
                <span
                    #container
                    data-wizard-step-container
                    [attr.role]="listsStacked() ? null : 'button'"
                    [attr.tabindex]="listsStacked() ? null : tabbable() ? 0 : -1"
                    [attr.aria-current]="status() === 'current' ? 'step' : null"
                    [attr.aria-disabled]="reachable() || listsStacked() ? null : true"
                    [attr.aria-roledescription]="listsStacked() ? null : ariaRoleDescription()"
                    [class]="containerClass()"
                    (click)="activate()"
                    (keydown.enter)="$event.preventDefault(); activate()"
                    (keydown.space)="$event.preventDefault(); activate()"
                >
                    <ng-content select="fd-wizard-step-indicator" />
                    <span [class]="labelContainerClass()">
                        <span [class]="labelClass()">{{ label() }}</span>
                        @if (optionalText()) {
                            <span
                                class="m-0 line-clamp-1 max-w-full p-0 text-sap-font-small-size text-sap-content-label-color"
                            >
                                {{ optionalText() }}
                            </span>
                        }
                    </span>
                </span>
            }
            <ng-content />
            @if (showConnector()) {
                <span [class]="connectorClass()"></span>
            }
        </div>
    `
})
export class WizardStep {
    readonly id = input(`fd-wizard-step-${nextStepId++}`);
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaRoleDescription = input<string | null | undefined>();
    /** Status of the step; the wizard updates it when steps are clicked or the content scrolls. */
    readonly status = model<WizardStepStatus>('upcoming');
    /** The steps after this one depend on its input (a dashed connector). */
    readonly branching = input(false, { transform: booleanAttribute });
    readonly label = input('');
    readonly optionalText = input('');
    /** The summary at the end: it replaces the steps until `displaySummaryStep` is set. */
    readonly isSummary = input(false, { transform: booleanAttribute });
    /** Decides whether a click on the step navigates to it. */
    readonly stepClickValidator = input<(visited: boolean, completed: boolean) => boolean | Promise<boolean>>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly stepClicked = output<WizardStep>();
    readonly stepIndicatorItemClicked = output<WizardStep>();

    readonly content = contentChild(WizardContent);
    readonly indicator = contentChild(WizardStepIndicator);
    readonly wizard = inject(forwardWizard(), { optional: true });
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly container = viewChild<ElementRef<HTMLElement>>('container');

    /** The step was current once. */
    readonly visited = signal(false);
    /** The step was completed after being current. */
    private readonly completedAfterCurrent = signal(false);
    private readonly self = this as WizardStep;
    readonly isCompleted = computed(() => this.status() === 'completed' || this.completedAfterCurrent());
    readonly glyph = computed(() => this.indicator()?.glyph() ?? null);
    /** The steps listed by this step's indicator. */
    readonly stackedItems: Signal<WizardStep[]> = computed(() => this.wizard?.stackedItemsOf(this.self) ?? []);
    /** The indicator lists stacked steps in an action sheet, so the step itself is no button. */
    protected readonly listsStacked = computed(() => this.stackedItems().length > 1);
    protected readonly hiddenSummary = computed(() => this.isSummary() && !this.wizard?.displaySummaryStep());
    protected readonly reachable = computed(() => this.visited() || this.status() === 'current');
    protected readonly tabbable = computed(() => this.wizard?.tabbableStep() === this.self);

    private readonly stacked = computed(() => this.wizard?.stacked().has(this.self) ?? false);
    private readonly stackedTop = computed(() => this.wizard?.stackedTop() === this.self);
    private readonly last = computed(() => this.wizard?.lastNavStep() === this.self);
    protected readonly showConnector = computed(() => !this.last() || this.branching());

    constructor() {
        let previous: WizardStepStatus | undefined;
        effect(() => {
            const status = this.status();
            untracked(() => {
                if (status === 'current' || status === 'completed') this.visited.set(true);
                if (previous === 'current' && status === 'completed') this.completedAfterCurrent.set(true);
                previous = status;
            });
        });
    }

    /** Navigates to the step if it was visited and the validator allows it. */
    async activate(): Promise<void> {
        if (!this.visited() || this.stackedItems().length) return;
        const validator = this.stepClickValidator();
        if (validator && (await validator(this.visited(), this.isCompleted())) !== true) return;
        this.stepClicked.emit(this);
        this.wizard?.goToStep(this);
    }

    /** Marks the step completed, e.g. when the summary shows. */
    markCompleted(): void {
        this.completedAfterCurrent.set(true);
    }

    focus(): void {
        this.container()?.nativeElement.focus();
    }

    /** The element that takes the focus in the progress bar. */
    focusElement(): HTMLElement | null {
        return this.container()?.nativeElement ?? null;
    }

    protected readonly computedClass = computed(() => {
        const status = this.status();
        const look = this.isCompleted() && status !== 'current' && status !== 'active' ? 'completed' : status;
        const stacked = this.stacked();
        return cn(
            'relative m-0 box-content table-cell w-full min-w-[10.5rem] p-0 align-top font-sap-font-family text-sap-font-size',
            STEP_LOOK[look] ?? STEP_LOOK.upcoming,
            stacked && 'w-1 min-w-0 last:pe-[2.375rem]',
            stacked && status === 'upcoming' && 'z-(--wz-z)',
            stacked && this.stackedTop() && 'w-16 min-w-16',
            this.userClass()
        );
    });

    protected readonly containerClass = computed(() =>
        cn(
            'm-0 box-border flex min-w-0 cursor-pointer items-center p-0 outline-none focus:outline-sap',
            !this.reachable() && 'pointer-events-none cursor-default'
        )
    );

    protected readonly labelContainerClass = computed(() =>
        cn(
            'm-0 box-border flex max-h-8 max-w-full min-w-0 flex-col overflow-hidden p-0 text-sap-content-label-color',
            this.stacked() && 'hidden'
        )
    );

    protected readonly labelClass = computed(() =>
        cn(
            'm-0 max-w-full p-0 font-sap-font-bold-family leading-4 font-bold text-(--wz-label) hc:font-sap-font-family hc:font-normal',
            this.optionalText() ? 'line-clamp-1 max-h-4' : 'line-clamp-2'
        )
    );

    protected readonly connectorClass = computed(() =>
        cn(
            'm-2 box-border max-w-full min-w-4 flex-auto border-0 border-b border-solid border-sap-list-border-color p-0',
            this.isCompleted() && 'border-sap-content-selected-foreground-color',
            this.branching() && 'border-dashed',
            this.stacked() && !this.stackedTop() && 'hidden'
        )
    );
}

/**
 * Wizard: breaks a long task into steps. The progress bar on top shows the steps; the content of
 * the visited steps shows one below the other (or only the current one with
 * `appendToWizard=false`), and scrolling the content updates the current step. On narrow screens
 * steps stack, and the indicator next to them lists them in an action sheet.
 *
 * ```html
 * <fd-wizard>
 *     <fd-wizard-navigation>
 *         <ul fd-wizard-progress-bar size="lg" aria-label="Steps">
 *             <li fd-wizard-step [(status)]="step1" label="Product type">
 *                 <fd-wizard-step-indicator glyph="product" />
 *                 <fd-wizard-content size="lg">...</fd-wizard-content>
 *             </li>
 *         </ul>
 *     </fd-wizard-navigation>
 * </fd-wizard>
 * ```
 */
@Component({
    selector: 'fd-wizard',
    exportAs: 'fdWizard',
    imports: [NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: 'region',
        '[attr.aria-label]': 'ariaLabel()',
        '[class]': 'computedClass()',
        '(keydown)': 'onKeydown($event)'
    },
    template: `
        <section class="relative m-0 box-border flex h-full flex-col p-0">
            <ng-content select="fd-wizard-navigation" />
            <div
                #wrapper
                data-wizard-scroll
                class="relative min-h-0 overflow-auto scrollbar-sap"
                [style.height]="height()"
                (scroll)="onScroll()"
            >
                @for (step of shownSteps(); track step; let last = $last) {
                    <!-- the last content fills the scrolling area, so scrolling can reach it -->
                    <div [class]="last ? 'flex min-h-full flex-col [&>section]:flex-1' : null">
                        <ng-container [ngTemplateOutlet]="step.content()!.contentTemplate()" />
                    </div>
                }
            </div>
            <ng-content />
        </section>
    `
})
export class Wizard {
    /** Shows the content of all visited steps one below the other; otherwise only the current step's. */
    readonly appendToWizard = input(true, { transform: booleanAttribute });
    /** Height of the scrolling content; by default it fills the viewport below its top. */
    readonly contentHeight = input<string | null | undefined>();
    /** Paddings of the progress bar and content follow the viewport width. */
    readonly responsivePaddings = input(false, { transform: booleanAttribute });
    /** Shows the summary as a step of the progress bar. */
    readonly displaySummaryStep = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input('Wizard');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly steps = contentChildren(WizardStep, { descendants: true });
    readonly progressBar = contentChild(WizardProgressBar, { descendants: true });
    private readonly wrapper = viewChild.required<ElementRef<HTMLElement>>('wrapper');
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly injector = inject(Injector);
    private readonly interactivity = inject(InteractivityChecker);

    /** Steps in the progress bar: all but a hidden summary. */
    readonly navSteps: Signal<WizardStep[]> = computed(() =>
        this.steps().filter((step) => !step.isSummary() || this.displaySummaryStep())
    );
    readonly lastNavStep: Signal<WizardStep | null> = computed(() => this.navSteps().at(-1) ?? null);
    readonly currentStep: Signal<WizardStep | null> = computed(
        () => this.steps().find((step) => step.status() === 'current' || step.status() === 'active') ?? null
    );
    /** The summary replaces the steps. */
    private readonly showingSummary: Signal<boolean> = computed(() => {
        const current = this.currentStep();
        return !!current?.isSummary() && !this.displaySummaryStep();
    });
    /** The steps whose content shows. */
    readonly shownSteps: Signal<WizardStep[]> = computed(() => {
        const steps = this.steps().filter((step) => step.content());
        if (this.showingSummary()) return steps.filter((step) => step === this.currentStep());
        if (!this.appendToWizard()) return steps.filter((step) => step === this.currentStep());
        return steps.filter(
            (step) =>
                (step.visited() || step.status() === 'current' || step.status() === 'completed') &&
                (!step.isSummary() || this.displaySummaryStep())
        );
    });
    /** The step in the tab order of the progress bar. */
    readonly tabbableStep: Signal<WizardStep | null> = computed(() => {
        const current = this.currentStep();
        return current && this.navSteps().includes(current) ? current : (this.navSteps()[0] ?? null);
    });

    /** Steps stacked on narrow screens, the step before the current one, and the stacked steps on each side. */
    readonly stacked = signal<ReadonlySet<WizardStep>>(new Set());
    readonly stackedTop = signal<WizardStep | null>(null);
    private readonly stackedLeft = signal<WizardStep[]>([]);
    private readonly stackedRight = signal<WizardStep[]>([]);
    private readonly barWidth = signal(0);
    protected readonly height = signal<string | null>(null);
    /** Scrolling started by the wizard does not change the current step. */
    private programmaticScroll = false;
    private scrollTimer: ReturnType<typeof setTimeout> | undefined;
    /** The current step the focus was last moved for; the first one does not move it. */
    private focusedFor: WizardStep | null | undefined = undefined;
    private changedByScroll = false;

    constructor() {
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const observer = new ResizeObserver(() => this.onResize());
            observer.observe(this.host);
            const bar = this.progressBar()?.element;
            if (bar) observer.observe(bar);
            window.addEventListener('resize', this.onWindowResize);
            destroyRef.onDestroy(() => {
                observer.disconnect();
                window.removeEventListener('resize', this.onWindowResize);
                clearTimeout(this.scrollTimer);
            });
            this.onResize();
        });
        // the summary hides the progress bar and completes the steps
        effect(() => {
            const summary = this.showingSummary();
            untracked(() => {
                this.progressBar()?.visible.set(!summary);
                if (summary) for (const step of this.steps()) if (!step.isSummary()) step.markCompleted();
            });
        });
        // a new current step: stack the steps again, scroll to its content and focus it
        effect(() => {
            const current = this.currentStep();
            this.shownSteps();
            untracked(() => {
                this.layoutSteps();
                const fromScroll = this.changedByScroll;
                this.changedByScroll = false;
                afterNextRender(
                    () => {
                        this.updateHeight();
                        // a step that became current by scrolling is already in view
                        if (fromScroll) this.focusedFor = current;
                        else if (current) this.scrollToStep(current);
                    },
                    { injector: this.injector }
                );
            });
        });
        effect(() => {
            this.barWidth();
            this.navSteps();
            untracked(() => this.layoutSteps());
        });
    }

    /** Makes the step current: the steps before it are completed, the ones after upcoming. */
    goToStep(target: WizardStep): void {
        const steps = this.steps();
        const index = steps.indexOf(target);
        if (index < 0) return;
        steps.forEach((step, i) => step.status.set(i === index ? 'current' : i < index ? 'completed' : 'upcoming'));
    }

    /** The steps listed by a step's indicator. */
    stackedItemsOf(step: WizardStep): WizardStep[] {
        if (step === this.lastNavStep()) return this.stackedRight();
        if (step === this.stackedTop()) return this.stackedLeft();
        return [];
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        const steps = this.navSteps();
        const index = steps.findIndex((step) => step.focusElement() === document.activeElement);
        if (index < 0) return;
        event.preventDefault();
        const rtl = getComputedStyle(this.host).direction === 'rtl';
        const forward = (event.key === 'ArrowRight') !== rtl;
        // only completed (or current) steps lead on
        const next = forward
            ? steps[index].isCompleted()
                ? steps[index + 1]
                : undefined
            : steps[index - 1]?.status() === 'completed' || steps[index - 1]?.status() === 'current'
              ? steps[index - 1]
              : undefined;
        next?.focus();
    }

    protected onScroll(): void {
        if (this.programmaticScroll) {
            clearTimeout(this.scrollTimer);
            this.scrollTimer = setTimeout(() => (this.programmaticScroll = false), 150);
            return;
        }
        if (!this.appendToWizard() || this.showingSummary()) return;
        // the step whose content reached the top becomes current
        const wrapper = this.wrapper().nativeElement;
        const children = Array.from(wrapper.children) as HTMLElement[];
        const shown = this.shownSteps();
        let spied = 0;
        children.forEach((child, index) => {
            if (child.offsetTop - children[0].offsetTop <= wrapper.scrollTop) spied = index;
        });
        const step = shown[spied];
        if (step && step !== this.currentStep()) {
            this.changedByScroll = true;
            const steps = this.steps();
            const index = steps.indexOf(step);
            steps.forEach((s, i) => s.status.set(i === index ? 'current' : i < index ? 'completed' : 'upcoming'));
        }
    }

    private readonly onWindowResize = (): void => this.updateHeight();

    private onResize(): void {
        const bar = this.progressBar()?.element;
        if (bar) {
            const style = getComputedStyle(bar);
            this.barWidth.set(
                bar.clientWidth - parseFloat(style.paddingInlineStart) - parseFloat(style.paddingInlineEnd)
            );
        }
        this.updateHeight();
    }

    /** Fills the viewport below the content, unless a height is set. */
    private updateHeight(): void {
        const height = this.contentHeight();
        if (height) {
            this.height.set(height);
            return;
        }
        const wrapper = this.wrapper().nativeElement;
        const section = wrapper.parentElement!;
        const below = section.getBoundingClientRect().bottom - wrapper.getBoundingClientRect().bottom;
        const top = wrapper.getBoundingClientRect().top + window.scrollY;
        this.height.set(`calc(100svh - ${Math.max(0, top + below)}px)`);
    }

    private scrollToStep(step: WizardStep): void {
        const index = this.shownSteps().indexOf(step);
        const wrapper = this.wrapper().nativeElement;
        const child = wrapper.children[index] as HTMLElement | undefined;
        if (!child) return;
        if (this.appendToWizard()) {
            const top = child.offsetTop - (wrapper.children[0] as HTMLElement).offsetTop;
            if (Math.abs(wrapper.scrollTop - top) > 1) {
                this.programmaticScroll = true;
                wrapper.scrollTo({ top, behavior: 'smooth' });
            }
        }
        // focus the first control of a new current step (not on the first rendering)
        if (this.focusedFor !== undefined && this.focusedFor !== step) {
            this.firstTabbable(child)?.focus({ preventScroll: true });
        }
        this.focusedFor = step;
    }

    private firstTabbable(root: HTMLElement): HTMLElement | null {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const element = node as HTMLElement;
            if (this.interactivity.isFocusable(element) && this.interactivity.isTabbable(element)) return element;
        }
        return null;
    }

    /** Stacks steps until every labelled step is at least STEP_MIN_WIDTH wide. */
    private layoutSteps(): void {
        const steps = this.navSteps();
        const width = this.barWidth();
        const current = this.currentStep();
        const hidden = new Set<WizardStep>();
        const left: WizardStep[] = [];
        const right: WizardStep[] = [];
        const tooNarrow = (): boolean => {
            const labelled = steps.length - hidden.size;
            if (!labelled || !width) return false;
            const top = this.stepBefore(current, steps);
            let fixed = 0;
            for (const step of hidden) fixed += step === top ? STACKED_TOP_WIDTH : STACKED_WIDTH;
            const last = steps.at(-1);
            if (last && hidden.has(last) && last !== top) fixed += STACKED_LAST_OFFSET;
            return (width - fixed) / labelled < STEP_MIN_WIDTH;
        };
        if (current && steps.includes(current)) {
            for (let i = 0; i < steps.length - 1 && tooNarrow(); i++) {
                const remaining = steps.filter((step) => !hidden.has(step));
                if (remaining.length <= 1) break;
                const index = Math.max(0, remaining.indexOf(current));
                const toHide = index > (remaining.length - 1) / 2 ? remaining[0] : remaining[remaining.length - 1];
                hidden.add(toHide);
                if (remaining.indexOf(toHide) < index) left.push(toHide);
                else right.unshift(toHide);
            }
        }
        const top = hidden.size ? this.stepBefore(current, steps) : null;
        if (top && left.length && !left.includes(top)) left.push(top);
        left.sort((a, b) => steps.indexOf(a) - steps.indexOf(b));
        this.stacked.set(hidden);
        this.stackedTop.set(top);
        this.stackedLeft.set(left);
        this.stackedRight.set(right);
        // stacked upcoming steps overlap: the earlier ones on top
        steps.forEach((step, index) => step.element.style.setProperty('--wz-z', String(Math.max(1, 10 - (index + 1)))));
    }

    private stepBefore(current: WizardStep | null, steps: WizardStep[]): WizardStep | null {
        const index = current ? steps.indexOf(current) : -1;
        return index > 0 ? steps[index - 1] : null;
    }

    protected readonly computedClass = computed(() =>
        cn(
            'relative m-0 box-border block p-0 font-sap-font-family text-sap-font-size text-sap-text-color',
            this.responsivePaddings() &&
                'max-[599px]:[&_[data-wizard-pad]]:px-4 min-[600px]:max-[1439px]:[&_[data-wizard-pad]]:px-8 min-[1440px]:[&_[data-wizard-pad]]:px-12',
            this.userClass()
        )
    );
}
