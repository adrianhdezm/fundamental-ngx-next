import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
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
            </div>`
    })
};
