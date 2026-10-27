import { Component, TemplateRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Bar, BarElement, BarRight, ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogService, DialogTemplate } from '@/ui/dialog/dialog';
import { Skeleton } from '@/ui/skeleton/skeleton';
import { FormItem, FormLabel } from '@/ui/form/form';
import { FormControl } from '@/ui/input/input';
import { Link } from '@/ui/link/link';
import { MessageStrip } from '@/ui/message-strip/message-strip';
import { RadioButton } from '@/ui/radio/radio';
import { Title } from '@/ui/title/title';
import {
    Wizard,
    WizardContent,
    WizardNavigation,
    WizardNextStep,
    WizardProgressBar,
    WizardStep,
    WizardStepIndicator,
    type WizardStepStatus
} from './wizard';

const PARTS = [
    Wizard,
    WizardNavigation,
    WizardProgressBar,
    WizardStep,
    WizardStepIndicator,
    WizardContent,
    WizardNextStep,
    Button,
    Title,
    MessageStrip
];

const LOREM =
    'Sed fermentum, mi et tristique ullamcorper, sapien sapien faucibus sem, quis pretium nibh lorem malesuada diam. Nulla quis arcu aliquet, feugiat massa semper, volutpat diam. Nam vitae ante posuere, molestie neque sit amet, dapibus velit. Maecenas eleifend tempor lorem. Mauris vitae elementum mi, sed eleifend ligula. ';

/** Statuses of n steps with the step at index current. */
const statuses = (count: number, current: number): WizardStepStatus[] =>
    Array.from({ length: count }, (_, i) => (i < current ? 'completed' : i === current ? 'current' : 'upcoming'));

@Component({
    selector: 'story-wizard-default',
    imports: [...PARTS, FormsModule, FormItem, FormLabel, FormControl, Link],
    template: `
        <fd-wizard [contentHeight]="height()" [appendToWizard]="append()">
            <fd-wizard-navigation>
                <ul fd-wizard-progress-bar size="lg" aria-label="Wizard steps">
                    <li fd-wizard-step [(status)]="status[0]" label="Product Type" ariaLabel="Step 1: Product Type">
                        <fd-wizard-step-indicator glyph="product" />
                        <fd-wizard-content size="lg">
                            <h3 fdTitle headerSize="4" class="mb-4">1. Product Type</h3>
                            <fd-message-strip type="information" [dismissible]="false" class="mb-4">
                                The wizard breaks a large task into smaller steps that are easier to work with.
                            </fd-message-strip>
                            <p class="m-0">${LOREM.repeat(3)}</p>
                            <fd-wizard-next-step>
                                <button fdButton variant="emphasized" label="Step 2" (click)="go(1)"></button>
                            </fd-wizard-next-step>
                        </fd-wizard-content>
                    </li>
                    <li
                        fd-wizard-step
                        [(status)]="status[1]"
                        label="Customer Information"
                        ariaLabel="Step 2: Customer Information"
                    >
                        <fd-wizard-step-indicator glyph="user-edit" />
                        <fd-wizard-content size="lg">
                            <h3 fdTitle headerSize="4" class="mb-4">2. Customer Information</h3>
                            <fd-message-strip type="information" [dismissible]="false" class="mb-4">
                                The next step stays disabled until the required fields are filled.
                            </fd-message-strip>
                            <div fd-form-item class="mb-2">
                                <label fd-form-label required for="wizard-name">Full name</label>
                                <input fdFormControl id="wizard-name" [(ngModel)]="name" autocomplete="off" />
                            </div>
                            <div fd-form-item>
                                <label fd-form-label required for="wizard-address">Address</label>
                                <input fdFormControl id="wizard-address" [(ngModel)]="address" autocomplete="off" />
                            </div>
                            <fd-wizard-next-step>
                                <button
                                    fdButton
                                    variant="emphasized"
                                    label="Step 3"
                                    [disabled]="!name || !address"
                                    (click)="go(2)"
                                ></button>
                            </fd-wizard-next-step>
                        </fd-wizard-content>
                    </li>
                    <li
                        fd-wizard-step
                        [(status)]="status[2]"
                        label="Additional Information"
                        optionalText="(Optional)"
                        ariaLabel="Step 3: Additional Information"
                    >
                        <fd-wizard-step-indicator glyph="accelerated" />
                        <fd-wizard-content size="lg">
                            <h3 fdTitle headerSize="4" class="mb-4">3. Additional Information</h3>
                            <p class="m-0">${LOREM.repeat(4)}</p>
                            <fd-wizard-next-step>
                                <button fdButton variant="emphasized" label="Step 4" (click)="go(3)"></button>
                            </fd-wizard-next-step>
                        </fd-wizard-content>
                    </li>
                    <li
                        fd-wizard-step
                        [(status)]="status[3]"
                        label="Payment Details"
                        ariaLabel="Step 4: Payment Details"
                    >
                        <fd-wizard-step-indicator glyph="credit-card" />
                        <fd-wizard-content size="lg">
                            <h3 fdTitle headerSize="4" class="mb-4">4. Payment Details</h3>
                            <p class="m-0">${LOREM.repeat(4)}</p>
                            <fd-wizard-next-step>
                                <button fdButton variant="emphasized" label="Review" (click)="go(4)"></button>
                            </fd-wizard-next-step>
                        </fd-wizard-content>
                    </li>
                    <li fd-wizard-step [(status)]="status[4]" label="Summary" isSummary>
                        <fd-wizard-step-indicator glyph="sys-enter-2" />
                        <fd-wizard-content size="lg">
                            <h3 fdTitle headerSize="4" class="mb-4">Summary</h3>
                            <p class="m-0 mb-2">Customer: {{ name || '-' }}, {{ address || '-' }}</p>
                            <p class="m-0 mb-2">
                                <a fdLink href="#" (click)="$event.preventDefault(); go(1)"
                                    >Edit the customer information</a
                                >
                            </p>
                            <p class="m-0">${LOREM}</p>
                        </fd-wizard-content>
                    </li>
                </ul>
            </fd-wizard-navigation>
        </fd-wizard>
    `
})
class StoryWizardDefault {
    readonly height = input('26rem');
    readonly append = input(true);
    protected readonly status = statuses(5, 0);
    protected name = '';
    protected address = '';

