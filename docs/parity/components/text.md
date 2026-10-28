## text

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/text) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/text)
Registry: `registry/ui/text/` — 5 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                                     | Registry story | Status     | Notes                         |
| ---------------------------------------------------- | -------------- | ---------- | ----------------------------- |
| Basic Text (short, long)                             | `Basic`        | ✅ covered |                               |
| Line Clamping (none, 2, 3 lines)                     | `MaxLines`     | ✅ covered |                               |
| Expandable Text (expandable; with `[(isCollapsed)]`) | `Expandable`   | ✅ covered | Adds custom More/Less labels. |
| Whitespace Preservation                              | `Whitespaces`  | ✅ covered |                               |
| Hyphenation (none, manual, auto)                     | `Hyphenation`  | ✅ covered |                               |

### Tests vs. upstream specs

| Upstream behaviour                                                                             | Registry test                                                                              | Status     | Notes                                                             |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------- | ----------------------------------------------------------------- |
| should create                                                                                  | —                                                                                          | ➖ n/a     |                                                                   |
| Renders the text content                                                                       | maxLines clamps the text; others                                                           | ✅ covered | Implicit in every test.                                           |
| Whitespace preservation on/off                                                                 | whitespace preserve and hyphenation                                                        | ✅ covered |                                                                   |
| Hyphenation                                                                                    | whitespace preserve and hyphenation                                                        | ✅ covered |                                                                   |
| Line clamping and "has more" detection (exceeds, within, null maxLines)                        | maxLines clamps the text; shows no toggle when the text fits in maxLines                   | ✅ covered |                                                                   |
| Valid maxLines: 0, negative, null, undefined disable clamping                                  | maxLines 0 or negative does not clamp and shows no toggle; maxLines clamps the text (null) | ✅ covered | Checks the observable outcome (no clamp, no toggle).              |
| Collapsed/expandable computeds                                                                 | expandable shows More/Less…; maxLines clamps the text                                      | ✅ covered | Tested through the rendered toggle.                               |
| Expandable: More/Less labels, `isCollapsed` model, no link when not expandable or nothing more | expandable shows More/Less and toggles [(isCollapsed)]; shows no toggle when the text fits | ✅ covered | Also custom moreLabel/lessLabel, Enter/Space and `aria-expanded`. |

Registry-only coverage: keyboard toggle with focus kept, parent-driven `isCollapsed`, re-evaluating the toggle when the text changes, subline variant typography.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, two short specs.
