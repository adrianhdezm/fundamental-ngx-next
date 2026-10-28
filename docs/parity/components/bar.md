## bar

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/bar) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/bar)
Registry: `registry/ui/bar/` — 5 stories, 19 tests.

### Stories vs. upstream examples

| Upstream example                 | Registry story                                | Status     | Notes                                                                                                                    |
| -------------------------------- | --------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| Default Bar                      | Designs ("Default"), Playground               | ✅ covered | Back button, three sections, avatar                                                                                      |
| Bar Design Header                | Designs ("Header")                            | ✅ covered |                                                                                                                          |
| Bar Design SubHeader             | Designs ("Header with subheader"), Playground | ✅ covered | Shown under a header; a standalone subheader is available via the Playground `barDesign` control                         |
| Bar Design Header with SubHeader | Designs ("Header with subheader")             | ✅ covered |                                                                                                                          |
| Bar Design Footer                | Designs ("Footer")                            | ✅ covered |                                                                                                                          |
| Bar Design Floating Footer       | FloatingFooter                                | ✅ covered |                                                                                                                          |
| Bar With Title                   | Designs ("Title")                             | ✅ covered |                                                                                                                          |
| Bar Design in Page               | PageSizes, Playground (`inPage`)              | ✅ covered |                                                                                                                          |
| Page Responsive Behaviour        | PageSizes ("In page, responsive paddings")    | ✅ covered | s, m_l, xl                                                                                                               |
| Custom Shellbar                  | CustomShellbar                                | ✅ covered | Search combobox (left), logo link (middle), cart button + avatar (right) on the shell colour; a neutral placeholder logo |

### Tests vs. upstream specs

| Upstream behaviour                                    | Registry test                                                                                      | Status     | Notes                                       |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------- |
| Always has the `fd-bar` class                         | —                                                                                                  | ➖ n/a     | Class only                                  |
| `role=toolbar` by default, custom role                | is a toolbar with left, middle and right areas in order; role toolbar can be overridden or removed | ✅ covered |                                             |
| `barDesign` header/subheader                          | header uses the page header text color …; a header followed by a subheader …                       | ✅ covered | Token outcomes                              |
| Footer design                                         | footer uses the page footer background …; floating footer floats …                                 | ✅ covered |                                             |
| `inPage` with and without size                        | inPage paddings follow size s, m_l and xl                                                          | ✅ covered |                                             |
| `inHomePage` with and without size                    | inHomePage paddings follow every size and the default                                              | ✅ covered |                                             |
| `clear`                                               | clear removes the shadow                                                                           | ✅ covered |                                             |
| `initialSuggestionTitle` / `initialSuggestionSubline` | initialSuggestionTitle and initialSuggestionSubline let the bar grow with their paddings           | ✅ covered | Top/bottom paddings and auto height         |
| Bar element `fullWidth`                               | fullWidth makes a bar element fill its area                                                        | ✅ covered | Its first child grows too                   |
| Left/middle/right/element host classes                | —                                                                                                  | ➖ n/a     | Class only; order and layout tested instead |
| `should create` (bar, button-bar, directives)         | —                                                                                                  | ➖ n/a     |                                             |

Registry-only coverage: middle area stays centred, truncation priority (titles before buttons), floating footer offset in a page, compact density for bar and button-bar, button-bar label/glyph/click/disabled behaviour.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, one story and three layout tests.