    protected go(step: number): void {
        statuses(5, step).forEach((status, i) => (this.status[i] = status));
    }
}

@Component({
    selector: 'story-wizard-branching',
    imports: [...PARTS, FormsModule, RadioButton],
    template: `
        <fd-wizard contentHeight="26rem" displaySummaryStep>
            <fd-wizard-navigation>
                <ul fd-wizard-progress-bar size="md" aria-label="Order steps">
                    <li
                        fd-wizard-step
                        [status]="status()[0]"
                        (statusChange)="sync(0, $event)"
                        label="Payment Type"
                        branching
                    >
                        <fd-wizard-step-indicator>1</fd-wizard-step-indicator>
                        <fd-wizard-content size="md">
                            <h3 fdTitle headerSize="4" class="mb-4">1. Payment Type</h3>
                            <div role="radiogroup" aria-label="Payment type" class="flex flex-col gap-2">
                                <fd-radio-button name="payment" value="card" [(ngModel)]="payment"
                                    >Credit card</fd-radio-button
                                >
                                <fd-radio-button name="payment" value="bank" [(ngModel)]="payment"
                                    >Bank transfer</fd-radio-button
                                >
                            </div>
                            <fd-wizard-next-step>
                                <button fdButton variant="emphasized" label="Next" (click)="go(1)"></button>
                            </fd-wizard-next-step>
                        </fd-wizard-content>
                    </li>
                    @if (payment === 'card') {
                        <li fd-wizard-step [status]="status()[1]" (statusChange)="sync(1, $event)" label="Card Details">
                            <fd-wizard-step-indicator>2</fd-wizard-step-indicator>
                            <fd-wizard-content size="md">
                                <h3 fdTitle headerSize="4" class="mb-4">2. Card Details</h3>
                                <p class="m-0">${LOREM.repeat(2)}</p>
                                <fd-wizard-next-step>
                                    <button fdButton variant="emphasized" label="Next" (click)="go(2)"></button>
                                </fd-wizard-next-step>
                            </fd-wizard-content>
                        </li>
                    } @else {
                        <li fd-wizard-step [status]="status()[1]" (statusChange)="sync(1, $event)" label="Bank Details">
                            <fd-wizard-step-indicator>2</fd-wizard-step-indicator>
                            <fd-wizard-content size="md">
                                <h3 fdTitle headerSize="4" class="mb-4">2. Bank Details</h3>
                                <p class="m-0">${LOREM.repeat(2)}</p>
                                <fd-wizard-next-step>
                                    <button fdButton variant="emphasized" label="Next" (click)="go(2)"></button>
                                </fd-wizard-next-step>
                            </fd-wizard-content>
                        </li>
                    }
                    <li
                        fd-wizard-step
                        [status]="status()[2]"
                        (statusChange)="sync(2, $event)"
                        label="Summary"
                        isSummary
                    >
                        <fd-wizard-step-indicator>3</fd-wizard-step-indicator>
                        <fd-wizard-content size="md">
                            <h3 fdTitle headerSize="4" class="mb-4">3. Summary</h3>
                            <p class="m-0">Paying by {{ payment === 'card' ? 'credit card' : 'bank transfer' }}.</p>
                        </fd-wizard-content>
                    </li>
                </ul>
            </fd-wizard-navigation>
        </fd-wizard>
    `
})
class StoryWizardBranching {
    protected readonly status = signal(statuses(3, 0));
    protected payment = 'card';

