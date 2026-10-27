## progress-indicator

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/progress-indicator) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/progress-indicator)
Registry: `registry/ui/progress-indicator/` — 6 stories, 8 tests.

### Stories vs. upstream examples

| Upstream example              | Registry story                           | Status     | Notes                                                                                                     |
| ----------------------------- | ---------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| Default Progress Indicator    | `Values` (+ `Playground`)                | ✅ covered | 0/42/69/100, a custom "80 of 100 MB" text and a `unit="MB"` bar.                                          |
| Progress Indicator States     | `States`                                 | ✅ covered | All five states; upstream's negative one also has a custom text, irrelevant.                              |
| Progress Indicator Truncation | `Truncation`, `Open: Truncation popover` | ✅ covered | The Open story clicks the truncated text so the a11y run checks the popover (now named with the text).    |
| Progress Indicator Animation  | `Animation`                              | ✅ covered | Interactive +/-10 buttons with `animate`; upstream also shows a non-animated bar side by side (cosmetic). |

### Tests vs. upstream specs

| Upstream behaviour                                                                  | Registry test                                                                                                                                                                | Status     | Notes                                             |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------- |
| Should create                                                                       | —                                                                                                                                                                            | ➖ n/a     |                                                   |
| Calculates the progress bar width from valueNow                                     | is a progress bar with its value                                                                                                                                             | ✅ covered | Also checks aria-valuenow/min/max/text and label. |
| Width relative to valueMin/valueMax, clamped to 100%, unit, ariaLabelledBy, animate | computes the width relative to valueMin and valueMax; shows a text and clamps the bar; appends the unit…; names the bar with ariaLabelledBy; animate adds a width transition | ✅ covered | Registry-only inputs, no upstream spec.           |

Registry-only coverage: ARIA progressbar attributes, custom value text, zero-width at 0, state icon, truncated text popover on click.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S — one play-story and a few small assertions on an existing host.
