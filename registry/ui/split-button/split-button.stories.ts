import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import type { ButtonVariant } from '@/ui/button/button';
import { Icon } from '@/ui/icon/icon';
import { Menu, MenuAddon, MenuInteractive, MenuItem, MenuTitle } from '@/ui/menu/menu';
import { SplitButton, SplitButtonActionTitle } from './split-button';

const MENU = (options = ['Option 1', 'Option 2']) => `
    <fd-menu>
        ${options
            .map(
                (o) => `<li fd-menu-item (click)="log('${o} clicked')">
            <div fd-menu-interactive><span fd-menu-title>${o}</span></div>
        </li>`
            )
            .join('')}
    </fd-menu>`;

const TEXT = 'font-sap-font-family text-sap-font-size text-sap-text-color';

@Component({
    selector: 'story-split-button',
    imports: [SplitButton, SplitButtonActionTitle, Menu, MenuItem, MenuInteractive, MenuTitle, MenuAddon, Icon],
    template: `
        @switch (kind()) {
            @case ('types') {
                <div class="flex flex-wrap items-center gap-2">
                    @for (variant of variants; track variant) {
                        <fd-split-button [variant]="variant" [ariaLabel]="variant + ' split button'">
                            ${MENU()}
                        </fd-split-button>
                    }
                </div>
            }
            @case ('behaviors') {
                <div class="flex flex-col items-start gap-4 ${TEXT}">
                    <span>Default: the chosen option becomes the main action</span>
                    <fd-split-button (primaryButtonClicked)="log('Main button clicked')">${MENU()}</fd-split-button>
                    <span>Additional main action until an option is chosen</span>
                    <fd-split-button
                        [mainAction]="{ mainActionTitle: 'Main action', callback: mainCallback }"
                        (primaryButtonClicked)="log('Main button clicked')"
                    >
                        ${MENU(['Option 1', 'Option 2 with long text'])}
                    </fd-split-button>
                    <span>Constant main action</span>
                    <fd-split-button
                        [mainAction]="{
                            mainActionTitle: 'Primary button',
                            keepMainAction: true,
                            callback: mainCallback
                        }"
                    >
                        ${MENU(['Option 1', 'Option 2 with long text'])}
                    </fd-split-button>
                    <span>Flexible width</span>
                    <fd-split-button [fixedWidth]="false"
                        >${MENU(['Option 1', 'Option 2 with long text'])}</fd-split-button
                    >
                    <span>Disabled</span>
                    <fd-split-button disabled>${MENU()}</fd-split-button>
                </div>
            }
            @case ('template') {
                <div class="flex flex-wrap items-center gap-2">
                    <fd-split-button>
                        <ng-template fd-split-button-action-title>
                            Template <fd-icon glyph="home" class="mx-2" /> action
                        </ng-template>
                        ${MENU()}
                    </fd-split-button>
                    <fd-split-button glyph="menu" expandButtonTitle="Show the actions" variant="transparent">
                        <fd-menu>
                            <li fd-menu-item>
                                <div fd-menu-interactive>
                                    <fd-menu-addon position="before" glyph="save" />
                                    <span fd-menu-title>Save</span>
                                </div>
                            </li>
                            <li fd-menu-item>
                                <div fd-menu-interactive>
                                    <fd-menu-addon position="before" glyph="print" />
                                    <span fd-menu-title>Print</span>
                                </div>
                            </li>
                        </fd-menu>
                    </fd-split-button>
                </div>
            }
        }
        <p class="${TEXT}" aria-live="polite">{{ last() }}</p>
    `
})
class StorySplitButton {
    readonly kind = input<'types' | 'behaviors' | 'template'>('types');
    protected readonly variants: ButtonVariant[] = [
        'standard',
        'emphasized',
        'ghost',
        'positive',
        'negative',
        'attention',
        'transparent'
    ];
    protected readonly last = signal('');
    protected readonly mainCallback = () => this.log('Main action callback');
    protected log(text: string): void {
        this.last.set(text);
    }
}

const meta: Meta<SplitButton> = {
    title: 'Components/Split Button',
    component: SplitButton,
    decorators: [moduleMetadata({ imports: [StorySplitButton] })],
    parameters: {
        docs: {
            story: { inline: false, iframeHeight: 360 },
            description: {
                component:
                    'A split button runs its main action, or opens a menu of alternatives from the arrow (click, Enter, Space or ArrowDown). ' +
                    'The chosen alternative becomes the main action unless `mainAction.keepMainAction` is set; `fixedWidth` keeps the main button width.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<SplitButton>;

export const Types: Story = {
    name: 'Types',
    render: () => ({ template: `<story-split-button />` })
};
export const Behaviors: Story = {
    name: 'Main action behaviours',
    render: () => ({ template: `<story-split-button [kind]="'behaviors'" />` })
};
export const Template: Story = {
    name: 'Template title and custom arrow',
    render: () => ({ template: `<story-split-button [kind]="'template'" />` })
};
