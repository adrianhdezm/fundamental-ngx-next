import { ChangeDetectionStrategy, Component } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { FD_DEFAULT_TITLE_SIZE, Title } from './title';

const LONG = 'A very long title that does not fit into the available width of its container';

/** A container that styles its titles as H5 unless they set headerSize (dialogs do the same). */
@Component({
    selector: 'story-title-default-size',
    imports: [Title],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: FD_DEFAULT_TITLE_SIZE, useValue: 5 }],
    template: `
        <h2 fdTitle>H2 element, default size 5 from the provider</h2>
        <h3 fdTitle>H3 element, default size 5 from the provider</h3>
        <h3 fdTitle [headerSize]="2">H3 element with an explicit headerSize 2</h3>
    `
})
class StoryTitleDefaultSize {}

const meta: Meta<Title> = {
    title: 'Components/Title',
    component: Title,
    decorators: [moduleMetadata({ imports: [Title, StoryTitleDefaultSize] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Titles structure a page. Use real heading elements for the document outline and `headerSize` to change only the visual size.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Title>;

export const Semantic: Story = {
    name: 'Semantic levels',
    render: () => ({
        template: `
            <h1 fdTitle>Page Title (H1)</h1>
            <h2 fdTitle>Section Title (H2)</h2>
            <h3 fdTitle>Subsection Title (H3)</h3>
            <h4 fdTitle>Minor Heading (H4)</h4>
            <h5 fdTitle>Subheading (H5)</h5>
            <h6 fdTitle>Smallest Heading (H6)</h6>`
    })
};

export const Visual: Story = {
    name: 'Visual levels',
    render: () => ({
        template: `
            <h1 fdTitle [headerSize]="6">H1 element styled as H6</h1>
            <h2 fdTitle [headerSize]="5">H2 element styled as H5</h2>
            <h3 fdTitle [headerSize]="4">H3 element styled as H4</h3>
            <h4 fdTitle [headerSize]="3">H4 element styled as H3</h4>
            <h5 fdTitle [headerSize]="2">H5 element styled as H2</h5>
            <h6 fdTitle [headerSize]="1">H6 element styled as H1</h6>`
    })
};

export const Elision: Story = {
    name: 'Truncation',
    render: () => ({
        template: `<div class="w-[300px]"><h1 fdTitle>${LONG}</h1><h2 fdTitle headerSize="3">${LONG}</h2><h3 fdTitle headerSize="5">${LONG}</h3></div>`
    })
};

export const Wrapping: Story = {
    render: () => ({
        template: `<div class="w-[300px]"><h1 fdTitle wrap>${LONG}</h1><h2 fdTitle headerSize="3" wrap>${LONG}</h2><h3 fdTitle headerSize="5" twoLineClamp>${LONG} and that is clamped to two lines when it gets even longer than this</h3></div>`
    })
};

export const DefaultSize: Story = {
    name: 'Default size via injection',
    parameters: {
        docs: {
            description: {
                story: 'A component can provide `FD_DEFAULT_TITLE_SIZE` to give the titles inside it a default visual size; an explicit `headerSize` still wins.'
            }
        }
    },
    render: () => ({ template: `<story-title-default-size />` })
};
