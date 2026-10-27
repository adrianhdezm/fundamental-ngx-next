import { Component, TemplateRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { BarElement, BarLeft, BarMiddle, BarRight, ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { Checkbox } from '@/ui/checkbox/checkbox';
import { FormGroup, FormItem, FormLabel } from '@/ui/form/form';
import { FormControl } from '@/ui/input/input';
import { LayoutGrid, LayoutGridCol } from '@/ui/layout-grid/layout-grid';
import { List, ListItem, ListSecondary, ListTitle } from '@/ui/list/list';
import { MultiInput } from '@/ui/multi-input/multi-input';
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

/** A form in a dialog: labelled fields in a layout grid, required markers and the paddings as options. */
@Component({
    selector: 'story-dialog-form',
    imports: [...DIALOG, Checkbox, FormControl, FormGroup, FormItem, FormLabel, LayoutGrid, LayoutGridCol],
    providers: [DialogService],
    host: { class: 'flex flex-wrap items-center gap-4' },
    template: `
        <ng-template fdDialogTemplate let-dialog let-dialogConfig="dialogConfig" #tpl>
            <fd-dialog [dialogRef]="dialog" [dialogConfig]="dialogConfig">
                <fd-dialog-header>
                    <h1 fd-title id="story-dialog-form-title">The History of Pineapple</h1>
                </fd-dialog-header>
                <fd-dialog-body>
                    <fd-form-group>
                        <div fdFormItem>
                            <label fdFormLabel for="story-dialog-form-name" colon>Name</label>
                            <input
                                fdFormControl
                                id="story-dialog-form-name"
                                placeholder="Enter first and last name"
                                value="Amelia Perry"
                            />
                        </div>
                        <div fdFormItem>
                            <label fdFormLabel for="story-dialog-form-street" required colon>Street/No.</label>
                            <fd-layout-grid>
                                <div fdLayoutGridCol="8">
                                    <input
                                        fdFormControl
                                        id="story-dialog-form-street"
                                        required
                                        placeholder="Enter address"
                                        value="Myrtle St."
                                    />
                                </div>
                                <div fdLayoutGridCol="4">
                                    <input
                                        fdFormControl
                                        aria-label="Street number"
                                        required
                                        placeholder="Enter street number"
                                        value="495"
                                    />
                                </div>
                            </fd-layout-grid>
                        </div>
                        <div fdFormItem>
                            <label fdFormLabel for="story-dialog-form-zip" required colon>ZIP Code/City</label>
                            <fd-layout-grid>
                                <div fdLayoutGridCol="4">
                                    <input
                                        fdFormControl
                                        id="story-dialog-form-zip"
                                        required
                                        placeholder="Enter ZIP code"
                                        value="43823"
                                    />
                                </div>
                                <div fdLayoutGridCol="8">
                                    <input
                                        fdFormControl
                                        aria-label="City"
                                        required
                                        placeholder="Enter city"
                                        value="Downtown"
                                    />
                                </div>
                            </fd-layout-grid>
                        </div>
                        <div fdFormItem>
                            <label fdFormLabel for="story-dialog-form-bio" colon>Bio</label>
                            <textarea fdFormControl id="story-dialog-form-bio" rows="3">
Grows pineapples on the balcony.</textarea>
                        </div>
                    </fd-form-group>
                </fd-dialog-body>
                <fd-dialog-footer>
                    <fd-button-bar variant="emphasized" label="Save" (click)="dialog.close('Save')" />
                    <fd-button-bar label="Cancel" (click)="dialog.dismiss('Cancel')" />
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>
        <fd-checkbox
            label="Responsive padding"
            [value]="responsivePadding()"
            (valueChange)="responsivePadding.set(!!$event)"
        />
        <fd-checkbox
            label="Vertical padding"
            [value]="verticalPadding()"
            (valueChange)="verticalPadding.set(!!$event)"
        />
        <button fdButton label="Open form" (click)="open()"></button>
        <p class="m-0 w-full font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">
            {{ status() }}
        </p>
    `
})
class StoryDialogForm {
    private readonly dialogs = inject(DialogService);
    private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    protected readonly responsivePadding = signal(false);
    protected readonly verticalPadding = signal(true);
    protected readonly status = signal('');
    protected open(): void {
        const ref = this.dialogs.open(this.tpl(), {
            width: '30rem',
            responsivePadding: this.responsivePadding(),
            verticalPadding: this.verticalPadding(),
            ariaLabelledBy: 'story-dialog-form-title'
        });
        result(ref, (text) => this.status.set(text));
    }
}

interface StoryOption {
    name: string;
}

/** A dialog with two multi inputs: their lists open in popovers above the dialog. */
@Component({
    imports: [...DIALOG, FormItem, FormLabel, MultiInput],
    template: `
        <fd-dialog>
            <fd-dialog-header>
                <h1 fd-title fd-dialog-title>{{ ref.data.title }}</h1>
            </fd-dialog-header>
            <fd-dialog-body>
                <div class="flex flex-col gap-4">
                    <div fdFormItem>
                        <label fdFormLabel for="story-dialog-first-list">The first list of options</label>
                        <fd-multi-input
                            inputId="story-dialog-first-list"
                            placeholder="Search here..."
                            [dropdownValues]="ref.data.first"
                            [displayFn]="display"
                            [(selected)]="first"
                        />
                    </div>
                    <div fdFormItem>
                        <label fdFormLabel for="story-dialog-second-list">The second list of options</label>
                        <fd-multi-input
                            inputId="story-dialog-second-list"
                            placeholder="Search here..."
                            [dropdownValues]="ref.data.second"
                            [displayFn]="display"
                            [(selected)]="second"
                        />
                    </div>
                </div>
            </fd-dialog-body>
            <fd-dialog-footer>
                <fd-button-bar variant="emphasized" label="Interesting" (click)="ref.close('Interesting')" />
                <fd-button-bar label="Cancel" (click)="ref.dismiss('Cancel')" />
            </fd-dialog-footer>
        </fd-dialog>
    `
})
class StoryDialogPopoverContent {
    protected readonly ref =
        inject<DialogRef<{ title: string; first: StoryOption[]; second: StoryOption[] }>>(DialogRef);
    protected readonly first = signal<unknown[]>([]);
    protected readonly second = signal<unknown[]>([]);
    protected readonly display = (option: StoryOption) => option?.name ?? '';
}

@Component({
    selector: 'story-dialog-inner-popover',
    imports: [Button],
    providers: [DialogService],
    template: `
        <button fdButton label="Open from component" (click)="open()"></button>
        <p class="font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">{{ status() }}</p>
    `
})
class StoryDialogInnerPopover {
    private readonly dialogs = inject(DialogService);
    protected readonly status = signal('');
    protected open(): void {
        const names = (list: string) => list.split(', ').map((name) => ({ name }));
        const ref = this.dialogs.open(StoryDialogPopoverContent, {
            data: {
                title: 'Pineapple Fun Facts',
                first: names(
                    'Photo Voltaic, Settings, Heating Cooling, Competitor, Chalkboard, Database, Passenger Train, World, Shield, Journey Change'
                ),
                second: names('Apple, Tomato, Banana, Grapes, Pumpkin, Kiwi, Mango, Cucumber, Garlic, Pear')
            },
            width: '25rem',
            responsivePadding: true
        });
        result(ref, (text) => this.status.set(text));
    }
}

/** Options of the playground dialog. */
interface PlaygroundArgs {
    width: string;
    draggable: boolean;
    resizable: boolean;
    mobile: boolean;
    backdropClickCloseable: boolean;
    escKeyCloseable: boolean;
    hasBackdrop: boolean;
    verticalPadding: boolean;
    responsivePadding: boolean;
}

@Component({
    selector: 'story-dialog-playground',
    imports: DIALOG,
    providers: [DialogService],
    template: `
        <ng-template fdDialogTemplate let-dialog let-dialogConfig="dialogConfig" #tpl>
            <fd-dialog [dialogRef]="dialog" [dialogConfig]="dialogConfig">
                <fd-dialog-header>
                    <h1 fd-title fd-dialog-title>Playground Dialog</h1>
                    <button fd-dialog-close-button title="Close" (click)="dialog.dismiss('Close button')"></button>
                </fd-dialog-header>
                <fd-dialog-body>This is the dialog playground body text.</fd-dialog-body>
                <fd-dialog-footer>
                    <fd-button-bar variant="emphasized" label="Save" (click)="dialog.close('Save')" />
                    <fd-button-bar label="Cancel" (click)="dialog.dismiss('Cancel')" />
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>
        <button fdButton label="Open dialog" (click)="open()"></button>
        <p class="font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">{{ status() }}</p>
    `
})
class StoryDialogPlayground {
    readonly options = input<Partial<PlaygroundArgs>>({});
    private readonly dialogs = inject(DialogService);
    private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    protected readonly status = signal('');
    protected open(): void {
        const { width, ...flags } = this.options();
        const ref = this.dialogs.open(this.tpl(), { ...flags, width: width || undefined });
        result(ref, (text) => this.status.set(text));
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
                StoryDialogBackdrop,
                StoryDialogForm,
                StoryDialogInnerPopover,
                StoryDialogPlayground
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

export const Form: Story = {
    name: 'Form',
    render: () => ({ template: `<story-dialog-form />` })
};

export const InnerPopovers: Story = {
    name: 'Inner popovers',
    parameters: {
        docs: { description: { story: 'The lists of the multi inputs open in popovers above the dialog.' } }
    },
    render: () => ({ template: `<story-dialog-inner-popover />` })
};

export const Playground: StoryObj<PlaygroundArgs> = {
    args: {
        width: '25rem',
        draggable: false,
        resizable: false,
        mobile: false,
        backdropClickCloseable: true,
        escKeyCloseable: true,
        hasBackdrop: true,
        verticalPadding: true,
        responsivePadding: false
    },
    argTypes: { width: { control: 'text' } },
    render: (args) => ({ props: { options: args }, template: `<story-dialog-playground [options]="options" />` })
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
export const OpenInnerPopover: Story = {
    name: 'Open: inner popover',
    tags: ['!autodocs'],
    render: InnerPopovers.render,
    play: async ({ canvasElement }) => {
        await openDialog(canvasElement, 'Open from component');
        const field = document.querySelector<HTMLElement>('#story-dialog-first-list')!.closest('fd-multi-input')!;
        await userEvent.click(field.querySelector<HTMLElement>('button[aria-haspopup]')!);
        await waitFor(() => expect(document.querySelector('[role=listbox] [role=option]')).not.toBeNull());
        // the list is above the dialog
        const option = document.querySelector<HTMLElement>('[role=listbox] [role=option]')!.getBoundingClientRect();
        const hit = document.elementFromPoint(option.left + option.width / 2, option.top + option.height / 2);
        expect(hit?.closest('[role=listbox]')).not.toBeNull();
    }
};
export const OpenForm: Story = {
    name: 'Open: form',
    tags: ['!autodocs'],
    render: Form.render,
    play: ({ canvasElement }) => openDialog(canvasElement, 'Open form')
};
export const OpenPlayground: StoryObj<PlaygroundArgs> = {
    name: 'Open: playground',
    tags: ['!autodocs'],
    args: Playground.args,
    render: Playground.render,
    play: ({ canvasElement }) => openDialog(canvasElement, 'Open dialog')
};
