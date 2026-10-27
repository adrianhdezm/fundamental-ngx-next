## scrollbar

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/scrollbar) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/scrollbar)
Registry: `registry/ui/scrollbar/` — 2 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                    | Registry story                         | Status     | Notes |
| ----------------------------------- | -------------------------------------- | ---------- | ----- |
| Scrollbar                           | `Directions` (first box), `Playground` | ✅ covered |       |
| Scrollbar without horizontal scroll | `Directions` ("Vertical only")         | ✅ covered |       |
| Scrollbar without vertical scroll   | `Directions` ("Horizontal only")       | ✅ covered |       |

### Tests vs. upstream specs

| Upstream behaviour                           | Registry test                                                 | Status     | Notes                                                |
| -------------------------------------------- | ------------------------------------------------------------- | ---------- | ---------------------------------------------------- |
| Should create                                | —                                                             | ➖ n/a     |                                                      |
| Assigns the fd-scrollbar class               | applies the SAP scrollbar colors                              | ✅ covered | Checks the themed outcome instead of the class name. |
| noHorizontalScroll hides horizontal overflow | noHorizontalScroll hides the horizontal overflow              | ✅ covered |                                                      |
| noVerticalScroll hides vertical overflow     | noVerticalScroll hides the vertical overflow                  | ✅ covered |                                                      |
| alwaysVisible shows both scrollbars          | alwaysVisible shows the scrollbars even when the content fits | ✅ covered |                                                      |

Registry-only coverage: CdkScrollable registration with the scroll dispatcher, default auto overflow, `scroll()`.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S — nothing to do.
