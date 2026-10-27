/**
 * Compiles every Tailwind class used in registry/ and reports:
 *   - classes that reference an SAP token (`sap-...` or `--sap...`) but generate no CSS,
 *     usually a misspelled token name;
 *   - generated declarations whose `var(--sap...)` name was broken by Tailwind's
 *     underscore-to-space conversion (write calc operators as `_-_` / `_+_`);
 *   - `var(--sap...)` references to variables that no SAP theme defines.
 *
 * Run with `pnpm check:styles`. Exits non-zero on problems.
 */
import { Scanner } from '@tailwindcss/oxide';
import { compile } from 'tailwindcss';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const twDir = dirname(fileURLToPath(import.meta.resolve('tailwindcss/package.json')));

const compiler = await compile(
    `@import 'tailwindcss/theme.css' layer(theme);\n@import './registry/styles/fundamental.css';\n@tailwind utilities;`,
    {
        base: root,
        async loadStylesheet(id, base) {
            const path = id.startsWith('tailwindcss/')
                ? resolve(twDir, id.slice('tailwindcss/'.length))
                : id.startsWith('.')
                  ? resolve(base, id)
                  : resolve(root, 'node_modules', id);
            return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
        }
    }
);

// spec files are not shipped, and their test code names attributes such as data-sap-theme
const scanner = new Scanner({
    sources: [
        { base: resolve(root, 'registry'), pattern: '**/*.ts', negated: false },
        { base: resolve(root, 'registry'), pattern: '**/*.spec.ts', negated: true }
    ]
});
const candidates = scanner.scan().filter((c) => /sap|--sap/.test(c));

/** CSS.escape for selectors, as Tailwind prints them. */
const escape = (s) => s.replace(/(^-?\d)|[^a-zA-Z0-9_-]/g, (ch, digit) => (digit ? `\\3${digit.at(-1)} ` : `\\${ch}`));

const problems = [];
for (const candidate of candidates) {
    const css = compiler.build([candidate]);
    // build() accumulates; look for this candidate's own rule
    if (!css.includes(`.${escape(candidate)}`)) {
        // ignore plain words such as glyph names or prose that only happen to contain "sap"
        if (/^[a-z0-9-]+:|^-?[a-z]+(-[a-z0-9]+)*-sap-|\(--sap|\[.*--sap/.test(candidate)) {
            problems.push(`no CSS generated: ${candidate}`);
        }
    }
}

const css = compiler.build([]);
for (const m of css.matchAll(/var\(--sap[A-Za-z0-9]*\s+[A-Za-z0-9_]+\)/g)) {
    problems.push(`broken variable name: ${m[0]}`);
}

// every --sap variable used by a utility must exist in the theme
const themeCss = readFileSync(resolve(root, 'registry/styles/themes/sap_horizon.css'), 'utf8');
const known = new Set([...themeCss.matchAll(/(--sap[A-Za-z0-9_]+):/g)].map((m) => m[1]));
const utilities = css.slice(css.indexOf('@layer base'));
for (const m of utilities.matchAll(/var\((--sap[A-Za-z0-9_]+)/g)) {
    if (!known.has(m[1])) problems.push(`unknown SAP variable: ${m[1]}`);
}

if (problems.length) {
    console.error([...new Set(problems)].join('\n'));
    console.error(`\n${new Set(problems).size} style problem(s)`);
    process.exit(1);
}
console.log(`check-styles: ${candidates.length} SAP token classes OK`);
