/**
 * Runs axe-core on every story of a Storybook (dev server or static build) and reports violations.
 *
 *   node scripts/check-a11y.mjs [storybookUrl] [--theme=sap_horizon_hcb] [--filter=button]
 *
 * Needs Playwright with Chromium (`npm i -g playwright` or a project install).
 * Exits non-zero when a story has serious or critical violations.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith('--')) ?? 'http://localhost:6006').replace(/\/$/, '');
const theme = args.find((a) => a.startsWith('--theme='))?.split('=')[1] ?? 'sap_horizon';
const filter = args.find((a) => a.startsWith('--filter='))?.split('=')[1];

/**
 * Rules skipped per story prefix where the result comes from the SAP theme itself, not from this
 * library: the tokens are used as designed (high-contrast themes still get the full check).
 */
const KNOWN = {
    // Horizon inverted status backgrounds and informative text are below 4.5:1 by design
    'components-object-status-': { rules: ['color-contrast'], themes: ['sap_horizon', 'sap_horizon_dark'] },
    'components-object-number-': { rules: ['color-contrast'], themes: ['sap_horizon', 'sap_horizon_dark'] },
    // inverted status badges and white text on shell category colours
    'components-card-': { rules: ['color-contrast'], themes: ['sap_horizon', 'sap_horizon_dark'] }
};

const index = await (await fetch(`${base}/index.json`)).json();
const stories = Object.values(index.entries).filter(
    (e) => e.type === 'story' && e.id.startsWith('components-') && (!filter || e.id.includes(filter))
);

const browser = await chromium.launch();
const page = await browser.newPage();
let failing = 0;
for (const story of stories) {
    await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`, {
        waitUntil: 'networkidle'
    });
    await page.waitForTimeout(300);
    await page.addScriptTag({ content: axeSource });
    const skip = Object.entries(KNOWN)
        .filter(([prefix, known]) => story.id.startsWith(prefix) && known.themes.includes(theme))
        .flatMap(([, known]) => known.rules);
    const violations = await page.evaluate(async (skip) => {
        const rules = Object.fromEntries(skip.map((id) => [id, { enabled: false }]));
        // @ts-ignore axe is injected above
        const result = await window.axe.run('#storybook-root', { resultTypes: ['violations'], rules });
        return result.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 3)
        }));
    }, skip);
    const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    if (serious.length) failing++;
    if (violations.length) {
        console.log(`\n${story.id}`);
        for (const v of violations)
            console.log(`  [${v.impact}] ${v.id}: ${v.help}\n      ${v.nodes.join('\n      ')}`);
    }
}
await browser.close();
console.log(`\ncheck-a11y: ${stories.length} stories, ${failing} with serious or critical violations (${theme})`);
process.exit(failing ? 1 : 0);
