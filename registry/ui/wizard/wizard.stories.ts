import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Bar, BarElement, BarRight } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
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

const meta: Meta<Wizard> = {
    title: 'Components/Wizard',
    component: Wizard,
    decorators: [moduleMetadata({ imports: [StoryWizardDefault, StoryWizardBranching, StoryWizardNarrow] })],
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
