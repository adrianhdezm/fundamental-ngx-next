## info-label

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/info-label) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/info-label)
Registry: `registry/ui/info-label/` — 3 stories, 4 tests.

### Stories vs. upstream examples

| Upstream example                         | Registry story                                | Status     | Notes                                                                                                                                                                                   |
| ---------------------------------------- | --------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Info Label Examples (Text, Icon, Number) | `Colors` ("Accent colors, icons and numbers") | ✅ covered | Same three columns as upstream (text 1–10, icon + text with BusinessSuiteInAppSymbols, numeric), plus an icon-only label. `Display` and `Playground` add the display size and controls. |

### Tests vs. upstream specs

| Upstream behaviour            | Registry test                                                    | Status     | Notes                               |
| ----------------------------- | ---------------------------------------------------------------- | ---------- | ----------------------------------- |
| Should create                 | —                                                                | ➖ n/a     |                                     |
| Default look (color 7)        | colors 1–10 use the accent tokens ...                            | ✅ covered | Token colours, not classes.         |
| Numeric type                  | label with glyph, glyph only (needs ariaLabel), numeric type     | ✅ covered |                                     |
| Icon type                     | label with glyph, glyph only ..., numeric type                   | ✅ covered |                                     |
| Accent color                  | colors 1–10 use the accent tokens ...                            | ✅ covered | All ten colours plus string values. |
| Invalid color falls back to 7 | colors 1–10 use the accent tokens ...                            | ✅ covered |                                     |
| Icon rendered from glyph      | label with glyph, glyph only ...                                 | ✅ covered | Also icon position and aria-hidden. |
| Label text displayed          | label with glyph ...; ariaLabel of a text label goes to the text | ✅ covered |                                     |

Registry-only coverage: high-contrast (HCB/HCW) palettes, glyph-only label named by ariaLabel (role img), display size, srText for assistive technology.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, nothing required.
