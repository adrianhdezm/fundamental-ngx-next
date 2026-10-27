import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { Icon } from '@/ui/icon/icon';
import { FormControl } from '@/ui/input/input';
import { InlineHelp } from './inline-help';

const meta: Meta<InlineHelp> = {
    title: 'Components/Inline Help',
    component: InlineHelp,
    decorators: [moduleMetadata({ imports: [InlineHelp, Icon, Button, FormControl] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Inline help explains a field or control in a small popover that opens on hover and focus. ' +
                    'The help text is also available to screen readers through aria-describedby.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<InlineHelp>;

const item = 'flex items-center gap-2 py-3';

export const Default: Story = {
    name: 'Placements and states',
    render: () => ({
        template: `
            <div class="flex flex-col">
                <div class="${item}"><span>Default</span><fd-icon glyph="question-mark" fdInlineHelp="Inline Help Tooltip" tabindex="0" ariaLabel="Help" /></div>
                <div class="${item}"><span>Left Position</span><fd-icon glyph="question-mark" fdInlineHelp="Inline Help Tooltip" placement="left" tabindex="0" ariaLabel="Help" /></div>
                <div class="${item}"><span>Right Position</span><fd-icon glyph="question-mark" fdInlineHelp="Inline Help Tooltip" placement="right" tabindex="0" ariaLabel="Help" /></div>
                <div class="${item}"><span>Top Position</span><fd-icon glyph="question-mark" fdInlineHelp="Inline Help Tooltip" placement="top" tabindex="0" ariaLabel="Help" /></div>
                <div class="${item}"><span>Bottom Position</span><fd-icon glyph="question-mark" placement="bottom" tabindex="0" ariaLabel="Help"
                    fdInlineHelp="Inline Help Tooltip Lorem ipsum, dolor sit amet consectetur adipisicing elit. Officia vitae ipsum facilis quasi similique! Aperiam incidunt perspiciatis quam architecto." /></div>
                <div class="${item} max-w-sm"><input fdFormControl fdInlineHelp="Inline Help Tooltip" placement="right" placeholder="Inline help inside input" aria-label="Field with inline help" /></div>
                <div class="${item}"><span>Disabled</span><fd-icon glyph="question-mark" fdInlineHelp="Inline Help Tooltip" disabled tabindex="0" ariaLabel="Help" /></div>
                <div class="${item}"><span>Close on Escape</span><fd-icon glyph="question-mark" fdInlineHelp="Inline Help Tooltip" closeOnEscapeKey tabindex="0" ariaLabel="Help" /></div>
            </div>`
    })
};

export const Template: Story = {
    name: 'Template content',
    render: () => ({
        template: `
            <ng-template #help><span>Help with <b>bold</b> text and a list:<ul class="list-disc ps-4"><li>First</li><li>Second</li></ul></span></ng-template>
            <span>Rich help</span>
            <fd-icon glyph="question-mark" [fdInlineHelp]="help" tabindex="0" ariaLabel="Help" class="ms-2" />`
    })
};

export const Triggers: Story = {
    name: 'Custom triggers',
    render: () => ({
        template: `
            <div class="flex flex-col items-start gap-4">
                <div class="flex items-center gap-2"><span>Click</span>
                    <fd-icon glyph="question-mark" fdInlineHelp="Inline Help Tooltip" [triggers]="['click']" tabindex="0" ariaLabel="Help" /></div>
                <button fdButton fdInlineHelp="Inline Help Tooltip" [triggers]="['click']" closeOnOutsideClick>Click on me, to display inline help</button>
            </div>`
    })
};

export const Styled: Story = {
    name: 'Custom body class',
    render: () => ({
        template: `<fd-icon glyph="question-mark" fdInlineHelp="Inline Help Tooltip" additionalBodyClass="bg-sap-information-background" [triggers]="['click']" tabindex="0" ariaLabel="Help" />`
    })
};
