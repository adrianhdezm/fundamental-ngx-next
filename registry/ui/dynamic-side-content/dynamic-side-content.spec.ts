import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('DynamicSideContent', () => {
    it.todo('position left/right/bottom renders the side content before/after the main content in the DOM');
    it.todo('position none/equalSplit keeps the projected order');
    it.todo('size sm hides the side content; md/lg give main 66.666%; xl 75%');
    it.todo('bottom stacks vertically with full widths; equalSplit gives 50% each');
});
