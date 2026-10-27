import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl as NgFormControl, FormGroup as NgFormGroup, ReactiveFormsModule } from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '@/ui/button/button';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { FormItem, FormLabel } from '@/ui/form/form';
import { FormInputMessageGroup } from '@/ui/form/form-input-message-group';
import { FormMessage } from '@/ui/form/form-message';
import { Icon } from '@/ui/icon/icon';
import { ListGroupHeader, ListIcon, ListSecondary, ListTitle } from '@/ui/list/list';
import { Select, SelectOption } from './select';

const FRUITS = ['Apple', 'Banana', 'Cherry', 'Dragon fruit', 'Elderberry', 'Fig', 'Grape', 'Honeydew', 'Kiwi', 'Lemon'];
const text = 'm-0 mt-1 block font-sap-font-family text-sap-font-small-size text-sap-content-label-color';
const heading = 'm-0 mt-6 mb-1 font-sap-font-header-family text-sap-font-header6-size text-sap-group-title-text-color';

@Component({
    selector: 'story-select-modes',
    imports: [Select, SelectOption, FormLabel, ContentDensityDirective],
    template: `
        <h4 class="${heading} mt-0" id="sel-mode-1">Default select</h4>
        <fd-select ariaLabelledBy="sel-mode-1" placeholder="Select an option" [(value)]="value1">
            @for (option of fruits; track option) {
                <li fd-option [value]="option">{{ option }}</li>
            }
        </fd-select>
        <small class="${text}">Selected value: {{ value1() }}</small>

        <h4 class="${heading}" id="sel-mode-2">Compact select</h4>
        <div fdContentDensity="compact">
            <fd-select ariaLabelledBy="sel-mode-2" placeholder="Select an option" [(value)]="value2">
                @for (option of fruits; track option) {
                    <li fd-option [value]="option">{{ option }}</li>
                }
            </fd-select>
        </div>
        <small class="${text}">Selected value: {{ value2() }}</small>

        <h4 class="${heading}" id="sel-mode-3">Select in disabled mode</h4>
        <fd-select ariaLabelledBy="sel-mode-3" placeholder="Select an option" disabled [(value)]="value3">
            @for (option of fruits; track option) {
                <li fd-option [value]="option">{{ option }}</li>
            }
        </fd-select>
        <small class="${text}">Selected value: {{ value3() }}</small>

        <h4 class="${heading}" id="sel-mode-4">Select in read-only mode</h4>
        <fd-select ariaLabelledBy="sel-mode-4" placeholder="Select an option" readonly [(value)]="value4">
            @for (option of fruits; track option) {
                <li fd-option [value]="option">{{ option }}</li>
            }
        </fd-select>
        <small class="${text}">Selected value: {{ value4() }}</small>

        <h4 class="${heading}" id="sel-mode-5">Full width</h4>
        <fd-select ariaLabelledBy="sel-mode-5" placeholder="Select an option" [inline]="false" [(value)]="value1">
            @for (option of fruits; track option) {
                <li fd-option [value]="option" [disabled]="option === 'Fig'">{{ option }}</li>
            }
        </fd-select>
    `
})
class StorySelectModes {
    protected readonly fruits = FRUITS;
    protected readonly value1 = signal<string | null | undefined>(undefined);
    protected readonly value2 = signal<string | null | undefined>('Banana');
    protected readonly value3 = signal<string | null | undefined>('Cherry');
    protected readonly value4 = signal<string | null | undefined>('Kiwi');
}

