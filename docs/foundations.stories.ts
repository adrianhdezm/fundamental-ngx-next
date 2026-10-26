import type { Meta, StoryObj } from '@analogjs/storybook-angular';

const meta: Meta = {
    title: 'Foundations',
    parameters: {
        docs: { description: { component: 'SAP Fiori visual foundations, rendered from the live theme tokens.' } }
    }
};
export default meta;
type Story = StoryObj;

const swatch = (token: string) => `
    <div class="flex items-center gap-3">
        <span class="size-10 shrink-0 rounded-sap-element-border-corner-radius border border-sap-group-content-border-color" style="background: var(${token})"></span>
        <code class="text-sap-font-small-size text-sap-content-label-color">${token}</code>
    </div>`;

const group = (title: string, tokens: string[]) => `
    <section class="mb-6">
        <h3 class="mb-3 font-sap-font-header-family text-sap-font-header5-size text-sap-title-color">${title}</h3>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-3">${tokens.map(swatch).join('')}</div>
    </section>`;

export const Colors: Story = {
    render: () => ({
        template: [
            group('Base', [
                '--sapBrandColor',
                '--sapHighlightColor',
                '--sapBaseColor',
                '--sapShellColor',
                '--sapBackgroundColor',
                '--sapTextColor',
                '--sapTitleColor',
                '--sapLinkColor',
                '--sapHoverColor',
                '--sapActiveColor',
                '--sapSelectedColor'
            ]),
            group('Semantic', [
                '--sapNegativeColor',
                '--sapCriticalColor',
                '--sapPositiveColor',
                '--sapInformativeColor',
                '--sapNeutralColor',
                '--sapErrorBackground',
                '--sapWarningBackground',
                '--sapSuccessBackground',
                '--sapInformationBackground',
                '--sapNeutralBackground'
            ]),
            group('Elements', [
                '--sapButton_Background',
                '--sapButton_Emphasized_Background',
                '--sapField_Background',
                '--sapField_BorderColor',
                '--sapGroup_ContentBackground',
                '--sapList_Background',
                '--sapContent_FocusColor',
                '--sapContent_IconColor'
            ])
        ].join('')
    })
};

export const Typography: Story = {
    render: () => ({
        props: {
            sizes: ['Header1', 'Header2', 'Header3', 'Header4', 'Header5', 'Header6'],
            families: [
                '--sapFontLightFamily',
                '--sapFontFamily',
                '--sapFontSemiboldDuplexFamily',
                '--sapFontBoldFamily',
                '--sapFontBlackFamily',
                '--sapContent_MonospaceFontFamily'
            ]
        },
        template: `
            <section class="mb-8 flex flex-col gap-2">
                @for (s of sizes; track s) {
                    <div class="flex items-baseline gap-4">
                        <code class="w-48 shrink-0 text-sap-font-small-size text-sap-content-label-color">--sapFont{{ s }}Size</code>
                        <span class="font-sap-font-header-family text-sap-title-color" [style.font-size]="'var(--sapFont' + s + 'Size)'">Fiori for web</span>
                    </div>
                }
                <div class="flex items-baseline gap-4"><code class="w-48 shrink-0 text-sap-font-small-size text-sap-content-label-color">--sapFontLargeSize</code><span class="text-sap-font-large-size">The quick brown fox jumps over the lazy dog</span></div>
                <div class="flex items-baseline gap-4"><code class="w-48 shrink-0 text-sap-font-small-size text-sap-content-label-color">--sapFontSize</code><span class="text-sap-font-size">The quick brown fox jumps over the lazy dog</span></div>
                <div class="flex items-baseline gap-4"><code class="w-48 shrink-0 text-sap-font-small-size text-sap-content-label-color">--sapFontSmallSize</code><span class="text-sap-font-small-size">The quick brown fox jumps over the lazy dog</span></div>
            </section>
            <section class="flex flex-col gap-2">
                @for (f of families; track f) {
                    <div class="flex items-baseline gap-4">
                        <code class="w-48 shrink-0 text-sap-font-small-size text-sap-content-label-color">{{ f }}</code>
                        <span class="text-sap-font-large-size" [style.font-family]="'var(' + f + ')'">72 typeface — 0123456789</span>
                    </div>
                }
            </section>
        `
    })
};

export const Elevation: Story = {
    render: () => ({
        props: { levels: ['0', '1', '2', '3'] },
        template: `
            <div class="flex flex-wrap gap-8 p-4">
                @for (l of levels; track l) {
                    <div class="flex size-36 items-center justify-center rounded-sap-element-border-corner-radius bg-sap-group-content-background text-sap-font-small-size"
                        [style.box-shadow]="'var(--sapContent_Shadow' + l + ')'">
                        --sapContent_Shadow{{ l }}
                    </div>
                }
            </div>
        `
    })
};

export const Density: Story = {
    render: () => ({
        template: `
            <table class="border-collapse text-start">
                <tr><th class="pe-6 text-start">Token</th><th class="pe-6 text-start">Cozy</th><th class="text-start">Compact</th></tr>
                <tr><td class="pe-6"><code>Element height</code></td>
                    <td class="pe-6"><div class="h-sap-element-height w-24 rounded-sap-field-border-corner-radius bg-sap-informative-element-color"></div></td>
                    <td><div class="h-sap-element-compact-height w-24 rounded-sap-field-border-corner-radius bg-sap-informative-element-color"></div></td></tr>
            </table>
        `
    })
};
