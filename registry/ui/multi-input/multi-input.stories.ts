import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
    FormControl as NgFormControl,
    FormGroup as NgFormGroup,
    FormsModule,
    ReactiveFormsModule
} from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { FormItem, FormLabel } from '@/ui/form/form';
import { ListByline, ListContent, ListIcon, ListTitle } from '@/ui/list/list';
import { MultiInput } from './multi-input';

const FRUITS = ['Apple', 'Banana', 'Pineapple', 'Tomato', 'Kiwi', 'Strawberry', 'Blueberry', 'Orange'];
const MANY = [
    'Apple',
    'Apricot',
    'Avocado',
    'Banana',
    'Blackberry',
    'Blueberry',
    'Cherry',
    'Coconut',
    'Cranberry',
    'Date',
    'Fig',
    'Grape',
    'Grapefruit',
    'Guava',
    'Kiwi',
    'Lemon',
    'Lime',
    'Lychee',
    'Mango',
    'Melon',
    'Nectarine',
    'Orange',
    'Papaya',
    'Peach'
];

interface Product {
    id: number;
    name: string;
    icon: string;
}

const PRODUCTS: Product[] = [
    { id: 1, name: 'Laptop', icon: 'laptop' },
    { id: 2, name: 'Monitor', icon: 'sys-monitor' },
    { id: 3, name: 'Keyboard', icon: 'keyboard-and-mouse' },
    { id: 4, name: 'Printer', icon: 'print' },
    { id: 5, name: 'Phone', icon: 'iphone' }
];

const text = 'm-0 mt-1 block font-sap-font-family text-sap-font-small-size text-sap-content-label-color';

@Component({
    selector: 'story-multi-input-default',
    imports: [MultiInput, FormItem, FormLabel, FormsModule, JsonPipe, ContentDensityDirective],
    template: `
        <div class="flex max-w-lg flex-col gap-4">
            <div fdFormItem>
                <label fdFormLabel for="mi-1">Multi input</label>
                <fd-multi-input
                    inputId="mi-1"
                    placeholder="Search here..."
                    [dropdownValues]="fruits"
                    [(ngModel)]="one"
                    (searchTermChange)="term.set($event)"
                />
                <small class="${text}">Selected: {{ one() | json }}, search term: "{{ term() }}"</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mi-2">Disabled</label>
                <fd-multi-input
                    inputId="mi-2"
                    disabled
                    placeholder="Search here..."
                    [dropdownValues]="fruits"
                    [(ngModel)]="two"
                />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mi-3">Hidden addon button, any part of the text matches</label>
                <fd-multi-input
                    inputId="mi-3"
                    includes
                    placeholder="Search here..."
                    [displayAddonButton]="false"
                    [dropdownValues]="fruits"
                    [(ngModel)]="three"
                />
            </div>
            <div fdFormItem fdContentDensity="compact">
                <label fdFormLabel for="mi-4">Compact</label>
                <fd-multi-input
                    inputId="mi-4"
                    placeholder="Search here..."
                    [dropdownValues]="fruits"
                    [(ngModel)]="four"
                />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mi-5">Many selected values</label>
                <fd-multi-input
                    inputId="mi-5"
                    placeholder="Search here..."
                    [dropdownValues]="many"
                    [(ngModel)]="five"
                />
                <small class="${text}">{{ five().length }} selected; the "n more" link lists them.</small>
            </div>
        </div>
    `
})
class StoryMultiInputDefault {
    protected readonly fruits = FRUITS;
    protected readonly many = MANY;
    protected readonly one = signal<string[]>(['Banana']);
    protected readonly two = signal<string[]>(['Apple', 'Kiwi']);
    protected readonly three = signal<string[]>([]);
    protected readonly four = signal<string[]>(['Orange']);
    protected readonly five = signal<string[]>(MANY.slice(0, 16));
    protected readonly term = signal('');
}

@Component({
    selector: 'story-multi-input-items',
    imports: [MultiInput, FormItem, FormLabel, FormsModule, JsonPipe, ListIcon, ListTitle, ListContent, ListByline],
    template: `
        <div class="flex max-w-lg flex-col gap-4">
            <div fdFormItem>
                <label fdFormLabel for="mi-items-1">Objects with display and value functions</label>
                <fd-multi-input
                    inputId="mi-items-1"
                    placeholder="Search here..."
                    [dropdownValues]="products"
                    [displayFn]="display"
                    [valueFn]="value"
                    [(ngModel)]="one"
                />
                <small class="${text}">Selected ids: {{ one() | json }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mi-items-2">Item template</label>
                <fd-multi-input
                    inputId="mi-items-2"
                    placeholder="Search here..."
                    [dropdownValues]="products"
                    [displayFn]="display"
                    [valueFn]="value"
                    [itemTemplate]="iconTpl"
                    [(ngModel)]="two"
                />
                <ng-template #iconTpl let-item>
                    <i fdListIcon [glyph]="item.icon"></i>
                    <span fdListTitle>{{ item.name }}</span>
                </ng-template>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mi-items-3">Bylines with a list as wide as the field</label>
                <fd-multi-input
                    inputId="mi-items-3"
                    byline
                    bodyMaxWidth="container"
                    placeholder="Search here..."
                    [dropdownValues]="products"
                    [displayFn]="display"
                    [valueFn]="value"
                    [itemTemplate]="bylineTpl"
                    [(ngModel)]="three"
                />
                <ng-template #bylineTpl let-item>
                    <div fdListContent>
                        <span fdListTitle>{{ item.name }}</span>
                        <span fdListByline>Product number {{ item.id }}</span>
                    </div>
                </ng-template>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mi-items-4">New tokens</label>
                <fd-multi-input
                    inputId="mi-items-4"
                    allowNewTokens
                    placeholder="Type and press Enter"
                    [dropdownValues]="fruits"
                    [(ngModel)]="four"
                />
                <small class="${text}">Selected: {{ four() | json }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mi-items-5">Addon button handled by the app</label>
                <fd-multi-input
                    inputId="mi-items-5"
                    placeholder="Search here..."
                    [openDropdownOnAddOnClicked]="false"
                    [dropdownValues]="fruits"
                    (addOnButtonClicked)="clicks.set(clicks() + 1)"
                />
                <small class="${text}">Addon button clicks: {{ clicks() }}</small>
            </div>
        </div>
    `
})
class StoryMultiInputItems {
    protected readonly products = PRODUCTS;
    protected readonly fruits = FRUITS;
    protected readonly display = (item: Product) => item.name;
    protected readonly value = (item: Product) => item.id;
    protected readonly one = signal<number[]>([2]);
    protected readonly two = signal<number[]>([]);
    protected readonly three = signal<number[]>([1, 4]);
    protected readonly four = signal<string[]>(['Kiwi']);
    protected readonly clicks = signal(0);
}