    protected go(step: number): void {
        this.status.set(statuses(3, step));
    }

    protected sync(index: number, status: WizardStepStatus): void {
        if (status === 'current') this.go(index);
    }
}

@Component({
    selector: 'story-wizard-narrow',
    imports: [...PARTS, Bar, BarRight, BarElement],
    template: `
        <div class="max-w-[38rem] border border-solid border-sap-group-title-border-color">
            <fd-wizard contentHeight="22rem" [appendToWizard]="false">
                <fd-wizard-navigation>
                    <ul fd-wizard-progress-bar size="sm" aria-label="Setup steps">
                        @for (step of steps; track step; let i = $index) {
                            <li fd-wizard-step [status]="status()[i]" (statusChange)="sync(i, $event)" [label]="step">
                                <fd-wizard-step-indicator>{{ i + 1 }}</fd-wizard-step-indicator>
                                <fd-wizard-content size="sm">
                                    <h3 fdTitle headerSize="4" class="mb-4">{{ i + 1 }}. {{ step }}</h3>
                                    <p class="m-0">${LOREM}</p>
                                </fd-wizard-content>
                            </li>
                        }
                    </ul>
                </fd-wizard-navigation>
                <div fd-bar barDesign="footer">
                    <div fd-bar-right>
                        <fd-bar-element>
                            <button
                                fdButton
                                label="Previous"
                                [disabled]="current() === 0"
                                (click)="go(current() - 1)"
                            ></button>
                        </fd-bar-element>
                        <fd-bar-element>
                            <button
                                fdButton
                                variant="emphasized"
                                label="Next"
                                [disabled]="current() === steps.length - 1"
                                (click)="go(current() + 1)"
                            ></button>
                        </fd-bar-element>
                    </div>
                </div>
            </fd-wizard>
        </div>
    `
})
class StoryWizardNarrow {
    protected readonly steps = ['Account', 'Profile', 'Address', 'Contacts', 'Payment', 'Shipping', 'Review'];
    protected readonly status = signal(statuses(7, 3));
    protected readonly current = computed(() => this.status().indexOf('current'));

    protected go(step: number): void {
        this.status.set(statuses(this.steps.length, step));
    }

    protected sync(index: number, status: WizardStepStatus): void {
        if (status === 'current' && index !== this.current()) this.go(index);
    }
}

