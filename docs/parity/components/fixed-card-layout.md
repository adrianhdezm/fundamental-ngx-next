## fixed-card-layout

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/fixed-card-layout) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/fixed-card-layout)
Registry: `registry/ui/fixed-card-layout/` — 4 stories, 13 tests.

### Stories vs. upstream examples

| Upstream example          | Registry story                        | Status     | Notes                                                                    |
| ------------------------- | ------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| Default Fixed Card Layout | Default ("Responsive columns")        | ✅ covered |                                                                          |
| Disabling drag and drop   | DisabledDragDrop                      | ✅ covered |                                                                          |
| Mobile display            | —                                     | ❌ missing | Upstream renders the layout in a narrow (mobile-width) frame: one column |
| Custom card minimum width | —                                     | ❌ missing | `cardMinimumWidth` input exists, no story                                |
| Custom columns width      | ColumnWidths ("Custom column widths") | ✅ covered | `columnsWidthConfig`                                                     |
| Maximum number of columns | MaxColumns ("At most two columns")    | ✅ covered |                                                                          |

### Tests vs. upstream specs

| Upstream behaviour                  | Registry test                                                                | Status     | Notes                           |
| ----------------------------------- | ---------------------------------------------------------------------------- | ---------- | ------------------------------- |
| `should create`                     | —                                                                            | ➖ n/a     |                                 |
| Renders all cards                   | cards are placed row by row…                                                 | ✅ covered |                                 |
| Column count follows the width      | number of columns follows the width…                                         | ✅ covered | Includes card-count cap         |
| One column when `maxColumns` is set | number of columns follows the width…, capped by maxColumns…                  | ✅ covered |                                 |
| Drag and drop reorders and emits    | dragging a card onto another swaps their ranks and emits cardDraggedDropped… | ✅ covered | Plus two further drag scenarios |

Registry-only coverage: keyboard reordering (Alt+Arrows, RTL), arrow-key focus movement with wrap, Tab order, cards as labelled groups, container height re-measure, `columnsWidthConfig` distribution, `disableDragDrop` for pointer and keyboard, `layoutChange` output.

### Gaps to fill

- **Stories:** "Mobile" — the default cards in a 22rem frame (single column); "Custom card minimum width" — `cardMinimumWidth` of e.g. 400 px so fewer columns fit.
- **Tests:** "a larger cardMinimumWidth reduces the number of columns (never below 20rem)".
- **Effort:** S, two stories and one test.
