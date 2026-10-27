import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Text } from './text';

const LONG =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure ' +
    'dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non ' +
    'proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
const h = 'class="mt-4 mb-1 font-sap-font-header-family text-sap-font-header5-size"';

const meta: Meta<Text> = {
    title: 'Components/Text',
    component: Text,
    decorators: [moduleMetadata({ imports: [Text] })],
    parameters: {
        docs: {
            description: { component: 'Text shows paragraphs with an optional line limit and More/Less expansion.' }
        }
    }
};
export default meta;
type Story = StoryObj<Text>;

export const Basic: Story = {
    render: () => ({
        props: { long: LONG },
        template: `<h3 ${h}>Short Text</h3><fd-text text="Short text" /><h3 ${h}>Long Text</h3><fd-text [text]="long" />`
    })
};

export const MaxLines: Story = {
    name: 'Max lines',
    render: () => ({
        props: { long: LONG + ' ' + LONG },
        template: `<div class="max-w-xl"><h3 ${h}>No line limit</h3><fd-text [text]="long" /><h3 ${h}>Limited to 2 lines</h3><fd-text [text]="long" [maxLines]="2" /><h3 ${h}>Limited to 3 lines</h3><fd-text [text]="long" [maxLines]="3" /></div>`
    })
};

export const Expandable: Story = {
    render: () => ({
        props: { long: LONG + ' ' + LONG, collapsed: signal(true) },
        template: `
            <div class="max-w-xl">
                <h3 ${h}>Expandable text with 3 lines (collapsed by default)</h3>
                <fd-text [text]="long" [maxLines]="3" expandable />
                <h3 ${h}>Expandable text with two-way binding</h3>
                <fd-text [text]="long" [maxLines]="3" expandable [isCollapsed]="collapsed()" (isCollapsedChange)="collapsed.set($event)" />
                <p>Current state: {{ collapsed() ? 'Collapsed' : 'Expanded' }}</p>
                <h3 ${h}>Custom labels</h3>
                <fd-text [text]="long" [maxLines]="2" expandable moreLabel="Show more" lessLabel="Show less" />
            </div>`
    })
};

export const Whitespaces: Story = {
    render: () => ({
        props: { t: 'First line\n    Indented second line\n\nAfter an empty line' },
        template: `<h3 ${h}>Without whitespace preservation</h3><fd-text [text]="t" /><h3 ${h}>With whitespace preservation</h3><fd-text [text]="t" whitespaces />`
    })
};

export const Hyphenation: Story = {
    render: () => ({
        props: {
            t: 'Internationalization and localization are increasingly important for extraordinarily comprehensive applications.',
            soft: 'Inter­national­ization and locali­zation are increasingly important for extra­ordinarily compre­hensive appli­cations.'
        },
        template: `
            <div class="flex flex-wrap gap-6" lang="en">
                <div class="w-36"><h3 ${h}>No hyphenation</h3><fd-text [text]="t" hyphenation="none" /></div>
                <div class="w-36"><h3 ${h}>Manual (soft hyphens)</h3><fd-text [text]="soft" hyphenation="manual" /></div>
                <div class="w-36"><h3 ${h}>Automatic</h3><fd-text [text]="t" hyphenation="auto" /></div>
            </div>`
    })
};
