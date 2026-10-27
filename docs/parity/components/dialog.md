## dialog

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/dialog) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/dialog)
Registry: `registry/ui/dialog/` — 14 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example              | Registry story                | Status     | Notes                                                                      |
| ----------------------------- | ----------------------------- | ---------- | -------------------------------------------------------------------------- |
| Template Based Dialog         | TemplateBased, OpenTemplate   | ✅ covered |                                                                            |
| Form                          | —                             | ❌ missing | Upstream: dialog with a form-layout grid, required inputs and checkboxes   |
| Component Based Dialog        | ComponentBased, OpenComponent | ✅ covered | Draggable, resizable, full screen, stacked                                 |
| Object Based Dialog           | ObjectBased, OpenObject       | ✅ covered |                                                                            |
| Dialog State                  | States, OpenLoading           | ✅ covered | Close/dismiss/hide/loading                                                 |
| Dialog Configuration          | Configuration                 | ✅ covered | Draggable, resizable, Escape disabled                                      |
| Label dialog automatically    | all stories                   | ✅ covered | Every story relies on `fd-dialog-title` auto-labelling; no dedicated story |
| Dialog Positioning            | Position                      | ✅ covered | Bottom-right only                                                          |
| Dialog On Mobile Devices      | Mobile                        | ✅ covered | No "Open: mobile" story                                                    |
| Complex Dialog                | Complex, OpenComplex          | ✅ covered | Bar header, search subheader, selectable list, footer total                |
| Stacked Dialogs               | ComponentBased                | ✅ covered | "Open another dialog" button                                               |
| Custom Backdrop and Container | Backdrop                      | ✅ covered | Custom backdrop, container, static dialog                                  |
| Dialog with inner popovers    | —                             | ❌ missing | Upstream: two `fd-multi-input` overlays inside a dialog                    |
| Full screen toggler           | ComponentBased                | ✅ covered |                                                                            |
| Playground Area               | —                             | ❌ missing | No Playground story with config controls                                   |

Open stories open on load (`autoOpen`) rather than in `play`, which still lets axe check them.

### Tests vs. upstream specs

| Upstream behaviour                                                        | Registry test                                                  | Status     | Notes                                                                         |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Body shows the loading state                                              | hides, shows a loader and toggles full screen…                 | ✅ covered | Checks `role=progressbar`                                                     |
| Body/header/footer CSS classes, button classes                            | —                                                              | ➖ n/a     | Class-only                                                                    |
| `should create` (all parts), create without Router                        | —                                                              | ➖ n/a     |                                                                               |
| Container animation lifecycle (void/visible/hidden, `_endClose$`)         | —                                                              | ➖ n/a     | Animation internals; removal after close is covered                           |
| Opens from a template                                                     | is a labelled modal…                                           | ✅ covered |                                                                               |
| Opens from a component                                                    | —                                                              | ❌ missing | Only stories use a component-based dialog                                     |
| Object dialog: footer present/absent, callbacks                           | builds a dialog from an object with its footer buttons         | 🟡 partial | Footer present + callbacks; no-footer case untested                           |
| Custom header and footer templates                                        | is a labelled modal…; dismisses on Escape…                     | ✅ covered | Host uses custom header/footer                                                |
| `dismissAll`                                                              | — (used in afterEach)                                          | 🟡 partial | Never asserted                                                                |
| Ref lifecycle: status after close/dismiss, result signal, overlay cleanup | is a labelled modal…; dismisses on Escape…                     | 🟡 partial | `dismissed` status and removal checked; `closed` status and result signal not |
| Hide dialog                                                               | hides, shows a loader…                                         | ✅ covered |                                                                               |
| Closes on Escape                                                          | dismisses on Escape unless escKeyCloseable is false            | ✅ covered |                                                                               |
| Closes on backdrop click                                                  | dismisses on a backdrop click only when backdropClickCloseable | ✅ covered |                                                                               |
| Custom position                                                           | —                                                              | ❌ missing | `position` config                                                             |
| Custom size (width/height/min/max)                                        | —                                                              | ❌ missing |                                                                               |
| Custom classes (panel/backdrop)                                           | —                                                              | ❌ missing | `backdropClass` shown in a story only                                         |
| Mobile mode, with and without stretch (header mobile layout)              | —                                                              | ❌ missing |                                                                               |
| Draggable                                                                 | —                                                              | ❌ missing | `cdkDrag` via the header handle                                               |
| Resizable                                                                 | —                                                              | ❌ missing | Resize handle and `aria-description="Resizable"`                              |
| Custom attributes (ariaLabel, ariaDescribedBy, role)                      | —                                                              | ❌ missing | Only aria-labelledby/aria-modal tested                                        |
| Closes on router navigation start                                         | —                                                              | ❌ missing | `closeOnNavigation` exists in config                                          |

Registry-only coverage: focus trap (Tab cycling), focus returns to the trigger, stacked dialogs dim the page once, full-screen width, object dialog focuses the approve button.

### Gaps to fill

- **Stories:** "Form" — dialog with a form-layout grid, required fields and checkboxes, Save/Cancel; "Inner popovers" — dialog with a select/combobox/multi-input whose overlay opens above the dialog, plus "Open: inner popover"; "Playground" — controls for width, draggable, resizable, mobile, backdropClickCloseable; "Open: mobile" — mobile dialog opened on load.
- **Tests:** "opens a component and injects its DialogRef and data"; "object dialog without buttons renders no footer"; "dismissAll closes every open dialog"; "close() sets status closed and exposes the result"; "places the dialog at the configured position"; "applies width, height and min/max sizes"; "applies dialogPanelClass and backdropClass"; "mobile mode fills the viewport, mobileOuterSpacing keeps a margin"; "drags by the header when draggable"; "resizes with the handle when resizable and announces it"; "applies ariaLabel and ariaDescribedBy from the config"; "dismisses on router navigation when closeOnNavigation".
- **Effort:** M, about 12 straightforward config tests plus three stories.
