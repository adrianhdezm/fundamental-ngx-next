## side-navigation

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/side-navigation) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/side-navigation)
Registry: `registry/ui/side-navigation/` — 7 stories, 6 tests.

### Stories vs. upstream examples

| Upstream example                                                   | Registry story                                                              | Status     | Notes                                                                                                                                        |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Side Navigation                                                    | `Default`                                                                   | 🟡 partial | Group headers, main and utility lists, a selected link; upstream's basic example is `textOnly` (no icons), which no story shows.             |
| Side Navigation With Multiple Levels and Selected Option           | `Default`                                                                   | ✅ covered | Expandable "Settings" with child rows; selection highlights the parent.                                                                      |
| Side Navigation with Programmatically State Change                 | `NotSelectable` ("Not selectable")                                          | 🟡 partial | `selectable=false` with `[selected]` inputs, but no external Open/Close and Select/Unselect buttons driving `[(expanded)]` and `[selected]`. |
| Side Navigation with Icons                                         | `Default`                                                                   | ✅ covered |                                                                                                                                              |
| Side Navigation Condensed Mode                                     | `Condensed`, `OpenCondensed` ("Open: condensed popover")                    | ✅ covered | The Open story opens a child list in its popover in `play`, so axe checks it.                                                                |
| Side Navigation Generated from Configuration Object                | `FromData` ("From data")                                                    | ✅ covered |                                                                                                                                              |
| Side Navigation Condensed Mode Generated from Configuration Object | `FromDataCondensed`, `OpenFromDataCondensed` ("Open: from data, condensed") | ✅ covered |                                                                                                                                              |

### Tests vs. upstream specs

| Upstream behaviour                                   | Registry test                                                                | Status     | Notes                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- | ---------- | ------------------------------------- |
| Should create (main, utility directives)             | —                                                                            | ➖ n/a     |                                       |
| Keyboard navigation skips items of collapsed lists   | expands with the button and the arrow keys and moves across all visible rows | ✅ covered |                                       |
| Keyboard navigation includes items of expanded lists | expands with the button and the arrow keys …                                 | ✅ covered | Also Home/End and ArrowLeft collapse. |

Registry-only coverage: tree roles/levels described by group headers, selection with parent highlight, `selectable=false` keeping `[selected]`, condensed popovers, building from `sideNavigationConfiguration`.

### Gaps to fill

- **Stories:** `Text only` (`textOnly` lists with headers, as upstream's basic example); `Programmatic` (buttons toggling `[(expanded)]` and `[selected]` from outside).
- **Tests:** "arrow keys to expand and collapse are mirrored in RTL"; "changing [expanded] from outside opens and closes the child list and updates aria-expanded"; "changing [selected] from outside moves the selection when not selectable"; "keyboard navigation moves from the main list into the utility list".
- **Effort:** S — three stories on the existing story component and four small tests.