@Component({
    selector: 'story-multi-input-forms',
    imports: [MultiInput, FormItem, FormLabel, ReactiveFormsModule, JsonPipe],
    template: `
        <form [formGroup]="form" class="flex max-w-lg flex-col gap-4">
            <div fdFormItem>
                <label fdFormLabel for="mi-form-1" required>Fruits</label>
                <fd-multi-input
                    inputId="mi-form-1"
                    required
                    state="information"
                    placeholder="Search here..."
                    formControlName="fruits"
                    [dropdownValues]="fruits"
                />
                <small class="${text}">
                    Value: {{ form.controls.fruits.value | json }}, touched: {{ form.controls.fruits.touched }}, dirty:
                    {{ form.controls.fruits.dirty }}
                </small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mi-form-2">Error state</label>
                <fd-multi-input
                    inputId="mi-form-2"
                    state="error"
                    placeholder="Search here..."
                    formControlName="error"
                    [dropdownValues]="fruits"
                />
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mi-form-3">Disabled control</label>
                <fd-multi-input
                    inputId="mi-form-3"
                    placeholder="Search here..."
                    formControlName="disabled"
                    [dropdownValues]="fruits"
                />
            </div>
        </form>
    `
})
class StoryMultiInputForms {
    protected readonly fruits = FRUITS;
    protected readonly form = new NgFormGroup({
        fruits: new NgFormControl<string[]>(['Pineapple']),
        error: new NgFormControl<string[]>(['Tomato']),
        disabled: new NgFormControl<string[]>({ value: ['Apple'], disabled: true })
    });
}

@Component({
    selector: 'story-multi-input-mobile',
    imports: [MultiInput, FormItem, FormLabel, FormsModule, JsonPipe],
    template: `
        <div fdFormItem class="max-w-lg">
            <label fdFormLabel for="mi-mobile">Fruits</label>
            <fd-multi-input
                inputId="mi-mobile"
                mobile
                placeholder="Search here..."
                [mobileConfig]="{ title: 'Fruits', approveButtonText: 'Select', cancelButtonText: 'Cancel' }"
                [dropdownValues]="fruits"
                [(ngModel)]="selected"
            />
            <small class="${text}">Selected: {{ selected() | json }}</small>
        </div>
    `
})
class StoryMultiInputMobile {
    protected readonly fruits = FRUITS;
    protected readonly selected = signal<string[]>(['Kiwi']);
}

const meta: Meta<MultiInput> = {
    title: 'Components/Multi Input',
    component: MultiInput,
    decorators: [
        moduleMetadata({
            imports: [
                MultiInput,
                StoryMultiInputDefault,
                StoryMultiInputItems,
                StoryMultiInputForms,
                StoryMultiInputMobile
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'A tokenizer field with a list of check box options. Typing filters the list and completes the text; Enter selects the first match (or adds a new token). ' +
                    'The focus stays in the input: Down and Up highlight options and Enter toggles the highlighted one. Tokens are removed with their close icon, Backspace or Delete. ' +
                    'In mobile mode the list opens in a dialog with a select all button.'
            }
        }
    },
    argTypes: {
        state: { control: 'select', options: ['default', 'success', 'error', 'warning', 'information'] }
    },
    args: {
        placeholder: 'Search here...',
        ariaLabel: 'Fruits',
        state: 'default',
        disabled: false,
        includes: false,
        autoComplete: true,
        allowNewTokens: false
    }
};
export default meta;
type Story = StoryObj<MultiInput>;

export const Playground: Story = {
    render: (args) => ({
        props: { ...args, fruits: FRUITS },
        template: `<div class="max-w-lg"><fd-multi-input ${argsToTemplate(args)} [dropdownValues]="fruits" /></div>`
    })
};

export const Default: Story = { render: () => ({ template: `<story-multi-input-default />` }) };
export const Items: Story = {
    name: 'Objects, templates and new tokens',
    render: () => ({ template: `<story-multi-input-items />` })
};
export const Forms: Story = { render: () => ({ template: `<story-multi-input-forms />` }) };
export const Mobile: Story = { render: () => ({ template: `<story-multi-input-mobile />` }) };
