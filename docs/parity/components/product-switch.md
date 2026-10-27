## product-switch

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/product-switch) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/product-switch)
Registry: `registry/ui/product-switch/` — 10 stories, 3 tests.

### Stories vs. upstream examples

| Upstream example                                    | Registry story                      | Status     | Notes                                                                                                  |
| --------------------------------------------------- | ----------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| Basic Product Switch (App Launcher) inside Shellbar | Large (4 columns); shellbar stories | ✅ covered | Drag and drop with a sticky, non-draggable "Home"; shellbar integration lives in `shellbar.stories.ts` |
| Large                                               | Large (4 columns); Open: large      | ✅ covered |                                                                                                        |
| Medium                                              | Medium (3 columns); Open: medium    | ✅ covered |                                                                                                        |
| Two-Column Layout                                   | Two columns; Open: two columns      | ✅ covered |                                                                                                        |
| List Mode                                           | List; Open: list                    | ✅ covered |                                                                                                        |
| Busy State                                          | Busy and custom button; Open: busy  | ✅ covered |                                                                                                        |
| URL Navigation                                      | —                                   | ❌ missing | Items with `url` and `target` (`_blank`, `_self`) rendering as anchors                                 |

The "Open: …" stories open the switch in `play()` by clicking its button.

### Tests vs. upstream specs

| Upstream behaviour                                                                                      | Registry test                                         | Status     | Notes                                                                                                 |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `should create`, default input values, boolean coercion, wrapper/popover structure                      | —                                                     | ➖ n/a     | Wiring and defaults                                                                                   |
| Rendering: one item per product, title, subtitle only when given, anchor only with `url`, ARIA per item | opens a menu of products and focuses the first one    | 🟡 partial | Count, role menuitem, `aria-posinset` and label checked; subtitle and anchor-vs-div untested          |
| `dragAndDropEnabled` and per-item `disabledDragAndDrop`                                                 | —                                                     | ❌ missing |                                                                                                       |
| `forceListMode` switches to the list layout                                                             | —                                                     | ❌ missing |                                                                                                       |
| Column layout by count: < 3 two columns, 3–6 three, ≥ 7 four                                            | —                                                     | ❌ missing | Only 8 products (4 columns) are used                                                                  |
| `busy` shows the busy indicator                                                                         | —                                                     | ❌ missing |                                                                                                       |
| URL items default to `target="_blank"`, explicit target respected                                       | —                                                     | ❌ missing | Target also feeds the item's accessible label in the port                                             |
| `isOpen` model: default false, programmatic open; `isOpenChange` emits on changes, not on init          | opens a menu…; opens a product with Enter and closes… | 🟡 partial | Only user open/close via `aria-expanded`; programmatic `isOpen.set(true)` and the output are untested |
| `itemClicked` emits; item callback receives the click event; `selected` not mutated                     | opens a product with Enter and closes…                | 🟡 partial | Emission covered; callback argument untested                                                          |
| `productsChange` after a drop                                                                           | —                                                     | ❌ missing |                                                                                                       |
| URL navigation: `window.open(url, target)`; not with a callback; not without url                        | —                                                     | ❌ missing |                                                                                                       |
| Drag guard: click ending a drag does not open/emit; next click works                                    | —                                                     | ❌ missing |                                                                                                       |
| Opening focuses the first item                                                                          | opens a menu of products and focuses the first one    | ✅ covered |                                                                                                       |
| Enter and Space activate the item                                                                       | opens a product with Enter and closes…                | 🟡 partial | Space untested                                                                                        |
| Grid keys, 4 columns: Left/Right, wrap, Up/Down by 4                                                    | moves through the grid with the arrow keys            | ✅ covered |                                                                                                       |
| Grid keys, 3 columns: Up/Down by 3                                                                      | —                                                     | ❌ missing |                                                                                                       |
| List mode keys: Up/Down with wrap                                                                       | —                                                     | ❌ missing |                                                                                                       |
| `disabled` product switch cannot be opened                                                              | —                                                     | ❌ missing |                                                                                                       |
| Custom `fdProductSwitchButton` replaces the default grid button                                         | —                                                     | ❌ missing | Shown only in the "Busy and custom button" story                                                      |

Registry-only coverage: trigger `aria-haspopup="menu"`/`aria-expanded`, `aria-posinset`, focus returns to the trigger after choosing.

### Gaps to fill

- **Stories:** "URL navigation" — items with `url` and `target` `_blank`/`_self`.
- **Tests:** "renders a subtitle only when given and an anchor only for items with a url"; "lays out two, three or four columns by product count"; "ArrowDown/ArrowUp move by three columns with 3–6 products"; "forceListMode shows a list where ArrowDown/ArrowUp wrap"; "busy shows the busy indicator"; "url items open with window.open in \_blank by default or their target, not when a callback is set"; "a click that ends a drag does not open the product, the next click does"; "dropping an item emits the reordered products, sticky items keep their place"; "dragAndDropEnabled false or disabledDragAndDrop makes items not draggable"; "Space opens the focused product"; "setting isOpen opens the menu and isOpenChange is not emitted on init"; "the callback receives the click event"; "a disabled product switch does not open"; "a custom fdProductSwitchButton replaces the grid button".
- **Effort:** M, about 15 tests on an existing host plus two small stories.
