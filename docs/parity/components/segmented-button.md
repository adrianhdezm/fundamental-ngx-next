## segmented-button

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/segmented-button) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/segmented-button)
Registry: `registry/ui/segmented-button/` — 5 stories, 11 tests.

### Stories vs. upstream examples

| Upstream example                  | Registry story                           | Status     | Notes                                                                                                                         |
| --------------------------------- | ---------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Default                           | `Default` ("Single selection")           | ✅ covered | Labels, icons and vertical, sharing one model.                                                                                |
| Toggle / Multi-select             | `Toggle` ("Multiple selection (toggle)") | ✅ covered | Includes the empty initial state built with `@for`.                                                                           |
| Complex                           | `Generated` ("Generated buttons")        | ✅ covered | Single-select list generated with `@for`, with separate `ngModel`/`ngModelChange`.                                            |
| Segmented Button in Reactive Form | `ReactiveForms` ("Reactive form")        | ✅ covered | Basic, disabled control, toggled and toggled + disabled groups, with value/dirty/touched read-out and enable/disable buttons. |

### Tests vs. upstream specs

| Upstream behaviour                                                | Registry test                                                     | Status     | Notes                                                                     |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| Should create                                                     | —                                                                 | ➖ n/a     |                                                                           |
| Group role, multiselectable, orientation, roledescription         | is a labelled listbox of options; vertical/horizontal orientation | ✅ covered |                                                                           |
| Button role, roledescription, posinset/setsize                    | is a labelled listbox of options                                  | ✅ covered |                                                                           |
| Single select and deselect                                        | ngModel: the selected button follows the model …                  | ✅ covered |                                                                           |
| Toggle mode multiple selection                                    | toggle mode allows several selected buttons …                     | ✅ covered |                                                                           |
| Updates from the form value                                       | ngModel …; reactive forms …                                       | ✅ covered |                                                                           |
| Detects disabled state (all buttons)                              | reactive forms: value, touched and disable()                      | ✅ covered |                                                                           |
| Click, Enter and Space select                                     | arrow keys, Home and End …; Space and Enter select                | ✅ covered |                                                                           |
| Individual `[disabled]` preserved after view init                 | arrow keys skip disabled buttons, which cannot be selected        | ✅ covered |                                                                           |
| Individually disabled button stays disabled after group re-enable | —                                                                 | ❌ missing | Reactive test re-enables a group without an individually disabled button. |
| Clicking an individually disabled button does not select          | arrow keys skip disabled buttons, which cannot be selected        | ✅ covered |                                                                           |
| CVA suite (runValueAccessorTests)                                 | ngModel …; reactive forms …                                       | ✅ covered |                                                                           |
| No duplicate `_listenToButtonChanges` work                        | —                                                                 | ➖ n/a     | Internal implementation detail.                                           |
| A button added after view init gets role/posinset/setsize         | —                                                                 | ❌ missing | Dynamic `@if`/`@for` button lists untested.                               |

Registry-only coverage: roving tabindex (selected or first is the tab stop), Home/End, RTL-mirrored arrows, vertical ArrowUp/ArrowDown, layout checks, `aria-labelledby` naming.

### Gaps to fill

- **Stories:** none.
- **Tests:** "an individually disabled button stays disabled after the group is re-enabled"; "a button added after render gets option role, posinset and setsize, and setsize updates on the others".
- **Effort:** S — two tests on the existing hosts and one forms story.
