import { describe, it } from 'vitest';

// Test plan: behaviour to cover with browser tests (Vitest browser mode, see docs/testing.mdx).
describe('AvatarGroup', () => {
    it.todo('shows as many avatars as fit and moves the rest into the overflow button ("+N")');
    it.todo('maxVisibleItems caps the visible avatars; fdAvatarGroupItemForceVisibility keeps an avatar visible');
    it.todo('overflow count is wrapped in <bdi dir="ltr"> so "+8" stays readable in RTL');
    it.todo('individual type: each avatar opens its details popover; group type: the whole group opens the list');
    it.todo('overflow popover: list stage → details stage → back button returns and restores focus');
    it.todo('re-measures when the container resizes or items change');
    it.todo('group trigger has an accessible name built from the visible avatars');
});
