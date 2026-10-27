import angular from '@analogjs/vite-plugin-angular';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Component tests run in a real Chromium (Vitest browser mode), with the SAP theme and Tailwind styles.
export default defineConfig({
    plugins: [angular({ tsconfig: path('./tests/tsconfig.json') }), tailwindcss()],
    // pre-bundle the CDK entry points so a newly imported one does not reload a running test
    optimizeDeps: {
        include: [
            '@angular/cdk/a11y',
            '@angular/cdk/bidi',
            '@angular/cdk/drag-drop',
            '@angular/cdk/keycodes',
            '@angular/cdk/overlay',
            '@angular/cdk/portal',
            '@angular/cdk/scrolling'
        ]
    },
    resolve: {
        alias: [
            { find: /^@\/lib\//, replacement: path('./registry/lib/') },
            { find: /^@\/ui\//, replacement: path('./registry/ui/') }
        ]
    },
    test: {
        include: ['registry/**/*.spec.ts'],
        setupFiles: ['tests/setup.ts'],
        browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }]
        }
    }
});
