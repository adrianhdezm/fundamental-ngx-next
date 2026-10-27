## flexible-column-layout

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/flexible-column-layout) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/flexible-column-layout)
Registry: `registry/ui/flexible-column-layout/` — 4 stories, 11 tests.

### Stories vs. upstream examples

| Upstream example                                 | Registry story            | Status     | Notes                                                                                                                                                                                                       |
| ------------------------------------------------ | ------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flexible Column Layout                           | `Default`, `ThreeColumns` | ✅ covered | Layout switcher over all 10 layouts, resizable box shows the responsive collapse; transparent background in `ThreeColumns`.                                                                                 |
| Flexible Column Layout With Dynamic Page         | `WithDynamicPage`         | ✅ covered | Mid column hosts an `fd-dynamic-page` with a collapsible, pinnable subheader and full screen (OneColumnMidFullScreen) / close layout actions; rendered in the story frame instead of a full-screen overlay. |
| Flexible Column Layout with custom layout config | `CustomConfig`            | ✅ covered | Uses `provideFlexibleColumnLayoutConfig` (50/50 for TwoColumnsMidExpanded).                                                                                                                                 |

### Tests vs. upstream specs

| Upstream behaviour                                                                                                        | Registry test                                                                                                                                           | Status     | Notes                                                |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------- |
| Should create                                                                                                             | —                                                                                                                                                       | ➖ n/a     |                                                      |
| backgroundDesign translucent modifier                                                                                     | backgroundDesign solid/translucent/transparent, including high contrast                                                                                 | ✅ covered | Checks the resulting token colours, not class names. |
| Each layout renders the right columns (one/two/three columns, start minimized)                                            | each layout sets the start/mid/end widths ...; hidden columns are aria-hidden                                                                           | ✅ covered | Loops over every layout definition.                  |
| MD screen: THREE_COLUMNS_MID → START_MINIMIZED, THREE_COLUMNS_END → TWO_COLUMNS_END                                       | between sm and lg three-column layouts reduce to two columns ...                                                                                        | ✅ covered | Also covers restore when wide again.                 |
| Layout updates on resize without manual change detection                                                                  | below smBreakPoint ... collapse ... and restore; a layout chosen while narrow replaces the one to restore                                               | ✅ covered |                                                      |
| Separator direction values per layout                                                                                     | separators appear only between visible columns with the right arrow direction (mirrored in RTL)                                                         | ✅ covered | Checks glyphs and RTL mirroring.                     |
| layoutChange emitted on separator click                                                                                   | clicking a separator or its button switches to the next layout and emits layoutChange                                                                   | ✅ covered |                                                      |
| Separator click transitions (2-col start/mid toggles, 3-col mid→end expanded, 3-col mid→end minimized via left separator) | clicking a separator ...; the start separator switches ThreeColumnsMidExpanded to ThreeColumnsEndMinimized; the separator buttons are keyboard operable | ✅ covered |                                                      |
| Separator aria-labels: collapse/expand per-button titles and fallback                                                     | separators appear only between visible columns ...; expandTitleStartBtn and collapseTitleStartBtn label the start separator button                      | ✅ covered |                                                      |

Registry-only coverage: keyboard (Enter/Space) on separator buttons, RTL arrow mirroring, aria-hidden/visibility of hidden columns, high-contrast separator colour, config merge with defaults.

### Gaps to fill

- **Tests:** none.
- **Effort:** S, two small spec additions and one composed story from existing components.
