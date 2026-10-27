import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { SegmentedButton } from './segmented-button';

const col = 'flex flex-col items-start gap-3';
const heading = 'm-0 mt-6 mb-1 text-sap-font-header6-size font-sap-font-header-family text-sap-title-color first:mt-0';
const value = 'm-0 text-sap-font-small-size text-sap-content-label-color';

const meta: Meta<SegmentedButton> = {
    title: 'Components/Segmented Button',
    component: SegmentedButton,
    decorators: [moduleMetadata({ imports: [SegmentedButton, Button, FormsModule, JsonPipe] })],
    parameters: {
        docs: {
            description: {
                component:
                    'A segmented button lets users pick one option (or several, with toggle) from a small set. Arrow keys move between the options; Enter or Space selects. Works with forms through ngModel or form controls.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<SegmentedButton>;

export const Default: Story = {
    name: 'Single selection',
    render: () => ({
        props: { value: 'second' },
        template: `
            <div class="${col}">
                <h3 class="${heading}">Labels</h3>
                <fd-segmented-button ariaLabel="Alignment" [(ngModel)]="value">
                    <button fdButton label="Left" value="first"></button>
                    <button fdButton label="Middle" value="second"></button>
                    <button fdButton label="Right" value="third"></button>
                </fd-segmented-button>
                <h3 class="${heading}">Icons</h3>
                <fd-segmented-button ariaLabel="Tools" [(ngModel)]="value">
                    <button fdButton glyph="cart" title="Add to cart" ariaLabel="Add to cart" value="first"></button>
                    <button fdButton glyph="action" title="Action" ariaLabel="Action" value="second"></button>
                    <button fdButton glyph="activities" title="Activities" ariaLabel="Activities" value="third"></button>
                </fd-segmented-button>
                <h3 class="${heading}">Vertical</h3>
                <fd-segmented-button ariaLabel="Tools vertical" [(ngModel)]="value" vertical>
                    <button fdButton glyph="cart" title="Add to cart" ariaLabel="Add to cart" value="first"></button>
                    <button fdButton glyph="action" title="Action" ariaLabel="Action" value="second"></button>
                    <button fdButton glyph="activities" title="Activities" ariaLabel="Activities" value="third"></button>
                </fd-segmented-button>
                <p class="${value}">value: {{ value }}</p>
            </div>`
    })
};

export const Toggle: Story = {
    name: 'Multiple selection (toggle)',
    render: () => ({
        props: { value: ['first'], empty: [] },
        template: `
            <div class="${col}">
                <fd-segmented-button ariaLabel="Alignment multiple" toggle [(ngModel)]="value">
                    <button fdButton label="Left" value="first"></button>
                    <button fdButton label="Middle" value="second"></button>
                    <button fdButton label="Right" value="third"></button>
                </fd-segmented-button>
                <p class="${value}">value: {{ value | json }}</p>
                <h3 class="${heading}">Empty initial state</h3>
                <fd-segmented-button ariaLabel="Text style" toggle [(value)]="empty">
                    @for (v of ['Bold', 'Italic', 'Underline']; track v) {
                        <button fdButton [label]="v" [attr.value]="v"></button>
                    }
                </fd-segmented-button>
                <p class="${value}">value: {{ empty | json }}</p>
            </div>`
    })
};

export const Disabled: Story = {
    render: () => ({
        props: { value: 'second' },
        template: `
            <div class="${col}">
                <fd-segmented-button ariaLabel="Disabled group" [(ngModel)]="value" [disabled]="true">
                    <button fdButton label="Left" value="first"></button>
                    <button fdButton label="Middle" value="second"></button>
                    <button fdButton label="Right" value="third"></button>
                </fd-segmented-button>
                <fd-segmented-button ariaLabel="Alignment with disabled option" [(ngModel)]="value">
                    <button fdButton label="Left" value="first"></button>
                    <button fdButton label="Middle (disabled)" value="second" disabled></button>
                    <button fdButton label="Right" value="third"></button>
                </fd-segmented-button>
            </div>`
    })
};
