import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Icon } from '@/ui/icon/icon';
import { List, ListItem, ListLink, ListTitle } from '@/ui/list/list';
import { Popover, PopoverBody, PopoverControl } from '@/ui/popover/popover';
import { StatusIndicator } from '@/ui/status-indicator/status-indicator';
import { Title } from '@/ui/title/title';
import {
    MicroProcessFlow,
    MicroProcessFlowFocusableItem,
    MicroProcessFlowIcon,
    MicroProcessFlowIntermediaryItem,
    MicroProcessFlowItem,
    type MicroProcessFlowItemType
} from './micro-process-flow';

const EURO = [
    'M13,0.5c-6.6,0-12,5.4-12,12s5.4,12,12,12s12-5.4,12-12S19.6,0.5,13,0.5z M16.4,10.1L15.9,12h-5.3v0.3H16l-0.5,1.9h-4.6c0.5,1.3,1.6,2,3.1,2c0.8,0,1.5-0.2,2.2-0.7l0.7-0.6v2.7l-0.1,0.1c-0.9,0.4-1.8,0.6-2.6,0.6c-1.6,0-2.9-0.3-3.8-1c-0.9-0.7-1.5-1.7-2-3H6.4l0.5-1.9h1V12H6.4l0.5-1.9h1.3C8.6,8.9,9.3,8,10.3,7.3c1-0.8,2.3-1.1,3.8-1.1c1.1,0,2,0.2,2.8,0.7L17.3,7l-0.6,2.3l-0.5-0.4c-0.4-0.2-0.9-0.4-1.4-0.5c-0.6-0.1-1.1-0.1-1.7,0c-0.6,0.1-1,0.3-1.5,0.7c-0.3,0.3-0.6,0.6-0.7,1H16.4z'
];
const CART = [
    'M22.9,17.2c-1.7,0-3.2,1.2-3.5,2.8h-4.8c-0.4-1.6-1.8-2.8-3.6-2.8c-0.1,0-0.2,0-0.3,0l-0.5-1.7h16L30.5,5H7L5.8,1l0,0l0,0l0-0.1L5.6,0.9l-5-0.4l0.2,1.7l3.4,0.3l4.7,15.4c-0.9,0.7-1.5,1.7-1.5,2.9c0,2,1.6,3.7,3.7,3.7c1.7,0,3.2-1.2,3.6-2.8h4.8c0.4,1.6,1.8,2.8,3.5,2.8c2,0,3.7-1.6,3.7-3.7C26.6,18.8,24.9,17.2,22.9,17.2z'
];
const FACTORY = [
    'M19.6,12.9l0-3.7l-4.9,3.7V9.2l-5,3.9l-0.3,0l0-9.4H5.8v9.4H4.6V0.5H1l-0.3,24h23.6V9.3L19.6,12.9z M22.2,19.9H17v-2.4h5.2V19.9z'
];

const heading = 'mt-6 mb-2 first:mt-0';

const PARTS = [
    MicroProcessFlow,
    MicroProcessFlowItem,
    MicroProcessFlowIcon,
    MicroProcessFlowFocusableItem,
    MicroProcessFlowIntermediaryItem,
    Title
];

interface Step {
    state: MicroProcessFlowItemType;
    glyph: string | null;
    label: string;
}

const STEPS: Step[] = [
    { state: 'none', glyph: null, label: 'Created' },
    { state: 'positive', glyph: 'pending', label: 'Pending' },
    { state: 'information', glyph: 'phone', label: 'Called' },
    { state: 'negative', glyph: 'map', label: 'Address rejected' },
    { state: 'critical', glyph: 'log', label: 'Logged' }
];

@Component({
    selector: 'story-mpf-basic',
    imports: [...PARTS, Icon],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">States, with an intermediate step</h3>
        <fd-micro-process-flow>
            @for (step of steps; track step.label; let i = $index) {
                <fd-micro-process-flow-item [state]="step.state" [intermediate]="i === 1">
                    <fd-micro-process-flow-icon
                        fd-micro-process-flow-focusable-item
                        [glyph]="step.glyph"
                        [ariaLabel]="step.label"
                        [attr.title]="step.label"
                    />
                </fd-micro-process-flow-item>
            }
        </fd-micro-process-flow>

        <h3 fdTitle headerSize="5" class="${heading}">Independent steps</h3>
        <fd-micro-process-flow independentSteps>
            @for (step of steps; track step.label) {
                <fd-micro-process-flow-item [state]="step.state">
                    <fd-micro-process-flow-icon
                        fd-micro-process-flow-focusable-item
                        [glyph]="step.glyph"
                        [ariaLabel]="step.label"
                        [attr.title]="step.label"
                    />
                </fd-micro-process-flow-item>
            }
        </fd-micro-process-flow>

        <h3 fdTitle headerSize="5" class="${heading}">Objects between the steps</h3>
        <fd-micro-process-flow>
            @for (step of steps; track step.label; let last = $last) {
                <fd-micro-process-flow-item [state]="step.state">
                    <fd-micro-process-flow-icon
                        fd-micro-process-flow-focusable-item
                        [glyph]="step.glyph"
                        [ariaLabel]="step.label"
                        [attr.title]="step.label"
                    />
                    @if (!last) {
                        <fd-icon
                            fd-micro-process-flow-intermediary-item
                            glyph="syringe"
                            color="critical"
                            class="text-[1.5rem]"
                            ariaLabel="Vaccination"
                        />
                    }
                </fd-micro-process-flow-item>
            }
        </fd-micro-process-flow>

        <h3 fdTitle headerSize="5" class="${heading}">Custom widths</h3>
        <fd-micro-process-flow>
            @for (step of steps; track step.label; let i = $index) {
                <fd-micro-process-flow-item [state]="step.state" [style.width.rem]="widths[i]">
                    <fd-micro-process-flow-icon
                        fd-micro-process-flow-focusable-item
                        [glyph]="step.glyph"
                        [ariaLabel]="step.label"
                        [attr.title]="step.label"
                    />
                </fd-micro-process-flow-item>
            }
        </fd-micro-process-flow>
    `
})
class StoryMpfBasic {
    protected readonly steps = STEPS;
    protected readonly widths = [8, 4, 10, 10, 10];
}

@Component({
    selector: 'story-mpf-overflow',
    imports: [...PARTS],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Default transition</h3>
        <fd-micro-process-flow>
            @for (step of many; track $index) {
                <fd-micro-process-flow-item [state]="step.state">
                    <fd-micro-process-flow-icon
                        fd-micro-process-flow-focusable-item
                        [glyph]="step.glyph"
                        [ariaLabel]="step.label"
                        [attr.title]="step.label"
                    />
                </fd-micro-process-flow-item>
            }
        </fd-micro-process-flow>

        <h3 fdTitle headerSize="5" class="${heading}">Custom transition</h3>
        <fd-micro-process-flow [transitionSpeed]="200" transitionTimingFunction="cubic-bezier(.4,.01,.165,.99)">
            @for (step of many; track $index) {
                <fd-micro-process-flow-item [state]="step.state">
                    <fd-micro-process-flow-icon
                        fd-micro-process-flow-focusable-item
                        [glyph]="step.glyph"
                        [ariaLabel]="step.label"
                        [attr.title]="step.label"
                    />
                </fd-micro-process-flow-item>
            }
        </fd-micro-process-flow>
    `
})
class StoryMpfOverflow {
    protected readonly many = Array.from({ length: 14 }, (_, i) => ({
        ...STEPS[i % STEPS.length],
        label: `Step ${i + 1}`
    }));
}

