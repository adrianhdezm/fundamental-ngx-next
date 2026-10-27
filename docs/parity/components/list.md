## list

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/list) · [byline docs](https://sap.github.io/fundamental-ngx/#/core/list-byline) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/list)
Registry: `registry/ui/list/` — 5 stories, 32 tests.

### Stories vs. upstream examples

| Upstream example                      | Registry story   | Status     | Notes                                                                                            |
| ------------------------------------- | ---------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| Simple list                           | Default          | ✅ covered | Incl. compact and unread                                                                         |
| Navigation list                       | Navigation       | ✅ covered | navigated, selected, counter                                                                     |
| Navigation indicator                  | Navigation       | ✅ covered |                                                                                                  |
| Action list                           | Interactive      | ✅ covered | "Action items"                                                                                   |
| Filter and sort list                  | —                | ❌ missing | Toolbar + search input, sort buttons, remove button, `noData` item; `noData` appears in no story |
| Secondary item on list                | Default          | ✅ covered | All secondary types + counter                                                                    |
| List with icons                       | Default          | ✅ covered |                                                                                                  |
| Borderless list                       | Default          | ✅ covered |                                                                                                  |
| Interactive list                      | Interactive      | ✅ covered | Incl. inactive                                                                                   |
| Complex list                          | Interactive      | 🟡 partial | Group header + footer only in the growing list; no borderless list with two icon groups          |
| Selection                             | Selection        | 🟡 partial | Multi + compact single; no disabled-checkbox list, no compact multi, no cozy single              |
| Keyboard support                      | —                | ❌ missing | `focusEscapeList` demo (focus a button before the list on escape)                                |
| Drag and drop                         | —                | ❌ missing | No dnd component in the registry; blocked                                                        |
| Infinite scroll list                  | —                | ❌ missing | `registry/ui/infinite-scroll` exists; needs a list + busy indicator story                        |
| List loading                          | —                | ❌ missing | Skeleton rows toggled by a button (`registry/ui/skeleton` exists)                                |
| Search Results List                   | —                | ❌ missing | `searchResultsList` / `suggestion` not ported (only title `scope`); needs a decision             |
| List with Byline                      | Byline           | ✅ covered | No group header inside the byline list                                                           |
| List with Byline Navigation           | Byline           | ✅ covered |                                                                                                  |
| Borderless List with Byline           | —                | ❌ missing |                                                                                                  |
| List Selection with Byline            | —                | ❌ missing | Checkbox and radio byline lists                                                                  |
| List with Byline, Buttons and Counter | —                | ❌ missing | Buttons only shown in non-byline items                                                           |
| Wrap List with Byline                 | —                | ❌ missing | `fd-list-byline wrap` never shown                                                                |
| Interactive List with Byline          | —                | ❌ missing |                                                                                                  |
| Unread List item                      | Byline / Default | 🟡 partial | Unread items shown, but never with `unreadIndicator` on the list                                 |
| Skeleton Loading (byline)             | —                | ❌ missing |                                                                                                  |
| Subline (list-subline page)           | Byline           | ✅ covered |                                                                                                  |

### Tests vs. upstream specs

| Upstream behaviour                                                                                                          | Registry test                                                | Status     | Notes                                                                 |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------- | --------------------------------------------------------------------- |
| should create (all parts)                                                                                                   | —                                                            | ➖ n/a     |                                                                       |
| Directive host classes (byline left/right, content, thumbnail, footer, group header, secondary, title-text, list/item base) | content › \*                                                 | ➖ n/a     | Class-only upstream; layout outcomes covered by our content tests     |
| Additional user `class` (list, icon, link)                                                                                  | —                                                            | ❌ missing | `userClass` alias exists on every part                                |
| Title / subline truncate and wrap                                                                                           | titles truncate by default and wrap in a wrap list           | ✅ covered | `truncate` deprecated (default); subline truncation not asserted      |
| Item link / button modifiers                                                                                                | navigation items › _, action items › _                       | ✅ covered |                                                                       |
| Link item keyboard handling                                                                                                 | the link fills the item and is opened with Enter on the item | ✅ covered |                                                                       |
| Non-selectable items: no sr-only span, no `aria-describedby`                                                                | —                                                            | ❌ missing |                                                                       |
| Selection mode sr-only Selected / Not selected, updates on click                                                            | describes the selection state for screen readers             | ✅ covered | Also custom labels                                                    |
| List message + success type                                                                                                 | the message sits above the items…                            | 🟡 partial | Error type only                                                       |
| ListNavigationItem (expandable)                                                                                             | —                                                            | ➖ n/a     | Ported in `vertical-navigation`, not in list                          |
| List modifiers: unread indicator, byline                                                                                    | unread items have a bold title…, byline items show…          | ✅ covered |                                                                       |
| Notification modifier                                                                                                       | —                                                            | ➖ n/a     | Not in our List API                                                   |
| Roving tabindex: first item default, `setItemActive`, click moves it                                                        | has one tab stop…                                            | 🟡 partial | Default + focus covered; `setItemActive()` and click-to-move untested |

Registry-only coverage: Arrow/Home/End/PageUp/PageDown, key manager rebuild, fields inside items, `keyboardSupport=false`, `selectedChange`, inactive/preventClick, growing item, radio selection, density, HC action items.

### Gaps to fill

- **Stories:** "Filter and sort" (toolbar search + sort + remove, `noData` row); "Complex" (borderless, two icon groups, footer); extend "Selection" with disabled checkboxes and compact multi; "Keyboard support" (`focusEscapeList` to a button); "Infinite scroll" (infinite-scroll + busy indicator); "Loading" (skeleton toggle, plain and byline); "Byline: borderless", "Byline: selection" (checkbox + radio), "Byline: buttons and counter", "Byline: wrap", "Byline: interactive", "Byline: unread" (with `unreadIndicator`); "Search results" only if `searchResultsList`/`suggestion` get ported; drag and drop blocked on a dnd component.
- **Tests:** "non-selectable items have no aria-describedby and no selection text"; "setItemActive moves the tab stop"; "clicking an item makes it the tab stop"; "success list message uses the success background"; "merges a user class on list, icon and link".
- **Effort:** L — about a dozen stories (several with state: filter/sort, infinite scroll, loading) plus a handful of tests.
