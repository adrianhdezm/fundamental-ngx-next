import angular from '@analogjs/vite-plugin-angular';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

const browser = () => ({
    enabled: true,
    headless: true,
    viewport: { width: 1280, height: 800 },
    provider: playwright(),
    instances: [{ browser: 'chromium' as const }]
});

/** Every story rendered and checked with axe in a theme (the a11y addon fails the test on violations). */
const storybook = (theme: string) => ({
    plugins: [
        angular({ tsconfig: path('./.storybook/tsconfig.json') }),
        storybookTest({ configDir: path('./.storybook') })
    ],
    define: { __A11Y_THEME__: JSON.stringify(theme) },
    test: {
        name: `a11y:${theme}`,
        setupFiles: ['.storybook/vitest.setup.ts'],
        browser: browser()
    }
});

// Component tests run in a real Chromium (Vitest browser mode), with the SAP theme and Tailwind styles.
export default defineConfig({
    plugins: [tailwindcss()],
    // pre-bundle the CDK entry points so a newly imported one does not reload a running test
    optimizeDeps: {
        include: [
            '@angular/cdk/a11y',
            '@angular/cdk/bidi',
            '@angular/cdk/drag-drop',
            '@angular/cdk/keycodes',
            '@angular/cdk/overlay',
            '@angular/cdk/portal',
            '@angular/cdk/scrolling',
            '@angular/common/locales/de',
            '@angular/forms',
            '@angular/platform-browser'
        ]
    },
    resolve: {
        alias: [
            { find: /^@\/lib\//, replacement: path('./registry/lib/') },
            { find: /^@\/ui\//, replacement: path('./registry/ui/') }
        ]
    },
    test: {
        projects: [
            {
                extends: true,
                plugins: [angular({ tsconfig: path('./tests/tsconfig.json') })],
                test: {
                    name: 'unit',
                    include: ['registry/**/*.spec.ts'],
                    setupFiles: ['tests/setup.ts'],
                    browser: browser()
                }
            },
            { extends: true, ...storybook('sap_horizon') },
            { extends: true, ...storybook('sap_horizon_hcb') }
        ]
    }
});
