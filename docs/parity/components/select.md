## select

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/select) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/select)
Registry: `registry/ui/select/` — 12 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                | Registry story                                     | Status     | Notes                                                                                                                           |
| ------------------------------- | -------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Select Modes                    | `Modes`                                            | ✅ covered | Default, compact, disabled, read-only (plus a disabled option).                                                                 |
| Select Semantic States          | `States`                                           | ✅ covered | All four states with messages and the long-text success, plus the form message shown on hover by `fd-form-input-message-group`. |
| Custom Control Content          | `RichOptions` ("Groups, icons and custom trigger") | ✅ covered | `controlTemplate`.                                                                                                              |
| Extended Options                | `RichOptions`                                      | ✅ covered | Group headers, icons, secondary text.                                                                                           |
| Select In Mobile Mode           | `Mobile`                                           | ✅ covered | `Open: mobile` opens the dialog in `play`.                                                                                      |
| Select Max Height               | `MaxHeight` ("Max height")                         | ✅ covered | Nine options with `maxHeight="250px"`, as upstream.                                                                             |
| Adding and Removing Options     | `Programmatic`                                     | ✅ covered | Add/Remove buttons.                                                                                                             |
| Programmatic Control            | `Programmatic`                                     | ✅ covered | Change value, open, close; `closeOnOutsideClick=false`.                                                                         |
| Select In A Reactive Form       | `Forms`                                            | ✅ covered | Required control with status, disabled control toggle.                                                                          |
| Select With A Custom Comparator | `CustomComparator`                                 | ✅ covered |                                                                                                                                 |

`Open: default`, `Open: groups and icons` and `Open: mobile` open the list or the mobile dialog in `play`, so the a11y run checks them.

### Tests vs. upstream specs

| Upstream behaviour                                       | Registry test                                                  | Status     | Notes                                                                         |
| -------------------------------------------------------- | -------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Should create (all specs); key manager service internals | —                                                              | ➖ n/a     |                                                                               |
| Option exposes its element and is focusable              | —                                                              | ➖ n/a     | Options are reached through `aria-activedescendant`, not focus (deliberate).  |
| Option selectable by click                               | selects an option on click and marks it selected               | ✅ covered |                                                                               |
| Option selectable by keyboard                            | opens on click, highlights … selects with Enter                | ✅ covered |                                                                               |
| Disabled option is not selected                          | opens on click, highlights …                                   | 🟡 partial | Arrow keys skip it; clicking a disabled option is untested.                   |
| Starts closed                                            | shows the placeholder … as a combobox                          | ✅ covered | `aria-expanded=false`.                                                        |
| Consumes content density                                 | —                                                              | ❌ missing | No compact test.                                                              |
| Opens on trigger click                                   | opens on click …                                               | ✅ covered |                                                                               |
| Closes on trigger click while open                       | —                                                              | ❌ missing |                                                                               |
| Closes after selecting                                   | opens on click …; selects an option on click                   | ✅ covered |                                                                               |
| Closes on outside click                                  | —                                                              | ❌ missing | Neither the default nor `closeOnOutsideClick=false`.                          |
| Initial value selects its option                         | shows the placeholder and the selected option                  | ✅ covered |                                                                               |
| Unknown value resets to null                             | —                                                              | ❌ missing |                                                                               |
| Changing the value after init                            | shows the placeholder …; changes the value … while closed      | ✅ covered |                                                                               |
| ArrowDown/Home/End move the active option (open)         | opens on click, highlights …; changes the value … while closed | 🟡 partial | Open: ArrowDown only; Home never tested; End only while closed.               |
| Enter and Space select and close                         | opens on click … selects with Enter                            | 🟡 partial | Space untested.                                                               |
| Enter on the trigger opens                               | —                                                              | ❌ missing | Also Space/Alt+Down/F4 documented in source, untested.                        |
| Escape closes                                            | closes with Escape without changing the value                  | ✅ covered |                                                                               |
| Scrolls to the selected option on open                   | —                                                              | ❌ missing |                                                                               |
| Typeahead ("b", "bx")                                    | changes the value with the arrow keys and typing while closed  | 🟡 partial | One character while closed; multi-character and open-list typeahead untested. |
| compareWith by value                                     | —                                                              | ❌ missing |                                                                               |
| compareWith by reference keeps no selection on a copy    | —                                                              | ❌ missing |                                                                               |
| Non-function comparator throws                           | —                                                              | ➖ n/a     | Typed function input; no runtime check.                                       |
| Mobile: open, close, close on click while open           | applies the choice in mobile mode …                            | 🟡 partial | Open on click only.                                                           |
| Mobile: select and submit                                | applies the choice in mobile mode only when it is approved     | ✅ covered |                                                                               |
| Mobile: cancel keeps the old value                       | —                                                              | ❌ missing |                                                                               |
| Mobile: renders with an empty mobileConfig               | —                                                              | ❌ missing |                                                                               |

Registry-only coverage: combobox ARIA (`aria-haspopup`, `aria-activedescendant`), focus stays on the trigger, touched on blur, disabled control not opening.

### Gaps to fill

- **Tests:** "clicking a disabled option does not select it"; "compact density shrinks the control and options"; "clicking the trigger again closes the list"; "an outside click closes the list unless closeOnOutsideClick is false"; "a value not among the options shows the placeholder (value null)"; "Home and End move the active option while open"; "Space selects the active option and closes"; "Enter, Space, Alt+ArrowDown and F4 open the list"; "opening scrolls the selected option into view"; "typing several characters moves to the matching option"; "compareWith matches the selected option by value"; "the default comparator does not match a copied object"; "mobile: Cancel closes the dialog and keeps the old value"; "mobile: renders with an empty mobileConfig".
- **Effort:** M — about 14 tests on the existing host, plus two play stories.
