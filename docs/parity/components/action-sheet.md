## action-sheet

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/action-sheet) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/action-sheet)
Registry: `registry/ui/action-sheet/` — 4 stories, 8 tests (4 its run for popover and mobile).

### Stories vs. upstream examples

| Upstream example     | Registry story                                                | Status     | Notes                                                                                                                               |
| -------------------- | ------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Default Action Sheet | Default ("Action sheet") + OpenDefault ("Open: action sheet") | ✅ covered | Same actions (Search, Download, Accept, Reject, Decide later); ours also shows a disabled action and a live "action performed" line |
| Compact mode.        | Default via the density toolbar                               | ✅ covered | No dedicated story; `fdCompact` is replaced by the global density switcher (`data-density` on `<html>`)                             |
| Mobile view.         | Mobile + OpenMobile ("Open: mobile")                          | ✅ covered | Control title and negative Cancel close button present; heading level stays at default 2 (upstream uses 3), cosmetic                |

### Tests vs. upstream specs

| Upstream behaviour                                                                                      | Registry test | Status     | Notes                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------- | ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tab in the body is prevented, emits `tabKeyPressed` and closes the sheet (desktop, mobile, integration) | —             | ❌ missing | Source handles it (`ActionSheetBody.onKeydown`: Tab → `preventDefault` + `close()`), but no spec presses Tab; the `tabKeyPressed` output itself is not ported |
| `should create`                                                                                         | —             | ➖ n/a     |                                                                                                                                                               |

Registry-only coverage: opens as `role=menu` with the label and focuses the first action, arrow keys skip disabled actions and wrap, End jumps, Escape closes and restores focus to the control, close-button items close; every case runs in both popover and mobile mode.

### Gaps to fill

- **Stories:** none.
- **Tests:** "closes on Tab and returns the focus to the control" (popover and mobile, inside the existing loop); optional: "mobile mode shows the control title as a heading of the given level".
- **Effort:** S, one test added to the existing loop.
