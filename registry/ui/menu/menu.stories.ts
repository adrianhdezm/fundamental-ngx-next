import { Component, afterNextRender, input, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Button } from '@/ui/button/button';
import { FormControl } from '@/ui/input/input';
import {
    Menu,
    MenuAddon,
    MenuContent,
    MenuInteractive,
    MenuItem,
    MenuItemInput,
    MenuSegmentedButtonHeader,
    MenuSegmentedButtonOption,
    MenuShortcut,
    MenuSubtitle,
    MenuTitle,
    MenuToggle,
    MenuTrigger,
    Submenu
} from './menu';

const MENU = [
    Menu,
    Submenu,
    MenuItem,
    MenuInteractive,
    MenuAddon,
    MenuTitle,
    MenuSubtitle,
    MenuContent,
    MenuShortcut,
    MenuTrigger,
    Button
];

const TEXT = 'font-sap-font-family text-sap-font-size text-sap-text-color';

/** Opens a menu on load, for visual checks. */
@Component({ selector: 'story-auto-open', template: '' })
class AutoOpen {
    readonly menu = input.required<Menu>();
    readonly path = input<number[]>([]);
    constructor() {
        afterNextRender(() => {
            const menu = this.menu();
            menu.open();
            setTimeout(() => {
                let items = menu.items();
                for (const index of this.path()) {
                    const item = items[index];
                    menu.activate(item);
                    items = item.submenu()?.items() ?? [];
                }
            }, 50);
        });
    }
}

@Component({
    selector: 'story-menu-basic',
    imports: [...MENU, AutoOpen],
    template: `
        <button fdButton fdMenu label="Menu" [fdMenuTrigger]="menu"></button>
        <fd-menu #menu ariaLabel="Basic menu">
            <li fd-menu-item>
                <a fd-menu-interactive>
                    <div fd-menu-content>
                        <span fd-menu-title>Menu title</span>
                        <span fd-menu-subtitle>Menu subtitle</span>
                    </div>
                </a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive>
                    <div fd-menu-content>
                        <span fd-menu-title
                            >Menu title lorem ipsum dolor sit amet consectetur adipisicing elit. Eaque, deserunt
                            molestias suscipit esse incidunt nobis.</span
                        >
                        <span fd-menu-subtitle
                            >Menu subtitle quidem est dolores vitae aliquam autem impedit reiciendis doloribus.</span
                        >
                    </div>
                </a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive>
                    <div fd-menu-content>
                        <span fd-menu-title truncate
                            >Truncated menu title lorem ipsum dolor sit amet consectetur adipisicing elit.</span
                        >
                        <span fd-menu-subtitle truncate
                            >Truncated menu subtitle quidem est dolores vitae aliquam autem impedit.</span
                        >
                    </div>
                </a>
            </li>
            <li fd-menu-item hasSeparator>
                <a fd-menu-interactive><span fd-menu-title>Menu item with separator</span></a>
            </li>
            <li fd-menu-item disabled>
                <a fd-menu-interactive><span fd-menu-title>Disabled item</span></a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Menu item</span></a>
            </li>
        </fd-menu>
        @if (autoOpen()) {
            <story-auto-open [menu]="menu" />
        }
    `
})
class StoryMenuBasic {
    readonly autoOpen = input(false);
}

