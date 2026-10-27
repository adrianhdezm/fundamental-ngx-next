## multi-combobox

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/multi-combobox) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/multi-combobox)
Registry: `registry/ui/multi-combobox/` — 15 stories, 8 tests.

### Stories vs. upstream examples

| Upstream example                | Registry story                         | Status     | Notes                                                                                                                                        |
| ------------------------------- | -------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| DataSource                      | DataSources, Playground                | ✅ covered | Strings, objects, observable, limitless                                                                                                      |
| Dynamic DataSource              | Dynamic data source                    | ✅ covered | Segmented button swaps `[dataSource]`; the first set arrives after 500 ms                                                                    |
| Multi-Combobox Mobile Mode      | Mobile, Open: mobile                   | ✅ covered | Approve/Cancel dialog                                                                                                                        |
| Multi-Combobox with Groups      | Layout, Open: groups                   | ✅ covered |                                                                                                                                              |
| Multi-Combobox with Two Columns | Layout, Open: two columns              | ✅ covered |                                                                                                                                              |
| Multi Combobox states           | States                                 | ✅ covered | 4 states + readonly + disabled                                                                                                               |
| Reactive Form                   | Forms                                  | ✅ covered |                                                                                                                                              |
| Loading                         | —                                      | ❌ missing | Upstream `dataRequested`/`dataReceived` outputs are not in our API; needs a decision (or a busy-indicator story around an observable source) |
| Reviewing tokens                | DataSources                            | ✅ covered | 15 tokens with "n more"                                                                                                                      |
| Custom Item Template            | Layout, Open: custom item template     | ✅ covered | Byline template                                                                                                                              |
| Multi Combobox Inside Dialog    | Inside a dialog, Open: inside a dialog | ✅ covered |                                                                                                                                              |

### Tests vs. upstream specs

| Upstream behaviour                                                             | Registry test                                           | Status     | Notes                                                                                              |
| ------------------------------------------------------------------------------ | ------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| should create (component, announcer)                                           | —                                                       | ➖ n/a     |                                                                                                    |
| Mobile: mobileConfig, open/close with approve and dismiss                      | —                                                       | ❌ missing |                                                                                                    |
| contentDensity compact                                                         | —                                                       | ➖ n/a     | Density is a global variant in our port                                                            |
| Addon button click expands/collapses the list                                  | —                                                       | ❌ missing | Tests open with Alt+ArrowDown only                                                                 |
| limitless lists all items (vs. mapLimit)                                       | —                                                       | ❌ missing |                                                                                                    |
| Secondary column                                                               | —                                                       | ❌ missing |                                                                                                    |
| dataSource items converted to option items                                     | —                                                       | ➖ n/a     | Internal model                                                                                     |
| Select and unselect an item                                                    | toggles options with the keyboard and the mouse         | ✅ covered |                                                                                                    |
| Deselecting all does not move focus to the search field                        | deselecting the last item keeps the focus in the dialog | ✅ covered | Only removing the last token moves the focus to the input (`fix(multi-combobox)`)                  |
| Select / unselect all                                                          | selects all with the select all option and Ctrl+A       | ✅ covered |                                                                                                    |
| openDropdownOnAddOnClicked=false                                               | —                                                       | ❌ missing |                                                                                                    |
| Auto-select on full match                                                      | chooses the item named by the text with Enter           | ✅ covered |                                                                                                    |
| Focus trap paused while open (inside a dialog)                                 | —                                                       | ❌ missing |                                                                                                    |
| Search after dataSource replacement (incl. empty, repeated)                    | —                                                       | ❌ missing |                                                                                                    |
| Programmatic `[selectedItems]` add / replace / clear, reopen state             | shows the chosen items as tokens                        | 🟡 partial | Covered through FormControl only; the `selectedItems` model and checked state after reopen are not |
| FormControl.setValue() renders tokens                                          | shows the chosen items as tokens                        | ✅ covered |                                                                                                    |
| Mobile draft: cancel restores selection, approve commits once, grouped objects | —                                                       | ❌ missing |                                                                                                    |
| Token removal deselects in the open menu                                       | —                                                       | ❌ missing |                                                                                                    |
| FormControl initial value renders once an async dataSource arrives             | shows the chosen items as tokens                        | 🟡 partial | Sync array only                                                                                    |

Open stories: "Open: select all", "Open: groups", "Open: two columns", "Open: custom item template", "Open: state message", "Open: inside a dialog" and "Open: mobile" open the list (or dialog) in `play`.

Registry-only coverage: word-start filtering, invalid-entry rejection with `aria-invalid`, `aria-activedescendant`, group `role=group` labelling, `selectionChange` count.

### Gaps to fill

- **Stories:** "Loading" once the loading API is decided (blocked: `dataRequested`/`dataReceived`).
- **Tests:** "the addon button opens and closes the list"; "openDropdownOnAddOnClicked=false keeps the list closed"; "limitless shows every item, otherwise mapLimit"; "shows secondary text in a second column"; "filters the new items after the dataSource is replaced (and handles an empty one)"; "selectedItems input adds, replaces and clears tokens and the checked options"; "renders the form value once an observable dataSource emits"; "removing a token unchecks it in the open list"; "deselect all keeps the focus where it was"; "mobile dialog approve commits once and cancel restores the selection"; "inside a dialog Escape closes the list but not the dialog".
- **Effort:** L — about 11 tests including mobile dialog and data-source swaps, plus five stories.
