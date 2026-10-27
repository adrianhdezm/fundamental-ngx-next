import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Link } from '@/ui/link/link';
import { ObjectIdentifier } from './object-identifier';

const col = 'flex flex-col items-start gap-8';

const meta: Meta<ObjectIdentifier> = {
    title: 'Components/Object Identifier',
    component: ObjectIdentifier,
    decorators: [moduleMetadata({ imports: [ObjectIdentifier, Link] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Object identifiers show the key identifier of an object as a title, optionally a link, with a description below.'
            }
        }
    },
    args: { description: 'Description', bold: false, medium: false }
};
export default meta;
type Story = StoryObj<ObjectIdentifier>;

export const Playground: Story = {
    render: (args) => ({
        props: args,
        template: `<fd-object-identifier ${argsToTemplate(args)}>Title</fd-object-identifier>`
    })
};

export const Default: Story = {
    name: 'Title, bold and description',
    render: () => ({
        template: `
            <div class="${col}">
                <fd-object-identifier>Title</fd-object-identifier>
                <fd-object-identifier bold>Bold Title</fd-object-identifier>
                <fd-object-identifier description="Description">Title</fd-object-identifier>
                <fd-object-identifier bold description="Description">Bold Title</fd-object-identifier>
            </div>`
    })
};

export const WithLink: Story = {
    name: 'Title as link',
    render: () => ({
        template: `
            <div class="${col}">
                <fd-object-identifier><a fdLink href="#">Link</a></fd-object-identifier>
                <fd-object-identifier bold><a fdLink href="#">Bold Link</a></fd-object-identifier>
                <fd-object-identifier description="Description"><a fdLink href="#">Link</a></fd-object-identifier>
                <fd-object-identifier bold description="Description"><a fdLink href="#">Bold Link</a></fd-object-identifier>
            </div>`
    })
};

export const Medium: Story = {
    name: 'Medium size in a table',
    render: () => ({
        props: {
            rows: [
                { product: 'Notebook Basic 15', description: 'HT-1000', country: 'Germany', price: '956 EUR' },
                { product: 'Notebook Basic 17', description: 'HT-1001', country: 'Poland', price: '1,249 EUR' },
                { product: 'Notebook Basic 18', description: 'HT-1002', country: 'France', price: '1,570 EUR' }
            ]
        },
        template: `
            <table class="border-collapse bg-sap-list-background text-start">
                <thead>
                    <tr class="border-b border-sap-list-border-color">
                        <th class="p-2 text-start font-normal text-sap-list-header-text-color">Product</th>
                        <th class="p-2 text-start font-normal text-sap-list-header-text-color">Country</th>
                        <th class="p-2 text-start font-normal text-sap-list-header-text-color">Price</th>
                    </tr>
                </thead>
                <tbody>
                    @for (row of rows; track row.product) {
                        <tr class="border-b border-sap-list-border-color">
                            <td class="p-2"><fd-object-identifier medium [description]="row.description">{{ row.product }}</fd-object-identifier></td>
                            <td class="p-2 text-sap-list-text-color">{{ row.country }}</td>
                            <td class="p-2 text-sap-list-text-color">{{ row.price }}</td>
                        </tr>
                    }
                </tbody>
            </table>`
    })
};
