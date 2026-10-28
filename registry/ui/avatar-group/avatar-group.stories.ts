import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Avatar } from '@/ui/avatar/avatar';
import { Link } from '@/ui/link/link';
import { AvatarGroup, AvatarGroupItem, AvatarGroupOverflowBody, AvatarGroupOverflowButton } from './avatar-group';

const PEOPLE = [
    { name: 'Alexander Hamilton', role: 'Treasury' },
    { name: 'Benjamin Franklin', role: 'Diplomat' },
    { name: 'Charlotte Brontë', role: 'Author', image: 'assets/person.svg' },
    { name: 'Dorothy Hodgkin', role: 'Chemist' },
    { name: 'Emmy Noether', role: 'Mathematician' },
    { name: 'Frida Kahlo', role: 'Painter', image: 'assets/person.svg' },
    { name: 'Grace Hopper', role: 'Computer scientist' },
    { name: 'Hedy Lamarr', role: 'Inventor' },
    { name: 'Isaac Newton', role: 'Physicist' },
    { name: 'Jane Austen', role: 'Author' },
    { name: 'Katherine Johnson', role: 'Mathematician' },
    { name: 'Leonardo da Vinci', role: 'Polymath' }
];

const avatars = (size: string, extra = '') => `
    @for (p of people; track p.name) {
        <fd-avatar *fdAvatarGroupItem="details; title: p.name${extra}" circle border size="${size}" [label]="p.name" [image]="p.image" [title]="p.name" [ariaLabel]="p.name" />
        <ng-template #details>
            <div class="flex w-64 items-center gap-3 p-4">
                <fd-avatar circle size="s" [label]="p.name" [image]="p.image" [ariaLabel]="p.name" />
                <div>
                    <div class="font-sap-font-header-family text-sap-font-header6-size font-bold text-sap-title-color">{{ p.name }}</div>
                    <div class="text-sap-content-label-color">{{ p.role }}</div>
                    <a fdLink href="#">Send message</a>
                </div>
            </div>
        </ng-template>
    }`;

const meta: Meta<AvatarGroup> = {
    title: 'Components/Avatar Group',
    component: AvatarGroup,
    decorators: [
        moduleMetadata({
            imports: [AvatarGroup, AvatarGroupItem, AvatarGroupOverflowButton, AvatarGroupOverflowBody, Avatar, Link]
        })
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Avatar groups show the people of a team. Individual groups give each avatar its own details popover; group-type groups overlap the avatars and open one popover with all of them. Avatars that do not fit go into an overflow popover.'
            }
        }
    },
    argTypes: { size: { control: 'select', options: ['xs', 's', 'm', 'l', 'xl'] } }
};
export default meta;
type Story = StoryObj<AvatarGroup>;

export const Individual: Story = {
    name: 'Individual (resize to overflow)',
    render: () => ({
        props: { people: PEOPLE },
        template: `
            <div class="flex flex-col gap-8">
                @for (size of ['xs', 's', 'm', 'l']; track size) {
                    <div class="max-w-xl">
                        <fd-avatar-group [size]="$any(size)" overflowPopoverTitle="Team members" ariaLabel="Team members">${avatars('{{ size }}')}</fd-avatar-group>
                    </div>
                }
            </div>`.replaceAll('size="{{ size }}"', '[size]="$any(size)"')
    })
};

export const Group: Story = {
    name: 'Group type',
    render: () => ({
        props: { people: PEOPLE },
        template: `
            <div class="flex flex-col gap-8">
                <div class="max-w-md"><fd-avatar-group type="group" size="m" overflowPopoverTitle="Team members">${avatars('m')}</fd-avatar-group></div>
                <div class="max-w-md"><fd-avatar-group type="group" size="s" overflowPopoverTitle="Team members" [maxVisibleItems]="4">${avatars('s')}</fd-avatar-group></div>
            </div>`
    })
};