@Component({
    selector: 'story-select-states',
    imports: [Select, SelectOption, FormItem, FormLabel, FormMessage, FormInputMessageGroup],
    template: `
        <div class="flex flex-col gap-6">
            @for (state of states; track state.state) {
                <div fdFormItem>
                    <label fdFormLabel [id]="'sel-state-' + state.state">{{ state.label }}</label>
                    <fd-select
                        placeholder="Select value"
                        [ariaLabelledBy]="'sel-state-' + state.state"
                        [ariaDescribedBy]="'sel-state-msg-' + state.state"
                        [state]="state.state"
                        [stateMessage]="state.message"
                        [textOverflow]="state.state === 'success' ? 'full' : 'ellipsis'"
                        [fillControlMode]="state.state === 'success' ? 'equal' : 'at-least'"
                        [inline]="state.state !== 'success'"
                    >
                        @for (option of fruits; track option) {
                            <li fd-option [value]="option">{{ option }}</li>
                        }
                    </fd-select>
                    <fd-form-message static [id]="'sel-state-msg-' + state.state" [type]="state.state">{{
                        state.short
                    }}</fd-form-message>
                </div>
            }
            <div fdFormItem>
                <label fdFormLabel id="sel-state-hover">Form message with event triggers (hover)</label>
                <fd-form-input-message-group class="w-full" [triggers]="['mouseenter', 'mouseleave']">
                    <fd-select
                        class="w-full"
                        placeholder="Select value"
                        ariaLabelledBy="sel-state-hover"
                        ariaDescribedBy="sel-state-msg-hover"
                        state="success"
                        stateMessage="Success message"
                        [inline]="false"
                    >
                        @for (option of fruits; track option) {
                            <li fd-option [value]="option">{{ option }}</li>
                        }
                    </fd-select>
                    <fd-form-message id="sel-state-msg-hover" type="success">Success message</fd-form-message>
                </fd-form-input-message-group>
            </div>
        </div>
    `
})
class StorySelectStates {
    protected readonly fruits = FRUITS.slice(0, 5);
    protected readonly states = [
        {
            state: 'success',
            label: 'Success state (with visible long text)',
            short: 'Success message',
            message:
                'Success message. This is a longer success message to provide more detailed feedback about the selection. Make sure you selected the correct option and continue with the next steps.'
        },
        { state: 'warning', label: 'Warning state', short: 'Warning message', message: 'Warning message' },
        { state: 'error', label: 'Error state', short: 'Error message', message: 'Error message' },
        {
            state: 'information',
            label: 'Information state',
            short: 'Information message',
            message: 'Information message'
        }
    ] as const;
}

@Component({
    selector: 'story-select-rich',
    imports: [Select, SelectOption, ListGroupHeader, ListTitle, ListSecondary, ListIcon, Icon, FormLabel, JsonPipe],
    template: `
        <label fdFormLabel id="sel-rich">Food</label>
        <fd-select
            ariaLabelledBy="sel-rich"
            placeholder="Select an option"
            [controlTemplate]="trigger"
            [(value)]="value"
        >
            <li fd-list-group-header role="presentation"><span fd-list-title>Fruits</span></li>
            @for (option of fruits; track option.name) {
                <li fd-option [value]="option">
                    <i fd-list-icon glyph="nutrition-activity"></i>
                    <span fd-list-title>{{ option.name }}</span>
                    <span fd-list-secondary>{{ option.kCal }} kcal</span>
                </li>
            }
            <li fd-list-group-header role="presentation"><span fd-list-title>Vegetables</span></li>
            @for (option of vegetables; track option.name) {
                <li fd-option [value]="option">
                    <i fd-list-icon glyph="e-care"></i>
                    <span fd-list-title>{{ option.name }}</span>
                    <span fd-list-secondary>{{ option.kCal }} kcal</span>
                </li>
            }
        </fd-select>
        <ng-template #trigger let-selected="selected">
            <span class="inline-flex items-center gap-2">
                <fd-icon glyph="action-settings" />
                {{ selected?.value()?.name || 'Select an option' }}
            </span>
        </ng-template>
        <small class="${text}">Selected value: {{ value() | json }}</small>
    `
})
class StorySelectRich {
    protected readonly fruits = [
        { name: 'Apple', kCal: 52 },
        { name: 'Banana', kCal: 89 },
        { name: 'Pineapple', kCal: 50 }
    ];
    protected readonly vegetables = [
        { name: 'Broccoli', kCal: 34 },
        { name: 'Carrot', kCal: 41 },
        { name: 'Spinach', kCal: 23 }
    ];
    protected readonly value = signal<{ name: string; kCal: number } | undefined>(undefined);
}

