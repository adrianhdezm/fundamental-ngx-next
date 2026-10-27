## card

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/card) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/card)
Registry: `registry/ui/card/` — 15 stories, 14 tests.

### Stories vs. upstream examples

| Upstream example                           | Registry story                                                                 | Status     | Notes                                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interactive card with role listitem        | Interactive ("Interactive cards in a card list")                               | ✅ covered | Listitem cards with a selected one, and a second list with badges, `badgeAriaLabel`, a custom `ariaRoledescription` and extended headers            |
| Non-interactive card                       | ExtendedHeader, EmptyState                                                     | ✅ covered | Header action, extended header (columns/rows, statuses, timestamp), travel request with `align="bottom"`, empty state with an illustrated message   |
| Header Interaction - non-interactive Cards | ExtendedHeader ("Extended header and header interaction")                      | ✅ covered | Interactive main header on top, at the bottom, and on the travel request card                                                                       |
| Standard Card                              | Standard ("Header, content and badges")                                        | 🟡 partial | Basic cards and badges; upstream's 11 variants with header rows/columns and `fd-text` are not all shown (header rows/columns are in ExtendedHeader) |
| Compact mode                               | any story via the density toolbar                                              | ✅ covered |                                                                                                                                                     |
| Card footer                                | FooterOverflow ("Footer with overflow and link"), "Open: footer overflow menu" | ✅ covered | Three actions, actions with an overflow menu button, and a footer link                                                                              |
| Analytical Card                            | Analytical ("Analytical (KPI header)")                                         | ✅ covered | Chart replaced by a skeleton                                                                                                                        |
| Bar Chart List                             | —                                                                              | ❌ missing | Blocked: `fd-card-bar` is not ported (README "Not yet ported")                                                                                      |
| Object card                                | ObjectCard                                                                     | ✅ covered | Avatar and two attribute groups, stacked and side by side                                                                                           |
| Calendar card                              | CalendarCard                                                                   | ✅ covered | Subtitle follows the calendar view                                                                                                                  |
| Quick view card                            | QuickViewCard                                                                  | ✅ covered |                                                                                                                                                     |
| List card                                  | Standard (list card)                                                           | ✅ covered |                                                                                                                                                     |
| Link List card                             | LinkListCard                                                                   | ✅ covered | Avatars with bylines, and icon quick links                                                                                                          |
| Media card                                 | Media                                                                          | ✅ covered |                                                                                                                                                     |
| Media card (banner)                        | Banner                                                                         | ✅ covered |                                                                                                                                                     |
| Card loader                                | FooterAndLoading ("Loading")                                                   | ✅ covered |                                                                                                                                                     |
| Card Loading                               | LoadingPlaceholders                                                            | ✅ covered | Skeleton header and list, header at the bottom, avatar header with a badge                                                                          |

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

- **Stories:** done. Bar chart list is blocked on porting `fd-card-bar`.
- **Tests:** "aria-describedby includes the second subtitle"; optional: "extended header columns align to the end and the header can sit at the bottom".
- **Effort:** M, mostly composition stories; tests are almost at parity.
