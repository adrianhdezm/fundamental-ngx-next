## slider

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/slider) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/slider)
Registry: `registry/ui/slider/` — 7 stories, 16 tests.

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
| Vertical slider (range + editable tooltip + ticks; range with custom values) | `Vertical`          | ✅ covered | Also the vertical range with an editable tooltip and ticks, and a range with ten custom day values.                                            |
| Playground Area                                                              | `Playground`        | ✅ covered |                                                                                                                                                |

### Tests vs. upstream specs

| Upstream behaviour                                                                   | Registry test                                                                                              | Status     | Notes                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| should create                                                                        | —                                                                                                          | ➖ n/a     |                                                             |
| Cozy density: consumes density, large handles                                        | cozy makes the handles larger                                                                              | ✅ covered |                                                             |
| Vertical state                                                                       | vertical slider is aria-orientation vertical, fills from the bottom and steps with Up/Down                 | ✅ covered | Also a track press measured from the bottom.                |
| Dragging the range group moves both handles                                          | dragging the range between the handles moves both                                                          | ✅ covered | Pointer drag; also stops at the end keeping the range size. |
| Pointer position to value: centre, fractional step (-0.8), clamps outside left/right | a pointer beyond either end clamps to min or max; steps of 0.2 produce values without floating point noise | ✅ covered |                                                             |
| Tick marks and labels count (11/11, 11/6 with tickmarksBetweenLabels)                | shows a tick per step and a label every tickmarksBetweenLabels ticks                                       | ✅ covered |                                                             |
| Custom values labels                                                                 | works with custom values                                                                                   | ✅ covered | Also checks `aria-valuetext` and keyboard step.             |
| Range: two handles, second handle can pass the first                                 | range handles can cross and the value stays sorted                                                         | ✅ covered |                                                             |
| Disabled                                                                             | follows the disabled state of the form control                                                             | ✅ covered | Checks `tabindex=-1` and `aria-disabled`.                   |

Registry-only coverage: ARIA slider attributes, full keyboard map (step, Shift jump, Home/End), focus moves to the handle on track press, range group `aria-label`, readonly tooltip on hover/focus, editable tooltip (Enter, invalid input), RTL position, arrows and pointer.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** M, about ten pointer/keyboard specs on an existing host plus one story.
