## bar

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/bar) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/bar)
Registry: `registry/ui/bar/` — 4 stories, 17 tests.

### Stories vs. upstream examples

| Upstream example                 | Registry story                                | Status     | Notes                                                                                             |
| -------------------------------- | --------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| Default Bar                      | Designs ("Default"), Playground               | ✅ covered | Back button, three sections, avatar                                                               |
| Bar Design Header                | Designs ("Header")                            | ✅ covered |                                                                                                   |
| Bar Design SubHeader             | Designs ("Header with subheader"), Playground | ✅ covered | Shown under a header; a standalone subheader is available via the Playground `barDesign` control  |
| Bar Design Header with SubHeader | Designs ("Header with subheader")             | ✅ covered |                                                                                                   |
| Bar Design Footer                | Designs ("Footer")                            | ✅ covered |                                                                                                   |
| Bar Design Floating Footer       | FloatingFooter                                | ✅ covered |                                                                                                   |
| Bar With Title                   | Designs ("Title")                             | ✅ covered |                                                                                                   |
| Bar Design in Page               | PageSizes, Playground (`inPage`)              | ✅ covered |                                                                                                   |
| Page Responsive Behaviour        | PageSizes ("In page, responsive paddings")    | ✅ covered | s, m_l, xl                                                                                        |
| Custom Shellbar                  | —                                             | ❌ missing | Upstream: search combobox (left), logo link (middle), cart button + avatar (right) in a plain bar |

### Tests vs. upstream specs

| Upstream behaviour                                    | Registry test                                                                                      | Status     | Notes                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| Always has the `fd-bar` class                         | —                                                                                                  | ➖ n/a     | Class only                                                             |
| `role=toolbar` by default, custom role                | is a toolbar with left, middle and right areas in order; role toolbar can be overridden or removed | ✅ covered |                                                                        |
| `barDesign` header/subheader                          | header uses the page header text color …; a header followed by a subheader …                       | ✅ covered | Token outcomes                                                         |
| Footer design                                         | footer uses the page footer background …; floating footer floats …                                 | ✅ covered |                                                                        |
| `inPage` with and without size                        | inPage paddings follow size s, m_l and xl                                                          | ✅ covered |                                                                        |
| `inHomePage` with and without size                    | inHomePage uses smaller paddings for size s                                                        | 🟡 partial | Only size s; no-size and m_l/xl paddings unchecked                     |
| `clear`                                               | clear removes the shadow                                                                           | ✅ covered |                                                                        |
| `initialSuggestionTitle` / `initialSuggestionSubline` | —                                                                                                  | ❌ missing | Inputs exist in our source (auto height, top/bottom padding), untested |
| Bar element `fullWidth`                               | —                                                                                                  | ❌ missing | Input exists; untested (used in the Designs story)                     |
| Left/middle/right/element host classes                | —                                                                                                  | ➖ n/a     | Class only; order and layout tested instead                            |
| `should create` (bar, button-bar, directives)         | —                                                                                                  | ➖ n/a     |                                                                        |

Registry-only coverage: middle area stays centred, truncation priority (titles before buttons), floating footer offset in a page, compact density for bar and button-bar, button-bar label/glyph/click/disabled behaviour.

### Gaps to fill

- **Stories:** "Custom shellbar" — search combobox in the left area, a logo link in the middle, cart button and circle avatar on the right.
- **Tests:** "fullWidth makes a bar element fill its area"; "initialSuggestionTitle and initialSuggestionSubline let the bar grow with their paddings"; "inHomePage paddings follow every size and the default".
- **Effort:** S, one story and three layout tests.
