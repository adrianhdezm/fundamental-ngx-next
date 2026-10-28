import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import {
    FormControl as NgFormControl,
    FormGroup as NgFormGroup,
    FormsModule,
    ReactiveFormsModule
} from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { delay, of, startWith, Subject, switchMap, type Observable } from 'rxjs';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '@/ui/button/button';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { FormItem, FormLabel } from '@/ui/form/form';
import { ListByline, ListContent, ListIcon, ListTitle } from '@/ui/list/list';
import { SegmentedButton } from '@/ui/segmented-button/segmented-button';
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

interface OptionItem {
    label: string;
    value: string;
}

const OPTION_ITEMS: OptionItem[] = [
    { label: 'Apple', value: 'apple_value' },
    { label: 'Banana', value: 'banana_value' },
    { label: 'Pineapple', value: 'pineapple_value' },
    { label: 'Tomato', value: 'tomato_value' },
    { label: 'Kiwi', value: 'kiwi_value' },
    { label: 'Strawberry', value: 'strawberry_value' },
    { label: 'Blueberry', value: 'blueberry_value' },
    { label: 'Orange', value: 'orange_value' }
];

const ASYNC_ITEMS: OptionItem[] = [
    'Apple',
    'Watermelon',
    'Orange',
    'Pear',
    'Cherry',
    'Strawberry',
    'Nectarine',
    'Grape',
    'Mango',
    'Blueberry',
    'Pomegranate',
    'Carambola',
    'Plum',
    'Banana',
    'Raspberry',
    'Mandarin',
    'Jackfruit',
    'Papaya',
    'Kiwi',
    'Pineapple',
    'Lime',
    'Lemon',
    'Apricot',
    'Grapefruit',
    'Melon',
    'Coconut',
    'Avocado',
    'Peach'
].map((label) => ({ label, value: `${label.toLowerCase()}_value` }));

@Component({
    selector: 'story-multi-input-filter',
    imports: [MultiInput, FormItem, FormLabel, FormsModule, JsonPipe],
    template: `
        <div fdFormItem class="max-w-lg">
            <label fdFormLabel for="mi-filter">Case-sensitive filter</label>
            <fd-multi-input
                inputId="mi-filter"
                placeholder="Search here..."
                [dropdownValues]="fruits"
                [filterFn]="customFilter"
                [(ngModel)]="selected"
            />
            <small class="${text}"
                >Only "Apple" matches "A"; "a" matches nothing. Selected: {{ selected() | json }}</small
            >
        </div>
    `
})
class StoryMultiInputFilter {
    protected readonly fruits = ['Apple', 'Banana', 'Pineapple', 'Tomato'];
    protected readonly selected = signal<string[]>([]);
    /** Matches the start of the text, case-sensitively (the default filter ignores case). */
    protected readonly customFilter = (items: string[], term: string) =>
        term ? items.filter((item) => item.startsWith(term)) : items;
}

@Component({
    selector: 'story-multi-input-async',
    imports: [MultiInput, FormItem, FormLabel, FormsModule, JsonPipe, AsyncPipe],
    template: `
        <div fdFormItem class="max-w-lg">
            <label fdFormLabel for="mi-async">Fruits from a server</label>
            <fd-multi-input
                inputId="mi-async"
                placeholder="Search here..."
                [dropdownValues]="(values$ | async) || []"
                [displayFn]="display"
                [valueFn]="value"
                [(ngModel)]="selected"
                (searchTermChange)="search$.next($event)"
            />
            <small class="${text}">
                Each search term loads at most five matches after a delay. Selected: {{ selected() | json }}
            </small>
        </div>
    `
})
class StoryMultiInputAsync {
    protected readonly search$ = new Subject<string>();
    protected readonly values$: Observable<OptionItem[]> = this.search$.pipe(
        startWith(''),
        switchMap((term) => this.request(term))
    );
    protected readonly selected = signal<string[]>([]);
    protected readonly display = (item: OptionItem) => item.label;
    protected readonly value = (item: OptionItem) => item.value;

    /** Emulates a server request. */
    private request(term: string): Observable<OptionItem[]> {
        const query = term.trim().toLowerCase();
        return of(ASYNC_ITEMS.filter((item) => item.value.startsWith(query)).slice(0, 5)).pipe(delay(500));
    }
}

@Component({
    selector: 'story-multi-input-option-items',
    imports: [MultiInput, FormItem, FormLabel, FormsModule, JsonPipe],
    template: `
        <div fdFormItem class="max-w-lg">
            <label fdFormLabel for="mi-option-items">Option items</label>
            <fd-multi-input
                inputId="mi-option-items"
                placeholder="Search here..."
                [dropdownValues]="items"
                [(ngModel)]="selected"
            />
            <small class="${text}">
                Items with <code>label</code> and <code>value</code> need no display or value function. Selected:
                {{ selected() | json }}
            </small>
        </div>
    `
})
class StoryMultiInputOptionItems {
    protected readonly items = OPTION_ITEMS;
    protected readonly selected = signal<string[]>(OPTION_ITEMS.slice(0, 7).map((item) => item.value));
}

