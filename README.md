# fundamental-ngx-next

SAP Fiori Horizon components for Angular, as copy-paste source files.

- **Unofficial port of [`@fundamental-ngx/core`](https://sap.github.io/fundamental-ngx/#/core/home)** (Apache-2.0, see [License and attribution](#license-and-attribution)): same behaviour, ARIA and keyboard handling. Not ported: the legacy avatar group and the table.
- **Styled with Tailwind CSS v4** on the SAP theme tokens from [`@sap-theming/theming-base-content`](https://github.com/SAP/theming-base-content). No fundamental-styles CSS at runtime.
- **Behaviour from the Angular CDK** (a11y, overlay, bidi, ...).
- **Modern Angular**: standalone, signals, `input()`/`model()`/`output()`, OnPush, zoneless.
- **shadcn-style distribution**: copy `registry/ui/<name>/` into your app, or `npx shadcn add <registry-url>/r/<name>.json`.
- **Themes**: Horizon, Horizon Dark, Horizon HC Black, Horizon HC White. **Density**: cozy, compact (and condensed). **RTL**.

## Repository layout

```
registry/
  lib/utils.ts            cn() (clsx + tailwind-merge aware of SAP tokens) and cva variants
  styles/
    fundamental.css       entry point: imports below + density/state variants + base styles
    tokens.css            generated: every --sap* token as a Tailwind @theme value
    themes/*.css          generated: the four Horizon themes
    fonts.css, fonts/     generated: "72" and the SAP icon fonts
  ui/<component>/         one self-contained folder per component (+ its *.stories.ts)
registry.json             shadcn registry definition (source of truth)
scripts/
  generate-tokens.mjs     regenerates styles/ and the icon glyph map from theming-base-content
  build-registry.mjs      builds public/r/*.json and checks each component's imports
  check-styles.mjs        compiles every class and flags unknown SAP tokens / broken var() names
  check-cn.mjs            cn() merge rules for SAP token utilities
docs/                     Storybook introduction and foundations pages
```

## Commands

Requires Node `>=22.22.3` (see `.nvmrc`) and pnpm (settings in `pnpm-workspace.yaml`). The tests use the
Playwright and Chromium of the dev dependencies (`pnpm exec playwright install chromium` once, if Chromium is missing).

```sh
pnpm install
pnpm storybook          # http://localhost:6006
pnpm build-storybook    # dist/storybook, including the registry under /r
pnpm check              # typecheck (strict templates), style, cn() and registry checks, tests, a11y
pnpm test               # component tests in Chromium (Vitest browser mode); specs next to each component
pnpm test:a11y          # every story rendered by Vitest and checked with axe, in Horizon and Horizon HC Black
pnpm tokens             # regenerate the theme layer after bumping theming-base-content
```

## Using the components in an app

```sh
pnpm add @angular/cdk clsx tailwind-merge class-variance-authority
```

1. Copy `registry/styles/` to `src/styles/` and import it after Tailwind:
   ```css
   @import 'tailwindcss';
   @import './styles/fundamental.css';
   ```
2. Copy `registry/lib/utils.ts` to `src/lib/utils.ts`.
3. Add the aliases the components import from to `tsconfig.json`:
   ```json
   "paths": { "@/lib/*": ["./src/lib/*"], "@/ui/*": ["./src/components/ui/*"] }
   ```
4. Copy the component folders you need to `src/components/ui/`. A component's `registryDependencies` in
   `registry.json` lists the other folders it needs.

With the shadcn CLI, the same files are installed by `npx shadcn add <registry-url>/r/<name>.json`
(`theme` and `utils` come along as dependencies). The registry copy of `fonts.css` loads the fonts from the
`@sap-theming/theming-base-content` package on jsDelivr; self-host them by copying the `.woff2` files instead.

```html
<html data-sap-theme="sap_horizon" data-density="compact" dir="ltr"></html>
```

```ts
import { Button } from '@/ui/button/button';

@Component({
    imports: [Button],
    template: `<button fdButton variant="emphasized" label="Save" (click)="save()"></button>`
})
```

## Token utilities

`--sapButton_Hover_Background` → `bg-sap-button-hover-background`, `--sapContent_Shadow1` → `shadow-sap-content-shadow1`,
`--sapElement_Height` → `h-sap-element-height`. Rule: drop `sap`, split camelCase and `_`, kebab-case, prefix `sap-`.
Tokens without a Tailwind namespace use the shorthand `opacity-(--sapContent_DisabledOpacity)`. In arbitrary
values Tailwind may turn the `_` of `--sap*_*` names into spaces: write calc operators as `_-_`/`_+_`, multiply on the
right (`calc(var(--sapX_Y)*2)`), and alias tokens into local variables (`[--bw:var(--sapList_BorderWidth)]`) before
using them in multi-part values like `shadow-[0_var(--bw)_0_var(--c)]`. `pnpm check:styles` catches all of these.

## License and attribution

Apache-2.0, see [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

This is an unofficial derivative work of SAP's open source Fundamental Library, which is also licensed under
Apache-2.0:

- The components are **ports of [fundamental-ngx](https://github.com/SAP/fundamental-ngx)** (`@fundamental-ngx/core`):
  behaviour, keyboard handling, ARIA and APIs come from it, rewritten with signals, the Angular CDK and Tailwind CSS.
- Their **visual design follows [fundamental-styles](https://github.com/SAP/fundamental-styles)**, rebuilt as Tailwind
  utilities; `registry/styles/extensions.css` holds theme values taken from it.
- The **theme values, the "72" typeface and the SAP icon fonts** come from
  [`@sap-theming/theming-base-content`](https://github.com/SAP/theming-base-content).

Every component file starts with a header naming the code it is ported from, its copyright holders and the license, so
the attribution travels with the file when you copy it into your app. Keep these headers, and keep the `LICENSE` and
`NOTICE` information with any redistribution.

SAP and SAP Fiori are trademarks of SAP SE. This project is not affiliated with, endorsed by or sponsored by SAP SE.
