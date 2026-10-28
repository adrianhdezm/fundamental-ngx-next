## time-picker

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/time-picker) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/time-picker)
Registry: `registry/ui/time-picker/` — 5 stories, 16 tests.

### Stories vs. upstream examples

| Upstream example                                                  | Registry story  | Status     | Notes                                                                                 |
| ----------------------------------------------------------------- | --------------- | ---------- | ------------------------------------------------------------------------------------- |
| Default Time Picker                                               | `Basic`         | ✅ covered | `Open: Time columns` and `Open: 24-hour clock with seconds` open the popover for axe. |
| Time parsing/formatting (custom `displayFormat`, with day period) | `Basic`         | ✅ covered | 24-hour with seconds, and a `dayPeriod` format ("in the afternoon").                  |
| Disabled Time Picker                                              | `Basic`         | ✅ covered |                                                                                       |
| Compact Time Picker                                               | `Basic`         | ✅ covered | `data-density="compact"` on the picker.                                               |
| Null Validity (`allowNull=false`)                                 | `LocaleAndNull` | ✅ covered | Set to null / valid time buttons.                                                     |
| Time Picker in Form (state follows validity)                      | `Forms`         | ✅ covered | Required control with error message.                                                  |
| Time Picker Locale                                                | `LocaleAndNull` | ✅ covered | Locale select drives the adapter.                                                     |
| Minute Step (1, 5, 10, 15, 30)                                    | `Basic`         | ✅ covered | Steps 5, 10, 15 and 30 (1 is the default picker).                                     |

### Tests vs. upstream specs

| Upstream behaviour                                                               | Registry test                                                                                                              | Status     | Notes                                         |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------- |
| should create with default values                                                | —                                                                                                                          | ➖ n/a     |                                               |
| displayFormat decides the columns (meridian; seconds)                            | picks a time in the columns; shows hours, minutes and seconds without a period for a 24-hour format with seconds           | ✅ covered | 12-hour with period and 24-hour with seconds. |
| Gets the time                                                                    | writes and reads the value and validates it                                                                                | ✅ covered |                                               |
| Typed input valid / invalid                                                      | reads typed times on Enter and on blur; sets the error state for an unreadable time                                        | ✅ covered | `aria-invalid` toggles.                       |
| Empty input: null model, invalid with allowNull=false, valid with allowNull=true | writes and reads the value and validates it; keeps an empty field valid with allowNull                                     | ✅ covered |                                               |
| No onChange when blur leaves the same text or the columns emit the same time     | does not emit a change when focus leaves an unchanged field; does not emit a change when the columns pick the current time | ✅ covered | Also retyping the same time.                  |
| Input group / addon button click opens                                           | picks a time in the columns                                                                                                | ✅ covered | Button click; `aria-expanded`.                |
| Popover close                                                                    | picks a time in the columns                                                                                                | ✅ covered | Escape closes and focuses the input.          |
| Placeholder                                                                      | shows the time in the display format                                                                                       | ✅ covered |                                               |
| onChange when the columns change the time                                        | picks a time in the columns                                                                                                | ✅ covered |                                               |
| Message hidden while open, shown on close                                        | shows the message while the field has the focus; hides the message while the columns are open and shows it again on close  | ✅ covered | The open popover shows the message embedded.  |

Registry-only coverage: Alt+Down opens and focuses the hours column, a click outside closes the columns, a disabled picker does not open, Tab stays within the open columns (focus trapped, as upstream; the analyst's "Tab closes the popover" does not match upstream), locale switch reformats, disabled form control disables the input, `aria-describedby` for the message.

### Gaps to fill

- None left: stories and tests are at parity with upstream.
