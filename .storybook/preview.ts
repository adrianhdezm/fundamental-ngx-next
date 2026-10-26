import { BidiModule } from '@angular/cdk/bidi';
import { componentWrapperDecorator, moduleMetadata, type Decorator, type Preview } from '@analogjs/storybook-angular';

export const THEMES = {
    sap_horizon: 'Horizon',
    sap_horizon_dark: 'Horizon Dark',
    sap_horizon_hcb: 'Horizon HC Black',
    sap_horizon_hcw: 'Horizon HC White'
} as const;

/** Applies theme, density and direction to <html>, so overlays attached to <body> follow them too. */
const withFoundation: Decorator = (storyFn, context) => {
    const { theme, density, dir } = context.globals;
    const html = document.documentElement;
    html.setAttribute('data-sap-theme', theme ?? 'sap_horizon');
    html.setAttribute('dir', dir ?? 'ltr');
    if (density === 'compact') {
        html.setAttribute('data-density', 'compact');
    } else {
        html.removeAttribute('data-density');
    }
    return storyFn();
};

const preview: Preview = {
    globalTypes: {
        theme: {
            description: 'SAP theme',
            toolbar: {
                title: 'Theme',
                icon: 'paintbrush',
                items: Object.entries(THEMES).map(([value, title]) => ({ value, title })),
                dynamicTitle: true
            }
        },
        density: {
            description: 'Content density',
            toolbar: {
                title: 'Density',
                icon: 'component',
                items: [
                    { value: 'cozy', title: 'Cozy' },
                    { value: 'compact', title: 'Compact' }
                ],
                dynamicTitle: true
            }
        },
        dir: {
            description: 'Text direction',
            toolbar: {
                title: 'Direction',
                icon: 'transfer',
                items: [
                    { value: 'ltr', title: 'LTR' },
                    { value: 'rtl', title: 'RTL' }
                ],
                dynamicTitle: true
            }
        }
    },
    initialGlobals: {
        theme: 'sap_horizon',
        density: 'cozy',
        dir: 'ltr'
    },
    decorators: [
        moduleMetadata({ imports: [BidiModule] }),
        // CDK Directionality for the story subtree (components and their overlays).
        componentWrapperDecorator(
            (story) => `<div [dir]="__dir" class="p-4">${story}</div>`,
            ({ globals }) => ({ __dir: globals['dir'] ?? 'ltr' })
        ),
        withFoundation
    ],
    parameters: {
        layout: 'fullscreen',
        controls: {
            expanded: true,
            matchers: { color: /(background|color)$/i }
        },
        backgrounds: { disable: true },
        a11y: { test: 'todo' },
        options: {
            storySort: {
                order: ['Introduction', 'Foundations', 'Components']
            }
        }
    }
};

export default preview;
