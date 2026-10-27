## combobox

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/combobox) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/combobox)
Registry: `registry/ui/combobox/` — 13 stories, 26 tests.

### Stories vs. upstream examples

| Upstream example                     | Registry story                                           | Status     | Notes                                                                     |
| ------------------------------------ | -------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| Standard Combobox                    | Standard                                                 | ✅ covered | Width/maxHeight, no highlighting, no autocomplete, compact, read-only     |
| Combobox as Search Field             | Search ("Search and clear")                              | ✅ covered | `isSearch`, clear button, full dropdown width                             |
| Custom Filter                        | Behaviour ("Custom filter, open state and async values") | ✅ covered | `filterFn` with a case-sensitive startsWith                               |
| Custom Search Function               | Search ("Search and clear")                              | ✅ covered | `searchFn` counts searches                                                |
| Combobox Mobile Mode                 | Mobile, Open: mobile dialog                              | ✅ covered | Confirmation and immediate modes; global mobile config dropped (no token) |
| Display Object Property              | Templates, Forms                                         | ✅ covered | `displayFn` on product objects                                            |
| Open State Control                   | Behaviour                                                | ✅ covered | Logs `openChange` below the field instead of an alert                     |
| Observable Async Example             | Behaviour                                                | ✅ covered | `[dropdownValues]="values$ \| async"`                                     |
| Custom Item Template                 | Templates ("Templates, bylines and groups")              | ✅ covered | `*fdComboboxItem` with icons, `itemClicked`                               |
| Combobox with Two Columns            | Templates                                                | ✅ covered | `fdListTitle` + `fdListSecondary`                                         |
| Combobox with Groups                 | Templates                                                | ✅ covered | `groupFn`                                                                 |
| Custom Height Example                | Standard                                                 | ✅ covered | `maxHeight="250px"`                                                       |
| Return results including search term | Standard                                                 | ✅ covered | `includes` variant                                                        |
| Reactive Form                        | Forms                                                    | ✅ covered | communicateByObject, required, list message, touched/dirty                |
| Reactive Form with Value Property    | Forms                                                    | ✅ covered | `valueProperty="id"`                                                      |
| Disabled Combobox                    | Forms                                                    | ✅ covered | Disabled form control                                                     |
| Combobox with byline list            | Templates                                                | ✅ covered | `byline` + thumbnail template                                             |
| Combobox inside a Dialog             | Inside a dialog, Open: inside a dialog                   | ✅ covered | Escape closes only the list (`fix(combobox)`)                             |

### Tests vs. upstream specs

| Upstream behaviour                                                                                                                                      | Registry test                                                                                          | Status     | Notes                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------ |
| Mobile wrapper: config from input, open/close with approve and dismiss                                                                                  | mobile: Approve commits…; immediate mode…                                                              | ✅ covered |                                                                                |
| `searchFn` called on Enter                                                                                                                              | calls searchFn on Enter and on the button                                                              | ✅ covered |                                                                                |
| writeValue sets/syncs the input text, reset displayed values                                                                                            | steps through the values…; communicates by object…                                                     | ✅ covered | setValue and initial object value reflected in the input                       |
| registerOnChange / registerOnTouched                                                                                                                    | various; marks the control touched on blur                                                             | ✅ covered |                                                                                |
| Typing in dropdown mode updates the control (matching and non-matching, shellbar "user edits")                                                          | completes the text inline…; communicates by object…                                                    | ✅ covered |                                                                                |
| Filtering on search-term change                                                                                                                         | is a combobox input that filters…                                                                      | ✅ covered | Also checks bold highlight                                                     |
| Primary button opens and resets the full list                                                                                                           | opens the full list with the button…                                                                   | ✅ covered |                                                                                |
| Arrow navigation (previous/next, nothing chosen) and Alt+Down opens                                                                                     | highlights items with the arrow keys…; steps through…                                                  | ✅ covered | Includes aria-activedescendant                                                 |
| Search-field mode: search addon, two buttons when there is text                                                                                         | search field shows a search addon and a clear button…                                                  | ✅ covered |                                                                                |
| Select from focus without closing (`closeOnSelect=false`)                                                                                               | keeps the list open on select when closeOnSelect is false                                              | ✅ covered | Click on an option; our focus stays in the input                               |
| Shellbar extra classes                                                                                                                                  | —                                                                                                      | ➖ n/a     | Class-only                                                                     |
| communicateByObject propagation edge cases (clear → null, exact match → object, duplicate labels, no duplicate emissions, clear via search field)       | communicates by object…; communicateByObject: clearing emits null, duplicate labels…                   | ✅ covered |                                                                                |
| valueProperty (extract, writeValue lookup, no match, null, ignored without communicateByObject)                                                         | communicates by object…; valueProperty: an unmatched written value…; valueProperty is ignored…         | ✅ covered |                                                                                |
| Focus-trap pause when open changes                                                                                                                      | —                                                                                                      | ➖ n/a     | Our popover uses `focusTrapped=false`                                          |
| Outside click / Tab-out parity (revert invalid text, `tabOutStrategy` close vs closeAndSelect, commit autocomplete candidate, re-focus does not revert) | leaving the field: Tab reverts…; tabOutStrategy close…; Tab commits…; duplicate label…; outside click… | ✅ covered | Revert to the last choice ported in `fix(combobox)`; text mode keeps free text |
| autoComplete=false free text with communicateByObject is not reverted on close/Tab                                                                      | keeps free text on Tab and on a later close…                                                           | ✅ covered |                                                                                |
| Mobile selection transactions (draft until Approve, Cancel restores, immediate mode, closeOnSelect, external writeValue during draft)                   | mobile: Approve commits the draft once…; immediate mode…; keeps the dialog open…                       | ✅ covered | External writeValue during a draft: see below                                  |
| Global mobile confirmation config                                                                                                                       | —                                                                                                      | ➖ n/a     | No global mobile-config token in our port                                      |

Open stories: "Open: dropdown", "Open: groups", "Open: list message", "Open: inside a dialog" and "Open: mobile dialog" open the list (or dialog) in `play`.

Registry-only coverage: inline autocomplete selection range, bolded match, focus stays in the input after a click on an option.

### Gaps to fill

- None left; every row above is covered or n/a.