/** Upstream's customizable example: solid content background, mixed sizes, compact next-step buttons. */
@Component({
    selector: 'story-wizard-customizable',
    imports: [...PARTS, Bar, BarRight, ButtonBar],
    template: `
        <fd-wizard contentHeight="20rem" [appendToWizard]="false">
            <fd-wizard-navigation>
                <ul fd-wizard-progress-bar size="sm" aria-label="Wizard steps">
                    @for (step of steps; track step; let i = $index) {
                        <li fd-wizard-step [status]="status()[i]" (statusChange)="sync(i, $event)" [label]="step">
                            @if (i === 0) {
                                <fd-wizard-step-indicator glyph="accept" />
                            } @else {
                                <fd-wizard-step-indicator>{{ i + 1 }}</fd-wizard-step-indicator>
                            }
                            <fd-wizard-content size="md" [contentBackground]="i === 0 ? 'solid' : null">
                                <h3 fdTitle headerSize="4" class="mb-4">{{ i + 1 }}. {{ step }}</h3>
                                <p class="m-0">${LOREM}</p>
                                @if (i < steps.length - 1) {
                                    <fd-wizard-next-step>
                                        <button
                                            fdButton
                                            data-density="compact"
                                            variant="emphasized"
                                            [label]="'Go to step ' + (i + 2)"
                                            (click)="go(i + 1)"
                                        ></button>
                                    </fd-wizard-next-step>
                                }
                            </fd-wizard-content>
                        </li>
                    }
                </ul>
            </fd-wizard-navigation>
            <div fd-bar barDesign="footer">
                <div fd-bar-right>
                    <fd-button-bar variant="emphasized" label="Save" />
                    <fd-button-bar label="Cancel" />
                </div>
            </div>
        </fd-wizard>
    `
})
class StoryWizardCustomizable {
    protected readonly steps = ['Solid background', 'Medium content', 'Last step'];
    protected readonly status = signal(statuses(3, 0));

    protected go(step: number): void {
        this.status.set(statuses(this.steps.length, step));
    }

    protected sync(index: number, status: WizardStepStatus): void {
        if (status === 'current') this.go(index);
    }
}

/** Upstream's mobile example: a small wizard with a floating footer and floating next-step buttons. */
@Component({
    selector: 'story-wizard-mobile',
    imports: [...PARTS, Bar, BarRight, ButtonBar],
    template: `
        <div class="relative max-w-[24rem] border border-solid border-sap-group-title-border-color">
            <fd-wizard contentHeight="24rem" [appendToWizard]="false">
                <fd-wizard-navigation>
                    <ul fd-wizard-progress-bar size="sm" aria-label="Mobile wizard steps">
                        @for (step of steps; track step; let i = $index) {
                            <li fd-wizard-step [status]="status()[i]" (statusChange)="sync(i, $event)" [label]="step">
                                <fd-wizard-step-indicator>{{ i + 1 }}</fd-wizard-step-indicator>
                                <fd-wizard-content size="sm">
                                    <h3 fdTitle headerSize="4" class="mb-4">{{ i + 1 }}. {{ step }}</h3>
                                    <p class="m-0">${LOREM}</p>
                                    <fd-wizard-next-step floating>
                                        <button
                                            fdButton
                                            variant="emphasized"
                                            [label]="i < steps.length - 1 ? 'Go to step ' + (i + 2) : 'Submit'"
                                            (click)="go(i + 1)"
                                        ></button>
                                    </fd-wizard-next-step>
                                </fd-wizard-content>
                            </li>
                        }
                    </ul>
                </fd-wizard-navigation>
                <div fd-bar barDesign="floating-footer">
                    <div fd-bar-right>
                        <fd-button-bar variant="emphasized" label="Save" />
                        <fd-button-bar label="Cancel" />
                    </div>
                </div>
            </fd-wizard>
        </div>
    `
})
class StoryWizardMobile {
    protected readonly steps = ['Account', 'Profile', 'Review'];
    protected readonly status = signal(statuses(3, 0));

    protected go(step: number): void {
        if (step < this.steps.length) this.status.set(statuses(this.steps.length, step));
    }

    protected sync(index: number, status: WizardStepStatus): void {
        if (status === 'current') this.go(index);
    }
}

