import { signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { FormLabel } from '@/ui/form/form';
import { Switch } from './switch';

const meta: Meta<Switch> = {
    title: 'Components/Switch',
    component: Switch,
    decorators: [
        moduleMetadata({
            imports: [Switch, FormsModule, ReactiveFormsModule, FormLabel, Button, ContentDensityDirective, JsonPipe]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'A switch turns a setting on or off and takes effect immediately. It is a checkbox with role="switch"; ' +
                    'Space toggles it. Use a semantic switch for accept/decline decisions.'
            }
        }
    },
    args: { checked: false, semantic: false, disabled: false, activeText: '', inactiveText: '' }
};
export default meta;
type Story = StoryObj<Switch>;

export const Playground: Story = {
    render: (args) => ({ props: args, template: `<fd-switch ${argsToTemplate(args)} ariaLabel="Playground" />` })
};

export const Sizes: Story = {
    render: () => ({
        props: { checked: true },
        template: `
            <label fdFormLabel id="sw-1">Default Switch</label>
            <fd-switch ariaLabelledBy="sw-1" />
            <label fdFormLabel id="sw-2">Compact Switch</label>
            <fd-switch fdCompact [(ngModel)]="checked" ariaLabelledBy="sw-2" />
            <label fdFormLabel id="sw-3">Switch with Text</label>
            <fd-switch activeText="On" inactiveText="Off" ariaLabelledBy="sw-3" />
            <label fdFormLabel id="sw-4">Compact Switch with Text</label>
            <fd-switch fdCompact activeText="On" inactiveText="Off" checked ariaLabelledBy="sw-4" />`
    })
};

export const Disabled: Story = {
    render: () => ({
        template: `
            <label fdFormLabel id="sw-d1">Default disabled Switch</label>
            <fd-switch disabled ariaLabelledBy="sw-d1" />
            <label fdFormLabel id="sw-d2">Checked disabled Switch</label>
            <fd-switch disabled checked ariaLabelledBy="sw-d2" />`
    })
};

export const Semantic: Story = {
    render: () => ({
        template: `
            <label fdFormLabel id="semantic-switch-1">Default Semantic Switch</label>
            <fd-switch semantic ariaLabelledBy="semantic-switch-1" />
            <label fdFormLabel id="semantic-switch-2">Default Semantic Compact Switch</label>
            <fd-switch semantic fdCompact checked ariaLabelledBy="semantic-switch-2" />`
    })
};

export const Binding: Story = {
    render: () => ({
        props: { first: signal(false), second: signal(true) },
        template: `
            <label fdFormLabel id="b1">Switch 1 (ngModel)</label>
            <fd-switch [ngModel]="first()" (ngModelChange)="first.set($event)" ariaLabelledBy="b1" />
            <label fdFormLabel id="b2">Switch 2 ([(checked)])</label>
            <fd-switch [checked]="second()" (checkedChange)="second.set($event)" ariaLabelledBy="b2" />
            <div class="mt-2 flex gap-2">
                <button fdButton label="Switch Both" (click)="first.set(!first()); second.set(!second())"></button>
                <button fdButton label="Switch 1" (click)="first.set(!first())"></button>
                <button fdButton label="Switch 2" (click)="second.set(!second())"></button>
            </div>
            <div aria-live="polite" class="mt-4">Switch 1: {{ first() }}<br />Switch 2: {{ second() }}</div>`
    })
};

export const ReactiveForms: Story = {
    name: 'Reactive forms',
    render: () => {
        const form = new FormGroup({
            switch1: new FormControl(false, Validators.requiredTrue),
            switch2: new FormControl(true),
            switch3: new FormControl({ value: false, disabled: true }),
            switch4: new FormControl({ value: true, disabled: true })
        });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <label fdFormLabel required id="f1">Form Switch 1</label><fd-switch required formControlName="switch1" ariaLabelledBy="f1" />
                    <label fdFormLabel id="f2">Form Switch 2</label><fd-switch formControlName="switch2" ariaLabelledBy="f2" />
                    <label fdFormLabel id="f3">Disabled Form Switch 3</label><fd-switch formControlName="switch3" ariaLabelledBy="f3" />
                    <label fdFormLabel id="f4">Disabled Form Switch 4</label><fd-switch formControlName="switch4" ariaLabelledBy="f4" />
                </form>
                <small class="text-sap-content-label-color">Value: {{ form.getRawValue() | json }} · Valid: {{ form.valid }}</small>`
        };
    }
};
