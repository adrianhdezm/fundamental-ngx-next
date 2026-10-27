## fixed-card-layout

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/fixed-card-layout) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/fixed-card-layout)
Registry: `registry/ui/fixed-card-layout/` — 6 stories, 14 tests.

### Stories vs. upstream examples

| Upstream example          | Registry story                                 | Status     | Notes                                      |
| ------------------------- | ---------------------------------------------- | ---------- | ------------------------------------------ |
| Default Fixed Card Layout | Default ("Responsive columns")                 | ✅ covered |                                            |
| Disabling drag and drop   | DisabledDragDrop                               | ✅ covered |                                            |
| Mobile display            | Mobile ("Mobile display")                      | ✅ covered | Default cards in a 22rem frame: one column |
| Custom card minimum width | CardMinimumWidth ("Custom card minimum width") | ✅ covered | `cardMinimumWidth` of 400px                |
| Custom columns width      | ColumnWidths ("Custom column widths")          | ✅ covered | `columnsWidthConfig`                       |
| Maximum number of columns | MaxColumns ("At most two columns")             | ✅ covered |                                            |

### Tests vs. upstream specs

| Upstream behaviour                  | Registry test                                                                | Status     | Notes                           |
| ----------------------------------- | ---------------------------------------------------------------------------- | ---------- | ------------------------------- |
| `should create`                     | —                                                                            | ➖ n/a     |                                 |
| Renders all cards                   | cards are placed row by row…                                                 | ✅ covered |                                 |
| Column count follows the width      | number of columns follows the width…                                         | ✅ covered | Includes card-count cap         |
| One column when `maxColumns` is set | number of columns follows the width…, capped by maxColumns…                  | ✅ covered |                                 |
| Drag and drop reorders and emits    | dragging a card onto another swaps their ranks and emits cardDraggedDropped… | ✅ covered | Plus two further drag scenarios |

Registry-only coverage: keyboard reordering (Alt+Arrows, RTL), arrow-key focus movement with wrap, Tab order, cards as labelled groups, container height re-measure, `columnsWidthConfig` distribution, `disableDragDrop` for pointer and keyboard, `layoutChange` output, `cardMinimumWidth` (fewer columns, never below 20rem).

### Gaps to fill

- **Tests:** none.
- **Effort:** S, two stories and one test.
