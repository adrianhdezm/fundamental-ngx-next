## progress-indicator

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/progress-indicator) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/progress-indicator)
Registry: `registry/ui/progress-indicator/` — 5 stories, 4 tests.

### Stories vs. upstream examples

| Upstream example              | Registry story            | Status     | Notes                                                                                                                              |
| ----------------------------- | ------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Default Progress Indicator    | `Values` (+ `Playground`) | ✅ covered | 0/42/69/100 and a custom "80 of 100 MB" text; the `unit` input itself is not used in any story (upstream passes `unit="MB"`).      |
| Progress Indicator States     | `States`                  | ✅ covered | All five states; upstream's negative one also has a custom text, irrelevant.                                                       |
| Progress Indicator Truncation | `Truncation`              | 🟡 partial | Truncated text shown, but the click-to-open popover is never opened: no "Open: …" story, so the a11y run never checks the popover. |
| Progress Indicator Animation  | `Animation`               | ✅ covered | Interactive +/-10 buttons with `animate`; upstream also shows a non-animated bar side by side (cosmetic).                          |

### Tests vs. upstream specs

| Upstream behaviour                              | Registry test                    | Status     | Notes                                             |
| ----------------------------------------------- | -------------------------------- | ---------- | ------------------------------------------------- |
| Should create                                   | —                                | ➖ n/a     |                                                   |
| Calculates the progress bar width from valueNow | is a progress bar with its value | ✅ covered | Also checks aria-valuenow/min/max/text and label. |

Registry-only coverage: ARIA progressbar attributes, custom value text, zero-width at 0, state icon, truncated text popover on click.

### Gaps to fill

- **Stories:** `Open: Truncation popover` — the truncated label clicked in `play` so axe checks the popover; optionally add a `unit="MB"` bar to `Values`.
- **Tests:** "computes the width relative to valueMin and valueMax (e.g. 3 of 1..5 = 50%)"; "appends the unit to the default value text"; "clamps the width to 100% when valueNow exceeds valueMax" (current test sets 150 but never asserts the width); "names the bar with ariaLabelledBy"; "animate adds a width transition".
- **Effort:** S — one play-story and a few small assertions on an existing host.
