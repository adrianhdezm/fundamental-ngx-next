import { moduleMetadata, type Meta, type StoryObj, argsToTemplate } from '@analogjs/storybook-angular';
import { Avatar } from './avatar';

const SIZES = ['xs', 's', 'm', 'l', 'xl'] as const;

const meta: Meta<Avatar> = {
    title: 'Components/Avatar',
    component: Avatar,
    decorators: [moduleMetadata({ imports: [Avatar] })],
    parameters: {
        docs: {
            description: {
                component:
                    'An avatar shows an image, initials or an icon for a person, business object or entity. ' +
                    'Give image and icon avatars an `ariaLabel`; clickable avatars become buttons.'
            }
        }
    },
    argTypes: {
        size: { control: 'inline-radio', options: SIZES },
        colorAccent: { control: { type: 'number', min: 1, max: 10 } },
        valueState: { control: 'select', options: [null, 'positive', 'caution', 'negative', 'information'] }
    },
    args: { label: 'Jane Doe', size: 'l', circle: false, clickable: false, transparent: false, border: false }
};
export default meta;
type Story = StoryObj<Avatar>;

const row = (attrs: string, extra = '') =>
    `<div class="flex flex-wrap items-center gap-4">${SIZES.map((s) => `<fd-avatar size="${s}" ${attrs}>${extra}</fd-avatar>`).join('')}</div>`;

export const Playground: Story = {
    render: (args) => ({ props: args, template: `<fd-avatar ${argsToTemplate(args)} />` })
};

export const Icon: Story = {
    parameters: {
        docs: { description: { story: 'Clickable icon avatars have role="button" and react to Enter and Space.' } }
    },
    render: () => ({
        props: { clicked: (n: number) => console.log('avatar clicked', n) },
        template: row('glyph="group" ariaLabel="Group" clickable')
    })
};

export const Initials: Story = {
    render: () => ({
        template: `<div class="flex flex-col gap-4">${row('label="Jane Doe"')}${row('label="Marjolein van Veen"')}${row('label="Anna María Agustí Suárez"')}</div>`
    })
};

export const Circle: Story = {
    render: () => ({
        template: `<div class="flex flex-col gap-4">${row('circle glyph="batch-payments" ariaLabel="Batch payments"')}${row('circle label="Jane Doe"')}</div>`
    })
};

export const BackgroundImage: Story = {
    name: 'Background image',
    render: () => ({
        template: `<div class="flex flex-wrap items-center gap-4">
            ${SIZES.map((s) => `<fd-avatar size="${s}" image="assets/landscape.svg" ariaLabel="Landscape" />`).join('')}
            <fd-avatar size="xl" contain image="assets/landscape.svg" ariaLabel="Landscape, contained" />
        </div>`
    })
};

export const Transparent: Story = {
    render: () => ({
        template: `<div class="flex flex-col gap-4">${row('transparent glyph="car-rental" ariaLabel="Car rental"')}${row('transparent label="Jane Doe"')}</div>`
    })
};

export const Placeholder: Story = {
    render: () => ({
        template: `<div class="flex flex-wrap items-center gap-4">
            <fd-avatar placeholder size="xs" glyph="product" ariaLabel="Product" />
            <fd-avatar placeholder size="s" glyph="product" ariaLabel="Product" />
            <fd-avatar placeholder size="m" glyph="product" ariaLabel="Product" />
            <fd-avatar circle placeholder size="l" glyph="person-placeholder" ariaLabel="Person" />
            <fd-avatar circle placeholder size="xl" glyph="person-placeholder" ariaLabel="Person" />
        </div>`
    })
};

export const Tile: Story = {
    render: () => ({
        template: `<div class="rounded-sap-tile-border-corner-radius bg-sap-tile-background p-4">${row('tile glyph="favorite" ariaLabel="Favorite"')}</div>`
    })
};

