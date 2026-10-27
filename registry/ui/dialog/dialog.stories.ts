import { Component, TemplateRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { BarElement, BarLeft, BarMiddle, BarRight, ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { FormControl } from '@/ui/input/input';
import { List, ListItem, ListSecondary, ListTitle } from '@/ui/list/list';
import { Title } from '@/ui/title/title';
import {
    Dialog,
    DialogBody,
    DialogCloseButton,
    DialogFooter,
    DialogFullScreenTogglerButton,
    DialogHeader,
    DialogRef,
    DialogService,
    DialogSubheader,
    DialogTemplate,
    DialogTitle,
    type DialogConfig,
    type DialogDefaultContent
} from './dialog';

const DIALOG = [
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogSubheader,
    DialogTitle,
    DialogTemplate,
    DialogCloseButton,
    DialogFullScreenTogglerButton,
    Title,
    ButtonBar,
    Button
];

const PINEAPPLE = `The pineapple (Ananas comosus) is a tropical plant with an edible fruit and the most economically
significant plant in the family Bromeliaceae. The pineapple is indigenous to South America, where it has been
cultivated for many centuries. The introduction of the pineapple to Europe in the 17th century made it a significant
cultural icon of luxury.`;

const FACTS = [
    'You can grow your own pineapple by planting the top of the pineapple in soil',
    'Pulling leaves from a pineapple is not an indication of ripeness',
    'A pineapple cannot continue to ripen after it has been picked',
    'One of the ways you can tell if a pineapple is ripe is by smelling it'
];

function result(ref: DialogRef, set: (text: string) => void): void {
    ref.afterClosed.subscribe({
        next: (value) => set(`Dialog closed with result: ${value}`),
        error: (reason) => set(`Dialog dismissed with result: ${reason}`)
    });
}

/** Template-based dialogs, also used for configuration, position, mobile and state examples. */
@Component({
    selector: 'story-dialog-template',
    imports: DIALOG,
    providers: [DialogService],
    host: { class: 'flex flex-wrap items-center gap-2' },
    template: `
        <ng-template fdDialogTemplate let-dialog let-dialogConfig="dialogConfig" #tpl>
            <fd-dialog [dialogRef]="dialog" [dialogConfig]="dialogConfig">
                <fd-dialog-header>
                    <h1 fd-title fd-dialog-title>{{ heading() }}</h1>
                    @if (dialogConfig.resizable) {
                        <button
                            fd-dialog-full-screen-toggler-button
                            [dialogRef]="dialog"
                            (click)="dialog.toggleFullScreen()"
                        ></button>
                    }
                    <button fd-dialog-close-button title="Close" (click)="dialog.dismiss('Close button')"></button>
                </fd-dialog-header>
                <fd-dialog-body>
                    <p class="m-0" [id]="bodyId">{{ dialog.data ?? text }}</p>
                </fd-dialog-body>
                <fd-dialog-footer>
                    <fd-button-bar variant="emphasized" label="Interested" (click)="dialog.close('Continue')" />
                    <fd-button-bar label="Cancel" (click)="dialog.dismiss('Cancel')" />
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>
        @for (action of actions(); track action.label) {
            <button fdButton [label]="action.label" (click)="open(action.config, action.after)"></button>
        }
        <p class="m-0 w-full font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">
            {{ status() }}
        </p>
    `
})
class StoryDialogTemplate {
    readonly kind = input<'basic' | 'configuration' | 'position' | 'mobile' | 'state'>('basic');
    protected readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    protected readonly dialogs = inject(DialogService);
    protected readonly status = signal('');
    protected readonly bodyId = 'story-dialog-body';
    protected readonly text = PINEAPPLE;
    protected readonly heading = computed(() =>
        this.kind() === 'basic' ? 'The History of Pineapple' : 'Origin of the Pineapple Word'
    );

    protected readonly actions = computed<{ label: string; config: DialogConfig; after?: (ref: DialogRef) => void }[]>(
        () => {
            const base: DialogConfig = { width: '25rem', responsivePadding: true, ariaDescribedBy: this.bodyId };
            switch (this.kind()) {
                case 'configuration':
                    return [
                        {
                            label: 'Open draggable dialog',
                            config: { ...base, draggable: true, backdropClickCloseable: true }
                        },
                        {
                            label: 'Open resizable dialog',
                            config: { ...base, resizable: true, backdropClickCloseable: true }
                        },
                        {
                            label: 'Open dialog closable only with its buttons',
                            config: { ...base, escKeyCloseable: false }
                        }
                    ];
                case 'position':
                    return [
                        {
                            label: 'Open in bottom right',
                            config: { ...base, position: { bottom: '6rem', right: '6rem' } }
                        }
                    ];
                case 'mobile':
                    return [
                        {
                            label: 'Open in mobile mode',
                            config: { ...base, width: undefined, mobile: true, contentDensity: 'cozy' }
                        }
                    ];
                case 'state':
                    return [
                        {
                            label: 'Open self closing dialog',
                            config: { ...base, data: 'This dialog will be closed after 4s.' },
                            after: (ref) => setTimeout(() => ref.close('timeout'), 4000)
                        },
                        {
                            label: 'Open self dismissing dialog',
                            config: { ...base, data: 'This dialog will be dismissed after 4s.' },
                            after: (ref) => setTimeout(() => ref.dismiss('timeout'), 4000)
                        },
                        {
                            label: 'Open self hiding dialog',
                            config: { ...base, data: 'This dialog will be hidden for 2s after 2s.' },
                            after: (ref) => {
                                setTimeout(() => ref.hide(true), 2000);
                                setTimeout(() => ref.hide(false), 4000);
                            }
                        },
                        {
                            label: 'Open loading dialog',
                            config: { ...base, data: 'Loading the details.' },
                            after: (ref) =>
                                ref.loading({
                                    isLoading: true,
                                    loadingLabel: 'Loading',
                                    loadingContent: 'Now loading data from a far, far away server.'
                                })
                        }
                    ];
                default:
                    return [{ label: 'Open from template', config: { ...base, width: undefined } }];
            }
        }
    );

    protected open(config: DialogConfig, after?: (ref: DialogRef) => void): void {
        const ref = this.dialogs.open(this.tpl(), config);
        result(ref, (text) => this.status.set(text));
        after?.(ref);
    }
}

/** A dialog component opened by the service; it injects its DialogRef. */
@Component({
    imports: DIALOG,
    template: `
        <fd-dialog>
            <fd-dialog-header>
                <h1 fd-title fd-dialog-title>{{ ref.data.title }}</h1>
                <button
                    fd-dialog-full-screen-toggler-button
                    [title]="ref.isFullScreen() ? 'Exit full-screen mode' : 'Enter full-screen mode'"
                    (click)="ref.toggleFullScreen()"
                ></button>
            </fd-dialog-header>
            <fd-dialog-body>
                <p class="m-0 text-justify" id="story-dialog-c-body">${PINEAPPLE}</p>
                <ul class="mb-0 list-disc ps-6">
                    @for (fact of facts; track fact) {
                        <li>{{ fact }}</li>
                    }
                </ul>
            </fd-dialog-body>
            <fd-dialog-footer>
                <fd-button-bar variant="emphasized" label="Interesting" (click)="ref.close('Continue')" />
                <fd-button-bar label="Open another dialog" (click)="openSecond()" />
                <fd-button-bar label="Cancel" (click)="ref.dismiss('Cancel')" />
            </fd-dialog-footer>
        </fd-dialog>
    `
})
class StoryDialogContent {
    protected readonly ref = inject<DialogRef<{ title: string }>>(DialogRef);
    private readonly service = inject(DialogService);
    protected readonly facts = FACTS;
    protected openSecond(): void {
        this.service.open(StorySecondDialog, { responsivePadding: true });
    }
}

@Component({
    imports: DIALOG,
    template: `
        <fd-dialog>
            <fd-dialog-header>
                <h1 fd-title fd-dialog-title>Second dialog</h1>
                <button fd-dialog-close-button title="Close" (click)="ref.dismiss()"></button>
            </fd-dialog-header>
            <fd-dialog-body>
                This is the second dialog. It is independent from the first one; only one block layer dims the page.
            </fd-dialog-body>
            <fd-dialog-footer>
                <fd-button-bar variant="emphasized" label="Close" (click)="ref.close()" />
            </fd-dialog-footer>
        </fd-dialog>
    `
})
class StorySecondDialog {
    protected readonly ref = inject(DialogRef);
}

@Component({
    selector: 'story-dialog-component',
    imports: [Button],
    providers: [DialogService],
    template: `
        <button fdButton label="Open from component" (click)="open()"></button>
        <p class="font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">{{ status() }}</p>
    `
})
class StoryDialogComponent {
    private readonly dialogs = inject(DialogService);
    protected readonly status = signal('');
    protected open(): void {
        const ref = this.dialogs.open(StoryDialogContent, {
            data: { title: 'Pineapple Fun Facts' },
            width: '25rem',
            ariaDescribedBy: 'story-dialog-c-body',
            responsivePadding: true,
            draggable: true,
            resizable: true
        });
        result(ref, (text) => this.status.set(text));
    }
}

/** A dialog built from an object: title, close and full-screen buttons, subheader, body and footer buttons. */
@Component({
    selector: 'story-dialog-object',
    imports: [Button, BarMiddle, BarElement, FormControl],
    providers: [DialogService],
    template: `
        <button fdButton label="Open dialog from object" (click)="open()"></button>
        <ng-template #content>
            <p class="m-0">You can also create a dialog without building the whole template.</p>
        </ng-template>
        <ng-template #subHeader>
            <div fd-bar-middle>
                <fd-bar-element fullWidth>
                    <input fdFormControl type="search" placeholder="Search" aria-label="Search" />
                </fd-bar-element>
            </div>
        </ng-template>
        <p class="font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">{{ status() }}</p>
    `
})
class StoryDialogObject {
    private readonly dialogs = inject(DialogService);
    private readonly content = viewChild.required<TemplateRef<unknown>>('content');
    private readonly subHeader = viewChild.required<TemplateRef<unknown>>('subHeader');
    protected readonly status = signal('');
    protected open(): void {
        let ref: DialogRef;
        const content: DialogDefaultContent = {
            title: 'Dialog title',
            content: this.content(),
            subHeader: this.subHeader(),
            approveButton: 'OK',
            approveButtonCallback: () => ref.close('Approved'),
            cancelButton: 'Cancel',
            cancelButtonCallback: () => ref.close('Canceled'),
            closeButtonCallback: () => ref.dismiss('Dismissed'),
            closeButtonTitle: 'Close',
            allowFullScreen: true,
            fullScreenButtonCallback: () => ref.toggleFullScreen(),
            fullScreenExpandButtonText: 'Enter full-screen mode',
            fullScreenMinifyButtonText: 'Exit full-screen mode'
        };
        ref = this.dialogs.open(content, { width: '25rem', resizable: true, draggable: true });
        result(ref, (text) => this.status.set(text));
    }
}

interface Fruit {
    id: number;
    name: string;
    price: number;
}

/** A custom header and footer with their own bar areas, a subheader search field and a list body. */
@Component({
    selector: 'story-dialog-complex',
    imports: [
        ...DIALOG,
        BarLeft,
        BarRight,
        BarMiddle,
        BarElement,
        FormControl,
        List,
        ListItem,
        ListTitle,
        ListSecondary
    ],
    providers: [DialogService],
    template: `
        <ng-template fdDialogTemplate let-dialog #tpl>
            <fd-dialog>
                <fd-dialog-header>
                    <div fd-bar-left>
                        <fd-bar-element><h1 fd-title fd-dialog-title>Fresh Market</h1></fd-bar-element>
                    </div>
                    <div fd-bar-right>
                        <fd-button-bar label="Clear" (click)="clear()" />
                    </div>
                    <div fdDialogSubheader>
                        <div fd-bar-middle>
                            <fd-bar-element fullWidth>
                                <input
                                    fdFormControl
                                    cdkFocusInitial
                                    type="search"
                                    placeholder="Search"
                                    aria-label="Search produce"
                                    [value]="search()"
                                    (input)="search.set($any($event.target).value)"
                                />
                            </fd-bar-element>
                        </div>
                    </div>
                </fd-dialog-header>
                <fd-dialog-body disablePaddings>
                    <ul fd-list selection noBorder aria-label="Produce">
                        @for (fruit of filtered(); track fruit.id) {
                            <li fd-list-item [selected]="selected().has(fruit.id)" (click)="toggle(fruit)">
                                <span fd-list-title>{{ fruit.name }}</span>
                                <span fd-list-secondary>{{ fruit.price }} €</span>
                            </li>
                        }
                    </ul>
                </fd-dialog-body>
                <fd-dialog-footer>
                    <div fd-bar-left>
                        <fd-bar-element>Total price: {{ total() }} €</fd-bar-element>
                    </div>
                    <div fd-bar-right>
                        <fd-button-bar
                            glyph="cart"
                            variant="emphasized"
                            label="Checkout"
                            (click)="dialog.close(total())"
                        />
                    </div>
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>
        <button fdButton label="Open with custom header and footer" (click)="open()"></button>
    `
})
class StoryDialogComplex {
    private readonly dialogs = inject(DialogService);
    private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    protected readonly search = signal('');
    protected readonly selected = signal(new Set<number>());
    private readonly fruits: Fruit[] = [
        { id: 1, name: 'Pineapple', price: 3 },
        { id: 2, name: 'Orange', price: 1 },
        { id: 3, name: 'Banana', price: 2 },
        { id: 4, name: 'Kiwi', price: 2 },
        { id: 5, name: 'Mango', price: 4 },
        { id: 6, name: 'Strawberries', price: 5 }
    ];
    protected readonly filtered = computed(() =>
        this.fruits.filter((f) => f.name.toLowerCase().includes(this.search().toLowerCase()))
    );
    protected readonly total = computed(() =>
        this.fruits.filter((f) => this.selected().has(f.id)).reduce((sum, f) => sum + f.price, 0)
    );
    protected toggle(fruit: Fruit): void {
        const next = new Set(this.selected());
        if (!next.delete(fruit.id)) next.add(fruit.id);
        this.selected.set(next);
    }
    protected clear(): void {
        this.search.set('');
        this.selected.set(new Set());
    }
    protected open(): void {
        this.dialogs.open(this.tpl(), { width: '24rem', height: '28rem', responsivePadding: true });
    }
}

/** Custom backdrop, a dialog rendered in a local container and a dialog without backdrop in the page flow. */
@Component({
    selector: 'story-dialog-backdrop',
    imports: DIALOG,
    providers: [DialogService],
    template: `
        <ng-template fdDialogTemplate let-dialog let-dialogConfig="dialogConfig" #tpl>
            <fd-dialog [dialogRef]="dialog" [dialogConfig]="dialogConfig">
                <fd-dialog-header>
                    <h1 fd-title fd-dialog-title>Backdrop configuration</h1>
                    <button fd-dialog-close-button title="Close" (click)="dialog.dismiss()"></button>
                </fd-dialog-header>
                <fd-dialog-body>{{ dialog.data }}</fd-dialog-body>
                <fd-dialog-footer>
                    <fd-button-bar variant="emphasized" label="Close" (click)="dialog.close()" />
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>
        <div class="flex flex-wrap gap-2">
            <button fdButton label="Custom backdrop" (click)="custom()"></button>
            <button fdButton label="Custom container" (click)="inContainer(container)"></button>
            <button fdButton label="Static dialog" (click)="static(container)"></button>
        </div>
        <div #container class="mt-2"></div>
    `
})
class StoryDialogBackdrop {
    private readonly dialogs = inject(DialogService);
    private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    protected custom(): void {
        this.dialogs.open(this.tpl(), {
            width: '20rem',
            backdropClass: 'before:bg-sap-information-background before:opacity-90',
            data: 'This dialog has a custom backdrop.'
        });
    }
    protected inContainer(container: HTMLElement): void {
        this.dialogs.open(this.tpl(), {
            width: '20rem',
            container,
            data: 'This dialog has been opened inside a local div.'
        });
    }
    protected static(container: HTMLElement): void {
        this.dialogs.open(this.tpl(), {
            width: '20rem',
            hasBackdrop: false,
            container,
            focusTrapped: false,
            data: 'This dialog is in a local div without backdrop, as a static element.'
        });
    }
}

const meta: Meta<Dialog> = {
    title: 'Components/Dialog',
    component: Dialog,
    decorators: [
        moduleMetadata({
            imports: [
                StoryDialogTemplate,
                StoryDialogComponent,
                StoryDialogObject,
                StoryDialogComplex,
                StoryDialogBackdrop
            ]
        })
    ],
    parameters: {
        docs: {
            story: { inline: false, iframeHeight: 520 },
            description: {
                component:
                    'A dialog interrupts the current task in a modal window. Open it with the `DialogService` from a template, a component or a `DialogDefaultContent` object; ' +
                    'it traps the focus, closes on Escape (and optionally on a backdrop click) and restores the focus when it closes. ' +
                    '`afterClosed` emits the `close()` result and errors with the `dismiss()` reason. Dialogs can be draggable, resizable, full screen, mobile, positioned, stacked, hidden and loading.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Dialog>;

export const TemplateBased: Story = {
    name: 'Template-based dialog',
    render: () => ({ template: `<story-dialog-template />` })
};

export const ComponentBased: Story = {
    name: 'Component-based dialog (draggable, resizable, full screen, stacked)',
    render: () => ({ template: `<story-dialog-component />` })
};

export const ObjectBased: Story = {
    name: 'Dialog from an object',
    render: () => ({ template: `<story-dialog-object />` })
};

export const Configuration: Story = {
    name: 'Configuration',
    render: () => ({ template: `<story-dialog-template kind="configuration" />` })
};

export const Complex: Story = {
    name: 'Custom header, subheader and footer',
    render: () => ({ template: `<story-dialog-complex />` })
};

export const Position: Story = {
    name: 'Position',
    render: () => ({ template: `<story-dialog-template kind="position" />` })
};

export const Mobile: Story = {
    name: 'Mobile',
    render: () => ({ template: `<story-dialog-template kind="mobile" />` })
};

export const States: Story = {
    name: 'Closing, dismissing, hiding and loading',
    render: () => ({ template: `<story-dialog-template kind="state" />` })
};

export const Backdrop: Story = {
    name: 'Backdrop and container',
    render: () => ({ template: `<story-dialog-backdrop />` })
};

/** Clicks the button with this label and waits until the dialog has faded in. */
async function openDialog(canvasElement: HTMLElement, label: string): Promise<void> {
    const button = [...canvasElement.querySelectorAll<HTMLElement>('button')].find(
        (b) => b.textContent!.trim() === label
    )!;
    await userEvent.click(button);
    await waitFor(() => expect(document.querySelectorAll('fd-dialog-container [role=dialog]')).toHaveLength(1));
    const containers = [...document.querySelectorAll<HTMLElement>('fd-dialog-container')];
    await Promise.all(containers.flatMap((c) => c.getAnimations().map((a) => a.finished)));
}

export const OpenTemplate: Story = {
    name: 'Open: template',
    tags: ['!autodocs'],
    render: TemplateBased.render,
    play: ({ canvasElement }) => openDialog(canvasElement, 'Open from template')
};
export const OpenComponent: Story = {
    name: 'Open: component',
    tags: ['!autodocs'],
    render: ComponentBased.render,
    play: ({ canvasElement }) => openDialog(canvasElement, 'Open from component')
};
export const OpenObject: Story = {
    name: 'Open: object',
    tags: ['!autodocs'],
    render: ObjectBased.render,
    play: ({ canvasElement }) => openDialog(canvasElement, 'Open dialog from object')
};
export const OpenComplex: Story = {
    name: 'Open: custom header and footer',
    tags: ['!autodocs'],
    render: Complex.render,
    play: ({ canvasElement }) => openDialog(canvasElement, 'Open with custom header and footer')
};
export const OpenLoading: Story = {
    name: 'Open: loading',
    tags: ['!autodocs'],
    render: States.render,
    play: ({ canvasElement }) => openDialog(canvasElement, 'Open loading dialog')
};
export const OpenPosition: Story = {
    name: 'Open: position',
    tags: ['!autodocs'],
    render: Position.render,
    play: ({ canvasElement }) => openDialog(canvasElement, 'Open in bottom right')
};
export const OpenMobile: Story = {
    name: 'Open: mobile',
    tags: ['!autodocs'],
    render: Mobile.render,
    play: ({ canvasElement }) => openDialog(canvasElement, 'Open in mobile mode')
};
