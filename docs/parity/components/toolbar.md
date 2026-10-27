## toolbar

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/toolbar) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/toolbar)
Registry: `registry/ui/toolbar/` — 8 stories, 12 tests.

### Stories vs. upstream examples

| Upstream example          | Registry story                                                                   | Status     | Notes                                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Toolbar Types             | Types                                                                            | ✅ covered | solid, auto, transparent + clearBorder, info, info active                                                                                                               |
| Toolbar Title             | Title variants, TitleSpacerSeparator, Playground                                 | ✅ covered | `title` input, `title` with `headingLevel`, and a projected `h4 fdTitle` with an icon                                                                                   |
| Toolbar Overflow          | Overflow with overlays, "Open: overflow with overlays"; Overflow (third toolbar) | ✅ covered | Date picker, select, checkbox, split button with menu, label and input, menu button, segmented button and a fixed spacer; the Open story opens the popover holding them |
| Toolbar Overflow Priority | Overflow (first toolbar), "Open: overflow"                                       | ✅ covered | always/never/low/high/disappear; the Open story opens the overflow popover of this toolbar                                                                              |
| Toolbar Overflow Grouping | Overflow (second toolbar)                                                        | ✅ covered |                                                                                                                                                                         |
| Toolbar Spacer            | TitleSpacerSeparator                                                             | ✅ covered | Flexible and fixed width                                                                                                                                                |
| Toolbar Separator         | TitleSpacerSeparator                                                             | ✅ covered |                                                                                                                                                                         |

### Tests vs. upstream specs

| Upstream behaviour                                                                                              | Registry test                                                                               | Status     | Notes                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `should create`                                                                                                 | —                                                                                           | ➖ n/a     |                                                                                                                          |
| Overflows items that do not fit                                                                                 | shouldOverflow moves items that do not fit into the overflow popover, by priority and group | ✅ covered |                                                                                                                          |
| Prioritization                                                                                                  | shouldOverflow …; toolbarOverflow keeps the items that fit, highest priority first          | ✅ covered |                                                                                                                          |
| Prioritization and grouping                                                                                     | shouldOverflow …; overflows a group as a whole, but not its never members                   | ✅ covered |                                                                                                                          |
| Visibility detection: recalculates when the toolbar becomes visible, not while hidden or without shouldOverflow | —                                                                                           | 🟡 partial | ResizeObserver path covered by width changes; hidden → visible not tested                                                |
| Title accessibility: tooltip `title`, accessible name, truncation, updates on change                            | spacer, separator, label; title renders a heading                                           | ✅ covered | We label via `aria-labelledby` + role heading instead of aria-label; title truncation not asserted (label truncation is) |
| Title element resize observation                                                                                | —                                                                                           | ❌ missing | Our source observes the title element; no test that a wider title pushes more items to overflow                          |

Registry-only coverage: the overflow popover dialog is named like the More button (axe `aria-dialog-name`), `always` and `forceOverflow`, restoring overflown items in order, focus on the first popover item, info/active toolbar Enter/Space click, role/orientation/labelling, compact height, pure `toolbarOverflow` unit tests.

### Gaps to fill

- **Stories:** none.
- **Tests:** "recomputes the overflow when a hidden toolbar becomes visible"; "a longer title moves more items into the overflow"; "the title truncates with an ellipsis and keeps the full text in title"; "overflown select and menu buttons still open their overlays from the popover".
- **Effort:** M, the overlay-in-overflow story and test need several components wired.
