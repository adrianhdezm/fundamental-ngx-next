## action-bar

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/action-bar) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/action-bar)
Registry: `registry/ui/action-bar/` — 6 stories, 12 tests.

### Stories vs. upstream examples

| Upstream example                                            | Registry story                                 | Status     | Notes                                                                                                                                                      |
| ----------------------------------------------------------- | ---------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Action Bar with Back Button, Description and Action Buttons | Default ("Back button, title and description") | ✅ covered | First variant of the story                                                                                                                                 |
| Action Bar with Long Page Title                             | Default                                        | ✅ covered | "Long title and description are truncated" variant                                                                                                         |
| Action Bar with Main Actions and No Back Button             | Default                                        | ✅ covered | "Without back button" variant                                                                                                                              |
| Several Main Actions in a Contextual Menu                   | ContextualMenu, OpenContextualMenu             | ✅ covered | Overflow button (`ariaLabel="More"`) with `[fdMenuTrigger]` and the 5-item menu, placement bottom-end                                                      |
| Action Bar Mobile View                                      | Mobile ("Small screen"), OpenMobile            | ✅ covered | The overflow button opens a `mobile` menu titled "Actions" with a close button. `fd-action-bar-mobile` wrapper is dropped in favour of a 600px media query |

### Tests vs. upstream specs

| Upstream behaviour                                                           | Registry test                                                            | Status     | Notes                                                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| Host classes on bar, header, back, title, actions (`should assign class` x6) | —                                                                        | ➖ n/a     | Class-name only; layout outcomes are tested instead (back first, title h2, actions at end, truncation) |
| Description `withBackBtn` adds the back modifier                             | withBackBtn indents the description to the title next to the back button | ✅ covered | Checks the real 40px indent and alignment                                                              |
| `fd-action-bar-mobile` directive class                                       | hides the back button and description on small screens                   | ➖ n/a     | Directive dropped; replaced by `max-[600px]:hidden`, which our test covers                             |
| `should create` (x7)                                                         | —                                                                        | ➖ n/a     |                                                                                                        |

Registry-only coverage: overflow button opens its bottom-end menu and gets the focus back on Escape, back button name/click/Enter, title is an `h2`, long-title truncation without pushing actions out, actions end-aligned in LTR and RTL, `size` paddings, `hidden` actions.

### Gaps to fill

- **Stories:** none.
- **Tests:** none (upstream specs are class-only); the optional overflow-menu test is done.
- **Effort:** done.
