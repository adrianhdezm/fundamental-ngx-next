## product-switch

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/product-switch) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/product-switch)
Registry: `registry/ui/product-switch/` — 12 stories, 16 tests.

### Stories vs. upstream examples

| Upstream example                                    | Registry story                       | Status     | Notes                                                                                                  |
| --------------------------------------------------- | ------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| Basic Product Switch (App Launcher) inside Shellbar | Large (4 columns); shellbar stories  | ✅ covered | Drag and drop with a sticky, non-draggable "Home"; shellbar integration lives in `shellbar.stories.ts` |
| Large                                               | Large (4 columns); Open: large       | ✅ covered |                                                                                                        |
| Medium                                              | Medium (3 columns); Open: medium     | ✅ covered |                                                                                                        |
| Two-Column Layout                                   | Two columns; Open: two columns       | ✅ covered |                                                                                                        |
| List Mode                                           | List; Open: list                     | ✅ covered |                                                                                                        |
| Busy State                                          | Busy and custom button; Open: busy   | ✅ covered |                                                                                                        |
| URL Navigation                                      | URL navigation; Open: URL navigation | ✅ covered | Icons instead of upstream's product images; the callback item shows a message instead of `alert`       |

The "Open: …" stories open the switch in `play()` by clicking its button.

### Tests vs. upstream specs

| Upstream behaviour                                                                                      | Registry test                                                                                         | Status     | Notes                                                                     |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `should create`, default input values, boolean coercion, wrapper/popover structure                      | —                                                                                                     | ➖ n/a     | Wiring and defaults                                                       |
| Rendering: one item per product, title, subtitle only when given, anchor only with `url`, ARIA per item | opens a menu of products…; renders a subtitle only when given and an anchor only for items with a url | ✅ covered | Count, role menuitem, `aria-posinset`, label, subtitle and anchor checked |
| `dragAndDropEnabled` and per-item `disabledDragAndDrop`                                                 | dragAndDropEnabled false or disabledDragAndDrop makes items not draggable                             | ✅ covered | Drag simulated with mouse events on the CDK drag                          |
| `forceListMode` switches to the list layout                                                             | forceListMode shows a list where ArrowDown/ArrowUp wrap                                               | ✅ covered | One item per row                                                          |
| Column layout by count: < 3 two columns, 3–6 three, ≥ 7 four                                            | lays out two, three or four columns by product count                                                  | ✅ covered | Items in the first row counted                                            |
| `busy` shows the busy indicator                                                                         | busy shows the busy indicator                                                                         | ✅ covered |                                                                           |
| URL items default to `target="_blank"`, explicit target respected                                       | renders a subtitle only when given and an anchor only for items with a url                            | ✅ covered | Target also feeds the item's accessible label in the port                 |
| `isOpen` model: default false, programmatic open; `isOpenChange` emits on changes, not on init          | setting isOpen opens the menu and isOpenChange is not emitted on init; opens a menu…                  | ✅ covered |                                                                           |
| `itemClicked` emits; item callback receives the click event; `selected` not mutated                     | opens a product with Enter and closes…; the callback receives the click event                         | ✅ covered | `selected` is not part of the port's item                                 |
| `productsChange` after a drop                                                                           | dropping an item emits the reordered products, sticky items keep their place                          | ✅ covered | Two-way `products` binding                                                |
| URL navigation: `window.open(url, target)`; not with a callback; not without url                        | url items open with window.open in \_blank by default or their target, not when a callback is set     | ✅ covered |                                                                           |
| Drag guard: click ending a drag does not open/emit; next click works                                    | a click that ends a drag does not open the product, the next click does                               | ✅ covered |                                                                           |
| Opening focuses the first item                                                                          | opens a menu of products and focuses the first one                                                    | ✅ covered |                                                                           |
| Enter and Space activate the item                                                                       | opens a product with Enter and closes…; Space opens the focused product                               | ✅ covered |                                                                           |
| Grid keys, 4 columns: Left/Right, wrap, Up/Down by 4                                                    | moves through the grid with the arrow keys                                                            | ✅ covered |                                                                           |
| Grid keys, 3 columns: Up/Down by 3                                                                      | ArrowDown/ArrowUp move by three columns with 3–6 products                                             | ✅ covered |                                                                           |
| List mode keys: Up/Down with wrap                                                                       | forceListMode shows a list where ArrowDown/ArrowUp wrap                                               | ✅ covered |                                                                           |
| `disabled` product switch cannot be opened                                                              | a disabled product switch does not open                                                               | ✅ covered | Click and Enter                                                           |
| Custom `fdProductSwitchButton` replaces the default grid button                                         | a custom fdProductSwitchButton replaces the grid button                                               | ✅ covered |                                                                           |

Registry-only coverage: trigger `aria-haspopup="menu"`/`aria-expanded`, `aria-posinset`, focus returns to the trigger after choosing.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** done.
