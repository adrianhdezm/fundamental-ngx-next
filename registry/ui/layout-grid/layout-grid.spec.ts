import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('LayoutGrid', () => {
    it.todo('columns span from the S/M/L/XL inputs and inherit upwards (600/1024/1440px breakpoints)');
    it.todo('offsets per breakpoint');
    it.todo('nested grids do not inherit the parent spans');
    it.todo('noGap removes the gutters');
});
