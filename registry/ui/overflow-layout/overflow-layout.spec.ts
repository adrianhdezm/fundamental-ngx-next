import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('OverflowLayout', () => {
    it.todo(
        'shows as many items as fit in the row (and at most maxVisibleItems); the rest go into the "N more" popover'
    );
    it.todo('forceVisibility keeps an item visible; hiddenChange emits on moves');
    it.todo('showMorePosition left overflows from the start; reverseHiddenItems reverses the popover order');
    it.todo('custom fdOverflowExpand template receives the hidden items');
    it.todo('visibleItemsCount / hiddenItemsCount / hiddenItemsChange emit after resizes and item changes');
    it.todo('arrow keys move focus between visible focusable items (RTL aware)');
    it.todo('triggerRecalculation re-measures after content changes');
});