@Component({
    selector: 'story-multi-input-dropdown-width',
    imports: [MultiInput, FormItem, FormLabel, FormsModule, JsonPipe, ListContent, ListTitle, ListByline],
    template: `
        <div class="flex flex-col gap-6">
            <div fdFormItem>
                <label fdFormLabel for="mi-width-1">Default: the list grows with the content</label>
                <fd-multi-input
                    inputId="mi-width-1"
                    class="w-[200px]"
                    placeholder="Search here..."
                    [dropdownValues]="long"
                    [(ngModel)]="one"
                />
                <small class="${text}">Selected: {{ one() | json }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mi-width-2">Strict: at most 300px, titles wrap</label>
                <fd-multi-input
                    inputId="mi-width-2"
                    class="w-[300px]"
                    byline
                    placeholder="Search here..."
                    [bodyMaxWidth]="300"
                    [dropdownValues]="wrapping"
                    [itemTemplate]="bylineTpl"
                    [(ngModel)]="two"
                />
                <ng-template #bylineTpl let-item>
                    <div fdListContent>
                        <span fdListTitle wrap>{{ item }}</span>
                        <span fdListByline>Some description</span>
                    </div>
                </ng-template>
                <small class="${text}">Selected: {{ two() | json }}</small>
            </div>
            <div fdFormItem>
                <label fdFormLabel for="mi-width-3">Dynamic: as wide as the field</label>
                <fd-multi-input
                    inputId="mi-width-3"
                    class="w-[250px]"
                    bodyMaxWidth="container"
                    placeholder="Search here..."
                    [dropdownValues]="long"
                    [(ngModel)]="three"
                />
                <small class="${text}">Selected: {{ three() | json }}</small>
            </div>
        </div>
    `
})
class StoryMultiInputDropdownWidth {
    protected readonly long = [
        'SomeLongTextToShowThatWidthWillGrowWithTheContent',
        'Banana',
        'Pineapple',
        'Tomato',
        'Kiwi',
        'Strawberry',
        'Blueberry',
        'Orange'
    ];
    protected readonly wrapping = ['Some long option to show title wrapping', ...this.long.slice(1)];
    protected readonly one = signal<string[]>(['SomeLongTextToShowThatWidthWillGrowWithTheContent', 'Banana']);
    protected readonly two = signal<string[]>(['Some long option to show title wrapping', 'Banana']);
    protected readonly three = signal<string[]>(['Kiwi']);
}

@Component({
    selector: 'story-multi-input-many-tokens',
    imports: [MultiInput, FormItem, FormLabel, FormsModule, Button, SegmentedButton],
    template: `
        <div class="flex max-w-lg flex-col gap-4">
            <fd-segmented-button ariaLabel="Number of tokens" [ngModel]="count()" (ngModelChange)="setCount($event)">
                @for (n of counts; track n) {
                    <button fdButton [label]="'' + n" [value]="n"></button>
                }
            </fd-segmented-button>
            <div fdFormItem>
                <label fdFormLabel for="mi-many">{{ count() }} selected options</label>
                <fd-multi-input
                    inputId="mi-many"
                    placeholder="Type to search"
                    [maxVisibleTokens]="12"
                    [dropdownValues]="options()"
                    [(ngModel)]="selected"
                />
                <small class="${text}">
                    Without the focus only 12 tokens render and the rest count in the "n more" link; the focus renders
                    all of them.
                </small>
            </div>
        </div>
    `
})
class StoryMultiInputManyTokens {
    protected readonly counts = [10, 100, 200, 1000];
    protected readonly count = signal(1000);
    protected readonly options = computed(() => Array.from({ length: this.count() }, (_, i) => `Option ${i + 1}`));
    protected readonly selected = signal<string[]>(this.options());

    protected setCount(count: number): void {
        this.count.set(count);
        this.selected.set(this.options());
    }
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
                StoryMultiInputMobile,
                StoryMultiInputFilter,
                StoryMultiInputAsync,
                StoryMultiInputOptionItems,
                StoryMultiInputDropdownWidth,
                StoryMultiInputManyTokens
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
export const CustomFilter: Story = {
    name: 'Custom filter',
    render: () => ({ template: `<story-multi-input-filter />` })
};
export const AsyncValues: Story = {
    name: 'Async values',
    render: () => ({ template: `<story-multi-input-async />` })
};
export const OptionItems: Story = {
    name: 'Option items',
    render: () => ({ template: `<story-multi-input-option-items />` })
};
export const DropdownWidth: Story = {
    name: 'Dropdown width',
    render: () => ({ template: `<story-multi-input-dropdown-width />` })
};
export const ManyTokens: Story = {
    name: 'Many tokens',
    render: () => ({ template: `<story-multi-input-many-tokens />` })
};

/** Clicks the addon button of the multi input whose field has the given id and waits for its popup. */
async function openMultiInput(canvasElement: HTMLElement, inputId: string, popup: string): Promise<void> {
    const host = canvasElement.querySelector<HTMLInputElement>(`#${inputId}`)!.closest('fd-multi-input')!;
    await userEvent.click(host.querySelector<HTMLButtonElement>('button[aria-haspopup]')!);
    await waitFor(() => expect(document.querySelector(popup)).not.toBeNull());
}

export const OpenItemTemplate: Story = {
    name: 'Open: item template',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-multi-input-items />` }),
    play: ({ canvasElement }) =>
        openMultiInput(canvasElement, 'mi-items-2', '.cdk-overlay-container [role=listbox] [role=option] [fdListIcon]')
};
export const OpenMobile: Story = {
    name: 'Open: mobile',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-multi-input-mobile />` }),
    play: ({ canvasElement }) =>
        openMultiInput(canvasElement, 'mi-mobile', '[role=dialog] [role=listbox] [role=option]')
};
