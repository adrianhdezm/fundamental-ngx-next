import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('Card', () => {
    it.todo('header, content and footer render in order; badges at the top end corner (two at most)');
    it.todo('interactive main header: focusable, Enter/Space emit, aria-description carries the hint');
    it.todo('card role description and hint are exposed on the host');
    it.todo('selected card shows the selection border (data-selected), not aria-selected on listitems');
    it.todo('KPI header: value, scale icon/text, analytics labels and indicators');
    it.todo('loader state shows skeletons and hides content from assistive technology');
    it.todo('media card: image container/banner variants, shell and legend colors, responsive banner sizes');
    it.todo('card list: arrow keys move focus between cards, Home/End jump');
    it.todo('corner rounding of the first/last part follows the card radius');
});
