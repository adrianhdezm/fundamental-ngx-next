## timeline

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/timeline) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/timeline)
Registry: `registry/ui/timeline/` — 7 stories, 10 tests.

### Stories vs. upstream examples

| Upstream example              | Registry story                | Status     | Notes                                                    |
| ----------------------------- | ----------------------------- | ---------- | -------------------------------------------------------- |
| Timeline basic example        | `Vertical`, `VerticalLeft`    | ✅ covered | Right and left layouts, glyphs and dots, collapsed text. |
| Horizontal axis               | `Horizontal`, `HorizontalTop` | ✅ covered |                                                          |
| Horizontal double side layout | `HorizontalDouble`            | ✅ covered |                                                          |
| Vertical double side layout   | `VerticalDouble`              | ✅ covered |                                                          |
| Timeline loading example      | `Loading`                     | ✅ covered |                                                          |

### Tests vs. upstream specs

| Upstream behaviour                                              | Registry test                                                                                                 | Status     | Notes                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------- |
| should create (timeline, node, body, directives)                | —                                                                                                             | ➖ n/a     |                                                                |
| Node body collapses extra lines                                 | lines update when a post resizes (e.g. More/Less in the body)                                                 | ✅ covered |                                                                |
| Positions recalculated on expand/collapse                       | lines update when a post resizes…                                                                             | ✅ covered | Also on timeline resize.                                       |
| Node shows its icon                                             | renders nodes from the data source…                                                                           | ✅ covered | Glyph vs dot per node.                                         |
| Header info title/subtitle/text classes                         | —                                                                                                             | ➖ n/a     | Class-only directives.                                         |
| Position control service: strategy, register/remove nodes       | —                                                                                                             | ➖ n/a     | Internal; the outcome is covered by the layout and line tests. |
| Nodes from dataSource                                           | renders nodes from the data source with the node template…                                                    | ✅ covered |                                                                |
| Re-render without trackBy / cache nodes with trackBy            | with trackBy, replacing the data keeps the DOM nodes …; without trackBy, new data objects re-render the nodes | ✅ covered | Also appending an item extends the previous line.              |
| Horizontal axis                                                 | layout left/right/top/bottom puts all nodes on one side…                                                      | ✅ covered |                                                                |
| Double side layout                                              | layout left/right/top/bottom…; double vertical layout spaces alternating nodes…                               | ✅ covered |                                                                |
| Loading skeleton shown with null data, hidden when data arrives | without data shows three loading placeholders and aria-busy                                                   | ✅ covered |                                                                |

Registry-only coverage: connecting-line geometry, double vertical spacing, list/listitem roles, post arrows in LTR and RTL, aria-busy.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, two or three specs on the existing host.
