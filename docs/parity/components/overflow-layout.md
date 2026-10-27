## overflow-layout

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/overflow-layout) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/overflow-layout)
Registry: `registry/ui/overflow-layout/` — 2 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                | Registry story                                      | Status     | Notes                                                                                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overflow Layout Standard Usage  | Resizable                                           | ✅ covered | Add/remove items, max 3 visible toggle, resizable container. No "Open: …" story opens the "N more" popover                                                                                                              |
| Forcing visibility of the items | Forced visibility, start position and custom "more" | 🟡 partial | Ours forces one fixed item; upstream lets you click a hidden item in the "More" popover to force it into the visible row                                                                                                |
| Overflow Layout Complex example | Forced visibility… (custom `fdOverflowExpand` "+N") | 🟡 partial | Upstream is an avatar group: each visible avatar opens a quick-view popover, the custom "+N" button opens a popover listing hidden avatars with a detail stage. Ours only shows a custom "+N" button that opens nothing |

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

- **Stories:** "Click to show" — clicking a hidden item in the "More" popover toggles its `forceVisibility`; "Avatar group" — avatars as items, custom "+N" expand opening a popover of hidden avatars (reuse avatar + popover); "Open: more popover" — `play` clicks the "N more" button.
- **Tests:** "re-measures automatically when an item grows wider without triggerRecalculation" (or document that it needs `triggerRecalculation`); "clicking a hidden item and forcing its visibility moves it out of the popover".
- **Effort:** M, the avatar-group story is the bulk; tests are small.
