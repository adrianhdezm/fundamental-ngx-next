## action-bar

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/action-bar) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/action-bar)
Registry: `registry/ui/action-bar/` — 3 stories, 11 tests.

### Stories vs. upstream examples

| Upstream example                                            | Registry story                                 | Status     | Notes                                                                                                                                                                                          |
| ----------------------------------------------------------- | ---------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Action Bar with Back Button, Description and Action Buttons | Default ("Back button, title and description") | ✅ covered | First variant of the story                                                                                                                                                                     |
| Action Bar with Long Page Title                             | Default                                        | ✅ covered | "Long title and description are truncated" variant                                                                                                                                             |
| Action Bar with Main Actions and No Back Button             | Default                                        | ✅ covered | "Without back button" variant                                                                                                                                                                  |
| Several Main Actions in a Contextual Menu                   | —                                              | ❌ missing | Upstream: overflow button with `fdMenuTrigger` and a 5-item menu (Edit, Delete, Assign, Expire, Archive), placement bottom-end. Overlay, so also needs an "Open: …" story                      |
| Action Bar Mobile View                                      | Mobile ("Small screen")                        | 🟡 partial | Our overflow button opens nothing; upstream opens a mobile menu (`[mobile]="true"`, title "Actions", close button). `fd-action-bar-mobile` wrapper is dropped in favour of a 600px media query |

### Tests vs. upstream specs

| Upstream behaviour                                                           | Registry test                                                            | Status     | Notes                                                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| Host classes on bar, header, back, title, actions (`should assign class` x6) | —                                                                        | ➖ n/a     | Class-name only; layout outcomes are tested instead (back first, title h2, actions at end, truncation) |
| Description `withBackBtn` adds the back modifier                             | withBackBtn indents the description to the title next to the back button | ✅ covered | Checks the real 40px indent and alignment                                                              |
| `fd-action-bar-mobile` directive class                                       | hides the back button and description on small screens                   | ➖ n/a     | Directive dropped; replaced by `max-[600px]:hidden`, which our test covers                             |
| `should create` (x7)                                                         | —                                                                        | ➖ n/a     |                                                                                                        |

Registry-only coverage: back button name/click/Enter, title is an `h2`, long-title truncation without pushing actions out, actions end-aligned in LTR and RTL, `size` paddings, `hidden` actions.

### Gaps to fill

- **Stories:** "Contextual menu" — title + overflow button (`glyph="overflow"`, `ariaLabel="More"`) bound to a menu with Edit/Delete/Assign/Expire/Archive, placement bottom-end; "Open: contextual menu" — same, `play` clicks the overflow button; extend "Small screen" to wire the overflow button to a `mobile` menu titled "Actions" with a close button, plus "Open: mobile actions".
- **Tests:** none (upstream specs are class-only); optional: "overflow button in the actions opens its menu and returns focus on Escape".
- **Effort:** S, stories only, reusing the existing menu component.