@Component({
    selector: 'story-menu-addons',
    imports: [...MENU, AutoOpen],
    host: { class: 'flex flex-wrap gap-4' },
    template: `
        <button fdButton fdMenu label="Menu with icons" [fdMenuTrigger]="icons"></button>
        <fd-menu #icons ariaLabel="Menu with icons">
            <li fd-menu-item>
                <a fd-menu-interactive>
                    <fd-menu-addon position="before" glyph="cart" />
                    <span fd-menu-title>Option 1</span>
                </a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive>
                    <fd-menu-addon position="before" glyph="accept" />
                    <span fd-menu-title>Option 2</span>
                    <fd-menu-addon glyph="decline" />
                </a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive>
                    <span fd-menu-title>Option 3</span>
                    <fd-menu-addon glyph="menu" />
                </a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive>
                    <fd-menu-addon position="before" glyph="cart" />
                    <div fd-menu-content>
                        <span fd-menu-title>Option 4</span>
                        <span fd-menu-subtitle>Option 4 subtitle</span>
                    </div>
                </a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive>
                    <div fd-menu-content>
                        <span fd-menu-title>Option 5</span>
                        <span fd-menu-subtitle>Option 5 subtitle</span>
                    </div>
                    <fd-menu-addon glyph="menu" />
                </a>
            </li>
        </fd-menu>
        <button fdButton fdMenu label="Menu with shortcuts" [fdMenuTrigger]="shortcuts"></button>
        <fd-menu #shortcuts ariaLabel="Menu with shortcuts">
            <li fd-menu-item>
                <a fd-menu-interactive>
                    <span fd-menu-title>Save</span>
                    <span fd-menu-shortcut>Ctrl + S</span>
                </a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive>
                    <span fd-menu-title>Print</span>
                    <span fd-menu-shortcut>Ctrl + P</span>
                </a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive>
                    <div fd-menu-content>
                        <span fd-menu-title>Close tab</span>
                        <span fd-menu-subtitle>Additional command</span>
                    </div>
                    <span fd-menu-shortcut>Ctrl + W</span>
                </a>
            </li>
        </fd-menu>
        @if (autoOpen() === 'icons') {
            <story-auto-open [menu]="icons" />
        }
        @if (autoOpen() === 'shortcuts') {
            <story-auto-open [menu]="shortcuts" />
        }
    `
})
class StoryMenuAddons {
    readonly autoOpen = input<'icons' | 'shortcuts' | null>(null);
}

@Component({
    selector: 'story-menu-submenu',
    imports: [...MENU, AutoOpen],
    template: `
        <div class="flex flex-wrap items-center gap-2">
            <button fdButton fdMenu label="Menu with submenus" [fdMenuTrigger]="menu"></button>
            <span class="${TEXT}" aria-live="polite">Active path: {{ path() }}</span>
        </div>
        <fd-menu #menu ariaLabel="Groceries" [openOnHoverTime]="hoverTime()" (activePath)="onPath($event)">
            <li fd-menu-item [submenu]="fruits">
                <div fd-menu-interactive>
                    <fd-menu-addon position="before" glyph="nutrition-activity" />
                    <span fd-menu-title>Fruits</span>
                    <fd-menu-addon submenuIndicator />
                </div>
            </li>
            <li fd-menu-item [submenu]="vegetables">
                <div fd-menu-interactive>
                    <fd-menu-addon position="before" glyph="e-care" />
                    <span fd-menu-title>Vegetables</span>
                    <fd-menu-addon submenuIndicator />
                </div>
            </li>
            <li fd-menu-item [submenu]="milk">
                <div fd-menu-interactive>
                    <span fd-menu-title>Milk products</span>
                    <fd-menu-addon submenuIndicator />
                </div>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Meat</span></a>
            </li>
        </fd-menu>
        <fd-submenu #fruits>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Pineapple</span></a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Banana</span></a>
            </li>
        </fd-submenu>
        <fd-submenu #vegetables>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Cucumber</span></a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Onion</span></a>
            </li>
        </fd-submenu>
        <fd-submenu #milk>
            <li fd-menu-item [submenu]="cheeses">
                <div fd-menu-interactive>
                    <span fd-menu-title>Cheese</span>
                    <fd-menu-addon submenuIndicator />
                </div>
            </li>
            <li fd-menu-item [submenu]="yogurts">
                <div fd-menu-interactive>
                    <span fd-menu-title>Yogurts</span>
                    <fd-menu-addon submenuIndicator />
                </div>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Butter</span></a>
            </li>
        </fd-submenu>
        <fd-submenu #cheeses>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Parmesan</span></a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Brie</span></a>
            </li>
        </fd-submenu>
        <fd-submenu #yogurts>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Greek</span></a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Natural</span></a>
            </li>
        </fd-submenu>
        @if (autoOpen()) {
            <story-auto-open [menu]="menu" [path]="[2, 0]" />
        }
    `
})
class StoryMenuSubmenu {
    readonly autoOpen = input(false);
    readonly hoverTime = input(0);
    protected readonly path = signal('');
    protected onPath(items: MenuItem[]): void {
        this.path.set(items.map((i) => i.titleText()).join(' › '));
    }
}

interface Node {
    title: string;
    children: Node[];
}