/** Upstream's dialog example: current step only, a visible summary step and the actions in the footer. */
@Component({
    selector: 'story-wizard-dialog',
    imports: [
        ...PARTS,
        Dialog,
        DialogHeader,
        DialogBody,
        DialogFooter,
        DialogTemplate,
        ButtonBar,
        FormsModule,
        FormItem,
        FormLabel,
        FormControl
    ],
    providers: [DialogService],
    template: `
        <ng-template fdDialogTemplate let-dialog let-dialogConfig="dialogConfig" #tpl>
            <fd-dialog [dialogRef]="dialog" [dialogConfig]="dialogConfig">
                <fd-dialog-header>
                    <h2 fdTitle headerSize="2">Checkout</h2>
                </fd-dialog-header>
                <fd-dialog-body>
                    <fd-wizard contentHeight="18rem" [appendToWizard]="false" displaySummaryStep ariaLabel="Checkout">
                        <fd-wizard-navigation>
                            <ul fd-wizard-progress-bar size="sm" aria-label="Checkout steps">
                                @for (step of steps; track step; let i = $index) {
                                    <li
                                        fd-wizard-step
                                        [status]="status()[i]"
                                        (statusChange)="sync(i, $event)"
                                        [label]="step"
                                        [isSummary]="i === steps.length - 1"
                                    >
                                        <fd-wizard-step-indicator>{{ i + 1 }}</fd-wizard-step-indicator>
                                        <fd-wizard-content size="sm">
                                            <h3 fdTitle headerSize="4" class="mb-4">{{ i + 1 }}. {{ step }}</h3>
                                            @if (i === 1) {
                                                <div fd-form-item>
                                                    <label fd-form-label required for="wizard-dialog-name"
                                                        >Full name</label
                                                    >
                                                    <input
                                                        fdFormControl
                                                        id="wizard-dialog-name"
                                                        [(ngModel)]="name"
                                                        autocomplete="off"
                                                    />
                                                </div>
                                            } @else if (i === steps.length - 1) {
                                                <p class="m-0">Customer: {{ name || '-' }}</p>
                                            } @else {
                                                <p class="m-0">${LOREM}</p>
                                            }
                                        </fd-wizard-content>
                                    </li>
                                }
                            </ul>
                        </fd-wizard-navigation>
                    </fd-wizard>
                </fd-dialog-body>
                <fd-dialog-footer>
                    @if (current() > 0) {
                        <fd-button-bar label="Previous step" (click)="go(current() - 1)" />
                    }
                    @if (current() < steps.length - 1) {
                        <fd-button-bar
                            variant="emphasized"
                            [label]="current() === steps.length - 2 ? 'Review' : 'Next step'"
                            [disabled]="current() === 1 && !name"
                            (click)="go(current() + 1)"
                        />
                    } @else {
                        <fd-button-bar variant="emphasized" label="Finish" (click)="dialog.close('Finished')" />
                    }
                    <fd-button-bar label="Cancel" (click)="dialog.dismiss('Cancel')" />
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>
        <div class="p-4">
            <button fdButton label="Open wizard in dialog" (click)="open()"></button>
            <p class="font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">{{ result() }}</p>
        </div>
    `
})
class StoryWizardDialog {
    protected readonly steps = ['Product Type', 'Customer Information', 'Payment Details', 'Summary'];
    protected readonly status = signal(statuses(4, 0));
    protected readonly current = computed(() => this.status().indexOf('current'));
    protected readonly result = signal('');
    protected name = '';
    private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    private readonly dialogs = inject(DialogService);

    protected open(): void {
        this.go(0);
        this.dialogs.open(this.tpl(), { width: '48rem', ariaLabel: 'Checkout' }).afterClosed.subscribe({
            next: (r) => this.result.set(`Wizard closed: ${r}`),
            error: (r) => this.result.set(`Wizard dismissed: ${r}`)
        });
    }

    protected go(step: number): void {
        this.status.set(statuses(this.steps.length, step));
    }

    protected sync(index: number, status: WizardStepStatus): void {
        if (status === 'current' && index !== this.current()) this.go(index);
    }
}

