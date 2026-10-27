## multi-input

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/multi-input) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/multi-input)
Registry: `registry/ui/multi-input/` — 5 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                     | Registry story      | Status     | Notes                                                                                               |
| ------------------------------------ | ------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| Simple Multi Input                   | Default, Playground | ✅ covered | Incl. disabled and searchTermChange readout                                                         |
| Compact Multi Input                  | Default             | ✅ covered |                                                                                                     |
| Mobile Mode Multi Input              | Mobile              | 🟡 partial | No "Open: mobile" story; the dialog never reaches the a11y run                                      |
| Display Object Property              | Items               | ✅ covered | displayFn / valueFn                                                                                 |
| Return results including search term | Default             | ✅ covered | `includes`                                                                                          |
| Custom Filter                        | —                   | ❌ missing | `filterFn` never shown                                                                              |
| Observable Async Example             | —                   | ❌ missing | No async (observable + async pipe) dropdown values                                                  |
| Multi Input in Reactive Form         | Forms               | ✅ covered | Required, error state, disabled control                                                             |
| Adding New Tokens                    | Items               | ✅ covered |                                                                                                     |
| Custom Item Template                 | Items               | 🟡 partial | Icon and byline templates exist but no Open: story shows the list                                   |
| Predefined dropdown width            | Items               | 🟡 partial | Only `bodyMaxWidth="container"`; no narrow field with long options, no Open: story                  |
| Addon Button Clicked Event           | Items               | ✅ covered |                                                                                                     |
| Option items as dropdown items       | —                   | ❌ missing | Default `{label, value}` handling never shown                                                       |
| Mass Performance (1000 tokens)       | Default             | 🟡 partial | 16 selected values with "n more"; nothing at the 1000-token scale that exercises `maxVisibleTokens` |

### Tests vs. upstream specs

| Upstream behaviour                                                                                                                          | Registry test                                                              | Status     | Notes                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------- | --------------------------------------------------------- |
| should create (mobile)                                                                                                                      | —                                                                          | ➖ n/a     |                                                           |
| Mobile: mobileConfig, open/close with approve and dismiss                                                                                   | —                                                                          | ❌ missing |                                                           |
| Placeholder                                                                                                                                 | —                                                                          | ❌ missing |                                                           |
| Search term change + filtering                                                                                                              | filters the options while typing and marks the selected ones               | 🟡 partial | Filtering covered; `searchTermChange` output not asserted |
| Addon click opens/closes the popover                                                                                                        | —                                                                          | ❌ missing |                                                           |
| Select / de-select values                                                                                                                   | toggles options by click and with Enter…                                   | ✅ covered |                                                           |
| Mobile: cancel restores without emitting, approve emits                                                                                     | —                                                                          | ❌ missing |                                                           |
| Focus back in input and search cleared after selection                                                                                      | selects the first match with Enter and clears the search; toggles options… | ✅ covered |                                                           |
| Show All button                                                                                                                             | —                                                                          | ❌ missing |                                                           |
| Object values (displayFn / valueFn)                                                                                                         | —                                                                          | ❌ missing |                                                           |
| Keeps selected options when the option list changes                                                                                         | —                                                                          | ❌ missing |                                                           |
| Select all / deselect all (`allItemsSelectedChange`)                                                                                        | —                                                                          | ❌ missing |                                                           |
| openDropdownOnAddOnClicked=false                                                                                                            | —                                                                          | ❌ missing |                                                           |
| Disabled: no pointer events, not tabbable; re-enabled                                                                                       | —                                                                          | ❌ missing |                                                           |
| Token virtualization: `maxVisibleTokens` slice + "+N more", full set on focus, collapse on outside blur, no double indicator, click expands | —                                                                          | ❌ missing |                                                           |
| "+N more" keyboard a11y: tabindex 0, role=button, Enter/Space expand                                                                        | —                                                                          | ❌ missing |                                                           |

Registry-only coverage: `aria-multiselectable` listbox, `aria-selected`, `aria-activedescendant`, autocomplete + Enter, new tokens, Backspace removal, Escape and touched-on-blur.

### Gaps to fill

- **Stories:** "Custom filter" (`filterFn`); "Async values" (observable + async pipe); "Option items" (`{label, value}` objects); "Dropdown width" (200px field, long option); "Many tokens" (1000 values, `maxVisibleTokens`); "Open: item template", "Open: mobile".
- **Tests:** "shows the placeholder"; "emits searchTermChange while typing"; "the addon button opens and closes the list"; "openDropdownOnAddOnClicked=false only emits addOnButtonClicked"; "Show All lists every option after filtering"; "displayFn/valueFn map objects to tokens and values"; "keeps the selection when dropdownValues change"; "select all and deselect all emit allItemsSelectedChange"; "a disabled multi input is not focusable or clickable"; "renders maxVisibleTokens tokens plus +N more until focused"; "+N more is a button activated by Enter and Space"; "mobile dialog approve emits and cancel restores the selection".
- **Effort:** L — about 12 tests (virtualization and mobile dialog are the heavy ones) plus seven stories.
