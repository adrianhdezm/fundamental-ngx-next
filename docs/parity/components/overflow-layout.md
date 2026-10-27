## overflow-layout

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/overflow-layout) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/overflow-layout)
Registry: `registry/ui/overflow-layout/` — 7 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                | Registry story                                           | Status     | Notes                                                                                                                                                                                                                |
| ------------------------------- | -------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overflow Layout Standard Usage  | Resizable, "Open: more popover"                          | ✅ covered | Add/remove items, max 3 visible toggle, resizable container; the Open story opens the "N more" popover                                                                                                               |
| Forcing visibility of the items | Click to show, "Open: click to show"; Forced visibility… | ✅ covered | A hidden item clicked in the "More" popover gets `forceVisibility` and moves into the row                                                                                                                            |
| Overflow Layout Complex example | Avatar group, "Open: avatar group"                       | ✅ covered | Visible avatars open a business card popover; the custom "+N" control opens a popover of hidden avatars with a detail stage and Back. Photos and icons only: initials in a button fail `label-content-name-mismatch` |

### Tests vs. upstream specs

| Upstream behaviour                                | Registry test                                                       | Status     | Notes                                                                                                                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `should create`                                   | —                                                                   | ➖ n/a     |                                                                                                                                                                                       |
| Item container shows / hides its item             | shows as many items as fit…; forceVisibility keeps an item visible… | ✅ covered | Hidden items move to the popover with `hidden`/`globalIndex` context                                                                                                                  |
| Renders the configured amount (`maxVisibleItems`) | shows as many items as fit… (at most maxVisibleItems)               | ✅ covered |                                                                                                                                                                                       |
| Renders an automatic amount                       | shows as many items as fit…; visibleItemsCount / hiddenItemsCount…  | ✅ covered |                                                                                                                                                                                       |
| Reacts on items resize                            | triggerRecalculation re-measures after content changes              | 🟡 partial | Our test calls `triggerRecalculation()` manually; upstream expects item width changes to be picked up. Our ResizeObserver watches host and row only, so automatic reaction is unclear |
| Reacts on container resize                        | visibleItemsCount / hiddenItemsCount… after resizes                 | ✅ covered |                                                                                                                                                                                       |

Registry-only coverage: the "N more" popover dialog is named like its control (axe `aria-dialog-name`; upstream leaves it unnamed), `showMorePosition="left"`, `reverseHiddenItems`, custom expand template, `hiddenChange` per item, arrow-key roving focus (RTL aware), list/listitem roles and aria-label.

### Gaps to fill

- **Stories:** none.
- **Tests:** "re-measures automatically when an item grows wider without triggerRecalculation" (or document that it needs `triggerRecalculation`); "clicking a hidden item and forcing its visibility moves it out of the popover".
- **Effort:** M, the avatar-group story is the bulk; tests are small.
