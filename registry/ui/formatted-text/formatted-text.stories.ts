import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { FormattedText } from './formatted-text';

const HTML = `
<h3>Formatted text</h3>
<p>A paragraph with <strong>strong</strong>, <em>emphasised</em>, <u>underlined</u> text, <abbr title="Abbreviation">abbr</abbr> and <code>code</code>.</p>
<ul><li>First item</li><li>Second item with <a href="https://www.sap.com">an external link</a></li></ul>
<ol><li>Numbered</li><li>List</li></ol>
<blockquote>A quotation.</blockquote>
<p>An <a href="#section">in-page link</a> keeps its target; <a href="javascript:alert(1)">script links</a> lose their href.</p>
<script>alert('removed')</script><img src="x" onerror="alert('removed')">`;

const meta: Meta<FormattedText> = {
    title: 'Components/Formatted Text',
    component: FormattedText,
    decorators: [moduleMetadata({ imports: [FormattedText] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Formatted text renders a safe subset of HTML. Scripts, images, event handlers and unsafe link schemes are removed.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<FormattedText>;

export const Default: Story = {
    render: () => ({ props: { html: HTML }, template: `<fd-formatted-text [htmlText]="html" />` })
};

export const Sized: Story = {
    name: 'Fixed height and width',
    render: () => ({
        props: { html: HTML },
        template: `<fd-formatted-text [htmlText]="html" height="10rem" width="20rem" convertedLinksDefaultTarget="_self" class="border border-sap-group-content-border-color p-2" />`
    })
};
