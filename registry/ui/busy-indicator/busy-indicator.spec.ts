import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('BusyIndicator', () => {
    it.todo('loading shows the dots with role progressbar, aria-busy and the label; idle renders no ARIA attributes');
    it.todo('block mode overlays the content and makes it inert while loading');
    it.todo('size s, m, l and the contrast variant');
    it.todo('respects prefers-reduced-motion');
    it.todo('ariaLive announces the label; preventWheelEvents blocks scrolling of the covered content');
});
