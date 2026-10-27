import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('ResizableCardLayout', () => {
    it.todo('layout size from the available width (≤656 sm, ≤975 md, ≤1359 lg, else xl) sets 1–4 columns and paddings');
    it.todo('cards are placed by rank at the topmost position where they fit (layout height = highest column + 1rem)');
    it.todo('card widths are limited to the columns and restored when there is room again');
    it.todo(
        'dragging the right edge/corner snaps the width to columns once past half a column (emits stepChange, resized)'
    );
    it.todo(
        'growing a card past half a column moves cards at the end of its row down; shrinking back restores their ranks'
    );
    it.todo(
        'dragging the bottom edge snaps the height to 1rem rows; below mini content snaps to it, then to the mini header (emits miniContentReached / miniHeaderReached)'
    );
    it.todo('resizable=false shows no handles');
    it.todo('RTL: horizontal resizing is mirrored and cards are placed from the right');
    it.todo('arrow keys move focus between cards in rank order');
    it.todo('layoutChange emits the configuration (rank, spans) after every arrangement');
});
