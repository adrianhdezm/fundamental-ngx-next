import { Overlay, type ConnectedPosition } from '@angular/cdk/overlay';
import { Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Avatar } from '@/ui/avatar/avatar';
import { Bar, BarElement, BarLeft, BarRight, ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { Dialog, DialogBody, DialogHeader, DialogService } from '@/ui/dialog/dialog';
import { Title } from '@/ui/title/title';
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

const POPOVER = [Popover, PopoverBody, PopoverControl, Button, Avatar, Title];

/** A popover inside a dialog: Escape closes the popover first, then the dialog. */
@Component({
    selector: 'story-popover-dialog',
    imports: [...POPOVER, Dialog, DialogHeader, DialogBody],
    providers: [DialogService],
    template: `
        <button fdButton label="Open Dialog" (click)="open()"></button>
        <ng-template #tpl>
            <fd-dialog>
                <fd-dialog-header><h1 fdTitle>Popover Example</h1></fd-dialog-header>
                <fd-dialog-body>
                    <fd-popover [noArrow]="false" bodyAriaLabel="Button details">
                        <fd-popover-control><button fdButton label="Click me!"></button></fd-popover-control>
                        <fd-popover-body><div class="p-3">This is the button's popover!</div></fd-popover-body>
                    </fd-popover>
                    <p class="mb-0 mt-4">Escape closes the popover first, and the dialog only on a second press.</p>
                </fd-dialog-body>
            </fd-dialog>
        </ng-template>
    `
})
class StoryPopoverDialog {
    private readonly dialogs = inject(DialogService);
    private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    protected open(): void {
        this.dialogs.open(this.tpl(), { width: '25rem', ariaLabel: 'Popover Example' });
    }
}

const CDK_PRESETS: Record<string, ConnectedPosition[]> = {
    'Right, centred': [
        { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' },
        { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center' }
    ],
    'Above, end-aligned': [
        { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' }
    ],
    'Over the trigger': [{ originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'top' }],
    'Below, 16px offset': [{ originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 16 }]
};

/** Exact CDK positions: the first that fits wins, the others are fallbacks. */
@Component({
    selector: 'story-popover-cdk-positions',
    imports: POPOVER,
    template: `
        <div class="flex flex-wrap gap-2">
            @for (name of names; track name) {
                <button fdButton [label]="name" [toggled]="name === preset()" (click)="preset.set(name)"></button>
            }
        </div>
        <div class="flex h-72 items-center justify-center">
            <fd-popover
                [cdkPositions]="positions[preset()]"
                [noArrow]="false"
                [focusAutoCapture]="false"
                bodyAriaLabel="Positioned popover"
            >
                <fd-popover-control
                    ><button fdButton glyph="navigation-up-arrow" ariaLabel="Trigger"></button
                ></fd-popover-control>
                <fd-popover-body
                    ><fd-avatar circle size="xl" glyph="group" ariaLabel="Group" class="m-4"
                /></fd-popover-body>
            </fd-popover>
        </div>
    `
})
class StoryPopoverCdkPositions {
    protected readonly positions = CDK_PRESETS;
    protected readonly names = Object.keys(CDK_PRESETS);
    protected readonly preset = signal(this.names[0]);
}

/** The CDK scroll strategies side by side, inside a scrolling area. */
@Component({
    selector: 'story-popover-scroll-strategies',
    imports: POPOVER,
    template: `
        <div class="scrollbar-sap h-80 overflow-auto border border-sap-group-content-border-color p-4">
            <div class="flex h-[60rem] flex-col gap-10">
                @for (s of strategies; track s.name) {
                    <div>
                        <p class="mb-2 mt-0">{{ s.description }}</p>
                        <fd-popover [scrollStrategy]="s.strategy" [focusAutoCapture]="false" [bodyAriaLabel]="s.name">
                            <fd-popover-control><button fdButton [label]="s.name"></button></fd-popover-control>
                            <fd-popover-body
                                ><div class="p-3">Start scrolling to see the behaviour.</div></fd-popover-body
                            >
                        </fd-popover>
                    </div>
                }
            </div>
        </div>
    `
})
class StoryPopoverScrollStrategies {
    private readonly overlay = inject(Overlay);
    protected readonly strategies = [
        {
            name: 'Reposition',
            description:
                'Reposition (default): the popover follows its trigger and closes once it scrolls out of view.',
            strategy: this.overlay.scrollStrategies.reposition({ autoClose: true })
        },
        {
            name: 'Noop',
            description: 'Noop: the popover stays where it opened.',
            strategy: this.overlay.scrollStrategies.noop()
        },
        {
            name: 'Close',
            description: 'Close: scrolling closes the popover.',
            strategy: this.overlay.scrollStrategies.close()
        },
        {
            name: 'Block',
            description: 'Block: the page cannot scroll while the popover is open.',
            strategy: this.overlay.scrollStrategies.block()
        }
    ];
}

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
                Avatar,
                Bar,
                BarLeft,
                BarRight,
                BarElement,
                ButtonBar,
                Title,
                StoryPopoverDialog,
                StoryPopoverCdkPositions,
                StoryPopoverScrollStrategies
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
        <div fd-bar barDesign="header" aria-label="${title}">
            <div fd-bar-left>
                <fd-button-bar glyph="navigation-left-arrow" ariaLabel="Back" />
                <fd-bar-element><h5 fdTitle>${title}</h5></fd-bar-element>
            </div>
        </div>
    </div>`;

export const Simple: Story = {
    render: () => ({
        template: `
            <div class="flex flex-wrap items-start gap-6">
                <fd-popover bodyAriaLabel="Group">
                    <fd-popover-control>
                        <fd-avatar size="s" circle ariaLabel="Photo" image="assets/person.svg" />
                    </fd-popover-control>
                    <fd-popover-body>
                        <fd-avatar circle size="xl" glyph="group" ariaLabel="Group" class="m-4" />
                    </fd-popover-body>
                </fd-popover>

                <fd-popover placement="bottom" bodyAriaLabel="Header">
                    <fd-popover-control>
                        <fd-avatar size="m" glyph="money-bills" ariaLabel="Money bills" [colorAccent]="3" />
                    </fd-popover-control>
                    <fd-popover-body minWidth="25rem">
                        ${header('Header')}
                        <fd-avatar circle size="xl" glyph="group" ariaLabel="Group" class="m-4" />
                    </fd-popover-body>
                </fd-popover>

                <fd-popover bodyAriaLabel="Title">
                    <fd-popover-control>
                        <button fdButton label="Sample"></button>
                    </fd-popover-control>
                    <fd-popover-body>
                        ${header('Title')}
                        <fd-avatar circle size="xl" glyph="group" ariaLabel="Group" class="m-4" />
                        <div fdPopoverBodyFooter>
                            <div fd-bar barDesign="footer" aria-label="Actions">
                                <div fd-bar-right>
                                    <fd-button-bar variant="emphasized" label="Save" />
                                    <fd-button-bar label="Cancel" />
                                </div>
                            </div>
                        </div>
                    </fd-popover-body>
                </fd-popover>

                <fd-popover placement="bottom" fixedPosition [noArrow]="false" bodyAriaLabel="Fixed position">
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
                <div class="p-3">This popover is connected to the trigger element.</div>
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
    parameters: {
        docs: {
            description: {
                story:
                    'Focus moves into the body, is trapped there and returns to the trigger on close. Close buttons in the header and ' +
                    'footer close the popover; `restoreFocusOnClose` and `preventSpaceKeyScroll` can be turned off.'
            }
        }
    },
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
                <fd-popover #withBars="fdPopover" bodyAriaLabel="Header">
                    <fd-popover-control><button fdButton label="Header and footer"></button></fd-popover-control>
                    <fd-popover-body minWidth="25rem">
                        <div fdPopoverBodyHeader>
                            <div fd-bar barDesign="header" aria-label="Header">
                                <div fd-bar-left>
                                    <fd-button-bar glyph="navigation-left-arrow" ariaLabel="Back" (click)="withBars.close()" />
                                    <fd-bar-element><h5 fdTitle>Header</h5></fd-bar-element>
                                </div>
                            </div>
                        </div>
                        <fd-avatar circle size="xl" glyph="group" ariaLabel="Group" class="m-4" />
                        <div fdPopoverBodyFooter>
                            <div fd-bar barDesign="footer" aria-label="Actions">
                                <div fd-bar-right>
                                    <fd-button-bar variant="emphasized" label="Save" (click)="withBars.close()" />
                                    <fd-button-bar label="Cancel" (click)="withBars.close()" />
                                </div>
                            </div>
                        </div>
                    </fd-popover-body>
                </fd-popover>
                <fd-popover #noRestore="fdPopover" [restoreFocusOnClose]="false">
                    <fd-popover-control><button fdButton label="No restore focus"></button></fd-popover-control>
                    <fd-popover-body><div class="p-4"><button fdButton variant="transparent" label="Close me" (click)="noRestore.close()"></button></div></fd-popover-body>
                </fd-popover>
                <fd-popover [preventSpaceKeyScroll]="false">
                    <fd-popover-control><span class="inline-block rounded-sap-element-border-corner-radius border border-dashed border-sap-group-content-border-color p-2">Space scrolls the page</span></fd-popover-control>
                    <fd-popover-body><div class="p-4">With <code>preventSpaceKeyScroll</code> off, Space on this trigger scrolls the page.</div></fd-popover-body>
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
            <fd-popover bodyAriaLabel="First level">
                <fd-popover-control><button fdButton label="Open first"></button></fd-popover-control>
                <fd-popover-body>
                    <div class="p-4">
                        <fd-popover placement="right-start" bodyAriaLabel="Second level">
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

export const InDialog: Story = {
    name: 'In a dialog',
    parameters: { docs: { story: { inline: false, iframeHeight: 400 } } },
    render: () => ({ template: `<story-popover-dialog />` })
};

export const AppendTo: Story = {
    name: 'Append to',
    parameters: {
        docs: { description: { story: '`appendTo` positions the popover against another element than its trigger.' } }
    },
    render: () => ({
        template: `
            <div class="p-10 text-center">
                <fd-popover [appendTo]="target" class="block" bodyAriaLabel="Positioned against the container">
                    <fd-popover-control><button fdButton label="Trigger"></button></fd-popover-control>
                    <fd-popover-body><div class="p-3">This popover is positioned relative to the container below</div></fd-popover-body>
                </fd-popover>
            </div>
            <div #target class="border border-dashed border-sap-group-content-border-color p-2">Container (appendTo target)</div>
        `
    })
};

export const CdkPositions: Story = {
    name: 'CDK positions',
    parameters: {
        docs: {
            description: {
                story:
                    '`cdkPositions` takes exact CDK connected positions instead of `placement`; later entries are fallbacks ' +
                    'when the first does not fit.'
            }
        }
    },
    render: () => ({ template: `<story-popover-cdk-positions />` })
};

export const ScrollStrategies: Story = {
    name: 'Scroll strategies',
    render: () => ({ template: `<story-popover-scroll-strategies />` })
};

export const Dropdown: Story = {
    parameters: {
        docs: { description: { story: 'A button with the menu arrow (`fdMenu`) opens a dropdown popover.' } }
    },
    render: () => ({
        template: `
            <div class="flex flex-wrap gap-4">
                <fd-popover bodyAriaLabel="Dropdown">
                    <fd-popover-control><button fdButton label="Dropdown Popover" fdMenu></button></fd-popover-control>
                    <fd-popover-body><fd-avatar circle size="xl" glyph="group" ariaLabel="Group" class="m-4" /></fd-popover-body>
                </fd-popover>
                <fd-popover disabled bodyAriaLabel="Dropdown">
                    <fd-popover-control><button fdButton label="Disabled Dropdown Popover" fdMenu disabled></button></fd-popover-control>
                    <fd-popover-body><fd-avatar circle size="xl" glyph="group" ariaLabel="Group" class="m-4" /></fd-popover-body>
                </fd-popover>
                <fd-popover bodyAriaLabel="Filter">
                    <fd-popover-control><button fdButton label="Dropdown with icon" glyph="filter" fdMenu></button></fd-popover-control>
                    <fd-popover-body><fd-avatar circle size="xl" glyph="group" ariaLabel="Group" class="m-4" /></fd-popover-body>
                </fd-popover>
            </div>
        `
    })
};

export const Resizable: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    'Drag the corner handle to resize the body; `minWidth`, `minHeight`, `maxWidth` and `maxHeight` on the body ' +
                    'set its limits.'
            }
        }
    },
    render: () => ({
        template: `
            <fd-popover placement="bottom-start" resizable bodyAriaLabel="Resizable content area">
                <fd-popover-control><button fdButton label="Open resizable popover"></button></fd-popover-control>
                <fd-popover-body minWidth="18rem" minHeight="10rem" maxWidth="32rem" maxHeight="24rem">
                    <div class="flex flex-col items-start gap-3 whitespace-normal p-4">
                        <h4 fdTitle>Resizable content area</h4>
                        <p class="m-0">Drag the resize handle to make room for longer content, tables, previews, or forms while keeping the popover within its configured limits.</p>
                    </div>
                    <div fdPopoverBodyFooter>
                        <div fd-bar barDesign="footer" aria-label="Actions">
                            <div fd-bar-right><fd-button-bar variant="emphasized" label="Save changes" /></div>
                        </div>
                    </div>
                </fd-popover-body>
            </fd-popover>
        `
    })
};

