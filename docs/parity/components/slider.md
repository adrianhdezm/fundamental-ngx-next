## slider

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/slider) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/slider)
Registry: `registry/ui/slider/` — 7 stories, 6 tests.

### Stories vs. upstream examples

| Upstream example                                                             | Registry story      | Status     | Notes                                                                                                                                          |
| ---------------------------------------------------------------------------- | ------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Basic (default, negative min, step 5, step 0.2)                              | `Basic`             | ✅ covered | Same four sliders.                                                                                                                             |
| Tooltip (readonly; editable with min -50 / max 50)                           | `TicksAndLabels`    | ✅ covered | Readonly and editable tooltips shown. `Open: Editable tooltip` focuses a handle so the a11y run checks the editable inputs (single and range). |
| Ticks Marks and Labels                                                       | `TicksAndLabels`    | ✅ covered | Ticks only, ticks + labels with `tickmarksBetweenLabels=2`.                                                                                    |
| Custom Values                                                                | `TicksAndLabels`    | ✅ covered | Month labels.                                                                                                                                  |
| Range (editable tooltip + ticks; custom values)                              | `Range`             | ✅ covered | Both variants.                                                                                                                                 |
| Disabled                                                                     | `Basic`             | ✅ covered | Disabled slider row.                                                                                                                           |
| Cozy                                                                         | `Basic`, `Vertical` | ✅ covered |                                                                                                                                                |
| Slider in a Reactive Form                                                    | `Form`              | ✅ covered | Shows value, touched and dirty; not `valid`.                                                                                                   |
| Vertical slider (range + editable tooltip + ticks; range with custom values) | `Vertical`          | 🟡 partial | Vertical range exists, but neither the editable tooltip with ticks nor the custom-values range is shown vertically.                            |
| Playground Area                                                              | `Playground`        | ✅ covered |                                                                                                                                                |

### Tests vs. upstream specs

| Upstream behaviour                                                                   | Registry test                                                     | Status     | Notes                                                                                       |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| should create                                                                        | —                                                                 | ➖ n/a     |                                                                                             |
| Cozy density: consumes density, large handles                                        | —                                                                 | ❌ missing | No test of `cozy` handle size.                                                              |
| Vertical state                                                                       | —                                                                 | ❌ missing | No vertical test (orientation, bottom-up position, Up/Down keys).                           |
| Dragging the range group moves both handles                                          | moves the handles of a range separately and together              | 🟡 partial | Covered with the keyboard on the group, not with a pointer drag.                            |
| Pointer position to value: centre, fractional step (-0.8), clamps outside left/right | sets the value from a press on the track and a drag of the handle | 🟡 partial | Track press and handle drag covered; fractional steps and clamping beyond the ends are not. |
| Tick marks and labels count (11/11, 11/6 with tickmarksBetweenLabels)                | —                                                                 | ❌ missing |                                                                                             |
| Custom values labels                                                                 | works with custom values                                          | ✅ covered | Also checks `aria-valuetext` and keyboard step.                                             |
| Range: two handles, second handle can pass the first                                 | moves the handles of a range separately and together              | 🟡 partial | Two handles checked; crossing the handles is not.                                           |
| Disabled                                                                             | follows the disabled state of the form control                    | ✅ covered | Checks `tabindex=-1` and `aria-disabled`.                                                   |

Registry-only coverage: ARIA slider attributes, full keyboard map (step, Shift jump, Home/End), focus moves to the handle on track press, range group `aria-label`.

### Gaps to fill

- **Stories:** extend `Vertical` with the custom-values range and an editable tooltip with ticks.
- **Tests:** "cozy makes the handles larger"; "vertical slider is aria-orientation vertical, fills from the bottom and steps with Up/Down"; "dragging the range between the handles moves both"; "a pointer beyond either end clamps to min or max"; "steps of 0.2 produce values without floating point noise"; "shows a tick per step and a label every tickmarksBetweenLabels ticks"; "range handles can cross and the value stays sorted"; "readonly tooltip shows the value on hover and focus"; "editable tooltip sets the value on Enter"; "RTL mirrors the handle position and arrow keys".
- **Effort:** M, about ten pointer/keyboard specs on an existing host plus one story.
