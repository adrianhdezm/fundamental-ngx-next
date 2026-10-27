## step-input

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/step-input) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/step-input)
Registry: `registry/ui/step-input/` — 5 stories, 8 tests.

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

| Upstream behaviour                                                | Registry test                                           | Status     | Notes                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| should create                                                     | —                                                       | ➖ n/a     |                                                                                                |
| Buttons increment/decrement by click and by keyboard, custom step | steps with the buttons and disables them at the limits  | 🟡 partial | Click covered; Enter/Space on the buttons and a custom integer `step` are not.                 |
| onFocusIn / onFocusOut events                                     | —                                                       | ❌ missing | Outputs exist in `step-input.ts`.                                                              |
| Compact mode                                                      | —                                                       | ❌ missing |                                                                                                |
| Semantic state                                                    | —                                                       | ❌ missing | No check of `aria-invalid` for `error` or the state border colour.                             |
| Title attributes and custom button icons                          | —                                                       | ❌ missing | `title` on buttons and `inputTitle` on the input, `incrementButtonIcon`/`decrementButtonIcon`. |
| Unit                                                              | describes the input with the unit…                      | ✅ covered | Via `aria-describedby`.                                                                        |
| id and aria-label attributes                                      | is a spin button with the value and its limits          | 🟡 partial | `aria-controls` equals the input id, but `inputId` and `ariaLabel` inputs are not asserted.    |
| Parse formatted value                                             | parses typed text in the locale…                        | ✅ covered |                                                                                                |
| Limit to min/max on change                                        | parses typed text in the locale and limits it on change | ✅ covered |                                                                                                |
| Floating point precision                                          | adds decimal steps without floating point noise         | ✅ covered |                                                                                                |
| Mouse wheel steps only while focused                              | —                                                       | ❌ missing | Also `disableWheel`.                                                                           |
| CVA writes only null or valid numbers                             | starts an empty value at the minimum                    | 🟡 partial | null covered; writing a non-numeric value is not.                                              |
| CVA disabled state                                                | —                                                       | ❌ missing | No `control.disable()` test.                                                                   |
| ArrowUp/ArrowDown                                                 | steps with the keyboard                                 | ✅ covered | Also Home/End; Page Up/Down untested.                                                          |
| Buttons with a null value; value at max then cleared              | starts an empty value at the minimum                    | 🟡 partial | Max-then-cleared case missing.                                                                 |

Registry-only coverage: spinbutton ARIA values, buttons disabled at limits with focus kept in the input, button hold auto-repeat, touched on blur, Home/End.

### Gaps to fill

- **Tests:** "Enter and Space on the buttons step the value"; "a custom step of 5 steps by 5"; "emits onFocusIn and onFocusOut"; "compact density makes the field smaller"; "error state sets aria-invalid and the state border colour"; "buttons carry title attributes and custom icons"; "inputId and ariaLabel land on the input"; "the wheel steps only while focused and not with disableWheel"; "writeValue ignores non-numeric values"; "disable() disables the input and both buttons"; "Page Up and Page Down step by ten steps"; "clearing a value at max and incrementing starts from the minimum"; "currency mode formats and parses EUR"; "readonly hides the buttons and blocks typing".
- **Effort:** M, many small specs on the existing host.
