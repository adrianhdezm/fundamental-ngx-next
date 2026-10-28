## step-input

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/step-input) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/step-input)
Registry: `registry/ui/step-input/` — 5 stories, 21 tests.

### Stories vs. upstream examples

| Upstream example                                                                                    | Registry story       | Status     | Notes                                                                                                                                           |
| --------------------------------------------------------------------------------------------------- | -------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Step Input (min/max, compact, full width, wheel disabled)                                           | `Default`            | ✅ covered | Adds read-only, disabled and no-buttons variants. `Playground` also exists.                                                                     |
| Custom configuration (fraction digits, integer, grouping, icons, min/max, step 0.5, centred text)   | `Default`, `Formats` | ✅ covered | Integers only (`maxFractionDigits=0`) and `min -10 / max 10` added to `Formats`.                                                                |
| Custom locale (es-ES, pl-PL, ar-SA)                                                                 | `Formats`            | ✅ covered | `de-DE`, `es-ES`, `pl-PL` and `ar-SA` (Arabic digits).                                                                                          |
| Input states (information, success, warning, error with message)                                    | `States`             | ✅ covered | Upstream `stateMessage` is replaced by an `fd-form-message` below the field (input dropped in our port).                                        |
| Step Input label (units kg, mm, mol)                                                                | `Formats`            | ✅ covered | One unit (`kg`).                                                                                                                                |
| Currency (EUR, JPY, USD with unit override "Grand")                                                 | `Formats`            | ✅ covered | EUR, JPY and USD with `unit="Grand"`.                                                                                                           |
| Reactive and Template Driven forms (validators min/max, ngModel, toggle disabled, readonly ngModel) | `Form`               | ✅ covered | Required control, `min 5 / max 10` control with validators and the error state, ngModel, "Toggle disabled state" and a read-only ngModel field. |

### Tests vs. upstream specs

| Upstream behaviour                                                | Registry test                                                                                      | Status     | Notes                                                                                         |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| should create                                                     | —                                                                                                  | ➖ n/a     |                                                                                               |
| Buttons increment/decrement by click and by keyboard, custom step | steps with the buttons…; steps with Enter and Space on the buttons; steps by a custom step…        | ✅ covered |                                                                                               |
| onFocusIn / onFocusOut events                                     | emits onFocusIn and onFocusOut                                                                     | ✅ covered | `onFocusIn` was declared but never emitted; it now fires on the input's focusin, as upstream. |
| Compact mode                                                      | is smaller in compact density                                                                      | ✅ covered | Field height and button width shrink.                                                         |
| Semantic state                                                    | shows the error state with aria-invalid and the invalid border colour                              | ✅ covered | Error and success border colours from the tokens.                                             |
| Title attributes and custom button icons                          | puts titles on the buttons and the input, and takes custom button icons                            | ✅ covered |                                                                                               |
| Unit                                                              | describes the input with the unit…                                                                 | ✅ covered | Via `aria-describedby`.                                                                       |
| id and aria-label attributes                                      | puts inputId and ariaLabel on the input                                                            | ✅ covered |                                                                                               |
| Parse formatted value                                             | parses typed text in the locale…                                                                   | ✅ covered |                                                                                               |
| Limit to min/max on change                                        | parses typed text in the locale and limits it on change                                            | ✅ covered |                                                                                               |
| Floating point precision                                          | adds decimal steps without floating point noise                                                    | ✅ covered |                                                                                               |
| Mouse wheel steps only while focused                              | steps with the wheel only while focused, and not with disableWheel                                 | ✅ covered |                                                                                               |
| CVA writes only null or valid numbers                             | starts an empty value at the minimum; writes only null or numbers from the form                    | ✅ covered | A non-numeric value used to clear the field; it is now ignored, as upstream.                  |
| CVA disabled state                                                | disables the input and both buttons with disable()                                                 | ✅ covered |                                                                                               |
| ArrowUp/ArrowDown                                                 | steps with the keyboard; steps by a custom step, and by ten steps with Page Up and Page Down       | ✅ covered | Also Home/End and Page Up/Down.                                                               |
| Buttons with a null value; value at max then cleared              | starts an empty value at the minimum; starts from the limit when a value at the maximum is cleared | ✅ covered |                                                                                               |

Registry-only coverage: spinbutton ARIA values, buttons disabled at limits with focus kept in the input, button hold auto-repeat, touched on blur, Home/End, EUR currency formatting and parsing, read-only blocks keys, typing and the wheel.

### Gaps to fill

- None left: stories and tests are at parity with upstream.
