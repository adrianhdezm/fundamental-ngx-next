## list

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/list) · [byline docs](https://sap.github.io/fundamental-ngx/#/core/list-byline) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/list)
Registry: `registry/ui/list/` — 16 stories, 37 tests.

### Stories vs. upstream examples

| Upstream example                      | Registry story                                        | Status     | Notes                                                                                         |
| ------------------------------------- | ----------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| Simple list                           | Default                                               | ✅ covered | Incl. compact and unread                                                                      |
| Navigation list                       | Navigation                                            | ✅ covered | navigated, selected, counter                                                                  |
| Navigation indicator                  | Navigation                                            | ✅ covered |                                                                                               |
| Action list                           | Interactive                                           | ✅ covered | "Action items"                                                                                |
| Filter and sort list                  | Filter and sort                                       | ✅ covered | Toolbar with search input and sort buttons, remove buttons, `noData` row when nothing matches |
| Secondary item on list                | Default                                               | ✅ covered | All secondary types + counter                                                                 |
| List with icons                       | Default                                               | ✅ covered |                                                                                               |
| Borderless list                       | Default                                               | ✅ covered |                                                                                               |
| Interactive list                      | Interactive                                           | ✅ covered | Incl. inactive                                                                                |
| Complex list                          | Complex (borderless, groups and footer) / Interactive | ✅ covered | Borderless list with two icon groups and a footer                                             |
| Selection                             | Selection                                             | ✅ covered | Multi, multi with disabled checkboxes, compact multi, cozy and compact single                 |
| Keyboard support                      | Keyboard support                                      | ✅ covered | `focusEscapeList` up focuses a button before the list, which calls `setItemActive(0)`         |
| Drag and drop                         | —                                                     | ❌ missing | No dnd component in the registry; blocked                                                     |
| Infinite scroll list                  | Infinite scroll                                       | ✅ covered | `fdInfiniteScroll` list inside a block busy indicator                                         |
| List loading                          | Loading                                               | ✅ covered | Skeleton rows toggled by a button                                                             |
| Search Results List                   | —                                                     | ❌ missing | `searchResultsList` / `suggestion` not ported (only title `scope`); needs a decision          |
| List with Byline                      | Byline                                                | ✅ covered | No group header inside the byline list                                                        |
| List with Byline Navigation           | Byline                                                | ✅ covered |                                                                                               |
| Borderless List with Byline           | Byline: borderless                                    | ✅ covered |                                                                                               |
| List Selection with Byline            | Byline: selection                                     | ✅ covered | Checkbox and radio byline lists                                                               |
| List with Byline, Buttons and Counter | Byline: buttons and counter                           | ✅ covered |                                                                                               |
| Wrap List with Byline                 | Byline: wrap                                          | ✅ covered | Wrapping title, byline and two-column byline                                                  |
| Interactive List with Byline          | Byline: interactive                                   | ✅ covered |                                                                                               |
| Unread List item                      | Byline: unread / Default                              | ✅ covered | Byline list with `unreadIndicator`                                                            |
| Skeleton Loading (byline)             | Loading                                               | ✅ covered | Byline skeleton next to the plain one                                                         |
| Subline (list-subline page)           | Byline                                                | ✅ covered |                                                                                               |

### Tests vs. upstream specs

| Upstream behaviour                                                                                                          | Registry test                                                                              | Status     | Notes                                                             |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------- | ----------------------------------------------------------------- |
| should create (all parts)                                                                                                   | —                                                                                          | ➖ n/a     |                                                                   |
| Directive host classes (byline left/right, content, thumbnail, footer, group header, secondary, title-text, list/item base) | content › \*                                                                               | ➖ n/a     | Class-only upstream; layout outcomes covered by our content tests |
| Additional user `class` (list, icon, link)                                                                                  | merges a user class on the list, icon and link                                             | ✅ covered |                                                                   |
| Title / subline truncate and wrap                                                                                           | titles truncate by default and wrap in a wrap list                                         | ✅ covered | `truncate` deprecated (default); subline truncation not asserted  |
| Item link / button modifiers                                                                                                | navigation items › _, action items › _                                                     | ✅ covered |                                                                   |
| Link item keyboard handling                                                                                                 | the link fills the item and is opened with Enter on the item                               | ✅ covered |                                                                   |
| Non-selectable items: no sr-only span, no `aria-describedby`                                                                | items of a list without selection have no aria-describedby and no selection text           | ✅ covered |                                                                   |
| Selection mode sr-only Selected / Not selected, updates on click                                                            | describes the selection state for screen readers                                           | ✅ covered | Also custom labels                                                |
| List message + success type                                                                                                 | the message sits above the items…; a success message uses the success background           | ✅ covered | Error and success types                                           |
| ListNavigationItem (expandable)                                                                                             | —                                                                                          | ➖ n/a     | Ported in `vertical-navigation`, not in list                      |
| List modifiers: unread indicator, byline                                                                                    | unread items have a bold title…, byline items show…                                        | ✅ covered |                                                                   |
| Notification modifier                                                                                                       | —                                                                                          | ➖ n/a     | Not in our List API                                               |
| Roving tabindex: first item default, `setItemActive`, click moves it                                                        | has one tab stop…; setItemActive focuses the item…; clicking an item makes it the tab stop | ✅ covered |                                                                   |

Registry-only coverage: Arrow/Home/End/PageUp/PageDown, key manager rebuild, fields inside items, `keyboardSupport=false`, `selectedChange`, inactive/preventClick, growing item, radio selection, density, HC action items.

### Gaps to fill

- **Stories:** "Search results" only if `searchResultsList`/`suggestion` get ported; drag and drop blocked on a dnd component.
- **Tests:** none left.
- **Effort:** none left (search results and drag and drop are blocked).
