## busy-indicator

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/busy-indicator) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/busy-indicator)
Registry: `registry/ui/busy-indicator/` — 8 stories, 9 tests.

### Stories vs. upstream examples

| Upstream example                  | Registry story                                            | Status     | Notes                                                                                                                        |
| --------------------------------- | --------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Default Busy Indicator            | Basic, Playground                                         | ✅ covered |                                                                                                                              |
| Busy Indicator sizes              | Sizes                                                     | ✅ covered | s, m, l                                                                                                                      |
| Busy Indicator with label         | Extended ("With label (extended)")                        | ✅ covered | `fdBusyIndicatorExtended` with a label                                                                                       |
| Busy Indicator with message toast | WithMessageToast ("With message toast"), OpenMessageToast | ✅ covered | Extended busy indicator in a message toast opened from a template, with "Hide all"; "Open: message toast" opens it in `play` |
| Busy Indicator as wrapper         | Wrapper ("As a wrapper")                                  | ✅ covered | Block and inline wrappers with a loading toggle                                                                              |

### Tests vs. upstream specs

| Upstream behaviour                                                                                       | Registry test                                                                                                                        | Status     | Notes          |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------- | -------------- |
| Shows the loading state                                                                                  | loading shows the dots with role progressbar …                                                                                       | ✅ covered |                |
| Size                                                                                                     | size s, m, l and the contrast variant                                                                                                | ✅ covered | Real dot sizes |
| Block vs inline-block display                                                                            | block mode overlays the content …; is inline-block by default …                                                                      | ✅ covered |                |
| Role progressbar / presentation                                                                          | loading shows the dots …                                                                                                             | ✅ covered |                |
| tabindex 0 / -1                                                                                          | loading shows the dots …                                                                                                             | ✅ covered |                |
| `aria-busy`                                                                                              | loading shows the dots …                                                                                                             | ✅ covered |                |
| `aria-valuemin` / `aria-valuemax`                                                                        | loading shows the dots …                                                                                                             | ✅ covered |                |
| `aria-valuetext`: custom, default, absent when idle                                                      | loading shows the dots …; is inline-block by default and uses a custom ariaValueText …                                               | ✅ covered |                |
| Title: default, custom, removed when idle                                                                | loading shows the dots …                                                                                                             | ✅ covered |                |
| Custom `ariaLabel`                                                                                       | loading shows the dots …                                                                                                             | ✅ covered |                |
| `aria-live` assertive / polite / off                                                                     | ariaLive announces the label …; sets aria-live assertive and off                                                                     | ✅ covered |                |
| Loading label displayed                                                                                  | shows the label under the dots                                                                                                       | ✅ covered |                |
| `preventWheelEvents`: added, not added, preventDefault, removed when switched off, cleaned up on destroy | ariaLive announces the label; preventWheelEvents blocks scrolling …; stops blocking wheel events when preventWheelEvents turns off … | ✅ covered |                |
| Extended directive classes                                                                               | —                                                                                                                                    | ➖ n/a     | Class only     |
| `should create`                                                                                          | —                                                                                                                                    | ➖ n/a     |                |

Registry-only coverage: block mode makes the content inert and keeps focus on the indicator, contrast colours (incl. HC theme), `prefers-reduced-motion`.

### Gaps to fill

None: all gaps are filled.
