## busy-indicator

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/busy-indicator) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/busy-indicator)
Registry: `registry/ui/busy-indicator/` — 6 stories, 6 tests.

### Stories vs. upstream examples

| Upstream example                  | Registry story                     | Status     | Notes                                                                                                                                                    |
| --------------------------------- | ---------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default Busy Indicator            | Basic, Playground                  | ✅ covered |                                                                                                                                                          |
| Busy Indicator sizes              | Sizes                              | ✅ covered | s, m, l                                                                                                                                                  |
| Busy Indicator with label         | Extended ("With label (extended)") | ✅ covered | `fdBusyIndicatorExtended` with a label                                                                                                                   |
| Busy Indicator with message toast | —                                  | ❌ missing | Upstream opens an extended busy indicator inside a message toast from a template, with a "Hide all" button. Overlay, so it also needs an "Open: …" story |
| Busy Indicator as wrapper         | Wrapper ("As a wrapper")           | ✅ covered | Block and inline wrappers with a loading toggle                                                                                                          |

### Tests vs. upstream specs

| Upstream behaviour                                                                                       | Registry test                                                       | Status     | Notes                                                                                                   |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| Shows the loading state                                                                                  | loading shows the dots with role progressbar …                      | ✅ covered |                                                                                                         |
| Size                                                                                                     | size s, m, l and the contrast variant                               | ✅ covered | Real dot sizes                                                                                          |
| Block vs inline-block display                                                                            | block mode overlays the content …                                   | 🟡 partial | Block covered; the default inline-block display is not asserted                                         |
| Role progressbar / presentation                                                                          | loading shows the dots …                                            | ✅ covered |                                                                                                         |
| tabindex 0 / -1                                                                                          | loading shows the dots …                                            | ✅ covered |                                                                                                         |
| `aria-busy`                                                                                              | loading shows the dots …                                            | ✅ covered |                                                                                                         |
| `aria-valuemin` / `aria-valuemax`                                                                        | loading shows the dots …                                            | ✅ covered |                                                                                                         |
| `aria-valuetext`: custom, default, absent when idle                                                      | loading shows the dots …                                            | 🟡 partial | Default and idle covered; a custom `ariaValueText` is never asserted                                    |
| Title: default, custom, removed when idle                                                                | loading shows the dots …                                            | ✅ covered |                                                                                                         |
| Custom `ariaLabel`                                                                                       | loading shows the dots …                                            | ✅ covered |                                                                                                         |
| `aria-live` assertive / polite / off                                                                     | ariaLive announces the label …                                      | 🟡 partial | Only `polite`                                                                                           |
| Loading label displayed                                                                                  | shows the label under the dots                                      | ✅ covered |                                                                                                         |
| `preventWheelEvents`: added, not added, preventDefault, removed when switched off, cleaned up on destroy | ariaLive announces the label; preventWheelEvents blocks scrolling … | 🟡 partial | On, off and "only while loading" covered; switching the input back to false and destroy cleanup are not |
| Extended directive classes                                                                               | —                                                                   | ➖ n/a     | Class only                                                                                              |
| `should create`                                                                                          | —                                                                   | ➖ n/a     |                                                                                                         |

Registry-only coverage: block mode makes the content inert and keeps focus on the indicator, contrast colours (incl. HC theme), `prefers-reduced-motion`.

### Gaps to fill

- **Stories:** "With message toast" (button that opens an extended busy indicator in a message toast, plus "Hide all"); "Open: message toast" whose `play` clicks the button.
- **Tests:** "is inline-block by default"; "uses a custom ariaValueText while loading"; "sets aria-live assertive and off"; "stops blocking wheel events when preventWheelEvents turns off"; "removes the wheel listener on destroy".
- **Effort:** S, small attribute tests and one toast story.
