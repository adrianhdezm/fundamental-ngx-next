## checkbox

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/checkbox) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/checkbox)
Registry: `registry/ui/checkbox/` — 8 stories, 17 tests.

### Stories vs. upstream examples

| Upstream example             | Registry story                   | Status     | Notes                                                                                                                                                         |
| ---------------------------- | -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Standard Checkbox            | Default, Playground              | ✅ covered |                                                                                                                                                               |
| Tristate Checkbox            | Tristate                         | ✅ covered | Selectable and non-selectable third state                                                                                                                     |
| Checkbox custom values       | CustomValues ("Custom values")   | ✅ covered |                                                                                                                                                               |
| Checkbox with Reactive Forms | ReactiveForms ("Reactive forms") | ✅ covered | The "Accept all" tristate (not selectable) parent driving three agreements in a form group, with value/touched/dirty/valid read-outs; plus a disabled control |
| Checkbox with custom label   | CustomLabel ("Custom label")     | ✅ covered |                                                                                                                                                               |
| Checkbox with label wrapping | LabelWrapping ("Label wrapping") | ✅ covered | Middle and top alignment                                                                                                                                      |
| Checkbox styling properties  | States                           | ✅ covered | Value states, disabled, readonly, display-only                                                                                                                |

### Tests vs. upstream specs

| Upstream behaviour                                                   | Registry test                                                                             | Status     | Notes                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------- |
| Binds the control value                                              | works with ngModel …; works with reactive forms …                                         | ✅ covered |                                                    |
| Unchecked on null / undefined                                        | without tristate, the third state value shows as unchecked                                | ✅ covered | `null` asserted; `undefined` takes the same path   |
| Checked on click, unchecked on double click                          | works with ngModel …; the label click toggles …                                           | ✅ covered |                                                    |
| State class: set, check every state, clear with null, none when null | error state sets aria-invalid; other states colour the box …                              | 🟡 partial | Every state covered; going back to no state is not |
| Displays the label                                                   | the label click toggles and the host (click) fires once                                   | ✅ covered |                                                    |
| Disabled                                                             | the disabled input stops changes; works with reactive forms, including the disabled state | ✅ covered |                                                    |
| Readonly: focusable, no toggle on click, readonly state              | readonly keeps the value, stays focusable and sets aria-readonly                          | ✅ covered |                                                    |
| Custom values                                                        | custom values map to checked, unchecked and indeterminate                                 | ✅ covered |                                                    |
| Third state on/off, custom third-state value                         | tristate cycles …; a tristate checkbox that is not selectable …; custom values …          | ✅ covered |                                                    |
| Display-only rendering ignores interaction                           | displayOnly shows the value as a glyph …                                                  | ✅ covered |                                                    |
| Host click listener receives the click and sees the new value        | the label click toggles and the host (click) fires once                                   | ✅ covered |                                                    |
| `should create`                                                      | —                                                                                         | ➖ n/a     |                                                    |

Registry-only coverage: Space toggles, `aria-required`, compact density, `wrapLabel`/`valignLabel` layout, check glyph visibility, `focusChange` output.

### Gaps to fill

- **Stories:** none.
- **Tests:** "clearing the state removes the state colour and aria-invalid".
- **Effort:** S, one story extension and one test.
