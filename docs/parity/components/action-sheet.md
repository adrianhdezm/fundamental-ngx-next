## action-sheet

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/action-sheet) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/action-sheet)
Registry: `registry/ui/action-sheet/` — 4 stories, 12 tests (5 its run for popover and mobile).

### Stories vs. upstream examples

| Upstream example     | Registry story                                                | Status     | Notes                                                                                                                               |
| -------------------- | ------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Default Action Sheet | Default ("Action sheet") + OpenDefault ("Open: action sheet") | ✅ covered | Same actions (Search, Download, Accept, Reject, Decide later); ours also shows a disabled action and a live "action performed" line |
| Compact mode.        | Default via the density toolbar                               | ✅ covered | No dedicated story; `fdCompact` is replaced by the global density switcher (`data-density` on `<html>`)                             |
| Mobile view.         | Mobile + OpenMobile ("Open: mobile")                          | ✅ covered | Control title and negative Cancel close button present; heading level stays at default 2 (upstream uses 3), cosmetic                |

### Tests vs. upstream specs

| Upstream behaviour                                                                                      | Registry test                                      | Status     | Notes                                                               |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| Tab in the body is prevented, emits `tabKeyPressed` and closes the sheet (desktop, mobile, integration) | closes on Tab and returns the focus to the control | ✅ covered | Popover and mobile; the `tabKeyPressed` output itself is not ported |
| `should create`                                                                                         | —                                                  | ➖ n/a     |                                                                     |

Registry-only coverage: opens as `role=menu` with the label and focuses the first action, arrow keys skip disabled actions and wrap, End jumps, Escape closes and restores focus to the control, close-button items close; every case runs in both popover and mobile mode; the mobile title bar is a heading of `controlTitleHeading`, and the popover shows no title bar.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, one test added to the existing loop.
