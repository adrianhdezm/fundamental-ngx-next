## input-group

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/input-group) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/input-group)
Registry: `registry/ui/input-group/` — 11 stories, 12 tests.

### Stories vs. upstream examples

| Upstream example                                           | Registry story                          | Status     | Notes                                                                                                                 |
| ---------------------------------------------------------- | --------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| Text add-on                                                | `TextAddon`                             | ✅ covered |                                                                                                                       |
| Icon add-on                                                | `IconAddon`                             | ✅ covered |                                                                                                                       |
| Button add-on                                              | `ButtonAddon`                           | ✅ covered |                                                                                                                       |
| Compact mode                                               | `Compact`                               | ✅ covered |                                                                                                                       |
| Input Group Search                                         | `Search`                                | ✅ covered | `type="search"` with search event and button.                                                                         |
| Input Group Search Component Within Angular Reactive Forms | `Forms`                                 | ✅ covered | Disabled, text and number controls, as upstream.                                                                      |
| Input Group with complex templates                         | `Complex` ("Projected parts")           | ✅ covered |                                                                                                                       |
| Input Group with States                                    | `States`, `OpenStates` ("Open: states") | ✅ covered | States with form message groups; "Open: states" focuses the error field in `play`, so axe checks its message popover. |
| Playground Area                                            | `Playground`                            | ✅ covered | `Inline` is registry-only.                                                                                            |

### Tests vs. upstream specs

| Upstream behaviour                                                                                                            | Registry test                                                                                                                                          | Status     | Notes                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Should create                                                                                                                 | —                                                                                                                                                      | ➖ n/a     |                                                                                                                                                    |
| addOnButtonClicked emitted from the button                                                                                    | emits addOnButtonClicked from the addon button                                                                                                         | ✅ covered |                                                                                                                                                    |
| Non-button icon addon: aria-label on the icon (not the span), falls back to the glyph name, no icon label for text-only addon | names the icon of a non-button addon with glyphAriaLabel …; falls back to the glyph name for the icon …; has no labelled icon in a text-only addon     | ✅ covered |                                                                                                                                                    |
| Button addon: aria-label from glyphAriaLabel, fallback to glyph name, fallback to addOnText without glyph                     | emits addOnButtonClicked from the addon button; falls back to the glyph name for a button addon …; names a button addon without glyph by its addOnText | ✅ covered | Without a glyph our button shows `addOnText` as its visible label, which names it (upstream also copies it to `aria-label`; same accessible name). |

Registry-only coverage: label/description wiring of the inner input, addon placement before/after, ControlValueAccessor (upstream's CVA describe block is empty), number values, focus kept in input with non-focusable button, projected input and addons.

### Gaps to fill

- None.
- **Effort:** done.
