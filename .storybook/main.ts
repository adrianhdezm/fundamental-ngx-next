import type { StorybookConfig } from '@analogjs/storybook-angular';
import tailwindcss from '@tailwindcss/vite';
import remarkGfm from 'remark-gfm';
import { fileURLToPath } from 'node:url';
import { mergeConfig, type UserConfig } from 'vite';

const registry = (path: string) => fileURLToPath(new URL(`../registry/${path}`, import.meta.url));

const config: StorybookConfig = {
    stories: ['../docs/**/*.mdx', '../docs/**/*.stories.ts', '../registry/**/*.mdx', '../registry/**/*.stories.ts'],
    addons: [
        // GitHub-flavoured Markdown (tables) in the .mdx pages
        {
            name: '@storybook/addon-docs',
            options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } }
        },
        '@storybook/addon-a11y'
    ],
    framework: {
        name: '@analogjs/storybook-angular',
        options: {}
    },
    // serves the built registry at /r/<name>.json next to the stories
    staticDirs: [{ from: '../public', to: '/' }],
    core: {
        disableTelemetry: true
    },
    async viteFinal(config: UserConfig) {
        return mergeConfig(config, {
            plugins: [tailwindcss()],
            // same aliases as the tsconfig `paths`, the ones users configure when copying components
            resolve: {
                alias: [
                    { find: /^@\/lib\//, replacement: registry('lib/') },
                    { find: /^@\/ui\//, replacement: registry('ui/') }
                ]
            }
        });
    }
};

export default config;
