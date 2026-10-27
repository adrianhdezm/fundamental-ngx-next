import { Component, Injector, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { Bar, BarLeft, BarRight, BarElement } from '@/ui/bar/bar';
import { Breadcrumb, BreadcrumbItem } from '@/ui/breadcrumb/breadcrumb';
import { Button } from '@/ui/button/button';
import { Facet, FacetContent, FacetGroup } from '@/ui/facets/facets';
import {
    FlexibleColumnLayoutComponent,
    type FlexibleColumnLayout
} from '@/ui/flexible-column-layout/flexible-column-layout';
import { FormLabel } from '@/ui/form/form';
import { Link } from '@/ui/link/link';
import { List, ListItem, ListLink, ListTitle } from '@/ui/list/list';
import { MessageStrip } from '@/ui/message-strip/message-strip';
import { ObjectNumber } from '@/ui/object-number/object-number';
import { ObjectStatusComponent } from '@/ui/object-status/object-status';
import { TabList, TabPanel } from '@/ui/tabs/tabs';
import { Text } from '@/ui/text/text';
import { Title } from '@/ui/title/title';
import { Toolbar, ToolbarItem } from '@/ui/toolbar/toolbar';
import {
    Wizard,
    WizardContent,
    WizardNavigation,
    WizardNextStep,
    WizardProgressBar,
    WizardStep,
    WizardStepIndicator,
    type WizardStepStatus
} from '@/ui/wizard/wizard';
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

const PAGE_PARTS = [
    DynamicPage,
    DynamicPageHeader,
    DynamicPageSubheader,
    DynamicPageContent,
    DynamicPageFooter,
    DynamicPageBreadcrumb,
    DynamicPageGlobalActions,
    DynamicPageLayoutActions,
    DynamicPageTitleContent,
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
    ObjectNumber,
    ObjectStatusComponent,
    Text,
    Toolbar,
    ToolbarItem
];

/** Global actions in a toolbar: on small pages they move into its overflow. */
const TOOLBAR_ACTIONS = `
    <fd-dynamic-page-global-actions ariaLabel="Product actions">
        <fd-toolbar fdType="transparent" clearBorder ariaLabel="Product actions">
            <button fdToolbarItem fdButton variant="positive" label="Accept"></button>
            <button fdToolbarItem fdButton variant="negative" label="Reject"></button>
        </fd-toolbar>
    </fd-dynamic-page-global-actions>`;

const WIDTHS = [
    { label: 'Small', width: '24rem' },
    { label: 'Medium', width: '48rem' },
    { label: 'Large', width: '72rem' },
    { label: 'Extra large', width: '92rem' }
];

@Component({
    selector: 'story-dynamic-page-responsive',
    imports: PAGE_PARTS,
    template: `
        <div class="flex flex-col gap-3 p-4 font-sap-font-family text-sap-font-size text-sap-text-color">
            <div role="group" aria-label="Page width" class="flex flex-wrap items-center gap-2">
                @for (option of widths; track option.label) {
                    <button
                        fdButton
                        [label]="option.label + ' (' + option.width + ')'"
                        [toggled]="width() === option.width"
                        (click)="width.set(option.width)"
                    ></button>
                }
                <span aria-live="polite">Size: {{ page.size() }}</span>
            </div>
            <div class="overflow-x-auto">
                <div class="h-[36rem] overflow-hidden bg-sap-background-color" [style.width]="width()">
                    <fd-dynamic-page
                        #page="fdDynamicPage"
                        ariaLabel="Product details"
                        [expandContent]="false"
                        positionRelative
                    >
                        <fd-dynamic-page-header
                            title="Balenciaga Triple S Trainers"
                            subtitle="Oversized multimaterial sneakers with quilted effect"
                        >
                            ${BREADCRUMB}
                            <fd-dynamic-page-title-content>Key information</fd-dynamic-page-title-content>
                            ${TOOLBAR_ACTIONS}
                            <fd-dynamic-page-layout-actions ariaLabel="Page actions">
                                <button
                                    fdButton
                                    variant="transparent"
                                    glyph="exit-full-screen"
                                    ariaLabel="Exit full screen"
                                    title="Exit full screen"
                                ></button>
                                <button
                                    fdButton
                                    variant="transparent"
                                    glyph="decline"
                                    ariaLabel="Close"
                                    title="Close"
                                ></button>
                            </fd-dynamic-page-layout-actions>
                        </fd-dynamic-page-header>
                        <fd-dynamic-page-subheader pinnable>${FACETS}</fd-dynamic-page-subheader>
                        ${CONTENT} ${FOOTER}
                    </fd-dynamic-page>
                </div>
            </div>
        </div>
    `
})
class StoryDynamicPageResponsive {
    protected readonly widths = WIDTHS;
    protected readonly width = signal('24rem');
}

@Component({
    selector: 'story-dynamic-page-container-height',
    imports: PAGE_PARTS,
    template: `
        <div class="flex flex-col font-sap-font-family text-sap-font-size text-sap-text-color">
            @for (space of spaces(); track space) {
                <div class="flex h-16 shrink-0 items-center bg-sap-neutral-background px-4">
                    Space {{ space }} above the page
                </div>
            }
            <fd-dynamic-page
                ariaLabel="Product details"
                size="large"
                [autoResponsive]="false"
                [offset]="48"
                positionRelative
            >
                <fd-dynamic-page-header
                    title="Balenciaga Triple S Trainers"
                    subtitle="The page fills the window below its top, minus a 48px offset for the bar below it"
                >
                    ${BREADCRUMB}
                    <fd-dynamic-page-title-content>Key information</fd-dynamic-page-title-content>
                    ${TOOLBAR_ACTIONS}
                </fd-dynamic-page-header>
                <fd-dynamic-page-subheader [collapsible]="false">
                    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ullam possimus corrupti architecto
                    perspiciatis.
                </fd-dynamic-page-subheader>
                ${CONTENT}
                <fd-dynamic-page-footer>
                    <div fd-bar barDesign="floating-footer">
                        <div fd-bar-right>
                            <fd-bar-element>
                                <button
                                    fdButton
                                    label="Add space above"
                                    [disabled]="spaces().length > 1"
                                    (click)="addSpace()"
                                ></button>
                            </fd-bar-element>
                            <fd-bar-element>
                                <button
                                    fdButton
                                    label="Remove space"
                                    [disabled]="!spaces().length"
                                    (click)="removeSpace()"
                                ></button>
                            </fd-bar-element>
                        </div>
                    </div>
                </fd-dynamic-page-footer>
            </fd-dynamic-page>
            <div class="flex h-12 shrink-0 items-center bg-sap-shell-color px-4 text-sap-shell-text-color">
                Bar below the page (offset)
            </div>
        </div>
    `
})
class StoryDynamicPageContainerHeight {
    private readonly page = viewChild.required(DynamicPage);
    private readonly injector = inject(Injector);
    protected readonly spaces = signal<number[]>([]);

    protected addSpace(): void {
        this.spaces.update((spaces) => [...spaces, spaces.length + 1]);
        this.refresh();
    }

    protected removeSpace(): void {
        this.spaces.update((spaces) => spaces.slice(0, -1));
        this.refresh();
    }

    /** The page moved: recompute its height once the spaces are rendered. */
    private refresh(): void {
        afterNextRender(() => this.page().refreshSize(), { injector: this.injector });
    }
}

@Component({
    selector: 'story-dynamic-page-fcl',
    imports: [...PAGE_PARTS, BarLeft, FlexibleColumnLayoutComponent, List, ListItem, ListLink, ListTitle, Title],
    template: `
        <fd-flexible-column-layout class="h-[40rem]" [(layout)]="layout">
            <ng-template #startColumn>
                <div class="h-full bg-sap-group-content-background">
                    <div fd-bar>
                        <div fd-bar-left>
                            <fd-bar-element><h2 fd-title headerSize="5" class="m-0">Products</h2></fd-bar-element>
                        </div>
                    </div>
                    <ul fd-list navigationIndicator aria-label="Products">
                        @for (product of products; track product) {
                            <li fd-list-item>
                                <a
                                    fd-list-link
                                    href="#"
                                    [navigated]="product === selected()"
                                    (click)="$event.preventDefault(); open(product)"
                                >
                                    <span fd-list-title>{{ product }}</span>
                                </a>
                            </li>
                        }
                    </ul>
                </div>
            </ng-template>
            <ng-template #midColumn>
                <fd-dynamic-page ariaLabel="Product details" [expandContent]="false" positionRelative>
                    <fd-dynamic-page-header
                        [title]="selected()"
                        subtitle="Oversized multimaterial sneakers with quilted effect"
                    >
                        ${BREADCRUMB} ${TOOLBAR_ACTIONS}
                        <fd-dynamic-page-layout-actions ariaLabel="Column actions">
                            @if (layout() === 'OneColumnMidFullScreen') {
                                <button
                                    fdButton
                                    variant="transparent"
                                    glyph="exit-full-screen"
                                    ariaLabel="Exit full screen"
                                    title="Exit full screen"
                                    (click)="layout.set('TwoColumnsMidExpanded')"
                                ></button>
                            } @else {
                                <button
                                    fdButton
                                    variant="transparent"
                                    glyph="full-screen"
                                    ariaLabel="Full screen"
                                    title="Full screen"
                                    (click)="layout.set('OneColumnMidFullScreen')"
                                ></button>
                            }
                            <button
                                fdButton
                                variant="transparent"
                                glyph="decline"
                                ariaLabel="Close"
                                title="Close"
                                (click)="layout.set('OneColumnStartFullScreen')"
                            ></button>
                        </fd-dynamic-page-layout-actions>
                    </fd-dynamic-page-header>
                    <fd-dynamic-page-subheader pinnable>${FACETS}</fd-dynamic-page-subheader>
                    ${CONTENT}
                </fd-dynamic-page>
            </ng-template>
        </fd-flexible-column-layout>
    `
})
class StoryDynamicPageFcl {
    protected readonly products = ['Balenciaga Triple S Trainers', 'Running shoes', 'Trail shoes'];
    protected readonly selected = signal(this.products[0]);
    protected readonly layout = signal<FlexibleColumnLayout>('TwoColumnsMidExpanded');

    protected open(product: string): void {
        this.selected.set(product);
        if (this.layout() === 'OneColumnStartFullScreen') this.layout.set('TwoColumnsMidExpanded');
    }
}

const STEPS = ['Product type', 'Customer information', 'Payment details'];

@Component({
    selector: 'story-dynamic-page-wizard',
    imports: [
        DynamicPage,
        DynamicPageHeader,
        DynamicPageContent,
        Button,
        Title,
        Wizard,
        WizardNavigation,
        WizardProgressBar,
        WizardStep,
        WizardStepIndicator,
        WizardContent,
        WizardNextStep
    ],
    template: `
        <fd-dynamic-page ariaLabel="New order" size="large" [autoResponsive]="false">
            <fd-dynamic-page-header title="This is a wizard title" />
            <fd-dynamic-page-content class="overflow-hidden p-0">
                <fd-wizard>
                    <fd-wizard-navigation>
                        <ul fd-wizard-progress-bar size="lg" aria-label="Wizard steps">
                            @for (step of steps; track step; let i = $index; let last = $last) {
                                <li
                                    fd-wizard-step
                                    [(status)]="status[i]"
                                    [label]="step"
                                    [ariaLabel]="'Step ' + (i + 1) + ': ' + step"
                                >
                                    <fd-wizard-step-indicator [glyph]="glyphs[i]" />
                                    <fd-wizard-content size="lg">
                                        <h3 fdTitle headerSize="4" class="mb-4">{{ i + 1 }}. {{ step }}</h3>
                                        <p class="m-0">${LOREM.repeat(5)}</p>
                                        @if (!last) {
                                            <fd-wizard-next-step>
                                                <button
                                                    fdButton
                                                    variant="emphasized"
                                                    [label]="'Go to step ' + (i + 2)"
                                                    (click)="go(i + 1)"
                                                ></button>
                                            </fd-wizard-next-step>
                                        }
                                    </fd-wizard-content>
                                </li>
                            }
                        </ul>
                    </fd-wizard-navigation>
                </fd-wizard>
            </fd-dynamic-page-content>
        </fd-dynamic-page>
    `
})
class StoryDynamicPageWizard {
    protected readonly steps = STEPS;
    protected readonly glyphs = ['product', 'user-edit', 'credit-card'];
    protected readonly status: WizardStepStatus[] = ['current', 'upcoming', 'upcoming'];

    protected go(step: number): void {
        this.steps.forEach((_, i) => (this.status[i] = i < step ? 'completed' : i === step ? 'current' : 'upcoming'));
    }
}

export const Responsive: Story = {
    name: 'Responsive',
    decorators: [moduleMetadata({ imports: [StoryDynamicPageResponsive] })],
    parameters: {
        docs: {
            description: {
                story: 'The same page at the four sizes: paddings follow the size, the layout actions move up next to the breadcrumb below 1280px, and on small pages the global actions toolbar moves its actions into the overflow.'
            }
        }
    },
    render: () => ({ template: `<story-dynamic-page-responsive />` })
};

export const ContainerHeight: Story = {
    name: 'Dynamic height of the parent',
    decorators: [moduleMetadata({ imports: [StoryDynamicPageContainerHeight] })],
    parameters: {
        docs: {
            description: {
                story: 'The page fills the window below its top minus `offset`. When content above it changes, `refreshSize()` recomputes the height.'
            }
        }
    },
    render: () => ({ template: `<story-dynamic-page-container-height />` })
};

export const InFlexibleColumnLayout: Story = {
    name: 'Inside a flexible column layout',
    decorators: [moduleMetadata({ imports: [StoryDynamicPageFcl] })],
    render: () => ({ template: `<story-dynamic-page-fcl />` })
};

export const WithWizard: Story = {
    name: 'With wizard',
    decorators: [moduleMetadata({ imports: [StoryDynamicPageWizard] })],
    render: () => ({ template: `<story-dynamic-page-wizard />` })
};