export const MaxVisibleAndVertical: Story = {
    name: 'Max visible, square overflow button and vertical',
    render: () => ({
        props: { people: PEOPLE },
        template: `
            <div class="flex gap-12">
                <fd-avatar-group size="s" [maxVisibleItems]="5" overflowButtonShape="square" overflowPopoverTitle="Team members">${avatars('s')}</fd-avatar-group>
                <fd-avatar-group size="xs" orientation="vertical" [maxVisibleItems]="4" overflowPopoverTitle="Team members">${avatars('xs')}</fd-avatar-group>
                <fd-avatar-group type="group" size="xs" orientation="vertical" [maxVisibleItems]="4" overflowPopoverTitle="Team members">${avatars('xs')}</fd-avatar-group>
            </div>`
    })
};

export const PopoverPlacement: Story = {
    name: 'Popover placement',
    parameters: {
        docs: {
            description: {
                story: 'The popovers open below the group (`bottom`, centred) by default, or to the right of a vertical group; `placement` aligns them differently, e.g. `bottom-end`.'
            }
        }
    },
    render: () => ({
        props: { people: PEOPLE },
        template: `
            <div class="flex flex-col gap-8 font-sap-font-family text-sap-font-size text-sap-text-color">
                <div>
                    <p class="mt-0 mb-2"><code>placement="bottom"</code> (default, centred)</p>
                    <fd-avatar-group type="group" size="m" placement="bottom" overflowPopoverTitle="Team members">${avatars('m')}</fd-avatar-group>
                </div>
                <div>
                    <p class="mt-0 mb-2"><code>placement="bottom-end"</code> (aligned to the end)</p>
                    <fd-avatar-group type="group" size="m" placement="bottom-end" overflowPopoverTitle="Team members">${avatars('m')}</fd-avatar-group>
                </div>
            </div>`
    })
};

export const OverflowButtonShape: Story = {
    name: 'Overflow button shape',
    render: () => ({
        props: { people: PEOPLE },
        template: `
            <div class="flex flex-wrap items-start gap-12 font-sap-font-family text-sap-font-size text-sap-text-color">
                <div>
                    <p class="mt-0 mb-2">Default (square overflow button)</p>
                    <fd-avatar-group size="m" class="max-w-[200px]" overflowPopoverTitle="Team members" ariaLabel="Team with a square overflow button">${avatars('m')}</fd-avatar-group>
                </div>
                <div>
                    <p class="mt-0 mb-2"><code>overflowButtonShape="circle"</code></p>
                    <fd-avatar-group size="m" class="max-w-[200px]" overflowButtonShape="circle" overflowPopoverTitle="Team members" ariaLabel="Team with a circle overflow button">${avatars('m')}</fd-avatar-group>
                </div>
            </div>`
    })
};

/** Clicks a trigger and waits for its popover body. */
async function openPopover(trigger: HTMLElement): Promise<void> {
    await userEvent.click(trigger);
    await waitFor(() => expect(document.querySelector('.cdk-overlay-pane fd-popover-body')).not.toBeNull());
}

const OPEN_INDIVIDUAL = `
    <fd-avatar-group size="s" [maxVisibleItems]="5" overflowPopoverTitle="Team members" ariaLabel="Team members">${avatars('s')}</fd-avatar-group>`;

export const OpenDetails: Story = {
    name: 'Open: avatar details',
    tags: ['!autodocs'],
    render: () => ({ props: { people: PEOPLE }, template: OPEN_INDIVIDUAL }),
    play: ({ canvasElement }) =>
        openPopover(canvasElement.querySelector<HTMLElement>('[data-avatar-group-item] [role=button]')!)
};

export const OpenGroup: Story = {
    name: 'Open: group popover',
    tags: ['!autodocs'],
    render: () => ({
        props: { people: PEOPLE },
        template: `<fd-avatar-group type="group" size="s" [maxVisibleItems]="4" overflowPopoverTitle="Team members">${avatars('s')}</fd-avatar-group>`
    }),
    play: ({ canvasElement }) => openPopover(canvasElement.querySelector<HTMLElement>('fd-avatar-group [role=button]')!)
};

export const OpenOverflow: Story = {
    name: 'Open: overflow list',
    tags: ['!autodocs'],
    render: () => ({ props: { people: PEOPLE }, template: OPEN_INDIVIDUAL }),
    play: ({ canvasElement }) =>
        openPopover(canvasElement.querySelector<HTMLElement>('[data-avatar-group-overflow] [role=button]')!)
};
