import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('FormattedText', () => {
    it.todo('sanitizes htmlText: keeps the allowed tags and attributes, strips scripts and event handlers');
    it.todo('links get convertedLinksDefaultTarget and rel noopener, and keep the link focus styles');
    it.todo('width and height constrain the container');
});
