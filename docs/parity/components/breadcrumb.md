## breadcrumb

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/breadcrumb) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/breadcrumb)
Registry: `registry/ui/breadcrumb/` — 3 stories, 3 tests.

### Stories vs. upstream examples

| Upstream example            | Registry story                  | Status     | Notes                                                                                                   |
| --------------------------- | ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| An example using routerLink | —                               | 🟡 partial | Our stories only use `href`; no story shows `routerLink` links (needs `provideRouter` in the decorator) |
| An example using href       | Default ("Breadcrumb")          | ✅ covered | Also shows a home icon, the current page and a click-only link                                          |
| Custom Separator Style      | Separators ("Separator styles") | ✅ covered | All five styles                                                                                         |
| (collapsed items menu)      | Overflow ("Collapsed items")    | ✅ covered | Not an upstream section; no "Open: …" story opens the collapsed-items menu                              |

### Tests vs. upstream specs

| Upstream behaviour                                                  | Registry test                                   | Status     | Notes                                                              |
| ------------------------------------------------------------------- | ----------------------------------------------- | ---------- | ------------------------------------------------------------------ |
| Separator styles (default, five custom ones, input change)          | is a labelled navigation list with separators … | 🟡 partial | Only the default `/` is asserted                                   |
| Resize: shrinking collapses items, enlarging restores them          | collapses items that do not fit into a menu …   | 🟡 partial | Collapse at a fixed narrow width covered; growing back is untested |
| ArrowRight / ArrowLeft move between links                           | has one tab stop and moves between the links …  | ✅ covered | Roving tabindex too                                                |
| `aria-current` span in the focus sequence; last link ↔ current page | has one tab stop …                              | 🟡 partial | Its `tabindex=-1` is asserted, but no test arrows onto or off it   |
| No move before the first link on ArrowLeft                          | —                                               | ❌ missing |                                                                    |
| ArrowDown / ArrowUp move next / previous                            | —                                               | ❌ missing | Handled in our source                                              |
| `should create`                                                     | —                                               | ➖ n/a     |                                                                    |

Registry-only coverage: `role=navigation` with label and list semantics, no separator after the current page, collapsed-items menu (`aria-haspopup=menu`) whose items follow their links, `hiddenItemsCount` output.

### Gaps to fill

- **Stories:** "Router links" (trail with `routerLink` items, `provideRouter([])` in the decorator); "Open: collapsed items" (narrow trail whose `play` clicks the "More" button).
- **Tests:** "renders the separator of each separatorStyle and updates when it changes"; "restores collapsed items when the container grows"; "ArrowRight from the last link focuses the current page and ArrowLeft returns"; "ArrowLeft on the first link keeps the focus"; "ArrowDown and ArrowUp move like ArrowRight and ArrowLeft"; "arrow keys are mirrored in RTL" (registry-only behaviour, untested).
- **Effort:** S, short keyboard and layout tests and two stories.
