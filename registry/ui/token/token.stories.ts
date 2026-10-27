import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { Token, Tokenizer, TokenizerInput } from './token';

const FRUITS = ['Apple', 'Banana', 'Cherry', 'Dragon fruit', 'Elderberry', 'Fig', 'Grape', 'Honeydew', 'Kiwi', 'Lemon'];

@Component({
    selector: 'story-tokens',
    imports: [Token],
    template: `
        <div class="flex flex-wrap items-center gap-2" role="listbox" aria-label="Tokens">
            <fd-token>Default</fd-token>
            <fd-token [selected]="true">Selected</fd-token>
            <fd-token readOnly>Read only</fd-token>
            <fd-token disabled>Disabled</fd-token>
            <fd-token>A token with a long text that truncates when it does not fit</fd-token>
        </div>
    `
})
class StoryTokens {}

@Component({
    selector: 'story-tokenizer',
    imports: [Token, Tokenizer, TokenizerInput, ContentDensityDirective],
    template: `
        <div [style.max-width]="width()" [fdContentDensity]="compact() ? 'compact' : 'cozy'">
            <fd-tokenizer [glyph]="glyph() ? 'value-help' : null" glyphAriaLabel="Value help">
                @for (value of values(); track value) {
                    <fd-token [readOnly]="value === 'Fig'" (onCloseClick)="remove(value)">{{ value }}</fd-token>
                }
                <input
                    #field
                    fdTokenizerInput
                    aria-label="Fruits"
                    placeholder="Type a fruit and press Enter"
                    (keydown.enter)="add(field)"
                />
            </fd-tokenizer>
        </div>
        <p class="m-0 mt-2 font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">
            {{ values().length }} tokens
        </p>
    `
})
class StoryTokenizer {
    readonly width = input('32rem');
    readonly compact = input(false);
    readonly glyph = input(false);
    readonly count = input(6);
    protected readonly values = signal<string[]>([]);
    constructor() {
        queueMicrotask(() => this.values.set(FRUITS.slice(0, this.count())));
    }
    protected remove(value: string): void {
        this.values.update((v) => v.filter((x) => x !== value));
    }
    protected add(field: HTMLInputElement): void {
        const value = field.value.trim();
        if (value && !this.values().includes(value)) this.values.update((v) => [...v, value]);
        field.value = '';
    }
}

const meta: Meta<Tokenizer> = {
    title: 'Components/Token',
    component: Tokenizer,
    decorators: [moduleMetadata({ imports: [StoryTokens, StoryTokenizer] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Tokens represent chosen values. In a tokenizer they share one field with an input: Left and Right move between the tokens and the input, Backspace and Delete remove the focused or selected tokens, Space selects, Ctrl+A selects all, and Ctrl or Shift clicks extend the selection. ' +
                    'While the tokenizer does not have the focus, tokens that do not fit collapse into an "n more" link that lists them in a popover.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Tokenizer>;

export const Tokens: Story = { render: () => ({ template: `<story-tokens />` }) };
export const TokenizerStory: Story = { name: 'Tokenizer', render: () => ({ template: `<story-tokenizer />` }) };
export const Overflow: Story = { render: () => ({ template: `<story-tokenizer width="20rem" [count]="10" />` }) };
export const Compact: Story = { render: () => ({ template: `<story-tokenizer [compact]="true" [glyph]="true" />` }) };

export const OpenOverflow: Story = {
    name: 'Open: overflow',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-tokenizer width="20rem" [count]="10" />` }),
    play: async ({ canvasElement }) => {
        const more = await waitFor(() => {
            const link = canvasElement.querySelector<HTMLElement>('[data-tokenizer-more]');
            expect(link).not.toBeNull();
            return link!;
        });
        await userEvent.click(more);
        await waitFor(() => expect(document.querySelector('.cdk-overlay-container [role=list] button')).not.toBeNull());
    }
};