/** Submenus built from data: items rendered from a template pass their submenu with `parentSubmenu`. */
@Component({
    selector: 'story-menu-dynamic',
    imports: [...MENU, NgTemplateOutlet],
    template: `
        <button fdButton fdMenu label="Menu from data" [fdMenuTrigger]="menu"></button>
        <fd-menu #menu ariaLabel="Menu from data">
            @for (node of tree; track node.title) {
                <ng-container *ngTemplateOutlet="item; context: { $implicit: node, parent: null }" />
            }
            <ng-template #item let-node let-parent="parent">
                <li fd-menu-item [submenu]="node.children.length ? sub : null" [parentSubmenu]="parent">
                    <div fd-menu-interactive>
                        <span fd-menu-title>{{ node.title }}</span>
                        @if (node.children.length) {
                            <fd-menu-addon submenuIndicator />
                        }
                    </div>
                </li>
                <fd-submenu #sub>
                    @for (child of node.children; track child.title) {
                        <ng-container *ngTemplateOutlet="item; context: { $implicit: child, parent: sub }" />
                    }
                </fd-submenu>
            </ng-template>
        </fd-menu>
    `
})
class StoryMenuDynamic {
    protected readonly tree: Node[] = [
        {
            title: 'Documents',
            children: [
                { title: 'Recent', children: [] },
                {
                    title: 'Shared',
                    children: [
                        { title: 'With me', children: [] },
                        { title: 'By me', children: [] }
                    ]
                }
            ]
        },
        { title: 'Images', children: [{ title: 'Screenshots', children: [] }] },
        { title: 'Trash', children: [] }
    ];
}

@Component({
    selector: 'story-menu-extended',
    imports: [
        ...MENU,
        MenuToggle,
        MenuSegmentedButtonHeader,
        MenuSegmentedButtonOption,
        MenuItemInput,
        FormControl,
        FormsModule,
        AutoOpen
    ],
    template: `
        <dl class="m-0 mb-2 grid grid-cols-[auto_1fr] gap-x-2 ${TEXT}">
            <dt>Toggle value:</dt>
            <dd class="m-0">{{ toggle() }}</dd>
            <dt>Sort value:</dt>
            <dd class="m-0">{{ sort() ?? 'none' }}</dd>
            <dt>Text input value:</dt>
            <dd class="m-0">{{ text() }}</dd>
        </dl>
        <button fdButton fdMenu label="Extended items" [fdMenuTrigger]="menu"></button>
        <fd-menu #menu ariaLabel="Extended items">
            <li fd-menu-item>
                <button fd-menu-interactive toggle [(checked)]="toggle">
                    <span fd-menu-title>Toggle button</span>
                </button>
            </li>
            <li fd-menu-item fdMenuSegmentedButtonHeader [(value)]="sort">
                <button fd-menu-interactive>
                    <fd-menu-addon position="before" glyph="sort" />
                    <span fd-menu-title>Sort</span>
                </button>
            </li>
            <li fd-menu-item fdMenuSegmentedButtonOption value="asc">
                <button fd-menu-interactive><span fd-menu-title>Ascending</span></button>
            </li>
            <li fd-menu-item fdMenuSegmentedButtonOption value="desc">
                <button fd-menu-interactive><span fd-menu-title>Descending</span></button>
            </li>
            <li fd-menu-item fdMenuSegmentedButtonOption [value]="null">
                <button fd-menu-interactive><span fd-menu-title>None</span></button>
            </li>
            <li fd-menu-item>
                <div fd-menu-interactive>
                    <input
                        fdFormControl
                        fd-menu-item-input
                        aria-label="Text"
                        placeholder="Field placeholder text"
                        [(ngModel)]="text"
                    />
                </div>
            </li>
        </fd-menu>
        @if (autoOpen()) {
            <story-auto-open [menu]="menu" />
        }
    `
})
class StoryMenuExtended {
    readonly autoOpen = input(false);
    protected readonly toggle = signal(false);
    protected readonly sort = signal<'asc' | 'desc' | null>('asc');
    protected readonly text = signal('');
}

@Component({
    selector: 'story-menu-mobile',
    imports: [...MENU],
    template: `
        <button fdButton fdMenu label="Menu in mobile mode" [fdMenuTrigger]="menu"></button>
        <fd-menu #menu mobile [mobileConfig]="{ title: 'Groceries', cancelButtonText: 'Cancel', hasCloseButton: true }">
            <li fd-menu-item [submenu]="fruits">
                <div fd-menu-interactive>
                    <span fd-menu-title>Fruits</span>
                    <fd-menu-addon submenuIndicator />
                </div>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive>
                    <span fd-menu-title>Save</span>
                    <span fd-menu-shortcut>Ctrl + S</span>
                </a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Meat</span></a>
            </li>
        </fd-menu>
        <fd-submenu #fruits>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Pineapple</span></a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Banana</span></a>
            </li>
        </fd-submenu>
    `
})
class StoryMenuMobile {
    readonly autoOpen = input(false);
    private readonly menu = viewChild.required<Menu>('menu');
    constructor() {
        afterNextRender(() => this.autoOpen() && this.menu().open());
    }
}

