## message-box

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/message-box) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/message-box)
Registry: `registry/ui/message-box/` — 15 stories, 15 tests.

### Stories vs. upstream examples

| Upstream example              | Registry story                                                                | Status     | Notes                                                |
| ----------------------------- | ----------------------------------------------------------------------------- | ---------- | ---------------------------------------------------- |
| Object based message box      | Others, OpenObject                                                            | ✅ covered |                                                      |
| Template based message box    | TemplateBased, Open: type stories                                             | ✅ covered | The Open: type stories render the template-based box |
| Component based message box   | Others, OpenComponent                                                         | ✅ covered | Injects `MessageBoxRef` and data                     |
| Semantic types                | Types, OpenConfirmation, OpenError, OpenSuccess, OpenWarning, OpenInformation | ✅ covered | Every type has an Open: story                        |
| Message box positioning       | Position, OpenPosition                                                        | ✅ covered |                                                      |
| Message box on mobile devices | Mobile, OpenMobile                                                            | ✅ covered |                                                      |
| Complex template              | Others, OpenComplex                                                           | ✅ covered | Custom bar header/footer                             |

### Tests vs. upstream specs

| Upstream behaviour                                                          | Registry test                                                                                                              | Status     | Notes                                                                          |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| should create (all parts, w/o Router)                                       | —                                                                                                                          | ➖ n/a     |                                                                                |
| Body CSS classes                                                            | —                                                                                                                          | ➖ n/a     | Class-only                                                                     |
| Container embeds component / template / content object                      | opens an alert dialog named by its title…; opens from a template and a component with their data and ref                   | ✅ covered |                                                                                |
| Container animation lifecycle (`_endClose$`)                                | —                                                                                                                          | ➖ n/a     | Internal animation states of upstream container                                |
| Default box calls approve/cancel callbacks                                  | opens an alert dialog named by its title…; the cancel callback dismisses with its reason                                   | ✅ covered |                                                                                |
| focusTrapped true/false (focus approve button, trap created)                | opens an alert dialog named by its title…; focusTrapped false neither focuses the approve button nor traps the focus       | ✅ covered | Without the trap the window itself takes the focus and Tab leaves for the page |
| Footer: default buttons, custom template, mobile                            | opens an alert dialog…; the footer renders custom content in its bar areas                                                 | ✅ covered |                                                                                |
| Header: default/custom template, semantic icon by type, projected icon wins | shows no semantic icon unless asked; each type shows its semantic glyph…; a projected semantic icon replaces the type icon | ✅ covered |                                                                                |
| Close on Escape                                                             | dismisses on Escape                                                                                                        | ✅ covered |                                                                                |
| Close on backdrop click                                                     | dismisses on a backdrop click only when backdropClickCloseable                                                             | ✅ covered |                                                                                |
| Custom position and size                                                    | applies position, width and height                                                                                         | ✅ covered |                                                                                |
| Custom classes and attributes (ariaLabel, dialogPanelClass)                 | applies dialogPanelClass and ariaLabel                                                                                     | ✅ covered |                                                                                |
| Mobile mode, with and without stretch                                       | mobile mode fills the viewport, mobileOuterSpacing keeps a margin                                                          | ✅ covered | The margin needed the dialog fix for `mobileOuterSpacing`                      |
| Closes on router navigation                                                 | dismisses on navigation unless closeOnNavigation is false                                                                  | ✅ covered | Through `Location.onUrlChange` (with `provideLocationMocks`)                   |
| Service: open template/component, dismissAll                                | opens from a template and a component…; dismissAll closes every open box and removes the overlay                           | ✅ covered |                                                                                |
| Ref lifecycle: overlay removed, status on close/dismiss, result             | opens an alert dialog…; dismisses on Escape; dismissAll closes every open box and removes the overlay                      | ✅ covered |                                                                                |

Registry-only coverage: `role=alertdialog` with `aria-modal`, `aria-labelledby`/`aria-describedby` wiring.

### Gaps to fill

None: all gaps are filled.
