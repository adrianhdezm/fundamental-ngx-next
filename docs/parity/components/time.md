## time

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/time) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/time)
Registry: `registry/ui/time/` — 2 stories, 8 tests.

### Stories vs. upstream examples

| Upstream example                  | Registry story     | Status     | Notes                                                                            |
| --------------------------------- | ------------------ | ---------- | -------------------------------------------------------------------------------- |
| 24-Hour Clock                     | `Basic`            | ✅ covered |                                                                                  |
| 12-Hour Clock                     | `Basic`            | ✅ covered | Combined with two digits and no seconds; upstream shows it compact with seconds. |
| No Spinners                       | `Basic`            | ✅ covered | Combined with hours only.                                                        |
| Sizes (compact, tablet)           | `Options`          | 🟡 partial | Compact shown; `tablet` is not.                                                  |
| Programmatically Changed Time     | —                  | ❌ missing | No button setting the hour from outside.                                         |
| Clock Without Seconds             | `Basic`, `Options` | ✅ covered |                                                                                  |
| Clock Without Minutes and Seconds | `Basic`            | ✅ covered |                                                                                  |
| Time With Two Digits              | `Basic`            | ✅ covered |                                                                                  |
| Time in Reactive Form             | `Options`          | 🟡 partial | Only a disabled `ngModel` control; no reactive form with value/touched shown.    |
| Time with Minute Steps            | `Options`          | ✅ covered | Step 15; upstream also lists other steps with a 12-hour clock.                   |

### Tests vs. upstream specs

| Upstream behaviour                                               | Registry test                                                          | Status     | Notes                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| should create (time, time column)                                | —                                                                      | ➖ n/a     |                                                                                  |
| Column: pick on active change                                    | picks a clicked value and steps with the spinner buttons               | ✅ covered |                                                                                  |
| Column: scroll up/down, wrapping at both ends                    | changes the active column with Up and Down, wrapping around            | ✅ covered |                                                                                  |
| Column: change from the carousel (drag), meridian without offset | —                                                                      | ❌ missing | No drag or wheel test.                                                           |
| Column: margins on first/last item when not looping              | —                                                                      | ➖ n/a     | Internal carousel offset styling.                                                |
| Builds hours, minutes, seconds and meridian items                | shows spinbutton columns…; splits the day into periods…; steps minutes | ✅ covered |                                                                                  |
| Keeps active view items up to date                               | writes, reads and disables                                             | ✅ covered | `writeValue` updates the column.                                                 |
| Period follows hour changes and hour follows period changes      | splits the day into periods with a 12-hour clock                       | 🟡 partial | Period → hour covered; stepping the hour across 11/12 to flip the period is not. |

Registry-only coverage: spinbutton ARIA, Left/Right between columns, typed digits and A/P, minute step window, disabled control blocks keys.

### Gaps to fill

- **Stories:** `Programmatic` (button "Set hours to 11" updating `[(time)]`); add a `tablet` example to `Options`; `ReactiveForm` (a `formControlName` time with value and touched shown).
- **Tests:** "stepping hours from 11 to 12 switches AM to PM"; "dragging a column changes the value"; "the mouse wheel steps the active column"; "Page Up, Page Down, Home and End move within a column"; "spinnerButtons=false hides the buttons"; "tablet makes the columns larger"; "marks the control touched when focus leaves".
- **Effort:** M, pointer/wheel specs plus three stories.
