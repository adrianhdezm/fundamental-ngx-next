import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '@/ui/button/button';
import { SegmentedButton } from '@/ui/segmented-button/segmented-button';
import { Title } from '@/ui/title/title';
import { Pagination } from './pagination';

const heading = 'mt-6 mb-2 first:mt-0';
const small = 'm-0 font-sap-font-family text-sap-font-small-size text-sap-content-label-color';

/** The page changes once the (simulated) request for it succeeds. */
@Component({
    selector: 'story-pagination-basic',
    imports: [Pagination, Button],
    template: `
        <fd-pagination
            ariaLabel="Basic pagination example"
            [displayTotalItems]="false"
            [totalItems]="50"
            [currentPage]="page()"
            (pageChangeStart)="request($event)"
        />
        <button fdButton label="Go to page 1" (click)="request(1)"></button>
        @if (notification()) {
            <p class="${small}">{{ notification() }}</p>
        }
    `
})
class StoryPaginationBasic {
    protected readonly page = signal(5);
    protected readonly notification = signal('');

    protected request(page: number): void {
        this.notification.set('loading...');
        setTimeout(() => {
            this.page.set(page);
            this.notification.set('page change success!');
        }, 1000);
    }
}

@Component({
    selector: 'story-pagination-showing',
    imports: [Pagination],
    template: `
        <fd-pagination
            ariaLabel="Pagination with displayTextTemplate property"
            [totalItems]="50"
            [itemsPerPage]="10"
            [displayTextTemplate]="showing"
            [(currentPage)]="page"
        />
        <ng-template #showing let-showing="showing">
            From {{ showing.from }} to {{ showing.to }}. Total items {{ showing.totalCount }}
        </ng-template>
    `
})
class StoryPaginationShowing {
    protected readonly page = signal(1);
}

@Component({
    selector: 'story-pagination-per-page',
    imports: [FormsModule, Pagination, Button, SegmentedButton, Title],
    template: `
        <h3 fdTitle headerSize="5" class="${heading}">
            <code>[itemsPerPage]="15"</code>: items per page (10 by default)
        </h3>
        <fd-pagination
            ariaLabel="Pagination with itemsPerPage property"
            [totalItems]="150"
            [itemsPerPage]="15"
            [(currentPage)]="one"
        />
        <h3 fdTitle headerSize="5" class="${heading}">
            <code>[itemsPerPageOptions]="[4, 8, 16]"</code>: the default select
        </h3>
        <fd-pagination
            ariaLabel="Pagination with itemsPerPageOptions property"
            [totalItems]="150"
            [itemsPerPageOptions]="[4, 8, 16]"
            [(itemsPerPage)]="size"
            [(currentPage)]="two"
        />
        <h3 fdTitle headerSize="5" class="${heading}">Custom items per page: a segmented button</h3>
        <p class="${small}">
            The template gets the options as <code>pageOptions</code> and the selection callback as
            <code>onSelect</code>.
        </p>
        <fd-pagination
            ariaLabel="Pagination with custom items"
            [totalItems]="150"
            [itemsPerPage]="5"
            [itemsPerPageOptions]="[2, 5, 100]"
            [itemsPerPageTemplate]="custom"
            [(currentPage)]="three"
        />
        <ng-template #custom let-onSelect="onSelect" let-pageOptions="pageOptions">
            <fd-segmented-button
                ariaLabel="Items per page"
                [ngModel]="'' + customSize"
                (ngModelChange)="customSize = +$event; onSelect(+$event)"
            >
                @for (count of pageOptions; track count) {
                    <button
                        fdButton
                        [label]="'' + count"
                        [ariaLabel]="'Show ' + count + ' items per page'"
                        [attr.value]="count"
                    ></button>
                }
            </fd-segmented-button>
        </ng-template>
    `
})
class StoryPaginationPerPage {
    protected readonly one = signal(2);
    protected readonly two = signal(2);
    protected readonly three = signal(2);
    protected readonly size = signal(4);
    protected customSize = 5;
}

@Component({
    selector: 'story-pagination-mobile',
    imports: [Pagination],
    template: `
        <fd-pagination
            ariaLabel="Mobile pagination"
            mobile
            [totalItems]="50"
            [itemsPerPage]="4"
            [itemsPerPageOptions]="[4, 8, 16]"
            [(currentPage)]="page"
        />
    `
})
class StoryPaginationMobile {
    protected readonly page = signal(2);
}

const meta: Meta<Pagination> = {
    title: 'Components/Pagination',
    component: Pagination,
    decorators: [
        moduleMetadata({
            imports: [
                Pagination,
                StoryPaginationBasic,
                StoryPaginationShowing,
                StoryPaginationPerPage,
                StoryPaginationMobile
            ]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Previous and next buttons and page numbers with ellipses, an optional items per page select and the number of results. ' +
                    'With more than nine pages the current page is an input. ' +
                    'The controls form one tab stop; Left, Right, Home and End move between them. ' +
                    'In mobile mode and on screens up to 1023px it shows first, previous, "Page: [input] of N", next and last.'
            }
        }
    },
    args: { totalItems: 500, itemsPerPage: 10, mobile: false, displayTotalItems: true }
};
export default meta;
type Story = StoryObj<Pagination>;

export const Playground: Story = {
    render: (args) => ({
        props: { ...args, page: 5 },
        template: `<fd-pagination ${argsToTemplate(args)} [(currentPage)]="page" />`
    })
};

export const Basic: Story = {
    parameters: {
        docs: {
            description: {
                story: 'The page changes when `currentPage` is updated: here after a simulated request started by `pageChangeStart`.'
            }
        }
    },
    render: () => ({ template: `<story-pagination-basic />` })
};

export const ShowingItems: Story = {
    name: 'Showing items',
    parameters: {
        docs: { description: { story: '`displayTextTemplate` sets the text that shows the items on the page.' } }
    },
    render: () => ({ template: `<story-pagination-showing />` })
};

export const ItemsPerPage: Story = {
    name: 'Items per page',
    render: () => ({ template: `<story-pagination-per-page />` })
};

export const Mobile: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Pagination switches to the mobile layout below 1024px; `mobile` shows it at any width.'
            }
        }
    },
    render: () => ({ template: `<story-pagination-mobile />` })
};

export const OpenItemsPerPage: Story = {
    name: 'Open: items per page',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-pagination-per-page />` }),
    play: async ({ canvasElement }) => {
        const combobox = canvasElement.querySelector<HTMLElement>('fd-select [role=combobox]')!;
        await userEvent.click(combobox);
        await waitFor(() => expect(document.querySelector('[role=listbox] [role=option]')).not.toBeNull());
        await waitFor(() => expect(combobox.getAttribute('aria-expanded')).toBe('true'));
    }
};
