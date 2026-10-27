## inline-help

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/inline-help) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/inline-help)
Registry: `registry/ui/inline-help/` — 5 stories, 10 tests.

### Stories vs. upstream examples

| Upstream example                       | Registry story                                           | Status     | Notes                                                                                                                                           |
| -------------------------------------- | -------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Inline Help                            | `Default` ("Placements and states"), `Open: Inline help` | ✅ covered | Placements, long text, input host, disabled, closeOnEscape; the Open story focuses the first trigger in `play`, so axe checks the open tooltip. |
| Inline Help with Changed Trigger Event | `Triggers` ("Custom triggers")                           | ✅ covered | Click trigger on an icon and on a button with closeOnOutsideClick.                                                                              |
| Inline Help with Additional Class      | `Styled` ("Custom body class")                           | ✅ covered | `additionalBodyClass`.                                                                                                                          |
| Inline Help with Template Inside       | `Template` ("Template content")                          | ✅ covered |                                                                                                                                                 |

### Tests vs. upstream specs

| Upstream behaviour                                                                                                                        | Registry test                                                   | Status     | Notes                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| Should create                                                                                                                             | —                                                               | ➖ n/a     |                                                                                              |
| Shows on hover                                                                                                                            | opens on hover and closes when the pointer leaves               | ✅ covered |                                                                                              |
| Hides when the host element is destroyed                                                                                                  | —                                                               | ❌ missing | No test destroys the trigger while open.                                                     |
| Shows on focus                                                                                                                            | opens on focus and closes on blur, keeping focus on the trigger | ✅ covered |                                                                                              |
| Trigger class / content class on popover body                                                                                             | —                                                               | ➖ n/a     | Class-only assertions; the custom body class (`additionalBodyClass`) is not asserted either. |
| Popover inputs passed through (noArrow, closeOnNavigation, restoreFocusOnClose, fixedPosition, maxWidth, appendTo, scrollStrategy #14210) | —                                                               | ❌ missing | All these inputs exist in our directive; none are tested.                                    |
| Escape closes with closeOnEscapeKey (focused trigger, and hover without focus)                                                            | closes on Escape when closeOnEscapeKey is set                   | 🟡 partial | Focused case only; hover-only (document Escape) not covered.                                 |
| Escape does not close without closeOnEscapeKey (focused and hover)                                                                        | stays open on Escape without closeOnEscapeKey                   | 🟡 partial | Focused case only.                                                                           |

Registry-only coverage: disabled does not open, click triggers toggle, aria-describedby with off-screen copy, template content in body and SR text, placement positioning including RTL.

### Gaps to fill

- **Tests:** "the help closes when the trigger is destroyed"; "Escape closes a hover-opened help when closeOnEscapeKey is set"; "Escape leaves a hover-opened help open without closeOnEscapeKey"; "noArrow hides the arrow"; "maxWidth limits the body width"; "appendTo renders the body in the given container"; "a custom scrollStrategy is used"; "restoreFocusOnClose=false does not refocus the trigger"; "additionalBodyClass is applied to the body".
- **Effort:** M, many small overlay tests, each needs overlay timing care.