@Component({
    selector: 'story-mpf-controls',
    imports: [...PARTS, StatusIndicator, Popover, PopoverControl, PopoverBody, List, ListItem, ListLink, ListTitle],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">Status indicators</h3>
        <fd-micro-process-flow>
            @for (item of indicators; track item.label) {
                <fd-micro-process-flow-item [state]="item.state">
                    <fd-status-indicator
                        fd-micro-process-flow-focusable-item
                        [status]="item.status"
                        [path]="item.path"
                        [viewBox]="item.viewBox"
                        [fillPercentage]="item.fill"
                        [ariaLabel]="item.label"
                        [ariaValueText]="item.fill + '%'"
                        [title]="item.label + ': ' + item.fill + '%'"
                    />
                </fd-micro-process-flow-item>
            }
        </fd-micro-process-flow>

        <h3 fdTitle headerSize="5" class="${heading}">Steps with popovers</h3>
        <fd-micro-process-flow>
            @for (step of steps; track step.label) {
                <fd-micro-process-flow-item [state]="step.state">
                    <fd-popover placement="bottom">
                        <fd-popover-control>
                            <fd-micro-process-flow-icon
                                fd-micro-process-flow-focusable-item
                                role="button"
                                aria-haspopup="dialog"
                                [glyph]="step.glyph"
                                [attr.aria-label]="step.label"
                                [attr.title]="step.label"
                                (keydown.enter)="opened.set(step.label)"
                            />
                        </fd-popover-control>
                        <fd-popover-body>
                            <ul fd-list [attr.aria-label]="step.label + ' actions'">
                                @for (action of actions; track action) {
                                    <li fd-list-item>
                                        <a fd-list-link href="#" (click)="$event.preventDefault()"
                                            ><span fd-list-title>{{ action }}</span></a
                                        >
                                    </li>
                                }
                            </ul>
                        </fd-popover-body>
                    </fd-popover>
                </fd-micro-process-flow-item>
            }
        </fd-micro-process-flow>
    `
})
class StoryMpfControls {
    protected readonly steps = STEPS;
    protected readonly actions = ['Show details', 'Change owner', 'Cancel step'];
    protected readonly opened = signal('');
    protected readonly indicators = [
        { state: 'none', status: 'positive', path: CART, viewBox: '0 0 31 25', fill: 100, label: 'Cart' },
        { state: 'positive', status: 'positive', path: EURO, viewBox: '0 0 26 25', fill: 100, label: 'Payment' },
        {
            state: 'information',
            status: 'critical',
            path: FACTORY,
            viewBox: '0 0 25 25',
            fill: 60,
            label: 'Production'
        },
        { state: 'negative', status: 'negative', path: CART, viewBox: '0 0 31 25', fill: 20, label: 'Delivery' }
    ] as const;
}

const meta: Meta<MicroProcessFlow> = {
    title: 'Components/Micro Process Flow',
    component: MicroProcessFlow,
    decorators: [moduleMetadata({ imports: [StoryMpfBasic, StoryMpfOverflow, StoryMpfControls] })],
    parameters: {
        docs: {
            description: {
                component:
                    'A micro process flow shows the steps of a process in a compact row: round icons (or status indicators) in value-state colours, joined by connectors that can be interrupted or carry an object. ' +
                    'Steps that do not fit are reached with the links at the ends, which show how many steps are hidden. The flow is one tab stop; Left and Right move between the steps and scroll them into view.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<MicroProcessFlow>;

export const Basic: Story = { render: () => ({ template: `<story-mpf-basic />` }) };
export const Overflow: Story = { render: () => ({ template: `<story-mpf-overflow />` }) };
export const OtherControls: Story = {
    name: 'Status indicators and popovers',
    render: () => ({ template: `<story-mpf-controls />` })
};
