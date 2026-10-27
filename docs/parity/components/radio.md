## radio

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/radio) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/radio)
Registry: `registry/ui/radio/` — 3 stories, 10 tests.

### Stories vs. upstream examples

| Upstream example             | Registry story                                 | Status     | Notes                                                                                                                                                                                                                                |
| ---------------------------- | ---------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Radio Button States          | `Examples`, `States`                           | 🟡 partial | Basic, disabled, inline, all states and compact states are there (plus one read-only option). Upstream's "States disabled mode" (every state disabled) and "States in read only mode" (every state read-only) fieldsets are missing. |
| Radio Button Reactive Forms  | —                                              | ❌ missing | No story with `formControlName`, the value/touched/dirty/valid read-out, or a disabled form control.                                                                                                                                 |
| Radio Button Text Truncation | `Truncation` ("Label wrapping and truncation") | ✅ covered | Truncated, `wrapLabel`, and `wrapLabel` + `valignLabel="top"`.                                                                                                                                                                       |

### Tests vs. upstream specs

| Upstream behaviour                                    | Registry test                                                 | Status     | Notes                                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| Should create (both specs)                            | —                                                             | ➖ n/a     |                                                                                                                           |
| Template form: has the value, checks the second radio | works with ngModel …                                          | ✅ covered | Model to view and click to model.                                                                                         |
| Reactive form: has the value, checks the second radio | works with reactive forms, including disable()                | ✅ covered |                                                                                                                           |
| Has the correct state                                 | error state sets aria-invalid; every state colours the circle | ✅ covered | Checks ARIA and the colour per state instead of the input value.                                                          |
| Is disabled                                           | a disabled radio cannot be selected and is dimmed             | ✅ covered |                                                                                                                           |
| Read-only: aria-readonly and aria-description         | readOnly keeps the value, stays focusable …                   | ✅ covered | We set native `readonly` + `aria-description`, not `aria-readonly` (not a supported attribute on role radio); deliberate. |
| Non-read-only radio has no aria-description           | —                                                             | ❌ missing | Trivial assertion.                                                                                                        |

Registry-only coverage: `selectedValue` without a form, arrow-key roving selection (skipping disabled), focus kept on read-only, checked dot, compact size.

### Gaps to fill

- **Stories:** `Reactive form` — `formControlName` radios with value/touched/dirty/valid read-out and a second group whose control is disabled; extend `States` with "States disabled" and "States read-only" fieldsets.
- **Tests:** "a radio that is not read-only has no aria-description".
- **Effort:** S — one story and one assertion.
