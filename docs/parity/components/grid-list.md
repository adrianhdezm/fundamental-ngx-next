## grid-list

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/grid-list) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/grid-list)
Registry: `registry/ui/grid-list/` — 5 stories, 6 tests.

### Stories vs. upstream examples

| Upstream example               | Registry story   | Status     | Notes                                                                                                                                                                         |
| ------------------------------ | ---------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modes                          | `SelectionModes` | ✅ covered | Mode switcher (none, delete, single left/right, multi) and all item types.                                                                                                    |
| Group                          | `States`         | 🟡 partial | Group headers only appear as state separators in `States`; no grouped list with a "Grouped by" filter bar as upstream.                                                        |
| States                         | `States`         | ✅ covered | unread/error/locked/draft, custom footer bar and toolbar text.                                                                                                                |
| Status                         | `Statuses`       | ✅ covered |                                                                                                                                                                               |
| More button                    | `More`           | ✅ covered |                                                                                                                                                                               |
| Footer                         | `More`           | ✅ covered | Combined with filter bar and more button.                                                                                                                                     |
| Drag and Drop                  | —                | ❌ missing | Upstream uses `fd-dnd-list`/`fd-dnd-item` from core utils; the registry has no DnD helper, so this would need CDK drag-drop composed in the story (or a decision to drop it). |
| Layout                         | `Layout`         | ✅ covered | layoutPattern, layoutItemPattern, fixed width.                                                                                                                                |
| Focusing Item Programmatically | —                | ❌ missing | `GridListItem.focus()` exists but no story uses it ("Focus first/last" buttons).                                                                                              |
| Heading Level                  | —                | ❌ missing | `headingLevel` on title bar and group header exists, never shown.                                                                                                             |
| Auto Height                    | `Layout`         | ✅ covered | `autoHeight` item next to a row-height item.                                                                                                                                  |

### Tests vs. upstream specs

| Upstream behaviour                                                                                                              | Registry test                                                      | Status     | Notes                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| Should create (list, item, title bar, filter bar, footer, more button, toolbars, group header)                                  | —                                                                  | ➖ n/a     |                                                                                                 |
| Item renders states and statuses (toolbar only on the state item, status shown)                                                 | —                                                                  | ❌ missing | No assertion on state toolbars, status highlight or its screen-reader label.                    |
| Item emits detail / draft / locked when their buttons are clicked                                                               | —                                                                  | ❌ missing | Outputs exist (`detail`, `draft`, `locked`).                                                    |
| Title bar: role="heading" with aria-level (default 2, explicit, updated), title in a span, projected content inside the heading | —                                                                  | ❌ missing | Group header `headingLevel` is likewise untested.                                               |
| Title bar: string heading level normalisation ("h4", "3", invalid → 2)                                                          | —                                                                  | ➖ n/a     | Our `headingLevel` is a plain number input; string normalisation was dropped.                   |
| Navigation item: counter and navigation indicator in toolbar, navigate emitted on click                                         | —                                                                  | ❌ missing |                                                                                                 |
| Delete mode: every item has a delete button that emits delete                                                                   | —                                                                  | ❌ missing |                                                                                                 |
| Single select: radio on every item, selection emitted                                                                           | keeps at most one selected item when switching to single selection | 🟡 partial | Selection outcome tested; radio presence and selecting by clicking the radio are not.           |
| Multi select: checkbox on every item, select / unselect emit selectionChange                                                    | selects with Space and ranges with Shift+click in multi selection  | ✅ covered |                                                                                                 |
| Keyboard: arrow keys move focus                                                                                                 | keeps a single tab stop and moves focus with the arrow keys by row | ✅ covered | Also Home/End.                                                                                  |
| Keyboard: Shift+Arrow and Shift+End extend the selection                                                                        | —                                                                  | ❌ missing | Shift+click range is tested, keyboard ranges are not (documented in our component description). |

Registry-only coverage: grid vs. list roles and aria-selected, roving tabindex, Enter/Escape into and out of an item, press on Space without selection, mode switch to single keeps one selection.

### Gaps to fill

- **Stories:** `Group` — two company groups with group headers and a "Grouped by" filter bar; `FocusProgrammatically` — title bar buttons "Focus first"/"Focus last" calling `item.focus()`; `HeadingLevel` — title bar with `headingLevel=3`; `DragAndDrop` — only if CDK drag-drop composition is wanted, otherwise record as dropped.
- **Tests:** "the title bar is a heading with aria-level from headingLevel (default 2) and contains the projected content"; "group header uses its headingLevel"; "state items show their toolbar and statuses expose a status label"; "detail, draft and locked buttons emit their outputs"; "navigation items show the counter and indicator and emit navigate on click"; "delete mode shows a delete button per item that emits delete"; "single select shows a radio per item and selects on click"; "Shift+Arrow and Shift+End extend the selection in multi select".
- **Effort:** M, eight focused tests on an existing host plus three simple stories.
