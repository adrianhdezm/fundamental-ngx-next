## card

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/card) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/card)
Registry: `registry/ui/card/` — 8 stories, 14 tests.

### Stories vs. upstream examples

| Upstream example                           | Registry story                                                                 | Status     | Notes                                                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interactive card with role listitem        | Interactive ("Interactive cards in a card list")                               | 🟡 partial | Listitem cards in `fd-card-list` with a selected one; upstream also has badges, `badgeAriaLabel`, custom `ariaRoledescription` and an extended header with object statuses |
| Non-interactive card                       | FooterAndLoading (first card)                                                  | 🟡 partial | Header action covered; extended header (columns/rows, statuses, timestamp) and the empty-state card with an illustrated message are missing                                |
| Header Interaction - non-interactive Cards | Standard (list card)                                                           | 🟡 partial | Interactive main header covered; header-at-bottom interactive variant and the "Travel Request" card with `fd-card-extended-header align="bottom"` are missing              |
| Standard Card                              | Standard ("Header, content and badges")                                        | 🟡 partial | Basic cards and badges; upstream's 11 variants with header rows/columns and `fd-text` are not shown. `CardExtendedHeader` is imported but used in no story                 |
| Compact mode                               | any story via the density toolbar                                              | ✅ covered |                                                                                                                                                                            |
| Card footer                                | FooterOverflow ("Footer with overflow and link"), "Open: footer overflow menu" | ✅ covered | Three actions, actions with an overflow menu button, and a footer link                                                                                                     |
| Analytical Card                            | Analytical ("Analytical (KPI header)")                                         | ✅ covered | Chart replaced by a skeleton                                                                                                                                               |
| Bar Chart List                             | —                                                                              | ❌ missing | `fd-card-bar` is not ported in our source                                                                                                                                  |
| Object card                                | FooterAndLoading ("Object card")                                               | 🟡 partial | Text-only content; upstream shows avatar and object attribute groups                                                                                                       |
| Calendar card                              | —                                                                              | ❌ missing | Card with a `fd-calendar` in the content                                                                                                                                   |
| Quick view card                            | —                                                                              | ❌ missing | Card with `fd-quick-view` content (registry has quick-view)                                                                                                                |
| List card                                  | Standard (list card)                                                           | ✅ covered |                                                                                                                                                                            |
| Link List card                             | —                                                                              | ❌ missing | Link list items with avatars/icons and bylines                                                                                                                             |
| Media card                                 | Media                                                                          | ✅ covered |                                                                                                                                                                            |
| Media card (banner)                        | Banner                                                                         | ✅ covered |                                                                                                                                                                            |
| Card loader                                | FooterAndLoading ("Loading")                                                   | ✅ covered |                                                                                                                                                                            |
| Card Loading                               | —                                                                              | ❌ missing | Skeleton placeholders for header, list, header-at-bottom and avatar header                                                                                                 |

### Tests vs. upstream specs

| Upstream behaviour                                                        | Registry test                                                         | Status     | Notes                                                |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------- | ---------------------------------------------------- |
| Card type modifier, updates with `cardType`                               | card role description and hint are exposed on the host                | ✅ covered | Checked via the role description per type            |
| Interactive modifier (on/off)                                             | role button makes the whole card focusable …; card list: arrow keys … | ✅ covered |                                                      |
| Renders title and content                                                 | header, content and footer render in order …                          | ✅ covered |                                                      |
| Role description: translated with card type, custom                       | card role description and hint …                                      | ✅ covered |                                                      |
| Aria description: default, custom                                         | card role description and hint …                                      | ✅ covered |                                                      |
| `aria-describedby`: badges, subtitle, second subtitle, counter, extra ids | the card is labelled by its title and described by …                  | 🟡 partial | Second subtitle id is in the source but not asserted |
| Host classes of content, header, title, subtitles, KPI parts, loader      | —                                                                     | ➖ n/a     | Class only                                           |
| Counter status modifier                                                   | counter color follows its status                                      | ✅ covered |                                                      |
| `should create` (all parts)                                               | —                                                                     | ➖ n/a     |                                                      |

Registry-only coverage: badges (two at most, corner placement), interactive main header keyboard, selected-card border, KPI LTR in RTL, loader hiding content from AT, media/banner sizes and colours, card-list arrow/Home/End navigation, corner rounding.

### Gaps to fill

- **Stories:** "Extended header" (main + extended header with status columns/rows and timestamp, incl. `align="bottom"` travel-request card); "Empty state" (illustrated message in content); "Calendar card"; "Quick view card"; "Link list card"; "Loading placeholders" (skeleton header/list/avatar variants); richer "Object card" (avatar + attribute groups); extend Interactive with badges and a custom role description. Bar chart list is blocked on porting `fd-card-bar`.
- **Tests:** "aria-describedby includes the second subtitle"; optional: "extended header columns align to the end and the header can sit at the bottom".
- **Effort:** M, mostly composition stories; tests are almost at parity.
