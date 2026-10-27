import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Title } from './title';

const LONG = 'A very long title that does not fit into the available width of its container';

const meta: Meta<Title> = {
    title: 'Components/Title',
    component: Title,
    decorators: [moduleMetadata({ imports: [Title] })],
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
        template: `<div class="w-[300px]"><h1 fdTitle>${LONG}</h1><h3 fdTitle>${LONG}</h3><h5 fdTitle>${LONG}</h5></div>`
    })
};

export const Wrapping: Story = {
    render: () => ({
        template: `<div class="w-[300px]"><h1 fdTitle wrap>${LONG}</h1><h3 fdTitle wrap>${LONG}</h3><h5 fdTitle twoLineClamp>${LONG} and that is clamped to two lines when it gets even longer than this</h5></div>`
    })
};
