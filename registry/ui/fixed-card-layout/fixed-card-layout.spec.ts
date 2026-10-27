import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('FixedCardLayout', () => {
    it.todo(
        'number of columns follows the width (cards at least 20rem, 1rem gaps), capped by maxColumns and the card count'
    );
    it.todo('cards are placed row by row: card i goes to column i % columns, DOM order stays the rank order');
    it.todo('container height is the highest column; re-measured when a card changes height');
    it.todo('columnsWidthConfig distributes the free space by the column modifiers');
    it.todo('dragging a card onto another swaps their ranks and emits cardDraggedDropped (previous/current index)');
    it.todo(
        'Alt+Arrow keys swap with the neighbour card (left/right respect RTL, up/down by row) and keep focus on the moved card'
    );
    it.todo('arrow keys without Alt move focus between cards with wrap');
    it.todo('disableDragDrop disables pointer and keyboard moves');
    it.todo('layoutChange emits the number of columns and width');
});
