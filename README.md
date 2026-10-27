# fundamental-ngx-next

SAP Fiori Horizon components for Angular, as copy-paste source files.

- **Port of [`@fundamental-ngx/core`](https://sap.github.io/fundamental-ngx/#/core/home)**: same behaviour, ARIA and keyboard handling.
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
  check-a11y.mjs          axe-core over all stories, per theme
docs/                     Storybook introduction and foundations pages
```

## Commands

Requires Node `>=22.22.3` (see `.nvmrc`) and pnpm.

```sh
pnpm install
pnpm storybook          # http://localhost:6006
pnpm build-storybook    # dist/storybook, including the registry under /r
pnpm check              # typecheck (strict templates), style, cn() and registry checks
pnpm check:a11y         # axe on every story of a running Storybook (needs Playwright); --theme=sap_horizon_hcb
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

## License

Apache-2.0. SAP theme content and fonts come from `@sap-theming/theming-base-content` (Apache-2.0).
