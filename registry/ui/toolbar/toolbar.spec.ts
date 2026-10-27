import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('Toolbar', () => {
    it.todo('shouldOverflow moves items that do not fit into the overflow popover, by priority and group');
    it.todo('forceOverflow puts all overflowable items in the popover');
    it.todo('overflown items are restored to their places when there is room; placeholders keep the order');
    it.todo('spacer, separator, label; title renders a heading');
    it.todo('info (active) type is clickable with keyboard');
    it.todo('role toolbar with orientation and labelling');
});