@Component({
    selector: 'story-select-forms',
    imports: [Select, SelectOption, ReactiveFormsModule, Button, FormLabel],
    template: `
        <form [formGroup]="form">
            <label fdFormLabel id="sel-form-1" required>Default select</label>
            <fd-select ariaLabelledBy="sel-form-1" formControlName="fruit" required placeholder="Select a fruit">
                @for (option of fruits; track option) {
                    <li fd-option [value]="option">{{ option }}</li>
                }
            </fd-select>
        </form>
        <small class="${text}">Value: {{ form.controls.fruit.value }}</small>
        <small class="${text}">Touched: {{ form.touched }}, dirty: {{ form.dirty }}, status: {{ form.status }}</small>

        <form [formGroup]="disabledForm" class="mt-6">
            <label fdFormLabel id="sel-form-2">Disabled select</label>
            <fd-select ariaLabelledBy="sel-form-2" formControlName="fruit">
                @for (option of fruits; track option) {
                    <li fd-option [value]="option">{{ option }}</li>
                }
            </fd-select>
        </form>
        <small class="${text}">Value: {{ disabledForm.controls.fruit.value }}, status: {{ disabledForm.status }}</small>
        <button fdButton class="mt-2" label="Toggle disabled state" (click)="toggle()"></button>
    `
})
class StorySelectForms {
    protected readonly fruits = FRUITS.slice(0, 6);
    protected readonly form = new NgFormGroup({ fruit: new NgFormControl<string | null>(null) });
    protected readonly disabledForm = new NgFormGroup({
        fruit: new NgFormControl<string | null>({ value: 'Banana', disabled: true })
    });
    protected toggle(): void {
        const control = this.disabledForm.controls.fruit;
        if (control.disabled) control.enable();
        else control.disable();
    }
}

@Component({
    selector: 'story-select-programmatic',
    imports: [Select, SelectOption, Button, FormLabel],
    template: `
        <div class="mb-3 flex gap-2">
            <button fdButton label="Change Value" (click)="change()"></button>
            <button fdButton label="Open" (click)="select.open()"></button>
            <button fdButton label="Close" (click)="select.close()"></button>
            <button fdButton label="Add Option" (click)="add()"></button>
            <button fdButton label="Remove Option" (click)="remove()"></button>
        </div>
        <label fdFormLabel id="sel-prog">Fruit</label>
        <fd-select
            #select
            ariaLabelledBy="sel-prog"
            placeholder="Select value"
            [closeOnOutsideClick]="false"
            maxHeight="12rem"
            [(value)]="value"
        >
            @for (option of options(); track option) {
                <li fd-option [value]="option">{{ option }}</li>
            }
        </fd-select>
        <small class="${text}">Selected value: {{ value() }}</small>
    `
})
class StorySelectProgrammatic {
    protected readonly options = signal(FRUITS.slice(0, 5));
    protected readonly value = signal<string | null | undefined>('Apple');
    protected change(): void {
        const options = this.options();
        this.value.set(options[Math.floor(Math.random() * options.length)]);
    }
    protected add(): void {
        this.options.update((o) => [...o, `Option ${o.length + 1}`]);
    }
    protected remove(): void {
        this.options.update((o) => o.slice(0, -1));
    }
}

@Component({
    selector: 'story-select-comparator',
    imports: [Select, SelectOption, FormLabel],
    template: `
        <label fdFormLabel id="sel-cmp">Car type</label>
        <fd-select ariaLabelledBy="sel-cmp" [compareWith]="compare" [value]="value()" (valueChange)="setByCopy($event)">
            @for (type of types; track type.id) {
                <fd-option [value]="type">{{ type.name }}</fd-option>
            }
        </fd-select>
        <small class="${text}">The value is a copy of the option; the comparator matches options by id.</small>
    `
})
class StorySelectComparator {
    protected readonly types = [
        { id: 1, name: 'Sedan' },
        { id: 2, name: 'Coupe' },
        { id: 3, name: 'Convertible' }
    ];
    protected readonly value = signal<{ id: number; name: string } | null | undefined>({ id: 2, name: 'Coupe' });
    protected readonly compare = (a?: { id: number } | null, b?: { id: number } | null) => a?.id === b?.id;
    protected setByCopy(value: { id: number; name: string } | null | undefined): void {
        this.value.set(value ? { ...value } : value);
    }
}

@Component({
    selector: 'story-select-max-height',
    imports: [Select, SelectOption, FormLabel],
    template: `
        <label fdFormLabel id="sel-height">Fruit</label>
        <fd-select ariaLabelledBy="sel-height" placeholder="Select an option" maxHeight="250px" [(value)]="value">
            @for (option of options; track option) {
                <li fd-option [value]="option">{{ option }}</li>
            }
        </fd-select>
        <small class="${text}">Selected value: {{ value() }}</small>
    `
})
class StorySelectMaxHeight {
    protected readonly options = [
        'Apple',
        'Apricot',
        'Avocado',
        'Banana',
        'Blueberry',
        'Bing Cherry',
        'Mango',
        'Mandarin',
        'Melon'
    ];
    protected readonly value = signal<string | null | undefined>(undefined);
}

