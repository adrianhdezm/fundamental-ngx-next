import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('Timeline', () => {
    it.todo('renders nodes from the data source with the node template (single or per index)');
    it.todo('layout left/right/top/bottom puts all nodes on one side; double alternates by index');
    it.todo('connecting lines reach the next node along the axis; the last line is hidden');
    it.todo('double vertical layout spaces alternating nodes so each comes after the previous');
    it.todo('lines update when a post resizes (e.g. More/Less in the body) or the timeline resizes');
    it.todo('without data shows three loading placeholders and aria-busy');
    it.todo('role list / listitem; arrows of the posts point to the line in LTR and RTL');
});
