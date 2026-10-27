## breadcrumb

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/breadcrumb) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/breadcrumb)
Registry: `registry/ui/breadcrumb/` — 4 stories, 8 tests.

### Stories vs. upstream examples

| Upstream example            | Registry story                                        | Status     | Notes                                                                                                   |
| --------------------------- | ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| An example using routerLink | —                                                     | 🟡 partial | Our stories only use `href`; no story shows `routerLink` links (needs `provideRouter` in the decorator) |
| An example using href       | Default ("Breadcrumb")                                | ✅ covered | Also shows a home icon, the current page and a click-only link                                          |
| Custom Separator Style      | Separators ("Separator styles")                       | ✅ covered | All five styles                                                                                         |
| (collapsed items menu)      | Overflow ("Collapsed items"), "Open: collapsed items" | ✅ covered | Not an upstream section; the Open story opens the collapsed-items menu for the a11y run                 |

### Tests vs. upstream specs

| Upstream behaviour                                                  | Registry test                                                                       | Status     | Notes               |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------- | ------------------- |
| Separator styles (default, five custom ones, input change)          | renders the separator of each separatorStyle and updates when it changes            | ✅ covered |                     |
| Resize: shrinking collapses items, enlarging restores them          | collapses items that do not fit…; restores collapsed items when the container grows | ✅ covered |                     |
| ArrowRight / ArrowLeft move between links                           | has one tab stop and moves between the links …                                      | ✅ covered | Roving tabindex too |
| `aria-current` span in the focus sequence; last link ↔ current page | moves from the last link to the current page and back, and stops at the first link  | ✅ covered |                     |
| No move before the first link on ArrowLeft                          | moves from the last link to the current page and back, and stops at the first link  | ✅ covered |                     |
| ArrowDown / ArrowUp move next / previous                            | moves next with ArrowDown and back with ArrowUp                                     | ✅ covered |                     |
| `should create`                                                     | —                                                                                   | ➖ n/a     |                     |

Registry-only coverage: arrow keys mirrored in RTL, `role=navigation` with label and list semantics, no separator after the current page, collapsed-items menu (`aria-haspopup=menu`) whose items follow their links, `hiddenItemsCount` output.

### Gaps to fill

- **Stories:** "Router links" (trail with `routerLink` items, `provideRouter([])` in the decorator) — blocked: router in stories (README "Not yet ported").
- **Tests:** none.
- **Effort:** S, short keyboard and layout tests and two stories.
