import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Avatar } from '@/ui/avatar/avatar';
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
