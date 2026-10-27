## message-toast

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/message-toast) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/message-toast)
Registry: `registry/ui/message-toast/` — 1 story, 3 tests.

### Stories vs. upstream examples

| Upstream example       | Registry story            | Status     | Notes                                                                                                                        |
| ---------------------- | ------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Message Toast          | Default, OpenMessageToast | ✅ covered | String, component, template, animated, hide all; "Open: message toast" opens string, component and template toasts in `play` |
| Message Toast Position | Default, OpenPositions    | ✅ covered | Six placements, custom position and bound-to-element buttons; "Open: positions" opens one toast at each                      |

### Tests vs. upstream specs

| Upstream behaviour                                    | Registry test                                                                                                                                            | Status     | Notes                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| should create service                                 | —                                                                                                                                                        | ➖ n/a     |                                                                                      |
| open() with a string                                  | announces a string message and disappears after its duration                                                                                             | ✅ covered | role=alert                                                                           |
| open() with a component and data                      | renders components with their data and stays open while hovered                                                                                          | ✅ covered |                                                                                      |
| open() with a template                                | opens a toast from a template with its data                                                                                                              | ✅ covered |                                                                                      |
| Custom configuration                                  | stacks toasts…; announces a string message…; afterOpened emits…; a custom top/left position…; boundTo places the toast…; maxWidth limits the toast width | ✅ covered | duration, placement, animated, maxWidth, custom `{top,left}` and `boundTo` positions |
| openFromString / openFromComponent / openFromTemplate | —                                                                                                                                                        | ➖ n/a     | Our service has a single `open()`                                                    |
| hasOpenMessageToasts, hideAll, several open at once   | stacks toasts at a position and closes them all                                                                                                          | ✅ covered | Plus `openCount`                                                                     |
| Ref afterOpened()                                     | afterOpened emits once the toast is shown…                                                                                                               | ✅ covered |                                                                                      |
| Ref afterDismissed()                                  | announces a string message…                                                                                                                              | ✅ covered |                                                                                      |
| Ref dismiss() manually                                | …ref.dismiss() closes it and emits afterDismissed                                                                                                        | ✅ covered |                                                                                      |
| Auto-dismiss after duration                           | announces a string message…                                                                                                                              | ✅ covered |                                                                                      |

Registry-only coverage: hover persistence (mousePersist), stacking order per position.

### Gaps to fill

None: all gaps are filled.