/** Upstream's loading example: skeletons in place of the step indicators and the content. */
@Component({
    selector: 'story-wizard-loading',
    imports: [...PARTS, Bar, BarRight, ButtonBar, Skeleton],
    template: `
        <fd-wizard contentHeight="16rem" ariaLabel="Loading wizard">
            <fd-wizard-navigation>
                <ul fd-wizard-progress-bar size="lg" aria-label="Loading steps">
                    @for (i of [0, 1, 2]; track i) {
                        <li
                            fd-wizard-step
                            [status]="i === 0 ? 'current' : 'upcoming'"
                            [ariaLabel]="'Loading step ' + (i + 1)"
                        >
                            <fd-skeleton type="rectangle" width="2rem" height="2rem" />
                            <fd-wizard-content size="lg">
                                <fd-skeleton type="text" width="60%" />
                            </fd-wizard-content>
                        </li>
                    }
                </ul>
            </fd-wizard-navigation>
            <div fd-bar barDesign="footer">
                <div fd-bar-right>
                    <fd-button-bar label="Save" disabled />
                    <fd-button-bar label="Cancel" />
                </div>
            </div>
        </fd-wizard>
    `
})
class StoryWizardLoading {}

const meta: Meta<Wizard> = {
    title: 'Components/Wizard',
    component: Wizard,
    decorators: [
        moduleMetadata({
            imports: [
                StoryWizardDefault,
                StoryWizardBranching,
                StoryWizardNarrow,
                StoryWizardCustomizable,
                StoryWizardMobile,
                StoryWizardDialog,
                StoryWizardLoading
            ]
        })
    ],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'A wizard breaks a long task into steps. The progress bar shows them; the content of the visited steps shows one below the other and scrolling it updates the current step ' +
                    '(with `appendToWizard=false` only the current step shows). Visited steps can be clicked to go back; in the progress bar the steps form one tab stop and Left and Right move between the visited ones. ' +
                    'A summary step replaces the steps at the end unless `displaySummaryStep` is set. On narrow screens the steps stack and the indicator next to them lists them.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Wizard>;

export const Default: Story = { render: () => ({ template: `<story-wizard-default />` }) };
export const CurrentStepOnly: Story = {
    name: 'Current step only',
    render: () => ({ template: `<story-wizard-default [append]="false" />` })
};
export const Branching: Story = {
    name: 'Branching steps and a visible summary',
    render: () => ({ template: `<story-wizard-branching />` })
};
export const Narrow: Story = {
    name: 'Stacked steps and a footer',
    render: () => ({ template: `<story-wizard-narrow />` })
};
export const Customizable: Story = {
    name: 'Customizable',
    render: () => ({ template: `<story-wizard-customizable />` })
};
export const Mobile: Story = {
    name: 'Mobile, floating footer',
    render: () => ({ template: `<story-wizard-mobile />` })
};
export const InDialog: Story = {
    name: 'In a dialog',
    render: () => ({ template: `<story-wizard-dialog />` })
};
export const Loading: Story = {
    name: 'Loading',
    render: () => ({ template: `<story-wizard-loading />` })
};
export const OpenDialog: Story = {
    name: 'Open: dialog',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-wizard-dialog />` }),
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open wizard in dialog' }));
        await waitFor(() =>
            expect(document.querySelector('fd-dialog-container [role=dialog] fd-wizard')).not.toBeNull()
        );
        const containers = [...document.querySelectorAll<HTMLElement>('fd-dialog-container')];
        await Promise.all(containers.flatMap((c) => c.getAnimations().map((a) => a.finished)));
    }
};
export const OpenStacked: Story = {
    name: 'Open: stacked steps',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-wizard-narrow />` }),
    play: async ({ canvasElement }) => {
        let trigger: HTMLElement | null = null;
        await waitFor(() => {
            trigger = canvasElement.querySelector<HTMLElement>('fd-wizard-step-indicator [aria-haspopup="menu"]');
            expect(trigger).not.toBeNull();
        });
        await userEvent.click(trigger!);
        await waitFor(() => expect(document.querySelector('.cdk-overlay-pane fd-action-sheet-body')).not.toBeNull());
    }
};
