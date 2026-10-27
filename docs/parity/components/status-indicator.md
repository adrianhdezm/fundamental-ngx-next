## status-indicator

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/status-indicator) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/status-indicator)
Registry: `registry/ui/status-indicator/` — 5 stories, 19 tests.

### Stories vs. upstream examples

| Upstream example                 | Registry story                 | Status     | Notes                                                    |
| -------------------------------- | ------------------------------ | ---------- | -------------------------------------------------------- |
| Status Indicator default         | `Default` ("Status and sizes") | ✅ covered | Neutral, negative, critical, positive.                   |
| Status Indicator Size            | `Default`                      | ✅ covered | sm, md, lg, xl.                                          |
| Status Indicator Fill Color Type | `Default`                      | ✅ covered | Status colours on several shapes.                        |
| Status Indicator with label      | `Labels`                       | ✅ covered | top, bottom, left, right.                                |
| Linear Filling                   | `FillTypes`                    | ✅ covered | down, up, left.                                          |
| Angled Filling                   | `FillTypes`                    | ✅ covered | 45, 90, 180, 270.                                        |
| Circular Filling Clock Wise      | `FillTypes`                    | ✅ covered |                                                          |
| Circular Filling Anti Clock Wise | `FillTypes`                    | ✅ covered |                                                          |
| Clickable                        | `Clickable`                    | ✅ covered | Click and Enter step the fill. `Playground` also exists. |

### Tests vs. upstream specs

| Upstream behaviour                       | Registry test                                                                          | Status     | Notes                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------- |
| Should create                            | —                                                                                      | ➖ n/a     |                                                |
| Status                                   | status colours the shape with the element colour and the label with the text colour    | ✅ covered | Checks the colour tokens, not just a class.    |
| Fill percentage (gradient offset)        | fills the shape to the percentage with a gradient mask; clamps the percentage to 0–100 | ✅ covered |                                                |
| Size                                     | size sm, md, lg and xl render increasing sizes; labelSize changes the label font size  | ✅ covered | Measures the rendered SVG and label font size. |
| Label (two its: label text and position) | label position before or after the shape, in a row or a column                         | ✅ covered |                                                |

Registry-only coverage: multiple shapes, unique ids, every filling type and radial direction, progressbar ARIA values, hidden SVG, focusable and clickable keyboard activation.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, one or two specs on an existing host.
