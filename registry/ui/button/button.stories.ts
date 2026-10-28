import { signal } from '@angular/core';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { ContentDensityDirective } from '@/ui/content-density/content-density';
import { BADGE_ENABLED_BUTTON_VARIANTS, Button, ButtonBadge } from './button';

const VARIANTS = ['standard', 'emphasized', 'ghost', 'positive', 'negative', 'attention', 'transparent'] as const;

const meta: Meta<Button> = {
    title: 'Components/Button',
    component: Button,
    decorators: [moduleMetadata({ imports: [Button, ButtonBadge, ContentDensityDirective] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Buttons trigger actions. Use **emphasized** for the main action of a page, **positive** and ' +
                    '**negative** for semantic actions, **transparent** in toolbars and headers and **ghost** to ' +
                    'highlight a secondary action. Icon-only buttons need an `ariaLabel`.'
            }
        }
    },
    argTypes: {
        variant: { control: 'select', options: VARIANTS },
        glyphPosition: { control: 'inline-radio', options: ['before', 'after'] }
    },
    args: {
        label: 'Button',
        variant: 'standard',
        glyph: '',
        glyphPosition: 'before',
        // The alias of the `menu` input: argsToTemplate binds the arg by its name.
        fdMenu: false,
        toggled: false,
        disabled: false,
        fullWidth: false,
        decisive: false
    } as Meta<Button>['args']
};
export default meta;
type Story = StoryObj<Button>;

export const Playground: Story = {
    render: (args) => ({
        props: args,
        template: `<button fdButton ${argsToTemplate(args)}></button>`
    })
};

export const Types: Story = {
    parameters: {
        docs: {
            description: { story: 'The button types. Each special type adds a hidden description for screen readers.' }
        }
    },
    render: () => ({
        props: { variants: VARIANTS },
        template: `
            <div class="flex flex-wrap items-center gap-2">
                <button fdButton label="Standard Button"></button>
                <button fdButton label="Emphasized Button" variant="emphasized"></button>
                <button fdButton label="Ghost Button" variant="ghost" aria-description="Ghost button with a custom description"></button>
                <button fdButton label="Positive Button" variant="positive" aria-description="This adds a new record"></button>
                <button fdButton label="Negative Button" variant="negative" ariaDescription="This permanently deletes the record"></button>
                <button fdButton label="Attention Button" variant="attention" ariaTypeDescription="This requires immediate attention"></button>
                <button fdButton label="Transparent Button" variant="transparent"></button>
            </div>
        `
    })
};

export const Menu: Story = {
    parameters: { docs: { description: { story: 'Menu buttons show an arrow and open a menu.' } } },
    render: () => ({
        props: { variants: VARIANTS },
        template: `
            <div class="flex flex-col gap-4">
                <div class="flex flex-wrap items-center gap-2">
                    @for (v of variants; track v) {
                        <button fdButton fdMenu [variant]="v" glyph="cart" label="Add to Cart"></button>
                    }
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    @for (v of variants; track v) {
                        <button fdButton fdMenu [variant]="v" glyph="filter" [ariaLabel]="'Filter ' + v" [title]="'Filter ' + v"></button>
                    }
                </div>
            </div>
        `
    })
};

export const Sizes: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Cozy (default) and compact density. Use `fdCompact` on the button or an ancestor, or the Density toolbar switch.'
            }
        }
    },
    render: () => ({
        template: `
            <div class="flex flex-wrap items-center gap-2">
                <button fdButton fdCozy label="Cozy Button"></button>
                <button fdButton fdCompact label="Compact Button"></button>
                <button fdButton fdCozy glyph="cart" ariaLabel="Cart, cozy"></button>
                <button fdButton fdCompact glyph="cart" ariaLabel="Cart, compact"></button>
            </div>
        `
    })
};

export const Icons: Story = {
    render: () => ({
        props: { variants: VARIANTS },
        template: `
            <div class="flex flex-col gap-4">
                <div class="flex flex-wrap items-center gap-2">
                    @for (v of variants; track v) {
                        <button fdButton [variant]="v" glyph="cart" label="Add to Cart"></button>
                    }
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    @for (v of variants; track v) {
                        <button fdButton [variant]="v" glyph="cart" [ariaLabel]="'Cart ' + v" [title]="'Cart ' + v"></button>
                    }
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <button fdButton glyph="navigation-right-arrow" glyphPosition="after" label="Next"></button>
                    <button fdButton variant="transparent" glyph="nav-back" label="Back"></button>
                </div>
            </div>
        `
    })
};

export const State: Story = {
    parameters: {
        docs: {
            description: {
                story: '`disabled` removes the button from interaction. `aria-disabled` keeps it focusable so a tooltip stays reachable.'
            }
        }
    },
    render: () => ({
        props: { variants: VARIANTS },
        template: `
            <div class="flex flex-col gap-4">
                <div class="flex flex-wrap items-center gap-2">
                    <button fdButton toggled label="Toggled State"></button>
                    <button fdButton aria-disabled="true" label="ARIA Disabled State"></button>
                    <button fdButton disabled label="Disabled State"></button>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    @for (v of variants; track v) {
                        <button fdButton disabled [variant]="v" [label]="v"></button>
                    }
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <a fdButton href="#" label="Link as button"></a>
                    <a fdButton href="#" disabled label="Disabled link"></a>
                </div>
            </div>
        `
    })
};

export const Toggled: Story = {
    parameters: { docs: { description: { story: 'Toggle buttons expose their state with `aria-pressed`.' } } },
    render: () => ({
        props: {
            variants: VARIANTS,
            state: signal<Record<string, boolean>>({ standard: true }),
            flip(this: { state: ReturnType<typeof signal<Record<string, boolean>>> }, v: string) {
                this.state.update((s) => ({ ...s, [v]: !s[v] }));
            }
        },
        template: `
            <div class="flex flex-wrap items-center gap-2">
                @for (v of variants; track v) {
                    <button fdButton [variant]="v" [toggled]="!!state()[v]" (click)="flip(v)" [label]="v + ' button'"></button>
                }
            </div>
        `
    })
};

export const Badge: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Badges show a counter on standard, emphasized, ghost and transparent buttons. In compact density the badge sits inline.'
            }
        }
    },
    render: () => ({
        props: { variants: BADGE_ENABLED_BUTTON_VARIANTS },
        template: `
            <div class="flex flex-col gap-6 p-2">
                <div class="flex flex-wrap items-center gap-4">
                    @for (v of variants; track v; let i = $index) {
                        <button fdButton [variant]="v" [label]="v">
                            <fd-button-badge [content]="i + 1" />
                        </button>
                    }
                </div>
                <div class="flex flex-wrap items-center gap-4">
                    <button fdButton glyph="bell" ariaLabel="999 notifications"><fd-button-badge content="999" /></button>
                    <button fdButton variant="transparent" glyph="message-popup" ariaLabel="Messages"><fd-button-badge attention /></button>
                </div>
            </div>
        `
    })
};
