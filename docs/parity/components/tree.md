## tree

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/tree) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/tree)
Registry: `registry/ui/tree/` — 5 stories, 8 tests.

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

| Upstream behaviour                                      | Registry test                                                           | Status     | Notes                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `should create` (tree, tree item, data source)          | —                                                                       | ➖ n/a     |                                                                              |
| Tree item appropriate classes                           | —                                                                       | ➖ n/a     | Class only                                                                   |
| Renders without border (`noBorder`)                     | —                                                                       | ❌ missing | Input exists; no visual check                                                |
| Renders icon and text from projected directives         | is a tree of items with levels …                                        | 🟡 partial | Text covered; the icon slot is never asserted                                |
| Creates nested level when expanded                      | expands with the expander and indents the children                      | ✅ covered |                                                                              |
| Enables selection, marks selected value                 | selects one item as a form value; selects several items with checkboxes | ✅ covered |                                                                              |
| Renders data source items                               | renders data items and loads children when they expand                  | ✅ covered |                                                                              |
| Loading skeleton (5 rows) shown, then hidden            | shows loading rows until lazy children arrive                           | ✅ covered |                                                                              |
| TreeService expanded-level tracking (add/remove levels) | expands with the expander and indents the children                      | 🟡 partial | Only level-1 expansion indent checked; deeper levels and collapsing back not |

Registry-only coverage: roles and aria-level/setsize/posinset, roving tab stop with Up/Down/Left/Right/Home/End, Enter on a navigatable item, "No data" text, multi-select with Space, aria-multiselectable.

### Gaps to fill

- **Tests:** "noBorder removes the item borders"; "renders the projected icon"; "indentation follows the deepest expanded level and shrinks when it collapses"; "state shows the highlight indicator"; "navigationIndicator shows the arrow on navigatable items"; "afterExpand and right selection placements"; "independentSections drops the leaf indentation"; "arrow keys are mirrored in RTL"; "action buttons are reachable from the item without leaving the single tab stop".
- **Effort:** M, one story and about nine tests, mostly visual/ARIA checks.
