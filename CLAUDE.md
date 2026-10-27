# fundamental-ngx-registry

SAP Fiori Horizon components for Angular, distributed shadcn-style (copy-paste source). Each component is a port of
`@fundamental-ngx/core` (behaviour, ARIA, keyboard), with the visuals of fundamental-styles rebuilt as Tailwind v4
utilities on the `@sap-theming/theming-base-content` tokens. See `README.md` for the layout and usage.

## Workflow

- **One pull request per change.** Branch from an up-to-date `main`, push the branch, and open a pull request into
  `main`. Never push to `main` directly, and never reuse the branch of a merged pull request for new work: start the
  next change from `main` again.
- **Conventional Commits** for every commit and pull request title: `type(scope): summary` in the imperative, lower case,
  no trailing period. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`. The scope
  is the component or area, e.g. `fix(menu): stop trapping focus in desktop menus`, `feat(date-picker): add today button`,
  `build: move pnpm settings to pnpm-workspace.yaml`. Mark breaking changes with `!` and a `BREAKING CHANGE:` footer.
  The body explains what changed and why.
- Run `pnpm check` before pushing; it must pass.

## Commands

Node 24 (`.nvmrc`) and pnpm (settings in `pnpm-workspace.yaml`, not in `package.json`).

```sh
pnpm check                                  # everything below; takes about 5 minutes
pnpm typecheck && pnpm typecheck:tests      # strict templates for sources and specs
pnpm check:styles && pnpm check:cn          # SAP token classes, cn() merge rules
pnpm registry:check                         # registry.json and each component's imports
pnpm test                                   # component tests (Vitest browser mode, project "unit")
pnpm test:a11y                              # axe on every story, Horizon and Horizon HC Black
pnpm exec vitest run --project unit registry/ui/menu/   # one component; keep the trailing slash
pnpm format                                 # Prettier
pnpm storybook                              # http://localhost:6006
```

## Components

- One folder per component: `registry/ui/<name>/<name>.ts`, `<name>.spec.ts`, `<name>.stories.ts`, `index.ts`, and an
  entry in `registry.json` (`registryDependencies` lists the components and libs it imports). Imports use the aliases
  `@/ui/*` and `@/lib/*`.
- Standalone, signal inputs/models/outputs, `ChangeDetectionStrategy.OnPush`, zoneless. Behaviour from the Angular
  CDK; ARIA and keyboard handling ported from `@fundamental-ngx/core`.
- Every source file keeps its attribution header (ported from, copyright, Apache-2.0).
- Styling: Tailwind classes on SAP tokens only (`bg-sap-button-hover-background`, see README "Token utilities"); no
  hard-coded colours or sizes where a token exists. Class strings must be literal for Tailwind to find them: no
  `${}` inside a class name (a module-level constant interpolated whole is fine, declared above the component). Dynamic
  values go through CSS variables. Variants: `compact:`, `condensed:`, `hc:`, `toggled:`, `rtl:`.
- Visual reference is fundamental-styles: compare in Storybook with the theme, density and RTL switchers.

## Tests

- Every behaviour change comes with a browser test in the component's spec (see `docs/testing.mdx`). Test hosts keep
  state in signals; await `fixture.whenStable()` (plus a frame for overlays). No `it.todo` or `it.skip` left behind
  without a reason.
- Stories cover the upstream docs examples. Stories named "Open: …" open their overlay in `play`, so the a11y run
  checks it. A story may turn off an axe rule only where the SAP theme itself is the cause, with a comment.
