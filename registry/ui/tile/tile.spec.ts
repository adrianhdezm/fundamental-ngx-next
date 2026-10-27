import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('Tile', () => {
    it.todo(
        'clickable tile is role button, focusable, emits tileClick on click, Enter and Space (not when the event comes from an inner button)'
    );
    it.todo('<a fd-tile> keeps link semantics and emits tileClick on click');
    it.todo('size s and double width; header/content/footer heights per size');
    it.todo('two-column sections; feed tile content columns');
    it.todo('line tile: floating vs list container, title ellipsis, compact heights, disabled');
    it.todo('action mode shows the overlay, close and indicator buttons and hides footer and badge');
    it.todo('slide tile: toggle button shows on hover/focus/touch, play/pause label; page dots');
    it.todo('badge position (top end) and inline in line tiles');
    it.todo('numeric content sizes l/m/s, small-tile sizes, state colors, RTL value direction');
});
