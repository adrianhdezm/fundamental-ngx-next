import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('Checkbox', () => {
    it.todo('works with ngModel and reactive forms (ControlValueAccessor), including disabled state');
    it.todo('tristate cycles unchecked → checked → indeterminate when tristateSelectable');
    it.todo('custom values map to checked/unchecked/indeterminate');
    it.todo('label click toggles; aria-checked mirrors mixed state');
    it.todo('state (error, warning, success, information) styles and aria-invalid');
    it.todo('readonly and displayOnly prevent changes but stay readable');
    it.todo('compact density and wrapLabel / valignLabel');
});
