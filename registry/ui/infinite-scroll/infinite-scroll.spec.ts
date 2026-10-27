import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('InfiniteScroll', () => {
    it.todo('emits onScrollAction when the scroll position is within scrollPercent of the end');
    it.todo('does not emit while the previous load is pending / after the end');
    it.todo('works with a scrollable container and with the window');
});
