## switch

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/switch) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/switch)
Registry: `registry/ui/switch/` — 6 stories, 14 tests.

### Stories vs. upstream examples

| Upstream example                                            | Registry story  | Status     | Notes                                          |
| ----------------------------------------------------------- | --------------- | ---------- | ---------------------------------------------- |
| Default switch with variations (cozy, compact, On/Off text) | `Sizes`         | ✅ covered | Same four switches.                            |
| Disabled State                                              | `Disabled`      | ✅ covered | Off and on.                                    |
| Two-Way Binding (`ngModel`, `[(checked)]`)                  | `Binding`       | ✅ covered |                                                |
| Semantic and Compact Mode                                   | `Semantic`      | ✅ covered |                                                |
| Switch used within Reactive Form                            | `ReactiveForms` | ✅ covered | Four controls including required and disabled. |
| Playground Area                                             | `Playground`    | ✅ covered |                                                |

### Tests vs. upstream specs

| Upstream behaviour                                           | Registry test                                                                   | Status     | Notes                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- | ---------- | -------------------------------------------------- |
| should create                                                | —                                                                               | ➖ n/a     |                                                    |
| No-animation class on init, removed while toggling           | —                                                                               | ➖ n/a     | Internal CSS class to skip the initial transition. |
| Custom id / auto-generated id                                | renders a native checkbox …; each switch gets a unique generated id             | ✅ covered |                                                    |
| Custom name                                                  | name lands on the native input                                                  | ✅ covered |                                                    |
| Switch on click emits checkedChange                          | [(checked)] two-way binds and emits checkedChange; works with ngModel…          | ✅ covered | Click and Space.                                   |
| `focus()` focuses the inner input                            | focus() focuses the native input                                                | ✅ covered |                                                    |
| Semantic                                                     | semantic shows accept/decline glyphs and announces the state                    | ✅ covered | Plus track colours.                                |
| ControlValueAccessor suite (write, change, disable, touched) | works with ngModel…; works with reactive forms, including disable() and touched | ✅ covered |                                                    |

Registry-only coverage: role switch and aria-checked, handle position and RTL mirroring, activeText/inactiveText, disabled dimming, compact track size, semantic track colours.

### Gaps to fill

- **Stories:** none.
- **Tests:** none (clicking the label toggles and focuses the input is already covered by the ngModel test).
- **Effort:** S, three or four short specs.
