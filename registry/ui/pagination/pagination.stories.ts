import { Component, signal } from '@angular/core';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Pagination } from './pagination';

const small = 'm-0 font-sap-font-family text-sap-font-small-size text-sap-content-label-color';

@Component({
    selector: 'story-pagination-examples',
    imports: [Pagination],
    template: `
        <div class="flex flex-col gap-6">
            <div>
                <p class="${small}">More than nine pages: an input for the current page</p>
                <fd-pagination ariaLabel="Pagination with many pages" [totalItems]="500" [(currentPage)]="one" />
                <p class="${small}">Current page: {{ one() }}</p>
            </div>
            <div>
                <p class="${small}">Up to nine pages</p>
                <fd-pagination ariaLabel="Pagination with few pages" [totalItems]="50" [(currentPage)]="two" />
            </div>
            <div>
                <p class="${small}">Items per page</p>
                <fd-pagination
                    ariaLabel="Pagination with items per page"
                    [totalItems]="500"
                    [itemsPerPageOptions]="[4, 8, 16, 32]"
                    [(itemsPerPage)]="size"
                    [(currentPage)]="three"
                />
                <p class="${small}">Page {{ three() }}, {{ size() }} items per page</p>
            </div>
            <div>
                <p class="${small}">Showing text</p>
                <fd-pagination
                    ariaLabel="Pagination with a showing text"
                    [totalItems]="237"
                    [itemsPerPage]="20"
                    [displayTextTemplate]="showing"
                    [(currentPage)]="four"
                />
                <ng-template #showing let-showing="showing"
                    >Showing {{ showing.from }}–{{ showing.to }} of {{ showing.totalCount }}</ng-template
                >
            </div>
            <div>
                <p class="${small}">Mobile</p>
                <fd-pagination
                    ariaLabel="Mobile pagination"
                    mobile
                    [totalItems]="500"
                    [itemsPerPageOptions]="[10, 20]"
                    [(currentPage)]="five"
                />
            </div>
        </div>
    `
})
class StoryPaginationExamples {
    protected readonly one = signal(30);
    protected readonly two = signal(2);
    protected readonly three = signal(125);
    protected readonly four = signal(1);
    protected readonly five = signal(7);
    protected readonly size = signal(4);
}

const meta: Meta<Pagination> = {
    title: 'Components/Pagination',
    component: Pagination,
    decorators: [moduleMetadata({ imports: [Pagination, StoryPaginationExamples] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Previous and next buttons, page numbers with ellipses (or, with more than nine pages, an input for the current page), an optional items per page select and the number of results. ' +
                    'The controls form one tab stop; Left, Right, Home and End move between them. In mobile mode and on screens up to 1023px it shows first, previous, the page input, next and last.'
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
export const Examples: Story = { render: () => ({ template: `<story-pagination-examples />` }) };
