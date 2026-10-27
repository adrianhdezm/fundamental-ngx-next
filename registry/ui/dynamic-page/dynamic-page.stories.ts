import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { Bar, BarRight, BarElement } from '@/ui/bar/bar';
import { Breadcrumb, BreadcrumbItem } from '@/ui/breadcrumb/breadcrumb';
import { Button } from '@/ui/button/button';
import { Facet, FacetContent, FacetGroup } from '@/ui/facets/facets';
import { FormLabel } from '@/ui/form/form';
import { Link } from '@/ui/link/link';
import { MessageStrip } from '@/ui/message-strip/message-strip';
import { ObjectNumber } from '@/ui/object-number/object-number';
import { ObjectStatusComponent } from '@/ui/object-status/object-status';
import { TabList, TabPanel } from '@/ui/tabs/tabs';
import { Text } from '@/ui/text/text';
import {
    DynamicPage,
    DynamicPageBreadcrumb,
    DynamicPageContent,
    DynamicPageFooter,
    DynamicPageGlobalActions,
    DynamicPageHeader,
    DynamicPageHeaderSubtitle,
    DynamicPageHeaderTitle,
    DynamicPageLayoutActions,
    DynamicPageSubheader,
    DynamicPageTabs,
    DynamicPageTitleContent
} from './dynamic-page';

