import { JsonPipe } from '@angular/common';
import { Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import {
    FormControl as NgFormControl,
    FormGroup as NgFormGroup,
    FormsModule,
    ReactiveFormsModule
} from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { delay, of } from 'rxjs';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import {
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    DialogService,
    DialogTemplate,
    DialogTitle
} from '@/ui/dialog/dialog';
import { FormItem, FormLabel } from '@/ui/form/form';
import { ListByline, ListContent, ListTitle } from '@/ui/list/list';
import { SegmentedButton } from '@/ui/segmented-button/segmented-button';
import { Title } from '@/ui/title/title';
import { MultiCombobox, MultiComboboxTemplate } from './multi-combobox';

interface Food {
    id: string;
    name: string;
    type: 'Fruits' | 'Vegetables';
}

const FOOD: Food[] = [
    { id: 'apple', name: 'Apple', type: 'Fruits' },
    { id: 'banana', name: 'Banana', type: 'Fruits' },
    { id: 'blueberry', name: 'Blueberry', type: 'Fruits' },
    { id: 'dragon', name: 'Dragon Fruit', type: 'Fruits' },
    { id: 'pineapple', name: 'Pineapple', type: 'Fruits' },
    { id: 'strawberry', name: 'Strawberry', type: 'Fruits' },
    { id: 'broccoli', name: 'Broccoli', type: 'Vegetables' },
    { id: 'carrot', name: 'Carrot', type: 'Vegetables' },
    { id: 'jalapeno', name: 'Jalapeño', type: 'Vegetables' },
    { id: 'red-pepper', name: 'Red Pepper', type: 'Vegetables' },
    { id: 'spinach', name: 'Spinach', type: 'Vegetables' },
    { id: 'sweet-potato', name: 'Sweet Potato', type: 'Vegetables' }
];

const COUNTRIES = [
    'Argentina',
    'Australia',
    'Austria',
    'Belgium',
    'Brazil',
    'Canada',
    'Chile',
    'Denmark',
    'Finland',
    'France',
    'Germany',
    'Greece',
    'India',
    'Ireland',
    'Italy',
    'Japan',
    'Mexico',
    'Netherlands',
    'New Zealand',
    'Norway',
    'Portugal',
    'South Africa',
    'Spain',
    'Sweden',
    'United Kingdom',
    'United States'
];

const text = 'm-0 mt-1 block font-sap-font-family text-sap-font-small-size text-sap-content-label-color';

@Component({
    selector: 'story-multi-combobox-data',
    imports: [MultiCombobox, FormItem, FormLabel, JsonPipe, Button],
    template: `
        <div class="flex max-w-lg flex-col gap-4">
            <div fdFormItem>
                <label fdFormLabel for="mcb-1">Array of strings (matching anywhere, select all)</label>
                <fd-multi-combobox
                    inputId="mcb-1"
                    showSelectAll
                    matchingStrategy="contains"
                    placeholder="Type some text..."
                    [dataSource]="countries"
                    [(selectedItems)]="one"
                />
                <small class="${text}">Selected: {{ one() | json }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mcb-2">Array of objects (start of any word)</label>
                <fd-multi-combobox
                    inputId="mcb-2"
                    displayKey="name"
                    lookupKey="id"
                    placeholder="Type some text..."
                    [dataSource]="food"
                    [(selectedItems)]="two"
                />
                <small class="${text}">Selected: {{ ids(two()) }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mcb-3">Observable</label>
                <fd-multi-combobox
                    inputId="mcb-3"
                    displayKey="name"
                    lookupKey="id"
                    placeholder="Type some text..."
                    [dataSource]="food$"
                    [(selectedItems)]="three"
                />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mcb-4">Limitless: {{ limitless() }}</label>
                <fd-multi-combobox
                    inputId="mcb-4"
                    placeholder="Type some text..."
                    [limitless]="limitless()"
                    [dataSource]="countries"
                />
                <button
                    fdButton
                    class="mt-2 self-start"
                    label="Toggle limitless"
                    (click)="limitless.set(!limitless())"
                ></button>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mcb-5">"n more" link</label>
                <fd-multi-combobox
                    inputId="mcb-5"
                    placeholder="Type some text..."
                    [dataSource]="countries"
                    [(selectedItems)]="five"
                />
            </div>
        </div>
    `
})
class StoryMultiComboboxData {
    protected readonly countries = COUNTRIES;
    protected readonly food = FOOD;
    protected readonly food$ = of(FOOD).pipe(delay(500));
    protected readonly one = signal<string[]>(['Austria']);
    protected readonly two = signal<Food[]>([FOOD[1]]);
    protected readonly three = signal<Food[]>([]);
    protected readonly five = signal<string[]>(COUNTRIES.slice(0, 15));
    protected readonly limitless = signal(false);
    protected ids(items: Food[]): string {
        return items.map((i) => i.id).join(', ');
    }
}

@Component({
    selector: 'story-multi-combobox-layout',
    imports: [MultiCombobox, MultiComboboxTemplate, FormItem, FormLabel, ListContent, ListTitle, ListByline],
    template: `
        <div class="flex max-w-lg flex-col gap-4">
            <div fdFormItem>
                <label fdFormLabel for="mcb-group">Groups</label>
                <fd-multi-combobox
                    inputId="mcb-group"
                    group
                    groupKey="type"
                    displayKey="name"
                    lookupKey="id"
                    placeholder="Type some text..."
                    [dataSource]="food"
                />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mcb-columns">Two columns</label>
                <fd-multi-combobox
                    inputId="mcb-columns"
                    displayKey="name"
                    lookupKey="id"
                    secondaryKey="type"
                    showSecondaryText
                    placeholder="Type some text..."
                    [dataSource]="food"
                />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mcb-byline">Byline template</label>
                <fd-multi-combobox
                    inputId="mcb-byline"
                    byline
                    displayKey="name"
                    lookupKey="id"
                    bodyMaxWidth="container"
                    placeholder="Type some text..."
                    [dataSource]="food"
                >
                    <ng-template fdMultiComboboxTemplate="optionItemTemplate" let-item>
                        <div fdListContent>
                            <span fdListTitle>{{ item.name }}</span>
                            <span fdListByline>{{ item.type }}</span>
                        </div>
                    </ng-template>
                </fd-multi-combobox>
            </div>
        </div>
    `
})
class StoryMultiComboboxLayout {
    protected readonly food = FOOD;
}

@Component({
    selector: 'story-multi-combobox-states',
    imports: [MultiCombobox, FormItem, FormLabel],
    template: `
        <div class="flex max-w-lg flex-col gap-4">
            @for (state of states; track state.state) {
                <div fdFormItem>
                    <label fdFormLabel [for]="'mcb-state-' + state.state">{{ state.label }}</label>
                    <fd-multi-combobox
                        placeholder="Type some text..."
                        [inputId]="'mcb-state-' + state.state"
                        [state]="state.state"
                        [stateMessage]="state.message"
                        [dataSource]="countries"
                    />
                </div>
            }
            <div fdFormItem>
                <label fdFormLabel for="mcb-readonly">Read-only</label>
                <fd-multi-combobox
                    inputId="mcb-readonly"
                    readonly
                    [dataSource]="countries"
                    [selectedItems]="['Chile', 'Japan']"
                />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mcb-disabled">Disabled</label>
                <fd-multi-combobox
                    inputId="mcb-disabled"
                    disabled
                    [dataSource]="countries"
                    [selectedItems]="['Chile', 'Japan']"
                />
            </div>
        </div>
    `
})
class StoryMultiComboboxStates {
    protected readonly countries = COUNTRIES;
    protected readonly states = [
        { state: 'success', label: 'Success', message: 'Success message' },
        { state: 'warning', label: 'Warning', message: 'Warning message' },
        { state: 'error', label: 'Error', message: 'Error message' },
        { state: 'information', label: 'Information', message: 'Information message' }
    ] as const;
}

@Component({
    selector: 'story-multi-combobox-forms',
    imports: [MultiCombobox, FormItem, FormLabel, ReactiveFormsModule, JsonPipe, Button],
    template: `
        <form [formGroup]="form" class="flex max-w-lg flex-col gap-2">
            <div fdFormItem>
                <label fdFormLabel for="mcb-form">Reactive forms</label>
                <fd-multi-combobox
                    inputId="mcb-form"
                    displayKey="name"
                    lookupKey="id"
                    placeholder="Select items..."
                    formControlName="food"
                    [dataSource]="food"
                />
            </div>
            <small class="${text}">Form value: {{ names() }}, touched: {{ form.controls.food.touched }}</small>
            <div class="flex gap-2">
                <button fdButton type="button" label="Select all fruits" (click)="fruits()"></button>
                <button fdButton type="button" label="Clear" (click)="form.controls.food.setValue([])"></button>
            </div>
        </form>
    `
})
class StoryMultiComboboxForms {
    protected readonly food = FOOD;
    protected readonly form = new NgFormGroup({ food: new NgFormControl<Food[]>([FOOD[6]]) });
    protected fruits(): void {
        this.form.controls.food.setValue(FOOD.filter((f) => f.type === 'Fruits'));
    }
    protected names(): string {
        return (this.form.controls.food.value ?? []).map((f) => f.name).join(', ');
    }
}

@Component({
    selector: 'story-multi-combobox-mobile',
    imports: [MultiCombobox, FormItem, FormLabel, JsonPipe],
    template: `
        <div fdFormItem class="max-w-lg">
            <label fdFormLabel for="mcb-mobile">Countries</label>
            <fd-multi-combobox
                inputId="mcb-mobile"
                mobile
                showSelectAll
                placeholder="Type some text..."
                [mobileConfig]="{ title: 'Countries', approveButtonText: 'OK', cancelButtonText: 'Cancel' }"
                [dataSource]="countries"
                [(selectedItems)]="selected"
            />
            <small class="${text}">Selected: {{ selected() | json }}</small>
        </div>
    `
})
class StoryMultiComboboxMobile {
    protected readonly countries = COUNTRIES;
    protected readonly selected = signal<string[]>(['Norway']);
}

@Component({
    selector: 'story-multi-combobox-dynamic',
    imports: [MultiCombobox, FormItem, FormLabel, FormsModule, Button, SegmentedButton, JsonPipe],
    template: `
        <div class="flex max-w-lg flex-col gap-4">
            <p class="${text}">Active data set: {{ dataset() || 'loading...' }}</p>
            <fd-segmented-button ariaLabel="Data set" [ngModel]="dataset()" (ngModelChange)="switchTo($event)">
                <button fdButton label="Fruits" value="Fruits"></button>
                <button fdButton label="Vegetables" value="Vegetables"></button>
            </fd-segmented-button>
            <div fdFormItem>
                <label fdFormLabel for="mcb-dynamic">Search and select</label>
                <fd-multi-combobox
                    inputId="mcb-dynamic"
                    displayKey="name"
                    lookupKey="id"
                    placeholder="Type some text..."
                    [dataSource]="items()"
                    [(selectedItems)]="selected"
                />
                <small class="${text}">Selected: {{ names() | json }}</small>
            </div>
        </div>
    `
})
class StoryMultiComboboxDynamic {
    protected readonly items = signal<Food[]>([]);
    protected readonly dataset = signal<'' | Food['type']>('');
    protected readonly selected = signal<Food[]>([]);

    constructor() {
        // the first data set arrives later, like an HTTP response
        setTimeout(() => this.switchTo('Fruits'), 500);
    }

    protected switchTo(type: Food['type']): void {
        this.items.set(FOOD.filter((f) => f.type === type));
        this.dataset.set(type);
        this.selected.set([]);
    }

    protected names(): string[] {
        return this.selected().map((f) => f.name);
    }
}

@Component({
    selector: 'story-multi-combobox-dialog',
    imports: [
        MultiCombobox,
        FormItem,
        FormLabel,
        Button,
        ButtonBar,
        Dialog,
        DialogHeader,
        DialogBody,
        DialogFooter,
        DialogTemplate,
        DialogTitle,
        Title
    ],
    template: `
        <ng-template fdDialogTemplate let-dialog #tpl>
            <fd-dialog [dialogRef]="dialog">
                <fd-dialog-header>
                    <h1 fd-title fd-dialog-title>Multi combobox in a dialog</h1>
                </fd-dialog-header>
                <fd-dialog-body>
                    <div fdFormItem>
                        <label fdFormLabel for="mcb-dialog">Countries</label>
                        <fd-multi-combobox
                            inputId="mcb-dialog"
                            showSelectAll
                            placeholder="Type some text..."
                            [dataSource]="countries"
                            [(selectedItems)]="selected"
                        />
                    </div>
                    <p class="${text}">Selected: {{ selected().join(', ') || 'none' }}</p>
                </fd-dialog-body>
                <fd-dialog-footer>
                    <fd-button-bar variant="emphasized" label="Interested" (click)="dialog.close('Continue')" />
                    <fd-button-bar label="Cancel" (click)="dialog.dismiss('Cancel')" />
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>
        <button fdButton label="Open dialog" (click)="open()"></button>
        <p class="${text}">{{ reason() }}</p>
    `
})
class StoryMultiComboboxDialog {
    protected readonly countries = COUNTRIES;
    protected readonly selected = signal<string[]>([]);
    protected readonly reason = signal('');
    private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    private readonly dialogs = inject(DialogService);

    protected open(): void {
        this.dialogs.open(this.tpl(), { responsivePadding: true }).afterClosed.subscribe({
            next: (result) => this.reason.set(`Dialog closed with result: ${result}`),
            error: (reason) => this.reason.set(`Dialog dismissed with result: ${reason}`)
        });
    }
}

const meta: Meta<MultiCombobox> = {
    title: 'Components/Multi Combobox',
    component: MultiCombobox,
    decorators: [
        moduleMetadata({
            imports: [
                MultiCombobox,
                StoryMultiComboboxData,
                StoryMultiComboboxLayout,
                StoryMultiComboboxStates,
                StoryMultiComboboxForms,
                StoryMultiComboboxMobile,
                StoryMultiComboboxDynamic,
                StoryMultiComboboxDialog
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Chooses several items from an array or an observable; chosen items show as tokens. Typing filters the items (by default the start of any word); text that matches nothing is rejected with a brief error. ' +
                    'The focus stays in the input: Down and Up highlight options, Space toggles, Enter toggles and closes, Ctrl+A selects and Ctrl+Shift+A deselects all. ' +
                    'While closed, Down and Up put the next item in the input and Enter chooses it.'
            }
        }
    },
    argTypes: {
        state: { control: 'select', options: ['default', 'success', 'error', 'warning', 'information'] },
        matchingStrategy: { control: 'select', options: ['startsWithPerTerm', 'startsWith', 'contains'] }
    },
    args: {
        placeholder: 'Type a country...',
        ariaLabel: 'Countries',
        state: 'default',
        matchingStrategy: 'startsWithPerTerm',
        showSelectAll: false,
        disabled: false,
        readonly: false
    }
};
export default meta;
type Story = StoryObj<MultiCombobox>;

export const Playground: Story = {
    render: (args) => ({
        props: { ...args, countries: COUNTRIES },
        template: `<div class="max-w-lg"><fd-multi-combobox ${argsToTemplate(args)} [dataSource]="countries" /></div>`
    })
};

export const DataSources: Story = {
    name: 'Data sources',
    render: () => ({ template: `<story-multi-combobox-data />` })
};
export const Layout: Story = {
    name: 'Groups, columns and templates',
    render: () => ({ template: `<story-multi-combobox-layout />` })
};
export const States: Story = { render: () => ({ template: `<story-multi-combobox-states />` }) };
export const Forms: Story = { render: () => ({ template: `<story-multi-combobox-forms />` }) };
export const Mobile: Story = { render: () => ({ template: `<story-multi-combobox-mobile />` }) };
export const DynamicDataSource: Story = {
    name: 'Dynamic data source',
    render: () => ({ template: `<story-multi-combobox-dynamic />` })
};
export const InsideDialog: Story = {
    name: 'Inside a dialog',
    render: () => ({ template: `<story-multi-combobox-dialog />` })
};

/** Clicks the addon button of the multi-combobox with the input id and waits for the list (or dialog). */
async function openMultiCombobox(canvasElement: HTMLElement, inputId: string, popup: string): Promise<void> {
    const combobox = canvasElement.querySelector<HTMLElement>(`fd-multi-combobox:has(#${inputId})`)!;
    await userEvent.click(combobox.querySelector<HTMLElement>('button[aria-haspopup]')!);
    await waitFor(() => expect(document.querySelector(popup)).not.toBeNull());
    await waitFor(() => expect(combobox.querySelector('#' + inputId)!.getAttribute('aria-expanded')).toBe('true'));
}

export const OpenSelectAll: Story = {
    name: 'Open: select all',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-multi-combobox-data />` }),
    play: ({ canvasElement }) => openMultiCombobox(canvasElement, 'mcb-1', '[role=listbox] [role=option]')
};
export const OpenGroups: Story = {
    name: 'Open: groups',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-multi-combobox-layout />` }),
    play: ({ canvasElement }) => openMultiCombobox(canvasElement, 'mcb-group', '[role=listbox] [role=group]')
};
export const OpenColumns: Story = {
    name: 'Open: two columns',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-multi-combobox-layout />` }),
    play: ({ canvasElement }) => openMultiCombobox(canvasElement, 'mcb-columns', '[role=listbox] [role=option]')
};
export const OpenTemplate: Story = {
    name: 'Open: custom item template',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-multi-combobox-layout />` }),
    play: ({ canvasElement }) => openMultiCombobox(canvasElement, 'mcb-byline', '[role=listbox] [fdListByline]')
};
export const OpenState: Story = {
    name: 'Open: state message',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-multi-combobox-states />` }),
    play: ({ canvasElement }) => openMultiCombobox(canvasElement, 'mcb-state-error', '[role=listbox] [role=option]')
};
export const OpenInsideDialog: Story = {
    name: 'Open: inside a dialog',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-multi-combobox-dialog />` }),
    play: async ({ canvasElement }) => {
        await userEvent.click(canvasElement.querySelector<HTMLElement>('button')!);
        await waitFor(() => expect(document.querySelector('[role=dialog] fd-multi-combobox')).not.toBeNull());
        await openMultiCombobox(document.body, 'mcb-dialog', '[role=listbox] [role=option]');
    }
};
export const OpenMobile: Story = {
    name: 'Open: mobile',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-multi-combobox-mobile />` }),
    play: ({ canvasElement }) =>
        openMultiCombobox(canvasElement, 'mcb-mobile', '[role=dialog] [role=listbox] [role=option]')
};
