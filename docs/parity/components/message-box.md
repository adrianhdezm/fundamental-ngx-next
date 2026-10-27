## message-box

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/message-box) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/message-box)
Registry: `registry/ui/message-box/` — 15 stories, 3 tests.

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

| Upstream behaviour                                                          | Registry test                                               | Status     | Notes                                                                                 |
| --------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| should create (all parts, w/o Router)                                       | —                                                           | ➖ n/a     |                                                                                       |
| Body CSS classes                                                            | —                                                           | ➖ n/a     | Class-only                                                                            |
| Container embeds component / template / content object                      | opens an alert dialog named by its title…                   | 🟡 partial | Object only; template and component never opened in a test                            |
| Container animation lifecycle (`_endClose$`)                                | —                                                           | ➖ n/a     | Internal animation states of upstream container                                       |
| Default box calls approve/cancel callbacks                                  | opens an alert dialog named by its title…                   | ✅ covered | Approve → `close('deleted')`; cancel callback untested                                |
| focusTrapped true/false (focus approve button, trap created)                | opens an alert dialog named by its title…                   | 🟡 partial | Initial focus on approve covered; `focusTrapped: false` not                           |
| Footer: default buttons, custom template, mobile                            | —                                                           | ❌ missing |                                                                                       |
| Header: default/custom template, semantic icon by type, projected icon wins | shows no semantic icon unless asked; opens an alert dialog… | 🟡 partial | Icon present/absent covered; type-specific glyph and projected custom icon not        |
| Close on Escape                                                             | dismisses on Escape                                         | ✅ covered |                                                                                       |
| Close on backdrop click                                                     | —                                                           | ❌ missing | Covered for DialogService in `dialog.spec.ts`, not through MessageBoxService defaults |
| Custom position and size                                                    | —                                                           | ❌ missing |                                                                                       |
| Custom classes and attributes (ariaLabel, dialogPanelClass)                 | —                                                           | ❌ missing |                                                                                       |
| Mobile mode, with and without stretch                                       | —                                                           | ❌ missing |                                                                                       |
| Closes on router navigation                                                 | —                                                           | ❌ missing | `closeOnNavigation` exists in our DialogConfig                                        |
| Service: open template/component, dismissAll                                | —                                                           | 🟡 partial | `dismissAll` only used in `afterEach`                                                 |
| Ref lifecycle: overlay removed, status on close/dismiss, result             | opens an alert dialog…; dismisses on Escape                 | 🟡 partial | `afterClosed` results covered; overlay removal not asserted                           |

Registry-only coverage: `role=alertdialog` with `aria-modal`, `aria-labelledby`/`aria-describedby` wiring.

### Gaps to fill

- **Tests:** "opens from a template and a component with data and ref"; "cancel callback dismisses with its reason"; "focusTrapped false leaves the focus on the page"; "a projected semantic icon replaces the type icon"; "each type shows its semantic glyph"; "footer renders custom content"; "dismisses on backdrop click"; "applies position, width and height"; "applies dialogPanelClass and ariaLabel"; "mobile mode fills the viewport"; "dismisses on navigation when closeOnNavigation"; "dismissAll closes every open box and removes the overlay".
- **Effort:** M — ~12 service-driven tests on an existing harness, two Open: stories.