@Component({
    selector: 'story-select-mobile',
    imports: [Select, SelectOption, FormLabel],
    template: `
        <label fdFormLabel id="sel-mobile">Favourite fruit</label>
        <fd-select
            ariaLabelledBy="sel-mobile"
            placeholder="Select an option"
            stateMessage="Select your favourite fruit"
            state="information"
            mobile
            [mobileConfig]="{
                title: 'Favourite fruit',
                hasCloseButton: true,
                approveButtonText: 'Save',
                cancelButtonText: 'Cancel'
            }"
            [(value)]="value"
        >
            @for (option of fruits; track option) {
                <li fd-option [value]="option">{{ option }}</li>
            }
        </fd-select>
        <small class="${text}">Selected value: {{ value() }}</small>
    `
})
class StorySelectMobile {
    protected readonly fruits = FRUITS;
    protected readonly value = signal<string | null | undefined>(undefined);
}

const meta: Meta<Select> = {
    title: 'Components/Select',
    component: Select,
    decorators: [
        moduleMetadata({
            imports: [
                Select,
                SelectOption,
                FormLabel,
                StorySelectModes,
                StorySelectStates,
                StorySelectRich,
                StorySelectForms,
                StorySelectProgrammatic,
                StorySelectComparator,
                StorySelectMaxHeight,
                StorySelectMobile
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'A field that opens a list of options. The focus stays on the field: while the list is open, Up and Down highlight options, Enter or Space chooses one and Escape closes the list. ' +
                    'While closed, the arrow keys, Home, End and typing change the value directly and Enter, Space, Alt+Down or F4 open the list. ' +
                    'Label it with `ariaLabelledBy` (or `ariaLabel`); in mobile mode the list opens in a dialog.'
            }
        }
    },
    argTypes: {
        state: { control: 'select', options: ['default', 'success', 'error', 'warning', 'information'] }
    },
    args: {
        placeholder: 'Select an option',
        ariaLabel: 'Fruit',
        state: 'default',
        stateMessage: '',
        disabled: false,
        readonly: false,
        inline: true
    }
};
export default meta;
type Story = StoryObj<Select>;

export const Playground: Story = {
    render: (args) => ({
        props: { ...args, fruits: FRUITS },
        template: `
            <fd-select ${argsToTemplate(args)}>
                @for (option of fruits; track option) {
                    <li fd-option [value]="option">{{ option }}</li>
                }
            </fd-select>
        `
    })
};

export const Modes: Story = { render: () => ({ template: `<story-select-modes />` }) };
export const States: Story = { render: () => ({ template: `<story-select-states />` }) };
export const RichOptions: Story = {
    name: 'Groups, icons and custom trigger',
    render: () => ({ template: `<story-select-rich />` })
};
export const Forms: Story = { render: () => ({ template: `<story-select-forms />` }) };
export const Programmatic: Story = {
    name: 'Programmatic control',
    render: () => ({ template: `<story-select-programmatic />` })
};
export const CustomComparator: Story = {
    name: 'Custom comparator',
    render: () => ({ template: `<story-select-comparator />` })
};
export const Mobile: Story = { render: () => ({ template: `<story-select-mobile />` }) };
export const MaxHeight: Story = {
    name: 'Max height',
    render: () => ({ template: `<story-select-max-height />` })
};

/** Clicks the first select of the story and waits for its list (or mobile dialog) to open. */
async function openSelect(canvasElement: HTMLElement, popup: string): Promise<void> {
    const combobox = canvasElement.querySelector<HTMLElement>('[role=combobox]')!;
    await userEvent.click(combobox);
    await waitFor(() => expect(document.querySelector(popup)).not.toBeNull());
    await waitFor(() => expect(combobox.getAttribute('aria-expanded')).toBe('true'));
}

export const OpenDefault: Story = {
    name: 'Open: default',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-select-modes />` }),
    play: ({ canvasElement }) => openSelect(canvasElement, '[role=listbox] [role=option]')
};
export const OpenRich: Story = {
    name: 'Open: groups and icons',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-select-rich />` }),
    play: ({ canvasElement }) => openSelect(canvasElement, '[role=listbox] [role=option]')
};
export const OpenMobile: Story = {
    name: 'Open: mobile',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-select-mobile />` }),
    play: ({ canvasElement }) => openSelect(canvasElement, '[role=dialog] [role=listbox]')
};
