import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Icon } from '@/ui/icon/icon';
import { Link } from '@/ui/link/link';
import { Breadcrumb, BreadcrumbItem, type BreadcrumbSeparatorStyle } from './breadcrumb';

const TEXT = 'font-sap-font-family text-sap-font-size text-sap-text-color';

@Component({
    selector: 'story-breadcrumb',
    imports: [Breadcrumb, BreadcrumbItem, Link, Icon],
    template: `
        <div
            class="resize-x overflow-hidden border border-dashed border-sap-group-content-border-color p-2"
            [style.width]="width()"
        >
            <fd-breadcrumb
                [ariaLabel]="label()"
                [separatorStyle]="separatorStyle()"
                [reverse]="reverse()"
                (hiddenItemsCount)="hidden.set($event)"
            >
                @for (step of steps; track step; let last = $last) {
                    <fd-breadcrumb-item>
                        @if (last && current()) {
                            <span aria-current="page">{{ step }}</span>
                        } @else {
                            <a fdLink href="#" (click)="$event.preventDefault(); clicked.set(step)">
                                @if ($first) {
                                    <fd-icon glyph="home" />
                                }
                                {{ step }}
                            </a>
                        }
                    </fd-breadcrumb-item>
                }
            </fd-breadcrumb>
        </div>
        <p class="${TEXT}" aria-live="polite">
            {{ hidden() }} collapsed. {{ clicked() ? 'Navigated to ' + clicked() : '' }}
        </p>
    `
})
class StoryBreadcrumb {
    readonly width = input('100%');
    readonly separatorStyle = input<BreadcrumbSeparatorStyle>('');
    readonly reverse = input(false);
    readonly current = input(true);
    readonly label = input('Breadcrumb trail');
    protected readonly steps = ['Home', 'Products', 'Computers', 'Laptops', 'Business laptops', 'Model 15 Pro'];
    protected readonly hidden = signal(0);
    protected readonly clicked = signal('');
}

const meta: Meta<StoryBreadcrumb> = {
    title: 'Components/Breadcrumb',
    component: StoryBreadcrumb,
    decorators: [moduleMetadata({ imports: [StoryBreadcrumb] })],
    argTypes: {
        separatorStyle: {
            control: 'select',
            options: ['', 'backslash', 'double-slash', 'double-backslash', 'greater-than', 'double-greater-than']
        }
    },
    parameters: {
        docs: {
            story: { inline: false, iframeHeight: 280 },
            description: {
                component:
                    'A breadcrumb shows the path from the root to the current page (`aria-current="page"`). Items that do not fit collapse into a menu at the start. ' +
                    'The trail has one tab stop; the arrow keys move between the visible links (mirrored in RTL). Resize the dashed box to collapse items.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<StoryBreadcrumb>;

export const Default: Story = {
    name: 'Breadcrumb',
    args: { width: '100%', separatorStyle: '', reverse: false, current: true },
    render: (args) => ({
        props: args,
        template: `<story-breadcrumb [width]="width" [separatorStyle]="separatorStyle" [reverse]="reverse" [current]="current" />`
    })
};

export const Separators: Story = {
    name: 'Separator styles',
    render: () => ({
        template: `
            <story-breadcrumb separatorStyle="backslash" label="Backslash trail" />
            <story-breadcrumb separatorStyle="double-slash" label="Double slash trail" />
            <story-breadcrumb separatorStyle="double-backslash" label="Double backslash trail" />
            <story-breadcrumb separatorStyle="greater-than" label="Greater than trail" />
            <story-breadcrumb separatorStyle="double-greater-than" [current]="false" label="Double greater than trail" />
        `
    })
};

export const Overflow: Story = {
    name: 'Collapsed items',
    render: () => ({
        template: `
            <story-breadcrumb width="22rem" />
            <story-breadcrumb width="22rem" [reverse]="true" label="Reversed trail" />
        `
    })
};

export const OpenOverflow: Story = {
    name: 'Open: collapsed items',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-breadcrumb width="22rem" />` }),
    play: async ({ canvasElement }) => {
        const more = await waitFor(() => {
            const el = canvasElement.querySelector<HTMLElement>('[data-breadcrumb-more]');
            expect(el).not.toBeNull();
            return el!;
        });
        await userEvent.click(more);
        await waitFor(() => expect(more.getAttribute('aria-expanded')).toBe('true'));
        await waitFor(() => expect(document.querySelector('.cdk-overlay-container [role=menuitem]')).not.toBeNull());
    }
};
