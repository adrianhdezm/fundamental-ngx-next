## dialog

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/dialog) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/dialog)
Registry: `registry/ui/dialog/` — 22 stories, 19 tests.

### Stories vs. upstream examples

| Upstream example              | Registry story                  | Status     | Notes                                                                                                         |
| ----------------------------- | ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| Template Based Dialog         | TemplateBased, OpenTemplate     | ✅ covered |                                                                                                               |
| Form                          | Form, OpenForm                  | ✅ covered | Form group with layout-grid rows, required labels, a textarea; checkboxes for responsive and vertical padding |
| Component Based Dialog        | ComponentBased, OpenComponent   | ✅ covered | Draggable, resizable, full screen, stacked                                                                    |
| Object Based Dialog           | ObjectBased, OpenObject         | ✅ covered |                                                                                                               |
| Dialog State                  | States, OpenLoading             | ✅ covered | Close/dismiss/hide/loading                                                                                    |
| Dialog Configuration          | Configuration                   | ✅ covered | Draggable, resizable, Escape disabled                                                                         |
| Label dialog automatically    | all stories                     | ✅ covered | Every story relies on `fd-dialog-title` auto-labelling; no dedicated story                                    |
| Dialog Positioning            | Position, OpenPosition          | ✅ covered | Bottom-right only                                                                                             |
| Dialog On Mobile Devices      | Mobile, OpenMobile              | ✅ covered |                                                                                                               |
| Complex Dialog                | Complex, OpenComplex            | ✅ covered | Bar header, search subheader, selectable list, footer total                                                   |
| Stacked Dialogs               | ComponentBased                  | ✅ covered | "Open another dialog" button                                                                                  |
| Custom Backdrop and Container | Backdrop                        | ✅ covered | Custom backdrop, container, static dialog                                                                     |
| Dialog with inner popovers    | InnerPopovers, OpenInnerPopover | ✅ covered | Two `fd-multi-input`s; "Open: inner popover" opens one list and checks it is above the dialog                 |
| Full screen toggler           | ComponentBased                  | ✅ covered |                                                                                                               |
| Playground Area               | Playground, OpenPlayground      | ✅ covered | Controls for width, draggable, resizable, mobile, backdrop, Escape and paddings                               |

The "Open: …" stories open their dialog in `play` (they used an `autoOpen` input before).

### Tests vs. upstream specs

| Upstream behaviour                                                        | Registry test                                                                                                        | Status     | Notes                                                                                                                    |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| Body shows the loading state                                              | hides, shows a loader and toggles full screen…                                                                       | ✅ covered | Checks `role=progressbar`                                                                                                |
| Body/header/footer CSS classes, button classes                            | —                                                                                                                    | ➖ n/a     | Class-only                                                                                                               |
| `should create` (all parts), create without Router                        | —                                                                                                                    | ➖ n/a     |                                                                                                                          |
| Container animation lifecycle (void/visible/hidden, `_endClose$`)         | —                                                                                                                    | ➖ n/a     | Animation internals; removal after close is covered                                                                      |
| Opens from a template                                                     | is a labelled modal…                                                                                                 | ✅ covered |                                                                                                                          |
| Opens from a component                                                    | opens a component and injects its DialogRef and data                                                                 | ✅ covered |                                                                                                                          |
| Object dialog: footer present/absent, callbacks                           | builds a dialog from an object with its footer buttons; builds an object dialog without buttons with no footer       | ✅ covered |                                                                                                                          |
| Custom header and footer templates                                        | is a labelled modal…; dismisses on Escape…                                                                           | ✅ covered | Host uses custom header/footer                                                                                           |
| `dismissAll`                                                              | dismissAll closes every open dialog and removes the overlays                                                         | ✅ covered | Also the scroll lock                                                                                                     |
| Ref lifecycle: status after close/dismiss, result signal, overlay cleanup | close() sets the status closed and exposes the result…; dismissAll closes every open dialog and removes the overlays | ✅ covered |                                                                                                                          |
| Hide dialog                                                               | hides, shows a loader…                                                                                               | ✅ covered |                                                                                                                          |
| Closes on Escape                                                          | dismisses on Escape unless escKeyCloseable is false                                                                  | ✅ covered |                                                                                                                          |
| Closes on backdrop click                                                  | dismisses on a backdrop click only when backdropClickCloseable                                                       | ✅ covered |                                                                                                                          |
| Custom position                                                           | places the dialog at the configured position                                                                         | ✅ covered | top/left and bottom/right, strings and numbers                                                                           |
| Custom size (width/height/min/max)                                        | applies width, height and min/max sizes                                                                              | ✅ covered |                                                                                                                          |
| Custom classes (panel/backdrop)                                           | applies dialogPanelClass to the window and backdropClass to the backdrop                                             | ✅ covered |                                                                                                                          |
| Mobile mode, with and without stretch (header mobile layout)              | mobile mode fills the viewport, mobileOuterSpacing keeps a margin                                                    | ✅ covered | `mobileOuterSpacing` had no effect (the full-size minimums won over its maximums); fixed                                 |
| Draggable                                                                 | drags by the header only when draggable                                                                              | ✅ covered | Real mouse through CDP; the body is no handle                                                                            |
| Resizable                                                                 | resizes with the handle when resizable and announces it                                                              | ✅ covered | The corner follows the pointer, so the size jumps by the few pixels between the pointer and the corner on the first move |
| Custom attributes (ariaLabel, ariaDescribedBy, role)                      | applies ariaLabel and ariaDescribedBy from the config                                                                | ✅ covered |                                                                                                                          |
| Closes on router navigation start                                         | dismisses on navigation unless closeOnNavigation is false                                                            | ✅ covered | Through `Location.onUrlChange` (with `provideLocationMocks`)                                                             |

Registry-only coverage: focus trap (Tab cycling), focus returns to the trigger, stacked dialogs dim the page once, full-screen width, object dialog focuses the approve button.

### Gaps to fill

None: all gaps are filled.