@Component({
    selector: 'story-menu-programmatic',
    imports: [...MENU],
    template: `
        <div class="mb-2 flex flex-wrap items-center gap-2">
            <button fdButton [fdMenuTrigger]="menu" label="Open menu"></button>
            <button fdButton variant="transparent" label="Open" (click)="menu.open()"></button>
            <button fdButton variant="transparent" label="Close" (click)="menu.close()"></button>
            <button fdButton variant="transparent" label="Toggle" (click)="menu.toggle()"></button>
        </div>
        <fd-menu
            #menu
            placement="right-start"
            [(isOpen)]="open"
            (beforeOpen)="log('beforeOpen')"
            (isOpenChange)="log('isOpenChange: ' + $event)"
            (activePath)="log('activePath: ' + $event.length + ' item(s)')"
        >
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Option 1</span></a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Option 2</span></a>
            </li>
            <li fd-menu-item>
                <a fd-menu-interactive><span fd-menu-title>Option 3</span></a>
            </li>
        </fd-menu>
        <ol class="m-0 ps-6 ${TEXT}" aria-label="Event log">
            @for (entry of events(); track $index) {
                <li>{{ entry }}</li>
            }
        </ol>
    `
})
class StoryMenuProgrammatic {
    protected readonly open = signal(false);
    protected readonly events = signal<string[]>([]);
    protected log(entry: string): void {
        this.events.update((list) => [...list.slice(-7), entry]);
    }
}

const meta: Meta<Menu> = {
    title: 'Components/Menu',
    component: Menu,
    decorators: [
        moduleMetadata({
            imports: [
                StoryMenuBasic,
                StoryMenuAddons,
                StoryMenuSubmenu,
                StoryMenuDynamic,
                StoryMenuExtended,
                StoryMenuMobile,
                StoryMenuProgrammatic
            ]
        })
    ],
    parameters: {
        docs: {
            story: { inline: false, iframeHeight: 420 },
            description: {
                component:
                    'A menu lists actions in a popover opened by `[fdMenuTrigger]` (click, Enter, Space or ArrowDown). ' +
                    'ArrowUp/ArrowDown, Home and End move between items; ArrowRight opens a submenu and ArrowLeft closes it (mirrored in RTL); Enter and Space activate; Escape and Tab close. ' +
                    'Items can have icons, subtitles, shortcuts and separators, toggle a value, form a single-choice group or hold an input. In mobile mode the menu opens in a full-screen dialog, one level at a time.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<Menu>;

export const Basic: Story = { name: 'Menu', render: () => ({ template: `<story-menu-basic />` }) };
export const Addons: Story = {
    name: 'Icons and shortcuts',
    render: () => ({ template: `<story-menu-addons />` })
};
export const Submenus: Story = {
    name: 'Submenus',
    render: () => ({ template: `<story-menu-submenu />` })
};
export const Dynamic: Story = {
    name: 'Submenus from data',
    render: () => ({ template: `<story-menu-dynamic />` })
};
export const Extended: Story = {
    name: 'Toggle, single-choice group and input',
    render: () => ({ template: `<story-menu-extended />` })
};
export const Mobile: Story = { name: 'Mobile mode', render: () => ({ template: `<story-menu-mobile />` }) };
export const Programmatic: Story = {
    name: 'Programmatic control',
    render: () => ({ template: `<story-menu-programmatic />` })
};

export const OpenBasic: Story = {
    name: 'Open: menu',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-menu-basic [autoOpen]="true" />` })
};
export const OpenIcons: Story = {
    name: 'Open: icons',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-menu-addons autoOpen="icons" />` })
};
export const OpenShortcuts: Story = {
    name: 'Open: shortcuts',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-menu-addons autoOpen="shortcuts" />` })
};
export const OpenSubmenus: Story = {
    name: 'Open: submenus',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-menu-submenu [autoOpen]="true" />` })
};
export const OpenExtended: Story = {
    name: 'Open: extended items',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-menu-extended [autoOpen]="true" />` })
};
export const OpenMobile: Story = {
    name: 'Open: mobile',
    tags: ['!autodocs'],
    render: () => ({ template: `<story-menu-mobile [autoOpen]="true" />` })
};
