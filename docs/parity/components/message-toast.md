## message-toast

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/message-toast) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/message-toast)
Registry: `registry/ui/message-toast/` — 1 story, 3 tests.

### Stories vs. upstream examples

| Upstream example       | Registry story | Status     | Notes                                                                                                                                         |
| ---------------------- | -------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Message Toast          | Default        | 🟡 partial | String, component, template, animated, hide all — but toasts are overlays and there is no "Open: …" story, so the a11y run never sees a toast |
| Message Toast Position | Default        | 🟡 partial | Six placements, custom position and bound-to-element buttons; no Open: story                                                                  |

### Tests vs. upstream specs

| Upstream behaviour                                    | Registry test                                                   | Status     | Notes                                                                                                    |
| ----------------------------------------------------- | --------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| should create service                                 | —                                                               | ➖ n/a     |                                                                                                          |
| open() with a string                                  | announces a string message and disappears after its duration    | ✅ covered | role=alert                                                                                               |
| open() with a component and data                      | renders components with their data and stays open while hovered | ✅ covered |                                                                                                          |
| open() with a template                                | —                                                               | ❌ missing |                                                                                                          |
| Custom configuration                                  | stacks toasts at a position…; announces a string message…       | 🟡 partial | duration and placement covered; maxWidth, animated, custom `{top,left}` and `boundTo` positions untested |
| openFromString / openFromComponent / openFromTemplate | —                                                               | ➖ n/a     | Our service has a single `open()`                                                                        |
| hasOpenMessageToasts, hideAll, several open at once   | stacks toasts at a position and closes them all                 | ✅ covered | Plus `openCount`                                                                                         |
| Ref afterOpened()                                     | —                                                               | ❌ missing |                                                                                                          |
| Ref afterDismissed()                                  | announces a string message…                                     | ✅ covered |                                                                                                          |
| Ref dismiss() manually                                | —                                                               | ❌ missing |                                                                                                          |
| Auto-dismiss after duration                           | announces a string message…                                     | ✅ covered |                                                                                                          |

Registry-only coverage: hover persistence (mousePersist), stacking order per position.

### Gaps to fill

- **Stories:** "Open: message toast" (play() opens a string toast with `duration: 0`); "Open: positions" (one toast per placement).
- **Tests:** "opens a toast from a template with its data"; "afterOpened emits once the toast is shown"; "ref.dismiss() closes the toast and emits afterDismissed"; "a custom top/left position places the toast there"; "boundTo places the toast next to the element"; "maxWidth limits the toast width".
- **Effort:** S — service tests on the existing harness plus two Open: stories.