const meta: Meta<DynamicPage> = {
    title: 'Components/Dynamic Page',
    component: DynamicPage,
    decorators: [
        moduleMetadata({
            imports: [
                DynamicPage,
                DynamicPageHeader,
                DynamicPageSubheader,
                DynamicPageContent,
                DynamicPageFooter,
                DynamicPageBreadcrumb,
                DynamicPageGlobalActions,
                DynamicPageLayoutActions,
                DynamicPageTitleContent,
                DynamicPageHeaderTitle,
                DynamicPageHeaderSubtitle,
                DynamicPageTabs,
                Avatar,
                Breadcrumb,
                BreadcrumbItem,
                Bar,
                BarRight,
                BarElement,
                Button,
                Facet,
                FacetContent,
                FacetGroup,
                FormLabel,
                Link,
                MessageStrip,
                ObjectNumber,
                ObjectStatusComponent,
                TabList,
                TabPanel,
                Text
            ]
        })
    ],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'A dynamic page has a title area (breadcrumb, title, key information, global and layout actions), a collapsible header (fd-dynamic-page-subheader) and scrolling content. Clicking the title area, the collapse button or scrolling the content collapses the header; a pinned header stays expanded. Paddings and the position of the layout actions adapt to the width of the page.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<DynamicPage>;

const BREADCRUMB = `
    <fd-dynamic-page-breadcrumb>
        <fd-breadcrumb ariaLabel="Breadcrumbs">
            <fd-breadcrumb-item><a fdLink href="#">Men</a></fd-breadcrumb-item>
            <fd-breadcrumb-item><a fdLink href="#">Shoes</a></fd-breadcrumb-item>
            <fd-breadcrumb-item><span aria-current="page">Running shoes</span></fd-breadcrumb-item>
        </fd-breadcrumb>
    </fd-dynamic-page-breadcrumb>`;

const ACTIONS = `
    <fd-dynamic-page-global-actions ariaLabel="Product actions">
        <button fdButton variant="positive" label="Accept"></button>
        <button fdButton variant="negative" label="Reject"></button>
    </fd-dynamic-page-global-actions>
    <fd-dynamic-page-layout-actions ariaLabel="Page actions">
        <button fdButton variant="transparent" glyph="resize" ariaLabel="Resize" title="Resize"></button>
        <button fdButton variant="transparent" glyph="exit-full-screen" ariaLabel="Exit full screen" title="Exit full screen"></button>
        <button fdButton variant="transparent" glyph="decline" ariaLabel="Close" title="Close"></button>
    </fd-dynamic-page-layout-actions>`;

const FACETS = `
    <fd-facet-group ariaLabel="Product facets">
        <fd-facet type="image"><fd-avatar size="l" glyph="money-bills" ariaLabel="Product" /></fd-facet>
        <fd-facet type="form" facetTitle="Technical data">
            <fd-facet-content><label fd-form-label colon for="dp-unit">Base unit</label><fd-text id="dp-unit" text="Each" /></fd-facet-content>
            <fd-facet-content><label fd-form-label colon for="dp-length">Length</label><fd-text id="dp-length" text="23.24 Centimeter" /></fd-facet-content>
            <fd-facet-content><label fd-form-label colon for="dp-width">Width</label><fd-text id="dp-width" text="86.1 Centimeter" /></fd-facet-content>
        </fd-facet>
        <fd-facet type="key-value" facetTitle="Status"><span fd-object-status status="positive" label="Delivery" large></span></fd-facet>
        <fd-facet type="key-value" facetTitle="Delivery time"><span fd-object-status status="critical" glyph="shipping-status" label="12 days" large></span></fd-facet>
        <fd-facet type="key-value" facetTitle="Pricing"><fd-object-number [number]="579" unit="EUR" status="informative" large /></fd-facet>
    </fd-facet-group>`;

const LOREM =
    'Dolor sit lorem ipsum dolor sit amet, consectetur adipisicing elit. Eius assumenda, quidem natus optio repudiandae deleniti in atque quis, sed cum asperiores minus rerum incidunt unde quod fuga amet ea reprehenderit. ';

const CONTENT = `
    <fd-dynamic-page-content>
        ${Array.from({ length: 6 }, () => `<p class="m-0 mb-4">${LOREM.repeat(4)}</p>`).join('')}
    </fd-dynamic-page-content>`;

const FOOTER = `
    <fd-dynamic-page-footer>
        <div fd-bar barDesign="floating-footer">
            <div fd-bar-right>
                <fd-bar-element><button fdButton variant="emphasized" label="Save"></button></fd-bar-element>
                <fd-bar-element><button fdButton variant="transparent" label="Cancel"></button></fd-bar-element>
            </div>
        </div>
    </fd-dynamic-page-footer>`;

const FRAME = (width: string, body: string) =>
    `<div class="h-[40rem] overflow-hidden bg-sap-background-color" style="max-width: ${width}">${body}</div>`;

export const Default: Story = {
    name: 'Facets, pinnable header and footer',
    render: () => ({
        template: FRAME(
            '100%',
            `<fd-dynamic-page ariaLabel="Product details" [expandContent]="false" positionRelative>
                <fd-dynamic-page-header title="Balenciaga Triple S Trainers" subtitle="Oversized multimaterial sneakers with quilted effect">
                    ${BREADCRUMB}
                    <fd-facet type="image"><fd-avatar size="s" glyph="money-bills" ariaLabel="Product" /></fd-facet>
                    <fd-dynamic-page-title-content>Some random things</fd-dynamic-page-title-content>
                    ${ACTIONS}
                </fd-dynamic-page-header>
                <fd-dynamic-page-subheader pinnable>${FACETS}</fd-dynamic-page-subheader>
                ${CONTENT}
                ${FOOTER}
            </fd-dynamic-page>`
        )
    })
};

export const NotCollapsible: Story = {
    name: 'Not collapsible, list background',
    render: () => ({
        template: FRAME(
            '100%',
            `<fd-dynamic-page ariaLabel="Product details" [expandContent]="false" background="list">
                <fd-dynamic-page-header title="Balenciaga Triple S Trainers" subtitle="Oversized multimaterial sneakers with quilted effect">
                    ${BREADCRUMB}
                    ${ACTIONS}
                </fd-dynamic-page-header>
                <fd-dynamic-page-subheader [collapsible]="false">
                    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ullam possimus corrupti architecto perspiciatis.
                </fd-dynamic-page-subheader>
                ${CONTENT}
            </fd-dynamic-page>`
        )
    })
};

export const Collapsed: Story = {
    name: 'Collapsed header, custom title and message strip',
    render: () => ({
        template: FRAME(
            '100%',
            `<fd-dynamic-page ariaLabel="Order" [expandContent]="false" background="transparent">
                <fd-dynamic-page-header subtitle="Created by John Li">
                    <ng-template fdDynamicPageHeaderTitle let-collapsed>
                        Order 4711 {{ collapsed ? '(collapsed)' : '' }}
                    </ng-template>
                    ${ACTIONS}
                    <fd-message-strip type="warning">The delivery date is not confirmed yet.</fd-message-strip>
                </fd-dynamic-page-header>
                <fd-dynamic-page-subheader [collapsed]="true">${FACETS}</fd-dynamic-page-subheader>
                <fd-tab-list ariaLabel="Order sections">
                    <fd-tab title="Items">${CONTENT}</fd-tab>
                    <fd-tab title="Notes">${CONTENT}</fd-tab>
                </fd-tab-list>
            </fd-dynamic-page>`
        )
    })
};

export const Small: Story = {
    name: 'Small width',
    render: () => ({
        template: FRAME(
            '24rem',
            `<fd-dynamic-page ariaLabel="Product details" [expandContent]="false" positionRelative>
                <fd-dynamic-page-header title="Balenciaga Triple S Trainers" subtitle="Oversized multimaterial sneakers">
                    ${BREADCRUMB}
                    ${ACTIONS}
                </fd-dynamic-page-header>
                <fd-dynamic-page-subheader>${FACETS}</fd-dynamic-page-subheader>
                ${CONTENT}
                ${FOOTER}
            </fd-dynamic-page>`
        )
    })
};

const TABS = (stacked: boolean) => `
    <fd-tab-list ariaLabel="Product sections"${stacked ? ' stackContent' : ''}>
        ${['General', 'Pricing', 'Stock', 'Suppliers', 'Notes']
            .map(
                (tab) => `<fd-tab title="${tab}">
                    <fd-dynamic-page-content>
                        <h3 class="m-0 mb-4 text-sap-font-header5-size">${tab}</h3>
                        ${Array.from({ length: 3 }, () => `<p class="m-0 mb-4">${LOREM.repeat(3)}</p>`).join('')}
                    </fd-dynamic-page-content>
                </fd-tab>`
            )
            .join('')}
    </fd-tab-list>`;

const TABS_PAGE = (stacked: boolean) =>
    FRAME(
        '100%',
        `<fd-dynamic-page ariaLabel="Product details" [expandContent]="false" positionRelative>
            <fd-dynamic-page-header title="Balenciaga Triple S Trainers" subtitle="Oversized multimaterial sneakers with quilted effect">
                ${BREADCRUMB}
                ${ACTIONS}
            </fd-dynamic-page-header>
            <fd-dynamic-page-subheader pinnable>${FACETS}</fd-dynamic-page-subheader>
            ${TABS(stacked)}
            ${FOOTER}
        </fd-dynamic-page>`
    );

export const Tabs: Story = {
    name: 'Tabs',
    parameters: {
        docs: {
            description: {
                story: 'An `fd-tab-list` between the header and the content: the tab bar follows the page paddings and scrolling the selected tab collapses the header.'
            }
        }
    },
    render: () => ({ template: TABS_PAGE(false) })
};

export const StackedTabs: Story = {
    name: 'Stacked tabs',
    parameters: {
        docs: {
            description: {
                story: 'With `stackContent` all sections show one below the other; the tabs follow the scrolling and only the last section leaves room for the footer.'
            }
        }
    },
    render: () => ({ template: TABS_PAGE(true) })
};
