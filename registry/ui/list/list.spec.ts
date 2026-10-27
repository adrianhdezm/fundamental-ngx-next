import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('List', () => {
    it.todo('arrow keys move focus between items (rebuilt key manager when items change); Home/End');
    it.todo('focusEscapeList moves focus out at the ends');
    it.todo('selection list: items are options with aria-selected; the checkbox/radio is inert and the item toggles');
    it.todo('selectedChange emits from clicks and Space');
    it.todo('navigation items: link fills the item, navigation indicator and navigated state');
    it.todo('growing item loads more (button) and keeps focus');
    it.todo('byline, subline, counter, unread indicator, group headers, footer and message');
    it.todo('action item styles in Horizon vs high contrast');
});
