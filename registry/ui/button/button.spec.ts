import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('Button', () => {
    it.todo(
        'variants (standard, emphasized, positive, negative, attention, transparent, ghost) use their token classes in all states'
    );
    it.todo('glyph-only button requires ariaLabel; glyph before/after label');
    it.todo('disabled vs aria-disabled: aria-disabled stays focusable but swallows clicks');
    it.todo('toggled and selected set aria-pressed / aria-selected and the toggled styles');
    it.todo('fdMenu adds the menu arrow and aria-haspopup');
    it.todo('type defaults to "button" inside forms');
    it.todo('semantic variants announce their meaning through the hidden description');
    it.todo('badge (fd-button-badge) shows content and attention style');
    it.todo('compact density shrinks height via data-density');
});
