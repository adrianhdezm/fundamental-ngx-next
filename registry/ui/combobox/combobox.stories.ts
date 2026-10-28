import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import {
    FormControl as NgFormControl,
    FormGroup as NgFormGroup,
    FormsModule,
    ReactiveFormsModule
} from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { of } from 'rxjs';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ButtonBar } from '@/ui/bar/bar';
import { Button } from '@/ui/button/button';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
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
import { FormMessage } from '@/ui/form/form-message';
import { Icon } from '@/ui/icon/icon';
import {
    ListByline,
    ListContent,
    ListIcon,
    ListMessage,
    ListSecondary,
    ListThumbnail,
    ListTitle
} from '@/ui/list/list';
import { Title } from '@/ui/title/title';
import { Combobox, ComboboxItemTemplate, type ComboboxGroupFunction } from './combobox';

const FRUITS = [
    'Apple',
    'Apricot',
    'Banana',
    'Blueberry',
    'Cherry',
    'Grape',
    'Kiwi',
    'Lemon',
    'Mango',
    'Orange',
    'Papaya',
    'Pineapple',
    'Raspberry',
    'Strawberry',
    'Watermelon'
];

interface Product {
    id: string;
    name: string;
    type: 'Fruit' | 'Vegetable';
    price: string;
    icon: string;
}

const PRODUCTS: Product[] = [
    { id: 'A1', name: 'Apple', type: 'Fruit', price: '2.50 EUR', icon: 'nutrition-activity' },
    { id: 'B2', name: 'Banana', type: 'Fruit', price: '1.20 EUR', icon: 'nutrition-activity' },
    { id: 'P3', name: 'Pineapple', type: 'Fruit', price: '3.90 EUR', icon: 'nutrition-activity' },
    { id: 'B4', name: 'Broccoli', type: 'Vegetable', price: '1.80 EUR', icon: 'e-care' },
    { id: 'C5', name: 'Carrot', type: 'Vegetable', price: '0.90 EUR', icon: 'e-care' },
    { id: 'S6', name: 'Spinach', type: 'Vegetable', price: '2.10 EUR', icon: 'e-care' }
];

const text = 'm-0 mt-1 block font-sap-font-family text-sap-font-small-size text-sap-content-label-color';

@Component({
    selector: 'story-combobox-standard',
    imports: [Combobox, FormItem, FormLabel, FormsModule, ContentDensityDirective],
    template: `
        <div class="flex max-w-lg flex-col gap-4">
            <div fdFormItem>
                <label fdFormLabel for="cb-1">Standard with custom width (in px)</label>
                <fd-combobox
                    inputId="cb-1"
                    width="300px"
                    maxHeight="250px"
                    placeholder="Type some text..."
                    [dropdownValues]="fruits"
                    [(ngModel)]="one"
                />
                <small class="${text}">Search term: {{ one() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-2">Disable highlighting</label>
                <fd-combobox
                    inputId="cb-2"
                    placeholder="Type some text..."
                    [highlighting]="false"
                    [dropdownValues]="fruits"
                    [(ngModel)]="two"
                />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-3">Disable auto complete</label>
                <fd-combobox
                    inputId="cb-3"
                    placeholder="Type some text..."
                    [autoComplete]="false"
                    [dropdownValues]="fruits"
                    [(ngModel)]="three"
                />
            </div>
            <div fdFormItem fdContentDensity="compact">
                <label fdFormLabel for="cb-4">Compact</label>
                <fd-combobox
                    inputId="cb-4"
                    placeholder="Type some text..."
                    [dropdownValues]="fruits"
                    [(ngModel)]="four"
                />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-5">Read-only</label>
                <fd-combobox
                    inputId="cb-5"
                    readOnly
                    placeholder="Type some text..."
                    [dropdownValues]="fruits"
                    [(ngModel)]="five"
                />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-6">Hide addon button, match any part of the values</label>
                <fd-combobox
                    inputId="cb-6"
                    includes
                    placeholder="Type some text..."
                    [showDropdownButton]="false"
                    [dropdownValues]="fruits"
                    [(ngModel)]="six"
                />
            </div>
        </div>
    `
})
class StoryComboboxStandard {
    protected readonly fruits = FRUITS;
    protected readonly one = signal('');
    protected readonly two = signal('');
    protected readonly three = signal('');
    protected readonly four = signal('');
    protected readonly five = signal('Banana');
    protected readonly six = signal('');
}

