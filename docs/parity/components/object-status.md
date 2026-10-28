## object-status

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/object-status) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/object-status)
Registry: `registry/ui/object-status/` — 5 stories, 17 tests.

### Stories vs. upstream examples

| Upstream example           | Registry story                               | Status     | Notes                                                                             |
| -------------------------- | -------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| Object Status Examples     | Icon, text and indication colors; Playground | ✅ covered | Icon only, text only, icon+text, indication colours, clickable                    |
| Inverted Object Status     | Inverted                                     | ✅ covered | Includes numbers, generic and secondary indication colours, clickable span/anchor |
| Object Status Large Design | Large                                        | ✅ covered |                                                                                   |

### Tests vs. upstream specs

| Upstream behaviour                                                                  | Registry test                                                                              | Status     | Notes                                       |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------- |
| `Should create`                                                                     | —                                                                                          | ➖ n/a     |                                             |
| Status modifier class                                                               | status colours the text with the semantic text colour and the icon with the element colour | ✅ covered |                                             |
| Default translated sr status text; custom `statusMessage`                           | announces a status message per status, overridable with statusMessage                      | ✅ covered |                                             |
| Indication colour class and sr text                                                 | indication colours 1–10 replace the status colour and are announced                        | ✅ covered |                                             |
| Adds icon                                                                           | renders the glyph before the label…                                                        | ✅ covered |                                             |
| Inverted, large                                                                     | inverted status is a filled badge…; large uses a bigger font and icon                      | ✅ covered |                                             |
| Clickable: class, tabindex 0, role button                                           | clickable status is a focusable role button…                                               | ✅ covered |                                             |
| Default and custom `aria-roledescription` when clickable                            | clickable status is a focusable…; ariaRoleDescription overrides the role description…      | ✅ covered | Default and custom; none when not clickable |
| sr "Object Status" text when not clickable, none when clickable; custom `ariaLabel` | announces "Object Status" (or ariaLabel) when not clickable…                               | ✅ covered |                                             |
| Displays label                                                                      | renders the glyph before the label…                                                        | ✅ covered |                                             |

Registry-only coverage: Space prevented from scrolling, native `<button>` activates once, focus style, truncation, text template, secondary indication set, icon-only renders no text.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, one assertion.
