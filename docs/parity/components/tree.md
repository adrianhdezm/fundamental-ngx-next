## tree

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/tree) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/tree)
Registry: `registry/ui/tree/` — 5 stories, 17 tests.

### Stories vs. upstream examples

| Upstream example         | Registry story                                | Status     | Notes                                                                                                                                                                                             |
| ------------------------ | --------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default tree             | Basic, Customization                          | ✅ covered | Declarative, data source, no border, no data; Customization shows `backgroundColor`, `customStyles` (theme tokens instead of upstream's hex colour), a user class and avatar-rich wrapped content |
| Navigatable tree items   | States ("Navigation, highlights and buttons") | ✅ covered | `navigationIndicator`, `treeItemClick`                                                                                                                                                            |
| Highlight indicators     | States                                        | ✅ covered | success/warning/error/default states                                                                                                                                                              |
| Tree item action buttons | States                                        | ✅ covered | Edit/remove buttons                                                                                                                                                                               |
| Selectable tree items    | Selection                                     | ✅ covered | Single/multiple, placement switch, independent sections, ngModel                                                                                                                                  |
| Lazy loading tree items  | LazyLoading ("Lazy loading")                  | ✅ covered |                                                                                                                                                                                                   |

### Tests vs. upstream specs

| Upstream behaviour                                      | Registry test                                                                                                                | Status     | Notes                                        |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------- |
| `should create` (tree, tree item, data source)          | —                                                                                                                            | ➖ n/a     |                                              |
| Tree item appropriate classes                           | —                                                                                                                            | ➖ n/a     | Class only                                   |
| Renders without border (`noBorder`)                     | removes the borders of the top level items with noBorder                                                                     | ✅ covered | Computed border colour                       |
| Renders icon and text from projected directives         | is a tree of items with levels …; renders the projected icon before the text                                                 | ✅ covered |                                              |
| Creates nested level when expanded                      | expands with the expander and indents the children                                                                           | ✅ covered |                                              |
| Enables selection, marks selected value                 | selects one item as a form value; selects several items with checkboxes                                                      | ✅ covered |                                              |
| Renders data source items                               | renders data items and loads children when they expand                                                                       | ✅ covered |                                              |
| Loading skeleton (5 rows) shown, then hidden            | shows loading rows until lazy children arrive                                                                                | ✅ covered |                                              |
| TreeService expanded-level tracking (add/remove levels) | expands with the expander and indents the children; indents by the deepest expanded level and shrinks back when it collapses | ✅ covered | Levels 1 and 2 expanded, and collapsing back |

Registry-only coverage: roles and aria-level/setsize/posinset, roving tab stop with Up/Down/Left/Right/Home/End, Enter on a navigatable item, "No data" text, multi-select with Space, aria-multiselectable, highlight states, the navigation indicator, `afterExpand`/`right` selection placements, `independentSections`, RTL arrow keys, action buttons reachable with Tab while one item stays in the tab order.

### Gaps to fill

- None.
