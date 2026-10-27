import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { FormLabel } from '@/ui/form/form';
import { Icon } from '@/ui/icon/icon';
import { Link } from '@/ui/link/link';
import { ObjectNumber } from '@/ui/object-number/object-number';
import { ObjectStatusComponent } from '@/ui/object-status/object-status';
import { Skeleton } from '@/ui/skeleton/skeleton';
import { Text } from '@/ui/text/text';
import { Facet, FacetContainer, FacetContent, FacetFormValue, FacetGroup } from './facets';

const meta: Meta<Facet> = {
    title: 'Components/Facets',
    component: Facet,
    decorators: [
        moduleMetadata({
            imports: [
                FacetGroup,
                Facet,
                FacetContent,
                FacetFormValue,
                FacetContainer,
                Avatar,
                FormLabel,
                Icon,
                Link,
                ObjectNumber,
                ObjectStatusComponent,
                Skeleton,
                Text
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Facets show key information in the header of an object page: form facets (label and value rows), key-value facets (an object status or number), rating facets and image facets. A facet group lays them out in a wrapping row; alignEnd pushes a facet to the end.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Facet>;

const FORM = (id: string) => `
    <fd-facet type="form" facetTitle="Technical data" headingLevel="3">
        <fd-facet-content>
            <label fd-form-label colon for="${id}-1">Base unit</label>
            <fd-text text="Each" id="${id}-1" />
        </fd-facet-content>
        <fd-facet-content>
            <label fd-form-label colon for="${id}-2">Length</label>
            <fd-text text="23.24 Centimeter" id="${id}-2" />
        </fd-facet-content>
        <fd-facet-content>
            <label fd-form-label colon for="${id}-3">Width</label>
            <fd-text text="86.1 Centimeter" id="${id}-3" />
        </fd-facet-content>
        <fd-facet-content>
            <label fd-form-label colon for="${id}-4">Height</label>
            <fd-text text="20.8 Centimeter" id="${id}-4" />
        </fd-facet-content>
    </fd-facet>`;

const KEY_VALUES = `
    <fd-facet type="key-value" facetTitle="Status" headingLevel="3">
        <span fd-object-status status="positive" label="Delivery" large></span>
    </fd-facet>
    <fd-facet type="key-value" facetTitle="Delivery time" headingLevel="3">
        <span fd-object-status status="critical" glyph="shipping-status" label="12 days" large></span>
    </fd-facet>
    <fd-facet type="key-value" facetTitle="Assembly option" headingLevel="3">
        <span fd-object-status status="negative" label="To be selected" large></span>
    </fd-facet>
    <fd-facet type="key-value" facetTitle="Pricing" headingLevel="3">
        <fd-object-number [number]="579" unit="EUR" status="informative" large />
    </fd-facet>`;

const STARS = `
    <span class="flex text-[1.375rem]" role="img" aria-label="2.5 of 5 stars">
        <fd-icon glyph="favorite" class="text-[1.375rem] text-sap-content-rated-color" />
        <fd-icon glyph="favorite" class="text-[1.375rem] text-sap-content-rated-color" />
        <fd-icon glyph="favorite" class="text-[1.375rem] text-sap-content-rated-color" />
        <fd-icon glyph="unfavorite" class="text-[1.375rem] text-sap-content-unrated-color" />
        <fd-icon glyph="unfavorite" class="text-[1.375rem] text-sap-content-unrated-color" />
    </span>
    <span class="self-end text-sap-font-small-size text-sap-content-label-color">(3 of 5)</span>`;

export const Group: Story = {
    name: 'Facet group',
    render: () => ({
        template: `
            <fd-facet-group ariaLabel="Product facets">
                <fd-facet type="image">
                    <fd-avatar size="l" glyph="money-bills" ariaLabel="Product" />
                </fd-facet>
                ${FORM('group')}
                ${KEY_VALUES}
                <fd-facet type="rating-indicator" facetTitle="Average user rating" subtitle="6 reviews" headingLevel="3">
                    <fd-facet-content>${STARS}</fd-facet-content>
                </fd-facet>
            </fd-facet-group>`
    })
};

export const FormFacet: Story = {
    name: 'Form facet',
    render: () => ({
        template: `
            <fd-facet-group ariaLabel="Form facets">
                ${FORM('form')}
                <fd-facet type="form" facetTitle="Contact" headingLevel="3">
                    <fd-facet-content>
                        <fd-icon glyph="phone" ariaLabel="Phone" />
                        <a fdLink href="#">+1 202 555 0118</a>
                    </fd-facet-content>
                    <fd-facet-content>
                        <fd-icon glyph="email" ariaLabel="Email" />
                        <a fdLink href="#">sales&#64;example.com</a>
                    </fd-facet-content>
                    <fd-facet-content>
                        <label fd-form-label colon for="form-value-city">City</label>
                        <span fd-facet-form-value id="form-value-city">Walldorf</span>
                    </fd-facet-content>
                </fd-facet>
            </fd-facet-group>`
    })
};

export const KeyValue: Story = {
    name: 'Key-value facets',
    render: () => ({ template: `<fd-facet-group ariaLabel="Key values">${KEY_VALUES}</fd-facet-group>` })
};

export const Alignment: Story = {
    name: 'Alignment',
    render: () => ({
        template: `
            <fd-facet-group ariaLabel="Aligned facets">
                <fd-facet type="image">
                    <fd-avatar size="l" image="assets/landscape.svg" ariaLabel="Landscape" />
                </fd-facet>
                <fd-facet type="key-value" facetTitle="Status" headingLevel="3">
                    <span fd-object-status status="positive" label="Delivery" large></span>
                </fd-facet>
                <fd-facet type="key-value" facetTitle="Pricing" alignEnd headingLevel="3">
                    <fd-object-number [number]="579" unit="EUR" large />
                </fd-facet>
            </fd-facet-group>`
    })
};

export const Loading: Story = {
    name: 'Loading',
    render: () => ({
        template: `
            <fd-facet-group ariaLabel="Loading facets" aria-busy="true">
                <fd-facet type="image"><fd-skeleton type="rectangle" width="5rem" height="5rem" /></fd-facet>
                <fd-facet type="custom">
                    <fd-facet-container [flexGap]="0.5">
                        <fd-skeleton type="text" width="8rem" [textLines]="1" />
                        <fd-skeleton type="text" width="12rem" [textLines]="3" />
                    </fd-facet-container>
                </fd-facet>
                <fd-facet type="custom">
                    <fd-facet-container [flexGap]="0.5">
                        <fd-skeleton type="text" width="6rem" [textLines]="1" />
                        <fd-skeleton type="rectangle" width="8rem" height="1.5rem" />
                    </fd-facet-container>
                </fd-facet>
            </fd-facet-group>`
    })
};
