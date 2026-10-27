## tile

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/tile) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/tile)
Registry: `registry/ui/tile/` — 10 stories, 15 tests.

### Stories vs. upstream examples

| Upstream example                                               | Registry story                                     | Status     | Notes                                                                                            |
| -------------------------------------------------------------- | -------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| Generic Tile Sizes (s/m, double, profile image, logo, refresh) | `Sizes`                                            | ✅ covered |                                                                                                  |
| Generic Tile Content Columns                                   | `Columns`                                          | ✅ covered |                                                                                                  |
| Launch Tile                                                    | `LaunchTile`                                       | ✅ covered | Launch icon, scale, KPI.                                                                         |
| KPI Tile                                                       | `KpiTile`                                          | ✅ covered | Positive/negative states, scale arrows.                                                          |
| Action Mode, Badges, Feed Tiles, and Interactivity             | `ActionMode`, `BadgeTile`, `FeedTile`, `Clickable` | ✅ covered | Split across four stories; `SlideTile` and `LineTile` add Horizon tile types upstream docs lack. |

### Tests vs. upstream specs

| Upstream behaviour                                                                     | Registry test                                                                     | Status     | Notes                                                                            |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| should create                                                                          | —                                                                                 | ➖ n/a     |                                                                                  |
| Base and type classes, combined classes                                                | —                                                                                 | ➖ n/a     | Class-only; the type outcomes are covered by the numeric content and feed tests. |
| Size and double classes                                                                | size s and double width; header/content/footer heights per size                   | ✅ covered | Measured sizes, not classes.                                                     |
| tabindex 0 when clickable, -1 otherwise                                                | clickable tile is role button…; a non-clickable tile has no role…                 | ✅ covered |                                                                                  |
| tileClick on click, Enter, Space; none when not clickable                              | clickable tile is role button, focusable, emits tileClick…; a non-clickable tile… | ✅ covered | Also ignores events from inner buttons.                                          |
| Action overlay when `action`                                                           | action mode shows the overlay, close and indicator buttons…                       | ✅ covered |                                                                                  |
| As native link: attribute selector, attributes kept, no tabindex/role, emits tileClick | <a fd-tile> keeps link semantics and emits tileClick on click                     | ✅ covered |                                                                                  |
| Tile and numeric content directive classes                                             | —                                                                                 | ➖ n/a     | Class-only.                                                                      |

Registry-only coverage: custom role/aria-labelledby, Tab order across tiles, line tile variants, slide tile controls and page dots, badge placement, numeric content sizes, state colours and RTL, decorative scale arrow, footer refresh button name and click.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, one spec.
