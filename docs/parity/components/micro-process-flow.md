## micro-process-flow

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/micro-process-flow) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/micro-process-flow)
Registry: `registry/ui/micro-process-flow/` — 4 stories, 4 tests.

### Stories vs. upstream examples

| Upstream example                                       | Registry story               | Status     | Notes                                                    |
| ------------------------------------------------------ | ---------------------------- | ---------- | -------------------------------------------------------- |
| Micro Process Flow                                     | Basic                        | ✅ covered | All states + intermediate step                           |
| Independent steps                                      | Basic                        | ✅ covered |                                                          |
| Status indicator icons / other controls / custom icons | OtherControls                | ✅ covered | Status indicators with custom SVG paths                  |
| Micro process flow with Popover                        | OtherControls, Open: popover | ✅ covered | "Open: popover" opens the first step's popover in play() |
| Micro process flow overflow                            | Overflow                     | ✅ covered | Default and custom transition                            |
| Objects Inserted Between Nodes                         | Basic                        | ✅ covered |                                                          |
| Custom Node width                                      | Basic                        | ✅ covered |                                                          |

### Tests vs. upstream specs

| Upstream behaviour                                                      | Registry test                                           | Status     | Notes                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------- | ---------- | --------------------------------------------------- |
| should create (all parts)                                               | —                                                       | ➖ n/a     |                                                     |
| Icon glyph and font (SAP-icons-TNT, BusinessSuiteInAppSymbols)          | —                                                       | ❌ missing | Only the icon's aria-label is asserted              |
| Item connector shown / hidden                                           | joins the steps with connectors, but not after the last | ✅ covered | Also intermediate mark and independentSteps         |
| Paginate one step forward / back                                        | shows how many steps are hidden and scrolls to them     | ✅ covered |                                                     |
| Focusable item: default / non-focusable tabindex, focused index updates | is one tab stop; Left and Right move between the steps  | ✅ covered | Roving tab stop                                     |
| Intermediary item class                                                 | —                                                       | ➖ n/a     | Class-only; rendering covered by the connector test |

Registry-only coverage: hidden-step counts on the overflow links, arrow keys scrolling a hidden step into view.

### Gaps to fill

- **Stories:** none.
- **Tests:** "icon renders its glyph in the given icon font".
- **Effort:** S — one story, one test.
