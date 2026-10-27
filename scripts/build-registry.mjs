/**
 * Builds the shadcn-compatible registry from registry.json:
 *
 *   public/r/registry.json   the registry index
 *   public/r/<name>.json     one registry item per component, with file contents inlined
 *
 * It also enforces the copy-paste contract. A component file may import only:
 *   - @angular/*, rxjs, and the npm packages listed in the item's `dependencies`
 *   - @/lib/<name> when <name> is the item itself or listed in `registryDependencies` (e.g. utils, datetime)
 *   - @/ui/<other>/... when <other> is listed in `registryDependencies`
 *   - relative files of its own folder that are part of the item
 *
 * Every folder under registry/ui must be a registry item.
 *
 * Usage: REGISTRY_URL=https://example.com/r node scripts/build-registry.mjs [--check]
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const registryUrl = (process.env.REGISTRY_URL ?? 'https://adrianhdezm.github.io/fundamental-ngx-next/r').replace(
    /\/$/,
    ''
);
const themingVersion = JSON.parse(
    readFileSync(join(root, 'node_modules/@sap-theming/theming-base-content/package.json'), 'utf8')
).version;
const FONT_CDN = `https://cdn.jsdelivr.net/npm/@sap-theming/theming-base-content@${themingVersion}/content/Base/baseLib`;

const registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8'));
const items = new Map(registry.items.map((item) => [item.name, item]));
const errors = [];

// every component folder is an item
for (const dir of readdirSync(join(root, 'registry/ui'))) {
    if (!items.has(dir)) errors.push(`registry/ui/${dir} is not listed in registry.json`);
}

const BUILTIN = /^(@angular\/|rxjs|tslib)/;

function targetOf(item, file) {
    if (file.target) return file.target;
    // registry/ui/<name>/<file> -> src/components/ui/<name>/<file>
    return file.path.replace(/^registry\/ui\//, 'src/components/ui/');
}

function checkImports(item, file, content) {
    const own = new Set(item.files.map((f) => f.path));
    for (const [, spec] of content.matchAll(/(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s+'([^']+)'/g)) {
        if (BUILTIN.test(spec)) continue;
        const lib = spec.match(/^@\/lib\/([^/]+)$/);
        if (lib) {
            if (item.name !== lib[1] && !(item.registryDependencies ?? []).includes(lib[1]))
                errors.push(`${file.path}: imports ${spec} without registryDependency "${lib[1]}"`);
            continue;
        }
        const ui = spec.match(/^@\/ui\/([^/]+)\//);
        if (ui) {
            if (!(item.registryDependencies ?? []).includes(ui[1]))
                errors.push(`${file.path}: imports ${spec} without registryDependency "${ui[1]}"`);
            continue;
        }
        if (spec.startsWith('.')) {
            const resolved = posix.normalize(posix.join(posix.dirname(file.path), spec));
            if (!own.has(`${resolved}.ts`) && !own.has(resolved))
                errors.push(`${file.path}: relative import ${spec} is not a file of item "${item.name}"`);
            continue;
        }
        const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
        if (!(item.dependencies ?? []).includes(pkg))
            errors.push(`${file.path}: imports ${pkg} which is not in "dependencies"`);
    }
}

const out = [];
for (const item of registry.items) {
    for (const dep of item.registryDependencies ?? []) {
        if (!items.has(dep)) errors.push(`${item.name}: unknown registryDependency "${dep}"`);
    }
    const files = item.files.map((file) => {
        const abs = join(root, file.path);
        if (!existsSync(abs)) {
            errors.push(`${item.name}: missing file ${file.path}`);
            return null;
        }
        let content = readFileSync(abs, 'utf8');
        if (file.path.endsWith('.ts')) checkImports(item, file, content);
        // fonts are binary: point the registry copy of fonts.css at the npm package on a CDN
        if (file.path.endsWith('styles/fonts.css')) {
            content = content.replace(/url\('\.\/fonts\/([^']+)'\)/g, (_, f) => {
                const dir = /^(SAP-icons|BusinessSuite)/.test(f) ? 'sap_horizon/fonts' : 'baseTheme/fonts';
                return `url('${FONT_CDN}/${dir}/${f}')`;
            });
        }
        return { path: file.path, type: file.type, target: targetOf(item, file), content };
    });
    out.push({
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        name: item.name,
        type: item.type,
        title: item.title,
        description: item.description,
        ...(item.dependencies && { dependencies: item.dependencies }),
        ...(item.registryDependencies && {
            registryDependencies: item.registryDependencies.map((d) => `${registryUrl}/${d}.json`)
        }),
        files: files.filter(Boolean)
    });
}

if (errors.length) {
    console.error(errors.join('\n'));
    console.error(`\n${errors.length} registry error(s)`);
    process.exit(1);
}

if (!checkOnly) {
    const dir = join(root, 'public/r');
    mkdirSync(dir, { recursive: true });
    for (const item of out) writeFileSync(join(dir, `${item.name}.json`), JSON.stringify(item, null, 2) + '\n');
    writeFileSync(
        join(dir, 'registry.json'),
        JSON.stringify(
            {
                ...registry,
                items: registry.items.map(({ files, ...rest }) => ({
                    ...rest,
                    files: files.map((f) => ({ path: f.path, type: f.type, target: f.target }))
                }))
            },
            null,
            2
        ) + '\n'
    );
}
console.log(`registry: ${out.length} items ${checkOnly ? 'checked' : `built into public/r (${registryUrl})`}`);
