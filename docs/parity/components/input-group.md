## input-group

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/input-group) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/input-group)
Registry: `registry/ui/input-group/` — 10 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                                           | Registry story                | Status     | Notes                                                                                                                              |
| ---------------------------------------------------------- | ----------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Text add-on                                                | `TextAddon`                   | ✅ covered |                                                                                                                                    |
| Icon add-on                                                | `IconAddon`                   | ✅ covered |                                                                                                                                    |
| Button add-on                                              | `ButtonAddon`                 | ✅ covered |                                                                                                                                    |
| Compact mode                                               | `Compact`                     | ✅ covered |                                                                                                                                    |
| Input Group Search                                         | `Search`                      | ✅ covered | `type="search"` with search event and button.                                                                                      |
| Input Group Search Component Within Angular Reactive Forms | `Forms`                       | ✅ covered | Disabled, text and number controls, as upstream.                                                                                   |
| Input Group with complex templates                         | `Complex` ("Projected parts") | ✅ covered |                                                                                                                                    |
| Input Group with States                                    | `States`                      | 🟡 partial | States with form message groups are shown, but there is no "Open: …" story whose `play()` opens a message, so axe never checks it. |
| Playground Area                                            | `Playground`                  | ✅ covered | `Inline` is registry-only.                                                                                                         |

### Tests vs. upstream specs

| Upstream behaviour                                                                                                            | Registry test                                  | Status     | Notes                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| Should create                                                                                                                 | —                                              | ➖ n/a     |                                                                                    |
| addOnButtonClicked emitted from the button                                                                                    | emits addOnButtonClicked from the addon button | ✅ covered |                                                                                    |
| Non-button icon addon: aria-label on the icon (not the span), falls back to the glyph name, no icon label for text-only addon | —                                              | ❌ missing | Our template sets `ariaLabel` on the icon (glyphAriaLabel or glyph); not asserted. |
| Button addon: aria-label from glyphAriaLabel, fallback to glyph name, fallback to addOnText without glyph                     | emits addOnButtonClicked from the addon button | 🟡 partial | Only the `glyphAriaLabel` case is asserted ("Clear"); both fallbacks untested.     |

Registry-only coverage: label/description wiring of the inner input, addon placement before/after, ControlValueAccessor (upstream's CVA describe block is empty), number values, focus kept in input with non-focusable button, projected input and addons.

### Gaps to fill

- **Stories:** `Open: States` — `play()` focuses a stateful input group so the message popover is checked by axe.
- **Tests:** "a non-button icon addon names the icon via glyphAriaLabel, not the addon span"; "a non-button icon addon falls back to the glyph name"; "a text-only addon has no labelled icon"; "a button addon falls back to the glyph name without glyphAriaLabel"; "a button addon without glyph is named by addOnText".
- **Effort:** S, five short ARIA assertions and one play story.