@Component({
    selector: 'story-combobox-search',
    imports: [Combobox, FormItem, FormLabel, FormsModule],
    template: `
        <div class="flex max-w-lg flex-col gap-4">
            <div fdFormItem>
                <label fdFormLabel for="cb-search-1">Search field</label>
                <fd-combobox
                    inputId="cb-search-1"
                    isSearch
                    placeholder="Search"
                    glyphAriaLabel="Search"
                    [dropdownValues]="fruits"
                    [searchFn]="search"
                    [(ngModel)]="term"
                />
                <small class="${text}">Search term: {{ term() }}, searches: {{ searches() }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-search-2">Combobox with a clear button</label>
                <fd-combobox
                    inputId="cb-search-2"
                    showClearButton
                    placeholder="Type some text..."
                    [dropdownValues]="fruits"
                    [(ngModel)]="term2"
                />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-search-3">Full dropdown width</label>
                <fd-combobox
                    inputId="cb-search-3"
                    showClearButton
                    noDropDownMaxWidth
                    placeholder="Type some text..."
                    [dropdownValues]="fruits"
                    [(ngModel)]="term3"
                />
            </div>
        </div>
    `
})
class StoryComboboxSearch {
    protected readonly fruits = FRUITS;
    protected readonly term = signal('');
    protected readonly term2 = signal('Mango');
    protected readonly term3 = signal('');
    protected readonly searches = signal(0);
    protected readonly search = () => this.searches.update((n) => n + 1);
}

@Component({
    selector: 'story-combobox-templates',
    imports: [
        Combobox,
        ComboboxItemTemplate,
        FormItem,
        FormLabel,
        FormsModule,
        JsonPipe,
        Icon,
        ListIcon,
        ListTitle,
        ListSecondary,
        ListThumbnail,
        ListContent,
        ListByline
    ],
    template: `
        <div class="flex max-w-lg flex-col gap-4">
            <div fdFormItem>
                <label fdFormLabel for="cb-tpl-1">Columns</label>
                <fd-combobox
                    inputId="cb-tpl-1"
                    placeholder="Type some text..."
                    [displayFn]="display"
                    [itemTemplate]="columns"
                    [dropdownValues]="products"
                    [(ngModel)]="one"
                />
                <ng-template #columns let-item>
                    <span fdListTitle>{{ item.name }}</span>
                    <span fdListSecondary>{{ item.price }}</span>
                </ng-template>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-tpl-2">Item template with icons</label>
                <fd-combobox
                    inputId="cb-tpl-2"
                    placeholder="Select a product..."
                    [displayFn]="display"
                    [dropdownValues]="products"
                    (itemClicked)="clicked.set($event)"
                    [(ngModel)]="two"
                >
                    <ng-container *fdComboboxItem="let item; inputText as search">
                        <i fdListIcon [glyph]="item.icon"></i>
                        <span fdListTitle>{{ item.name }}</span>
                    </ng-container>
                </fd-combobox>
                <small class="${text}">itemClicked: {{ clicked() | json }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-tpl-3">Byline</label>
                <fd-combobox
                    inputId="cb-tpl-3"
                    byline
                    isSearch
                    glyphAriaLabel="Search"
                    placeholder="Search..."
                    [displayFn]="display"
                    [itemTemplate]="bylineTpl"
                    [dropdownValues]="products"
                    [(ngModel)]="three"
                />
                <ng-template #bylineTpl let-item>
                    <span fdListThumbnail><fd-icon [glyph]="item.icon" /></span>
                    <div fdListContent>
                        <div fdListTitle>{{ item.name }}</div>
                        <div fdListByline>{{ item.type }}, {{ item.price }}</div>
                    </div>
                </ng-template>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-tpl-4">Groups</label>
                <fd-combobox
                    inputId="cb-tpl-4"
                    placeholder="Type some text..."
                    maxHeight="250px"
                    [displayFn]="display"
                    [groupFn]="group"
                    [dropdownValues]="products"
                    [(ngModel)]="four"
                />
            </div>
        </div>
    `
})
class StoryComboboxTemplates {
    protected readonly products = PRODUCTS;
    protected readonly display = (item: Product | null | undefined) => item?.name ?? '';
    protected readonly group: ComboboxGroupFunction<Product> = (items) =>
        items.reduce<Record<string, Product[]>>((groups, item) => {
            (groups[item.type] ??= []).push(item);
            return groups;
        }, {});
    protected readonly one = signal('');
    protected readonly two = signal('');
    protected readonly three = signal('');
    protected readonly four = signal('');
    protected readonly clicked = signal<unknown>(null);
}

