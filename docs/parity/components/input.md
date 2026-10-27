## input

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/input) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/form/form-control)
Registry: `registry/ui/input/` — 8 stories, 9 tests.

Also covers the upstream [textarea docs](https://sap.github.io/fundamental-ngx/#/core/textarea) (same `fdFormControl` directive).

### Stories vs. upstream examples

| Upstream example                      | Registry story                 | Status     | Notes                                                                                                                                    |
| ------------------------------------- | ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Input                                 | `Examples`, `Playground`       | ✅ covered | Default, required, password, plus compact and number without spinner.                                                                    |
| Input with Inline Help Elements       | `InlineHelp`                   | ✅ covered | After and before placement.                                                                                                              |
| Input States with Messages Components | `States`, `ValueStateMessages` | ✅ covered | All states, read-only, disabled, and message groups (focus and hover). `Open: value state message` opens the rich error message for axe. |
| Reactive Form Input                   | `ReactiveForms`                | ✅ covered | Upstream has four controls (two enabled, two disabled); ours one of each.                                                                |
| Textarea                              | `Textarea`                     | ✅ covered | Default, required with rows, compact, read-only.                                                                                         |
| Textarea with Inline Help Elements    | —                              | ❌ missing | Only inputs get an inline-help label.                                                                                                    |
| Textarea States                       | `Textarea`                     | 🟡 partial | Only an error state with message and read-only; upstream shows success/information/warning/error messages and a disabled textarea.       |
| Reactive Form Textarea                | —                              | ❌ missing | `ReactiveForms` uses inputs only.                                                                                                        |

### Tests vs. upstream specs

| Upstream behaviour                                                                 | Registry test                         | Status     | Notes                                                                          |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| FormControl: should create                                                         | —                                     | ➖ n/a     |                                                                                |
| FormControl: input vs. textarea get their own styling                              | styles textareas as multi-line fields | ✅ covered | Asserted as layout/visual outcome instead of `fd-input`/`fd-textarea` classes. |
| FormControl: compact content density                                               | compact density makes the field lower | ✅ covered |                                                                                |
| Other core form specs (label, item, group, header, legend, message group, service) | (form spec)                           | ➖ n/a     | Assessed in the `form` report, which owns those parts.                         |

Registry-only coverage: ngModel and reactive forms including disable(), aria-invalid only for errors with state colours, message shown on focus and linked via aria-describedby, native readonly and disabled behaviour, noNumberSpinner.

### Gaps to fill

- **Stories:** `TextareaInlineHelp` — textarea with an inline-help label; `TextareaStates` — success/information/warning/error textareas with messages plus disabled and read-only; `TextareaReactiveForms` — textarea bound with `formControlName`, enabled and disabled.
- **Tests:** "textarea works with reactive forms, including disable()" (only if the existing reactive test does not include a textarea).
- **Effort:** S, stories only, plus at most one test.
