/**
 * Checks that cn() (tailwind-merge) resolves conflicts between SAP token utilities correctly:
 * font sizes vs text colours, shadows vs shadow colours, and the custom utilities of fundamental.css.
 *
 * Run with `pnpm check:cn` (Node >= 22.18, which strips TypeScript types).
 */
import { cn } from '../registry/lib/utils.ts';

const cases = [
    [
        'focus:outline-sap focus:outline-sap-field-active-border-color',
        'focus:outline-sap focus:outline-sap-field-active-border-color'
    ],
    ['outline-sap outline-sap-field-invalid-color', 'outline-sap outline-sap-field-invalid-color'],
    ['text-sap-font-size text-sap-text-color', 'text-sap-font-size text-sap-text-color'],
    ['text-sap-text-color text-sap-link-color', 'text-sap-link-color'],
    ['text-sap-font-size text-sap-font-small-size', 'text-sap-font-small-size'],
    ['shadow-sap-content-shadow1 shadow-sap-content-shadow2', 'shadow-sap-content-shadow2'],
    [
        'shadow-sap-field-shadow shadow-sap-content-shadow-color',
        'shadow-sap-field-shadow shadow-sap-content-shadow-color'
    ],
    ['h-sap-element-height h-8', 'h-8'],
    ['rounded-sap-button-border-corner-radius rounded-full', 'rounded-full'],
    ['font-sap-font-family font-sap-font-bold-family', 'font-sap-font-bold-family'],
    ['font-sap-font-family font-bold', 'font-sap-font-family font-bold'],
    [
        'border-width-sap-field-border-width border-sap-field-border-color',
        'border-width-sap-field-border-width border-sap-field-border-color'
    ],
    ['bg-sap-button-background bg-sap-button-hover-background', 'bg-sap-button-hover-background'],
    ['scrollbar-sap bg-sap-list-background', 'scrollbar-sap bg-sap-list-background'],
    ['sr-only-sap text-sap-text-color', 'sr-only-sap text-sap-text-color']
];

let failures = 0;
for (const [input, expected] of cases) {
    const actual = cn(input);
    if (actual !== expected) {
        failures++;
        console.error(`cn(${JSON.stringify(input)}) = ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
    }
}
if (failures) process.exit(1);
console.log(`check-cn: ${cases.length} cases OK`);
