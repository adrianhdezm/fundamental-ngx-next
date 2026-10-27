## icon

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/icon) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/icon)
Registry: `registry/ui/icon/` — 8 stories, 4 tests.

### Stories vs. upstream examples

| Upstream example                | Registry story       | Status     | Notes                                                                                                        |
| ------------------------------- | -------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| SAP Icons                       | `SapIcons`           | ✅ covered | Full gallery with names.                                                                                     |
| BusinessSuiteInAppSymbols Icons | `BusinessSuiteIcons` | ✅ covered |                                                                                                              |
| TNT Icons                       | `TntIcons`           | ✅ covered |                                                                                                              |
| Icon colors                     | `Colors`             | ✅ covered | Colour and background rows; upstream repeats them per font family, ours uses one SAP-icons glyph (cosmetic). |
| Icon sizes                      | `Sizes`              | ✅ covered | sm–xxl.                                                                                                      |

### Tests vs. upstream specs

| Upstream behaviour                                         | Registry test                                                                                  | Status     | Notes                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------- | ------------------------------------- |
| Should create                                              | —                                                                                              | ➖ n/a     |                                       |
| Glyph from input, TNT and BusinessSuiteInAppSymbols fonts  | resolves glyph names of SAP-icons, TNT and Business Suite fonts; unknown glyph renders nothing | ✅ covered |                                       |
| sap-icon base class                                        | —                                                                                              | ➖ n/a     | Class-only assertion.                 |
| Decorative by default: role presentation, aria-hidden true | decorative icons are aria-hidden; ariaLabel makes them role img                                | ✅ covered |                                       |
| ariaLabel gives role img and removes aria-hidden           | decorative icons are aria-hidden; ariaLabel makes them role img                                | ✅ covered | Also covers the aria-hidden override. |
| Size modifier                                              | size, color and background variants                                                            | ✅ covered |                                       |

Registry-only coverage: RTL mirroring of directional glyphs, unknown glyphs render nothing, colour/background token checks, explicit aria-hidden override.

### Gaps to fill

- **Stories:** none (optionally show colours for TNT and Business Suite glyphs as upstream does).
- **Tests:** none.
- **Effort:** S, nothing required.