@Component({
    selector: 'story-combobox-forms',
    imports: [Combobox, FormItem, FormLabel, FormMessage, ListMessage, ReactiveFormsModule, JsonPipe],
    template: `
        <form [formGroup]="form" class="flex max-w-lg flex-col gap-4">
            <div fdFormItem>
                <label fdFormLabel for="cb-form-1" required>Communication via objects</label>
                <fd-combobox
                    inputId="cb-form-1"
                    state="information"
                    communicateByObject
                    required
                    placeholder="Type some text..."
                    formControlName="product"
                    [displayFn]="display"
                    [dropdownValues]="products"
                >
                    <li fdListMessage type="information">Choose a product from the list</li>
                </fd-combobox>
                <small class="${text}">
                    Touched: {{ form.controls.product.touched }}, dirty: {{ form.controls.product.dirty }}, value:
                    {{ form.controls.product.value | json }}
                </small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-form-2">Value property "id"</label>
                <fd-combobox
                    inputId="cb-form-2"
                    communicateByObject
                    valueProperty="id"
                    placeholder="Type some text..."
                    formControlName="productId"
                    [displayFn]="display"
                    [dropdownValues]="products"
                />
                <small class="${text}">Value: {{ form.controls.productId.value | json }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-form-3">Communication via the displayed text</label>
                <fd-combobox
                    inputId="cb-form-3"
                    placeholder="Type some text..."
                    formControlName="text"
                    [displayFn]="display"
                    [dropdownValues]="products"
                />
                <small class="${text}">Value: {{ form.controls.text.value | json }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-form-4">Disabled</label>
                <fd-combobox inputId="cb-form-4" formControlName="disabled" [dropdownValues]="fruits" />
            </div>
        </form>
    `
})
class StoryComboboxForms {
    protected readonly products = PRODUCTS;
    protected readonly fruits = FRUITS;
    protected readonly display = (item: Product | null | undefined) => item?.name ?? '';
    protected readonly form = new NgFormGroup({
        product: new NgFormControl<unknown>(null),
        productId: new NgFormControl<unknown>('C5'),
        text: new NgFormControl<unknown>('Banana'),
        disabled: new NgFormControl<unknown>({ value: 'Cherry', disabled: true })
    });
}

@Component({
    selector: 'story-combobox-mobile',
    imports: [Combobox, FormItem, FormLabel, FormsModule],
    template: `
        <div class="flex max-w-lg flex-col gap-4">
            <div fdFormItem>
                <label fdFormLabel for="cb-mobile-1">Confirmation in the dialog</label>
                <fd-combobox
                    inputId="cb-mobile-1"
                    mobile
                    placeholder="Search here..."
                    [mobileConfig]="{
                        title: 'Fruit',
                        approveButtonText: 'Save',
                        cancelButtonText: 'Cancel',
                        instruction: 'Choose your favourite fruit'
                    }"
                    [dropdownValues]="fruits"
                    [(ngModel)]="one"
                />
                <small class="${text}">Committed value: {{ one() || 'None' }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-mobile-2">Immediate selection</label>
                <fd-combobox
                    inputId="cb-mobile-2"
                    mobile
                    placeholder="Search here..."
                    [mobileConfig]="{ title: 'Fruit', cancelButtonText: 'Cancel' }"
                    [dropdownValues]="fruits"
                    [(ngModel)]="two"
                />
                <small class="${text}">Committed value: {{ two() || 'None' }}</small>
            </div>
        </div>
    `
})
class StoryComboboxMobile {
    protected readonly fruits = FRUITS;
    protected readonly one = signal('');
    protected readonly two = signal('');
}

