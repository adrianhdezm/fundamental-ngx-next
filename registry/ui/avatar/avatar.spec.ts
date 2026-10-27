import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('Avatar', () => {
    it.todo('renders initials from label, a glyph, or the image as background');
    it.todo(
        'falls back through alterIcon order (content, alt, backup image, default icon) when the image fails to load'
    );
    it.todo('has role img with the aria-label, or is presentational without one');
    it.todo('clickable avatar is a button: focusable, Enter and Space emit avatarClicked');
    it.todo('size, circle, border, tile, transparent and colorAccent apply the expected token classes');
    it.todo('random color accent is stable for the same label');
});
