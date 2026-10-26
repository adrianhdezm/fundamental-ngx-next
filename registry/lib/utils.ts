import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

export { cva, type VariantProps } from 'class-variance-authority';
export type { ClassValue } from 'clsx';

/** SAP token keys follow the `sap-<kebab-token-name>` rule, see styles/tokens.css. */
const sapKey = (suffix: RegExp) => (value: string) => value.startsWith('sap-') && suffix.test(value);

const twMerge = extendTailwindMerge({
    extend: {
        theme: {
            text: [sapKey(/size$/)],
            shadow: [sapKey(/shadow\d*$/)],
            'text-shadow': [sapKey(/text-shadow$/)],
            radius: [sapKey(/radius$/)],
            spacing: [sapKey(/./)],
            font: [sapKey(/family$/)]
        },
        classGroups: {
            'border-w': [{ 'border-width': [sapKey(/width$/)] }]
        }
    }
});

/** Merges class names, resolving Tailwind conflicts so the last class wins. */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