@Component({
    selector: 'story-combobox-behaviour',
    imports: [Combobox, FormItem, FormLabel, FormsModule, AsyncPipe],
    template: `
        <div class="flex max-w-lg flex-col gap-4">
            <div fdFormItem>
                <label fdFormLabel for="cb-filter">Custom filter (case-sensitive start of the text)</label>
                <fd-combobox
                    inputId="cb-filter"
                    placeholder="Type to filter the list..."
                    [filterFn]="startsWith"
                    [dropdownValues]="fruits"
                    [(ngModel)]="filtered"
                />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-open">Open state control</label>
                <fd-combobox
                    inputId="cb-open"
                    maxHeight="250px"
                    placeholder="Combobox with open state subscription"
                    [dropdownValues]="fruits"
                    (openChange)="openLog.set([...openLog(), $event ? 'Opened' : 'Closed'])"
                    [(ngModel)]="opened"
                />
                <small class="${text}">openChange: {{ openLog().join(', ') || 'none yet' }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="cb-async">Observable values (async pipe)</label>
                <fd-combobox
                    inputId="cb-async"
                    placeholder="Type some text..."
                    [dropdownValues]="values$ | async"
                    [(ngModel)]="asyncTerm"
                />
                <small class="${text}">Search term: {{ asyncTerm() }}</small>
            </div>
        </div>
    `
})
class StoryComboboxBehaviour {
    protected readonly fruits = ['Apple', 'Banana', 'Kiwi', 'Strawberry', 'Tomato', 'Pineapple'];
    protected readonly values$ = of([
        'Apple',
        'Pineapple',
        'Tomato',
        'Grapes',
        'Pumpkin',
        'Banana',
        'Kiwi',
        'Raspberries',
        'Watermelons',
        'Nectarines',
        'Oranges'
    ]);
    protected readonly startsWith = (values: string[], term: string) =>
        term ? values.filter((value) => value.startsWith(term)) : values;
    protected readonly filtered = signal('');
    protected readonly opened = signal('');
    protected readonly asyncTerm = signal('');
    protected readonly openLog = signal<string[]>([]);
}

