import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
import { Button } from '@/ui/button/button';
import { Combobox } from '@/ui/combobox/combobox';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { Title } from '@/ui/title/title';
import { Bar, BarElement, BarLeft, BarMiddle, BarRight, ButtonBar } from './bar';

const IMPORTS = [Bar, BarLeft, BarMiddle, BarRight, BarElement, ButtonBar, Avatar, Title];
const col = 'flex flex-col gap-8';
const label = 'm-0 mb-2 text-sap-font-small-size text-sap-content-label-color';

const sections = (aria: string, extra = '') => `
    <div fd-bar ${extra} aria-label="${aria}">
        <div fd-bar-left>
            <fd-button-bar ariaLabel="Back" glyph="navigation-left-arrow" />
            <fd-bar-element>Left Section</fd-bar-element>
        </div>
        <div fd-bar-middle><fd-bar-element>Middle Section</fd-bar-element></div>
        <div fd-bar-right>
            <fd-bar-element>Right Section</fd-bar-element>
            <fd-bar-element><fd-avatar size="xs" label="John Doe" image="assets/person.svg" /></fd-bar-element>
        </div>
    </div>`;

const meta: Meta<Bar> = {
    title: 'Components/Bar',
    component: Bar,
    decorators: [moduleMetadata({ imports: IMPORTS })],
    parameters: {
        docs: {
            description: {
                component:
                    'Bars hold titles and actions in left, middle and right areas. They serve as headers, subheaders and footers of pages, dialogs and popovers.'
            }
        }
    },
    argTypes: {
        barDesign: {
            control: 'select',
            options: [null, 'header', 'subheader', 'header-with-subheader', 'footer', 'floating-footer']
        },
        size: { control: 'select', options: ['', 's', 'm_l', 'xl'] }
    },
    args: { barDesign: 'header', inPage: false, clear: false, size: '' }
};
export default meta;
type Story = StoryObj<Bar>;

export const Playground: Story = {
    render: (args) => ({ props: args, template: sections('Playground bar', argsToTemplate(args)) })
};

export const Designs: Story = {
    render: () => ({
        template: `
            <div class="${col}">
                <div><p class="${label}">Default</p>${sections('Default bar')}</div>
                <div>
                    <p class="${label}">Title</p>
                    <div fd-bar aria-label="Bar with title">
                        <div fd-bar-left><fd-bar-element><h5 fdTitle>Title</h5></fd-bar-element></div>
                        <div fd-bar-right><fd-button-bar glyph="action-settings" ariaLabel="Settings" /></div>
                    </div>
                </div>
                <div><p class="${label}">Header</p>${sections('Header bar', 'barDesign="header"')}</div>
                <div>
                    <p class="${label}">Header with subheader</p>
                    <div fd-bar barDesign="header-with-subheader" aria-label="Header with subheader">
                        <div fd-bar-left><fd-bar-element>Left Section</fd-bar-element></div>
                        <div fd-bar-middle><fd-bar-element>Middle Section</fd-bar-element></div>
                        <div fd-bar-right><fd-bar-element>Right Section</fd-bar-element></div>
                    </div>
                    <div fd-bar barDesign="subheader" aria-label="Subheader">
                        <div fd-bar-middle><fd-bar-element fullWidth>Middle section with a full width element</fd-bar-element></div>
                    </div>
                </div>
                <div>
                    <p class="${label}">Footer</p>
                    <div fd-bar barDesign="footer" aria-label="Footer">
                        <div fd-bar-right>
                            <fd-button-bar variant="emphasized" label="Save" />
                            <fd-button-bar label="Cancel" />
                        </div>
                    </div>
                </div>
            </div>`
    })
};

export const FloatingFooter: Story = {
    render: () => ({
        template: `
            <div class="relative h-48 overflow-hidden rounded-sap-element-border-corner-radius bg-sap-background-color">
                <p class="m-4 text-sap-text-color">Page content</p>
                <div fd-bar barDesign="floating-footer" aria-label="Floating footer">
                    <div fd-bar-right>
                        <fd-button-bar variant="emphasized" label="Save" />
                        <fd-button-bar label="Cancel" />
                    </div>
                </div>
            </div>`
    })
};

export const PageSizes: Story = {
    name: 'In page, responsive paddings',
    render: () => ({
        template: `
            <div class="${col}">
                @for (size of ['s', 'm_l', 'xl']; track size) {
                    <div>
                        <p class="${label}">Size {{ size }}</p>
                        <div fd-bar inPage [size]="$any(size)" [attr.aria-label]="'Page bar ' + size">
                            <div fd-bar-left><fd-bar-element>Left Section</fd-bar-element></div>
                            <div fd-bar-right><fd-button-bar label="Action" /></div>
                        </div>
                    </div>
                }
            </div>`
    })
};

/** A neutral placeholder logo. */
const LOGO =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'><rect width='60' height='30' rx='4' fill='%230070f2'/><text x='30' y='20' font-family='Arial' font-size='13' font-weight='bold' fill='white' text-anchor='middle'>ACME</text></svg>";

@Component({
    selector: 'story-bar-custom-shellbar',
    imports: [...IMPORTS, Button, Combobox, ContentDensityDirective, FormsModule],
    template: `
        <div fd-bar class="[--bar-bg:var(--sapShellColor)] [--bar-px:2rem]" aria-label="Custom Shellbar">
            <div fd-bar-left>
                <fd-bar-element>
                    <fd-combobox
                        fdCompact
                        isSearch
                        ariaLabel="Search"
                        placeholder="Type some text..."
                        maxHeight="250px"
                        [dropdownValues]="searchTerms"
                        [(ngModel)]="searchTerm"
                    />
                </fd-bar-element>
            </div>
            <div fd-bar-middle>
                <fd-bar-element>
                    <a href="#" class="flex" aria-label="Home" (click)="$event.preventDefault()">
                        <img class="block h-8" [src]="logo" alt="" />
                    </a>
                </fd-bar-element>
            </div>
            <div fd-bar-right>
                <fd-bar-element>
                    <button fdButton glyph="cart" ariaLabel="Add to Cart" title="Add to Cart"></button>
                </fd-bar-element>
                <fd-bar-element>
                    <fd-avatar circle size="xs" [colorAccent]="1" label="Jane Doe" />
                </fd-bar-element>
            </div>
        </div>
    `
})
class CustomShellbarStory {
    protected readonly logo = LOGO;
    protected readonly searchTerms = ['Apple', 'Banana', 'Kiwi', 'Strawberry'];
    protected readonly searchTerm = signal('');
}

export const CustomShellbar: Story = {
    name: 'Custom shellbar',
    parameters: {
        docs: {
            description: {
                story: 'A plain bar on the shell colour, composed like a shellbar: a search combobox on the left, a logo link in the middle, and a cart button and an avatar on the right.'
            }
        }
    },
    decorators: [moduleMetadata({ imports: [CustomShellbarStory] })],
    render: () => ({ template: `<story-bar-custom-shellbar />` })
};
