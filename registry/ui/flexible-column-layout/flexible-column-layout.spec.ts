import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('FlexibleColumnLayout', () => {
    it.todo(
        'each layout sets the start/mid/end widths from the layout definitions; hidden columns are aria-hidden and invisible'
    );
    it.todo('separators appear only between visible columns with the right arrow direction (mirrored in RTL)');
    it.todo('clicking a separator or its button switches to the next layout and emits layoutChange');
    it.todo('below smBreakPoint 2/3 column layouts collapse to one full-screen column and restore when wide again');
    it.todo(
        'between sm and lg three-column layouts reduce to two columns; above lg TwoColumnsEndExpanded becomes three columns'
    );
    it.todo('a layout chosen while narrow replaces the one to restore');
    it.todo('provideFlexibleColumnLayoutConfig overrides some widths and keeps the defaults');
    it.todo('backgroundDesign solid/translucent/transparent, including high contrast');
});
