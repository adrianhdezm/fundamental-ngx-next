import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('DynamicPage', () => {
    it.todo('clicking the title area toggles the header; clicks on breadcrumb, actions and links do not');
    it.todo('the hidden header button toggles with Enter and Space and exposes aria-expanded');
    it.todo(
        'scrolling the content collapses the header; scrolling back to the top expands it; pinned keeps it expanded'
    );
    it.todo('disableSnapOnScroll keeps the header expanded while scrolling');
    it.todo('collapsed header hides the subheader content, shows facets next to the title and the snapped title size');
    it.todo('subheader [(collapsed)] two-way binding stays in sync with clicks and scrolling');
    it.todo('pin button only while expanded; collapsing unpins');
    it.todo(
        'responsive size from the page width sets paddings (1rem / 2rem / 3rem) and moves layout actions next to the breadcrumb below 1280px'
    );
    it.todo('autoResponsive=false uses the size input');
    it.todo('expandContent fills the viewport below the page top minus offset');
    it.todo('content is focusable for keyboard scrolling and gets a footer spacer when a footer exists');
    it.todo('floating footer offsets follow the page size');
    it.todo('background list / transparent, including the high contrast overrides');
});
