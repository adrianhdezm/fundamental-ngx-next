## split-button

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/split-button) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/split-button)
Registry: `registry/ui/split-button/` — 5 stories, 9 tests.

### Stories vs. upstream examples

| Upstream example                                                                         | Registry story | Status     | Notes                                                                             |
| ---------------------------------------------------------------------------------------- | -------------- | ---------- | --------------------------------------------------------------------------------- |
| Button Behaviors (default, additional main action, constant main action, flexible width) | `Behaviors`    | ✅ covered | All four, plus a disabled one. `OpenMenu` opens a menu in `play` for axe.         |
| Button Types (disabled, default, emphasized, transparent)                                | `Types`        | ✅ covered | All seven variants; disabled sits in `Behaviors`.                                 |
| Buttons with Icons (`glyph` menu, cart)                                                  | `Template`     | ✅ covered | One custom arrow glyph (`menu`) with icon menu items.                             |
| Programmatic Selection and Open / Close (`[selected]`, `menu.open()/close()`)            | `Programmatic` | ✅ covered | Open/Close buttons call `menu.open()/close()`; Select Option 1/2 set `[selected]` |
| Custom Template for Action Button                                                        | `Template`     | ✅ covered | `fd-split-button-action-title`.                                                   |

### Tests vs. upstream specs

| Upstream behaviour                                               | Registry test                                                                                                             | Status     | Notes                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------- |
| should create                                                    | —                                                                                                                         | ➖ n/a     |                                                 |
| Content init: title from first item, or from the `selected` item | shows the first item as the main action…; the selected input sets the main action…                                        | ✅ covered |                                                 |
| Main button click: runs the first item, or the selected item     | shows the first item…; keeps a constant main action…; the selected input sets the main action and the main button runs it | ✅ covered |                                                 |
| Button text class                                                | —                                                                                                                         | ➖ n/a     | CSS class only.                                 |
| More button is-active while open                                 | opens the menu from the arrow…; aria-controls points to the open menu                                                     | ✅ covered | Checked as `aria-expanded` and `aria-controls`. |

Registry-only coverage: `aria-haspopup`/`aria-expanded` on the arrow, ArrowDown/Enter/Space and Escape focus handling, `disabled`, `fixedWidth`, choosing an item updates the title and closes the menu, `keepMainAction` with callback.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** done.
