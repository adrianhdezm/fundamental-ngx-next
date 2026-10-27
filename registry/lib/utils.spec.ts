import { describe, expect, it } from 'vitest';
import { cn } from './utils';

// cn() (tailwind-merge) must resolve conflicts between SAP token utilities correctly: font sizes vs text colours,
// shadows vs shadow colours, and the custom utilities of fundamental.css.
const cases: [input: string, expected: string][] = [
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

describe('cn', () => {
    it.each(cases)('cn(%j) is %j', (input, expected) => {
        expect(cn(input)).toBe(expected);
    });
});
