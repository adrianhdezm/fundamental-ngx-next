## rating-indicator

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/rating-indicator) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/rating-indicator)
Registry: `registry/ui/rating-indicator/` — 5 stories, 14 tests.

### Stories vs. upstream examples

| Upstream example                   | Registry story                         | Status     | Notes                                                                                                                                                                  |
| ---------------------------------- | -------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rating indicator examples          | `Default`                              | ✅ covered | Whole, halves, rounding (4.6 of 7), forms, disabled, non-interactive, empty. Upstream's out-of-range values (1231312312312313.99) are not shown.                       |
| Rating indicator with displayMode  | `Sizes` ("Sizes and display mode")     | ✅ covered | Display mode at every size.                                                                                                                                            |
| Custom icons                       | `Ratings` ("Ratings and custom icons") | ✅ covered | Two icon pairs.                                                                                                                                                        |
| Rating indicator sizes             | `Sizes`                                | ✅ covered | xs–lg, each also with halves and with `totalRatings` + `showDynamicText`. The `cozy`/`compact`/`condensed` size aliases were dropped (sizes are `xs`/`sm`/`md`/`lg`).  |
| Rating indicator with ratings data | `Ratings`, `Open: Votes per rating`    | ✅ covered | Average and "votes per rating" popover (opened for axe by `Open: Votes per rating`), `indicatorCapacity` 7 with ratings, and upstream's wrong ratings data (an array). |
| Playground Area                    | `Playground`                           | ✅ covered |                                                                                                                                                                        |

### Tests vs. upstream specs

| Upstream behaviour                                            | Registry test                                                                                                              | Status     | Notes                                                                                                             |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| Should create (component, pipe)                               | —                                                                                                                          | ➖ n/a     |                                                                                                                   |
| Halves are selectable                                         | rates halves by clicking the first half of a star                                                                          | ✅ covered |                                                                                                                   |
| Compact icon (size)                                           | sizes the icons with size                                                                                                  | ✅ covered | Compact alias dropped; each of `xs`/`sm`/`md`/`lg` sets the icon size.                                            |
| Custom rating icons                                           | uses custom rated and unrated icons                                                                                        | ✅ covered |                                                                                                                   |
| Emits ratingChanged on select                                 | rates with the keyboard; emits ratingChanged on a click                                                                    | ✅ covered | Keyboard and click emissions; the same rating again emits nothing.                                                |
| Indicator capacity (custom, with halves, 0 → 5)               | sets the maximum with indicatorCapacity and falls back to 5 for 0                                                          | ✅ covered |                                                                                                                   |
| Value after click on a star                                   | rates halves by clicking …                                                                                                 | ✅ covered |                                                                                                                   |
| Ratings data: average and rating items                        | shows the average and the number of votes of ratings; lists the votes per rating in a named popover with displayAllRatings | ✅ covered | The votes popover was a `dialog` without a name (axe `aria-dialog-name`); it is now named by `totalRatingsLabel`. |
| CVA setDisabledState                                          | disables the rating with a disabled form control                                                                           | ✅ covered | tabindex -1, `aria-disabled`, no change on click or keys.                                                         |
| CVA writeValue                                                | rounds values to whole or half stars                                                                                       | ✅ covered |                                                                                                                   |
| Parses half values with allowHalves                           | rounds values to whole or half stars                                                                                       | ✅ covered |                                                                                                                   |
| Computes CSS classes                                          | —                                                                                                                          | ➖ n/a     | Class-name check.                                                                                                 |
| Star label text "n of max" incl. halves and edge cases (pipe) | is a slider with the rating as its value; shows half values in the value text; sets the maximum…                           | ✅ covered | Per-star labels replaced by the slider's `aria-valuetext` ("3.5 of 5", "3.5 of 4"); a 0 capacity falls back to 5. |
| Label translation                                             | puts dynamicTextIndicator between the rating and the maximum                                                               | ✅ covered | Our equivalent is `dynamicTextIndicator` ("2 von 5").                                                             |

Registry-only coverage: slider role and ARIA values, Home/End/arrow/digit keys, display mode read-only (`aria-readonly`).

### Gaps to fill

- None left: stories and tests are at parity with upstream.
