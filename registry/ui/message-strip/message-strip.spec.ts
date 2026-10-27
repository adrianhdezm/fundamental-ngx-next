import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('MessageStrip', () => {
    it.todo('types use the semantic colors, icon and hidden type description');
    it.todo('dismiss button closes and emits onDismiss; dismissible=false hides it');
    it.todo('auto dismiss after duration, paused while hovered when mousePersist');
    it.todo(
        'MessageStripAlertService opens alerts in the six positions, collapses to the middle on narrow screens, dismissAll'
    );
    it.todo('alerts are announced via role alert / live region');
});