/** Clicks a popover control and waits until that many popover bodies are open. */
async function openPopover(control: HTMLElement, open = 1): Promise<void> {
    await userEvent.click(control);
    await waitFor(() => expect(document.querySelectorAll('.cdk-overlay-pane fd-popover-body').length).toBe(open));
}
const controls = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>('fd-popover-control > *')];

export const OpenSimple: Story = {
    name: 'Open: simple',
    tags: ['!autodocs'],
    render: Simple.render,
    play: ({ canvasElement }) => openPopover(controls(canvasElement)[0])
};
export const OpenHeaderFooter: Story = {
    name: 'Open: header and footer',
    tags: ['!autodocs'],
    render: Simple.render,
    play: ({ canvasElement }) => openPopover(controls(canvasElement)[2])
};
export const OpenNonDialog: Story = {
    name: 'Open: body roles',
    tags: ['!autodocs'],
    render: NonDialog.render,
    play: ({ canvasElement }) => openPopover(controls(canvasElement)[0])
};
export const OpenNested: Story = {
    name: 'Open: popover inside popover',
    tags: ['!autodocs'],
    render: Nested.render,
    play: async ({ canvasElement }) => {
        await openPopover(controls(canvasElement)[0]);
        await openPopover(controls(document.querySelector('.cdk-overlay-pane')!)[0], 2);
    }
};
export const OpenInDialog: Story = {
    name: 'Open: in a dialog',
    tags: ['!autodocs'],
    render: InDialog.render,
    play: async ({ canvasElement }) => {
        await userEvent.click(canvasElement.querySelector<HTMLElement>('button')!);
        const trigger = () => document.querySelector<HTMLElement>('[role=dialog] fd-popover-control button');
        await waitFor(() => expect(trigger()).not.toBeNull());
        await openPopover(trigger()!);
    }
};
export const OpenResizable: Story = {
    name: 'Open: resizable',
    tags: ['!autodocs'],
    render: Resizable.render,
    play: ({ canvasElement }) => openPopover(controls(canvasElement)[0])
};
export const OpenDropdown: Story = {
    name: 'Open: dropdown',
    tags: ['!autodocs'],
    render: Dropdown.render,
    play: ({ canvasElement }) => openPopover(controls(canvasElement)[2])
};
