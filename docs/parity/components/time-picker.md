## time-picker

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/time-picker) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/time-picker)
Registry: `registry/ui/time-picker/` — 3 stories, 8 tests.

### Stories vs. upstream examples

| Upstream example                                                  | Registry story  | Status     | Notes                                                                      |
| ----------------------------------------------------------------- | --------------- | ---------- | -------------------------------------------------------------------------- |
| Default Time Picker                                               | `Basic`         | ✅ covered | No `Open: …` story, so axe never checks the open popover with the columns. |
| Time parsing/formatting (custom `displayFormat`, with day period) | `Basic`         | ✅ covered | 24-hour with seconds; no day-period format.                                |
| Disabled Time Picker                                              | `Basic`         | ✅ covered |                                                                            |
| Compact Time Picker                                               | —               | ❌ missing | No compact density example.                                                |
| Null Validity (`allowNull=false`)                                 | `LocaleAndNull` | ✅ covered | Set to null / valid time buttons.                                          |
| Time Picker in Form (state follows validity)                      | `Forms`         | ✅ covered | Required control with error message.                                       |
| Time Picker Locale                                                | `LocaleAndNull` | ✅ covered | Locale select drives the adapter.                                          |
| Minute Step (1, 5, 10, 15, 30)                                    | `Basic`         | ✅ covered | Step 15 only.                                                              |

### Tests vs. upstream specs

| Upstream behaviour                                                               | Registry test                                                                       | Status     | Notes                                                                  |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| should create with default values                                                | —                                                                                   | ➖ n/a     |                                                                        |
| displayFormat decides the columns (meridian; seconds)                            | picks a time in the columns                                                         | 🟡 partial | 12-hour without seconds checked; a 24-hour format with seconds is not. |
| Gets the time                                                                    | writes and reads the value and validates it                                         | ✅ covered |                                                                        |
| Typed input valid / invalid                                                      | reads typed times on Enter and on blur; sets the error state for an unreadable time | ✅ covered | `aria-invalid` toggles.                                                |
| Empty input: null model, invalid with allowNull=false, valid with allowNull=true | writes and reads the value and validates it                                         | 🟡 partial | allowNull=false covered; the allowNull=true path is not.               |
| No onChange when blur leaves the same text or the columns emit the same time     | —                                                                                   | ❌ missing |                                                                        |
| Input group / addon button click opens                                           | picks a time in the columns                                                         | ✅ covered | Button click; `aria-expanded`.                                         |
| Popover close                                                                    | picks a time in the columns                                                         | ✅ covered | Escape closes and focuses the input.                                   |
| Placeholder                                                                      | shows the time in the display format                                                | ✅ covered |                                                                        |
| onChange when the columns change the time                                        | picks a time in the columns                                                         | ✅ covered |                                                                        |
| Message hidden while open, shown on close                                        | shows the message while the field has the focus                                     | 🟡 partial | Shown on focus; hiding it while the popover is open is not checked.    |

Registry-only coverage: Alt+Down opens and focuses the hours column, locale switch reformats, disabled form control disables the input, `aria-describedby` for the message.

### Gaps to fill

- **Stories:** `Open: Time columns` (play clicks the button); add a compact picker (`data-density="compact"`) and the 5/10/30-minute steps and a day-period format to `Basic`.
- **Tests:** "a 24-hour display format with seconds shows hours, minutes and seconds without a period"; "an empty field is valid with allowNull"; "blurring without changes does not emit a change"; "picking the same time does not emit a change"; "the message hides while the columns are open and returns on close"; "clicking outside closes the popover"; "disabled picker does not open"; "Tab from the columns closes the popover".
- **Effort:** M, overlay specs plus an Open story.