export const AccentColors: Story = {
    name: 'Accent and indication colors',
    render: () => ({
        props: { colors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        template: `
            <div class="flex flex-col gap-4">
                <div class="flex flex-wrap gap-4">@for (c of colors; track c) { <fd-avatar [colorAccent]="c" glyph="customer" [ariaLabel]="'Accent ' + c" /> }</div>
                <div class="flex flex-wrap gap-4">@for (c of colors; track c) { <fd-avatar [colorIndication]="c" glyph="customer" [ariaLabel]="'Indication ' + c" /> }</div>
                <div class="flex flex-wrap gap-4">@for (c of colors; track c) { <fd-avatar [colorIndication]="c" interactive tabindex="0" label="Jane Doe" /> }</div>
            </div>`
    })
};

export const ZoomIcon: Story = {
    name: 'Zoom icon',
    parameters: {
        docs: { description: { story: 'The zoom icon makes the avatar a button that emits `zoomGlyphClicked`.' } }
    },
    render: () => ({
        props: { sizes: SIZES },
        template: `<div class="flex flex-wrap items-center gap-6 p-2">
            @for (s of sizes; track s; let i = $index) {
                <fd-avatar circle [size]="s" zoomGlyph="edit" [colorAccent]="i + 1" glyph="customer" ariaLabel="Edit customer" />
            }
        </div>
        <div class="flex flex-wrap items-center gap-6 p-2">
            @for (s of sizes; track s; let i = $index) {
                <!-- the name contains the visible initials, as the avatar is a button -->
                <fd-avatar [size]="s" zoomGlyph="camera" [colorAccent]="i + 6" label="Jane Doe" ariaLabel="JD, change the photo of Jane Doe" />
            }
        </div>`
    })
};

export const Border: Story = {
    render: () => ({
        template: `<div class="flex flex-col gap-4">${row('border transparent glyph="money-bills" ariaLabel="Money"')}${row('border transparent label="Jane Doe"')}</div>`
    })
};

export const AlternativeOptions: Story = {
    name: 'Image with alternative options',
    parameters: {
        docs: {
            description: {
                story: 'When the image fails, `alterIcon` tries the projected content, the alt text, a backup image and the default icon, in the given order.'
            }
        }
    },
    render: () => ({
        template: `<div class="flex flex-wrap items-center gap-4">
            <fd-avatar size="xs" image="missing-1.jpeg" alterIcon="content|alt|backup|default-icon" backupImage="assets/person.svg">John Doe</fd-avatar>
            <fd-avatar size="s" image="missing-2.jpeg" alterIcon="content|alt|backup|default-icon" backupImage="assets/person.svg" alt="John Doe" />
            <fd-avatar size="m" image="missing-3.jpeg" alterIcon="content|alt|backup|default-icon" backupImage="assets/person.svg" ariaLabel="John Doe" />
            <fd-avatar size="l" image="missing-4.jpeg" alterIcon="alt|content|backup|default-icon" ariaLabel="John Doe" />
            <fd-avatar size="xl" image="missing-5.jpeg" alterIcon="custom" backupImage="missing-6.jpeg" ariaLabel="John Doe" />
            <fd-avatar size="xl" contain image="assets/person.svg" ariaLabel="John Doe" />
        </div>`
    })
};

export const ValueStates: Story = {
    name: 'Value states',
    render: () => ({
        template: `<div class="flex flex-wrap items-center gap-6 p-2">
            <fd-avatar [colorAccent]="2" valueState="positive" glyph="customer" ariaLabel="Customer, positive" />
            <fd-avatar [colorAccent]="3" valueState="caution" glyph="customer" ariaLabel="Customer, caution" />
            <fd-avatar [colorAccent]="4" valueState="negative" glyph="customer" ariaLabel="Customer, negative" />
            <fd-avatar [colorAccent]="5" valueState="information" glyph="customer" ariaLabel="Customer, information" />
        </div>`
    })
};
