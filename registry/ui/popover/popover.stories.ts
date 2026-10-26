import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { Button } from '@/ui/button/button';
import {
    Popover,
    PopoverBody,
    PopoverBodyFooter,
    PopoverBodyHeader,
    PopoverContainer,
    PopoverControl,
    PopoverTrigger,
    type Placement
} from './popover';

const meta: Meta<Popover> = {
    title: 'Components/Popover',
    component: Popover,
    decorators: [
        moduleMetadata({
            imports: [
                Popover,
                PopoverBody,
                PopoverControl,
                PopoverTrigger,
                PopoverBodyHeader,
                PopoverBodyFooter,
                PopoverContainer,
                Button,
                Avatar
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'A popover shows content in an overlay next to its trigger. It flips when there is no room, ' +
                    'closes on outside click and Escape, moves focus into the body and returns it to the trigger. ' +
                    'Alt+ArrowDown opens it from the keyboard.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Popover>;

const header = (title: string) => `
    <div fdPopoverBodyHeader>
        <div class="flex h-sap-element-height items-center gap-2 bg-sap-page-header-background px-2 shadow-sap-content-header-shadow compact:h-sap-element-compact-height">
            <button fdButton variant="transparent" glyph="navigation-left-arrow" ariaLabel="Back"></button>
            <h5 class="m-0 truncate font-sap-font-header-family text-sap-font-header5-size text-sap-title-color">${title}</h5>
        </div>
    </div>`;

export const Simple: Story = {
    render: () => ({
        template: `
            <div class="flex flex-wrap items-start gap-6">
                <fd-popover>
                    <fd-popover-control>
                        <fd-avatar size="s" circle ariaLabel="Photo" image="assets/person.svg" />
                    </fd-popover-control>
                    <fd-popover-body>
                        <fd-avatar circle size="xl" glyph="group" ariaLabel="Group" class="m-4" />
                    </fd-popover-body>
                </fd-popover>

                <fd-popover placement="bottom">
                    <fd-popover-control>
                        <fd-avatar size="m" glyph="money-bills" ariaLabel="Money bills" [colorAccent]="3" />
                    </fd-popover-control>
                    <fd-popover-body minWidth="25rem">
                        ${header('Header')}
                        <fd-avatar circle size="xl" glyph="group" ariaLabel="Group" class="m-4" />
                    </fd-popover-body>
                </fd-popover>

                <fd-popover>
                    <fd-popover-control>
                        <button fdButton label="Sample"></button>
                    </fd-popover-control>
                    <fd-popover-body>
                        ${header('Title')}
                        <fd-avatar circle size="xl" glyph="group" ariaLabel="Group" class="m-4" />
                        <div fdPopoverBodyFooter>
                            <div class="flex h-sap-element-height items-center justify-end gap-2 bg-sap-page-footer-background px-2 compact:h-sap-element-compact-height">
                                <button fdButton variant="emphasized" label="Save"></button>
                                <button fdButton variant="transparent" label="Cancel"></button>
                            </div>
                        </div>
                    </fd-popover-body>
                </fd-popover>

                <fd-popover placement="bottom" fixedPosition [noArrow]="false">
                    <fd-popover-control><button fdButton label="Fixed Position"></button></fd-popover-control>
                    <fd-popover-body><div class="p-4">This popover keeps its placement even when it does not fit.</div></fd-popover-body>
                </fd-popover>
            </div>
        `
    })
};

export const Placements: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Every placement with the arrow shown and a resizable body. Left and right swap in RTL.'
            }
        }
    },
    render: () => ({
        props: {
            rows: [
                ['top-start', 'top', 'top-end'],
                ['left-start', 'right-start'],
                ['left', 'right'],
                ['left-end', 'right-end'],
                ['bottom-start', 'bottom', 'bottom-end']
            ] as Placement[][],
            glyph: (p: string) =>
                p.startsWith('top')
                    ? 'navigation-up-arrow'
                    : p.startsWith('bottom')
                      ? 'navigation-down-arrow'
                      : p.startsWith('left')
                        ? 'navigation-left-arrow'
                        : 'navigation-right-arrow'
        },
        template: `
            <div class="flex flex-col items-center gap-6 py-40">
                @for (row of rows; track $index) {
                    <div class="flex w-[36rem] justify-between">
                        @for (p of row; track p) {
                            <fd-popover [placement]="p" [noArrow]="false" resizable>
                                <fd-popover-control><button fdButton [glyph]="glyph(p)" [ariaLabel]="p" [title]="p"></button></fd-popover-control>
                                <fd-popover-body minWidth="9rem" minHeight="9rem">
                                    <div class="p-4">{{ p }}</div>
                                </fd-popover-body>
                            </fd-popover>
                        }
                    </div>
                }
            </div>
        `
    })
};

export const Programmatic: Story = {
    name: 'Programmatic control',
    render: () => ({
        props: {
            isOpen: signal(false),
            disabled: signal(false),
            log: signal<string[]>([]),
            add(this: { log: ReturnType<typeof signal<string[]>> }, entry: string) {
                this.log.update((l) => [`${new Date().toLocaleTimeString()} ${entry}`, ...l].slice(0, 6));
            }
        },
        template: `
            <div class="flex flex-wrap items-center gap-4">
                <fd-popover [(isOpen)]="isOpen" [triggers]="[]" [closeOnOutsideClick]="false" [noArrow]="false" placement="bottom"
                    [disabled]="disabled()" (beforeOpen)="add('beforeOpen')" (isOpenChange)="add('isOpenChange: ' + $event)">
                    <fd-popover-control><fd-avatar size="s" circle ariaLabel="Photo" image="assets/person.svg" /></fd-popover-control>
                    <fd-popover-body><fd-avatar circle size="xl" glyph="group" ariaLabel="Group" class="m-4" /></fd-popover-body>
                </fd-popover>
                <button fdButton label="Open Popover" (click)="isOpen.set(true)" [disabled]="disabled()"></button>
                <button fdButton label="Close Popover" (click)="isOpen.set(false)" [disabled]="disabled()"></button>
                <button fdButton variant="transparent" label="Toggle Disabled" (click)="disabled.set(!disabled())"></button>
            </div>
            <ul class="mt-4 text-sap-font-small-size text-sap-content-label-color">
                @for (entry of log(); track $index) { <li>{{ entry }}</li> } @empty { <li>No events yet.</li> }
            </ul>
        `
    })
};

export const Triggers: Story = {
    name: 'Trigger events',
    parameters: {
        docs: {
            description: {
                story: 'A single trigger toggles. With several, odd entries open and even entries close; or pass `{ trigger, openAction, closeAction }` objects.'
            }
        }
    },
    render: () => ({
        template: `
            <div class="flex flex-wrap gap-4">
                <fd-popover [triggers]="['mouseenter', 'mouseleave']" [focusAutoCapture]="false">
                    <fd-popover-control><button fdButton label="Hover"></button></fd-popover-control>
                    <fd-popover-body><div class="p-4">Opens on hover.</div></fd-popover-body>
                </fd-popover>
                <fd-popover [triggers]="['focusin', 'focusout']" [focusAutoCapture]="false">
                    <fd-popover-control><button fdButton label="Focus"></button></fd-popover-control>
                    <fd-popover-body><div class="p-4">Opens on focus.</div></fd-popover-body>
                </fd-popover>
                <fd-popover [triggers]="[{ trigger: 'dblclick', openAction: true, closeAction: true }]">
                    <fd-popover-control><button fdButton label="Double click"></button></fd-popover-control>
                    <fd-popover-body><div class="p-4">Opens on double click.</div></fd-popover-body>
                </fd-popover>
            </div>
        `
    })
};

export const ExternalTrigger: Story = {
    name: 'External trigger',
    parameters: {
        docs: {
            description: {
                story: '`fdPopoverTrigger` connects any element and sets aria-haspopup, aria-controls and aria-expanded.'
            }
        }
    },
    render: () => ({
        template: `
            <button fdButton [fdPopoverTrigger]="popover" label="Popover Trigger"></button>
            <fd-popover #popover>
                <fd-popover-body><div class="p-3">This popover is connected to the trigger element.</div></fd-popover-body>
            </fd-popover>
        `
    })
};

export const FillControlMode: Story = {
    name: 'Fill control mode',
    render: () => ({
        template: `
            <div class="flex flex-col gap-6">
                <div>
                    <p class="mb-2"><strong>Equal</strong>: the body is exactly as wide as the trigger.</p>
                    <fd-popover class="block" [triggers]="['mouseenter', 'mouseleave']" fillControlMode="equal" [focusAutoCapture]="false">
                        <fd-popover-control><div class="border border-dashed border-sap-group-content-border-color p-6">Control Element - Hover over me!</div></fd-popover-control>
                        <fd-popover-body><div class="whitespace-normal p-3">This popover matches the width of the control element.</div></fd-popover-body>
                    </fd-popover>
                </div>
                <div>
                    <p class="mb-2"><strong>At least</strong>: at least as wide as the trigger, wider if the content needs it.</p>
                    <fd-popover [triggers]="['mouseenter', 'mouseleave']" fillControlMode="at-least" [focusAutoCapture]="false">
                        <fd-popover-control><div class="w-[200px] border border-dashed border-sap-group-content-border-color p-6">Narrow Control (200px)</div></fd-popover-control>
                        <fd-popover-body><div class="p-3">This popover expands beyond the control because this content is wider.</div></fd-popover-body>
                    </fd-popover>
                </div>
                <div>
                    <p class="mb-2"><strong>Max width</strong>: <code>maxWidth</code> limits the filled width.</p>
                    <fd-popover class="block" [triggers]="['mouseenter', 'mouseleave']" fillControlMode="equal" [maxWidth]="200" [focusAutoCapture]="false">
                        <fd-popover-control><div class="w-[400px] border border-dashed border-sap-group-content-border-color p-6">Wide Control Element (400px) - Hover over me!</div></fd-popover-control>
                        <fd-popover-body><div class="whitespace-normal p-3">Popover limited to 200px despite wider control.</div></fd-popover-body>
                    </fd-popover>
                </div>
            </div>
        `
    })
};

export const Closing: Story = {
    name: 'Prevent closing',
    parameters: {
        docs: {
            description: {
                story: 'With `applyOverlay`, a popover that cannot be closed by outside click or Escape dims the page behind it.'
            }
        }
    },
    render: () => ({
        template: `
            <div class="flex flex-wrap gap-4">
                <fd-popover [closeOnOutsideClick]="false" applyOverlay #p1="fdPopover">
                    <fd-popover-control><button fdButton label="Prevent Close on Outside Click"></button></fd-popover-control>
                    <fd-popover-body minWidth="25rem">${header('Header')}<div class="p-4"><button fdButton label="Close" (click)="p1.close()"></button></div></fd-popover-body>
                </fd-popover>
                <fd-popover [closeOnEscapeKey]="false" applyOverlay #p2="fdPopover">
                    <fd-popover-control><button fdButton label="Prevent Close on Escape Key"></button></fd-popover-control>
                    <fd-popover-body minWidth="25rem">${header('Header')}<div class="p-4"><button fdButton label="Close" (click)="p2.close()"></button></div></fd-popover-body>
                </fd-popover>
                <fd-popover [closeOnEscapeKey]="false" [closeOnOutsideClick]="false" applyOverlay #p3="fdPopover">
                    <fd-popover-control><button fdButton label="Prevent Close on Outside Click & on Escape Key"></button></fd-popover-control>
                    <fd-popover-body minWidth="25rem">${header('Header')}<div class="p-4"><button fdButton label="Close" (click)="p3.close()"></button></div></fd-popover-body>
                </fd-popover>
            </div>
        `
    })
};

export const Focus: Story = {
    name: 'Focus handling',
    render: () => ({
        template: `
            <div class="flex flex-wrap gap-4">
                <fd-popover>
                    <fd-popover-control><button fdButton label="Trapped focus (default)"></button></fd-popover-control>
                    <fd-popover-body><div class="flex gap-2 p-4"><button fdButton label="First"></button><button fdButton label="Second"></button></div></fd-popover-body>
                </fd-popover>
                <fd-popover [focusTrapped]="false" [focusAutoCapture]="false">
                    <fd-popover-control><button fdButton label="Focus stays on trigger"></button></fd-popover-control>
                    <fd-popover-body><div class="flex gap-2 p-4"><button fdButton label="First"></button><button fdButton label="Second"></button></div></fd-popover-body>
                </fd-popover>
            </div>
        `
    })
};

export const NonDialog: Story = {
    name: 'Body roles',
    parameters: {
        docs: {
            description: {
                story: 'The body is a dialog by default; set `bodyRole` for menus, listboxes, tooltips or regions.'
            }
        }
    },
    render: () => ({
        template: `
            <fd-popover bodyRole="region" bodyAriaLabel="Details" [focusTrapped]="false">
                <fd-popover-control><button fdButton label="Region popover"></button></fd-popover-control>
                <fd-popover-body><div class="p-4">A non-modal region with details.</div></fd-popover-body>
            </fd-popover>
        `
    })
};

export const Nested: Story = {
    name: 'Popover inside popover',
    render: () => ({
        template: `
            <fd-popover>
                <fd-popover-control><button fdButton label="Open first"></button></fd-popover-control>
                <fd-popover-body>
                    <div class="p-4">
                        <fd-popover placement="right-start">
                            <fd-popover-control><button fdButton label="Open second"></button></fd-popover-control>
                            <fd-popover-body><div class="p-4">Second level</div></fd-popover-body>
                        </fd-popover>
                    </div>
                </fd-popover-body>
            </fd-popover>
        `
    })
};

export const ScrollContainer: Story = {
    name: 'Inside a scroll container',
    parameters: {
        docs: { description: { story: '`fdPopoverContainer` keeps the popover attached while its container scrolls.' } }
    },
    render: () => ({
        props: { items: Array.from({ length: 12 }, (_, i) => i + 1) },
        template: `
            <div fdPopoverContainer class="scrollbar-sap h-64 w-80 overflow-auto border border-sap-group-content-border-color p-4">
                @for (i of items; track i) {
                    <div class="py-2">
                        <fd-popover placement="right">
                            <fd-popover-control><button fdButton [label]="'Item ' + i"></button></fd-popover-control>
                            <fd-popover-body><div class="p-3">Details of item {{ i }}</div></fd-popover-body>
                        </fd-popover>
                    </div>
                }
            </div>
        `
    })
};

export const Dynamic: Story = {
    name: 'Dynamic content',
    render: () => ({
        props: { items: signal(['One']) },
        template: `
            <fd-popover>
                <fd-popover-control><button fdButton label="Dynamic"></button></fd-popover-control>
                <fd-popover-body>
                    <div class="flex flex-col gap-2 p-4">
                        @for (i of items(); track $index) { <span>{{ i }}</span> }
                        <button fdButton label="Add line" (click)="items.set([...items(), 'Line ' + (items().length + 1)])"></button>
                    </div>
                </fd-popover-body>
            </fd-popover>
        `
    })
};

export const Text: Story = {
    name: 'Text only',
    render: () => ({
        template: `
            <fd-popover text="A popover with plain text content." [focusAutoCapture]="false">
                <fd-popover-control><button fdButton label="Text popover"></button></fd-popover-control>
            </fd-popover>
        `
    })
};