@Component({
    selector: 'story-combobox-dialog',
    imports: [
        Combobox,
        FormItem,
        FormLabel,
        FormsModule,
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
                    <h1 fd-title fd-dialog-title>Combobox inside a dialog</h1>
                </fd-dialog-header>
                <fd-dialog-body>
                    <div fdFormItem>
                        <label fdFormLabel for="cb-dialog">Fruit</label>
                        <fd-combobox
                            inputId="cb-dialog"
                            maxHeight="250px"
                            width="300px"
                            placeholder="Type some text..."
                            [dropdownValues]="fruits"
                            [(ngModel)]="term"
                        />
                    </div>
                    <small class="${text}">Search term: {{ term() }}</small>
                </fd-dialog-body>
                <fd-dialog-footer>
                    <fd-button-bar variant="emphasized" label="OK" (click)="dialog.close('Continue')" />
                    <fd-button-bar label="Cancel" (click)="dialog.dismiss('Cancel')" />
                </fd-dialog-footer>
            </fd-dialog>
        </ng-template>
        <button fdButton label="Open dialog" (click)="open()"></button>
        <p class="${text}">{{ reason() }}</p>
    `
})
class StoryComboboxDialog {
    protected readonly fruits = ['Apple', 'Pineapple', 'Banana', 'Kiwi', 'Strawberry'];
    protected readonly term = signal('');
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

const meta: Meta<Combobox> = {
    title: 'Components/Combobox',
    component: Combobox,
    decorators: [
        moduleMetadata({
            imports: [
                Combobox,
                FormsModule,
                StoryComboboxStandard,
                StoryComboboxSearch,
                StoryComboboxTemplates,
                StoryComboboxForms,
                StoryComboboxMobile,
                StoryComboboxBehaviour,
                StoryComboboxDialog
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'An input that suggests values while typing: it filters the list, completes the text inline and bolds the search text. ' +
                    'The focus stays in the input: Down and Up highlight values and put them in the input, Enter chooses, Escape closes and Alt+Down opens the whole list. ' +
                    'While closed, Down and Up step through the values. The value is the text, or with `communicateByObject` the chosen item.'
            }
        }
    },
    argTypes: {
        state: { control: 'select', options: ['default', 'success', 'error', 'warning', 'information'] }
    },
    args: {
        placeholder: 'Type a fruit...',
        ariaLabel: 'Fruit',
        state: 'default',
        disabled: false,
        readOnly: false,
        autoComplete: true,
        highlighting: true,
        includes: false,
        isSearch: false,
        showClearButton: false
    }
};
export default meta;
type Story = StoryObj<Combobox>;

export const Playground: Story = {
    render: (args) => ({
        props: { ...args, fruits: FRUITS },
        template: `<fd-combobox ${argsToTemplate(args)} [dropdownValues]="fruits" />`
    })
};

export const Standard: Story = { render: () => ({ template: `<story-combobox-standard />` }) };
export const Search: Story = { name: 'Search and clear', render: () => ({ template: `<story-combobox-search />` }) };
export const Templates: Story = {
    name: 'Templates, bylines and groups',
    render: () => ({ template: `<story-combobox-templates />` })
};
export const Forms: Story = { render: () => ({ template: `<story-combobox-forms />` }) };
export const Mobile: Story = { render: () => ({ template: `<story-combobox-mobile />` }) };
export const Behaviour: Story = {
    name: 'Custom filter, open state and async values',
    render: () => ({ template: `<story-combobox-behaviour />` })
};
export const InsideDialog: Story = {
    name: 'Inside a dialog',
    render: () => ({ template: `<story-combobox-dialog />` })
};

/** Clicks the button of the combobox (or, in mobile mode, its field) and waits for the list. */
async function openCombobox(canvasElement: HTMLElement, selector: string, popup: string): Promise<void> {
    const combobox = canvasElement.querySelector<HTMLElement>(selector)!;
    const target = combobox.hasAttribute('mobile')
        ? combobox.querySelector<HTMLElement>('input')!
        : combobox.querySelector<HTMLElement>('button[aria-haspopup]')!;
    await userEvent.click(target);
    await waitFor(() => expect(document.querySelector(popup)).not.toBeNull());
    await waitFor(() =>
        expect(combobox.querySelector('input[role=combobox]')!.getAttribute('aria-expanded')).toBe('true')
    );
}

export const OpenDropdown: Story = {
    name: 'Open: dropdown',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-combobox-standard />` }),
    play: ({ canvasElement }) => openCombobox(canvasElement, 'fd-combobox', '[role=listbox] [role=option]')
};
export const OpenGroups: Story = {
    name: 'Open: groups',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-combobox-templates />` }),
    play: ({ canvasElement }) =>
        openCombobox(canvasElement, 'fd-combobox:has(#cb-tpl-4)', '[role=listbox] [role=group] [role=option]')
};
export const OpenListMessage: Story = {
    name: 'Open: list message',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-combobox-forms />` }),
    play: ({ canvasElement }) => openCombobox(canvasElement, 'fd-combobox', '[role=listbox] [fdListMessage]')
};
export const OpenInsideDialog: Story = {
    name: 'Open: inside a dialog',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-combobox-dialog />` }),
    play: async ({ canvasElement }) => {
        await userEvent.click(canvasElement.querySelector<HTMLElement>('button')!);
        await waitFor(() => expect(document.querySelector('[role=dialog] fd-combobox')).not.toBeNull());
        await openCombobox(document.body, '[role=dialog] fd-combobox', '[role=listbox] [role=option]');
    }
};
export const OpenMobile: Story = {
    name: 'Open: mobile dialog',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-combobox-mobile />` }),
    play: ({ canvasElement }) =>
        openCombobox(canvasElement, 'fd-combobox', '[role=dialog] [role=listbox] [role=option]')
};
