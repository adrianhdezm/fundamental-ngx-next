import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { ObjectMarker } from './object-marker';

const row = 'flex flex-wrap items-center gap-4';
const heading = 'm-0 mt-6 mb-2 text-sap-font-header6-size font-sap-font-header-family text-sap-title-color first:mt-0';

const meta: Meta<ObjectMarker> = {
    title: 'Components/Object Marker',
    component: ObjectMarker,
    decorators: [moduleMetadata({ imports: [ObjectMarker] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Object markers show technical states of an object, such as draft, locked or favourite, as an icon, text or both. Clickable markers are links.'
            }
        }
    },
    args: { glyph: 'private', label: 'Locked', clickable: false }
};
export default meta;
type Story = StoryObj<ObjectMarker>;

export const Playground: Story = {
    render: (args) => ({ props: args, template: `<span fd-object-marker ${argsToTemplate(args)}></span>` })
};

export const Default: Story = {
    name: 'Icon, text and clickable',
    render: () => ({
        props: { glyph: 'private', toggle: (g: string) => (g === 'private' ? 'unlocked' : 'private') },
        template: `
            <h3 class="${heading}">Icon only</h3>
            <div class="${row}">
                <span fd-object-marker glyph="add-favorite" title="Favorite"></span>
                <span fd-object-marker glyph="flag" title="Flag"></span>
                <span fd-object-marker glyph="request" title="Request"></span>
                <a href="#" fd-object-marker clickable glyph="user-edit" title="Editable"></a>
                <a href="#" fd-object-marker clickable glyph="private" title="Private"></a>
            </div>
            <h3 class="${heading}">Text only</h3>
            <div class="${row}">
                <span fd-object-marker label="Draft"></span>
                <span fd-object-marker label="Request"></span>
                <a href="#" fd-object-marker clickable label="Locked"></a>
                <a href="#" fd-object-marker clickable label="Edit"></a>
            </div>
            <h3 class="${heading}">Icon and text</h3>
            <div class="${row}">
                <span fd-object-marker glyph="user-edit" label="Edit"></span>
                <span fd-object-marker glyph="private" label="Locked"></span>
                <span fd-object-marker glyph="request" label="Request"></span>
            </div>
            <h3 class="${heading}">Clickable</h3>
            <div class="${row}">
                <a href="#" fd-object-marker clickable glyph="user-edit" label="Unsaved changes" (click)="$event.preventDefault()"></a>
                <a href="#" fd-object-marker clickable [glyph]="glyph" label="Locked" (click)="$event.preventDefault(); glyph = toggle(glyph)"></a>
            </div>`
    })
};
