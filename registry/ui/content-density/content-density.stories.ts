import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { FormLabel } from '@/ui/form/form';
import { FormControl } from '@/ui/input/input';
import { Switch } from '@/ui/switch/switch';
import { ContentDensityDirective } from './content-density';

const meta: Meta<ContentDensityDirective> = {
    title: 'Components/Content Density',
    component: ContentDensityDirective,
    decorators: [moduleMetadata({ imports: [ContentDensityDirective, Button, FormControl, FormLabel, Switch] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Content density sets cozy, compact or condensed sizes for an element and everything inside it. ' +
                    '`fdContentDensity`, `fdCompact`, `fdCozy` and `fdCondensed` write `data-density`; components react ' +
                    'through CSS, and the nearest `data-density` wins. The toolbar density switcher sets it on the ' +
                    'document element, which is the global density.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<ContentDensityDirective>;

const box =
    'flex flex-col gap-2 rounded-sap-element-border-corner-radius border border-dashed border-sap-neutral-border-color p-3';
const row = 'flex flex-wrap items-center gap-2';

export const Modes: Story = {
    name: 'Content density modes',
    render: () => ({
        template: `
            <div class="flex flex-col gap-4">
                <section fdCozy class="${box}">
                    <span>Cozy (<code>fdCozy</code>)</span>
                    <div class="${row}">
                        <button fdButton label="Button"></button>
                        <input fdFormControl aria-label="Cozy input" placeholder="Cozy input" />
                    </div>
                </section>
                <section fdCompact class="${box}">
                    <span>Compact (<code>fdCompact</code>)</span>
                    <div class="${row}">
                        <button fdButton label="Button"></button>
                        <input fdFormControl aria-label="Compact input" placeholder="Compact input" />
                    </div>
                </section>
                <section fdCondensed class="${box}">
                    <span>Condensed (<code>fdCondensed</code>), compact sizes where a component has no condensed size</span>
                    <div class="${row}">
                        <button fdButton label="Button"></button>
                        <input fdFormControl aria-label="Condensed input" placeholder="Condensed input" />
                    </div>
                </section>
            </div>`
    })
};

export const Directives: Story = {
    name: 'Directives and inheritance',
    render: () => ({
        template: `
            <div class="${box}">
                <span>No directive: follows the global density</span>
                <button fdButton label="Global" class="self-start"></button>
                <div fdCozy class="${box}">
                    <span>Cozy regardless of the global density (<code>fdCozy</code>)</span>
                    <div class="${box}">
                        <span>Inherits cozy from its parent (no directive)</span>
                        <button fdButton label="Inherited cozy" class="self-start"></button>
                        <div fdContentDensity="condensed" class="${box}">
                            <span>Condensed regardless of its parent (<code>fdContentDensity="condensed"</code>)</span>
                            <button fdButton label="Condensed" class="self-start"></button>
                        </div>
                    </div>
                    <div fdCompact class="${box}">
                        <span>Compact regardless of its parent (<code>fdCompact</code>)</span>
                        <button fdButton label="Compact" class="self-start"></button>
                        <div fdCozy class="${box}">
                            <span>A cozy island inside compact (<code>fdCozy</code>)</span>
                            <button fdButton label="Cozy island" class="self-start"></button>
                        </div>
                    </div>
                </div>
            </div>`
    })
};

export const Toggle: Story = {
    name: 'Toggle directive',
    render: () => ({
        props: { compact: true },
        template: `
            <div class="${box}">
                <fd-switch [(checked)]="compact">Use fdCompact</fd-switch>
                <div [fdCompact]="compact" class="flex flex-col gap-2">
                    <label fdFormLabel for="density-toggle-input">
                        {{ compact ? 'fdCompact = true: compact density' : 'fdCompact = false: follows the global density' }}
                    </label>
                    <input fdFormControl id="density-toggle-input" placeholder="Input" />
                    <button fdButton label="Button" class="self-start"></button>
                </div>
            </div>`
    })
};
