import { Component, input, linkedSignal, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@/ui/button/button';
import { ProductSwitch, ProductSwitchBody, ProductSwitchButton, type ProductSwitchItem } from './product-switch';

const ALL: ProductSwitchItem[] = [
    { title: 'Home', subtitle: 'Central Home', icon: 'home', stickToPosition: true, disabledDragAndDrop: true },
    { title: 'Analytics Cloud', subtitle: 'Analytics Cloud', icon: 'business-objects-experience' },
    { title: 'Catalog', subtitle: 'Ariba', icon: 'contacts' },
    { title: 'Guided Buying', icon: 'credit-card' },
    { title: 'Strategic Procurement', icon: 'cart-3' },
    { title: 'Vendor Management', subtitle: 'Fieldglass', icon: 'shipping-status' },
    { title: 'Human Capital Management', icon: 'customer' },
    { title: 'Sales Cloud', subtitle: 'Sales Cloud', icon: 'sales-notification' },
    { title: 'Commerce Cloud', subtitle: 'Commerce Cloud', icon: 'retail-store' },
    { title: 'Marketing Cloud', subtitle: 'Marketing Cloud', icon: 'marketing-campaign' },
    { title: 'Service Cloud', icon: 'family-care' },
    {
        title: 'Customer Data Cloud',
        icon: 'customer-briefing',
        // an image or glyph avatar: initials would be visible text missing from the item's name (WCAG 2.5.3)
        avatar: { glyph: 'customer-briefing', colorAccent: 6 }
    }
];

@Component({
    selector: 'story-product-switch',
    imports: [ProductSwitch, ProductSwitchBody, ProductSwitchButton, Button],
    template: `
        <div class="flex items-center justify-end gap-2">
            <span class="font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">{{
                chosen()
            }}</span>
            <fd-product-switch>
                @if (custom()) {
                    <ng-template fdProductSwitchButton>
                        <button fdButton glyph="grid" label="Products" aria-haspopup="menu"></button>
                    </ng-template>
                }
                <fd-product-switch-body
                    [(products)]="products"
                    [busy]="busy()"
                    [forceListMode]="list()"
                    (itemClicked)="chosen.set('Opened ' + $event.title)"
                />
            </fd-product-switch>
        </div>
    `
})
class StoryProductSwitch {
    readonly count = input(12);
    readonly list = input(false);
    readonly busy = input(false);
    readonly custom = input(false);
    // derived from the inputs, so the first render already has the right products (and drops can reorder them)
    protected readonly products = linkedSignal<ProductSwitchItem[]>(() =>
        ALL.slice(0, this.count()).map((p) => ({ ...p, callback: () => undefined }))
    );
    protected readonly chosen = signal('');
}

const NAVIGATION: ProductSwitchItem[] = [
    { title: 'SAP Start', subtitle: 'Opens in new tab (default)', icon: 'home', url: 'https://www.sap.com' },
    {
        title: 'SAP Ariba',
        subtitle: 'Opens in new tab (explicit)',
        icon: 'contacts',
        url: 'https://www.sap.com/products/spend-management/ariba-network.html',
        target: '_blank'
    },
    {
        title: 'Business Data Cloud',
        subtitle: 'Opens in same tab',
        icon: 'business-objects-experience',
        url: 'https://www.sap.com/products/technology-platform/business-data-cloud.html',
        target: '_self'
    },
    { title: 'Callback Only', subtitle: 'No navigation, fires callback', icon: 'action' }
];

@Component({
    selector: 'story-product-switch-navigation',
    imports: [ProductSwitch, ProductSwitchBody],
    template: `
        <div class="flex items-center justify-end gap-2">
            <span class="font-sap-font-family text-sap-font-size text-sap-text-color" aria-live="polite">{{
                chosen()
            }}</span>
            <fd-product-switch>
                <fd-product-switch-body [products]="products" />
            </fd-product-switch>
        </div>
    `
})
class StoryProductSwitchNavigation {
    protected readonly chosen = signal('');
    protected readonly products = NAVIGATION.map((p) =>
        p.url ? p : { ...p, callback: () => this.chosen.set('Custom callback fired') }
    );
}

/** Opens the product switch from its button (named `name`) and waits for the products. */
function openSwitch(name = 'Product switch'): Story['play'] {
    return async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name }));
        await waitFor(() => expect(document.querySelector('[role=menu] [role=menuitem]')).not.toBeNull());
    };
}

const meta: Meta<ProductSwitch> = {
    title: 'Components/Product Switch',
    component: ProductSwitch,
    decorators: [moduleMetadata({ imports: [StoryProductSwitch, StoryProductSwitchNavigation] })],
    parameters: {
        docs: {
            story: { inline: false, iframeHeight: 640 },
            description: {
                component:
                    'The product switch (usually in the shellbar) opens the products of the user: a grid of four columns for 7 or more products, three for 3 to 6, two for fewer, and a list on small screens. ' +
                    'Products can be reordered by drag and drop (sticky products keep their place). Arrow keys move between them; Enter and Space open them.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<ProductSwitch>;

export const Large: Story = { name: 'Large (4 columns)', render: () => ({ template: `<story-product-switch />` }) };
export const Medium: Story = {
    name: 'Medium (3 columns)',
    render: () => ({ template: `<story-product-switch [count]="6" />` })
};
export const Small: Story = {
    name: 'Two columns',
    render: () => ({ template: `<story-product-switch [count]="2" />` })
};
export const List: Story = { name: 'List', render: () => ({ template: `<story-product-switch [list]="true" />` }) };
export const Busy: Story = {
    name: 'Busy and custom button',
    render: () => ({ template: `<story-product-switch [busy]="true" [custom]="true" />` })
};
export const Navigation: Story = {
    name: 'URL navigation',
    parameters: {
        docs: {
            description: {
                story:
                    'Products with a `url` open it with `window.open` in their `target` (`_blank` by default), unless they have a `callback`. ' +
                    'They are rendered as links, and a target other than `_self` is added to the accessible name.'
            }
        }
    },
    render: () => ({ template: `<story-product-switch-navigation />` })
};
export const OpenLarge: Story = {
    name: 'Open: large',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-product-switch />` }),
    play: openSwitch()
};
export const OpenMedium: Story = {
    name: 'Open: medium',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-product-switch [count]="6" />` }),
    play: openSwitch()
};
export const OpenTwoColumns: Story = {
    name: 'Open: two columns',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-product-switch [count]="2" />` }),
    play: openSwitch()
};
export const OpenList: Story = {
    name: 'Open: list',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-product-switch [list]="true" />` }),
    play: openSwitch()
};
export const OpenBusy: Story = {
    name: 'Open: busy',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-product-switch [busy]="true" [custom]="true" />` }),
    play: openSwitch('Products')
};
export const OpenNavigation: Story = {
    name: 'Open: URL navigation',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-product-switch-navigation />` }),
    play: openSwitch()
};
