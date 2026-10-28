# fundamental-ngx-registry

SAP Fiori Horizon components for Angular, as copy-paste source files.

**Storybook:** https://adrianhdezm.github.io/fundamental-ngx-registry/ (the registry is served from the same site under
`/r/<name>.json`).

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
docs/                     Storybook introduction and foundations pages
```

## Commands

Requires Node `>=22.22.3` (see `.nvmrc`) and pnpm (settings in `pnpm-workspace.yaml`). The tests use the
Playwright and Chromium of the dev dependencies (`pnpm exec playwright install chromium` once, if Chromium is missing).

```sh
pnpm install
pnpm storybook          # http://localhost:6006
pnpm build-storybook    # dist/storybook, including the registry under /r
pnpm check              # typecheck (strict templates), style and registry checks, tests, a11y
pnpm test               # component tests in Chromium (Vitest browser mode); specs next to each component
pnpm test:a11y          # every story rendered by Vitest and checked with axe, in Horizon and Horizon HC Black
pnpm tokens             # regenerate the theme layer after bumping theming-base-content
```

## Using the components in an app

### With the shadcn CLI

The registry is published at `https://adrianhdezm.github.io/fundamental-ngx-registry/r/<name>.json`, where `<name>`
is the component's folder name (`button`, `date-picker`, ...). The CLI copies the source files into your app, along
with the components each one uses, the theme (`src/styles/`), `src/lib/utils.ts` and the npm packages.

1. Add Tailwind CSS v4, if the app doesn't have it yet:
   ```sh
   npx ng add tailwindcss
   ```
2. Map `@/*` to `src/*` in the `compilerOptions` of `tsconfig.json`. The components import each other through it, and
   the CLI resolves the aliases below with it:
   ```json
   "paths": { "@/*": ["./src/*"] }
   ```
3. Add a `components.json` at the project root:
   ```json
   {
     "$schema": "https://ui.shadcn.com/schema.json",
     "style": "new-york",
     "rsc": false,
     "tsx": true,
     "tailwind": { "config": "", "css": "src/styles.css", "baseColor": "neutral", "cssVariables": true },
     "aliases": { "components": "@/components", "ui": "@/components/ui", "utils": "@/lib/utils", "lib": "@/lib" }
   }
   ```
   Keep these settings:
   - `"css"` names the global stylesheet that imports Tailwind. The CLI adds the theme import to it.
   - `"tsx": true` keeps the files in TypeScript (`false` makes the CLI transpile them to JavaScript).
   - `"cssVariables": true` keeps the class names as they are (`false` makes the CLI rewrite them).
   - The `ui` and `lib` aliases decide where the components and `utils.ts` go, and the CLI rewrites their imports to
     match. To keep them inside `src/app/`, map `@/*` to `./src/app/*` in step 2; the aliases stay the same.
4. Add components (pass several URLs to add them at once):
   ```sh
   npx shadcn add https://adrianhdezm.github.io/fundamental-ngx-registry/r/button.json
   ```
   The first one also adds the theme import after Tailwind in `src/styles.css`:
   ```css
   @import 'tailwindcss';
   @import './styles/fundamental.css';
   ```
   Horizon is the default theme; to pick another one or compact density, see [Theme and usage](#theme-and-usage).
5. Raise the `initial` budget in `angular.json`, for example to `"maximumError": "3MB"`. The four themes and the icon
   glyph map put the initial bundle at about 1.3 MB raw (about 210 kB transferred), which is over the 1 MB error
   budget of a new app.

Installed components import each other from `@/components/ui/...`. To update a component, run its `npx shadcn add`
again with `--overwrite` and review the diff. The registry copy of `fonts.css` loads the fonts from the
`@sap-theming/theming-base-content` package on jsDelivr. To self-host them, copy the `.woff2` files instead.

### By copying the files

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

### Theme and usage

```html
<html data-sap-theme="sap_horizon" data-density="compact" dir="ltr"></html>
```

```ts
import { Button } from '@/ui/button/button'; // '@/components/ui/button/button' when installed with the CLI

@Component({
    imports: [Button],
    template: `<button fdButton variant="emphasized" label="Save" (click)="save()"></button>`
})
```

## Token utilities

Every SAP theme token is available as a Tailwind utility. To get the class name, drop the `--sap` prefix, split the
name at camelCase and `_`, write it in kebab-case and prefix it with `sap-`:

| Token                          | Utility                          |
| ------------------------------ | -------------------------------- |
| `--sapButton_Hover_Background` | `bg-sap-button-hover-background` |
| `--sapContent_Shadow1`         | `shadow-sap-content-shadow1`     |
| `--sapElement_Height`          | `h-sap-element-height`           |

Tokens without a Tailwind namespace use the variable shorthand, for example `opacity-(--sapContent_DisabledOpacity)`.

In arbitrary values Tailwind may turn the `_` in `--sap*_*` names into spaces. To avoid that:

- write calc operators as `_-_` and `_+_`;
- multiply on the right: `calc(var(--sapX_Y)*2)`;
- in multi-part values, alias the tokens into local variables first, e.g. `[--bw:var(--sapList_BorderWidth)]`, then
  use `shadow-[0_var(--bw)_0_var(--c)]`.

`pnpm check:styles` catches all of these.

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
