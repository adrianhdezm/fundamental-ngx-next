## panel

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/panel) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/panel)
Registry: `registry/ui/panel/` — 3 stories, 5 tests.

### Stories vs. upstream examples

| Upstream example           | Registry story                                      | Status     | Notes                                                                                                                                                  |
| -------------------------- | --------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Expandable Panel           | Expandable                                          | ✅ covered | Two-way `expanded`, aria label/labelledby, a collapsed second panel                                                                                    |
| Fixed Panel                | Fixed, header actions, fixed height and transparent | ✅ covered |                                                                                                                                                        |
| Fixed Height Content Panel | Fixed, header actions… ("Fixed height content")     | ✅ covered | `height="5rem"`, scrollable content                                                                                                                    |
| Customizable Panel         | Customizable (transparent, no radius, no padding)   | ✅ covered | `transparent noRadius` panel with an "Add account" action and `noPadding` content holding a list with avatars, plus a panel with `transparent` content |

### Tests vs. upstream specs

| Upstream behaviour                                   | Registry test                                                  | Status     | Notes                                                                   |
| ---------------------------------------------------- | -------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `should create` (panel, title, content)              | —                                                              | ➖ n/a     |                                                                         |
| Host classes on panel, title, content                | —                                                              | ➖ n/a     | Class only                                                              |
| Additional user classes are merged                   | —                                                              | ❌ missing | `class` input on panel/content is not asserted                          |
| Content `height` sets the container height           | —                                                              | ❌ missing | `height`/`minHeight`/`maxHeight` inputs untested                        |
| Title wraps by default, no wrap when `wrap` is false | —                                                              | ❌ missing | `wrap` input exists; visual outcome (white-space / truncation) untested |
| Content hidden while collapsed                       | expand button toggles [(expanded)] and controls the content…   | ✅ covered |                                                                         |
| Fixed panel always shows content                     | fixed panels have no expand button and always show the content | ✅ covered |                                                                         |
| Expand button click expands                          | expand button toggles [(expanded)]…                            | ✅ covered | Also checks `aria-controls` / `aria-expanded`                           |

Registry-only coverage: title labels the expand button and content region, header/content corner radii follow expanded, compact density sizes.

### Gaps to fill

- **Stories:** none.
- **Tests:** "content height, minHeight and maxHeight size the content and make it scroll"; "title wraps long text by default and truncates when wrap is false"; "noPadding and transparent content remove padding and background"; "class input is merged into the panel classes".
- **Effort:** S, small layout assertions and one story.
